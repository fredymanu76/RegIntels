// ============================================================================
// SAMPLE DATA SERVICE - End-to-End Testing Data
// ============================================================================
// Comprehensive sample data for testing all modules of RegIntels:
// - Regulatory Horizon (Solution 1)
// - Control Architecture (Solution 2)
// - Operational Assurance (Solution 3)
// - Issue & Breach Management (Solution 4)
// - Evidence & Audit Readiness (Solution 4B)
// - Governance & Board Assurance (Solution 5)
// ============================================================================

// ============================================================================
// TENANTS
// ============================================================================
export const SAMPLE_TENANTS = [
  {
    id: '10c39831-0918-42d7-b435-bacfab214091',
    name: 'Diamond Cube Limited',
    regime: 'FCA',
    status: 'active',
    subscription_tier: 'enterprise',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '20c39831-0918-42d7-b435-bacfab214092',
    name: 'Acme Financial Services',
    regime: 'FCA',
    status: 'active',
    subscription_tier: 'professional',
    created_at: '2025-02-15T00:00:00Z'
  },
  {
    id: '30c39831-0918-42d7-b435-bacfab214093',
    name: 'Global Invest Partners',
    regime: 'PRA',
    status: 'active',
    subscription_tier: 'enterprise',
    created_at: '2025-03-01T00:00:00Z'
  }
];

// ============================================================================
// USERS
// ============================================================================
export const SAMPLE_USERS = [
  {
    id: '1bc72979-b961-4b75-a740-7b54485a5faf',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    email: 'mark.lington@diamondcube.com',
    first_name: 'Mark',
    last_name: 'Lington',
    role: 'Admin',
    department: 'Management',
    job_title: 'Compliance Director',
    status: 'active',
    last_login: '2026-01-27T08:30:00Z'
  },
  {
    id: '2bc72979-b961-4b75-a740-7b54485a5fa2',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    email: 'sarah.chen@diamondcube.com',
    first_name: 'Sarah',
    last_name: 'Chen',
    role: 'Compliance',
    department: 'Compliance',
    job_title: 'Senior Compliance Officer',
    status: 'active',
    last_login: '2026-01-26T16:45:00Z'
  },
  {
    id: '3bc72979-b961-4b75-a740-7b54485a5fa3',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    email: 'james.wilson@diamondcube.com',
    first_name: 'James',
    last_name: 'Wilson',
    role: 'Board',
    department: 'Board',
    job_title: 'Non-Executive Director',
    status: 'active',
    last_login: '2026-01-25T10:00:00Z'
  }
];

// ============================================================================
// REGULATORY CHANGES (for Regulatory Horizon)
// ============================================================================
export const SAMPLE_REG_CHANGES = [
  {
    id: 1,
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    source: 'FCA',
    title: 'Consumer Duty - Board Reporting Requirements (PS26/1)',
    summary: 'Final rules requiring firms to submit annual board reports on consumer outcomes.',
    published_at: '2026-01-15',
    effective_date: '2026-07-31',
    status: 'in_review',
    impact_rating: 'high',
    materiality: 'high',
    affected_controls: 8,
    signoff_required: true,
    signoff_status: 'pending'
  },
  {
    id: 2,
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    source: 'FCA',
    title: 'Operational Resilience - Third Party Risk Management (CP26/2)',
    summary: 'Enhanced requirements for managing critical third-party providers.',
    published_at: '2026-01-20',
    effective_date: '2026-12-31',
    status: 'pending',
    impact_rating: 'high',
    materiality: 'high',
    affected_controls: 12,
    signoff_required: true,
    signoff_status: 'pending'
  },
  {
    id: 3,
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    source: 'PRA',
    title: 'Climate Risk Stress Testing (SS1/26)',
    summary: 'New supervisory statement on climate-related financial risk stress testing.',
    published_at: '2026-01-18',
    effective_date: '2026-06-30',
    status: 'in_review',
    impact_rating: 'high',
    materiality: 'high',
    affected_controls: 6,
    signoff_required: true,
    signoff_status: 'signed'
  },
  {
    id: 4,
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    source: 'FCA',
    title: 'AI and Machine Learning Guidance (FG26/1)',
    summary: 'Guidance on responsible use of AI/ML in customer-facing processes.',
    published_at: '2026-01-22',
    effective_date: '2026-04-01',
    status: 'pending',
    impact_rating: 'medium',
    materiality: 'medium',
    affected_controls: 4,
    signoff_required: false,
    signoff_status: null
  },
  {
    id: 5,
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    source: 'FCA',
    title: 'AML Transaction Monitoring (PS26/3)',
    summary: 'Updated requirements for transaction monitoring and SAR reporting.',
    published_at: '2026-01-25',
    effective_date: '2026-09-30',
    status: 'pending',
    impact_rating: 'high',
    materiality: 'high',
    affected_controls: 10,
    signoff_required: true,
    signoff_status: 'pending'
  },
  {
    id: 6,
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    source: 'CBI',
    title: 'Cross-Industry Outsourcing Guidance',
    summary: 'Updated guidance on outsourcing arrangements for Irish-regulated firms.',
    published_at: '2026-01-16',
    effective_date: '2026-07-01',
    status: 'actioned',
    impact_rating: 'medium',
    materiality: 'medium',
    affected_controls: 5,
    signoff_required: false,
    signoff_status: null
  }
];

// ============================================================================
// CONTROLS (for Control Architecture)
// ============================================================================
export const SAMPLE_CONTROLS = [
  {
    id: 'CTRL-001',
    control_id: 'CTRL-001',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    control_title: 'Consumer Outcomes Monitoring',
    control_description: 'Regular monitoring and reporting of consumer outcomes across all product lines.',
    control_owner: 'Sarah Chen',
    control_owner_email: 'sarah.chen@diamondcube.com',
    category: 'Consumer Duty',
    frequency: 'Monthly',
    last_tested: '2026-01-15',
    next_review_date: '2026-02-15',
    effectiveness_rating: 85,
    status: 'active',
    risk_rating: 'medium',
    evidence_required: true
  },
  {
    id: 'CTRL-002',
    control_id: 'CTRL-002',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    control_title: 'Third-Party Due Diligence',
    control_description: 'Comprehensive due diligence process for all critical third-party service providers.',
    control_owner: 'Mark Lington',
    control_owner_email: 'mark.lington@diamondcube.com',
    category: 'Operational Resilience',
    frequency: 'Annual',
    last_tested: '2025-12-01',
    next_review_date: '2026-12-01',
    effectiveness_rating: 78,
    status: 'active',
    risk_rating: 'high',
    evidence_required: true
  },
  {
    id: 'CTRL-003',
    control_id: 'CTRL-003',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    control_title: 'AML Transaction Screening',
    control_description: 'Real-time screening of all transactions against sanctions and PEP lists.',
    control_owner: 'Sarah Chen',
    control_owner_email: 'sarah.chen@diamondcube.com',
    category: 'Financial Crime',
    frequency: 'Continuous',
    last_tested: '2026-01-10',
    next_review_date: '2026-04-10',
    effectiveness_rating: 92,
    status: 'active',
    risk_rating: 'high',
    evidence_required: true
  },
  {
    id: 'CTRL-004',
    control_id: 'CTRL-004',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    control_title: 'Climate Risk Assessment',
    control_description: 'Annual assessment of climate-related financial risks across portfolios.',
    control_owner: 'James Wilson',
    control_owner_email: 'james.wilson@diamondcube.com',
    category: 'Climate Risk',
    frequency: 'Annual',
    last_tested: '2025-11-15',
    next_review_date: '2026-11-15',
    effectiveness_rating: 72,
    status: 'active',
    risk_rating: 'medium',
    evidence_required: true
  },
  {
    id: 'CTRL-005',
    control_id: 'CTRL-005',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    control_title: 'Fair Value Assessment',
    control_description: 'Quarterly assessment of product fair value under Consumer Duty requirements.',
    control_owner: 'Sarah Chen',
    control_owner_email: 'sarah.chen@diamondcube.com',
    category: 'Consumer Duty',
    frequency: 'Quarterly',
    last_tested: '2026-01-05',
    next_review_date: '2026-04-05',
    effectiveness_rating: 88,
    status: 'active',
    risk_rating: 'medium',
    evidence_required: true
  },
  {
    id: 'CTRL-006',
    control_id: 'CTRL-006',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    control_title: 'Important Business Service Mapping',
    control_description: 'Mapping and tolerance setting for all important business services.',
    control_owner: 'Mark Lington',
    control_owner_email: 'mark.lington@diamondcube.com',
    category: 'Operational Resilience',
    frequency: 'Annual',
    last_tested: '2025-10-01',
    next_review_date: '2026-10-01',
    effectiveness_rating: 81,
    status: 'active',
    risk_rating: 'high',
    evidence_required: true
  },
  {
    id: 'CTRL-007',
    control_id: 'CTRL-007',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    control_title: 'Model Governance',
    control_description: 'Governance framework for AI/ML models including validation and monitoring.',
    control_owner: 'Mark Lington',
    control_owner_email: 'mark.lington@diamondcube.com',
    category: 'Model Risk',
    frequency: 'Quarterly',
    last_tested: '2025-12-15',
    next_review_date: '2026-03-15',
    effectiveness_rating: 75,
    status: 'active',
    risk_rating: 'medium',
    evidence_required: true
  },
  {
    id: 'CTRL-008',
    control_id: 'CTRL-008',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    control_title: 'Complaints Handling',
    control_description: 'Process for handling, escalating and resolving customer complaints.',
    control_owner: 'Sarah Chen',
    control_owner_email: 'sarah.chen@diamondcube.com',
    category: 'Consumer Duty',
    frequency: 'Continuous',
    last_tested: '2026-01-20',
    next_review_date: '2026-04-20',
    effectiveness_rating: 90,
    status: 'active',
    risk_rating: 'low',
    evidence_required: true
  }
];

// ============================================================================
// POLICIES (for Operational Assurance)
// ============================================================================
export const SAMPLE_POLICIES = [
  {
    id: 'POL-001',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    title: 'Consumer Duty Policy',
    description: 'Overarching policy governing Consumer Duty compliance across all business areas.',
    category: 'Consumer Duty',
    version: '2.1',
    status: 'approved',
    owner: 'Sarah Chen',
    approved_by: 'Mark Lington',
    approved_date: '2025-12-01',
    next_review_date: '2026-12-01',
    linked_controls: ['CTRL-001', 'CTRL-005', 'CTRL-008']
  },
  {
    id: 'POL-002',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    title: 'Operational Resilience Framework',
    description: 'Framework for identifying, mapping and testing important business services.',
    category: 'Operational Resilience',
    version: '1.5',
    status: 'approved',
    owner: 'Mark Lington',
    approved_by: 'James Wilson',
    approved_date: '2025-11-15',
    next_review_date: '2026-11-15',
    linked_controls: ['CTRL-002', 'CTRL-006']
  },
  {
    id: 'POL-003',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    title: 'Anti-Money Laundering Policy',
    description: 'Comprehensive AML policy including CDD, transaction monitoring and SAR procedures.',
    category: 'Financial Crime',
    version: '3.0',
    status: 'approved',
    owner: 'Sarah Chen',
    approved_by: 'Mark Lington',
    approved_date: '2026-01-10',
    next_review_date: '2027-01-10',
    linked_controls: ['CTRL-003']
  },
  {
    id: 'POL-004',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    title: 'Climate Risk Management Policy',
    description: 'Policy for managing climate-related financial risks in line with TCFD recommendations.',
    category: 'Climate Risk',
    version: '1.2',
    status: 'under_review',
    owner: 'James Wilson',
    approved_by: null,
    approved_date: null,
    next_review_date: '2026-06-30',
    linked_controls: ['CTRL-004']
  }
];

// ============================================================================
// ATTESTATIONS (for Operational Assurance)
// ============================================================================
export const SAMPLE_ATTESTATIONS = [
  {
    id: 'ATT-001',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    control_id: 'CTRL-001',
    control_title: 'Consumer Outcomes Monitoring',
    attestor: 'Sarah Chen',
    attestor_email: 'sarah.chen@diamondcube.com',
    period: 'Q4 2025',
    status: 'approved',
    confidence_score: 92,
    submitted_at: '2026-01-05T14:30:00Z',
    approved_at: '2026-01-06T10:00:00Z',
    approved_by: 'Mark Lington',
    evidence_attached: true,
    comments: 'All consumer outcome metrics within tolerance. No material issues identified.'
  },
  {
    id: 'ATT-002',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    control_id: 'CTRL-002',
    control_title: 'Third-Party Due Diligence',
    attestor: 'Mark Lington',
    attestor_email: 'mark.lington@diamondcube.com',
    period: 'Q4 2025',
    status: 'approved',
    confidence_score: 85,
    submitted_at: '2026-01-08T16:00:00Z',
    approved_at: '2026-01-09T11:30:00Z',
    approved_by: 'James Wilson',
    evidence_attached: true,
    comments: 'Annual reviews completed for all critical vendors. 2 minor findings being remediated.'
  },
  {
    id: 'ATT-003',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    control_id: 'CTRL-003',
    control_title: 'AML Transaction Screening',
    attestor: 'Sarah Chen',
    attestor_email: 'sarah.chen@diamondcube.com',
    period: 'Q4 2025',
    status: 'approved',
    confidence_score: 95,
    submitted_at: '2026-01-10T09:00:00Z',
    approved_at: '2026-01-10T15:00:00Z',
    approved_by: 'Mark Lington',
    evidence_attached: true,
    comments: 'Screening effective with 99.8% accuracy. False positive rate reduced by 15%.'
  },
  {
    id: 'ATT-004',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    control_id: 'CTRL-004',
    control_title: 'Climate Risk Assessment',
    attestor: 'James Wilson',
    attestor_email: 'james.wilson@diamondcube.com',
    period: 'Q4 2025',
    status: 'pending',
    confidence_score: 78,
    submitted_at: '2026-01-25T11:00:00Z',
    approved_at: null,
    approved_by: null,
    evidence_attached: true,
    comments: 'Assessment completed. Some data gaps in Scope 3 emissions. Remediation in progress.'
  },
  {
    id: 'ATT-005',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    control_id: 'CTRL-005',
    control_title: 'Fair Value Assessment',
    attestor: 'Sarah Chen',
    attestor_email: 'sarah.chen@diamondcube.com',
    period: 'Q4 2025',
    status: 'approved',
    confidence_score: 88,
    submitted_at: '2026-01-12T14:00:00Z',
    approved_at: '2026-01-13T09:30:00Z',
    approved_by: 'Mark Lington',
    evidence_attached: true,
    comments: 'All products assessed. One product flagged for pricing review.'
  }
];

// ============================================================================
// EXCEPTIONS (for Issue & Breach Management)
// ============================================================================
export const SAMPLE_EXCEPTIONS = [
  {
    id: 'EXC-001',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    title: 'Delayed Third-Party Risk Assessment',
    description: 'Annual risk assessment for cloud provider XYZ Corp not completed within scheduled timeframe.',
    category: 'Control Failure',
    severity: 'high',
    status: 'open',
    control_id: 'CTRL-002',
    owner: 'Mark Lington',
    identified_date: '2026-01-15',
    due_date: '2026-02-15',
    root_cause: 'Resource constraints during Q4',
    remediation_plan: 'Engage external consultant to complete assessment by Feb 10.',
    business_impact: 'Potential regulatory exposure if unaddressed',
    materiality_score: 72,
    recurrence_count: 0
  },
  {
    id: 'EXC-002',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    title: 'Consumer Complaints Spike',
    description: 'Complaints related to fee disclosures increased by 35% in December 2025.',
    category: 'Consumer Outcome',
    severity: 'medium',
    status: 'in_progress',
    control_id: 'CTRL-008',
    owner: 'Sarah Chen',
    identified_date: '2026-01-10',
    due_date: '2026-02-28',
    root_cause: 'Fee disclosure email formatting issue affecting mobile users',
    remediation_plan: 'Update email template and re-send to affected customers.',
    business_impact: 'Potential reputational impact and compensation costs',
    materiality_score: 58,
    recurrence_count: 0
  },
  {
    id: 'EXC-003',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    title: 'Model Validation Overdue',
    description: 'Credit risk model validation past due by 3 months.',
    category: 'Model Risk',
    severity: 'high',
    status: 'open',
    control_id: 'CTRL-007',
    owner: 'Mark Lington',
    identified_date: '2026-01-20',
    due_date: '2026-03-31',
    root_cause: 'Complexity of model changes requiring extended validation',
    remediation_plan: 'Model Risk team engaged. Validation to complete Q1 2026.',
    business_impact: 'Model may be operating outside approved parameters',
    materiality_score: 68,
    recurrence_count: 1
  },
  {
    id: 'EXC-004',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    title: 'AML Alert Backlog',
    description: 'Backlog of 150 AML alerts exceeding 5-day SLA.',
    category: 'Financial Crime',
    severity: 'high',
    status: 'in_progress',
    control_id: 'CTRL-003',
    owner: 'Sarah Chen',
    identified_date: '2026-01-22',
    due_date: '2026-02-05',
    root_cause: 'Staff shortage during holiday period',
    remediation_plan: 'Temporary staff engaged. Daily tracking implemented.',
    business_impact: 'Regulatory breach risk if not cleared promptly',
    materiality_score: 85,
    recurrence_count: 2
  },
  {
    id: 'EXC-005',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    title: 'IBS Tolerance Breach',
    description: 'Payment processing service exceeded 4-hour recovery tolerance during incident.',
    category: 'Operational Resilience',
    severity: 'high',
    status: 'closed',
    control_id: 'CTRL-006',
    owner: 'Mark Lington',
    identified_date: '2026-01-05',
    due_date: '2026-01-20',
    closed_date: '2026-01-18',
    root_cause: 'Failover to backup site delayed by configuration error',
    remediation_plan: 'Configuration corrected. Additional DR testing scheduled.',
    business_impact: 'Customer transactions delayed; no financial loss',
    materiality_score: 75,
    recurrence_count: 0
  }
];

// ============================================================================
// AUDIT TRAIL ENTRIES
// ============================================================================
export const SAMPLE_AUDIT_TRAIL = [
  {
    id: 'AUD-001',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    action: 'CREATE',
    entity_type: 'exception',
    entity_id: 'EXC-004',
    description: 'Exception created: AML Alert Backlog',
    user: 'Sarah Chen',
    user_email: 'sarah.chen@diamondcube.com',
    timestamp: '2026-01-22T09:15:00Z',
    ip_address: '192.168.1.100'
  },
  {
    id: 'AUD-002',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    action: 'APPROVE',
    entity_type: 'attestation',
    entity_id: 'ATT-003',
    description: 'Attestation approved: AML Transaction Screening Q4 2025',
    user: 'Mark Lington',
    user_email: 'mark.lington@diamondcube.com',
    timestamp: '2026-01-10T15:00:00Z',
    ip_address: '192.168.1.105'
  },
  {
    id: 'AUD-003',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    action: 'UPDATE',
    entity_type: 'control',
    entity_id: 'CTRL-001',
    description: 'Control effectiveness rating updated from 82 to 85',
    user: 'Sarah Chen',
    user_email: 'sarah.chen@diamondcube.com',
    timestamp: '2026-01-15T14:30:00Z',
    ip_address: '192.168.1.100'
  },
  {
    id: 'AUD-004',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    action: 'SIGNOFF',
    entity_type: 'regulatory_change',
    entity_id: '3',
    description: 'Regulatory change signed off: Climate Risk Stress Testing',
    user: 'James Wilson',
    user_email: 'james.wilson@diamondcube.com',
    timestamp: '2026-01-19T10:00:00Z',
    ip_address: '192.168.1.110'
  },
  {
    id: 'AUD-005',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    action: 'CLOSE',
    entity_type: 'exception',
    entity_id: 'EXC-005',
    description: 'Exception closed: IBS Tolerance Breach',
    user: 'Mark Lington',
    user_email: 'mark.lington@diamondcube.com',
    timestamp: '2026-01-18T16:45:00Z',
    ip_address: '192.168.1.105'
  }
];

// ============================================================================
// DECISIONS (for Decision Register)
// ============================================================================
export const SAMPLE_DECISIONS = [
  {
    id: 'DEC-001',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    title: 'Approve Temporary AML Threshold Increase',
    description: 'Approval to temporarily increase AML monitoring threshold from £10k to £15k for legacy system migration.',
    decision_type: 'Risk Acceptance',
    status: 'approved',
    requested_by: 'Sarah Chen',
    approved_by: 'Mark Lington',
    approval_date: '2026-01-15',
    expiry_date: '2026-03-31',
    risk_assessment: 'Medium risk with compensating controls in place',
    conditions: ['Daily manual review of transactions £10k-£15k', 'Weekly reporting to MLRO'],
    linked_controls: ['CTRL-003'],
    linked_exceptions: ['EXC-004']
  },
  {
    id: 'DEC-002',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    title: 'Defer Model Validation to Q1 2026',
    description: 'Decision to extend model validation deadline due to complexity of changes.',
    decision_type: 'Timeline Extension',
    status: 'approved',
    requested_by: 'Mark Lington',
    approved_by: 'James Wilson',
    approval_date: '2026-01-20',
    expiry_date: '2026-03-31',
    risk_assessment: 'Acceptable with enhanced monitoring',
    conditions: ['Weekly model performance reporting', 'Escalation if metrics deteriorate'],
    linked_controls: ['CTRL-007'],
    linked_exceptions: ['EXC-003']
  },
  {
    id: 'DEC-003',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    title: 'Accept Residual Climate Data Gap',
    description: 'Decision to accept current Scope 3 emissions data limitations pending methodology improvement.',
    decision_type: 'Risk Acceptance',
    status: 'pending',
    requested_by: 'James Wilson',
    approved_by: null,
    approval_date: null,
    expiry_date: '2026-12-31',
    risk_assessment: 'Low immediate risk; regulatory pressure increasing',
    conditions: ['Quarterly progress updates on data sourcing', 'External disclosure to note limitations'],
    linked_controls: ['CTRL-004'],
    linked_exceptions: []
  }
];

// ============================================================================
// APPROVALS (for Approvals Board)
// ============================================================================
export const SAMPLE_APPROVALS = [
  {
    id: 'APR-001',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    item_type: 'attestation',
    item_id: 'ATT-004',
    title: 'Climate Risk Assessment Attestation',
    description: 'Approval requested for Q4 2025 climate risk control attestation',
    status: 'pending',
    requested_by: 'James Wilson',
    requested_date: '2026-01-25',
    assigned_to: 'Mark Lington',
    priority: 'high',
    due_date: '2026-01-31',
    comments: 'Data gaps noted - please review evidence before approval'
  },
  {
    id: 'APR-002',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    item_type: 'decision',
    item_id: 'DEC-003',
    title: 'Accept Climate Data Gap Decision',
    description: 'Board approval required for accepting Scope 3 data limitations',
    status: 'pending',
    requested_by: 'James Wilson',
    requested_date: '2026-01-26',
    assigned_to: 'Board',
    priority: 'medium',
    due_date: '2026-02-15',
    comments: 'Requires board discussion at February meeting'
  },
  {
    id: 'APR-003',
    tenant_id: '10c39831-0918-42d7-b435-bacfab214091',
    item_type: 'exception',
    item_id: 'EXC-001',
    title: 'Third-Party Assessment Extension',
    description: 'Approval to extend deadline for XYZ Corp risk assessment',
    status: 'approved',
    requested_by: 'Mark Lington',
    requested_date: '2026-01-16',
    assigned_to: 'James Wilson',
    approved_date: '2026-01-17',
    priority: 'high',
    due_date: '2026-01-20',
    comments: 'Approved with condition that interim controls are documented'
  }
];

// ============================================================================
// BOARD METRICS (for Governance & Board Assurance)
// ============================================================================
export const SAMPLE_BOARD_METRICS = {
  overall_compliance_score: 84,
  regulatory_horizon_items: 6,
  high_priority_changes: 4,
  control_effectiveness_avg: 82.6,
  attestation_completion_rate: 87,
  open_exceptions: 4,
  high_severity_exceptions: 3,
  overdue_actions: 2,
  upcoming_deadlines: [
    { item: 'Consumer Duty Board Report', date: '2026-07-31', daysRemaining: 185 },
    { item: 'AI/ML Guidance Implementation', date: '2026-04-01', daysRemaining: 64 },
    { item: 'Climate Stress Testing', date: '2026-06-30', daysRemaining: 154 }
  ],
  risk_trend: 'stable',
  key_risks: [
    { risk: 'Operational Resilience - Third Party', score: 78, trend: 'increasing' },
    { risk: 'Consumer Duty Compliance', score: 85, trend: 'stable' },
    { risk: 'AML Control Effectiveness', score: 72, trend: 'improving' }
  ]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all sample data for a tenant
 */
export function getSampleDataForTenant(tenantId = '10c39831-0918-42d7-b435-bacfab214091') {
  return {
    tenant: SAMPLE_TENANTS.find(t => t.id === tenantId),
    users: SAMPLE_USERS.filter(u => u.tenant_id === tenantId),
    reg_changes: SAMPLE_REG_CHANGES.filter(r => r.tenant_id === tenantId),
    controls: SAMPLE_CONTROLS.filter(c => c.tenant_id === tenantId),
    policies: SAMPLE_POLICIES.filter(p => p.tenant_id === tenantId),
    attestations: SAMPLE_ATTESTATIONS.filter(a => a.tenant_id === tenantId),
    exceptions: SAMPLE_EXCEPTIONS.filter(e => e.tenant_id === tenantId),
    audit_trail: SAMPLE_AUDIT_TRAIL.filter(a => a.tenant_id === tenantId),
    decisions: SAMPLE_DECISIONS.filter(d => d.tenant_id === tenantId),
    approvals: SAMPLE_APPROVALS.filter(a => a.tenant_id === tenantId),
    board_metrics: SAMPLE_BOARD_METRICS
  };
}

/**
 * Get summary statistics
 */
export function getSampleStatistics(tenantId = '10c39831-0918-42d7-b435-bacfab214091') {
  const data = getSampleDataForTenant(tenantId);

  return {
    regulatory: {
      total: data.reg_changes.length,
      pending: data.reg_changes.filter(r => r.status === 'pending').length,
      in_review: data.reg_changes.filter(r => r.status === 'in_review').length,
      actioned: data.reg_changes.filter(r => r.status === 'actioned').length,
      high_impact: data.reg_changes.filter(r => r.impact_rating === 'high').length
    },
    controls: {
      total: data.controls.length,
      active: data.controls.filter(c => c.status === 'active').length,
      avg_effectiveness: Math.round(data.controls.reduce((sum, c) => sum + c.effectiveness_rating, 0) / data.controls.length)
    },
    attestations: {
      total: data.attestations.length,
      approved: data.attestations.filter(a => a.status === 'approved').length,
      pending: data.attestations.filter(a => a.status === 'pending').length,
      avg_confidence: Math.round(data.attestations.reduce((sum, a) => sum + a.confidence_score, 0) / data.attestations.length)
    },
    exceptions: {
      total: data.exceptions.length,
      open: data.exceptions.filter(e => e.status === 'open').length,
      in_progress: data.exceptions.filter(e => e.status === 'in_progress').length,
      closed: data.exceptions.filter(e => e.status === 'closed').length,
      high_severity: data.exceptions.filter(e => e.severity === 'high').length
    },
    approvals: {
      pending: data.approvals.filter(a => a.status === 'pending').length,
      approved: data.approvals.filter(a => a.status === 'approved').length
    }
  };
}

export default {
  SAMPLE_TENANTS,
  SAMPLE_USERS,
  SAMPLE_REG_CHANGES,
  SAMPLE_CONTROLS,
  SAMPLE_POLICIES,
  SAMPLE_ATTESTATIONS,
  SAMPLE_EXCEPTIONS,
  SAMPLE_AUDIT_TRAIL,
  SAMPLE_DECISIONS,
  SAMPLE_APPROVALS,
  SAMPLE_BOARD_METRICS,
  getSampleDataForTenant,
  getSampleStatistics
};
