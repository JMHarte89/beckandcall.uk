/* Interactive structures register for organisations.html. Vanilla JS, no dependencies.
   Data: assets/org/register-data.js (built by tools/org-visuals/register_data.py).
   Locations are real (OpenStreetMap); every condition and inspection value is made up. */
(function () {
  var D = window.REGISTER_DATA, root = document.getElementById('register');
  if (!D || !root) return;

  var RAG = { 1: '#1a9850', 2: '#91cf60', 3: '#fee08b', 4: '#fc8d59', 5: '#d73027' };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var COLS = [['id', 'ID'], ['type', 'Type'], ['name', 'Structure'], ['grade', 'Condition'], ['last', 'Last inspected'], ['due', 'Next due']];
  var state = { q: '', type: 'All', poor: false, overdue: false, high: false, sort: 'due', dir: 1, sel: null };
  var SVGNS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, text) {
    var n = document.createElement(tag), k;
    for (k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function svg(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag), k;
    for (k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function day(iso) {
    var p = iso.split('-');
    return (+p[2]) + ' ' + MONTHS[p[1] - 1] + ' ' + p[0];
  }
  function pill(g) {
    var s = el('span', { 'class': 'reg-pill' }, g + ' ' + D.grades[g]);
    s.style.background = RAG[g];
    s.style.color = (g === 1 || g === 5) ? '#fff' : '#1c2620';
    return s;
  }

  // ---- skeleton
  var bar = el('div', { 'class': 'reg-bar' });
  var search = el('input', { type: 'search', placeholder: 'Search by ID, name or road', 'aria-label': 'Search the register' });
  var typeSel = el('select', { 'aria-label': 'Structure type' });
  ['All', 'Road bridge', 'Footbridge', 'Culvert'].forEach(function (t) {
    typeSel.appendChild(el('option', { value: t }, t === 'All' ? 'All types' : t + 's'));
  });
  bar.appendChild(search);
  bar.appendChild(typeSel);
  [['poor', 'Grade 4 or 5'], ['overdue', 'Inspection overdue'], ['high', 'High consequence']].forEach(function (c) {
    var b = el('button', { type: 'button', 'class': 'reg-chip', 'aria-pressed': 'false' }, c[1]);
    b.addEventListener('click', function () {
      state[c[0]] = !state[c[0]];
      b.setAttribute('aria-pressed', String(state[c[0]]));
      render();
    });
    bar.appendChild(b);
  });
  var count = el('span', { 'class': 'reg-count', 'aria-live': 'polite' });
  bar.appendChild(count);

  var main = el('div', { 'class': 'reg-main' });
  var tableWrap = el('div', { 'class': 'reg-table' });
  var table = el('table'), thead = el('thead'), tbody = el('tbody'), hr = el('tr');
  COLS.forEach(function (c) {
    var th = el('th', { scope: 'col' }), b = el('button', { type: 'button' }, c[1]);
    b.addEventListener('click', function () {
      if (state.sort === c[0]) state.dir = -state.dir; else { state.sort = c[0]; state.dir = 1; }
      render();
    });
    th.appendChild(b);
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  var side = el('div', { 'class': 'reg-side' }), mapBox = el('div', { 'class': 'reg-map' }), detail = el('div', { 'class': 'reg-detail' });
  side.appendChild(mapBox);
  side.appendChild(detail);
  main.appendChild(tableWrap);
  main.appendChild(side);
  root.appendChild(bar);
  root.appendChild(main);

  // ---- map: drawn once, dots restyled on each render
  var b = D.bounds, MW = 600, k = MW / (b[2] - b[0]), MH = Math.round((b[3] - b[1]) * k);
  function px(x) { return ((x - b[0]) * k).toFixed(1); }
  function py(y) { return ((b[3] - y) * k).toFixed(1); }
  function path(pts, close) {
    return 'M' + pts.map(function (p) { return px(p[0]) + ',' + py(p[1]); }).join('L') + (close ? 'Z' : '');
  }
  var map = svg('svg', { viewBox: '0 0 ' + MW + ' ' + MH, role: 'img', 'aria-label': 'Map of the structures in the register' });
  map.appendChild(svg('rect', { width: MW, height: MH, fill: '#f8f7f2' }));
  map.appendChild(svg('path', { d: path(D.boundary, true), fill: '#eef1e6', stroke: '#234438', 'stroke-width': 1.2 }));
  var water = ['', ''], road = ['', '', ''];
  D.rivers.forEach(function (r) { water[r[0]] += path(r[1]); });
  D.roads.forEach(function (r) { road[r[0]] += path(r[1]); });
  map.appendChild(svg('path', { d: water[1], fill: 'none', stroke: '#8fb8dc', 'stroke-width': 0.7 }));
  map.appendChild(svg('path', { d: water[0], fill: 'none', stroke: '#1f78b4', 'stroke-width': 1.8 }));
  [[2, 0.9, '#b9b5a8'], [1, 1.3, '#8d897c'], [0, 2, '#6b675c']].forEach(function (r) {
    map.appendChild(svg('path', { d: road[r[0]], fill: 'none', stroke: r[2], 'stroke-width': r[1] }));
  });
  var ring = svg('circle', { r: 11, fill: 'none', stroke: '#1c2620', 'stroke-width': 2, visibility: 'hidden' });
  var dots = {};
  D.structures.forEach(function (s) {
    var c = svg('circle', { cx: px(s.x), cy: py(s.y), r: 5, fill: RAG[s.grade], stroke: '#1c2620', 'stroke-width': 0.8 });
    c.style.cursor = 'pointer';
    var t = svg('title', {});
    t.textContent = s.id + ' ' + s.name;
    c.appendChild(t);
    c.addEventListener('click', function () { select(s.id, true); });
    dots[s.id] = c;
    map.appendChild(c);
  });
  map.appendChild(ring);
  mapBox.appendChild(map);
  mapBox.appendChild(el('p', { 'class': 'reg-credit' }, 'Roads, watercourses and structure locations © OpenStreetMap contributors. Dot colour is the made-up condition grade.'));

  // ---- behaviour
  function visible() {
    var q = state.q.toLowerCase();
    return D.structures.filter(function (s) {
      return (state.type === 'All' || s.type === state.type) && (!state.poor || s.grade >= 4) &&
        (!state.overdue || s.overdue) && (!state.high || s.cons === 'High') &&
        (!q || (s.id + ' ' + s.type + ' ' + s.name).toLowerCase().indexOf(q) >= 0);
    }).sort(function (a, c) {
      var x = a[state.sort], y = c[state.sort];
      return (x < y ? -1 : x > y ? 1 : (a.id < c.id ? -1 : 1)) * state.dir;
    });
  }

  function select(id, scroll) {
    state.sel = id;
    render();
    if (scroll) {
      var row = tbody.querySelector('[data-id="' + id + '"]');
      if (row) tableWrap.scrollTop = row.offsetTop - tableWrap.clientHeight / 2;
    }
  }

  function renderDetail(s) {
    detail.textContent = '';
    if (!s) { detail.appendChild(el('p', { 'class': 'reg-empty' }, 'Nothing matches. Clear a filter to see records.')); return; }
    var head = el('div', { 'class': 'reg-head' });
    head.appendChild(el('strong', {}, s.id));
    head.appendChild(pill(s.grade));
    detail.appendChild(head);
    detail.appendChild(el('p', { 'class': 'reg-name' }, s.type + ' · ' + s.name));
    var grid = el('dl');
    [['Consequence if it fails', s.cons], ['Inspection interval', s.interval + ' years'], ['Last inspected', day(s.last)],
      ['Next due', day(s.due) + (s.overdue ? ' · overdue' : '')], ['Mapped length', s.len + ' m'],
      ['Grid reference', s.x + ', ' + s.y]].forEach(function (r) {
      var d = el('div');
      d.appendChild(el('dt', {}, r[0]));
      var dd = el('dd', {}, r[1]);
      if (/overdue/.test(r[1])) dd.className = 'late';
      d.appendChild(dd);
      grid.appendChild(d);
    });
    detail.appendChild(grid);
    detail.appendChild(el('p', { 'class': 'reg-label' }, 'Condition at each inspection'));
    var hist = el('div', { 'class': 'reg-hist' });
    s.hist.forEach(function (h) {
      var c = el('div'), barEl = el('span', {}, String(h[1]));
      barEl.style.height = (14 + h[1] * 9) + 'px';
      barEl.style.background = RAG[h[1]];
      barEl.style.color = (h[1] === 1 || h[1] === 5) ? '#fff' : '#1c2620';
      c.appendChild(barEl);
      c.appendChild(el('small', {}, String(h[0])));
      hist.appendChild(c);
    });
    detail.appendChild(hist);
  }

  function render() {
    var rows = visible(), shown = {}, i;
    if (!rows.some(function (s) { return s.id === state.sel; })) state.sel = rows.length ? rows[0].id : null;
    tbody.textContent = '';
    rows.forEach(function (s) {
      shown[s.id] = true;
      var tr = el('tr', { 'data-id': s.id, tabindex: '0' });
      if (s.id === state.sel) tr.className = 'sel';
      tr.appendChild(el('td', { 'class': 'id' }, s.id));
      tr.appendChild(el('td', {}, s.type));
      tr.appendChild(el('td', {}, s.name));
      var td = el('td');
      td.appendChild(pill(s.grade));
      tr.appendChild(td);
      tr.appendChild(el('td', {}, day(s.last)));
      tr.appendChild(el('td', s.overdue ? { 'class': 'late' } : {}, day(s.due)));
      tr.addEventListener('click', function () { select(s.id); });
      tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(s.id); } });
      tbody.appendChild(tr);
    });
    var ths = thead.querySelectorAll('th');
    for (i = 0; i < COLS.length; i++) {
      ths[i].setAttribute('aria-sort', COLS[i][0] === state.sort ? (state.dir > 0 ? 'ascending' : 'descending') : 'none');
    }
    D.structures.forEach(function (s) {
      dots[s.id].setAttribute('opacity', shown[s.id] ? 1 : 0.12);
      dots[s.id].style.pointerEvents = shown[s.id] ? 'auto' : 'none';
    });
    var sel = D.structures.filter(function (s) { return s.id === state.sel; })[0];
    if (sel) {
      ring.setAttribute('cx', px(sel.x));
      ring.setAttribute('cy', py(sel.y));
      ring.setAttribute('visibility', 'visible');
      map.appendChild(dots[sel.id]);
      map.appendChild(ring);
    } else ring.setAttribute('visibility', 'hidden');
    count.textContent = rows.length + ' of ' + D.structures.length + ' structures';
    renderDetail(sel);
  }

  search.addEventListener('input', function () { state.q = search.value.trim(); render(); });
  typeSel.addEventListener('change', function () { state.type = typeSel.value; render(); });
  render();
})();
