import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/lib/utils/env', () => ({ env: { CLOUDFLARE_ACCOUNT_ID: 'test-account', CLOUDFLARE_EMAIL_API_TOKEN: 'test-only' } }));
import { sendEmail } from '@/lib/email/sendEmail';

const message = { to: 'fixture@example.invalid', subject: 'Fixture', text: 'Fixture', html: '<img src="cid:preview">',
  attachments: [{ filename: 'preview.webp', content: 'dGVzdA==', contentType: 'image/webp', cid: 'preview' },
    { filename: 'document.txt', content: 'dGVzdA==', contentType: 'text/plain' }] };
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal('fetch', mocks.fetch); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('preserves the exact HTML content ID and inline disposition on Cloudflare fallback', async () => {
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ success: true, result: { delivered: [message.to] } })));
  expect(await sendEmail(message)).toEqual({ delivered: true, provider: 'cloudflare' });
  const body = JSON.parse(mocks.fetch.mock.calls[0][1].body);
  expect(body.attachments[0]).toMatchObject({ content_id: 'preview', disposition: 'inline', content: 'dGVzdA==' });
  expect(body.attachments[1]).toMatchObject({ disposition: 'attachment' });
  expect(body.attachments[1]).not.toHaveProperty('content_id');
});

it.each([
  { success: false, result: null },
  { success: true, result: { delivered: ['bcc@example.invalid'], queued: [] } },
  { success: true, result: { permanent_bounces: [message.to], suppressed_recipients: [message.to] } },
])('does not treat an HTTP200 as target delivery: %j', async receipt => {
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify(receipt)));
  expect((await sendEmail(message)).delivered).toBe(false);
});

it('accepts a target queued receipt without pretending to prove inbox arrival', async () => {
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ success: true, result: { delivered: [], queued: [message.to] } })));
  expect((await sendEmail(message)).provider).toBe('cloudflare');
});
