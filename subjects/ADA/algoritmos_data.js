/* ================================================================
   AlgoVisual — algoritmos_data.js
   Definición de los 14 algoritmos de TEORÍA + helpers compartidos
   ----------------------------------------------------------------
   Cada algoritmo expone:
     · info (name, shortName, complejidades, description, useCases)
     · generateSteps() → array de pasos precalculados (cada paso lleva .desc)
     · render(container, step) → pinta un paso concreto
   Los helpers legend() y clone2D() los usan también las prácticas.
   ================================================================ */
'use strict';

/* ── Helpers compartidos ── */
function clone2D(a) {
  return a.map(r => Array.isArray(r) ? [...r] : r);
}

function legend(...items) {
  return `<div class="legend">${items.map(it => {
    const [color, label] = it;
    return `<span class="leg-item"><span class="leg-dot" style="background:${color}"></span>${label}</span>`;
  }).join('')}</div>`;
}

/* Paleta reutilizada en las leyendas */
const C = {
  def: '#dde3ed', act: '#3b82f6', cmp: '#f59e0b',
  swp: '#ef4444', srt: '#10b981', pvt: '#8b5cf6'
};

/* ════════════════════════════════════════════════════════════════
   1. BÚSQUEDA BINARIA
════════════════════════════════════════════════════════════════ */
const ALGO_BINARY_SEARCH = {
  id: 'binary-search',
  name: 'Búsqueda Binaria', shortName: 'Búsqueda Binaria',
  timeComplexity: 'O(log n)', spaceComplexity: 'O(1)',
  useCases: 'Buscar en colecciones ordenadas descartando la mitad en cada paso.',
  description: 'Localiza un elemento en un array ordenado comparando con el elemento central y descartando en cada iteración la mitad que no puede contener el valor buscado.',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Si los datos están ordenados, no hace falta mirarlos uno a uno: comparamos con el del medio y descartamos media lista de golpe.</p>
      <p><span class="explain-tag">⚙️ Pasos</span>Miramos <code>v[mid]</code>: si es el objetivo, listo; si es menor, buscamos en la mitad derecha; si es mayor, en la izquierda. Repetimos sobre el trozo que queda.</p>
      <p class="explain-key">🔑 Cada paso reduce el problema a la mitad → O(log n). Requisito imprescindible: el array debe estar ordenado.</p>
    </div>`,
  generateSteps() {
    const arr = [3, 8, 12, 17, 23, 31, 44, 56, 68, 72, 85, 91];
    const target = 44;
    const steps = [];
    let lo = 0, hi = arr.length - 1;
    steps.push({ arr, lo, hi, mid: -1, found: -1, target,
      desc: `Buscamos <strong>${target}</strong> en un array ordenado de ${arr.length} elementos. lo=0, hi=${hi}.` });
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      steps.push({ arr, lo, hi, mid, found: -1, target,
        desc: `mid = ⌊(${lo}+${hi})/2⌋ = ${mid}. Comparamos v[${mid}]=${arr[mid]} con ${target}.` });
      if (arr[mid] === target) {
        steps.push({ arr, lo, hi, mid, found: mid, target,
          desc: `✅ v[${mid}] = ${target}. <strong>Encontrado</strong> en el índice ${mid}.` });
        break;
      } else if (arr[mid] < target) {
        steps.push({ arr, lo, hi, mid, found: -1, target,
          desc: `v[${mid}]=${arr[mid]} &lt; ${target} → descartamos la mitad izquierda. lo = ${mid + 1}.` });
        lo = mid + 1;
      } else {
        steps.push({ arr, lo, hi, mid, found: -1, target,
          desc: `v[${mid}]=${arr[mid]} &gt; ${target} → descartamos la mitad derecha. hi = ${mid - 1}.` });
        hi = mid - 1;
      }
    }
    return steps;
  },
  render(container, step) {
    const { arr, lo, hi, mid, found, target } = step;
    const blocks = arr.map((v, i) => {
      let cls = 'def';
      if (found === i) cls = 'fnd';
      else if (i === mid) cls = 'cmp';
      else if (i < lo || i > hi) cls = 'dis';
      else cls = 'act';
      let ptr = '';
      if (i === lo) ptr += `<span class="ptr ptr-l">L</span>`;
      if (i === mid) ptr += `<span class="ptr ptr-m">M</span>`;
      if (i === hi) ptr += `<span class="ptr ptr-r">H</span>`;
      return `<div class="blk-col"><div class="blk-ptr">${ptr}</div><div class="blk ${cls}">${v}</div><div class="blk-i">${i}</div></div>`;
    }).join('');
    container.innerHTML = `
      <div style="width:100%">
        <div style="text-align:center;margin-bottom:12px;font-size:.85rem;color:var(--txt-secondary)">Objetivo: <strong>${target}</strong></div>
        <div class="blk-row">${blocks}</div>
        ${legend([C.act, 'Rango activo [L..H]'], [C.cmp, 'Central (M)'], [C.srt, 'Encontrado'], [C.def, 'Descartado'])}
      </div>`;
  }
};

/* ════════════════════════════════════════════════════════════════
   Utilidades de barras (ordenación / arrays)
════════════════════════════════════════════════════════════════ */
function renderBars(container, arr, stateFn, legendItems, subtitle) {
  const max = Math.max(...arr, 1);
  const bars = arr.map((v, i) =>
    `<div class="bar-col">
       <div class="bar-val">${v}</div>
       <div class="bar ${stateFn(i)}" style="height:${Math.max(8, (v / max) * 100)}%"></div>
       <div class="bar-idx">${i}</div>
     </div>`).join('');
  container.innerHTML = `
    <div style="width:100%">
      ${subtitle ? `<div style="text-align:center;margin-bottom:10px;font-size:.8rem;color:var(--txt-muted);font-family:'JetBrains Mono',monospace">${subtitle}</div>` : ''}
      <div class="arr-wrap">${bars}</div>
      ${legend(...legendItems)}
    </div>`;
}

/* ════════════════════════════════════════════════════════════════
   2. MERGE SORT
════════════════════════════════════════════════════════════════ */
const ALGO_MERGE_SORT = {
  id: 'merge-sort',
  name: 'Ordenación por Mezcla (Merge Sort)', shortName: 'Merge Sort',
  timeComplexity: 'O(n log n)', spaceComplexity: 'O(n)',
  useCases: 'Ordenación estable y eficiente; base de la ordenación externa.',
  description: 'Divide el array por la mitad recursivamente hasta tener subarrays de un elemento y luego los fusiona de forma ordenada. Siempre O(n log n).',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Divide y vencerás: un array de 1 elemento ya está ordenado. Partimos hasta ese punto y luego <em>mezclamos</em> mitades ya ordenadas.</p>
      <p><span class="explain-tag">⚙️ Mezcla</span>Con dos mitades ordenadas, avanzamos dos punteros comparando sus primeros elementos y copiando el menor cada vez. Así se combinan en tiempo lineal.</p>
      <p class="explain-key">🔑 log n niveles de división × n trabajo de mezcla = O(n log n) <strong>garantizado</strong>. Es estable, pero usa O(n) memoria extra.</p>
    </div>`,
  generateSteps() {
    const a = [38, 27, 43, 3, 9, 82, 10];
    const steps = [];
    steps.push({ arr: [...a], range: [0, a.length - 1], write: -1, sorted: false,
      desc: `<strong>Merge Sort</strong>: dividir recursivamente y fusionar. Array inicial: [${a.join(', ')}].` });
    const merge = (l, m, r) => {
      const left = a.slice(l, m + 1), right = a.slice(m + 1, r + 1);
      let i = 0, j = 0, k = l;
      steps.push({ arr: [...a], range: [l, r], write: -1, sorted: false,
        desc: `Fusionamos [${left.join(', ')}] con [${right.join(', ')}] (posiciones ${l}..${r}).` });
      while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) { a[k] = left[i]; i++; } else { a[k] = right[j]; j++; }
        steps.push({ arr: [...a], range: [l, r], write: k, sorted: false, desc: `Colocamos ${a[k]} en la posición ${k}.` });
        k++;
      }
      while (i < left.length) { a[k] = left[i]; steps.push({ arr: [...a], range: [l, r], write: k, sorted: false, desc: `Copiamos ${a[k]} (resto izquierdo) a la posición ${k}.` }); i++; k++; }
      while (j < right.length) { a[k] = right[j]; steps.push({ arr: [...a], range: [l, r], write: k, sorted: false, desc: `Copiamos ${a[k]} (resto derecho) a la posición ${k}.` }); j++; k++; }
    };
    const sort = (l, r) => { if (l >= r) return; const m = Math.floor((l + r) / 2); sort(l, m); sort(m + 1, r); merge(l, m, r); };
    sort(0, a.length - 1);
    steps.push({ arr: [...a], range: [0, a.length - 1], write: -1, sorted: true, desc: `✅ Array ordenado: [${a.join(', ')}].` });
    return steps;
  },
  render(container, step) {
    const { arr, range = [0, arr.length - 1], write = -1, sorted = false } = step;
    const st = i => sorted ? 'srt' : (i === write ? 'swp' : (i >= range[0] && i <= range[1] ? 'cmp' : 'def'));
    renderBars(container, arr, st,
      [[C.def, 'Fuera del rango'], [C.cmp, 'Rango en fusión'], [C.swp, 'Escritura'], [C.srt, 'Ordenado']],
      `Rango en fusión: ${range[0]}..${range[1]}`);
  }
};

/* ════════════════════════════════════════════════════════════════
   3. QUICK SORT
════════════════════════════════════════════════════════════════ */
const ALGO_QUICK_SORT = {
  id: 'quick-sort',
  name: 'Ordenación Rápida (Quick Sort)', shortName: 'Quick Sort',
  timeComplexity: 'O(n log n) medio', spaceComplexity: 'O(log n)',
  useCases: 'Ordenación in-place muy rápida en la práctica (localidad de caché).',
  description: 'Elige un pivote y particiona el array (Lomuto): los menores a la izquierda, los mayores a la derecha. Luego ordena recursivamente cada mitad.',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Elegimos un <em>pivote</em> y reorganizamos el array para que a su izquierda queden los menores y a su derecha los mayores. El pivote ya está en su sitio definitivo.</p>
      <p><span class="explain-tag">⚙️ Partición</span>Recorremos con un puntero <code>j</code>; cuando <code>v[j]</code> es menor que el pivote lo mandamos a la zona izquierda con un intercambio. Al final colocamos el pivote entre ambas zonas y repetimos en cada mitad.</p>
      <p class="explain-key">🔑 En promedio O(n log n) y muy rápido en la práctica (ordena in situ). En el peor caso (pivote pésimo) degenera a O(n²).</p>
    </div>`,
  generateSteps() {
    const a = [7, 2, 9, 4, 3, 8, 1, 6];
    const steps = [];
    const sorted = new Set();
    steps.push({ arr: [...a], pivot: -1, i: -1, j: -1, lo: 0, hi: a.length - 1, sorted: [...sorted], swap: [],
      desc: `<strong>Quick Sort</strong> con partición de Lomuto. Array: [${a.join(', ')}].` });
    const qs = (lo, hi) => {
      if (lo > hi) return;
      if (lo === hi) { sorted.add(lo); return; }
      const pivot = a[hi];
      steps.push({ arr: [...a], pivot: hi, i: lo - 1, j: lo, lo, hi, sorted: [...sorted], swap: [],
        desc: `Pivote = v[${hi}] = ${pivot}. Particionamos el rango [${lo}..${hi}].` });
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        steps.push({ arr: [...a], pivot: hi, i, j, lo, hi, sorted: [...sorted], swap: [],
          desc: `Comparamos v[${j}]=${a[j]} con el pivote ${pivot}.` });
        if (a[j] < pivot) {
          i++;[a[i], a[j]] = [a[j], a[i]];
          steps.push({ arr: [...a], pivot: hi, i, j, lo, hi, sorted: [...sorted], swap: [i, j],
            desc: `v[${j}] &lt; ${pivot} → intercambiamos v[${i}] ↔ v[${j}].` });
        }
      }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      const p = i + 1; sorted.add(p);
      steps.push({ arr: [...a], pivot: p, i, j: hi, lo, hi, sorted: [...sorted], swap: [p, hi],
        desc: `Colocamos el pivote en su posición final ${p}. A su izquierda todos son menores.` });
      qs(lo, p - 1); qs(p + 1, hi);
    };
    qs(0, a.length - 1);
    const all = a.map((_, k) => k);
    steps.push({ arr: [...a], pivot: -1, i: -1, j: -1, lo: 0, hi: a.length - 1, sorted: all, allSorted: true, swap: [],
      desc: `✅ Array ordenado: [${a.join(', ')}].` });
    return steps;
  },
  render(container, step) {
    const { arr, pivot = -1, i = -1, j = -1, lo = 0, hi = arr.length - 1, sorted = [], swap = [], allSorted = false } = step;
    const S = new Set(sorted);
    const st = idx => {
      if (allSorted || S.has(idx)) return 'srt';
      if (idx === pivot) return 'pvt';
      if (swap.includes(idx)) return 'swp';
      if (idx === j) return 'cmp';
      if (idx === i) return 'act';
      if (idx < lo || idx > hi) return 'dis';
      return 'def';
    };
    renderBars(container, arr, st,
      [[C.pvt, 'Pivote'], [C.cmp, 'Comparando (j)'], [C.act, 'Frontera (i)'], [C.srt, 'En posición final']],
      `Rango [${lo}..${hi}]`);
  }
};

/* ════════════════════════════════════════════════════════════════
   4. QUICK SELECT
════════════════════════════════════════════════════════════════ */
const ALGO_QUICK_SELECT = {
  id: 'quick-select',
  name: 'Selección Rápida (Quick Select)', shortName: 'Quick Select',
  timeComplexity: 'O(n) medio', spaceComplexity: 'O(1)',
  useCases: 'Hallar el k-ésimo menor sin ordenar todo el array (medianas, percentiles).',
  description: 'Variante de Quick Sort que solo recursa en el lado donde está el índice buscado, logrando tiempo lineal en promedio para encontrar el k-ésimo menor.',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Para hallar el k-ésimo menor no hace falta ordenar todo: particionamos como en Quick Sort, pero solo seguimos por el lado donde cae la posición k.</p>
      <p><span class="explain-tag">⚙️ Pasos</span>Tras particionar, el pivote queda en un índice <code>p</code>. Si <code>p = k</code>, ya está; si <code>k</code> es menor, buscamos a la izquierda; si es mayor, a la derecha. Descartamos siempre la otra mitad.</p>
      <p class="explain-key">🔑 Al ignorar una mitad en cada paso, el coste medio baja de O(n log n) a <strong>O(n)</strong>. Ideal para medianas y percentiles.</p>
    </div>`,
  generateSteps() {
    const a = [7, 2, 9, 4, 3, 8, 1, 6];
    const kth = 4, target = kth - 1;
    const steps = [];
    steps.push({ arr: [...a], lo: 0, hi: a.length - 1, pivot: -1, target, found: -1,
      desc: `<strong>Quick Select</strong>: buscamos el ${kth}º menor (índice ${target} si estuviera ordenado). Solo recursamos en un lado.` });
    let lo = 0, hi = a.length - 1;
    while (lo <= hi) {
      const pivot = a[hi];
      steps.push({ arr: [...a], lo, hi, pivot: hi, target, found: -1,
        desc: `Pivote v[${hi}]=${pivot}. Particionamos [${lo}..${hi}].` });
      let i = lo - 1;
      for (let j = lo; j < hi; j++) if (a[j] < pivot) { i++;[a[i], a[j]] = [a[j], a[i]]; }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      const p = i + 1;
      steps.push({ arr: [...a], lo, hi, pivot: p, target, found: -1,
        desc: `El pivote ${a[p]} queda en el índice ${p}.` });
      if (p === target) {
        steps.push({ arr: [...a], lo, hi, pivot: p, target, found: p,
          desc: `✅ ${p} = objetivo. El ${kth}º menor es <strong>${a[p]}</strong>.` });
        break;
      } else if (p < target) {
        steps.push({ arr: [...a], lo: p + 1, hi, pivot: p, target, found: -1,
          desc: `${p} &lt; ${target} → buscamos a la derecha. lo = ${p + 1}.` });
        lo = p + 1;
      } else {
        steps.push({ arr: [...a], lo, hi: p - 1, pivot: p, target, found: -1,
          desc: `${p} &gt; ${target} → buscamos a la izquierda. hi = ${p - 1}.` });
        hi = p - 1;
      }
    }
    return steps;
  },
  render(container, step) {
    const { arr, lo = 0, hi = arr.length - 1, pivot = -1, target, found = -1 } = step;
    const st = idx => {
      if (found === idx) return 'fnd';
      if (idx === pivot) return 'pvt';
      if (idx === target) return 'cmp';
      if (idx < lo || idx > hi) return 'dis';
      return 'def';
    };
    renderBars(container, arr, st,
      [[C.pvt, 'Pivote'], [C.cmp, 'Índice objetivo'], [C.srt, 'Encontrado'], [C.def, 'Fuera del rango']],
      `Rango activo [${lo}..${hi}] · objetivo índice ${target}`);
  }
};

/* ════════════════════════════════════════════════════════════════
   5. FIBONACCI (Programación Dinámica)
════════════════════════════════════════════════════════════════ */
const ALGO_FIBONACCI = {
  id: 'fibonacci',
  name: 'Fibonacci (Programación Dinámica)', shortName: 'Fibonacci DP',
  timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
  useCases: 'Ejemplo canónico de solapamiento de subproblemas y memoización.',
  description: 'Calcula F(n) rellenando una tabla de abajo a arriba: F(i) = F(i-1) + F(i-2). Evita el árbol de recursión exponencial de la versión ingenua.',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>La recursión ingenua recalcula los mismos F(i) una y otra vez (crecimiento exponencial). La programación dinámica <em>guarda</em> cada resultado y lo reutiliza.</p>
      <p><span class="explain-tag">⚙️ Bottom-up</span>Partimos de los casos base F(0)=0 y F(1)=1 y rellenamos la tabla hacia adelante: cada F(i) es la suma de los dos anteriores, ya calculados.</p>
      <p class="explain-key">🔑 Es el ejemplo canónico de <strong>subproblemas solapados</strong>: pasar de O(2ⁿ) a O(n) simplemente no repitiendo trabajo.</p>
    </div>`,
  generateSteps() {
    const N = 9;
    const dp = new Array(N + 1).fill(null);
    const steps = [];
    steps.push({ dp: [...dp], cur: -1, from: [], desc: `<strong>Fibonacci DP</strong> bottom-up. Casos base: F(0)=0, F(1)=1.` });
    dp[0] = 0; steps.push({ dp: [...dp], cur: 0, from: [], desc: `Caso base F(0) = 0.` });
    dp[1] = 1; steps.push({ dp: [...dp], cur: 1, from: [], desc: `Caso base F(1) = 1.` });
    for (let i = 2; i <= N; i++) {
      dp[i] = dp[i - 1] + dp[i - 2];
      steps.push({ dp: [...dp], cur: i, from: [i - 1, i - 2],
        desc: `F(${i}) = F(${i - 1}) + F(${i - 2}) = ${dp[i - 1]} + ${dp[i - 2]} = <strong>${dp[i]}</strong>.` });
    }
    steps.push({ dp: [...dp], cur: N, from: [], done: true,
      desc: `✅ F(${N}) = ${dp[N]}. Con DP el coste pasa de O(2ⁿ) a O(n).` });
    return steps;
  },
  render(container, step) {
    const { dp, cur, from = [], done = false } = step;
    const blocks = dp.map((v, i) => {
      let cls = 'def';
      if (v === null) cls = 'dis';
      else if (done) cls = 'fnd';
      else if (i === cur) cls = 'act';
      else if (from.includes(i)) cls = 'cmp';
      return `<div class="blk-col"><div class="blk ${cls}">${v === null ? '·' : v}</div><div class="blk-i">F(${i})</div></div>`;
    }).join('');
    container.innerHTML = `
      <div style="width:100%">
        <div class="blk-row">${blocks}</div>
        ${legend([C.act, 'Calculando'], [C.cmp, 'Sumandos F(i-1), F(i-2)'], [C.srt, 'Resultado'])}
      </div>`;
  }
};

/* ════════════════════════════════════════════════════════════════
   6. COEFICIENTE BINOMIAL (Triángulo de Pascal)
════════════════════════════════════════════════════════════════ */
const ALGO_BINOMIAL = {
  id: 'binomial-coeff',
  name: 'Coeficiente Binomial C(n,k)', shortName: 'Binomial C(n,k)',
  timeComplexity: 'O(n·k)', spaceComplexity: 'O(n·k)',
  useCases: 'Combinatoria, probabilidad, triángulo de Pascal.',
  description: 'Calcula C(n,k) con programación dinámica usando la recurrencia de Pascal: C(i,j) = C(i-1,j-1) + C(i-1,j), con C(i,0)=C(i,i)=1.',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Cada número del triángulo de Pascal es la suma de los dos que tiene justo encima. Eso es exactamente C(n,k), sin multiplicar factoriales enormes.</p>
      <p><span class="explain-tag">⚙️ Pasos</span>Rellenamos fila a fila: los bordes valen 1 (C(i,0)=C(i,i)=1) y cada casilla interior se obtiene sumando sus dos "padres" de la fila anterior.</p>
      <p class="explain-key">🔑 Reutilizar los valores ya calculados evita el desbordamiento de los factoriales y da coste O(n·k).</p>
    </div>`,
  generateSteps() {
    const N = 6, K = 3;
    const dp = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(null));
    const steps = [];
    steps.push({ dp: clone2D(dp), cur: [-1, -1], parents: [], n: N, k: K,
      desc: `Queremos C(${N},${K}) = de cuántas formas se eligen ${K} elementos entre ${N}. Lo construimos con el triángulo de Pascal: cada número es la suma de los dos que tiene encima.` });
    for (let i = 0; i <= N; i++) {
      dp[i][0] = 1;
      steps.push({ dp: clone2D(dp), cur: [i, 0], parents: [], n: N, k: K, desc: `Los bordes del triángulo siempre valen 1: C(${i},0) = <strong>1</strong>.` });
      if (i > 0) {
        dp[i][i] = 1;
        steps.push({ dp: clone2D(dp), cur: [i, i], parents: [], n: N, k: K, desc: `Los bordes del triángulo siempre valen 1: C(${i},${i}) = <strong>1</strong>.` });
      }
      for (let j = 1; j < i; j++) {
        dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j];
        steps.push({ dp: clone2D(dp), cur: [i, j], parents: [[i - 1, j - 1], [i - 1, j]], n: N, k: K,
          desc: `Sumamos los dos números de encima (resaltados): ${dp[i - 1][j - 1]} + ${dp[i - 1][j]} = <strong>${dp[i][j]}</strong>. Ese es C(${i},${j}).` });
      }
    }
    steps.push({ dp: clone2D(dp), cur: [N, K], parents: [], n: N, k: K, done: true,
      desc: `✅ El número buscado es C(${N},${K}) = <strong>${dp[N][K]}</strong>.` });
    return steps;
  },
  render(container, step) {
    const { dp, cur = [-1, -1], parents = [], n, k, done = false } = step;
    const cls = (i, j) => {
      if (dp[i][j] === null || dp[i][j] === undefined) return 'mt';
      if (done && i === n && j === k) return 'tgt';
      if (cur[0] === i && cur[1] === j) return 'cur';
      if (parents.some(([pi, pj]) => pi === i && pj === j)) return 'hl';
      if (i === n && j === k) return 'tgt';
      return 'fil';
    };
    container.innerHTML = `
      <div style="width:100%;overflow-x:auto">
        <div class="pascal">
          ${Array.from({ length: n + 1 }, (_, i) =>
            `<div class="pascal-row">${Array.from({ length: i + 1 }, (_, j) =>
              `<div class="pcell ${cls(i, j)}">${dp[i][j] != null ? dp[i][j] : '·'}</div>`).join('')}</div>`).join('')}
        </div>
        ${legend([C.act, 'Calculando'], [C.cmp, 'Sumandos'], [C.srt, `Objetivo C(${n},${k})`])}
      </div>`;
  }
};

/* ════════════════════════════════════════════════════════════════
   7. MOCHILA 0/1 (Programación Dinámica)
════════════════════════════════════════════════════════════════ */
const ALGO_KNAPSACK = {
  id: 'knapsack-01',
  name: 'Mochila 0/1 (Programación Dinámica)', shortName: 'Mochila 0/1',
  timeComplexity: 'O(n·W)', spaceComplexity: 'O(n·W)',
  useCases: 'Asignación óptima de recursos con capacidad limitada.',
  description: 'Para cada objeto y capacidad decide si conviene incluirlo: dp[i][w] = máx(dp[i-1][w], dp[i-1][w-wᵢ] + vᵢ). Cada objeto se coge entero o no se coge.',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Construimos una tabla donde <code>dp[i][w]</code> es el mejor valor usando los i primeros objetos con capacidad w. La respuesta va creciendo objeto a objeto.</p>
      <p><span class="explain-tag">⚙️ Decisión</span>Para cada casilla comparamos dos opciones: <em>no coger</em> el objeto (heredar el valor de arriba) o <em>cogerlo</em> (su valor + lo mejor que cabía en la capacidad sobrante). Nos quedamos con el máximo.</p>
      <p class="explain-key">🔑 A diferencia de la voraz, aquí el objeto es indivisible (0/1). La DP explora todas las combinaciones sin repetir cálculos → O(n·W).</p>
    </div>`,
  generateSteps() {
    const items = [{ n: 'A', w: 2, v: 3 }, { n: 'B', w: 3, v: 4 }, { n: 'C', w: 4, v: 5 }, { n: 'D', w: 5, v: 6 }];
    const W = 8, n = items.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
    const steps = [];
    steps.push({ dp: clone2D(dp), cur: [-1, -1], items, W, n, desc: `Tenemos ${n} objetos y una mochila de capacidad ${W}. Rellenaremos una tabla donde cada casilla guarda el <strong>mejor valor posible</strong> usando los primeros objetos con una capacidad dada.` });
    for (let i = 1; i <= n; i++) {
      const it = items[i - 1];
      for (let w = 0; w <= W; w++) {
        if (it.w <= w) {
          const noTake = dp[i - 1][w], take = dp[i - 1][w - it.w] + it.v;
          dp[i][w] = Math.max(noTake, take);
          steps.push({ dp: clone2D(dp), cur: [i, w], items, W, n,
            desc: `Capacidad ${w}, objeto <strong>${it.n}</strong> (pesa ${it.w}, vale ${it.v}): si lo dejo fuera me quedan ${noTake}; si lo meto gano ${it.v} + los ${dp[i - 1][w - it.w]} que caben en el hueco restante = ${take}. Elijo el mayor: <strong>${dp[i][w]}</strong>.` });
        } else {
          dp[i][w] = dp[i - 1][w];
          steps.push({ dp: clone2D(dp), cur: [i, w], items, W, n,
            desc: `El objeto <strong>${it.n}</strong> pesa ${it.w} y no cabe en una capacidad de ${w}. Así que copio sin más el mejor valor que ya tenía sin él: <strong>${dp[i][w]}</strong>.` });
        }
      }
    }
    steps.push({ dp: clone2D(dp), cur: [n, W], items, W, n, done: true, desc: `✅ La esquina inferior derecha es la respuesta: con todos los objetos y capacidad ${W}, el <strong>valor máximo es ${dp[n][W]}</strong>.` });
    return steps;
  },
  render(container, step) {
    const { dp, cur = [-1, -1], items, W, n, done = false } = step;
    const head = `<tr><th></th>${Array.from({ length: W + 1 }, (_, w) => `<th>${w}</th>`).join('')}</tr>`;
    const rows = dp.map((row, i) =>
      `<tr><th>${i === 0 ? '∅' : items[i - 1].n}</th>${row.map((v, w) => {
        let cls = 'fil';
        if (done && i === n && w === W) cls = 'fin';
        else if (cur[0] === i && cur[1] === w) cls = 'cur';
        else if (v === 0) cls = 'mt';
        return `<td class="${cls}">${v}</td>`;
      }).join('')}</tr>`).join('');
    container.innerHTML = `
      <div class="dp-wrap">
        <div style="font-size:.72rem;color:var(--txt-muted);margin-bottom:6px">Filas = objetos · Columnas = capacidad</div>
        <table class="dp-tbl"><tbody>${head}${rows}</tbody></table>
      </div>`;
  }
};

/* ════════════════════════════════════════════════════════════════
   8. CORTE DE TUBOS (Programación Dinámica)
════════════════════════════════════════════════════════════════ */
const ALGO_ROD_CUTTING = {
  id: 'rod-cutting',
  name: 'Corte de Tubos', shortName: 'Corte de Tubos',
  timeComplexity: 'O(n²)', spaceComplexity: 'O(n)',
  useCases: 'Maximizar ingresos al trocear un recurso divisible en piezas.',
  description: 'Dado un tubo de longitud n y una tabla de precios por longitud, halla el ingreso máximo troceándolo: dp[i] = máx sobre c de precio[c] + dp[i-c].',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Para vender un tubo de longitud i, probamos todos los primeros cortes posibles y combinamos su precio con el mejor troceado del resto, que ya conocemos.</p>
      <p><span class="explain-tag">⚙️ Pasos</span>Calculamos <code>dp[i]</code> de menor a mayor: para cada corte <code>c</code>, el ingreso es <code>precio[c] + dp[i−c]</code>. Guardamos el máximo entre todos los cortes.</p>
      <p class="explain-key">🔑 Es la mochila "con repetición": el mismo subproblema dp[i−c] se reutiliza muchas veces → O(n²) en lugar de explorar combinaciones exponenciales.</p>
    </div>`,
  generateSteps() {
    const price = [0, 1, 5, 8, 9, 10, 17, 17, 20];
    const N = 8;
    const dp = new Array(N + 1).fill(0);
    const cut = new Array(N + 1).fill(0);
    const steps = [];
    steps.push({ dp: [...dp], cur: -1, tryLen: -1, n: N, price, desc: `Tenemos un tubo de longitud ${N} y una lista de precios por trozo. Calcularemos <code>dp[i]</code> = el máximo dinero que se saca de un tubo de longitud i, empezando por los más cortos.` });
    for (let i = 1; i <= N; i++) {
      let best = -Infinity, bestCut = 0;
      for (let c = 1; c <= i; c++) {
        const val = price[c] + dp[i - c];
        steps.push({ dp: [...dp], cur: i, tryLen: c, n: N, price,
          desc: `Tubo de largo ${i}: probamos cortar un trozo de <strong>${c}</strong> (se vende por ${price[c]}) y aprovechar el resto de largo ${i - c} lo mejor posible (${dp[i - c]}). Total: ${price[c]} + ${dp[i - c]} = <strong>${val}</strong>. Mejor opción hasta ahora: ${best === -Infinity ? val : Math.max(best, val)}.` });
        if (val > best) { best = val; bestCut = c; }
      }
      dp[i] = best; cut[i] = bestCut;
      steps.push({ dp: [...dp], cur: i, tryLen: -1, n: N, price, fixed: true,
        desc: `Para el tubo de largo ${i}, lo mejor es sacar <strong>${best}</strong> (el primer corte ideal mide ${bestCut}).` });
    }
    steps.push({ dp: [...dp], cur: N, tryLen: -1, n: N, price, done: true, desc: `✅ El máximo ingreso para el tubo de ${N} es <strong>${dp[N]}</strong>.` });
    return steps;
  },
  render(container, step) {
    const { dp, cur = -1, tryLen = -1, n, price, done = false } = step;
    const blocks = dp.map((v, i) => {
      let cls = 'def';
      if (done) cls = 'fnd';
      else if (i === cur) cls = 'act';
      else if (tryLen > 0 && cur >= 0 && i === cur - tryLen) cls = 'cmp';
      return `<div class="blk-col"><div class="blk ${cls}">${v}</div><div class="blk-i">${i}</div></div>`;
    }).join('');
    const priceInfo = price.map((p, i) => i === 0 ? '' :
      `<span style="display:inline-block;padding:3px 8px;margin:2px;border-radius:5px;font-family:'JetBrains Mono',monospace;font-size:.72rem;background:${i === tryLen ? '#fef3c7' : '#f1f5f9'};color:${i === tryLen ? '#78350f' : '#475569'}">L${i}: $${p}</span>`).join('');
    container.innerHTML = `
      <div style="width:100%;display:flex;flex-direction:column;gap:16px;align-items:center">
        <div style="text-align:center"><div style="font-size:.72rem;color:var(--txt-muted);text-transform:uppercase;font-weight:700;margin-bottom:4px">Precios por longitud</div><div style="max-width:480px">${priceInfo}</div></div>
        <div><div style="font-size:.72rem;color:var(--txt-muted);text-transform:uppercase;font-weight:700;margin-bottom:6px;text-align:center">dp[i] = ingreso máximo</div><div class="blk-row">${blocks}</div></div>
        ${legend([C.act, 'Longitud i actual'], [C.cmp, 'Subproblema dp[i-c]'], [C.srt, 'Resuelto'])}
      </div>`;
  }
};

/* ════════════════════════════════════════════════════════════════
   9. CAMBIO DE MONEDAS (Voraz)
════════════════════════════════════════════════════════════════ */
const ALGO_COIN_CHANGE = {
  id: 'coin-change',
  name: 'Cambio de Monedas (Voraz)', shortName: 'Cambio Monedas',
  timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
  useCases: 'Devolver cambio con el mínimo de monedas en sistemas canónicos.',
  description: 'Estrategia voraz: en cada paso coge la moneda de mayor valor que no supere el importe restante. Óptima para sistemas monetarios canónicos (como el euro).',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Un algoritmo voraz toma en cada paso la decisión que parece mejor <em>ahora mismo</em>, sin dar marcha atrás. Aquí: usar la moneda más grande que quepa.</p>
      <p><span class="explain-tag">⚙️ Pasos</span>Restamos al importe la mayor moneda posible tantas veces como quepa, luego pasamos a la siguiente moneda menor, hasta llegar a cero.</p>
      <p class="explain-key">🔑 ¡Cuidado! Es óptima solo en sistemas <strong>canónicos</strong> (euro, dólar). Con monedas como {1, 3, 4} y cambio 6, la voraz falla (4+1+1) frente al óptimo (3+3).</p>
    </div>`,
  generateSteps() {
    const coins = [50, 20, 10, 5, 2, 1];
    const amount = 68;
    const steps = [];
    const chosen = [];
    let remaining = amount;
    steps.push({ coins, amount, remaining, cur: -1, chosen: [],
      desc: `<strong>Cambio Voraz</strong>: devolver ${amount} con el mínimo de monedas. Sistema: [${coins.join(', ')}].` });
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];
      steps.push({ coins, amount, remaining, cur: i, chosen: [...chosen],
        desc: c <= remaining
          ? `Cogemos la moneda más grande que cabe: <strong>${c}</strong> (≤ ${remaining} restante).`
          : `La moneda de ${c} es mayor que lo que queda (${remaining}), la saltamos y probamos una menor.` });
      while (remaining >= c) {
        remaining -= c; chosen.push(c);
        steps.push({ coins, amount, remaining, cur: i, chosen: [...chosen],
          desc: `Cogemos una moneda de ${c}. Importe restante: ${remaining}.` });
      }
    }
    steps.push({ coins, amount, remaining: 0, cur: -1, chosen: [...chosen], done: true,
      desc: `✅ ${chosen.length} monedas: ${chosen.join(' + ')} = ${amount}.` });
    return steps;
  },
  render(container, step) {
    const { coins, amount, remaining, cur = -1, chosen = [], done = false } = step;
    const metal = c => c <= 5 ? 'copper' : '';   // céntimos pequeños = cobre; el resto = oro
    const coinRow = coins.map((c, i) => {
      let cls = 'av';
      if (done) cls = 'av';
      else if (i === cur) cls = 'cur';
      else if (c > remaining) cls = 'na';
      return `<div class="coin ${metal(c)} ${cls}">${c}</div>`;
    }).join('');
    const chosenRow = chosen.length
      ? `<div class="coins-row">${chosen.map(c => `<div class="coin ${metal(c)}">${c}</div>`).join('')}</div>`
      : `<div style="color:var(--txt-muted);font-size:.8rem">Aún no se ha cogido ninguna moneda</div>`;
    container.innerHTML = `
      <div class="coin-ui">
        <div style="text-align:center"><div style="font-size:.72rem;color:var(--txt-muted);text-transform:uppercase;font-weight:700">Restante</div><div class="big-num" style="color:${remaining === 0 ? 'var(--green)' : 'var(--blue)'}">${remaining}</div></div>
        <div><div style="font-size:.72rem;color:var(--txt-muted);text-align:center;margin-bottom:6px;font-weight:700">Sistema monetario</div><div class="coins-row">${coinRow}</div></div>
        <div style="width:100%"><div style="font-size:.72rem;color:var(--txt-muted);text-align:center;margin-bottom:6px;font-weight:700">Monedas elegidas (${chosen.length})</div>${chosenRow}</div>
      </div>`;
  }
};

/* ════════════════════════════════════════════════════════════════
   10. MOCHILA CONTINUA (Voraz)
════════════════════════════════════════════════════════════════ */
const ALGO_FRAC_KNAPSACK = {
  id: 'fractional-knapsack',
  name: 'Mochila Continua (Voraz)', shortName: 'Mochila Continua',
  timeComplexity: 'O(n log n)', spaceComplexity: 'O(1)',
  useCases: 'Objetos divisibles: petróleo, oro en polvo, tiempo…',
  description: 'Ordena los objetos por ratio valor/peso y los coge enteros mientras quepan; el último se coge de forma fraccionaria para llenar la mochila. Es óptima porque los objetos son divisibles.',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Si los objetos se pueden partir, siempre conviene priorizar el que más "valor por kilo" aporta. Es la versión donde la estrategia voraz <em>sí</em> da el óptimo.</p>
      <p><span class="explain-tag">⚙️ Pasos</span>Ordenamos por ratio <code>v/w</code> descendente y cogemos objetos enteros mientras quepan. Cuando uno no cabe entero, metemos justo la fracción que llena la mochila.</p>
      <p class="explain-key">🔑 La diferencia con la mochila 0/1 es la divisibilidad: aquí basta ordenar (O(n log n)); en la 0/1 hace falta DP o ramificación y poda.</p>
    </div>`,
  generateSteps() {
    const items = [{ n: 'A', w: 10, v: 60 }, { n: 'B', w: 20, v: 100 }, { n: 'C', w: 30, v: 120 }];
    const W = 50;
    const sorted = items.map(it => ({ ...it, r: it.v / it.w })).sort((a, b) => b.r - a.r);
    const steps = [];
    let cap = W, total = 0;
    const status = {};
    steps.push({ items: sorted, W, cap, total, cur: -1, status: {},
      desc: `Mochila de capacidad ${W}. Como los objetos se pueden partir, los ordenamos por <strong>ratio valor/peso</strong> (lo que "renta" cada kilo) de mayor a menor y cogeremos primero los más rentables.` });
    for (let i = 0; i < sorted.length; i++) {
      const it = sorted[i];
      steps.push({ items: sorted, W, cap, total, cur: i, status: { ...status },
        desc: `Evaluamos ${it.n}: ratio = ${it.v}/${it.w} = ${it.r.toFixed(1)}. Capacidad restante: ${cap}.` });
      if (it.w <= cap) {
        cap -= it.w; total += it.v; status[it.n] = 'sel';
        steps.push({ items: sorted, W, cap, total, cur: i, status: { ...status },
          desc: `${it.n} cabe entero → lo cogemos. Valor +${it.v} = ${total}. Capacidad: ${cap}.` });
      } else if (cap > 0) {
        const frac = cap / it.w, val = it.v * frac;
        total += val; status[it.n] = 'par';
        steps.push({ items: sorted, W, cap: 0, total, cur: i, status: { ...status },
          desc: `${it.n} no cabe entero → cogemos el ${(frac * 100).toFixed(0)}%. Valor +${val.toFixed(1)} = ${total.toFixed(1)}. Mochila llena.` });
        cap = 0;
      } else {
        status[it.n] = 'rej';
        steps.push({ items: sorted, W, cap, total, cur: i, status: { ...status }, desc: `${it.n} descartado: mochila llena.` });
      }
    }
    steps.push({ items: sorted, W, cap, total, cur: -1, status: { ...status }, done: true,
      desc: `✅ Valor total óptimo: <strong>${total.toFixed(1)}</strong>.` });
    return steps;
  },
  render(container, step) {
    const { items, W, cap, total, cur = -1, status = {}, done = false } = step;
    const used = W - cap;
    const pct = Math.min(100, (used / W) * 100);
    const cards = items.map((it, i) => {
      const s = status[it.n];
      let cls = s === 'sel' ? 'sel' : s === 'par' ? 'par' : s === 'rej' ? 'rej' : '';
      if (i === cur && !done && !cls) cls = 'cur';
      const tag = s === 'sel' ? '✓ Entero' : s === 'par' ? '◑ Parcial' : s === 'rej' ? '✕ Fuera' : '';
      return `<div class="item-card ${cls}"><div class="item-name">${it.n}</div><div class="item-meta">v=${it.v} · w=${it.w}</div><div class="item-ratio">${(it.v / it.w).toFixed(1)}/u</div><div class="item-status">${tag}</div></div>`;
    }).join('');
    container.innerHTML = `
      <div style="width:100%;display:flex;flex-direction:column;gap:18px;align-items:center">
        <div class="items-grid">${cards}</div>
        <div class="cap-bar-wrap"><div class="cap-bar-labels"><span>Capacidad usada</span><span>${used.toFixed(1)} / ${W}</span></div><div class="cap-bar-track"><div class="cap-bar-fill" style="width:${pct}%"></div></div></div>
        <div style="text-align:center"><span style="font-size:.72rem;color:var(--txt-muted);text-transform:uppercase;font-weight:700">Valor total</span><div class="big-num" style="color:var(--green)">${(+total).toFixed(1)}</div></div>
      </div>`;
  }
};

/* ════════════════════════════════════════════════════════════════
   Grafo compartido para Kruskal y Prim
════════════════════════════════════════════════════════════════ */
const GRAPH_NODES = [
  { id: 0, label: 'A', x: 70, y: 45 },
  { id: 1, label: 'B', x: 300, y: 45 },
  { id: 2, label: 'C', x: 185, y: 120 },
  { id: 3, label: 'D', x: 60, y: 215 },
  { id: 4, label: 'E', x: 315, y: 205 },
  { id: 5, label: 'F', x: 190, y: 250 }
];
const GRAPH_EDGES = [
  { u: 0, v: 1, w: 6 }, { u: 0, v: 2, w: 1 }, { u: 0, v: 3, w: 5 },
  { u: 1, v: 2, w: 5 }, { u: 1, v: 4, w: 3 }, { u: 2, v: 3, w: 5 },
  { u: 2, v: 4, w: 6 }, { u: 2, v: 5, w: 4 }, { u: 3, v: 5, w: 2 },
  { u: 4, v: 5, w: 6 }
];

function renderGraph(container, step) {
  const { mst = [], rej = [], cur = -1, total = 0, inMST = null } = step;
  const M = new Set(mst), R = new Set(rej);
  const inSet = inMST ? new Set(inMST) : null;
  const edgeSvg = GRAPH_EDGES.map((e, idx) => {
    const a = GRAPH_NODES[e.u], b = GRAPH_NODES[e.v];
    let color = '#cbd5e1', width = 2, op = 1;
    if (M.has(idx)) { color = '#10b981'; width = 4; }
    else if (idx === cur) { color = '#3b82f6'; width = 4; }
    else if (R.has(idx)) { color = '#e2e8f0'; op = 0.5; }
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-width="${width}" opacity="${op}"/>
      <circle cx="${mx}" cy="${my}" r="10" fill="white" stroke="${color}" stroke-width="1.5" opacity="${op}"/>
      <text x="${mx}" y="${my + 3.5}" text-anchor="middle" font-size="10" font-weight="700" fill="#475569" opacity="${op}">${e.w}</text>`;
  }).join('');
  const nodeSvg = GRAPH_NODES.map(n => {
    const fill = inSet && inSet.has(n.id) ? '#10b981' : '#1e293b';
    return `<circle cx="${n.x}" cy="${n.y}" r="16" fill="${fill}"/>
      <text x="${n.x}" y="${n.y + 4.5}" text-anchor="middle" font-size="12" font-weight="700" fill="white">${n.label}</text>`;
  }).join('');
  const list = GRAPH_EDGES.map((e, idx) => {
    let cls = '';
    if (M.has(idx)) cls = 'mst'; else if (idx === cur) cls = 'cur'; else if (R.has(idx)) cls = 'rej';
    return `<div class="edge-item ${cls}">${GRAPH_NODES[e.u].label}–${GRAPH_NODES[e.v].label}<span style="margin-left:auto;font-weight:800">${e.w}</span></div>`;
  }).join('');
  container.innerHTML = `
    <div class="graph-wrap">
      <svg class="graph-svg" viewBox="0 0 375 290">${edgeSvg}${nodeSvg}</svg>
      <div class="edge-list">
        <div style="font-size:.7rem;font-weight:700;color:var(--txt-muted);text-transform:uppercase;margin-bottom:4px">Aristas · Peso total: ${total}</div>
        ${list}
      </div>
    </div>`;
}

/* ════════════════════════════════════════════════════════════════
   11. KRUSKAL (Voraz — Árbol de Recubrimiento Mínimo)
════════════════════════════════════════════════════════════════ */
const ALGO_KRUSKAL = {
  id: 'kruskal',
  name: 'Kruskal (Árbol Recubridor Mínimo)', shortName: 'Kruskal MST',
  timeComplexity: 'O(E log E)', spaceComplexity: 'O(V)',
  useCases: 'Diseño de redes de coste mínimo (cableado, carreteras).',
  description: 'Ordena las aristas por peso y las va añadiendo al árbol de menor a mayor, descartando las que formarían un ciclo (detectado con Union-Find).',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Un Árbol de Recubrimiento Mínimo conecta todos los nodos con el menor coste total. Kruskal va uniendo el grafo con las aristas más baratas disponibles.</p>
      <p><span class="explain-tag">⚙️ Pasos</span>Ordenamos las aristas de menor a mayor peso. Añadimos cada una <em>salvo</em> que una sus dos extremos ya conectados (formaría ciclo), lo que comprobamos con Union-Find.</p>
      <p class="explain-key">🔑 Enfoque global "por aristas": funciona bien en grafos dispersos. Termina con exactamente V−1 aristas → O(E log E).</p>
    </div>`,
  generateSteps() {
    const edges = GRAPH_EDGES.map((e, idx) => ({ ...e, idx })).sort((a, b) => a.w - b.w);
    const parent = GRAPH_NODES.map((_, i) => i);
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const steps = [];
    const mst = [], rej = [];
    let total = 0;
    steps.push({ mst: [], rej: [], cur: -1, total: 0, desc: `<strong>Kruskal</strong>: ordenamos las aristas por peso y añadimos la más ligera que no forme ciclo.` });
    for (const e of edges) {
      steps.push({ mst: [...mst], rej: [...rej], cur: e.idx, total,
        desc: `Evaluamos ${GRAPH_NODES[e.u].label}–${GRAPH_NODES[e.v].label} (peso ${e.w}).` });
      const ru = find(e.u), rv = find(e.v);
      if (ru !== rv) {
        parent[ru] = rv; mst.push(e.idx); total += e.w;
        steps.push({ mst: [...mst], rej: [...rej], cur: e.idx, total,
          desc: `No forma ciclo → la añadimos al MST. Peso acumulado: ${total}.` });
      } else {
        rej.push(e.idx);
        steps.push({ mst: [...mst], rej: [...rej], cur: e.idx, total,
          desc: `Formaría ciclo (${GRAPH_NODES[e.u].label} y ${GRAPH_NODES[e.v].label} ya están conectados) → la descartamos.` });
      }
    }
    steps.push({ mst: [...mst], rej: [...rej], cur: -1, total, done: true, desc: `✅ MST completo. Peso total mínimo: <strong>${total}</strong>.` });
    return steps;
  },
  render(container, step) { renderGraph(container, step); }
};

/* ════════════════════════════════════════════════════════════════
   12. PRIM (Voraz — Árbol de Recubrimiento Mínimo)
════════════════════════════════════════════════════════════════ */
const ALGO_PRIM = {
  id: 'prim',
  name: 'Prim (Árbol Recubridor Mínimo)', shortName: 'Prim MST',
  timeComplexity: 'O(E log V)', spaceComplexity: 'O(V)',
  useCases: 'Alternativa a Kruskal, eficiente en grafos densos.',
  description: 'Hace crecer el árbol desde un nodo inicial: en cada paso añade la arista más ligera que conecta un nodo del árbol con uno que aún no está dentro.',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Como Kruskal, busca el Árbol de Recubrimiento Mínimo, pero "creciendo" desde un nodo: el árbol se expande como una mancha de aceite.</p>
      <p><span class="explain-tag">⚙️ Pasos</span>Empezamos con un nodo dentro del árbol. En cada paso miramos todas las aristas que salen del árbol hacia fuera y añadimos la más ligera, incorporando su nuevo nodo.</p>
      <p class="explain-key">🔑 Enfoque "por nodos": suele ser más eficiente que Kruskal en grafos <strong>densos</strong>. Con montículo, O(E log V).</p>
    </div>`,
  generateSteps() {
    const inMST = new Set([0]);
    const mst = [], rej = [];
    const steps = [];
    let total = 0;
    const n = GRAPH_NODES.length;
    steps.push({ mst: [], rej: [], cur: -1, total: 0, inMST: [0],
      desc: `<strong>Prim</strong>: crecemos el árbol desde ${GRAPH_NODES[0].label}. Añadimos la arista más ligera que sale del árbol.` });
    while (inMST.size < n) {
      let best = null;
      GRAPH_EDGES.forEach((e, idx) => {
        if (inMST.has(e.u) !== inMST.has(e.v)) { if (!best || e.w < best.w) best = { ...e, idx }; }
      });
      if (!best) break;
      steps.push({ mst: [...mst], rej: [...rej], cur: best.idx, total, inMST: [...inMST],
        desc: `Arista más ligera que sale del árbol: ${GRAPH_NODES[best.u].label}–${GRAPH_NODES[best.v].label} (peso ${best.w}).` });
      mst.push(best.idx); total += best.w;
      const nw = inMST.has(best.u) ? best.v : best.u;
      inMST.add(nw);
      steps.push({ mst: [...mst], rej: [...rej], cur: best.idx, total, inMST: [...inMST],
        desc: `Incorporamos ${GRAPH_NODES[nw].label} al árbol. Peso acumulado: ${total}.` });
    }
    steps.push({ mst: [...mst], rej: [...rej], cur: -1, total, inMST: [...inMST], done: true,
      desc: `✅ MST completo con Prim. Peso total: <strong>${total}</strong>.` });
    return steps;
  },
  render(container, step) { renderGraph(container, step); }
};

/* ════════════════════════════════════════════════════════════════
   13. N-REINAS (Vuelta Atrás)
════════════════════════════════════════════════════════════════ */
const ALGO_N_QUEENS = {
  id: 'n-queens',
  name: 'N-Reinas (Vuelta Atrás)', shortName: 'N-Reinas',
  timeComplexity: 'O(n!)', spaceComplexity: 'O(n)',
  useCases: 'Problema clásico de restricciones y poda por backtracking.',
  description: 'Coloca una reina por columna probando filas; si una posición es segura avanza, y si se queda sin opciones retrocede (backtracking) a la columna anterior.',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Vuelta atrás: construimos la solución paso a paso y, en cuanto una elección viola las reglas, la deshacemos y probamos la siguiente. Se evita explorar ramas imposibles.</p>
      <p><span class="explain-tag">⚙️ Pasos</span>Colocamos una reina por columna. Antes de fijarla comprobamos que no comparta fila ni diagonal con las ya puestas. Si ninguna fila es válida, <em>retrocedemos</em> a la columna anterior.</p>
      <p class="explain-key">🔑 La poda (descartar posiciones atacadas) recorta drásticamente el árbol de búsqueda frente a probar todas las combinaciones a ciegas.</p>
    </div>`,
  generateSteps() {
    const N = 6;
    const board = new Array(N).fill(-1); // board[col] = row
    const steps = [];
    let solved = false;
    const safe = (col, row) => {
      for (let c = 0; c < col; c++) {
        const r = board[c];
        if (r === row || Math.abs(r - row) === Math.abs(c - col)) return false;
      }
      return true;
    };
    steps.push({ board: [...board], col: -1, tryRow: -1, N, phase: 'init',
      desc: `<strong>N-Reinas</strong> (N=${N}). Colocamos una reina por columna sin que se ataquen.` });
    const solve = col => {
      if (solved) return;
      if (col === N) {
        solved = true;
        steps.push({ board: [...board], col: N, tryRow: -1, N, phase: 'solved',
          desc: `✅ Solución: ${board.map((r, c) => `(f${r + 1},c${c + 1})`).join('  ')}.` });
        return;
      }
      for (let row = 0; row < N && !solved; row++) {
        steps.push({ board: [...board], col, tryRow: row, N, phase: 'try', desc: `Columna ${col + 1}: probamos la fila ${row + 1}.` });
        if (safe(col, row)) {
          board[col] = row;
          steps.push({ board: [...board], col, tryRow: row, N, phase: 'place', desc: `(f${row + 1},c${col + 1}) es segura → colocamos la reina.` });
          solve(col + 1);
          if (!solved) {
            board[col] = -1;
            steps.push({ board: [...board], col, tryRow: row, N, phase: 'back', desc: `Sin solución más allá → retiramos la reina de (f${row + 1},c${col + 1}) y seguimos.` });
          }
        } else {
          steps.push({ board: [...board], col, tryRow: row, N, phase: 'attack', desc: `(f${row + 1},c${col + 1}) está atacada → descartamos.` });
        }
      }
    };
    solve(0);
    return steps;
  },
  render(container, step) {
    const { board, col = -1, tryRow = -1, N, phase } = step;
    const size = Math.min(46, Math.floor(288 / N));
    let cells = '';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const base = (r + c) % 2 === 0 ? 'lit' : 'drk';
        let extra = '', content = '';
        if (board[c] === r) { extra = 'q'; content = '♛'; }
        else if (c === col && r === tryRow) {
          if (phase === 'attack') { extra = 'att'; content = '✕'; }
          else extra = 'try';
        }
        cells += `<div class="chess-cell ${base} ${extra}" style="width:${size}px;height:${size}px;font-size:${(size * 0.55).toFixed(0)}px">${content}</div>`;
      }
    }
    container.innerHTML = `
      <div class="board-wrap">
        <div class="chess-board" style="grid-template-columns:repeat(${N},${size}px)">${cells}</div>
        ${legend(['#d1fae5', 'Reina colocada'], ['#dbeafe', 'Probando'], ['#fee2e2', 'Casilla atacada'])}
      </div>`;
  }
};

/* ════════════════════════════════════════════════════════════════
   14. PERMUTACIONES (Vuelta Atrás)
════════════════════════════════════════════════════════════════ */
const ALGO_PERMUTATIONS = {
  id: 'permutations',
  name: 'Permutaciones (Vuelta Atrás)', shortName: 'Permutaciones',
  timeComplexity: 'O(n·n!)', spaceComplexity: 'O(n)',
  useCases: 'Generar todas las ordenaciones posibles de un conjunto.',
  description: 'Construye cada permutación posición a posición eligiendo un elemento no usado; al completar o agotar opciones, deshace la última elección (backtracking) y prueba otra.',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Generar todas las ordenaciones posibles es un recorrido en profundidad: en cada posición probamos cada elemento libre y bajamos un nivel.</p>
      <p><span class="explain-tag">⚙️ Pasos</span>Rellenamos la posición actual con un elemento no usado y avanzamos. Al completar una permutación la guardamos; al agotar opciones, <em>liberamos</em> el elemento y probamos otro (backtracking).</p>
      <p class="explain-key">🔑 El árbol tiene n! hojas: es el esquema base de la vuelta atrás sobre el que luego se añaden podas para problemas concretos.</p>
    </div>`,
  generateSteps() {
    const elems = [1, 2, 3];
    const N = elems.length;
    const slots = new Array(N).fill(null);
    const used = new Array(N).fill(false);
    const found = [];
    const steps = [];
    steps.push({ slots: [...slots], used: [...used], elems, found: [], cur: -1,
      desc: `<strong>Permutaciones</strong> de [${elems.join(', ')}] por vuelta atrás.` });
    const bt = depth => {
      if (depth === N) {
        found.push([...slots]);
        steps.push({ slots: [...slots], used: [...used], elems, found: found.map(f => [...f]), cur: -1, complete: true,
          desc: `✅ Permutación completa: [${slots.join(', ')}].` });
        return;
      }
      for (let i = 0; i < N; i++) {
        if (used[i]) continue;
        slots[depth] = elems[i]; used[i] = true;
        steps.push({ slots: [...slots], used: [...used], elems, found: found.map(f => [...f]), cur: depth,
          desc: `Posición ${depth + 1}: colocamos ${elems[i]}.` });
        bt(depth + 1);
        slots[depth] = null; used[i] = false;
        steps.push({ slots: [...slots], used: [...used], elems, found: found.map(f => [...f]), cur: depth,
          desc: `Retrocedemos en la posición ${depth + 1}: liberamos ${elems[i]}.` });
      }
    };
    bt(0);
    steps.push({ slots: new Array(N).fill(null), used: new Array(N).fill(false), elems, found: found.map(f => [...f]), cur: -1, done: true,
      desc: `✅ Total: ${found.length} permutaciones (${N}! = ${found.length}).` });
    return steps;
  },
  render(container, step) {
    const { slots, used = [], elems, found = [], cur = -1 } = step;
    const slotHTML = slots.map((v, i) => {
      const cls = v === null ? 'emp' : (i === cur ? 'cur' : 'fix');
      return `<div class="perm-slot ${cls}">${v === null ? '?' : v}</div>`;
    }).join('');
    const avail = elems.map((e, i) =>
      `<div class="perm-slot ${used[i] ? 'fix' : 'emp'}" style="width:42px;height:42px;font-size:1rem">${e}</div>`).join('');
    const tags = found.map(f => `<span class="perm-tag">[${f.join(', ')}]</span>`).join('');
    container.innerHTML = `
      <div class="perm-ui">
        <div><div style="font-size:.7rem;color:var(--txt-muted);text-transform:uppercase;font-weight:700;margin-bottom:6px;text-align:center">Construyendo</div><div class="perm-slots">${slotHTML}</div></div>
        <div><div style="font-size:.7rem;color:var(--txt-muted);text-transform:uppercase;font-weight:700;margin-bottom:6px;text-align:center">Disponibles</div><div class="perm-slots">${avail}</div></div>
        ${found.length ? `<div><div style="font-size:.7rem;color:var(--txt-muted);text-transform:uppercase;font-weight:700;margin-bottom:6px;text-align:center">Encontradas (${found.length})</div><div class="perm-found">${tags}</div></div>` : ''}
      </div>`;
  }
};

/* ════════════════════════════════════════════════════════════════
   3.5  TORRES DE HANOI (Tema 3 · Divide y Vencerás)
════════════════════════════════════════════════════════════════ */
const ALGO_HANOI = {
  id: 'hanoi',
  name: 'Torres de Hanoi', shortName: 'Torres de Hanoi',
  timeComplexity: 'Θ(2ⁿ)', spaceComplexity: 'O(n)',
  useCases: 'Ejemplo clásico de recursión y de coste exponencial ineludible.',
  description: 'Traslada una torre de n discos de la varilla A a la C usando B como auxiliar, moviendo un disco cada vez y sin colocar nunca uno mayor sobre uno menor.',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Divide y vencerás puro: para mover n discos de A a C, primero mueve los n−1 de arriba a B, luego el disco grande a C, y por último los n−1 de B a C.</p>
      <p><span class="explain-tag">⚙️ Recursión</span><code>hanoi(n, A, B, C) = hanoi(n−1, A, C, B) + mover(A→C) + hanoi(n−1, B, A, C)</code>. El caso base es mover un solo disco.</p>
      <p class="explain-key">🔑 Cada nivel duplica el trabajo: T(n)=2·T(n−1)+1 = 2ⁿ−1 movimientos. Es Θ(2ⁿ): con 64 discos no acabaría en toda la edad del universo.</p>
    </div>`,
  generateSteps() {
    const N = 4;
    const pegs = { A: Array.from({ length: N }, (_, i) => N - i), B: [], C: [] };
    const total = Math.pow(2, N) - 1, steps = [];
    const snap = () => ({ A: [...pegs.A], B: [...pegs.B], C: [...pegs.C] });
    steps.push({ pegs: snap(), move: null, count: 0, total, N, desc: `<strong>Torres de Hanoi</strong> con ${N} discos. Objetivo: pasar toda la torre de A a C. Mínimo teórico: 2⁴−1 = ${total} movimientos.` });
    let count = 0;
    const move = (from, to) => {
      const disk = pegs[from].pop(); pegs[to].push(disk); count++;
      steps.push({ pegs: snap(), move: { disk, from, to }, count, total, N, desc: `Movimiento ${count}: disco ${disk} de ${from} → ${to}.` });
    };
    const hanoi = (k, from, aux, to) => { if (k === 0) return; hanoi(k - 1, from, to, aux); move(from, to); hanoi(k - 1, aux, from, to); };
    hanoi(N, 'A', 'B', 'C');
    steps.push({ pegs: snap(), move: null, count, total, N, done: true, desc: `✅ Torre trasladada a C en ${count} movimientos = 2⁴−1. En general se necesitan 2ⁿ−1 → Θ(2ⁿ).` });
    return steps;
  },
  render(container, step) {
    const { pegs, move, count, total, N } = step;
    const maxW = 118, minW = 34;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const peg = name => {
      const disks = pegs[name].map(d => {
        const w = minW + (maxW - minW) * ((d - 1) / Math.max(1, N - 1));
        const active = move && move.disk === d && move.to === name;
        return `<div style="height:18px;width:${w}px;border-radius:4px;background:${colors[(d - 1) % colors.length]};color:white;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;font-family:'JetBrains Mono',monospace;box-shadow:${active ? '0 0 0 3px #fde68a' : 'none'};margin:1px auto">${d}</div>`;
      }).reverse().join('');
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
          <div style="display:flex;flex-direction:column;justify-content:flex-end;height:${N * 22 + 12}px;width:${maxW + 18}px;border-bottom:5px solid #1e293b;position:relative">
            <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);width:6px;height:100%;background:#cbd5e1;border-radius:3px"></div>
            <div style="position:relative;z-index:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%">${disks}</div>
          </div>
          <div style="font-weight:800;color:var(--txt-secondary)">${name}</div>
        </div>`;
    };
    container.innerHTML = `
      <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:16px">
        <div style="font-size:.85rem;color:var(--txt-secondary);font-family:'JetBrains Mono',monospace">Movimiento ${count} / ${total}</div>
        <div style="display:flex;gap:26px;align-items:flex-end">${peg('A')}${peg('B')}${peg('C')}</div>
      </div>`;
  }
};

/* ════════════════════════════════════════════════════════════════
   7.1  MOCHILA 0/1 CON RAMIFICACIÓN Y PODA (Tema 7)
════════════════════════════════════════════════════════════════ */
const ALGO_KNAPSACK_BB = {
  id: 'knapsack-bb',
  name: 'Mochila 0/1 (Ramificación y Poda)', shortName: 'Mochila R&P',
  timeComplexity: 'O(2ⁿ) podado', spaceComplexity: 'O(n)',
  useCases: 'Resolver óptimos exactos explorando pocas ramas gracias a las cotas.',
  description: 'Explora el árbol de decisiones (incluir/excluir cada objeto) calculando en cada nodo una cota optimista; si esa cota no supera a la mejor solución hallada, poda la rama entera.',
  detailedText: `
    <div class="explain">
      <p><span class="explain-tag">💡 Idea</span>Es vuelta atrás "informada": además de explorar, en cada nodo estimamos lo máximo alcanzable (cota optimista) y descartamos ramas que ni en el mejor caso mejorarían la solución actual.</p>
      <p><span class="explain-tag">⚙️ Cota optimista</span>Se calcula relajando el problema: rellenamos la capacidad restante de forma fraccionaria (como la mochila continua). Es un valor inalcanzable pero seguro como techo.</p>
      <p class="explain-key">🔑 Si <code>cota_optimista ≤ mejor_solución</code>, la rama se poda sin explorarla. Cuanto más ajustada sea la cota, más ramas se eliminan.</p>
    </div>`,
  generateSteps() {
    const items = [{ n: 'A', w: 2, v: 12 }, { n: 'B', w: 3, v: 15 }, { n: 'C', w: 5, v: 20 }, { n: 'D', w: 4, v: 14 }];
    const its = items.map(it => ({ ...it, r: it.v / it.w })).sort((a, b) => b.r - a.r);
    const W = 9, steps = [];
    let best = 0, bestSet = [], explored = 0, pruned = 0;
    const optimistic = (idx, val, cap) => {
      let b = val, c = cap;
      for (let i = idx; i < its.length; i++) {
        if (its[i].w <= c) { c -= its[i].w; b += its[i].v; }
        else { b += its[i].v * (c / its[i].w); break; }
      }
      return b;
    };
    const push = (decisions, val, weight, opt, phase, desc) =>
      steps.push({ its, W, decisions: [...decisions], val, weight, opt, best, bestSet: [...bestSet], explored, pruned, phase, desc });
    push([], 0, 0, optimistic(0, 0, W), 'init',
      `<strong>Mochila 0/1 con Ramificación y Poda</strong>. Capacidad ${W}. Objetos ordenados por ratio v/w. Cota optimista inicial = ${optimistic(0, 0, W).toFixed(1)}.`);
    const dfs = (idx, val, weight, decisions) => {
      if (idx === its.length) {
        explored++;
        if (val > best) {
          best = val;
          bestSet = decisions.map((d, i) => d === 'in' ? its[i].n : null).filter(Boolean);
          push(decisions, val, weight, val, 'leaf-better', `Hoja: valor ${val} (peso ${weight}). ¡Mejora la mejor solución! Mejor = ${best}.`);
        } else {
          push(decisions, val, weight, val, 'leaf', `Hoja: valor ${val}. No mejora la mejor solución (${best}).`);
        }
        return;
      }
      const it = its[idx];
      if (weight + it.w <= W) {
        const opt = optimistic(idx + 1, val + it.v, W - weight - it.w), nd = [...decisions, 'in'];
        push(nd, val + it.v, weight + it.w, opt, 'branch', `Incluimos ${it.n} (v=${it.v}, w=${it.w}). Valor=${val + it.v}, peso=${weight + it.w}. Cota optimista=${opt.toFixed(1)}.`);
        if (opt > best) dfs(idx + 1, val + it.v, weight + it.w, nd);
        else { pruned++; push(nd, val + it.v, weight + it.w, opt, 'prune', `Cota ${opt.toFixed(1)} ≤ mejor ${best} → <strong>podamos</strong>.`); }
      }
      const opt2 = optimistic(idx + 1, val, W - weight), nd2 = [...decisions, 'out'];
      push(nd2, val, weight, opt2, 'branch', `Excluimos ${it.n}. Valor=${val}, peso=${weight}. Cota optimista=${opt2.toFixed(1)}.`);
      if (opt2 > best) dfs(idx + 1, val, weight, nd2);
      else { pruned++; push(nd2, val, weight, opt2, 'prune', `Cota ${opt2.toFixed(1)} ≤ mejor ${best} → <strong>podamos</strong>.`); }
    };
    dfs(0, 0, 0, []);
    push([], 0, 0, best, 'done', `✅ Óptimo: valor <strong>${best}</strong> con {${bestSet.join(', ')}}. Hojas evaluadas: ${explored}, ramas podadas: ${pruned}.`);
    return steps;
  },
  render(container, step) {
    const { its, W, decisions = [], val, weight, opt, best, bestSet = [], explored, pruned, phase } = step;
    const cards = its.map((it, i) => {
      const d = decisions[i];
      let cls = '', tag = '—';
      if (d === 'in') { cls = 'sel'; tag = '✓ dentro'; }
      else if (d === 'out') { cls = 'rej'; tag = '✕ fuera'; }
      else if (i === decisions.length) { cls = 'cur'; tag = 'decidiendo'; }
      return `<div class="item-card ${cls}"><div class="item-name">${it.n}</div><div class="item-meta">v=${it.v} · w=${it.w}</div><div class="item-ratio">${it.r.toFixed(1)}</div><div class="item-status">${tag}</div></div>`;
    }).join('');
    const path = decisions.map((d, i) =>
      `<span style="padding:2px 7px;border-radius:5px;font-size:.72rem;font-weight:700;font-family:'JetBrains Mono',monospace;background:${d === 'in' ? '#d1fae5' : '#fee2e2'};color:${d === 'in' ? '#065f46' : '#991b1b'}">${its[i].n}${d === 'in' ? '✓' : '✗'}</span>`).join(' ');
    const optColor = phase === 'prune' ? '#ef4444' : (phase === 'leaf-better' || phase === 'done') ? '#10b981' : '#3b82f6';
    container.innerHTML = `
      <div style="width:100%;display:flex;flex-direction:column;gap:14px;align-items:center">
        <div class="items-grid">${cards}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center;min-height:22px">${path || '<span style="color:var(--txt-muted);font-size:.8rem">raíz (sin decisiones)</span>'}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 14px;text-align:center"><div style="font-size:.62rem;color:var(--txt-muted);text-transform:uppercase;font-weight:700">Valor / Peso</div><div style="font-family:'JetBrains Mono',monospace;font-weight:800">${val} / ${weight} ≤ ${W}</div></div>
          <div style="background:#eff6ff;border:1px solid ${optColor};border-radius:8px;padding:8px 14px;text-align:center"><div style="font-size:.62rem;color:var(--txt-muted);text-transform:uppercase;font-weight:700">Cota optimista</div><div style="font-family:'JetBrains Mono',monospace;font-weight:800;color:${optColor}">${(+opt).toFixed(1)}</div></div>
          <div style="background:#d1fae5;border:1px solid #10b981;border-radius:8px;padding:8px 14px;text-align:center"><div style="font-size:.62rem;color:#065f46;text-transform:uppercase;font-weight:700">Mejor solución</div><div style="font-family:'JetBrains Mono',monospace;font-weight:800;color:#065f46">${best}${bestSet.length ? ` {${bestSet.join(',')}}` : ''}</div></div>
        </div>
        <div style="font-size:.72rem;color:var(--txt-muted)">Hojas evaluadas: ${explored} · Ramas podadas: ${pruned}</div>
      </div>`;
  }
};
