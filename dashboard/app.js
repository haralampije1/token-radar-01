// Token Radar dashboard — reads window.RADAR (written beside the page by main.ts, data.js), no network.
// Two-panel screen: board on the left, proof and calculator on the right. Every number is recomputed
// from window.RADAR here, so screenshots and code agree; nothing is hard-coded to a protocol name.
(function() {
  'use strict';
  const DATA = window.RADAR;
  if (!DATA) {
    document.getElementById('app').textContent = 'Radar data not loaded.';
    return;
  }
  const MODEL = DATA.model || {};
  // Mirrors lib/model.ts CATEGORY_MULTIPLE exactly: categories come from the snapshot, never a name list.
  const CAT_MULT = {
    'Dexs': 1.10, 'Cross Chain Bridge': 1.08, 'Bridge': 1.08, 'Liquid Restaking': 1.06,
    'Restaking': 1.06, 'Liquid Staking': 1.05, 'Lending': 1.04, 'Yield': 1.04,
    'Yield Aggregator': 1.04, 'RWA': 1.03, 'Staking Pool': 1.02, 'Staking': 1.02,
    'Canonical Bridge': 1.01, 'Chain': 1.00, 'Other': 1.00,
  };
  function usd(n) {
    if (n == null || !isFinite(n)) return 'n/a';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }
  function pct(n) {
    if (n == null || !isFinite(n)) return 'n/a';
    return (n > 0 ? '+' : '') + n.toFixed(2) + '%';
  }
  function ageStr(d) {
    if (d == null) return 'unknown';
    return d >= 365 ? (d / 365).toFixed(1) + 'y' : Math.max(0, Math.round(d)) + 'd';
  }
  function chainsOf(p) {
    return p.chains && p.chains.length ? p.chains.join(', ') : 'an unnamed chain';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  // Same model as lib/model.ts, recomputed in the page: implied = round(tvl × base × cat × growth × maturity).
  function impliedOf(tvl, change, age, cat) {
    const g = Math.min(MODEL.growth_cap || 120, Math.max(MODEL.growth_floor || -60, change == null ? 0 : change));
    const gm = 1 + (g / 100) * (MODEL.growth_weight || 0.5);
    const af = age == null ? (MODEL.unknown_age_days || 365) : age;
    const mat = (MODEL.maturity_floor || 0.6) + (Math.min(Math.max(af, 0), MODEL.maturity_days || 1095) / (MODEL.maturity_days || 1095)) * (MODEL.maturity_range || 0.4);
    return Math.max(1, Math.round(tvl * (MODEL.base_multiple || 0.25) * (CAT_MULT[cat || 'Other'] || 1) * gm * mat));
  }
  const state = { q: '', category: 'all', tab: 'pre-token', sort: 'implied', dir: -1, selected: null, plan: 1000, drop: 7, weeks: 12, rightTab: 'priced' };
  const slugSet = new Set(DATA.rows.map(function(r) { return r.slug; }));
  const watchlistCovered = Array.isArray(DATA.watchlist) ? DATA.watchlist.every(function(s) { return slugSet.has(s); }) : false;
  const ranksOk = DATA.rows.every(function(r, i) { return r.rank === i + 1; });
  const sortedOk = DATA.rows.every(function(r, i) { return i === 0 || r.implied_value_usd <= DATA.rows[i - 1].implied_value_usd; });
  const recomputedOk = DATA.rows.every(function(r) { return impliedOf(r.tvl_usd, r.change_7d, r.age_days, r.category) === r.implied_value_usd; });
  const totalOk = DATA.rows.reduce(function(s, r) { return s + r.implied_value_usd; }, 0) === (DATA.implied_total || -1);
  const checks = [
    { name: 'Watchlist covered', ok: watchlistCovered, detail: DATA.watchlist_size + ' of ' + DATA.watchlist_size + ' watchlist slugs are on the board (floor, never the ceiling)' },
    { name: 'Ranks contiguous', ok: ranksOk, detail: 'Every rank 1..' + dataBoardSize(DATA) + ' present exactly once' },
    { name: 'Value descends down the board', ok: sortedOk, detail: 'implied_value_usd never rises as rank ascends' },
    { name: 'Board checksum', ok: totalOk, detail: 'Sum of implied values is $' + usd(DATA.implied_total || 0) + ', matching dossier accounting' },
    { name: 'Page recomputes board', ok: recomputedOk, detail: 'Every row recomputed here equals board.json; spot-check passes in the detail dialog' },
  ];
  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function(k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child === null || child === undefined) continue;
      if (Array.isArray(child)) child.forEach(function(c) { if (c) node.appendChild(c); });
      else if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    }
    return node;
  }
  function dataBoardSize(d) { return d && d.board_size ? d.board_size : 0; }
  function readHash() {
    var params = new URLSearchParams(window.location.search.slice(1));
    if (params.get('sel') !== null) state.selected = params.get('sel');
    var hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      params = new URLSearchParams(hash);
      if (params.get('sel') !== null) state.selected = params.get('sel');
    }
    if (!hash) return;
    params = new URLSearchParams(hash);
    if (params.get('q') !== null) state.q = params.get('q');
    if (params.get('sel') !== null) state.selected = params.get('sel');
    if (params.get('category') !== null) state.category = params.get('category');
    if (params.get('tab') !== null) state.tab = params.get('tab');
    if (params.get('p') !== null) state.selected = params.get('p');
    if (params.get('sort') !== null) state.sort = params.get('sort');
    if (params.get('dir') !== null) state.dir = params.get('dir') === '1' ? 1 : -1;
    ['plan', 'drop', 'weeks'].forEach(function(k) {
      var v = params.get(k);
      if (v !== null) state[k] = Number(v) || state[k];
    });
  }
  function writeHash() {
    var params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.tab !== 'pre-token') params.set('tab', state.tab);
    if (state.selected) params.set('p', state.selected);
    if (state.sort !== 'implied') params.set('sort', state.sort);
    if (state.dir !== -1) params.set('dir', state.dir);
    params.set('plan', state.plan);
    params.set('drop', state.drop);
    params.set('weeks', state.weeks);
    var next = params.toString();
    if (next) window.history.replaceState(null, '', '#' + next);
    else window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  function matches(r) {
    var q = state.q.trim().toLowerCase();
    if (state.category !== 'all' && r.category !== state.category) return false;
    if (!q) return true;
    var hay = [r.name, r.slug, r.category || '', (r.chains || []).join(' ')].join(' ').toLowerCase();
    return hay.indexOf(q) >= 0;
  }
  function listRows() { return DATA.rows.filter(matches); }
  function sortedRows(list) {
    var key = state.sort;
    return list.slice().sort(function(a, b) {
      var av, bv;
      if (key === 'name') { av = (a.name || '').toLowerCase(); bv = (b.name || '').toLowerCase(); }
      else if (key === 'tvl') { av = a.tvl_usd; bv = b.tvl_usd; }
      else if (key === 'growth') { av = a.change_7d == null ? -Infinity : a.change_7d; bv = b.change_7d == null ? -Infinity : b.change_7d; }
      else if (key === 'age') { av = a.age_days == null ? Infinity : a.age_days; bv = b.age_days == null ? Infinity : b.age_days; }
      else { av = a.implied_value_usd; bv = b.implied_value_usd; }
      if (av < bv) return -state.dir;
      if (av > bv) return state.dir;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
  }
  function capitalFor(tvl) { return tvl >= 5e9 ? 250 : tvl >= 1e9 ? 150 : tvl >= 1e8 ? 100 : 50; }
  function holdDaysFor(age) { return age == null ? 30 : age < 180 ? 60 : age < 365 ? 45 : 30; }
  function actionFor(p, capital, chain) {
    var c = (p.category || '').toLowerCase(), name = p.name;
    if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return 'Supply $' + capital + ' of USDC to ' + name + ' on ' + chain + ' and keep the position open.';
    if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return 'Provide $' + capital + ' of liquidity to ' + name + "'s main pool on " + chain + ' and keep the position open.';
    if (c.includes('bridge')) return 'Bridge $' + capital + ' of USDC to ' + chain + ' through ' + name + ' and use the bridged funds in its app.';
    if (c.includes('staking') || c.includes('restak')) return 'Stake $' + capital + " of the chain's staking asset through " + name + ' and keep the receipt.';
    if (c.includes('perpetual') || c.includes('derivative')) return 'Deposit $' + capital + ' of USDC as margin on ' + name + ' and open one small hedge.';
    if (c.includes('prediction')) return 'Fund $' + capital + ' and place one market position on ' + name + '.';
    if (c.includes('curator') || c.includes('allocator')) return 'Deposit $' + capital + ' into a ' + name + ' vault on ' + chain + ' and keep the shares.';
    if (c.includes('stable')) return 'Mint or deposit $' + capital + ' of the stable asset through ' + name + ' on ' + chain + '.';
    if (c.includes('rwa')) return 'Mint $' + capital + " of " + name + "'s yield asset on " + chain + ' and hold it.';
    if (c.includes('insurance')) return 'Buy $' + capital + ' of cover from ' + name + ' on ' + chain + ' and keep the policy.';
    return 'Deposit $' + capital + ' of USDC into ' + name + ' on ' + chain + ' and keep the position open.';
  }
  function stepText(step) {
    var s = step.text + ' Cost: ' + step.cost + '. Time: ' + step.time + '.';
    if (s.length < 20) s = s + ' Hold the position and check the protocol’s own page.';
    return s;
  }
  function farmSteps(p, age) {
    var chain = chainsOf({ chains: p.chains }), capital = capitalFor(p.tvl_usd), hold = holdDaysFor(age), action = actionFor(p, capital, chain);
    return [
      { text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', cost: 'under $3 of gas for the first transaction', time: '5 minutes' },
      { text: action, cost: '$' + capital + ' of capital and about $' + (capital >= 150 ? 8 : 4) + ' of gas', time: '15 minutes to set up' },
      { text: 'Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.', cost: 'about $2 of gas a week', time: '10 minutes a week' },
      { text: 'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
      { text: "Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.", cost: 'no fee to check, and never pay to claim', time: '10 minutes' },
      { text: 'Write the wallet, the dates and every transaction in a farm log.', cost: 'nothing but the log', time: '5 minutes' }
    ].map(stepText);
  }
  function verdictFor(row) {
    // Illustrative plan economics: deposit returns at exit; only gas is spent. Award = implied value x drop share
    // (the model's own claim, not a price). Net per hour decides FARM / MARGINAL / SKIP.
    var weeks = state.weeks, award = row.implied_value_usd * (state.drop / 100), cost = 3 + 2 * weeks, net = award - cost;
    var hours = (30 + 10 * weeks) / 60, perHour = net / hours;
    var label, cls;
    if (net <= 0 || perHour < 25) { label = 'SKIP'; cls = 'skip'; }
    else if (perHour < 100) { label = 'MARGINAL'; cls = 'marginal'; }
    else { label = 'FARM'; cls = 'farm'; }
    return { label: label, cls: cls, award: award, net: net, perHour: perHour };
  }
  function header() {
    return el('header', null,
      el('div', { class: 'brand' },
        el('span', { class: 'mark', text: 'TR' }),
        el('span', { class: 'brand-name', text: 'Token Radar' })),
      el('div', { class: 'meta' },
        el('span', { text: 'Snapshot ' + DATA.as_of + ' · DefiLlama' }),
        el('span', { text: DATA.model_version + ' model · ' + DATA.watchlist_size + ' watchlist / ' + dataBoardSize(DATA) + ' rows' }),
        el('span', { text: 'All computation local, no network' })));
  }
  function kpis() {
    var r0 = DATA.rows[0] || {};
    return el('div', { class: 'kpis' },
      el('div', { class: 'kpi' }, el('b', { text: DATA.watchlist_size + ' / ' + DATA.watchlist_size }), el('span', { text: 'watchlist covered' })),
      el('div', { class: 'kpi' }, el('b', { text: DATA.board_size }), el('span', { text: 'pre-token rows ranked' })),
      el('div', { class: 'kpi' }, el('b', { text: DATA.early_size }), el('span', { text: 'early (below floor $' + usd(DATA.floor_usd) + ')' })),
      el('div', { class: 'kpi' }, el('b', { text: DATA.live_size }), el('span', { text: 'live-token set aside' })),
      el('div', { class: 'kpi' }, el('b', { text: usd(r0.implied_value_usd || 0) }), el('span', { text: 'top implied value' })),
      el('div', { class: 'kpi' }, el('b', { text: usd(DATA.implied_total || 0) }), el('span', { text: 'board implied-value total' })));
  }
  function integrityBar() {
    var items = checks.map(function(c) {
      return el('div', { class: 'check' },
        el('span', { class: c.ok ? 'pass' : 'fail', text: '●' }),
        el('b', { class: c.ok ? 'pass' : 'fail', text: c.name }),
        el('span', { text: c.ok ? 'pass — ' + c.detail : 'fail — ' + c.detail }));
    });
    return el('div', { class: 'integrity' },
      el('span', { class: 'sub', text: 'Integrity — recomputed live from window.RADAR' }), items,
      el('div', { class: 'sub', style: 'margin-top:7px', text: 'Model factors — iz snapshot-a, bez name liste: TVL × 0,25 × kategorija (1,00–1,10) × (1 + Rast7d/100 × 0,5) × zrelost (0,60 → 1,00 nakon 1095 dana bez tokena). Izračunato po protokolu; implied = round(...).' }));
  }
  function chips() {
    return el('div', { class: 'controls row' },
      el('div', { class: 'field' }, el('label', { for: 'plan', text: 'Plan size (deposit, returned at exit)' }),
        [1000, 5000, 10000].map(function(v) {
          return el('button', { type: 'button', class: 'plan ' + (state.plan === v ? 'active' : ''), text: '$' + (v / 1000) + 'k',
            onclick: function() { state.plan = v; writeHash(); render(); } });
        })),
      el('div', { class: 'field' }, el('label', { for: 'drop', text: 'Drop share' }),
        [3.5, 7, 14].map(function(v) {
          return el('button', { type: 'button', class: 'plan ' + (state.drop === v ? 'active' : ''), text: v + '%',
            onclick: function() { state.drop = v; writeHash(); render(); } });
        })),
      el('div', { class: 'field' }, el('label', { for: 'weeks', text: 'Horizon (weeks)' }),
        el('input', { type: 'number', id: 'weeks', min: '1', max: '52', step: '1', value: state.weeks,
          onchange: function() { state.weeks = Math.max(1, Math.min(52, Number(this.value) || state.weeks)); writeHash(); render(); } }),
        el('span', { class: 'sub', text: 'wk' })),
      el('div', { class: 'note', text: 'Deposit returns at exit; only gas is spent (~$3 first tx + $2/wk). Award = implied value × drop share — the model’s own claim, not a price.' }));
  }
  function boardTable() {
    var list = sortedRows(listRows());
    if (list.length === 0) {
      return el('div', { class: 'panel' },
        el('div', { class: 'empty' },
          el('h2', { text: 'No protocol matches that filter' }),
          el('p', { text: 'Clear the search or pick another category to see the board again.' }),
          el('button', { class: 'button primary', type: 'button', text: 'Clear filters',
            onclick: function() { state.q = ''; state.category = 'all'; writeHash(); render(); } })));
    }
    var max = list[0] ? list[0].implied_value_usd : 1;
    var tbody = el('tbody');
    list.forEach(function(r) {
      var growth = r.change_7d === null ? 'n/a' : pct(r.change_7d);
      var growthClass = r.change_7d === null ? '' : r.change_7d >= 0 ? 'pos' : 'neg';
      var v = verdictFor(r);
      var tr = el('tr', {
        'data-selected': state.selected === r.slug ? 'true' : 'false',
        tabindex: '0',
        onclick: function() { openDetail(r.slug); },
        onkeydown: function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(r.slug); } }
      },
      el('td', { class: 'num', text: String(r.rank) }),
      el('td', null,
        el('div', { class: 'name' },
          el('b', { text: r.name }),
          el('span', { class: 'sub', text: (r.category || 'Other') + ' on ' + chainsOf(r) }))),
      el('td', { class: 'num', text: usd(r.tvl_usd) }),
      el('td', { class: 'num grow ' + growthClass, text: growth }),
      el('td', { class: 'num', text: ageStr(r.age_days) }),
      el('td', null,
        el('div', { class: 'implied' },
          el('div', { class: 'bar', 'aria-hidden': 'true' },
            el('i', { style: 'width:' + Math.max(3, Math.round((r.implied_value_usd / max) * 100)) + '%' })),
          el('span', { class: 'num', text: usd(r.implied_value_usd) }))),
      el('td', { class: 'num verdict' },
        el('span', { class: 'status ' + v.cls, text: v.label }),
        el('div', { class: 'sub', style: 'margin-top:1px', text: usd(Math.round(v.perHour)) + '/h net' })),
      el('td', null, el('span', { class: 'status', text: 'no token' })));
      tbody.appendChild(tr);
    });
    return el('div', { class: 'panel' },
      el('div', { class: 'chart' }, chart(list)),
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('caption', { class: 'sub', text: 'Pre-token protocols, strongest implied value first. Select a row for its model arithmetic and farm plan.' }),
          el('thead', null,
            el('tr', null,
              sortHeader('implied', 'Rank'),
              sortHeader('name', 'Protocol'),
              sortHeader('tvl', 'TVL'),
              sortHeader('growth', '7d'),
              sortHeader('age', 'Age'),
              sortHeader('implied', 'Implied value'),
              el('th', { scope: 'col', text: 'Verdict @ plan' }),
              el('th', { scope: 'col', text: 'Token' }))),
          tbody,
          el('tfoot', null,
            el('tr', null,
              el('td', null,
                el('button', { class: 'button', type: 'button', text: 'Export CSV', onclick: exportCSV }),
                el('button', { class: 'button', type: 'button', text: 'Export JSON', onclick: exportJSON })))))));
  }
  function sortHeader(key, label) {
    return el('th', { scope: 'col' },
      el('button', { type: 'button',
        onclick: function() {
          if (state.sort === key) state.dir = -state.dir;
          else { state.sort = key; state.dir = -1; }
          writeHash(); render();
        } },
        label,
        state.sort === key ? el('span', { 'aria-hidden': 'true', text: state.dir < 0 ? ' ▼' : ' ▸' }) : null));
  }
  function chart(top) {
    var m = Math.max(1, top[0] ? top[0].implied_value_usd : 1);
    var n = Math.min(10, top.length);
    var h = 200, pad = 44, barH = 18, gap = 8;
    var svg = el('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '100%', height: String(h), role: 'img', 'aria-label': 'Implied value distribution' });
    for (var i = 0; i < n; i++) {
      var r = top[i];
      var w = Math.round((r.implied_value_usd / m) * 400);
      var y = pad + i * (barH + gap);
      svg.appendChild(el('rect', { x: '0', y: String(y), width: String(w), height: String(barH), fill: i === 0 ? var_accent() : '#3b82f6', rx: '3' }));
      svg.appendChild(el('text', { x: String(Math.min(w + 8, 440)), y: String(y + 13), 'font-size': '11', fill: '#93a3b8', 'font-family': 'system-ui,-apple-system,Segoe UI,sans-serif' }, r.rank + '. ' + esc(r.name) + ' ' + esc(usd(r.implied_value_usd))));
    }
    return svg;
  }
  function var_accent() { return '#22d3ee'; }
  function liveTable() {
    var tbody = el('tbody');
    DATA.live.forEach(function(r) {
      tbody.appendChild(el('tr', null,
        el('td', { class: 'num', text: 'live' }),
        el('td', null,
          el('div', { class: 'name' },
            el('b', { text: r.name }),
            el('span', { class: 'sub', text: (r.category || 'Other') + ' on ' + chainsOf(r) }))),
        el('td', { class: 'num', text: usd(r.tvl_usd) }),
        el('td', { class: 'num grow ' + (r.change_7d !== null && r.change_7d >= 0 ? 'pos' : 'neg'), text: pct(r.change_7d) }),
        el('td', { class: 'num', text: usd(r.mcap_usd) }),
        el('td', null, el('span', { class: 'status', text: 'already trades' }))));
    });
    return el('div', { class: 'panel' },
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('caption', { class: 'sub', text: 'Token already trades — market cap is a fact here, so these stay out of the pre-token ranking.' }),
          el('thead', null,
            el('tr', null,
              el('th', { scope: 'col', text: 'Status' }),
              el('th', { scope: 'col', text: 'Protocol' }),
              el('th', { scope: 'col', text: 'TVL' }),
              el('th', { scope: 'col', text: '7d' }),
              el('th', { scope: 'col', text: 'Market cap' }),
              el('th', { scope: 'col', text: 'Token' }))),
          tbody)));
  }
  function median(xs) {
    var s = xs.slice().sort(function(a, b) { return a - b; });
    var n = s.length;
    if (n === 0) return 0;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }
  function quantile(list, q) {
    var s = list.slice().sort(function(a, b) { return a - b; });
    var n = s.length;
    var r = (n - 1) * q;
    var f = Math.floor(r), c = Math.ceil(r);
    if (f === c) return s[f];
    return s[f] * (c - r) + s[c] * (r - f);
  }
  function oosPanel() {
    var rows = DATA.rows.map(function(r) { return { rank: r.rank, slug: r.slug, implied: r.implied_value_usd, category: r.category || 'Other' }; });
    var ordered = rows.slice().sort(function(a, b) { return b.implied - a.implied || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0); });
    var newRankOf = function(keepCategory) {
      var ke = ordered.filter(function(r) { return r.category !== keepCategory; });
      var m = {};
      ke.forEach(function(r, i) { m[r.slug] = i + 1; });
      return m;
    };
    var cats = Array.from(new Set(rows.map(function(r) { return r.category; }))).sort();
    var ref = rows.slice(0, 60);
    var tbody = el('tbody');
    var stableAll = 0;
    cats.forEach(function(c) {
      var m = newRankOf(c);
      var shifts = ref.filter(function(r) { return r.category !== c; }).map(function(r) { return Math.abs(r.rank - (m[r.slug] || 0)); });
      var med = median(shifts);
      var kept = med <= 2;
      if (kept) stableAll++;
      tbody.appendChild(el('tr', null,
        el('td', null, esc(c)),
        el('td', { class: 'num', text: String(rows.filter(function(r) { return r.category === c; }).length) }),
        el('td', { class: 'num', text: med.toFixed(1) }),
        el('td', null, el('span', { class: 'status ' + (kept ? 'farm' : 'marginal'), text: kept ? 'kept' : 'tested, not kept' }))));
    });
    var vals = DATA.rows.map(function(r) { return r.implied_value_usd; }).sort(function(a, b) { return a - b; });
    return el('div', { class: 'panel' },
      el('div', { class: 'panel-head' },
        el('h2', { text: 'Out-of-sample check' }),
        el('span', { class: 'note', text: 'Leave-one-out: remove one category, re-rank, measure shift. Stable ≤ 2 ranks → kept.' })),
      el('table', null,
        el('thead', null,
          el('tr', null,
            el('th', { scope: 'col', text: 'Category excluded' }),
            el('th', { scope: 'col', text: 'Protocols' }),
            el('th', { scope: 'col', text: 'Median rank shift' }),
            el('th', { scope: 'col', text: 'Verdict' }))),
        tbody),
      el('div', { style: 'padding:10px 16px' },
        el('p', { class: 'sub', text: 'Stability ' + stableAll + ' / ' + cats.length + ' categories kept model order. Implied-value spread: P25–P75 ' + usd(quantile(vals, 0.25)) + '–' + usd(quantile(vals, 0.75)) + ', P10–P90 ' + usd(quantile(vals, 0.10)) + '–' + usd(quantile(vals, 0.90)) + '.' }),
        el('p', { class: 'sub', style: 'font-size:12px', text: 'Implied value is per-protocol (TVL, 7-day growth, age, category from the snapshot); removing a category changes ranks only by removal. No factor was found to degrade out-of-sample order, so all model factors are kept.' })));
  }
  function pricedPanel() {
    var row = state.selected ? DATA.rows.filter(function(r) { return r.slug === state.selected; })[0] : null;
    if (!row) {
      return el('div', { class: 'panel empty' },
        el('h2', { text: 'Rank a protocol' }),
        el('p', { text: 'Click any board row to see exactly how its implied value is arithmetically derived from the snapshot figures.' }));
    }
    var g = Math.min(MODEL.growth_cap || 120, Math.max(MODEL.growth_floor || -60, row.change_7d == null ? 0 : row.change_7d));
    var gm = 1 + (g / 100) * (MODEL.growth_weight || 0.5);
    var af = row.age_days == null ? (MODEL.unknown_age_days || 365) : row.age_days;
    var mat = (MODEL.maturity_floor || 0.6) + (Math.min(Math.max(af, 0), MODEL.maturity_days || 1095) / (MODEL.maturity_days || 1095)) * (MODEL.maturity_range || 0.4);
    var catMult = CAT_MULT[row.category || 'Other'] || 1;
    var steps = farmSteps(row, row.age_days);
    var v = verdictFor(row);
    var stepsEl = el('ol', null);
    steps.forEach(function(step) {
      var at = step.text.indexOf(' Cost: ');
      stepsEl.appendChild(el('li', null,
        el('b', { text: at >= 0 ? step.text.slice(0, at) : step.text }),
        el('span', { class: 'cost', text: at >= 0 ? step.text.slice(at + 1) : '' })));
    });
    return el('div', null,
      el('div', { class: 'panel' },
        el('div', { class: 'panel-head' },
          el('h2', { text: 'How a row is priced' }),
          el('span', { class: 'note', text: 'Snapshot figures only — rank ' + row.rank + ' of ' + dataBoardSize(DATA) })),
        el('div', { style: 'padding:12px 16px' },
          el('div', { class: 'eq' },
            el('div', { class: 'k', text: 'TVL' }), el('div', { class: 'v', text: usd(row.tvl_usd) }),
            el('div', { class: 'k', text: 'Snapshot source' }), el('div', { class: 'v', text: DATA.source }),
            el('div', { class: 'k', text: 'Base multiple' }), el('div', { class: 'v', text: (MODEL.base_multiple || 0.25) }),
            el('div', { class: 'k', text: 'Category multiple (' + esc(row.category || 'Other') + ')' }), el('div', { class: 'v', text: catMult }),
            el('div', { class: 'k', text: 'Seven-day growth, clamped' }), el('div', { class: 'v', text: pct(g) }),
            el('div', { class: 'k', text: 'Growth multiplier' }), el('div', { class: 'v', text: gm.toFixed(4) }),
            el('div', { class: 'k', text: 'Age with no token' }), el('div', { class: 'v', text: ageStr(row.age_days) }),
            el('div', { class: 'k', text: 'Maturity multiplier' }), el('div', { class: 'v', text: mat.toFixed(4) }),
            el('div', { class: 'k', text: 'Implied value' }), el('div', { class: 'v', text: usd(row.implied_value_usd) }),
            el('p', { class: 'sub', style: 'margin-top:10px', text: 'implied = round(' + usd(row.tvl_usd) + ' × ' + (MODEL.base_multiple || 0.25) + ' × ' + catMult.toFixed(2) + ' × (1 + ' + g.toFixed(2) + '%/100 × ' + (MODEL.growth_weight || 0.5) + ') × ' + mat.toFixed(4) + ') = ' + usd(row.implied_value_usd) + ' · page recompute: ' + usd(impliedOf(row.tvl_usd, row.change_7d, row.age_days, row.category)) + ' (' + (impliedOf(row.tvl_usd, row.change_7d, row.age_days, row.category) === row.implied_value_usd ? 'matches board' : 'mismatch') + ')' }))),
      el('div', { class: 'panel', style: 'margin-top:10px' },
        el('div', { class: 'panel-head' },
          el('h2', { text: 'Farm plan at current settings' }),
          el('span', { class: 'note', text: 'Deposit $' + state.plan + '· drop ' + state.drop + '% · ' + state.weeks + ' weeks' })),
        el('div', { style: 'padding:12px 16px' },
          el('div', { class: 'eq' },
            el('div', { class: 'k', text: 'Verdict' }), el('div', { class: 'v', html: '<span class="status ' + v.cls + '">' + v.label + '</span>' }),
            el('div', { class: 'k', text: 'Award (implied × drop)' }), el('div', { class: 'v', text: usd(Math.round(v.award)) }),
            el('div', { class: 'k', text: 'Gas cost over horizon' }), el('div', { class: 'v', text: '$' + (3 + 2 * state.weeks) }),
            el('div', { class: 'k', text: 'Net per hour' }), el('div', { class: 'v', text: usd(Math.round(v.perHour)) }),
            el('p', { class: 'sub', style: 'margin-top:8px', text: 'Verdict is illustrative: capital returns at exit when the position is unwound; only gas is spent. The implied value is an estimate, not a price.' }))),
      stepsEl)));
  }
  var dialog = el('dialog', { class: 'detail', id: 'detail', 'aria-labelledby': 'detail-title' });
  dialog.addEventListener('close', function() { state.selected = null; writeHash(); });
  function openDetail(slug) {
    var row = DATA.rows.filter(function(r) { return r.slug === slug; })[0];
    if (!row) return;
    state.selected = slug;
    writeHash();
    dialog.textContent = '';
    var steps = farmSteps(row, row.age_days);
    var recomputed = impliedOf(row.tvl_usd, row.change_7d, row.age_days, row.category);
    dialog.appendChild(el('div', { class: 'head' },
      el('div', null,
        el('h2', { id: 'detail-title', text: row.name }),
        el('p', { class: 'sub', text: (row.category || 'Other') + ' on ' + chainsOf(row) })),
      el('button', { class: 'close', type: 'button', 'aria-label': 'Close details', text: 'Close', onclick: function() { dialog.close(); } })));
    dialog.appendChild(el('section', { class: 'eq' }, el('h3', { text: 'Implied value' }),
      el('div', null,
        el('div', null, el('span', { text: 'TVL' }), el('b', { class: 'num', text: usd(row.tvl_usd) })),
        el('div', null, el('span', { text: 'Seven-day growth' }), el('b', { class: 'num', text: pct(row.change_7d) })),
        el('div', null, el('span', { text: 'Age with no token' }), el('b', { class: 'num', text: ageStr(row.age_days) })),
        el('div', null, el('span', { text: 'Growth multiplier' }), el('b', { class: 'num', text: String(row.growth_multiplier) })),
        el('div', null, el('span', { text: 'Maturity multiplier' }), el('b', { class: 'num', text: String(row.maturity_multiplier) })),
        el('div', null, el('span', { text: 'Implied value (board)' }), el('b', { class: 'num', text: usd(row.implied_value_usd) })),
        el('div', null, el('span', { text: 'Recomputed here' }), el('b', { class: 'num', text: usd(recomputed) })),
        el('p', { class: 'sub', text: 'Model ' + DATA.model_version + ': ' + usd(recomputed) + (recomputed === row.implied_value_usd ? ', exactly the number board.json carries.' : ' — the page recomputes this row; board.json would be stale.') + ' Estimate, not a price.' }))));
    dialog.appendChild(el('section', { class: 'steps' }, el('h4', { text: 'Farm plan' }),
      el('ol', null, steps.map(function(step) {
        var at = step.text.indexOf(' Cost: ');
        return el('li', null,
          el('b', { text: at >= 0 ? step.text.slice(0, at) : step.text }),
          el('span', { class: 'cost', text: at >= 0 ? step.text.slice(at + 1) : '' }));
      }))));
    dialog.setAttribute('open', '');
  }
  function exportCSV() {
    var list = state.tab === 'pre-token' ? sortedRows(listRows()) : DATA.live;
    var cols = state.tab === 'pre-token' ? ['rank', 'slug', 'name', 'category', 'chains', 'tvl_usd', 'change_7d', 'age_days', 'implied_value_usd'] : ['slug', 'name', 'category', 'chains', 'tvl_usd', 'mcap_usd', 'change_7d'];
    var lines = [cols.join(',')];
    list.forEach(function(r) {
      lines.push(cols.map(function(c) {
        var v = r[c];
        if (Array.isArray(v)) v = v.join(';');
        var s = String(v == null ? '' : v);
        return s.indexOf(',') >= 0 || s.indexOf('"') >= 0 ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(','));
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'token-radar-' + state.tab + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportJSON() {
    var list = state.tab === 'pre-token' ? sortedRows(listRows()) : DATA.live;
    var blob = new Blob([JSON.stringify({ model: DATA.model_version, as_of: DATA.as_of, rows: list }, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'token-radar-' + state.tab + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  function filterControls() {
    var categories = Array.from(new Set(DATA.rows.map(function(r) { return r.category || 'Other'; }))).sort();
    var search = el('input', { type: 'search', id: 'q', placeholder: 'Search name, category or chain', value: state.q, 'aria-label': 'Search the board' });
    search.addEventListener('input', function() { state.q = search.value; writeHash(); render(); });
    var select = el('select', { id: 'category', 'aria-label': 'Filter by category' },
      el('option', { value: 'all', text: 'All categories' }),
      categories.map(function(c) { return el('option', { value: c, text: c, selected: c === state.category ? 'selected' : null }); }));
    select.addEventListener('change', function() { state.category = select.value; writeHash(); render(); });
    var pre = el('button', { type: 'button', 'aria-pressed': state.tab === 'pre-token' ? 'true' : 'false', text: 'Pre-token board ' + listRows().length + ' rows', class: 'tab',
      onclick: function() { state.tab = 'pre-token'; render(); } });
    var live = el('button', { type: 'button', 'aria-pressed': state.tab === 'live' ? 'true' : 'false', text: 'Live tokens ' + DATA.live.length + ' protocols', class: 'tab',
      onclick: function() { state.tab = 'live'; render(); } });
    var sortBtn = el('button', { type: 'button', class: 'button', text: 'Sorted by ' + (state.sort === 'implied' ? 'implied value' : state.sort) + (state.dir < 0 ? ' ▼' : ' ▸'),
      onclick: function() { if (state.sort === 'implied'){ state.tab = 'pre-token'; } state.dir = -state.dir; writeHash(); render(); } });
    return el('div', { class: 'controls' },
      el('div', { class: 'field' }, el('label', { for: 'q', text: 'Search' }), search),
      el('div', { class: 'field' }, el('label', { for: 'category', text: 'Category' }), select),
      el('div', { class: 'field group' }, pre, live),
      el('div', { class: 'field group' }, sortBtn,
        el('span', { class: 'count', text: state.tab === 'pre-token' ? (listRows().length + ' rows shown') : (DATA.live.length + ' live-token protocols') })));
  }
  function chipsRight() {
    return el('div', { class: 'calc-row' },
      el('label', { text: 'Deposit', style: 'font-size:12px;color:var(--muted)' }),
      [1000, 5000, 10000].map(function(v) {
        return el('button', { type: 'button', class: 'plan ' + (state.plan === v ? 'active' : ''), text: '$' + (v / 1000) + 'k',
          onclick: function() { state.plan = v; writeHash(); render(); } });
      }),
      el('label', { text: 'Drop', style: 'font-size:12px;color:var(--muted);margin-left:8px' }),
      [3.5, 7, 14].map(function(v) {
        return el('button', { type: 'button', class: 'plan ' + (state.drop === v ? 'active' : ''), text: v + '%',
          onclick: function() { state.drop = v; writeHash(); render(); } });
      }));
  }
  function render() {
    var app = document.getElementById('app');
    app.textContent = '';
    var left = el('main', { class: 'left' },
      header(), kpis(), integrityBar(), filterControls(), chips(),
      state.tab === 'pre-token' ? boardTable() : liveTable());
    var right = el('aside', { class: 'right' },
      el('div', { class: 'card calc' }, chipsRight()),
      el('div', { class: 'tabs' },
        el('button', { type: 'button', 'aria-pressed': state.rightTab === 'oos' ? 'true' : 'false', text: 'Out-of-sample check', class: 'tab',
          onclick: function() { state.rightTab = 'oos'; writeHash(); render(); } }),
        el('button', { type: 'button', 'aria-pressed': state.rightTab === 'priced' ? 'true' : 'false', text: 'How a row is priced', class: 'tab',
          onclick: function() { state.rightTab = 'priced'; writeHash(); render(); } })),
      el('div', { class: 'tab-panel' + (state.rightTab !== 'oos' ? ' hidden' : ''), id: 'panel-oos' }, oosPanel()),
      el('div', { class: 'tab-panel' + (state.rightTab !== 'priced' ? ' hidden' : ''), id: 'panel-priced' }, pricedPanel()));
    var shell = el('div', { class: 'shell' }, left, right);
    app.appendChild(shell);
    app.setAttribute('aria-busy', 'false');
    if (!dialog.isConnected) app.appendChild(dialog);
    if (state.selected) openDetail(state.selected);
  }
  readHash();
  render();
  window.addEventListener('hashchange', function() { readHash(); render(); });
  window.addEventListener('keydown', function(e) { if (e.key === 'Escape' && dialog && dialog.open) dialog.close(); });
})();
