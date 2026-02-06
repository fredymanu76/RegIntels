import React from 'react';
import { Activity, AlertCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

/**
 * ControlDriftBadge Component
 *
 * Displays control drift status with visual indicators
 *
 * Props:
 * - driftStatus: 'STABLE' | 'EMERGING_DRIFT' | 'MATERIAL_DRIFT' | 'CRITICAL_DRIFT'
 * - driftScore: number (0-100)
 * - driftDriver: string
 * - compact: boolean (for small inline display)
 * - showScore: boolean (show drift score)
 */
const ControlDriftBadge = ({
  driftStatus,
  driftScore,
  driftDriver,
  compact = false,
  showScore = true,
  onClick = null
}) => {
  // Get drift configuration
  const getDriftConfig = () => {
    switch (driftStatus) {
      case 'CRITICAL_DRIFT':
        return {
          label: 'Critical Drift',
          shortLabel: 'Critical',
          color: '#F97316',
          bg: '#16365F',
          icon: AlertCircle,
          pulse: true
        };
      case 'MATERIAL_DRIFT':
        return {
          label: 'Material Drift',
          shortLabel: 'Material',
          color: '#F97316',
          bg: '#16365F',
          icon: AlertTriangle,
          pulse: false
        };
      case 'EMERGING_DRIFT':
        return {
          label: 'Emerging Drift',
          shortLabel: 'Emerging',
          color: '#F97316',
          bg: '#16365F',
          icon: Clock,
          pulse: false
        };
      case 'STABLE':
      default:
        return {
          label: 'Stable',
          shortLabel: 'Stable',
          color: '#F97316',
          bg: '#16365F',
          icon: CheckCircle,
          pulse: false
        };
    }
  };

  const config = getDriftConfig();
  const Icon = config.icon;

  // Compact badge (for inline use)
  if (compact) {
    return (
      <span
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '12px',
          backgroundColor: config.bg,
          border: `1px solid ${config.color}`,
          fontSize: '12px',
          fontWeight: '600',
          color: config.color,
          cursor: onClick ? 'pointer' : 'default',
          animation: config.pulse ? 'pulse 2s infinite' : 'none'
        }}
      >
        <Icon size={14} />
        <span>{config.shortLabel}</span>
        {showScore && <span style={{ opacity: 0.7 }}>({driftScore})</span>}
      </span>
    );
  }

  // Full badge with details
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${config.color}`,
        borderRadius: '10px',
        padding: '16px',
        backgroundColor: config.bg,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        animation: config.pulse ? 'pulse 2s infinite' : 'none'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <Icon size={20} color={config.color} />
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: config.color }}>
            {config.label}
          </div>
          {showScore && (
            <div style={{ fontSize: '20px', fontWeight: '800', color: config.color, marginTop: '2px' }}>
              Drift Score: {driftScore}/100
            </div>
          )}
        </div>
      </div>

      {/* Drift Bar */}
      {showScore && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${driftScore}%`,
              height: '100%',
              backgroundColor: config.color,
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      )}

      {/* Driver */}
      {driftDriver && (
        <div style={{
          fontSize: '12px',
          color: config.color,
          padding: '8px 12px',
          backgroundColor: 'rgba(0,0,0,0.05)',
          borderRadius: '6px',
          borderLeft: `3px solid ${config.color}`
        }}>
          <span style={{ opacity: 0.7, marginRight: '6px' }}>Driver:</span>
          <span style={{ fontWeight: '600' }}>{driftDriver}</span>
        </div>
      )}
    </div>
  );
};

// Add pulse animation to global styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
  `;
  document.head.appendChild(style);
}

export default ControlDriftBadge;
