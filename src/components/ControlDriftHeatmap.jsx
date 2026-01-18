import React, { useState } from 'react';
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react';

/**
 * ControlDriftHeatmap Component
 *
 * Displays control drift status across all controls in a heatmap visualization
 *
 * Props:
 * - driftData: Array of drift index objects from v_control_drift_index
 * - onControlClick: callback when a control is clicked
 */
const ControlDriftHeatmap = ({ driftData = [], onControlClick = null }) => {
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [hoveredControl, setHoveredControl] = useState(null);

  // Group controls by drift status
  const groupedData = {
    CRITICAL_DRIFT: driftData.filter(d => d.drift_status === 'CRITICAL_DRIFT'),
    MATERIAL_DRIFT: driftData.filter(d => d.drift_status === 'MATERIAL_DRIFT'),
    EMERGING_DRIFT: driftData.filter(d => d.drift_status === 'EMERGING_DRIFT'),
    STABLE: driftData.filter(d => d.drift_status === 'STABLE')
  };

  const driftConfigs = {
    CRITICAL_DRIFT: { color: '#dc2626', label: 'Critical', icon: AlertTriangle },
    MATERIAL_DRIFT: { color: '#ea580c', label: 'Material', icon: TrendingUp },
    EMERGING_DRIFT: { color: '#f59e0b', label: 'Emerging', icon: Activity },
    STABLE: { color: '#16a34a', label: 'Stable', icon: Activity }
  };

  // Filter data based on selection
  const filteredData = selectedStatus === 'ALL'
    ? driftData
    : groupedData[selectedStatus] || [];

  // Summary stats
  const stats = {
    total: driftData.length,
    critical: groupedData.CRITICAL_DRIFT.length,
    material: groupedData.MATERIAL_DRIFT.length,
    emerging: groupedData.EMERGING_DRIFT.length,
    stable: groupedData.STABLE.length
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
          Control Drift Heatmap
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Early-warning view of control responsiveness to regulatory changes
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {/* Total */}
        <div
          onClick={() => setSelectedStatus('ALL')}
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: selectedStatus === 'ALL' ? '#f3f4f6' : 'white',
            border: `2px solid ${selectedStatus === 'ALL' ? '#374151' : '#e5e7eb'}`,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Controls</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1f2937' }}>{stats.total}</div>
        </div>

        {/* Critical */}
        <div
          onClick={() => setSelectedStatus('CRITICAL_DRIFT')}
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: selectedStatus === 'CRITICAL_DRIFT' ? '#fee2e2' : 'white',
            border: `2px solid ${selectedStatus === 'CRITICAL_DRIFT' ? '#dc2626' : '#e5e7eb'}`,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '4px' }}>Critical Drift</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626' }}>{stats.critical}</div>
        </div>

        {/* Material */}
        <div
          onClick={() => setSelectedStatus('MATERIAL_DRIFT')}
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: selectedStatus === 'MATERIAL_DRIFT' ? '#ffedd5' : 'white',
            border: `2px solid ${selectedStatus === 'MATERIAL_DRIFT' ? '#ea580c' : '#e5e7eb'}`,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '12px', color: '#ea580c', marginBottom: '4px' }}>Material</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#ea580c' }}>{stats.material}</div>
        </div>

        {/* Emerging */}
        <div
          onClick={() => setSelectedStatus('EMERGING_DRIFT')}
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: selectedStatus === 'EMERGING_DRIFT' ? '#fef3c7' : 'white',
            border: `2px solid ${selectedStatus === 'EMERGING_DRIFT' ? '#f59e0b' : '#e5e7eb'}`,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '4px' }}>Emerging</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>{stats.emerging}</div>
        </div>

        {/* Stable */}
        <div
          onClick={() => setSelectedStatus('STABLE')}
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: selectedStatus === 'STABLE' ? '#dcfce7' : 'white',
            border: `2px solid ${selectedStatus === 'STABLE' ? '#16a34a' : '#e5e7eb'}`,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '12px', color: '#16a34a', marginBottom: '4px' }}>Stable</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a' }}>{stats.stable}</div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '8px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        {filteredData.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            No controls found for this drift status
          </div>
        ) : (
          filteredData.map((control) => {
            const config = driftConfigs[control.drift_status];
            const Icon = config.icon;

            return (
              <div
                key={control.control_id}
                onClick={() => onControlClick && onControlClick(control)}
                onMouseEnter={() => setHoveredControl(control.control_id)}
                onMouseLeave={() => setHoveredControl(null)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  border: `2px solid ${config.color}`,
                  cursor: onControlClick ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  transform: hoveredControl === control.control_id ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: hoveredControl === control.control_id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Icon size={14} color={config.color} />
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: config.color,
                    textTransform: 'uppercase'
                  }}>
                    {config.label}
                  </span>
                </div>

                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {control.control_code || `Control ${control.control_id}`}
                </div>

                <div style={{
                  fontSize: '16px',
                  fontWeight: '800',
                  color: config.color
                }}>
                  {control.drift_score}
                </div>

                {/* Tooltip on hover */}
                {hoveredControl === control.control_id && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#1f2937',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                      {control.control_title || 'Control Details'}
                    </div>
                    <div style={{ opacity: 0.8 }}>
                      Driver: {control.drift_driver}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <strong>Drift Classification:</strong> Stable (0-30) → Emerging (31-50) → Material (51-75) → Critical (76-100)
      </div>
    </div>
  );
};

export default ControlDriftHeatmap;
