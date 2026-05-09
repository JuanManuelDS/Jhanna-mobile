export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function parseNumeric(input) {
  if (input == null) return NaN;
  const stripped = String(input).replace(/[^0-9]/g, '');
  if (stripped.length === 0) return NaN;
  return parseInt(stripped, 10);
}
