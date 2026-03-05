function parseLimit(limitValue, defaultValue = 50, max = 100) {
  if (!limitValue) return defaultValue;
  const parsed = Number(limitValue);
  if (!Number.isInteger(parsed) || parsed <= 0) return defaultValue;
  return Math.min(parsed, max);
}

function parseNumericId(value) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

module.exports = {
  parseLimit,
  parseNumericId
};
