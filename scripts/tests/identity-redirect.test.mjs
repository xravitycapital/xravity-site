import test from 'node:test';
import assert from 'node:assert/strict';
import {identityRedirect} from '../../src/utils/identity-redirect.mjs';

test('Identity callbacks preserve query before hash and stay on the current origin', () => {
  for (const origin of ['https://xravity.xyz','https://cloudflare-preview-xravity-site.xravity.workers.dev']) {
    for (const key of ['invite_token','recovery_token','confirmation_token']) {
      const result=identityRedirect(`${origin}/?lang=zh#${key}=test-only`);
      assert.equal(result,`/admin/?lang=zh#${key}=test-only`);
      assert.equal(new URL(result,origin).origin,origin);
    }
  }
});

test('ordinary anchors and unrelated error text never trigger account recovery', () => {
  for(const suffix of ['#vision','#vision-error','#section=recovery_token','#error=','#recovery_token=','']) {
    assert.equal(identityRedirect('https://xravity.xyz/'+suffix),null);
  }
});

test('Identity errors reach Admin; existing Admin paths never redirect again', () => {
  assert.equal(identityRedirect('https://xravity.xyz/#error=access_denied&error_description=Expired'),'/admin/#error=access_denied&error_description=Expired');
  for(const path of ['/admin','/admin/','/admin/index.html']) {
    assert.equal(identityRedirect(`https://xravity.xyz${path}#recovery_token=test-only`),null);
  }
  assert.equal(identityRedirect('javascript:alert(1)#recovery_token=test-only'),null);
  assert.equal(identityRedirect('invalid'),null);
});
