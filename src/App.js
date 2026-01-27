import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText, Shield, Users, BarChart3, AlertTriangle, FileCheck, Settings, Menu, X, Bell, Database, Loader, Plus, Download, Upload, UserPlus, Building, Grid, CreditCard, Calendar, Mail, Send, MessageSquare } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// Strategic Upgrade Components
import ImpactScoreCard from './components/ImpactScoreCard';
import ControlDriftBadge from './components/ControlDriftBadge';
import AttestationConfidenceWidget from './components/AttestationConfidenceWidget';
import ControlDriftHeatmap from './components/ControlDriftHeatmap';
import StrategicDashboard from './components/StrategicDashboard';
import PlatformFeatureControl from './components/PlatformFeatureControl';
import ExceptionIntelligenceDashboard from './components/ExceptionIntelligenceDashboard';
import Solution4Dashboard from './components/Solution4Dashboard';
import ExceptionsOverviewBoard from './components/ExceptionsOverviewBoard';
import RegulatoryReadinessBoard from './components/RegulatoryReadinessBoard';
import AttestationsBoard from './components/AttestationsBoard';
import AuditTrailBoard from './components/AuditTrailBoard';
import DecisionRegisterBoard from './components/DecisionRegisterBoard';
import ApprovalsBoard from './components/ApprovalsBoard';

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================
let SUPABASE_CONFIG = { url: '', anonKey: '' };

// Priority order:
// 1. Environment variables (highest priority - permanent)
// 2. localStorage (user configured via UI)
// 3. window object (legacy)
if (typeof window !== 'undefined') {
  // First, check environment variables
  if (process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY) {
    SUPABASE_CONFIG = {
      url: process.env.REACT_APP_SUPABASE_URL,
      anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY
    };
    console.log('✅ Supabase loaded from environment variables');
  }
  // Fallback to localStorage
  else {
    const stored = localStorage.getItem('supabaseConfig');
    if (stored) {
      SUPABASE_CONFIG = JSON.parse(stored);
      console.log('✅ Supabase loaded from localStorage');
    } else if (window.supabaseConfig) {
      SUPABASE_CONFIG = window.supabaseConfig;
      console.log('✅ Supabase loaded from window object');
    }
  }
}

class SupabaseClient {
  constructor() {
    this.config = SUPABASE_CONFIG;
    this.isConfigured = this.config.url && this.config.anonKey;
    this.useMockData = !this.isConfigured;

    // Initialize Supabase client with Auth support
    if (this.isConfigured) {
      this.client = createClient(this.config.url, this.config.anonKey);
    }
  }

  updateConfig(url, anonKey) {
    this.config = { url, anonKey };
    this.isConfigured = true;
    this.useMockData = false;
    SUPABASE_CONFIG = this.config;

    // Initialize Supabase client
    this.client = createClient(url, anonKey);

    if (typeof window !== 'undefined') {
      window.supabaseConfig = this.config;
      // Store in localStorage so it persists across refreshes
      localStorage.setItem('supabaseConfig', JSON.stringify(this.config));
    }
  }

  // Auth methods
  async signUp(email, password, metadata = {}) {
    if (this.useMockData) {
      console.log('Mock signUp:', email, metadata);
      return {
        data: {
          user: { id: 'mock-user-' + Date.now(), email },
          session: null
        },
        error: null
      };
    }

    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    return { data, error };
  }

  async signIn(email, password) {
    if (this.useMockData) {
      console.log('Mock signIn:', email);
      return {
        data: {
          user: { id: 'mock-user-1', email },
          session: { access_token: 'mock-token' }
        },
        error: null
      };
    }

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    return { data, error };
  }

  async signOut() {
    if (this.useMockData) {
      console.log('Mock signOut');
      return { error: null };
    }

    const { error } = await this.client.auth.signOut();
    return { error };
  }

  async getSession() {
    if (this.useMockData) {
      return { data: { session: null }, error: null };
    }

    const { data, error } = await this.client.auth.getSession();
    return { data, error };
  }

  async getUser() {
    if (this.useMockData) {
      return { data: { user: null }, error: null };
    }

    const { data, error } = await this.client.auth.getUser();
    return { data, error };
  }

  onAuthStateChange(callback) {
    if (this.useMockData) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return this.client.auth.onAuthStateChange(callback);
  }

  async query(table, options = {}, signal = null) {
    if (this.useMockData) {
      return this.getMockData(table, options);
    }

    try {
      const { tenantId, filters, select, single, userToken } = options;
      let url = `${this.config.url}/rest/v1/${table}?select=${select || '*'}`;

      if (tenantId) {
        url += `&tenant_id=eq.${tenantId}`;
      }

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          url += `&${key}=eq.${value}`;
        });
      }

      // Use provided user token if available, otherwise use anon key
      const authToken = userToken || this.config.anonKey;

      console.log('[QUERY]', table, 'with filters:', filters, 'using token:', authToken === this.config.anonKey ? 'anon' : 'user session');

      const fetchOptions = {
        headers: {
          'apikey': this.config.anonKey,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      };

      // Add signal if provided
      if (signal) {
        fetchOptions.signal = signal;
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[QUERY] Failed:', response.status, response.statusText, errorText);
        throw new Error(`Query failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[QUERY] Success:', table, 'returned', Array.isArray(data) ? data.length : 1, 'rows');
      return single ? data[0] : data;
    } catch (error) {
      // Don't log or throw abort errors - they're expected when component unmounts
      if (error.name === 'AbortError') {
        console.log('[QUERY] Aborted:', table);
        return options.single ? null : [];
      }

      console.error('[QUERY ERROR]', table, error);
      // For platform_admins queries during login, return null instead of throwing
      if (table === 'platform_admins') {
        console.error('[QUERY] Platform admin query failed - returning null');
        return options.single ? null : [];
      }
      // For other critical queries, throw the error
      throw error;
    }
  }

  async insert(table, data, tenantId) {
    if (this.useMockData) {
      console.log('Mock insert:', table, data);
      return { ...data, id: Date.now(), tenant_id: tenantId, created_at: new Date().toISOString() };
    }

    try {
      // Add tenant_id to the data (except for the tenants table itself)
      const shouldAddTenantId = table !== 'tenants' && tenantId != null;
      const dataWithTenant = shouldAddTenantId ? { ...data, tenant_id: tenantId } : data;
      const payload = Array.isArray(data)
        ? data.map(d => shouldAddTenantId ? { ...d, tenant_id: tenantId } : d)
        : dataWithTenant;
      
      console.log('Inserting to Supabase:', table, payload); // Debug log
      
      const response = await fetch(`${this.config.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': this.config.anonKey,
          'Authorization': `Bearer ${this.config.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(Array.isArray(payload) ? payload : [payload])
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase insert error:', errorText);
        throw new Error(`Insert failed: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Insert successful:', result); // Debug log
      return Array.isArray(data) ? result : result[0];
    } catch (error) {
      console.error('Supabase insert error:', error);
      alert('Failed to save: ' + error.message); // Show error to user
      throw error;
    }
  }



  async update(table, id, data, tenantId) {
    if (this.useMockData) {
      console.log('Mock update:', table, id, data);
      return { ...data, id, tenant_id: tenantId, updated_at: new Date().toISOString() };
    }

    try {
      const response = await fetch(`${this.config.url}/rest/v1/${table}?id=eq.${id}&tenant_id=eq.${tenantId}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.config.anonKey,
          'Authorization': `Bearer ${this.config.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error(`Update failed: ${response.statusText}`);
      
      const result = await response.json();
      return result[0];
    } catch (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
  }

  getMockData(table, options = {}) {
    const { tenantId } = options;
    let data = mockDatabase[table] || [];
    
    if (tenantId) {
      data = data.filter(item => item.tenant_id === tenantId);
    }
    
    return options.single ? data[0] : data;
  }
}

const supabase = new SupabaseClient();

// ============================================================================
// MOCK DATABASE
// ============================================================================
const mockDatabase = {
  tenants: [
    { id: '5925873a-2119-444c-93b5-e0cd6ed1bdad', name: 'Fintech Solutions Ltd', regime: 'API', frn: 'FRN123456', status: 'active', created_at: '2024-01-01' }
  ],
  user_profiles: [
    { id: 1, user_id: 'user1', tenant_id: 1, email: 'admin@fintech.com', display_name: 'Sarah Johnson', role: 'Admin', department: 'Compliance', smf_designation: 'SMF16' },
    { id: 2, user_id: 'user2', tenant_id: 1, email: 'compliance@fintech.com', display_name: 'Mike Chen', role: 'Compliance', department: 'Compliance', smf_designation: null },
    { id: 3, user_id: 'user3', tenant_id: 1, email: 'board@fintech.com', display_name: 'Emma Williams', role: 'Board', department: 'Board', smf_designation: 'SMF1' }
  ],
  policies: [
    { id: 1, tenant_id: 1, title: 'Anti-Money Laundering Policy', version: '2.1', status: 'active', owner_user_id: 1, regulator_regime: 'API', created_at: '2024-01-15' },
    { id: 2, tenant_id: 1, title: 'Conflicts of Interest Policy', version: '1.5', status: 'active', owner_user_id: 2, regulator_regime: 'API', created_at: '2024-02-01' },
    { id: 3, tenant_id: 1, title: 'Data Protection & Privacy Policy', version: '3.0', status: 'active', owner_user_id: 1, regulator_regime: 'API', created_at: '2024-03-10' }
  ],
  reg_changes: [
    { id: 1, tenant_id: 1, source: 'FCA', title: 'Consumer Duty - Outcomes Testing', summary: 'New requirements for evidencing consumer outcomes', published_at: '2025-01-10', status: 'in_review', impact_rating: 'high' },
    { id: 2, tenant_id: 1, source: 'FCA', title: 'PS24/3 - Operational Resilience', summary: 'Updated operational resilience requirements', published_at: '2025-01-08', status: 'actioned', impact_rating: 'medium' }
  ],
  controls: [
    { id: 1, tenant_id: 1, control_code: 'AML-001', title: 'Customer Due Diligence Review', description: 'Monthly review of CDD completeness', owner_user_id: 2, frequency: 'Monthly', status: 'active', test_method: 'Sample testing', evidence_required: 'CDD completion report' },
    { id: 2, tenant_id: 1, control_code: 'COI-001', title: 'Conflicts Register Review', description: 'Quarterly review of conflicts register', owner_user_id: 1, frequency: 'Quarterly', status: 'active', test_method: 'Full review', evidence_required: 'Conflicts register' },
    { id: 3, tenant_id: 1, control_code: 'DATA-001', title: 'DSAR Response Time', description: 'Monitor DSAR response within 30 days', owner_user_id: 2, frequency: 'Monthly', status: 'active', test_method: 'Report review', evidence_required: 'DSAR log' }
  ],
  exceptions: [
    { id: 1, tenant_id: 1, source_type: 'control', source_id: 1, title: 'Late CDD completion for 3 customers', description: 'CDD not completed within required timeframe', severity: 'medium', status: 'open', opened_at: '2025-01-12' },
    { id: 2, tenant_id: 1, source_type: 'incident', source_id: null, title: 'DSAR breach - 35 day response', description: 'DSAR responded to in 35 days instead of 30', severity: 'high', status: 'remediation', opened_at: '2025-01-09' }
  ],
  risks: [
    { id: 1, tenant_id: 1, name: 'AML/CTF Risk', category: 'Financial Crime', inherent_score: 9, residual_score: 4, owner_user_id: 1, status: 'active' },
    { id: 2, tenant_id: 1, name: 'Data Protection Risk', category: 'Information Security', inherent_score: 6, residual_score: 3, owner_user_id: 2, status: 'active' }
  ]
};

// ============================================================================
// DATA HOOKS
// ============================================================================
function useSupabaseQuery(table, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      const result = await supabase.query(table, options, signal);
      if (!signal?.aborted) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (!signal?.aborted && err.name !== 'AbortError') {
        setError(err);
        console.error(`Error fetching ${table}:`, err);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);

    return () => {
      controller.abort('Component unmounted');
    };
  }, [table, JSON.stringify(options)]);

  return { data, loading, error, refetch: () => fetchData() };
}

function usePolicies(tenantId) {
  return useSupabaseQuery('policies', { tenantId });
}

function useControls(tenantId) {
  return useSupabaseQuery('controls', { tenantId });
}

function useRegChanges(tenantId) {
  return useSupabaseQuery('reg_changes', { tenantId });
}

function useExceptions(tenantId) {
  return useSupabaseQuery('exceptions', { tenantId });
}

function useRisks(tenantId) {
  return useSupabaseQuery('risks', { tenantId });
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================
async function createPolicy(tenantId, policyData) {
  return await supabase.insert('policies', {
    title: policyData.title,
    version: policyData.version || '1.0',
    status: policyData.status || 'draft',
    // owner_user_id: null, // Remove for now - will add when user management is ready
    regulator_regime: policyData.regulator_regime,
    created_at: new Date().toISOString()
  }, tenantId);
}

async function createControl(tenantId, controlData) {
  return await supabase.insert('controls', {
    control_code: controlData.control_code,
    title: controlData.title,
    description: controlData.description,
    // owner_user_id: null, // Remove for now
    frequency: controlData.frequency,
    test_method: controlData.test_method,
    evidence_required: controlData.evidence_required,
    status: controlData.status || 'active',
    created_at: new Date().toISOString()
  }, tenantId);
}

async function createException(tenantId, exceptionData) {
  return await supabase.insert('exceptions', {
    source_type: exceptionData.source_type,
    source_id: exceptionData.source_id,
    title: exceptionData.title,
    description: exceptionData.description,
    severity: exceptionData.severity,
    status: 'open',
    opened_at: new Date().toISOString()
  }, tenantId);
}

async function closeException(tenantId, exceptionId) {
  return await supabase.update('exceptions', exceptionId, {
    status: 'closed',
    closed_at: new Date().toISOString()
  }, tenantId);
}

// ============================================================================
// LOGIN COMPONENT
// ============================================================================
function LoginPage({ onLoginSuccess, onStartOnboarding }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.signIn(email, password);

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error('Login failed. Please check your credentials.');
      }

      // Check if user is a platform admin first
      let isPlatformAdmin = false;
      const userToken = data.session?.access_token;
      console.log('[LOGIN] Checking if user is platform admin:', data.user.id, 'with token:', userToken ? 'yes' : 'no');
      try {
        const platformAdmin = await supabase.query('platform_admins', {
          filters: { user_id: data.user.id, is_active: true },
          single: true,
          userToken: userToken
        });
        console.log('[LOGIN] Platform admin query result:', platformAdmin);
        isPlatformAdmin = !!platformAdmin;
        if (isPlatformAdmin) {
          console.log('[LOGIN] ✅ User IS a platform admin, deferring to auth state listener');
        }
      } catch (err) {
        console.error('[LOGIN] ❌ Platform admin query failed:', err);
        console.error('[LOGIN] This likely means RLS policy is blocking the query');
        // Not a platform admin
      }

      // Platform admins: Login handled by auth state listener
      if (isPlatformAdmin) {
        // Auth state listener will call loadUserData and handle the login
        return;
      }

      // Regular users: Fetch user profile and tenant
      const userProfile = await supabase.query('user_profiles', {
        filters: { user_id: data.user.id },
        single: true
      });

      if (!userProfile) {
        throw new Error('User profile not found. Please contact support.');
      }

      const tenant = await supabase.query('tenants', {
        filters: { id: userProfile.tenant_id },
        single: true
      });

      if (tenant.status !== 'active') {
        throw new Error('Your account is pending verification. Please check your email.');
      }

      onLoginSuccess(tenant, userProfile);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setResetEmailSent(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Reset Password</h1>
          <p>Enter your email to receive a password reset link</p>

          {resetEmailSent ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Check your email</p>
              <p style={{ color: '#64748B', marginBottom: '2rem' }}>
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmailSent(false);
                  setEmail('');
                }}
                className="btn-secondary"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword}>
              {error && (
                <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="your.email@example.com"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="btn-secondary"
                style={{ marginTop: '1rem' }}
                disabled={loading}
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>RegIntels</h1>
        <p>Sign in to your account</p>

        <form onSubmit={handleLogin}>
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '0.75rem' }}>
            New to RegIntels?
          </p>
          <button
            onClick={onStartOnboarding}
            className="btn-secondary"
            style={{ width: '100%' }}
          >
            Start Onboarding
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PASSWORD RESET COMPONENT
// ============================================================================
function PasswordResetPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.client.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
            <h2>Password Reset Successful!</h2>
            <p style={{ color: '#64748B', marginTop: '1rem' }}>
              Your password has been updated. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Set New Password</h1>
        <p>Enter your new password below</p>

        <form onSubmit={handlePasswordReset}>
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="At least 8 characters"
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Re-enter your password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function RegIntels() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [activeSolution, setActiveSolution] = useState('Regulatory Horizon');
  const [activePage, setActivePage] = useState('Change Feed');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [setupComplete, setSetupComplete] = useState(supabase.isConfigured);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Global handler for unhandled promise rejections (abort errors)
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      if (event.reason?.name === 'AbortError') {
        console.log('[Global] Suppressed AbortError:', event.reason);
        event.preventDefault(); // Prevent the error from showing in console
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);

      if (event === 'SIGNED_IN' && session) {
        await loadUserData(session.user.id, session.access_token);
      }
      // Note: SIGNED_OUT is handled by handleSignOut directly
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    console.log('[CHECK_AUTH] Starting auth check...');

    // Set a timeout to ensure we don't hang forever
    const timeoutId = setTimeout(() => {
      console.error('[CHECK_AUTH] TIMEOUT - forcing authLoading to false');
      setAuthLoading(false);
    }, 3000);

    try {
      // Check if Supabase is configured
      if (!supabase.isConfigured) {
        console.log('[CHECK_AUTH] Supabase not configured, showing login page');
        setAuthLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      const { data: { session }, error } = await supabase.getSession();

      if (error) {
        console.error('[CHECK_AUTH] getSession error:', error);
        setAuthLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      console.log('[CHECK_AUTH] Session:', session ? 'exists' : 'none');

      if (session?.user) {
        console.log('[CHECK_AUTH] Loading user data for:', session.user.id);
        await loadUserData(session.user.id, session.access_token);
      } else {
        console.log('[CHECK_AUTH] No session, showing login page');
      }
    } catch (error) {
      console.error('[CHECK_AUTH] Exception:', error.message || error);
      // On error, still show login page instead of hanging
    } finally {
      clearTimeout(timeoutId);
      console.log('[CHECK_AUTH] Complete, setting authLoading to false');
      setAuthLoading(false);
    }
  };

  const loadUserData = async (userId, userToken) => {
    console.log('[LOAD_USER_DATA] Loading user data for:', userId, 'with token:', userToken ? 'yes' : 'no');
    try {
      // FIRST: Check if user is a platform admin (super admin/platform owner)
      let isPlatformAdmin = false;
      let platformAdminData = null;

      console.log('[LOAD_USER_DATA] Checking platform_admins table...');
      try {
        platformAdminData = await supabase.query('platform_admins', {
          filters: { user_id: userId, is_active: true },
          single: true,
          userToken: userToken
        });
        console.log('[LOAD_USER_DATA] Platform admin query result:', platformAdminData);
        isPlatformAdmin = !!platformAdminData;
      } catch (err) {
        console.error('[LOAD_USER_DATA] ❌ Platform admin query failed:', err);
        console.error('[LOAD_USER_DATA] RLS policy may be blocking the query');
        // Not a platform admin
        isPlatformAdmin = false;
      }

      // If platform admin, allow login WITHOUT user_profile or tenant
      if (isPlatformAdmin) {
        console.log('[LOAD_USER_DATA] ✅ User IS platform admin, logging in as platform owner');
        setCurrentUser({
          user_id: userId,
          email: platformAdminData.email,
          display_name: platformAdminData.display_name,
          is_platform_admin: true,
          is_platform_owner: true // Platform admins are owners
        });
        setCurrentTenant(null); // Platform admins don't belong to a tenant
        setIsAuthenticated(true);
        setShowOnboarding(false);
        console.log('[LOAD_USER_DATA] ✅ Platform owner login complete');
        return; // Exit early - no need to check user_profiles
      }

      console.log('[LOAD_USER_DATA] User is NOT a platform admin, checking user_profiles...');

      // For regular users: Check user_profiles and tenant
      const userProfile = await supabase.query('user_profiles', {
        filters: { user_id: userId },
        single: true
      });

      if (userProfile) {
        const tenant = await supabase.query('tenants', {
          filters: { id: userProfile.tenant_id },
          single: true
        });

        setCurrentUser({ ...userProfile, is_platform_admin: false });
        setCurrentTenant(tenant);
        setIsAuthenticated(true);
        setShowOnboarding(false);
        console.log('[LOAD_USER_DATA] ✅ Regular user login complete');
      } else {
        console.log('[LOAD_USER_DATA] ⚠️ No user profile found for user:', userId);
      }
    } catch (error) {
      console.error('[LOAD_USER_DATA] ❌ Error loading user data:', error);
    } finally {
      console.log('[LOAD_USER_DATA] Complete');
    }
  };

  const handleLoginSuccess = (tenant, userProfile) => {
    setCurrentTenant(tenant);
    setCurrentUser(userProfile);
    setIsAuthenticated(true);
    localStorage.setItem('tenant_onboarded', 'true');
  };

  const handleSignOut = async () => {
    try {
      // Clear state first to prevent UI issues
      setCurrentUser(null);
      setCurrentTenant(null);
      setIsAuthenticated(false);
      localStorage.removeItem('tenant_onboarded');

      // Then sign out from Supabase (this may trigger auth state change)
      await supabase.signOut();
    } catch (error) {
      // Ignore abort errors - state is already cleared
      if (error.name !== 'AbortError') {
        console.error('Sign out error:', error);
      }
    }
  };

  const handleOnboardingComplete = (tenantData, userData) => {
    setShowOnboarding(false);

    // If mock mode, auto-login the user
    if (tenantData && userData) {
      setCurrentTenant(tenantData);
      setCurrentUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('tenant_onboarded', 'true');
    }
    // Otherwise (real Supabase), user needs to verify email and login
  };

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  // single solutions declaration
  const solutions = {
    'Regulatory Horizon': {
      name: 'Regulatory Change Intelligence',
      icon: Bell,
      pages: ['Change Feed', 'Change Register'],
      accessRoles: ['Admin', 'Compliance'],
    },
    'Control Architecture': {
      name: 'Control Framework Core',
      icon: Shield,
      pages: ['Control Library'],
      accessRoles: ['Admin', 'Compliance'],
    },
    'Operational Assurance': {
      name: 'Control Execution & Monitoring',
      icon: FileCheck,
      pages: ['Policy Library', 'Reg Mapping', 'Attestations', 'Exceptions'],
      accessRoles: ['Admin', 'Compliance'],
    },
    'Issue & Breach Management': {
      name: 'Exceptions & Remediation',
      icon: AlertTriangle,
      pages: ['Exception Intelligence', 'Risk Signal Hub', 'Unified Exceptions'],
      accessRoles: ['Admin', 'Compliance'],
    },
    'Evidence & Audit Readiness': {
      name: 'Evidence & Audit Readiness',
      icon: FileCheck,
      pages: ['Evidence & Audit'],
      accessRoles: ['Admin', 'Compliance'],
    },
    'Governance & Board Assurance': {
      name: 'Board View',
      icon: BarChart3,
      pages: [
        'Strategic Scoring',
        'Management Summary',
        'Risk Posture',
        'Control Effectiveness',
        'Exceptions Overview',
        'Regulatory Readiness',
        'Attestations',
        'Audit Trail',
        'Decision Register',
        'Approvals',
        'Regulator Pack',
        'Regulatory Notifications',
        'Governance Evidence Library',
        'KPI Schema',
        'API Health',
      ],
      accessRoles: ['Admin', 'Compliance', 'Board'],
      readOnly: true,
    },
    'Tenant Admin': {
      name: 'Tenant Administration',
      icon: Settings,
      pages: ['User Management', 'Firm Settings', 'Subscription'],
      accessRoles: ['Admin'], // Only tenant admins can access
      isTenantAdminOnly: true,
    },
    'Platform Admin': {
      name: 'Platform Administration',
      icon: Settings,
      pages: ['Feature Control', 'Platform Metrics', 'Tenant Approvals', 'Tenant Management', 'Marketing Emails', 'Messages'],
      accessRoles: ['PlatformAdmin'],
      isPlatformAdminOnly: true,
    },
  };

  const hasAccess = (solution) => {
    if (!currentUser) return false;
    const solutionConfig = solutions[solution];

    // Guard: if solution doesn't exist, deny access
    if (!solutionConfig) return false;

    // PLATFORM OWNERS: Only show Platform Admin solution
    if (currentUser.is_platform_owner || currentUser.is_platform_admin) {
      // Platform owners can ONLY access platform admin solutions
      return solutionConfig.isPlatformAdminOnly === true;
    }

    // Platform admin only solutions (for non-platform-owners)
    if (solutionConfig.isPlatformAdminOnly) {
      return false; // Regular users can't access platform admin solutions
    }

    // Regular role-based access for tenant users
    return solutionConfig.accessRoles.includes(currentUser.role);
  };

  const accessibleSolutions = currentUser
    ? Object.keys(solutions).filter(hasAccess)
    : [];

  useEffect(() => {
    if (currentUser && activeSolution && !hasAccess(activeSolution)) {
      const firstSolution = accessibleSolutions[0];
      if (firstSolution) {
        setActiveSolution(firstSolution);
        setActivePage(solutions[firstSolution].pages[0]);
      }
    }
  }, [currentUser?.id]);

  // Show loading while checking auth
  // Check if user is on password reset page
  const isPasswordResetPage = window.location.pathname === '/auth/reset-password' ||
                               window.location.hash.includes('type=recovery');

  if (isPasswordResetPage) {
    return <PasswordResetPage />;
  }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader className="spinner" />
        <span style={{ marginLeft: '1rem' }}>Loading...</span>
      </div>
    );
  }

  // If not authenticated and not in onboarding, show login page
  if (!isAuthenticated && !showOnboarding) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onStartOnboarding={handleStartOnboarding} />;
  }

  // If onboarding, show onboarding wizard
  if (showOnboarding) {
    return <TenantOnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // main render
  return (
    <div className="app">
      {/* Connection Status Banner */}
      <div
        className={`status-banner ${
          supabase.useMockData ? 'warning' : 'success'
        }`}
      >
        <div className="status-content">
          {supabase.useMockData ? (
            <AlertCircle size={18} />
          ) : (
            <Database size={18} />
          )}
          <span>
            {supabase.useMockData
              ? '⚠️ Using Mock Data - Click "Configure Database" to connect Supabase'
              : '✓ Connected to Supabase'}
          </span>
        </div>
      </div>

      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-left">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="nav-button"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="logo">
            <Shield size={28} strokeWidth={2.5} />
            <div>
              <div className="logo-title">RegIntels</div>
              <div className="logo-subtitle">{currentTenant?.name}</div>
            </div>
          </div>
        </div>

        <div className="nav-right">
          <div className="user-info">
            <div className="user-name">{currentUser?.display_name}</div>
            <div className="user-role">
              {currentUser?.role} • {currentUser?.department}
            </div>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            className="nav-button-secondary"
          >
            <Database size={16} />
            {setupComplete ? 'Database Setup' : 'Configure Database'}
          </button>
          <button
            onClick={handleSignOut}
            className="nav-button-secondary"
            title="Sign Out"
          >
            <X size={16} />
            Sign Out
          </button>
        </div>
      </nav>

      <div className="main-container">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="sidebar">
            <div className="sidebar-content">
              {accessibleSolutions.map((solutionKey) => {
                const solution = solutions[solutionKey];
                const Icon = solution.icon;
                const isActive = activeSolution === solutionKey;

                return (
                  <div key={solutionKey} className="solution-group">
                    <button
                      onClick={() => {
                        setActiveSolution(solutionKey);
                        setActivePage(solution.pages[0]);
                      }}
                      className={`solution-button ${
                        isActive ? 'active' : ''
                      }`}
                    >
                      <Icon size={18} />
                      <span className="solution-name">{solutionKey}</span>
                      {solution.readOnly && (
                        <span className="readonly-badge">RO</span>
                      )}
                    </button>

                    {isActive && (
                      <div className="page-list">
                        {solution.pages.map((page) => (
                          <button
                            key={page}
                            onClick={() => setActivePage(page)}
                            className={`page-button ${
                              activePage === page ? 'active' : ''
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="content">
          {showSetup ? (
            <SetupPage
              onClose={() => setShowSetup(false)}
              onComplete={() => {
                setSetupComplete(true);
                setShowSetup(false);
                window.location.reload();
              }}
            />
          ) : (
            <PageContent
              solution={activeSolution}
              page={activePage}
              tenantId={currentTenant?.id}
              currentUser={currentUser}
              isReadOnly={solutions[activeSolution].readOnly}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE CONTENT ROUTER
// ============================================================================
function PageContent({ solution, page, tenantId, isReadOnly, currentUser }) {
  // Regulatory Horizon (formerly Solution 1)
  if (solution === 'Regulatory Horizon' && page === 'Change Feed') return <ChangeFeedPage tenantId={tenantId} isReadOnly={isReadOnly} />;
  if (solution === 'Regulatory Horizon' && page === 'Change Register') return <ChangeRegisterPage tenantId={tenantId} isReadOnly={isReadOnly} />;
  // Control Architecture (formerly Solution 2)
  if (solution === 'Control Architecture' && page === 'Control Library') return <ControlLibraryPage tenantId={tenantId} isReadOnly={isReadOnly} />;
  // Operational Assurance (formerly Solution 3)
  if (solution === 'Operational Assurance' && page === 'Policy Library') return <PolicyLibraryPage tenantId={tenantId} isReadOnly={isReadOnly} />;
  if (solution === 'Operational Assurance' && page === 'Reg Mapping') return <RegMappingPage tenantId={tenantId} isReadOnly={isReadOnly} />;
  if (solution === 'Operational Assurance' && page === 'Attestations') return <AttestationsPage tenantId={tenantId} isReadOnly={isReadOnly} />;
  if (solution === 'Operational Assurance' && page === 'Exceptions') return <ExceptionsLightPage tenantId={tenantId} isReadOnly={isReadOnly} />;
  // Issue & Breach Management (formerly Solution 4)
  if (solution === 'Issue & Breach Management' && page === 'Exception Intelligence') return <ExceptionIntelligenceDashboard supabase={supabase.client} />;
  if (solution === 'Issue & Breach Management' && page === 'Risk Signal Hub') return <Solution4Dashboard supabase={supabase.client} />;
  if (solution === 'Issue & Breach Management' && page === 'Unified Exceptions') return <UnifiedExceptionsPage tenantId={tenantId} isReadOnly={isReadOnly} />;
  // Evidence & Audit Readiness (formerly Solution 4B)
  if (solution === 'Evidence & Audit Readiness' && page === 'Evidence & Audit') return <EvidenceAuditPage tenantId={tenantId} isReadOnly={isReadOnly} />;
  // Governance & Board Assurance (formerly Solution 5)
  if (solution === 'Governance & Board Assurance' && page === 'Strategic Scoring') return <StrategicDashboard supabase={supabase.client} />;
  if (solution === 'Governance & Board Assurance' && page === 'Management Summary') return <ManagementSummaryPage tenantId={tenantId} />;
  if (solution === 'Governance & Board Assurance' && page === 'Risk Posture') return <RiskPosturePage tenantId={tenantId} />;
  if (solution === 'Governance & Board Assurance' && page === 'Control Effectiveness') return <ControlEffectivenessPage tenantId={tenantId} />;
  if (solution === 'Governance & Board Assurance' && page === 'API Health') return <APIHealthPage tenantId={tenantId} />;
  if (solution === 'Governance & Board Assurance' && page === 'Exceptions Overview') return <ExceptionsOverviewBoard supabase={supabase.client} />;
  if (solution === 'Governance & Board Assurance' && page === 'Regulatory Readiness') return <RegulatoryReadinessBoard supabase={supabase.client} />;
  if (solution === 'Governance & Board Assurance' && page === 'Attestations') return <AttestationsBoard supabase={supabase.client} />;
  if (solution === 'Governance & Board Assurance' && page === 'Audit Trail') return <AuditTrailBoard supabase={supabase.client} />;
  if (solution === 'Governance & Board Assurance' && page === 'Decision Register') return <DecisionRegisterBoard supabase={supabase.client} />;
  if (solution === 'Governance & Board Assurance' && page === 'Approvals') return <ApprovalsBoard supabase={supabase.client} />;
  if (solution === 'Governance & Board Assurance') return <BoardPagePlaceholder page={page} tenantId={tenantId} />;
  if (solution === 'Tenant Admin' && page === 'User Management') return <TenantUserManagementPage currentUser={currentUser} tenantId={tenantId} />;
  if (solution === 'Tenant Admin' && page === 'Firm Settings') return <TenantFirmSettingsPage currentUser={currentUser} tenantId={tenantId} />;
  if (solution === 'Tenant Admin' && page === 'Subscription') return <TenantSubscriptionPage currentUser={currentUser} tenantId={tenantId} />;
  if (solution === 'Platform Admin' && page === 'Feature Control') return <PlatformFeatureControl supabase={supabase.client} />;
  if (solution === 'Platform Admin' && page === 'Platform Metrics') return <PlatformMetricsPage currentUser={currentUser} />;
  if (solution === 'Platform Admin' && page === 'Tenant Approvals') return <TenantApprovalsPage currentUser={currentUser} />;
  if (solution === 'Platform Admin' && page === 'Tenant Management') return <TenantManagementPage currentUser={currentUser} />;
  if (solution === 'Platform Admin' && page === 'Marketing Emails') return <MarketingEmailsPage currentUser={currentUser} />;
  if (solution === 'Platform Admin' && page === 'Messages') return <MessagesPage currentUser={currentUser} />;

  return <div>Page: {page}</div>;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================
function StatusBadge({ status }) {
  const colorMap = {
    active: 'success',
    in_review: 'warning',
    actioned: 'info',
    open: 'danger',
    remediation: 'warning',
    closed: 'success',
    draft: 'muted',
    pending: 'warning',
    submitted: 'info'
  };
  
  return (
    <span className={`status-badge ${colorMap[status] || 'muted'}`}>
      {status ? status.replace('_', ' ') : 'unknown'}
    </span>
  );
}

function ImpactBadge({ impact }) {
  const colorMap = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  };
  
  return (
    <span className={`impact-badge ${colorMap[impact]}`}>
      {impact} impact
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="loading-container">
      <Loader size={32} className="spinner" />
    </div>
  );
}

function DataTable({ headers, rows }) {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// SOLUTION 1: REGULATORY CHANGE INTELLIGENCE
// ============================================================================
function ChangeFeedPage({ tenantId, isReadOnly }) {
  const { data: changes, loading, refetch } = useRegChanges(tenantId);
  const [impactScores, setImpactScores] = useState([]);
  const [loadingScores, setLoadingScores] = useState(true);

  // Fetch Impact Scores from strategic view
  useEffect(() => {
    const controller = new AbortController();

    const fetchImpactScores = async (signal) => {
      setLoadingScores(true);
      try {
        const scores = await supabase.query('v_regulatory_impact_score', {
          tenantId: tenantId
        }, signal);

        if (!signal?.aborted) {
          setImpactScores(scores || []);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error loading impact scores:', error);
        }
      } finally {
        if (!signal?.aborted) {
          setLoadingScores(false);
        }
      }
    };

    if (tenantId) {
      fetchImpactScores(controller.signal);
    }

    return () => controller.abort('Component unmounted');
  }, [tenantId]);

  // Merge impact scores with changes
  const changesWithScores = changes?.map(change => {
    const score = impactScores.find(s => s.change_id === change.id);
    return { ...change, impactScore: score };
  }) || [];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Change Feed</h1>
        <p className="page-subtitle">Regulatory updates with quantified impact scoring</p>
      </div>

      {!isReadOnly && (
        <button onClick={() => refetch()} className="btn-primary">
          Scan for Updates
        </button>
      )}

      <div className="card-grid">
        {changesWithScores.map(change => (
          <div key={change.id} className="card">
            <div className="card-badges">
              <span className="source-badge">{change.source}</span>
              <span className="date-badge">{change.published_at}</span>
              <StatusBadge status={change.status} />
              {/* Replace old impact badge with strategic Impact Score */}
              {change.impactScore && !loadingScores ? (
                <ImpactScoreCard
                  score={change.impactScore.total_impact_score}
                  riskBand={change.impactScore.risk_band}
                  primaryDriver={change.impactScore.primary_driver}
                  compact={true}
                />
              ) : (
                <ImpactBadge impact={change.impact_rating} />
              )}
            </div>
            <h3 className="card-title">{change.title}</h3>
            <p className="card-text">{change.summary}</p>

            {/* Show detailed impact score if available */}
            {change.impactScore && !loadingScores && (
              <div style={{ marginTop: '12px' }}>
                <ImpactScoreCard
                  score={change.impactScore.total_impact_score}
                  riskBand={change.impactScore.risk_band}
                  primaryDriver={change.impactScore.primary_driver}
                  changeTitle={null}
                  compact={false}
                />
              </div>
            )}

            {!isReadOnly && (
              <div className="card-actions">
                <button className="btn-secondary">Review</button>
                <button className="btn-ghost">Map to Controls</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangeRegisterPage({ tenantId }) {
  const { data: changes, loading } = useRegChanges(tenantId);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Change Register</h1>
        <p className="page-subtitle">Full register of regulatory changes with impact assessments</p>
      </div>
      
      <DataTable 
        headers={['ID', 'Source', 'Title', 'Published', 'Status', 'Impact']}
        rows={changes?.map(c => [
          c.id,
          c.source,
          c.title,
          c.published_at,
          <StatusBadge key={c.id} status={c.status} />,
          <ImpactBadge key={c.id} impact={c.impact_rating} />
        ]) || []}
      />
    </div>
  );
}

// ============================================================================
// SOLUTION 2: CONTROL FRAMEWORK CORE
// ============================================================================
function ControlLibraryPage({ tenantId, isReadOnly }) {
  const { data: controls, loading, refetch } = useControls(tenantId);
  const [showModal, setShowModal] = useState(false);
  const [controlDrift, setControlDrift] = useState([]);
  const [loadingDrift, setLoadingDrift] = useState(true);

  // Fetch Control Drift data from strategic view
  useEffect(() => {
    const controller = new AbortController();

    const fetchControlDrift = async (signal) => {
      setLoadingDrift(true);
      try {
        const drift = await supabase.query('v_control_drift_index', {
          tenantId: tenantId
        }, signal);

        if (!signal?.aborted) {
          setControlDrift(drift || []);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error loading control drift:', error);
        }
      } finally {
        if (!signal?.aborted) {
          setLoadingDrift(false);
        }
      }
    };

    if (tenantId) {
      fetchControlDrift(controller.signal);
    }

    return () => controller.abort('Component unmounted');
  }, [tenantId]);

  // Merge drift data with controls
  const controlsWithDrift = controls?.map(control => {
    const drift = controlDrift.find(d => d.control_id === control.id);
    return { ...control, driftData: drift };
  }) || [];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Control Library</h1>
        <p className="page-subtitle">Control framework with drift monitoring</p>
      </div>

      {/* Control Drift Heatmap */}
      {!loadingDrift && controlDrift.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <ControlDriftHeatmap
            driftData={controlDrift}
            onControlClick={(control) => console.log('Control clicked:', control)}
          />
        </div>
      )}

      {!isReadOnly && (
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={18} />
          Create Control
        </button>
      )}

      {showModal && (
        <CreateControlModal
          tenantId={tenantId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            refetch();
          }}
        />
      )}

      <div className="card-grid">
        {controlsWithDrift.map(control => (
          <div key={control.id} className="card">
            <div className="card-badges">
              <span className="control-code">{control.control_code}</span>
              <span className="frequency-badge">• {control.frequency}</span>
              <StatusBadge status={control.status} />
              {/* Add Control Drift Badge */}
              {control.driftData && !loadingDrift && (
                <ControlDriftBadge
                  driftStatus={control.driftData.drift_status}
                  driftScore={control.driftData.drift_score}
                  compact={true}
                />
              )}
            </div>
            <h3 className="card-title">{control.title}</h3>
            <p className="card-text">{control.description}</p>
            <div className="card-meta">
              Test Method: {control.test_method}
            </div>
            {/* Show detailed drift info if critical */}
            {control.driftData && !loadingDrift && control.driftData.drift_status === 'CRITICAL_DRIFT' && (
              <div style={{ marginTop: '12px' }}>
                <ControlDriftBadge
                  driftStatus={control.driftData.drift_status}
                  driftScore={control.driftData.drift_score}
                  driftDriver={control.driftData.drift_driver}
                  showScore={true}
                  compact={false}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SOLUTION 3: CONTROL EXECUTION & MONITORING
// ============================================================================
function PolicyLibraryPage({ tenantId, isReadOnly }) {
  const { data: policies, loading, refetch } = usePolicies(tenantId);
  const [showModal, setShowModal] = useState(false);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Policy Library</h1>
        <p className="page-subtitle">Foundation policy inventory and templates</p>
      </div>

      {!isReadOnly && (
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Upload size={18} />
          Upload Policy
        </button>
      )}

      {showModal && (
        <CreatePolicyModal 
          tenantId={tenantId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            refetch();
          }}
        />
      )}

      <div className="card-grid">
        {policies?.map(policy => (
          <div key={policy.id} className="card">
            <div className="card-badges">
              <FileText size={18} />
              <span className="version-badge">v{policy.version}</span>
              <StatusBadge status={policy.status} />
            </div>
            <h3 className="card-title">{policy.title}</h3>
            <div className="card-meta">
              Regime: {policy.regulator_regime}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegMappingPage({ tenantId }) {
  const { data: policies } = usePolicies(tenantId);
  const { data: controls } = useControls(tenantId);

  return (
    <div>
      <div className="page-header">
        <h1>Regulatory Mapping</h1>
        <p className="page-subtitle">Obligations ↔ Policies ↔ Controls mapping view</p>
      </div>

      <div className="mapping-grid">Continue22:39    <div className="mapping-column">
      <h3>OBLIGATIONS</h3>
      {['AML Customer Due Diligence', 'Conflicts of Interest Management', 'GDPR Data Subject Rights'].map((ob, i) => (
        <div key={i} className="mapping-item">{ob}</div>
      ))}
    </div>

    <div className="mapping-column">
      <h3>POLICIES</h3>
      {policies?.map(p => (
        <div key={p.id} className="mapping-item">{p.title}</div>
      ))}
    </div>

    <div className="mapping-column">
      <h3>CONTROLS</h3>
      {controls?.map(c => (
        <div key={c.id} className="mapping-item">
          <div className="control-code-small">{c.control_code}</div>
          <div>{c.title}</div>
        </div>
      ))}
    </div>
  </div>
</div>
);
}
function AttestationsPage({ tenantId, isReadOnly }) {
  const [attestationConfidence, setAttestationConfidence] = useState([]);
  const [loadingConfidence, setLoadingConfidence] = useState(true);

  // Fetch Attestation Confidence data from strategic view
  useEffect(() => {
    const controller = new AbortController();

    const fetchAttestationConfidence = async (signal) => {
      setLoadingConfidence(true);
      try {
        const confidence = await supabase.query('v_attestation_confidence_index', {
          tenantId: tenantId
        }, signal);

        if (!signal?.aborted) {
          setAttestationConfidence(confidence || []);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error loading attestation confidence:', error);
        }
      } finally {
        if (!signal?.aborted) {
          setLoadingConfidence(false);
        }
      }
    };

    if (tenantId) {
      fetchAttestationConfidence(controller.signal);
    }

    return () => controller.abort('Component unmounted');
  }, [tenantId]);

  // Sample data - replace with actual query when available
  const attestations = [
    { id: 1, control_code: 'AML-001', period: 'Q4 2024', owner: 'Mike Chen', status: 'pending', due_date: '2025-01-20', role: 'SMF' },
    { id: 2, control_code: 'COI-001', period: 'Q4 2024', owner: 'Sarah Johnson', status: 'submitted', due_date: '2025-01-15', role: 'Owner' }
  ];

  // Merge confidence data with attestations
  const attestationsWithConfidence = attestations.map(att => {
    const confidence = attestationConfidence.find(c => c.attestation_id === att.id);
    return { ...att, confidenceData: confidence };
  });

  // Calculate average confidence
  const avgConfidence = attestationConfidence.length > 0
    ? Math.round(attestationConfidence.reduce((sum, c) => sum + c.confidence_score, 0) / attestationConfidence.length)
    : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Attestations</h1>
        <p className="page-subtitle">Attestations with confidence scoring</p>
      </div>

      {/* Overall Confidence Widget */}
      {!loadingConfidence && attestationConfidence.length > 0 && (
        <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
          <AttestationConfidenceWidget
            confidenceScore={avgConfidence}
            confidenceBand={
              avgConfidence >= 70 ? 'HIGH_CONFIDENCE' :
              avgConfidence >= 40 ? 'MEDIUM_CONFIDENCE' :
              'LOW_CONFIDENCE'
            }
            confidenceDriver="Overall attestation health"
            attestorRole="Various"
            compact={false}
          />
        </div>
      )}

      {!isReadOnly && (
        <button className="btn-primary">
          + Request Attestation
        </button>
      )}

      {/* Attestation Cards with Confidence */}
      <div className="card-grid" style={{ marginTop: '20px' }}>
        {attestationsWithConfidence.map(att => (
          <div key={att.id} className="card">
            <div className="card-badges">
              <span className="control-code">{att.control_code}</span>
              <StatusBadge status={att.status} />
              {/* Add Confidence Badge */}
              {att.confidenceData && !loadingConfidence && (
                <AttestationConfidenceWidget
                  confidenceScore={att.confidenceData.confidence_score}
                  confidenceBand={att.confidenceData.confidence_band}
                  compact={true}
                />
              )}
            </div>
            <h3 className="card-title">Period: {att.period}</h3>
            <p className="card-text">Owner: {att.owner} ({att.role})</p>
            <div className="card-meta">
              Due Date: {att.due_date}
            </div>

            {/* Show detailed confidence if available */}
            {att.confidenceData && !loadingConfidence && (
              <div style={{ marginTop: '12px' }}>
                <AttestationConfidenceWidget
                  confidenceScore={att.confidenceData.confidence_score}
                  confidenceBand={att.confidenceData.confidence_band}
                  confidenceDriver={att.confidenceData.confidence_driver}
                  attestorRole={att.confidenceData.attestor_role}
                  compact={false}
                />
              </div>
            )}

            {!isReadOnly && (
              <div className="card-actions" style={{ marginTop: '12px' }}>
                <button className="btn-primary-small">Submit</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Table view option */}
      <div style={{ marginTop: '24px' }}>
        <h3>Attestation Summary Table</h3>
        <DataTable
          headers={['Control', 'Period', 'Owner', 'Due Date', 'Status', 'Confidence', 'Actions']}
          rows={attestationsWithConfidence.map(a => [
            a.control_code,
            a.period,
            a.owner,
            a.due_date,
            <StatusBadge key={a.id} status={a.status} />,
            a.confidenceData && !loadingConfidence ? (
              <AttestationConfidenceWidget
                key={`conf-${a.id}`}
                confidenceScore={a.confidenceData.confidence_score}
                confidenceBand={a.confidenceData.confidence_band}
                compact={true}
              />
            ) : '-',
            !isReadOnly ? <button key={a.id} className="btn-primary-small">Submit</button> : '-'
          ])}
        />
      </div>
    </div>
  );
}
function ExceptionsLightPage({ tenantId }) {
const { data: exceptions, loading } = useExceptions(tenantId);
if (loading) return <LoadingSpinner />;
return (
<div>
<div className="page-header">
<h1>Exceptions</h1>
<p className="page-subtitle">Operational exception capture tied to failed controls</p>
</div>
  <div className="card-grid">
    {exceptions?.slice(0, 2).map(ex => (
      <div key={ex.id} className="card">
        <div className="card-badges">
          <AlertTriangle size={18} color={ex.severity === 'high' ? '#B91C1C' : '#B45309'} />
          <span className="source-type-badge">{ex.source_type}</span>
          <StatusBadge status={ex.status} />
        </div>
        <h3 className="card-title">{ex.title}</h3>
        <div className="card-meta">
          Opened: {ex.opened_at}
        </div>
      </div>
    ))}
  </div>
  <div className="info-message">
    View full exceptions list in Solution 4
  </div>
</div>
);
}
// ============================================================================
// SOLUTION 4: EXCEPTIONS & REMEDIATION
// ============================================================================
function UnifiedExceptionsPage({ tenantId, isReadOnly }) {
const { data: exceptions, loading, refetch } = useExceptions(tenantId);
const [showModal, setShowModal] = useState(false);
if (loading) return <LoadingSpinner />;
return (
<div>
<div className="page-header">
<h1>Unified Exceptions</h1>
<p className="page-subtitle">All exceptions from controls, incidents, complaints, and other sources</p>
</div>
  {!isReadOnly && (
    <button onClick={() => setShowModal(true)} className="btn-primary">
      + Create Exception
    </button>
  )}

  {showModal && (
    <CreateExceptionModal 
      tenantId={tenantId}
      onClose={() => setShowModal(false)}
      onSuccess={() => {
        setShowModal(false);
        refetch();
      }}
    />
  )}

  <div className="card-grid">
    {exceptions?.map(ex => (
      <div key={ex.id} className="card">
        <div className="card-badges">
          <AlertTriangle size={18} color={ex.severity === 'high' ? '#B91C1C' : '#B45309'} />
          <span className="source-type-badge">{ex.source_type}</span>
          <span className={`severity-badge ${ex.severity}`}>{ex.severity} severity</span>
          <StatusBadge status={ex.status} />
        </div>
        <h3 className="card-title">{ex.title}</h3>
        <p className="card-text">{ex.description}</p>
        <div className="card-meta">
          Opened: {ex.opened_at}
        </div>
        {!isReadOnly && (
          <div className="card-actions">
            <button className="btn-secondary">Assign Action</button>
            <button 
              onClick={async () => {
                await closeException(tenantId, ex.id);
                refetch();
              }}
              className="btn-success"
            >
              Close
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
</div>
);
}
function EvidenceAuditPage({ tenantId }) {
const [evidenceFile, setEvidenceFile] = useState(null);
const evidenceItems = [
{ id: 1, linked_type: 'control_test', control: 'AML-001', description: 'CDD Sample Test Results Q4 2024', file: 'cdd_test_q4.xlsx', collected_at: '2025-01-10' },
{ id: 2, linked_type: 'control', control: 'COI-001', description: 'Conflicts Register December 2024', file: 'conflicts_dec.pdf', collected_at: '2025-01-05' }
];

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    setEvidenceFile(file);
    alert(`File "${file.name}" selected. In production, this would be uploaded to Supabase Storage.`);
  }
};

return (
<div>
<div className="page-header">
<h1>Evidence & Audit Readiness</h1>
<p className="page-subtitle">Evidence inventory, audit packs, and traceability</p>
</div>
  <input
    type="file"
    id="evidenceFileUpload"
    accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
    onChange={handleFileUpload}
    style={{ display: 'none' }}
  />
  <button
    className="btn-primary"
    onClick={() => document.getElementById('evidenceFileUpload').click()}
  >
    <Upload size={18} />
    {evidenceFile ? `✓ ${evidenceFile.name}` : 'Upload Evidence'}
  </button>

  <DataTable 
    headers={['Type', 'Control', 'Description', 'File', 'Collected', 'Actions']}
    rows={evidenceItems.map(e => [
      e.linked_type,
      e.control,
      e.description,
      e.file,
      e.collected_at,
      <button key={e.id} className="btn-ghost"><Download size={16} /> Download</button>
    ])}
  />

  <div className="audit-trail-section">
    <h3>Audit Trail</h3>
    <div className="audit-trail">
      <div>2025-01-10 14:23 • Sarah Johnson uploaded evidence for AML-001</div>
      <div>2025-01-10 12:15 • Mike Chen completed control test COI-001</div>
      <div>2025-01-09 16:45 • Sarah Johnson created exception EXC-002</div>
    </div>
  </div>
</div>
);
}

// ============================================================================
// TENANT ADMIN PAGES
// ============================================================================
function TenantUserManagementPage({ currentUser, tenantId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'Compliance' });

  useEffect(() => {
    const controller = new AbortController();
    loadUsers(controller.signal);
    return () => controller.abort('Component unmounted');
  }, [tenantId]);

  const loadUsers = async (signal) => {
    setLoading(true);
    try {
      const tenantUsers = await supabase.query('user_profiles', {
        filters: { tenant_id: tenantId }
      }, signal);
      if (!signal?.aborted) {
        setUsers(tenantUsers || []);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading users:', error);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    // In a real implementation, this would invite the user via email
    alert(`User invitation would be sent to ${newUser.email}`);
    setShowAddUser(false);
    setNewUser({ email: '', name: '', role: 'Compliance' });
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Loader className="spinner" />
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage users and permissions for your firm</p>
      </div>

      <button
        className="btn-primary"
        onClick={() => setShowAddUser(true)}
        style={{ marginBottom: '1.5rem' }}
      >
        <UserPlus size={18} /> Invite User
      </button>

      {showAddUser && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <h3>Invite New User</h3>
          <form onSubmit={handleAddUser}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Name</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              >
                <option value="Admin">Admin</option>
                <option value="Compliance">Compliance</option>
                <option value="Board">Board Member</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn-primary">Send Invitation</button>
              <button type="button" onClick={() => setShowAddUser(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem' }}>{user.name}</td>
                <td style={{ padding: '1rem' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    background: user.role === 'Admin' ? '#dbeafe' : '#e0e7ff',
                    color: user.role === 'Admin' ? '#1e40af' : '#4338ca',
                    fontSize: '0.85rem'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    background: '#d1fae5',
                    color: '#065f46',
                    fontSize: '0.85rem'
                  }}>
                    Active
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TenantFirmSettingsPage({ currentUser, tenantId }) {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    loadTenant(controller.signal);
    return () => controller.abort('Component unmounted');
  }, [tenantId]);

  const loadTenant = async (signal) => {
    setLoading(true);
    try {
      const tenantData = await supabase.query('tenants', {
        filters: { id: tenantId },
        single: true
      }, signal);
      if (!signal?.aborted) {
        setTenant(tenantData);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading tenant:', error);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Loader className="spinner" />
        <p>Loading firm settings...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Firm Settings</h1>
        <p>Manage your firm's information and preferences</p>
      </div>

      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Firm Information</h3>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Firm Name</label>
            <input
              type="text"
              value={tenant?.name || ''}
              readOnly
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#f8fafc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Regime</label>
            <input
              type="text"
              value={tenant?.regime || ''}
              readOnly
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#f8fafc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>FRN</label>
            <input
              type="text"
              value={tenant?.frn || ''}
              readOnly
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#f8fafc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Status</label>
            <div style={{
              padding: '0.5rem',
              borderRadius: '4px',
              background: tenant?.status === 'active' ? '#d1fae5' : '#fef3c7',
              color: tenant?.status === 'active' ? '#065f46' : '#92400e',
              display: 'inline-block'
            }}>
              {tenant?.status?.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: 0, color: '#1e40af' }}>
            <strong>Note:</strong> To change firm details, please contact platform support.
          </p>
        </div>
      </div>
    </div>
  );
}

function TenantSubscriptionPage({ currentUser, tenantId }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Subscription</h1>
        <p>View and manage your subscription</p>
      </div>

      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Current Plan</h3>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.5rem' }}>Enterprise</div>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Full access to all RegIntels solutions</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Status</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#10b981' }}>Active</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Users</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>Unlimited</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Solutions</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>All 5 Solutions</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginBottom: '1rem' }}>Included Features</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {[
            'Regulatory Change Intelligence',
            'Control Framework Core',
            'Control Execution & Monitoring',
            'Exceptions & Remediation',
            'Board View & Reporting',
            'Unlimited Users',
            '24/7 Priority Support',
            'Dedicated Account Manager'
          ].map((feature, idx) => (
            <li key={idx} style={{ padding: '0.75rem 0', borderBottom: idx < 7 ? '1px solid #e2e8f0' : 'none', display: 'flex', alignItems: 'center' }}>
              <CheckCircle size={18} style={{ color: '#10b981', marginRight: '0.75rem' }} />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// PLATFORM ADMIN PAGES
// ============================================================================
function PlatformMetricsPage({ currentUser }) {
  const [metrics, setMetrics] = useState({
    totalTenants: 0,
    activeTenants: 0,
    pendingTenants: 0,
    suspendedTenants: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    loadMetrics(controller.signal);
    return () => controller.abort('Component unmounted');
  }, []);

  const loadMetrics = async (signal) => {
    setLoading(true);
    try {
      // Get all tenants
      const allTenants = await supabase.query('tenants', {}, signal);

      // Calculate metrics
      const totalTenants = allTenants.length;
      const activeTenants = allTenants.filter(t => t.status === 'active').length;
      const pendingTenants = allTenants.filter(t => t.status === 'pending_verification').length;
      const suspendedTenants = allTenants.filter(t => t.status === 'suspended').length;

      // Get total users count
      const allUsers = await supabase.query('user_profiles', {}, signal);
      const totalUsers = allUsers.length;

      if (!signal?.aborted) {
        setMetrics({
          totalTenants,
          activeTenants,
          pendingTenants,
          suspendedTenants,
          totalUsers,
        });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading platform metrics:', error);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Loader className="spinner" />
        <p>Loading platform metrics...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Platform Metrics</h1>
        <p>Overview of RegIntels platform statistics</p>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Tenants</span>
            <Users size={20} style={{ color: '#667eea' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>{metrics.totalTenants}</div>
        </div>

        <div className="stat-card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Active Tenants</span>
            <CheckCircle size={20} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{metrics.activeTenants}</div>
        </div>

        <div className="stat-card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Pending Approval</span>
            <Clock size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{metrics.pendingTenants}</div>
        </div>

        <div className="stat-card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Suspended</span>
            <AlertCircle size={20} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{metrics.suspendedTenants}</div>
        </div>

        <div className="stat-card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Users</span>
            <Users size={20} style={{ color: '#8b5cf6' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>{metrics.totalUsers}</div>
        </div>
      </div>

      <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', padding: '1rem', borderRadius: '8px', marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'start' }}>
          <Shield size={20} style={{ color: '#92400e', marginRight: '0.75rem', flexShrink: 0, marginTop: '0.25rem' }} />
          <div>
            <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>Platform Owner View</div>
            <p style={{ color: '#92400e', margin: 0, fontSize: '0.9rem' }}>
              You are viewing the platform administration dashboard. You can approve tenants, view metrics, but cannot access individual tenant data to maintain privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TENANT COCKPIT COMPONENT
// ============================================================================
function TenantCockpitContent({ cockpitData, currentUser, onUpdate, setNotification }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [solutionAccess, setSolutionAccess] = useState({
    solution1: true,
    solution2: true,
    solution3: true,
    solution4: true,
    solution5: true
  });
  const [subscriptionPlan, setSubscriptionPlan] = useState('standard');
  const [saving, setSaving] = useState(false);

  if (!cockpitData) return null;

  const { tenant, users, settings } = cockpitData;

  const handleSolutionToggle = async (solution) => {
    setSolutionAccess(prev => ({ ...prev, [solution]: !prev[solution] }));
    // In production, you would update the database here
  };

  const handleSubscriptionChange = async (newPlan) => {
    if (!window.confirm(`Change subscription to ${newPlan}?`)) return;

    setSaving(true);
    try {
      // Update subscription in database
      await supabase.client
        .from('tenant_settings')
        .update({ subscription_plan: newPlan })
        .eq('tenant_id', tenant.id);

      setSubscriptionPlan(newPlan);
      setNotification({
        type: 'success',
        message: `Subscription updated to ${newPlan}`
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to update subscription: ${error.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'solutions', label: 'Solutions', icon: Grid },
    { id: 'subscription', label: 'Subscription', icon: CreditCard }
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '2rem'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#64748b',
                borderBottom: activeTab === tab.id ? '2px solid #667eea' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                borderRadius: '8px 8px 0 0'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              color: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Users size={24} />
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Users</span>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{users.length}</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              color: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Shield size={24} />
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Status</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {tenant.status === 'active' ? 'Active' : tenant.status === 'pending_verification' ? 'Pending' : 'Suspended'}
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              color: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Calendar size={24} />
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Registered</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {new Date(tenant.created_at).toLocaleDateString('en-GB')}
              </div>
            </div>
          </div>

          {/* Tenant Details */}
          <div style={{
            background: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Tenant Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Organization Name</div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>{tenant.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Contact Email</div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>{tenant.contact_email || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Regime</div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>{tenant.regime || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>FRN</div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>{tenant.frn || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>User List ({users.length})</h3>
          {users.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '2px dashed #cbd5e1'
            }}>
              <Users size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
              <p style={{ color: '#64748b', margin: 0 }}>No users found for this tenant</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.user_id}>
                      <td><strong>{user.first_name} {user.last_name}</strong></td>
                      <td>{user.email}</td>
                      <td><StatusBadge status={user.role} /></td>
                      <td><StatusBadge status={user.status || 'active'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Solutions Tab */}
      {activeTab === 'solutions' && (
        <div>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Solution Access Management</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Enable or disable access to specific solutions for this tenant
          </p>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {Object.keys(solutionAccess).map((solution) => {
              const solutionNames = {
                solution1: 'Solution 1 - Regulatory Updates',
                solution2: 'Solution 2 - Policy Manager',
                solution3: 'Solution 3 - Risk & Controls',
                solution4: 'Solution 4 - Regulatory Change',
                solution5: 'Solution 5 - Board & Assurance'
              };

              return (
                <div
                  key={solution}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                      {solutionNames[solution]}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {solutionAccess[solution] ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSolutionToggle(solution)}
                    style={{
                      padding: '0.5rem 1.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      background: solutionAccess[solution] ? '#10b981' : '#ef4444',
                      color: '#fff',
                      transition: 'all 0.2s'
                    }}
                  >
                    {solutionAccess[solution] ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Subscription Management</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Manage subscription plan and billing for this tenant
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {['basic', 'standard', 'premium', 'enterprise'].map((plan) => (
              <div
                key={plan}
                style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: subscriptionPlan === plan ? '3px solid #667eea' : '2px solid #e2e8f0',
                  background: subscriptionPlan === plan ? 'linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%)' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => handleSubscriptionChange(plan)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ margin: 0, color: '#1e293b', textTransform: 'capitalize' }}>{plan}</h4>
                  {subscriptionPlan === plan && <CheckCircle size={20} style={{ color: '#667eea' }} />}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  {plan === 'basic' && '1-5 users, 2 solutions'}
                  {plan === 'standard' && '6-20 users, 3 solutions'}
                  {plan === 'premium' && '21-50 users, 4 solutions'}
                  {plan === 'enterprise' && 'Unlimited users, all solutions'}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
              <AlertCircle size={20} style={{ color: '#92400e', marginTop: '0.125rem' }} />
              <div>
                <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                  Subscription Actions
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <button className="btn-secondary" disabled={saving}>
                    Reset Billing Cycle
                  </button>
                  <button className="btn-secondary" style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }} disabled={saving}>
                    Revoke Access
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TENANT MANAGEMENT PAGE (For Active/Approved Tenants)
// ============================================================================
function TenantManagementPage({ currentUser }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showCockpit, setShowCockpit] = useState(false);
  const [cockpitData, setCockpitData] = useState(null);
  const [cockpitLoading, setCockpitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    loadActiveTenants(controller.signal);
    return () => controller.abort('Component unmounted');
  }, []);

  const loadActiveTenants = async (signal) => {
    setLoading(true);
    try {
      const activeTenants = await supabase.query('tenants', {
        filters: { status: 'active' }
      }, signal);
      if (!signal?.aborted) {
        setTenants(activeTenants || []);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && !signal?.aborted) {
        console.error('Error loading tenants:', error);
        setNotification({ type: 'error', message: 'Failed to load tenants: ' + error.message });
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const openTenantCockpit = async (tenant) => {
    setSelectedTenant(tenant);
    setShowCockpit(true);
    setCockpitLoading(true);

    try {
      const [usersResult, settingsResult] = await Promise.all([
        supabase.client
          .from('user_profiles')
          .select('*')
          .eq('tenant_id', tenant.id),
        supabase.client
          .from('tenant_settings')
          .select('*')
          .eq('tenant_id', tenant.id)
          .single()
      ]);

      setCockpitData({
        users: usersResult.data || [],
        settings: settingsResult.data || {},
        tenant: tenant
      });
    } catch (error) {
      console.error('Error loading tenant details:', error);
      setNotification({
        type: 'error',
        message: `Failed to load tenant details: ${error.message}`
      });
    } finally {
      setCockpitLoading(false);
    }
  };

  const closeTenantCockpit = () => {
    setShowCockpit(false);
    setSelectedTenant(null);
    setCockpitData(null);
  };

  const handleSuspendTenant = async (tenantId, tenantName) => {
    if (!window.confirm(`Suspend tenant "${tenantName}"? This will revoke their access to the platform.`)) {
      return;
    }

    try {
      await supabase.client
        .from('tenants')
        .update({ status: 'suspended' })
        .eq('id', tenantId);

      setNotification({
        type: 'success',
        message: `Tenant "${tenantName}" has been suspended.`
      });

      await loadActiveTenants();
      closeTenantCockpit();
    } catch (error) {
      console.error('Error suspending tenant:', error);
      setNotification({
        type: 'error',
        message: `Failed to suspend tenant: ${error.message}`
      });
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.frn?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>Tenant Management</h1>
        <p className="page-subtitle">Manage all active tenants on the platform</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification-banner ${notification.type}`} style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '8px',
          backgroundColor: notification.type === 'success' ? '#d1fae5' : '#fee2e2',
          border: notification.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
          color: notification.type === 'success' ? '#065f46' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search tenants by name, email, or FRN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader className="spinner" size={32} />
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading tenants...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTenants.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '2px dashed #cbd5e1'
        }}>
          <Building size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>No tenants found</h3>
          <p style={{ color: '#64748b', margin: 0 }}>
            {searchTerm ? 'Try adjusting your search terms' : 'No active tenants on the platform yet'}
          </p>
        </div>
      )}

      {/* Tenants Table */}
      {!loading && filteredTenants.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization Name</th>
                <th>Regime</th>
                <th>FRN</th>
                <th>Contact Email</th>
                <th>Registered</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="tenant-row-hover"
                >
                  <td onClick={() => openTenantCockpit(tenant)} style={{ cursor: 'pointer' }}>
                    <strong>{tenant.name}</strong>
                  </td>
                  <td onClick={() => openTenantCockpit(tenant)} style={{ cursor: 'pointer' }}>
                    {tenant.regime || '-'}
                  </td>
                  <td onClick={() => openTenantCockpit(tenant)} style={{ cursor: 'pointer' }}>
                    {tenant.frn || '-'}
                  </td>
                  <td onClick={() => openTenantCockpit(tenant)} style={{ cursor: 'pointer' }}>
                    {tenant.contact_email || '-'}
                  </td>
                  <td onClick={() => openTenantCockpit(tenant)} style={{ cursor: 'pointer' }}>
                    {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('en-GB') : '-'}
                  </td>
                  <td onClick={() => openTenantCockpit(tenant)} style={{ cursor: 'pointer' }}>
                    <StatusBadge status={tenant.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTenantCockpit(tenant);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          minWidth: '110px',
                          justifyContent: 'center',
                          background: '#667eea',
                          borderColor: '#667eea',
                          padding: '0.5rem 1rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        <Settings size={16} />
                        <span>Manage</span>
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSuspendTenant(tenant.id, tenant.name);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          minWidth: '110px',
                          justifyContent: 'center',
                          background: '#ef4444',
                          color: '#fff',
                          borderColor: '#ef4444',
                          padding: '0.5rem 1rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        <X size={16} />
                        <span>Suspend</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tenant Count */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: '#eff6ff',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#1e40af'
      }}>
        <Building size={18} />
        <span style={{ fontWeight: '600' }}>
          Total Active Tenants: {filteredTenants.length}
          {searchTerm && ` (filtered from ${tenants.length})`}
        </span>
      </div>

      {/* Tenant Cockpit Modal */}
      {showCockpit && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
          onClick={closeTenantCockpit}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              maxWidth: '1200px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '2px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px 12px 0 0'
            }}>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>
                  {selectedTenant?.name}
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#e0e7ff', fontSize: '0.9rem' }}>
                  Tenant Management Cockpit
                </p>
              </div>
              <button
                onClick={closeTenantCockpit}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '2rem' }}>
              {cockpitLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <Loader className="spinner" size={32} />
                  <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading tenant details...</p>
                </div>
              ) : (
                <TenantCockpitContent
                  cockpitData={cockpitData}
                  currentUser={currentUser}
                  onUpdate={loadActiveTenants}
                  setNotification={setNotification}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MARKETING EMAILS PAGE
// ============================================================================
function MarketingEmailsPage({ currentUser }) {
  const [tenants, setTenants] = useState([]);
  const [selectedTenants, setSelectedTenants] = useState([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    loadTenants(controller.signal);
    return () => controller.abort('Component unmounted');
  }, []);

  const loadTenants = async (signal) => {
    setLoading(true);
    try {
      const activeTenants = await supabase.query('tenants', {
        filters: { status: 'active' }
      }, signal);
      if (!signal?.aborted) {
        setTenants(activeTenants || []);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && !signal?.aborted) {
        console.error('Error loading tenants:', error);
        setNotification({ type: 'error', message: 'Failed to load tenants' });
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedTenants.length === tenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(tenants.map(t => t.id));
    }
  };

  const handleToggleTenant = (tenantId) => {
    setSelectedTenants(prev =>
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim()) {
      setNotification({ type: 'error', message: 'Please enter an email subject' });
      return;
    }
    if (!emailBody.trim()) {
      setNotification({ type: 'error', message: 'Please enter an email message' });
      return;
    }
    if (selectedTenants.length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one tenant' });
      return;
    }

    if (!window.confirm(`Send email to ${selectedTenants.length} tenant(s)?`)) {
      return;
    }

    setSending(true);
    setNotification(null);

    try {
      // In production, this would call an Edge Function to send emails
      // For now, we'll simulate the email sending
      await new Promise(resolve => setTimeout(resolve, 1500));

      setNotification({
        type: 'success',
        message: `Email sent successfully to ${selectedTenants.length} tenant(s)!`
      });

      // Reset form
      setEmailSubject('');
      setEmailBody('');
      setSelectedTenants([]);
    } catch (error) {
      console.error('Error sending email:', error);
      setNotification({
        type: 'error',
        message: `Failed to send email: ${error.message}`
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Marketing Emails</h1>
        <p className="page-subtitle">Send bulk emails to active tenants</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification-banner ${notification.type}`} style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '8px',
          backgroundColor: notification.type === 'success' ? '#d1fae5' : '#fee2e2',
          border: notification.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
          color: notification.type === 'success' ? '#065f46' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Tenant Selection */}
        <div>
          <div style={{
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} />
                Select Recipients
              </h3>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                {selectedTenants.length} / {tenants.length}
              </span>
            </div>

            <button
              onClick={handleSelectAll}
              className="btn-secondary"
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              {selectedTenants.length === tenants.length ? 'Deselect All' : 'Select All'}
            </button>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Loader className="spinner" size={24} />
              </div>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    onClick={() => handleToggleTenant(tenant.id)}
                    style={{
                      padding: '0.875rem',
                      marginBottom: '0.5rem',
                      background: selectedTenants.includes(tenant.id) ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' : '#f8fafc',
                      border: selectedTenants.includes(tenant.id) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTenants.includes(tenant.id)}
                      onChange={() => {}}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>
                        {tenant.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {tenant.contact_email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Email Composer */}
        <div>
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={20} />
              Compose Email
            </h3>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject..."
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Message</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Enter your message..."
                rows={12}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                <AlertCircle size={18} style={{ color: '#92400e', marginTop: '0.125rem' }} />
                <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
                  <strong>Preview Recipients:</strong> {selectedTenants.length === 0 ? 'No tenants selected' : `${selectedTenants.length} tenant(s) will receive this email`}
                </div>
              </div>
            </div>

            <button
              onClick={handleSendEmail}
              disabled={sending || selectedTenants.length === 0 || !emailSubject.trim() || !emailBody.trim()}
              className="btn-primary"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '1rem'
              }}
            >
              {sending ? (
                <>
                  <Loader className="spinner" size={20} />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Send Email to {selectedTenants.length} Tenant{selectedTenants.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MESSAGES PAGE (Tenant-to-Platform Admin Messaging)
// ============================================================================
function MessagesPage({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    loadMessages(controller.signal);
    return () => controller.abort('Component unmounted');
  }, []);

  const loadMessages = async (signal) => {
    if (signal?.aborted) return;
    setLoading(true);
    try {
      // In production, this would load messages from a database table
      // For now, we'll use mock data
      const mockMessages = [
        {
          id: '1',
          tenant_name: 'FYM Compliance Limited',
          tenant_email: 'info@fymcompliancelimited.com',
          subject: 'Question about subscription upgrade',
          message: 'Hello, we would like to upgrade to the Premium plan. Can you help us with the process?',
          created_at: new Date().toISOString(),
          status: 'unread',
          replies: []
        },
        {
          id: '2',
          tenant_name: 'Acme Financial Services',
          tenant_email: 'admin@acmefinancial.com',
          subject: 'Issue with Solution 3 access',
          message: 'We are unable to access Risk & Controls module. Can you please check our permissions?',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'read',
          replies: [
            {
              from: 'Platform Admin',
              message: 'We have checked your permissions and everything looks correct. Can you try logging out and back in?',
              created_at: new Date(Date.now() - 43200000).toISOString()
            }
          ]
        }
      ];

      if (!signal?.aborted) {
        setMessages(mockMessages);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && !signal?.aborted) {
        console.error('Error loading messages:', error);
        setNotification({ type: 'error', message: 'Failed to load messages' });
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleSelectMessage = (message) => {
    setSelectedMessage(message);
    // Mark as read
    if (message.status === 'unread') {
      setMessages(prev =>
        prev.map(m => m.id === message.id ? { ...m, status: 'read' } : m)
      );
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      setNotification({ type: 'error', message: 'Please enter a reply message' });
      return;
    }

    setSending(true);
    try {
      // In production, this would save the reply to database and send email
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newReply = {
        from: 'Platform Admin',
        message: replyText,
        created_at: new Date().toISOString()
      };

      // Update the message with the new reply
      setMessages(prev =>
        prev.map(m =>
          m.id === selectedMessage.id
            ? { ...m, replies: [...(m.replies || []), newReply] }
            : m
        )
      );

      setSelectedMessage(prev => ({
        ...prev,
        replies: [...(prev.replies || []), newReply]
      }));

      setReplyText('');
      setNotification({ type: 'success', message: 'Reply sent successfully!' });
    } catch (error) {
      console.error('Error sending reply:', error);
      setNotification({ type: 'error', message: 'Failed to send reply' });
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  return (
    <div>
      <div className="page-header">
        <h1>Messages</h1>
        <p className="page-subtitle">Tenant communication and support</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification-banner ${notification.type}`} style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '8px',
          backgroundColor: notification.type === 'success' ? '#d1fae5' : '#fee2e2',
          border: notification.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
          color: notification.type === 'success' ? '#065f46' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', height: '70vh' }}>
        {/* Message List */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '1.25rem',
            borderBottom: '2px solid #e2e8f0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff'
          }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={20} />
              Inbox
              {unreadCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}>
                  {unreadCount}
                </span>
              )}
            </h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Loader className="spinner" size={32} />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <MessageSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>No messages</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => handleSelectMessage(message)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    background: selectedMessage?.id === message.id
                      ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
                      : message.status === 'unread'
                      ? '#f8fafc'
                      : '#fff',
                    transition: 'all 0.2s',
                    borderLeft: message.status === 'unread' ? '4px solid #3b82f6' : '4px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: message.status === 'unread' ? '700' : '600', color: '#1e293b', fontSize: '0.9rem' }}>
                      {message.tenant_name}
                    </div>
                    {message.status === 'unread' && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#3b82f6',
                        borderRadius: '50%'
                      }}></div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '600' }}>
                    {message.subject}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(message.created_at).toLocaleDateString('en-GB')} at {new Date(message.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Detail & Reply */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {selectedMessage ? (
            <>
              {/* Message Header */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '2px solid #e2e8f0',
                background: '#f8fafc'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{selectedMessage.subject}</h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  From: <strong>{selectedMessage.tenant_name}</strong> ({selectedMessage.tenant_email})
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  {new Date(selectedMessage.created_at).toLocaleDateString('en-GB')} at {new Date(selectedMessage.created_at).toLocaleTimeString('en-GB')}
                </div>
              </div>

              {/* Message Thread */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                {/* Original Message */}
                <div style={{
                  background: '#f8fafc',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <div style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: '1.6' }}>
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Replies */}
                {selectedMessage.replies && selectedMessage.replies.map((reply, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                      padding: '1.25rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      borderLeft: '4px solid #10b981'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '600' }}>
                      {reply.from} - {new Date(reply.created_at).toLocaleDateString('en-GB')} at {new Date(reply.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: '1.6' }}>
                      {reply.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div style={{ padding: '1.5rem', borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    marginBottom: '1rem',
                    resize: 'vertical'
                  }}
                />
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {sending ? (
                    <>
                      <Loader className="spinner" size={18} />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Send Reply</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#64748b',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <MessageSquare size={64} style={{ opacity: 0.2 }} />
              <p>Select a message to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TenantApprovalsPage({ currentUser }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showCockpit, setShowCockpit] = useState(false);
  const [cockpitData, setCockpitData] = useState(null);
  const [cockpitLoading, setCockpitLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadPendingTenants(controller.signal);
    return () => controller.abort('Component unmounted');
  }, []);

  const loadPendingTenants = async (signal) => {
    setLoading(true);
    try {
      const pendingTenants = await supabase.query('tenants', {
        filters: { status: 'pending_verification' }
      }, signal);
      if (!signal?.aborted) {
        setTenants(pendingTenants || []);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && !signal?.aborted) {
        console.error('Error loading tenants:', error);
        setNotification({ type: 'error', message: 'Failed to load pending tenants: ' + error.message });
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleApproveTenant = async (tenantId, tenantName) => {
    if (!window.confirm(`Approve tenant "${tenantName}"? This will activate their account and send a welcome email.`)) {
      return;
    }

    setApproving(tenantId);
    setNotification(null);

    try {
      // Call the approve_tenant RPC function
      const result = await supabase.client.rpc('approve_tenant', { p_tenant_id: tenantId });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to approve tenant');
      }

      const resultData = result.data;

      if (resultData && !resultData.success) {
        throw new Error(resultData.error || 'Approval failed');
      }

      // Show success notification
      setNotification({
        type: 'success',
        message: `✅ Tenant "${tenantName}" approved successfully! Welcome email sent.`
      });

      // Reload the list to remove the approved tenant
      await loadPendingTenants();

    } catch (error) {
      console.error('Error approving tenant:', error);
      setNotification({
        type: 'error',
        message: `❌ Failed to approve tenant: ${error.message}`
      });
    } finally {
      setApproving(null);
    }
  };

  const handleRejectTenant = async (tenantId, tenantName) => {
    const reason = window.prompt(`Reject tenant "${tenantName}"?\n\nPlease provide a reason (optional):`);

    // User clicked cancel
    if (reason === null) {
      return;
    }

    setRejecting(tenantId);
    setNotification(null);

    try {
      // Update tenant status to suspended with rejection reason
      await supabase.client
        .from('tenants')
        .update({
          status: 'suspended',
          rejected_reason: reason || 'No reason provided',
          rejected_at: new Date().toISOString(),
          rejected_by: currentUser.user_id
        })
        .eq('id', tenantId);

      // Show success notification
      setNotification({
        type: 'success',
        message: `Tenant "${tenantName}" has been rejected and suspended.`
      });

      // Reload the list
      await loadPendingTenants();

    } catch (error) {
      console.error('Error rejecting tenant:', error);
      setNotification({
        type: 'error',
        message: `Failed to reject tenant: ${error.message}`
      });
    } finally {
      setRejecting(null);
    }
  };

  const openTenantCockpit = async (tenant) => {
    setSelectedTenant(tenant);
    setShowCockpit(true);
    setCockpitLoading(true);

    try {
      // Load detailed tenant data including users, settings, and subscription
      const [usersResult, settingsResult] = await Promise.all([
        supabase.client
          .from('user_profiles')
          .select('*')
          .eq('tenant_id', tenant.id),
        supabase.client
          .from('tenant_settings')
          .select('*')
          .eq('tenant_id', tenant.id)
          .single()
      ]);

      setCockpitData({
        users: usersResult.data || [],
        settings: settingsResult.data || {},
        tenant: tenant
      });
    } catch (error) {
      console.error('Error loading tenant details:', error);
      setNotification({
        type: 'error',
        message: `Failed to load tenant details: ${error.message}`
      });
    } finally {
      setCockpitLoading(false);
    }
  };

  const closeTenantCockpit = () => {
    setShowCockpit(false);
    setSelectedTenant(null);
    setCockpitData(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Tenant Approvals</h1>
        <p className="page-subtitle">Review and approve pending tenant registrations</p>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`notification-banner ${notification.type}`} style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '8px',
          backgroundColor: notification.type === 'success' ? '#d1fae5' : '#fee2e2',
          border: notification.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
          color: notification.type === 'success' ? '#065f46' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader className="spinner" size={32} />
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading pending tenants...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && tenants.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '2px dashed #cbd5e1'
        }}>
          <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>All caught up!</h3>
          <p style={{ color: '#64748b', margin: 0 }}>No pending tenant approvals at this time.</p>
        </div>
      )}

      {/* Tenants Table */}
      {!loading && tenants.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization Name</th>
                <th>Regime</th>
                <th>FRN</th>
                <th>Contact Email</th>
                <th>Registered</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  onClick={() => openTenantCockpit(tenant)}
                  style={{ cursor: 'pointer' }}
                  className="tenant-row-hover"
                >
                  <td>
                    <strong>{tenant.name}</strong>
                  </td>
                  <td>{tenant.regime || '-'}</td>
                  <td>{tenant.frn || '-'}</td>
                  <td>{tenant.contact_email || '-'}</td>
                  <td>{tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('en-GB') : '-'}</td>
                  <td>
                    <StatusBadge status={tenant.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveTenant(tenant.id, tenant.name);
                        }}
                        disabled={approving === tenant.id || rejecting === tenant.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          minWidth: '110px',
                          justifyContent: 'center',
                          background: '#10b981',
                          borderColor: '#10b981'
                        }}
                      >
                        {approving === tenant.id ? (
                          <>
                            <Loader className="spinner" size={16} />
                            <span>Approving...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectTenant(tenant.id, tenant.name);
                        }}
                        disabled={approving === tenant.id || rejecting === tenant.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          minWidth: '110px',
                          justifyContent: 'center',
                          background: '#ef4444',
                          color: '#fff',
                          borderColor: '#ef4444'
                        }}
                      >
                        {rejecting === tenant.id ? (
                          <>
                            <Loader className="spinner" size={16} />
                            <span>Rejecting...</span>
                          </>
                        ) : (
                          <>
                            <X size={16} />
                            <span>Reject</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Panel */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#eff6ff',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        borderLeft: '4px solid #3b82f6'
      }}>
        <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          Approval Process
        </h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e40af' }}>
          <li>Approving a tenant will automatically activate their account</li>
          <li>A welcome email will be sent to the contact email address</li>
          <li>Users will gain immediate access to the RegIntels platform</li>
          <li>All actions are logged in the audit trail</li>
        </ul>
      </div>

      {/* Tenant Cockpit Modal */}
      {showCockpit && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
          onClick={closeTenantCockpit}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              maxWidth: '1200px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '2px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px 12px 0 0'
            }}>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>
                  {selectedTenant?.name}
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#e0e7ff', fontSize: '0.9rem' }}>
                  Tenant Management Cockpit
                </p>
              </div>
              <button
                onClick={closeTenantCockpit}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '2rem' }}>
              {cockpitLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <Loader className="spinner" size={32} />
                  <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading tenant details...</p>
                </div>
              ) : (
                <TenantCockpitContent
                  cockpitData={cockpitData}
                  currentUser={currentUser}
                  onUpdate={loadPendingTenants}
                  setNotification={setNotification}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SOLUTION 5: BOARD VIEW PAGES
// ============================================================================
function ManagementSummaryPage() {
return (
<div>
<div className="page-header">
<h1>Management Summary</h1>
<p className="page-subtitle">Executive overview of compliance posture</p>
</div>
  <div className="metrics-grid">
    <MetricCard title="Control Coverage" value="94%" status="success" />
    <MetricCard title="Open Exceptions" value="2" status="warning" />
    <MetricCard title="Overdue Tests" value="0" status="success" />
    <MetricCard title="Attestations Due" value="1" status="info" />
  </div>

  <div className="highlights-section">
    <h3>Key Highlights</h3>
    <ul>
      <li>All critical controls tested and passed in current period</li>
      <li>2 medium severity exceptions identified and under remediation</li>
      <li>Consumer Duty outcomes testing framework implemented</li>
      <li>Regulatory change PS24/3 impact assessment completed</li>
    </ul>
  </div>

  <div className="export-actions">
    <button className="btn-secondary" onClick={() => window.print()}>Export PDF</button>
    <button className="btn-secondary" onClick={() => alert('CSV export coming soon!')}>Export CSV</button>
  </div>
</div>
);
}
function RiskPosturePage() {
const risks = [
{ name: 'AML/CTF Risk', inherent: 'High', residual: 'Medium', trend: 'stable' },
{ name: 'Data Protection Risk', inherent: 'Medium', residual: 'Low', trend: 'improving' },
{ name: 'Operational Resilience', inherent: 'Medium', residual: 'Medium', trend: 'stable' }
];
return (
<div>
<div className="page-header">
<h1>Risk Posture</h1>
<p className="page-subtitle">Risk universe and residual risk assessment</p>
</div>
  <DataTable 
    headers={['Risk', 'Inherent Risk', 'Residual Risk', 'Trend']}
    rows={risks.map((r, i) => [
      r.name,
      <span key={i} className={`risk-level ${r.inherent.toLowerCase()}`}>{r.inherent}</span>,
      <span key={i} className={`risk-level ${r.residual.toLowerCase()}`}>{r.residual}</span>,
      r.trend === 'improving' ? '↓ Improving' : '→ Stable'
    ])}
  />

  <div className="export-actions">
    <button className="btn-secondary">Export PDF</button>
  </div>
</div>
);
}
function ControlEffectivenessPage() {
return (
<div>
<div className="page-header">
<h1>Control Effectiveness</h1>
<p className="page-subtitle">Control testing results and effectiveness metrics</p>
</div>
  <div className="metrics-grid">
    <MetricCard title="Controls Tested" value="28/30" status="success" />
    <MetricCard title="Pass Rate" value="96%" status="success" />
    <MetricCard title="Avg Test Cycle" value="23 days" status="info" />
  </div>

  <div className="testing-summary">
    <h3>Testing Summary</h3>
    <DataTable 
      headers={['Domain', 'Total Controls', 'Tested', 'Pass', 'Fail']}
      rows={[
        ['AML/CTF', '8', '8', '8', '0'],
        ['Data Protection', '6', '6', '6', '0'],
        ['Conflicts of Interest', '4', '4', '3', '1'],
        ['Operational Resilience', '12', '10', '10', '0']
      ]}
    />
  </div>

  <div className="export-actions">
    <button className="btn-secondary">Export PDF</button>
  </div>
</div>
);
}
function APIHealthPage() {
const endpoints = [
{ name: 'v_risk_posture_mi', url: '/api/v1/mi/risk-posture', status: 'healthy', lastCheck: '2025-01-16 09:30' },
{ name: 'v_control_effectiveness_mi', url: '/api/v1/mi/control-effectiveness', status: 'healthy', lastCheck: '2025-01-16 09:30' },
{ name: 'v_exceptions_mi', url: '/api/v1/mi/exceptions', status: 'healthy', lastCheck: '2025-01-16 09:30' }
];
return (
<div>
<div className="page-header">
<h1>API Health</h1>
<p className="page-subtitle">Tenant-scoped MI endpoint health checks</p>
</div>
  <div className="card-grid">
    {endpoints.map((ep, i) => (
      <div key={i} className="card">
        <div className="endpoint-header">
          <div>
            <div className="endpoint-status">
              <CheckCircle size={20} color="#15803D" />
              <span className="endpoint-name">{ep.name}</span>
            </div>
            <div className="endpoint-url">{ep.url}</div>
            <div className="endpoint-meta">Last checked: {ep.lastCheck}</div>
          </div>
          <button className="btn-primary">Test Now</button>
        </div>
      </div>
    ))}
  </div>
</div>
);
}
function BoardPagePlaceholder({ page }) {
return (
<div>
<div className="page-header">
<h1>{page}</h1>
<p className="page-subtitle">Board-level view (read-only)</p>
</div>
  <div className="placeholder-content">
    <BarChart3 size={48} />
    <p>This page will display {page.toLowerCase()} data from tenant MI views</p>
    <p className="placeholder-source">Data source: v_{page.toLowerCase().replace(/ /g, '_')}_mi</p>
  </div>

  <div className="export-actions">
    <button className="btn-secondary">Export PDF</button>
    <button className="btn-secondary">Export CSV</button>
  </div>
</div>
);
}
function MetricCard({ title, value, status }) {
return (
<div className="metric-card">
<div className="metric-title">{title}</div>
<div className={`metric-value ${status}`}>{value}</div>
</div>
);
}
// ============================================================================
// MODAL COMPONENTS
// ============================================================================
function Modal({ title, children, onClose }) {
return (
<div className="modal-overlay">
<div className="modal">
<div className="modal-header">
<h3>{title}</h3>
<button onClick={onClose} className="modal-close">
<X size={20} />
</button>
</div>
<div className="modal-body">
{children}
</div>
</div>
</div>
);
}
function CreatePolicyModal({ tenantId, onClose, onSuccess }) {
const [formData, setFormData] = useState({
title: '',
version: '1.0',
regulator_regime: 'API',
status: 'draft',
owner_user_id: 1,
policyFile: null
});
const [loading, setLoading] = useState(false);
const handleSubmit = async (e) => {
e.preventDefault();
setLoading(true);
try {
await createPolicy(tenantId, formData);
onSuccess();
} catch (error) {
console.error('Failed to create policy:', error);
} finally {
setLoading(false);
}
};
return (
<Modal title="Upload Policy" onClose={onClose}>
<form onSubmit={handleSubmit} className="modal-form">
<div className="form-group">
<label>Policy Title *</label>
<input
type="text"
required
value={formData.title}
onChange={(e) => setFormData({ ...formData, title: e.target.value })}
placeholder="e.g., Anti-Money Laundering Policy"
/>
</div>
    <div className="form-group">
      <label>Version</label>
      <input
        type="text"
        value={formData.version}
        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
      />
    </div>

    <div className="form-group">
      <label>Regime</label>
      <select
        value={formData.regulator_regime}
        onChange={(e) => setFormData({ ...formData, regulator_regime: e.target.value })}
      >
        <option value="API">API</option>
        <option value="SPI">SPI</option>
        <option value="SEMI">SEMI</option>
        <option value="AEMI">AEMI</option>
        <option value="CCON">CCON</option>
      </select>
    </div>

    <div className="form-group">
      <label>Policy Document</label>
      <input
        type="file"
        id="policyFileUpload"
        accept=".pdf,.doc,.docx"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            setFormData({ ...formData, policyFile: file });
          }
        }}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        className="btn-upload"
        onClick={() => document.getElementById('policyFileUpload').click()}
        style={{ width: '100%', marginTop: '0.5rem' }}
      >
        <Upload size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
        {formData.policyFile ? '✓ ' + formData.policyFile.name : 'Choose File (PDF, DOC, DOCX)'}
      </button>
    </div>

    <div className="form-actions">
      <button type="button" onClick={onClose} className="btn-ghost">
        Cancel
      </button>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Uploading...' : 'Upload Policy'}
      </button>
    </div>
  </form>
</Modal>
);
}
function CreateControlModal({ tenantId, onClose, onSuccess }) {
const [formData, setFormData] = useState({
control_code: '',
title: '',
description: '',
frequency: 'Monthly',
test_method: '',
evidence_required: '',
owner_user_id: 1
});
const [loading, setLoading] = useState(false);
const handleSubmit = async (e) => {
e.preventDefault();
setLoading(true);
try {
await createControl(tenantId, formData);
onSuccess();
} catch (error) {
console.error('Failed to create control:', error);
} finally {
setLoading(false);
}
};
return (
<Modal title="Create Control" onClose={onClose}>
<form onSubmit={handleSubmit} className="modal-form">
<div className="form-group">
<label>Control Code *</label>
<input
type="text"
required
value={formData.control_code}
onChange={(e) => setFormData({ ...formData, control_code: e.target.value })}
placeholder="e.g., AML-001"
style={{ fontFamily: 'monospace' }}
/>
</div>
    <div className="form-group">
      <label>Title *</label>
      <input
        type="text"
        required
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
    </div>

    <div className="form-group">
      <label>Description *</label>
      <textarea
        required
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
    </div>

    <div className="form-group">
      <label>Frequency</label>
      <select
        value={formData.frequency}
        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
      >
        <option value="Daily">Daily</option>
        <option value="Weekly">Weekly</option>
        <option value="Monthly">Monthly</option>
        <option value="Quarterly">Quarterly</option>
        <option value="Annually">Annually</option>
      </select>
    </div>

    <div className="form-group">
      <label>Test Method</label>
      <input
        type="text"
        value={formData.test_method}
        onChange={(e) => setFormData({ ...formData, test_method: e.target.value })}
        placeholder="e.g., Sample testing"
      />
    </div>

    <div className="form-actions">
      <button type="button" onClick={onClose} className="btn-ghost">
        Cancel
      </button>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Creating...' : 'Create Control'}
      </button>
    </div>
  </form>
</Modal>
);
}
function CreateExceptionModal({ tenantId, onClose, onSuccess }) {
const [formData, setFormData] = useState({
source_type: 'control',
title: '',
description: '',
severity: 'medium'
});
const [loading, setLoading] = useState(false);
const handleSubmit = async (e) => {
e.preventDefault();
setLoading(true);
try {
await createException(tenantId, formData);
onSuccess();
} catch (error) {
console.error('Failed to create exception:', error);
} finally {
setLoading(false);
}
};
return (
<Modal title="Create Exception" onClose={onClose}>
<form onSubmit={handleSubmit} className="modal-form">
<div className="form-group">
<label>Source Type</label>
<select
value={formData.source_type}
onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
>
<option value="control">Control</option>
<option value="incident">Incident</option>
<option value="complaint">Complaint</option>
<option value="audit">Audit</option>
</select>
</div>
    <div className="form-group">
      <label>Title *</label>
      <input
        type="text"
        required
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
    </div>

    <div className="form-group">
      <label>Description *</label>
      <textarea
        required
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
    </div>

    <div className="form-group">
      <label>Severity</label>
      <select
        value={formData.severity}
        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
    </div>

    <div className="form-actions">
      <button type="button" onClick={onClose} className="btn-ghost">
        Cancel
      </button>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Creating...' : 'Create Exception'}
      </button>
    </div>
  </form>
</Modal>
);
}
// ============================================================================
// SETUP PAGE
// ============================================================================
function SetupPage({ onClose, onComplete }) {
const [url, setUrl] = useState('');
const [key, setKey] = useState('');
const [status, setStatus] = useState(null);
const skip = () => {
if (!url || !key) {
setStatus({ success: false, message: 'Please fill in both fields' });
return;
}
setStatus({ success: true, message: 'Credentials will be saved without testing' });
};
const save = () => {
supabase.updateConfig(url, key);
onComplete();
};
return (
<div className="setup-container">
<div className="setup-header">
<h1><Database size={32} /> Supabase Database Setup</h1>
<button onClick={onClose} className="modal-close"><X size={24} /></button>
</div>
  <div className="setup-instructions">
    <h3>📋 Step-by-Step Instructions</h3>
    <ol>
      <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a> → Your Project</li>
      <li>Click <strong>Settings</strong> → <strong>API</strong></li>
      <li>Copy <strong>Project URL</strong> and <strong>anon public key</strong></li>
      <li>Paste them below</li>
    </ol>
  </div>

  <div className="setup-form">
    <div className="form-group">
      <label>Supabase Project URL *</label>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://yourproject.supabase.co"
        style={{ fontFamily: 'monospace' }}
      />
      <p className="form-hint">Example: https://abcdefgh.supabase.co</p>
    </div>

    <div className="form-group">
      <label>Supabase Anon Key *</label>
      <textarea
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="eyJhbGc..."
        style={{ fontFamily: 'monospace', minHeight: '100px' }}
      />
      <p className="form-hint">Long string starting with "eyJ..." - safe to use in browser</p>
    </div>

    {status && (
      <div className={`status-message ${status.success ? 'success' : 'error'}`}>
        {status.message}
      </div>
    )}

    <div className="form-actions">
      <button onClick={skip} disabled={!url || !key} className="btn-primary">
        Skip Test & Save
      </button>
      <button onClick={save} disabled={!status || !status.success} className="btn-success">
        Save & Continue
      </button>
    </div>
  </div>

  <div className="setup-note">
    <strong>CORS Setup:</strong> In Supabase → Authentication → URL Configuration, add Site URL: <code>https://localhost:3000</code> and Redirect URLs: <code>http://localhost:3000/*</code>
  </div>
  </div>
  );
}

// ============================================================================
// TENANT ONBOARDING WIZARD - FCA GRADE MULTI-STEP
// ============================================================================
function TenantOnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Firm Details
    firmName: '',
    tradingName: '',
    regime: 'API',
    frn: '',
    registeredAddress: '',
    country: 'United Kingdom',
    
    // Step 2: Primary Contact
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactPosition: '',
    
    // Step 3: Regulatory Details
    regulatedActivities: [],
    numberOfEmployees: '',
    hasMLRO: false,
    hasSMF: false,
    
    // Step 4: Documentation
    certificateOfIncorporation: null,
    proofOfAddress: null,
    fcaAuthorization: null,
    policyDocuments: null,
    
    // Step 5: Compliance Confirmation
    acceptTerms: false,
    confirmAccuracy: false,
    confirmFCACompliance: false
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const totalSteps = 5;

  const regimeOptions = [
    { value: 'API', label: 'Appointed Representative (API)' },
    { value: 'SPI', label: 'Small Payment Institution (SPI)' },
    { value: 'SEMI', label: 'Small E-Money Institution (SEMI)' },
    { value: 'AEMI', label: 'Authorised E-Money Institution (AEMI)' },
    { value: 'CCON', label: 'Consumer Credit (CCON)' }
  ];

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.firmName) newErrors.firmName = 'Firm name is required';
      if (!formData.regime) newErrors.regime = 'Regime is required';
      if (!formData.frn) newErrors.frn = 'FRN is required';
      if (!formData.registeredAddress) newErrors.registeredAddress = 'Address is required';
    }
    
    if (currentStep === 2) {
      if (!formData.contactName) newErrors.contactName = 'Contact name is required';
      if (!formData.contactEmail) newErrors.contactEmail = 'Email is required';
      if (formData.contactEmail && !formData.contactEmail.includes('@')) {
        newErrors.contactEmail = 'Valid email is required';
      }
      if (!formData.contactPhone) newErrors.contactPhone = 'Phone is required';
    }
    
    if (currentStep === 3) {
      if (formData.regulatedActivities.length === 0) {
        newErrors.regulatedActivities = 'Select at least one regulated activity';
      }
      if (!formData.numberOfEmployees) newErrors.numberOfEmployees = 'Number of employees required';
    }
    
    if (currentStep === 5) {
      if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept terms';
      if (!formData.confirmAccuracy) newErrors.confirmAccuracy = 'You must confirm accuracy';
      if (!formData.confirmFCACompliance) newErrors.confirmFCACompliance = 'You must confirm FCA compliance';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setLoading(true);

    try {
      // Step 1: Create tenant in Supabase
      const tenantData = {
        name: formData.firmName,
        regime: formData.regime,
        frn: formData.frn,
        status: supabase.useMockData ? 'active' : 'pending_verification'
      };

      const tenant = await supabase.insert('tenants', tenantData, null);
      console.log('Tenant created:', tenant);

      if (supabase.useMockData) {
        // Mock mode: Skip auth creation, create simple user profile
        const userData = {
          user_id: 'user-' + Date.now(),
          tenant_id: tenant.id,
          email: formData.contactEmail,
          display_name: formData.contactName,
          department: 'Management',
          role: 'Admin',
          status: 'active'
        };

        const userProfile = await supabase.insert('user_profiles', userData, tenant.id);
        console.log('User profile created (mock):', userProfile);

        alert(`Success! Your account has been created. You can now use the demo with mock data. Note: To use real Supabase features, please configure your Supabase connection in the Database Setup.`);

        // In mock mode, complete onboarding and auto-login
        setLoading(false);
        onComplete(tenant, userData);

      } else {
        // Real Supabase mode: Try auth user creation, fallback to simple signup
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
        let authUserId = null;

        try {
          const { data: authData, error: authError } = await supabase.signUp(
            formData.contactEmail,
            tempPassword,
            {
              tenant_id: tenant.id,
              display_name: formData.contactName,
              firm_name: formData.firmName
            }
          );

          if (authError) {
            console.warn('Auth signup failed, using fallback:', authError);
            // Use a generated ID instead
            authUserId = 'temp-user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          } else {
            authUserId = authData.user.id;
            console.log('Auth user created:', authData);
          }
        } catch (err) {
          console.warn('Auth signup exception, using fallback:', err);
          authUserId = 'temp-user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }

        // Step 3: Create user profile with either real or temp user ID
        const userData = {
          user_id: authUserId,
          tenant_id: tenant.id,
          email: formData.contactEmail,
          display_name: formData.contactName,
          department: 'Management',
          role: 'Admin',
          status: 'active'
        };

        const userProfile = await supabase.insert('user_profiles', userData, tenant.id);
        console.log('User profile created:', userProfile);

        // Auto-login for demo purposes
        alert(`Success! Your account has been created. You can now access the platform. Note: Full Supabase Auth integration can be enabled later.`);

        // Complete onboarding and auto-login
        setLoading(false);
        onComplete(tenant, userData);
      }

    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Onboarding failed: ' + error.message);
      setLoading(false);
    }
  };

  const toggleActivity = (activity) => {
    const current = formData.regulatedActivities;
    if (current.includes(activity)) {
      setFormData({ ...formData, regulatedActivities: current.filter(a => a !== activity) });
    } else {
      setFormData({ ...formData, regulatedActivities: [...current, activity] });
    }
  };

  return (
    <div className="onboarding-wizard">
      <div className="onboarding-header">
        <div className="onboarding-logo">
          <Shield size={48} strokeWidth={2.5} />
          <h1>RegIntels</h1>
        </div>
        <div className="onboarding-subtitle">FCA-Grade Compliance Platform</div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-steps">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="progress-step-wrapper">
              <div className={`progress-step ${step >= s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
                {step > s ? <CheckCircle size={20} /> : s}
              </div>
              <div className="progress-label">
                {s === 1 && 'Firm Details'}
                {s === 2 && 'Contact Info'}
                {s === 3 && 'Regulatory'}
                {s === 4 && 'Documents'}
                {s === 5 && 'Confirm'}
              </div>
              {s < 5 && <div className={`progress-line ${step > s ? 'completed' : ''}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="onboarding-content">
        
        {/* STEP 1: FIRM DETAILS */}
        {step === 1 && (
          <div className="onboarding-step">
            <div className="step-header">
              <h2>Firm Details</h2>
              <p>Tell us about your regulated entity</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Legal Firm Name *</label>
                <input
                  type="text"
                  value={formData.firmName}
                  onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                  placeholder="e.g., ABC Financial Services Limited"
                  className={errors.firmName ? 'error' : ''}
                />
                {errors.firmName && <span className="error-message">{errors.firmName}</span>}
              </div>

              <div className="form-group">
                <label>Trading Name</label>
                <input
                  type="text"
                  value={formData.tradingName}
                  onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                  placeholder="If different from legal name"
                />
              </div>

              <div className="form-group">
                <label>FCA Firm Reference Number (FRN) *</label>
                <input
                  type="text"
                  value={formData.frn}
                  onChange={(e) => setFormData({ ...formData, frn: e.target.value })}
                  placeholder="e.g., 123456"
                  className={errors.frn ? 'error' : ''}
                />
                {errors.frn && <span className="error-message">{errors.frn}</span>}
              </div>

              <div className="form-group">
                <label>Regulatory Regime *</label>
                <select
                  value={formData.regime}
                  onChange={(e) => setFormData({ ...formData, regime: e.target.value })}
                  className={errors.regime ? 'error' : ''}
                >
                  {regimeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.regime && <span className="error-message">{errors.regime}</span>}
              </div>

              <div className="form-group full-width">
                <label>Registered Address *</label>
                <textarea
                  value={formData.registeredAddress}
                  onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                  placeholder="Full registered address"
                  rows="3"
                  className={errors.registeredAddress ? 'error' : ''}
                />
                {errors.registeredAddress && <span className="error-message">{errors.registeredAddress}</span>}
              </div>

              <div className="form-group">
                <label>Country *</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                >
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Gibraltar">Gibraltar</option>
                  <option value="Ireland">Ireland</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PRIMARY CONTACT */}
        {step === 2 && (
          <div className="onboarding-step">
            <div className="step-header">
              <h2>Primary Contact</h2>
              <p>Who will be the main administrator?</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="e.g., John Smith"
                  className={errors.contactName ? 'error' : ''}
                />
                {errors.contactName && <span className="error-message">{errors.contactName}</span>}
              </div>

              <div className="form-group">
                <label>Position/Title *</label>
                <input
                  type="text"
                  value={formData.contactPosition}
                  onChange={(e) => setFormData({ ...formData, contactPosition: e.target.value })}
                  placeholder="e.g., Compliance Director"
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="email@firm.com"
                  className={errors.contactEmail ? 'error' : ''}
                />
                {errors.contactEmail && <span className="error-message">{errors.contactEmail}</span>}
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+44 20 1234 5678"
                  className={errors.contactPhone ? 'error' : ''}
                />
                {errors.contactPhone && <span className="error-message">{errors.contactPhone}</span>}
              </div>
            </div>

            <div className="info-box">
              <AlertCircle size={20} />
              <div>
                <strong>Email Verification Required</strong>
                <p>A verification email will be sent to this address to complete setup</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: REGULATORY DETAILS */}
        {step === 3 && (
          <div className="onboarding-step">
            <div className="step-header">
              <h2>Regulatory Details</h2>
              <p>Information about your regulated activities</p>
            </div>
            
            <div className="form-group">
              <label>Regulated Activities *</label>
              <div className="checkbox-grid">
                {['Accepting Deposits', 'Insurance Distribution', 'Investment Management', 'Payment Services', 'E-Money Services', 'Consumer Credit'].map(activity => (
                  <label key={activity} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.regulatedActivities.includes(activity)}
                      onChange={() => toggleActivity(activity)}
                    />
                    <span>{activity}</span>
                  </label>
                ))}
              </div>
              {errors.regulatedActivities && <span className="error-message">{errors.regulatedActivities}</span>}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Number of Employees *</label>
                <select
                  value={formData.numberOfEmployees}
                  onChange={(e) => setFormData({ ...formData, numberOfEmployees: e.target.value })}
                  className={errors.numberOfEmployees ? 'error' : ''}
                >
                  <option value="">Select range</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201+">201+</option>
                </select>
                {errors.numberOfEmployees && <span className="error-message">{errors.numberOfEmployees}</span>}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.hasMLRO}
                    onChange={(e) => setFormData({ ...formData, hasMLRO: e.target.checked })}
                  />
                  <span>Has appointed MLRO</span>
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.hasSMF}
                    onChange={(e) => setFormData({ ...formData, hasSMF: e.target.checked })}
                  />
                  <span>Has Senior Management Functions (SMF)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DOCUMENTATION */}
        {step === 4 && (
          <div className="onboarding-step">
            <div className="step-header">
              <h2>Documentation Upload</h2>
              <p>Upload required regulatory documents (optional for demo)</p>
            </div>

            <div className="upload-grid">
              <div className="upload-box">
                <Upload size={32} />
                <h4>Certificate of Incorporation</h4>
                <p>Companies House registration document</p>
                <input
                  type="file"
                  id="certificateOfIncorporation"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData({ ...formData, certificateOfIncorporation: file });
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <button
                  className="btn-upload"
                  type="button"
                  onClick={() => document.getElementById('certificateOfIncorporation').click()}
                >
                  {formData.certificateOfIncorporation ? '✓ ' + formData.certificateOfIncorporation.name : 'Choose File'}
                </button>
              </div>

              <div className="upload-box">
                <Upload size={32} />
                <h4>Proof of Address</h4>
                <p>Recent utility bill or bank statement</p>
                <input
                  type="file"
                  id="proofOfAddress"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData({ ...formData, proofOfAddress: file });
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <button
                  className="btn-upload"
                  type="button"
                  onClick={() => document.getElementById('proofOfAddress').click()}
                >
                  {formData.proofOfAddress ? '✓ ' + formData.proofOfAddress.name : 'Choose File'}
                </button>
              </div>

              <div className="upload-box">
                <Upload size={32} />
                <h4>FCA Authorization Letter</h4>
                <p>Part 4A permission notice</p>
                <input
                  type="file"
                  id="fcaAuthorization"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData({ ...formData, fcaAuthorization: file });
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <button
                  className="btn-upload"
                  type="button"
                  onClick={() => document.getElementById('fcaAuthorization').click()}
                >
                  {formData.fcaAuthorization ? '✓ ' + formData.fcaAuthorization.name : 'Choose File'}
                </button>
              </div>

              <div className="upload-box">
                <Upload size={32} />
                <h4>Policy Documents</h4>
                <p>AML, Complaints, COI policies</p>
                <input
                  type="file"
                  id="policyDocuments"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                      setFormData({ ...formData, policyDocuments: files });
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <button
                  className="btn-upload"
                  type="button"
                  onClick={() => document.getElementById('policyDocuments').click()}
                >
                  {formData.policyDocuments ? '✓ ' + formData.policyDocuments.length + ' file(s)' : 'Choose File(s)'}
                </button>
              </div>
            </div>

            <div className="info-box">
              <AlertCircle size={20} />
              <div>
                <strong>Document Verification</strong>
                <p>Documents will be reviewed within 24-48 hours. You can proceed without uploading for demo purposes.</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: CONFIRMATION */}
        {step === 5 && (
          <div className="onboarding-step">
            <div className="step-header">
              <h2>Compliance Confirmation</h2>
              <p>Review and confirm your application</p>
            </div>

            <div className="summary-card">
              <h3>Application Summary</h3>
              <div className="summary-grid">
                <div><strong>Firm Name:</strong> {formData.firmName}</div>
                <div><strong>FRN:</strong> {formData.frn}</div>
                <div><strong>Regime:</strong> {formData.regime}</div>
                <div><strong>Contact:</strong> {formData.contactName}</div>
                <div><strong>Email:</strong> {formData.contactEmail}</div>
                <div><strong>Employees:</strong> {formData.numberOfEmployees}</div>
              </div>
            </div>

            <div className="confirmation-checks">
              <label className={`confirmation-checkbox ${errors.acceptTerms ? 'error' : ''}`}>
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                />
                <span>I accept the Terms & Conditions and Privacy Policy *</span>
              </label>

              <label className={`confirmation-checkbox ${errors.confirmAccuracy ? 'error' : ''}`}>
                <input
                  type="checkbox"
                  checked={formData.confirmAccuracy}
                  onChange={(e) => setFormData({ ...formData, confirmAccuracy: e.target.checked })}
                />
                <span>I confirm that all information provided is accurate and complete *</span>
              </label>

              <label className={`confirmation-checkbox ${errors.confirmFCACompliance ? 'error' : ''}`}>
                <input
                  type="checkbox"
                  checked={formData.confirmFCACompliance}
                  onChange={(e) => setFormData({ ...formData, confirmFCACompliance: e.target.checked })}
                />
                <span>I confirm this firm is FCA-authorized and compliant with regulatory requirements *</span>
              </label>
            </div>

            <div className="warning-box">
              <AlertTriangle size={20} />
              <div>
                <strong>Important Notice</strong>
                <p>False or misleading information may result in account suspension and regulatory reporting.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="onboarding-footer">
        <div className="footer-buttons">
          {step > 1 && (
            <button onClick={handleBack} className="btn-secondary" disabled={loading}>
              ← Back
            </button>
          )}
          
          <div className="footer-right">
            {step < totalSteps ? (
              <button onClick={handleNext} className="btn-primary">
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader size={18} className="spinner" />
                    Processing...
                  </>
                ) : (
                  'Complete Onboarding'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
);
}
