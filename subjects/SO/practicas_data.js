/* ================================================================
   Sistemas Operativos — PRÁCTICAS
   Trazas interactivas del laboratorio.
   ================================================================ */

'use strict';

const PRACTICAS = [
  {
    id: 'p1-procesos',
    name: 'P1 — Procesos e IPC',
    icon: '🌿',
    algoIds: ['p-fork-tree', 'p-pipe', 'p-shm']
  },
  {
    id: 'p2-concurrencia',
    name: 'P2 — Concurrencia',
    icon: '🔒',
    algoIds: ['p-productor-consumidor']
  },
  {
    id: 'p3-memoria',
    name: 'P3 — Gestión de memoria',
    icon: '🧩',
    algoIds: ['p-gestor-memoria']
  }
];

/* ══════════════════════════════════════════════════════════════════
   1. ÁRBOL DE PROCESOS (fork) — Práctica 1: ejec.c
══════════════════════════════════════════════════════════════════ */
const P_FORK_TREE = {
  id: 'p-fork-tree', name: 'Árbol de procesos con fork()', shortName: 'fork() — árbol',
  topic: 'Práctica 1', kind: 'fork · wait · exit',
  description: 'La llamada fork() crea un hijo idéntico al padre. Devuelve 0 en el hijo y el PID del hijo en el padre. Con varias llamadas se puede construir un árbol de procesos como el de ejec.c.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">fork()</span> Duplica la imagen del proceso. Padre e hijo continúan tras el <code>fork()</code>.</p>
    <p><span class="explain-tag">wait()</span> El padre espera la terminación de sus hijos, evita zombis y recoge el estado de salida.</p>
  </div>`,
  useCases: 'Shell (bash), servidores prefork (Apache)',

  generateSteps() {
    // ejec.c: crea árbol ejec → A → B → {X, Y, Z}
    // Simplificamos: raíz → A, B; A → X, Y
    return [
      { nodes: [{ id:'R', pid:1234, ppid:1, label:'ejec' }], edges:[], newNode:'R', desc:
        `Se ejecuta <code>./ejec</code>. Solo existe el proceso raíz con PID <code>1234</code>.` },
      { nodes:[
          { id:'R', pid:1234, ppid:1,    label:'ejec' },
          { id:'A', pid:1235, ppid:1234, label:'A' },
        ], edges:[['R','A']], newNode:'A', desc:
        `Primer <code>fork()</code>: el padre recibe PID=1235 (el hijo). El hijo A se crea con PID=1235 y PPID=1234.` },
      { nodes:[
          { id:'R', pid:1234, ppid:1,    label:'ejec' },
          { id:'A', pid:1235, ppid:1234, label:'A' },
          { id:'B', pid:1236, ppid:1234, label:'B' },
        ], edges:[['R','A'], ['R','B']], newNode:'B', desc:
        `Segundo <code>fork()</code> en el padre: se crea B con PID=1236. El árbol ya tiene dos hijos.` },
      { nodes:[
          { id:'R', pid:1234, ppid:1,    label:'ejec' },
          { id:'A', pid:1235, ppid:1234, label:'A' },
          { id:'B', pid:1236, ppid:1234, label:'B' },
          { id:'X', pid:1237, ppid:1235, label:'X' },
        ], edges:[['R','A'], ['R','B'], ['A','X']], newNode:'X', desc:
        `Ahora A hace <code>fork()</code>: crea X con PID=1237, PPID=1235.` },
      { nodes:[
          { id:'R', pid:1234, ppid:1,    label:'ejec' },
          { id:'A', pid:1235, ppid:1234, label:'A' },
          { id:'B', pid:1236, ppid:1234, label:'B' },
          { id:'X', pid:1237, ppid:1235, label:'X' },
          { id:'Y', pid:1238, ppid:1235, label:'Y' },
        ], edges:[['R','A'], ['R','B'], ['A','X'], ['A','Y']], newNode:'Y', desc:
        `A hace un segundo <code>fork()</code>: crea Y. Ahora la topología es ejec → {A → {X, Y}, B}.` },
      { nodes:[
          { id:'R', pid:1234, ppid:1,    label:'ejec' },
          { id:'A', pid:1235, ppid:1234, label:'A' },
          { id:'B', pid:1236, ppid:1234, label:'B', dying: true },
          { id:'X', pid:1237, ppid:1235, label:'X' },
          { id:'Y', pid:1238, ppid:1235, label:'Y' },
        ], edges:[['R','A'], ['R','B'], ['A','X'], ['A','Y']], desc:
        `<code>B</code> llama a <code>exit(0)</code> y termina. Queda como <em>zombi</em> hasta que el padre haga <code>wait()</code>.` },
      { nodes:[
          { id:'R', pid:1234, ppid:1,    label:'ejec' },
          { id:'A', pid:1235, ppid:1234, label:'A' },
          { id:'X', pid:1237, ppid:1235, label:'X' },
          { id:'Y', pid:1238, ppid:1235, label:'Y' },
        ], edges:[['R','A'], ['A','X'], ['A','Y']], reaped:'B', desc:
        `El padre llama a <code>wait()</code> y recoge el estado de B. B desaparece de la tabla de procesos.` },
      { nodes:[
          { id:'R', pid:1234, ppid:1,    label:'ejec' },
          { id:'A', pid:1235, ppid:1234, label:'A' },
        ], edges:[['R','A']], reaped:'X,Y', desc:
        `X e Y terminan y son recogidos por A. La cascada de terminación sube por el árbol de abajo hacia arriba.` },
      { nodes:[
          { id:'R', pid:1234, ppid:1,    label:'ejec' },
        ], edges:[], reaped:'A', desc:
        `A termina. El padre <code>ejec</code> lo recoge. Todo el árbol se ha desmontado.` },
    ];
  },

  render(container, step) {
    const layout = {
      R: { x: 250, y: 50 },
      A: { x: 130, y: 130 },
      B: { x: 370, y: 130 },
      X: { x: 70,  y: 210 },
      Y: { x: 190, y: 210 },
    };
    const W = 500, H = 260;

    const edges = step.edges.map(([a, b]) => {
      const A = layout[a], B = layout[b];
      const isNew = step.newNode === b;
      return `<line class="proc-link ${isNew?'new':''}" x1="${A.x}" y1="${A.y+22}" x2="${B.x}" y2="${B.y-22}" stroke="${isNew?SO.orange:SO.slateD}" stroke-width="${isNew?3:2}"/>`;
    }).join('');

    const nodes = step.nodes.map(n => {
      const p = layout[n.id];
      if (!p) return '';
      const isNew = step.newNode === n.id;
      const dying = n.dying;
      const fill = dying ? SO.redL : (isNew ? SO.orangeL : SO.blueL);
      const stroke = dying ? SO.red : (isNew ? SO.orange : SO.blue);
      return `<g class="proc-node ${isNew?'new':''}">
        <circle cx="${p.x}" cy="${p.y}" r="24" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
        <text x="${p.x}" y="${p.y+2}" style="font-size:12px;fill:${dying?SO.redD:(isNew?SO.orangeD:SO.blueD)}">${n.label}</text>
        <text x="${p.x}" y="${p.y+14}" style="font-family:JetBrains Mono,monospace;font-size:8.5px;font-weight:700;fill:${SO.muted};text-anchor:middle">${n.pid}</text>
      </g>`;
    }).join('');

    // Legend / info
    const legendHTML = step.reaped
      ? `<div style="font-family:JetBrains Mono,monospace;font-size:.76rem;background:${SO.greenL};color:${SO.greenD};padding:5px 12px;border-radius:5px;border:1px solid ${SO.green};font-weight:800">wait() → ${step.reaped}</div>`
      : '';

    container.innerHTML = `
      <div class="tree-wrap" style="flex-direction:column;gap:12px">
        <svg class="tree-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:520px">
          ${edges}
          ${nodes}
        </svg>
        ${legendHTML}
        <div style="font-family:JetBrains Mono,monospace;font-size:.72rem;color:${SO.muted}">Procesos vivos: <strong>${step.nodes.length}</strong></div>
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════
   2. PIPE padre-hijo (copiar.c)
══════════════════════════════════════════════════════════════════ */
const P_PIPE = {
  id: 'p-pipe', name: 'Tubería padre → hijo (pipe)', shortName: 'pipe()',
  topic: 'Práctica 1', kind: 'pipe · fd[0] · fd[1]',
  description: 'Una tubería sin nombre es un canal unidireccional entre procesos relacionados. copiar.c crea una tubería, hace fork() y el padre escribe en fd[1] mientras el hijo lee en fd[0] para copiar un archivo.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">pipe(fd)</span> Crea dos descriptores: <code>fd[0]</code> lectura y <code>fd[1]</code> escritura. Ambos se heredan al hijo con <code>fork()</code>.</p>
  </div>`,
  useCases: 'Shell (|), tuberías Unix',

  generateSteps() {
    return [
      { phase:'start', bytes:0, delivered:0, parentActive:false, childActive:false, srcBytes:5, dstBytes:0, desc:
        `Fichero origen: <code>ORIGEN.TXT</code> con 5 caracteres. <code>copiar()</code> abre pipe y hace fork().` },
      { phase:'pipe', bytes:0, delivered:0, parentActive:false, childActive:false, srcBytes:5, dstBytes:0, desc:
        `<code>pipe(fd)</code>: se crean los dos descriptores <code>fd[0]</code> (lectura) y <code>fd[1]</code> (escritura). Padre e hijo los heredan.` },
      { phase:'read1', bytes:1, delivered:0, parentActive:true, childActive:false, srcBytes:5, dstBytes:0, desc:
        `El padre lee 1 byte del fichero origen y lo escribe en <code>fd[1]</code>.` },
      { phase:'read2', bytes:1, delivered:1, parentActive:false, childActive:true, srcBytes:4, dstBytes:1, desc:
        `El hijo lee 1 byte de <code>fd[0]</code> y lo escribe en <code>DESTINO.TXT</code>.` },
      { phase:'read3', bytes:2, delivered:1, parentActive:true, childActive:false, srcBytes:4, dstBytes:1, desc:
        `El padre continúa leyendo del origen y escribiendo al pipe.` },
      { phase:'read4', bytes:2, delivered:2, parentActive:false, childActive:true, srcBytes:3, dstBytes:2, desc:
        `El hijo continúa vaciando el pipe hacia el destino.` },
      { phase:'read5', bytes:5, delivered:5, parentActive:false, childActive:false, srcBytes:0, dstBytes:5, desc:
        `Después de varias iteraciones, se ha transferido todo el contenido.` },
      { phase:'close', bytes:5, delivered:5, parentActive:false, childActive:false, srcBytes:0, dstBytes:5, desc:
        `El padre cierra <code>fd[1]</code>; el hijo detecta EOF al leer <code>fd[0]</code> y cierra su lado. wait() completa la operación.` },
    ];
  },

  render(container, step) {
    const pipeContent = step.bytes - step.delivered;

    const parentBox = `
      <div class="pipe-box ${step.parentActive?'active':''}">
        <div class="pipe-title">Padre</div>
        <div class="pipe-fd">read ORIGEN.TXT</div>
        <div class="pipe-fd">→ write fd[1]</div>
      </div>`;

    const childBox = `
      <div class="pipe-box ${step.childActive?'active':''}">
        <div class="pipe-title">Hijo</div>
        <div class="pipe-fd">read fd[0]</div>
        <div class="pipe-fd">→ write DESTINO.TXT</div>
      </div>`;

    const pipeTube = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
        <div style="font-family:JetBrains Mono,monospace;font-size:.64rem;color:${SO.muted};font-weight:800">fd[1] → fd[0]</div>
        <div class="pipe-tube">
          ${[...Array(pipeContent)].map(() => `<div class="pipe-byte">B</div>`).join('')}
        </div>
        <div style="font-family:JetBrains Mono,monospace;font-size:.64rem;color:${SO.muted};font-weight:800">Bytes en pipe: ${pipeContent}</div>
      </div>`;

    // Ficheros
    const srcHTML = `
      <div style="text-align:center">
        <div style="font-family:JetBrains Mono,monospace;font-size:.66rem;color:${SO.muted};font-weight:800">ORIGEN.TXT</div>
        <div style="display:flex;gap:2px;justify-content:center;margin-top:4px">
          ${[...Array(5)].map((_, i) => i < step.srcBytes ? `<div style="width:22px;height:22px;background:${SO.blueL};border:1px solid ${SO.blue};border-radius:3px"></div>` : `<div style="width:22px;height:22px;background:#f8fafc;border:1px dashed ${SO.slateL};border-radius:3px"></div>`).join('')}
        </div>
      </div>`;

    const dstHTML = `
      <div style="text-align:center">
        <div style="font-family:JetBrains Mono,monospace;font-size:.66rem;color:${SO.muted};font-weight:800">DESTINO.TXT</div>
        <div style="display:flex;gap:2px;justify-content:center;margin-top:4px">
          ${[...Array(5)].map((_, i) => i < step.dstBytes ? `<div style="width:22px;height:22px;background:${SO.greenL};border:1px solid ${SO.green};border-radius:3px"></div>` : `<div style="width:22px;height:22px;background:#f8fafc;border:1px dashed ${SO.slateL};border-radius:3px"></div>`).join('')}
        </div>
      </div>`;

    container.innerHTML = `
      <div class="pipe-wrap">
        <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap;justify-content:center">
          ${srcHTML}
          ${parentBox}
          ${pipeTube}
          ${childBox}
          ${dstHTML}
        </div>
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════
   3. MEMORIA COMPARTIDA (hijos.c)
══════════════════════════════════════════════════════════════════ */
const P_SHM = {
  id: 'p-shm', name: 'Memoria compartida entre procesos', shortName: 'shmget · shmat',
  topic: 'Práctica 1', kind: 'shmget · shmat · shmdt',
  description: 'System V shared memory permite que varios procesos accedan a un mismo segmento de memoria. hijos.c crea un árbol y todos los procesos leen/escriben una variable entera común.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">shmget</span> crea o abre un segmento de memoria compartida identificado por una clave. <span class="explain-tag">shmat</span> lo asocia (mmap) al espacio del proceso. <span class="explain-tag">shmdt</span> lo desasocia.</p>
    <p><span class="explain-tag">Concurrencia</span> Sin sincronización, las escrituras concurrentes producen condiciones de carrera.</p>
  </div>`,
  useCases: 'IPC de alto rendimiento (bases de datos, PostgreSQL)',

  generateSteps() {
    // 4 procesos: P0 (raíz), P1, P2, P3 (hijos)
    return [
      { phase:'shmget', shmValue:0, procs:[
          { id:'P0', pid:1000, attached:false, action:'shmget' },
        ], desc:
        `<code>P0</code> hace <code>shmget(clave, 4, IPC_CREAT)</code>: pide al kernel un segmento de 4 bytes para un <code>int</code>.` },
      { phase:'shmat0', shmValue:0, procs:[
          { id:'P0', pid:1000, attached:true, action:'shmat' },
        ], desc:
        `<code>P0</code> hace <code>shmat(shmid)</code>: el segmento aparece en su espacio de direcciones como un puntero.` },
      { phase:'init', shmValue:0, procs:[
          { id:'P0', pid:1000, attached:true, action:'*p = 0' },
        ], desc:
        `<code>P0</code> inicializa <code>*p = 0</code>. Ahora hace fork() para crear tres hijos.` },
      { phase:'fork', shmValue:0, procs:[
          { id:'P0', pid:1000, attached:true },
          { id:'P1', pid:1001, attached:true, action:'shmat' },
          { id:'P2', pid:1002, attached:true, action:'shmat' },
          { id:'P3', pid:1003, attached:true, action:'shmat' },
        ], desc:
        `Los hijos también hacen <code>shmat</code>: todos ven el mismo segmento físico. Modificar <code>*p</code> en uno se ve en los otros.` },
      { phase:'inc1', shmValue:1, procs:[
          { id:'P0', pid:1000, attached:true },
          { id:'P1', pid:1001, attached:true, action:'(*p)++', highlight:true },
          { id:'P2', pid:1002, attached:true },
          { id:'P3', pid:1003, attached:true },
        ], desc:
        `<code>P1</code> hace <code>(*p)++</code>. Valor pasa a <code>1</code>.` },
      { phase:'inc2', shmValue:2, procs:[
          { id:'P0', pid:1000, attached:true },
          { id:'P1', pid:1001, attached:true },
          { id:'P2', pid:1002, attached:true, action:'(*p)++', highlight:true },
          { id:'P3', pid:1003, attached:true },
        ], desc:
        `<code>P2</code> incrementa. Valor <code>2</code>. Sin semáforo, dos hijos podrían corromper esta operación (read-modify-write no atómico).` },
      { phase:'inc3', shmValue:3, procs:[
          { id:'P0', pid:1000, attached:true },
          { id:'P1', pid:1001, attached:true },
          { id:'P2', pid:1002, attached:true },
          { id:'P3', pid:1003, attached:true, action:'(*p)++', highlight:true },
        ], desc:
        `<code>P3</code> incrementa. Valor <code>3</code>. Todos los procesos ven el mismo valor porque comparten la misma zona.` },
      { phase:'detach', shmValue:3, procs:[
          { id:'P0', pid:1000, attached:true, action:'shmdt · shmctl(RMID)' },
        ], desc:
        `Los hijos hacen <code>shmdt</code> y salen. El padre recolecta con <code>wait</code>, luego destruye el segmento con <code>shmctl(shmid, IPC_RMID)</code>.` },
    ];
  },

  render(container, step) {
    // Segmento compartido en el centro
    const shmHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="font-family:JetBrains Mono,monospace;font-size:.68rem;color:${SO.muted};font-weight:800;text-transform:uppercase">Memoria compartida</div>
        <div style="padding:14px 26px;background:${SO.orangeL};border:3px solid ${SO.orange};border-radius:10px;font-family:JetBrains Mono,monospace;font-size:1.4rem;font-weight:800;color:${SO.orangeD};box-shadow:0 0 0 4px rgba(251,146,60,.2)">
          *p = ${step.shmValue}
        </div>
      </div>`;

    // Procesos alrededor
    const procHTML = step.procs.map(p => `
      <div style="text-align:center">
        <div style="padding:10px 14px;background:${p.highlight?SO.orangeL:'white'};border:2px solid ${p.highlight?SO.orange:(p.attached?SO.blue:SO.slateL)};border-radius:8px;transition:all .3s">
          <div style="font-family:Inter,sans-serif;font-weight:800;font-size:.85rem;color:${SO.txt}">${p.id}</div>
          <div style="font-family:JetBrains Mono,monospace;font-size:.68rem;color:${SO.muted};margin-top:2px">PID ${p.pid}</div>
          ${p.action ? `<div style="font-family:JetBrains Mono,monospace;font-size:.68rem;color:${p.highlight?SO.orangeD:SO.blueD};margin-top:4px;font-weight:800;background:${p.highlight?SO.orangeL:SO.blueL};padding:2px 6px;border-radius:4px">${p.action}</div>` : ''}
        </div>
      </div>`).join('');

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:20px;width:100%">
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
          ${procHTML}
        </div>
        ${shmHTML}
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════
   4. PRODUCTOR - CONSUMIDOR (P2)
══════════════════════════════════════════════════════════════════ */
const P_PC = {
  id: 'p-productor-consumidor', name: 'Productor–Consumidor (buffer circular)', shortName: 'Prod. / Cons.',
  topic: 'Práctica 2', kind: 'Semáforos · mutex · vacio · lleno',
  description: 'Dos procesos comparten un buffer circular. El productor añade elementos si hay huecos; el consumidor los saca si hay elementos. Semáforos vacío/lleno cuentan huecos y elementos; mutex protege la sección crítica.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Semáforos</span> <code>vacio</code> = huecos disponibles (inicial N), <code>lleno</code> = elementos (inicial 0). <code>mutex</code> asegura exclusión al buffer.</p>
  </div>`,
  useCases: 'Cualquier cola productor/consumidor: kernel, servers',

  generateSteps() {
    const N = 4;
    const steps = [];
    let buffer = new Array(N).fill(null);
    let head = 0, tail = 0;
    let sem = { mutex: 1, vacio: N, lleno: 0 };
    let items = 0;
    let counter = 0;

    steps.push({ buffer:[...buffer], head, tail, sem:{...sem}, items, producer:'idle', consumer:'idle', desc:
      `Estado inicial: buffer de ${N} posiciones vacío. <code>vacio=${N}</code>, <code>lleno=0</code>, <code>mutex=1</code>.` });

    // Productor produce
    sem.vacio--;
    sem.mutex--;
    steps.push({ buffer:[...buffer], head, tail, sem:{...sem}, items, producer:'work', consumer:'idle', desc:
      `Productor: <code>wait(vacio)</code> pasa vacio=3; <code>wait(mutex)</code> pasa mutex=0. Entra en sección crítica.` });

    // Escribe A
    buffer[tail] = 'A'; counter++;
    const oldTail = tail; tail = (tail + 1) % N;
    items++;
    steps.push({ buffer:[...buffer], head, tail, sem:{...sem}, items, producer:'work', consumer:'idle', desc:
      `Productor escribe elemento <code>A</code> en posición ${oldTail}. Avanza tail.` });

    sem.mutex++;
    sem.lleno++;
    steps.push({ buffer:[...buffer], head, tail, sem:{...sem}, items, producer:'idle', consumer:'idle', desc:
      `<code>signal(mutex)</code> mutex=1, <code>signal(lleno)</code> lleno=1. Sale de la sección.` });

    // Consumidor consume
    sem.lleno--; sem.mutex--;
    steps.push({ buffer:[...buffer], head, tail, sem:{...sem}, items, producer:'idle', consumer:'work', desc:
      `Consumidor: <code>wait(lleno)</code> pasa lleno=0, <code>wait(mutex)</code> pasa mutex=0. Entra a leer.` });

    const readItem = buffer[head];
    buffer[head] = null;
    const oldHead = head; head = (head + 1) % N;
    items--;
    steps.push({ buffer:[...buffer], head, tail, sem:{...sem}, items, producer:'idle', consumer:'work', consumedItem: readItem, desc:
      `Consumidor lee <code>${readItem}</code> de la posición ${oldHead}. Avanza head.` });

    sem.mutex++; sem.vacio++;
    steps.push({ buffer:[...buffer], head, tail, sem:{...sem}, items, producer:'idle', consumer:'idle', desc:
      `<code>signal(mutex)</code> mutex=1, <code>signal(vacio)</code> vacio=${sem.vacio}. Buffer vacío otra vez.` });

    // Productor llena todo el buffer
    for (const val of ['B', 'C', 'D', 'E']) {
      sem.vacio--;
      steps.push({ buffer:[...buffer], head, tail, sem:{...sem}, items, producer:'work', consumer:'idle', desc:
        `Productor produce <code>${val}</code>: <code>wait(vacio)</code> → vacio=${sem.vacio}.` });
      sem.mutex--;
      buffer[tail] = val;
      const oldT = tail; tail = (tail + 1) % N;
      items++;
      sem.mutex++;
      sem.lleno++;
      steps.push({ buffer:[...buffer], head, tail, sem:{...sem}, items, producer:'idle', consumer:'idle', desc:
        `Escribe <code>${val}</code> en posición ${oldT}. lleno=${sem.lleno}.` });
    }

    // Producer intenta producir en buffer lleno → se bloquea
    steps.push({ buffer:[...buffer], head, tail, sem:{...sem}, items, producer:'blocked', consumer:'idle', desc:
      `Buffer lleno. Productor intenta <code>wait(vacio)</code> pero vacio=0: <strong>se bloquea</strong> en la cola del semáforo.` });

    // Consumer libera un slot
    sem.lleno--; sem.mutex--;
    const readItem2 = buffer[head];
    buffer[head] = null;
    const oldH = head; head = (head + 1) % N;
    items--;
    sem.mutex++;
    sem.vacio++;
    steps.push({ buffer:[...buffer], head, tail, sem:{...sem}, items, producer:'blocked', consumer:'work', consumedItem: readItem2, desc:
      `Consumidor consume <code>${readItem2}</code>. <code>signal(vacio)</code> vacio=1: <strong>desbloquea al productor</strong>.` });

    steps.push({ buffer:[...buffer], head, tail, sem:{...sem}, items, producer:'idle', consumer:'idle', desc:
      `El productor sale de la cola de bloqueados y continúa.` });

    return steps;
  },

  render(container, step) {
    const N = step.buffer.length;

    // Actor cards
    const prodStatus = step.producer === 'work' ? 'working' : (step.producer === 'blocked' ? 'blocked' : '');
    const consStatus = step.consumer === 'work' ? 'working' : (step.consumer === 'blocked' ? 'blocked' : '');

    const producerCard = `
      <div class="pcbuf-actor producer ${prodStatus}">
        <div>Productor</div>
        <div class="actor-sub">${step.producer === 'work' ? 'produciendo…' : step.producer === 'blocked' ? '⏸ bloqueado' : 'esperando'}</div>
      </div>`;
    const consumerCard = `
      <div class="pcbuf-actor consumer ${consStatus}">
        <div>Consumidor</div>
        <div class="actor-sub">${step.consumer === 'work' ? 'consumiendo…' : step.consumer === 'blocked' ? '⏸ bloqueado' : 'esperando'}</div>
      </div>`;

    // Buffer
    const buffSlots = step.buffer.map((val, i) => {
      let cls = 'pcbuf-slot';
      if (val !== null) cls += ' filled';
      if (i === step.head && step.items > 0) cls += ' head';
      if (i === step.tail && step.items < N) cls += ' tail';
      return `<div class="${cls}">${val !== null ? val : '·'}</div>`;
    }).join('');

    // Semáforos
    const semHTML = `
      <div class="sem-panel">
        <div class="sem-badge mutex"><span class="sem-name">mutex</span><span class="sem-val">= ${step.sem.mutex}</span></div>
        <div class="sem-badge vacio"><span class="sem-name">vacio</span><span class="sem-val">= ${step.sem.vacio}</span></div>
        <div class="sem-badge lleno"><span class="sem-name">lleno</span><span class="sem-val">= ${step.sem.lleno}</span></div>
      </div>`;

    container.innerHTML = `
      <div class="pcbuf-wrap">
        <div class="pcbuf-topline">
          ${producerCard}
          <div style="font-family:JetBrains Mono,monospace;color:${SO.muted};font-weight:800">→</div>
          <div class="pcbuf-buffer">${buffSlots}</div>
          <div style="font-family:JetBrains Mono,monospace;color:${SO.muted};font-weight:800">→</div>
          ${consumerCard}
        </div>
        ${semHTML}
        ${legend([
          { c: SO.green, t:'head (consumidor)' },
          { c: SO.blue, t:'tail (productor)' },
          { c: SO.amber, t:'ocupado' },
        ])}
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════
   5. GESTOR DE MEMORIA (P3)
══════════════════════════════════════════════════════════════════ */
const P_MEMORIA = {
  id: 'p-gestor-memoria', name: 'Simulador de gestión de memoria', shortName: 'Gestor memoria',
  topic: 'Práctica 3', kind: 'First-fit · Next-fit',
  description: 'Reproduce el simulador gestormemoria.py de la práctica: 2000 unidades de memoria, procesos con formato "nombre llegada tamaño duración". Compara First-fit y Next-fit sobre la misma secuencia.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">First-fit</span> Empieza a buscar desde el inicio de la lista de huecos.</p>
    <p><span class="explain-tag">Next-fit</span> Continúa desde el último hueco donde se asignó (puntero rotativo).</p>
    <p><span class="explain-tag">Coalescing</span> Al liberar un proceso, si los huecos vecinos son libres, se fusionan en uno mayor.</p>
  </div>`,
  useCases: 'malloc, gestión de memoria del kernel',

  generateSteps() {
    // Simulación simplificada
    // Peticiones: (nombre, llegada, tamaño, duración)
    const peticiones = [
      { name:'A', arrive:0, size:400, dur:3 },
      { name:'B', arrive:1, size:300, dur:2 },
      { name:'C', arrive:2, size:200, dur:5 },
      { name:'D', arrive:4, size:500, dur:4 },
      { name:'E', arrive:5, size:100, dur:3 },
    ];
    const TOTAL = 2000;

    // Simulamos: en cada t, primero se liberan procesos que terminan, luego se procesan llegadas
    const steps = [];
    // Empezamos con un solo hueco
    let mem = [{ start:0, size:TOTAL, type:'free' }];
    let nextPtr = 0; // Para next-fit
    let running = []; // { name, endTime }
    let strategy = 'first';

    steps.push({ mem: JSON.parse(JSON.stringify(mem)), strategy, t:0, event:'start', highlight:null, running:[...running], desc:
      `Simulación con First-fit. Memoria total = ${TOTAL} unidades. Peticiones: ${peticiones.map(p => `${p.name}(t=${p.arrive}, ${p.size}, dur=${p.dur})`).join('; ')}.` });

    const allocFirst = (size) => {
      for (let i = 0; i < mem.length; i++) {
        if (mem[i].type === 'free' && mem[i].size >= size) return i;
      }
      return -1;
    };

    const applyAlloc = (idx, name, size) => {
      const b = mem[idx];
      if (b.size === size) {
        mem[idx] = { start: b.start, size, type: 'proc', name };
      } else {
        mem[idx] = { start: b.start, size, type: 'proc', name };
        mem.splice(idx + 1, 0, { start: b.start + size, size: b.size - size, type:'free' });
      }
    };

    const applyFree = (name) => {
      const idx = mem.findIndex(b => b.type === 'proc' && b.name === name);
      if (idx === -1) return;
      mem[idx].type = 'free';
      delete mem[idx].name;
      // Coalescing izq
      if (idx > 0 && mem[idx-1].type === 'free') {
        mem[idx-1].size += mem[idx].size;
        mem.splice(idx, 1);
      }
      // Coalescing der
      const newIdx = mem.findIndex(b => b.type === 'free' && b.start === (mem[idx-1] ? mem[idx-1].start : mem[idx] && mem[idx].start));
      // Simplify: iterate whole memory and merge adjacent frees
      for (let i = 0; i < mem.length - 1;) {
        if (mem[i].type === 'free' && mem[i+1].type === 'free') {
          mem[i].size += mem[i+1].size;
          mem.splice(i+1, 1);
        } else i++;
      }
    };

    // Ejecutamos t=0..15
    for (let t = 0; t <= 15; t++) {
      // Liberar procesos que terminan en t
      const finished = running.filter(r => r.endTime === t);
      finished.forEach(f => {
        applyFree(f.name);
        steps.push({ mem: JSON.parse(JSON.stringify(mem)), strategy, t, event:`libera ${f.name}`, highlight:null, running: running.filter(r => r.name !== f.name), desc:
          `t=${t}: <code>${f.name}</code> termina. Se libera su partición y se hace <em>coalescing</em> con huecos adyacentes.` });
      });
      running = running.filter(r => r.endTime !== t);

      // Nuevas llegadas
      const arriving = peticiones.filter(p => p.arrive === t);
      arriving.forEach(p => {
        const idx = allocFirst(p.size);
        if (idx === -1) {
          steps.push({ mem: JSON.parse(JSON.stringify(mem)), strategy, t, event:`⚠️ ${p.name} no cabe`, highlight:null, running:[...running], desc:
            `t=${t}: llega <code>${p.name}</code> pidiendo ${p.size}. <strong>No hay hueco suficiente</strong> — queda en espera.` });
        } else {
          applyAlloc(idx, p.name, p.size);
          running.push({ name: p.name, endTime: t + p.dur });
          steps.push({ mem: JSON.parse(JSON.stringify(mem)), strategy, t, event:`asigna ${p.name}`, highlight: p.name, running:[...running], desc:
            `t=${t}: llega <code>${p.name}</code> (${p.size} uds). <strong>First-fit</strong> lo coloca en el primer hueco válido.` });
        }
      });
    }

    return steps;
  },

  render(container, step) {
    const TOTAL = 2000;
    const blocks = step.mem.map(b => {
      let cls = 'mem-block';
      if (b.type === 'free') cls += ' free';
      else cls += ' p-' + b.name;
      if (step.highlight === b.name) cls += ' candidate';
      const width = (b.size / TOTAL) * 100;
      const label = b.type === 'free' ? 'Libre' : b.name;
      return `<div class="${cls}" style="width:${width}%">
        <div>${label}</div>
        <div class="mem-block-size">${b.size}</div>
      </div>`;
    }).join('');

    const runningHTML = step.running.length
      ? step.running.map(r => `<span class="badge badge-topic" style="font-size:.68rem">${r.name} → t=${r.endTime}</span>`).join(' ')
      : `<span style="font-family:JetBrains Mono,monospace;font-size:.72rem;color:${SO.muted};font-style:italic">— sin procesos activos —</span>`;

    container.innerHTML = `
      <div class="mem-wrap">
        <div style="font-family:JetBrains Mono,monospace;font-size:.78rem;color:${SO.orangeD};font-weight:800;background:${SO.orangeL};padding:5px 14px;border-radius:5px;border:1px solid ${SO.orange}">
          t=${step.t} · ${step.event}
        </div>
        <div class="mem-bar" style="height:70px">${blocks}</div>
        <div class="mem-scale"><span>0</span><span>500</span><span>1000</span><span>1500</span><span>2000</span></div>
        <div style="text-align:center">
          <div style="font-size:.66rem;font-weight:800;color:${SO.muted};text-transform:uppercase;margin-bottom:4px">Procesos en ejecución</div>
          ${runningHTML}
        </div>
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════
   ÍNDICE DE PRÁCTICAS
══════════════════════════════════════════════════════════════════ */
const PRACTICAS_DATA = {
  'p-fork-tree':            P_FORK_TREE,
  'p-pipe':                 P_PIPE,
  'p-shm':                  P_SHM,
  'p-productor-consumidor': P_PC,
  'p-gestor-memoria':       P_MEMORIA,
};
