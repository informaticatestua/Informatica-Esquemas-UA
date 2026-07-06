/* ================================================================
   Redes de Computadores — TEORÍA
   Datos y visualizadores para los 15 conceptos clave de la asignatura.
   Cada visualizador implementa: generateSteps() + render(container, step)
   ================================================================ */

'use strict';

/* ── Paleta compartida ── */
const RC = {
  blue: '#3b82f6', blueD: '#1d4ed8', cyan: '#06b6d4', cyanD: '#0e7490',
  green: '#10b981', greenD: '#065f46', amber: '#f59e0b', amberD: '#92400e',
  purple: '#8b5cf6', purpleD: '#6d28d9', red: '#ef4444', redD: '#991b1b',
  slate: '#64748b', slateL: '#e2e8f0', slateD: '#334155',
  txt: '#0f172a', muted: '#94a3b8', white: '#ffffff',
};

/* ── Helpers de UI ── */
function legend(items) {
  return `<div class="legend">${items.map(i => `<div class="leg-item"><div class="leg-dot" style="background:${i.c}"></div>${i.t}</div>`).join('')}</div>`;
}
function arrowMarker(id, color) {
  return `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${color}"/></marker>`;
}
function esc(s) { return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  1. CONMUTACIÓN — Circuitos vs Datagramas vs Circuitos Virtuales ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_CONMUTACION = {
  id: 'conmutacion', name: 'Conmutación de Circuitos vs Paquetes', shortName: 'Conmutación',
  layer: 'Fundamentos', protocol: 'Datagramas / CV',
  description: 'Compara las tres formas de conmutación de una red WAN: circuitos dedicados, paquetes independientes (datagramas) y circuitos virtuales. Se ve cómo un mensaje viaja de origen a destino según el modo elegido.',
  detailedText: `<div class="explain"><p><span class="explain-tag">CLAVE</span> Internet usa <strong>paquetes con datagramas</strong>: cada paquete decide su próximo salto en cada router de forma independiente. Es tolerante a fallos y aprovecha bien los recursos.</p></div>`,
  useCases: 'Redes telefónicas, Internet (IP), MPLS',

  generateSteps() {
    // Topología: origen A → R1, R2, R3, R4 → destino B (dos caminos posibles)
    const modes = ['circ', 'dgm', 'vc'];
    const steps = [];
    const paths = {
      circ: ['A','R1','R2','R4','B'],
      dgm:  [['A','R1','R2','R4','B'], ['A','R1','R3','R4','B']], // 2 paquetes, dos rutas
      vc:   ['A','R1','R3','R4','B'],
    };

    // ── CIRCUITOS ──
    steps.push({ mode:'circ', phase:'setup', pkt:null, active:['A','R1','R2','R4','B'], progress:0,
      desc:`<strong>Conmutación de circuitos</strong>: primero se <strong>establece un camino físico dedicado</strong> A→R1→R2→R4→B (como una llamada telefónica). Los recursos quedan reservados.` });
    steps.push({ mode:'circ', phase:'data', pkt:'circ', active:['A','R1','R2','R4','B'], progress:0,
      desc:`Una vez establecido el circuito, los datos fluyen por el mismo camino <strong>sin cabecera de encaminamiento</strong>: máxima velocidad y latencia constante.` });
    for (let p = 0.2; p <= 1.01; p += 0.2) {
      steps.push({ mode:'circ', phase:'data', pkt:'circ', active:['A','R1','R2','R4','B'], progress:p,
        desc:`Datos viajando por el circuito reservado. Aunque no se transmita nada, <strong>el circuito sigue ocupado</strong>: mala utilización.` });
    }
    steps.push({ mode:'circ', phase:'end', pkt:null, active:['A','R1','R2','R4','B'], progress:1,
      desc:`Al terminar la comunicación se <strong>libera el circuito</strong> (fase de desconexión). Los recursos quedan disponibles para otros.` });

    // ── DATAGRAMAS ──
    steps.push({ mode:'dgm', phase:'p1', pkt:'p1', active:['A'], progress:0,
      desc:`<strong>Conmutación de paquetes (datagramas)</strong>: cada paquete lleva la dirección destino y <strong>se encamina independientemente</strong>. Este modelo es el que usa Internet.` });
    for (let i = 1; i <= 4; i++) {
      steps.push({ mode:'dgm', phase:'p1', pkt:'p1', progress:i/4, path: paths.dgm[0],
        desc:`Paquete <code>#1</code> avanza por A→R1→R2→R4→B. Cada router consulta su <strong>tabla de encaminamiento</strong> y reenvía.` });
    }
    steps.push({ mode:'dgm', phase:'p2', pkt:'p2', progress:0, path: paths.dgm[1],
      desc:`Ahora el paquete <code>#2</code> parte de A. En R1 la carga ha cambiado y el algoritmo de encaminamiento decide otra ruta.` });
    for (let i = 1; i <= 4; i++) {
      steps.push({ mode:'dgm', phase:'p2', pkt:'p2', progress:i/4, path: paths.dgm[1],
        desc:`Paquete <code>#2</code> viaja por A→R1→<strong>R3</strong>→R4→B. Cada paquete puede seguir un camino distinto y <strong>llegar desordenado</strong>.` });
    }

    // ── CIRCUITOS VIRTUALES ──
    steps.push({ mode:'vc', phase:'setup', pkt:'setup', active:['A','R1','R3','R4','B'], progress:0, path: paths.vc,
      desc:`<strong>Conmutación por circuito virtual</strong>: primero se envía un paquete de <em>establecimiento</em> que fija la ruta y asigna un <strong>identificador de CV</strong> en cada router.` });
    for (let i = 1; i <= 4; i++) {
      steps.push({ mode:'vc', phase:'setup', pkt:'setup', progress:i/4, path: paths.vc,
        desc:`El paquete de establecimiento define la ruta A→R1→R3→R4→B. Los routers guardan el estado del CV.` });
    }
    steps.push({ mode:'vc', phase:'data', pkt:'data', progress:0, path: paths.vc,
      desc:`Fase de transferencia: los paquetes de datos llevan el <strong>id de CV</strong> (no la dirección destino completa) y siguen siempre la misma ruta.` });
    for (let i = 1; i <= 4; i++) {
      steps.push({ mode:'vc', phase:'data', pkt:'data', progress:i/4, path: paths.vc,
        desc:`Paquete de datos avanzando por el circuito virtual. Todos los paquetes siguen la <strong>misma ruta</strong> y llegan ordenados. Ej.: <code>MPLS</code>.` });
    }
    return steps;
  },

  render(container, step) {
    const W = 620, H = 320;
    // Coordenadas de nodos
    const N = {
      A:  { x: 40,  y: 160, label: 'A' },
      R1: { x: 170, y: 160, label: 'R1' },
      R2: { x: 320, y: 80,  label: 'R2' },
      R3: { x: 320, y: 240, label: 'R3' },
      R4: { x: 460, y: 160, label: 'R4' },
      B:  { x: 585, y: 160, label: 'B' },
    };
    const edges = [
      ['A','R1'], ['R1','R2'], ['R1','R3'], ['R2','R4'], ['R3','R4'], ['R4','B']
    ];
    // Determinar arista activa/color según modo
    let activeEdges = new Set();
    let activePath = [];
    if (step.mode === 'circ') {
      activePath = ['A','R1','R2','R4','B'];
      activeEdges = new Set(activePath.slice(0,-1).map((n,i) => n + '-' + activePath[i+1]));
    } else if (step.mode === 'vc' || step.mode === 'dgm') {
      activePath = step.path || [];
      activeEdges = new Set(activePath.slice(0,-1).map((n,i) => n + '-' + activePath[i+1]));
    }
    const isActive = (a,b) => activeEdges.has(a+'-'+b) || activeEdges.has(b+'-'+a);

    // Posición del paquete a lo largo del path
    let pkt = null;
    if (step.pkt && activePath.length > 1) {
      const p = step.progress || 0;
      const segIdx = Math.min(Math.floor(p * (activePath.length - 1)), activePath.length - 2);
      const segFrac = (p * (activePath.length - 1)) - segIdx;
      const a = N[activePath[segIdx]], b = N[activePath[segIdx+1]];
      pkt = { x: a.x + (b.x - a.x) * segFrac, y: a.y + (b.y - a.y) * segFrac };
    }

    // Colores según modo
    const modeColor = { circ: RC.amber, dgm: RC.blue, vc: RC.purple }[step.mode] || RC.blue;
    const modeLabel = { circ: 'Circuitos', dgm: 'Datagramas', vc: 'Circuito virtual' }[step.mode];

    const nodeEls = Object.entries(N).map(([id, n]) => {
      const isNode = ['R1','R2','R3','R4'].includes(id);
      const color = isNode ? RC.purple : RC.blue;
      const active = activePath.includes(id);
      return `<g class="node-${isNode?'router':'host'} ${active?'active':''}">
        <circle cx="${n.x}" cy="${n.y}" r="20" fill="${active ? (isNode?'#f5f3ff':'#eff6ff') : 'white'}" stroke="${color}" stroke-width="2.5"/>
        <text x="${n.x}" y="${n.y+4}" style="font-family:JetBrains Mono,monospace;font-weight:800;font-size:13px;fill:${RC.txt};text-anchor:middle">${n.label}</text>
      </g>`;
    }).join('');

    const edgeEls = edges.map(([a,b]) => {
      const A = N[a], B = N[b];
      const cls = isActive(a,b) ? 'active' : '';
      return `<line class="link ${cls}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${cls?modeColor:'#cbd5e1'}" stroke-width="${cls?3.5:2}"/>`;
    }).join('');

    const pktEl = pkt ? `<g><rect x="${pkt.x-14}" y="${pkt.y-9}" width="28" height="18" rx="4" fill="${modeColor}" stroke="${RC.txt}" stroke-width="1"/><text x="${pkt.x}" y="${pkt.y+4}" style="font-family:JetBrains Mono,monospace;font-size:9px;font-weight:800;fill:white;text-anchor:middle">${step.pkt === 'setup' ? 'CV' : step.pkt === 'p1' ? '#1' : step.pkt === 'p2' ? '#2' : 'DATA'}</text></g>` : '';

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%">
        <div style="display:flex;gap:12px;justify-content:center">
          ${['circ','dgm','vc'].map(m => `<span class="badge" style="background:${step.mode===m ? (m==='circ'?'#fef3c7':m==='dgm'?'#dbeafe':'#ede9fe') : '#f1f5f9'};color:${step.mode===m ? (m==='circ'?'#92400e':m==='dgm'?'#1e40af':'#5b21b6') : RC.muted};font-weight:800;padding:5px 12px">${m==='circ'?'Circuitos':m==='dgm'?'Datagramas':'Circuito Virtual'}</span>`).join('')}
        </div>
        <svg class="topo-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:640px">
          ${edgeEls}
          ${nodeEls}
          ${pktEl}
        </svg>
        <div style="font-size:.78rem;color:${RC.muted};font-weight:600">Modo actual: <strong style="color:${modeColor}">${modeLabel}</strong></div>
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  2. ENCAPSULACIÓN — TCP/IP (5 capas)                              ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_ENCAPSULACION = {
  id: 'encapsulacion', name: 'Encapsulación en el modelo TCP/IP', shortName: 'Encapsulación',
  layer: 'Arquitectura', protocol: 'TCP/IP (5 capas)',
  description: 'Sigue el camino de un mensaje HTTP bajando por la pila del emisor (añadiendo cabeceras) y subiendo por la del receptor (quitándolas). Cada capa añade su propia cabecera formando la PDU (Protocol Data Unit).',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">PDU</span> Cada capa añade una cabecera con la información que su protocolo par necesita. La capa <em>n</em> del emisor y del receptor se hablan como si fueran adyacentes.</p>
  </div>`,
  useCases: 'Todo el tráfico IP: HTTP, correo, DNS…',

  generateSteps() {
    const layers = [
      { id:'app', name:'Aplicación', pdu:'Mensaje',   hdr:'HTTP',  color:'app', proto:'HTTP' },
      { id:'tra', name:'Transporte', pdu:'Segmento',  hdr:'TCP',   color:'tra', proto:'TCP' },
      { id:'red', name:'Red',        pdu:'Paquete',   hdr:'IP',    color:'red', proto:'IPv4' },
      { id:'enl', name:'Enlace',     pdu:'Trama',     hdr:'ETH',   color:'enl', proto:'Ethernet' },
      { id:'fis', name:'Físico',     pdu:'Bits',      hdr:null,    color:'fis', proto:'ETH-PHY' },
    ];
    const steps = [];

    steps.push({
      side:'emisor', activeLayer:-1, parts:[{ lbl:'HTTP GET /', cls:'pdu-data' }],
      desc:`En el emisor, la <strong>capa de Aplicación</strong> genera el mensaje que quiere enviar: por ejemplo <code>GET / HTTP/1.1</code> desde un navegador.`
    });
    // Bajando por la pila del emisor
    for (let i = 0; i < layers.length; i++) {
      const L = layers[i];
      let parts;
      if (i === 0) {
        parts = [{ lbl:'HTTP', cls:'h-app pdu-new' }, { lbl:'Datos', cls:'pdu-data' }];
      } else if (i === 1) {
        parts = [{ lbl:'TCP', cls:'h-tra pdu-new' }, { lbl:'HTTP', cls:'h-app' }, { lbl:'Datos', cls:'pdu-data' }];
      } else if (i === 2) {
        parts = [{ lbl:'IP', cls:'h-red pdu-new' }, { lbl:'TCP', cls:'h-tra' }, { lbl:'HTTP', cls:'h-app' }, { lbl:'Datos', cls:'pdu-data' }];
      } else if (i === 3) {
        parts = [{ lbl:'ETH', cls:'h-enl pdu-new' }, { lbl:'IP', cls:'h-red' }, { lbl:'TCP', cls:'h-tra' }, { lbl:'HTTP', cls:'h-app' }, { lbl:'Datos', cls:'pdu-data' }, { lbl:'CRC', cls:'h-tra-fin pdu-new' }];
      } else {
        parts = [{ lbl:'0101...', cls:'pdu-data' }];
      }
      steps.push({
        side:'emisor', activeLayer:i, parts,
        desc: i === 4
          ? `Nivel <strong>Físico</strong>: la trama se codifica en bits (Manchester, NRZ…) y viaja por el medio como señal eléctrica u óptica.`
          : `Nivel <strong>${L.name}</strong> añade cabecera <code>${L.hdr}</code>. La PDU resultante se llama <strong>${L.pdu}</strong>${L.hdr==='ETH'?' (incluye también CRC al final)':''}.`
      });
    }
    // Subida por la pila del receptor (desencapsulación)
    for (let i = layers.length - 1; i >= 0; i--) {
      const L = layers[i];
      let parts;
      if (i === 4) parts = [{ lbl:'0101...', cls:'pdu-data' }];
      else if (i === 3) parts = [{ lbl:'ETH', cls:'h-enl' }, { lbl:'IP', cls:'h-red' }, { lbl:'TCP', cls:'h-tra' }, { lbl:'HTTP', cls:'h-app' }, { lbl:'Datos', cls:'pdu-data' }, { lbl:'CRC', cls:'h-tra-fin' }];
      else if (i === 2) parts = [{ lbl:'IP', cls:'h-red' }, { lbl:'TCP', cls:'h-tra' }, { lbl:'HTTP', cls:'h-app' }, { lbl:'Datos', cls:'pdu-data' }];
      else if (i === 1) parts = [{ lbl:'TCP', cls:'h-tra' }, { lbl:'HTTP', cls:'h-app' }, { lbl:'Datos', cls:'pdu-data' }];
      else parts = [{ lbl:'HTTP', cls:'h-app' }, { lbl:'Datos', cls:'pdu-data' }];
      steps.push({
        side:'receptor', activeLayer:i, parts,
        desc: i === 4
          ? `En el receptor, el <strong>Nivel Físico</strong> recibe la señal y la interpreta como bits (00101011…).`
          : i === 0
          ? `El <strong>mensaje HTTP original</strong> llega íntegro a la aplicación destino tras eliminar todas las cabeceras.`
          : `Nivel <strong>${L.name}</strong> examina la cabecera <code>${L.hdr}</code> y la elimina, pasando la PDU restante a la capa superior.`
      });
    }

    return steps;
  },

  render(container, step) {
    const layers = [
      { id:'app', name:'Aplicación', pdu:'Mensaje',  proto:'HTTP',     cls:'l-app' },
      { id:'tra', name:'Transporte', pdu:'Segmento', proto:'TCP / UDP',cls:'l-tra' },
      { id:'red', name:'Red',        pdu:'Paquete',  proto:'IP',       cls:'l-red' },
      { id:'enl', name:'Enlace',     pdu:'Trama',    proto:'Ethernet', cls:'l-enl' },
      { id:'fis', name:'Físico',     pdu:'Bits',     proto:'—',        cls:'l-fis' },
    ];
    const stack = (title, activeIdx) => `
      <div class="stack-col">
        <div class="stack-title">${title}</div>
        ${layers.map((L,i) => `
          <div class="stack-layer ${L.cls} ${activeIdx===i?'active':''}">
            <div>${L.name}</div>
            <span class="layer-sub">PDU: ${L.pdu}${L.proto!=='—'? ' · '+L.proto:''}</span>
          </div>`).join('')}
      </div>`;

    const pduRow = (parts) => `
      <div class="pdu-row" style="margin-top: 10px">
        ${parts.map(p => `<div class="pdu-part ${p.cls}">${p.lbl}</div>`).join('')}
      </div>`;

    const emisorActive = step.side === 'emisor' ? step.activeLayer : -1;
    const receptorActive = step.side === 'receptor' ? step.activeLayer : -1;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
        <div class="stack-wrap">
          ${stack('Emisor', emisorActive)}
          ${stack('Receptor', receptorActive)}
        </div>
        <div style="width:100%;max-width:640px;text-align:center">
          <div style="font-size:.72rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:${RC.muted};margin-bottom:6px">
            PDU en ${step.side==='emisor'?'transmisión':'recepción'}
          </div>
          ${pduRow(step.parts)}
        </div>
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  3. CODIFICACIÓN DIGITAL — NRZ / NRZI / Manchester / Manch. Dif. ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_CODIFICACION = {
  id: 'codificacion-digital', name: 'Codificaciones digitales en banda base', shortName: 'Codificaciones',
  layer: 'Físico', protocol: 'NRZ · Manchester · MD',
  description: 'Compara las principales técnicas de codificación de una señal digital en banda base para el mismo tren de bits. Manchester y Manchester Diferencial son autosincronizantes (Ethernet 10BASE-T las usa).',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Sincronización</span> Con <strong>NRZ</strong> una tirada larga de 0s o 1s no da referencia temporal al receptor: pierde el reloj. <strong>Manchester</strong> garantiza una transición <em>por bit</em>, lo que permite recuperar el reloj de los propios datos.</p>
  </div>`,
  useCases: 'RS-232 (NRZ), Ethernet 10BASE-T (Manchester)',

  generateSteps() {
    const bits = '10110100';
    const codes = ['nrz-l','nrz-i','manchester','manchester-d'];
    const steps = [];
    steps.push({ code:'all', bitIdx: -1, desc:
      `Vamos a codificar la misma cadena de bits <code>${bits}</code> con distintas técnicas. Fíjate en cuántas transiciones tiene la señal en cada caso.` });
    codes.forEach((c, k) => {
      steps.push({ code:c, bitIdx:-1, desc:
        `<strong>${{
          'nrz-l':'NRZ-L (Non-Return-to-Zero Level)',
          'nrz-i':'NRZ-I (Non-Return-to-Zero Inverted)',
          'manchester':'Manchester (IEEE 802.3 10BASE-T)',
          'manchester-d':'Manchester Diferencial (Token Ring)'
        }[c]}</strong> — ${{
          'nrz-l':'Un nivel de tensión alto para 1 y bajo para 0. Simple, pero sin sincronización si hay tiradas largas.',
          'nrz-i':'Un <em>1</em> se codifica invirtiendo el nivel; un <em>0</em> lo mantiene. Da algo mejor de sincronización.',
          'manchester':'Cada bit tiene <strong>transición en el centro</strong>: 1 = bajo→alto, 0 = alto→bajo. Autosincronizante.',
          'manchester-d':'Un <em>0</em> se codifica con <strong>transición al inicio</strong> del bit; un <em>1</em>, sin transición al inicio. Todos los bits tienen transición central.'
        }[c]}` });
      for (let i = 0; i < bits.length; i++) {
        steps.push({ code:c, bitIdx:i, desc:
          `Bit <code>${bits[i]}</code>: aplicando la regla de <strong>${c.toUpperCase()}</strong>, la señal queda como se muestra${i===bits.length-1?' hasta completar la cadena':''}.` });
      }
    });
    return steps;
  },

  render(container, step) {
    const bits = '10110100';
    const W = 560, H = 90, mid = H/2;
    const bitW = W / bits.length;

    // Función para dibujar cada codificación
    const encode = (code, upToBit) => {
      const pts = [];
      let level = 1; // 1 = alto (arriba), 0 = bajo (abajo)
      const yFor = (l) => l === 1 ? 15 : H - 15;

      if (code === 'nrz-l') {
        // 1 = alto, 0 = bajo
        for (let i = 0; i <= upToBit; i++) {
          const y = bits[i] === '1' ? yFor(1) : yFor(0);
          const x0 = i * bitW, x1 = (i+1)*bitW;
          if (pts.length === 0) pts.push([x0, y]);
          else if (pts[pts.length-1][1] !== y) { pts.push([x0, pts[pts.length-1][1]]); pts.push([x0, y]); }
          pts.push([x1, y]);
        }
      } else if (code === 'nrz-i') {
        // 1 = invertir, 0 = mantener
        let cur = 0; // arranca en bajo
        for (let i = 0; i <= upToBit; i++) {
          if (bits[i] === '1') cur = 1 - cur;
          const y = yFor(cur);
          const x0 = i*bitW, x1 = (i+1)*bitW;
          if (pts.length === 0) pts.push([x0, y]);
          else if (pts[pts.length-1][1] !== y) { pts.push([x0, pts[pts.length-1][1]]); pts.push([x0, y]); }
          pts.push([x1, y]);
        }
      } else if (code === 'manchester') {
        // 1 = bajo→alto (medio), 0 = alto→bajo (medio)
        for (let i = 0; i <= upToBit; i++) {
          const x0 = i*bitW, xm = (i+0.5)*bitW, x1 = (i+1)*bitW;
          const isOne = bits[i] === '1';
          const y1 = yFor(isOne ? 0 : 1); // primera mitad
          const y2 = yFor(isOne ? 1 : 0); // segunda mitad
          if (pts.length === 0) pts.push([x0, y1]);
          else if (pts[pts.length-1][1] !== y1) { pts.push([x0, pts[pts.length-1][1]]); pts.push([x0, y1]); }
          pts.push([xm, y1]);
          pts.push([xm, y2]);
          pts.push([x1, y2]);
        }
      } else if (code === 'manchester-d') {
        // 0 = transición al inicio, 1 = sin transición al inicio; SIEMPRE transición central
        let cur = 1; // arranca en alto
        for (let i = 0; i <= upToBit; i++) {
          const x0 = i*bitW, xm = (i+0.5)*bitW, x1 = (i+1)*bitW;
          if (bits[i] === '0') cur = 1 - cur; // transición al inicio
          const y1 = yFor(cur);
          cur = 1 - cur; // transición central
          const y2 = yFor(cur);
          if (pts.length === 0) pts.push([x0, y1]);
          else if (pts[pts.length-1][1] !== y1) { pts.push([x0, pts[pts.length-1][1]]); pts.push([x0, y1]); }
          pts.push([xm, y1]);
          pts.push([xm, y2]);
          pts.push([x1, y2]);
        }
      }
      const d = pts.map((p,i) => (i===0?'M':'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      return d;
    };

    const drawSVG = (code, label, upTo) => {
      const path = encode(code, upTo);
      // Ejes de reticula
      const grid = bits.split('').map((_, i) => `<line x1="${i*bitW}" y1="0" x2="${i*bitW}" y2="${H}" stroke="#e2e8f0" stroke-dasharray="3,3"/>`).join('');
      const bitsLabels = bits.split('').map((b, i) => `<text x="${(i+0.5)*bitW}" y="${H-3}" style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:800;fill:${i<=upTo?RC.cyanD:RC.muted};text-anchor:middle">${b}</text>`).join('');
      return `
        <div style="width:100%;max-width:600px">
          <div style="font-size:.78rem;font-weight:800;color:${RC.txt};margin-bottom:2px;display:flex;justify-content:space-between;align-items:baseline">
            <span>${label}</span>
            <span style="font-family:JetBrains Mono,monospace;font-size:.68rem;color:${RC.muted};font-weight:600">Bits: ${bits}</span>
          </div>
          <svg viewBox="0 0 ${W} ${H+18}" width="100%" style="background:${RC.white};border:1px solid #e2e8f0;border-radius:6px">
            ${grid}
            <line x1="0" y1="${mid}" x2="${W}" y2="${mid}" stroke="#cbd5e1" stroke-dasharray="2,3"/>
            <path d="${path}" fill="none" stroke="${RC.cyan}" stroke-width="2.5" stroke-linejoin="miter"/>
            ${bitsLabels}
          </svg>
        </div>`;
    };

    const codes = [
      { c:'nrz-l',       t:'NRZ-L' },
      { c:'nrz-i',       t:'NRZ-I' },
      { c:'manchester',  t:'Manchester' },
      { c:'manchester-d',t:'Manchester Diferencial' },
    ];

    const upTo = step.bitIdx < 0 ? bits.length - 1 : step.bitIdx;
    const showAll = step.code === 'all';
    const svgs = codes.filter(x => showAll || x.c === step.code).map(x => drawSVG(x.c, x.t, upTo)).join('');

    container.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%">${svgs}</div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  4. MODULACIÓN DIGITAL — ASK / FSK / PSK                          ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_MODULACION = {
  id: 'modulacion', name: 'Modulaciones digitales ASK · FSK · PSK', shortName: 'Modulaciones',
  layer: 'Físico', protocol: 'ASK · FSK · PSK',
  description: 'Cuando el medio requiere señal analógica (radio, cable coaxial), la señal digital modula una portadora. En ASK se cambia la amplitud; en FSK la frecuencia; en PSK la fase.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Portadora</span> Los tres esquemas parten de una senoide portadora <code>A·sin(2π f t + φ)</code>. Los bits alteran uno de los tres parámetros: amplitud (A), frecuencia (f) o fase (φ).</p>
  </div>`,
  useCases: 'Wi-Fi (QAM), módem DSL, radiofrecuencia',

  generateSteps() {
    const bits = '10110100';
    const modes = ['ask','fsk','psk'];
    const steps = [{ mode:'ask', bitIdx:-1, desc:
      `Modularemos la cadena <code>${bits}</code> con tres esquemas. Observa qué propiedad de la senoide portadora cambia según el bit.` }];
    modes.forEach(m => {
      steps.push({ mode:m, bitIdx:-1, desc:
        `<strong>${m.toUpperCase()}</strong> — ${{
          'ask':'<em>Amplitude Shift Keying</em>: bit 1 → amplitud alta, bit 0 → amplitud baja (o nula). Sensible al ruido.',
          'fsk':'<em>Frequency Shift Keying</em>: bit 1 → frecuencia f₁, bit 0 → frecuencia f₂. Robusto ante ruido, usado en modems clásicos.',
          'psk':'<em>Phase Shift Keying</em>: bit 1 → fase 0°, bit 0 → fase 180° (salto de fase). Base de QPSK y QAM en Wi-Fi.'
        }[m]}` });
      for (let i = 0; i < bits.length; i++) {
        steps.push({ mode:m, bitIdx:i, desc:
          `Bit <code>${bits[i]}</code>: la portadora se ajusta según la regla de <strong>${m.toUpperCase()}</strong>.` });
      }
    });
    return steps;
  },

  render(container, step) {
    const bits = '10110100';
    const W = 580, H = 110, mid = H/2;
    const bitW = W / bits.length;

    const upTo = step.bitIdx < 0 ? bits.length - 1 : step.bitIdx;

    const sample = (mode, x) => {
      const bitIdx = Math.min(Math.floor(x / bitW), bits.length - 1);
      if (bitIdx > upTo) return mid;
      const b = bits[bitIdx];
      const tInBit = (x - bitIdx * bitW) / bitW; // 0..1
      if (mode === 'ask') {
        const A = b === '1' ? 32 : 8;
        return mid - A * Math.sin(2 * Math.PI * 3 * (bitIdx + tInBit));
      } else if (mode === 'fsk') {
        const f = b === '1' ? 4 : 2;
        return mid - 30 * Math.sin(2 * Math.PI * f * (bitIdx + tInBit));
      } else if (mode === 'psk') {
        const phase = b === '1' ? 0 : Math.PI;
        return mid - 30 * Math.sin(2 * Math.PI * 3 * (bitIdx + tInBit) + phase);
      }
      return mid;
    };

    const genPath = (mode) => {
      const N = 400;
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * W;
        pts.push([x, sample(mode, x)]);
      }
      return pts.map((p,i) => (i===0?'M':'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    };

    const gridLines = bits.split('').map((_, i) => `<line x1="${i*bitW}" y1="0" x2="${i*bitW}" y2="${H}" stroke="#e2e8f0" stroke-dasharray="3,3"/>`).join('');
    const bitLabels = bits.split('').map((b, i) => `<text x="${(i+0.5)*bitW}" y="${H-3}" style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:800;fill:${i<=upTo?RC.cyanD:RC.muted};text-anchor:middle">${b}</text>`).join('');

    const drawSVG = (mode, label) => `
      <div style="width:100%;max-width:620px">
        <div style="font-size:.78rem;font-weight:800;color:${RC.txt};margin-bottom:2px;display:flex;justify-content:space-between;align-items:baseline">
          <span>${label}</span>
          <span style="font-family:JetBrains Mono,monospace;font-size:.68rem;color:${RC.muted};font-weight:600">Bits: ${bits}</span>
        </div>
        <svg viewBox="0 0 ${W} ${H+18}" width="100%" style="background:${RC.white};border:1px solid #e2e8f0;border-radius:6px">
          ${gridLines}
          <line x1="0" y1="${mid}" x2="${W}" y2="${mid}" stroke="#cbd5e1" stroke-dasharray="2,3"/>
          <path d="${genPath(mode)}" fill="none" stroke="${RC.cyan}" stroke-width="2" stroke-linejoin="round"/>
          ${bitLabels}
        </svg>
      </div>`;

    const modes = [
      { m:'ask', t:'ASK — Amplitud' },
      { m:'fsk', t:'FSK — Frecuencia' },
      { m:'psk', t:'PSK — Fase' },
    ];
    const svgs = modes.filter(x => x.m === step.mode).map(x => drawSVG(x.m, x.t)).join('');
    container.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%">${svgs}</div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  5. MULTIPLEXACIÓN — FDM / TDM / WDM                              ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_MULTIPLEXACION = {
  id: 'multiplexacion', name: 'Multiplexación FDM · TDM · WDM', shortName: 'Multiplexación',
  layer: 'Físico', protocol: 'FDM · TDM · WDM',
  description: 'Cuando varios canales comparten un mismo medio, hay que separarlos. FDM asigna franjas de frecuencia, TDM asigna franjas de tiempo, WDM asigna longitudes de onda distintas en fibra óptica.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">TDM síncrono</span> Cada fuente tiene un <em>slot</em> temporal fijo (aunque no tenga datos). En <span class="explain-tag">TDM estadístico</span> los slots se asignan solo a las fuentes con datos.</p>
  </div>`,
  useCases: 'DSL (FDM), líneas E1/T1 (TDM), fibra óptica (WDM)',

  generateSteps() {
    const steps = [];
    steps.push({ mode:'fdm', frame:0, desc:
      `<strong>FDM — Frequency Division Multiplexing</strong>: cada canal (A, B, C, D) ocupa una <strong>franja de frecuencia distinta</strong>. Todos transmiten simultáneamente sobre el mismo medio.` });
    // TDM: 4 fuentes con datos alternando
    const patterns = [
      ['A','B','C','D'],
      ['A','B','C','D'],
      ['A','—','C','D'], // B no tiene datos
      ['A','B','C','—'],
      ['—','B','—','D'],
      ['A','B','C','D'],
    ];
    steps.push({ mode:'tdm-sinc', frame:0, patterns, desc:
      `<strong>TDM síncrono</strong>: se asigna un slot fijo a cada fuente. Los slots rotan cíclicamente. Si una fuente no tiene datos, <strong>su slot va vacío</strong> — se desperdicia.` });
    for (let f = 0; f < patterns.length; f++) {
      steps.push({ mode:'tdm-sinc', frame:f, patterns, desc:
        `Trama ${f+1}: fuentes que transmiten: <code>${patterns[f].filter(x=>x!=='—').join(', ')||'—'}</code>. Los huecos (—) muestran <strong>slots vacíos</strong> (fuente sin datos).` });
    }
    steps.push({ mode:'tdm-est', frame:0, patterns, desc:
      `<strong>TDM estadístico</strong>: los slots se asignan <strong>dinámicamente</strong> solo a fuentes que tienen datos. Requiere cabecera para identificar la fuente pero aprovecha mejor el ancho de banda.` });
    for (let f = 0; f < patterns.length; f++) {
      const active = patterns[f].filter(x => x !== '—');
      steps.push({ mode:'tdm-est', frame:f, patterns, desc:
        `Trama ${f+1}: solo se ocupan los slots de fuentes activas <code>${active.join(', ')||'—'}</code>. Ningún slot queda vacío.` });
    }
    steps.push({ mode:'wdm', frame:0, desc:
      `<strong>WDM — Wavelength Division Multiplexing</strong>: es FDM aplicada a la fibra óptica. Cada canal usa una <strong>longitud de onda</strong> distinta (color de luz). Es como muchos láseres compartiendo la misma fibra.` });
    return steps;
  },

  render(container, step) {
    if (step.mode === 'fdm') {
      const bands = [
        { name:'Canal A', color:'A', freq:'0 – 4 kHz' },
        { name:'Canal B', color:'B', freq:'4 – 8 kHz' },
        { name:'Canal C', color:'C', freq:'8 – 12 kHz' },
        { name:'Canal D', color:'D', freq:'12 – 16 kHz' },
      ];
      container.innerHTML = `
        <div class="mux-wrap">
          <div style="font-family:JetBrains Mono,monospace;font-size:.72rem;color:${RC.muted};font-weight:800;text-transform:uppercase;letter-spacing:.05em">↑ Frecuencia</div>
          ${bands.slice().reverse().map(b => `<div class="mux-band mux-color-${b.color}" style="width:540px">${b.name} · ${b.freq}</div>`).join('')}
          ${legend([
            {c: RC.blue, t: 'Canal A'}, {c: RC.green, t: 'Canal B'},
            {c: RC.amber, t: 'Canal C'}, {c: RC.purple, t: 'Canal D'},
          ])}
        </div>`;
    } else if (step.mode === 'wdm') {
      const bands = [
        { name:'λ₁ (rojo)',   color:'C' },
        { name:'λ₂ (verde)',  color:'B' },
        { name:'λ₃ (azul)',   color:'A' },
        { name:'λ₄ (violeta)',color:'D' },
      ];
      container.innerHTML = `
        <div class="mux-wrap">
          <div style="font-family:JetBrains Mono,monospace;font-size:.72rem;color:${RC.muted};font-weight:800;text-transform:uppercase">↔ Fibra óptica compartida</div>
          ${bands.map(b => `<div class="mux-band mux-color-${b.color}" style="width:540px">${b.name}</div>`).join('')}
          <div style="font-size:.75rem;color:${RC.muted};font-style:italic">Cada láser envía su color; en el receptor un prisma separa las longitudes de onda.</div>
        </div>`;
    } else {
      const { patterns, frame } = step;
      const isEst = step.mode === 'tdm-est';
      const frameToShow = patterns[frame] || patterns[0];
      const compactSlots = isEst ? frameToShow.filter(x => x !== '—') : frameToShow;
      container.innerHTML = `
        <div class="mux-wrap">
          <div style="font-family:JetBrains Mono,monospace;font-size:.72rem;color:${RC.muted};font-weight:800;text-transform:uppercase">↔ Tiempo</div>
          <div style="display:flex;flex-direction:column;gap:8px;width:100%;max-width:560px">
            ${patterns.map((frm, i) => {
              const isActive = i === frame;
              const shown = isEst ? frm.filter(x => x !== '—') : frm;
              const cols = shown.length || 1;
              return `<div style="display:flex;align-items:center;gap:8px">
                <div style="font-family:JetBrains Mono,monospace;font-size:.7rem;color:${isActive?RC.cyanD:RC.muted};font-weight:800;min-width:56px">Trama ${i+1}</div>
                <div class="mux-tdm-track" style="height:36px;flex:1">
                  ${shown.length === 0
                    ? `<div class="mux-slot empty">— trama vacía —</div>`
                    : shown.map(s => s === '—'
                        ? `<div class="mux-slot empty">—</div>`
                        : `<div class="mux-slot mux-color-${s} ${isActive?'active':''}">${s}</div>`
                      ).join('')
                  }
                </div>
              </div>`;
            }).join('')}
          </div>
          <div style="font-size:.75rem;color:${RC.muted};font-style:italic">${isEst ? 'TDM estadístico — sin slots vacíos' : 'TDM síncrono — cada fuente ocupa siempre su slot'}</div>
        </div>`;
    }
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  6. PARADA Y ESPERA (Stop & Wait) — con errores                   ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_PARADA_ESPERA = {
  id: 'parada-espera', name: 'Parada y Espera (Stop & Wait)', shortName: 'Parada y Espera',
  layer: 'Enlace', protocol: 'S&W · ARQ',
  description: 'El emisor envía una trama y espera su ACK antes de mandar la siguiente. Con temporizador de espera, gestiona pérdidas de datos y de ACKs mediante numeración alternante (0/1).',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Eficiencia baja</span> Solo hay una trama en vuelo. El emisor pasa la mayor parte del tiempo esperando el ACK — la utilización tiende a 0 en enlaces largos.</p>
  </div>`,
  useCases: 'Enlaces lentos, HDLC balanceado clásico',

  generateSteps() {
    // Cinco escenarios en secuencia
    const scenarios = [
      { label:'Trama 0 sin errores',        seq:0, lost:null,        ack:0 },
      { label:'Trama 1 sin errores',        seq:1, lost:null,        ack:1 },
      { label:'Trama 0 — pérdida de datos', seq:0, lost:'data',      ack:0 },
      { label:'Trama 1 — pérdida de ACK',   seq:1, lost:'ack',       ack:1 },
    ];
    const steps = [];
    scenarios.forEach((sc, k) => {
      const { seq, lost, ack, label } = sc;
      steps.push({ scene:k, phase:'init', seq, ack, lost, desc:
        `<strong>Escenario ${k+1}: ${label}</strong>. El emisor va a enviar la trama con número de secuencia <code>${seq}</code>.` });
      if (lost === 'data') {
        steps.push({ scene:k, phase:'send', seq, ack, lost, desc:
          `El emisor envía <code>DATA(${seq})</code> y arma su <strong>temporizador</strong>. <span style="color:${RC.red};font-weight:700">La trama se pierde en el medio</span>.` });
        steps.push({ scene:k, phase:'timeout', seq, ack, lost, desc:
          `El temporizador <strong>expira</strong> sin que llegue el ACK. El emisor asume pérdida y <strong>retransmite</strong> DATA(${seq}).` });
        steps.push({ scene:k, phase:'retx', seq, ack, lost, desc:
          `Segunda transmisión de DATA(${seq}). Esta vez llega bien al receptor.` });
        steps.push({ scene:k, phase:'ack', seq, ack, lost:null, desc:
          `El receptor recibe DATA(${seq}) y responde con <code>ACK(${seq})</code>. El emisor pasa a la siguiente trama.` });
      } else if (lost === 'ack') {
        steps.push({ scene:k, phase:'send', seq, ack, lost, desc:
          `El emisor envía <code>DATA(${seq})</code>. Llega al receptor sin problemas.` });
        steps.push({ scene:k, phase:'ack', seq, ack, lost, desc:
          `El receptor emite <code>ACK(${seq})</code>. <span style="color:${RC.red};font-weight:700">Pero el ACK se pierde en el camino.</span>` });
        steps.push({ scene:k, phase:'timeout', seq, ack, lost, desc:
          `El temporizador expira. Como no distingue si se perdió el dato o el ACK, el emisor <strong>retransmite DATA(${seq})</strong>.` });
        steps.push({ scene:k, phase:'duplicated', seq, ack, lost:null, desc:
          `El receptor ve el número de secuencia <code>${seq}</code> y detecta que es <strong>duplicada</strong>: la descarta pero reenvía ACK(${seq}). Aquí es donde <strong>importa la numeración alternante</strong>.` });
      } else {
        steps.push({ scene:k, phase:'send', seq, ack, lost:null, desc:
          `El emisor envía <code>DATA(${seq})</code> y arma su temporizador.` });
        steps.push({ scene:k, phase:'ack', seq, ack, lost:null, desc:
          `El receptor recibe DATA(${seq}) sin errores y contesta <code>ACK(${seq})</code>. El emisor cancela el temporizador y sigue con la siguiente trama.` });
      }
    });
    return steps;
  },

  render(container, step) {
    const W = 560, H = 300;
    const laneEmisor = 100, laneReceptor = W - 100;
    // Vertical: t=0 arriba, avanza abajo
    const events = [];
    let y = 40;
    const yStep = 40;

    // Determinar qué eventos mostrar según fase actual
    const seq = step.seq;
    const isLostData = step.lost === 'data';
    const isLostAck  = step.lost === 'ack';
    const phase = step.phase;

    // Fase init: solo header
    if (phase === 'init') {
      events.push({ type:'header' });
    } else {
      // send + posible timer/retx/ack
      events.push({ type:'send', y, lost:isLostData && (phase !== 'retx' && phase !== 'ack'), seq }); y += yStep;
      if (phase !== 'send') {
        if (isLostData && phase === 'timeout') {
          events.push({ type:'timer', y }); y += yStep - 8;
        } else if (isLostData && (phase === 'retx' || phase === 'ack')) {
          events.push({ type:'timer', y }); y += yStep - 8;
          events.push({ type:'send', y, lost:false, seq, tag:'retx' }); y += yStep;
        }
        if (isLostAck && phase === 'ack') {
          events.push({ type:'ack', y, lost:true, seq }); y += yStep;
        } else if (isLostAck && phase === 'timeout') {
          events.push({ type:'ack', y, lost:true, seq }); y += yStep;
          events.push({ type:'timer', y }); y += yStep - 8;
        } else if (isLostAck && phase === 'duplicated') {
          events.push({ type:'ack', y, lost:true, seq }); y += yStep;
          events.push({ type:'timer', y }); y += yStep - 8;
          events.push({ type:'send', y, lost:false, seq, tag:'retx' }); y += yStep;
          events.push({ type:'ack', y, lost:false, seq, tag:'dup' }); y += yStep;
        } else if (!isLostData && !isLostAck && phase === 'ack') {
          events.push({ type:'ack', y, lost:false, seq }); y += yStep;
        } else if (isLostData && phase === 'ack') {
          events.push({ type:'ack', y, lost:false, seq }); y += yStep;
        }
      }
    }

    const arrows = events.map(e => {
      if (e.type === 'header') return '';
      if (e.type === 'timer') {
        return `<line x1="${laneEmisor-14}" y1="${e.y-8}" x2="${laneEmisor-14}" y2="${e.y+8}" stroke="${RC.red}" stroke-width="2" stroke-dasharray="3,3"/>
                <text x="${laneEmisor-22}" y="${e.y+4}" style="font-family:JetBrains Mono,monospace;font-size:10px;fill:${RC.red};font-weight:800;text-anchor:end">t/o</text>`;
      }
      if (e.type === 'send') {
        const cls = e.lost ? 'lost' : (e.tag === 'retx' ? 'current' : 'past');
        const color = e.lost ? RC.red : RC.blue;
        const marker = e.lost ? 'arrow-red' : 'arrow-blue';
        const x2 = e.lost ? (laneEmisor + laneReceptor) / 2 : laneReceptor;
        return `<line x1="${laneEmisor}" y1="${e.y}" x2="${x2}" y2="${e.y+18}" class="tl-arrow ${cls}" stroke="${color}" marker-end="url(#${marker})"/>
                <text x="${laneEmisor+30}" y="${e.y-4}" class="tl-label">DATA(${e.seq})${e.tag==='retx'?' ↻':''}</text>`;
      }
      if (e.type === 'ack') {
        const cls = e.lost ? 'lost' : 'past';
        const color = e.lost ? RC.red : RC.green;
        const marker = e.lost ? 'arrow-red' : 'arrow-green';
        const x2 = e.lost ? (laneEmisor + laneReceptor) / 2 : laneEmisor;
        return `<line x1="${laneReceptor}" y1="${e.y}" x2="${x2}" y2="${e.y+18}" class="tl-arrow ${cls}" stroke="${color}" marker-end="url(#${marker})"/>
                <text x="${laneReceptor-30}" y="${e.y-4}" class="tl-label" style="text-anchor:end">ACK(${e.seq})${e.tag==='dup'?' ✕ dup':''}</text>`;
      }
      return '';
    }).join('');

    container.innerHTML = `
      <div class="timeline-wrap">
        <svg class="timeline-svg" viewBox="0 0 ${W} ${Math.max(H, y+20)}" width="100%" style="max-width:600px">
          <defs>
            ${arrowMarker('arrow-blue', RC.blue)}
            ${arrowMarker('arrow-green', RC.green)}
            ${arrowMarker('arrow-red', RC.red)}
          </defs>
          <text x="${laneEmisor}" y="20" class="tl-header">Emisor</text>
          <text x="${laneReceptor}" y="20" class="tl-header">Receptor</text>
          <line x1="${laneEmisor}" y1="28" x2="${laneEmisor}" y2="${Math.max(H, y+10)}" class="tl-lane"/>
          <line x1="${laneReceptor}" y1="28" x2="${laneReceptor}" y2="${Math.max(H, y+10)}" class="tl-lane"/>
          ${arrows}
        </svg>
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  7. GO-BACK-N (Ventana deslizante Wr=1)                           ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_GO_BACK_N = {
  id: 'go-back-n', name: 'Go-Back-N (Ventana deslizante)', shortName: 'Go-Back-N',
  layer: 'Enlace', protocol: 'ARQ We > 1',
  description: 'El emisor puede tener hasta We tramas en vuelo sin esperar ACKs. Si una se pierde, retransmite esa y TODAS las siguientes (el receptor descarta las fuera de orden).',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Wr = 1</span> El receptor solo acepta la siguiente esperada. Si llega una fuera de orden la descarta y reenvía el ACK de la última recibida en orden.</p>
    <p><span class="explain-tag">Retransmisión</span> Ante pérdida, el emisor "vuelve N tramas atrás" y retransmite desde el punto de fallo — de ahí el nombre.</p>
  </div>`,
  useCases: 'HDLC, versiones simples de SDLC',

  generateSteps() {
    const We = 4;
    const total = 10;
    const lostFrame = 3; // trama 3 se pierde
    const steps = [];

    // Estado inicial
    let base = 0; // primera trama no ACKeada
    let nextSeq = 0;
    let acked = new Set();
    let sent = new Set();
    let lostShown = false;

    steps.push({ base, nextSeq, acked:new Set(acked), sent:new Set(sent), total, We, phase:'start', desc:
      `Ventana de tamaño We=${We}. El emisor puede enviar hasta ${We} tramas antes de esperar ACKs. Las tramas ${base}..${base+We-1} están en la ventana inicial.` });

    // Enviar las 4 tramas de la ventana
    for (let i = 0; i < We; i++) {
      sent.add(nextSeq);
      const lost = nextSeq === lostFrame;
      steps.push({ base, nextSeq, acked:new Set(acked), sent:new Set(sent), total, We, phase:'send', current:nextSeq, lost, desc:
        `Envía trama <code>${nextSeq}</code>${lost?` <span style="color:${RC.red};font-weight:700">— se pierde en el medio</span>`:''}. Ventana actual: [${base}, ${base+We-1}].` });
      nextSeq++;
    }

    // Llegan ACKs 0, 1, 2 (avanzando base). Trama 3 perdida, pero 4 llegó fuera de orden y receptor la descarta
    [0, 1, 2].forEach(k => {
      acked.add(k);
      base = k + 1;
      steps.push({ base, nextSeq, acked:new Set(acked), sent:new Set(sent), total, We, phase:'ack', current:k, desc:
        `Recibe <code>ACK(${k})</code>. La base avanza a ${base}. La ventana desliza y se pueden enviar nuevas tramas hasta la ${base+We-1}.` });
    });

    // Timeout de la trama 3
    steps.push({ base, nextSeq, acked:new Set(acked), sent:new Set(sent), total, We, phase:'timeout', current:lostFrame, desc:
      `El temporizador de la trama <code>${lostFrame}</code> <strong>expira</strong> sin ACK. En Go-Back-N el emisor <strong>retransmite la trama ${lostFrame} y TODAS las posteriores</strong> que ya estaban en vuelo.` });

    // Retransmisión desde base
    nextSeq = base; // rebobinamos
    sent = new Set([...acked]); // eliminamos las no-ACKeadas de "sent"
    for (let i = 0; i < We && base + i < total; i++) {
      const s = base + i;
      sent.add(s);
      steps.push({ base, nextSeq: s+1, acked:new Set(acked), sent:new Set(sent), total, We, phase:'retx', current:s, desc:
        `Retransmite trama <code>${s}</code> (Go-Back-N reenvía desde la perdida en adelante).` });
    }
    nextSeq = base + We;

    // Llegan ACKs 3, 4, 5
    [3, 4, 5, 6].forEach(k => {
      if (k >= total) return;
      acked.add(k);
      base = k + 1;
      // pushear siguiente
      if (nextSeq < total) {
        sent.add(nextSeq);
        nextSeq++;
      }
      steps.push({ base, nextSeq, acked:new Set(acked), sent:new Set(sent), total, We, phase:'ack', current:k, desc:
        `Recibe <code>ACK(${k})</code>. Ventana desliza a [${base}, ${Math.min(base+We-1, total-1)}]. Se envía la siguiente trama si queda.` });
    });

    return steps;
  },

  render(container, step) {
    const { base, acked, sent, lost, current, total, We, phase } = step;
    const cells = [];
    for (let i = 0; i < total; i++) {
      const inWindow = i >= base && i < base + We;
      let cls = 'win-cell';
      if (acked.has(i)) cls += ' acked';
      else if (sent.has(i) && !acked.has(i)) cls += ' sent';
      else if (inWindow) cls += ' in-window';
      if (phase === 'send' && current === i && lost) cls += ' lost';
      if (current === i && phase === 'timeout') cls += ' lost';
      cells.push(`<div class="${cls}">${i}</div>`);
    }
    // Indicador de ventana (llave superior)
    const cellW = 44; // 40 + 4 gap
    const winStart = base * cellW;
    const winWidth = We * cellW - 4;

    container.innerHTML = `
      <div class="window-wrap">
        <div style="font-size:.74rem;color:${RC.muted};font-weight:800;text-transform:uppercase;letter-spacing:.05em;text-align:center">
          Base = ${base} · SigSeq = ${step.nextSeq} · We = ${We}
        </div>
        <div style="position:relative;padding-top:22px">
          <div style="position:absolute;top:0;left:${winStart}px;width:${winWidth}px;border:2px solid ${RC.cyan};border-radius:5px;height:64px;pointer-events:none;background:${RC.cyanD}0F"></div>
          <div style="position:absolute;top:2px;left:${winStart + winWidth/2 - 40}px;font-family:JetBrains Mono,monospace;font-size:.68rem;color:${RC.cyanD};font-weight:800;background:white;padding:0 4px">Ventana</div>
          <div class="window-row" style="margin-top:0">
            ${cells.join('')}
          </div>
        </div>
        ${legend([
          { c: RC.slateL, t: 'Fuera de ventana' },
          { c: '#dbeafe', t: 'En ventana' },
          { c: '#fef3c7', t: 'Enviada, sin ACK' },
          { c: '#d1fae5', t: 'ACK recibido' },
          { c: '#fee2e2', t: 'Perdida / timeout' },
        ])}
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  8. CRC — División polinómica                                    ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_CRC = {
  id: 'crc', name: 'CRC — División polinómica', shortName: 'CRC',
  layer: 'Enlace', protocol: 'CRC-3 (ejemplo)',
  description: 'El emisor calcula el resto de dividir D(x)·xʳ entre el polinomio generador G(x) usando XOR. Ese resto es el CRC que viaja como cola de la trama. El receptor divide toda la trama por G(x): si el resto es 0, no hay error.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Ejemplo</span> D = 1010001101, G = 1101 (grado 3 → 3 bits de CRC). Añadimos 3 ceros a D y hacemos la división módulo 2 paso a paso.</p>
    <p><span class="explain-tag">Módulo 2</span> La resta módulo 2 es XOR (⊕): 1⊕1=0, 1⊕0=1, 0⊕0=0. Nunca se producen "acarreos".</p>
  </div>`,
  useCases: 'Ethernet (CRC-32), USB, HDLC, ZIP',

  generateSteps() {
    const D = '1010001101';
    const G = '1101';
    const r = G.length - 1;
    const dividend = D + '0'.repeat(r);
    const steps = [];

    // Simular la división XOR
    let cur = dividend.split('').map(Number);
    let quotient = '';
    const snapshots = [];
    snapshots.push({ cur: [...cur], quotient, pos:-1, xored:null, desc:
      `Preparamos el <strong>dividendo</strong>: D=${D} desplazado ${r} bits a la izquierda → <code>${dividend}</code> (añadimos ${r} ceros).` });

    for (let pos = 0; pos <= dividend.length - G.length; pos++) {
      if (cur[pos] === 1) {
        // XOR con G
        const xored = [];
        for (let j = 0; j < G.length; j++) {
          xored[pos + j] = cur[pos + j] ^ Number(G[j]);
        }
        // Aplicar
        for (let j = 0; j < G.length; j++) cur[pos + j] = xored[pos + j];
        quotient += '1';
        snapshots.push({ cur: [...cur], quotient, pos, xored:[...G].map(Number), didXor:true, desc:
          `Posición ${pos}: el bit es <code>1</code>, así que <strong>XOR con G=${G}</strong>. Nuevo cociente parcial: <code>${quotient}</code>.` });
      } else {
        quotient += '0';
        snapshots.push({ cur: [...cur], quotient, pos, xored:null, didXor:false, desc:
          `Posición ${pos}: el bit es <code>0</code>, no se opera. Se baja el siguiente bit. Cociente parcial: <code>${quotient}</code>.` });
      }
    }
    const rem = cur.slice(-r).join('');
    snapshots.push({ cur:[...cur], quotient, pos:dividend.length, xored:null, done:true, remainder:rem, desc:
      `Los últimos ${r} bits son el <strong>resto</strong> = <code>${rem}</code>. Éste es el <strong>CRC</strong> que se transmite tras D. La trama enviada es <code>${D + rem}</code>.` });

    return snapshots;
  },

  render(container, step) {
    const D = '1010001101';
    const G = '1101';
    const r = G.length - 1;
    const total = D.length + r;

    const cells = step.cur.map((b, i) => {
      let cls = 'crc-cell';
      const inG = step.pos !== undefined && step.pos >= 0 && step.didXor && i >= step.pos && i < step.pos + G.length;
      if (inG) cls += ' act';
      if (step.done && i >= total - r) cls += ' g';
      return `<div class="${cls}">${b}</div>`;
    });

    const gRow = () => {
      if (step.pos === undefined || step.pos < 0 || !step.didXor) return '';
      const spacer = Array(step.pos).fill('<div class="crc-cell g0"></div>').join('');
      const gCells = G.split('').map(b => `<div class="crc-cell g">${b}</div>`).join('');
      const trailing = Array(total - step.pos - G.length).fill('<div class="crc-cell g0"></div>').join('');
      return `
        <div class="crc-line">
          <div class="crc-label">XOR con G</div>
          ${spacer}<div class="crc-op">⊕</div>${gCells}${trailing}
        </div>`;
    };

    container.innerHTML = `
      <div class="crc-wrap">
        <div style="font-size:.75rem;color:${RC.muted};margin-bottom:6px">
          D=<code>${D}</code> · G=<code>${G}</code> · Cociente: <code>${step.quotient || '—'}</code>
          ${step.done ? ` · <strong style="color:${RC.greenD}">CRC = ${step.remainder}</strong>` : ''}
        </div>
        <div class="crc-line">
          <div class="crc-label">Dividendo</div>
          ${cells.join('')}
        </div>
        ${gRow()}
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  9. SUBNETTING — Máscara de red aplicada bit a bit                ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_SUBNETTING = {
  id: 'subnetting', name: 'Direccionamiento IPv4 y máscara de subred', shortName: 'Subnetting',
  layer: 'Red', protocol: 'IPv4 / CIDR',
  description: 'Una IP de 32 bits se divide en identificador de red e identificador de host aplicando la máscara. Con /24, los primeros 24 bits son de red y los últimos 8 de host.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">AND</span> Para obtener la dirección de red se hace <strong>IP AND máscara</strong>. Para la dirección de broadcast, se ponen a 1 todos los bits de host.</p>
  </div>`,
  useCases: 'Diseño de LANs, VLSM, CIDR',

  generateSteps() {
    const ipStr = '192.168.100.150';
    const maskBits = 26; // /26
    const steps = [];
    steps.push({ phase:'ip',    hi:-1, showNet:false, showBc:false, desc:
      `Partimos de la dirección <code>${ipStr}/${maskBits}</code>. Vamos a extraer red, rango de hosts y broadcast bit a bit.` });
    steps.push({ phase:'bits',  hi:-1, showNet:false, showBc:false, desc:
      `La convertimos a binario. Los 32 bits se agrupan en 4 octetos separados por puntos.` });
    steps.push({ phase:'mask',  hi:-1, showNet:false, showBc:false, desc:
      `La máscara /${maskBits} tiene los primeros <strong>${maskBits} bits a 1</strong> (parte de red) y los últimos <strong>${32-maskBits} bits a 0</strong> (parte de host).` });
    steps.push({ phase:'and',   hi:maskBits, showNet:true, showBc:false, desc:
      `Aplicamos <strong>IP AND máscara</strong>: los bits de host se ponen a 0. El resultado es la <strong>dirección de red</strong>.` });
    steps.push({ phase:'bc',    hi:maskBits, showNet:true, showBc:true,  desc:
      `Para la <strong>dirección de broadcast</strong> ponemos todos los bits de host a 1.` });
    steps.push({ phase:'range', hi:maskBits, showNet:true, showBc:true, desc:
      `El <strong>rango útil</strong> son las direcciones entre red+1 y broadcast-1. Con /${maskBits} hay 2<sup>${32-maskBits}</sup> - 2 = <code>${(1<<(32-maskBits))-2}</code> hosts posibles.` });
    return steps;
  },

  render(container, step) {
    const ipStr = '192.168.100.150';
    const maskBits = 26;
    const octets = ipStr.split('.').map(Number);
    const bits = octets.map(o => o.toString(2).padStart(8, '0')).join('');
    const maskArr = bits.split('').map((_, i) => i < maskBits ? '1' : '0');
    const netArr = bits.split('').map((b, i) => i < maskBits ? b : '0');
    const bcArr  = bits.split('').map((b, i) => i < maskBits ? b : '1');

    const bitsToIP = (bs) => {
      const s = bs.join ? bs.join('') : bs;
      const nums = [];
      for (let i = 0; i < 32; i += 8) nums.push(parseInt(s.substr(i, 8), 2));
      return nums.join('.');
    };

    const drawRow = (label, arr, opts = {}) => {
      const cells = arr.map((b, i) => {
        let cls = 'bit-cell';
        if (opts.role === 'ip')   cls += i < maskBits ? ' net' : ' host';
        if (opts.role === 'mask') cls += b === '1' ? ' mask-net' : ' mask-host';
        if (opts.role === 'res')  cls += i < maskBits ? ' net' : ' host';
        if (step.hi >= 0 && i === step.hi - 1) cls += ' hi';
        return { cls, b };
      });
      let idx = 0;
      const octRows = [];
      for (let o = 0; o < 4; o++) {
        const oct = cells.slice(o*8, (o+1)*8).map(c => `<div class="${c.cls}">${c.b}</div>`).join('');
        octRows.push(`<div class="bit-oct">${oct}</div>`);
      }
      const ipRepr = opts.role === 'mask'
        ? `/${maskBits} (${bitsToIP(arr)})`
        : bitsToIP(arr);
      return `
        <div class="subnet-line">
          <span class="lbl">${label}</span>
          <div class="bit-row" style="justify-content:flex-start">${octRows.join('')}</div>
          <span style="color:${RC.txt};font-weight:700;margin-left:8px;font-family:JetBrains Mono,monospace">${ipRepr}</span>
        </div>`;
    };

    const rows = [drawRow('IP', bits.split(''), { role:'ip' })];
    if (step.phase !== 'ip') rows.push(drawRow('Máscara /' + maskBits, maskArr, { role:'mask' }));
    if (step.showNet) rows.push(drawRow('Red (AND)', netArr, { role:'res' }));
    if (step.showBc)  rows.push(drawRow('Broadcast', bcArr,  { role:'res' }));

    let rangeBox = '';
    if (step.phase === 'range') {
      const net = bitsToIP(netArr);
      const bc = bitsToIP(bcArr);
      const netParts = net.split('.').map(Number);
      const bcParts = bc.split('.').map(Number);
      const firstHost = [...netParts]; firstHost[3]++;
      const lastHost = [...bcParts]; lastHost[3]--;
      rangeBox = `
        <div style="margin-top:14px;padding:12px 16px;background:${RC.cyanD}12;border-radius:8px;font-family:JetBrains Mono,monospace;font-size:.82rem;line-height:1.7">
          <div><strong>Red:</strong> ${net}</div>
          <div><strong>1er host:</strong> ${firstHost.join('.')}</div>
          <div><strong>Último host:</strong> ${lastHost.join('.')}</div>
          <div><strong>Broadcast:</strong> ${bc}</div>
          <div style="margin-top:6px;color:${RC.muted}">Hosts útiles: 2<sup>${32-maskBits}</sup> - 2 = <strong style="color:${RC.txt}">${(1<<(32-maskBits))-2}</strong></div>
        </div>`;
    }

    container.innerHTML = `
      <div class="subnet-wrap">
        <div style="display:flex;flex-direction:column;gap:6px;width:100%;max-width:820px;overflow-x:auto">
          ${rows.join('')}
        </div>
        ${rangeBox}
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 10. ARP — Address Resolution Protocol                             ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_ARP = {
  id: 'arp', name: 'ARP — Resolución IP → MAC', shortName: 'ARP',
  layer: 'Red/Enlace', protocol: 'ARP (RFC 826)',
  description: 'PC1 quiere enviar un paquete a PC2 en la misma LAN. Conoce su IP pero necesita su MAC para construir la trama Ethernet. ARP resuelve la asociación IP → MAC.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Broadcast</span> El <em>Request</em> se envía a la MAC de difusión <code>FF:FF:FF:FF:FF:FF</code> — todas las estaciones lo reciben, pero solo la que tiene la IP consultada responde.</p>
    <p><span class="explain-tag">Caché</span> El resultado se guarda en la tabla ARP local con un temporizador (típico: 20 minutos).</p>
  </div>`,
  useCases: 'Base del reenvío en cualquier LAN Ethernet',

  generateSteps() {
    return [
      { phase:'start', arpCache:{PC1:{}, PC3:{}, PC2:{}, PC4:{}}, active:['PC1'], pkt:null, desc:
        `PC1 (<code>10.0.0.1</code>) quiere enviar datos a PC2 (<code>10.0.0.2</code>). Consulta su tabla ARP y <strong>no tiene la MAC</strong> de PC2. Debe usar ARP.` },
      { phase:'request', arpCache:{PC1:{}, PC3:{}, PC2:{}, PC4:{}}, active:['PC1','PC2','PC3','PC4'], pkt:{ from:'PC1', to:'all', type:'arp', label:'ARP Request ¿MAC de 10.0.0.2?' }, desc:
        `PC1 envía un <strong>ARP Request</strong> a la MAC de <strong>broadcast</strong> <code>FF:FF:FF:FF:FF:FF</code>. Todos los equipos de la LAN lo reciben.` },
      { phase:'ignore', arpCache:{PC1:{}, PC3:{}, PC2:{}, PC4:{}}, active:['PC2'], pkt:{ from:'PC1', to:'all', type:'arp', label:'ARP Request' }, desc:
        `PC3 y PC4 comparan la IP consultada con la suya y <strong>descartan</strong> el paquete. Solo <strong>PC2</strong> se reconoce como destinatario.` },
      { phase:'reply', arpCache:{PC1:{}, PC2:{ '10.0.0.1':'AA:BB:CC:00:00:01' }, PC3:{}, PC4:{}}, active:['PC1','PC2'], pkt:{ from:'PC2', to:'PC1', type:'arp', label:'ARP Reply MAC=..02' }, desc:
        `PC2 envía un <strong>ARP Reply</strong> unicast a PC1 con su MAC <code>AA:BB:CC:00:00:02</code>. De paso, PC2 guarda la MAC de PC1 en su caché.` },
      { phase:'cache', arpCache:{PC1:{ '10.0.0.2':'AA:BB:CC:00:00:02' }, PC2:{ '10.0.0.1':'AA:BB:CC:00:00:01' }, PC3:{}, PC4:{}}, active:['PC1'], pkt:null, desc:
        `PC1 <strong>almacena la MAC en su tabla ARP</strong> con un temporizador. Ya puede construir la trama Ethernet con MAC destino ..:02.` },
      { phase:'data', arpCache:{PC1:{ '10.0.0.2':'AA:BB:CC:00:00:02' }, PC2:{ '10.0.0.1':'AA:BB:CC:00:00:01' }, PC3:{}, PC4:{}}, active:['PC1','PC2'], pkt:{ from:'PC1', to:'PC2', type:'data', label:'IP datos → 10.0.0.2' }, desc:
        `Ahora PC1 envía el paquete IP encapsulado en trama Ethernet <strong>directamente a PC2</strong>. Próximas comunicaciones no necesitarán ARP mientras la caché no expire.` },
    ];
  },

  render(container, step) {
    const W = 620, H = 260;
    // Switch central con 4 PCs alrededor
    const switchPos = { x: W/2, y: 140 };
    const PCs = {
      PC1: { x: 80,  y: 60,  ip:'10.0.0.1', mac:'..:01' },
      PC2: { x: W-80, y: 60,  ip:'10.0.0.2', mac:'..:02' },
      PC3: { x: 80,  y: 220, ip:'10.0.0.3', mac:'..:03' },
      PC4: { x: W-80, y: 220, ip:'10.0.0.4', mac:'..:04' },
    };
    const isActive = (id) => step.active && step.active.includes(id);

    const wires = Object.entries(PCs).map(([id, p]) => {
      const active = isActive(id);
      return `<line x1="${p.x}" y1="${p.y}" x2="${switchPos.x}" y2="${switchPos.y}" stroke="${active?RC.cyan:'#cbd5e1'}" stroke-width="${active?3:2}"/>`;
    }).join('');

    const nodes = Object.entries(PCs).map(([id, p]) => `
      <g class="node-host ${isActive(id)?'active':''}">
        <circle cx="${p.x}" cy="${p.y}" r="22" fill="${isActive(id)?'#eff6ff':'white'}" stroke="${RC.blue}" stroke-width="2.5"/>
        <text x="${p.x}" y="${p.y+4}" style="font-family:JetBrains Mono,monospace;font-weight:800;font-size:12px;fill:${RC.txt};text-anchor:middle">${id}</text>
        <text x="${p.x}" y="${p.y+34}" style="font-family:JetBrains Mono,monospace;font-size:10px;fill:${RC.muted};text-anchor:middle;font-weight:600">${p.ip}</text>
        <text x="${p.x}" y="${p.y+46}" style="font-family:JetBrains Mono,monospace;font-size:9px;fill:${RC.muted};text-anchor:middle">${p.mac}</text>
      </g>
    `).join('');

    // Switch central
    const swx = switchPos.x - 32, swy = switchPos.y - 14;
    const swEl = `<g class="node-switch active"><rect x="${swx}" y="${swy}" width="64" height="28" rx="4" fill="#ecfdf5" stroke="${RC.green}" stroke-width="2.5"/><text x="${switchPos.x}" y="${switchPos.y+4}" style="font-family:JetBrains Mono,monospace;font-weight:800;font-size:11px;fill:${RC.txt};text-anchor:middle">Switch</text></g>`;

    // Paquete
    let pkt = '';
    if (step.pkt) {
      const from = step.pkt.from;
      const to = step.pkt.to;
      let midX = switchPos.x, midY = switchPos.y - 30;
      if (to === 'all') {
        midX = switchPos.x;
        midY = switchPos.y - 40;
      } else if (PCs[to]) {
        midX = (PCs[from].x + PCs[to].x) / 2;
        midY = switchPos.y - 30;
      }
      const cls = step.pkt.type === 'arp' ? 'arp' : (step.pkt.type === 'data' ? 'tcp' : 'tcp');
      const color = step.pkt.type === 'arp' ? RC.purple : RC.blue;
      pkt = `<g><rect x="${midX-60}" y="${midY-10}" width="120" height="22" rx="4" fill="${color}" stroke="${RC.txt}" stroke-width="1"/><text x="${midX}" y="${midY+4}" style="font-family:JetBrains Mono,monospace;font-size:10px;font-weight:700;fill:white;text-anchor:middle">${step.pkt.label}</text></g>`;
    }

    // Tablas ARP
    const cacheTable = (host) => {
      const c = step.arpCache[host] || {};
      const rows = Object.entries(c);
      if (rows.length === 0) return `<div style="font-size:.68rem;color:${RC.muted};font-style:italic;padding:3px 6px">— caché vacía —</div>`;
      return `<table class="rc-tbl" style="font-size:.72rem">
        <tr><th>IP</th><th>MAC</th></tr>
        ${rows.map(([ip, mac]) => `<tr><td>${ip}</td><td class="new">${mac}</td></tr>`).join('')}
      </table>`;
    };

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
        <svg class="topo-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:640px">
          ${wires}
          ${swEl}
          ${nodes}
          ${pkt}
        </svg>
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
          <div style="text-align:center">
            <div style="font-size:.68rem;font-weight:800;color:${RC.muted};text-transform:uppercase;margin-bottom:4px">Caché ARP de PC1</div>
            ${cacheTable('PC1')}
          </div>
          <div style="text-align:center">
            <div style="font-size:.68rem;font-weight:800;color:${RC.muted};text-transform:uppercase;margin-bottom:4px">Caché ARP de PC2</div>
            ${cacheTable('PC2')}
          </div>
        </div>
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 11. DIJKSTRA — Encaminamiento por estado del enlace (OSPF)        ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_DIJKSTRA = {
  id: 'dijkstra', name: 'Dijkstra — Estado del enlace (OSPF)', shortName: 'Dijkstra / OSPF',
  layer: 'Red', protocol: 'OSPF (RFC 2328)',
  description: 'Cada router mantiene un grafo completo de la red y calcula la ruta más corta a los demás con el algoritmo de Dijkstra. Es la base de OSPF y de los protocolos de estado del enlace.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Convergencia</span> A diferencia de RIP (vector distancia), Dijkstra converge rápido y evita el problema del conteo al infinito.</p>
  </div>`,
  useCases: 'OSPF, IS-IS, redes MPLS-TE',

  generateSteps() {
    // Grafo: A(0,0) B(1,0) C(2,0) D(0,1) E(1,1) F(2,1)
    const nodes = ['A','B','C','D','E','F'];
    const edges = [
      ['A','B',4], ['A','D',2], ['B','C',3], ['B','E',5], ['C','F',2],
      ['D','E',1], ['E','F',3], ['B','D',1]
    ];
    const adj = {};
    nodes.forEach(n => adj[n] = []);
    edges.forEach(([a,b,w]) => { adj[a].push([b,w]); adj[b].push([a,w]); });

    const src = 'A';
    const dist = {};
    const prev = {};
    const visited = new Set();
    nodes.forEach(n => { dist[n] = Infinity; prev[n] = null; });
    dist[src] = 0;

    const steps = [{ nodes, edges, dist:{...dist}, visited:new Set(visited), current:null, checking:null, tree:new Set(), desc:
      `<strong>Dijkstra desde ${src}</strong>: inicializamos distancia 0 a ${src} e ∞ al resto. La tabla se irá rellenando con las distancias mínimas conocidas.` }];

    const tree = new Set();

    while (visited.size < nodes.length) {
      // Nodo no visitado con menor distancia
      let u = null;
      for (const n of nodes) {
        if (!visited.has(n) && (u === null || dist[n] < dist[u])) u = n;
      }
      if (u === null || dist[u] === Infinity) break;

      steps.push({ nodes, edges, dist:{...dist}, visited:new Set(visited), current:u, checking:null, tree:new Set(tree), desc:
        `Seleccionamos el nodo no visitado con <strong>menor distancia</strong>: <code>${u}</code> (d=${dist[u]}). Lo marcamos como definitivo.` });

      // Relajar vecinos
      for (const [v, w] of adj[u]) {
        if (visited.has(v)) continue;
        const alt = dist[u] + w;
        if (alt < dist[v]) {
          const old = dist[v];
          dist[v] = alt;
          prev[v] = u;
          steps.push({ nodes, edges, dist:{...dist}, visited:new Set(visited), current:u, checking:[u,v], updated:v, tree:new Set(tree), desc:
            `Relajando arista <code>${u}–${v}</code> (peso ${w}): d(${v}) = d(${u}) + ${w} = ${alt} ${old===Infinity?'(antes ∞)':`(mejor que ${old})`}. Actualizamos.` });
        } else {
          steps.push({ nodes, edges, dist:{...dist}, visited:new Set(visited), current:u, checking:[u,v], updated:null, tree:new Set(tree), desc:
            `Relajando arista <code>${u}–${v}</code>: ${dist[u]}+${w}=${alt} no mejora d(${v})=${dist[v]}. Sin cambios.` });
        }
      }
      visited.add(u);
      if (prev[u]) tree.add([prev[u], u].sort().join('-'));
    }

    steps.push({ nodes, edges, dist:{...dist}, visited:new Set(visited), current:null, checking:null, tree:new Set(tree), done:true, desc:
      `Dijkstra terminado. Distancias mínimas desde ${src}: ${nodes.map(n => `${n}=${dist[n]}`).join(', ')}. Las aristas verdes forman el <strong>árbol de caminos mínimos</strong>.` });

    return steps;
  },

  render(container, step) {
    // Layout hexagonal para 6 nodos
    const positions = {
      A: { x: 60,  y: 90 },
      B: { x: 240, y: 60 },
      C: { x: 420, y: 90 },
      D: { x: 60,  y: 260 },
      E: { x: 240, y: 290 },
      F: { x: 420, y: 260 },
    };
    const W = 480, H = 360;

    // Aristas
    const edgeEls = step.edges.map(([a,b,w]) => {
      const A = positions[a], B = positions[b];
      const key = [a,b].sort().join('-');
      const isTree = step.tree && step.tree.has(key);
      const isChecking = step.checking && ((step.checking[0]===a && step.checking[1]===b) || (step.checking[0]===b && step.checking[1]===a));
      const cls = isChecking ? 'dedge checking' : (isTree ? 'dedge tree' : 'dedge');
      const color = isChecking ? RC.amber : (isTree ? RC.green : '#cbd5e1');
      const midX = (A.x + B.x)/2, midY = (A.y + B.y)/2;
      return `
        <g>
          <line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${color}" stroke-width="${isTree||isChecking?3:2}"/>
          <rect x="${midX-11}" y="${midY-11}" width="22" height="22" rx="4" fill="white" stroke="${RC.slateL}"/>
          <text x="${midX}" y="${midY+4}" class="dedge-w">${w}</text>
        </g>`;
    }).join('');

    // Nodos
    const nodeEls = step.nodes.map(n => {
      const p = positions[n];
      const isCurrent = step.current === n;
      const isVisited = step.visited.has(n);
      const isUpdated = step.updated === n;
      const isSrc = n === 'A';
      let cls = 'dnode';
      if (isSrc) cls += ' src';
      if (isVisited) cls += ' visited';
      if (isCurrent && !isVisited) cls += ' current';
      if (isUpdated) cls += ' updated';
      let bg = 'white', st = RC.blue;
      if (isSrc) { bg = '#f5f3ff'; st = RC.purple; }
      if (isVisited) { bg = '#ecfdf5'; st = RC.green; }
      if (isCurrent && !isVisited) { bg = '#fffbeb'; st = RC.amber; }
      if (isUpdated) { bg = '#ecfeff'; st = RC.cyan; }

      return `<g class="${cls}">
        <circle cx="${p.x}" cy="${p.y}" r="22" fill="${bg}" stroke="${st}" stroke-width="2.5"/>
        <text x="${p.x}" y="${p.y+5}" style="font-family:JetBrains Mono,monospace;font-weight:800;font-size:15px;fill:${RC.txt};text-anchor:middle">${n}</text>
        <text x="${p.x}" y="${p.y-30}" style="font-family:JetBrains Mono,monospace;font-size:11px;fill:${st};font-weight:800;text-anchor:middle">d=${step.dist[n]===Infinity?'∞':step.dist[n]}</text>
      </g>`;
    }).join('');

    // Tabla lateral
    const rows = step.nodes.map(n => {
      let cls = 'dtable-row';
      if (step.visited.has(n)) cls += ' visited';
      if (step.current === n && !step.visited.has(n)) cls += ' current';
      if (step.updated === n) cls += ' updated';
      const d = step.dist[n] === Infinity ? '∞' : step.dist[n];
      return `<div class="${cls}"><div>${n}</div><div class="d-val">${d}</div><div style="font-size:.7rem;color:${RC.muted}">${step.visited.has(n)?'✓':(step.current===n?'▶':'')}</div></div>`;
    }).join('');

    container.innerHTML = `
      <div class="dijkstra-wrap">
        <svg class="dijkstra-graph" viewBox="0 0 ${W} ${H}" width="100%">
          ${edgeEls}
          ${nodeEls}
        </svg>
        <div class="dtable">
          <div class="dtable-row head"><div>Nodo</div><div>Dist</div><div>Est</div></div>
          ${rows}
        </div>
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 12. NAT / PAT — Traducción de direcciones                         ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_NAT = {
  id: 'nat', name: 'NAT / PAT — Traducción de direcciones', shortName: 'NAT / PAT',
  layer: 'Red', protocol: 'NAT · PAT (NAPT)',
  description: 'Un router NAT/PAT permite que varios equipos con IP privada compartan una única IP pública. PAT usa el puerto TCP/UDP para desmultiplexar las respuestas.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">PAT</span> Traduce (IP privada, puerto local) ↔ (IP pública, puerto asignado). Guarda la traducción en una <strong>tabla NAT</strong> durante la conexión.</p>
  </div>`,
  useCases: 'Redes domésticas (IPv4), CGNAT en ISPs',

  generateSteps() {
    const steps = [];
    let table = [];

    steps.push({ table:[], pkt:null, active:[], desc:
      `PC1 (<code>192.168.1.10</code>) y PC2 (<code>192.168.1.11</code>) comparten una única IP pública <code>200.1.1.1</code> en el router NAT/PAT.` });

    // PC1 abre conexión a servidor
    steps.push({ table:[], pkt:{ from:'PC1', dir:'out', side:'in', src:'192.168.1.10:5000', dst:'8.8.8.8:80' }, active:['PC1'], desc:
      `PC1 envía un segmento TCP al servidor <code>8.8.8.8:80</code>. En la cabecera IP el origen es <code>192.168.1.10:5000</code>.` });
    table = [{ localIP:'192.168.1.10', localPort:5000, globalIP:'200.1.1.1', globalPort:6001, remote:'8.8.8.8:80' }];
    steps.push({ table:[...table], pkt:{ from:'PC1', dir:'out', side:'out', src:'200.1.1.1:6001', dst:'8.8.8.8:80' }, active:['PC1','R'], desc:
      `El router NAT/PAT registra una nueva entrada: <code>192.168.1.10:5000 → 200.1.1.1:6001</code>. Reescribe la cabecera IP/TCP y reenvía al exterior.` });

    // Respuesta del servidor
    steps.push({ table:[...table], pkt:{ from:'srv', dir:'in', side:'out', src:'8.8.8.8:80', dst:'200.1.1.1:6001' }, active:['R'], desc:
      `El servidor responde a <code>200.1.1.1:6001</code>. El router busca en la tabla NAT por <em>puerto global</em>.` });
    steps.push({ table:[...table], pkt:{ from:'srv', dir:'in', side:'in', src:'8.8.8.8:80', dst:'192.168.1.10:5000' }, active:['PC1','R'], desc:
      `Encuentra la entrada, restaura destino a <code>192.168.1.10:5000</code> y reenvía a PC1. La conexión funciona.` });

    // PC2 usa mismo puerto local: colisión
    steps.push({ table:[...table], pkt:{ from:'PC2', dir:'out', side:'in', src:'192.168.1.11:5000', dst:'8.8.8.8:80' }, active:['PC2'], desc:
      `Ahora <strong>PC2 elige también el puerto 5000</strong> al conectar al mismo servidor. ¿Cómo distinguirá el router los dos flujos?` });
    table.push({ localIP:'192.168.1.11', localPort:5000, globalIP:'200.1.1.1', globalPort:6002, remote:'8.8.8.8:80' });
    steps.push({ table:[...table], pkt:{ from:'PC2', dir:'out', side:'out', src:'200.1.1.1:6002', dst:'8.8.8.8:80' }, active:['PC2','R'], desc:
      `El router asigna un <strong>puerto global distinto</strong>: <code>6002</code>. Esta es la magia de PAT: <em>colisión resuelta con puertos globales únicos</em>.` });
    steps.push({ table:[...table], pkt:{ from:'srv', dir:'in', side:'out', src:'8.8.8.8:80', dst:'200.1.1.1:6002' }, active:['R'], desc:
      `La respuesta al puerto 6002 se desmultiplexa correctamente hacia PC2 y no hacia PC1.` });

    return steps;
  },

  render(container, step) {
    const W = 640, H = 220;
    const PC1 = { x: 60, y: 60, label: 'PC1', ip:'192.168.1.10' };
    const PC2 = { x: 60, y: 160, label: 'PC2', ip:'192.168.1.11' };
    const R   = { x: 260, y: 110, label: 'Router NAT/PAT', ip:'200.1.1.1' };
    const SRV = { x: 500, y: 110, label: 'Servidor', ip:'8.8.8.8:80' };

    const isActive = (id) => step.active && step.active.includes(id);

    const drawNode = (n, id, isServer = false) => `
      <g class="${isServer ? 'node-host' : (id==='R' ? 'node-router' : 'node-host')} ${isActive(id)?'active':''}">
        ${id === 'R'
          ? `<circle cx="${n.x}" cy="${n.y}" r="26" fill="${isActive(id)?'#f5f3ff':'white'}" stroke="${RC.purple}" stroke-width="2.5"/>
             <text x="${n.x}" y="${n.y+4}" style="font-family:JetBrains Mono,monospace;font-weight:800;font-size:11px;fill:${RC.txt};text-anchor:middle">R</text>`
          : `<circle cx="${n.x}" cy="${n.y}" r="22" fill="${isActive(id)?'#eff6ff':'white'}" stroke="${RC.blue}" stroke-width="2.5"/>
             <text x="${n.x}" y="${n.y+4}" style="font-family:JetBrains Mono,monospace;font-weight:800;font-size:11px;fill:${RC.txt};text-anchor:middle">${n.label.replace('PC','')||'S'}</text>`
        }
        <text x="${n.x}" y="${n.y+40}" style="font-family:JetBrains Mono,monospace;font-size:10px;fill:${RC.muted};text-anchor:middle;font-weight:600">${n.ip}</text>
        <text x="${n.x}" y="${n.y-32}" style="font-family:Inter,sans-serif;font-size:10px;fill:${RC.slateD};text-anchor:middle;font-weight:700">${n.label}</text>
      </g>`;

    // Enlaces
    const linkStyle = (from, to) => {
      const a = isActive(from), b = isActive(to);
      return a && b ? { color: RC.cyan, width: 3 } : { color: '#cbd5e1', width: 2 };
    };
    const l1 = linkStyle('PC1','R'), l2 = linkStyle('PC2','R'), l3 = linkStyle('R','srv');
    const links = `
      <line x1="${PC1.x}" y1="${PC1.y}" x2="${R.x}" y2="${R.y}" stroke="${l1.color}" stroke-width="${l1.width}"/>
      <line x1="${PC2.x}" y1="${PC2.y}" x2="${R.x}" y2="${R.y}" stroke="${l2.color}" stroke-width="${l2.width}"/>
      <line x1="${R.x}" y1="${R.y}" x2="${SRV.x}" y2="${SRV.y}" stroke="${l3.color}" stroke-width="${l3.width}"/>`;

    // Etiqueta LAN/WAN
    const rectLAN = `<rect x="30" y="20" width="230" height="180" rx="8" fill="none" stroke="#cbd5e1" stroke-dasharray="4,4"/><text x="45" y="38" style="font-family:Inter,sans-serif;font-size:10px;font-weight:800;fill:${RC.muted};text-transform:uppercase;letter-spacing:.06em">LAN privada</text>`;
    const rectWAN = `<rect x="285" y="20" width="330" height="180" rx="8" fill="none" stroke="#cbd5e1" stroke-dasharray="4,4"/><text x="300" y="38" style="font-family:Inter,sans-serif;font-size:10px;font-weight:800;fill:${RC.muted};text-transform:uppercase;letter-spacing:.06em">Internet</text>`;

    // Paquete: mostrar en el lado apropiado del router
    let pktEl = '';
    if (step.pkt) {
      const p = step.pkt;
      const y = 105;
      const x = p.side === 'in' ? (p.dir === 'out' ? 155 : 155) : (p.dir === 'out' ? 380 : 380);
      const color = p.dir === 'out' ? RC.blue : RC.green;
      pktEl = `<g><rect x="${x-90}" y="${y-14}" width="180" height="28" rx="4" fill="${color}" stroke="${RC.txt}" stroke-width="1"/>
        <text x="${x}" y="${y-1}" style="font-family:JetBrains Mono,monospace;font-size:9.5px;font-weight:700;fill:white;text-anchor:middle">${p.src} → ${p.dst}</text>
        <text x="${x}" y="${y+10}" style="font-family:Inter,sans-serif;font-size:9px;fill:white;text-anchor:middle;font-weight:600">${p.dir==='out'?'saliente':'entrante'}</text>
      </g>`;
    }

    // Tabla NAT
    const rows = step.table.length === 0
      ? `<tr><td colspan="4" style="font-style:italic;color:${RC.muted}">— tabla vacía —</td></tr>`
      : step.table.map((r, i) => `<tr>
          <td>${r.localIP}:${r.localPort}</td>
          <td>${r.globalIP}:<strong style="color:${RC.cyanD}">${r.globalPort}</strong></td>
          <td>${r.remote}</td>
          <td>${i === step.table.length - 1 ? '<span style="color:'+RC.green+'">✓ nueva</span>' : '—'}</td>
        </tr>`).join('');

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
        <svg class="topo-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:680px">
          ${rectLAN}${rectWAN}
          ${links}
          ${drawNode(PC1, 'PC1')}
          ${drawNode(PC2, 'PC2')}
          ${drawNode(R, 'R')}
          ${drawNode(SRV, 'srv', true)}
          ${pktEl}
        </svg>
        <div style="text-align:center">
          <div style="font-size:.68rem;font-weight:800;color:${RC.muted};text-transform:uppercase;margin-bottom:4px">Tabla de traducción NAT/PAT</div>
          <table class="rc-tbl">
            <tr><th>Local (privado)</th><th>Global (público)</th><th>Remoto</th><th>Estado</th></tr>
            ${rows}
          </table>
        </div>
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 13. TCP 3-way HANDSHAKE + cierre 4-way                            ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_TCP_HANDSHAKE = {
  id: 'tcp-handshake', name: 'TCP — Establecimiento y liberación', shortName: 'TCP Handshake',
  layer: 'Transporte', protocol: 'TCP (RFC 793)',
  description: 'TCP abre una conexión con un three-way handshake (SYN, SYN+ACK, ACK), transmite datos con números de secuencia y ACKs, y la cierra con un four-way handshake (FIN, ACK, FIN, ACK).',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">SYN</span> El SYN inicial acuerda el número de secuencia (ISN) de cada extremo.</p>
    <p><span class="explain-tag">TIME_WAIT</span> Tras el cierre, el cliente permanece 2·MSL en TIME_WAIT para que ACKs perdidos no confundan una nueva conexión con la misma tupla.</p>
  </div>`,
  useCases: 'HTTP/HTTPS, SSH, correo, prácticamente todo TCP',

  generateSteps() {
    return [
      { events:[], state:{c:'CLOSED', s:'LISTEN'}, desc:
        `Estado inicial: el servidor está en <code>LISTEN</code> escuchando en el puerto 80. El cliente está <code>CLOSED</code>.` },
      { events:[{ type:'arrow', from:'C', to:'S', label:'SYN, seq=x', color:RC.blue }], state:{c:'SYN_SENT', s:'LISTEN'}, desc:
        `<strong>Paso 1 del handshake:</strong> el cliente envía <code>SYN, seq=x</code>. Pasa al estado <code>SYN_SENT</code>.` },
      { events:[
          { type:'arrow', from:'C', to:'S', label:'SYN, seq=x', color:RC.blue },
          { type:'arrow', from:'S', to:'C', label:'SYN+ACK, seq=y, ack=x+1', color:RC.blue },
        ], state:{c:'SYN_SENT', s:'SYN_RCVD'}, desc:
        `<strong>Paso 2:</strong> el servidor responde <code>SYN+ACK, seq=y, ack=x+1</code>. Pasa a <code>SYN_RCVD</code>.` },
      { events:[
          { type:'arrow', from:'C', to:'S', label:'SYN, seq=x', color:RC.blue },
          { type:'arrow', from:'S', to:'C', label:'SYN+ACK, seq=y, ack=x+1', color:RC.blue },
          { type:'arrow', from:'C', to:'S', label:'ACK, ack=y+1', color:RC.green },
        ], state:{c:'ESTABLISHED', s:'ESTABLISHED'}, desc:
        `<strong>Paso 3:</strong> el cliente confirma con <code>ACK, ack=y+1</code>. Ambos pasan a <code>ESTABLISHED</code>. Conexión abierta.` },
      { events:[
          { type:'arrow', from:'C', to:'S', label:'DATA (100 B), seq=x+1', color:RC.amber },
          { type:'arrow', from:'S', to:'C', label:'ACK, ack=x+101', color:RC.green },
        ], state:{c:'ESTABLISHED', s:'ESTABLISHED'}, desc:
        `Fase de <strong>transferencia de datos</strong>: el cliente envía 100 bytes; el servidor confirma con el ACK del último byte recibido +1.` },
      { events:[
          { type:'arrow', from:'C', to:'S', label:'FIN, seq=x+101', color:RC.red },
        ], state:{c:'FIN_WAIT_1', s:'ESTABLISHED'}, desc:
        `<strong>Cierre — paso 1:</strong> el cliente cierra su dirección con <code>FIN</code>. Pasa a <code>FIN_WAIT_1</code>.` },
      { events:[
          { type:'arrow', from:'C', to:'S', label:'FIN, seq=x+101', color:RC.red },
          { type:'arrow', from:'S', to:'C', label:'ACK, ack=x+102', color:RC.green },
        ], state:{c:'FIN_WAIT_2', s:'CLOSE_WAIT'}, desc:
        `<strong>Paso 2:</strong> el servidor reconoce con ACK. Cliente pasa a <code>FIN_WAIT_2</code>. El servidor entra en <code>CLOSE_WAIT</code> mientras cierra su lado.` },
      { events:[
          { type:'arrow', from:'C', to:'S', label:'FIN, seq=x+101', color:RC.red },
          { type:'arrow', from:'S', to:'C', label:'ACK, ack=x+102', color:RC.green },
          { type:'arrow', from:'S', to:'C', label:'FIN, seq=y+101', color:RC.red },
        ], state:{c:'FIN_WAIT_2', s:'LAST_ACK'}, desc:
        `<strong>Paso 3:</strong> el servidor cierra su lado con <code>FIN</code>. Pasa a <code>LAST_ACK</code>.` },
      { events:[
          { type:'arrow', from:'C', to:'S', label:'FIN, seq=x+101', color:RC.red },
          { type:'arrow', from:'S', to:'C', label:'ACK, ack=x+102', color:RC.green },
          { type:'arrow', from:'S', to:'C', label:'FIN, seq=y+101', color:RC.red },
          { type:'arrow', from:'C', to:'S', label:'ACK, ack=y+102', color:RC.green },
        ], state:{c:'TIME_WAIT', s:'CLOSED'}, desc:
        `<strong>Paso 4:</strong> el cliente responde con ACK final. El servidor pasa a <code>CLOSED</code>. El cliente entra en <code>TIME_WAIT</code> (2·MSL) antes de cerrar.` },
    ];
  },

  render(container, step) {
    const W = 560, H = 340;
    const laneC = 100, laneS = W - 100;
    const yStart = 60;
    const yStep = 34;

    const arrows = step.events.map((e, i) => {
      const y = yStart + i * yStep;
      const isFromC = e.from === 'C';
      const x1 = isFromC ? laneC : laneS;
      const x2 = isFromC ? laneS : laneC;
      const marker = e.color === RC.blue ? 'arrow-blue-tcp' : (e.color === RC.green ? 'arrow-green-tcp' : (e.color === RC.red ? 'arrow-red-tcp' : 'arrow-amber-tcp'));
      const isCurrent = i === step.events.length - 1;
      return `
        <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y+18}" stroke="${e.color}" stroke-width="${isCurrent?3:2}" opacity="${isCurrent?1:0.75}" marker-end="url(#${marker})"/>
        <text x="${W/2}" y="${y+2}" style="font-family:JetBrains Mono,monospace;font-size:10.5px;font-weight:700;fill:${RC.txt};text-anchor:middle">${e.label}</text>`;
    }).join('');

    const totalH = Math.max(H, yStart + step.events.length * yStep + 30);

    container.innerHTML = `
      <div class="timeline-wrap">
        <svg class="timeline-svg" viewBox="0 0 ${W} ${totalH}" width="100%" style="max-width:600px">
          <defs>
            ${arrowMarker('arrow-blue-tcp', RC.blue)}
            ${arrowMarker('arrow-green-tcp', RC.green)}
            ${arrowMarker('arrow-red-tcp', RC.red)}
            ${arrowMarker('arrow-amber-tcp', RC.amber)}
          </defs>
          <text x="${laneC}" y="24" class="tl-header">Cliente</text>
          <text x="${laneS}" y="24" class="tl-header">Servidor</text>
          <rect x="${laneC-38}" y="30" width="76" height="20" rx="4" fill="${RC.blueLight||'#eff6ff'}" stroke="${RC.blue}" opacity="0.9"/>
          <text x="${laneC}" y="44" style="font-family:JetBrains Mono,monospace;font-size:10px;font-weight:800;fill:${RC.blueD};text-anchor:middle">${step.state.c}</text>
          <rect x="${laneS-38}" y="30" width="76" height="20" rx="4" fill="#ecfdf5" stroke="${RC.green}" opacity="0.9"/>
          <text x="${laneS}" y="44" style="font-family:JetBrains Mono,monospace;font-size:10px;font-weight:800;fill:${RC.greenD};text-anchor:middle">${step.state.s}</text>
          <line x1="${laneC}" y1="55" x2="${laneC}" y2="${totalH-10}" class="tl-lane"/>
          <line x1="${laneS}" y1="55" x2="${laneS}" y2="${totalH-10}" class="tl-lane"/>
          ${arrows}
        </svg>
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 14. SLOW START — Control de congestión de TCP                     ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_SLOW_START = {
  id: 'slow-start', name: 'Slow Start y Congestion Avoidance', shortName: 'Slow Start',
  layer: 'Transporte', protocol: 'TCP Reno / Tahoe',
  description: 'TCP arranca con una ventana de congestión pequeña que crece exponencialmente hasta el umbral (ssthresh), luego linealmente. Al detectar pérdida, ssthresh se reduce a la mitad y la ventana vuelve a 1 (o a ssthresh, según variante).',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Slow Start</span> Cwnd += MSS por cada ACK → crecimiento exponencial (cwnd se duplica cada RTT).</p>
    <p><span class="explain-tag">Congestion Avoidance</span> Al llegar a ssthresh, cwnd += MSS²/cwnd por ACK → crecimiento lineal.</p>
    <p><span class="explain-tag">Timeout</span> Reduce ssthresh a cwnd/2 y vuelve a cwnd=1 MSS. Karn duplica el temporizador (β=2).</p>
  </div>`,
  useCases: 'Núcleo del comportamiento de TCP en Internet',

  generateSteps() {
    const steps = [];
    let cwnd = 1;
    let ssthresh = 16;
    const history = [{ t:0, cwnd:1, phase:'ss' }];

    // Slow start hasta ssthresh
    for (let t = 1; t <= 4; t++) {
      cwnd *= 2;
      history.push({ t, cwnd, phase:'ss' });
    }
    // t=5: crecemos a 32 pero limitados a ssthresh
    // Congestion avoidance (crecimiento lineal)
    for (let t = 5; t <= 10; t++) {
      cwnd += 1;
      history.push({ t, cwnd, phase:'ca' });
    }
    // t=11: timeout, reset
    history.push({ t:11, cwnd:1, phase:'to', event:'timeout' });
    ssthresh = 11; // ssthresh baja a cwnd/2
    // Slow start otra vez hasta nuevo ssthresh
    cwnd = 1;
    for (let t = 12; t <= 15; t++) {
      cwnd *= 2;
      history.push({ t, cwnd, phase:'ss', ssthresh });
    }
    history.push({ t:16, cwnd:cwnd+1, phase:'ca', ssthresh });
    history.push({ t:17, cwnd:cwnd+2, phase:'ca', ssthresh });

    // Generar pasos progresivos: uno por punto histórico
    for (let i = 0; i < history.length; i++) {
      const h = history[i];
      const phaseLabel = { ss:'Slow Start', ca:'Congestion Avoidance', to:'Timeout' }[h.phase];
      const currSs = h.ssthresh || 16;
      steps.push({
        history: history.slice(0, i+1),
        current: h,
        ssthresh: currSs,
        desc: h.event === 'timeout'
          ? `⚠️ <strong>Timeout en t=${h.t}!</strong> TCP asume congestión: <code>ssthresh = cwnd/2 = ${currSs}</code> y <strong>cwnd vuelve a 1 MSS</strong>. Re-entra en Slow Start.`
          : `t=${h.t} RTT · <code>cwnd = ${h.cwnd}</code> · <strong>${phaseLabel}</strong>. ${h.phase==='ss'?'Crece exponencialmente (×2 cada RTT).':'Crece linealmente (+1 MSS por RTT) tras alcanzar ssthresh.'}`
      });
    }

    return steps;
  },

  render(container, step) {
    const W = 620, H = 300;
    const padL = 50, padR = 20, padT = 30, padB = 40;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const maxT = 18, maxC = 20;
    const xFor = t => padL + (t / maxT) * plotW;
    const yFor = c => padT + plotH - (c / maxC) * plotH;

    const points = step.history.map(h => ({ x: xFor(h.t), y: yFor(h.cwnd), phase: h.phase, cwnd: h.cwnd, t: h.t }));
    const pathData = points.length > 1
      ? points.map((p,i) => (i===0?'M':'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ')
      : '';

    // Área bajo curva
    const areaData = points.length > 1
      ? pathData + ` L${points[points.length-1].x.toFixed(1)} ${(padT+plotH).toFixed(1)} L${points[0].x.toFixed(1)} ${(padT+plotH).toFixed(1)} Z`
      : '';

    const dots = points.map((p,i) => {
      const isCurrent = i === points.length - 1;
      const color = p.phase === 'ss' ? RC.cyan : (p.phase === 'ca' ? RC.blue : RC.red);
      return `<circle cx="${p.x}" cy="${p.y}" r="${isCurrent?6:3.5}" fill="${color}" stroke="${isCurrent?RC.txt:'none'}" stroke-width="${isCurrent?1.5:0}"/>`;
    }).join('');

    // Ejes
    const gridX = [0,2,4,6,8,10,12,14,16,18].map(t => `<line x1="${xFor(t)}" y1="${padT}" x2="${xFor(t)}" y2="${padT+plotH}" class="cwnd-grid"/><text x="${xFor(t)}" y="${H-10}" style="font-family:JetBrains Mono,monospace;font-size:9.5px;fill:${RC.muted};text-anchor:middle">${t}</text>`).join('');
    const gridY = [0,4,8,12,16,20].map(c => `<line x1="${padL}" y1="${yFor(c)}" x2="${padL+plotW}" y2="${yFor(c)}" class="cwnd-grid"/><text x="${padL-6}" y="${yFor(c)+3}" style="font-family:JetBrains Mono,monospace;font-size:9.5px;fill:${RC.muted};text-anchor:end">${c}</text>`).join('');

    // Línea ssthresh
    const ssY = yFor(step.ssthresh);
    const ssLine = `
      <line x1="${padL}" y1="${ssY}" x2="${padL+plotW}" y2="${ssY}" class="cwnd-thresh"/>
      <text x="${padL+plotW-4}" y="${ssY-4}" style="font-family:JetBrains Mono,monospace;font-size:10px;fill:${RC.red};font-weight:800;text-anchor:end">ssthresh=${step.ssthresh}</text>`;

    // Etiquetas de fase
    const phaseTag = step.current.phase === 'ss'
      ? `<text x="${padL+40}" y="${padT+18}" class="cwnd-phase" fill="${RC.cyanD}">Slow Start (×2 por RTT)</text>`
      : step.current.phase === 'ca'
      ? `<text x="${padL+40}" y="${padT+18}" class="cwnd-phase" fill="${RC.blueD}">Congestion Avoidance (+1 por RTT)</text>`
      : `<text x="${padL+40}" y="${padT+18}" class="cwnd-phase" fill="${RC.red}">⚠ Timeout — Reset</text>`;

    container.innerHTML = `
      <div class="cwnd-wrap">
        <svg class="cwnd-svg" viewBox="0 0 ${W} ${H}" width="100%">
          ${gridX}${gridY}
          <line x1="${padL}" y1="${padT+plotH}" x2="${padL+plotW}" y2="${padT+plotH}" class="cwnd-ax"/>
          <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT+plotH}" class="cwnd-ax"/>
          <text x="${W/2}" y="${H-2}" style="font-family:Inter,sans-serif;font-size:10.5px;fill:${RC.muted};font-weight:700;text-anchor:middle">Tiempo (RTT)</text>
          <text x="14" y="${padT+plotH/2}" style="font-family:Inter,sans-serif;font-size:10.5px;fill:${RC.muted};font-weight:700" transform="rotate(-90 14 ${padT+plotH/2})">cwnd (MSS)</text>
          <path d="${areaData}" fill="${RC.cyan}" fill-opacity="0.1"/>
          <path d="${pathData}" fill="none" stroke="${RC.cyan}" stroke-width="2.5"/>
          ${ssLine}
          ${dots}
          ${phaseTag}
        </svg>
        ${legend([
          { c: RC.cyan,  t: 'Slow Start (exponencial)' },
          { c: RC.blue,  t: 'Congestion Avoidance (lineal)' },
          { c: RC.red,   t: 'Timeout' },
        ])}
      </div>`;
  }
};

/* ╔══════════════════════════════════════════════════════════════════╗
   ║ 15. DNS — Resolución recursiva/iterativa                          ║
   ╚══════════════════════════════════════════════════════════════════╝ */
const RC_DNS = {
  id: 'dns', name: 'DNS — Resolución jerárquica', shortName: 'DNS',
  layer: 'Aplicación', protocol: 'DNS (RFC 1035)',
  description: 'El servidor local realiza consultas recursivas subiendo por la jerarquía: raíz → TLD (.es) → autoritativo de ua.es → registro www. En cada paso obtiene una referencia al siguiente servidor a preguntar.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Iterativa</span> El servidor local acepta la carga: hace consultas iterativas a la jerarquía y devuelve la respuesta final al cliente.</p>
    <p><span class="explain-tag">Caché</span> Las respuestas se cachean con TTL para acelerar consultas posteriores.</p>
  </div>`,
  useCases: 'Navegación web, correo (MX), servicios',

  generateSteps() {
    return [
      { active:['client','local'], arrow:{from:'client', to:'local', type:'q', label:'¿www.ua.es?'}, cache:false, desc:
        `El navegador consulta a su <strong>servidor DNS local</strong> por <code>www.ua.es</code>. Es una consulta <strong>recursiva</strong>: el local se encarga de todo el trabajo.` },
      { active:['local','root'], arrow:{from:'local', to:'root', type:'q', label:'¿www.ua.es?'}, cache:false, desc:
        `El local no tiene la respuesta en caché. Pregunta primero al <strong>servidor raíz</strong> (uno de los 13 servidores raíz del mundo).` },
      { active:['root','local'], arrow:{from:'root', to:'local', type:'r', label:'Preg. a servidor .es'}, cache:false, desc:
        `El servidor raíz responde con la dirección del servidor autoritativo del TLD <code>.es</code>. No conoce a ua.es directamente.` },
      { active:['local','tld'], arrow:{from:'local', to:'tld', type:'q', label:'¿www.ua.es?'}, cache:false, desc:
        `El local pregunta al <strong>servidor TLD .es</strong>.` },
      { active:['tld','local'], arrow:{from:'tld', to:'local', type:'r', label:'Preg. a NS de ua.es'}, cache:false, desc:
        `El servidor .es responde con el servidor autoritativo del dominio <code>ua.es</code>.` },
      { active:['local','auth'], arrow:{from:'local', to:'auth', type:'q', label:'¿www.ua.es?'}, cache:false, desc:
        `El local pregunta al <strong>servidor autoritativo de ua.es</strong>. Es el que "manda" sobre este dominio.` },
      { active:['auth','local'], arrow:{from:'auth', to:'local', type:'r', label:'A 193.145.235.30'}, cache:false, desc:
        `El autoritativo devuelve el registro A: <code>www.ua.es → 193.145.235.30</code>.` },
      { active:['local','client'], arrow:{from:'local', to:'client', type:'r', label:'IP=193.145.235.30'}, cache:true, desc:
        `El local <strong>cachea</strong> el resultado (respetando el TTL) y responde al cliente con la IP. El navegador ya puede abrir la conexión TCP.` },
    ];
  },

  render(container, step) {
    const W = 620, H = 320;
    const nodes = {
      client: { x: 80,  y: 250, label:'Navegador', sub:'cliente' },
      local:  { x: 260, y: 250, label:'DNS local', sub:'8.8.8.8' },
      root:   { x: 440, y: 60,  label:'Servidor', sub:'raíz (.)' },
      tld:    { x: 540, y: 150, label:'TLD', sub:'.es' },
      auth:   { x: 440, y: 240, label:'Autoritativo', sub:'ua.es' },
    };

    const isActive = (id) => step.active.includes(id);

    const nodeEls = Object.entries(nodes).map(([id, n]) => `
      <g class="dns-node ${isActive(id)?'active':''} ${step.cache && id==='local'?'resolved':''}">
        <rect x="${n.x-52}" y="${n.y-22}" width="104" height="44" rx="7"
              fill="${isActive(id)?'#eff6ff':(step.cache&&id==='local'?'#ecfdf5':'white')}"
              stroke="${isActive(id)?RC.blueD:(step.cache&&id==='local'?RC.green:RC.blue)}"
              stroke-width="2"/>
        <text x="${n.x}" y="${n.y-4}" style="font-family:JetBrains Mono,monospace;font-weight:800;font-size:12px;fill:${RC.txt};text-anchor:middle">${n.label}</text>
        <text x="${n.x}" y="${n.y+11}" style="font-family:JetBrains Mono,monospace;font-size:10px;fill:${RC.muted};text-anchor:middle">${n.sub}</text>
      </g>`).join('');

    let arrowEl = '';
    if (step.arrow) {
      const A = nodes[step.arrow.from], B = nodes[step.arrow.to];
      const color = step.arrow.type === 'q' ? RC.blue : RC.green;
      const marker = step.arrow.type === 'q' ? 'arrow-blue-dns' : 'arrow-green-dns';
      // Punto medio con offset para etiqueta
      const midX = (A.x + B.x) / 2;
      const midY = (A.y + B.y) / 2 - 12;
      arrowEl = `
        <line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${color}" stroke-width="2.5" marker-end="url(#${marker})"/>
        <g><rect x="${midX-72}" y="${midY-9}" width="144" height="18" rx="4" fill="white" stroke="${color}" stroke-width="1"/>
          <text x="${midX}" y="${midY+4}" style="font-family:JetBrains Mono,monospace;font-size:10px;fill:${color};font-weight:700;text-anchor:middle">${step.arrow.label}</text></g>`;
    }

    // Jerarquía visual: líneas grises entre servidores DNS
    const hierarchy = `
      <line x1="${nodes.root.x}" y1="${nodes.root.y}" x2="${nodes.tld.x}" y2="${nodes.tld.y}" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="3,3"/>
      <line x1="${nodes.tld.x}" y1="${nodes.tld.y}" x2="${nodes.auth.x}" y2="${nodes.auth.y}" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="3,3"/>`;

    container.innerHTML = `
      <div class="dns-wrap">
        <svg class="dns-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:660px">
          <defs>
            ${arrowMarker('arrow-blue-dns', RC.blue)}
            ${arrowMarker('arrow-green-dns', RC.green)}
          </defs>
          ${hierarchy}
          ${arrowEl}
          ${nodeEls}
        </svg>
        ${legend([
          { c: RC.blue,  t: 'Consulta' },
          { c: RC.green, t: 'Respuesta' },
        ])}
      </div>`;
  }
};
