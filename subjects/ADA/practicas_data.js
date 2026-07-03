/* ================================================================
   AlgoVisual — practicas_data.js
   Prácticas interactivas de ADA
   ----------------------------------------------------------------
   · 5 resoluciones del MISMO laberinto con técnicas distintas:
       Fuerza bruta · Memoización (DP) · Backtracking ·
       Voraz · Ramificación y Poda
   · Ordenación: Bubble Sort
   Helpers legend() y clone2D() se definen en algoritmos_data.js.
   ================================================================ */

/* Laberinto compartido por todas las prácticas de laberinto.
   1 = camino libre · 0 = muro.  Movimientos permitidos: SE, S, E.
   Inicio = (0,0) marcado S · Meta = (n-1,m-1) marcada E. */
const MAZE = [
  [1, 1, 0, 1],
  [1, 1, 1, 0],
  [1, 0, 1, 1],
  [0, 1, 1, 1]
];

/* ── Render compartido del laberinto ── */
function renderMazeSimEnhanced(container, step) {
  const { maze, path = [], current, candidate, dir, phase, calls, statLabel = 'Llamadas recursivas' } = step;
  const ROWS = maze.length, COLS = maze[0].length;
  const pathSet = new Set(path.map(p => `${p.r},${p.c}`));

  const statsHTML = calls !== undefined
    ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;font-weight:600;color:var(--txt-secondary)">
         ${statLabel}: <span style="color:#1e40af">${calls}</span>
       </div>`
    : '';

  let html = `
    <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:12px">
      ${statsHTML}
      <div class="maze-grid" style="grid-template-columns:repeat(${COLS},38px)">`;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = maze[r][c];
      const isStart = r === 0 && c === 0, isEnd = r === ROWS - 1 && c === COLS - 1;
      const inPath = pathSet.has(`${r},${c}`);
      const isCur = current && current.r === r && current.c === c;
      const isCand = candidate && candidate.r === r && candidate.c === c;

      let cls = 'maze-cell';
      if (v === 0 && !isStart && !isEnd) cls += ' maze-wall';
      else if (isStart) cls += ' maze-start';
      else if (isEnd) cls += ' maze-end';
      else if ((phase === 'found' || phase === 'done') && inPath && !isStart && !isEnd) cls += ' maze-path';
      else if (isCand) cls += (phase === 'blocked' ? ' maze-backtrack' : ' maze-current');
      else if (isCur) cls += ' maze-current';
      else if (v === 3) cls += ' maze-backtrack';
      else if (v === 2 || inPath) cls += ' maze-visited';

      html += `<div class="${cls}">${isStart ? 'S' : isEnd ? 'E' : (isCand && dir ? dir : '')}</div>`;
    }
  }
  html += `</div>
      ${legend(['#dbeafe', 'Visitado / Camino'], ['#fee2e2', 'Descartado / Podado'], ['#f59e0b', 'Nodo actual'], ['#10b981', 'Meta / Óptimo'], ['#3b82f6', 'Inicio'])}
    </div>`;
  container.innerHTML = html;
}

/* ── Tabla de ventajas / inconvenientes ── */
function prosCons(pros, cons) {
  return `<div class="proscons">
    <div class="pc-col pc-pros"><div class="pc-head">✓ Ventajas</div><ul>${pros.map(p => `<li>${p}</li>`).join('')}</ul></div>
    <div class="pc-col pc-cons"><div class="pc-head">✗ Inconvenientes</div><ul>${cons.map(c => `<li>${c}</li>`).join('')}</ul></div>
  </div>`;
}

/* ════════════════════════════════════════════════════════════════
   CATEGORÍAS DE PRÁCTICAS
════════════════════════════════════════════════════════════════ */
const PRACTICAS = [
  {
    id: 'pr-laberinto',
    name: '🧭 Laberintos',
    icon: '🧭',
    algoIds: ['maze-naive', 'maze-memo', 'maze-bt', 'maze-greedy', 'maze-bb']
  },
  {
    id: 'pr-orden',
    name: '📊 Ordenación',
    icon: '📊',
    algoIds: ['bubble-sort']
  }
];

/* ════════════════════════════════════════════════════════════════
   PRÁCTICAS
════════════════════════════════════════════════════════════════ */
const PRACTICAS_DATA = {

  /* ── 1. Laberinto: Fuerza Bruta (sin memoización) ── */
  'maze-naive': {
    id: 'maze-naive', categoryId: 'pr-laberinto',
    name: 'Laberinto: Fuerza Bruta', shortName: 'Laberinto Naive',
    timeComplexity: 'Exponencial', spaceComplexity: 'O(profundidad)',
    useCases: 'Referencia base: explorar a ciegas sin recordar subproblemas.',
    description: 'Recorre el laberinto probando todos los caminos posibles (SE, S, E) con backtracking, pero sin recordar nada: cada celda puede recalcularse muchas veces. Es la versión lenta que sirve de punto de comparación.',
    detailedText: `
      <div class="explain">
        <p><span class="explain-tag">💡 Idea</span>Desde cada celda intentamos avanzar en diagonal, abajo y derecha. Si nos bloqueamos, retrocedemos y probamos otra dirección.</p>
        <p class="explain-key">🔑 Al no guardar resultados, los mismos subcaminos se recalculan una y otra vez → coste exponencial. Es justo lo que la memoización viene a evitar.</p>
      </div>` + prosCons(
        ['Muy simple de programar', 'Si hay solución, la encuentra (lo explora todo)', 'Base para entender las técnicas más listas'],
        ['Coste exponencial: inviable en laberintos grandes', 'Recalcula los mismos subcaminos una y otra vez', 'No aprovecha nada de lo ya explorado']),
    generateSteps() {
      // Laberinto propio con callejones sin salida: la fuerza bruta se mete
      // en varias trampas (SE y S) y tiene que retroceder antes de dar con la salida.
      const grid = [
        [1, 1, 1, 1],
        [1, 1, 0, 1],
        [1, 0, 0, 1],
        [0, 0, 0, 1]
      ];
      const ROWS = grid.length, COLS = grid[0].length;
      const steps = [];
      const maze = grid.map(r => [...r]);
      const dirs = [[1, 1], [1, 0], [0, 1]];
      let path = [], found = false, calls = 0;
      steps.push({ maze: clone2D(maze), path: [], phase: 'init', calls: 0, desc: `<strong>Fuerza bruta</strong> sobre el laberinto. Movimientos: diagonal (SE), abajo (S) y derecha (E). Sin memoria de subproblemas.` });
      function bt(r, c) {
        if (r < 0 || c < 0 || r >= ROWS || c >= COLS || maze[r][c] !== 1 || found) return false;
        calls++; maze[r][c] = 2; path.push({ r, c });
        steps.push({ maze: clone2D(maze), path: [...path], current: { r, c }, phase: 'visit', calls, desc: `Explorando (${r},${c}).` });
        if (r === ROWS - 1 && c === COLS - 1) {
          found = true;
          steps.push({ maze: clone2D(maze), path: [...path], current: { r, c }, phase: 'found', calls, desc: `✅ ¡Meta alcanzada! Camino de ${path.length} celdas tras ${calls} llamadas.` });
          return true;
        }
        for (const [dr, dc] of dirs) if (!found) bt(r + dr, c + dc);
        if (!found) {
          maze[r][c] = 3; path.pop();
          steps.push({ maze: clone2D(maze), path: [...path], current: { r, c }, phase: 'backtrack', calls, desc: `Sin salida desde (${r},${c}) → retrocedemos.` });
        }
        return false;
      }
      bt(0, 0);
      return steps;
    },
    render(container, step) { renderMazeSimEnhanced(container, step); }
  },

  /* ── 2. Laberinto: Memoización (Programación Dinámica) ── */
  'maze-memo': {
    id: 'maze-memo', categoryId: 'pr-laberinto',
    name: 'Laberinto: Memoización (DP)', shortName: 'Laberinto Memo',
    timeComplexity: 'O(n·m)', spaceComplexity: 'O(n·m)',
    useCases: 'Contar el camino mínimo guardando cada subproblema una sola vez.',
    description: 'Calcula la longitud del camino más corto hasta cada celda con memoización: cada celda se resuelve una única vez y su valor se reutiliza. La misma búsqueda que la fuerza bruta, pero de exponencial a lineal.',
    detailedText: `
      <div class="explain">
        <p><span class="explain-tag">💡 Idea</span>La distancia mínima a una celda es 1 + la menor de sus predecesoras (arriba, izquierda, diagonal). Guardamos ese valor en una tabla <code>memo</code>.</p>
        <p><span class="explain-tag">⚙️ Reutilización</span>Si una celda ya está calculada, devolvemos su valor al instante en lugar de volver a explorar toda su rama.</p>
        <p class="explain-key">🔑 Con n·m subproblemas resueltos una sola vez, el coste baja de exponencial a O(n·m).</p>
      </div>` + prosCons(
        ['Cada celda se calcula una sola vez → O(n·m)', 'Enorme salto de velocidad frente a la fuerza bruta', 'Ideal cuando los subproblemas se solapan'],
        ['Necesita memoria O(n·m) para la tabla', 'Solo compensa si hay subproblemas repetidos', 'Da la distancia; reconstruir el camino es un paso aparte']),
    generateSteps() {
      // Laberinto abierto: muchas celdas se alcanzan por varios caminos, así se
      // ve cómo la memoización evita recalcular los subproblemas solapados.
      const grid = [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 0, 1, 1],
        [1, 1, 1, 1]
      ];
      const N = grid.length, M = grid[0].length, INF = 999;
      const memo = Array.from({ length: N }, () => new Array(M).fill(-1));
      const steps = [];
      steps.push({ grid, memo: clone2D(memo), curCell: null, phase: 'init', desc: `Laberinto ${N}×${M}: calculamos la distancia mínima a cada celda con memoización.` });
      function solve(r, c) {
        if (r < 0 || c < 0 || r >= N || c >= M) return INF;
        if (memo[r][c] !== -1) {
          steps.push({ grid, memo: clone2D(memo), curCell: { r, c }, phase: 'cached', desc: `Celda (${r},${c}): ya calculada (memo = ${memo[r][c] === INF ? '∞' : memo[r][c]}). La reutilizamos.` });
          return memo[r][c];
        }
        if (grid[r][c] === 0) { memo[r][c] = INF; steps.push({ grid, memo: clone2D(memo), curCell: { r, c }, phase: 'wall', desc: `Celda (${r},${c}): es muro → ∞.` }); return INF; }
        if (r === 0 && c === 0) { memo[r][c] = 1; steps.push({ grid, memo: clone2D(memo), curCell: { r, c }, phase: 'base', desc: `Celda (0,0): caso base = 1.` }); return 1; }
        steps.push({ grid, memo: clone2D(memo), curCell: { r, c }, phase: 'recurse', desc: `Celda (${r},${c}): la resolvemos a partir de sus predecesoras.` });
        const best = Math.min(solve(r - 1, c), solve(r, c - 1), solve(r - 1, c - 1));
        memo[r][c] = best === INF ? INF : best + 1;
        steps.push({ grid, memo: clone2D(memo), curCell: { r, c }, phase: 'fill', desc: `Celda (${r},${c}) = ${memo[r][c] === INF ? '∞ (inalcanzable)' : memo[r][c]}.` });
        return memo[r][c];
      }
      const res = solve(N - 1, M - 1);
      steps.push({ grid, memo: clone2D(memo), curCell: { r: N - 1, c: M - 1 }, phase: 'done', desc: `✅ Distancia mínima a la meta: ${res === INF ? 'no alcanzable' : res + ' celdas'}.` });
      return steps;
    },
    render(container, step) {
      const { grid, memo, curCell, phase } = step;
      const ROWS = grid.length, COLS = grid[0].length;
      let cells = '';
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const wall = grid[r][c] === 0;
          const isStart = r === 0 && c === 0, isEnd = r === ROWS - 1 && c === COLS - 1;
          const isCur = curCell && curCell.r === r && curCell.c === c;
          const m = memo[r][c];
          const computed = m !== -1 && m !== 999;
          let cls = 'maze-cell';
          if (wall) cls += ' maze-wall';
          else if (isCur) cls += ' maze-current';
          else if (isStart) cls += ' maze-start';
          else if (isEnd && !computed) cls += ' maze-end';
          else if (computed) cls += ' maze-visited';
          const content = wall ? '' : (m === -1 ? (isStart ? 'S' : isEnd ? 'E' : '') : (m === 999 ? '∞' : m));
          cells += `<div class="${cls}">${content}</div>`;
        }
      }
      container.innerHTML = `
        <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:12px">
          <div style="font-size:.78rem;color:var(--txt-muted)">El número de cada celda = pasos mínimos desde el inicio</div>
          <div class="maze-grid" style="grid-template-columns:repeat(${COLS},40px)">${cells}</div>
          ${legend(['#dbeafe', 'Distancia calculada'], ['#f59e0b', 'Calculando'], ['#1e293b', 'Muro (∞)'])}
        </div>`;
    }
  },

  /* ── 3. Laberinto: Backtracking con poda ── */
  'maze-bt': {
    id: 'maze-bt', categoryId: 'pr-laberinto',
    name: 'Laberinto: Backtracking', shortName: 'Laberinto Backtracking',
    timeComplexity: 'Exponencial (podado)', spaceComplexity: 'O(n·m)',
    useCases: 'Camino óptimo exacto descartando ramas que no pueden mejorar.',
    description: 'Vuelta atrás que busca el camino más corto, pero podando: descarta una celda si el coste para llegar ya es peor que otro conocido, o si ni con la distancia mínima estimada (Chebyshev) mejoraría la mejor solución.',
    detailedText: `
      <div class="explain">
        <p><span class="explain-tag">💡 Idea</span>Exploramos como en fuerza bruta, pero con dos podas: (1) si ya llegamos antes a esa celda con menos coste, y (2) si <code>coste + distancia mínima a la meta ≥ mejor camino</code>.</p>
        <p class="explain-key">🔑 La poda recorta ramas inútiles del árbol de búsqueda, así que encontramos el óptimo explorando muchísimos menos nodos que la fuerza bruta.</p>
      </div>` + prosCons(
        ['Encuentra el óptimo exacto', 'La poda descarta muchísimas ramas inútiles', 'Poca memoria (solo el camino actual)'],
        ['En el peor caso sigue siendo exponencial', 'Su rapidez depende de lo buena que sea la poda', 'Con una cota floja explora de más']),
    generateSteps() {
      const grid = MAZE;
      const ROWS = grid.length, COLS = grid[0].length, INF = 999;
      const cheby = (r, c) => Math.max(ROWS - 1 - r, COLS - 1 - c);
      const steps = [];
      const costs = Array.from({ length: ROWS }, () => new Array(COLS).fill(INF));
      costs[0][0] = 0;
      const maze = grid.map(r => [...r]); maze[0][0] = 2;
      let bestSol = INF, bestPath = null, explored = 0, pruned = 0;
      steps.push({ maze: clone2D(maze), path: [], phase: 'init', calls: 0, statLabel: 'Nodos explorados', desc: `<strong>Backtracking con poda</strong> (cota de Chebyshev). Buscamos el camino más corto descartando ramas sin futuro.` });
      function bt(r, c, cost, path) {
        if (r === ROWS - 1 && c === COLS - 1) {
          if (cost + 1 < bestSol) {
            bestSol = cost + 1; bestPath = [...path, { r, c }];
            steps.push({ maze: clone2D(maze), path: [...path, { r, c }], phase: 'found', calls: explored, statLabel: 'Nodos explorados', desc: `Nuevo mejor camino: ${bestSol} celdas.` });
          }
          return;
        }
        for (const [dr, dc] of [[1, 1], [1, 0], [0, 1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || grid[nr][nc] === 0) continue;
          const newCost = cost + 1;
          if (newCost >= costs[nr][nc] || newCost + cheby(nr, nc) >= bestSol) {
            pruned++;
            steps.push({ maze: clone2D(maze), candidate: { r: nr, c: nc }, path: [...path, { r, c }], phase: 'blocked', calls: explored, statLabel: 'Nodos explorados', desc: `(${nr},${nc}) podado: ${newCost} + ${cheby(nr, nc)} ≥ mejor ${bestSol === INF ? '∞' : bestSol}.` });
            continue;
          }
          costs[nr][nc] = newCost; maze[nr][nc] = 2; explored++;
          steps.push({ maze: clone2D(maze), path: [...path, { r, c }], current: { r: nr, c: nc }, phase: 'explore', calls: explored, statLabel: 'Nodos explorados', desc: `Explorando (${nr},${nc}), coste ${newCost}.` });
          bt(nr, nc, newCost, [...path, { r, c }]);
          maze[nr][nc] = 3;
        }
      }
      bt(0, 0, 0, [{ r: 0, c: 0 }]);
      steps.push({ maze: clone2D(grid.map(r => [...r])), path: bestPath || [], phase: 'done', calls: explored, statLabel: 'Nodos explorados', desc: `✅ Camino óptimo: ${bestSol} celdas. Explorados: ${explored}, podados: ${pruned}.` });
      return steps;
    },
    render(container, step) { renderMazeSimEnhanced(container, step); }
  },

  /* ── 4. Laberinto: Voraz (Greedy) ── */
  'maze-greedy': {
    id: 'maze-greedy', categoryId: 'pr-laberinto',
    name: 'Laberinto: Voraz (Greedy)', shortName: 'Laberinto Voraz',
    timeComplexity: 'O(n·m)', spaceComplexity: 'O(1)',
    useCases: 'Solución rápida (no siempre óptima) que sirve de cota inicial.',
    description: 'Estrategia voraz: en cada celda intenta siempre el movimiento que más acerca a la meta (primero diagonal SE, luego S, luego E). Es muy rápida, pero puede quedarse atascada porque nunca retrocede.',
    detailedText: `
      <div class="explain">
        <p><span class="explain-tag">💡 Idea</span>En cada paso tomamos la decisión que parece mejor ahora: avanzar en diagonal si se puede, si no hacia abajo, si no a la derecha.</p>
        <p class="explain-key">🔑 No da marcha atrás: es O(n·m) y muy rápida, pero <strong>no garantiza el óptimo</strong> ni encontrar salida. Suele usarse como cota pesimista inicial para Ramificación y Poda.</p>
      </div>` + prosCons(
        ['Rapidísimo: O(n·m)', 'Muy fácil de implementar', 'No necesita memoria extra'],
        ['No garantiza el camino óptimo', 'Puede quedarse atascado (nunca retrocede)', 'A veces no encuentra la salida aunque exista']),
    generateSteps() {
      // Laberinto donde la marcha voraz (SE→S→E) esquiva muros y llega a la meta
      // por una ruta no trivial, para ver bien su lógica de decisión.
      const grid = [
        [1, 1, 1, 0],
        [0, 0, 1, 1],
        [1, 1, 0, 1],
        [1, 0, 1, 1]
      ];
      const ROWS = grid.length, COLS = grid[0].length;
      const steps = [];
      const maze = grid.map(r => [...r]);
      const path = [{ r: 0, c: 0 }];
      maze[0][0] = 2;
      steps.push({ maze: clone2D(maze), path: [{ r: 0, c: 0 }], current: { r: 0, c: 0 }, phase: 'init', desc: `<strong>Voraz</strong>: prioridad de movimiento SE → S → E. Siempre hacia la meta, sin retroceder.` });
      let r = 0, c = 0;
      while (r !== ROWS - 1 || c !== COLS - 1) {
        let moved = false;
        for (const [nr, nc, dir] of [[r + 1, c + 1, 'SE'], [r + 1, c, 'S'], [r, c + 1, 'E']]) {
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] !== 0 && maze[nr][nc] !== 2) {
            r = nr; c = nc; maze[r][c] = 2; path.push({ r, c });
            steps.push({ maze: clone2D(maze), path: [...path], current: { r, c }, phase: 'move', desc: `Movimiento ${dir} → (${r},${c}).` });
            moved = true; break;
          }
        }
        if (!moved) {
          steps.push({ maze: clone2D(maze), path: [...path], current: { r, c }, phase: 'fail', desc: `⚠ La estrategia voraz se atasca en (${r},${c}): no puede avanzar y no retrocede.` });
          return steps;
        }
      }
      steps.push({ maze: clone2D(maze), path: [...path], current: { r, c }, phase: 'found', desc: `✅ Meta alcanzada por la vía voraz en ${path.length} celdas.` });
      return steps;
    },
    render(container, step) { renderMazeSimEnhanced(container, step); }
  },

  /* ── 5. Laberinto: Ramificación y Poda (Branch & Bound) ── */
  'maze-bb': {
    id: 'maze-bb', categoryId: 'pr-laberinto',
    name: 'Laberinto: Ramificación y Poda', shortName: 'Laberinto R&P',
    timeComplexity: 'Exponencial (podado)', spaceComplexity: 'O(n·m)',
    useCases: 'Camino óptimo expandiendo siempre el nodo más prometedor.',
    description: 'Ramificación y Poda con cola de prioridad: expande siempre el nodo de menor cota f(n) = g(n) + h(n), donde g son los pasos dados y h la distancia Chebyshev a la meta. Poda todo nodo cuya cota no pueda mejorar la mejor solución.',
    detailedText: `
      <div class="explain">
        <p><span class="explain-tag">💡 Idea</span>Es "búsqueda informada": en vez de explorar a ciegas, una cola de prioridad elige siempre el nodo con menor cota <code>f(n) = g(n) + h(n)</code> (coste real + estimación optimista a la meta).</p>
        <p><span class="explain-tag">⚙️ Poda</span>Si la cota de un nodo ya iguala o supera la mejor solución encontrada, se descarta sin expandirlo.</p>
        <p class="explain-key">🔑 Con una heurística admisible (Chebyshev nunca sobreestima), se garantiza el camino óptimo explorando muy pocos nodos. Es el equivalente a A* / LC.</p>
      </div>` + prosCons(
        ['Encuentra el óptimo explorando pocos nodos', 'La cola de prioridad va directa a lo prometedor', 'La poda por cotas elimina ramas enteras'],
        ['Coste y memoria de la cola de prioridad', 'Depende de una buena heurística (cota)', 'Más complejo de implementar']),
    generateSteps() {
      // Laberinto con un obstáculo central: hay que rodearlo por dos rutas.
      // Se ve cómo la cola de prioridad avanza por la más prometedora y poda la otra.
      const grid = [
        [1, 1, 1, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 1, 1, 1]
      ];
      const ROWS = grid.length, COLS = grid[0].length;
      const cheby = (r, c) => Math.max(ROWS - 1 - r, COLS - 1 - c);
      const steps = [];
      const maze = grid.map(r => [...r]);
      let best = Infinity, bestPath = null, expanded = 0, pruned = 0;
      let pq = [{ r: 0, c: 0, g: 0, path: [{ r: 0, c: 0 }] }];
      steps.push({ maze: clone2D(maze), path: [], phase: 'init', calls: 0, statLabel: 'Nodos expandidos', desc: `<strong>Ramificación y Poda</strong>: la cola de prioridad ordena por f(n)=g(n)+h(n) (h = distancia Chebyshev). Expandimos siempre la menor cota.` });
      while (pq.length) {
        pq.sort((a, b) => (a.g + cheby(a.r, a.c)) - (b.g + cheby(b.r, b.c)));
        const node = pq.shift();
        const f = node.g + cheby(node.r, node.c);
        if (f >= best) {
          pruned++;
          steps.push({ maze: clone2D(maze), candidate: { r: node.r, c: node.c }, path: node.path, phase: 'blocked', calls: expanded, statLabel: 'Nodos expandidos', desc: `Nodo (${node.r},${node.c}) con f=${f} ≥ mejor ${best} → <strong>podado</strong>.` });
          continue;
        }
        expanded++;
        if (maze[node.r][node.c] === 1) maze[node.r][node.c] = 2;
        if (node.r === ROWS - 1 && node.c === COLS - 1) {
          if (node.g + 1 < best) {
            best = node.g + 1; bestPath = node.path;
            steps.push({ maze: clone2D(maze), path: node.path, current: { r: node.r, c: node.c }, phase: 'found', calls: expanded, statLabel: 'Nodos expandidos', desc: `¡Meta alcanzada! Camino de ${best} celdas. Mejor cota = ${best}.` });
          }
          continue;
        }
        const frontier = [];
        for (const [dr, dc] of [[1, 1], [1, 0], [0, 1]]) {
          const nr = node.r + dr, nc = node.c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === 1) {
            pq.push({ r: nr, c: nc, g: node.g + 1, path: [...node.path, { r: nr, c: nc }] });
            frontier.push(`(${nr},${nc})`);
          }
        }
        steps.push({ maze: clone2D(maze), path: node.path, current: { r: node.r, c: node.c }, phase: 'visit', calls: expanded, statLabel: 'Nodos expandidos', desc: `Expandimos (${node.r},${node.c}): g=${node.g}, f=${f}. A la cola: ${frontier.join(', ') || '—'}.` });
      }
      steps.push({ maze: clone2D(grid.map(r => [...r])), path: bestPath || [], phase: 'done', calls: expanded, statLabel: 'Nodos expandidos', desc: `✅ Camino óptimo de ${best} celdas. Nodos expandidos: ${expanded}, podados: ${pruned}.` });
      return steps;
    },
    render(container, step) { renderMazeSimEnhanced(container, step); }
  },

  /* ── 6. Ordenación: Bubble Sort ── */
  'bubble-sort': {
    id: 'bubble-sort', categoryId: 'pr-orden',
    name: 'Bubble Sort', shortName: 'Bubble Sort',
    timeComplexity: 'O(n²)', spaceComplexity: 'O(1)',
    useCases: 'Ordenación sencilla; base para medir la eficiencia empírica.',
    description: 'Recorre el array comparando pares adyacentes e intercambiándolos si están desordenados. En cada pasada, el mayor "burbujea" hasta su posición final. Simple pero de coste cuadrático.',
    detailedText: `
      <div class="explain">
        <p><span class="explain-tag">💡 Idea</span>Comparamos elementos vecinos y los intercambiamos si están en el orden equivocado. Repetimos pasadas hasta que no queden intercambios.</p>
        <p><span class="explain-tag">⚙️ Burbujeo</span>Tras la pasada <code>i</code>, los <code>i</code> mayores ya están colocados al final, así que cada pasada mira un poco menos.</p>
        <p class="explain-key">🔑 Dos bucles anidados → O(n²). Es fácil de entender pero inviable para arrays grandes; sirve para comparar tiempos frente a O(n log n).</p>
      </div>`,
    generateSteps() {
      const arr = [64, 34, 25, 12, 22, 11, 90];
      const steps = [];
      const a = [...arr];
      const n = a.length;
      const swapLog = [];
      steps.push({ arr: [...a], i: -1, j: -1, swapped: -1, swapLog: [], phase: 'init',
        desc: `<strong>Bubble Sort</strong> en array de ${n} elementos. Comparamos v[j] con v[j+1] y, si están desordenados, los intercambiamos.` });
      for (let i = 1; i < n; i++) {
        for (let j = 0; j < n - i; j++) {
          steps.push({ arr: [...a], i, j, swapped: -1, swapLog: [...swapLog], phase: 'compare',
            desc: `<strong>i=${i}, j=${j}</strong>: comparamos v[${j}]=${a[j]} con v[${j + 1}]=${a[j + 1]}.` });
          if (a[j] > a[j + 1]) {
            const tmp = a[j]; a[j] = a[j + 1]; a[j + 1] = tmp;
            swapLog.push(j);
            steps.push({ arr: [...a], i, j, swapped: j, swapLog: [...swapLog], phase: 'swap',
              desc: `v[${j}] &gt; v[${j + 1}] → <strong>intercambio</strong>. Array: [${a.join(', ')}].` });
          }
        }
        steps.push({ arr: [...a], i, j: n - i - 1, swapped: -1, swapLog: [...swapLog], phase: 'pass',
          desc: `Pasada ${i} completada: los últimos ${i} elementos ya están fijos ✓.` });
      }
      steps.push({ arr: [...a], i: -1, j: -1, swapped: -1, swapLog: [...swapLog], phase: 'done',
        desc: `✅ <strong>Array ordenado</strong>. Intercambios totales: ${swapLog.length}.` });
      return steps;
    },
    render(container, step) {
      const { arr, i, j, swapped, phase, swapLog = [] } = step;
      const n = arr.length;
      const sortedStart = (phase === 'pass' || phase === 'done') ? (phase === 'done' ? 0 : n - i) : n + 1;
      const max = Math.max(...arr);
      const st = idx => {
        if (phase === 'done' || idx >= sortedStart) return 'srt';
        if (idx === swapped || idx === swapped + 1) return 'swp';
        if (idx === j || idx === j + 1) return 'cmp';
        return 'def';
      };
      container.innerHTML = `
        <div style="width:100%">
          <div style="text-align:center;margin-bottom:10px;font-size:.82rem;color:var(--txt-muted);font-family:'JetBrains Mono',monospace">
            Pasada i=${i < 0 ? '—' : i} · j=${j < 0 ? '—' : j} · Intercambios: ${swapLog.length}
          </div>
          <div class="arr-wrap">
            ${arr.map((v, idx) => `
              <div class="bar-col">
                <div class="bar-val">${v}</div>
                <div class="bar ${st(idx)}" style="height:${Math.max(8, (v / max) * 100)}%"></div>
                <div class="bar-idx">${idx}</div>
              </div>`).join('')}
          </div>
          ${legend([C.def, 'Sin procesar'], [C.cmp, 'Comparando'], [C.swp, 'Intercambio'], [C.srt, 'Ordenado (fijo)'])}
        </div>`;
    }
  }
};
