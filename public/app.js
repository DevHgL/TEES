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
let currentTrainerId = localStorage.getItem('trainerId');

// ---------- helpers ----------

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
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

// ---------- treinadores ----------

async function loadTrainers() {
  const trainers = await api('/trainers');
  const select = $('#trainer-select');

  if (!trainers.some((t) => t.id === currentTrainerId)) {
    currentTrainerId = trainers[0]?.id ?? null;
  }

  select.innerHTML = trainers.length
    ? trainers
        .map(
          (t) =>
            `<option value="${t.id}" ${t.id === currentTrainerId ? 'selected' : ''}>${escapeHtml(t.name)}</option>`,
        )
        .join('')
    : '<option value="">Nenhum treinador</option>';

  saveTrainer(currentTrainerId);
  if (!trainers.length) $('#trainer-form').hidden = false;
}

function saveTrainer(id) {
  currentTrainerId = id;
  if (id) localStorage.setItem('trainerId', id);
  else localStorage.removeItem('trainerId');
}

$('#trainer-select').addEventListener('change', (e) => {
  saveTrainer(e.target.value);
  if (!$('#tab-team').hidden) loadTeam();
});

$('#new-trainer-btn').addEventListener('click', () => {
  $('#trainer-form').hidden = !$('#trainer-form').hidden;
});

$('#trainer-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  try {
    const trainer = await api('/trainers', {
      method: 'POST',
      body: JSON.stringify({ name: form.name.value, email: form.email.value }),
    });
    saveTrainer(trainer.id);
    form.reset();
    form.hidden = true;
    await loadTrainers();
    toast(`Treinador ${trainer.name} cadastrado!`);
  } catch (err) {
    toast(err.message, true);
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
      action: `<button id="capture-btn" ${currentTrainerId ? '' : 'disabled'}>Capturar</button>`,
    });
    $('#capture-btn').addEventListener('click', () => capture(p.name));
  } catch (err) {
    out.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
});

async function capture(pokemonName) {
  const nickname = prompt('Apelido (opcional):')?.trim();
  try {
    const c = await api(`/trainers/${currentTrainerId}/captures`, {
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

  if (!currentTrainerId) {
    summary.textContent = 'Cadastre ou selecione um treinador.';
    grid.innerHTML = '';
    return;
  }

  try {
    const team = await api(`/trainers/${currentTrainerId}/team`);
    summary.textContent = `${team.size} de ${team.maxSize} Pokémons no time ativo.`;
    const empty = Array.from(
      { length: team.maxSize - team.size },
      () => '<div class="card empty">Vaga livre</div>',
    );
    grid.innerHTML = team.pokemons
      .map((p) =>
        pokemonCard(p, {
          subtitle: `#${p.pokedexNumber}${p.nickname ? ` · ${escapeHtml(p.name)}` : ''}`,
        }),
      )
      .concat(empty)
      .join('');
  } catch (err) {
    summary.textContent = '';
    grid.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
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

// ---------- abas ----------

const TAB_LOADERS = { team: loadTeam, catalog: loadCatalog, stats: loadStats };

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

loadTrainers()
  .then(() => {
    // "Meu time" depende do treinador validado; recarrega quando a lista chega.
    if (!$('#tab-team').hidden) loadTeam();
  })
  .catch((err) => toast(err.message, true));
openTab(location.hash.slice(1));
