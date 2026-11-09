import {notFound} from 'next/navigation';
import {policies, reviewVersion} from './review-data';
export const metadata={title:'DollWOW Agentic review',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default function AgenticReview(){
 if(process.env.VERCEL_ENV!=='preview')notFound();
 return <div className="agentic-review" style={{maxWidth:960,margin:'0 auto',padding:'40px 20px 100px',lineHeight:1.65}}>
  <style>{`.agentic-review h1{font-size:34px;line-height:1.2;font-weight:650;margin:18px 0}.agentic-review h2{font-size:26px;line-height:1.3;font-weight:650;margin:0 0 24px}.agentic-review h3{font-size:19px;line-height:1.4;font-weight:650;margin:26px 0 8px}.agentic-review p{margin:0 0 18px}.agentic-review nav a{text-decoration:underline;text-underline-offset:4px}@media(max-width:600px){.agentic-review h1{font-size:28px}.agentic-review h2{font-size:23px}}`}</style>
  <p>Private review · {reviewVersion} · Not published to Shopify</p>
  <h1>DollWOW policy review</h1>
  <p>The policy text below is the exact proposed copy. Please review the cancellation windows, delivery estimates, import-fee wording, remedies, and business details. This review does not activate channels or change product eligibility.</p>
  <nav aria-label="Review sections" style={{display:'flex',gap:20,flexWrap:'wrap'}}>{policies.map(p=><a key={p.key} href={`#${p.key}`}>{p.title}</a>)}</nav>
  {policies.map(p=><article id={p.key} key={p.key} style={{marginTop:48,borderTop:'1px solid #bba',paddingTop:24}}><h2>{p.title}</h2>{p.sections.map(([title,copy])=><section key={title}><h3>{title}</h3><p>{copy}</p></section>)}</article>)}
 </div>;
}
