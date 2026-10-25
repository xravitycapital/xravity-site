/** Return a same-origin Admin path for an Identity callback, without storing or
 * logging its token. Replace navigation cannot loop because Admin is standalone.
 * @param {string} href
 * @returns {string|null}
 */
export function identityRedirect(href) {
  let url;
  try { url = new URL(href); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol) || /^\/admin(?:\/|$)/.test(url.pathname)) return null;
  const callback = new URLSearchParams(url.hash.slice(1));
  const recognized = ['invite_token', 'recovery_token', 'confirmation_token', 'error', 'error_description']
    .some(key => Boolean(callback.get(key)));
  if (!recognized) return null;
  return '/admin/' + url.search + url.hash;
}
