function parseExpiryToMs(exp: string): number {
  if (/^\d+d$/.test(exp)) return parseInt(exp, 10) * 24 * 60 * 60 * 1000;
  if (/^\d+h$/.test(exp)) return parseInt(exp, 10) * 60 * 60 * 1000;
  if (/^\d+m$/.test(exp)) return parseInt(exp, 10) * 60 * 1000;
  if (/^\d+s$/.test(exp)) return parseInt(exp, 10) * 1000;
  return 7 * 24 * 60 * 60 * 1000; // default 7 days
}

export { parseExpiryToMs };
