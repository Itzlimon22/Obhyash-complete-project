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

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const DOL = '\ue000';

export function renderKatex(mathStr: string, displayMode: boolean = false): string {
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

function sanitizeRawText(text: string): string {
  if (!text) return '';
  let res = text;

  // 1. Fix corrupted control characters from unescaped JS strings (\t, \f, \r, \b)
  res = res
    .replace(/\t(imes|ext|au|heta|infty)/g, '\\$1')
    .replace(/\f(rac)/g, '\\$1')
    .replace(/\r(ight)/g, '\\$1')
    .replace(/[\b](egin|eta)/g, '\\$1');

  // 2. Remove OCR/garbage delimiters like 9029 and shell prompt leaks like zsh.
  res = res.replace(/9029/g, '');
  res = res.replace(/\bzsh\./g, '0.');
  res = res.replace(/\\n/g, '\n');

  // 3. Strip markdown horizontal rules and artifacts
  res = res.replace(/\n*---+[ \t]*\n*/g, '\n');
  res = res.replace(/^[ \t]*---+[ \t]*$/gm, '');

  // 2. Strip stray markdown asterisks used for pseudo-italics or emphasis
  res = res.replace(/\*+(দ্রষ্টব্য:[^*]+)\*+/g, '($1)');
  res = res.replace(/(^|[^\\])\*+([^*]+)\*+/g, '$1$2');

  // 3. Map English option references to Bengali option letters in explanations
  const optMap: Record<string, string> = {
    A: 'ক', B: 'খ', C: 'গ', D: 'ঘ',
    a: 'ক', b: 'খ', c: 'গ', d: 'ঘ'
  };
  res = res.replace(/(?:অপশন|Option)\s*\(([A-Da-d])\)/gi, (_m, letter) => {
    const bn = optMap[letter] || letter;
    return `অপশন (${bn})`;
  });

  // 4. Strip single quotes around single letters that get turned into LaTeX primes
  res = res.replace(/'\s*([a-zA-Z])\s*'/g, '$1');

  // 5. Bengali words/digits inside KaTeX like $৪ টি$ or $১ গুণ$ -> normal Bengali text
  res = res.replace(/\$([০-৯]+)\s*(টি|গুণ|ভাগ|বার|একক)\$/g, '$1 $2');

  // 6. Fix common bare units in raw text
  res = res.replace(/\bms\^\{-?1\}\b/g, '\\text{m s}^{-1}');
  res = res.replace(/\bms\^\{-?2\}\b/g, '\\text{m s}^{-2}');
  res = res.replace(/\brad\s*s\^\{-?1\}\b/g, '\\text{rad s}^{-1}');
  res = res.replace(/\brad\s*s\^\{-?2\}\b/g, '\\text{rad s}^{-2}');
  res = res.replace(/\brad\s*s\^\{?-?2\}?\b/g, '\\text{rad s}^{-2}');
  res = res.replace(/(\d+(?:\.\d+)?)\s*m\/s\^2\b/g, '$1\\text{ m s}^{-2}');
  res = res.replace(/(\d+(?:\.\d+)?)\s*m\/s\b/g, '$1\\text{ m s}^{-1}');

  return res;
}

function sanitizeBengaliInMath(text: string): string {
  // Only process single-dollar inline math ($ ... $) and ignore display math ($$ ... $$)
  return text.replace(/(?<!\$)\$(?!\$)([^\$]+?)(?<!\$)\$(?!\$)/g, (match, content) => {
    // If no Bengali characters, leave intact
    if (!/[\u0980-\u09FF]/.test(content)) return match;

    // If it contains complex LaTeX environments, leave intact
    if (content.includes('\\begin')) return match;

    // Check if there are Bengali characters outside \text{...}
    const contentWithoutText = content.replace(/\\text\{[^\}]*\}/g, '');
    if (!/[\u0980-\u09FF]/.test(contentWithoutText)) return match;

    // If the entire content is Bengali words/digits, strip the math dollars
    if (!/[a-zA-Z\\_{}\^=]/.test(content)) {
      return content;
    }

    // Extract leading Bengali: e.g. "$এখানে a = 5$" -> "এখানে $a = 5$"
    let c = content;
    let leadingBn = '';
    const leadMatch = c.match(/^([\u0980-\u09FF\s।,;]+)/);
    if (leadMatch && leadMatch[1].trim()) {
      leadingBn = leadMatch[1].trim() + ' ';
      c = c.slice(leadMatch[1].length);
    }

    // Extract trailing Bengali: e.g. "$a = 5$ একক"
    let trailingBn = '';
    const trailMatch = c.match(/([\u0980-\u09FF\s।,;]+)$/);
    if (trailMatch && trailMatch[1].trim()) {
      trailingBn = ' ' + trailMatch[1].trim();
      c = c.slice(0, -trailMatch[1].length);
    }

    c = c.trim();
    if (!c) return `${leadingBn}${trailingBn}`.trim();

    // If c contains LaTeX macros or braces, do not split into separate blocks
    if (c.includes('\\') || c.includes('{') || c.includes('}')) {
      return `${leadingBn}$${c}$${trailingBn}`.trim();
    }

    // If there is still Bengali text words in the middle (e.g. "$a = 5 এবং b = 6$"), split into separate math blocks
    const BENGALI_LETTERS = /[\u0985-\u09B9\u09BC-\u09CD\u09D7\u09DC\u09DD\u09DF]/;
    if (BENGALI_LETTERS.test(c)) {
      const parts = c.split(/([\u0985-\u09B9\u09BC-\u09CD\u09D7\u09DC\u09DD\u09DF]+(?:[\s।,;]+[\u0985-\u09B9\u09BC-\u09CD\u09D7\u09DC\u09DD\u09DF]+)*)/g);
      let out = '';
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (i % 2 === 1) {
          out += ' ' + p.trim() + ' ';
        } else {
          const m = p.trim().replace(/^[।,;\s]+|[।,;\s]+$/g, '');
          if (m) out += `$${m}$`;
        }
      }
      return `${leadingBn}${out}${trailingBn}`.replace(/\s+/g, ' ').trim();
    }

    return `${leadingBn}$${c}$${trailingBn}`.trim();
  });
}

export function normalizeMathText(text: string): string {
  if (!text) return '';
  let res = sanitizeRawText(text);
  res = sanitizeBengaliInMath(res);

  // 1. Normalize bracket delimiters \[ ... \] and \( ... \)
  res = res.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
  res = res.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // 2. Fix over-escaped double backslashes in common LaTeX commands
  res = res.replace(
    /\\\\(frac|sqrt|text|mathrm|mathbf|vec|hat|bar|times|cdot|pm|to|rightarrow|leftarrow|theta|alpha|beta|gamma|delta|epsilon|omega|pi|phi|tau|lambda|mu|sigma|infty|approx|ne|leq|geq|circ|degree|sum|int|partial|sin|cos|tan|log|ln|nabla|right|left|begin|end|aligned)\b/g,
    '\\$1'
  );

  // 3. Process ONLY non-math segments to auto-wrap bare LaTeX commands
  const parts = res.split(/(\${1,2}[\s\S]+?\${1,2})/g);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('$')) continue;
    let nonMath = parts[i];

    if (
      !/[\u0980-\u09FF]/.test(nonMath) &&
      (nonMath.includes('\\') || /[\^_]\{|\d\^|[a-zA-Z]_\d\b/.test(nonMath)) &&
      nonMath.trim().length > 0
    ) {
      parts[i] = `$${nonMath.trim()}$`;
      continue;
    }

    nonMath = nonMath.replace(/(\\(?:frac|sqrt|vec|hat|bar)\{[^}]+\}(?:\{[^}]+\})?)/g, '$$$1$$');
    nonMath = nonMath.replace(/(\\(?:theta|alpha|beta|gamma|delta|epsilon|omega|pi|phi|tau|lambda|mu|sigma|infty|approx|pm|times|cdot|circ|nabla|neq|leq|geq)\b)/g, '$$$1$$');
    nonMath = nonMath.replace(/(\b(?:cos|sin|tan)\s*(?:\\?theta|θ|\d+|x|y)\b)/gi, (_m, formula) => {
      const cleanFormula = formula.replace(/θ/g, '\\theta').replace(/\s+/g, ' ');
      const finalCmd = cleanFormula.startsWith('\\') ? cleanFormula : `\\${cleanFormula}`;
      return `$${finalCmd}$`;
    });
    parts[i] = nonMath;
  }

  return parts.join('');
}

function breakLongMath(t: string): string {
  if (!t) return '';
  if (t.includes('\\begin{aligned}') || t.includes('\\\\')) {
    const lines = t.split(/\\\\/g);
    const newLines = lines.map(line => {
      if (line.includes('\\text') || line.includes('\\mathrm')) return line;
      const match = line.match(/^([^&]*&[^=]*=[^=]+?)\s*(=|\\approx|\\sim)\s*(.+)$/);
      if (match && line.length > 55) {
        return `${match[1]} \\\\ &${match[2]} ${match[3]}`;
      }
      return line;
    });
    return newLines.join(' \\\\ ');
  } else if (!t.includes('\\\\') && t.length > 55) {
    if (t.includes('\\text') || t.includes('\\mathrm')) return t;
    const parts = t.split(/\s*(=|\\approx|\\rightarrow|\\to)\s*/g);
    if (parts.length > 3) {
      let acc = `\\begin{aligned} ${parts[0]} `;
      for (let i = 1; i < parts.length; i += 2) {
        const op = parts[i];
        const val = parts[i + 1] || '';
        acc += `&${op} ${val} \\\\ `;
      }
      acc += '\\end{aligned}';
      return acc;
    }
  }
  return t;
}

export function inlineMath(s: string): string {
  if (!s) return '';
  const normalized = normalizeMathText(s).replace(/\\\$/g, DOL);
  const parts = normalized.split(/(\${1,2}[^\$]+\${1,2})/g);
  let out = '';
  for (const p of parts) {
    if (p.startsWith('$$') && p.endsWith('$$') && p.length > 4) {
      out += displayMath(p.slice(2, -2));
    } else if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
      const t = p.slice(1, -1);
      const w = t.length >= 40 ? ' wrapm' : '';
      const rendered = renderKatex(t, false);
      out += `<span class="m${w}">${rendered}</span>`;
    } else {
      out += escapeHtml(p).replace(new RegExp(DOL, 'g'), '<span class="dl"></span>');
    }
  }
  out = out.replace(/\((<span class="m[^>]*>[\s\S]*?<\/span>)\)/g, '<span class="nw">($1)</span>');
  return out;
}

export function displayMath(t: string): string {
  const processed = breakLongMath(t);
  const rendered = renderKatex(processed, true);
  return `<div class="dm m">${rendered}</div>`;
}

function sentences(line: string): string[] {
  const res: string[] = [];
  let buf = '';
  let inInline = false;
  let inDisplay = false;
  let braceDepth = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '$') {
      if (line[i + 1] === '$') {
        inDisplay = !inDisplay;
        buf += '$$';
        i++;
        continue;
      } else if (!inDisplay) {
        inInline = !inInline;
      }
    } else if (ch === '{') {
      braceDepth++;
    } else if (ch === '}') {
      if (braceDepth > 0) braceDepth--;
    }

    buf += ch;
    if (ch === '।' && !inInline && !inDisplay && braceDepth === 0) {
      res.push(buf);
      buf = '';
    }
  }
  if (buf.trim()) res.push(buf);
  return res;
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
      } else {
        acc += p;
      }
    }
    flush();
  }
  return items;
}

function blk(
  items: Array<{ type: 't' | 'd'; html: string }>
): { out: string } {
  let out = '';
  items.forEach((it) => {
    if (it.type === 't') {
      out += `<div class="ln">${it.html}</div>`;
    } else {
      out += it.html;
    }
  });
  return { out };
}

function explHtml(E: string[]): string {
  const lines = E.filter(l => l.trim().length > 0);
  if (!lines.length) return '';
  // Strip leading 'ব্যাখ্যা:' or '**ব্যাখ্যা:**' if already present in database text
  lines[0] = lines[0].replace(/^(\*\*|#+\s*)?ব্যাখ্যা\s*:\s*(\*\*)?\s*/i, '');
  let note: string | null = null;
  const lastLine = lines[lines.length - 1];
  const m = lastLine.match(/\s*\((সূত্র:[^)]*)\)\s*$/);
  if (m) {
    note = m[1];
    lines[lines.length - 1] = lastLine.slice(0, m.index);
  }
  let out = '<div class="ex-lab"><span class="lab">ব্যাখ্যা:</span></div>';
  for (let l of lines) {
    let imgBlock = '';
    l = l.replace(/!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/g, (_m, _alt, src) => {
      imgBlock += `<div class="q-img" style="text-align:center;margin:6px 0;"><img src="${escapeHtml(src)}" style="max-height:120px;max-width:96%;object-fit:contain;border-radius:4px;" /></div>`;
      return '';
    }).trim();

    if (imgBlock) {
      out += imgBlock;
    }
    if (!l) continue;

    if (l.startsWith('- ')) {
      const it = lineItems(l.slice(2));
      const res = blk(it);
      out += `<div class="bl"><span class="mk"></span><div class="bc">${res.out}</div></div>`;
    } else {
      const it = lineItems(l);
      if (!it.length) continue;
      const res = blk(it);
      out += res.out;
    }
  }
  if (note) out += `<div class="note">${escapeHtml(note)}</div>`;
  return out;
}

const CHK_SVG = `<svg class="ck" viewBox="0 0 20 20"><path d="M3.5 10.5l4.2 4.2L16.5 5.5" fill="none" stroke="#2e9e57" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function renderCardHtml(q: QuestionItem): string {
  if (q.cardType === 'explanation' || q.isContinuation) {
    const ex = explHtml(q.E || []);
    const partText = q.continuationPart ? ` (অংশ ${toBnNumber(q.continuationPart)})` : '';
    return `<div class="card ex-card" data-qn="${q.n}"><div class="ex"><div class="cont-lab"><span class="bd-mini">${toBnNumber(q.n)}</span> <span class="lab">প্রশ্ন ${toBnNumber(q.n)}-এর ব্যাখ্যা${partText}:</span></div>${ex}</div></div>`;
  }

  const rawAns = q.A?.trim() || '';
  const ansKey = LET_INV[rawAns] || rawAns;
  let opts = '';
  let shouldStack = false;
  if (q.o) {
    for (const k of ['a', 'b', 'c', 'd']) {
      const raw = q.o[k] || '';
      const plain = raw.replace(/\$/g, '').trim();
      if (
        plain.length > 28 ||
        raw.includes('\\frac') ||
        raw.includes('\\int') ||
        raw.includes('\\sum') ||
        raw.length > 36
      ) {
        shouldStack = true;
      }
    }
    for (const k of ['a', 'b', 'c', 'd']) {
      let raw = q.o[k] || '';
      // If raw option has no '$' but has LaTeX commands or math symbols: auto wrap in '$'
      if (!raw.includes('$') && (raw.includes('\\') || /[\^_]\{|\d\^/.test(raw))) {
        raw = `$${raw.trim()}$`;
      }
      const plain = raw.replace(/\$/g, '');
      const isOk = rawAns ? k === ansKey : false;
      const cls = 'op' + (plain.length > 24 ? ' smo' : '') + (isOk ? ' ok' : '');
      opts += `<div class="${cls}"><b>${LET[k]}.</b> ${inlineMath(raw)}${isOk ? CHK_SVG : ''}</div>`;
    }
  }
  const ex = q.E && q.E.length ? explHtml(q.E) : '';
  const imgHtml = q.img ? `<div class="q-img" style="text-align:center;margin:6px 0;"><img src="${escapeHtml(q.img)}" style="max-height:130px;max-width:96%;object-fit:contain;border-radius:4px;" /></div>` : '';
  const optsCls = 'opts' + (shouldStack ? ' stack' : '');
  const optsHtml = opts ? `<div class="${optsCls}">${opts}</div>` : '';
  const exHtml = ex ? `<div class="ex">${ex}</div>` : '';
  return `<div class="card q-card" data-qn="${q.n}"><div class="qb"><span class="bd">${toBnNumber(q.n)}</span><div class="qt">${inlineMath(q.q || '')}</div></div>${imgHtml}${optsHtml}${exHtml}</div>`;
}

export function prepareQuestionItems(rawQuestions: any[]): QuestionItem[] {
  const banglaAns = ['ক', 'খ', 'গ', 'ঘ'];
  const items: QuestionItem[] = [];

  for (const q of rawQuestions) {
    let questionText = (q.question || '').trim();
    let imgUrl = q.image_url || q.img || undefined;

    // Extract markdown image from question if present
    const imgMatch = questionText.match(/!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/);
    if (imgMatch) {
      if (!imgUrl) {
        imgUrl = imgMatch[2];
      }
      questionText = questionText.replace(imgMatch[0], '').trim();
    }

    const rawExpl = (q.explanation || '').trim();

    // 1. Question Card (contains question, image, options)
    items.push({
      n: q.serial,
      q: questionText,
      img: imgUrl,
      o: {
        a: q.options?.[0] || '',
        b: q.options?.[1] || '',
        c: q.options?.[2] || '',
        d: q.options?.[3] || '',
      },
      A: typeof q.correct_answer_index === 'number' ? banglaAns[q.correct_answer_index] || 'ক' : (q.A || 'ক'),
      E: [],
      cardType: 'question',
    });

    // 2. Separate Explanation Card (if explanation exists)
    if (rawExpl) {
      items.push({
        n: q.serial,
        q: '',
        o: { a: '', b: '', c: '', d: '' },
        A: '',
        E: [rawExpl],
        cardType: 'explanation',
      });
    }
  }

  return items;
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

import { ThemeColors, ALL_THEMES, getCuratedTheme } from './themes';
import { getAdPageFragment } from './ad-page';
export type { ThemeColors };
export { ALL_THEMES, getCuratedTheme };
export const THEME_CONFIGS = ALL_THEMES;

export function generateTemplateHtml(
  questions: QuestionItem[],
  settings: GeneratorSettings
): string {
  const density = settings.density || 'balanced';
  const dc = DENSITY_CONFIGS[density] || DENSITY_CONFIGS.balanced;
  const th = getCuratedTheme(settings.theme, settings.title || settings.subtitle);
  const adFragment = getAdPageFragment();


  const baseUrlTag = settings.baseUrl
    ? `<base href="${escapeHtml(settings.baseUrl)}/">`
    : '';

  const toolbarHtml = settings.standaloneToolbar
    ? `<div class="no-print" style="position: sticky; top: 0; z-index: 99999; background: ${th.brandLink}; color: #ffffff; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 14px rgba(0,0,0,0.18); font-family: 'Kalpurush', 'Times New Roman', sans-serif;">
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
  height: 136px;
  border-radius: 24px;
  background: ${th.heroBg};
  overflow: hidden;
  color: #fff;
  text-align: center;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 20px 22px 20px;
}
.hdr .t {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 4px;
  letter-spacing: 0.2px;
}
.hdr .tag {
  font-size: 15.5px;
  font-weight: 600;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 14px;
  border-radius: 12px;
  display: inline-block;
  margin-bottom: 4px;
  letter-spacing: 0.2px;
}
.hdr .s {
  font-size: 13px;
  opacity: 0.92;
  line-height: 1.3;
}
.hdr .bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 18px;
  background: ${th.heroBar};
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
  color: ${th.brandLink};
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
  color: ${th.brandLink};
  font-size: 15px;
  font-weight: bold;
  white-space: nowrap;
}

/* Columns */
.col {
  position: absolute;
  width: 344px;
  max-width: 344px;
  box-sizing: border-box;
  overflow: hidden;
  contain: paint;
  z-index: 1;
}
.card {
  width: 344px;
  max-width: 344px;
  box-sizing: border-box;
  margin-bottom: 0;
  overflow: hidden;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.col .card + .card {
  margin-top: 0;
}
.card.q-card {
  margin-bottom: 0;
}
.card.ex-card {
  margin-top: 0;
}
.card.q-attached {
  margin-bottom: 2px !important;
}
.card.ex-attached {
  margin-top: 0 !important;
}
.card.ex-attached .cont-lab {
  display: none !important;
}
/* If .cont-lab is displayed (card broken to new column/page), hide .ex-lab so there is no duplicate header */
.card.ex-card:not(.ex-attached) .ex-lab {
  display: none !important;
}
.ex-lab {
  margin-bottom: 5px;
}
.ex-lab .lab {
  color: ${th.accent};
  font-weight: bold;
  font-size: 13.5px;
}

/* Question Box */
.qb {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: ${th.qbBg};
  border-left: 5px solid ${th.qbBorder};
  border-radius: 12px;
  padding: ${dc.qbPadding};
  font-weight: bold;
  font-size: ${dc.qbFontSize};
  line-height: ${dc.qbLineHeight};
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}
.bd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: ${dc.bdPadding};
  background: ${th.bdBg};
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
  word-break: break-word;
  overflow-wrap: anywhere;
  overflow: hidden;
}

/* Options */
.opts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${dc.optsGap};
  margin: ${dc.optsMargin};
  width: 100%;
  box-sizing: border-box;
}
.opts.stack {
  grid-template-columns: 1fr;
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
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  word-break: break-word;
  overflow-wrap: anywhere;
  overflow: hidden;
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
  background: ${th.exBg};
  border-radius: 12px;
  padding: ${dc.exPadding};
  font-size: ${dc.exFontSize};
  line-height: ${dc.exLineHeight};
  max-width: 100%;
  box-sizing: border-box;
  word-break: break-word;
  overflow-wrap: anywhere;
  overflow: hidden;
}
.card.ex-cont .ex {
  border-left: 4px solid ${th.accent};
  background: ${th.exBg};
}
.cont-lab {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 6px;
  font-weight: bold;
  font-size: 13.5px;
}
.bd-mini {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: ${th.bdBg};
  color: #fff;
  border-radius: 999px;
  font-size: 12px;
  font-weight: bold;
}
.ln {
  margin: 2px 0;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.lab { color: ${th.accent}; font-weight: bold; }
.bl { display: flex; gap: 6px; margin: 3px 0; }
.mk {
  flex: none;
  margin-top: 5px;
  width: 0;
  height: 0;
  border-left: 6px solid ${th.accent};
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
}
.bc {
  flex: 1;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: anywhere;
  overflow: hidden;
}
.note { font-style: italic; color: #555; margin-top: 3px; }
.dm {
  text-align: left;
  margin: 2px 0 2px 6px;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

/* KaTeX typography */
.katex {
  white-space: nowrap;
  font-size: 1.05em;
  max-width: 100%;
}
.wrapm .katex, .wrapm.katex { white-space: normal; }
.dm .katex-display { margin: 2px 0 !important; text-align: left !important; max-width: 100%; }
.dm .katex-display > .katex { text-align: left !important; max-width: 100%; }
.dm .katex-display > .katex > .katex-html { text-align: left !important; }
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
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 10px;
  box-sizing: border-box;
}
.foot a {
  color: ${th.brandLink};
  text-decoration: none;
  font-size: 15.5px;
  line-height: 1;
  white-space: nowrap;
  vertical-align: baseline;
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
}
.foot .site {
  font-family: 'Times New Roman', 'Liberation Serif', serif;
  font-weight: bold;
  font-size: 15.5px;
  vertical-align: baseline;
}
.pg {
  font-size: 15.5px;
  line-height: 1;
  color: ${th.brandLink};
  white-space: nowrap;
  vertical-align: baseline;
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

${adFragment.css}
</style>
</head>
<body>
${toolbarHtml}
<div id="measure">
${questions.map(renderCardHtml).join('\n')}
</div>
<div id="root"></div>

<script>
const SETTINGS = ${JSON.stringify(settings)};
const AD_PAGE_HTML = ${JSON.stringify(adFragment.html)};
const BN = s => String(s).replace(/\\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const M = document.getElementById('measure');

window.READY = false;

// Dynamic Programming Pagination
const GAP = ${dc.cardGap};
// Page 1 header takes 128px + 40px top + margin, columns start at 196px.
// Safe clearance to footer line at 1063px: max column bottom <= 986px -> U_PAGE_1 = 790px (leaving >= 77px safe buffer!)
const U_PAGE_1 = 790;
// Page 2+ mini header ends around 64px, columns start at 80px.
// Safe clearance to footer line at 1063px: max column bottom <= 990px -> U_PAGE_N = 910px (leaving >= 73px safe buffer!)
const U_PAGE_N = 910;

function paginate(h, hdr, types, qns) {
  const n = h.length;
  const INF = [1e9, 1e12];
  const pre = [0];
  for (const x of h) pre.push(pre[pre.length - 1] + x);
  const hh = (i, j) => (j > i ? pre[j] - pre[i] + GAP * (j - i - 1) : 0);

  const best = Array.from({ length: n + 1 }, () => [...INF]);
  best[0] = [0, 0];
  const bp = Array(n + 1).fill(null);

  for (let i = 0; i < n; i++) {
    if (best[i][0] === 1e9) continue;
    const p = best[i][0];
    const prevCost = best[i][1];
    const U = (p === 0 && hdr) ? U_PAGE_1 : U_PAGE_N;
    let a = 1;
    while (i + a <= n && (hh(i, i + a) <= U || a === 1)) {
      let b = 0;
      while (i + a + b <= n && (b === 0 || hh(i + a, i + a + b) <= U || b === 1)) {
        const j = i + a + b;
        const h1 = hh(i, i + a);
        const h2 = b > 0 ? hh(i + a, j) : 0;
        const maxH = Math.max(h1, h2);
        const unused = Math.max(0, U - maxH);
        const colDiff = Math.abs(h1 - h2);
        const isLast = (j === n);
        let pageCost = isLast 
          ? Math.pow(colDiff * 0.5, 2) 
          : Math.pow(unused * 0.85, 2) + Math.pow(colDiff * 0.6, 2);

        // Small penalty if a question card and its explanation card are split across columns
        if (types && qns) {
          if (types[i + a] === 'ex' && qns[i + a - 1] === qns[i + a]) {
            pageCost += 3500;
          }
          if (j < n && types[j] === 'ex' && qns[j - 1] === qns[j]) {
            pageCost += 3500;
          }
        }

        // Prioritize balanced 2-column pages on intermediate pages
        if (b === 0 && !isLast) {
          pageCost += 200000;
        }
        if (h1 > U || h2 > U) {
          pageCost += 500000;
        }
        const cand = [p + 1, prevCost + pageCost];
        if (cand[0] < best[j][0] || (cand[0] === best[j][0] && cand[1] < best[j][1])) {
          best[j] = cand;
          bp[j] = [i, a, b];
        }
        if (h2 > U && b === 1) break;
        b++;
      }
      if (hh(i, i + a) > U && a === 1) break;
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
        <div class="tag">\${SETTINGS.subTitleLabel || 'সমাধান ও ব্যাখ্যা'}</div>
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

    const U_AVAIL = (k === 0 && hdr) ? U_PAGE_1 : U_PAGE_N;

    [[pl[0], 40], [pl[1], 410]].forEach(([ids, x]) => {
      const c = document.createElement('div');
      c.className = 'col';
      c.style.left = x + 'px';
      c.style.top = top + 'px';

      // Smart vertical gap distribution if extra space exists
      // Strict constraint: total column height must NEVER exceed U_AVAIL, guaranteeing safe distance to footer!
      if (SETTINGS.balanceColumns !== false && ids.length > 1) {
        const colCardsSum = ids.reduce((sum, i) => sum + (window.heights ? window.heights[i] : 0), 0);
        const gapsCount = ids.length - 1;
        const maxAffordableGap = Math.floor((U_AVAIL - colCardsSum) / gapsCount);
        if (maxAffordableGap >= GAP) {
          const distributedGap = Math.min(20, maxAffordableGap);
          c.style.display = 'flex';
          c.style.flexDirection = 'column';
          c.style.gap = distributedGap + 'px';
        } else {
          const safeGap = Math.max(4, Math.min(GAP, maxAffordableGap));
          c.style.display = 'flex';
          c.style.flexDirection = 'column';
          c.style.gap = safeGap + 'px';
        }
      }

      ids.forEach(i => c.appendChild(M.children[i].cloneNode(true)));

      // Auto-attach consecutive q-card and ex-card with same qn
      const cCards = Array.from(c.children);
      for (let ci = 0; ci < cCards.length - 1; ci++) {
        const cur = cCards[ci];
        const nxt = cCards[ci + 1];
        if (cur.classList.contains('q-card') && nxt.classList.contains('ex-card') && cur.dataset.qn === nxt.dataset.qn) {
          cur.classList.add('q-attached');
          nxt.classList.add('ex-attached');
        }
      }

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

  // Append Modern 3-Phone Advertising & Feature Showcase Back Page
  if (SETTINGS.includeAdPage !== false) {
    const adWrapper = document.createElement('div');
    adWrapper.innerHTML = AD_PAGE_HTML;
    const adEl = adWrapper.firstElementChild;
    if (adEl) {
      root.appendChild(adEl);
    }
  }
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

function fitWideMath(container) {
  if (!container) return;
  const cards = container.querySelectorAll('.card');
  cards.forEach(card => {
    const maxWidth = 314;
    card.querySelectorAll('.dm').forEach(dm => {
      const k = dm.querySelector('.katex-html') || dm;
      const w = k.scrollWidth || k.getBoundingClientRect().width;
      if (w > maxWidth) {
        const scale = Math.max(0.65, Math.floor((maxWidth / w) * 100) / 100);
        dm.style.transformOrigin = 'left center';
        dm.style.transform = 'scale(' + scale + ')';
        dm.style.width = Math.ceil(100 / scale) + '%';
        dm.style.marginBottom = Math.round((1 - scale) * -10) + 'px';
      }
    });
  });
}

// Initialize after font and all images are fully ready
async function initLayout() {
  await document.fonts.ready;
  const imgs = Array.from(document.images);
  await Promise.all(imgs.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(res => {
      img.addEventListener('load', res);
      img.addEventListener('error', res);
    });
  }));
  // Brief delay to allow DOM reflow
  await new Promise(r => setTimeout(r, 60));

  fitWideMath(M);
  window.heights = [...M.children].map(c => c.getBoundingClientRect().height);
  window.types = [...M.children].map(c => c.classList.contains('ex-card') ? 'ex' : 'q');
  window.qns = [...M.children].map(c => c.dataset.qn || '');
  const plan = paginate(window.heights, SETTINGS.hasHeader, window.types, window.qns);
  window.build(plan, SETTINGS.pageOffset, SETTINGS.hasHeader);
  fitWideMath(document.getElementById('root'));
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
        const hAvail = ((k === 0 && SETTINGS.hasHeader ? U_PAGE_1 : U_PAGE_N)) * 2;
        return acc + hAvail;
      }, 0);
      const fillPct = Math.round((100 * tot) / (cap || 1) * 10) / 10;
      const over = window.overflow();
      const adPageCount = SETTINGS.includeAdPage !== false ? 1 : 0;

      window.parent.postMessage({
        type: 'OBHYASH_PDF_READY',
        totalPages: plan.length + adPageCount,
        totalCards: window.heights.length,
        fillPercentage: fillPct,
        overflows: over
      }, '*');
    }
}
initLayout();
</script>
</body>
</html>`;
}
