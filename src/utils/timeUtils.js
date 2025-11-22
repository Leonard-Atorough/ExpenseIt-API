function parseExpiryToMs(exp) {
  if (/^\d+d$/.test(exp)) return parseInt(exp, 10) * 24 * 60 * 60 * 1000;
  if (/^\d+h$/.test(exp)) return parseInt(exp, 10) * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000; // default 7 days
}

export { parseExpiryToMs };
