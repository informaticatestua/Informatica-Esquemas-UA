/* ================================================================
   Sistemas Operativos — TEORÍA
   Datos y visualizadores para los 15 conceptos clave.
   ================================================================ */

'use strict';

/* ── Paleta compartida ── */
const SO = {
  blue: '#3b82f6', blueD: '#1d4ed8', blueL: '#eff6ff',
  cyan: '#06b6d4', cyanD: '#0e7490', cyanL: '#ecfeff',
  green: '#10b981', greenD: '#065f46', greenL: '#ecfdf5',
  amber: '#f59e0b', amberD: '#92400e', amberL: '#fffbeb',
  orange: '#fb923c', orangeD: '#c2410c', orangeL: '#fff7ed',
  purple: '#8b5cf6', purpleD: '#6d28d9', purpleL: '#f5f3ff',
  red: '#ef4444', redD: '#991b1b', redL: '#fef2f2',
  slate: '#64748b', slateL: '#e2e8f0', slateD: '#334155',
  txt: '#0f172a', muted: '#94a3b8', white: '#ffffff',
};

function legend(items) {
  return `<div class="legend">${items.map(i => `<div class="leg-item"><div class="leg-dot" style="background:${i.c}"></div>${i.t}</div>`).join('')}</div>`;
}
function arrowMarker(id, color) {
  return `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${color}"/></marker>`;
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  1. ESTADOS DEL PROCESO                                            ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_ESTADOS = {
  id: 'estados-proceso', name: 'Estados del proceso y transiciones', shortName: 'Estados del proceso',
  topic: 'Procesos', kind: 'Diagrama de estados',
  description: 'Un proceso pasa por varios estados durante su vida: Nuevo, Listo, Ejecutando, Bloqueado y Terminado. Las transiciones las dispara el planificador, las peticiones de E/S y otros eventos del sistema.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Transiciones</span> El planificador de corto plazo (PCP) mueve procesos entre <strong>Listo</strong> y <strong>Ejecutando</strong>. Una E/S envía al proceso a <strong>Bloqueado</strong>; cuando termina, vuelve a <strong>Listo</strong>.</p>
  </div>`,
  useCases: 'Base conceptual de todo SO multiprogramado',

  generateSteps() {
    const T = [
      { from:'nuevo', to:'listo',      label:'admit',        desc:`El planificador de largo plazo (PLP) admite el proceso: pasa de <strong>Nuevo</strong> a <strong>Listo</strong> y se encola en la cola de preparados.` },
      { from:'listo', to:'ejecutando', label:'planificador', desc:`El PCP elige este proceso: pasa de <strong>Listo</strong> a <strong>Ejecutando</strong>. La CPU carga sus registros del PCB.` },
      { from:'ejecutando', to:'listo', label:'quantum/expulsión', desc:`El proceso agota su quantum o es expulsado por uno de prioridad mayor: vuelve a <strong>Listo</strong> mientras espera CPU.` },
      { from:'listo', to:'ejecutando', label:'planificador', desc:`El PCP vuelve a elegir el proceso.` },
      { from:'ejecutando', to:'bloqueado', label:'E/S · wait()', desc:`El proceso hace una petición de E/S (leer disco, red…). Pasa a <strong>Bloqueado</strong> y libera la CPU para otro proceso.` },
      { from:'bloqueado', to:'listo', label:'E/S completada', desc:`Llega la interrupción de la E/S completada. El proceso pasa a <strong>Listo</strong> — no directamente a Ejecutando, para respetar la política del planificador.` },
      { from:'listo', to:'ejecutando', label:'planificador', desc:`El PCP planifica de nuevo.` },
      { from:'ejecutando', to:'terminado', label:'exit()', desc:`El proceso termina normalmente (o por señal). Pasa a <strong>Terminado</strong>. El PCB se libera cuando el padre lo recoge con <code>wait()</code>.` },
    ];
    const steps = [{ current: null, transition: null, desc:
      `Un proceso arranca en el estado <strong>Nuevo</strong> tras <code>fork()</code>. Vamos a seguir su ciclo de vida completo.` }];
    let current = 'nuevo';
    T.forEach(t => {
      steps.push({ current: t.to, transition: t, desc: t.desc });
      current = t.to;
    });
    return steps;
  },

  render(container, step) {
    const W = 620, H = 340;
    const nodes = {
      nuevo:      { x: 90,  y: 60,  label: 'Nuevo' },
      listo:      { x: 90,  y: 200, label: 'Listo' },
      ejecutando: { x: 320, y: 200, label: 'Ejecutando' },
      bloqueado:  { x: 550, y: 200, label: 'Bloqueado' },
      terminado:  { x: 550, y: 60,  label: 'Terminado' },
    };
    const edges = [
      { from:'nuevo',      to:'listo',      label:'admit' },
      { from:'listo',      to:'ejecutando', label:'planificador' },
      { from:'ejecutando', to:'listo',      label:'quantum/expulsión', curve: -35 },
      { from:'ejecutando', to:'bloqueado',  label:'E/S · wait()' },
      { from:'bloqueado',  to:'listo',      label:'E/S completada', curve: 40 },
      { from:'ejecutando', to:'terminado',  label:'exit()' },
    ];

    const drawNode = (id, n) => {
      const active = step.current === id;
      const cls = active ? 'active' : (step.current ? 'past' : '');
      const fill = active ? SO.orangeL : (step.current ? '#f1f5f9' : 'white');
      const stroke = active ? SO.orangeD : (step.current ? '#cbd5e1' : SO.orange);
      return `<g class="state-node ${cls}">
        <rect x="${n.x-56}" y="${n.y-22}" width="112" height="44" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
        <text x="${n.x}" y="${n.y+5}" style="font-weight:800;font-size:12.5px">${n.label}</text>
      </g>`;
    };

    const drawEdge = (e) => {
      const A = nodes[e.from], B = nodes[e.to];
      const isActive = step.transition && step.transition.from === e.from && step.transition.to === e.to;
      const color = isActive ? SO.orange : '#cbd5e1';
      const width = isActive ? 3 : 2;
      // Curved path
      let path;
      let labelX, labelY;
      if (e.curve !== undefined) {
        const midX = (A.x + B.x) / 2;
        const midY = (A.y + B.y) / 2 + e.curve;
        path = `M${A.x} ${A.y} Q${midX} ${midY} ${B.x} ${B.y}`;
        labelX = midX;
        labelY = midY + (e.curve < 0 ? -6 : 6);
      } else {
        path = `M${A.x} ${A.y} L${B.x} ${B.y}`;
        labelX = (A.x + B.x) / 2;
        labelY = (A.y + B.y) / 2 - 8;
      }
      return `
        <path class="state-arrow ${isActive?'active':''}" d="${path}" stroke="${color}" stroke-width="${width}" marker-end="url(#so-arrow-${isActive?'active':'default'})"/>
        <text class="state-arrow-label ${isActive?'active':''}" x="${labelX}" y="${labelY}" text-anchor="middle" fill="${isActive?SO.orangeD:SO.muted}" font-weight="${isActive?800:600}">${e.label}</text>`;
    };

    container.innerHTML = `
      <div class="states-wrap">
        <svg class="states-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:660px">
          <defs>
            ${arrowMarker('so-arrow-default', '#cbd5e1')}
            ${arrowMarker('so-arrow-active', SO.orange)}
          </defs>
          ${edges.map(drawEdge).join('')}
          ${Object.entries(nodes).map(([id, n]) => drawNode(id, n)).join('')}
        </svg>
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  2. CAMBIO DE CONTEXTO                                             ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_CONTEXTO = {
  id: 'cambio-contexto', name: 'Cambio de contexto entre procesos', shortName: 'Cambio de contexto',
  topic: 'Procesos', kind: 'PCB · Registros',
  description: 'Cuando el planificador cambia de P0 a P1, el SO salva los registros de la CPU (PC, SP, generales) en el PCB de P0 y carga los del PCB de P1. Es una operación cara: durante el cambio la CPU no ejecuta trabajo útil.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Overhead</span> El tiempo dedicado al cambio de contexto es tiempo perdido. Un quantum demasiado corto en Round Robin puede hacer que la mayor parte del tiempo se gaste en cambios.</p>
  </div>`,
  useCases: 'Núcleo de todo SO multiprogramado',

  generateSteps() {
    return [
      { phase: 'p0-run', desc:
        `<strong>P0 está en ejecución</strong>. Sus registros (PC, SP, R1, R2…) están cargados en la CPU. P1 espera en Listo.` },
      { phase: 'interrupt', desc:
        `Ocurre una <strong>interrupción</strong> (timer, E/S, syscall…). El hardware fuerza modo kernel y salta al despachador.` },
      { phase: 'save-p0', desc:
        `El SO <strong>salva los registros de la CPU en el PCB de P0</strong>. El estado de P0 pasa a Listo.` },
      { phase: 'sched', desc:
        `El planificador elige el siguiente proceso: <strong>P1</strong>.` },
      { phase: 'load-p1', desc:
        `El SO <strong>carga los registros del PCB de P1</strong> en la CPU. Ajusta el registro base y límite de memoria.` },
      { phase: 'p1-run', desc:
        `Se sale de modo kernel y <strong>P1 empieza a ejecutarse</strong>. La duración total del cambio de contexto es <em>tiempo perdido</em> desde el punto de vista de aplicación.` },
    ];
  },

  render(container, step) {
    const W = 620, H = 300;

    // CPU en el centro, P0 a la izquierda, P1 a la derecha
    const drawPCB = (label, x, y, active, registros) => `
      <g>
        <rect x="${x-70}" y="${y-70}" width="140" height="150" rx="8" fill="${active?SO.orangeL:'white'}" stroke="${active?SO.orange:SO.slateL}" stroke-width="${active?2.5:2}"/>
        <text x="${x}" y="${y-52}" style="font-family:Inter,sans-serif;font-weight:800;font-size:12px;fill:${SO.txt};text-anchor:middle">${label}</text>
        <line x1="${x-60}" y1="${y-42}" x2="${x+60}" y2="${y-42}" stroke="${SO.slateL}" stroke-width="1"/>
        ${['PC','SP','R1','R2'].map((r, i) => `
          <text x="${x-52}" y="${y-24+i*22}" style="font-family:JetBrains Mono,monospace;font-size:11px;fill:${SO.muted};font-weight:700">${r}</text>
          <text x="${x+40}" y="${y-24+i*22}" text-anchor="end" style="font-family:JetBrains Mono,monospace;font-size:11px;fill:${registros?SO.txt:SO.muted};font-weight:800">${registros ? registros[i] : '—'}</text>
        `).join('')}
      </g>`;

    // Estado según fase
    let cpuRegs, p0Regs, p1Regs;
    if (step.phase === 'p0-run') {
      cpuRegs = ['0x1000', '0xFFF0', '42', '17']; p0Regs = null; p1Regs = ['0x2000', '0xEEE0', '99', '5'];
    } else if (step.phase === 'interrupt') {
      cpuRegs = ['0x1000', '0xFFF0', '42', '17']; p0Regs = null; p1Regs = ['0x2000', '0xEEE0', '99', '5'];
    } else if (step.phase === 'save-p0') {
      cpuRegs = ['0x1000', '0xFFF0', '42', '17']; p0Regs = ['0x1000', '0xFFF0', '42', '17']; p1Regs = ['0x2000', '0xEEE0', '99', '5'];
    } else if (step.phase === 'sched') {
      cpuRegs = null; p0Regs = ['0x1000', '0xFFF0', '42', '17']; p1Regs = ['0x2000', '0xEEE0', '99', '5'];
    } else if (step.phase === 'load-p1') {
      cpuRegs = ['0x2000', '0xEEE0', '99', '5']; p0Regs = ['0x1000', '0xFFF0', '42', '17']; p1Regs = ['0x2000', '0xEEE0', '99', '5'];
    } else if (step.phase === 'p1-run') {
      cpuRegs = ['0x2000', '0xEEE0', '99', '5']; p0Regs = ['0x1000', '0xFFF0', '42', '17']; p1Regs = null;
    }

    const cpuLabel = (step.phase === 'p0-run' || step.phase === 'save-p0') ? 'CPU (registros de P0)' :
                     (step.phase === 'p1-run' || step.phase === 'load-p1') ? 'CPU (registros de P1)' :
                     'CPU';

    const p0Label = 'PCB de P0';
    const p1Label = 'PCB de P1';

    // Flechas según fase
    let arrows = '';
    if (step.phase === 'save-p0') {
      arrows = `<line x1="230" y1="130" x2="150" y2="130" stroke="${SO.red}" stroke-width="3" stroke-dasharray="4,3" marker-end="url(#ctx-arrow-red)"/><text x="190" y="120" style="font-family:JetBrains Mono,monospace;font-size:10.5px;font-weight:800;fill:${SO.red};text-anchor:middle">salvar</text>`;
    } else if (step.phase === 'load-p1') {
      arrows = `<line x1="390" y1="130" x2="470" y2="130" stroke="${SO.green}" stroke-width="3" stroke-dasharray="4,3" marker-end="url(#ctx-arrow-green)" transform="scale(-1,1) translate(-860,0)"/><line x1="470" y1="130" x2="390" y2="130" stroke="${SO.green}" stroke-width="3" stroke-dasharray="4,3" marker-end="url(#ctx-arrow-green)"/><text x="430" y="120" style="font-family:JetBrains Mono,monospace;font-size:10.5px;font-weight:800;fill:${SO.greenD};text-anchor:middle">cargar</text>`;
    }

    // Indicador de fase
    const phaseLabels = {
      'p0-run': 'P0 ejecutando',
      'interrupt': '⚡ Interrupción',
      'save-p0': 'Salvar registros de P0',
      'sched': 'Planificador elige P1',
      'load-p1': 'Cargar registros de P1',
      'p1-run': 'P1 ejecutando',
    };

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:14px;width:100%">
        <div style="font-family:JetBrains Mono,monospace;font-size:.78rem;font-weight:800;padding:6px 14px;background:${SO.orangeL};color:${SO.orangeD};border-radius:6px;border:1px solid ${SO.orange}">${phaseLabels[step.phase]}</div>
        <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:660px">
          <defs>
            ${arrowMarker('ctx-arrow-red', SO.red)}
            ${arrowMarker('ctx-arrow-green', SO.green)}
          </defs>
          ${drawPCB(p0Label, 80, 130, step.phase === 'save-p0', p0Regs)}
          ${drawPCB('CPU', 310, 130, step.phase === 'p0-run' || step.phase === 'p1-run' || step.phase === 'interrupt' || step.phase === 'save-p0' || step.phase === 'load-p1', cpuRegs)}
          ${drawPCB(p1Label, 540, 130, step.phase === 'load-p1', p1Regs)}
          ${arrows}
          <text x="310" y="240" style="font-family:JetBrains Mono,monospace;font-size:10px;fill:${SO.muted};text-anchor:middle;font-weight:700">${cpuLabel}</text>
        </svg>
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  3. PROCESOS vs HILOS                                              ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_HILOS = {
  id: 'procesos-hilos', name: 'Procesos vs Hilos: memoria compartida', shortName: 'Procesos vs Hilos',
  topic: 'Procesos', kind: 'Modelo de memoria',
  description: 'Un proceso tiene su propio espacio de memoria (código, datos, heap, pila) y ficheros. Sus hilos comparten código, datos y ficheros, pero cada uno tiene su propia pila, PC y registros — pueden ejecutarse concurrentemente.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Ventaja</span> Los hilos comparten memoria: la comunicación entre ellos es directa (variables globales). Pero introducen problemas de <em>concurrencia</em> — hace falta sincronización.</p>
  </div>`,
  useCases: 'Programas multithreading (POSIX threads, Java)',

  generateSteps() {
    return [
      { phase:'process', highlight:null, desc:
        `Un <strong>proceso monolítico</strong>: un único hilo de ejecución. Tiene toda la imagen de memoria y una única pila.` },
      { phase:'multi-process', highlight:null, desc:
        `Dos procesos separados P1 y P2: cada uno tiene su propia imagen completa de memoria. La <strong>comunicación</strong> entre ellos requiere IPC (pipes, memoria compartida…).` },
      { phase:'threads', highlight:null, desc:
        `Un proceso con <strong>tres hilos</strong>. Todos comparten código, datos, heap y descriptores de fichero. Cada hilo tiene su <strong>propia pila y PC/registros</strong>.` },
      { phase:'threads', highlight:'shared', desc:
        `Las zonas compartidas (<code>código</code>, <code>datos</code>, <code>heap</code>) son las que hacen tan barato crear un hilo respecto a un proceso.` },
      { phase:'threads', highlight:'private', desc:
        `Cada hilo tiene su propia <strong>pila</strong> (variables locales, marcos de llamada) y sus propios <strong>registros</strong> y <strong>PC</strong>: puede estar ejecutando código distinto.` },
    ];
  },

  render(container, step) {
    // Layout: dos columnas: proceso vs hilos
    const drawProcess = (x, y, w, threads, highlight) => {
      const boxes = [
        { name:'Código', color: SO.blueL, border: SO.blue, shared: true },
        { name:'Datos', color: SO.greenL, border: SO.green, shared: true },
        { name:'Heap', color: SO.purpleL, border: SO.purple, shared: true },
      ];
      let out = '';
      boxes.forEach((b, i) => {
        const yy = y + i * 34;
        const hi = highlight === 'shared' ? SO.orange : b.border;
        const hiW = highlight === 'shared' ? 3 : 1.5;
        out += `<rect x="${x}" y="${yy}" width="${w}" height="28" rx="4" fill="${b.color}" stroke="${hi}" stroke-width="${hiW}"/>
                <text x="${x + w/2}" y="${yy + 18}" style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:800;fill:${b.border};text-anchor:middle">${b.name}</text>`;
      });
      // Pila(s) - una por hilo
      const stackY = y + 3 * 34 + 12;
      const stackW = threads > 1 ? (w - (threads - 1) * 6) / threads : w;
      for (let t = 0; t < threads; t++) {
        const sx = x + t * (stackW + 6);
        const hi = highlight === 'private' ? SO.orange : SO.amber;
        const hiW = highlight === 'private' ? 3 : 1.5;
        out += `<rect x="${sx}" y="${stackY}" width="${stackW}" height="30" rx="4" fill="${SO.amberL}" stroke="${hi}" stroke-width="${hiW}"/>
                <text x="${sx + stackW/2}" y="${stackY + 20}" style="font-family:JetBrains Mono,monospace;font-size:${threads>2?9:11}px;font-weight:800;fill:${SO.amberD};text-anchor:middle">${threads > 1 ? 'Pila T'+(t+1) : 'Pila'}</text>`;
      }
      // Registros/PC bar
      const regsY = stackY + 40;
      for (let t = 0; t < threads; t++) {
        const sx = x + t * (stackW + 6);
        const hi = highlight === 'private' ? SO.orange : SO.slateD;
        const hiW = highlight === 'private' ? 3 : 1.5;
        out += `<rect x="${sx}" y="${regsY}" width="${stackW}" height="22" rx="4" fill="white" stroke="${hi}" stroke-width="${hiW}"/>
                <text x="${sx + stackW/2}" y="${regsY + 15}" style="font-family:JetBrains Mono,monospace;font-size:${threads>2?9:11}px;font-weight:800;fill:${SO.slateD};text-anchor:middle">${threads > 1 ? 'PC T'+(t+1) : 'PC'}</text>`;
      }
      return out;
    };

    const W = 620, H = 300;
    let content = '';

    if (step.phase === 'process') {
      content = `
        <g>${drawProcess(230, 40, 160, 1, null)}</g>
        <text x="310" y="30" style="font-family:Inter,sans-serif;font-weight:800;font-size:12px;fill:${SO.txt};text-anchor:middle;text-transform:uppercase;letter-spacing:.05em">Proceso monohilo</text>`;
    } else if (step.phase === 'multi-process') {
      content = `
        <g>${drawProcess(80, 40, 160, 1, null)}</g>
        <text x="160" y="30" style="font-family:Inter,sans-serif;font-weight:800;font-size:12px;fill:${SO.txt};text-anchor:middle;text-transform:uppercase;letter-spacing:.05em">Proceso P1</text>
        <g>${drawProcess(370, 40, 160, 1, null)}</g>
        <text x="450" y="30" style="font-family:Inter,sans-serif;font-weight:800;font-size:12px;fill:${SO.txt};text-anchor:middle;text-transform:uppercase;letter-spacing:.05em">Proceso P2</text>
        <text x="310" y="200" style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:800;fill:${SO.muted};text-anchor:middle">↔ IPC ↔</text>`;
    } else {
      content = `
        <g>${drawProcess(160, 40, 300, 3, step.highlight)}</g>
        <text x="310" y="30" style="font-family:Inter,sans-serif;font-weight:800;font-size:12px;fill:${SO.txt};text-anchor:middle;text-transform:uppercase;letter-spacing:.05em">Proceso con 3 hilos</text>`;
    }

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:14px;width:100%">
        <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:640px">${content}</svg>
        ${legend([
          {c: SO.blue, t:'Código'}, {c: SO.green, t:'Datos'},
          {c: SO.purple, t:'Heap'}, {c: SO.amber, t:'Pila (por hilo)'},
        ])}
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════
   HELPERS DE PLANIFICACIÓN (compartidos por FCFS, SJF, SRTF, RR)
══════════════════════════════════════════════════════════════════ */
function drawGantt(gantt, currentTime) {
  const totalTime = gantt.reduce((s, g) => s + g.duration, 0);
  const W = 640, H = 90;
  const padL = 10;
  const scale = (W - 2*padL) / Math.max(totalTime, 1);
  let x = padL;
  const slots = gantt.map(g => {
    const w = g.duration * scale;
    const color = g.proc === '—' ? '#cbd5e1' : (SO_PROC_COLORS[g.proc] || SO.blue);
    const rect = `<rect class="gantt-slot" x="${x}" y="20" width="${w}" height="42" fill="${color}" stroke="white" stroke-width="1"/>
                  <text class="gantt-slot-label" x="${x + w/2}" y="47">${g.proc === '—' ? '' : g.proc}</text>
                  <text x="${x + w/2}" y="13" class="gantt-tick">${g.start}</text>`;
    x += w;
    return rect;
  }).join('');
  const endTick = `<text x="${x}" y="13" class="gantt-tick">${totalTime}</text>`;
  const cursor = currentTime !== undefined
    ? `<line x1="${padL + currentTime * scale}" y1="18" x2="${padL + currentTime * scale}" y2="66" stroke="${SO.orangeD}" stroke-width="2.5"/>
       <polygon points="${padL + currentTime * scale - 4},18 ${padL + currentTime * scale + 4},18 ${padL + currentTime * scale},24" fill="${SO.orangeD}"/>`
    : '';
  return `<svg class="gantt-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:660px">${slots}${endTick}${cursor}</svg>`;
}

const SO_PROC_COLORS = { A: '#3b82f6', B: '#10b981', C: '#f59e0b', D: '#8b5cf6', E: '#ef4444' };

function drawProcTable(procs, current, finished, schemaLabel) {
  return `
    <table class="proc-tbl">
      <tr><th>Proc</th><th>Llega</th><th>CPU</th>${schemaLabel ? `<th>${schemaLabel}</th>` : ''}<th>Fin</th><th>Espera</th><th>Retorno</th></tr>
      ${procs.map(p => {
        const cls = finished && finished.includes(p.name) ? 'done' : (current === p.name ? 'hi' : '');
        return `<tr>
          <td class="${cls}">${p.name}</td>
          <td class="${cls}">${p.arrival}</td>
          <td class="${cls}">${p.cpu}</td>
          ${schemaLabel ? `<td class="${cls}">${p.extra !== undefined ? p.extra : '—'}</td>` : ''}
          <td class="${cls}">${p.finish !== undefined ? p.finish : '—'}</td>
          <td class="${cls}">${p.wait !== undefined ? p.wait : '—'}</td>
          <td class="${cls}">${p.turnaround !== undefined ? p.turnaround : '—'}</td>
        </tr>`;
      }).join('')}
    </table>`;
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  4. FCFS (First Come First Served)                                ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_FCFS = {
  id: 'fcfs', name: 'FCFS — First Come First Served', shortName: 'FCFS',
  topic: 'Planificación', kind: 'No expulsivo',
  description: 'El planificador más simple: los procesos se ejecutan en el orden en que llegan a la cola de preparados. No expulsivo: una vez elegido, un proceso corre hasta que termina o se bloquea.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Ventaja</span> Trivial de implementar; sin inanición.</p>
    <p><span class="explain-tag">Problema</span> El <em>efecto convoy</em>: si el primer proceso es muy largo, todos los demás esperan mucho, sea cual sea su tamaño.</p>
  </div>`,
  useCases: 'Sistemas de batch clásicos, colas de impresión',

  generateSteps() {
    // Procesos: A(0,4), B(1,3), C(2,1), D(3,2)
    const procs = [
      { name:'A', arrival:0, cpu:4 },
      { name:'B', arrival:1, cpu:3 },
      { name:'C', arrival:2, cpu:1 },
      { name:'D', arrival:3, cpu:2 },
    ];
    // FCFS orden: A, B, C, D (por llegada)
    const gantt = [
      { proc:'A', start:0, duration:4 },
      { proc:'B', start:4, duration:3 },
      { proc:'C', start:7, duration:1 },
      { proc:'D', start:8, duration:2 },
    ];
    const totalTime = 10;
    const steps = [];
    steps.push({ time:0, current:null, ready:[], gantt:[], procs: procs.map(p => ({...p})), finished:[], desc:
      `<strong>FCFS</strong>. Los procesos se ejecutan en orden de llegada. Se atenderán A → B → C → D.` });

    let finished = [];
    let procsState = procs.map(p => ({...p}));

    // Al final de cada intervalo, actualizar métricas
    gantt.forEach((g, i) => {
      const p = procsState.find(x => x.name === g.proc);
      // Estado al inicio del intervalo
      const ready = procs.filter(x => x.arrival <= g.start && !finished.includes(x.name) && x.name !== g.proc).map(x => x.name);
      steps.push({ time: g.start, current: g.proc, ready, gantt: gantt.slice(0, i+1), procs: procsState.map(p=>({...p})), finished:[...finished], desc:
        `t=${g.start}. Se atiende el siguiente en la cola: <code>${g.proc}</code>. Se ejecuta durante ${g.duration} unidades. Cola de listos: [${ready.join(', ') || '—'}].` });

      // Fin del intervalo — actualiza métricas del proceso
      p.finish = g.start + g.duration;
      p.turnaround = p.finish - p.arrival;
      p.wait = p.turnaround - p.cpu;
      finished.push(g.proc);
    });

    // Paso final con métricas
    const avgWait = (procsState.reduce((s, p) => s + p.wait, 0) / procsState.length).toFixed(2);
    steps.push({ time: totalTime, current: null, ready:[], gantt, procs: procsState, finished: [...finished], desc:
      `Fin de la ejecución en t=${totalTime}. <strong>Tiempo de espera medio = ${avgWait}</strong>. Observa cómo <code>C</code> (que solo necesita 1 ud) tuvo que esperar 5 uds por el efecto convoy de A y B.` });

    return steps;
  },

  render(container, step) {
    const queueHTML = step.ready.length
      ? step.ready.map(p => `<div class="proc-token ${p}">${p}</div>`).join('')
      : `<div style="font-family:JetBrains Mono,monospace;font-size:.72rem;color:${SO.muted};font-style:italic;padding:0 8px">— vacía —</div>`;
    const cpuHTML = step.current
      ? `<div class="proc-token ${step.current} running">${step.current}</div>`
      : `<div style="font-family:JetBrains Mono,monospace;font-size:.72rem;color:${SO.muted};font-style:italic;padding:0 8px">— idle —</div>`;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
        <div class="queue-row">
          <div class="queue-label">Listos</div>
          <div class="queue-track">${queueHTML}</div>
        </div>
        <div class="queue-row">
          <div class="queue-label">CPU</div>
          <div class="queue-track cpu-track">${cpuHTML}</div>
        </div>
        ${drawGantt(step.gantt, step.time)}
        ${drawProcTable(step.procs, step.current, step.finished)}
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  5. SJF (Shortest Job First — no expulsivo)                        ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_SJF = {
  id: 'sjf', name: 'SJF — Shortest Job First (no expulsivo)', shortName: 'SJF',
  topic: 'Planificación', kind: 'No expulsivo · Óptimo',
  description: 'De todos los procesos listos, el planificador elige el que tenga menor tiempo de CPU restante. No expulsivo: una vez elegido, corre hasta terminar. Es óptimo en tiempo medio de espera pero puede provocar inanición.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Ventaja</span> Minimiza el tiempo medio de espera.</p>
    <p><span class="explain-tag">Problema</span> Requiere <strong>conocer el tiempo de CPU futuro</strong> (se estima). Un flujo continuo de procesos cortos puede provocar <em>inanición</em> de los largos.</p>
  </div>`,
  useCases: 'Batch con estimaciones (colas por prioridad)',

  generateSteps() {
    // Procesos idénticos que en FCFS para comparar
    const procs = [
      { name:'A', arrival:0, cpu:4 },
      { name:'B', arrival:1, cpu:3 },
      { name:'C', arrival:2, cpu:1 },
      { name:'D', arrival:3, cpu:2 },
    ];
    // SJF: en t=0 solo A, se ejecuta. En t=4 todos han llegado, elige el más corto: C (1). Luego D (2). Luego B (3).
    const gantt = [
      { proc:'A', start:0, duration:4 },
      { proc:'C', start:4, duration:1 },
      { proc:'D', start:5, duration:2 },
      { proc:'B', start:7, duration:3 },
    ];
    const steps = [];
    steps.push({ time:0, current:null, ready:[], gantt:[], procs: procs.map(p=>({...p})), finished:[], desc:
      `<strong>SJF no expulsivo</strong>: en cada decisión el planificador elige el proceso con menor tiempo de CPU. Cuando arranca, solo hay <code>A</code>.` });

    let finished = [];
    let procsState = procs.map(p => ({...p}));

    gantt.forEach((g, i) => {
      const p = procsState.find(x => x.name === g.proc);
      const ready = procs.filter(x => x.arrival <= g.start && !finished.includes(x.name) && x.name !== g.proc).map(x => x.name);
      const readyByCpu = ready.slice().sort((a,b) => procs.find(x=>x.name===a).cpu - procs.find(x=>x.name===b).cpu);
      steps.push({ time:g.start, current:g.proc, ready:readyByCpu, gantt: gantt.slice(0, i+1), procs: procsState.map(p=>({...p})), finished:[...finished], desc:
        `t=${g.start}. Cola ordenada por CPU: [${readyByCpu.length ? readyByCpu.map(x => `${x}(${procs.find(y=>y.name===x).cpu})`).join(', ') : '—'}]. Se elige <code>${g.proc}</code> (CPU=${g.duration}) por ser el más corto disponible.` });
      p.finish = g.start + g.duration;
      p.turnaround = p.finish - p.arrival;
      p.wait = p.turnaround - p.cpu;
      finished.push(g.proc);
    });

    const avgWait = (procsState.reduce((s, p) => s + p.wait, 0) / procsState.length).toFixed(2);
    steps.push({ time:10, current:null, ready:[], gantt, procs:procsState, finished:[...finished], desc:
      `Fin en t=10. <strong>Tiempo medio de espera = ${avgWait}</strong>. Compárese con FCFS: los procesos cortos han pasado antes.` });

    return steps;
  },

  render: SO_FCFS.render
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  6. SRTF (Shortest Remaining Time First — expulsivo)               ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_SRTF = {
  id: 'srtf', name: 'SRTF — Shortest Remaining Time First (expulsivo)', shortName: 'SRTF',
  topic: 'Planificación', kind: 'Expulsivo · SJF preemptivo',
  description: 'Versión expulsiva de SJF: en cada tic, si llega un nuevo proceso con menor tiempo restante que el que corre, se le expulsa y toma la CPU el nuevo. Da los mejores tiempos medios pero requiere expulsiones.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Expulsión</span> El planificador ejecuta la decisión no solo al terminar/bloquear un proceso, sino también cuando llega un nuevo proceso.</p>
  </div>`,
  useCases: 'Planificadores con estimación de burst',

  generateSteps() {
    // Procesos: A(0,4), B(1,2), C(2,3), D(3,1)
    const procs = [
      { name:'A', arrival:0, cpu:4 },
      { name:'B', arrival:1, cpu:2 },
      { name:'C', arrival:2, cpu:3 },
      { name:'D', arrival:3, cpu:1 },
    ];
    // Simulación tic a tic
    // t=0: solo A → A
    // t=1: B llega (rem=2 vs A rem=3) → B expulsa
    // t=2: C llega (rem=3), corre B (rem=1) → sigue B
    // t=3: D llega (rem=1), B rem=0 (termina en t=3) → elige entre A(rem=3), C(rem=3), D(rem=1) → D
    // t=4: D rem=0, elige entre A(3), C(3) → A (llegó antes)
    // t=7: A rem=0, sigue C(3)
    // t=10: C rem=0.
    const gantt = [
      { proc:'A', start:0, duration:1 },
      { proc:'B', start:1, duration:2 },
      { proc:'D', start:3, duration:1 },
      { proc:'A', start:4, duration:3 },
      { proc:'C', start:7, duration:3 },
    ];
    const finishOrder = ['B', 'D', 'A', 'C'];
    const finishTimes = { B: 3, D: 4, A: 7, C: 10 };

    const steps = [{ time:0, current:null, remaining:{A:4,B:2,C:3,D:1}, ready:[], gantt:[], procs:procs.map(p=>({...p})), finished:[], desc:
      `<strong>SRTF</strong>. Cada tic se recalcula. En t=0 solo <code>A</code>.` }];

    let finished = [];
    let remaining = { A:4, B:2, C:3, D:1 };
    let procsState = procs.map(p => ({...p}));

    gantt.forEach((g, i) => {
      // Estado en t=g.start
      const ready = procs.filter(x => x.arrival <= g.start && !finished.includes(x.name) && x.name !== g.proc && remaining[x.name] > 0)
        .map(x => x.name)
        .sort((a,b) => remaining[a] - remaining[b]);

      let desc;
      if (i === 0) {
        desc = `t=${g.start}. Corre <code>${g.proc}</code>.`;
      } else if (g.proc !== gantt[i-1].proc) {
        desc = `t=${g.start}. <strong>Expulsión</strong>: entra <code>${g.proc}</code> (rem=${remaining[g.proc]}) porque tiene menor tiempo restante que ${gantt[i-1].proc}.`;
      } else {
        desc = `t=${g.start}. Corre <code>${g.proc}</code>.`;
      }

      steps.push({ time: g.start, current: g.proc, remaining: {...remaining}, ready, gantt: gantt.slice(0, i+1), procs: procsState.map(p=>({...p})), finished:[...finished], desc });

      // Reducir remaining por duración
      remaining[g.proc] -= g.duration;
      if (remaining[g.proc] <= 0) {
        finished.push(g.proc);
        const p = procsState.find(x => x.name === g.proc);
        p.finish = g.start + g.duration;
        p.turnaround = p.finish - p.arrival;
        p.wait = p.turnaround - p.cpu;
      }
    });

    const avgWait = (procsState.reduce((s, p) => s + (p.wait || 0), 0) / procsState.length).toFixed(2);
    steps.push({ time:10, current:null, remaining:{A:0,B:0,C:0,D:0}, ready:[], gantt, procs:procsState, finished:[...finished], desc:
      `Fin en t=10. <strong>Tiempo medio de espera = ${avgWait}</strong> (óptimo con expulsión).` });

    return steps;
  },

  render(container, step) {
    const queueHTML = step.ready.length
      ? step.ready.map(p => `<div class="proc-token ${p}">${p}<span style="font-size:.62rem;opacity:.8;margin-left:3px">(${step.remaining[p]})</span></div>`).join('')
      : `<div style="font-family:JetBrains Mono,monospace;font-size:.72rem;color:${SO.muted};font-style:italic;padding:0 8px">— vacía —</div>`;
    const cpuHTML = step.current
      ? `<div class="proc-token ${step.current} running">${step.current}<span style="font-size:.62rem;opacity:.8;margin-left:3px">(${step.remaining[step.current]})</span></div>`
      : `<div style="font-family:JetBrains Mono,monospace;font-size:.72rem;color:${SO.muted};font-style:italic;padding:0 8px">— idle —</div>`;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
        <div class="queue-row">
          <div class="queue-label">Listos (rem)</div>
          <div class="queue-track">${queueHTML}</div>
        </div>
        <div class="queue-row">
          <div class="queue-label">CPU</div>
          <div class="queue-track cpu-track">${cpuHTML}</div>
        </div>
        ${drawGantt(step.gantt, step.time)}
        ${drawProcTable(step.procs, step.current, step.finished)}
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  7. ROUND ROBIN                                                    ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_RR = {
  id: 'round-robin', name: 'Round Robin (quantum)', shortName: 'Round Robin',
  topic: 'Planificación', kind: 'Expulsivo · Turnos',
  description: 'Cada proceso corre durante un quantum fijo. Al agotarse, se le expulsa y va al final de la cola de listos. Es la política de los sistemas de tiempo compartido.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Quantum</span> Elegir el quantum es clave: muy pequeño → mucho overhead de cambios de contexto; muy grande → se parece a FCFS.</p>
  </div>`,
  useCases: 'Prácticamente todos los SO interactivos',

  generateSteps() {
    const Q = 2;
    const procs = [
      { name:'A', arrival:0, cpu:5 },
      { name:'B', arrival:1, cpu:3 },
      { name:'C', arrival:2, cpu:2 },
    ];
    // Simulación:
    // t=0: A entra. Cola=[]. A corre.
    // t=1: B llega, va al final. Cola=[B].
    // t=2: A quantum expirado, C llega en este tic. Cola=[B, C, A(rem=3)]. Corre B.
    // t=4: B quantum. Cola=[C, A, B(rem=1)]. Corre C.
    // t=6: C quantum. C rem=0 → termina. Cola=[A, B]. Corre A.
    // t=8: A quantum. Cola=[B, A(rem=1)]. Corre B.
    // t=9: B rem=0 → termina. Cola=[A]. Corre A.
    // t=10: A rem=0 → termina.
    // Simplifiquémoslo con simulación real
    const events = simulateRR(procs, Q);
    // events = { gantt, snapshots (per tick), finished, procsState }
    const steps = [{ time:0, current:null, ready:[], remaining:{A:5,B:3,C:2}, gantt:[], procs:procs.map(p=>({...p})), finished:[], quantum:Q, desc:
      `<strong>Round Robin con quantum=${Q}</strong>. Los procesos rotan en la cola de listos.` }];
    events.snapshots.forEach(s => steps.push(s));
    return steps;

    function simulateRR(procs, Q) {
      const gantt = [];
      const snapshots = [];
      let time = 0;
      const rem = {};
      procs.forEach(p => rem[p.name] = p.cpu);
      const finished = [];
      const procsState = procs.map(p => ({...p}));
      const readyQ = [];
      let cur = null;
      let curQ = 0;

      const enqueueArrivals = (upTo) => {
        procs.forEach(p => {
          if (p.arrival <= upTo && p.arrival >= 0 && !readyQ.includes(p.name) && p.name !== cur && !finished.includes(p.name) && rem[p.name] > 0) {
            // Solo añadir si no está ya
            // Marcar como añadido con un flag manejado abajo
          }
        });
      };

      const alreadyArrived = new Set();
      const MAX = 40;
      let step = 0;

      while (finished.length < procs.length && step < MAX) {
        // Añadir llegadas hasta time
        procs.forEach(p => {
          if (!alreadyArrived.has(p.name) && p.arrival <= time) {
            readyQ.push(p.name);
            alreadyArrived.add(p.name);
          }
        });

        // Elegir proceso
        if (!cur) {
          if (readyQ.length > 0) {
            cur = readyQ.shift();
            curQ = 0;
          } else {
            // idle 1 tick
            gantt.push({ proc:'—', start: time, duration: 1 });
            snapshots.push({ time, current:null, ready:[...readyQ], remaining:{...rem}, gantt:gantt.slice(), procs:procsState.map(p=>({...p})), finished:[...finished], quantum:Q, desc:
              `t=${time}. CPU en idle. Espera llegadas.` });
            time++;
            step++;
            continue;
          }
        }

        // Corre 1 tick
        const gLast = gantt[gantt.length-1];
        if (gLast && gLast.proc === cur) gLast.duration += 1;
        else gantt.push({ proc:cur, start:time, duration:1 });

        rem[cur]--;
        curQ++;
        time++;

        // Añadir llegadas que caen en este tic
        procs.forEach(p => {
          if (!alreadyArrived.has(p.name) && p.arrival <= time) {
            readyQ.push(p.name);
            alreadyArrived.add(p.name);
          }
        });

        let desc;
        if (rem[cur] === 0) {
          finished.push(cur);
          const p = procsState.find(x => x.name === cur);
          p.finish = time;
          p.turnaround = time - p.arrival;
          p.wait = p.turnaround - p.cpu;
          desc = `t=${time}. <code>${cur}</code> ha terminado. Sale del sistema.`;
          cur = null;
          curQ = 0;
        } else if (curQ === Q) {
          desc = `t=${time}. <code>${cur}</code> agota su quantum (rem=${rem[cur]}). Va al final de la cola.`;
          readyQ.push(cur);
          cur = null;
          curQ = 0;
        } else {
          desc = `t=${time}. <code>${cur}</code> sigue corriendo (${curQ}/${Q} del quantum, rem=${rem[cur]}).`;
        }
        snapshots.push({ time, current:cur, ready:[...readyQ], remaining:{...rem}, gantt:gantt.slice(), procs:procsState.map(p=>({...p})), finished:[...finished], quantum:Q, desc });
        step++;
      }

      const avgWait = (procsState.reduce((s, p) => s + (p.wait || 0), 0) / procsState.length).toFixed(2);
      snapshots.push({ time, current:null, ready:[], remaining:{...rem}, gantt, procs:procsState, finished:[...finished], quantum:Q, desc:
        `Fin en t=${time}. Tiempo medio de espera = <strong>${avgWait}</strong>.` });

      return { gantt, snapshots, finished, procsState };
    }
  },

  render(container, step) {
    const queueHTML = step.ready.length
      ? step.ready.map(p => `<div class="proc-token ${p}">${p}<span style="font-size:.62rem;opacity:.8;margin-left:3px">(${step.remaining[p]})</span></div>`).join('')
      : `<div style="font-family:JetBrains Mono,monospace;font-size:.72rem;color:${SO.muted};font-style:italic;padding:0 8px">— vacía —</div>`;
    const cpuHTML = step.current
      ? `<div class="proc-token ${step.current} running">${step.current}<span style="font-size:.62rem;opacity:.8;margin-left:3px">(${step.remaining[step.current]})</span></div>`
      : `<div style="font-family:JetBrains Mono,monospace;font-size:.72rem;color:${SO.muted};font-style:italic;padding:0 8px">— idle —</div>`;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
        <div style="font-family:JetBrains Mono,monospace;font-size:.78rem;color:${SO.orangeD};font-weight:800;background:${SO.orangeL};padding:4px 12px;border-radius:5px;border:1px solid ${SO.orange}">quantum = ${step.quantum}</div>
        <div class="queue-row">
          <div class="queue-label">Listos (FIFO)</div>
          <div class="queue-track">${queueHTML}</div>
        </div>
        <div class="queue-row">
          <div class="queue-label">CPU</div>
          <div class="queue-track cpu-track">${cpuHTML}</div>
        </div>
        ${drawGantt(step.gantt, step.time)}
        ${drawProcTable(step.procs, step.current, step.finished)}
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  8. PARTICIONES DINÁMICAS (First / Best / Worst fit)               ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_PARTICIONES = {
  id: 'particiones', name: 'Particiones dinámicas — First / Best / Worst fit', shortName: 'Particiones',
  topic: 'Memoria', kind: 'First · Best · Worst fit',
  description: 'Ante una petición, el gestor debe elegir un hueco de la memoria. Compara las tres estrategias clásicas sobre la misma secuencia: el primer hueco que quepa, el más ajustado, o el más grande.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">First-fit</span> Rápido; los huecos pequeños se acumulan al principio.</p>
    <p><span class="explain-tag">Best-fit</span> Aprovecha bien la memoria pero deja muchos huecos diminutos inutilizables.</p>
    <p><span class="explain-tag">Worst-fit</span> Deja huecos grandes reutilizables, pero desperdicia memoria si hay peticiones pequeñas.</p>
  </div>`,
  useCases: 'Malloc, gestión de memoria dinámica',

  generateSteps() {
    // Memoria total: 100. Inicial: SO(0-10), Hueco(10-25), P1(25-45), Hueco(45-65), P2(65-80), Hueco(80-100)
    // Peticiones: P3=10, P4=20
    const initial = [
      { start:0, size:10, type:'os',   name:'SO' },
      { start:10, size:15, type:'free' },
      { start:25, size:20, type:'proc', name:'A' },
      { start:45, size:20, type:'free' },
      { start:65, size:15, type:'proc', name:'B' },
      { start:80, size:20, type:'free' },
    ];
    const strategies = ['first', 'best', 'worst'];
    const steps = [];
    steps.push({ mem: initial, strategy:'first', request:null, candidates:[], chosen:null, desc:
      `Memoria inicial de <strong>100 unidades</strong>. Hay 3 huecos disponibles: 15, 20 y 20. Vamos a comparar cómo colocarían las tres estrategias una petición de <strong>10 unidades</strong> (proceso C).` });

    // Peticiones
    const req1 = { name:'C', size:10 };
    strategies.forEach(strat => {
      const holes = initial.filter(b => b.type === 'free');
      let candidate = null;
      let candidateIdx = -1;
      const holeIndices = initial.map((b, i) => b.type === 'free' ? i : -1).filter(i => i !== -1);

      if (strat === 'first') {
        for (const i of holeIndices) if (initial[i].size >= req1.size) { candidateIdx = i; candidate = initial[i]; break; }
      } else if (strat === 'best') {
        let bestSize = Infinity;
        for (const i of holeIndices) if (initial[i].size >= req1.size && initial[i].size < bestSize) { candidateIdx = i; candidate = initial[i]; bestSize = initial[i].size; }
      } else if (strat === 'worst') {
        let worstSize = -1;
        for (const i of holeIndices) if (initial[i].size >= req1.size && initial[i].size > worstSize) { candidateIdx = i; candidate = initial[i]; worstSize = initial[i].size; }
      }

      // Paso: mostrar candidatos considerados
      steps.push({ mem: initial, strategy:strat, request:req1, candidates: holeIndices.filter(i => initial[i].size >= req1.size), chosen: candidateIdx, desc:
        `Estrategia <strong>${strat === 'first' ? 'First-fit' : strat === 'best' ? 'Best-fit' : 'Worst-fit'}</strong>: examina los huecos de tamaño ≥ ${req1.size} y elige el ${strat === 'first' ? 'primero (${initial[candidateIdx].start}-${initial[candidateIdx].start + initial[candidateIdx].size})' : strat === 'best' ? 'más ajustado (' + initial[candidateIdx].size + ' uds)' : 'más grande (' + initial[candidateIdx].size + ' uds)'}.` });

      // Aplicar cambio
      const newMem = JSON.parse(JSON.stringify(initial));
      const chosen = newMem[candidateIdx];
      if (chosen.size === req1.size) {
        chosen.type = 'proc';
        chosen.name = req1.name;
      } else {
        const remaining = chosen.size - req1.size;
        newMem[candidateIdx] = { start: chosen.start, size: req1.size, type: 'proc', name: req1.name };
        newMem.splice(candidateIdx + 1, 0, { start: chosen.start + req1.size, size: remaining, type: 'free' });
      }
      steps.push({ mem: newMem, strategy:strat, request:req1, candidates:[], chosen: candidateIdx, showResult:true, desc:
        `<strong>${strat === 'first' ? 'First-fit' : strat === 'best' ? 'Best-fit' : 'Worst-fit'}</strong> asigna C en el hueco ${chosen.start}-${chosen.start + chosen.size}. ${chosen.size > req1.size ? `Queda un hueco residual de ${chosen.size - req1.size} uds.` : 'El hueco queda completamente ocupado.'}` });
    });

    return steps;
  },

  render(container, step) {
    const total = 100;
    const blocks = step.mem.map((b, i) => {
      let cls = 'mem-block';
      if (b.type === 'os') cls += ' os';
      else if (b.type === 'free') cls += ' free';
      else cls += ' p-' + b.name;
      if (step.candidates && step.candidates.includes(i)) cls += ' candidate';
      const width = (b.size / total) * 100;
      const label = b.type === 'os' ? 'SO' : b.type === 'free' ? 'Libre' : b.name;
      return `<div class="${cls}" style="width:${width}%">
        <div>${label}</div>
        <div class="mem-block-size">${b.size} u</div>
      </div>`;
    }).join('');

    const stratLabel = { first: 'First-fit', best: 'Best-fit', worst: 'Worst-fit' }[step.strategy] || '';
    const reqInfo = step.request ? `<span style="margin-left:8px">petición: <strong>${step.request.name} = ${step.request.size} uds</strong></span>` : '';

    container.innerHTML = `
      <div class="mem-wrap">
        <div style="font-family:JetBrains Mono,monospace;font-size:.78rem;color:${SO.orangeD};font-weight:800;background:${SO.orangeL};padding:5px 14px;border-radius:5px;border:1px solid ${SO.orange}">Estrategia: ${stratLabel}${reqInfo}</div>
        <div class="mem-bar">${blocks}</div>
        <div class="mem-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
        ${legend([
          {c: SO.slateD, t:'SO'},
          {c: SO.blue, t:'Proceso A'},
          {c: SO.green, t:'Proceso B'},
          {c: SO.amber, t:'Proceso C'},
          {c: '#e2e8f0', t:'Libre'},
        ])}
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  9. PAGINACIÓN — Traducción (p, d) → (m, d)                        ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_PAGINACION = {
  id: 'paginacion', name: 'Paginación — Traducción de direcciones', shortName: 'Paginación',
  topic: 'Memoria', kind: 'Tabla de páginas',
  description: 'La memoria lógica se divide en páginas del mismo tamaño que los marcos físicos. Una dirección lógica se descompone en (nº de página, desplazamiento). La MMU consulta la tabla de páginas del proceso para obtener el marco físico.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Sin fragmentación externa</span> Cualquier página cabe en cualquier marco libre. Sí hay fragmentación interna (última página del proceso).</p>
  </div>`,
  useCases: 'Todos los SO modernos: Linux, Windows, macOS',

  generateSteps() {
    // Proceso P con 4 páginas. Tamaño de página = 4 bytes. Dirección lógica = 6 bits (2 página + 4 offset).
    // Memoria física: 8 marcos.
    // Tabla de páginas P: 0→5, 1→2, 2→7, 3→1
    const pageTable = [5, 2, 7, 1];
    const memoryFrames = new Array(8).fill(null);
    // Ocupar marcos según tabla
    pageTable.forEach((frame, page) => { memoryFrames[frame] = { proc:'P', page }; });
    memoryFrames[0] = { proc:'Q', page:0 };
    memoryFrames[3] = { proc:'Q', page:1 };
    memoryFrames[4] = { proc:'R', page:0 };
    memoryFrames[6] = { proc:'S', page:2 };

    // Consulta: dirección lógica 22 (binario: 010110) → página 1, desplazamiento 6
    // → marco 2, dirección física = 2*4 + 6 = 14
    // Simplifiquemos usando decimal: dirección 22 con página tamaño 4 → p=5, d=2 (pero p max = 3)
    // Cambiemos: dirección lógica = 10 → p = 10 div 4 = 2, d = 10 mod 4 = 2. Marco = 7. Dir. física = 7*4+2 = 30
    const logicalAddr = 10;
    const pageSize = 4;
    const p = Math.floor(logicalAddr / pageSize);
    const d = logicalAddr % pageSize;
    const m = pageTable[p];
    const physicalAddr = m * pageSize + d;

    return [
      { phase:'logical', pageTable, memoryFrames, logicalAddr, p:null, d:null, m:null, physicalAddr:null, desc:
        `Dirección lógica <strong>${logicalAddr}</strong> generada por un proceso <code>P</code>. La MMU necesita traducirla.` },
      { phase:'split', pageTable, memoryFrames, logicalAddr, p, d, m:null, physicalAddr:null, desc:
        `Se divide en <strong>(página, desplazamiento)</strong>. Con tamaño de página ${pageSize}: p = ${logicalAddr} div ${pageSize} = <code>${p}</code>, d = ${logicalAddr} mod ${pageSize} = <code>${d}</code>.` },
      { phase:'lookup', pageTable, memoryFrames, logicalAddr, p, d, m, physicalAddr:null, desc:
        `La MMU consulta la <strong>entrada p=${p}</strong> de la tabla de páginas del proceso P: <code>marco ${m}</code>.` },
      { phase:'compute', pageTable, memoryFrames, logicalAddr, p, d, m, physicalAddr, desc:
        `Dirección física = marco · tamaño_página + desplazamiento = ${m} · ${pageSize} + ${d} = <code>${physicalAddr}</code>. Se accede a esa posición en la memoria física.` },
    ];
  },

  render(container, step) {
    const pageSize = 4;
    const { pageTable, memoryFrames, logicalAddr, p, d, m, physicalAddr } = step;

    const addrRow = (label, cells) => `
      <div class="addr-wrap">
        <div style="font-family:Inter,sans-serif;font-size:.68rem;font-weight:800;color:${SO.muted};text-transform:uppercase;letter-spacing:.05em">${label}</div>
        <div class="addr-row">${cells}</div>
      </div>`;

    let logicalAddrHTML;
    if (p === null) {
      logicalAddrHTML = addrRow('Dirección lógica', `<div class="addr-cell" style="border-radius:5px">${logicalAddr}</div>`);
    } else {
      logicalAddrHTML = addrRow('Dirección lógica (p, d)', `
        <div class="addr-cell p">p = ${p}</div>
        <div class="addr-cell d">d = ${d}</div>`);
    }

    const physAddrHTML = physicalAddr !== null
      ? addrRow('Dirección física (m, d)', `
          <div class="addr-cell m">m = ${m}</div>
          <div class="addr-cell d">d = ${d}</div>`)
      : '';

    const tableHTML = `
      <div class="paging-col">
        <div class="paging-title">Tabla páginas · P</div>
        ${pageTable.map((frame, page) => {
          const hi = step.phase === 'lookup' && page === p;
          return `<div class="page-frame ${hi?'active':''}" style="width:130px">
            <span class="frame-idx">p=${page}</span>
            <span>${frame}</span>
          </div>`;
        }).join('')}
      </div>`;

    const memHTML = `
      <div class="paging-col">
        <div class="paging-title">Memoria física · marcos</div>
        ${memoryFrames.map((occ, frame) => {
          const isM = step.phase === 'compute' && frame === m;
          let cls = 'page-frame';
          if (!occ) cls += ' free';
          else if (isM) cls += ' active';
          else cls += ' used';
          const content = occ ? `<span>${occ.proc}[${occ.page}]</span>` : '<span>libre</span>';
          return `<div class="${cls}" style="width:130px">
            <span class="frame-idx">m=${frame}</span>
            ${content}
          </div>`;
        }).join('')}
      </div>`;

    // Flecha entre tabla y memoria física
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
        ${logicalAddrHTML}
        <div class="paging-wrap" style="justify-content:center">
          ${tableHTML}
          <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;font-size:1.4rem;color:${step.phase==='lookup' || step.phase==='compute' ? SO.orange : SO.muted};font-weight:800">→</div>
          ${memHTML}
        </div>
        ${physAddrHTML}
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 10. SEGMENTACIÓN — Base + Límite                                   ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_SEGMENTACION = {
  id: 'segmentacion', name: 'Segmentación — Base y Límite', shortName: 'Segmentación',
  topic: 'Memoria', kind: 'Tabla de segmentos',
  description: 'El programa se divide en segmentos lógicos (código, datos, pila…) de tamaño variable. Cada uno se coloca en una zona de memoria física; su ubicación se guarda en la tabla de segmentos como base + límite.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Protección</span> Si el desplazamiento excede el límite, se genera una <strong>trap</strong> (segmentation fault).</p>
  </div>`,
  useCases: 'x86 clásico, sistemas mixtos segmentación+paginación',

  generateSteps() {
    // Segmentos: 0=Código(size=100, base=1400), 1=Datos(size=250, base=6300), 2=Pila(size=100, base=4300), 3=Datos_sub(size=200, base=3200)
    const segTable = [
      { seg:0, name:'Código', base:1400, limit:100 },
      { seg:1, name:'Datos',  base:6300, limit:250 },
      { seg:2, name:'Pila',   base:4300, limit:100 },
      { seg:3, name:'Ext',    base:3200, limit:200 },
    ];
    // Traducción de (1, 120) → base 6300 + 120 = 6420 (válido, 120 < 250)
    return [
      { phase:'input', segTable, s:null, d:null, base:null, limit:null, physical:null, error:false, desc:
        `Dirección lógica <strong>(s=1, d=120)</strong>: acceso al segmento 1 con desplazamiento 120.` },
      { phase:'lookup', segTable, s:1, d:120, base:null, limit:null, physical:null, error:false, desc:
        `La MMU consulta la <strong>entrada s=1</strong> de la tabla de segmentos: base=6300, límite=250.` },
      { phase:'compare', segTable, s:1, d:120, base:6300, limit:250, physical:null, error:false, desc:
        `Comprueba <strong>d < límite</strong>: 120 < 250 ✓. La dirección es válida.` },
      { phase:'compute', segTable, s:1, d:120, base:6300, limit:250, physical:6420, error:false, desc:
        `Dirección física = base + d = 6300 + 120 = <code>6420</code>.` },
      { phase:'error', segTable, s:0, d:150, base:1400, limit:100, physical:null, error:true, desc:
        `⚠️ Ejemplo con error: (s=0, d=150). El desplazamiento 150 <strong>excede el límite 100</strong> del segmento código. Se genera <strong>Segmentation Fault</strong>.` },
    ];
  },

  render(container, step) {
    const { segTable, s, d, base, limit, physical, error } = step;

    const tableHTML = `
      <div class="paging-col">
        <div class="paging-title">Tabla de segmentos</div>
        <div style="border:1px solid ${SO.slateL};border-radius:6px;overflow:hidden;background:white">
          <div style="display:grid;grid-template-columns:50px 90px 70px 60px;background:${SO.orangeL};font-family:JetBrains Mono,monospace;font-size:.66rem;font-weight:800;color:${SO.orangeD};text-transform:uppercase;padding:5px 8px;gap:4px;text-align:center">
            <div>s</div><div>Segmento</div><div>Base</div><div>Límite</div>
          </div>
          ${segTable.map(seg => {
            const hi = s === seg.seg;
            return `<div style="display:grid;grid-template-columns:50px 90px 70px 60px;font-family:JetBrains Mono,monospace;font-size:.78rem;font-weight:700;padding:5px 8px;gap:4px;text-align:center;background:${hi?SO.amberL:'white'};border-top:1px solid ${SO.slateL}">
              <div>${seg.seg}</div><div>${seg.name}</div><div>${seg.base}</div><div>${seg.limit}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;

    const logicalHTML = s !== null ? `
      <div class="addr-wrap">
        <div style="font-family:Inter,sans-serif;font-size:.68rem;font-weight:800;color:${SO.muted};text-transform:uppercase;letter-spacing:.05em">Dir. lógica (s, d)</div>
        <div class="addr-row">
          <div class="addr-cell p">s = ${s}</div>
          <div class="addr-cell d">d = ${d}</div>
        </div>
      </div>` : '';

    const checkHTML = base !== null && limit !== null ? `
      <div style="display:flex;align-items:center;gap:14px;padding:10px 16px;background:${error?SO.redL:SO.greenL};border:2px solid ${error?SO.red:SO.green};border-radius:8px;font-family:JetBrains Mono,monospace">
        <div style="font-size:.76rem;font-weight:800;color:${error?SO.redD:SO.greenD}">${error ? '❌ d ≥ límite' : '✓ d < límite'}</div>
        <div style="font-size:.78rem;font-weight:700;color:${SO.txt}">${d} ${error ? '≥' : '<'} ${limit}</div>
      </div>` : '';

    const physicalHTML = physical !== null ? `
      <div class="addr-wrap">
        <div style="font-family:Inter,sans-serif;font-size:.68rem;font-weight:800;color:${SO.muted};text-transform:uppercase;letter-spacing:.05em">Dir. física</div>
        <div class="addr-row">
          <div class="addr-cell m" style="border-radius:5px;font-size:1rem;padding:6px 16px">${physical}</div>
        </div>
        <div style="font-family:JetBrains Mono,monospace;font-size:.72rem;color:${SO.muted};margin-top:2px">= base + d = ${base} + ${d}</div>
      </div>` : '';

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
        ${logicalHTML}
        <div class="paging-wrap" style="justify-content:center">
          ${tableHTML}
        </div>
        ${checkHTML}
        ${physicalHTML}
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 11. TLB + FALLO DE PÁGINA                                          ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_TLB = {
  id: 'tlb-pagefault', name: 'TLB y fallo de página', shortName: 'TLB · Page Fault',
  topic: 'Memoria virtual', kind: 'TLB · Bit V',
  description: 'La TLB es una caché rápida de traducciones página→marco. En una traducción se consulta primero la TLB: si acierta (hit) hay 1 acceso a memoria; si falla (miss) hay que ir a la tabla de páginas. Si la página no está en RAM: fallo de página.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Aciertos</span> Con hit ratio típico de 98%, el tiempo medio de acceso apenas empeora respecto a memoria física.</p>
  </div>`,
  useCases: 'MMU de x86, ARM, RISC-V',

  generateSteps() {
    // TLB de 3 entradas. Tabla de páginas P: 0→4(V), 1→2(V), 2→7(V), 3→ disco(NV), 4→1(V)
    const pageTable = [
      { page:0, frame:4, valid:true },
      { page:1, frame:2, valid:true },
      { page:2, frame:7, valid:true },
      { page:3, frame:null, valid:false, disk:true },
      { page:4, frame:1, valid:true },
    ];
    // Secuencia de accesos: 1, 1, 3, 3
    const steps = [];
    let tlb = []; // Fifo, max 3

    // Acceso a página 1 — TLB miss (vacía), consulta tabla, encuentra → mete en TLB
    steps.push({
      phase:'access', page:1, tlbState:[...tlb], pageTable, tlbHit:false, pageFault:false, showFinal:false,
      desc: `Acceso a la <strong>página 1</strong>. La TLB está vacía.`
    });
    steps.push({
      phase:'tlb-miss', page:1, tlbState:[...tlb], pageTable, tlbHit:false, pageFault:false, showFinal:false, hiPT:1,
      desc: `<strong>TLB miss</strong>. Se consulta la tabla de páginas del proceso: página 1 → marco 2. Válida.`
    });
    tlb.push({ page:1, frame:2 });
    steps.push({
      phase:'update-tlb', page:1, tlbState:[...tlb], pageTable, tlbHit:false, pageFault:false, showFinal:true, finalFrame:2,
      desc: `Se guarda la entrada en la TLB para próximos accesos. Traducción: marco 2.`
    });

    // Acceso a página 1 — TLB hit
    steps.push({
      phase:'access', page:1, tlbState:[...tlb], pageTable, tlbHit:true, pageFault:false, showFinal:true, finalFrame:2, hiTlb:1,
      desc: `Segundo acceso a página 1. <strong>TLB hit</strong>: la traducción está en la caché. 1 solo acceso a memoria.`
    });

    // Acceso a página 3 — TLB miss, tabla dice inválido → page fault
    steps.push({
      phase:'access', page:3, tlbState:[...tlb], pageTable, tlbHit:false, pageFault:false, showFinal:false,
      desc: `Acceso a la <strong>página 3</strong>. TLB no la tiene.`
    });
    steps.push({
      phase:'tlb-miss', page:3, tlbState:[...tlb], pageTable, tlbHit:false, pageFault:false, showFinal:false, hiPT:3,
      desc: `Se consulta la tabla: la entrada de página 3 tiene <strong>bit V=0</strong>. La página está <strong>en disco</strong>.`
    });
    steps.push({
      phase:'pagefault', page:3, tlbState:[...tlb], pageTable, tlbHit:false, pageFault:true, showFinal:false, hiPT:3,
      desc: `⚠️ <strong>Fallo de página</strong>. Se genera un trap. El SO debe: (1) buscar un marco libre, (2) traer la página del disco, (3) actualizar la tabla, (4) reiniciar la instrucción.`
    });
    // Simular: se le asigna marco 3 y se actualiza tabla
    const updatedPT = pageTable.map(e => e.page === 3 ? { page:3, frame:3, valid:true } : e);
    tlb.push({ page:3, frame:3 });
    if (tlb.length > 3) tlb.shift();
    steps.push({
      phase:'resolved', page:3, tlbState:[...tlb], pageTable: updatedPT, tlbHit:false, pageFault:false, showFinal:true, finalFrame:3,
      desc: `Fallo resuelto: la página 3 se ha cargado en el marco 3. Se actualiza tabla y TLB. La instrucción se re-ejecuta y ahora es un TLB hit.`
    });

    steps.push({
      phase:'access', page:3, tlbState:[...tlb], pageTable: updatedPT, tlbHit:true, pageFault:false, showFinal:true, finalFrame:3, hiTlb:3,
      desc: `Nuevo acceso a página 3: ahora es <strong>TLB hit</strong>. Acceso rápido.`
    });

    return steps;
  },

  render(container, step) {
    const { page, tlbState, pageTable, tlbHit, pageFault, showFinal, finalFrame, hiTlb, hiPT } = step;

    // TLB (3 entradas)
    const tlbHTML = `
      <div class="tlb-wrap">
        <div class="tlb-title">TLB (${tlbState.length}/3)</div>
        <div class="tlb-row head"><div class="cell">página</div><div class="cell">marco</div></div>
        ${[0,1,2].map(i => {
          const e = tlbState[i];
          const hi = e && hiTlb === e.page;
          return `<div class="tlb-row ${hi?'hit':''}">
            <div class="cell">${e ? e.page : '—'}</div>
            <div class="cell">${e ? e.frame : '—'}</div>
          </div>`;
        }).join('')}
      </div>`;

    // Tabla de páginas
    const ptHTML = `
      <div class="tlb-wrap">
        <div class="tlb-title">Tabla de páginas</div>
        <div class="tlb-row head"><div class="cell">página</div><div class="cell">marco · V</div></div>
        ${pageTable.map(e => {
          const hi = hiPT === e.page;
          const valid = e.valid;
          const rowCls = hi ? (valid ? 'hit' : 'miss') : '';
          return `<div class="tlb-row ${rowCls}">
            <div class="cell">${e.page}</div>
            <div class="cell">${valid ? e.frame + ' · V=1' : '⌘ disco · V=0'}</div>
          </div>`;
        }).join('')}
      </div>`;

    // Acceso actual
    const accessHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <div style="font-size:.68rem;font-weight:800;color:${SO.muted};text-transform:uppercase;letter-spacing:.05em">Acceso</div>
        <div style="padding:14px 24px;background:${SO.purpleL};border:2px solid ${SO.purple};border-radius:8px;font-family:JetBrains Mono,monospace;font-size:1.4rem;font-weight:800;color:${SO.purpleD}">página ${page}</div>
        ${tlbHit ? `<div style="padding:5px 12px;background:${SO.greenL};color:${SO.greenD};border-radius:6px;font-family:JetBrains Mono,monospace;font-size:.78rem;font-weight:800">✓ TLB HIT</div>` : ''}
        ${pageFault ? `<div style="padding:5px 12px;background:${SO.redL};color:${SO.redD};border-radius:6px;font-family:JetBrains Mono,monospace;font-size:.78rem;font-weight:800">⚠️ PAGE FAULT</div>` : ''}
      </div>`;

    const resultHTML = showFinal && finalFrame !== null ? `
      <div style="padding:10px 18px;background:${SO.orangeL};border:2px solid ${SO.orange};border-radius:8px;font-family:JetBrains Mono,monospace;font-size:.9rem;font-weight:800;color:${SO.orangeD}">
        → marco ${finalFrame}
      </div>` : '';

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
        ${accessHTML}
        <div style="display:flex;gap:32px;justify-content:center;align-items:flex-start;flex-wrap:wrap">
          ${tlbHTML}
          ${ptHTML}
        </div>
        ${resultHTML}
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════
   HELPERS PARA ALGORITMOS DE REEMPLAZO (FIFO, LRU, CLOCK)
══════════════════════════════════════════════════════════════════ */
function renderRefStr(refs, currentIdx, results) {
  // results: array del mismo tamaño que refs, con 'hit', 'miss' o null
  return `<div class="refstr-row">${refs.map((r, i) => {
    let cls = 'refstr-cell';
    if (i < currentIdx) cls += ' past';
    else if (i === currentIdx) cls += ' current';
    else cls += ' future';
    const mark = i <= currentIdx && results[i] ? `<span class="rc-mark ${results[i]}">${results[i] === 'hit' ? 'H' : 'M'}</span>` : '';
    return `<div class="${cls}">${r}${mark}</div>`;
  }).join('')}</div>`;
}

function renderFrames(frames, hitPage, newSlot) {
  return `<div class="frames-col" style="margin:0 8px">
    ${frames.map((f, i) => {
      let cls = 'frames-slot';
      if (f !== null) cls += ' filled';
      if (hitPage !== undefined && f === hitPage) cls = 'frames-slot hit-highlight';
      if (i === newSlot) cls = 'frames-slot new filled';
      return `<div class="${cls}">${f === null ? '·' : f}</div>`;
    }).join('')}
    <div class="frames-lbl">marcos</div>
  </div>`;
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 12. FIFO — Anomalía de Belady                                      ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_FIFO = {
  id: 'fifo-belady', name: 'FIFO — Anomalía de Belady', shortName: 'FIFO · Belady',
  topic: 'Reemplazo', kind: 'FIFO · Anomalía',
  description: 'FIFO reemplaza la página que lleva más tiempo cargada. Sencillo, pero exhibe la anomalía de Belady: aumentar el número de marcos puede aumentar los fallos de página.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Anomalía</span> Con la cadena <code>1 2 3 4 1 2 5 1 2 3 4 5</code>: FIFO con 3 marcos = 9 fallos; con 4 marcos = <strong>10 fallos</strong>. Añadir memoria empeoró.</p>
  </div>`,
  useCases: 'Enseñanza; rara vez en SO reales por la anomalía',

  generateSteps() {
    const refs = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
    const results3 = [];
    const results4 = [];

    // Simular con 3 marcos
    let frames3 = [null, null, null];
    let queue3 = []; // FIFO
    let history3 = [];
    let faults3 = 0;
    refs.forEach((r, i) => {
      if (frames3.includes(r)) {
        results3.push('hit');
        history3.push({ frames: [...frames3], newSlot: null, hitPage: r, event:'hit' });
      } else {
        results3.push('miss');
        faults3++;
        let slot;
        if (queue3.length < 3) {
          slot = frames3.indexOf(null);
          frames3[slot] = r;
          queue3.push(slot);
        } else {
          slot = queue3.shift();
          const evicted = frames3[slot];
          frames3[slot] = r;
          queue3.push(slot);
        }
        history3.push({ frames: [...frames3], newSlot: slot, hitPage: null, event:'miss' });
      }
    });

    // Simular con 4 marcos
    let frames4 = [null, null, null, null];
    let queue4 = [];
    let history4 = [];
    let faults4 = 0;
    refs.forEach((r, i) => {
      if (frames4.includes(r)) {
        results4.push('hit');
        history4.push({ frames: [...frames4], newSlot: null, hitPage: r, event:'hit' });
      } else {
        results4.push('miss');
        faults4++;
        let slot;
        if (queue4.length < 4) {
          slot = frames4.indexOf(null);
          frames4[slot] = r;
          queue4.push(slot);
        } else {
          slot = queue4.shift();
          frames4[slot] = r;
          queue4.push(slot);
        }
        history4.push({ frames: [...frames4], newSlot: slot, hitPage: null, event:'miss' });
      }
    });

    // Generar pasos: uno por cada referencia
    const steps = [{ refs, currentIdx:-1, history3:[], history4:[], results3:new Array(refs.length).fill(null), results4:new Array(refs.length).fill(null), faults3:0, faults4:0, desc:
      `Cadena de referencias: <code>${refs.join(' ')}</code>. Simularemos FIFO con 3 marcos y con 4 marcos <strong>en paralelo</strong>.` }];

    for (let i = 0; i < refs.length; i++) {
      const desc3 = history3[i].event === 'hit' ? `Ref ${refs[i]}: <span style="color:${SO.greenD};font-weight:700">3 marcos → HIT</span>` : `Ref ${refs[i]}: <span style="color:${SO.redD};font-weight:700">3 marcos → MISS</span>`;
      const desc4 = history4[i].event === 'hit' ? `<span style="color:${SO.greenD};font-weight:700">4 marcos → HIT</span>` : `<span style="color:${SO.redD};font-weight:700">4 marcos → MISS</span>`;

      steps.push({
        refs, currentIdx: i,
        history3: history3.slice(0, i+1),
        history4: history4.slice(0, i+1),
        results3: results3.slice(0, i+1).concat(new Array(refs.length - i - 1).fill(null)),
        results4: results4.slice(0, i+1).concat(new Array(refs.length - i - 1).fill(null)),
        faults3: results3.slice(0, i+1).filter(x => x === 'miss').length,
        faults4: results4.slice(0, i+1).filter(x => x === 'miss').length,
        desc: `${desc3} · ${desc4}`
      });
    }

    steps.push({
      refs, currentIdx: refs.length - 1,
      history3, history4, results3, results4,
      faults3, faults4, done:true,
      desc: `Total de fallos: <strong>3 marcos = ${faults3}</strong>, <strong>4 marcos = ${faults4}</strong>. Con más memoria hay <span style="color:${SO.redD};font-weight:700">${faults4 > faults3 ? 'más fallos' : (faults4 === faults3 ? 'los mismos fallos' : 'menos fallos')}</span> → <strong>${faults4 > faults3 ? 'anomalía de Belady!' : 'sin anomalía en este caso'}</strong>`
    });

    return steps;
  },

  render(container, step) {
    const currentFrames3 = step.history3.length > 0 ? step.history3[step.history3.length-1] : { frames:[null,null,null], newSlot:null, hitPage:null };
    const currentFrames4 = step.history4.length > 0 ? step.history4[step.history4.length-1] : { frames:[null,null,null,null], newSlot:null, hitPage:null };

    container.innerHTML = `
      <div class="refstr-wrap">
        ${renderRefStr(step.refs, step.currentIdx, step.results3)}
        <div style="display:flex;gap:22px;justify-content:center;align-items:flex-start;flex-wrap:wrap;margin-top:20px">
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
            <div style="font-family:JetBrains Mono,monospace;font-size:.72rem;font-weight:800;color:${SO.blueD};background:${SO.blueL};padding:3px 10px;border-radius:5px">3 marcos</div>
            ${renderFrames(currentFrames3.frames, currentFrames3.hitPage, currentFrames3.newSlot)}
            <div style="font-family:JetBrains Mono,monospace;font-size:.78rem;font-weight:800;color:${SO.redD}">Fallos: ${step.faults3}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
            <div style="font-family:JetBrains Mono,monospace;font-size:.72rem;font-weight:800;color:${SO.purpleD};background:${SO.purpleL};padding:3px 10px;border-radius:5px">4 marcos</div>
            ${renderFrames(currentFrames4.frames, currentFrames4.hitPage, currentFrames4.newSlot)}
            <div style="font-family:JetBrains Mono,monospace;font-size:.78rem;font-weight:800;color:${SO.redD}">Fallos: ${step.faults4}</div>
          </div>
        </div>
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 13. LRU — Least Recently Used                                      ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_LRU = {
  id: 'lru', name: 'LRU — Least Recently Used', shortName: 'LRU',
  topic: 'Reemplazo', kind: 'Pila de recencia',
  description: 'LRU expulsa la página usada hace más tiempo. Se implementa manteniendo una pila con la página más reciente arriba y la menos reciente abajo. No sufre la anomalía de Belady.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Coste</span> LRU exacto requiere actualizar la pila en cada acceso. En hardware suele aproximarse con bits de referencia.</p>
  </div>`,
  useCases: 'Cachés hardware, buffer pool de bases de datos',

  generateSteps() {
    const refs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2];
    const nFrames = 3;
    const results = [];
    let stack = []; // más reciente al inicio
    let frames = [null, null, null];
    let history = [];
    let faults = 0;

    refs.forEach((r, i) => {
      if (frames.includes(r)) {
        results.push('hit');
        // Mover r al tope de la pila
        stack = stack.filter(x => x !== r);
        stack.unshift(r);
        history.push({ frames: [...frames], stack: [...stack], newSlot: null, hitPage: r, event:'hit' });
      } else {
        results.push('miss');
        faults++;
        let slot;
        if (stack.length < nFrames) {
          slot = frames.indexOf(null);
          frames[slot] = r;
        } else {
          const victim = stack.pop(); // el fondo de la pila = LRU
          slot = frames.indexOf(victim);
          frames[slot] = r;
        }
        stack.unshift(r);
        history.push({ frames: [...frames], stack: [...stack], newSlot: slot, hitPage: null, event:'miss', victim: null });
      }
    });

    const steps = [{ refs, currentIdx:-1, history:[], results:new Array(refs.length).fill(null), faults:0, nFrames, desc:
      `Cadena: <code>${refs.join(' ')}</code>. Simulamos LRU con ${nFrames} marcos. La <em>pila</em> tiene la página más reciente arriba.` }];

    for (let i = 0; i < refs.length; i++) {
      const h = history[i];
      const desc = h.event === 'hit'
        ? `Ref <code>${refs[i]}</code>: <strong style="color:${SO.greenD}">HIT</strong>. La página está. Se lleva al tope de la pila.`
        : `Ref <code>${refs[i]}</code>: <strong style="color:${SO.redD}">MISS</strong>. ${history[i-1] && history[i-1].stack.length === nFrames ? 'Expulsa la del fondo (LRU).' : 'Ocupa marco libre.'}`;
      steps.push({
        refs, currentIdx: i,
        history: history.slice(0, i+1),
        results: results.slice(0, i+1).concat(new Array(refs.length - i - 1).fill(null)),
        faults: results.slice(0, i+1).filter(x => x === 'miss').length,
        nFrames, desc
      });
    }

    steps.push({
      refs, currentIdx: refs.length - 1,
      history, results, faults, nFrames, done: true,
      desc: `Total de fallos: <strong>${faults}</strong>. LRU no sufre la anomalía de Belady.`
    });

    return steps;
  },

  render(container, step) {
    const current = step.history.length > 0 ? step.history[step.history.length-1] : { frames:[null,null,null], stack:[], newSlot:null, hitPage:null };

    const stackHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="font-family:JetBrains Mono,monospace;font-size:.68rem;font-weight:800;color:${SO.muted};text-transform:uppercase">Pila LRU</div>
        <div style="display:flex;flex-direction:column;gap:3px;padding:4px;background:${SO.blueL};border:1px solid ${SO.blue};border-radius:6px">
          <div style="font-family:JetBrains Mono,monospace;font-size:.62rem;font-weight:800;color:${SO.greenD};text-align:center">↑ + reciente</div>
          ${[...Array(step.nFrames)].map((_, i) => {
            const page = current.stack[i];
            return `<div style="width:44px;height:32px;display:flex;align-items:center;justify-content:center;font-family:JetBrains Mono,monospace;font-weight:800;font-size:.82rem;background:${page !== undefined ? SO.white : SO.slateL};border-radius:4px;border:1px solid ${page !== undefined ? SO.blueD : SO.slateL};color:${page !== undefined ? SO.blueD : SO.muted}">${page !== undefined ? page : '·'}</div>`;
          }).join('')}
          <div style="font-family:JetBrains Mono,monospace;font-size:.62rem;font-weight:800;color:${SO.redD};text-align:center">↓ víctima</div>
        </div>
      </div>`;

    container.innerHTML = `
      <div class="refstr-wrap">
        ${renderRefStr(step.refs, step.currentIdx, step.results)}
        <div style="display:flex;gap:22px;justify-content:center;align-items:center;flex-wrap:wrap;margin-top:20px">
          ${renderFrames(current.frames, current.hitPage, current.newSlot)}
          ${stackHTML}
        </div>
        <div style="font-family:JetBrains Mono,monospace;font-size:.82rem;font-weight:800;color:${SO.redD};margin-top:10px">Fallos: ${step.faults}</div>
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 14. CLOCK / Segunda Oportunidad                                    ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_CLOCK = {
  id: 'clock', name: 'Reloj (Second Chance)', shortName: 'Reloj',
  topic: 'Reemplazo', kind: 'Bit R · Manecilla',
  description: 'Aproximación de LRU: los marcos forman una cola circular. Cada marco tiene un bit R (referencia). La manecilla busca el primero con R=0 para expulsar; los R=1 los pone a 0 y avanza.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Bit R</span> El hardware pone R=1 en cada acceso. El SO lo consulta y lo resetea al buscar víctima. Da a las páginas usadas una "segunda oportunidad" antes de expulsarlas.</p>
  </div>`,
  useCases: 'Linux page reclaim, buffer cache',

  generateSteps() {
    const refs = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3];
    const nFrames = 4;
    const steps = [];

    // Estructura: array de {page, R}, hand = índice actual
    let ring = new Array(nFrames).fill(null).map(() => ({ page: null, R: 0 }));
    let hand = 0;
    let history = [];
    const results = [];
    let faults = 0;

    refs.forEach((r, i) => {
      const inFrame = ring.findIndex(f => f.page === r);
      if (inFrame !== -1) {
        // Hit: solo poner R=1
        ring[inFrame].R = 1;
        results.push('hit');
        history.push({ ring: JSON.parse(JSON.stringify(ring)), hand, event:'hit', hitIdx: inFrame, desc:
          `Ref <code>${r}</code>: <strong style="color:${SO.greenD}">HIT</strong>. Solo pone R=1 en su marco.` });
      } else {
        // Miss
        results.push('miss');
        faults++;
        // Si hay hueco libre
        const freeIdx = ring.findIndex(f => f.page === null);
        if (freeIdx !== -1) {
          ring[freeIdx].page = r;
          ring[freeIdx].R = 1;
          hand = (freeIdx + 1) % nFrames;
          history.push({ ring: JSON.parse(JSON.stringify(ring)), hand, event:'miss-free', newIdx: freeIdx, desc:
            `Ref <code>${r}</code>: <strong style="color:${SO.redD}">MISS</strong>. Ocupa marco libre ${freeIdx}. R=1.` });
        } else {
          // Buscar víctima con la manecilla
          let scanHistory = [];
          while (ring[hand].R === 1) {
            scanHistory.push({ idx: hand, action:'reset' });
            ring[hand].R = 0;
            hand = (hand + 1) % nFrames;
          }
          // Expulsar en hand
          const victim = ring[hand].page;
          scanHistory.push({ idx: hand, action:'evict' });
          ring[hand].page = r;
          ring[hand].R = 1;
          const oldHand = hand;
          hand = (hand + 1) % nFrames;
          history.push({ ring: JSON.parse(JSON.stringify(ring)), hand, event:'miss-evict', newIdx: oldHand, victim, scanHistory, desc:
            `Ref <code>${r}</code>: <strong style="color:${SO.redD}">MISS</strong>. La manecilla avanza dando "segunda oportunidad" y expulsa la página <code>${victim}</code> del marco ${oldHand}.` });
        }
      }
    });

    steps.push({ refs, currentIdx: -1, history: [], results: new Array(refs.length).fill(null), faults: 0, nFrames, ring: new Array(nFrames).fill(null).map(() => ({page:null, R:0})), hand: 0, desc:
      `Cadena: <code>${refs.join(' ')}</code>. Reloj con ${nFrames} marcos. La <span style="color:${SO.orangeD};font-weight:700">manecilla</span> apunta al siguiente candidato a víctima.` });

    for (let i = 0; i < refs.length; i++) {
      const h = history[i];
      steps.push({ refs, currentIdx: i,
        history: history.slice(0, i+1),
        results: results.slice(0, i+1).concat(new Array(refs.length - i - 1).fill(null)),
        faults: results.slice(0, i+1).filter(x => x === 'miss').length,
        nFrames, ring: h.ring, hand: h.hand, event: h.event, hitIdx: h.hitIdx, newIdx: h.newIdx,
        desc: h.desc });
    }

    steps.push({ refs, currentIdx: refs.length - 1,
      history, results, faults, nFrames,
      ring: history[history.length-1].ring, hand: history[history.length-1].hand,
      done: true,
      desc: `Total de fallos: <strong>${faults}</strong>. El reloj aproxima LRU con muy poco coste.` });

    return steps;
  },

  render(container, step) {
    const { ring, hand, nFrames, event, hitIdx, newIdx } = step;
    const cx = 130, cy = 130, r = 90;

    // Nodos en círculo
    const nodes = ring.map((f, i) => {
      const angle = (i / nFrames) * 2 * Math.PI - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      let fill = 'white', stroke = SO.slateL, txtColor = SO.txt;
      if (f.page === null) { fill = '#f8fafc'; stroke = SO.slateL; txtColor = SO.muted; }
      else if (i === hitIdx) { fill = SO.greenL; stroke = SO.green; txtColor = SO.greenD; }
      else if (i === newIdx && event) { fill = SO.orangeL; stroke = SO.orange; txtColor = SO.orangeD; }
      else if (f.R === 1) { fill = SO.blueL; stroke = SO.blue; txtColor = SO.blueD; }
      else { fill = SO.amberL; stroke = SO.amber; txtColor = SO.amberD; }
      return `<g class="clock-slot">
        <circle cx="${x}" cy="${y}" r="26" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
        <text x="${x}" y="${y+2}" style="font-size:14px;fill:${txtColor}">${f.page !== null ? f.page : '·'}</text>
        <text x="${x}" y="${y+16}" style="font-size:9px;fill:${SO.muted};font-weight:700">R=${f.R}</text>
      </g>`;
    }).join('');

    // Manecilla
    const handAngle = (hand / nFrames) * 2 * Math.PI - Math.PI / 2;
    const handX = cx + (r - 35) * Math.cos(handAngle);
    const handY = cy + (r - 35) * Math.sin(handAngle);
    const handEl = `<line class="clock-hand" x1="${cx}" y1="${cy}" x2="${handX}" y2="${handY}"/>
                    <circle cx="${cx}" cy="${cy}" r="4" fill="${SO.orangeD}"/>`;

    container.innerHTML = `
      <div class="refstr-wrap">
        ${renderRefStr(step.refs, step.currentIdx, step.results)}
        <div style="display:flex;gap:22px;justify-content:center;align-items:center;flex-wrap:wrap;margin-top:16px">
          <svg viewBox="0 0 260 260" width="260" height="260">
            ${nodes}
            ${handEl}
          </svg>
        </div>
        <div style="font-family:JetBrains Mono,monospace;font-size:.82rem;font-weight:800;color:${SO.redD}">Fallos: ${step.faults}</div>
        ${legend([
          {c: SO.blue, t:'R=1 (referenciada)'},
          {c: SO.amber, t:'R=0 (víctima potencial)'},
          {c: SO.green, t:'HIT'},
          {c: SO.orange, t:'Recién cargada'},
        ])}
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 15. PLANIFICACIÓN DE DISCO — FCFS / SSTF / SCAN / C-SCAN / LOOK    ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const SO_DISK = {
  id: 'disk-scheduling', name: 'Planificación de disco', shortName: 'Planificación disco',
  topic: 'Entrada/Salida', kind: 'FCFS · SSTF · SCAN · C-SCAN',
  description: 'Compara cómo se atiende la misma cola de peticiones con distintas políticas de planificación de disco. Cada política reordena las peticiones para minimizar el movimiento del cabezal.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">FCFS</span> Orden de llegada. Justo pero mucho movimiento.</p>
    <p><span class="explain-tag">SSTF</span> Petición más cercana. Puede provocar inanición.</p>
    <p><span class="explain-tag">SCAN</span> Barrido de un extremo a otro (ascensor).</p>
    <p><span class="explain-tag">C-SCAN</span> Barrido en un solo sentido, con salto rápido al extremo.</p>
  </div>`,
  useCases: 'Discos magnéticos (HDD), SSD también en menor medida',

  generateSteps() {
    // Cola de peticiones y cabezal inicial en 53. Rango de cilindros: 0-199
    const requests = [98, 183, 37, 122, 14, 124, 65, 67];
    const start = 53;
    const strategies = ['fcfs', 'sstf', 'scan', 'cscan'];
    const steps = [];

    // Calcular orden servido para cada estrategia
    const orders = {};

    // FCFS: orden original
    orders.fcfs = requests.slice();

    // SSTF: siempre el más cercano al cabezal actual
    let cur = start;
    let remaining = requests.slice();
    orders.sstf = [];
    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Math.abs(remaining[0] - cur);
      for (let i = 1; i < remaining.length; i++) {
        const d = Math.abs(remaining[i] - cur);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      cur = remaining[bestIdx];
      orders.sstf.push(cur);
      remaining.splice(bestIdx, 1);
    }

    // SCAN: sube hasta 199, luego baja. Head empieza en 53, moviéndose hacia arriba.
    const above = requests.filter(r => r >= start).sort((a,b) => a - b);
    const below = requests.filter(r => r < start).sort((a,b) => b - a);
    orders.scan = [...above, ...below]; // Sin llegar a 199 obligatoriamente (LOOK)

    // C-SCAN: sube hasta 199, salta a 0, sube hasta start.
    orders.cscan = [...above, ...below.slice().reverse()];

    // Generar pasos: para cada estrategia, animar el movimiento del cabezal
    const stratNames = { fcfs:'FCFS', sstf:'SSTF (más cercano)', scan:'SCAN (ascensor)', cscan:'C-SCAN' };
    strategies.forEach(strat => {
      const order = orders[strat];
      let path = [start];
      let totalDist = 0;

      steps.push({ strategy: strat, requests, start, order, path: [start], currentIdx: -1, totalDist: 0, desc:
        `<strong>${stratNames[strat]}</strong>. Cabezal en cilindro <code>${start}</code>. Peticiones pendientes: [${requests.join(', ')}].` });

      for (let i = 0; i < order.length; i++) {
        const prev = path[path.length - 1];
        const to = order[i];
        const dist = Math.abs(to - prev);
        totalDist += dist;
        path.push(to);
        steps.push({ strategy: strat, requests, start, order, path: [...path], currentIdx: i, totalDist, desc:
          `Atiende cilindro <code>${to}</code> (movimiento ${dist}). Distancia acumulada: ${totalDist}.` });
      }

      steps.push({ strategy: strat, requests, start, order, path: [...path], currentIdx: order.length - 1, totalDist, done: true, desc:
        `<strong>${stratNames[strat]}</strong> completado. <strong>Distancia total = ${totalDist}</strong> cilindros.` });
    });

    return steps;
  },

  render(container, step) {
    const W = 640, H = 320;
    const padL = 40, padR = 30, padT = 30, padB = 40;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const yFor = (idx) => padT + (idx / (step.order.length + 1)) * plotH;
    const xFor = (cyl) => padL + (cyl / 199) * plotW;

    // Ejes con marcas de cilindro
    const xTicks = [0, 50, 100, 150, 199].map(t =>
      `<line x1="${xFor(t)}" y1="${padT}" x2="${xFor(t)}" y2="${padT+plotH+4}" class="disk-cyl"/>
       <text x="${xFor(t)}" y="${padT+plotH+18}" class="disk-cyl-label" text-anchor="middle">${t}</text>`
    ).join('');

    // Path del cabezal
    const pathPoints = step.path.map((cyl, i) => ({ x: xFor(cyl), y: yFor(i) }));
    const pathData = pathPoints.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');

    // Puntos de petición y estado
    const reqPoints = step.order.map((cyl, i) => {
      const y = yFor(i + 1);
      const x = xFor(cyl);
      const isCurrent = i === step.currentIdx;
      const isServed = i < step.currentIdx;
      const cls = isCurrent ? 'current' : (isServed ? 'served' : 'pending');
      return `<g class="disk-request ${cls}">
        <circle cx="${x}" cy="${y}" r="8"/>
        <text x="${x}" y="${y-14}" style="font-size:10px;font-weight:800">${cyl}</text>
      </g>`;
    }).join('');

    // Cabezal inicial
    const startPoint = `<g class="disk-request served">
      <circle cx="${xFor(step.start)}" cy="${yFor(0)}" r="10" fill="${SO.slateD}" stroke="${SO.slateD}"/>
      <text x="${xFor(step.start)}" y="${yFor(0)-16}" style="font-size:10px;font-weight:800;fill:${SO.slateD}">HEAD ${step.start}</text>
    </g>`;

    const stratLabel = { fcfs:'FCFS', sstf:'SSTF', scan:'SCAN', cscan:'C-SCAN' }[step.strategy];

    container.innerHTML = `
      <div class="disk-wrap">
        <div style="font-family:JetBrains Mono,monospace;font-size:.78rem;color:${SO.orangeD};font-weight:800;background:${SO.orangeL};padding:5px 14px;border-radius:5px;border:1px solid ${SO.orange}">
          Política: ${stratLabel} · Distancia acumulada: ${step.totalDist}
        </div>
        <svg class="disk-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:680px">
          <line x1="${padL}" y1="${padT}" x2="${padL + plotW}" y2="${padT}" stroke="${SO.slateD}" stroke-width="1.5"/>
          <text x="${padL - 10}" y="${padT + 4}" style="font-family:JetBrains Mono,monospace;font-size:9.5px;fill:${SO.muted};font-weight:700;text-anchor:end">0</text>
          <text x="${padL + plotW + 8}" y="${padT + 4}" style="font-family:JetBrains Mono,monospace;font-size:9.5px;fill:${SO.muted};font-weight:700">199</text>
          <text x="${padL + plotW / 2}" y="${padT + plotH + 32}" style="font-family:Inter,sans-serif;font-size:10px;fill:${SO.muted};font-weight:700;text-anchor:middle">Cilindro</text>
          <text x="${padL - 20}" y="${padT + plotH/2}" style="font-family:Inter,sans-serif;font-size:10px;fill:${SO.muted};font-weight:700;text-anchor:middle" transform="rotate(-90 ${padL-20} ${padT + plotH/2})">Tiempo →</text>
          ${xTicks}
          <path d="${pathData}" class="disk-path"/>
          ${startPoint}
          ${reqPoints}
        </svg>
      </div>`;
  }
};
