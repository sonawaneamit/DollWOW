'use client';

import {useRef} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowLeft,ArrowRight} from 'lucide-react';

export type S40Look = {handle:string;title:string;description:string;image:string};

export function S40LookCarousel({looks}:{looks:S40Look[]}){
  const track=useRef<HTMLUListElement>(null);
  const scroll=(direction:number)=>{
    const node=track.current;if(!node)return;
    const card=node.querySelector('li');
    node.scrollBy({left:direction*((card?.getBoundingClientRect().width??280)+24),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  return <div>
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold">One face, five different moods</h2>
      <div className="flex shrink-0 gap-2">
        <button type="button" title="Previous look" aria-label="Previous look" aria-controls="s40-look-track" onClick={()=>scroll(-1)} className="flex h-11 w-11 items-center justify-center rounded-md border border-current/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2"><ArrowLeft className="h-5 w-5" aria-hidden="true"/></button>
        <button type="button" title="Next look" aria-label="Next look" aria-controls="s40-look-track" onClick={()=>scroll(1)} className="flex h-11 w-11 items-center justify-center rounded-md border border-current/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2"><ArrowRight className="h-5 w-5" aria-hidden="true"/></button>
      </div>
    </div>
    <ul ref={track} id="s40-look-track" aria-label="Eileen S40 factory photographs" className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-5">
      {looks.map((look,index)=><li key={look.handle} className="w-[240px] min-w-0 shrink-0 snap-start sm:w-[300px]">
        <Link href={`/products/${look.handle}`} className="relative block aspect-[3/4] overflow-hidden rounded-md bg-black/10" aria-label={`Explore Eileen: ${look.title}`}>
          <Image src={look.image} alt={`Irontech S40 Eileen: ${look.title}. Factory photograph.`} fill sizes="300px" priority={index===0} className="object-contain"/>
        </Link>
        <p className="mt-3 text-xs font-semibold">Factory photograph</p>
        <h3 className="mt-2 text-lg font-semibold"><Link href={`/products/${look.handle}`} className="underline decoration-current/30 underline-offset-4">{look.title}</Link></h3>
        <p className="mt-2 text-sm leading-6">{look.description}</p>
      </li>)}
    </ul>
  </div>;
}
