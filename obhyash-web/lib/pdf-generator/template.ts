import { QuestionItem, GeneratorSettings } from './types';
import katex from 'katex';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const toBnNumber = (n: number | string): string =>
  String(n).replace(/\d/g, d => BN_DIGITS[parseInt(d, 10)]);

const LET_INV: Record<string, string> = {
  'ক': 'a',
  'খ': 'b',
  'গ': 'c',
  'ঘ': 'd',
  'a': 'a',
  'b': 'b',
  'c': 'c',
  'd': 'd',
};

const LET: Record<string, string> = {
  'a': 'ক',
  'b': 'খ',
  'c': 'গ',
  'd': 'ঘ',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const DOL = '\ue000';

function renderKatex(mathStr: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(mathStr.trim(), {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      output: 'htmlAndMathml',
    });
  } catch {
    return escapeHtml(mathStr);
  }
}

function normalizeMathText(text: string): string {
  if (!text) return '';
  let res = text;

  // 1. Normalize bracket delimiters \[ ... \] and \( ... \)
  res = res.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
  res = res.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // 2. Fix over-escaped double backslashes in common LaTeX commands
  res = res.replace(
    /\\\\(frac|sqrt|text|mathrm|mathbf|vec|hat|bar|times|cdot|pm|to|rightarrow|leftarrow|theta|alpha|beta|gamma|delta|epsilon|omega|pi|phi|tau|lambda|mu|sigma|infty|approx|ne|leq|geq|circ|degree|sum|int|partial|sin|cos|tan|log|ln)\b/g,
    '\\$1'
  );

  // 3. Auto-wrap unwrapped standalone math expressions (like \frac{...}{...}, \sqrt{...}, or bare \cos\theta, \theta, \alpha)
  res = res.replace(/(^|[^\$])(\\(?:frac|sqrt|vec|hat|bar)\{[^}]+\}(?:\{[^}]+\})?)(?!\$)/g, '$1$$$2$$');
  res = res.replace(/(^|[^\$])(\\(?:theta|alpha|beta|gamma|delta|epsilon|omega|pi|phi|tau|lambda|mu|sigma|infty|approx|pm|times|circ)\b)(?!\$)/g, '$1$$$2$$');

  // 4. Wrap common Bengali math formulas where θ is used with cos/sin/tan
  res = res.replace(/(^|[^\$])(\b(?:cos|sin|tan)\s*(?:\\?theta|θ|\d+|x|y)\b)(?!\$)/gi, (_m, prefix, formula) => {
    const cleanFormula = formula.replace(/θ/g, '\\theta').replace(/\s+/g, ' ');
    const finalCmd = cleanFormula.startsWith('\\') ? cleanFormula : `\\${cleanFormula}`;
    return `${prefix}$${finalCmd}$`;
  });

  return res;
}

function inlineMath(s: string): string {
  if (!s) return '';
  const normalized = normalizeMathText(s).replace(/\\\$/g, DOL);
  const parts = normalized.split(/(\${1,2}[^\$]+\${1,2})/g);
  let out = '';
  for (const p of parts) {
    if (p.startsWith('$$') && p.endsWith('$$') && p.length > 4) {
      out += displayMath(p.slice(2, -2));
    } else if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
      const t = p.slice(1, -1);
      const isBig = isBigMath(t);
      if (isBig) {
        out += displayMath(t);
      } else {
        const w = t.length >= 40 ? ' wrapm' : '';
        const rendered = renderKatex(t, false);
        out += `<span class="m${w}">${rendered}</span>`;
      }
    } else {
      out += escapeHtml(p).replace(new RegExp(DOL, 'g'), '<span class="dl"></span>');
    }
  }
  out = out.replace(/\((<span class="m[^>]*>[\s\S]*?<\/span>)\)/g, '<span class="nw">($1)</span>');
  return out;
}

function displayMath(t: string): string {
  const rendered = renderKatex(t, true);
  return `<div class="dm m">${rendered}</div>`;
}

function sentences(line: string): string[] {
  const res: string[] = [];
  let buf = '';
  let inm = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    buf += ch;
    if (ch === '$') inm = !inm;
    else if (ch === '।' && !inm) {
      res.push(buf);
      buf = '';
    }
  }
  if (buf.trim()) res.push(buf);
  return res;
}

function isBigMath(t: string): boolean {
  return t.length >= 40 || (t.length >= 24 && (t.includes('=') || t.includes('\\rightarrow') || t.includes('→')));
}

function lineItems(line: string): Array<{ type: 't' | 'd'; html: string }> {
  const items: Array<{ type: 't' | 'd'; html: string }> = [];
  const normalized = normalizeMathText(line);
  for (const sent of sentences(normalized)) {
    const parts = sent.split(/(\${1,2}[^\$]+\${1,2})/g);
    let acc = '';
    const flush = () => {
      if (acc.trim()) items.push({ type: 't', html: inlineMath(acc.trim()) });
      acc = '';
    };
    for (const p of parts) {
      if (p.startsWith('$$') && p.endsWith('$$') && p.length > 4) {
        flush();
        items.push({ type: 'd', html: displayMath(p.slice(2, -2)) });
      } else if (p.startsWith('$') && p.endsWith('$') && p.length > 2 && isBigMath(p.slice(1, -1))) {
        flush();
        items.push({ type: 'd', html: displayMath(p.slice(1, -1)) });
      } else {
        acc += p;
      }
    }
    flush();
  }
  return items;
}

function blk(
  items: Array<{ type: 't' | 'd'; html: string }>,
  firstLabel?: string | null
): { out: string; remainingLabel: string | null } {
  let out = '';
  let curLabel = firstLabel || null;
  items.forEach((it, k) => {
    if (it.type === 't') {
      let h = it.html;
      if (curLabel && k === 0) {
        h = curLabel + h;
        curLabel = null;
      }
      out += `<div class="ln">${h}</div>`;
    } else {
      out += it.html;
    }
  });
  return { out, remainingLabel: curLabel };
}

const LAB = '<span class="lab">ব্যাখ্যা:</span> ';

function explHtml(E: string[]): string {
  const lines = E.filter(l => l.trim().length > 0);
  if (!lines.length) return '';
  let note: string | null = null;
  const lastLine = lines[lines.length - 1];
  const m = lastLine.match(/\s*\((সূত্র:[^)]*)\)\s*$/);
  if (m) {
    note = m[1];
    lines[lines.length - 1] = lastLine.slice(0, m.index);
  }
  let out = '';
  let lab: string | null = LAB;
  for (const l of lines) {
    if (l.startsWith('- ')) {
      const it = lineItems(l.slice(2));
      const res = blk(it);
      out += `<div class="bl"><span class="mk"></span><div class="bc">${res.out}</div></div>`;
    } else {
      const it = lineItems(l);
      if (!it.length) continue;
      const res = blk(it, lab);
      out += res.out;
      lab = res.remainingLabel;
    }
  }
  if (lab) out = `<div class="ln">${LAB.trim()}</div>` + out;
  if (note) out += `<div class="note">${escapeHtml(note)}</div>`;
  return out;
}

const CHK_SVG = `<svg class="ck" viewBox="0 0 20 20"><path d="M3.5 10.5l4.2 4.2L16.5 5.5" fill="none" stroke="#2e9e57" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function renderCardHtml(q: QuestionItem): string {
  const rawAns = q.A?.trim() || '';
  const ansKey = LET_INV[rawAns] || rawAns;
  let opts = '';
  for (const k of ['a', 'b', 'c', 'd']) {
    const raw = q.o[k] || '';
    const plain = raw.replace(/\$/g, '');
    const isOk = rawAns ? k === ansKey : false;
    const cls = 'op' + (plain.length > 26 ? ' smo' : '') + (isOk ? ' ok' : '');
    opts += `<div class="${cls}"><b>${LET[k]}.</b> ${inlineMath(raw)}${isOk ? CHK_SVG : ''}</div>`;
  }
  const ex = explHtml(q.E);
  const imgHtml = q.img ? `<div class="q-img" style="text-align:center;margin:6px 0;"><img src="${escapeHtml(q.img)}" style="max-height:130px;max-width:96%;object-fit:contain;border-radius:4px;" /></div>` : '';
  return `<div class="card"><div class="qb"><span class="bd">${toBnNumber(q.n)}</span><span class="qt">${inlineMath(q.q)}</span></div>${imgHtml}<div class="opts">${opts}</div>${ex ? `<div class="ex">${ex}</div>` : ''}</div>`;
}

const DENSITY_CONFIGS = {
  balanced: {
    qbFontSize: '14.2px',
    qbPadding: '7px 11px',
    qbLineHeight: '1.4',
    bdFontSize: '13px',
    bdPadding: '0 8px',
    bdLineHeight: '20px',
    optsGap: '6px',
    optsMargin: '6px 0',
    opFontSize: '13.4px',
    opPadding: '5px 8px',
    opMinHeight: '28px',
    opLineHeight: '1.35',
    exFontSize: '12.6px',
    exPadding: '7px 10px',
    exLineHeight: '1.42',
    cardGap: 10,
  },
  compact: {
    qbFontSize: '13.5px',
    qbPadding: '6px 9px',
    qbLineHeight: '1.38',
    bdFontSize: '12.5px',
    bdPadding: '0 7px',
    bdLineHeight: '19px',
    optsGap: '5px',
    optsMargin: '5px 0',
    opFontSize: '12.6px',
    opPadding: '4px 7px',
    opMinHeight: '26px',
    opLineHeight: '1.3',
    exFontSize: '12.0px',
    exPadding: '6px 9px',
    exLineHeight: '1.38',
    cardGap: 8,
  },
  spacious: {
    qbFontSize: '15.5px',
    qbPadding: '11px 12px 11px 14px',
    qbLineHeight: '1.5',
    bdFontSize: '14px',
    bdPadding: '0 9px',
    bdLineHeight: '22px',
    optsGap: '8px',
    optsMargin: '8px 0',
    opFontSize: '14.5px',
    opPadding: '7px 10px',
    opMinHeight: '34px',
    opLineHeight: '1.4',
    exFontSize: '13.6px',
    exPadding: '9px 12px',
    exLineHeight: '1.5',
    cardGap: 14,
  },
};

export function generateTemplateHtml(
  questions: QuestionItem[],
  settings: GeneratorSettings
): string {
  const density = settings.density || 'balanced';
  const dc = DENSITY_CONFIGS[density] || DENSITY_CONFIGS.balanced;
  const cardsJson = JSON.stringify(questions.map(renderCardHtml));

  const baseUrlTag = settings.baseUrl
    ? `<base href="${escapeHtml(settings.baseUrl)}/">`
    : '';

  const toolbarHtml = settings.standaloneToolbar
    ? `<div class="no-print" style="position: sticky; top: 0; z-index: 99999; background: #0f4c5c; color: #ffffff; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 14px rgba(0,0,0,0.18); font-family: 'Kalpurush', 'Times New Roman', sans-serif;">
  <div style="display: flex; align-items: center; gap: 12px;">
    <span style="font-weight: bold; font-size: 16px; letter-spacing: 0.3px;">অভ্যাস — A4 সল্যুশন শিট</span>
    <span style="background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;">ভেক্টর PDF</span>
  </div>
  <div style="display: flex; align-items: center; gap: 14px;">
    <span style="font-size: 13px; opacity: 0.85;">কীবোর্ড: Ctrl+P বা ⌘+P</span>
    <button onclick="window.print()" style="background: #2e9e57; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
      🖨️ প্রিন্ট / Save as PDF
    </button>
  </div>
</div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(settings.title)}</title>
${baseUrlTag}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css" crossorigin="anonymous">
<style>
@font-face {
  font-family: 'Kalpurush';
  src: url('/fonts/Kalpurush.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@page {
  size: 210mm 297mm;
  margin: 0;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; }
body {
  font-family: 'Times New Roman', 'Liberation Serif', 'Kalpurush', 'SolaimanLipi', 'Kohinoor Bangla', 'FreeSans', serif;
  color: #1c2b33;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page {
  position: relative;
  width: 794px;
  height: 1122px;
  overflow: hidden;
  background: #fff;
  break-after: page;
  page-break-after: always;
}
.page:last-child {
  break-after: auto;
  page-break-after: auto;
}

/* Page 1 Hero Header */
.hdr {
  position: absolute;
  left: 40px;
  top: 40px;
  width: 714px;
  height: 128px;
  border-radius: 28px;
  background: #244f5d;
  overflow: hidden;
  color: #fff;
  text-align: center;
  z-index: 2;
}
.hdr .t {
  font-size: 42px;
  font-weight: bold;
  margin-top: 14px;
  line-height: 1.25;
}
.hdr .s {
  font-size: 16.5px;
  margin-top: 6px;
  opacity: 0.95;
}
.hdr .bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 24px;
  background: #c64040;
}

/* Page 2+ Mini Header Strip */
.rh {
  position: absolute;
  left: 40px;
  right: 40px;
  top: 34px;
  height: 30px;
  border-bottom: 1px solid #d5dadd;
  z-index: 2;
}
.rh a {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #0f4c5c;
  text-decoration: none;
  font-size: 15px;
  font-weight: bold;
  white-space: nowrap;
}
.rh a svg { width: 22px; height: 22px; }
.rh .nm {
  position: absolute;
  right: 0;
  top: 3px;
  color: #0f4c5c;
  font-size: 15px;
  font-weight: bold;
  white-space: nowrap;
}

/* Columns */
.col {
  position: absolute;
  width: 344px;
  z-index: 1;
}
.card {
  width: 344px;
  margin-bottom: 0;
}
.col .card + .card {
  margin-top: ${dc.cardGap}px;
}

/* Question Box */
.qb {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #e6f1f1;
  border-left: 5px solid #0f4c5c;
  border-radius: 12px;
  padding: ${dc.qbPadding};
  font-weight: bold;
  font-size: ${dc.qbFontSize};
  line-height: ${dc.qbLineHeight};
}
.bd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: ${dc.bdPadding};
  background: #d62839;
  color: #fff;
  border-radius: 999px;
  font-size: ${dc.bdFontSize};
  line-height: 1;
  font-weight: bold;
  flex-shrink: 0;
  margin-top: 1px;
}
.qt {
  flex: 1;
  min-width: 0;
}

/* Options */
.opts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${dc.optsGap};
  margin: ${dc.optsMargin};
}
.op {
  position: relative;
  background: #fff;
  border: 1.5px solid #c9cfd3;
  border-radius: 9px;
  padding: ${dc.opPadding};
  font-size: ${dc.opFontSize};
  line-height: ${dc.opLineHeight};
  min-height: ${dc.opMinHeight};
  display: block;
}
.op b { margin-right: 5px; }
.op.smo { font-size: calc(${dc.opFontSize} - 1px); }
.op.ok {
  border-color: #2e9e57;
  background: #e8f6ec;
  padding-right: 24px;
}
.ck {
  position: absolute;
  right: 7px;
  top: 50%;
  margin-top: -8px;
  width: 15px;
  height: 15px;
}

/* Explanation */
.ex {
  background: #fdf0ec;
  border-radius: 12px;
  padding: ${dc.exPadding};
  font-size: ${dc.exFontSize};
  line-height: ${dc.exLineHeight};
}
.ln { margin: 2px 0; }
.lab { color: #d62839; font-weight: bold; }
.bl { display: flex; gap: 6px; margin: 3px 0; }
.mk {
  flex: none;
  margin-top: 5px;
  width: 0;
  height: 0;
  border-left: 6px solid #d62839;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
}
.bc { flex: 1; min-width: 0; }
.note { font-style: italic; color: #555; margin-top: 3px; }
.dm { text-align: left; margin: 2px 0 2px 6px; }

/* KaTeX typography */
.katex { white-space: nowrap; font-size: 1.05em; }
.wrapm .katex, .wrapm.katex { white-space: normal; }
.dm .katex-display { margin: 0; }
.dm .katex-display > .katex { text-align: left; }
.nw { white-space: nowrap; }
.dl::before { content: "$"; }

/* Footer */
.foot {
  position: absolute;
  left: 40px;
  right: 40px;
  top: 1063px;
  border-top: 1px solid #d5dadd;
  height: 46px;
}
.foot a {
  position: absolute;
  left: 0;
  top: 9px;
  color: #0f4c5c;
  text-decoration: none;
  font-size: 16px;
  white-space: nowrap;
  display: flex;
  align-items: center;
}
.foot .site {
  font-family: 'Times New Roman', 'Liberation Serif', serif;
  font-weight: bold;
  font-size: 17px;
  margin: 0 5px;
}
.pg {
  position: absolute;
  right: 0;
  top: 9px;
  font-size: 16px;
  color: #0f4c5c;
}
.pg i { font-style: normal; margin-left: 5px; }

#measure {
  position: absolute;
  left: -9999px;
  top: 0;
  width: 344px;
  visibility: hidden;
}
#measure .card { margin-bottom: 0; }

@media print {
  .no-print { display: none !important; }
  #measure { display: none !important; }
  body { background: #fff !important; }
}
</style>
</head>
<body>
${toolbarHtml}
<div id="measure"></div>
<div id="root"></div>

<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script>
const CARDS = ${cardsJson};
const SETTINGS = ${JSON.stringify(settings)};
const BN = s => String(s).replace(/\\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);

function renderMath(root) {
  root.querySelectorAll('.m[data-t]').forEach(el => {
    try {
      if (window.katex && el.dataset.t) {
        katex.render(el.dataset.t, el, {
          displayMode: !!el.dataset.d,
          throwOnError: false,
          strict: 'ignore',
          output: 'html'
        });
      }
    } catch(e) {
      if (el.dataset.t) el.textContent = el.dataset.t;
    }
  });
}

const M = document.getElementById('measure');
CARDS.forEach(h => {
  const d = document.createElement('div');
  d.innerHTML = h;
  M.appendChild(d.firstChild);
});

renderMath(M);

window.READY = false;

// Dynamic Programming Pagination
const GAP = ${dc.cardGap};
const U_FULL = 1123 - 40 - 72; // = 1011

function paginate(h, hdr) {
  const n = h.length;
  const INF = [1e9, 0, 0];
  const pre = [0];
  for (const x of h) pre.push(pre[pre.length - 1] + x);
  const hh = (i, j) => (j > i ? pre[j] - pre[i] + GAP * (j - i - 1) : 0);

  const best = Array.from({ length: n + 1 }, () => [...INF]);
  best[0] = [0, 0, 0];
  const bp = Array(n + 1).fill(null);

  for (let i = 0; i < n; i++) {
    if (best[i][0] === 1e9) continue;
    const p = best[i][0];
    const U = U_FULL - (p === 0 && hdr ? 156 : 44);
    let a = 1;
    while (i + a <= n && hh(i, i + a) <= U) {
      let b = 0;
      while (i + a + b <= n && (b === 0 || hh(i + a, i + a + b) <= U)) {
        const j = i + a + b;
        // Prioritize: 1) minimum pages, 2) maximum cards packed on this page, 3) column balance
        const cand = [
          p + 1,
          best[i][1] - (a + b),
          best[i][2] + Math.abs(hh(i, i + a) - hh(i + a, j))
        ];
        if (
          cand[0] < best[j][0] ||
          (cand[0] === best[j][0] && cand[1] < best[j][1]) ||
          (cand[0] === best[j][0] && cand[1] === best[j][1] && cand[2] < best[j][2])
        ) {
          best[j] = cand;
          bp[j] = [i, a, b];
        }
        b++;
      }
      a++;
    }
  }

  const plan = [];
  let j = n;
  while (j > 0) {
    const entry = bp[j];
    if (!entry) break;
    const [i, a, b] = entry;
    plan.push([
      Array.from({ length: a }, (_, idx) => i + idx),
      Array.from({ length: b }, (_, idx) => i + a + idx)
    ]);
    j = i;
  }
  return plan.reverse();
}

window.build = function(plan, off, hdr) {
  const root = document.getElementById('root');
  root.innerHTML = '';
  
  plan.forEach((pl, k) => {
    const p = document.createElement('div');
    p.className = 'page';
    let top = 40;
    
    if (hdr && k === 0) {
      top = 196;
      p.innerHTML = \`<div class="hdr">
        <div class="t">\${SETTINGS.title}</div>
        <div class="s">\${SETTINGS.subtitle}</div>
        <div class="bar"></div>
      </div>\`;
    } else {
      top = 80;
      const leftIconSvg = SETTINGS.showHeaderLeftIcon !== false 
        ? '<svg viewBox="0 0 24 24"><path d="M3.6 1.6c-.3.3-.5.8-.5 1.4v18c0 .6.2 1.1.5 1.4l.1.1L13.8 12.4v-.2L3.7 1.5z" fill="#00a0ff"/><path d="M17.2 15.8l-3.4-3.4v-.2l3.4-3.4.1.1 4 2.3c1.1.6 1.1 1.7 0 2.3l-4 2.2z" fill="#ffc400"/><path d="M17.3 15.7L13.8 12.3 3.6 22.4c.4.4 1 .4 1.7.1z" fill="#f43249"/><path d="M17.3 8.9L5.3 2.1c-.7-.4-1.3-.3-1.7.1l10.2 10.1z" fill="#00e676"/></svg>'
        : '';
      const leftTagOpen = SETTINGS.headerLeftUrl 
        ? ('<a href="' + SETTINGS.headerLeftUrl + '">') 
        : '<div style="position:absolute;left:0;top:0;display:flex;align-items:center;gap:7px;color:#0f4c5c;font-size:15px;font-weight:bold;">';
      const leftTagClose = SETTINGS.headerLeftUrl ? '</a>' : '</div>';
      const rightText = SETTINGS.headerRightText || SETTINGS.title;
      const leftText = SETTINGS.headerLeftText || 'অ্যাপ ইনস্টল করো';

      p.innerHTML = \`<div class="rh">
        \${leftTagOpen}
          \${leftIconSvg}
          <span>\${leftText}</span>
        \${leftTagClose}
        <div class="nm">\${rightText}</div>
      </div>\`;
    }

    const U_AVAIL = U_FULL - (k === 0 && hdr ? 156 : 44);

    [[pl[0], 40], [pl[1], 410]].forEach(([ids, x]) => {
      const c = document.createElement('div');
      c.className = 'col';
      c.style.left = x + 'px';
      c.style.top = top + 'px';

      // Smart vertical gap distribution if extra space exists
      if (SETTINGS.balanceColumns !== false && ids.length > 1) {
        const colCardsHeight = ids.reduce((sum, i) => sum + (window.heights ? window.heights[i] : 0), 0);
        const remainingSpace = U_AVAIL - colCardsHeight;
        if (remainingSpace > 0 && remainingSpace < 220) {
          const distributedGap = Math.min(26, Math.max(GAP, Math.floor(remainingSpace / (ids.length - 1))));
          c.style.display = 'flex';
          c.style.flexDirection = 'column';
          c.style.gap = distributedGap + 'px';
        }
      }

      ids.forEach(i => c.appendChild(M.children[i].cloneNode(true)));
      p.appendChild(c);
    });

    const f = document.createElement('div');
    f.className = 'foot';
    const footerUrl = SETTINGS.footerLeftUrl || 'https://www.obhyash.com';
    const footerPrefix = SETTINGS.footerLeftPrefix || 'আনলিমিটেড এক্সাম দাও';
    const siteText = SETTINGS.footerSiteText || 'www.obhyash.com';
    const footerSuffix = SETTINGS.footerLeftSuffix || 'এ';
    const pagePrefix = SETTINGS.footerPagePrefix || 'পৃষ্ঠা';
    const pageNumStr = SETTINGS.useBanglaDigits !== false ? BN(off + k + 1) : String(off + k + 1);

    f.innerHTML = \`<a href="\${footerUrl}">\${footerPrefix} <span class="site">\${siteText}</span> \${footerSuffix}</a><div class="pg">\${pagePrefix} <i>\${pageNumStr}</i></div>\`;
    p.appendChild(f);
    root.appendChild(p);
  });
};

window.overflow = function() {
  const bad = [];
  document.querySelectorAll('#root .card').forEach(c => {
    const r = c.getBoundingClientRect();
    const q = c.querySelector('.bd') ? c.querySelector('.bd').textContent : '';
    c.querySelectorAll('.katex').forEach(k => {
      const kr = k.getBoundingClientRect();
      if (kr.right > r.right - 6) {
        bad.push([q, Math.round(kr.right - r.right)]);
      }
    });
  });
  return bad;
};

// Initialize after font ready
document.fonts.ready.then(() => {
  setTimeout(() => {
    window.heights = [...M.children].map(c => c.getBoundingClientRect().height);
    const plan = paginate(window.heights, SETTINGS.hasHeader);
    window.build(plan, SETTINGS.pageOffset, SETTINGS.hasHeader);
    window.READY = true;

    if (SETTINGS.autoPrint) {
      setTimeout(() => {
        try {
          window.focus();
          window.print();
        } catch(e) {}
      }, 500);
    }
    
    // Post message to parent iframe if embedded
    if (window.parent && window.parent !== window) {
      const tot = window.heights.reduce((a, b) => a + b, 0);
      const cap = plan.reduce((acc, _, k) => {
        const hAvail = (U_FULL - (k === 0 && SETTINGS.hasHeader ? 156 : 44)) * 2;
        return acc + hAvail;
      }, 0);
      const fillPct = Math.round((100 * tot) / (cap || 1) * 10) / 10;
      const over = window.overflow();

      window.parent.postMessage({
        type: 'OBHYASH_PDF_READY',
        totalPages: plan.length,
        totalCards: window.heights.length,
        fillPercentage: fillPct,
        overflows: over
      }, '*');
    }
  }, 400);
});
</script>
</body>
</html>`;
}
