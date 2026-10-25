/** Small, auditable event vocabulary. A click is never called a completed download. */
export function shouldTrack({ hostname, pathname = '/', doNotTrack, globalPrivacyControl }) {
  return ['xravity.xyz', 'www.xravity.xyz'].includes(hostname) &&
    !/^\/admin(?:\/|$)/.test(pathname) && doNotTrack !== '1' && doNotTrack !== 'yes' && !globalPrivacyControl;
}

export function linkEvent(href, { base, explicit, itemId, download = false } = {}) {
  let url;
  try { url = new URL(href, base || 'https://xravity.xyz/'); } catch { return null; }
  if (!['https:', 'http:'].includes(url.protocol)) return null;
  const file = url.pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const downloadable = download || ['dmg','zip','pkg','exe','msi','pdf','epub','tar','gz','7z','mp4','mov','mp3','wav'].includes(file);
  const name = ['download_entry_click', 'resource_open'].includes(explicit) ? explicit : downloadable ? 'download_click' : null;
  if (!name) return null;
  return { name, params: {
    // Strip query strings and fragments: never forward invitation codes or signed URLs.
    link_url: url.origin + url.pathname,
    ...(itemId ? { item_id: itemId.slice(0, 100) } : {}),
    ...(name === 'download_click' ? { file_extension: file || 'unknown' } : {}),
  } };
}

export function startAnalytics(measurementId) {
  if (!/^G-[A-Z0-9]+$/.test(measurementId || '') || !shouldTrack({
    hostname: location.hostname, pathname: location.pathname,
    doNotTrack: navigator.doNotTrack, globalPrivacyControl: navigator.globalPrivacyControl,
  })) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  const gtag = window.gtag;
  let referrer = '';
  try { const ref = new URL(document.referrer); referrer = ref.origin + ref.pathname; } catch {}
  gtag('js', new Date());
  gtag('config', measurementId, {
    page_location: location.origin + location.pathname,
    page_referrer: referrer,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  document.addEventListener('click', event => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    const tracked = linkEvent(anchor.getAttribute('href'), {
      base: location.href, explicit: anchor.dataset.analyticsEvent,
      itemId: anchor.dataset.analyticsId, download: anchor.hasAttribute('download'),
    });
    if (tracked) gtag('event', tracked.name, { ...tracked.params, send_to: measurementId });
  }, { capture: true });
}
