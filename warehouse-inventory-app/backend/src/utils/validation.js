function isPositiveInteger(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function requiredText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

module.exports = { isPositiveInteger, requiredText };
