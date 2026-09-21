// ============================================================
// Formatting Utilities
// ============================================================

/**
 * Format a number as Indian Rupee currency (₹ with lakh/crore notation)
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = Number(amount);
  if (isNaN(num)) return '—';

  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  } else {
    return `₹${num.toLocaleString('en-IN')}`;
  }
}

/**
 * Format currency as full number with commas (Indian numbering)
 */
export function formatCurrencyFull(amount) {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = Number(amount);
  if (isNaN(num)) return '—';
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Format area with unit
 */
export function formatArea(area, unit = 'sq.ft') {
  if (!area) return '—';
  return `${Number(area).toLocaleString('en-IN')} ${unit}`;
}

/**
 * Format dimensions
 */
export function formatDimensions(length, width) {
  if (!length || !width) return '—';
  return `${length} × ${width}`;
}

/**
 * Format rate per unit
 */
const UNIT_DISPLAY_MAP = {
  'sq.ft': 'sq ft',
  'sq.m': 'sq m',
  'sq.yards': 'sq yard',
  'acre': 'acre',
  'guntha': 'guntha',
};

export function formatRate(rate, unit = 'sq.ft') {
  if (!rate) return '—';
  const displayUnit = UNIT_DISPLAY_MAP[unit] || unit;
  return `₹${Number(rate).toLocaleString('en-IN')}/${displayUnit}`;
}

/**
 * Format date to readable string
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date/time to readable string
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return formatDate(dateStr);
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * Get percentage string
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Get status color class
 */
export function getStatusColor(status) {
  const colors = {
    'Available': 'status-available',
    'Under Discussion': 'status-discussion',
    'Reserved': 'status-reserved',
    'Sold': 'status-sold',
    'Inactive': 'status-inactive',
    'Active': 'status-active',
    'Completed': 'status-completed',
    'Pending': 'status-pending',
    'In Progress': 'status-progress',
    'Planned': 'status-planned',
    'Cancelled': 'status-cancelled',
    'Stalled': 'status-stalled',
  };
  return colors[status] || 'status-default';
}

/**
 * Get impact color
 */
export function getImpactColor(impact) {
  const colors = {
    'Very High': 'impact-very-high',
    'High': 'impact-high',
    'Medium': 'impact-medium',
    'Low': 'impact-low',
    'Unknown': 'impact-unknown',
  };
  return colors[impact] || 'impact-unknown';
}

/**
 * Truncate text
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '…';
}
