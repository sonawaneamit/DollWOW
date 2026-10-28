import S40ReferencePage from '@/components/reference/S40ReferencePage';
import {s40ReferenceMetadata} from '@/lib/learn/s40ReferenceSeo';

export const dynamic='force-dynamic';
export const metadata=s40ReferenceMetadata(process.env.VERCEL_ENV);
export default S40ReferencePage;
