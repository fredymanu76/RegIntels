import React from 'react';
import { AlertTriangle, TrendingUp, Shield } from 'lucide-react';

/**
 * ImpactScoreCard Component
 *
 * Displays the RegIntels Impact Score (0-100) with color-coded risk bands
 * and primary driver explanation.
 *
 * Props:
 * - score: number (0-100)
 * - riskBand: 'CRITICAL' | 'HIGH' | 'MODERATE'
 * - primaryDriver: string
 * - changeTitle: string
 * - compact: boolean (optional, for small card view)
 */
const ImpactScoreCard = ({
  score,
  riskBand,
  primaryDriver,
  changeTitle,
  compact = false,
  onClick = null
}) => {
  // Determine color based on risk band
  const getRiskColor = () => {
    switch (riskBand) {
      case 'CRITICAL':
        return {
          bg: '#fee2e2',
          border: '#dc2626',
          text: '#991b1b',
          badge: '#dc2626'
        };
      case 'HIGH':
        return {
          bg: '#fef3c7',
          border: '#f59e0b',
          text: '#92400e',
          badge: '#f59e0b'
        };
      case 'MODERATE':
        return {
          bg: '#dcfce7',
          border: '#16a34a',
          text: '#166534',
          badge: '#16a34a'
        };
      default:
        return {
          bg: '#f3f4f6',
          border: '#9ca3af',
          text: '#374151',
          badge: '#9ca3af'
        };
    }
  };

  const colors = getRiskColor();

  // Icon based on risk band
  const RiskIcon = () => {
    switch (riskBand) {
      case 'CRITICAL':
        return <AlertTriangle size={20} color={colors.badge} />;
      case 'HIGH':
        return <TrendingUp size={20} color={colors.badge} />;
      default:
        return <Shield size={20} color={colors.badge} />;
    }
  };

  // Compact view (for lists)
  if (compact) {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '6px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.bg,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <RiskIcon />
        <span style={{ fontWeight: '700', fontSize: '16px', color: colors.text }}>
          {score}
        </span>
        <span style={{ fontSize: '12px', color: colors.text, opacity: 0.8 }}>
          / 100
        </span>
      </div>
    );
  }

  // Full card view
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '20px',
        backgroundColor: colors.bg,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: colors.text, opacity: 0.7, marginBottom: '4px' }}>
            Impact Score
          </div>
          {changeTitle && (
            <div style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>
              {changeTitle}
            </div>
          )}
        </div>
        <div
          style={{
            backgroundColor: colors.badge,
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {riskBand}
        </div>
      </div>

      {/* Score Display */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
        <RiskIcon />
        <span style={{ fontSize: '48px', fontWeight: '800', color: colors.text, lineHeight: '1' }}>
          {score}
        </span>
        <span style={{ fontSize: '20px', color: colors.text, opacity: 0.6 }}>
          / 100
        </span>
      </div>

      {/* Score Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${score}%`,
            height: '100%',
            backgroundColor: colors.badge,
            transition: 'width 0.5s ease'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: colors.text, opacity: 0.5 }}>
          <span>0</span>
          <span>30</span>
          <span>60</span>
          <span>100</span>
        </div>
      </div>

      {/* Primary Driver */}
      {primaryDriver && (
        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(0,0,0,0.05)',
          borderRadius: '8px',
          borderLeft: `4px solid ${colors.badge}`
        }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: colors.text, opacity: 0.7, marginBottom: '4px' }}>
            Primary Driver
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: colors.text }}>
            {primaryDriver}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpactScoreCard;
