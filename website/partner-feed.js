// Accept display fields only. Never render arbitrary markup or unsafe URLs.
export function normalizePartners(rows) {
  if (!Array.isArray(rows)) throw new Error('Invalid partner feed');
  return rows.filter(row => row && typeof row.id === 'string' && typeof row.name === 'string' && typeof row.image === 'string' && /^https:\/\//.test(row.image)).map(row => ({
    id: row.id, name: row.name, image: row.image,
    caption: row.caption && typeof row.caption === 'object'
      ? Object.fromEntries(['ar', 'en', 'he'].filter(lang => typeof row.caption[lang] === 'string' && row.caption[lang].trim()).map(lang => [lang, row.caption[lang].trim()]))
      : null,
  }));
}

export async function fetchWebsitePartners(config, signal, request = fetch) {
  const response = await request(`${config.url}/rest/v1/rpc/get_website_partners`, {
    method: 'POST', headers: {apikey: config.key, 'Content-Type': 'application/json'},
    body: '{}', cache: 'no-store', credentials: 'omit', signal,
  });
  if (!response.ok) throw new Error('Partner feed unavailable');
  return normalizePartners(await response.json());
}
