// Read-only and anonymous-denial checks against the deployed assignment app.
const assert = require('node:assert/strict');
const site = (process.env.TEST_SITE_URL || 'https://gen-ui-git-feature-movie-one-liners-gen-ui2.vercel.app').replace(/\/$/, '');

(async () => {
  const html = await (await fetch(site)).text();
  const paths = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]))];
  const bundle = (await Promise.all(paths.map(async p => (await fetch(new URL(p, site))).text()))).join('\n');
  const supabaseUrl = bundle.match(/https:\/\/[a-z0-9]+\.supabase\.co/)?.[0];
  let key = bundle.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0];
  if (!key) key = [...bundle.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)]
    .map(match => match[0]).find(value => {
      try { return JSON.parse(Buffer.from(value.split('.')[1], 'base64url')).role === 'anon'; }
      catch { return false; }
    });
  assert(supabaseUrl && key, 'Public Supabase configuration not found');
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const publicReads = [
    ['movies', '/rest/v1/movies?select=id,title&limit=500'],
    ['published reviews', '/rest/v1/movie_reviews?select=id,movie_id,user_id,one_liner&limit=500'],
    ['public profiles', '/rest/v1/movie_public_profiles?select=user_id,handle&limit=500'],
  ];
  for (const [name, endpoint] of publicReads) {
    const response = await fetch(supabaseUrl + endpoint, { headers });
    assert.equal(response.status, 200, name);
    const data = await response.json();
    assert(Array.isArray(data));
    console.log(`PASS public ${name}: ${data.length} records`);
  }
  const aggregate = await fetch(supabaseUrl + '/rest/v1/rpc/movie_review_scores', { method: 'POST', headers, body: '{}' });
  assert.equal(aggregate.status, 200);
  assert(Array.isArray(await aggregate.json()));
  console.log('PASS public vote aggregates');
  for (const endpoint of [
    '/rest/v1/movie_review_drafts?select=id&limit=1',
    '/rest/v1/movie_review_votes?select=value&limit=1',
    '/rest/v1/movie_generation_usage?select=attempts&limit=1',
    '/rest/v1/movie_reviews?select=draft_id&limit=1',
  ]) {
    const response = await fetch(supabaseUrl + endpoint, { headers });
    assert([401, 403].includes(response.status), `Private data not denied: ${endpoint}`);
    console.log(`PASS private data denied: ${endpoint.split('?')[0]}`);
  }
  for (const [name, body] of [
    ['publish_movie_review', { p_draft_id: '00000000-0000-4000-8000-000000000000', p_selection: 0 }],
    ['claim_movie_generation_attempt', {}],
  ]) {
    const response = await fetch(supabaseUrl + '/rest/v1/rpc/' + name, { method: 'POST', headers, body: JSON.stringify(body) });
    const error = await response.json();
    assert([401, 403].includes(response.status) || (response.status === 400 && /Authentication required/i.test(error.message)), `${name} did not require authentication`);
    console.log(`PASS anonymous ${name} denied (HTTP ${response.status})`);
  }
  for (const route of ['/profile', '/private']) {
    const response = await fetch(site + route, { redirect: 'manual' });
    assert.equal(response.status, 307);
    assert.equal(response.headers.get('location'), '/login');
    console.log(`PASS ${route} redirects anonymous visitors`);
  }
  for (const route of ['/api/movies/generate', '/api/movies/publish']) {
    for (const origin of [site, 'https://other.invalid']) {
      const response = await fetch(site + route, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: '{}' });
      assert.equal(response.status, origin === site ? 401 : 403);
      console.log(`PASS ${route}: ${origin === site ? 'authentication' : 'origin'} check`);
    }
  }
  console.log('Live checks passed. No database records were created or changed.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
