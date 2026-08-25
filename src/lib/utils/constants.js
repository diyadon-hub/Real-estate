// ============================================================
// Constants & Enums for the Real Estate Dashboard
// ============================================================

export const PROPERTY_TYPES = [
  'Plot', 'Site', 'Land', 'Apartment', 'Villa',
  'Commercial', 'Agricultural', 'Other'
];

export const PROPERTY_STATUSES = [
  'Available', 'Under Discussion', 'Reserved',
  'Sold', 'Inactive', 'Other'
];

export const FACING_OPTIONS = [
  'North', 'South', 'East', 'West',
  'North-East', 'North-West', 'South-East', 'South-West',
  'Unknown'
];

export const AREA_UNITS = [
  { value: 'sq.ft', label: 'Sq. Ft' },
  { value: 'sq.yards', label: 'Sq. Yards' },
  { value: 'acre', label: 'Acre' },
  { value: 'guntha', label: 'Guntha' },
  { value: 'other', label: 'Other' },
];

export const CONTACT_ROLES = [
  'Builder', 'Owner', 'Seller', 'Buyer', 'Broker',
  'Agent', 'Developer', 'Investor', 'Contractor',
  'Lawyer', 'Government', 'Other'
];

export const CONTACT_STATUSES = [
  'Active', 'Inactive', 'Important'
];

export const RELATIONSHIP_TYPES = [
  'Owner', 'Builder', 'Seller', 'Buyer', 'Broker', 'Agent'
];

export const DEVELOPMENT_TYPES = [
  'Road', 'Highway', 'Ring Road', 'Layout', 'Hospital',
  'College', 'School', 'Industry', 'Commercial Project',
  'Residential Project', 'Government Project',
  'Infrastructure', 'Railway', 'Other'
];

export const DEVELOPMENT_STATUSES = [
  'Planned', 'Approved', 'In Progress',
  'Completed', 'Stalled', 'Cancelled'
];

export const IMPACT_LEVELS = [
  'Very High', 'High', 'Medium', 'Low', 'Unknown'
];

export const DOCUMENT_CATEGORIES = [
  'Sale Deed', 'RTC', 'Khata', 'EC', 'Layout Approval',
  'Agreement', 'Tax Document', 'Survey Document',
  'Ownership Document', 'Legal Document', 'Other'
];

export const DOCUMENT_STATUSES = [
  'Active', 'Expired', 'Needs Review'
];

export const FOLLOW_UP_PRIORITIES = [
  'High', 'Normal', 'Low'
];

export const FOLLOW_UP_STATUSES = [
  'Pending', 'Completed', 'Cancelled'
];

export const ENTITY_TYPES = [
  'property', 'contact', 'area', 'development', 'general'
];

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Properties', href: '/properties', icon: 'Home' },
  { label: 'Areas', href: '/areas', icon: 'Map' },
  { label: 'Documents', href: '/documents', icon: 'FileText' },
  { label: 'Contacts', href: '/contacts', icon: 'Users' },
  { label: 'Developments', href: '/developments', icon: 'Building2' },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { label: 'Calculator', href: '/calculator', icon: 'Calculator' },
  { label: 'Notes', href: '/notes', icon: 'StickyNote' },
];

export const NAV_SYSTEM_ITEMS = [
  { label: 'Follow-ups', href: '/follow-ups', icon: 'Bell' },
  { label: 'Search', href: '/search', icon: 'Search' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
];

// Default smart filter chips
export const SMART_FILTERS = [
  { label: '30×40', type: 'dimensions', value: { length: 30, width: 40 } },
  { label: 'East Facing', type: 'facing', value: 'East' },
  { label: 'Under ₹30L', type: 'price_max', value: 3000000 },
  { label: 'Available', type: 'status', value: 'Available' },
  { label: 'Incomplete Docs', type: 'docs', value: 'incomplete' },
  { label: 'Corner Plot', type: 'corner', value: true },
  { label: 'Plots', type: 'property_type', value: 'Plot' },
  { label: 'Sold', type: 'status', value: 'Sold' },
];
