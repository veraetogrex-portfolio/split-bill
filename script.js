// Split the Bill — github.com/veraetogrex-portfolio · zero dependencies
// Drag a person onto a receipt line: the line's bar splits between everyone on it,
// and each person's total recounts. When every line has an owner, totals become Pay buttons.

const root    = document.querySelector('#bill');
const caption = root.querySelector('.sb-caption');
const parts   = root.querySelector('.sb-parts');
const restBtn = root.querySelector('.sb-rest');
const PEOPLE  = ['ana', 'max', 'kai'];
const PRICES  = [32, 9, 18, 15, 12];
const START   = [['ana'], [], [], [], []];               // Ana already took the ramen

const lines = [...root.querySelectorAll('.sb-line')].map((el, i) => ({
  el, price: PRICES[i], bar: el.querySelector('.sb-bar'),
  segs: Object.fromEntries([...el.querySelectorAll('.sb-bar i')].map(s => [s.dataset.p, s])),
}));
const people = Object.fromEntries([...root.querySelectorAll('.sb-person')].map(el => [el.dataset.p, {
  el, sum: el.querySelector('.sb-sum'), ava: el.querySelector('.sb-ava'), shown: 0,
}]));

let owners, drag = null;

function reset() {
  owners = START.map(o => [...o]);
  root.classList.remove('is-settled'); restBtn.disabled = false;
  caption.textContent = 'Drag a friend onto what they had.';
  render(true);
}

// each line is shared evenly between its owners
function totals() {
  const t = Object.fromEntries(PEOPLE.map(p => [p, 0]));
  owners.forEach((o, i) => o.forEach(p => { t[p] += PRICES[i] / o.length; }));
  return t;
}

function render(instant) {
  lines.forEach((l, i) => {
    PEOPLE.forEach(p => l.segs[p].classList.toggle('is-on', owners[i].includes(p)));
    l.bar.classList.toggle('is-owned', owners[i].length > 0);
  });
  const t = totals();
  PEOPLE.forEach(p => count(people[p], t[p], instant));
  if (owners.every(o => o.length)) settle();
}

function count(person, to, instant) {
  const from = person.shown, t0 = performance.now(), ms = instant ? 0 : 520;
  person.shown = to;
  const tick = now => {
    const p = ms ? Math.min(1, (now - t0) / ms) : 1, e = 1 - Math.pow(1 - p, 3), v = from + (to - from) * e;
    person.sum.textContent = Number.isInteger(to) || p < 1 ? Math.round(v) : v.toFixed(2);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function assign(i, p) {
  if (owners[i].includes(p)) return;
  owners[i].push(p); render();
}

function splitRest() {
  restBtn.disabled = true;
  owners.forEach((o, i) => { if (!o.length) setTimeout(() => { owners[i] = [...PEOPLE]; render(); }, 130 * i); });
}

function settle() {
  if (root.classList.contains('is-settled')) return;
  setTimeout(() => {
    const t = totals();
    parts.innerHTML = PEOPLE.map(p => `<span style="color:var(--${p})">${Math.round(t[p])}</span>`).join(' · ');
    root.classList.add('is-settled');
    PEOPLE.forEach((p, k) => setTimeout(() => coins(people[p]), 120 * k));
  }, 520);
}

function coins(person) {
  const r = person.el.querySelector('.sb-owe'), host = person.el;
  for (let k = 0; k < 9; k++) {
    const c = document.createElement('i'); c.className = 'sb-coin';
    const a = -Math.PI / 2 + (Math.random() - .5) * 2.2, d = 40 + Math.random() * 50;
    c.style.left = r.offsetLeft + r.offsetWidth / 2 - 8 + 'px'; c.style.top = r.offsetTop + 20 + 'px';
    c.style.setProperty('--dx', Math.cos(a) * d * 1.6 + 'px'); c.style.setProperty('--dy', Math.sin(a) * d + 'px');
    host.style.position = 'relative'; host.appendChild(c); setTimeout(() => c.remove(), 950);
  }
}

// ── dragging a person ─────────────────────────────────
function local(e) { const r = root.getBoundingClientRect(), k = r.width / root.offsetWidth; return [(e.clientX - r.left) / k, (e.clientY - r.top) / k]; }
function lineAt(e) {
  const hit = document.elementsFromPoint(e.clientX, e.clientY).find(el => el.closest && el.closest('.sb-line'));
  return hit ? lines.findIndex(l => l.el === hit.closest('.sb-line')) : -1;
}
function grab(e, p) {
  const g = document.createElement('div'); g.className = 'sb-ghost'; g.textContent = p[0].toUpperCase(); g.style.setProperty('--c', `var(--${p})`);
  root.appendChild(g); drag = { p, g, over: -1 };
  place(e);
  addEventListener('pointermove', place); addEventListener('pointerup', release, { once: true });
}
function place(e) {
  if (!drag) return;
  const [x, y] = local(e); drag.g.style.left = x + 'px'; drag.g.style.top = y + 'px';
  const i = lineAt(e);
  if (i !== drag.over) {
    lines.forEach(l => l.el.classList.remove('is-target'));
    if (i >= 0) { lines[i].el.classList.add('is-target'); lines[i].el.style.setProperty('--hl', `var(--${drag.p})`); }
    drag.over = i;
  }
}
function release(e) {
  removeEventListener('pointermove', place);
  if (!drag) return;
  const i = lineAt(e); lines.forEach(l => l.el.classList.remove('is-target'));
  drag.g.remove();
  if (i >= 0) assign(i, drag.p);
  drag = null;
}

PEOPLE.forEach(p => people[p].ava.addEventListener('pointerdown', e => grab(e, p)));
restBtn.addEventListener('click', splitRest);

reset();
root.bill = { reset, ava: p => people[p].ava, line: i => lines[i].el, rest: restBtn };   // for scripted demos
