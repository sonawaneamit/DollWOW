import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackEvent, trackPageView } from '@/lib/analytics/client';
import { writeConsent } from '@/lib/analytics/consent';

vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());

function browser(state: 'unknown' | 'granted' | 'denied', host = 'dollwow.com') {
  let stored = state === 'unknown' ? null : JSON.stringify({ state, updatedAt: new Date().toISOString() });
  const gtag = vi.fn();
  const location = { hostname: host, origin: `https://${host}`, href: `https://${host}/shop/tpe?email=private@example.com`, protocol: 'https:' };
  vi.stubGlobal('location', location);
  vi.stubGlobal('document', { referrer: 'https://chatgpt.com/?private=secret', title: 'TPE', cookie: '' });
  vi.stubGlobal('CustomEvent', class { constructor(public type: string, public detail: unknown) {} });
  vi.stubGlobal('window', {
    location, gtag, dispatchEvent: vi.fn(),
    dollwowAnalytics: { mode: 'production', measurementId: 'G-4V999366W5', hosts: ['dollwow.com', 'www.dollwow.com'] },
    localStorage: { getItem: () => stored, setItem: (_key: string, value: string) => { stored = value; } }
  });
  return gtag;
}

describe('consent-aware client coverage matrix (mock transport, not delivery proof)', () => {
  it.each(['unknown', 'denied'] as const)('does not queue GA page views or events for %s', state => {
    const gtag = browser(state);
    trackPageView('/shop/tpe');
    trackEvent('view_item', { item_id: 'fixture' });
    expect(gtag).not.toHaveBeenCalled();
  });
  it.each(['localhost', 'ops.dollwow.com', 'preview.vercel.app'])('excludes %s even after consent', host => {
    const gtag = browser('granted', host);
    trackPageView('/shop/tpe');
    trackEvent('view_item');
    expect(gtag).not.toHaveBeenCalled();
  });
  it('accepts, navigates, withdraws and resumes only after another explicit accept', () => {
    const gtag = browser('unknown');
    trackPageView('/shop/tpe');
    writeConsent('granted');
    trackPageView('/shop/tpe');
    trackPageView('/shop/silicone');
    expect(gtag.mock.calls.filter(x => x[0] === 'event')).toHaveLength(2);
    writeConsent('denied');
    trackPageView('/shop/ready-to-ship');
    trackEvent('view_item');
    expect(gtag.mock.calls.filter(x => x[0] === 'event')).toHaveLength(2);
    writeConsent('granted');
    trackPageView('/shop/ready-to-ship');
    expect(gtag.mock.calls.filter(x => x[0] === 'event')).toHaveLength(3);
  });
  it('uses restored consent but does not include query strings or referrer paths', () => {
    const gtag = browser('granted');
    trackPageView('/shop/tpe?email=private@example.com#private');
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({
      page_location: 'https://dollwow.com/shop/tpe', page_referrer: 'https://chatgpt.com'
    }));
    expect(JSON.stringify(gtag.mock.calls)).not.toMatch(/private|secret|example\.com/);
  });
  it('does not create purchases through the storefront event helper', () => {
    const gtag = browser('granted');
    trackEvent('purchase', { transaction_id: 'never-send' });
    expect(gtag).not.toHaveBeenCalled();
  });
});
