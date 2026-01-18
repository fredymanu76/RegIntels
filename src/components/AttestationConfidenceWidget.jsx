import React from 'react';
import { Award, AlertCircle, TrendingDown, Shield } from 'lucide-react';

/**
 * AttestationConfidenceWidget Component
 *
 * Displays attestation confidence score with visual indicators
 *
 * Props:
 * - confidenceScore: number (0-100)
 * - confidenceBand: 'HIGH_CONFIDENCE' | 'MEDIUM_CONFIDENCE' | 'LOW_CONFIDENCE'
 * - confidenceDriver: string
 * - attestorRole: string
 * - compact: boolean
 */
const AttestationConfidenceWidget = ({
  confidenceScore,
  confidenceBand,
  confidenceDriver,
  attestorRole,
  compact = false,
  onClick = null
}) => {
  // Get confidence configuration
  const getConfidenceConfig = () => {
    switch (confidenceBand) {
      case 'HIGH_CONFIDENCE':
        return {
          label: 'High Confidence',
          shortLabel: 'High',
          color: '#16a34a',
          bg: '#dcfce7',
          icon: Award,
          description: 'Strong attestation profile'
        };
      case 'MEDIUM_CONFIDENCE':
        return {
          label: 'Medium Confidence',
          shortLabel: 'Medium',
          color: '#f59e0b',
          bg: '#fef3c7',
          icon: Shield,
          description: 'Acceptable with monitoring'
        };
      case 'LOW_CONFIDENCE':
      default:
        return {
          label: 'Low Confidence',
          shortLabel: 'Low',
          color: '#dc2626',
          bg: '#fee2e2',
          icon: AlertCircle,
          description: 'Requires attention'
        };
    }
  };

  const config = getConfidenceConfig();
  const Icon = config.icon;

  // Compact view (for lists/cards)
  if (compact) {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '8px',
          backgroundColor: config.bg,
          border: `1px solid ${config.color}`,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        <Icon size={16} color={config.color} />
        <span style={{ fontWeight: '700', fontSize: '14px', color: config.color }}>
          {confidenceScore}%
        </span>
        <span style={{ fontSize: '11px', color: config.color, opacity: 0.8 }}>
          {config.shortLabel}
        </span>
      </div>
    );
  }

  // Full widget view (for dashboard/detail pages)
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${config.color}`,
        borderRadius: '12px',
        padding: '20px',
        backgroundColor: config.bg,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: config.color, opacity: 0.7 }}>
          Attestation Confidence
        </div>
        <div
          style={{
            backgroundColor: config.color,
            color: 'white',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {config.label}
        </div>
      </div>

      {/* Confidence Gauge */}
      <div style={{ marginBottom: '20px' }}>
        {/* Circular gauge */}
        <div style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          margin: '0 auto 16px'
        }}>
          {/* Background circle */}
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={config.color}
              strokeWidth="12"
              strokeDasharray={`${(confidenceScore / 100) * 314} 314`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          {/* Score text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <Icon size={24} color={config.color} style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '28px', fontWeight: '800', color: config.color }}>
              {confidenceScore}
            </div>
            <div style={{ fontSize: '12px', color: config.color, opacity: 0.7 }}>
              / 100
            </div>
          </div>
        </div>

        {/* Linear bar */}
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${confidenceScore}%`,
            height: '100%',
            backgroundColor: config.color,
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Attestor Role */}
        {attestorRole && (
          <div style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', color: config.color, opacity: 0.7 }}>
              Attestor Role
            </span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: config.color }}>
              {attestorRole}
            </span>
          </div>
        )}

        {/* Confidence Driver */}
        {confidenceDriver && (
          <div style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: '8px',
            borderLeft: `4px solid ${config.color}`
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: config.color, opacity: 0.7, marginBottom: '4px' }}>
              Primary Factor
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: config.color }}>
              {confidenceDriver}
            </div>
          </div>
        )}

        {/* Description */}
        <div style={{ fontSize: '12px', color: config.color, opacity: 0.8, textAlign: 'center', fontStyle: 'italic' }}>
          {config.description}
        </div>
      </div>
    </div>
  );
};

export default AttestationConfidenceWidget;
