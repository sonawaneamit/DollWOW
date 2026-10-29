import 'server-only';
import { getSupabaseServerClient } from '@/lib/supabase/client';
import { dollVueEmailHash } from './session';

export async function beginDollVueSubmission(input: {
  id: string; email: string; handle: string; name: string; brand?: string; head?: string; body?: string;
}) {
  const db = getSupabaseServerClient();
  if (!db) return false;
  const { error } = await db.from('dollvue_submissions').insert({
    id: input.id, email: input.email.trim().toLowerCase(), email_hash: dollVueEmailHash(input.email),
    product_handle: input.handle, product_name: input.name, brand: input.brand,
    head_code: input.head && /\d/.test(input.head) ? input.head : null, body_code: input.body,
  });
  if (error) console.error('DollVue submission', { event: 'storage_failed' });
  return !error;
}

export async function updateDollVueSubmission(id: string, email: string, update: {
  delivery_status?: 'accepted' | 'failed'; delivery_provider?: string; verified_at?: string;
}) {
  const db = getSupabaseServerClient();
  if (!db) return false;
  const { error } = await db.from('dollvue_submissions').update(update)
    .eq('id', id).eq('email_hash', dollVueEmailHash(email));
  if (error) console.error('DollVue submission', { event: 'update_failed' });
  return !error;
}
