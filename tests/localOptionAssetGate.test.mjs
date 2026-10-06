import {test,expect} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {verifyLocalOptionAssets} from '../scripts/lib/verify-local-option-assets.mjs';

test('an owned-looking local path must exist and decode before an import passes',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'option-gate-'));
  const products=[{groups:[{id:'eyes',options:[{id:'blue',swatch:{kind:'image',value:'/option-assets/test.png'}}]}]}];
  try {
    await expect(verifyLocalOptionAssets(products,root)).rejects.toThrow('missing or invalid');
    await fs.mkdir(path.join(root,'option-assets'));
    await fs.writeFile(path.join(root,'option-assets/test.png'),'not an image');
    await expect(verifyLocalOptionAssets(products,root)).rejects.toThrow('missing or invalid');
    await sharp({create:{width:2,height:2,channels:3,background:'#fff'}}).png().toFile(path.join(root,'option-assets/test.png'));
    await expect(verifyLocalOptionAssets(products,root)).resolves.toBe(1);
  } finally { await fs.rm(root,{recursive:true,force:true}); }
});
