const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function load(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  }}).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, Response, Request, URL, AbortSignal, console,
    process: { env: { GEMINI_API_KEY: 'test-key' } },
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('@/lib/')) return load(name.slice(2) + '.ts', mocks, globals);
      return require(name);
    }, ...globals,
  }, { filename: file });
  return module.exports;
}

const impression = 'I liked the patient pacing and tense atmosphere, but not for a light movie night.';
const options = [
  'A tense slow burn for mystery fans who enjoy patient storytelling.',
  'Atmospheric suspense rewards patience, but skip it for a light movie night.',
  'A deliberate pace lets its tense atmosphere linger long after viewing.',
];
function generation() {
  const state = { authenticated: true, allowed: true, saved: null, prompts: [], options };
  const db = {
    auth: { getUser: async () => ({ data: { user: state.authenticated ? { id: 'viewer-a' } : null }, error: null }) },
    rpc: async () => ({ data: state.allowed, error: null }),
    from(table) {
      if (table === 'movies') return {
        select() { return this; }, eq() { return this; },
        maybeSingle: async () => ({ data: { id: 1, title: 'Test film', release_year: 2024, genres: ['Mystery'] }, error: null }),
      };
      assert.equal(table, 'movie_review_drafts');
      return {
        insert(data) { state.saved = data; return this; }, select() { return this; },
        single: async () => ({ data: { id: 'draft-a' }, error: null }),
      };
    },
  };
  const route = load('app/api/movies/generate/route.ts', { '@/lib/supabase/server': { createClient: async () => db } }, {
    fetch: async (url, init) => {
      state.prompts.push(JSON.parse(init.body).contents[0].parts[0].text);
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ options: state.options }) }] } }] });
    },
  });
  return { state, post: (body = {}, origin = 'https://cinema.test') => route.POST(new Request('https://cinema.test/api/movies/generate', {
    method: 'POST', headers: origin ? { origin } : {}, body: JSON.stringify({ movieId: 1, impression, tone: 'Serious', ...body }),
  })) };
}

test('generation gates origin, auth, quota and unsupported focus before calling the model', async () => {
  const { state, post } = generation();
  assert.equal((await post({}, null)).status, 403);
  assert.equal((await post({}, 'https://other.test')).status, 403);
  state.authenticated = false;
  assert.equal((await post()).status, 401);
  state.authenticated = true;
  assert.equal((await post({ focus: 'Invent facts' })).status, 400);
  assert.equal((await post({ impression: 'Too short' })).status, 400);
  state.allowed = false;
  assert.equal((await post()).status, 429);
  assert.equal(state.prompts.length, 0);
});

test('all focuses keep private notes, database-compatible tone and spoiler-free instructions', async () => {
  const { state, post } = generation();
  for (const focus of ['Overall verdict', "Who it's for", 'Mood & pace']) {
    const response = await post({ focus, spoilerFree: false });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).options.length, 3);
    assert.equal(state.saved.user_id, 'viewer-a');
    assert.equal(state.saved.impression, impression);
    assert.equal(state.saved.tone, 'Serious');
    assert.equal(state.saved.spoiler_free, true);
    assert(state.prompts.at(-1).includes(`Review focus: ${focus}`));
    assert(state.prompts.at(-1).includes('SPOILER-FREE:'));
    assert(state.prompts.at(-1).includes('Never invent plot facts'));
  }
  assert.equal((await post()).status, 200); // Older client without focus.
});

test('invalid generated alternatives cannot be saved or published', async () => {
  const { state, post } = generation();
  for (const invalid of [[options[0], options[0], options[2]], ['x', options[1], options[2]],
    ['This line has far too many words for a short film review and exceeds the fifteen word limit today.', options[1], options[2]]]) {
    state.options = invalid;
    assert.equal((await post()).status, 502);
    assert.equal(state.saved, null);
  }
});

test('publishing rejects untrusted choices and delegates the stored candidate to the ownership-checking RPC', async () => {
  let authenticated = false, rpcArgs;
  const db = {
    auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'viewer-a' } : null }, error: null }) },
    rpc: async (name, args) => { assert.equal(name, 'publish_movie_review'); rpcArgs = args; return { data: 'published-review', error: null }; },
  };
  const route = load('app/api/movies/publish/route.ts', { '@/lib/supabase/server': { createClient: async () => db } });
  const body = { draftId: '11111111-1111-4111-8111-111111111111', selection: 1 };
  const post = (value, origin = 'https://cinema.test') => route.POST(new Request('https://cinema.test/api/movies/publish', { method: 'POST', headers: { origin }, body: JSON.stringify(value) }));
  assert.equal((await post(body, 'https://other.test')).status, 403);
  assert.equal((await post(body)).status, 401);
  authenticated = true;
  for (const selection of [-1, 3, 1.5, null]) assert.equal((await post({ ...body, selection })).status, 400);
  assert.equal(rpcArgs, undefined);
  assert.equal((await post({ ...body, one_liner: 'Forged text', user_id: 'other-user' })).status, 200);
  assert.equal(JSON.stringify(rpcArgs), JSON.stringify({ p_draft_id: body.draftId, p_selection: 1 }));
});

test('login chooses profile setup for incomplete accounts and safe home return for completed accounts', async () => {
  const navigation = load('lib/movie-navigation.ts');
  for (const value of [null, [], '-1', '0', '1.5', '//other.test', '9007199254740992']) assert.equal(navigation.parseMovieId(value), null);
  let failure = false, complete = true, lookupFailed = false;
  const db = {
    auth: { exchangeCodeForSession: async () => ({ data: { user: { id: 'viewer-a' } }, error: failure ? new Error('failed') : null }) },
    from(table) {
      return { select() { return this; }, eq(key, value) { assert.equal(value, 'viewer-a'); return this; },
        maybeSingle: async () => ({ data: table === 'profiles' ? { first_name: 'Test', last_name: 'Viewer' } : complete ? { handle: 'movie_fan' } : null, error: lookupFailed ? new Error('lookup failed') : null }) };
    },
  };
  const route = load('app/auth/callback/route.ts', {
    'next/server': { NextResponse: { redirect: url => Response.redirect(url, 307) } },
    '@/lib/supabase/server': { createClient: async () => db },
  });
  let response = await route.GET(new Request('https://cinema.test/auth/callback?code=test&film=7', { headers: { 'x-forwarded-host': 'other.test' } }));
  assert.equal(response.headers.get('location'), 'https://cinema.test/?film=7');
  response = await route.GET(new Request('https://cinema.test/auth/callback?code=test&film=//other.test'));
  assert.equal(response.headers.get('location'), 'https://cinema.test/');
  complete = false;
  response = await route.GET(new Request('https://cinema.test/auth/callback?code=test&film=7'));
  assert.equal(response.headers.get('location'), 'https://cinema.test/profile?film=7');
  response = await route.GET(new Request('https://cinema.test/auth/callback?code=test'));
  assert.equal(response.headers.get('location'), 'https://cinema.test/profile');
  complete = true; lookupFailed = true;
  response = await route.GET(new Request('https://cinema.test/auth/callback?code=test'));
  assert.equal(response.headers.get('location'), 'https://cinema.test/profile');
  failure = true;
  response = await route.GET(new Request('https://cinema.test/auth/callback?code=test&film=7'));
  assert.equal(response.headers.get('location'), 'https://cinema.test/login?error=oauth&film=7');
});

test('sign-out clears the session and rejects cross-origin requests', async () => {
  let signouts = 0;
  const route = load('app/auth/signout/route.ts', {
    'next/server': { NextResponse: { redirect: (url, options) => Response.redirect(url, options.status) } },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { signOut: async () => { signouts++; } } }) },
  });
  assert.equal((await route.POST(new Request('https://cinema.test/auth/signout', { method: 'POST', headers: { origin: 'https://other.test' } }))).status, 403);
  assert.equal(signouts, 0);
  const response = await route.POST(new Request('https://cinema.test/auth/signout', { method: 'POST', headers: { origin: 'https://cinema.test' } }));
  assert.equal(signouts, 1);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), 'https://cinema.test/');
});

test('saved films survive serialization and reject corrupt or invalid browser data', () => {
  const { readSavedMovieIds } = load('lib/saved-movies.ts');
  assert.equal(JSON.stringify(readSavedMovieIds(JSON.stringify([7, 1, 7, -1, '2', null, 0, 1.5]))), '[7,1]');
  for (const value of [null, '{bad json', 'null', '{}']) assert.equal(readSavedMovieIds(value).length, 0);
});

function descendants(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(child => descendants(child, predicate));
  return [...(predicate(node) ? [node] : []), ...descendants(node.props?.children, predicate)];
}

test('rendered Helpful controls insert, switch, cancel and preserve another voter; anonymous clicks go to login', async () => {
  const React = require('react');
  const hooks = [], rows = [{ review_id: 'review-a', user_id: 'viewer-b', value: -1 }];
  let cursor = 0, refreshes = 0, navigated;
  const db = { from(table) {
    assert.equal(table, 'movie_review_votes');
    let operation, fields, filters = {};
    return {
      insert(value) { operation = 'insert'; fields = value; return this; },
      update(value) { operation = 'update'; fields = value; return this; },
      delete() { operation = 'delete'; return this; },
      eq(key, value) { filters[key] = value; return this; },
      then(resolve, reject) {
        if (operation === 'insert') rows.push(fields);
        else {
          assert.equal(filters.user_id, 'viewer-a');
          const i = rows.findIndex(row => Object.entries(filters).every(([key, value]) => row[key] === value));
          if (i >= 0) {
            if (operation === 'delete') rows.splice(i, 1);
            else rows[i] = { ...rows[i], ...fields };
          }
        }
        return Promise.resolve({ error: null }).then(resolve, reject);
      },
    };
  } };
  const component = load('app/movie-reviews.tsx', {
    react: { ...React, useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value; }]; }, useTransition: () => [false, fn => fn()] },
    'next/link': props => props.children,
    'next/navigation': { useRouter: () => ({ refresh: () => refreshes++, push: url => { navigated = url; } }) },
    '@/lib/supabase/client': { createClient: () => db },
    './movie-review-composer': { default: () => null, __esModule: true },
  }).default;
  const props = { movie: { id: 7, title: 'Test film' }, reviews: [{ id: 'review-a', movie_id: 7, one_liner: options[0], tone: 'Serious', created_at: '2026-10-11' }], scores: [], loadError: false };
  function draw(userId = 'viewer-a') { cursor = 0; return component({ ...props, userId, votes: rows.filter(row => row.user_id === userId) }); }
  async function click(value, userId) {
    const tree = draw(userId);
    const button = descendants(tree, node => node.type === 'button' && node.props['aria-label']?.endsWith(value === 1 ? ' as helpful' : ' as not helpful'))[0];
    assert(button && !button.props.disabled);
    button.props.onClick();
    await new Promise(resolve => setImmediate(resolve));
  }
  await click(1); assert.equal(rows.find(row => row.user_id === 'viewer-a').value, 1);
  await click(-1); assert.equal(rows.find(row => row.user_id === 'viewer-a').value, -1);
  await click(-1); assert.equal(rows.some(row => row.user_id === 'viewer-a'), false);
  assert.equal(rows.find(row => row.user_id === 'viewer-b').value, -1);
  assert.equal(refreshes, 3);
  await click(1, null); assert.equal(navigated, '/login?film=7');
  assert.equal(rows.length, 1);
});

test('profile completeness requires both names and a public username', () => {
  const { hasCompleteProfile } = load('lib/profile-onboarding.ts');
  assert.equal(hasCompleteProfile({ first_name: 'Test', last_name: 'Viewer' }, { handle: 'movie_fan' }), true);
  for (const [profile, publicProfile] of [[null, null], [{ first_name: 'Test', last_name: 'Viewer' }, null], [{ first_name: ' ', last_name: 'Viewer' }, { handle: 'movie_fan' }], [{ first_name: 'Test', last_name: '' }, { handle: 'movie_fan' }]]) {
    assert.equal(hasCompleteProfile(profile, publicProfile), false);
  }
});

test('profile onboarding requires names, stays after a failed save, and continues only after both records save', async () => {
  const React = require('react');
  const hooks = [], writes = [];
  let cursor = 0, privateFailure = true, nextPath, refreshes = 0, publicExists = false;
  const component = load('app/profile/profile-form.tsx', {
    react: { ...React, useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value; }]; } },
    'next/link': props => props.children,
    'next/navigation': { useRouter: () => ({ replace: path => { nextPath = path; }, refresh: () => refreshes++ }) },
    '@/lib/supabase/client': { createClient: () => ({ from(table) {
      return {
        select() { return this; }, eq(key, value) { assert.equal(value, 'viewer-a'); return this; },
        maybeSingle: async () => ({ data: publicExists ? { user_id: 'viewer-a' } : null, error: null }),
        insert(data) { writes.push({ table, data }); publicExists = true; return Promise.resolve({ error: null }); },
        update(data) { writes.push({ table, data }); return { eq: async (key, value) => { assert.equal(value, 'viewer-a'); return { error: null }; } }; },
        upsert(data) { writes.push({ table, data }); return Promise.resolve({ error: privateFailure ? { message: 'test failure' } : null }); },
      };
    } }) },
  }).default;
  const props = { userId: 'viewer-a', email: 'test@example.invalid', initialFirstName: '', initialLastName: '', initialHandle: '', initialBio: '', initialAvatarUrl: '', onboarding: true, returnMovieId: 7 };
  function draw() { cursor = 0; return component(props); }
  async function submit() { await draw().props.onSubmit({ preventDefault() {} }); }
  function fill(placeholder, value) {
    const input = descendants(draw(), node => node.type === 'input' && node.props.placeholder === placeholder)[0];
    assert(input); input.props.onChange({ target: { value } });
  }
  await submit(); assert.equal(writes.length, 0); assert.equal(nextPath, undefined);
  fill('First name', 'Test'); fill('Last name', 'Viewer'); fill('movie_fan', 'movie_fan');
  await submit(); assert.equal(nextPath, undefined); assert.equal(refreshes, 0);
  privateFailure = false;
  await submit(); assert.equal(nextPath, '/?film=7'); assert.equal(refreshes, 1);
  assert.equal(writes.at(-1).table, 'profiles'); assert.equal(writes.at(-1).data.first_name, 'Test');
  assert.equal(writes.at(-1).data.last_name, 'Viewer');
  props.onboarding = false;
  nextPath = undefined;
  await submit(); assert.equal(nextPath, undefined); assert.equal(refreshes, 2);
});
