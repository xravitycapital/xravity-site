import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../../cloudflare/worker.mjs';

const origin = 'https://cloudflare-preview-xravity-site.xravity.workers.dev';
const env = { ASSETS:{fetch:async () => new Response('asset')} };
const request = (path, init={}) => new Request(origin + path, init);
const unexpected = async () => { throw Error('Unexpected upstream fetch'); };

test('static fallback keeps preview out of indexes', async () => {
  const result = await handle(request('/blog/'), env, unexpected);
  assert.equal(await result.text(), 'asset');
  assert.match(result.headers.get('X-Robots-Tag'), /noindex/);
});

test('production pages are indexable but production admin and auth stay private', async () => {
  const publicPage = await handle(new Request('https://xravity.xyz/vision/'), env, unexpected);
  assert.equal(publicPage.headers.get('X-Robots-Tag'), null);
  const admin = await handle(new Request('https://xravity.xyz/admin/'), env, unexpected);
  assert.match(admin.headers.get('X-Robots-Tag'), /noindex/);
  const privateApi = await handle(new Request('https://xravity.xyz/.netlify/git/github/contents/'), env, unexpected);
  assert.equal(privateApi.status, 401);
  assert.match(privateApi.headers.get('X-Robots-Tag'), /noindex/);
  assert.equal(privateApi.headers.get('Cache-Control'), 'no-store');
});

test('anonymous Git Gateway access is denied before contacting upstream', async () => {
  const result = await handle(request('/.netlify/git/github/contents/'), env, unexpected);
  assert.equal(result.status, 401);
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
});

test('unknown API paths cannot turn into an open proxy', async () => {
  for (const path of ['/.netlify/functions/secret','/api/anything','/.netlify/identity-evil']) {
    const result = await handle(request(path), env, unexpected);
    assert.equal(result.status, 404);
  }
});

test('same-origin auth writes required; preflight and unexpected methods are denied', async () => {
  for (const headers of [{}, {Origin:'https://evil.example'}, {Origin:origin,'Sec-Fetch-Site':'cross-site'}]) {
    const result = await handle(request('/.netlify/identity/token',{method:'POST',headers}),env,unexpected);
    assert.equal(result.status,403);
  }
  assert.equal((await handle(request('/.netlify/identity/settings',{method:'OPTIONS'}),env,unexpected)).status,405);
});

test('identity settings retain real server registration restrictions without cookies or CORS', async () => {
  const result = await handle(request('/.netlify/identity/settings'), env, async (input,init) => {
    assert.equal(input.url,'https://xravity.netlify.app/.netlify/identity/settings');
    assert.equal(init.redirect,'manual');
    return Response.json({disable_signup:true,autoconfirm:false},{headers:{'Set-Cookie':'private=1','Access-Control-Allow-Origin':'*'}});
  });
  assert.deepEqual(await result.json(),{disable_signup:true,autoconfirm:false});
  assert.equal(result.headers.get('Set-Cookie'),null);
  assert.equal(result.headers.get('Access-Control-Allow-Origin'),null);
  assert.equal(result.headers.get('Cache-Control'),'no-store');
});

test('login payload is streamed only to the fixed auth service', async () => {
  const result = await handle(request('/.netlify/identity/token',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded','Cookie':'unrelated-cookie','X-Forwarded-Host':'evil.example'},body:'grant_type=password&email=test%40example.invalid&password=test-only'}),env,async (input,init) => {
    assert.equal(input.url,'https://xravity.netlify.app/.netlify/identity/token');
    assert.equal(input.headers.get('Cookie'),null);
    assert.equal(input.headers.get('X-Forwarded-Host'),null);
    assert.match(await input.text(),/grant_type=password/);
    assert.equal(init.redirect,'manual');
    return Response.json({error:'invalid_grant'},{status:400});
  });
  assert.equal(result.status,400);
});

test('Git Gateway still validates the existing bearer token and preserves branch queries', async () => {
  const result = await handle(request('/.netlify/git/github/contents/src/content/blog?ref=cloudflare-preview',{headers:{Authorization:'Bearer test-only'}}),env,async input => {
    assert.equal(input.url,'https://xravity.netlify.app/.netlify/git/github/contents/src/content/blog?ref=cloudflare-preview');
    assert.equal(input.headers.get('Authorization'),'Bearer test-only');
    return new Response('unauthorized',{status:401});
  });
  assert.equal(result.status,401,'proxy must not replace an upstream denial with success');
});

test('upstream redirects cannot leak credentials or pretend a write succeeded', async () => {
  const result = await handle(request('/.netlify/identity/settings'),env,async () => new Response(null,{status:302,headers:{Location:'https://evil.example/'}}));
  assert.equal(result.status,502);
  assert.equal(result.headers.get('Location'),null);
});

const formRequest = (body,headers={}) => request('/api/contact',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded',...headers},body});
test('contact form rejects cross-origin, unknown, oversized, or invalid submissions', async () => {
  assert.equal((await handle(formRequest('form-name=contact',{Origin:'https://evil.example'}),env,unexpected)).status,403);
  assert.equal((await handle(formRequest('form-name=other'),env,unexpected)).status,400);
  assert.equal((await handle(formRequest('form-name=contact'),env,unexpected)).status,400);
  assert.equal((await handle(formRequest('x'.repeat(33000)),env,unexpected)).status,413);
});

test('contact form honeypot does not forward or expose visitor data', async () => {
  assert.equal((await handle(formRequest('form-name=contact&bot-field=spam'),env,unexpected)).status,200);
});

test('contact form does not call a canonical redirect a successful submission', async () => {
  const body='form-name=contact&name=Preview&email=test%40example.invalid&message=Preview+test';
  const result=await handle(formRequest(body),env,async () => new Response(null,{status:301,headers:{Location:'https://xravity.xyz/'}}));
  assert.equal(result.status,502);
  assert.equal(result.headers.get('Cache-Control'),'no-store');
});

test('contact form only returns success when fixed upstream confirms receipt', async () => {
  const body='form-name=contact&name=Preview&email=test%40example.invalid&message=Preview+test';
  const result=await handle(formRequest(body),env,async (input,init) => {
    assert.equal(input,'https://6addd771a99d20b6b49a286d--xravity.netlify.app/');
    assert.equal(init.method,'POST');
    assert.equal(init.redirect,'manual');
    return Response.json({ok:true});
  });
  assert.deepEqual(await result.json(),{ok:true});
});
