import indexNowConfig from '@/data/indexnow.json';

export const INDEXNOW_ORIGIN = 'https://dollwow.com';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export function indexNowKey(environment = process.env) {
  return (environment.INDEXNOW_KEY || indexNowConfig.key).trim();
}

export function indexNowUrls(values: string[]) {
  if (!values.length || values.length > 10_000) throw new Error('Invalid IndexNow batch size.');
  return [...new Set(values.map(value => {
    const url = new URL(value);
    if (url.origin !== INDEXNOW_ORIGIN || url.username || url.password || url.search || url.hash) {
      throw new Error('IndexNow requires canonical DollWOW URLs without private parameters.');
    }
    return url.href;
  }))];
}

export async function notifyIndexNow(urls: string[], key: string, request: typeof fetch = fetch) {
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw new Error('Invalid IndexNow key configuration.');
  const urlList = indexNowUrls(urls);
  const response = await request(INDEXNOW_ENDPOINT, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(2000),
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(INDEXNOW_ORIGIN).host, key,
      keyLocation: `${INDEXNOW_ORIGIN}/${key}.txt`, urlList })
  });
  if (response.status !== 200 && response.status !== 202) throw new Error(`IndexNow notification failed (HTTP ${response.status}).`);
  return { status: response.status, count: urlList.length, validationPending: response.status === 202 };
}
