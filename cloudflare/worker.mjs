// Fixed upstream, never taken from a visitor-controlled URL or request header.
const NETLIFY_ORIGIN = 'https://xravity.netlify.app';
// Existing published deploy permalink avoids the canonical-domain redirect.
// Keep this Netlify deploy while Forms is retained; do not use xravity.xyz here
// because that domain will later move to Cloudflare.
const CONTACT_ORIGIN = 'https://6addd771a99d20b6b49a286d--xravity.netlify.app';
const READ_METHODS = new Set(['GET', 'HEAD']);
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const FORWARDED_HEADERS = ['accept', 'authorization', 'content-type', 'if-none-match', 'if-modified-since', 'origin'];
const MAX_CONTACT_BYTES = 32768;

/** @param {HeadersInit} [original] */
function privateHeaders(original) {
  const headers = new Headers(original);
  headers.set('Cache-Control', 'no-store');
  headers.set('Pragma', 'no-cache');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  // Authentication happens on this same origin. No cross-origin access is granted.
  headers.delete('Access-Control-Allow-Origin');
  headers.delete('Access-Control-Allow-Credentials');
  headers.delete('Set-Cookie');
  return headers;
}

/** @param {string} error @param {number} status */
function fail(error, status) {
  const headers = privateHeaders({ 'Content-Type': 'application/json; charset=utf-8' });
  return new Response(JSON.stringify({ error }), { status, headers });
}

/** @param {Request} request */
function sameOriginWrite(request) {
  const origin = request.headers.get('Origin');
  return origin === new URL(request.url).origin && request.headers.get('Sec-Fetch-Site') !== 'cross-site';
}

/** @param {string} path */
function classify(path) {
  if (path === '/.netlify/identity' || path.startsWith('/.netlify/identity/')) return 'identity';
  if (path === '/.netlify/git/settings' || path === '/.netlify/git/github' || path.startsWith('/.netlify/git/github/')) return 'git';
  return null;
}

/** @param {Request} request */
async function boundedContactText(request) {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0, text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_CONTACT_BYTES) { await reader.cancel(); return null; }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}

/** @param {Request} request @param {typeof fetch} fetchUpstream */
async function contact(request, fetchUpstream) {
  if (request.method !== 'POST') return fail('Method not allowed', 405);
  if (!sameOriginWrite(request)) return fail('Origin not allowed', 403);
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/x-www-form-urlencoded')) return fail('Unsupported form encoding', 415);
  const text = await boundedContactText(request);
  if (text === null) return fail('Form is too large', 413);
  const input = new URLSearchParams(text);
  if (input.get('form-name') !== 'contact') return fail('Unknown form', 400);
  if (input.get('bot-field')) return new Response(JSON.stringify({ ok: true }), { headers: privateHeaders({ 'Content-Type':'application/json' }) });
  const name = (input.get('name') || '').trim();
  const email = (input.get('email') || '').trim();
  const message = (input.get('message') || '').trim();
  if (!name || name.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !message || message.length > 8000) return fail('Invalid form fields', 400);
  const body = new URLSearchParams({ 'form-name':'contact', name, email, message, 'bot-field':'' });
  const response = await fetchUpstream(CONTACT_ORIGIN + '/', {
    method: 'POST', body,
    headers: { 'Accept':'application/json', 'Content-Type':'application/x-www-form-urlencoded' },
    redirect: 'manual', signal: AbortSignal.timeout(20000),
  });
  // A canonical-domain redirect is NOT evidence that a message was accepted.
  if (!response.ok) {
    await response.body?.cancel();
    return fail('Contact service did not confirm receipt. Please use the email link.', 502);
  }
  await response.body?.cancel();
  return new Response(JSON.stringify({ ok:true }), { headers: privateHeaders({ 'Content-Type':'application/json' }) });
}

/**
 * Netlify retains its existing JWT authorization. This proxy has no admin key,
 * does not mint tokens, does not cache private responses, and does not log URLs,
 * bodies, credentials, email addresses, or upstream error messages.
 * @param {Request} request
 * @param {Env} env
 * @param {typeof fetch} [fetchUpstream]
 * @returns {Promise<Response>}
 */
export async function handle(request, env, fetchUpstream = fetch) {
  const url = new URL(request.url);
  try {
    if (url.pathname === '/api/contact') return await contact(request, fetchUpstream);
    const route = classify(url.pathname);
    if (route) {
      if (!READ_METHODS.has(request.method) && !WRITE_METHODS.has(request.method)) return fail('Method not allowed', 405);
      if (WRITE_METHODS.has(request.method) && !sameOriginWrite(request)) return fail('Origin not allowed', 403);
      if (route === 'git' && url.pathname !== '/.netlify/git/settings' && !/^Bearer\s+\S+$/i.test(request.headers.get('Authorization') || '')) return fail('Authentication required', 401);
      const target = new URL(url.pathname + url.search, NETLIFY_ORIGIN);
      if (target.origin !== NETLIFY_ORIGIN || classify(target.pathname) !== route) return fail('Invalid upstream path', 400);
      const forwarded = new Request(target, request);
      for (const name of [...forwarded.headers.keys()]) {
        if (!FORWARDED_HEADERS.includes(name)) forwarded.headers.delete(name);
      }
      const response = await fetchUpstream(forwarded, { redirect:'manual', signal:AbortSignal.timeout(20000) });
      if (response.status >= 300 && response.status < 400 && response.status !== 304) {
        await response.body?.cancel();
        return fail('Authentication service redirected unexpectedly', 502);
      }
      return new Response(response.body, { status:response.status, statusText:response.statusText, headers:privateHeaders(response.headers) });
    }
    if (url.pathname.startsWith('/.netlify/') || url.pathname.startsWith('/api/')) return fail('Not found', 404);
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    // Only the approved public hostname is indexable; workers.dev and branch
    // previews stay private to crawlers, as do all admin and API responses.
    if (url.hostname !== 'xravity.xyz' || /^\/admin(?:\/|$)/.test(url.pathname)) {
      headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(response.body, { status:response.status, statusText:response.statusText, headers });
  } catch (_) {
    // Deliberately omit error.message: fetch failures can include private URLs.
    console.error(JSON.stringify({ event:'upstream_unavailable' }));
    return fail('Service temporarily unavailable', 502);
  }
}

/** @satisfies {ExportedHandler<Env>} */
export default {
  fetch(request, env) { return handle(request, env); },
};
