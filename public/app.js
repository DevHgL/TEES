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

// ---------- sessão (JWT em memória + refresh token em cookie httpOnly) ----------

// O access token fica só nesta variável: nada de token no localStorage, onde qualquer
// script injetado (XSS) poderia lê-lo. O refresh token está num cookie httpOnly que o
// JavaScript nem enxerga; ao recarregar a página, a sessão é restaurada por ele.
let session = null; // { accessToken, trainer }

// Só um aviso de "há uma sessão" (sem nenhum segredo), para não chamar /auth/refresh à toa
// quando o visitante nunca entrou.
const SESSION_HINT_KEY = 'pokemanager-has-session';

function storage(action, key, value) {
  try {
    if (action === 'get') return localStorage.getItem(key);
    if (action === 'set') localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // Armazenamento indisponível (ex: navegação privada): só perdemos o aviso.
  }
  return null;
}

// Versões anteriores guardavam os tokens no localStorage: apaga o que tiver sobrado.
storage('remove', 'pokemanager-session');

function saveSession(next) {
  session = next;
  if (next) storage('set', SESSION_HINT_KEY, '1');
  else storage('remove', SESSION_HINT_KEY);
  renderSession();
}

const isLoggedIn = () => Boolean(session?.accessToken);
const canManageRoles = () => ['GYM_LEADER', 'ADMIN'].includes(session?.trainer?.role);

// Cada refresh troca o cookie e invalida o anterior; dois refreshes com o mesmo cookie
// seriam tratados pelo servidor como roubo (e derrubariam todas as sessões). Por isso:
// uma renovação por vez nesta aba e, com Web Locks, uma por vez entre as abas.
let refreshing = null;

async function requestRefresh() {
  const res = await fetch(`${API}/auth/refresh`, { method: 'POST' });
  if (!res.ok) {
    saveSession(null);
    throw new Error('Sua sessão expirou. Entre novamente.');
  }
  const { accessToken } = await res.json();
  let trainer = session?.trainer;
  if (!trainer) {
    const me = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!me.ok) {
      saveSession(null);
      throw new Error('Não foi possível restaurar a sessão. Entre novamente.');
    }
    trainer = await me.json();
  }
  saveSession({ accessToken, trainer });
}

function refreshSession() {
  refreshing ??= (
    navigator.locks
      ? navigator.locks.request('pokemanager-refresh', requestRefresh)
      : requestRefresh()
  ).finally(() => (refreshing = null));
  return refreshing;
}

/** Ao abrir a página: se havia sessão, recupera um access token pelo cookie. */
async function restoreSession() {
  if (!storage('get', SESSION_HINT_KEY)) return;
  await refreshSession().catch(() => {});
}

// ---------- helpers ----------

async function api(path, options = {}, retry = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;

  const res = await fetch(API + path, { ...options, headers });

  // Access token expirado: renova com o refresh token e repete a requisição uma vez.
  if (res.status === 401 && retry && isLoggedIn()) {
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
  } else {
    $('#delete-account-form').hidden = true;
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
    saveSession({ accessToken: login.accessToken, trainer: login.trainer });
    form.reset();
    toast(`Bem-vindo(a), ${login.trainer.name}!`);
    reloadCurrentTab();
  } catch (err) {
    toast(err.message, true);
  }
});

$('#logout-btn').addEventListener('click', async () => {
  saveSession(null);
  // O servidor revoga o refresh token do cookie e apaga o cookie.
  await fetch(`${API}/auth/logout`, { method: 'POST' }).catch(() => {});
  toast('Você saiu.');
  if (!$('#tab-admin').hidden) openTab('pokedex');
  else reloadCurrentTab();
});

// ---------- excluir conta ----------

function closeDeleteAccountForm() {
  const form = $('#delete-account-form');
  form.reset();
  form.hidden = true;
}

$('#delete-account-btn').addEventListener('click', () => {
  const form = $('#delete-account-form');
  if (!form.hidden) return closeDeleteAccountForm();
  form.hidden = false;
  form.password.focus();
});

$('#delete-account-cancel').addEventListener('click', closeDeleteAccountForm);

$('#delete-account-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    // A API exige a senha atual: só o token não basta para apagar a conta.
    await api('/me', { method: 'DELETE', body: JSON.stringify({ password: form.password.value }) });
    const { name } = session.trainer;
    closeDeleteAccountForm();
    saveSession(null);
    toast(`A conta de ${name} foi excluída.`);
    if (!$('#tab-admin').hidden) openTab('pokedex');
    else reloadCurrentTab();
  } catch (err) {
    form.password.select();
    toast(err.message, true);
  } finally {
    submit.disabled = false;
  }
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
          action: `<div class="card-actions">
            <button class="ghost rename-btn" data-id="${p.id}" data-nickname="${escapeHtml(p.nickname ?? '')}" data-species="${escapeHtml(p.name)}">Renomear</button>
            <button class="ghost release-btn" data-id="${p.id}" data-name="${escapeHtml(p.nickname || p.name)}">Soltar</button>
          </div>`,
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
  const rename = e.target.closest('.rename-btn');
  if (rename) return renameCapture(rename.dataset);

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

async function renameCapture({ id, nickname, species }) {
  const input = prompt(`Apelido para ${species} (deixe vazio para remover):`, nickname);
  if (input === null) return; // cancelou
  const next = input.trim() || null;
  if (next === (nickname || null)) return;
  try {
    const c = await api(`/me/team/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ nickname: next }),
    });
    toast(
      c.nickname ? `${species} agora se chama ${c.nickname}.` : `Apelido de ${species} removido.`,
    );
    loadTeam();
  } catch (err) {
    toast(err.message, true);
  }
}

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

const adminState = { page: 1, search: '' };

async function loadAdmin() {
  const table = $('#admin-trainers');
  const pager = $('#admin-pager');
  if (!canManageRoles()) {
    pager.hidden = true;
    table.innerHTML =
      '<tbody><tr><td class="muted">Acesso restrito a GYM_LEADER e ADMIN.</td></tr></tbody>';
    return;
  }
  try {
    const params = new URLSearchParams({
      page: adminState.page,
      limit: 10,
      ...(adminState.search && { search: adminState.search }),
    });
    const result = await api(`/trainers?${params}`);
    const trainers = result.data;
    const me = session.trainer;

    pager.hidden = result.totalPages <= 1;
    $('#admin-page-info').textContent =
      `Página ${result.page} de ${result.totalPages} · ${result.total} treinadores`;
    $('#admin-prev').disabled = result.page <= 1;
    $('#admin-next').disabled = result.page >= result.totalPages;

    if (!trainers.length) {
      table.innerHTML =
        '<tbody><tr><td class="muted">Nenhum treinador encontrado.</td></tr></tbody>';
      return;
    }

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
    pager.hidden = true;
    table.innerHTML = `<tbody><tr><td class="error">${escapeHtml(err.message)}</td></tr></tbody>`;
  }
}

$('#admin-form').addEventListener('submit', (e) => {
  e.preventDefault();
  adminState.search = e.target.search.value.trim();
  adminState.page = 1;
  loadAdmin();
});

$('#admin-prev').addEventListener('click', () => {
  adminState.page -= 1;
  loadAdmin();
});

$('#admin-next').addEventListener('click', () => {
  adminState.page += 1;
  loadAdmin();
});

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

restoreSession().finally(() => {
  renderSession();
  openTab(location.hash.slice(1));
});
