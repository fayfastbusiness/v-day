/* Jollies back office: operations, marketing and finance in one page.
   Data lives in this browser's localStorage. Use Settings > Backup to move it
   between devices or share a snapshot with the team. */
(function () {
  'use strict';

  var STORE_KEY = 'jollies-backoffice-v1';
  var PAYMENT = ['Unpaid', 'Paid', 'Refunded', 'Cancelled'];
  var PRODUCTION = ['Pending', 'Baked', 'Packed', 'Shipped'];
  var STOCK_TYPES = ['Received', 'Waste', 'Correction'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------- State ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return withDefaults(JSON.parse(raw));
    } catch (e) { /* storage blocked or corrupt: fall back to seed */ }
    return clone(window.JOLLIES_SEED);
  }
  function withDefaults(s) {
    var seed = clone(window.JOLLIES_SEED);
    Object.keys(seed).forEach(function (k) { if (s[k] === undefined) s[k] = seed[k]; });
    Object.keys(seed.settings).forEach(function (k) { if (s.settings[k] === undefined) s.settings[k] = seed.settings[k]; });
    return s;
  }
  var S = load();
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
    catch (e) { toast('Could not save: browser storage is blocked. Export a backup to keep your changes.'); }
  }
  var UI = { orders: { ship: 'upcoming', pay: '', prod: '', q: '' }, bakeShip: '', tx: { account: '', cat: '', month: '' },
    mkt: { from: '', to: '' }, taskOwner: '', financeMonth: '' };

  /* ---------- Utils ---------- */
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function n(v) { var x = parseFloat(v); return isFinite(x) ? x : 0; }
  function money(v, dec) {
    var d = dec == null ? 0 : dec;
    return n(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function thb(v, dec) { return '฿' + money(v, dec); }
  function num(v, dec) { return n(v).toLocaleString('en-US', { maximumFractionDigits: dec == null ? 1 : dec }); }
  function pct(v, dec) { return isFinite(v) ? (v * 100).toFixed(dec == null ? 1 : dec) + '%' : '-'; }
  function pad(x) { return (x < 10 ? '0' : '') + x; }
  function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDate(iso) { if (!iso) return null; var p = iso.slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function parseDT(s) {
    if (!s) return new Date();
    var d = parseDate(s); var t = (s.split('T')[1] || '00:00').split(':');
    d.setHours(+t[0] || 0, +t[1] || 0, 0, 0); return d;
  }
  function addDays(d, k) { var x = new Date(d); x.setDate(x.getDate() + k); return x; }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function fmtDate(iso, withYear) {
    var d = parseDate(iso); if (!d) return '';
    return DAYS[d.getDay()] + ' ' + pad(d.getDate()) + ' ' + MONTHS[d.getMonth()] + (withYear === false ? '' : ' ' + d.getFullYear());
  }
  function fmtShort(iso) { var d = parseDate(iso); return d ? pad(d.getDate()) + ' ' + MONTHS[d.getMonth()] : ''; }
  function fmtDT(s) { var d = parseDT(s); return pad(d.getDate()) + ' ' + MONTHS[d.getMonth()] + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function monthKey(iso) { return iso ? iso.slice(0, 7) : ''; }
  function monthLabel(key) { var p = key.split('-'); return MONTHS[+p[1] - 1] + ' ' + p[0]; }
  function nowLocalDT() { var d = new Date(); return toISO(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function todayISO() { return toISO(new Date()); }
  function sum(arr, f) { return arr.reduce(function (a, x) { return a + n(f ? f(x) : x); }, 0); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function opts(list, sel, blank) {
    return (blank != null ? '<option value="">' + esc(blank) + '</option>' : '') + list.map(function (o) {
      var v = typeof o === 'object' ? o.v : o, l = typeof o === 'object' ? o.l : o;
      return '<option value="' + esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('');
  }
  function chip(text, tone) { return '<span class="chip ' + (tone || 'neutral') + '">' + esc(text) + '</span>'; }
  function toast(msg) {
    var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  // Shows the export with a Copy button. Download also works when the app is opened as a file.
  function download(name, text, type) {
    openModal('Export: ' + name, '<p class="field full small">Copy this and paste it into a file, a Google Sheet (for CSV) or a message to the team. ' +
      'To restore a backup, save it as a .json file and use Import backup.</p>' +
      '<textarea class="field full" id="exportText" rows="12" readonly style="font:12px/1.4 ui-monospace,Menlo,monospace">' + esc(text.replace(/^\ufeff/, '')) + '</textarea>' +
      '<div class="row full" style="grid-column:1/-1"><button type="button" class="btn" id="dlBtn">Download file</button></div>',
      function () {
        var ta = document.getElementById('exportText');
        var done = function () { toast('Copied'); };
        try { navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); toast('Press Ctrl/Cmd + C to copy'); }); }
        catch (e) { ta.select(); toast('Press Ctrl/Cmd + C to copy'); }
        return false;
      }, { submit: 'Copy' });
    document.getElementById('dlBtn').onclick = function () {
      var blob = new Blob([text], { type: type || 'text/plain' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    };
  }
  function csv(rows) {
    return '﻿' + rows.map(function (r) {
      return r.map(function (c) { var s = String(c == null ? '' : c); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',');
    }).join('\n');
  }

  /* ---------- Schedule ---------- */
  function cutoffFor(shipISO) {
    var d = addDays(parseDate(shipISO), -n(S.settings.cutoffDaysBefore));
    var t = S.settings.cutoffTime.split(':'); d.setHours(+t[0], +t[1], 0, 0); return d;
  }
  function isShipDay(d) { return S.settings.shipDays.indexOf(d.getDay()) >= 0; }
  // The batch an order placed at `dt` falls into.
  function autoShipDate(dt) {
    if (!S.settings.shipDays.length) return '';
    var launch = parseDate(S.settings.launchDate) || startOfDay(dt);
    var d = startOfDay(dt); if (d < launch) d = new Date(launch);
    for (var i = 0; i < 30; i++) {
      if (isShipDay(d) && cutoffFor(toISO(d)) > dt) return toISO(d);
      d = addDays(d, 1);
    }
    return '';
  }
  // The batch the kitchen should be working on now.
  function nextShipDate() {
    if (S.settings.activeShipOverride) return S.settings.activeShipOverride;
    if (!S.settings.shipDays.length) return todayISO();
    var now = new Date(), launch = parseDate(S.settings.launchDate) || startOfDay(now);
    var d = startOfDay(now); if (d < launch) d = new Date(launch);
    var t = S.settings.shipTime.split(':');
    for (var i = 0; i < 30; i++) {
      if (isShipDay(d)) {
        var shipAt = new Date(d); shipAt.setHours(+t[0], +t[1], 0, 0);
        if (shipAt > now) return toISO(d);
      }
      d = addDays(d, 1);
    }
    return todayISO();
  }
  function upcomingShipDates(count) {
    var out = [], d = parseDate(nextShipDate());
    for (var i = 0; out.length < count && i < 60; i++) { if (isShipDay(d)) out.push(toISO(d)); d = addDays(d, 1); }
    return out;
  }
  function countdown(to) {
    var ms = to - new Date(); if (ms <= 0) return 'closed';
    var h = Math.floor(ms / 36e5), dd = Math.floor(h / 24);
    return dd > 0 ? dd + 'd ' + (h % 24) + 'h' : h + 'h ' + Math.floor((ms % 36e5) / 6e4) + 'm';
  }

  /* ---------- Products, recipes & costs ---------- */
  function item(id) { return byId(S.inventory, id); }
  function product(id) { return byId(S.products, id); }
  function unitCost(it) { return it && n(it.packSize) > 0 ? n(it.packPrice) / n(it.packSize) : 0; }
  function recipeCost(recipe) { return sum(recipe || [], function (r) { return unitCost(item(r[0])) * n(r[1]); }); }
  function poolProducts(cat) { return S.products.filter(function (p) { return p.kind === 'single' && p.category === cat && p.active; }); }
  function productCost(p) {
    if (!p) return 0;
    var c = recipeCost(p.recipe);
    if (p.kind === 'box' && p.box) {
      var pool = poolProducts(p.box.pool);
      if (pool.length) c += n(p.box.pieces) * sum(pool, productCost) / pool.length;
      (p.box.extras || []).forEach(function (e) { c += productCost(product(e[0])) * n(e[1]); });
    }
    return c;
  }
  function hasRecipe(p) {
    if (p.kind === 'box') return poolProducts(p.box && p.box.pool).length > 0;
    return (p.recipe || []).length > 0;
  }

  /* ---------- Orders ---------- */
  function shipDate(o) { return o.shipOverride || autoShipDate(parseDT(o.createdAt)); }
  function isVoid(o) { return o.payment === 'Cancelled' || o.payment === 'Refunded'; }
  function orderSubtotal(o) { return sum(o.lines, function (l) { return n(l.qty) * n(l.price); }); }
  function orderTotal(o) { return orderSubtotal(o) + n(o.deliveryFee); }
  function lineMixCount(l) { return sum(Object.keys(l.mix || {}), function (k) { return l.mix[k]; }); }
  function lineCheck(l) {
    var p = product(l.productId); if (!p || p.kind !== 'box') return null;
    var need = n(p.box.pieces) * n(l.qty), got = lineMixCount(l);
    return { ok: got === need, need: need, got: got };
  }
  function orderFlavourOK(o) { return o.lines.every(function (l) { var c = lineCheck(l); return !c || c.ok; }); }
  // Pieces to bake, keyed by product id.
  function orderPieces(o) {
    var out = {};
    function add(id, q) { if (q) out[id] = (out[id] || 0) + q; }
    o.lines.forEach(function (l) {
      var p = product(l.productId); if (!p) return;
      if (p.kind === 'box') {
        Object.keys(l.mix || {}).forEach(function (k) { add(k, n(l.mix[k])); });
        (p.box.extras || []).forEach(function (e) { add(e[0], n(e[1]) * n(l.qty)); });
      } else add(p.id, n(l.qty));
    });
    return out;
  }
  function orderIngredients(o) {
    var out = {};
    function addRecipe(recipe, mult) { (recipe || []).forEach(function (r) { out[r[0]] = (out[r[0]] || 0) + n(r[1]) * mult; }); }
    var pieces = orderPieces(o);
    Object.keys(pieces).forEach(function (pid) { var p = product(pid); if (p) addRecipe(p.recipe, pieces[pid]); });
    o.lines.forEach(function (l) { var p = product(l.productId); if (p && p.kind === 'box') addRecipe(p.recipe, n(l.qty)); });
    return out;
  }
  function orderCost(o) {
    var ing = orderIngredients(o);
    return sum(Object.keys(ing), function (k) { return unitCost(item(k)) * ing[k]; });
  }
  function orderItemsText(o) {
    return o.lines.map(function (l) {
      var p = product(l.productId); var s = n(l.qty) + ' x ' + (p ? p.name : '(deleted product)');
      var mix = Object.keys(l.mix || {}).filter(function (k) { return n(l.mix[k]) > 0; })
        .map(function (k) { var pp = product(k); return n(l.mix[k]) + ' ' + shortName(pp ? pp.name : k); });
      return s + (mix.length ? ' (' + mix.join(', ') + ')' : '');
    }).join('; ');
  }
  function shortName(name) { return name.replace(/\s*\(1 pc\)/i, '').replace(/^Snowball\s+/i, ''); }
  function nextOrderId(ship) {
    var d = parseDate(ship) || new Date(), prefix = pad(d.getDate()) + pad(d.getMonth() + 1) + '-';
    var max = 0;
    S.orders.forEach(function (o) { if (o.id.indexOf(prefix) === 0) max = Math.max(max, parseInt(o.id.slice(prefix.length), 10) || 0); });
    return prefix + pad(max + 1);
  }
  // Keep Finance in step with order payments.
  function syncPayment(o) {
    if (!S.settings.autoRecordPayments) return;
    var tx = S.transactions.filter(function (t) { return t.orderId === o.id; })[0];
    if (o.payment === 'Paid') {
      var data = { account: S.settings.salesAccount, description: 'Order ' + o.id + ' - ' + o.customer, category: 'Sales', amountIn: orderTotal(o), amountOut: 0, orderId: o.id };
      if (tx) Object.assign(tx, data);
      else S.transactions.push(Object.assign({ id: uid(), date: o.paidDate || todayISO() }, data));
    } else if (tx) {
      S.transactions = S.transactions.filter(function (t) { return t !== tx; });
    }
  }

  /* ---------- Inventory ---------- */
  function batchOrders(ship, includeUnpaid) {
    return S.orders.filter(function (o) {
      return !isVoid(o) && shipDate(o) === ship && (o.payment === 'Paid' || includeUnpaid);
    });
  }
  function inventoryView() {
    var used = {}, needed = {}, logs = {};
    var active = nextShipDate();
    S.orders.forEach(function (o) {
      var ing;
      if (o.production !== 'Pending') {
        ing = orderIngredients(o); Object.keys(ing).forEach(function (k) { used[k] = (used[k] || 0) + ing[k]; });
      } else if (!isVoid(o) && shipDate(o) === active && (o.payment === 'Paid' || S.settings.countUnpaid)) {
        ing = orderIngredients(o); Object.keys(ing).forEach(function (k) { needed[k] = (needed[k] || 0) + ing[k]; });
      }
    });
    S.stockLog.forEach(function (l) {
      logs[l.itemId] = logs[l.itemId] || { Received: 0, Waste: 0, Correction: 0 };
      logs[l.itemId][l.type] += n(l.qty);
    });
    var bakeDay = addDays(parseDate(active), -1);
    return S.inventory.map(function (it) {
      var lg = logs[it.id] || { Received: 0, Waste: 0, Correction: 0 };
      var onHand = n(it.opening) + lg.Received + lg.Correction - lg.Waste - (used[it.id] || 0);
      var need = needed[it.id] || 0, left = onHand - need;
      var tracked = n(it.reorderPoint) > 0 || n(it.target) > 0 || need > 0;
      var status = !tracked ? 'Not tracked' : left < 0 ? 'Short' : left <= n(it.reorderPoint) ? 'Reorder' : 'OK';
      var toOrder = status === 'Short' || status === 'Reorder' ? Math.max(n(it.target) - left, -left, 0) : 0;
      var packs = toOrder > 0 && n(it.packSize) > 0 ? Math.ceil(toOrder / n(it.packSize)) : 0;
      return {
        it: it, received: lg.Received, waste: lg.Waste, correction: lg.Correction, used: used[it.id] || 0,
        onHand: onHand, need: need, left: left, status: status, toOrder: toOrder, packs: packs,
        cost: packs * n(it.packPrice), orderBy: toOrder > 0 ? toISO(addDays(bakeDay, -n(it.leadDays))) : ''
      };
    });
  }
  function statusChip(s) {
    return chip(s === 'Short' ? '⚠ Short' : s === 'Reorder' ? '↻ Reorder' : s === 'OK' ? '✓ OK' : s,
      s === 'Short' ? 'bad' : s === 'Reorder' ? 'warn' : s === 'OK' ? 'good' : 'neutral');
  }

  /* ---------- Finance ---------- */
  function accountName(id) { var a = byId(S.settings.accounts, id); return a ? a.name : id; }
  function accountBalance(id) {
    var a = byId(S.settings.accounts, id);
    return n(a && a.opening) + sum(S.transactions.filter(function (t) { return t.account === id; }), function (t) { return n(t.amountIn) - n(t.amountOut); });
  }
  function totalCash() { return sum(S.settings.accounts, function (a) { return accountBalance(a.id); }); }
  function spentBy(cat) { return sum(S.transactions.filter(function (t) { return t.category === cat; }), function (t) { return t.amountOut; }); }
  function allCategories() {
    var cats = S.budget.map(function (b) { return b.category; }).concat(S.settings.incomeCategories);
    S.transactions.forEach(function (t) { if (t.category && cats.indexOf(t.category) < 0) cats.push(t.category); });
    return cats;
  }
  function monthlyCash() {
    var m = {};
    S.transactions.forEach(function (t) {
      var k = monthKey(t.date); if (!k) return;
      m[k] = m[k] || { inn: 0, out: 0 }; m[k].inn += n(t.amountIn); m[k].out += n(t.amountOut);
    });
    var keys = Object.keys(m).sort();
    var cur = todayISO().slice(0, 7); if (keys.indexOf(cur) < 0) { keys.push(cur); m[cur] = { inn: 0, out: 0 }; keys.sort(); }
    var bal = sum(S.settings.accounts, function (a) { return a.opening; });
    return keys.map(function (k) { bal += m[k].inn - m[k].out; return { key: k, inn: m[k].inn, out: m[k].out, net: m[k].inn - m[k].out, close: bal }; });
  }

  /* ---------- Marketing ---------- */
  function inRange(iso) { return (!UI.mkt.from || iso >= UI.mkt.from) && (!UI.mkt.to || iso <= UI.mkt.to); }
  function adMetrics(rows) {
    var spend = sum(rows, function (r) { return r.spend; }), imp = sum(rows, function (r) { return r.impressions; });
    var clicks = sum(rows, function (r) { return r.clicks; }), results = sum(rows, function (r) { return r.results; });
    var rev = sum(rows, function (r) { return r.revenue; });
    return { spend: spend, imp: imp, clicks: clicks, results: results, rev: rev,
      roas: spend ? rev / spend : NaN, ctr: imp ? clicks / imp : NaN, cpc: clicks ? spend / clicks : NaN,
      cpm: imp ? spend / imp * 1000 : NaN, cpr: results ? spend / results : NaN };
  }
  function breakEvenRoas() { return S.targets.grossMargin > 0 ? 1 / S.targets.grossMargin : NaN; }
  function vsTarget(actual, target, lowerIsBetter) {
    if (!isFinite(actual) || !isFinite(target) || !target) return '';
    var band = n(S.targets.watchBand);
    var ok = lowerIsBetter ? actual <= target : actual >= target;
    var watch = lowerIsBetter ? actual <= target * (1 + band) : actual >= target * (1 - band);
    return ok ? chip('✓ On target', 'good') : watch ? chip('◐ Watch', 'warn') : chip('✕ Off target', 'bad');
  }
  function adVerdict(r) {
    var m = adMetrics([r]); if (!m.spend) return '';
    if (m.roas >= S.targets.targetRoas) return chip('Scale up', 'good');
    if (m.roas >= breakEvenRoas()) return chip('Keep & optimise', 'info');
    if (m.ctr < S.targets.ctr) return chip('Fix creative', 'bad');
    return chip('Fix offer / stop', 'bad');
  }
  function engagements(p) { return n(p.likes) + n(p.comments) + n(p.shares) + n(p.saves); }
  function engRate(p) { return n(p.reach) ? engagements(p) / n(p.reach) : NaN; }
  function postVerdict(p) {
    var r = engRate(p); if (!isFinite(r)) return '';
    var t = S.targets.engagement, band = n(S.targets.watchBand);
    return r >= t ? chip('Boost candidate', 'good') : r >= t * (1 - band) ? chip('Watch', 'warn') : chip('Below target', 'neutral');
  }

  /* ---------- Generic form ---------- */
  var modal = document.getElementById('modal'), modalForm = document.getElementById('modalForm');
  function fieldHTML(f, val) {
    var id = 'f_' + f.k, cls = 'field' + (f.full ? ' full' : '') + (f.t === 'checkbox' ? ' check' : '');
    var req = f.req ? ' required' : '', v = val == null ? '' : val, input;
    if (f.t === 'select') input = '<select id="' + id + '" name="' + f.k + '"' + req + '>' + opts(typeof f.o === 'function' ? f.o() : f.o, v, f.blank) + '</select>';
    else if (f.t === 'textarea') input = '<textarea id="' + id + '" name="' + f.k + '" rows="2">' + esc(v) + '</textarea>';
    else if (f.t === 'checkbox') return '<label class="' + cls + '"><input type="checkbox" name="' + f.k + '"' + (v ? ' checked' : '') + '><span>' + esc(f.l) + '</span></label>';
    else input = '<input id="' + id + '" name="' + f.k + '" type="' + (f.t || 'text') + '"' + (f.t === 'number' ? ' step="' + (f.step || 'any') + '"' : '') +
      (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + ' value="' + esc(v) + '"' + req + (f.list ? ' list="dl_' + f.k + '"' : '') + '>' +
      (f.list ? '<datalist id="dl_' + f.k + '">' + f.list().map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' : '');
    return '<label class="' + cls + '"><span>' + esc(f.l) + (f.hint ? ' <span class="muted">· ' + esc(f.hint) + '</span>' : '') + '</span>' + input + '</label>';
  }
  function readFields(fields) {
    var out = {};
    fields.forEach(function (f) {
      var el = modalForm.elements[f.k]; if (!el) return;
      out[f.k] = f.t === 'checkbox' ? el.checked : f.t === 'number' ? (el.value === '' ? '' : n(el.value)) : el.value.trim();
    });
    return out;
  }
  function openModal(title, bodyHTML, onSubmit, opt) {
    opt = opt || {};
    modalForm.innerHTML = '<div class="modal-head"><h2>' + esc(title) + '</h2><button type="button" class="icon-btn" data-close aria-label="Close">×</button></div>' +
      '<div class="modal-body">' + bodyHTML + '</div><div class="modal-foot">' +
      (opt.onDelete ? '<button type="button" class="btn danger" data-del>Delete</button><span class="spacer"></span>' : '') +
      '<button type="button" class="btn" data-close>Cancel</button><button type="submit" class="btn primary">' + esc(opt.submit || 'Save') + '</button></div>';
    modalForm.onsubmit = function (e) { e.preventDefault(); if (onSubmit() !== false) { modal.close(); save(); render(); } };
    modalForm.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { modal.close(); }; });
    var del = modalForm.querySelector('[data-del]');
    if (del) del.onclick = function () {
      if (!del.dataset.armed) { del.dataset.armed = '1'; del.textContent = 'Click again to delete'; return; }
      opt.onDelete(); modal.close(); save(); render(); toast('Deleted');
    };
    modal.showModal();
    if (opt.onOpen) opt.onOpen();
    var first = modalForm.querySelector('input, select, textarea'); if (first) first.focus();
  }
  function crudForm(key, rec, title) {
    var schema = SCHEMAS[key], isNew = !rec;
    var data = rec || (schema.defaults ? schema.defaults() : {});
    openModal((isNew ? 'Add ' : 'Edit ') + title, schema.fields.map(function (f) { return fieldHTML(f, data[f.k]); }).join(''), function () {
      var vals = readFields(schema.fields);
      if (isNew) { vals.id = uid(); S[key].push(vals); } else Object.assign(rec, vals);
      toast('Saved');
    }, { onDelete: isNew ? null : function () { S[key] = S[key].filter(function (r) { return r !== rec; }); } });
  }

  var SCHEMAS = {
    inventory: { fields: [
      { k: 'name', l: 'Ingredient / packaging', req: 1, full: 1 },
      { k: 'unit', l: 'Unit', t: 'select', o: ['g', 'ml', 'pcs', 'kg', 'l'] },
      { k: 'supplier', l: 'Supplier', list: function () { return uniq(S.inventory.map(function (i) { return i.supplier; })); } },
      { k: 'packSize', l: 'Pack size (units)', t: 'number' }, { k: 'packPrice', l: 'Pack price (THB)', t: 'number' },
      { k: 'opening', l: 'Opening stock', t: 'number', hint: 'counted before the log starts' },
      { k: 'reorderPoint', l: 'Reorder point', t: 'number' }, { k: 'target', l: 'Target stock', t: 'number' },
      { k: 'leadDays', l: 'Lead time (days)', t: 'number' }],
      defaults: function () { return { unit: 'g', leadDays: 1 }; } },
    stockLog: { fields: [
      { k: 'date', l: 'Date', t: 'date', req: 1 },
      { k: 'itemId', l: 'Ingredient / packaging', t: 'select', req: 1, o: function () { return S.inventory.map(function (i) { return { v: i.id, l: i.name + ' (' + i.unit + ')' }; }); } },
      { k: 'type', l: 'Type', t: 'select', o: STOCK_TYPES },
      { k: 'qty', l: 'Quantity (in the item unit)', t: 'number', req: 1, hint: 'Correction can be negative' },
      { k: 'note', l: 'Note', full: 1 }],
      defaults: function () { return { date: todayISO(), type: 'Received' }; } },
    transactions: { fields: [
      { k: 'date', l: 'Date', t: 'date', req: 1 },
      { k: 'account', l: 'Account', t: 'select', o: function () { return S.settings.accounts.map(function (a) { return { v: a.id, l: a.name }; }); } },
      { k: 'description', l: 'Description', req: 1, full: 1 },
      { k: 'category', l: 'Category', t: 'select', o: function () { return allCategories(); } },
      { k: 'amountIn', l: 'Cash in (+)', t: 'number' }, { k: 'amountOut', l: 'Cash out (−)', t: 'number' }],
      defaults: function () { return { date: todayISO(), account: 'kbank', category: 'Ingredients' }; } },
    ads: { fields: [
      { k: 'date', l: 'Date', t: 'date', req: 1 },
      { k: 'platform', l: 'Platform', list: function () { return ['Meta (Instagram + Facebook)', 'TikTok', 'LINE Ads'].concat(uniq(S.ads.map(function (a) { return a.platform; }))); } },
      { k: 'campaign', l: 'Campaign', full: 1 },
      { k: 'spend', l: 'Spend (THB)', t: 'number' }, { k: 'impressions', l: 'Impressions', t: 'number' },
      { k: 'clicks', l: 'Link clicks', t: 'number' }, { k: 'results', l: 'Results (orders or chats)', t: 'number' },
      { k: 'revenue', l: 'Revenue from ads (THB)', t: 'number', hint: 'ask buyers where they found Jollies' },
      { k: 'notes', l: 'Notes', full: 1, t: 'textarea' }],
      defaults: function () { return { date: todayISO(), platform: 'Meta (Instagram + Facebook)' }; } },
    posts: { fields: [
      { k: 'date', l: 'Post date', t: 'date', req: 1 },
      { k: 'platform', l: 'Platform', t: 'select', o: ['Instagram', 'TikTok', 'Facebook', 'LINE OA', 'Other'] },
      { k: 'format', l: 'Format', t: 'select', o: ['Reel', 'Carousel', 'Photo', 'Story', 'Video', 'Live'] },
      { k: 'link', l: 'Post link', t: 'url' },
      { k: 'topic', l: 'Topic or idea', full: 1 },
      { k: 'views24', l: 'Views at 24 hours', t: 'number' }, { k: 'views7', l: 'Views at 7 days', t: 'number' },
      { k: 'reach', l: 'Reach at 7 days', t: 'number' }, { k: 'likes', l: 'Likes', t: 'number' },
      { k: 'comments', l: 'Comments', t: 'number' }, { k: 'shares', l: 'Shares', t: 'number' },
      { k: 'saves', l: 'Saves', t: 'number' }, { k: 'clicks', l: 'Link clicks', t: 'number' },
      { k: 'notes', l: 'Notes and learnings', full: 1, t: 'textarea' }],
      defaults: function () { return { date: todayISO(), platform: 'Instagram', format: 'Reel' }; } },
    tasks: { fields: [
      { k: 'title', l: 'Task', req: 1, full: 1 },
      { k: 'section', l: 'Area', list: function () { return uniq(S.tasks.map(function (t) { return t.section; })); } },
      { k: 'owner', l: 'Owner', t: 'select', o: function () { return S.settings.team; }, blank: '-' },
      { k: 'due', l: 'Due date', t: 'date' }, { k: 'done', l: 'Done', t: 'checkbox' }],
      defaults: function () { return { section: 'Operation' }; } },
    budget: { fields: [
      { k: 'category', l: 'Category', req: 1 }, { k: 'amount', l: 'Budget (THB)', t: 'number', req: 1 },
      { k: 'note', l: 'Note', full: 1 }] }
  };
  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }

  /* ---------- Order form ---------- */
  function orderForm(o) {
    var isNew = !o;
    var d = o ? clone(o) : { createdAt: nowLocalDT(), customer: '', contact: '', channel: '', lines: [], deliveryMethod: 'Thai Post',
      deliveryFee: 50, shipOverride: '', payment: 'Unpaid', production: 'Pending', tracking: '', address: '', notes: '' };
    if (!d.lines.length) d.lines.push({ productId: (S.products.filter(function (p) { return p.active; })[0] || {}).id, qty: 1, mix: {} });
    var activeProducts = S.products.filter(function (p) { return p.active || d.lines.some(function (l) { return l.productId === p.id; }); });

    function linesHTML() {
      return d.lines.map(function (l, i) {
        var p = product(l.productId), mix = '';
        if (p && p.kind === 'box') {
          var pool = poolProducts(p.box.pool), c = lineCheck(l);
          mix = '<div class="mix">' + pool.map(function (pp) {
            return '<label>' + esc(shortName(pp.name)) + '<input type="number" min="0" step="1" data-mix="' + i + '" data-pid="' + pp.id + '" value="' + esc((l.mix || {})[pp.id] || '') + '"></label>';
          }).join('') + '</div><div class="small ' + (c && c.ok ? 'muted' : '') + '" style="margin:-6px 0 10px">' +
            (pool.length ? (c.ok ? '✓ ' : '⚠ ') + c.got + ' of ' + c.need + ' pieces chosen' : 'No active ' + esc(p.box.pool) + ' products to choose from.') + '</div>';
        }
        return '<div class="line"><select data-lp="' + i + '">' + opts(activeProducts.map(function (pp) { return { v: pp.id, l: pp.name + ' · ' + thb(pp.price) }; }), l.productId) +
          '</select><input type="number" min="1" step="1" data-lq="' + i + '" value="' + esc(l.qty) + '" aria-label="Quantity">' +
          '<button type="button" class="icon-btn" data-ldel="' + i + '" aria-label="Remove line">×</button></div>' + mix;
      }).join('');
    }
    function calcHTML() {
      var tmp = Object.assign({}, d, { lines: d.lines.map(function (l) { var p = product(l.productId); return Object.assign({}, l, { price: l.price != null && !l._repriced ? l.price : p ? p.price : 0 }); }) });
      tmp.createdAt = modalForm.elements.createdAt ? modalForm.elements.createdAt.value : d.createdAt;
      tmp.shipOverride = modalForm.elements.shipOverride ? modalForm.elements.shipOverride.value : d.shipOverride;
      tmp.deliveryFee = modalForm.elements.deliveryFee ? modalForm.elements.deliveryFee.value : d.deliveryFee;
      var auto = autoShipDate(parseDT(tmp.createdAt));
      return 'Ships <strong>' + esc(fmtDate(tmp.shipOverride || auto)) + '</strong>' + (tmp.shipOverride ? ' (override; auto would be ' + esc(fmtDate(auto, false)) + ')' : ' (auto, cut-off ' + esc(S.settings.cutoffTime) + ' the day before)') +
        ' · Items ' + thb(orderSubtotal(tmp)) + ' + delivery ' + thb(tmp.deliveryFee) + ' = <strong>' + thb(orderTotal(tmp)) + '</strong>' +
        ' · Est. cost ' + thb(orderCost(tmp)) + (o ? ' · ID ' + esc(o.id) : '');
    }
    var F = [
      { k: 'customer', l: 'Customer name', req: 1 }, { k: 'contact', l: 'LINE / phone' },
      { k: 'createdAt', l: 'Order date & time', t: 'datetime-local', req: 1 },
      { k: 'channel', l: 'Found us via', t: 'select', o: S.settings.channels, blank: '-' },
      { k: 'deliveryMethod', l: 'Delivery method', t: 'select', o: S.settings.deliveryMethods },
      { k: 'deliveryFee', l: 'Delivery fee (THB)', t: 'number' },
      { k: 'payment', l: 'Payment', t: 'select', o: PAYMENT }, { k: 'production', l: 'Production', t: 'select', o: PRODUCTION },
      { k: 'shipOverride', l: 'Ship date override', t: 'date', hint: 'leave blank for auto' }, { k: 'tracking', l: 'Tracking no.' },
      { k: 'address', l: 'Address', t: 'textarea', full: 1 }, { k: 'notes', l: 'Notes / issue', t: 'textarea', full: 1 }
    ];
    var body = F.slice(0, 4).map(function (f) { return fieldHTML(f, d[f.k]); }).join('') +
      '<div class="subform"><h3>Items</h3><div id="lines">' + linesHTML() + '</div><button type="button" class="btn sm" id="addLine">+ Add item</button></div>' +
      F.slice(4).map(function (f) { return fieldHTML(f, d[f.k]); }).join('') + '<div class="calc" id="calc"></div>';

    openModal(isNew ? 'New order' : 'Edit order ' + o.id, body, function () {
      var vals = readFields(F);
      var lines = d.lines.filter(function (l) { return l.productId && n(l.qty) > 0; }).map(function (l) {
        var p = product(l.productId);
        var mix = {}; Object.keys(l.mix || {}).forEach(function (k) { if (n(l.mix[k]) > 0) mix[k] = n(l.mix[k]); });
        return { productId: l.productId, qty: n(l.qty), price: l.price != null && !l._repriced ? l.price : p.price, mix: p.kind === 'box' ? mix : {} };
      });
      if (!lines.length) { toast('Add at least one item'); return false; }
      var rec = o || {};
      var wasPaid = o && o.payment === 'Paid';
      Object.assign(rec, vals, { lines: lines });
      if (rec.payment === 'Paid' && !wasPaid) rec.paidDate = todayISO();
      if (isNew) { rec.id = nextOrderId(shipDate(rec)); S.orders.push(rec); }
      syncPayment(rec);
      toast(isNew ? 'Order ' + rec.id + ' added' : 'Order saved');
      if (!orderFlavourOK(rec)) toast('Saved, but the flavour mix does not add up yet');
    }, {
      submit: isNew ? 'Add order' : 'Save',
      onDelete: isNew ? null : function () { S.orders = S.orders.filter(function (x) { return x !== o; }); S.transactions = S.transactions.filter(function (t) { return t.orderId !== o.id; }); },
      onOpen: function () {
        var linesEl = document.getElementById('lines'), calc = document.getElementById('calc');
        function refresh(full) { if (full) linesEl.innerHTML = linesHTML(); calc.innerHTML = calcHTML(); }
        refresh();
        linesEl.addEventListener('change', function (e) {
          var t = e.target;
          if (t.dataset.lp) { var l = d.lines[+t.dataset.lp]; l.productId = t.value; l.mix = {}; l._repriced = true; refresh(true); }
        });
        linesEl.addEventListener('input', function (e) {
          var t = e.target;
          if (t.dataset.lq) { d.lines[+t.dataset.lq].qty = n(t.value); refresh(false); updateMixNote(+t.dataset.lq); }
          if (t.dataset.mix) { var l = d.lines[+t.dataset.mix]; l.mix = l.mix || {}; l.mix[t.dataset.pid] = n(t.value); refresh(false); updateMixNote(+t.dataset.mix); }
        });
        function updateMixNote(i) {
          var c = lineCheck(d.lines[i]); if (!c) return;
          var inputs = linesEl.querySelectorAll('[data-mix="' + i + '"]'); if (!inputs.length) return;
          var note = inputs[0].closest('.mix').nextElementSibling;
          note.textContent = (c.ok ? '✓ ' : '⚠ ') + c.got + ' of ' + c.need + ' pieces chosen';
          note.className = 'small ' + (c.ok ? 'muted' : '');
        }
        linesEl.addEventListener('click', function (e) {
          var t = e.target.closest('[data-ldel]'); if (!t) return;
          d.lines.splice(+t.dataset.ldel, 1); if (!d.lines.length) d.lines.push({ productId: activeProducts[0] && activeProducts[0].id, qty: 1, mix: {} });
          refresh(true);
        });
        document.getElementById('addLine').onclick = function () { d.lines.push({ productId: activeProducts[0] && activeProducts[0].id, qty: 1, mix: {} }); refresh(true); };
        ['createdAt', 'shipOverride', 'deliveryFee'].forEach(function (k) { modalForm.elements[k].addEventListener('input', function () { refresh(false); }); });
        modalForm.elements.deliveryMethod.addEventListener('change', function (e) { if (e.target.value === 'Pickup') { modalForm.elements.deliveryFee.value = 0; refresh(false); } });
      }
    });
  }

  /* ---------- Product form ---------- */
  function productForm(p) {
    var isNew = !p;
    var d = p ? clone(p) : { name: '', category: 'Snowball', kind: 'single', price: 39, shelfLife: 5, maxPerBatch: 40, active: true, recipe: [], box: { pieces: 6, pool: 'Snowball', extras: [] }, notes: '' };
    if (!d.box) d.box = { pieces: 6, pool: 'Snowball', extras: [] };
    var cats = uniq(S.products.map(function (x) { return x.category; }).concat(['Snowball', 'Cookie', 'Boxset']));
    var F = [
      { k: 'name', l: 'Product name', req: 1, full: 1 },
      { k: 'category', l: 'Category', list: function () { return cats; } },
      { k: 'kind', l: 'Type', t: 'select', o: [{ v: 'single', l: 'Single piece (baked)' }, { v: 'box', l: 'Boxset (choose pieces)' }] },
      { k: 'price', l: 'Price (THB)', t: 'number', req: 1 }, { k: 'shelfLife', l: 'Shelf life (days)', t: 'number' },
      { k: 'maxPerBatch', l: 'Max units per batch', t: 'number' }, { k: 'active', l: 'On the menu', t: 'checkbox' },
      { k: 'notes', l: 'Notes', full: 1 }
    ];
    var itemOpts = S.inventory.map(function (i) { return { v: i.id, l: i.name + ' (' + i.unit + ')' }; });
    var singleOpts = S.products.filter(function (x) { return x.kind === 'single'; }).map(function (x) { return { v: x.id, l: x.name }; });
    function recipeHTML() {
      return d.recipe.map(function (r, i) {
        return '<div class="line"><select data-ri="' + i + '">' + opts(itemOpts, r[0]) + '</select><input type="number" step="any" data-rq="' + i + '" value="' + esc(r[1]) + '" aria-label="Quantity per unit">' +
          '<button type="button" class="icon-btn" data-rdel="' + i + '" aria-label="Remove">×</button></div>';
      }).join('') || '<p class="muted small">No ingredients yet.</p>';
    }
    function boxHTML() {
      return '<div class="row" style="margin-bottom:8px"><label class="field"><span>Pieces per box</span><input type="number" id="boxPieces" value="' + esc(d.box.pieces) + '"></label>' +
        '<label class="field"><span>Chosen from category</span><input id="boxPool" list="dl_cat" value="' + esc(d.box.pool) + '"></label></div>' +
        '<h3>Fixed extras per box</h3>' + (d.box.extras || []).map(function (e, i) {
          return '<div class="line"><select data-ei="' + i + '">' + opts(singleOpts, e[0]) + '</select><input type="number" data-eq="' + i + '" value="' + esc(e[1]) + '">' +
            '<button type="button" class="icon-btn" data-edel="' + i + '" aria-label="Remove">×</button></div>';
        }).join('') + '<button type="button" class="btn sm" id="addExtra">+ Add extra</button>';
    }
    function calcHTML() {
      var tmp = Object.assign({}, d, { price: n(modalForm.elements.price.value), kind: modalForm.elements.kind.value });
      var c = productCost(tmp), price = tmp.price;
      return 'Ingredient + packaging cost <strong>' + thb(c, 2) + '</strong> · Profit per unit <strong>' + thb(price - c, 2) + '</strong> · Margin <strong>' + pct(price ? (price - c) / price : NaN) + '</strong>' +
        (tmp.kind === 'box' ? '<br><span class="small">Box cost uses the average cost of active ' + esc(d.box.pool) + ' pieces.</span>' : '') +
        '<br><span class="small">Excludes labour, gas/electricity and delivery.</span>';
    }
    var body = F.map(function (f) { return fieldHTML(f, d[f.k]); }).join('') +
      '<datalist id="dl_cat">' + cats.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' +
      '<div class="subform"><h3 id="recipeTitle"></h3><div id="recipe">' + recipeHTML() + '</div><button type="button" class="btn sm" id="addIng">+ Add ingredient / packaging</button></div>' +
      '<div class="subform" id="boxWrap"><div id="boxBody">' + boxHTML() + '</div></div><div class="calc" id="calc"></div>';

    openModal(isNew ? 'New product' : 'Edit product', body, function () {
      var vals = readFields(F);
      var rec = p || { id: uid() };
      Object.assign(rec, vals, {
        recipe: d.recipe.filter(function (r) { return r[0] && n(r[1]) > 0; }).map(function (r) { return [r[0], n(r[1])]; }),
        box: vals.kind === 'box' ? { pieces: n(d.box.pieces), pool: d.box.pool, extras: (d.box.extras || []).filter(function (e) { return e[0] && n(e[1]) > 0; }) } : undefined
      });
      if (isNew) S.products.push(rec);
      toast('Product saved');
    }, {
      onDelete: isNew ? null : function () {
        if (S.orders.some(function (o) { return o.lines.some(function (l) { return l.productId === p.id; }); })) {
          p.active = false; toast('Product has orders, so it was taken off the menu instead');
        } else S.products = S.products.filter(function (x) { return x !== p; });
      },
      onOpen: function () {
        var rEl = document.getElementById('recipe'), bWrap = document.getElementById('boxWrap'), bEl = document.getElementById('boxBody'), calc = document.getElementById('calc');
        function sync() {
          var box = modalForm.elements.kind.value === 'box';
          bWrap.hidden = !box;
          document.getElementById('recipeTitle').textContent = box ? 'Packaging per box' : 'Recipe: ingredients and packaging per 1 unit sold';
          calc.innerHTML = calcHTML();
        }
        sync();
        modalForm.elements.kind.addEventListener('change', sync);
        modalForm.elements.price.addEventListener('input', sync);
        rEl.addEventListener('input', function (e) {
          var t = e.target;
          if (t.dataset.ri) d.recipe[+t.dataset.ri][0] = t.value;
          if (t.dataset.rq) d.recipe[+t.dataset.rq][1] = n(t.value);
          sync();
        });
        rEl.addEventListener('change', function (e) { if (e.target.dataset.ri) { d.recipe[+e.target.dataset.ri][0] = e.target.value; sync(); } });
        rEl.addEventListener('click', function (e) { var t = e.target.closest('[data-rdel]'); if (t) { d.recipe.splice(+t.dataset.rdel, 1); rEl.innerHTML = recipeHTML(); sync(); } });
        document.getElementById('addIng').onclick = function () { d.recipe.push([S.inventory[0].id, 1]); rEl.innerHTML = recipeHTML(); sync(); };
        bEl.addEventListener('input', function (e) {
          var t = e.target;
          if (t.id === 'boxPieces') d.box.pieces = n(t.value);
          if (t.id === 'boxPool') d.box.pool = t.value;
          if (t.dataset.eq) d.box.extras[+t.dataset.eq][1] = n(t.value);
          sync();
        });
        bEl.addEventListener('change', function (e) { if (e.target.dataset.ei) { d.box.extras[+e.target.dataset.ei][0] = e.target.value; sync(); } });
        bEl.addEventListener('click', function (e) {
          var t = e.target.closest('[data-edel]');
          if (t) { d.box.extras.splice(+t.dataset.edel, 1); bEl.innerHTML = boxHTML(); sync(); }
          if (e.target.id === 'addExtra') { d.box.extras = d.box.extras || []; d.box.extras.push([singleOpts[0] && singleOpts[0].v, 1]); bEl.innerHTML = boxHTML(); sync(); }
        });
      }
    });
  }

  /* ---------- Charts ---------- */
  var tip = document.getElementById('tip');
  document.addEventListener('mousemove', function (e) {
    var t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) { tip.hidden = true; return; }
    tip.innerHTML = t.getAttribute('data-tip'); tip.hidden = false;
    var x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
    tip.style.left = x + 'px'; tip.style.top = (e.clientY + 14) + 'px';
  });
  // Grouped bars: cash in vs cash out per month.
  function cashChart(rows) {
    if (!rows.length) return '<p class="empty">No transactions yet.</p>';
    var W = 900, H = 240, L = 52, B = 26, T = 10, R = 8;
    var max = Math.max.apply(null, rows.map(function (r) { return Math.max(r.inn, r.out); }).concat([1]));
    var step = niceStep(max / 4), top = Math.ceil(max / step) * step;
    var gw = (W - L - R) / rows.length, bw = Math.min(26, (gw - 12) / 2);
    var y = function (v) { return T + (H - T - B) * (1 - v / top); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Monthly cash in and cash out">';
    for (var v = 0; v <= top + 1e-9; v += step) {
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="var(--grid)" stroke-width="1"/>' +
        '<text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + short(v) + '</text>';
    }
    rows.forEach(function (r, i) {
      var cx = L + gw * i + gw / 2;
      var tipText = '<strong>' + esc(monthLabel(r.key)) + '</strong><br>Cash in ' + thb(r.inn) + '<br>Cash out ' + thb(r.out) + '<br>Net ' + thb(r.net);
      s += '<g data-tip="' + esc(tipText) + '"><rect x="' + (cx - gw / 2) + '" y="' + T + '" width="' + gw + '" height="' + (H - T - B) + '" fill="transparent"/>' +
        barPath(cx - bw - 1, y(r.inn), bw, y(0) - y(r.inn), 'var(--series-1)') + barPath(cx + 1, y(r.out), bw, y(0) - y(r.out), 'var(--series-2)') + '</g>' +
        '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(monthLabel(r.key).replace(' 20', " '")) + '</text>';
    });
    return s + '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="var(--muted)" stroke-width="1"/></svg>';
  }
  function barPath(x, y, w, h, fill) {
    if (h <= 0) return '';
    var r = Math.min(4, w / 2, h);
    return '<path fill="' + fill + '" d="M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z"/>';
  }
  function niceStep(raw) {
    if (raw <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }
  function short(v) { return v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : String(v); }
  function meter(used, total) {
    var r = total ? used / total : 0, cls = r > 1 ? 'bad' : r > 0.8 ? 'warn' : '';
    return '<div class="bar" title="' + pct(r, 0) + ' used"><i class="' + cls + '" style="width:' + Math.min(100, r * 100) + '%"></i></div>';
  }

  /* ---------- Views ---------- */
  var VIEWS = {};
  function setActions(html) { document.getElementById('pageActions').innerHTML = html || ''; }
  function table(head, rows, emptyMsg, foot) {
    return '<div class="table-wrap"><table><thead><tr>' + head.map(function (h) {
      var cls = h.charAt(0) === '#' ? ' class="num"' : ''; return '<th' + cls + '>' + esc(h.replace(/^#/, '')) + '</th>';
    }).join('') + '</tr></thead><tbody>' + (rows.length ? rows.join('') : '<tr><td colspan="' + head.length + '" class="empty">' + esc(emptyMsg || 'Nothing here yet.') + '</td></tr>') +
      (foot || '') + '</tbody></table></div>';
  }
  function stat(label, value, hint) {
    return '<div class="card stat"><div class="label">' + esc(label) + '</div><div class="value">' + value + '</div>' + (hint ? '<div class="hint">' + hint + '</div>' : '') + '</div>';
  }

  /* Dashboard */
  VIEWS.dashboard = { title: 'Dashboard', render: function () {
    setActions('<button class="btn primary" data-act="new-order">+ New order</button>');
    var active = nextShipDate(), accepting = autoShipDate(new Date());
    var batch = S.orders.filter(function (o) { return !isVoid(o) && shipDate(o) === active; });
    var paid = batch.filter(function (o) { return o.payment === 'Paid'; }), unpaid = batch.filter(function (o) { return o.payment === 'Unpaid'; });
    var pieces = {}; batch.forEach(function (o) { var p = orderPieces(o); Object.keys(p).forEach(function (k) { pieces[k] = (pieces[k] || 0) + p[k]; }); });
    var totalPieces = sum(Object.keys(pieces), function (k) { return pieces[k]; });
    var inv = inventoryView(), alerts = inv.filter(function (r) { return r.status === 'Short' || r.status === 'Reorder'; });
    var month = todayISO().slice(0, 7);
    var monthSales = sum(S.transactions.filter(function (t) { return monthKey(t.date) === month && t.category === 'Sales'; }), function (t) { return t.amountIn; });
    var spent = sum(S.transactions, function (t) { return t.amountOut; }), budget = sum(S.budget, function (b) { return b.amount; });
    var open = S.tasks.filter(function (t) { return !t.done; });
    var last7 = toISO(addDays(new Date(), -6));
    var adsWeek = adMetrics(S.ads.filter(function (a) { return a.date >= last7; }));
    var daysToLaunch = Math.ceil((parseDate(S.settings.launchDate) - startOfDay(new Date())) / 864e5);

    var html = '<p class="hero-line">' + (daysToLaunch > 0 ? '<strong>' + daysToLaunch + ' days to launch</strong> (' + esc(fmtDate(S.settings.launchDate)) + '). ' : '') +
      'Orders placed now ship <strong>' + esc(fmtDate(accepting)) + '</strong>; cut-off in <strong>' + countdown(cutoffFor(accepting)) + '</strong>.</p>';
    html += '<div class="grid g4">' +
      stat('Active batch', esc(fmtDate(active, false)), 'Bake & pack ' + esc(fmtDate(toISO(addDays(parseDate(active), -1)), false)) + ' · ship ' + esc(S.settings.shipTime)) +
      stat('Orders in batch', String(batch.length), paid.length + ' paid · ' + unpaid.length + ' unpaid · ' + thb(sum(paid, orderTotal)) + ' paid') +
      stat('Pieces to bake', num(totalPieces, 0), Object.keys(pieces).length ? Object.keys(pieces).map(function (k) { var p = product(k); return pieces[k] + ' ' + esc(shortName(p ? p.name : k)); }).join(' · ') : 'No orders yet') +
      stat('Cash on hand', thb(totalCash()), S.settings.accounts.map(function (a) { return esc(a.name.split(' ')[0]) + ' ' + thb(accountBalance(a.id)); }).join(' · ')) +
      '</div>';

    html += '<div class="grid g3">' +
      '<div class="card"><div class="card-head"><h2>Stock alerts</h2><a href="#inventory" class="small">Inventory →</a></div>' +
      (alerts.length ? '<ul class="list">' + alerts.slice(0, 7).map(function (r) {
        return '<li>' + statusChip(r.status) + '<span class="spacer">' + esc(r.it.name) + '</span><span class="small muted">' + (r.packs ? r.packs + ' pack' + (r.packs > 1 ? 's' : '') + ' by ' + esc(fmtShort(r.orderBy)) : '') + '</span></li>';
      }).join('') + '</ul>' + (alerts.length > 7 ? '<p class="small muted">+' + (alerts.length - 7) + ' more</p>' : '') : '<p class="muted">All tracked stock is above its reorder point.</p>') + '</div>' +
      '<div class="card"><div class="card-head"><h2>Money</h2><a href="#finance" class="small">Finance →</a></div><ul class="list">' +
      '<li><span class="spacer">Sales this month</span><strong>' + thb(monthSales) + '</strong></li>' +
      '<li><span class="spacer">Spent to date</span><strong>' + thb(spent) + '</strong></li>' +
      '<li><span class="spacer">Budget used</span><span style="width:110px">' + meter(spent, budget) + '</span><span class="small muted">' + pct(budget ? spent / budget : 0, 0) + '</span></li>' +
      '<li><span class="spacer">Unpaid orders (all)</span><strong>' + thb(sum(S.orders.filter(function (o) { return o.payment === 'Unpaid'; }), orderTotal)) + '</strong></li></ul></div>' +
      '<div class="card"><div class="card-head"><h2>Marketing, last 7 days</h2><a href="#marketing" class="small">Marketing →</a></div><ul class="list">' +
      '<li><span class="spacer">Ad spend</span><strong>' + thb(adsWeek.spend) + '</strong></li>' +
      '<li><span class="spacer">ROAS</span><strong>' + (isFinite(adsWeek.roas) ? adsWeek.roas.toFixed(2) : '-') + '</strong>' + vsTarget(adsWeek.roas, S.targets.targetRoas) + '</li>' +
      '<li><span class="spacer">Posts</span><strong>' + S.posts.filter(function (p) { return p.date >= last7; }).length + '</strong></li>' +
      '<li><span class="spacer">Orders by channel</span><span class="small muted">' + channelSummary(S.orders.filter(function (o) { return o.createdAt.slice(0, 10) >= last7; })) + '</span></li></ul></div>' +
      '</div>';

    html += '<div class="card"><div class="card-head"><h2>Open tasks</h2><span class="sub">' + open.length + ' of ' + S.tasks.length + ' open</span><a href="#tasks" class="small">All tasks →</a></div>' +
      (open.length ? '<ul class="list">' + open.slice(0, 6).map(taskRow).join('') + '</ul>' : '<p class="muted">Nothing open. Nice.</p>') + '</div>';
    return html;
  } };
  function channelSummary(orders) {
    var m = {}; orders.forEach(function (o) { var c = o.channel || 'Unknown'; m[c] = (m[c] || 0) + 1; });
    var k = Object.keys(m); return k.length ? k.map(function (c) { return esc(c) + ' ' + m[c]; }).join(' · ') : 'No orders';
  }
  function taskRow(t) {
    return '<li><input type="checkbox" data-act="toggle-task" data-id="' + t.id + '"' + (t.done ? ' checked' : '') + ' aria-label="Done">' +
      '<span class="spacer' + (t.done ? ' task-done' : '') + '">' + esc(t.title) + ' <span class="small muted">· ' + esc(t.section) + '</span></span>' +
      (t.due ? '<span class="small ' + (!t.done && t.due < todayISO() ? '' : 'muted') + '">' + (!t.done && t.due < todayISO() ? chip('Overdue ' + fmtShort(t.due), 'bad') : esc(fmtShort(t.due))) + '</span>' : '') +
      chip(t.owner || '-', 'neutral') + '<button class="link-btn small" data-act="edit-task" data-id="' + t.id + '">Edit</button></li>';
  }

  /* Orders */
  VIEWS.orders = { title: 'Orders', render: function () {
    setActions('<button class="btn" data-act="export-orders">Export CSV</button><button class="btn primary" data-act="new-order">+ New order</button>');
    var f = UI.orders, today = nextShipDate();
    var ships = uniq(S.orders.map(shipDate).concat(upcomingShipDates(4))).sort();
    var list = S.orders.filter(function (o) {
      var sd = shipDate(o);
      if (f.ship === 'upcoming' && sd < today) return false;
      if (f.ship && f.ship !== 'upcoming' && f.ship !== 'all' && sd !== f.ship) return false;
      if (f.pay && o.payment !== f.pay) return false;
      if (f.prod && o.production !== f.prod) return false;
      if (f.q) { var hay = (o.id + ' ' + o.customer + ' ' + o.contact + ' ' + o.address + ' ' + o.notes + ' ' + o.tracking).toLowerCase(); if (hay.indexOf(f.q.toLowerCase()) < 0) return false; }
      return true;
    }).sort(function (a, b) { return shipDate(a) < shipDate(b) ? -1 : shipDate(a) > shipDate(b) ? 1 : a.createdAt < b.createdAt ? -1 : 1; });
    var html = '<div class="card"><div class="filters">' +
      '<label>Ship date<select data-filter="orders.ship">' + opts([{ v: 'upcoming', l: 'Upcoming' }, { v: 'all', l: 'All dates' }].concat(ships.map(function (s) { return { v: s, l: fmtDate(s) }; })), f.ship) + '</select></label>' +
      '<label>Payment<select data-filter="orders.pay">' + opts(PAYMENT, f.pay, 'Any') + '</select></label>' +
      '<label>Production<select data-filter="orders.prod">' + opts(PRODUCTION, f.prod, 'Any') + '</select></label>' +
      '<label>Search<input type="search" data-filter="orders.q" value="' + esc(f.q) + '" placeholder="Name, ID, address…"></label></div>';
    html += table(['Order', 'Ship', 'Customer', 'Items', '#Total', 'Payment', 'Production', 'Delivery', ''], list.map(function (o) {
      var flav = orderFlavourOK(o) ? '' : ' ' + chip('⚠ Flavour mix', 'warn');
      return '<tr><td><strong>' + esc(o.id) + '</strong><div class="sub">' + esc(fmtDT(o.createdAt)) + '</div></td>' +
        '<td>' + esc(fmtDate(shipDate(o), false)) + (o.shipOverride ? ' <span class="sub">override</span>' : '') + '</td>' +
        '<td>' + esc(o.customer) + '<div class="sub">' + esc(o.contact) + (o.channel ? ' · ' + esc(o.channel) : '') + '</div></td>' +
        '<td style="max-width:280px">' + esc(orderItemsText(o)) + flav + (o.notes ? '<div class="sub">' + esc(o.notes) + '</div>' : '') + '</td>' +
        '<td class="num">' + thb(orderTotal(o)) + '</td>' +
        '<td><select class="inline" data-act="set-pay" data-id="' + esc(o.id) + '" aria-label="Payment">' + opts(PAYMENT, o.payment) + '</select></td>' +
        '<td><select class="inline" data-act="set-prod" data-id="' + esc(o.id) + '" aria-label="Production">' + opts(PRODUCTION, o.production) + '</select></td>' +
        '<td>' + esc(o.deliveryMethod) + (o.tracking ? '<div class="sub">' + esc(o.tracking) + '</div>' : '') + '</td>' +
        '<td><button class="link-btn" data-act="edit-order" data-id="' + esc(o.id) + '">Edit</button></td></tr>';
    }), S.orders.length ? 'No orders match these filters.' : 'No orders yet. Add the first one with “+ New order”.',
      list.length ? '<tr class="total"><td colspan="4">' + list.length + ' orders</td><td class="num">' + thb(sum(list, orderTotal)) + '</td><td colspan="4"></td></tr>' : '');
    return html + '</div>';
  } };

  /* Bake & pack */
  VIEWS.bake = { title: 'Bake & pack', render: function () {
    setActions('');
    var ships = uniq(upcomingShipDates(4).concat(S.orders.map(shipDate))).sort();
    var ship = UI.bakeShip || nextShipDate();
    var orders = S.orders.filter(function (o) { return !isVoid(o) && shipDate(o) === ship; });
    var rows = {};
    orders.forEach(function (o) {
      var p = orderPieces(o);
      Object.keys(p).forEach(function (k) { rows[k] = rows[k] || { paid: 0, unpaid: 0 }; rows[k][o.payment === 'Paid' ? 'paid' : 'unpaid'] += p[k]; });
    });
    var keys = Object.keys(rows).sort(function (a, b) { return (product(a) || {}).name > (product(b) || {}).name ? 1 : -1; });
    var html = '<div class="filters"><label>Ship date<select data-filter="bakeShip">' + opts(ships.map(function (s) { return { v: s, l: fmtDate(s) }; }), ship) + '</select></label>' +
      '<span class="small muted" style="padding-bottom:8px">Bake &amp; pack ' + esc(fmtDate(toISO(addDays(parseDate(ship), -1)))) + ' · order cut-off ' + esc(fmtDT(toISO(cutoffFor(ship)) + 'T' + S.settings.cutoffTime)) + '</span></div>';
    html += '<div class="grid g2"><div class="card"><div class="card-head"><h2>What to bake</h2><span class="sub">Cancelled and refunded orders excluded</span></div>' +
      table(['Piece', '#Paid', '#Unpaid', '#Total', '#Max / batch', ''], keys.map(function (k) {
        var p = product(k) || { name: k, maxPerBatch: 0 }, r = rows[k], tot = r.paid + r.unpaid;
        return '<tr><td>' + esc(p.name) + '</td><td class="num">' + r.paid + '</td><td class="num">' + (r.unpaid || '-') + '</td><td class="num"><strong>' + tot + '</strong></td><td class="num">' + (p.maxPerBatch || '-') + '</td>' +
          '<td>' + (p.maxPerBatch && tot > p.maxPerBatch ? chip('⚠ Over capacity', 'bad') : '') + '</td></tr>';
      }), 'No orders for this ship date.',
      keys.length ? '<tr class="total"><td>Total pieces</td><td class="num">' + sum(keys, function (k) { return rows[k].paid; }) + '</td><td class="num">' + sum(keys, function (k) { return rows[k].unpaid; }) + '</td><td class="num">' + sum(keys, function (k) { return rows[k].paid + rows[k].unpaid; }) + '</td><td colspan="2"></td></tr>' : '') + '</div>';
    var ing = {};
    orders.filter(function (o) { return o.payment === 'Paid' || S.settings.countUnpaid; }).forEach(function (o) {
      var x = orderIngredients(o); Object.keys(x).forEach(function (k) { ing[k] = (ing[k] || 0) + x[k]; });
    });
    var inv = inventoryView();
    html += '<div class="card"><div class="card-head"><h2>Ingredients for this batch</h2><span class="sub">' + (S.settings.countUnpaid ? 'Paid + unpaid' : 'Paid orders only') + '</span></div>' +
      table(['Item', '#Needed', '#On hand', ''], Object.keys(ing).map(function (k) {
        var it = item(k) || { name: k, unit: '' }, r = inv.filter(function (x) { return x.it.id === k; })[0];
        var oh = r ? r.onHand : 0;
        return '<tr><td>' + esc(it.name) + '</td><td class="num">' + num(ing[k]) + ' ' + esc(it.unit) + '</td><td class="num">' + num(oh) + '</td><td>' + (oh < ing[k] ? chip('⚠ Short ' + num(ing[k] - oh), 'bad') : chip('✓', 'good')) + '</td></tr>';
      }), 'Nothing needed yet.') + '</div></div>';
    html += '<div class="card"><div class="card-head"><h2>Packing list</h2><div class="row no-print">' +
      '<button class="btn sm" data-act="bulk-prod" data-ship="' + ship + '" data-from="Pending" data-to="Baked">Mark paid as Baked</button>' +
      '<button class="btn sm" data-act="bulk-prod" data-ship="' + ship + '" data-from="Baked" data-to="Packed">Mark baked as Packed</button>' +
      '<button class="btn sm" data-act="bulk-prod" data-ship="' + ship + '" data-from="Packed" data-to="Shipped">Mark packed as Shipped</button></div></div>' +
      table(['Order', 'Customer', 'Items & flavours', 'Delivery', 'Payment', 'Production'], orders.map(function (o) {
        return '<tr><td><strong>' + esc(o.id) + '</strong></td><td>' + esc(o.customer) + '<div class="sub">' + esc(o.contact) + '</div></td>' +
          '<td>' + esc(orderItemsText(o)) + (orderFlavourOK(o) ? '' : ' ' + chip('⚠ Flavour mix', 'warn')) + (o.notes ? '<div class="sub">' + esc(o.notes) + '</div>' : '') + '</td>' +
          '<td>' + esc(o.deliveryMethod) + '<div class="sub">' + esc(o.address) + '</div></td>' +
          '<td>' + chip(o.payment, o.payment === 'Paid' ? 'good' : 'warn') + '</td>' +
          '<td><select class="inline" data-act="set-prod" data-id="' + esc(o.id) + '" aria-label="Production">' + opts(PRODUCTION, o.production) + '</select></td></tr>';
      }), 'No orders for this ship date.') + '</div>';
    return html;
  } };

  /* Inventory */
  VIEWS.inventory = { title: 'Inventory', render: function () {
    setActions('<button class="btn" data-act="add" data-key="inventory">+ Item</button><button class="btn primary" data-act="add" data-key="stockLog">+ Log stock</button>');
    var inv = inventoryView(), buy = inv.filter(function (r) { return r.packs > 0; });
    var html = '<p class="hero-line">On hand = opening + received + corrections − waste − used in baking (from orders marked Baked or later). “Needed” is the active batch, <strong>' + esc(fmtDate(nextShipDate())) + '</strong>.</p>';
    html += '<div class="card"><div class="card-head"><h2>Purchase list</h2><span class="sub">' + buy.length + ' items · est. ' + thb(sum(buy, function (r) { return r.cost; })) + '</span></div>' +
      table(['Item', 'Supplier', 'Status', '#Packs', '#Units', '#Est. cost', 'Order by'], buy.map(function (r) {
        return '<tr><td>' + esc(r.it.name) + '</td><td>' + esc(r.it.supplier) + '</td><td>' + statusChip(r.status) + '</td><td class="num">' + r.packs + ' × ' + num(r.it.packSize, 0) + '</td>' +
          '<td class="num">' + num(r.packs * n(r.it.packSize), 0) + ' ' + esc(r.it.unit) + '</td><td class="num">' + thb(r.cost) + '</td><td>' + esc(fmtDate(r.orderBy, false)) + '</td></tr>';
      }), 'Nothing to buy right now.') + '</div>';
    html += '<div class="card"><div class="card-head"><h2>Stock</h2><span class="sub">Click a row to edit</span></div>' +
      table(['Item', 'Supplier', '#Cost / unit', '#On hand', '#Needed', '#Left after', '#Reorder at', 'Status'], inv.map(function (r) {
        return '<tr data-act="edit" data-key="inventory" data-id="' + r.it.id + '" style="cursor:pointer"><td>' + esc(r.it.name) + ' <span class="sub">' + esc(r.it.unit) + '</span></td><td>' + esc(r.it.supplier) + '</td>' +
          '<td class="num">' + (unitCost(r.it) ? '฿' + unitCost(r.it).toFixed(3) : '-') + '</td><td class="num"><strong>' + num(r.onHand) + '</strong></td>' +
          '<td class="num">' + (r.need ? num(r.need) : '-') + '</td><td class="num">' + num(r.left) + '</td><td class="num">' + (n(r.it.reorderPoint) ? num(r.it.reorderPoint) : '-') + '</td><td>' + statusChip(r.status) + '</td></tr>';
      })) + '</div>';
    var logs = S.stockLog.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    html += '<div class="card"><div class="card-head"><h2>Stock log</h2><span class="sub">Deliveries, waste and count corrections</span></div>' +
      table(['Date', 'Item', 'Type', '#Qty', 'Note', ''], logs.map(function (l) {
        var it = item(l.itemId) || { name: '(deleted)', unit: '' };
        return '<tr><td>' + esc(fmtDate(l.date, false)) + '</td><td>' + esc(it.name) + '</td><td>' + chip(l.type, l.type === 'Received' ? 'good' : l.type === 'Waste' ? 'bad' : 'info') + '</td>' +
          '<td class="num">' + num(l.qty) + ' ' + esc(it.unit) + '</td><td>' + esc(l.note) + '</td><td><button class="link-btn" data-act="edit" data-key="stockLog" data-id="' + l.id + '">Edit</button></td></tr>';
      }), 'No stock movements logged yet. Use “+ Log stock” when a delivery arrives.') + '</div>';
    return html;
  } };

  /* Menu */
  VIEWS.menu = { title: 'Menu & recipes', render: function () {
    setActions('<button class="btn primary" data-act="new-product">+ Product</button>');
    var rows = S.products.slice().sort(function (a, b) { return (b.active - a.active) || (a.category > b.category ? 1 : a.category < b.category ? -1 : 0); });
    var html = '<div class="card"><div class="card-head"><h2>Products</h2><span class="sub">Cost = ingredients + packaging from recipes × current inventory prices</span></div>' +
      table(['Product', 'Category', '#Price', '#Cost', '#Profit / unit', '#Margin', '#Max / batch', 'Status'], rows.map(function (p) {
        var c = productCost(p), m = p.price ? (p.price - c) / p.price : NaN;
        return '<tr data-act="edit-product" data-id="' + p.id + '" style="cursor:pointer"><td>' + esc(p.name) + (p.notes ? '<div class="sub">' + esc(p.notes) + '</div>' : '') + '</td><td>' + esc(p.category) + '</td>' +
          '<td class="num">' + thb(p.price) + '</td><td class="num">' + thb(c, 2) + '</td><td class="num">' + thb(p.price - c, 2) + '</td><td class="num">' + pct(m) + '</td>' +
          '<td class="num">' + (p.maxPerBatch || '-') + '</td><td>' + (p.active ? (hasRecipe(p) ? chip('On menu', 'good') : chip('⚠ No recipe', 'warn')) : chip('Off menu', 'neutral')) + '</td></tr>';
      })) + '<p class="small muted">Costs exclude labour, gas/electricity, delivery and payment fees: add those before judging margin.</p></div>';
    var active = S.products.filter(function (p) { return p.active && p.kind === 'single' && p.recipe.length; });
    html += '<div class="card"><div class="card-head"><h2>Recipe cost breakdown</h2><span class="sub">Per 1 piece</span></div><div class="grid g3">' + active.map(function (p) {
      return '<div><h3 style="margin-bottom:6px">' + esc(p.name) + ' · ' + thb(productCost(p), 2) + '</h3><table>' + p.recipe.map(function (r) {
        var it = item(r[0]) || { name: r[0], unit: '' };
        return '<tr><td class="small">' + esc(it.name) + '</td><td class="num small">' + num(r[1], 3) + ' ' + esc(it.unit) + '</td><td class="num small">' + thb(unitCost(it) * r[1], 2) + '</td></tr>';
      }).join('') + '</table></div>';
    }).join('') + '</div></div>';
    return html;
  } };

  /* Tasks */
  VIEWS.tasks = { title: 'Tasks', render: function () {
    setActions('<button class="btn primary" data-act="add" data-key="tasks">+ Task</button>');
    var list = S.tasks.filter(function (t) { return !UI.taskOwner || t.owner === UI.taskOwner; });
    var sections = uniq(list.map(function (t) { return t.section || 'Other'; }));
    var done = S.tasks.filter(function (t) { return t.done; }).length;
    var html = '<div class="filters"><label>Owner<select data-filter="taskOwner">' + opts(uniq(S.settings.team.concat(S.tasks.map(function (t) { return t.owner; }))), UI.taskOwner, 'Everyone') + '</select></label>' +
      '<div style="min-width:200px;padding-bottom:8px"><div class="small muted">' + done + ' of ' + S.tasks.length + ' done</div>' + meter(done, S.tasks.length) + '</div></div>';
    html += '<div class="grid g2">' + sections.map(function (s) {
      var ts = list.filter(function (t) { return (t.section || 'Other') === s; });
      return '<div class="card"><div class="card-head"><h2>' + esc(s) + '</h2><span class="sub">' + ts.filter(function (t) { return t.done; }).length + '/' + ts.length + '</span></div><ul class="list">' +
        ts.sort(function (a, b) { return a.done - b.done; }).map(taskRow).join('') + '</ul></div>';
    }).join('') + '</div>';
    return html || '<p class="empty">No tasks.</p>';
  } };

  /* Marketing */
  function rangeFilters() {
    return '<div class="filters"><label>From<input type="date" data-filter="mkt.from" value="' + esc(UI.mkt.from) + '"></label>' +
      '<label>To<input type="date" data-filter="mkt.to" value="' + esc(UI.mkt.to) + '"></label>' +
      '<button class="btn sm" data-act="range" data-days="7">Last 7 days</button><button class="btn sm" data-act="range" data-days="30">Last 30 days</button><button class="btn sm" data-act="range" data-days="0">All time</button></div>';
  }
  VIEWS.marketing = { title: 'Marketing performance', render: function () {
    setActions('<button class="btn" data-act="add" data-key="posts">+ Post</button><button class="btn primary" data-act="add" data-key="ads">+ Ad day</button>');
    var ads = S.ads.filter(function (a) { return inRange(a.date); }), posts = S.posts.filter(function (p) { return inRange(p.date); });
    var m = adMetrics(ads), T = S.targets;
    var reach = sum(posts, function (p) { return p.reach; }), eng = sum(posts, engagements);
    var html = rangeFilters();
    html += '<div class="card"><div class="card-head"><h2>Paid ads</h2><span class="sub">Break-even ROAS ' + breakEvenRoas().toFixed(2) + ' at ' + pct(T.grossMargin, 0) + ' gross margin</span></div>' +
      table(['Metric', '#Actual', '#Target', 'Status', 'How to read it'], [
        ['Ad spend', thb(m.spend), '', '', 'Money put into ads.'],
        ['Revenue from ads', thb(m.rev), '', '', 'Revenue from orders traced to ads.'],
        ['ROAS', isFinite(m.roas) ? m.roas.toFixed(2) : '-', T.targetRoas.toFixed(2), vsTarget(m.roas, T.targetRoas), 'Revenue per ฿1 of ads.'],
        ['Results', num(m.results, 0), '', '', 'Orders or chats the ads produced.'],
        ['Cost per result', isFinite(m.cpr) ? thb(m.cpr, 2) : '-', '', '', 'Lower is better.'],
        ['Impressions', num(m.imp, 0), '', '', 'Times the ads were shown.'],
        ['Link clicks', num(m.clicks, 0), '', '', 'Clicks to LINE OA or the bio link.'],
        ['CTR', pct(m.ctr, 2), pct(T.ctr, 1), vsTarget(m.ctr, T.ctr), 'Low CTR points to a weak creative or audience.'],
        ['CPC', isFinite(m.cpc) ? thb(m.cpc, 2) : '-', '', '', 'Cost of one click.'],
        ['CPM', isFinite(m.cpm) ? thb(m.cpm, 2) : '-', '', '', 'Cost per 1,000 impressions.']
      ].map(function (r) { return '<tr><td>' + r[0] + '</td><td class="num"><strong>' + r[1] + '</strong></td><td class="num">' + r[2] + '</td><td>' + r[3] + '</td><td class="small muted">' + r[4] + '</td></tr>'; })) + '</div>';
    html += '<div class="grid g2"><div class="card"><div class="card-head"><h2>Organic posts</h2></div><div class="grid g2">' +
      stat('Posts', String(posts.length)) + stat('Avg views at 24h', posts.length ? num(sum(posts, function (p) { return p.views24; }) / posts.length, 0) : '-') +
      stat('Avg views at 7 days', posts.length ? num(sum(posts, function (p) { return p.views7; }) / posts.length, 0) : '-') +
      stat('Engagement rate', reach ? pct(eng / reach) : '-', vsTarget(reach ? eng / reach : NaN, T.engagement) + ' target ' + pct(T.engagement, 1)) + '</div></div>';
    var orders = S.orders.filter(function (o) { return !isVoid(o) && inRange(o.createdAt.slice(0, 10)); });
    var ch = {}; orders.forEach(function (o) { var c = o.channel || 'Unknown'; ch[c] = ch[c] || { n: 0, rev: 0 }; ch[c].n++; ch[c].rev += orderTotal(o); });
    var maxRev = Math.max.apply(null, Object.keys(ch).map(function (k) { return ch[k].rev; }).concat([1]));
    html += '<div class="card"><div class="card-head"><h2>Orders by channel</h2><span class="sub">From “Found us via” on each order</span></div>' +
      table(['Channel', '#Orders', '#Revenue', ''], Object.keys(ch).sort(function (a, b) { return ch[b].rev - ch[a].rev; }).map(function (k) {
        return '<tr><td>' + esc(k) + '</td><td class="num">' + ch[k].n + '</td><td class="num">' + thb(ch[k].rev) + '</td><td style="width:35%"><div class="bar"><i style="width:' + (ch[k].rev / maxRev * 100) + '%"></i></div></td></tr>';
      }), 'No orders in this period.') + '</div></div>';
    var top = posts.slice().sort(function (a, b) { return (engRate(b) || 0) - (engRate(a) || 0); }).slice(0, 5);
    html += '<div class="card"><div class="card-head"><h2>Top posts by engagement rate</h2><a href="#posts" class="small">All posts →</a></div>' +
      table(['Date', 'Platform', 'Topic', '#Views 7d', '#Eng. rate', 'Verdict'], top.map(function (p) {
        return '<tr><td>' + esc(fmtShort(p.date)) + '</td><td>' + esc(p.platform) + ' · ' + esc(p.format) + '</td><td>' + esc(p.topic) + '</td><td class="num">' + num(p.views7, 0) + '</td><td class="num">' + pct(engRate(p)) + '</td><td>' + postVerdict(p) + '</td></tr>';
      }), 'No posts logged in this period.') + '</div>';
    html += targetsCard();
    return html;
  } };
  function targetsCard() {
    var T = S.targets;
    return '<div class="card"><div class="card-head"><h2>Targets</h2><button class="btn sm" data-act="edit-targets">Edit targets</button></div><div class="grid g4">' +
      stat('Gross margin', pct(T.grossMargin, 1), 'Menu blended: ' + pct(blendedMargin(), 1)) + stat('Target ROAS', T.targetRoas.toFixed(2), 'Break-even ' + breakEvenRoas().toFixed(2)) +
      stat('Target CTR', pct(T.ctr, 1)) + stat('Target engagement', pct(T.engagement, 1), 'Watch band ±' + pct(T.watchBand, 0)) + '</div></div>';
  }
  function blendedMargin() {
    var ps = S.products.filter(function (p) { return p.active && hasRecipe(p) && p.price; });
    if (!ps.length) return NaN;
    return sum(ps, function (p) { return (p.price - productCost(p)) / p.price; }) / ps.length;
  }
  VIEWS.ads = { title: 'Ads tracker', render: function () {
    setActions('<button class="btn primary" data-act="add" data-key="ads">+ Ad day</button>');
    var rows = S.ads.filter(function (a) { return inRange(a.date); }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var m = adMetrics(rows);
    return rangeFilters() + '<div class="card"><p class="small muted" style="margin-top:0">One row per ad per day. Copy spend, impressions, link clicks and results from the ad platform.</p>' +
      table(['Date', 'Platform / campaign', '#Spend', '#Impr.', '#Clicks', '#Results', '#Revenue', '#CTR', '#CPC', '#ROAS', 'Verdict', ''], rows.map(function (a) {
        var x = adMetrics([a]);
        return '<tr><td>' + esc(fmtShort(a.date)) + '</td><td>' + esc(a.platform) + '<div class="sub">' + esc(a.campaign) + '</div></td><td class="num">' + thb(a.spend) + '</td><td class="num">' + num(a.impressions, 0) + '</td>' +
          '<td class="num">' + num(a.clicks, 0) + '</td><td class="num">' + num(a.results, 0) + '</td><td class="num">' + thb(a.revenue) + '</td><td class="num">' + pct(x.ctr, 2) + '</td>' +
          '<td class="num">' + (isFinite(x.cpc) ? thb(x.cpc, 2) : '-') + '</td><td class="num">' + (isFinite(x.roas) ? x.roas.toFixed(2) : '-') + '</td><td>' + adVerdict(a) + '</td>' +
          '<td><button class="link-btn" data-act="edit" data-key="ads" data-id="' + a.id + '">Edit</button></td></tr>';
      }), 'No ad days logged yet.', rows.length ? '<tr class="total"><td colspan="2">Total</td><td class="num">' + thb(m.spend) + '</td><td class="num">' + num(m.imp, 0) + '</td><td class="num">' + num(m.clicks, 0) + '</td><td class="num">' + num(m.results, 0) + '</td><td class="num">' + thb(m.rev) + '</td><td class="num">' + pct(m.ctr, 2) + '</td><td class="num">' + (isFinite(m.cpc) ? thb(m.cpc, 2) : '-') + '</td><td class="num">' + (isFinite(m.roas) ? m.roas.toFixed(2) : '-') + '</td><td colspan="2"></td></tr>' : '') + '</div>';
  } };
  VIEWS.posts = { title: 'Post tracker', render: function () {
    setActions('<button class="btn primary" data-act="add" data-key="posts">+ Post</button>');
    var rows = S.posts.filter(function (p) { return inRange(p.date); }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return rangeFilters() + '<div class="card"><p class="small muted" style="margin-top:0">Enter views 24 hours after posting and again at 7 days, then reach and engagement from insights.</p>' +
      table(['Date', 'Post', '#Views 24h', '#Views 7d', '#Reach', '#Engagements', '#Eng. rate', '#Clicks', 'Verdict', ''], rows.map(function (p) {
        return '<tr><td>' + esc(fmtShort(p.date)) + '</td><td>' + (p.link ? '<a href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.topic || 'Post') + '</a>' : esc(p.topic)) + '<div class="sub">' + esc(p.platform) + ' · ' + esc(p.format) + (p.notes ? ' · ' + esc(p.notes) : '') + '</div></td>' +
          '<td class="num">' + num(p.views24, 0) + '</td><td class="num">' + num(p.views7, 0) + '</td><td class="num">' + num(p.reach, 0) + '</td><td class="num">' + num(engagements(p), 0) + '</td>' +
          '<td class="num">' + pct(engRate(p)) + '</td><td class="num">' + num(p.clicks, 0) + '</td><td>' + postVerdict(p) + '</td><td><button class="link-btn" data-act="edit" data-key="posts" data-id="' + p.id + '">Edit</button></td></tr>';
      }), 'No posts logged yet.') + '</div>';
  } };

  /* Finance */
  VIEWS.finance = { title: 'Cash & P&L', render: function () {
    setActions('<button class="btn primary" data-act="add" data-key="transactions">+ Transaction</button>');
    var rows = monthlyCash();
    var budget = sum(S.budget, function (b) { return b.amount; }), spent = sum(S.transactions, function (t) { return t.amountOut; });
    var html = '<div class="grid g4">' + stat('Total cash', thb(totalCash()), 'All accounts') +
      S.settings.accounts.map(function (a) { return stat(a.name, thb(accountBalance(a.id)), 'Opening ' + thb(a.opening)); }).join('') +
      stat('Budget remaining', thb(budget - spent), pct(budget ? spent / budget : 0, 0) + ' of ' + thb(budget) + ' used') + '</div>';
    html += '<div class="card"><div class="card-head"><h2>Monthly cash flow</h2><div class="legend"><span><i style="background:var(--series-1)"></i>Cash in</span><span><i style="background:var(--series-2)"></i>Cash out</span></div></div>' +
      '<div class="chart">' + cashChart(rows) + '</div>' +
      table(['Month', '#Cash in', '#Cash out', '#Net', '#Closing balance'], rows.map(function (r) {
        return '<tr><td>' + esc(monthLabel(r.key)) + '</td><td class="num">' + thb(r.inn) + '</td><td class="num">' + thb(r.out) + '</td><td class="num">' + (r.net < 0 ? '(' + thb(-r.net) + ')' : thb(r.net)) + '</td><td class="num">' + thb(r.close) + '</td></tr>';
      })) + '</div>';
    // Simple P&L by ship month.
    var months = uniq(S.orders.map(function (o) { return monthKey(shipDate(o)); }).concat([todayISO().slice(0, 7)])).sort();
    var mk = UI.financeMonth || months[months.length - 1];
    var sold = S.orders.filter(function (o) { return o.payment === 'Paid' && monthKey(shipDate(o)) === mk; });
    var rev = sum(sold, orderSubtotal), deliv = sum(sold, function (o) { return o.deliveryFee; }), cogs = sum(sold, orderCost);
    var opex = sum(S.transactions.filter(function (t) { return monthKey(t.date) === mk && ['Ingredients', 'Packaging'].indexOf(t.category) < 0; }), function (t) { return t.amountOut; });
    var gp = rev - cogs;
    html += '<div class="grid g2"><div class="card"><div class="card-head"><h2>Profit &amp; loss (estimate)</h2><select data-filter="financeMonth" aria-label="Month">' + opts(months.map(function (k) { return { v: k, l: monthLabel(k) }; }), mk) + '</select></div>' +
      table(['', '#THB'], [
        ['Product sales (paid orders shipping this month)', thb(rev)],
        ['Delivery fees charged', thb(deliv)],
        ['− Ingredient &amp; packaging cost (from recipes)', '(' + thb(cogs) + ')'],
        ['<strong>Gross profit</strong>', '<strong>' + thb(gp + deliv) + '</strong>'],
        ['Gross margin on products', pct(rev ? gp / rev : NaN)],
        ['− Other spending this month (not ingredients / packaging)', '(' + thb(opex) + ')'],
        ['<strong>Operating result</strong>', '<strong>' + thb(gp + deliv - opex) + '</strong>']
      ].map(function (r) { return '<tr><td>' + r[0] + '</td><td class="num">' + r[1] + '</td></tr>'; })) +
      '<p class="small muted">Ingredient cost is estimated from recipes, so stock bought this month is not double counted. Delivery costs you pay go in Transactions.</p></div>';
    var cats = S.budget.map(function (b) { return { c: b.category, b: b.amount, s: spentBy(b.category) }; });
    html += '<div class="card"><div class="card-head"><h2>Spending by category</h2><a href="#budget" class="small">Budget →</a></div>' +
      table(['Category', '#Spent', '#Budget', ''], cats.map(function (x) {
        return '<tr><td>' + esc(x.c) + '</td><td class="num">' + thb(x.s) + '</td><td class="num">' + thb(x.b) + '</td><td style="width:30%">' + meter(x.s, x.b) + '</td></tr>';
      })) + '</div></div>';
    return html;
  } };
  VIEWS.transactions = { title: 'Transactions', render: function () {
    setActions('<button class="btn" data-act="export-tx">Export CSV</button><button class="btn primary" data-act="add" data-key="transactions">+ Transaction</button>');
    var f = UI.tx;
    var months = uniq(S.transactions.map(function (t) { return monthKey(t.date); })).sort().reverse();
    var list = S.transactions.filter(function (t) {
      return (!f.account || t.account === f.account) && (!f.cat || t.category === f.cat) && (!f.month || monthKey(t.date) === f.month);
    }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    var html = '<div class="card"><div class="filters">' +
      '<label>Account<select data-filter="tx.account">' + opts(S.settings.accounts.map(function (a) { return { v: a.id, l: a.name }; }), f.account, 'All') + '</select></label>' +
      '<label>Category<select data-filter="tx.cat">' + opts(allCategories(), f.cat, 'All') + '</select></label>' +
      '<label>Month<select data-filter="tx.month">' + opts(months.map(function (k) { return { v: k, l: monthLabel(k) }; }), f.month, 'All') + '</select></label></div>';
    html += table(['Date', 'Description', 'Category', 'Account', '#In', '#Out', ''], list.map(function (t) {
      return '<tr><td>' + esc(fmtDate(t.date, false)) + '</td><td>' + esc(t.description) + (t.orderId ? ' ' + chip('auto', 'info') : '') + '</td><td>' + esc(t.category) + '</td><td class="small">' + esc(accountName(t.account)) + '</td>' +
        '<td class="num">' + (n(t.amountIn) ? thb(t.amountIn, 2) : '') + '</td><td class="num">' + (n(t.amountOut) ? thb(t.amountOut, 2) : '') + '</td>' +
        '<td><button class="link-btn" data-act="edit" data-key="transactions" data-id="' + t.id + '">Edit</button></td></tr>';
    }), 'No transactions match.', list.length ? '<tr class="total"><td colspan="4">' + list.length + ' transactions</td><td class="num">' + thb(sum(list, function (t) { return t.amountIn; }), 2) + '</td><td class="num">' + thb(sum(list, function (t) { return t.amountOut; }), 2) + '</td><td></td></tr>' : '');
    return html + '<p class="small muted">Lines marked “auto” were written when an order was marked Paid. Change the order to change them.</p></div>';
  } };
  VIEWS.budget = { title: 'Budget vs actual', render: function () {
    setActions('<button class="btn primary" data-act="add" data-key="budget">+ Category</button>');
    var tb = sum(S.budget, function (b) { return b.amount; }), ts = 0;
    var rows = S.budget.map(function (b, i) {
      var s = spentBy(b.category); ts += s;
      return '<tr><td>' + esc(b.category) + '</td><td class="small muted">' + esc(b.note) + '</td><td class="num">' + thb(b.amount, 2) + '</td><td class="num">' + thb(s, 2) + '</td>' +
        '<td class="num">' + thb(b.amount - s, 2) + '</td><td class="num">' + pct(b.amount ? s / b.amount : 0) + '</td><td style="width:18%">' + meter(s, b.amount) + '</td>' +
        '<td><button class="link-btn" data-act="edit-budget" data-i="' + i + '">Edit</button></td></tr>';
    });
    return '<div class="card"><div class="card-head"><h2>First investment: ' + thb(tb) + '</h2><span class="sub">Actual = cash out in Transactions with that category</span></div>' +
      table(['Category', 'Note', '#Budget', '#Spent', '#Remaining', '#% used', '', ''], rows, 'No budget lines.',
        '<tr class="total"><td colspan="2">Total</td><td class="num">' + thb(tb, 2) + '</td><td class="num">' + thb(ts, 2) + '</td><td class="num">' + thb(tb - ts, 2) + '</td><td class="num">' + pct(tb ? ts / tb : 0) + '</td><td>' + meter(ts, tb) + '</td><td></td></tr>') + '</div>';
  } };

  /* Settings */
  VIEWS.setup = { title: 'Settings & backup', render: function () {
    setActions('');
    var st = S.settings;
    return '<div class="grid g2"><div class="card"><div class="card-head"><h2>Pre-order schedule</h2></div><form id="schedForm" class="grid">' +
      '<div class="field"><span>Ship days</span><div class="row">' + DAYS.map(function (d, i) {
        return '<label class="row small"><input type="checkbox" name="shipDay" value="' + i + '"' + (st.shipDays.indexOf(i) >= 0 ? ' checked' : '') + '>' + d + '</label>';
      }).join('') + '</div></div>' +
      '<div class="grid g2"><label class="field"><span>Cut-off time</span><input type="time" name="cutoffTime" value="' + esc(st.cutoffTime) + '"></label>' +
      '<label class="field"><span>Cut-off days before ship day</span><input type="number" min="0" name="cutoffDaysBefore" value="' + esc(st.cutoffDaysBefore) + '"></label>' +
      '<label class="field"><span>Courier pickup time</span><input type="time" name="shipTime" value="' + esc(st.shipTime) + '"></label>' +
      '<label class="field"><span>First ship date (launch)</span><input type="date" name="launchDate" value="' + esc(st.launchDate) + '"></label>' +
      '<label class="field"><span>Active batch override</span><input type="date" name="activeShipOverride" value="' + esc(st.activeShipOverride) + '"></label>' +
      '<label class="field"><span>Payments go to</span><select name="salesAccount">' + opts(st.accounts.map(function (a) { return { v: a.id, l: a.name }; }), st.salesAccount) + '</select></label></div>' +
      '<label class="field check"><input type="checkbox" name="countUnpaid"' + (st.countUnpaid ? ' checked' : '') + '><span>Reserve stock for unpaid orders too</span></label>' +
      '<label class="field check"><input type="checkbox" name="autoRecordPayments"' + (st.autoRecordPayments ? ' checked' : '') + '><span>Write a Sales transaction when an order is marked Paid</span></label>' +
      '<div class="grid g2">' + st.accounts.map(function (a, i) {
        return '<label class="field"><span>' + esc(a.name) + ' opening balance</span><input type="number" name="opening_' + i + '" value="' + esc(a.opening) + '"></label>';
      }).join('') + '</div>' +
      '<label class="field"><span>Team (comma separated)</span><input name="team" value="' + esc(st.team.join(', ')) + '"></label>' +
      '<label class="field"><span>Sales channels (comma separated)</span><input name="channels" value="' + esc(st.channels.join(', ')) + '"></label>' +
      '<label class="field"><span>Delivery methods (comma separated)</span><input name="deliveryMethods" value="' + esc(st.deliveryMethods.join(', ')) + '"></label>' +
      '<div><button class="btn primary" type="submit">Save settings</button></div></form></div>' +
      '<div class="card"><div class="card-head"><h2>Backup &amp; sharing</h2></div>' +
      '<p class="small">Everything is saved in <strong>this browser</strong> only. To move data to another device, or hand today’s numbers to a teammate, export a backup file and import it there. Importing replaces the data on that device.</p>' +
      '<div class="row"><button class="btn primary" data-act="export-json">Export backup (.json)</button><label class="btn">Import backup<input type="file" accept="application/json,.json" id="importFile" hidden></label></div>' +
      '<p class="small muted" style="margin-top:16px">Exports for spreadsheets:</p><div class="row"><button class="btn" data-act="export-orders">Orders CSV</button><button class="btn" data-act="export-tx">Transactions CSV</button><button class="btn" data-act="export-inv">Inventory CSV</button></div>' +
      '<p class="small muted" style="margin-top:16px">Start over from the data in the “Our Bakeshop!” Drive folder (20 Nov 2026). Export a backup first.</p>' +
      '<button class="btn danger" data-act="reset">Reset to Drive data</button>' +
      '<p class="small muted" style="margin-top:16px">Theme</p><div class="row"><button class="btn sm" data-act="theme" data-v="">Auto</button><button class="btn sm" data-act="theme" data-v="light">Light</button><button class="btn sm" data-act="theme" data-v="dark">Dark</button></div>' +
      '</div></div>';
  } };

  /* ---------- Render & routing ---------- */
  function route() { var r = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('?')[0]; if (r === 'settings') r = 'setup'; return VIEWS[r] ? r : 'dashboard'; }
  function render() {
    var r = route(), v = VIEWS[r];
    document.getElementById('pageTitle').textContent = v.title;
    document.title = v.title + ' · Jollies';
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('active', a.dataset.route === r); });
    var y = window.scrollY;
    document.getElementById('view').innerHTML = v.render();
    window.scrollTo(0, y);
    if (r === 'setup') bindSettings();
  }
  function bindSettings() {
    var f = document.getElementById('schedForm');
    f.onsubmit = function (e) {
      e.preventDefault();
      var st = S.settings, el = f.elements;
      st.shipDays = Array.prototype.filter.call(f.querySelectorAll('[name=shipDay]'), function (c) { return c.checked; }).map(function (c) { return +c.value; });
      st.cutoffTime = el.cutoffTime.value || '20:00'; st.cutoffDaysBefore = n(el.cutoffDaysBefore.value);
      st.shipTime = el.shipTime.value || '12:00'; st.launchDate = el.launchDate.value; st.activeShipOverride = el.activeShipOverride.value;
      st.salesAccount = el.salesAccount.value; st.countUnpaid = el.countUnpaid.checked; st.autoRecordPayments = el.autoRecordPayments.checked;
      st.accounts.forEach(function (a, i) { a.opening = n(el['opening_' + i].value); });
      ['team', 'channels', 'deliveryMethods'].forEach(function (k) { st[k] = el[k].value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); });
      save(); render(); toast('Settings saved');
    };
    document.getElementById('importFile').onchange = function (e) {
      var file = e.target.files[0]; if (!file) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var data = JSON.parse(rd.result);
          if (!data || !data.settings || !Array.isArray(data.orders)) throw new Error('Not a Jollies backup');
          openModal('Import backup', '<p class="field full">This replaces all data on this device with the backup from ' + esc(data.exportedAt ? data.exportedAt.slice(0, 16).replace('T', ' ') : 'the file') + ' (' + data.orders.length + ' orders, ' + (data.transactions || []).length + ' transactions).</p>',
            function () { S = withDefaults(data); toast('Backup imported'); }, { submit: 'Replace my data' });
        } catch (err) { toast('Could not import: ' + err.message); }
        e.target.value = '';
      };
      rd.readAsText(file);
    };
  }

  function setPath(path, value) {
    var parts = path.split('.'), o = UI;
    for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
  }
  var view = document.getElementById('view');
  function onFilter(e) {
    var t = e.target; if (!t.dataset || !t.dataset.filter) return false;
    setPath(t.dataset.filter, t.value);
    if (t.type === 'search') { var pos = t.selectionStart; render(); var s = view.querySelector('[data-filter="' + t.dataset.filter + '"]'); if (s) { s.focus(); s.setSelectionRange(pos, pos); } }
    else render();
    return true;
  }
  view.addEventListener('input', function (e) { if (e.target.type === 'search') onFilter(e); });
  view.addEventListener('change', function (e) {
    if (e.target.type === 'search') return;
    if (onFilter(e)) return;
    var t = e.target, act = t.dataset.act;
    if (act === 'set-pay' || act === 'set-prod') {
      var o = byId(S.orders, t.dataset.id); if (!o) return;
      if (act === 'set-pay') { if (t.value === 'Paid' && o.payment !== 'Paid') o.paidDate = todayISO(); o.payment = t.value; syncPayment(o); }
      else o.production = t.value;
      save(); render(); toast(o.id + ': ' + t.value);
    }
    if (act === 'toggle-task') { var k = byId(S.tasks, t.dataset.id); if (k) { k.done = t.checked; save(); render(); } }
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.tagName === 'SELECT' || t.type === 'checkbox') return;
    var act = t.dataset.act, id = t.dataset.id;
    switch (act) {
      case 'new-order': orderForm(null); break;
      case 'edit-order': orderForm(byId(S.orders, id)); break;
      case 'new-product': productForm(null); break;
      case 'edit-product': productForm(product(id)); break;
      case 'add': crudForm(t.dataset.key, null, LABELS[t.dataset.key]); break;
      case 'edit': crudForm(t.dataset.key, byId(S[t.dataset.key], id), LABELS[t.dataset.key]); break;
      case 'edit-task': crudForm('tasks', byId(S.tasks, id), 'task'); break;
      case 'edit-budget': crudForm('budget', S.budget[+t.dataset.i], 'budget line'); break;
      case 'edit-targets': targetsForm(); break;
      case 'bulk-prod':
        var changed = 0;
        S.orders.forEach(function (o) {
          if (shipDate(o) === t.dataset.ship && o.production === t.dataset.from && !isVoid(o) && (t.dataset.from !== 'Pending' || o.payment === 'Paid')) { o.production = t.dataset.to; changed++; }
        });
        save(); render(); toast(changed + ' order' + (changed === 1 ? '' : 's') + ' marked ' + t.dataset.to); break;
      case 'range':
        var days = +t.dataset.days; UI.mkt.to = days ? todayISO() : ''; UI.mkt.from = days ? toISO(addDays(new Date(), -(days - 1))) : ''; render(); break;
      case 'export-json':
        download('jollies-backup-' + todayISO() + '.json', JSON.stringify(Object.assign({ exportedAt: new Date().toISOString() }, S), null, 2), 'application/json'); break;
      case 'export-orders':
        download('jollies-orders-' + todayISO() + '.csv', csv([['Order ID', 'Order date', 'Customer', 'Contact', 'Channel', 'Items', 'Subtotal', 'Delivery method', 'Delivery fee', 'Total', 'Ship date', 'Payment', 'Production', 'Tracking', 'Address', 'Notes']].concat(
          S.orders.map(function (o) { return [o.id, o.createdAt.replace('T', ' '), o.customer, o.contact, o.channel, orderItemsText(o), orderSubtotal(o), o.deliveryMethod, o.deliveryFee, orderTotal(o), shipDate(o), o.payment, o.production, o.tracking, o.address, o.notes]; }))), 'text/csv'); break;
      case 'export-tx':
        download('jollies-transactions-' + todayISO() + '.csv', csv([['Date', 'Account', 'Description', 'Category', 'Cash in', 'Cash out', 'Order']].concat(
          S.transactions.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).map(function (x) { return [x.date, accountName(x.account), x.description, x.category, x.amountIn || '', x.amountOut || '', x.orderId]; }))), 'text/csv'); break;
      case 'export-inv':
        download('jollies-inventory-' + todayISO() + '.csv', csv([['Item', 'Unit', 'Supplier', 'Pack size', 'Pack price', 'On hand', 'Needed', 'Left after', 'Reorder point', 'Status']].concat(
          inventoryView().map(function (r) { return [r.it.name, r.it.unit, r.it.supplier, r.it.packSize, r.it.packPrice, r.onHand.toFixed(2), r.need.toFixed(2), r.left.toFixed(2), r.it.reorderPoint, r.status]; }))), 'text/csv'); break;
      case 'reset':
        if (!t.dataset.armed) { t.dataset.armed = '1'; t.textContent = 'Click again: this erases orders, logs and edits'; break; }
        S = clone(window.JOLLIES_SEED); save(); render(); toast('Reset to Drive data');
        break;
      case 'theme':
        try { if (t.dataset.v) localStorage.setItem('jollies-theme', t.dataset.v); else localStorage.removeItem('jollies-theme'); } catch (err) { /* ignore */ }
        applyTheme(); break;
    }
  });
  var LABELS = { inventory: 'inventory item', stockLog: 'stock movement', transactions: 'transaction', ads: 'ad day', posts: 'post', tasks: 'task', budget: 'budget line' };
  function targetsForm() {
    var T = S.targets;
    var F = [
      { k: 'grossMargin', l: 'Gross margin (%)', t: 'number', hint: 'menu blended ' + pct(blendedMargin(), 1) },
      { k: 'targetRoas', l: 'Target ROAS', t: 'number' }, { k: 'ctr', l: 'Target CTR (%)', t: 'number' },
      { k: 'engagement', l: 'Target engagement rate (%)', t: 'number' }, { k: 'watchBand', l: 'Watch band (%)', t: 'number' }];
    var vals = { grossMargin: +(T.grossMargin * 100).toFixed(2), targetRoas: T.targetRoas, ctr: +(T.ctr * 100).toFixed(2), engagement: +(T.engagement * 100).toFixed(2), watchBand: +(T.watchBand * 100).toFixed(2) };
    openModal('Marketing targets', F.map(function (f) { return fieldHTML(f, vals[f.k]); }).join(''), function () {
      var v = readFields(F);
      S.targets = { grossMargin: n(v.grossMargin) / 100, targetRoas: n(v.targetRoas), ctr: n(v.ctr) / 100, engagement: n(v.engagement) / 100, watchBand: n(v.watchBand) / 100 };
    });
  }
  function applyTheme() {
    var v = ''; try { v = localStorage.getItem('jollies-theme') || ''; } catch (e) { /* ignore */ }
    if (v) document.documentElement.setAttribute('data-theme', v); else document.documentElement.removeAttribute('data-theme');
  }

  var sidebar = document.getElementById('sidebar');
  document.getElementById('menuToggle').onclick = function () { sidebar.classList.toggle('open'); };
  window.addEventListener('hashchange', function () { sidebar.classList.remove('open'); window.scrollTo(0, 0); render(); });
  // Keep the countdown fresh.
  setInterval(function () { if (route() === 'dashboard' && !modal.open) render(); }, 60000);
  applyTheme();
  render();
})();
