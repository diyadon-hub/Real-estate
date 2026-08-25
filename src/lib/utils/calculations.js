// ============================================================
// Calculation Utilities
// ============================================================

/**
 * Area conversion factors (base unit: sq.ft)
 */
const AREA_CONVERSIONS = {
  'sq.ft': 1,
  'sq.yards': 9,        // 1 sq.yard = 9 sq.ft
  'acre': 43560,         // 1 acre = 43560 sq.ft
  'guntha': 1089,        // 1 guntha = 1089 sq.ft
};

/**
 * Convert area between units
 */
export function convertArea(value, fromUnit, toUnit) {
  if (!value || !fromUnit || !toUnit) return null;
  const sqft = value * (AREA_CONVERSIONS[fromUnit] || 1);
  return sqft / (AREA_CONVERSIONS[toUnit] || 1);
}

/**
 * Calculate total area from dimensions
 */
export function calculateArea(length, width) {
  if (!length || !width) return null;
  return Number(length) * Number(width);
}

/**
 * Calculate total value from area and rate
 */
export function calculateTotalValue(area, ratePerUnit) {
  if (!area || !ratePerUnit) return null;
  return Number(area) * Number(ratePerUnit);
}

/**
 * Calculate rate from total value and area
 */
export function calculateRate(totalValue, area) {
  if (!totalValue || !area || area === 0) return null;
  return Number(totalValue) / Number(area);
}

/**
 * Calculate profit
 */
export function calculateProfit(purchasePrice, sellingPrice) {
  if (!purchasePrice || !sellingPrice) return null;
  return Number(sellingPrice) - Number(purchasePrice);
}

/**
 * Calculate ROI percentage
 */
export function calculateROI(purchasePrice, sellingPrice) {
  if (!purchasePrice || !sellingPrice || purchasePrice === 0) return null;
  return ((Number(sellingPrice) - Number(purchasePrice)) / Number(purchasePrice)) * 100;
}

/**
 * Calculate percentage appreciation
 */
export function calculateAppreciation(oldValue, newValue) {
  if (!oldValue || !newValue || oldValue === 0) return null;
  return ((Number(newValue) - Number(oldValue)) / Number(oldValue)) * 100;
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 */
export function calculateCAGR(startValue, endValue, years) {
  if (!startValue || !endValue || !years || startValue === 0 || years === 0) return null;
  return (Math.pow(Number(endValue) / Number(startValue), 1 / Number(years)) - 1) * 100;
}

/**
 * Calculate price growth statistics from price history array
 * Input: [{ year, rate }] sorted by year ascending
 */
export function calculatePriceGrowth(history) {
  if (!history || history.length < 2) return null;

  const sorted = [...history].sort((a, b) => a.year - b.year);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const rates = sorted.map(h => Number(h.rate));

  const absoluteIncrease = last.rate - first.rate;
  const percentageIncrease = ((last.rate - first.rate) / first.rate) * 100;
  const years = last.year - first.year;
  const cagr = years > 0 ? calculateCAGR(first.rate, last.rate, years) : 0;
  const average = rates.reduce((a, b) => a + b, 0) / rates.length;
  const highest = Math.max(...rates);
  const lowest = Math.min(...rates);

  return {
    absoluteIncrease,
    percentageIncrease,
    cagr,
    average,
    highest,
    lowest,
    startYear: first.year,
    endYear: last.year,
    totalYears: years,
  };
}

/**
 * Auto-calculate property pricing fields
 * Returns calculated values without overwriting manually set values
 */
export function autoCalculatePricing(property) {
  const result = { ...property };
  const area = Number(property.total_area) || 0;

  // If area and rate are known, calculate total value
  if (area > 0 && property.price_per_sqft && !property.total_estimated_value) {
    result.total_estimated_value = calculateTotalValue(area, property.price_per_sqft);
  }

  // If total value and area are known, calculate rate
  if (area > 0 && property.total_estimated_value && !property.price_per_sqft) {
    result.price_per_sqft = calculateRate(property.total_estimated_value, area);
  }

  // If asking price is set but no estimated value, use asking price
  if (property.asking_price && !result.total_estimated_value) {
    result.total_estimated_value = Number(property.asking_price);
  }

  // Calculate sq.yard rate from sq.ft rate
  if (property.price_per_sqft && !property.price_per_sqyard) {
    result.price_per_sqyard = Number(property.price_per_sqft) * 9;
  }

  return result;
}
