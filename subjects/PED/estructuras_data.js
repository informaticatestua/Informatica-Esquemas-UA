/* ================================================================
   PED — estructuras_data.js
   Programación y Estructuras de Datos — 2º Curso, 2º Semestre
   ----------------------------------------------------------------
   Visualizadores de TEORÍA + helpers de dibujo y simulación
   compartidos (los reutilizan también las prácticas).

   Cada visualizador expone:
     · info (name, shortName, complejidades, description, ...)
     · generateSteps() → array de pasos precalculados (cada paso .desc)
     · render(container, step) → pinta un paso concreto
   ================================================================ */
'use strict';

/* ════════════════════════════════════════════════════════════════
   HELPERS COMUNES
════════════════════════════════════════════════════════════════ */
function legend(...items) {
  return `<div class="legend">${items.map(it => {
    const [color, label] = it;
    return `<span class="leg-item"><span class="leg-dot" style="background:${color}"></span>${label}</span>`;
  }).join('')}</div>`;
}

/* Paleta reutilizada en las leyendas */
const C = {
  def: '#dde3ed', act: '#3b82f6', cmp: '#f59e0b',
  swp: '#ef4444', srt: '#10b981', pur: '#8b5cf6', grn: '#10b981'
};

/* Banda superior con la explicación del paso (sólo se usa en Práctica,
   en Teoría la explicación va en el panel inferior #stepText). */
function descBanner(desc) {
  if (!desc) return '';
  return `<div style="width:100%;background:linear-gradient(135deg,#f0f7ff,#f8fbff);border:1px solid #e8f0fe;border-radius:10px;padding:10px 14px;font-size:.85rem;color:#475569;line-height:1.5;margin-bottom:4px">💡&nbsp; ${desc}</div>`;
}

/* ════════════════════════════════════════════════════════════════
   ÁRBOL BINARIO (ABB / AVL / recorridos) — modelo y dibujo
════════════════════════════════════════════════════════════════ */
function cloneBin(n) {
  return n ? { v: n.v, fe: n.fe, l: cloneBin(n.l), r: cloneBin(n.r) } : null;
}

function _nodeCls(v, hl) {
  if (!hl) return '';
  const inn = k => hl[k] && hl[k].includes(v);
  if (inn('del')) return 'del';
  if (inn('ins')) return 'ins';
  if (inn('rot')) return 'rot';
  if (inn('found')) return 'found';
  if (inn('compare')) return 'cmp';
  if (inn('active')) return 'act';
  if (inn('path')) return 'path';
  return '';
}

/* Dibuja un árbol binario en SVG. opt = { hl, showFE, caption, legend, below, desc } */
function renderBinTree(container, root, opt = {}) {
  const hl = opt.hl || {};
  const wrap = inner => {
    container.innerHTML = `<div style="width:100%;display:flex;flex-direction:column;gap:12px;align-items:center">
      ${descBanner(opt.desc)}
      ${opt.caption ? `<div style="font-size:.8rem;color:var(--txt-muted);font-family:'JetBrains Mono',monospace;text-align:center">${opt.caption}</div>` : ''}
      ${inner}
      ${opt.below || ''}
      ${opt.legend || ''}
    </div>`;
  };
  if (!root) { wrap('<div class="tree-empty">Árbol vacío</div>'); return; }

  const pos = new Map(); let cx = 0, maxD = 0;
  (function rec(n, d) { if (!n) return; rec(n.l, d + 1); pos.set(n, { x: cx++, y: d }); if (d > maxD) maxD = d; rec(n.r, d + 1); })(root, 0);

  const gapX = 50, gapY = 64, r = 19, padX = 28, padY = 26;
  const W = Math.max(1, cx - 1) * gapX + padX * 2;
  const H = maxD * gapY + padY * 2 + 6;
  let edges = '', nodes = '';
  pos.forEach((p, n) => {
    const X = p.x * gapX + padX, Y = p.y * gapY + padY;
    ['l', 'r'].forEach(s => {
      const c = n[s]; if (!c) return;
      const cp = pos.get(c);
      const ec = (hl.pathEdge && hl.pathEdge.includes(c.v)) ? 'hl' : '';
      edges += `<line class="tree-edge ${ec}" x1="${X}" y1="${Y}" x2="${cp.x * gapX + padX}" y2="${cp.y * gapY + padY}"/>`;
    });
  });
  pos.forEach((p, n) => {
    const X = p.x * gapX + padX, Y = p.y * gapY + padY;
    const cls = _nodeCls(n.v, hl);
    const fe = (opt.showFE && n.fe !== undefined && n.fe !== null)
      ? `<text class="fe" x="${X + r - 1}" y="${Y - r + 5}">${n.fe > 0 ? '+' : ''}${n.fe}</text>` : '';
    nodes += `<g class="tree-node ${cls}"><circle cx="${X}" cy="${Y}" r="${r}"/><text x="${X}" y="${Y + 1}">${n.v}</text>${fe}</g>`;
  });
  wrap(`<div class="tree-scroll"><svg class="tree-svg" viewBox="0 0 ${W} ${H}" width="${Math.min(W, 780)}">${edges}${nodes}</svg></div>`);
}

const TREE_LEGEND = legend([C.cmp, 'Comparando'], [C.act, 'Nodo actual'], [C.grn, 'Insertado / destino'], [C.swp, 'A borrar'], [C.pur, 'Rotación']);

/* ── Simulación: inserción en ABB ── */
function bstBuild(seq, steps) {
  let root = null;
  seq.forEach(v => {
    if (!root) {
      root = { v, l: null, r: null };
      if (steps) steps.push({ tree: cloneBin(root), hl: { ins: [v] }, desc: `Insertamos <strong>${v}</strong> como raíz del árbol.` });
      return;
    }
    let cur = root; const path = [];
    while (true) {
      if (steps) steps.push({ tree: cloneBin(root), hl: { compare: [cur.v], path: [...path] }, desc: `Insertar ${v}: comparamos con <strong>${cur.v}</strong>.` });
      path.push(cur.v);
      if (v < cur.v) {
        if (cur.l) { cur = cur.l; }
        else { cur.l = { v, l: null, r: null }; if (steps) steps.push({ tree: cloneBin(root), hl: { ins: [v], path }, desc: `${v} &lt; ${cur.v} y no hay hijo izquierdo → se inserta a la <strong>izquierda</strong>.` }); break; }
      } else if (v > cur.v) {
        if (cur.r) { cur = cur.r; }
        else { cur.r = { v, l: null, r: null }; if (steps) steps.push({ tree: cloneBin(root), hl: { ins: [v], path }, desc: `${v} &gt; ${cur.v} y no hay hijo derecho → se inserta a la <strong>derecha</strong>.` }); break; }
      } else { if (steps) steps.push({ tree: cloneBin(root), hl: { found: [v] }, desc: `${v} ya existe: en un ABB no se permiten repetidos.` }); break; }
    }
  });
  return root;
}

/* ── Simulación: borrado en ABB (sustituir por el menor de la derecha) ── */
function bstDelete(rootRef, v, steps) {
  let root = rootRef.root, cur = root, par = null;
  while (cur && cur.v !== v) {
    steps.push({ tree: cloneBin(root), hl: { compare: [cur.v] }, desc: `Buscamos ${v}: comparamos con <strong>${cur.v}</strong>.` });
    par = cur; cur = v < cur.v ? cur.l : cur.r;
  }
  if (!cur) { steps.push({ tree: cloneBin(root), desc: `${v} no está en el árbol.` }); return; }
  steps.push({ tree: cloneBin(root), hl: { del: [cur.v] }, desc: `Encontrado <strong>${v}</strong>. Procedemos a borrarlo.` });
  const replace = (node, child) => { if (!par) root = child; else if (par.l === node) par.l = child; else par.r = child; };
  if (!cur.l && !cur.r) {
    replace(cur, null);
    steps.push({ tree: cloneBin(root), desc: `${v} es una <strong>hoja</strong> → se elimina directamente.` });
  } else if (!cur.l || !cur.r) {
    const child = cur.l || cur.r;
    replace(cur, child);
    steps.push({ tree: cloneBin(root), hl: { ins: [child.v] }, desc: `${v} tiene <strong>un solo hijo</strong> → se sustituye por su hijo (${child.v}).` });
  } else {
    let sp = cur, s = cur.r;
    steps.push({ tree: cloneBin(root), hl: { del: [cur.v], active: [s.v] }, desc: `${v} tiene <strong>dos hijos</strong> → buscamos el menor del subárbol derecho.` });
    while (s.l) { sp = s; s = s.l; steps.push({ tree: cloneBin(root), hl: { del: [cur.v], active: [s.v] }, desc: `Descendemos por la izquierda: ${s.v}.` }); }
    steps.push({ tree: cloneBin(root), hl: { del: [cur.v], ins: [s.v] }, desc: `El menor de la derecha es <strong>${s.v}</strong>: reemplaza a ${v}.` });
    cur.v = s.v;
    if (sp.l === s) sp.l = s.r; else sp.r = s.r;
    steps.push({ tree: cloneBin(root), desc: `Se elimina el nodo ${s.v} de su posición original. Borrado completado.` });
  }
  rootRef.root = root;
}

/* ── Simulación: AVL (con factores de equilibrio y rotaciones) ── */
function _h(n) { return n ? n.h : 0; }
function _upd(n) { n.h = 1 + Math.max(_h(n.l), _h(n.r)); n.fe = _h(n.r) - _h(n.l); }
function _rotL(x) { const y = x.r; x.r = y.l; if (y.l) y.l.p = x; y.l = x; y.p = x.p; x.p = y; _upd(x); _upd(y); return y; }
function _rotR(y) { const x = y.l; y.l = x.r; if (x.r) x.r.p = y; x.r = y; x.p = y.p; y.p = x; _upd(y); _upd(x); return x; }

function avlBuild(seq, steps) {
  let root = null;
  seq.forEach(v => {
    if (!root) { root = { v, l: null, r: null, p: null, h: 1, fe: 0 }; steps.push({ tree: cloneBin(root), showFE: true, hl: { ins: [v] }, desc: `Insertamos <strong>${v}</strong> como raíz.` }); return; }
    let cur = root, par = null, dup = false;
    while (cur) {
      steps.push({ tree: cloneBin(root), showFE: true, hl: { compare: [cur.v] }, desc: `Insertar ${v}: comparamos con <strong>${cur.v}</strong>.` });
      par = cur;
      if (v < cur.v) cur = cur.l; else if (v > cur.v) cur = cur.r; else { dup = true; break; }
    }
    if (dup) { steps.push({ tree: cloneBin(root), showFE: true, hl: { found: [v] }, desc: `${v} ya existe: no se inserta.` }); return; }
    const node = { v, l: null, r: null, p: par, h: 1, fe: 0 };
    if (v < par.v) par.l = node; else par.r = node;
    steps.push({ tree: cloneBin(root), showFE: true, hl: { ins: [v] }, desc: `${v} se inserta como hoja. Ahora subimos actualizando factores de equilibrio (FE = altura dcha − altura izq).` });
    let n = par;
    while (n) {
      _upd(n);
      if (n.fe <= -2 || n.fe >= 2) {
        const gp = n.p, isL = gp && gp.l === n, pivot = n.v;
        let sub, tipo;
        if (n.fe <= -2) {
          if (_h(n.l.l) >= _h(n.l.r)) { tipo = 'II · rotación simple a la derecha'; sub = _rotR(n); }
          else { tipo = 'ID · rotación doble (izquierda-derecha)'; n.l = _rotL(n.l); n.l.p = n; sub = _rotR(n); }
        } else {
          if (_h(n.r.r) >= _h(n.r.l)) { tipo = 'DD · rotación simple a la izquierda'; sub = _rotL(n); }
          else { tipo = 'DI · rotación doble (derecha-izquierda)'; n.r = _rotR(n.r); n.r.p = n; sub = _rotL(n); }
        }
        sub.p = gp;
        if (!gp) root = sub; else if (isL) gp.l = sub; else gp.r = sub;
        steps.push({ tree: cloneBin(root), showFE: true, hl: { rot: [sub.v] }, desc: `Desequilibrio en <strong>${pivot}</strong> (FE fuera de {-1,0,1}) → <strong>${tipo}</strong>.` });
        n = gp;
      } else {
        steps.push({ tree: cloneBin(root), showFE: true, hl: { active: [n.v] }, desc: `FE(${n.v}) = ${n.fe > 0 ? '+' : ''}${n.fe}: está equilibrado. Seguimos subiendo.` });
        n = n.p;
      }
    }
  });
  return root;
}

/* ════════════════════════════════════════════════════════════════
   ÁRBOLES MULTICAMINO (2-3 y 2-3-4) — modelo y dibujo
════════════════════════════════════════════════════════════════ */
function cloneMulti(n) { return { keys: [...n.keys], children: n.children.map(cloneMulti) }; }

function _mcls(node, hl) {
  const any = arr => arr && node.keys.some(k => arr.includes(k));
  if (any(hl.split)) return 'split';
  if (any(hl.ins)) return 'ins';
  if (any(hl.empty)) return 'empty';
  if (any(hl.active)) return 'act';
  return '';
}

function renderMulti(container, root, opt = {}) {
  const hl = opt.hl || {};
  const pos = new Map(); let leaf = 0, maxD = 0;
  (function rec(n, d) {
    if (d > maxD) maxD = d;
    if (!n.children || n.children.length === 0) { pos.set(n, { x: leaf++, y: d }); return; }
    n.children.forEach(c => rec(c, d + 1));
    const xs = n.children.map(c => pos.get(c).x);
    pos.set(n, { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: d });
  })(root, 0);

  const unitX = 78, gapY = 74, padX = 46, padY = 28, keyW = 26, boxH = 30;
  const W = Math.max(1, leaf - 1) * unitX + padX * 2;
  const H = maxD * gapY + padY * 2 + boxH;
  const cxOf = n => pos.get(n).x * unitX + padX;
  const cyOf = n => pos.get(n).y * gapY + padY + boxH / 2;

  let edges = '', boxes = '';
  pos.forEach((p, n) => {
    if (!n.children || !n.children.length) return;
    const X = cxOf(n), Y = cyOf(n) + boxH / 2;
    n.children.forEach(c => { edges += `<line class="tree-edge" x1="${X}" y1="${Y}" x2="${cxOf(c)}" y2="${cyOf(c) - boxH / 2}"/>`; });
  });
  pos.forEach((p, n) => {
    const cx = cxOf(n), cy = cyOf(n);
    const ks = n.keys.length ? n.keys : ['∅'];
    const w = ks.length * keyW + 10;
    const x0 = cx - w / 2, y0 = cy - boxH / 2;
    boxes += `<rect class="mtree-box ${_mcls(n, hl)}" x="${x0}" y="${y0}" width="${w}" height="${boxH}" rx="6"/>`;
    ks.forEach((k, i) => {
      const kx = x0 + 5 + keyW * i + keyW / 2;
      if (i > 0) boxes += `<line class="mtree-sep" x1="${x0 + 5 + keyW * i}" y1="${y0 + 4}" x2="${x0 + 5 + keyW * i}" y2="${y0 + boxH - 4}"/>`;
      boxes += `<text class="mtree-key" x="${kx}" y="${cy + 1}">${k}</text>`;
    });
  });
  container.innerHTML = `<div style="width:100%;display:flex;flex-direction:column;gap:12px;align-items:center">
    ${descBanner(opt.desc)}
    ${opt.caption ? `<div style="font-size:.8rem;color:var(--txt-muted);font-family:'JetBrains Mono',monospace;text-align:center">${opt.caption}</div>` : ''}
    <div class="tree-scroll"><svg class="tree-svg" viewBox="0 0 ${W} ${H}" width="${Math.min(W, 780)}">${edges}${boxes}</svg></div>
    ${opt.legend || ''}
  </div>`;
}

const MULTI_LEGEND = legend([C.act, 'Nodo en el camino'], [C.grn, 'Clave insertada'], [C.pur, 'División / reestructuración']);

/* ── Simulación: inserción en árbol 2-3 ── */
function tree23Build(seq, steps) {
  let root = { keys: [], children: [] };
  const isLeaf = n => n.children.length === 0;
  const snap = (hl, desc) => steps.push({ tree: cloneMulti(root), hl, desc });
  function split(node) {
    const k = [...node.keys], ch = node.children;
    const right = { keys: [k[2]], children: isLeaf(node) ? [] : ch.slice(2, 4) };
    node.keys = [k[0]]; node.children = isLeaf(node) ? [] : ch.slice(0, 2);
    snap({ split: [k[0], k[2]] }, `Nodo lleno [${k.join(', ')}]: la menor (${k[0]}) se queda, la mayor (${k[2]}) crea un nodo nuevo y la intermedia (<strong>${k[1]}</strong>) sube al padre.`);
    return { key: k[1], right };
  }
  function ins(node, key) {
    if (isLeaf(node)) {
      node.keys.push(key); node.keys.sort((a, b) => a - b);
      snap({ ins: [key] }, `Llegamos a la hoja: colocamos <strong>${key}</strong> en orden → [${node.keys.join(', ')}].`);
      return node.keys.length === 3 ? split(node) : null;
    }
    let i = 0; while (i < node.keys.length && key > node.keys[i]) i++;
    snap({ active: node.keys }, `Descendemos comparando ${key} con [${node.keys.join(', ')}].`);
    const promo = ins(node.children[i], key);
    if (promo) {
      node.keys.splice(i, 0, promo.key); node.children.splice(i + 1, 0, promo.right);
      snap({ split: [promo.key] }, `La clave ${promo.key} sube y se reorganizan los hijos del padre.`);
      return node.keys.length === 3 ? split(node) : null;
    }
    return null;
  }
  seq.forEach(key => {
    if (root.keys.length === 0 && isLeaf(root)) { root.keys = [key]; snap({ ins: [key] }, `Árbol vacío: <strong>${key}</strong> se convierte en la raíz.`); return; }
    const promo = ins(root, key);
    if (promo) { root = { keys: [promo.key], children: [root, promo.right] }; snap({ split: [promo.key] }, `La raíz se dividió: se crea una nueva raíz con <strong>${promo.key}</strong>. El árbol crece en altura.`); }
  });
  return root;
}

/* ── Simulación: inserción en árbol 2-3-4 (división descendente) ── */
function tree234Build(seq, steps) {
  let root = { keys: [], children: [] };
  const isLeaf = n => n.children.length === 0;
  const is4 = n => n.keys.length === 3;
  const snap = (hl, desc) => steps.push({ tree: cloneMulti(root), hl, desc });
  function splitChild(parent, i) {
    const c = parent.children[i], k = [...c.keys];
    const left = { keys: [k[0]], children: isLeaf(c) ? [] : c.children.slice(0, 2) };
    const right = { keys: [k[2]], children: isLeaf(c) ? [] : c.children.slice(2, 4) };
    parent.keys.splice(i, 0, k[1]);
    parent.children.splice(i, 1, left, right);
    snap({ split: [k[0], k[1], k[2]] }, `4-nodo [${k.join(', ')}] en el camino: se divide y su clave central (<strong>${k[1]}</strong>) sube al padre (DIVIDEHIJO).`);
  }
  seq.forEach(key => {
    if (root.keys.length === 0 && isLeaf(root)) { root.keys = [key]; snap({ ins: [key] }, `Árbol vacío: <strong>${key}</strong> es la raíz.`); return; }
    if (is4(root)) {
      const k = [...root.keys];
      const left = { keys: [k[0]], children: isLeaf(root) ? [] : root.children.slice(0, 2) };
      const right = { keys: [k[2]], children: isLeaf(root) ? [] : root.children.slice(2, 4) };
      root = { keys: [k[1]], children: [left, right] };
      snap({ split: [k[1]] }, `La raíz es un 4-nodo [${k.join(', ')}] → <strong>DIVIDERAIZ</strong>: sube ${k[1]} y el árbol crece.`);
    }
    let node = root;
    while (true) {
      if (isLeaf(node)) { node.keys.push(key); node.keys.sort((a, b) => a - b); snap({ ins: [key] }, `Hoja alcanzada: insertamos <strong>${key}</strong> → [${node.keys.join(', ')}].`); break; }
      let i = 0; while (i < node.keys.length && key > node.keys[i]) i++;
      snap({ active: node.keys }, `Descendemos comparando ${key} con [${node.keys.join(', ')}].`);
      if (is4(node.children[i])) { splitChild(node, i); i = 0; while (i < node.keys.length && key > node.keys[i]) i++; }
      node = node.children[i];
    }
  });
  return root;
}

/* ════════════════════════════════════════════════════════════════
   MONTÍCULO / HEAP — dibujo y simulación
════════════════════════════════════════════════════════════════ */
function _heapBoxCls(i, hl, size) {
  if (i >= size) return 'out';
  const inn = k => hl[k] && hl[k].includes(i);
  if (inn('swp')) return 'swp';
  if (inn('cmp')) return 'cmp';
  if (inn('act')) return 'act';
  if (inn('done')) return 'done';
  return '';
}

function renderHeap(container, arr, size, hl = {}, opt = {}) {
  size = (size === undefined) ? arr.length : size;
  // Árbol
  let svg = '';
  if (size > 0) {
    const depthOf = i => Math.floor(Math.log2(i + 1));
    const maxD = depthOf(size - 1);
    const gapY = 60, r = 18, padY = 24;
    const lastLevelCount = 2 ** maxD;
    const W = Math.max(320, lastLevelCount * 62);
    const H = maxD * gapY + padY * 2;
    const xOf = i => { const d = depthOf(i), start = 2 ** d - 1, idx = i - start, cnt = 2 ** d; return (idx + 0.5) / cnt * W; };
    const yOf = i => depthOf(i) * gapY + padY;
    let e = '', n = '';
    for (let i = 0; i < size; i++) {
      [2 * i + 1, 2 * i + 2].forEach(c => { if (c < size) e += `<line class="tree-edge" x1="${xOf(i)}" y1="${yOf(i)}" x2="${xOf(c)}" y2="${yOf(c)}"/>`; });
    }
    for (let i = 0; i < size; i++) {
      const cls = _heapBoxCls(i, hl, size);
      const map = { swp: 'del', cmp: 'cmp', act: 'act', done: 'found', '': '' };
      n += `<g class="tree-node ${map[cls] || ''}"><circle cx="${xOf(i)}" cy="${yOf(i)}" r="${r}"/><text x="${xOf(i)}" y="${yOf(i) + 1}">${arr[i]}</text></g>`;
    }
    svg = `<div class="tree-scroll"><svg class="tree-svg" viewBox="0 0 ${W} ${H}" width="${Math.min(W, 700)}">${e}${n}</svg></div>`;
  }
  // Vector
  const cells = arr.map((v, i) => `<div class="heap-cell"><div class="heap-box ${_heapBoxCls(i, hl, size)}">${v}</div><div class="heap-idx">${i}</div></div>`).join('');
  container.innerHTML = `<div class="heap-layout">
    ${descBanner(opt.desc)}
    ${svg}
    <div><div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--txt-muted);text-align:center;margin-bottom:6px">Representación en vector (hijos de i: 2i+1 y 2i+2)</div><div class="heap-arr">${cells}</div></div>
    ${opt.legend || ''}
  </div>`;
}

const HEAP_LEGEND = legend([C.cmp, 'Comparando'], [C.act, 'Nodo insertado'], [C.swp, 'Intercambio'], [C.grn, 'Colocado / ordenado']);

function heapInsertBuild(seq, steps) {
  const a = [];
  seq.forEach(v => {
    a.push(v); let i = a.length - 1;
    steps.push({ arr: [...a], size: a.length, hl: { act: [i] }, desc: `Insertamos <strong>${v}</strong> al final (posición ${i}) para mantener el árbol completo.` });
    while (i > 0) {
      const p = (i - 1) >> 1;
      steps.push({ arr: [...a], size: a.length, hl: { cmp: [i, p] }, desc: `Comparamos ${a[i]} con su padre ${a[p]}.` });
      if (a[i] > a[p]) {
        const ai = a[i], ap = a[p];
        [a[i], a[p]] = [a[p], a[i]];
        steps.push({ arr: [...a], size: a.length, hl: { swp: [i, p] }, desc: `${ai} &gt; ${ap} → intercambiamos (el elemento <strong>asciende</strong>).` });
        i = p;
      } else { steps.push({ arr: [...a], size: a.length, hl: { done: [i] }, desc: `${a[i]} ≤ ${a[p]}: ya cumple la propiedad de montículo máximo. Fin de la inserción.` }); break; }
    }
    if (i === 0) steps.push({ arr: [...a], size: a.length, hl: { done: [0] }, desc: `${a[0]} llega a la raíz: es el máximo actual.` });
  });
  return a;
}

function _siftDown(a, i, size, steps, extra = {}) {
  while (true) {
    let l = 2 * i + 1, r = 2 * i + 2, big = i;
    if (l < size) steps.push({ arr: [...a], size, hl: { ...extra, cmp: [i, l, r < size ? r : l].filter(x => x < size) }, desc: `Comparamos ${a[i]} con sus hijos${r < size ? ` (${a[l]}, ${a[r]})` : ` (${a[l]})`}.` });
    if (l < size && a[l] > a[big]) big = l;
    if (r < size && a[r] > a[big]) big = r;
    if (big !== i) {
      const ai = a[i], ab = a[big];
      [a[i], a[big]] = [a[big], a[i]];
      steps.push({ arr: [...a], size, hl: { ...extra, swp: [i, big] }, desc: `El mayor hijo (${ab}) es mayor que ${ai} → se intercambian (<strong>se hunde</strong>).` });
      i = big;
    } else { steps.push({ arr: [...a], size, hl: { ...extra, act: [i] }, desc: `${a[i]} es mayor o igual que sus hijos: montículo restaurado.` }); break; }
  }
}

function heapDeleteBuild(heap, count, steps) {
  const a = [...heap]; let size = a.length;
  for (let d = 0; d < count; d++) {
    steps.push({ arr: [...a], size, hl: { act: [0] }, desc: `<strong>Borrado del máximo</strong>: la raíz ${a[0]} es el elemento a extraer.` });
    const last = size - 1;
    const r0 = a[0], rl = a[last];
    [a[0], a[last]] = [a[last], a[0]];
    steps.push({ arr: [...a], size, hl: { swp: [0, last] }, desc: `Sustituimos la raíz por el último elemento (${rl}) y retiramos ${r0} del montículo.` });
    size--;
    steps.push({ arr: [...a], size, hl: { done: [size], act: [0] }, desc: `${r0} queda fuera. Ahora <strong>hundimos</strong> ${a[0]} hasta restaurar el montículo.` });
    _siftDown(a, 0, size, steps, { done: [] });
  }
  return a;
}

function heapsortBuild(input, steps) {
  const a = [...input]; const n = a.length;
  steps.push({ arr: [...a], size: n, hl: {}, desc: `Vector inicial [${a.join(', ')}]. Fase 1: construir un montículo máximo.` });
  for (let i = (n >> 1) - 1; i >= 0; i--) {
    steps.push({ arr: [...a], size: n, hl: { act: [i] }, desc: `Aplicamos "hundir" desde el nodo ${i} para ir formando el montículo.` });
    _siftDown(a, i, n, steps);
  }
  steps.push({ arr: [...a], size: n, hl: {}, desc: `Montículo máximo construido. Fase 2: extraer el máximo repetidamente al final del vector.` });
  for (let size = n; size > 1; size--) {
    const last = size - 1, root = a[0];
    [a[0], a[last]] = [a[last], a[0]];
    steps.push({ arr: [...a], size: size, hl: { swp: [0, last] }, desc: `Intercambiamos la raíz (máximo ${root}) con la posición ${last}: queda ordenada al final.` });
    // marca ordenados
    const doneIdx = []; for (let k = last; k < n; k++) doneIdx.push(k);
    steps.push({ arr: [...a], size: last, hl: { done: doneIdx }, desc: `${root} ya está en su sitio. Reducimos el montículo y hundimos la nueva raíz.` });
    _siftDown(a, 0, last, steps, { done: doneIdx });
  }
  steps.push({ arr: [...a], size: 0, hl: { done: a.map((_, i) => i) }, desc: `✅ Vector ordenado: [${a.join(', ')}]. Coste O(n·log n).` });
  return a;
}

/* ════════════════════════════════════════════════════════════════
   TABLAS HASH — dibujo y simulación
════════════════════════════════════════════════════════════════ */
function renderHashClosed(container, table, B, step) {
  const rows = [];
  for (let i = 0; i < B; i++) {
    let cls = 'hash-slot';
    if (table[i] === undefined || table[i] === null) cls += ' empty';
    else cls += ' occ';
    if (step.probe === i) cls = 'hash-slot probe';
    if (step.placed === i) cls = 'hash-slot ins';
    const val = (table[i] === undefined || table[i] === null) ? '·' : table[i];
    rows.push(`<div class="hash-row"><span class="hash-slot-idx">${i}</span><div class="${cls}">${val}</div></div>`);
  }
  const side = `<div class="hash-side"><div class="hs-title">Datos</div>
    B = <code>${B}</code><br>H(x) = <code>x mod ${B}</code><br>Redispersión: <code>${step.strategy || 'siguiente posición'}</code>
    ${step.tries !== undefined ? `<div style="margin-top:8px">Intentos para ${step.value}: <strong>${step.tries}</strong></div>` : ''}</div>`;
  container.innerHTML = `<div style="width:100%;display:flex;flex-direction:column;gap:12px;align-items:center">
    ${descBanner(step.desc)}
    <div class="hash-layout"><div class="hash-table">${rows.join('')}</div>${side}</div>
    ${legend([C.cmp, 'Sondeo'], [C.grn, 'Insertado'], ['#eff6ff', 'Ocupado'])}
  </div>`;
}

function hashClosedBuild(B, elems, steps) {
  const table = new Array(B).fill(null);
  elems.forEach(x => {
    const h0 = x % B;
    let i = 0, idx = h0, tries = 1;
    steps.push({ table: [...table], probe: idx, value: x, tries, desc: `Insertar <strong>${x}</strong>: H(${x}) = ${x} mod ${B} = <strong>${idx}</strong>.` });
    while (table[idx] !== null) {
      i++; idx = (h0 + i) % B; tries++;
      steps.push({ table: [...table], probe: idx, value: x, tries, desc: `Colisión → redispersión "siguiente posición": h${i} = (${h0}+${i}) mod ${B} = <strong>${idx}</strong>.` });
    }
    table[idx] = x;
    steps.push({ table: [...table], placed: idx, value: x, tries, desc: `Casilla ${idx} libre → colocamos <strong>${x}</strong> (${tries} ${tries === 1 ? 'intento' : 'intentos'}).` });
  });
  return { table, steps };
}

function renderHashOpen(container, buckets, B, step) {
  const rows = [];
  for (let i = 0; i < B; i++) {
    const chain = buckets[i];
    const nodes = chain.length
      ? chain.map((v, j) => `<div class="chain-node ${(step.bucket === i && step.insVal === v && j === chain.length - 1) ? 'ins' : ''}">${v}</div>`).join('<span class="chain-arrow">→</span>')
      : '<span style="color:var(--txt-muted);font-size:.8rem">∅</span>';
    rows.push(`<div class="hash-row"><span class="hash-slot-idx">${i}</span><div class="hash-chain">${nodes}</div></div>`);
  }
  const side = `<div class="hash-side"><div class="hs-title">Datos</div>
    B = <code>${B}</code><br>H(x) = <code>x mod ${B}</code><br>Colisiones → <strong>lista enlazada</strong> (encadenamiento).
    <div style="margin-top:8px;font-size:.78rem;color:var(--txt-muted)">Sin límite en el nº de elementos por casilla.</div></div>`;
  container.innerHTML = `<div style="width:100%;display:flex;flex-direction:column;gap:12px;align-items:center">
    ${descBanner(step.desc)}
    <div class="hash-layout"><div class="hash-table">${rows.join('')}</div>${side}</div>
    ${legend([C.grn, 'Recién insertado'], ['#eff6ff', 'En la lista'])}
  </div>`;
}

function hashOpenBuild(B, elems, steps) {
  const buckets = Array.from({ length: B }, () => []);
  elems.forEach(x => {
    const h = x % B;
    steps.push({ buckets: buckets.map(b => [...b]), bucket: h, desc: `Insertar <strong>${x}</strong>: H(${x}) = ${x} mod ${B} = <strong>${h}</strong>.` });
    buckets[h].push(x);
    steps.push({ buckets: buckets.map(b => [...b]), bucket: h, insVal: x, desc: `Añadimos ${x} a la lista de la casilla ${h}${buckets[h].length > 1 ? ' (colisión resuelta por encadenamiento)' : ''}.` });
  });
  return { buckets, steps };
}

/* ════════════════════════════════════════════════════════════════
   GRAFOS — dibujo y recorridos DFS / BFS
════════════════════════════════════════════════════════════════ */
const PED_GRAPH = {
  directed: true,
  nodes: { 1: [160, 38], 2: [66, 118], 3: [254, 118], 4: [66, 214], 5: [254, 214], 6: [160, 292] },
  adj: { 1: [2, 3], 2: [4], 3: [4, 5], 4: [6], 5: [6], 6: [] },
  W: 330, H: 330
};

function renderGraph(container, g, step) {
  const R = 19;
  let edges = '', arrows = '';
  Object.entries(g.adj).forEach(([u, outs]) => {
    outs.forEach(v => {
      const [x1, y1] = g.nodes[u], [x2, y2] = g.nodes[v];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const sx = x1 + ux * R, sy = y1 + uy * R, ex = x2 - ux * R, ey = y2 - uy * R;
      const key = `${u}-${v}`;
      let cls = 'gedge';
      if (step.treeEdges && step.treeEdges.includes(key)) cls = 'gedge arb';
      if (step.curEdge === key) cls = 'gedge cur';
      edges += `<line class="${cls}" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" marker-end="url(#ah)"/>`;
    });
  });
  let nodes = '';
  Object.entries(g.nodes).forEach(([id, [x, y]]) => {
    let cls = '';
    if (step.current == id) cls = 'cur';
    else if (step.visited && step.visited.includes(+id)) cls = 'done';
    else if (step.frontier && step.frontier.includes(+id)) cls = 'act';
    nodes += `<g class="gnode ${cls}"><circle cx="${x}" cy="${y}" r="${R}"/><text x="${x}" y="${y + 1}">${id}</text></g>`;
  });
  const svg = `<svg class="tree-svg" viewBox="0 0 ${g.W} ${g.H}" width="300">
    <defs><marker id="ah" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#94a3b8"/></marker></defs>
    ${edges}${nodes}</svg>`;

  const adjList = Object.entries(g.adj).map(([u, outs]) =>
    `<div style="font-size:.8rem;font-family:'JetBrains Mono',monospace"><strong>${u}</strong> → ${outs.length ? outs.join(', ') : '∅'}</div>`).join('');
  const panel = step.panelCells
    ? `<div><div class="q-title">${step.panelTitle}</div><div class="q-cells">${step.panelCells.length ? step.panelCells.map(c => `<div class="q-cell">${c}</div>`).join('') : '<div class="q-cell empty">∅</div>'}</div></div>`
    : '';
  const orderHTML = `<div><div class="q-title">Orden de visita</div><div class="order-list">${(step.order || []).map(v => `<div class="order-tag">${v}</div>`).join('<span class="order-arrow">→</span>') || '<span style="color:var(--txt-muted)">—</span>'}</div></div>`;

  container.innerHTML = `<div style="width:100%;display:flex;flex-direction:column;gap:12px;align-items:center">
    ${descBanner(step.desc)}
    <div class="graph-layout">
      ${svg}
      <div class="gqueue">
        <div><div class="q-title">Adyacencia (salida)</div>${adjList}</div>
        ${panel}
        ${orderHTML}
      </div>
    </div>
    ${legend([C.act, 'En la estructura'], [C.act, ''], [C.grn, 'Visitado'], [C.grn, 'Arco del árbol'])}
  </div>`;
}

function dfsBuild(g, start, steps) {
  const visited = [], order = [], treeEdges = [], stack = [];
  function dfs(u, parent) {
    visited.push(u); order.push(u); stack.push(u);
    if (parent !== null) treeEdges.push(`${parent}-${u}`);
    steps.push({ current: u, visited: [...visited], order: [...order], treeEdges: [...treeEdges], frontier: [...stack], panelTitle: 'Pila (recursión)', panelCells: [...stack], desc: `Visitamos <strong>${u}</strong> y lo marcamos. Exploramos sus adyacentes en orden.` });
    for (const w of g.adj[u]) {
      if (!visited.includes(w)) {
        steps.push({ current: u, visited: [...visited], order: [...order], treeEdges: [...treeEdges], curEdge: `${u}-${w}`, frontier: [...stack], panelTitle: 'Pila (recursión)', panelCells: [...stack], desc: `Desde ${u} el vecino ${w} no está visitado → arco del árbol, bajamos a ${w}.` });
        dfs(w, u);
      } else {
        steps.push({ current: u, visited: [...visited], order: [...order], treeEdges: [...treeEdges], curEdge: `${u}-${w}`, frontier: [...stack], panelTitle: 'Pila (recursión)', panelCells: [...stack], desc: `Desde ${u} el vecino ${w} ya está visitado → no es arco del árbol.` });
      }
    }
    stack.pop();
    steps.push({ current: parent, visited: [...visited], order: [...order], treeEdges: [...treeEdges], frontier: [...stack], panelTitle: 'Pila (recursión)', panelCells: [...stack], desc: `Terminados los adyacentes de ${u}: retrocedemos${parent !== null ? ` a ${parent}` : ''}.` });
  }
  steps.push({ current: null, visited: [], order: [], treeEdges: [], frontier: [], panelTitle: 'Pila (recursión)', panelCells: [], desc: `DFS (recorrido en profundidad) desde <strong>${start}</strong>, adyacencia de menor a mayor. Generaliza el preorden.` });
  dfs(start, null);
  steps.push({ current: null, visited: [...visited], order: [...order], treeEdges: [...treeEdges], frontier: [], panelTitle: 'Pila (recursión)', panelCells: [], desc: `✅ DFS completo. Orden: ${order.join(', ')}.` });
}

function bfsBuild(g, start, steps) {
  const visited = [start], order = [], treeEdges = [], queue = [start];
  steps.push({ current: null, visited: [start], order: [], treeEdges: [], frontier: [start], panelTitle: 'Cola', panelCells: [start], desc: `BFS (recorrido en anchura) desde <strong>${start}</strong>: encolamos el origen y lo marcamos como visitado.` });
  while (queue.length) {
    const u = queue.shift(); order.push(u);
    steps.push({ current: u, visited: [...visited], order: [...order], treeEdges: [...treeEdges], frontier: [...queue], panelTitle: 'Cola', panelCells: [...queue], desc: `Desencolamos y visitamos <strong>${u}</strong>. Recorremos sus adyacentes.` });
    for (const w of g.adj[u]) {
      if (!visited.includes(w)) {
        visited.push(w); queue.push(w); treeEdges.push(`${u}-${w}`);
        steps.push({ current: u, visited: [...visited], order: [...order], treeEdges: [...treeEdges], curEdge: `${u}-${w}`, frontier: [...queue], panelTitle: 'Cola', panelCells: [...queue], desc: `${w} no visitado → lo visitamos, lo encolamos y marcamos el arco ${u}→${w} como arco del árbol.` });
      } else {
        steps.push({ current: u, visited: [...visited], order: [...order], treeEdges: [...treeEdges], curEdge: `${u}-${w}`, frontier: [...queue], panelTitle: 'Cola', panelCells: [...queue], desc: `${w} ya estaba visitado → no se encola.` });
      }
    }
  }
  steps.push({ current: null, visited: [...visited], order: [...order], treeEdges: [...treeEdges], frontier: [], panelTitle: 'Cola', panelCells: [], desc: `✅ BFS completo. Orden: ${order.join(', ')}.` });
}

/* ── Representación: construcción de la matriz de adyacencia ── */
function renderAdj(container, g, step) {
  const ids = Object.keys(g.nodes);
  let head = '<tr><th></th>' + ids.map(i => `<th>${i}</th>`).join('') + '</tr>';
  let body = '';
  ids.forEach(i => {
    let row = `<th>${i}</th>`;
    ids.forEach(j => {
      const on = step.matrix[i] && step.matrix[i][j];
      const cur = step.cur && step.cur[0] == i && step.cur[1] == j;
      row += `<td class="${cur ? 'cur' : (on ? 'one' : '')}">${on ? 1 : 0}</td>`;
    });
    body += `<tr>${row}</tr>`;
  });
  const R = 19;
  let edges = '', nodes = '';
  Object.entries(g.adj).forEach(([u, outs]) => outs.forEach(v => {
    const [x1, y1] = g.nodes[u], [x2, y2] = g.nodes[v];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const cls = (step.cur && step.cur[0] == u && step.cur[1] == v) ? 'gedge cur' : 'gedge';
    edges += `<line class="${cls}" x1="${x1 + ux * R}" y1="${y1 + uy * R}" x2="${x2 - ux * R}" y2="${y2 - uy * R}" marker-end="url(#ah2)"/>`;
  }));
  Object.entries(g.nodes).forEach(([id, [x, y]]) => { nodes += `<g class="gnode"><circle cx="${x}" cy="${y}" r="${R}"/><text x="${x}" y="${y + 1}">${id}</text></g>`; });
  const svg = `<svg class="tree-svg" viewBox="0 0 ${g.W} ${g.H}" width="280"><defs><marker id="ah2" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#94a3b8"/></marker></defs>${edges}${nodes}</svg>`;
  container.innerHTML = `<div style="width:100%;display:flex;flex-direction:column;gap:12px;align-items:center">
    ${descBanner(step.desc)}
    <div class="graph-layout">${svg}<table class="adj-tbl">${head}${body}</table></div>
    ${legend([C.act, 'Arco actual'], ['#eff6ff', 'A(i,j)=1'])}
  </div>`;
}

function adjMatrixBuild(g, steps) {
  const ids = Object.keys(g.nodes);
  const matrix = {}; ids.forEach(i => { matrix[i] = {}; ids.forEach(j => matrix[i][j] = 0); });
  steps.push({ matrix: JSON.parse(JSON.stringify(matrix)), desc: `Matriz de adyacencia de un grafo de ${ids.length} vértices: A(i,j)=1 si existe el arco (i,j), 0 en caso contrario.` });
  Object.entries(g.adj).forEach(([u, outs]) => outs.forEach(v => {
    matrix[u][v] = 1;
    steps.push({ matrix: JSON.parse(JSON.stringify(matrix)), cur: [u, v], desc: `Existe el arco ${u}→${v} → marcamos A(${u},${v}) = <strong>1</strong>.` });
  }));
  steps.push({ matrix: JSON.parse(JSON.stringify(matrix)), desc: `Matriz completa. En un grafo dirigido no tiene por qué ser simétrica; la diagonal es 0 (sin arcos reflexivos).` });
  return steps;
}

/* ════════════════════════════════════════════════════════════════
   VISUALIZADORES DE TEORÍA
════════════════════════════════════════════════════════════════ */

/* Árbol de ejemplo para los recorridos */
function _sampleTree() {
  return { v: 50, l: { v: 30, l: { v: 20, l: null, r: null }, r: { v: 40, l: null, r: null } },
    r: { v: 70, l: { v: 60, l: null, r: null }, r: { v: 80, l: null, r: null } } };
}

/* Recorridos (factoría) */
function makeTraversal(kind, name, shortName) {
  const labels = { pre: 'Preorden (RID)', in: 'Inorden (IRD)', post: 'Postorden (IDR)', lev: 'Niveles (anchura)' };
  return {
    id: 'trav-' + kind, name, shortName,
    timeComplexity: 'O(n)', spaceComplexity: kind === 'lev' ? 'O(n)' : 'O(h)',
    description: `Recorrer un árbol es visitar cada nodo una sola vez. ${labels[kind]}: ` + ({
      pre: 'se visita la raíz, luego el subárbol izquierdo y por último el derecho.',
      in: 'se visita el subárbol izquierdo, luego la raíz y por último el derecho (en un ABB da las etiquetas ordenadas).',
      post: 'se visitan ambos subárboles (izq y der) y por último la raíz.',
      lev: 'se visitan los nodos por niveles, de la raíz hacia las hojas y de izquierda a derecha, usando una cola.'
    })[kind],
    detailedText: `<div class="explain">
      <p><span class="explain-tag">💡 Idea</span>${kind === 'lev'
        ? 'El recorrido por niveles usa una <strong>cola</strong>: se desencola un nodo, se visita y se encolan sus hijos.'
        : 'Los recorridos en profundidad son recursivos: cambian <em>cuándo</em> se visita la raíz respecto a los subárboles.'}</p>
      <p class="explain-key">🔑 ${({ pre: 'Preorden = Raíz · Izq · Der', in: 'Inorden = Izq · Raíz · Der', post: 'Postorden = Izq · Der · Raíz', lev: 'Niveles = de arriba abajo y de izquierda a derecha' })[kind]}.</p>
    </div>`,
    generateSteps() {
      const root = _sampleTree(); const steps = []; const order = [], visited = [];
      steps.push({ tree: cloneBin(root), order: [], visited: [], cur: null, desc: `Comenzamos el recorrido <strong>${labels[kind]}</strong>.` });
      const visit = (v, extra) => { order.push(v); steps.push({ tree: cloneBin(root), order: [...order], visited: [...visited], cur: v, desc: extra || `Visitamos <strong>${v}</strong> → lista: [${order.join(', ')}].` }); visited.push(v); };
      if (kind === 'lev') {
        const q = [root];
        while (q.length) {
          const n = q.shift();
          visit(n.v, `Desencolamos y visitamos <strong>${n.v}</strong>. Encolamos sus hijos.`);
          if (n.l) q.push(n.l); if (n.r) q.push(n.r);
        }
      } else {
        (function rec(n) {
          if (!n) return;
          if (kind === 'pre') visit(n.v);
          rec(n.l);
          if (kind === 'in') visit(n.v);
          rec(n.r);
          if (kind === 'post') visit(n.v);
        })(root);
      }
      steps.push({ tree: cloneBin(root), order: [...order], visited: [...order], cur: null, desc: `✅ ${labels[kind]}: <strong>${order.join(' ')}</strong>.` });
      return steps;
    },
    render(container, step) {
      const below = `<div><div class="q-title" style="text-align:center">Lista del recorrido</div><div class="order-list" style="justify-content:center">${step.order.map(v => `<div class="order-tag">${v}</div>`).join('<span class="order-arrow">→</span>') || '<span style="color:var(--txt-muted)">—</span>'}</div></div>`;
      renderBinTree(container, step.tree, { hl: { active: step.cur !== null ? [step.cur] : [], path: step.visited }, below, legend: legend([C.act, 'Nodo visitado ahora'], ['#eff6ff', 'Ya visitados']) });
    }
  };
}

const ALGO_PREORDEN = makeTraversal('pre', 'Recorrido en Preorden (RID)', 'Preorden');
const ALGO_INORDEN = makeTraversal('in', 'Recorrido en Inorden (IRD)', 'Inorden');
const ALGO_POSTORDEN = makeTraversal('post', 'Recorrido en Postorden (IDR)', 'Postorden');
const ALGO_NIVELES = makeTraversal('lev', 'Recorrido por Niveles (anchura)', 'Niveles');

/* ABB — Inserción */
const ALGO_ABB_INSERT = {
  id: 'abb-insert', name: 'Árbol Binario de Búsqueda — Inserción', shortName: 'ABB · Inserción',
  timeComplexity: 'O(log n) medio / O(n) peor', spaceComplexity: 'O(n)',
  description: 'En un ABB todo elemento del subárbol izquierdo es menor que la raíz y todo el del derecho es mayor. Para insertar, se compara con cada nodo bajando hasta encontrar el hueco (una hoja).',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">💡 Idea</span>Se desciende comparando: si el valor es menor vamos a la izquierda, si es mayor a la derecha. Se inserta donde falte un hijo.</p>
    <p class="explain-key">🔑 El recorrido <strong>inorden</strong> de un ABB devuelve las etiquetas ordenadas ascendentemente.</p></div>`,
  generateSteps() {
    const steps = [];
    steps.push({ tree: null, hl: {}, desc: 'Partimos de un ABB vacío. Insertaremos: 50, 30, 70, 20, 40, 60, 80, 45, 35.' });
    bstBuild([50, 30, 70, 20, 40, 60, 80, 45, 35], steps);
    return steps;
  },
  render(container, step) { renderBinTree(container, step.tree, { hl: step.hl, caption: 'Árbol Binario de Búsqueda', legend: TREE_LEGEND }); }
};

/* ABB — Borrado */
const ALGO_ABB_DELETE = {
  id: 'abb-delete', name: 'Árbol Binario de Búsqueda — Borrado', shortName: 'ABB · Borrado',
  timeComplexity: 'O(log n) medio / O(n) peor', spaceComplexity: 'O(n)',
  description: 'Borrar en un ABB tiene tres casos: nodo hoja (se elimina), nodo con un hijo (se sustituye por su hijo) y nodo con dos hijos (se sustituye por el menor del subárbol derecho —o el mayor del izquierdo—).',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">⚙️ Casos</span><strong>Hoja</strong>: se quita. <strong>Un hijo</strong>: el hijo ocupa su lugar. <strong>Dos hijos</strong>: se reemplaza la etiqueta por el mínimo del subárbol derecho y se borra ese mínimo.</p>
    <p class="explain-key">🔑 Sustituir por el menor de la derecha (o el mayor de la izquierda) mantiene la propiedad de ABB.</p></div>`,
  generateSteps() {
    const steps = [];
    const root = bstBuild([50, 30, 70, 20, 40, 60, 80, 45], null);
    steps.push({ tree: cloneBin(root), hl: {}, desc: 'ABB de partida (ya construido). Borraremos: 20 (hoja), 70 (dos hijos) y 30 (dos hijos).' });
    const ref = { root };
    bstDelete(ref, 20, steps);
    bstDelete(ref, 70, steps);
    bstDelete(ref, 30, steps);
    steps.push({ tree: cloneBin(ref.root), hl: {}, desc: '✅ Borrados completados manteniendo la propiedad de ABB.' });
    return steps;
  },
  render(container, step) { renderBinTree(container, step.tree, { hl: step.hl, caption: 'Árbol Binario de Búsqueda', legend: TREE_LEGEND }); }
};

/* AVL — Inserción */
const ALGO_AVL = {
  id: 'avl-insert', name: 'Árbol AVL — Inserción y rotaciones', shortName: 'AVL · Inserción',
  timeComplexity: 'O(log n)', spaceComplexity: 'O(n)',
  description: 'Un AVL es un ABB equilibrado en altura: para cada nodo, las alturas de sus subárboles difieren como mucho en 1 (FE ∈ {-1, 0, +1}). Tras insertar, se actualizan los factores de equilibrio desde la hoja hacia la raíz y se aplica una rotación (II, DD, ID o DI) si algún nodo se desequilibra.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">💡 FE</span>Factor de equilibrio = altura(dcha) − altura(izq). Debe mantenerse en {-1, 0, +1}.</p>
    <p><span class="explain-tag">🔄 Rotaciones</span><strong>II</strong> y <strong>DD</strong> son simples; <strong>ID</strong> y <strong>DI</strong> son dobles.</p>
    <p class="explain-key">🔑 Una inserción provoca <strong>como mucho una rotación</strong>. La altura se mantiene en O(log n).</p></div>`,
  generateSteps() {
    const steps = [];
    steps.push({ tree: null, showFE: true, hl: {}, desc: 'AVL vacío. Insertaremos 10, 20, 30, 40, 50, 25 para provocar rotaciones.' });
    avlBuild([10, 20, 30, 40, 50, 25], steps);
    steps.push({ tree: steps[steps.length - 1].tree, showFE: true, hl: {}, desc: '✅ AVL final equilibrado (todos los FE ∈ {-1, 0, +1}).' });
    return steps;
  },
  render(container, step) { renderBinTree(container, step.tree, { hl: step.hl, showFE: true, caption: 'Árbol AVL (el número morado es el FE)', legend: TREE_LEGEND }); }
};

/* Árbol 2-3 */
const ALGO_23 = {
  id: 'tree-23', name: 'Árbol 2-3 — Inserción', shortName: 'Árbol 2-3',
  timeComplexity: 'O(log n)', spaceComplexity: 'O(n)',
  description: 'Árbol multicamino de búsqueda equilibrado: los nodos tienen 2 hijos y 1 clave (2-nodo) o 3 hijos y 2 claves (3-nodo). Todas las hojas están al mismo nivel. La inserción se hace en las hojas; si un nodo se llena (3 claves), se divide y la clave intermedia sube al padre.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">⚙️ División</span>Al insertar en un 3-nodo hay 3 claves: la menor se queda, la mayor forma un nodo nuevo y la intermedia sube al padre. Esto puede propagarse hasta la raíz (el árbol crece por arriba).</p>
    <p class="explain-key">🔑 La altura de un 2-3 con n elementos está entre log₃(n+1) y log₂(n+1). Las reestructuraciones van de las hojas a la raíz.</p></div>`,
  generateSteps() {
    const steps = [];
    steps.push({ tree: { keys: [], children: [] }, hl: {}, desc: 'Árbol 2-3 vacío. Insertaremos: 50, 30, 80, 90, 15, 70, 60, 20, 40.' });
    tree23Build([50, 30, 80, 90, 15, 70, 60, 20, 40], steps);
    return steps;
  },
  render(container, step) { renderMulti(container, step.tree, { hl: step.hl, caption: 'Árbol 2-3 (2-nodo: 1 clave · 3-nodo: 2 claves)', legend: MULTI_LEGEND }); }
};

/* Árbol 2-3-4 */
const ALGO_234 = {
  id: 'tree-234', name: 'Árbol 2-3-4 — Inserción', shortName: 'Árbol 2-3-4',
  timeComplexity: 'O(log n)', spaceComplexity: 'O(n)',
  description: 'Generalización del 2-3: los nodos pueden tener 2, 3 o 4 hijos. La inserción es descendente: al bajar buscando la hoja, cada 4-nodo que se encuentra se divide antes de continuar (DIVIDERAIZ si es la raíz, DIVIDEHIJO si no). Así nunca se intenta insertar en un nodo lleno.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">⚙️ Descendente</span>Se parten los 4-nodos <em>de camino hacia abajo</em>. La clave central sube al padre (que por construcción nunca está lleno).</p>
    <p class="explain-key">🔑 Las reestructuraciones van de la raíz hacia las hojas (al revés que en el 2-3). Altura entre log₄(n+1) y log₂(n+1).</p></div>`,
  generateSteps() {
    const steps = [];
    steps.push({ tree: { keys: [], children: [] }, hl: {}, desc: 'Árbol 2-3-4 vacío. Insertaremos: 20, 40, 80, 65, 90, 50, 30, 35, 32, 70, 60.' });
    tree234Build([20, 40, 80, 65, 90, 50, 30, 35, 32, 70, 60], steps);
    return steps;
  },
  render(container, step) { renderMulti(container, step.tree, { hl: step.hl, caption: 'Árbol 2-3-4 (nodos de 1, 2 o 3 claves)', legend: MULTI_LEGEND }); }
};

/* Hash cerrado */
const ALGO_HASH_CLOSED = {
  id: 'hash-closed', name: 'Tabla Hash — Dispersión cerrada', shortName: 'Hash cerrado',
  timeComplexity: 'O(1) medio', spaceComplexity: 'O(B)',
  description: 'La dispersión (hashing) usa la información del elemento para calcular su posición: H(x) = x mod B. En dispersión cerrada la tabla tiene tamaño fijo B; ante una colisión se sondean posiciones alternativas (aquí, "siguiente posición": h_i = (H(x)+i) mod B) hasta hallar una libre.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">⚠️ Colisión</span>Dos claves sinónimas (mismo H) compiten por la casilla. La <strong>redispersión</strong> lineal prueba la siguiente posición, pero produce amontonamiento.</p>
    <p class="explain-key">🔑 Búsqueda/Inserción/Borrado en O(1) medio si el factor de carga α = n/B es bajo.</p></div>`,
  generateSteps() {
    const steps = [];
    const B = 7;
    steps.push({ table: new Array(B).fill(null), desc: `Tabla de dispersión cerrada de tamaño B = ${B}. Insertaremos: 23, 14, 9, 6, 30, 12, 18.` });
    hashClosedBuild(B, [23, 14, 9, 6, 30, 12, 18], steps);
    steps.push({ table: steps[steps.length - 1].table, desc: '✅ Tabla llena. Con 7 casillas y 7 elementos, α = 1 (caso extremo).' });
    steps.forEach(s => s._B = B);
    return steps;
  },
  render(container, step) { renderHashClosed(container, step.table, step._B || 7, step); }
};

/* Hash abierto */
const ALGO_HASH_OPEN = {
  id: 'hash-open', name: 'Tabla Hash — Dispersión abierta', shortName: 'Hash abierto',
  timeComplexity: 'O(1) medio', spaceComplexity: 'O(n)',
  description: 'En dispersión abierta cada casilla apunta a una lista enlazada: las colisiones se resuelven encadenando los sinónimos. No hay límite de elementos por casilla y desaparece el amontonamiento secundario.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">🔗 Encadenamiento</span>H(x) = x mod B indica la casilla; el elemento se añade a su lista. El factor de carga α puede ser mayor que 1.</p>
    <p class="explain-key">🔑 Más eficiente que la cerrada cuando la tabla se llena, pero necesita memoria extra para los nodos de la lista.</p></div>`,
  generateSteps() {
    const steps = [];
    const B = 7;
    steps.push({ buckets: Array.from({ length: B }, () => []), desc: `Tabla de dispersión abierta de tamaño B = ${B}. Insertaremos: 23, 14, 9, 6, 30, 12, 18, 25.` });
    hashOpenBuild(B, [23, 14, 9, 6, 30, 12, 18, 25], steps);
    steps.push({ buckets: steps[steps.length - 1].buckets, desc: '✅ Los sinónimos (p. ej. 23, 9 y 30 → casilla 2) conviven en listas enlazadas.' });
    steps.forEach(s => s._B = B);
    return steps;
  },
  render(container, step) { renderHashOpen(container, step.buckets, step._B || 7, step); }
};

/* Montículo — Inserción */
const ALGO_HEAP_INSERT = {
  id: 'heap-insert', name: 'Montículo (Heap) — Inserción', shortName: 'Montículo · Inserción',
  timeComplexity: 'O(log n)', spaceComplexity: 'O(n)',
  description: 'Un heap máximo es un árbol binario completo donde cada nodo es mayor o igual que sus hijos. Se representa en un vector (hijos de i en 2i+1 y 2i+2). Para insertar, se coloca al final y se hace ascender ("flotar") intercambiándolo con su padre mientras sea mayor.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">⚙️ Ascenso</span>El elemento nuevo entra por la última posición (mantiene el árbol completo) y sube comparándose con su padre.</p>
    <p class="explain-key">🔑 Inserción y borrado en O(log n). Base de la cola de prioridad y del Heapsort.</p></div>`,
  generateSteps() {
    const steps = [];
    steps.push({ arr: [], size: 0, hl: {}, desc: 'Heap máximo vacío. Insertaremos: 2, 10, 14, 15, 20, 21.' });
    heapInsertBuild([2, 10, 14, 15, 20, 21], steps);
    steps.push({ arr: steps[steps.length - 1].arr, size: steps[steps.length - 1].size, hl: {}, desc: '✅ Montículo máximo final.' });
    return steps;
  },
  render(container, step) { renderHeap(container, step.arr, step.size, step.hl, { legend: HEAP_LEGEND }); }
};

/* Montículo — Borrado */
const ALGO_HEAP_DELETE = {
  id: 'heap-delete', name: 'Montículo (Heap) — Borrado del máximo', shortName: 'Montículo · Borrado',
  timeComplexity: 'O(log n)', spaceComplexity: 'O(n)',
  description: 'Para borrar la raíz (el máximo) se sustituye por el último elemento del montículo y se hace descender ("hundir") intercambiándolo siempre con el mayor de sus hijos hasta restaurar la propiedad de heap.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">⚙️ Hundimiento</span>La raíz se cambia por la hoja más a la derecha; luego baja mientras algún hijo sea mayor.</p>
    <p class="explain-key">🔑 Extraer el máximo repetidamente da los elementos en orden → Heapsort.</p></div>`,
  generateSteps() {
    const steps = [];
    const heap = [50, 37, 40, 35, 24, 25, 17, 23, 30, 14, 21, 10, 20];
    steps.push({ arr: [...heap], size: heap.length, hl: {}, desc: 'Montículo máximo de partida. Realizaremos dos borrados del máximo.' });
    heapDeleteBuild(heap, 2, steps);
    steps.push({ arr: steps[steps.length - 1].arr, size: steps[steps.length - 1].size, hl: {}, desc: '✅ Tras dos borrados, la propiedad de montículo se mantiene.' });
    return steps;
  },
  render(container, step) { renderHeap(container, step.arr, step.size, step.hl, { legend: HEAP_LEGEND }); }
};

/* Heapsort */
const ALGO_HEAPSORT = {
  id: 'heapsort', name: 'Heapsort — Ordenación con montículo', shortName: 'Heapsort',
  timeComplexity: 'O(n log n)', spaceComplexity: 'O(1)',
  description: 'Ordena un vector en dos fases: (1) construye un montículo máximo, y (2) intercambia repetidamente la raíz (máximo) con el último elemento del montículo, reduce su tamaño y hunde la nueva raíz. Trabaja sobre un único vector, in situ.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">⚙️ Dos fases</span>Se aprovecha que la parte izquierda del vector es el heap y la derecha va acumulando los ya ordenados.</p>
    <p class="explain-key">🔑 O(n·log n) garantizado y O(1) de memoria extra (in situ), aunque no es estable.</p></div>`,
  generateSteps() {
    const steps = [];
    heapsortBuild([5, 2, 7, 3, 1, 8, 4], steps);
    return steps;
  },
  render(container, step) { renderHeap(container, step.arr, step.size, step.hl, { legend: HEAP_LEGEND }); }
};

/* Representación de grafos */
const ALGO_GRAPH_REP = {
  id: 'graph-rep', name: 'Grafos — Matriz de adyacencia', shortName: 'Representación',
  timeComplexity: 'O(V²) espacio', spaceComplexity: 'O(V²)',
  description: 'Un grafo G = (V, A) puede representarse con una matriz de adyacencia n×n donde A(i,j)=1 si existe el arco (i,j). En un grafo no dirigido la matriz es simétrica; la alternativa es la lista de adyacencia (una lista de sucesores por vértice).',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">💡 Dos formas</span><strong>Matriz</strong>: consulta de arco en O(1) pero O(V²) de espacio. <strong>Lista</strong>: espacio proporcional a los arcos, mejor para grafos dispersos.</p>
    <p class="explain-key">🔑 Máx. de arcos: n(n−1)/2 (no dirigido) y n(n−1) (dirigido).</p></div>`,
  generateSteps() { return adjMatrixBuild(PED_GRAPH, []); },
  render(container, step) { renderAdj(container, PED_GRAPH, step); }
};

/* DFS */
const ALGO_DFS = {
  id: 'dfs', name: 'Grafos — Recorrido en profundidad (DFS)', shortName: 'DFS',
  timeComplexity: 'O(V + A)', spaceComplexity: 'O(V)',
  description: 'El DFS generaliza el recorrido en preorden: desde un vértice visita en profundidad todo lo accesible antes de retroceder. Usa la pila de la recursión y clasifica los arcos (del árbol, de retroceso, de avance, de cruce).',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">⚙️ Método</span>Se marca el vértice, se visita y para cada adyacente no visitado se hace DFS recursivo. Los arcos hacia nodos nuevos forman el bosque de expansión en profundidad.</p>
    <p class="explain-key">🔑 Un arco de retroceso durante el DFS indica que el grafo <strong>tiene un ciclo</strong>.</p></div>`,
  generateSteps() { const steps = []; dfsBuild(PED_GRAPH, 1, steps); return steps; },
  render(container, step) { renderGraph(container, PED_GRAPH, step); }
};

/* BFS */
const ALGO_BFS = {
  id: 'bfs', name: 'Grafos — Recorrido en anchura (BFS)', shortName: 'BFS',
  timeComplexity: 'O(V + A)', spaceComplexity: 'O(V)',
  description: 'El BFS visita primero todos los adyacentes de un vértice y después los adyacentes de éstos, nivel a nivel. Se apoya en una cola: se encola el origen y, al desencolar cada vértice, se visitan y encolan sus adyacentes no visitados.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">⚙️ Método</span>Estructura clave: la <strong>cola</strong> (FIFO). Cada vértice se marca al encolarlo para no repetirlo.</p>
    <p class="explain-key">🔑 En un grafo no ponderado, el BFS encuentra el camino más corto (en nº de arcos) desde el origen.</p></div>`,
  generateSteps() { const steps = []; bfsBuild(PED_GRAPH, 1, steps); return steps; },
  render(container, step) { renderGraph(container, PED_GRAPH, step); }
};

/* ════════════════════════════════════════════════════════════════
   DEAP — Cola de prioridad doble (montículo doble)
   Árbol binario completo (posición 1 sin usar / raíz vacía):
     · subárbol izquierdo (raíz en 2) = HEAP MÍNIMO
     · subárbol derecho  (raíz en 3) = HEAP MÁXIMO
   Condición: para cada nodo i del mínimo y su simétrico j del máximo,
   clave(i) ≤ clave(j).
════════════════════════════════════════════════════════════════ */
function deapSide(i) { let x = i; while (x > 3) x >>= 1; return x === 2 ? 'min' : 'max'; }
function deapOffset(i) { return Math.pow(2, Math.floor(Math.log2(i)) - 1); }
function deapMirrorFromMin(i, n) { let j = i + deapOffset(i); if (j > n) j = j >> 1; return j; }
function deapMirrorFromMax(i) { return i - deapOffset(i); }

function _deapSiftUp(a, i, type, n, steps) {
  const stop = type === 'min' ? 2 : 3, hp = type === 'min' ? 'mínimo' : 'máximo';
  while (i > stop) {
    const p = i >> 1;
    steps.push({ a: a.slice(), n, hl: { cmp: [i, p] }, desc: `Ascenso en el HEAP ${hp}: comparamos ${a[i]} con su padre ${a[p]}.` });
    const bad = type === 'min' ? a[i] < a[p] : a[i] > a[p];
    if (bad) { [a[i], a[p]] = [a[p], a[i]]; steps.push({ a: a.slice(), n, hl: { swp: [i, p] }, desc: `No cumple la propiedad → intercambiamos (el elemento asciende).` }); i = p; }
    else { steps.push({ a: a.slice(), n, hl: { done: [i] }, desc: `Cumple la propiedad del HEAP ${hp}. Fin del ajuste.` }); break; }
  }
}
function _deapSiftDown(a, i, type, n, steps) {
  const hp = type === 'min' ? 'mínimo' : 'máximo';
  while (true) {
    let l = 2 * i, r = 2 * i + 1, best = i;
    if (l <= n && (type === 'min' ? a[l] < a[best] : a[l] > a[best])) best = l;
    if (r <= n && (type === 'min' ? a[r] < a[best] : a[r] > a[best])) best = r;
    if (best !== i) {
      steps.push({ a: a.slice(), n, hl: { cmp: [i, l, r].filter(x => x <= n) }, desc: `Hundimiento en el HEAP ${hp}: comparamos ${a[i]} con sus hijos.` });
      [a[i], a[best]] = [a[best], a[i]];
      steps.push({ a: a.slice(), n, hl: { swp: [i, best] }, desc: `Intercambiamos con el hijo ${type === 'min' ? 'menor' : 'mayor'}.` });
      i = best;
    } else break;
  }
  return i;
}

function deapInsert(a, ref, v, steps) {
  const n = ref.n + 1; a[n] = v; ref.n = n;
  steps.push({ a: a.slice(), n, hl: { act: [n] }, desc: `Insertamos <strong>${v}</strong> en la siguiente posición libre (${n}) para mantener el árbol completo.` });
  const s = deapSide(n);
  if (s === 'max') {
    const m = deapMirrorFromMax(n);
    steps.push({ a: a.slice(), n, hl: { cmp: [n, m] }, desc: `${v} cae en el HEAP máximo. Comparamos con su simétrico del HEAP mínimo (pos ${m} = ${a[m]}): debe cumplirse mín ≤ máx.` });
    if (a[m] > a[n]) {
      [a[n], a[m]] = [a[m], a[n]];
      steps.push({ a: a.slice(), n, hl: { swp: [n, m] }, desc: `${a[m]} &gt; ${a[n]} viola la condición del DEAP → intercambiamos; el elemento pasa al HEAP mínimo.` });
      _deapSiftUp(a, m, 'min', n, steps);
    } else {
      steps.push({ a: a.slice(), n, hl: { done: [n] }, desc: `Se cumple mín ≤ máx: el elemento se queda en el HEAP máximo y asciende.` });
      _deapSiftUp(a, n, 'max', n, steps);
    }
  } else {
    const j = deapMirrorFromMin(n, n);
    steps.push({ a: a.slice(), n, hl: { cmp: [n, j] }, desc: `${v} cae en el HEAP mínimo. Comparamos con su simétrico del HEAP máximo (pos ${j} = ${a[j]}): debe cumplirse mín ≤ máx.` });
    if (a[n] > a[j]) {
      [a[n], a[j]] = [a[j], a[n]];
      steps.push({ a: a.slice(), n, hl: { swp: [n, j] }, desc: `${a[j]} &lt; ${a[n]} viola la condición → intercambiamos; el elemento pasa al HEAP máximo.` });
      _deapSiftUp(a, j, 'max', n, steps);
    } else {
      steps.push({ a: a.slice(), n, hl: { done: [n] }, desc: `Se cumple la condición: el elemento asciende en el HEAP mínimo.` });
      _deapSiftUp(a, n, 'min', n, steps);
    }
  }
}

function deapDeleteMin(a, ref, steps) {
  let n = ref.n;
  if (n < 2) return;
  steps.push({ a: a.slice(), n, hl: { act: [2] }, desc: `<strong>Borrar mínimo</strong>: es la raíz del HEAP mínimo (pos 2 = ${a[2]}).` });
  const removed = a[2], last = a[n];
  a[2] = a[n]; a[n] = undefined; n--; ref.n = n;
  steps.push({ a: a.slice(), n, hl: { act: [2] }, desc: `Lo sustituimos por el último elemento (${last}) y retiramos ${removed}. Ahora lo hundimos.` });
  if (n >= 2) {
    const p = _deapSiftDown(a, 2, 'min', n, steps);
    const q = deapMirrorFromMin(p, n);
    if (q >= 2 && q <= n && deapSide(q) === 'max' && a[p] > a[q]) {
      steps.push({ a: a.slice(), n, hl: { cmp: [p, q] }, desc: `La clave hundida (${a[p]}) supera a su simétrico del máximo (${a[q]}) → hay que corregir la condición del DEAP.` });
      [a[p], a[q]] = [a[q], a[p]];
      steps.push({ a: a.slice(), n, hl: { swp: [p, q] }, desc: `Intercambiamos con el simétrico y reajustamos ambos montículos.` });
      _deapSiftDown(a, q, 'max', n, steps);
      _deapSiftUp(a, p, 'min', n, steps);
    }
  }
}

function deapDeleteMax(a, ref, steps) {
  let n = ref.n;
  if (n < 3) {
    steps.push({ a: a.slice(), n, hl: { act: [n >= 2 ? 2 : 1] }, desc: `El HEAP máximo aún no tiene elementos propios.` });
    if (n === 2) { const rm = a[2]; a[2] = undefined; ref.n = 1; steps.push({ a: a.slice(), n: 1, hl: {}, desc: `Retiramos ${rm}.` }); }
    return;
  }
  steps.push({ a: a.slice(), n, hl: { act: [3] }, desc: `<strong>Borrar máximo</strong>: es la raíz del HEAP máximo (pos 3 = ${a[3]}).` });
  const removed = a[3], last = a[n];
  a[3] = a[n]; a[n] = undefined; n--; ref.n = n;
  steps.push({ a: a.slice(), n, hl: { act: [3] }, desc: `Lo sustituimos por el último elemento (${last}) y retiramos ${removed}. Lo hundimos en el HEAP máximo.` });
  if (n >= 3) {
    const p = _deapSiftDown(a, 3, 'max', n, steps);
    const q = deapMirrorFromMax(p);
    if (q >= 2 && deapSide(q) === 'min' && a[q] > a[p]) {
      steps.push({ a: a.slice(), n, hl: { cmp: [p, q] }, desc: `El simétrico del mínimo (${a[q]}) supera a la clave (${a[p]}) → corregimos la condición del DEAP.` });
      [a[p], a[q]] = [a[q], a[p]];
      steps.push({ a: a.slice(), n, hl: { swp: [p, q] }, desc: `Intercambiamos con el simétrico y reajustamos ambos montículos.` });
      _deapSiftDown(a, q, 'min', n, steps);
      _deapSiftUp(a, p, 'max', n, steps);
    }
  }
}

function renderDeap(container, a, n, hl = {}, opt = {}) {
  const depthOf = i => Math.floor(Math.log2(i));
  const maxD = n >= 1 ? depthOf(n) : 0;
  const gapY = 58, r = 17, padY = 22;
  const W = Math.max(360, (2 ** maxD) * 56);
  const H = maxD * gapY + padY * 2 + 12;
  const xOf = i => { const d = depthOf(i), start = 2 ** d, cnt = 2 ** d; return (i - start + 0.5) / cnt * W; };
  const yOf = i => depthOf(i) * gapY + padY;
  const clsOf = i => {
    const inn = k => hl[k] && hl[k].includes(i);
    if (inn('swp')) return 'del'; if (inn('cmp')) return 'cmp'; if (inn('act')) return 'act'; if (inn('done')) return 'found';
    if (i === 1) return ''; return deapSide(i) === 'min' ? 'dmin' : 'dmax';
  };
  let e = '', nodes = '';
  for (let i = 1; i <= n; i++) [2 * i, 2 * i + 1].forEach(c => { if (c <= n) e += `<line class="tree-edge" x1="${xOf(i)}" y1="${yOf(i)}" x2="${xOf(c)}" y2="${yOf(c)}"/>`; });
  for (let i = 1; i <= n; i++) {
    const label = i === 1 ? '∅' : a[i];
    nodes += `<g class="tree-node ${clsOf(i)}"><circle cx="${xOf(i)}" cy="${yOf(i)}" r="${r}"/><text x="${xOf(i)}" y="${yOf(i) + 1}">${label}</text></g>`;
  }
  const svg = n >= 1 ? `<div class="tree-scroll"><svg class="tree-svg" viewBox="0 0 ${W} ${H}" width="${Math.min(W, 720)}">${e}${nodes}</svg></div>` : '<div class="tree-empty">DEAP vacío</div>';
  let cells = '';
  for (let i = 1; i <= n; i++) {
    const inn = k => hl[k] && hl[k].includes(i);
    const cc = inn('swp') ? 'swp' : inn('cmp') ? 'cmp' : inn('act') ? 'act' : inn('done') ? 'done' : '';
    cells += `<div class="heap-cell"><div class="heap-box ${cc}">${i === 1 ? '∅' : a[i]}</div><div class="heap-idx">${i}</div></div>`;
  }
  container.innerHTML = `<div class="heap-layout">
    ${descBanner(opt.desc)}
    <div style="display:flex;gap:22px;font-size:.72rem;color:var(--txt-muted);font-weight:600">
      <span>◀ izquierda: <strong style="color:#2563eb">HEAP MÍNIMO</strong></span>
      <span><strong style="color:#d97706">HEAP MÁXIMO</strong> : derecha ▶</span></div>
    ${svg}
    <div><div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--txt-muted);text-align:center;margin-bottom:6px">Vector (posición 1 sin usar · hijos de i: 2i y 2i+1)</div><div class="heap-arr">${cells}</div></div>
    ${opt.legend || ''}
  </div>`;
}

const DEAP_LEGEND = legend([C.act, 'Insertado / raíz'], [C.cmp, 'Comparando'], [C.swp, 'Intercambio'], [C.grn, 'Colocado'], ['#eff6ff', 'HEAP mínimo'], ['#fff7ed', 'HEAP máximo']);

/* DEAP — Inserción */
const ALGO_DEAP_INSERT = {
  id: 'deap-insert', name: 'DEAP — Inserción', shortName: 'DEAP · Inserción',
  timeComplexity: 'O(log n)', spaceComplexity: 'O(n)',
  description: 'Un DEAP (cola de prioridad doble) es un árbol binario completo en el que la raíz está vacía, el subárbol izquierdo es un HEAP mínimo y el derecho un HEAP máximo, cumpliendo que cada nodo del mínimo es ≤ que su simétrico del máximo. Permite borrar el mínimo y el máximo en O(log n). Para insertar, se coloca al final, se compara con el nodo simétrico (intercambiando si viola la condición) y se asciende en el montículo que corresponda.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">⚙️ Simétrico</span>El simétrico de un nodo del mínimo en posición i es j = i + 2^(⌊log₂ i⌋−1) (si j &gt; n, j = j div 2).</p>
    <p class="explain-key">🔑 Tras el intercambio simétrico, el elemento asciende en su HEAP como en un montículo normal.</p></div>`,
  generateSteps() {
    const steps = [], a = [], ref = { n: 1 }; a[1] = undefined;
    steps.push({ a: a.slice(), n: 1, hl: {}, desc: 'DEAP vacío (la posición 1 no se usa). Insertaremos: 20, 45, 10, 40, 8, 50, 5, 30, 25, 15, 4.' });
    [20, 45, 10, 40, 8, 50, 5, 30, 25, 15, 4].forEach(v => deapInsert(a, ref, v, steps));
    steps.push({ a: a.slice(), n: ref.n, hl: {}, desc: '✅ DEAP final: mínimo a la izquierda, máximo a la derecha, y cada clave del mínimo ≤ su simétrica del máximo.' });
    return steps;
  },
  render(container, step) { renderDeap(container, step.a, step.n, step.hl, { legend: DEAP_LEGEND }); }
};

/* DEAP — Borrado (montículo doble: mínimo y máximo) */
const ALGO_DEAP_DELETE = {
  id: 'deap-delete', name: 'DEAP — Borrado del mínimo y del máximo', shortName: 'DEAP · Borrado',
  timeComplexity: 'O(log n)', spaceComplexity: 'O(n)',
  description: 'El DEAP permite extraer tanto el mínimo (raíz del HEAP mínimo, pos 2) como el máximo (raíz del HEAP máximo, pos 3). En ambos casos se sustituye la raíz por el último elemento del árbol, se hunde en su montículo y se comprueba que no se viole la condición del DEAP con su nodo simétrico, corrigiéndolo si es necesario.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">⚙️ Método</span>1) Intercambiar la raíz a borrar con el último elemento y eliminarlo. 2) Hundir la clave. 3) Comprobar la condición del DEAP con el simétrico y reajustar.</p>
    <p class="explain-key">🔑 "Montículo doble": borrar mínimo y máximo de forma sucesiva mantiene ambas propiedades.</p></div>`,
  generateSteps() {
    const a = []; a[1] = undefined;
    [5, 45, 10, 8, 25, 40, 15, 19, 9, 30, 20].forEach((v, k) => a[k + 2] = v);
    const ref = { n: 12 }; const steps = [];
    steps.push({ a: a.slice(), n: 12, hl: {}, desc: 'DEAP de partida. Como en un montículo doble, borraremos el mínimo y luego el máximo.' });
    deapDeleteMin(a, ref, steps);
    deapDeleteMax(a, ref, steps);
    steps.push({ a: a.slice(), n: ref.n, hl: {}, desc: '✅ Tras extraer el mínimo y el máximo, el DEAP mantiene sus propiedades.' });
    return steps;
  },
  render(container, step) { renderDeap(container, step.a, step.n, step.hl, { legend: DEAP_LEGEND }); }
};
