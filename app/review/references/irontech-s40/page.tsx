import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import S40ReferencePage from '@/components/reference/S40ReferencePage';
import {s40PilotEnabled} from '@/lib/learn/s40Pilot';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Irontech S40: Eileen, Your Way',description:'Meet Eileen in five real factory looks, explore her listed builds and make your own version in DollVue.',robots:{index:false,follow:false}};

export default function S40Pilot(){
  if(!s40PilotEnabled(process.env.VERCEL_ENV))notFound();
  return <S40ReferencePage/>;
}
