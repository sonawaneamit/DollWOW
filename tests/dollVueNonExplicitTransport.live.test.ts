import {expect,it} from 'vitest';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {requestNonExplicitPreview} from '@/lib/dollvue/nonExplicitProvider';

// Opt-in operator QA only. Never run a paid provider request in ordinary CI.
it.skipIf(process.env.DOLLVUE_SAFE_TRANSPORT_QA!=='1')('verifies real filtered transport with one geometric fixture',async()=>{
  const output=process.env.DOLLVUE_SAFE_QA_OUTPUT;
  if(!output||!path.isAbsolute(output)) throw Error('An absolute private QA output path is required');
  const fixture=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="white"/><rect x="150" y="150" width="300" height="300" fill="#bf2020"/></svg>')).png().toBuffer();
  const result=await requestNonExplicitPreview({images:[`data:image/png;base64,${fixture.toString('base64')}`],
    prompt:'Non-explicit geometric software test. Change the red square to a green square. Keep the white background and square position. Only geometric shapes, no people, no text, no sexual content.',aspectRatio:'1:1'});
  await mkdir(output,{recursive:true});
  const report=result.ok?{ok:true,model:result.model,bytes:result.bytes.length,sha256:createHash('sha256').update(result.bytes).digest('hex')}:
    {ok:false,code:result.code};
  await writeFile(path.join(output,'transport-result.json'),JSON.stringify({at:new Date().toISOString(),...report}),{mode:0o600});
  if(result.ok) await writeFile(path.join(output,'geometric-result.webp'),result.bytes,{mode:0o600});
  expect(result.ok,JSON.stringify(report)).toBe(true);
},75_000);
