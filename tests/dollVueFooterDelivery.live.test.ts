import {expect,it} from 'vitest';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {brandingReviewFixture,BRANDING_REVIEW_HANDLE,BRANDING_REVIEW_SELECTIONS} from '@/lib/dollvue/brandingReviewFixture';
import {dollVuePublicReturnUrl} from '@/lib/dollvue/branding';
import {sendDollVueLookEmail} from '@/lib/dollvue/email';

// Explicit operator QA only. Ordinary CI must never send an external email.
it.skipIf(process.env.DOLLVUE_FOOTER_MAIL_QA!=='1')('sends the approved safe footer/download QA email once',async()=>{
  const output=process.env.DOLLVUE_FOOTER_QA_OUTPUT;
  if(!output||!path.isAbsolute(output)) throw Error('Absolute private output directory required');
  const fixture=await brandingReviewFixture();
  await mkdir(output,{recursive:true});
  await writeFile(path.join(output,'branded-preview.webp'),fixture.preview,{mode:0o600});
  const result=await sendDollVueLookEmail({to:'amitvsonawane@gmail.com',productName:'DollVue footer and download QA - synthetic sample',
    productUrl:dollVuePublicReturnUrl(BRANDING_REVIEW_HANDLE),sourceImageUrl:`data:image/webp;base64,${fixture.original.toString('base64')}`,
    previewDataUrl:`data:image/webp;base64,${fixture.preview.toString('base64')}`,selections:BRANDING_REVIEW_SELECTIONS,downloadablePreview:true});
  await writeFile(path.join(output,'mail-receipt.json'),JSON.stringify({at:new Date().toISOString(),...result,
    previewSha256:createHash('sha256').update(fixture.preview).digest('hex'),inboxVerified:false}),{mode:0o600});
  expect(result.delivered).toBe(true);
},90000);
