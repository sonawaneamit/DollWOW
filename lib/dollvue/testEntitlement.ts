// This changes generation allowance only. A signed verified session, current
// product eligibility, usage recording and request abuse controls still apply.
export function isDollVueUnlimitedTestEmail(email: string, additionalEmails = "") {
  const normalized = email.trim().toLowerCase();
  const approved = new Set(["hello@dollwow.com", ...additionalEmails.split(",")
    .map(value => value.trim().toLowerCase())
    .filter(value => /^[a-z0-9.!#$%&'+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value))]);
  return approved.has(normalized);
}
