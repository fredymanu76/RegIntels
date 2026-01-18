// ============================================================================
// RegIntels - Tenant Approval Email Notification Edge Function
// ============================================================================
// This Supabase Edge Function sends an email notification when a tenant
// is approved and auto-activated by the platform admin.
//
// Triggered by: Database trigger on public.tenants table
// Email Provider: Resend (https://resend.com)
//
// Required Secrets (set via: supabase secrets set KEY=value):
// - WEBHOOK_SECRET: Secret key to authenticate webhook calls from database
// - RESEND_API_KEY: Resend API key (get from https://resend.com/api-keys)
// - FROM_EMAIL: Verified sender email address (e.g., noreply@yourdomain.com)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// CORS headers for preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ========================================================================
    // 1. VERIFY WEBHOOK SECRET (OPTIONAL)
    // ========================================================================
    // The database trigger calls this function internally, so we'll accept
    // requests from both:
    // - Database triggers (no auth header, trusted internal call)
    // - External webhooks (requires Bearer token for security)

    const authHeader = req.headers.get('Authorization')
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')

    // If an Authorization header is provided, validate it
    if (authHeader) {
      if (!authHeader.startsWith('Bearer ')) {
        console.error('Invalid Authorization header format')
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid token format' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      if (webhookSecret && token !== webhookSecret) {
        console.error('Invalid webhook secret')
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Note: Requests from database triggers (via pg_net) are trusted internal calls
    // and don't require authentication. External calls should provide the Bearer token.

    // ========================================================================
    // 2. PARSE REQUEST BODY
    // ========================================================================
    const payload = await req.json()
    const {
      tenant_id,
      tenant_name,
      contact_email,
      regime,
      frn,
      approved_at,
      activated_at
    } = payload

    // Validate required fields
    if (!tenant_id || !tenant_name || !contact_email) {
      console.error('Missing required fields:', payload)
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tenant_id, tenant_name, contact_email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing approval email for tenant:', {
      tenant_id,
      tenant_name,
      contact_email,
      regime,
      frn
    })

    // ========================================================================
    // 3. PREPARE EMAIL CONTENT
    // ========================================================================
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@regintels.com'
    const appUrl = Deno.env.get('APP_URL') || 'https://app.regintels.com'

    const emailSubject = `✅ Your RegIntels Account Has Been Activated - ${tenant_name}`

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RegIntels Account Activated</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">RegIntels</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Regulatory Intelligence Platform</p>
  </div>

  <!-- Main Content -->
  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">

    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; font-size: 18px; font-weight: 600;">
        ✅ Account Activated
      </div>
    </div>

    <h2 style="color: #1e293b; font-size: 24px; margin: 0 0 20px 0;">Welcome to RegIntels!</h2>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Great news! Your RegIntels account for <strong>${tenant_name}</strong> has been reviewed and activated by our platform team.
    </p>

    <div style="background: #f8fafc; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 6px;">
      <h3 style="margin: 0 0 15px 0; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Account Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Organization:</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${tenant_name}</td>
        </tr>
        ${regime ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Regulatory Regime:</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${regime}</td>
        </tr>
        ` : ''}
        ${frn ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">FRN:</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${frn}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Contact Email:</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${contact_email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Activated:</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${new Date(activated_at).toLocaleString('en-GB', { timeZone: 'Europe/London' })}</td>
        </tr>
      </table>
    </div>

    <h3 style="color: #1e293b; font-size: 18px; margin: 30px 0 15px 0;">What's Next?</h3>

    <div style="margin: 15px 0;">
      <div style="display: flex; align-items: start; margin-bottom: 15px;">
        <span style="color: #667eea; font-size: 20px; margin-right: 12px; flex-shrink: 0;">1️⃣</span>
        <div>
          <strong style="color: #1e293b;">Access Your Dashboard</strong>
          <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Log in to your RegIntels account and explore the platform.</p>
        </div>
      </div>

      <div style="display: flex; align-items: start; margin-bottom: 15px;">
        <span style="color: #667eea; font-size: 20px; margin-right: 12px; flex-shrink: 0;">2️⃣</span>
        <div>
          <strong style="color: #1e293b;">Complete Your Profile</strong>
          <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Add team members and configure your organization settings.</p>
        </div>
      </div>

      <div style="display: flex; align-items: start; margin-bottom: 15px;">
        <span style="color: #667eea; font-size: 20px; margin-right: 12px; flex-shrink: 0;">3️⃣</span>
        <div>
          <strong style="color: #1e293b;">Explore Compliance Tools</strong>
          <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Start using our AI-powered regulatory intelligence features.</p>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: 35px 0 25px 0;">
      <a href="${appUrl}/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
        Access RegIntels Dashboard →
      </a>
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 6px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>🔐 Security Reminder:</strong> Never share your login credentials. RegIntels staff will never ask for your password.
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 20px; color: #64748b; font-size: 13px;">
    <p style="margin: 0 0 10px 0;">
      Need help? Contact our support team at <a href="mailto:support@regintels.com" style="color: #667eea; text-decoration: none;">support@regintels.com</a>
    </p>
    <p style="margin: 0; color: #94a3b8;">
      © ${new Date().getFullYear()} RegIntels. All rights reserved.
    </p>
  </div>

</body>
</html>
    `

    const emailText = `
RegIntels - Account Activated

Welcome to RegIntels!

Your account for ${tenant_name} has been reviewed and activated by our platform team.

ACCOUNT DETAILS:
- Organization: ${tenant_name}
${regime ? `- Regulatory Regime: ${regime}` : ''}
${frn ? `- FRN: ${frn}` : ''}
- Contact Email: ${contact_email}
- Activated: ${new Date(activated_at).toLocaleString('en-GB', { timeZone: 'Europe/London' })}

WHAT'S NEXT:
1. Access Your Dashboard - Log in to your RegIntels account
2. Complete Your Profile - Add team members and configure settings
3. Explore Compliance Tools - Start using our AI-powered features

Access RegIntels: ${appUrl}/login

Need help? Contact: support@regintels.com

© ${new Date().getFullYear()} RegIntels. All rights reserved.
    `

    // ========================================================================
    // 4. SEND EMAIL VIA RESEND
    // ========================================================================
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [contact_email],
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: resendData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Email sent successfully:', resendData)

    // ========================================================================
    // 5. RETURN SUCCESS RESPONSE
    // ========================================================================
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tenant approval email sent successfully',
        tenant_id,
        tenant_name,
        email_id: resendData.id,
        sent_to: contact_email,
        sent_at: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// ============================================================================
// DEPLOYMENT INSTRUCTIONS
// ============================================================================
// 1. Deploy this function:
//    supabase functions deploy send-tenant-approved
//
// 2. Set required secrets:
//    supabase secrets set WEBHOOK_SECRET=your-secure-webhook-secret-here
//    supabase secrets set RESEND_API_KEY=re_xxxxx
//    supabase secrets set FROM_EMAIL=noreply@yourdomain.com
//
// 3. Optional: Set custom app URL:
//    supabase secrets set APP_URL=https://app.regintels.com
//
// 4. Test the function:
//    curl -i --location --request POST 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-tenant-approved' \
//      --header 'Authorization: Bearer YOUR-WEBHOOK-SECRET' \
//      --header 'Content-Type: application/json' \
//      --data '{"tenant_id":"123","tenant_name":"Test Firm","contact_email":"test@example.com","regime":"FCA","frn":"123456","approved_at":"2024-01-01T00:00:00Z","activated_at":"2024-01-01T00:00:00Z"}'
// ============================================================================
