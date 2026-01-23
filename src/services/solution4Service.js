/**
 * Solution 4 Service - Operational Risk Signal Hub
 * Exception Management Intelligence API
 */

import { supabase } from './supabaseClient';

/**
 * Get exception overview KPIs
 * @returns {Promise<Object>} Overview metrics
 */
export async function getExceptionOverview() {
  try {
    const { data, error } = await supabase
      .from('v_exception_materiality')
      .select('*');

    if (error) throw error;

    // Calculate overview metrics
    const overview = {
      total_exceptions: data.length,
      open_exceptions: data.filter(e => e.status === 'open').length,
      critical_exceptions: data.filter(e => e.materiality_band === 'CRITICAL').length,
      high_exceptions: data.filter(e => e.materiality_band === 'HIGH').length,
      avg_materiality_score: data.length > 0
        ? Math.round(data.reduce((sum, e) => sum + e.total_materiality_score, 0) / data.length * 10) / 10
        : 0,
      aged_exceptions: data.filter(e => e.days_open > 30).length
    };

    return { data: overview, error: null };
  } catch (error) {
    console.error('Error fetching exception overview:', error);
    return { data: null, error };
  }
}

/**
 * Get all exceptions with materiality scores
 * @returns {Promise<Array>} List of exceptions
 */
export async function getExceptionList() {
  try {
    const { data, error } = await supabase
      .from('v_exception_materiality')
      .select('*')
      .order('total_materiality_score', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching exception list:', error);
    return { data: null, error };
  }
}

/**
 * Get materiality band distribution for charts
 * @returns {Promise<Array>} Distribution data
 */
export async function getMaterialityDistribution() {
  try {
    const { data, error } = await supabase
      .from('v_exception_materiality')
      .select('materiality_band');

    if (error) throw error;

    // Calculate distribution
    const distribution = data.reduce((acc, item) => {
      const band = item.materiality_band;
      acc[band] = (acc[band] || 0) + 1;
      return acc;
    }, {});

    const total = data.length;
    const result = Object.entries(distribution).map(([band, count]) => ({
      materiality_band: band,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    }));

    // Sort by severity
    const order = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
    result.sort((a, b) => order[a.materiality_band] - order[b.materiality_band]);

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching materiality distribution:', error);
    return { data: null, error };
  }
}

/**
 * Get risk acceleration timeline data
 * @returns {Promise<Array>} Timeline data
 */
export async function getRiskTimeline() {
  try {
    const { data, error } = await supabase
      .from('v_risk_acceleration_timeline')
      .select('*')
      .order('days_open', { ascending: false });

    if (error) throw error;

    // Group by age_band and urgency_level
    const grouped = data.reduce((acc, item) => {
      const key = `${item.age_band}_${item.urgency_level}`;
      if (!acc[key]) {
        acc[key] = {
          age_band: item.age_band,
          urgency_level: item.urgency_level,
          exception_count: 0,
          total_days: 0
        };
      }
      acc[key].exception_count++;
      acc[key].total_days += item.days_open;
      return acc;
    }, {});

    const result = Object.values(grouped).map(item => ({
      ...item,
      avg_days_open: Math.round(item.total_days / item.exception_count)
    }));

    result.sort((a, b) => b.avg_days_open - a.avg_days_open);

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching risk timeline:', error);
    return { data: null, error };
  }
}

/**
 * Get top controls by exception count
 * @param {number} limit - Number of controls to return
 * @returns {Promise<Array>} Control recurrence data
 */
export async function getTopControlsByExceptions(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('v_exception_recurrence_pattern')
      .select('*')
      .order('exceptions_last_3m', { ascending: false })
      .order('total_exceptions', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching top controls:', error);
    return { data: null, error };
  }
}

/**
 * Get recurrence pattern summary
 * @returns {Promise<Array>} Recurrence pattern data
 */
export async function getRecurrencePatternSummary() {
  try {
    const { data, error } = await supabase
      .from('v_exception_recurrence_pattern')
      .select('*');

    if (error) throw error;

    // Group by recurrence pattern
    const grouped = data.reduce((acc, item) => {
      const pattern = item.recurrence_pattern;
      if (!acc[pattern]) {
        acc[pattern] = {
          recurrence_pattern: pattern,
          control_count: 0,
          total_exceptions: 0,
          open_exceptions: 0
        };
      }
      acc[pattern].control_count++;
      acc[pattern].total_exceptions += item.total_exceptions;
      acc[pattern].open_exceptions += item.open_exceptions;
      return acc;
    }, {});

    const result = Object.values(grouped);

    // Sort by severity
    const order = { 'FREQUENT': 1, 'RECURRING': 2, 'OCCASIONAL': 3, 'ISOLATED': 4 };
    result.sort((a, b) => order[a.recurrence_pattern] - order[b.recurrence_pattern]);

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching recurrence pattern summary:', error);
    return { data: null, error };
  }
}

/**
 * Get exception detail with related regulations
 * @param {string} exceptionId - Exception UUID
 * @returns {Promise<Object>} Exception detail
 */
export async function getExceptionDetail(exceptionId) {
  try {
    // Get exception data
    const { data: exceptionData, error: exceptionError } = await supabase
      .from('v_exception_materiality')
      .select('*')
      .eq('exception_id', exceptionId)
      .single();

    if (exceptionError) throw exceptionError;

    // Get related regulatory changes
    const { data: regulatoryData, error: regulatoryError } = await supabase
      .from('regulatory_change_control_map')
      .select(`
        *,
        regulatory_changes (
          id,
          title,
          source,
          materiality,
          effective_date
        )
      `)
      .eq('control_id', exceptionData.control_id);

    const related_regulations = regulatoryData?.map(item => ({
      title: item.regulatory_changes?.title,
      regulator: item.regulatory_changes?.source,
      materiality: item.regulatory_changes?.materiality,
      effective_date: item.regulatory_changes?.effective_date
    })) || [];

    return {
      data: {
        ...exceptionData,
        related_regulations
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching exception detail:', error);
    return { data: null, error };
  }
}

/**
 * Get urgency alerts for notifications
 * @param {number} limit - Number of alerts to return
 * @returns {Promise<Array>} Urgent exceptions
 */
export async function getUrgencyAlerts(limit = 5) {
  try {
    const { data, error } = await supabase
      .from('v_risk_acceleration_timeline')
      .select('*')
      .in('urgency_level', ['IMMEDIATE_ATTENTION', 'ESCALATE'])
      .order('days_open', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching urgency alerts:', error);
    return { data: null, error };
  }
}

/**
 * Get score component breakdown for top exceptions
 * @param {number} limit - Number of exceptions to return
 * @returns {Promise<Array>} Score breakdown data
 */
export async function getScoreBreakdown(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('v_exception_materiality')
      .select('exception_title, regulatory_impact_score, control_criticality_score, duration_score, recurrence_score, total_materiality_score')
      .eq('status', 'open')
      .order('total_materiality_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching score breakdown:', error);
    return { data: null, error };
  }
}

/**
 * Subscribe to real-time exception changes
 * @param {Function} callback - Callback function when data changes
 * @returns {Object} Subscription object
 */
export function subscribeToExceptions(callback) {
  const subscription = supabase
    .channel('exception_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'exceptions'
      },
      (payload) => {
        console.log('Exception changed:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
}
