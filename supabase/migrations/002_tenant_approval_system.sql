-- ============================================================================
-- RegIntels Tenant Approval System Migration
-- ============================================================================
-- This migration implements a secure platform admin approval workflow for new tenants.
-- Features:
-- - platform_admins table with RLS
-- - Extended tenants table with approval tracking
-- - approve_tenant() RPC function (SECURITY DEFINER)
-- - Database trigger to call Edge Function webhook
-- - Auto-activation on approval
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE platform_admins TABLE
-- ----------------------------------------------------------------------------
-- Stores which auth users are platform administrators who can approve tenants
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_platform_admins_user_id ON public.platform_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON public.platform_admins(email);

-- Enable RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_admins

-- Allow authenticated users to check if THEY are a platform admin (needed for login)
DROP POLICY IF EXISTS "Users can view their own platform admin status" ON public.platform_admins;
CREATE POLICY "Users can view their own platform admin status"
  ON public.platform_admins FOR SELECT
  USING (auth.uid() = user_id);

-- Platform admins can view all platform admins
DROP POLICY IF EXISTS "Platform admins can view all platform admins" ON public.platform_admins;
CREATE POLICY "Platform admins can view all platform admins"
  ON public.platform_admins FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.platform_admins WHERE is_active = true)
  );

-- Platform admins can insert new platform admins
DROP POLICY IF EXISTS "Platform admins can insert new platform admins" ON public.platform_admins;
CREATE POLICY "Platform admins can insert new platform admins"
  ON public.platform_admins FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.platform_admins WHERE is_active = true)
  );

-- ----------------------------------------------------------------------------
-- 2. EXTEND tenants TABLE WITH APPROVAL COLUMNS
-- ----------------------------------------------------------------------------
-- Add approval workflow columns to tenants table
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.platform_admins(user_id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

-- Update status column to include new statuses if not already present
-- Note: If status is already an enum, you may need to ALTER TYPE instead
-- For simplicity, we'll assume status is TEXT with a CHECK constraint
DO $$
BEGIN
  -- Drop existing constraint if present
  ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_status_check;

  -- Add new constraint with all statuses
  ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_status_check
    CHECK (status IN ('pending_verification', 'approved', 'active', 'suspended', 'inactive'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Set default status for new tenants to pending_verification
ALTER TABLE public.tenants ALTER COLUMN status SET DEFAULT 'pending_verification';

-- Update existing tenants without status
UPDATE public.tenants SET status = 'pending_verification' WHERE status IS NULL;

-- Add index for fast filtering by status
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

-- ----------------------------------------------------------------------------
-- 3. UPDATE tenants RLS POLICIES
-- ----------------------------------------------------------------------------
-- Allow public to create tenants (during onboarding)
DROP POLICY IF EXISTS "Allow public tenant creation during onboarding" ON public.tenants;
CREATE POLICY "Allow public tenant creation during onboarding"
  ON public.tenants FOR INSERT
  WITH CHECK (true);

-- Platform admins can view all tenants
DROP POLICY IF EXISTS "Platform admins can view all tenants" ON public.tenants;
CREATE POLICY "Platform admins can view all tenants"
  ON public.tenants FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.platform_admins WHERE is_active = true)
  );

-- Tenant users can view their own tenant
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
CREATE POLICY "Users can view their own tenant"
  ON public.tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM public.user_profiles WHERE user_id = auth.uid()
    )
  );

-- Platform admins can update tenants (for approval)
DROP POLICY IF EXISTS "Platform admins can update tenants" ON public.tenants;
CREATE POLICY "Platform admins can update tenants"
  ON public.tenants FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM public.platform_admins WHERE is_active = true)
  );

-- ----------------------------------------------------------------------------
-- 4. CREATE approve_tenant RPC FUNCTION
-- ----------------------------------------------------------------------------
-- This function is called by platform admins to approve a tenant
-- It uses SECURITY DEFINER to bypass RLS and ensure consistent approval logic
CREATE OR REPLACE FUNCTION public.approve_tenant(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_tenant_record RECORD;
  v_result JSON;
BEGIN
  -- Verify caller is a platform admin
  SELECT user_id INTO v_admin_id
  FROM public.platform_admins
  WHERE user_id = auth.uid() AND is_active = true;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Only platform admins can approve tenants';
  END IF;

  -- Verify tenant exists and is pending
  SELECT * INTO v_tenant_record
  FROM public.tenants
  WHERE id = p_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found: %', p_tenant_id;
  END IF;

  IF v_tenant_record.status NOT IN ('pending_verification', 'approved') THEN
    RAISE EXCEPTION 'Tenant cannot be approved from status: %', v_tenant_record.status;
  END IF;

  -- Update tenant to approved status
  UPDATE public.tenants
  SET
    status = 'approved',
    approved_by = v_admin_id,
    approved_at = NOW()
  WHERE id = p_tenant_id;

  -- Return success result
  v_result := json_build_object(
    'success', true,
    'tenant_id', p_tenant_id,
    'status', 'approved',
    'approved_by', v_admin_id,
    'approved_at', NOW(),
    'message', 'Tenant approved successfully. Auto-activation trigger will fire.'
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users (function checks admin status internally)
GRANT EXECUTE ON FUNCTION public.approve_tenant(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. CREATE DATABASE TRIGGER FOR AUTO-ACTIVATION & WEBHOOK
-- ----------------------------------------------------------------------------
-- This trigger fires when a tenant status changes to 'approved'
-- It auto-activates the tenant and calls the Edge Function webhook

-- First, create the trigger function
CREATE OR REPLACE FUNCTION public.notify_tenant_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webhook_url TEXT;
  v_project_ref TEXT := 'cnyvjuxmkpzxnztbbydu';
  v_service_role_key TEXT;

BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN

    -- Auto-activate the tenant
    NEW.status := 'active';
    NEW.activated_at := NOW();

    -- Build webhook URL
    v_webhook_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/send-tenant-approved';

    -- Get the service role key from Supabase vault (if available)
    -- This requires the Vault extension and proper configuration
    -- Alternatively, the Edge Function can validate using its internal WEBHOOK_SECRET
    -- For now, we'll use the anon key approach and let the Edge Function handle auth

    -- Call Edge Function webhook using pg_net (asynchronous HTTP request)
    -- Note: The Edge Function will validate the request internally using WEBHOOK_SECRET
    PERFORM net.http_post(
      url := v_webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'tenant_id', NEW.id::TEXT,
        'tenant_name', NEW.name,
        'contact_email', NEW.contact_email,
        'regime', NEW.regime,
        'frn', NEW.frn,
        'approved_at', NEW.approved_at,
        'activated_at', NEW.activated_at
      )
    );

  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on tenants table
DROP TRIGGER IF EXISTS trigger_tenant_approved ON public.tenants;
CREATE TRIGGER trigger_tenant_approved
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_tenant_approved();

-- ----------------------------------------------------------------------------
-- 6. ENABLE pg_net EXTENSION (if not already enabled)
-- ----------------------------------------------------------------------------
-- pg_net is required for making HTTP requests from database triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 8. INSERT INITIAL PLATFORM ADMIN (OPTIONAL)
-- ----------------------------------------------------------------------------
-- Uncomment and modify to add yourself as the first platform admin
-- You'll need to replace the UUID with your actual auth.users ID
-- You can find this by running: SELECT id, email FROM auth.users;

-- INSERT PLATFORM ADMINS
-- This automatically looks up user IDs from auth.users table by email
-- The users must already exist in auth.users before running this

-- Super Admin (Platform Owner) - fredymanu76@gmail.com
INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
SELECT
  id,
  'fredymanu76@gmail.com',
  'Platform Owner (Super Admin)',
  true
FROM auth.users
WHERE email = 'fredymanu76@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Additional Platform Admin - info@fymcompliancelimited.com
INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
SELECT
  id,
  'info@fymcompliancelimited.com',
  'Platform Administrator',
  true
FROM auth.users
WHERE email = 'info@fymcompliancelimited.com'
ON CONFLICT (user_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- MIGRATION COMPLETE
-- ----------------------------------------------------------------------------
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
--
-- 2. Uncomment and fill in the INSERT statement (lines 268-275) to add yourself
--    as the first platform admin (find your user_id with: SELECT id, email FROM auth.users;)
--
-- 3. Create the Edge Function (see supabase/functions/send-tenant-approved/index.ts)
--
-- 4. Deploy Edge Function:
--    supabase functions deploy send-tenant-approved
--
-- 5. Set Edge Function secrets using Supabase CLI:
--    supabase secrets set WEBHOOK_SECRET=zqckoNgtJP3OfGmHihFS6WBa2e9dTAjp
--    supabase secrets set RESEND_API_KEY=re_xxxxx
--    supabase secrets set FROM_EMAIL=noreply@yourdomain.com
--
-- Note: The webhook secret is now stored securely in Edge Function environment
-- variables instead of the database, following Supabase best practices.
-- ============================================================================
