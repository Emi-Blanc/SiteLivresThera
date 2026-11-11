import { timingSafeEqual, createHash } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const hash = value => createHash('sha256').update(value).digest();
const reply = (status, body) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' }
});

export default async function carnet(request) {
  const secret = process.env.CARNET_ACCESS_KEY;
  if (!secret || secret.length < 24) return reply(503, { error: 'Accès privé à configurer.' });
  const authorization = request.headers.get('Authorization') ?? '';
  if (!timingSafeEqual(hash(authorization), hash('Bearer ' + secret))) {
    return reply(401, { error: 'Clé d’accès incorrecte.' });
  }
  const store = getStore({ name: 'carnet-prive', consistency: 'strong' });
  if (request.method === 'GET') {
    const item = await store.getWithMetadata('lectures', { type: 'json' });
    return reply(200, { books: item?.data ?? [], version: item?.etag ?? null });
  }
  if (request.method !== 'PUT') return reply(405, { error: 'Méthode indisponible.' });
  const text = await request.text();
  if (Buffer.byteLength(text) > 4_000_000) return reply(413, { error: 'Le carnet dépasse la taille autorisée.' });
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    return reply(400, { error: 'Données illisibles.' });
  }
  if (!Array.isArray(payload?.books) ||
      payload.books.some(book => !book || typeof book.title !== 'string' || !book.title.trim()) ||
      (payload.version !== null && typeof payload.version !== 'string')) {
    return reply(400, { error: 'Fiches invalides.' });
  }
  const result = await store.setJSON('lectures', payload.books,
    payload.version === null ? { onlyIfNew: true } : { onlyIfMatch: payload.version });
  if (!result.modified) return reply(409, { error: 'Le carnet a changé sur un autre appareil. Recharge les fiches avant de réessayer.' });
  return reply(200, { version: result.etag });
}
