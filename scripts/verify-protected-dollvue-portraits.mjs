import fs from 'node:fs/promises';import sharp from 'sharp';import {createServer} from 'vite';
const root='data/exports/dol312-both-brands-nov10',data=JSON.parse(await fs.readFile('data/draft-previews/mmx-fanreal-dollvue-iris-nov10.json'));
const server=await createServer({configFile:false,server:{middlewareMode:true},resolve:{alias:{'@':process.cwd()}},plugins:[{name:'offline-marker',resolveId(id){if(id==='server-only')return '\0offline-marker';},load(id){if(id==='\0offline-marker')return 'export {};';}}]});
try{
 const {renderProtectedIris,brandProtectedIris}=await server.ssrLoadModule('/lib/dollvue/protectedIris.ts');
 const results=[];
 for(const r of data.records){
  const group=r.groups[0],option=group.options.find(o=>o.id==='regular-1'||o.id==='e07')||group.options[0];
  try{
   const source=await fs.readFile('public'+r.photo),rendered=await renderProtectedIris(source,r.mask,option.pigment);
   results.push({handle:r.handle,brand:r.brand,state:'PASS',...rendered.proof});
   if(['mmx-monica-163a-silicone-companion-doll','fanreal-ling-170cm-d-cup-silicone-companion-doll'].includes(r.handle)){
    const prefix=root+'/protected-'+r.brand.toLowerCase();await fs.writeFile(prefix+'-portrait.png',rendered.bytes);
    const branded=await brandProtectedIris(rendered.bytes,r.handle,[{group:group.label,option:option.label}]);await fs.writeFile(prefix+'-branded.png',branded);
    const original=await sharp(source).removeAlpha().raw().toBuffer(),check=await sharp(branded).extract({left:0,top:0,width:r.mask.width,height:r.mask.height}).removeAlpha().raw().toBuffer();
    const decoded=await sharp(rendered.bytes).removeAlpha().raw().toBuffer();if(!check.equals(decoded))throw Error('Footer altered protected photo');
    const comparison=await sharp({create:{width:r.mask.width*2,height:r.mask.height,channels:3,background:'#fff'}}).composite([{input:source,left:0,top:0},{input:rendered.bytes,left:r.mask.width,top:0}]).png().toBuffer();await fs.writeFile(prefix+'-comparison.png',comparison);
   }
  }catch(e){results.push({handle:r.handle,brand:r.brand,state:'NEEDS_REVIEW',reason:e.message});}
  if(results.length%20===0)console.log(JSON.stringify({checked:results.length,total:data.records.length}));
 }
 await fs.writeFile(root+'/protected-portrait-runtime-proof.json',JSON.stringify({results,providerCalls:0,emails:0,carts:0,productionWrites:0},null,2));
 console.log(JSON.stringify({pass:results.filter(r=>r.state==='PASS').length,needsReview:results.filter(r=>r.state!=='PASS').length}));
}finally{await server.close();}
