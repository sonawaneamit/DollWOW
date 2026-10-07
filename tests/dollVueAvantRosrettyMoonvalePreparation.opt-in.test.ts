import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';

const directory='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/piper-family-preparation/avant-rosretty-moonvale';
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
type Choice={groupId:string;optionId:string;reference:string};
function exactGroups(record:{status:string;choices?:Choice[];imageDigests?:Record<string,string>},expected:Map<string,string>){
 if(record.status!=='ready')return [];
 const groups=new Map<string,Choice[]>();
 for(const choice of record.choices||[])groups.set(choice.groupId,[...(groups.get(choice.groupId)||[]),choice]);
 return [...groups].filter(([,choices])=>choices.length===expected.size&&new Set(choices.map(c=>c.reference)).size===expected.size&&choices.every(c=>expected.has(c.reference)&&record.imageDigests?.[c.reference]===expected.get(c.reference))).map(([groupId,choices])=>({groupId,choices}));
}
it('matches actual flat readiness choices by group and exact reference bytes',()=>{
 const record={status:'ready',choices:[{groupId:'g',optionId:'a',reference:'/a'},{groupId:'g',optionId:'b',reference:'/b'}],imageDigests:{'/a':'aaa','/b':'bbb'}};
 expect(exactGroups(record,new Map([['/a','aaa'],['/b','bbb']]))).toHaveLength(1);
 expect(exactGroups(record,new Map([['/a','aaa']]))).toHaveLength(0);
 expect(exactGroups(record,new Map([['/a','changed'],['/b','bbb']]))).toHaveLength(0);
});
it.skipIf(process.env.DOLLVUE_THREE_BRAND_REUSE_AUDIT!=='1')('corrects private reuse audit without touching frozen parent commit files',async()=>{
 vi.stubGlobal('fetch',async()=>{throw Error('Offline audit: no network or provider calls');});
 try{
  const oldFile=path.join(directory,'native-review-and-candidate-proposal.json'),oldBytes=await fs.readFile(oldFile),report=JSON.parse(oldBytes.toString());
  const prepBytes=await fs.readFile(report.preparation.file);expect(hash(prepBytes)).toBe(report.preparation.sha256);const prep=JSON.parse(prepBytes.toString());
  const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),registry=JSON.parse(registryBytes.toString());
  report.familyReuse=prep.families.map((family:any,i:number)=>{
   const expected=new Map<string,string>(family.choices.map((c:any)=>[c.reference,c.sha256]));
   const matches=Object.entries(registry).flatMap(([id,record])=>exactGroups(record as any,expected).map(group=>({productId:id,...group})));
   return {familyNumber:i+1,familyHash:family.referenceFamilyHash,exactExistingReadyIds:[...new Set(matches.map(m=>m.productId))],matches,referenceSetAndDigestsExact:matches.length>0,reuseApplied:false,reason:matches.length?'Exact reference family found, but no Moonvale source photograph passed this native review. No readiness granted.':'No exact complete reference group and digest match in current ready registry; proposed iris families require new pilot review.'};
  });
  expect(report.familyReuse.find((f:any)=>f.familyNumber===10).matches.length).toBeGreaterThan(0);
  for(const n of [3,12])expect(report.familyReuse.find((f:any)=>f.familyNumber===n).matches).toHaveLength(0);
  report.supersedes={file:oldFile,sha256:hash(oldBytes),reason:'Corrected registry schema: flat choices grouped by groupId, not nonexistent groups field. Source and reference reviews and frozen pilot inputs unchanged.'};
  report.currentRegistry={count:Object.keys(registry).length,sha256:hash(registryBytes)};
  report.reuseAuditCorrectedAt=new Date().toISOString();
  for(const p of report.pilots){expect(hash(await fs.readFile(p.file))).toBe(p.sha256);expect(hash(await fs.readFile(p.inputSheet.file))).toBe(p.inputSheet.sha256);}
  const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n'),file=path.join(directory,'native-review-and-candidate-proposal-corrected.json');
  try{await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});}catch(error){
   if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;
   const existing=JSON.parse(await fs.readFile(file,'utf8'));
   expect(existing.familyReuse).toEqual(report.familyReuse);expect(existing.pilots).toEqual(report.pilots);expect(existing.supersedes).toEqual(report.supersedes);
  }
  expect(await fs.readFile('lib/dollvue/readiness-registry.json')).toEqual(registryBytes);
  console.info(JSON.stringify({file,sha256:hash(await fs.readFile(file)),matches:report.familyReuse.filter((f:any)=>f.matches.length).map((f:any)=>({family:f.familyNumber,records:f.exactExistingReadyIds.length}))}));
 }finally{vi.unstubAllGlobals();}
},60000);
