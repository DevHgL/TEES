const API = '/api/v1';
const STAT_LABELS = {
  hp: 'HP',
  attack: 'Atq',
  defense: 'Def',
  specialAttack: 'Atq Esp',
  specialDefense: 'Def Esp',
  speed: 'Vel',
};

const $ = (sel) => document.querySelector(sel);

// ---------- sessão (JWT + refresh token) ----------

const SESSION_KEY = 'pokemanager-session';

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? null;
  } catch {
    return null;
  }
}

let session = loadSession();

function saveSession(next) {
  session = next;
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Armazenamento indisponível (ex: navegação privada): a sessão vale só nesta aba.
  }
  renderSession();
}

const isLoggedIn = () => Boolean(session?.accessToken);
const canManageRoles = () => ['GYM_LEADER', 'ADMIN'].includes(session?.trainer?.role);

// Uma única renovação por vez: se várias requisições recebem 401 juntas, todas esperam
// o mesmo refresh. Reenviar o mesmo refresh token seria tratado pelo servidor como roubo.
let refreshing = null;

async function refreshSession() {
  refreshing ??= (async () => {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    if (!res.ok) {
      saveSession(null);
      throw new Error('Sua sessão expirou. Entre novamente.');
    }
    const tokens = await res.json();
    saveSession({ ...session, ...tokens });
  })().finally(() => (refreshing = null));
  return refreshing;
}

// ---------- helpers ----------

async function api(path, options = {}, retry = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;

  const res = await fetch(API + path, { ...options, headers });

  // Access token expirado: renova com o refresh token e repete a requisição uma vez.
  if (res.status === 401 && retry && session?.refreshToken) {
    await refreshSession();
    return api(path, options, false);
  }

  const body = res.status === 204 ? null : await res.json();
  if (!res.ok) {
    const details = body?.errors?.map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new Error(details || body?.message || `Erro ${res.status}`);
  }
  return body;
}

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

let toastTimer;
function toast(message, isError = false) {
  const el = $('#toast');
  el.textContent = message;
  el.className = isError ? 'toast error' : 'toast';
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 3500);
}

function pokemonCard(p, { big = false, subtitle = '', action = '' } = {}) {
  const types = p.types
    .map((t) => `<span class="type ${escapeHtml(t)}">${escapeHtml(t)}</span>`)
    .join('');
  const stats = Object.entries(STAT_LABELS)
    .map(([key, label]) => {
      const v = p.baseStats[key];
      return `<span>${label}</span><strong>${v}</strong>
        <div class="bar"><span style="width:${Math.min(100, (v / 180) * 100)}%"></span></div>`;
    })
    .join('');
  const img = p.imageUrl
    ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" loading="lazy" />`
    : '';

  return `<article class="card ${big ? 'big' : ''}">
    ${img}
    <h3>${escapeHtml(p.nickname || p.name)}</h3>
    ${subtitle ? `<div class="sub">${subtitle}</div>` : ''}
    <div class="types">${types}</div>
    <div class="stats">${stats}</div>
    ${action}
  </article>`;
}

// ---------- login / cadastro ----------

let authMode = 'login';

function renderSession() {
  $('#logged-out').hidden = isLoggedIn();
  $('#logged-in').hidden = !isLoggedIn();
  $('#admin-tab-btn').hidden = !canManageRoles();
  if (isLoggedIn()) {
    const { name, role } = session.trainer;
    $('#user-label').textContent = `${name} · ${role}`;
    $('#auth-form').hidden = true;
  }
  const captureBtn = $('#capture-btn');
  if (captureBtn) captureBtn.disabled = !isLoggedIn();
}

function openAuthForm(mode) {
  const form = $('#auth-form');
  if (!form.hidden && authMode === mode) {
    form.hidden = true;
    return;
  }
  authMode = mode;
  form.hidden = false;
  form.name.hidden = mode !== 'register';
  form.name.required = mode === 'register';
  form.password.autocomplete = mode === 'register' ? 'new-password' : 'current-password';
  $('#auth-submit').textContent = mode === 'register' ? 'Criar conta' : 'Entrar';
  $('#auth-hint').textContent =
    mode === 'register' ? 'Senha: 8+ caracteres, com letra e número.' : '';
  (mode === 'register' ? form.name : form.email).focus();
}

$('#login-btn').addEventListener('click', () => openAuthForm('login'));
$('#register-btn').addEventListener('click', () => openAuthForm('register'));

$('#auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const credentials = { email: form.email.value, password: form.password.value };
  try {
    if (authMode === 'register') {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: form.name.value, ...credentials }),
      });
    }
    const login = await api('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    saveSession(login);
    form.reset();
    toast(`Bem-vindo(a), ${login.trainer.name}!`);
    reloadCurrentTab();
  } catch (err) {
    toast(err.message, true);
  }
});

$('#logout-btn').addEventListener('click', async () => {
  const refreshToken = session?.refreshToken;
  saveSession(null);
  if (refreshToken) {
    await api('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(
      () => {},
    );
  }
  toast('Você saiu.');
  if (!$('#tab-admin').hidden) openTab('pokedex');
  else reloadCurrentTab();
});

// ---------- pokédex ----------

$('#search-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = e.target.name.value.trim();
  const out = $('#search-result');
  out.innerHTML = '<p class="muted">Buscando...</p>';

  try {
    const p = await api(`/pokedex/search?name=${encodeURIComponent(name)}`);
    out.innerHTML = pokemonCard(p, {
      big: true,
      subtitle: `#${p.pokedexNumber} · ${p.height} m · ${p.weight} kg`,
      action: `<button id="capture-btn" ${isLoggedIn() ? '' : 'disabled'}>Capturar</button>
        ${isLoggedIn() ? '' : '<span class="muted">Entre para capturar.</span>'}`,
    });
    $('#capture-btn').addEventListener('click', () => capture(p.name));
  } catch (err) {
    out.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
});

async function capture(pokemonName) {
  const nickname = prompt('Apelido (opcional):')?.trim();
  try {
    const c = await api('/me/team/catch', {
      method: 'POST',
      body: JSON.stringify({ pokemonName, ...(nickname ? { nickname } : {}) }),
    });
    toast(`${c.nickname || c.name} foi capturado!`);
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- time ----------

async function loadTeam() {
  const grid = $('#team-grid');
  const summary = $('#team-summary');

  if (!isLoggedIn()) {
    summary.textContent = 'Entre na sua conta para ver o seu time.';
    grid.innerHTML = '';
    return;
  }

  try {
    const team = await api('/me/team');
    summary.textContent = `${team.size} de ${team.maxSize} Pokémons no time ativo.`;
    const empty = Array.from(
      { length: team.maxSize - team.size },
      () => '<div class="card empty">Vaga livre</div>',
    );
    grid.innerHTML = team.pokemons
      .map((p) =>
        pokemonCard(p, {
          subtitle: `#${p.pokedexNumber}${p.nickname ? ` · ${escapeHtml(p.name)}` : ''}`,
          action: `<button class="ghost release-btn" data-id="${p.id}" data-name="${escapeHtml(p.nickname || p.name)}">Soltar</button>`,
        }),
      )
      .concat(empty)
      .join('');
  } catch (err) {
    summary.textContent = '';
    grid.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
}

$('#team-grid').addEventListener('click', async (e) => {
  const btn = e.target.closest('.release-btn');
  if (!btn || !confirm(`Soltar ${btn.dataset.name}? Isso não pode ser desfeito.`)) return;
  try {
    await api(`/me/team/${btn.dataset.id}`, { method: 'DELETE' });
    toast(`${btn.dataset.name} foi solto.`);
    loadTeam();
  } catch (err) {
    toast(err.message, true);
  }
});

// ---------- catálogo local ----------

const CATALOG_PAGE_SIZE = 12;
const catalogState = { page: 1, name: '', type: '' };

async function loadCatalog() {
  const grid = $('#catalog-grid');
  const pager = $('#catalog-pager');
  const params = new URLSearchParams({
    page: catalogState.page,
    limit: CATALOG_PAGE_SIZE,
    ...(catalogState.name && { name: catalogState.name }),
    ...(catalogState.type && { type: catalogState.type }),
  });

  try {
    const result = await api(`/pokemons?${params}`);
    grid.innerHTML = result.data.length
      ? result.data.map((p) => pokemonCard(p)).join('')
      : '<p class="muted">Nenhum Pokémon encontrado.</p>';

    pager.hidden = result.totalPages <= 1;
    $('#page-info').textContent =
      `Página ${result.page} de ${result.totalPages} · ${result.total} Pokémons`;
    $('#prev-page').disabled = result.page <= 1;
    $('#next-page').disabled = result.page >= result.totalPages;
  } catch (err) {
    pager.hidden = true;
    grid.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
}

$('#catalog-form').addEventListener('submit', (e) => {
  e.preventDefault();
  catalogState.name = e.target.name.value.trim();
  catalogState.type = e.target.type.value.trim();
  catalogState.page = 1;
  loadCatalog();
});

$('#prev-page').addEventListener('click', () => {
  catalogState.page -= 1;
  loadCatalog();
});

$('#next-page').addEventListener('click', () => {
  catalogState.page += 1;
  loadCatalog();
});

// ---------- estatísticas ----------

/** Lista de barras horizontais: rótulo (identidade) + barra (magnitude) + valor. */
function barList(items, { label, value, unit }) {
  if (!items.length) return '<p class="muted">Nenhuma captura ainda.</p>';
  const max = Math.max(...items.map(value));
  return `<ul class="bars">${items
    .map((item) => {
      const v = value(item);
      const text = `${v} ${v === 1 ? unit[0] : unit[1]}`;
      return `<li title="${escapeHtml(item.name ?? item.type)}: ${text}">
        <span class="bar-label">${label(item)}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${(v / max) * 100}%"></span></span>
        <span class="bar-value">${v}</span>
      </li>`;
    })
    .join('')}</ul>`;
}

async function loadStats() {
  try {
    const s = await api('/stats');
    const t = s.totals;
    const fmt = (n) => n.toLocaleString('pt-BR');

    $('#stats-totals').innerHTML = [
      ['Treinadores', fmt(t.trainers)],
      ['Capturas', fmt(t.captures)],
      ['Média por time', `${fmt(t.averageTeamSize)} / 6`],
      ['Catálogo local', fmt(t.catalogPokemons)],
      ['Em cache (PokéAPI)', fmt(t.cachedPokedexEntries)],
    ]
      .map(
        ([label, value]) =>
          `<div class="tile"><span>${label}</span><strong>${value}</strong></div>`,
      )
      .join('');

    $('#stats-captured').innerHTML = barList(s.mostCaptured, {
      label: (p) =>
        `${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="" />` : ''}${escapeHtml(p.name)}`,
      value: (p) => p.timesCaptured,
      unit: ['captura', 'capturas'],
    });

    $('#stats-types').innerHTML = barList(s.capturesByType, {
      label: (row) => `<span class="type ${escapeHtml(row.type)}">${escapeHtml(row.type)}</span>`,
      value: (row) => row.count,
      unit: ['Pokémon', 'Pokémons'],
    });

    $('#stats-trainers').innerHTML = s.topTrainers.length
      ? `<thead><tr><th>#</th><th>Treinador</th><th class="num">Time</th><th class="num">Soma dos atributos</th></tr></thead>
         <tbody>${s.topTrainers
           .map(
             (tr, i) =>
               `<tr><td>${i + 1}º</td><td>${escapeHtml(tr.name)}</td><td class="num">${tr.teamSize} / 6</td><td class="num">${fmt(tr.totalBaseStats)}</td></tr>`,
           )
           .join('')}</tbody>`
      : '<tbody><tr><td class="muted">Nenhum treinador cadastrado.</td></tr></tbody>';
  } catch (err) {
    $('#stats-totals').innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
}

// ---------- admin (RBAC) ----------

const ROLES = ['TRAINER', 'GYM_LEADER', 'ADMIN'];

async function loadAdmin() {
  const table = $('#admin-trainers');
  if (!canManageRoles()) {
    table.innerHTML =
      '<tbody><tr><td class="muted">Acesso restrito a GYM_LEADER e ADMIN.</td></tr></tbody>';
    return;
  }
  try {
    const trainers = await api('/trainers');
    const me = session.trainer;
    table.innerHTML = `<thead><tr><th>Treinador</th><th>E-mail</th><th>Perfil</th></tr></thead>
      <tbody>${trainers
        .map((t) => {
          // A interface só esconde o que não pode; quem garante a regra é o servidor.
          const locked = t.id === me.id || (t.role === 'ADMIN' && me.role !== 'ADMIN');
          const options = ROLES.filter(
            (r) => r !== 'ADMIN' || me.role === 'ADMIN' || t.role === 'ADMIN',
          )
            .map((r) => `<option ${r === t.role ? 'selected' : ''}>${r}</option>`)
            .join('');
          return `<tr><td>${escapeHtml(t.name)}${t.id === me.id ? ' (você)' : ''}</td>
            <td>${escapeHtml(t.email)}</td>
            <td><select class="role-select" data-id="${t.id}" ${locked ? 'disabled' : ''}>${options}</select></td></tr>`;
        })
        .join('')}</tbody>`;
  } catch (err) {
    table.innerHTML = `<tbody><tr><td class="error">${escapeHtml(err.message)}</td></tr></tbody>`;
  }
}

$('#admin-trainers').addEventListener('change', async (e) => {
  const select = e.target.closest('.role-select');
  if (!select) return;
  try {
    const t = await api(`/trainers/${select.dataset.id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: select.value }),
    });
    toast(`${t.name} agora é ${t.role}.`);
  } catch (err) {
    toast(err.message, true);
  }
  loadAdmin();
});

// ---------- abas ----------

const TAB_LOADERS = { team: loadTeam, catalog: loadCatalog, stats: loadStats, admin: loadAdmin };

function reloadCurrentTab() {
  const active = document.querySelector('.tabs button.active')?.dataset.tab;
  if (active) TAB_LOADERS[active]?.();
}

function openTab(tab) {
  if (!document.getElementById(`tab-${tab}`)) tab = 'pokedex';
  document.querySelectorAll('.tabs button').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === tab);
    if (b.dataset.tab === tab) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
  document.querySelectorAll('main > section').forEach((s) => {
    s.hidden = s.id !== `tab-${tab}`;
  });
  TAB_LOADERS[tab]?.();
}

// A aba aberta fica na URL (#stats, #team...), então recarregar a página mantém a aba.
document.querySelectorAll('.tabs button').forEach((btn) => {
  btn.addEventListener('click', () => {
    history.replaceState(null, '', `#${btn.dataset.tab}`);
    openTab(btn.dataset.tab);
  });
});

renderSession();
openTab(location.hash.slice(1));
