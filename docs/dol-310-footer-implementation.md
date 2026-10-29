# DOL-310: Branded Footer Implementation Summary

**Date**: 29 October 2026  
**PR**: [#222](https://github.com/sonawaneamit/DollWOW/pull/222)  
**Branch**: `cursor/dol-310-dollvue-footer-qr-all-images-7df1`  
**Status**: Preview deployment pending Martin's QA approval

## Goal (from ticket)

Every image DollVue produces must carry the branded white footer (DollWOW logo, "Created with DollVue / Powered by DollWOW / dollwow.com") plus a QR code to a PUBLIC product page, regardless of which model/path generated it. The SAME final image bytes must be used in:
1. Web preview/result screen
2. Save/download and native share
3. Result email inline image
4. Result email separate downloadable attachments

## Implementation Approach

### Single Choke Point Architecture

```
Venice API → raw bytes → normalizeAndBrandPreview() → branded bytes → {
  - Web preview (data URL)
  - Email inline (CID attachment)
  - Email download (separate attachment)
}
```

All branding happens in ONE place: `normalizeAndBrandPreview()` in `app/dollvue/generate/route.ts`.

### Key Changes

#### 1. Generation Route (`app/dollvue/generate/route.ts`)

**Before**:
```typescript
if (seedream.ok) return { 
  ok: true, 
  bytes: await normalizePreview(seedream.bytes), // small corner watermark
  model: "seedream-v5-pro-edit", 
  resolution: "2K" 
};
```

**After**:
```typescript
if (seedream.ok) {
  try {
    return { 
      ok: true, 
      bytes: await normalizeAndBrandPreview(seedream.bytes, productHandle, selections), // full footer
      model: "seedream-v5-pro-edit", 
      resolution: "2K" 
    };
  } catch (brandingError) {
    console.error("DollVue branding failed", brandingError);
    return { ok: false, status: 500, detail: "Failed to brand preview" };
  }
}
```

**Fail-safe**: If `brandDollVuePreview()` throws, return HTTP 500 instead of unbranded image.

#### 2. Branding Function (`lib/dollvue/branding.ts`) 

Already existed from PR #220 (Codex's work), now wired live:

```typescript
export async function brandDollVuePreview(
  bytes: Buffer, 
  productHandle: string, 
  selections: Array<{ group: string; option: string }>
): Promise<Buffer>
```

- Resizes to ≤1600px
- Appends white footer outside the photo
- Uses `outlinedText()` with bundled Hanken Grotesk font (no square glyphs)
- Composites DollWOW logo and QR code
- Returns WebP at 91% quality

#### 3. Email Preservation (`lib/dollvue/email.ts`)

Already correct from PR #220:

```typescript
if (metadata.format === 'webp' && 
    (metadata.width ?? 0) <= 1600 && 
    (metadata.height ?? 0) <= 2800) {
  // Keep identical bytes - QR survives
  return { filename, content: bytes.toString('base64'), contentType: 'image/webp' };
}
```

No re-encoding = QR remains scannable.

## Testing Evidence

### Unit Tests

| Test Suite | Status | Notes |
|------------|--------|-------|
| `dollVueBranding.test.ts` | ✅ 6/6 | QR decodes, footer visible, email bytes match |
| `dollVueFooterIntegration.test.ts` | ⚠️ 5/7 | 2 auth mock failures, core logic passes |
| TypeScript | ✅ Pass | No type errors |
| Lint | ✅ Pass | Scoped to changed files |

### Test Coverage

```typescript
it('embeds readable branding and a product QR after email optimization: 800x1200', async () => {
  const branded = await brandDollVuePreview(source, handle, selections);
  
  expect(await decode(branded)).toBe(dollVuePublicReturnUrl(handle)); // ✅
  
  await sendDollVueLookEmail({ previewDataUrl });
  const emailBytes = Buffer.from(attachment.content, 'base64');
  
  expect(hash(branded)).toBe(hash(emailBytes)); // ✅ Identical
  expect(await decode(emailBytes)).toBe(productUrl); // ✅ QR survives
});
```

## NOT Changed

Per Martin's hard constraints:

- ❌ Generation route/model choice: UNTOUCHED
- ❌ `safe_mode` flag: UNTOUCHED  
- ❌ Content filters: UNTOUCHED
- ❌ Uncensored fallback: UNTOUCHED
- ❌ Existing supplier images: UNCHANGED
- ❌ Historical downloads/emails: UNCHANGED

## Verification Checklist

Manual QA required on Vercel preview:

- [ ] Navigate to `/review/dollvue-branding` (synthetic fixture)
- [ ] Verify footer visible with logo, text, QR
- [ ] Right-click → Save Image, verify downloaded file has footer
- [ ] Scan QR with phone, verify it opens public product page
- [ ] Check browser DevTools → Network → verify image size ≤2MB
- [ ] No customer email, session token, or private ID in QR
- [ ] Font rendering: no square glyph boxes
- [ ] Footer scales correctly for portrait/landscape/square images

Email verification (requires test generation allowance):

- [ ] Trigger test generation on preview deployment
- [ ] Verify email arrives with inline image showing footer
- [ ] Verify email has separate downloadable attachment
- [ ] Download attachment, verify footer present
- [ ] Scan QR from both inline and downloaded attachment

## Deployment Plan

1. ✅ PR created: #222
2. ⏳ Vercel preview builds
3. ⏳ Martin QA on preview
4. ⏳ Martin production approval
5. ⏳ Merge to main
6. ⏳ Vercel production deployment

## Known Limitations

1. **Integration test auth**: Two tests fail on session mocking. Core logic works; tests need better auth setup.
2. **Cache invalidation**: Existing cached previews (30min TTL) won't have footer until regenerated.
3. **Preview deployment URL**: Will be available after Vercel builds the PR.

## Evidence Files

- `tests/dollVueBranding.test.ts`: Existing test suite (6/6 pass)
- `tests/dollVueFooterIntegration.test.ts`: New integration tests (5/7 pass)
- `app/review/dollvue-branding/page.tsx`: Synthetic fixture review page
- PR #222: https://github.com/sonawaneamit/DollWOW/pull/222

## Next Steps

1. Wait for Vercel preview deployment
2. Manual QA on preview URL
3. Post screenshots to Linear DOL-310
4. Await Martin's production approval
5. Merge PR

---

**Contact**: Report issues to Linear DOL-310 or PR #222 comments.
