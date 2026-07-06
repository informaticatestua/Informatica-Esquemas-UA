/* ================================================================
   Redes de Computadores — PRÁCTICAS
   Trazas interactivas del laboratorio de la asignatura.
   ================================================================ */

'use strict';

/* ══════════════════════════════════════════════════════════════════
   CATEGORÍAS DE PRÁCTICAS
════════════════════════════════════════════════════════════════════ */
const PRACTICAS = [
  {
    id: 'diagnostico',
    name: 'Diagnóstico y ICMP',
    icon: '🩺',
    algoIds: ['p-ping', 'p-traceroute', 'p-fragmentacion']
  },
  {
    id: 'transporte-red',
    name: 'Transporte y Encaminamiento',
    icon: '🚦',
    algoIds: ['p-tcp-wireshark', 'p-dhcp-dora']
  }
];

/* ══════════════════════════════════════════════════════════════════
   1. PING PASO A PASO (con ARP y encapsulación Ethernet)
════════════════════════════════════════════════════════════════════ */
const P_PING = {
  id: 'p-ping', name: 'ping — ARP + ICMP Echo paso a paso', shortName: 'ping (ARP + ICMP)',
  layer: 'Práctica 1', protocol: 'ARP · ICMP',
  description: 'Simula un ping de PC1 a PC2 en la misma LAN: primero se resuelve la MAC con ARP y después se envía el ICMP Echo Request. Muestra la caché ARP evolucionando.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Práctica 1</span> Reproduce el comando <code>ping 10.0.0.2</code> desde PC1 en un segmento LAN sencillo, tal como se hace en el laboratorio con Cisco Packet Tracer.</p>
  </div>`,
  useCases: 'Wireshark, Packet Tracer, comandos ping/arp',

  generateSteps() {
    // Estado: cache ARP, paquetes en vuelo, contador ping
    return [
      { arpCache:{}, event:'start', pkt:null, active:['PC1'], seq:0, desc:
        `<code>C:\\&gt; ping 10.0.0.2</code>. PC1 quiere enviar un ICMP Echo, pero primero necesita la MAC de PC2 y su caché está vacía.` },
      { arpCache:{}, event:'arp-req', pkt:{ type:'arp', dir:'broadcast', label:'ARP Request ¿MAC de 10.0.0.2?' }, active:['PC1','PC2'], seq:0, desc:
        `PC1 envía un <strong>ARP Request</strong> con MAC destino <code>FF:FF:FF:FF:FF:FF</code>. Todas las estaciones lo procesan.` },
      { arpCache:{ pc1:{ '10.0.0.2':'AA:BB:CC:00:00:02' } }, event:'arp-reply', pkt:{ type:'arp', dir:'unicast', from:'PC2', to:'PC1', label:'ARP Reply MAC=..:02' }, active:['PC1','PC2'], seq:0, desc:
        `PC2 responde con un <strong>ARP Reply</strong> unicast. PC1 anota la asociación IP↔MAC en su caché.` },
      { arpCache:{ pc1:{ '10.0.0.2':'AA:BB:CC:00:00:02' } }, event:'echo-req', pkt:{ type:'icmp', dir:'unicast', from:'PC1', to:'PC2', label:'ICMP Echo Request seq=1' }, active:['PC1','PC2'], seq:1, desc:
        `Ahora PC1 encapsula el <strong>ICMP Echo Request</strong> en una trama Ethernet con MAC destino <code>AA:BB:CC:00:00:02</code>.` },
      { arpCache:{ pc1:{ '10.0.0.2':'AA:BB:CC:00:00:02' } }, event:'echo-reply', pkt:{ type:'icmp', dir:'unicast', from:'PC2', to:'PC1', label:'ICMP Echo Reply seq=1' }, active:['PC1','PC2'], seq:1, desc:
        `PC2 responde con un <strong>ICMP Echo Reply</strong>. La consola imprime <code>Reply from 10.0.0.2: time&lt;1ms TTL=64</code>.` },
      { arpCache:{ pc1:{ '10.0.0.2':'AA:BB:CC:00:00:02' } }, event:'echo-req', pkt:{ type:'icmp', dir:'unicast', from:'PC1', to:'PC2', label:'ICMP Echo Request seq=2' }, active:['PC1','PC2'], seq:2, desc:
        `Segundo ping: <strong>ya no hace falta ARP</strong>, la caché sigue activa. PC1 envía otro Echo Request directamente.` },
      { arpCache:{ pc1:{ '10.0.0.2':'AA:BB:CC:00:00:02' } }, event:'echo-reply', pkt:{ type:'icmp', dir:'unicast', from:'PC2', to:'PC1', label:'ICMP Echo Reply seq=2' }, active:['PC1','PC2'], seq:2, desc:
        `PC2 responde. Se completan los 4 paquetes típicos del <code>ping</code>. Estadísticas: 4 enviados, 4 recibidos, 0% pérdida.` },
    ];
  },

  render(container, step) {
    const W = 620, H = 240;
    const PC1 = { x: 90,  y: 130, label:'PC1', ip:'10.0.0.1', mac:'..:01' };
    const PC2 = { x: W-90, y: 130, label:'PC2', ip:'10.0.0.2', mac:'..:02' };

    const isActive = (id) => step.active && step.active.includes(id);

    // Enlace
    const linkActive = isActive('PC1') && isActive('PC2');
    const wire = `<line x1="${PC1.x+22}" y1="${PC1.y}" x2="${PC2.x-22}" y2="${PC2.y}" stroke="${linkActive?RC.cyan:'#cbd5e1'}" stroke-width="${linkActive?3:2}"/>`;

    const drawPC = (p, id) => `
      <g class="node-host ${isActive(id)?'active':''}">
        <circle cx="${p.x}" cy="${p.y}" r="26" fill="${isActive(id)?'#eff6ff':'white'}" stroke="${RC.blue}" stroke-width="2.5"/>
        <text x="${p.x}" y="${p.y+5}" style="font-family:JetBrains Mono,monospace;font-weight:800;font-size:13px;fill:${RC.txt};text-anchor:middle">${p.label}</text>
        <text x="${p.x}" y="${p.y+42}" style="font-family:JetBrains Mono,monospace;font-size:10px;fill:${RC.muted};text-anchor:middle;font-weight:600">${p.ip}</text>
        <text x="${p.x}" y="${p.y+54}" style="font-family:JetBrains Mono,monospace;font-size:9.5px;fill:${RC.muted};text-anchor:middle">${p.mac}</text>
      </g>`;

    // Paquete
    let pktEl = '';
    if (step.pkt) {
      const p = step.pkt;
      const cx = (PC1.x + PC2.x) / 2;
      const cy = PC1.y - 40;
      const color = p.type === 'arp' ? RC.purple : RC.red;
      const symbol = p.type === 'arp' ? 'ARP' : 'ICMP';
      pktEl = `
        <g>
          <rect x="${cx-90}" y="${cy-14}" width="180" height="28" rx="5" fill="${color}" stroke="${RC.txt}" stroke-width="1"/>
          <text x="${cx}" y="${cy+4}" style="font-family:JetBrains Mono,monospace;font-size:10px;font-weight:700;fill:white;text-anchor:middle">${p.label}</text>
        </g>`;
    }

    // Caché ARP de PC1
    const cache = step.arpCache.pc1 || {};
    const cacheHTML = Object.keys(cache).length
      ? `<table class="rc-tbl" style="font-size:.75rem">
          <tr><th>IP</th><th>MAC</th></tr>
          ${Object.entries(cache).map(([ip, mac]) => `<tr><td>${ip}</td><td class="new">${mac}</td></tr>`).join('')}
        </table>`
      : `<div style="font-size:.72rem;color:${RC.muted};font-style:italic;padding:4px 8px">— caché vacía —</div>`;

    // Consola simulada
    const seqLines = [];
    for (let i = 1; i <= step.seq; i++) {
      if (i <= step.seq) seqLines.push(`<div style="color:${RC.greenD}">Reply from 10.0.0.2: bytes=32 time&lt;1ms TTL=64</div>`);
    }
    const consoleHTML = `
      <div style="background:#0f172a;color:#e2e8f0;font-family:JetBrains Mono,monospace;font-size:.78rem;padding:10px 14px;border-radius:6px;max-width:340px;width:100%">
        <div>C:\\&gt; ping 10.0.0.2</div>
        <div style="opacity:.7">Pinging 10.0.0.2 with 32 bytes of data:</div>
        ${seqLines.join('')}
      </div>`;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
        <svg class="topo-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:640px">
          ${wire}
          ${drawPC(PC1, 'PC1')}
          ${drawPC(PC2, 'PC2')}
          ${pktEl}
        </svg>
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:flex-start">
          <div style="text-align:center">
            <div style="font-size:.66rem;font-weight:800;color:${RC.muted};text-transform:uppercase;margin-bottom:4px">Caché ARP de PC1</div>
            ${cacheHTML}
          </div>
          ${consoleHTML}
        </div>
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════
   2. TRACEROUTE (TTL creciente)
════════════════════════════════════════════════════════════════════ */
const P_TRACEROUTE = {
  id: 'p-traceroute', name: 'traceroute — TTL creciente', shortName: 'traceroute',
  layer: 'Práctica 2', protocol: 'ICMP · TTL',
  description: 'traceroute descubre los routers intermedios enviando paquetes con TTL=1, TTL=2, TTL=3… Cada router al que se agota el TTL devuelve un ICMP Time Exceeded revelando su identidad.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">RFC 792</span> Cuando un router recibe un paquete con TTL=0, lo descarta y devuelve un mensaje <strong>ICMP Time Exceeded</strong> al origen.</p>
    <p><span class="explain-tag">Destino</span> Al alcanzar el destino final, éste devuelve un <strong>ICMP Echo Reply</strong> (no un Time Exceeded), lo que indica al comando que ha terminado.</p>
  </div>`,
  useCases: 'Detección de problemas de encaminamiento',

  generateSteps() {
    const steps = [];
    const routers = ['R1', 'R2', 'R3'];
    const destino = 'DST';
    const nodes = ['PC1', ...routers, destino];
    const discovered = []; // routers ya descubiertos

    steps.push({ ttl:0, phase:'init', progress:-1, current:null, discovered:[], desc:
      `<code>C:\\&gt; tracert 8.8.8.8</code>. Vamos a descubrir los routers hasta el destino incrementando el TTL desde 1.` });

    for (let ttl = 1; ttl <= routers.length + 1; ttl++) {
      // Envío
      steps.push({ ttl, phase:'send', progress:0, current:null, discovered:[...discovered], desc:
        `Envío con <strong>TTL=${ttl}</strong>. El paquete avanzará ${ttl} salto${ttl===1?'':'s'} antes de agotarse.` });
      for (let p = 1; p <= ttl && p < nodes.length; p++) {
        steps.push({ ttl, phase:'send', progress:p, current:nodes[p], discovered:[...discovered], desc:
          `Paquete llega a <code>${nodes[p]}</code>. TTL=${ttl - p}.` });
      }
      if (ttl < nodes.length - 1) {
        // Router intermedio expira
        const routerHit = routers[ttl - 1];
        steps.push({ ttl, phase:'expired', progress:ttl, current:routerHit, discovered:[...discovered], desc:
          `TTL agotado en <code>${routerHit}</code>. Descarta el paquete y prepara un <strong>ICMP Time Exceeded</strong>.` });
        for (let p = ttl - 1; p >= 0; p--) {
          steps.push({ ttl, phase:'return', progress:p, current:nodes[p], discovered:[...discovered], desc:
            `Time Exceeded volviendo a través de <code>${nodes[p]}</code>.` });
        }
        discovered.push(routerHit);
        steps.push({ ttl, phase:'received', progress:0, current:routerHit, discovered:[...discovered], desc:
          `<code>${routerHit}</code> descubierto. traceroute imprime: <code>${ttl}  ${routerHit === 'R1' ? '10.0.1.1' : routerHit === 'R2' ? '10.0.2.1' : '10.0.3.1'}  &lt;1 ms</code>.` });
      } else {
        // Destino alcanzado
        steps.push({ ttl, phase:'dst', progress:ttl, current:destino, discovered:[...discovered], desc:
          `Paquete alcanza el <strong>destino</strong>. En vez de Time Exceeded, devuelve <strong>ICMP Echo Reply</strong>.` });
        for (let p = ttl - 1; p >= 0; p--) {
          steps.push({ ttl, phase:'return', progress:p, current:nodes[p], discovered:[...discovered], desc:
            `Echo Reply volviendo a través de <code>${nodes[p]}</code>.` });
        }
        steps.push({ ttl, phase:'done', progress:0, current:destino, discovered:[...discovered, destino], desc:
          `Destino alcanzado. traceroute imprime la última línea y termina.` });
      }
    }
    return steps;
  },

  render(container, step) {
    const W = 640, H = 180;
    const nodes = [
      { id:'PC1', x: 60,  y: 90, label:'PC1', type:'host' },
      { id:'R1',  x: 200, y: 90, label:'R1',  type:'router' },
      { id:'R2',  x: 320, y: 90, label:'R2',  type:'router' },
      { id:'R3',  x: 440, y: 90, label:'R3',  type:'router' },
      { id:'DST', x: 580, y: 90, label:'DST', type:'host' },
    ];

    const links = nodes.slice(0, -1).map((n, i) => {
      const next = nodes[i+1];
      const active = step.progress >= i+1 && step.phase !== 'init';
      return `<line x1="${n.x+20}" y1="${n.y}" x2="${next.x-20}" y2="${next.y}" stroke="${active?RC.cyan:'#cbd5e1'}" stroke-width="${active?2.5:2}"/>`;
    }).join('');

    const nodeEls = nodes.map(n => {
      const disc = step.discovered && step.discovered.includes(n.id);
      const curr = step.current === n.id;
      const color = n.type === 'router' ? RC.purple : RC.blue;
      const bg = disc ? '#ecfdf5' : (curr ? '#fffbeb' : 'white');
      const st = disc ? RC.green : (curr ? RC.amber : color);
      return `<g>
        ${n.type === 'router'
          ? `<circle cx="${n.x}" cy="${n.y}" r="22" fill="${bg}" stroke="${st}" stroke-width="2.5"/>`
          : `<circle cx="${n.x}" cy="${n.y}" r="22" fill="${bg}" stroke="${st}" stroke-width="2.5"/>`}
        <text x="${n.x}" y="${n.y+4}" style="font-family:JetBrains Mono,monospace;font-weight:800;font-size:12px;fill:${RC.txt};text-anchor:middle">${n.label}</text>
        ${disc ? `<text x="${n.x}" y="${n.y-30}" style="font-family:JetBrains Mono,monospace;font-size:10px;fill:${RC.greenD};font-weight:800;text-anchor:middle">✓</text>` : ''}
      </g>`;
    }).join('');

    // Paquete
    let pktEl = '';
    if (step.progress !== undefined && step.progress >= 0 && step.progress < nodes.length && step.phase !== 'init' && step.phase !== 'received' && step.phase !== 'done') {
      const n = nodes[step.progress];
      const isReturn = step.phase === 'return';
      const isExpired = step.phase === 'expired';
      const isDst = step.phase === 'dst';
      const color = isReturn ? RC.green : (isExpired ? RC.red : (isDst ? RC.green : RC.amber));
      const label = isReturn ? (step.phase === 'return' && step.ttl === nodes.length - 1 && step.progress === 0 ? 'Reply' : 'Time Exc.') : (isExpired ? 'TTL=0 ✕' : (isDst ? 'Echo Reply' : `TTL=${step.ttl - step.progress + 1}`));
      pktEl = `<g>
        <rect x="${n.x-40}" y="${n.y-52}" width="80" height="22" rx="4" fill="${color}" stroke="${RC.txt}" stroke-width="1"/>
        <text x="${n.x}" y="${n.y-37}" style="font-family:JetBrains Mono,monospace;font-size:9.5px;font-weight:700;fill:white;text-anchor:middle">${label}</text>
      </g>`;
    }

    // Consola
    const outputs = [];
    outputs.push(`<div style="color:#94a3b8">Tracing route to 8.8.8.8 over a maximum of 30 hops:</div>`);
    step.discovered.forEach((r, i) => {
      const ip = r === 'R1' ? '10.0.1.1' : r === 'R2' ? '10.0.2.1' : r === 'R3' ? '10.0.3.1' : '8.8.8.8';
      outputs.push(`<div>${(i+1).toString().padStart(3)}  &lt;1 ms  &lt;1 ms  &lt;1 ms   ${ip}  <span style="color:${RC.muted}">${r}</span></div>`);
    });
    if (step.phase === 'done') {
      outputs.push(`<div style="color:${RC.greenD}">Trace complete.</div>`);
    }
    const consoleHTML = `<div style="background:#0f172a;color:#e2e8f0;font-family:JetBrains Mono,monospace;font-size:.78rem;padding:10px 14px;border-radius:6px;max-width:520px;width:100%">${outputs.join('')}</div>`;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
        <svg class="topo-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:660px">
          ${links}
          ${nodeEls}
          ${pktEl}
        </svg>
        ${consoleHTML}
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════
   3. FRAGMENTACIÓN IP (ping -l 2000)
════════════════════════════════════════════════════════════════════ */
const P_FRAGMENTACION = {
  id: 'p-fragmentacion', name: 'Fragmentación IP en un ICMP grande', shortName: 'Fragmentación IP',
  layer: 'Práctica 2', protocol: 'IPv4 · MF · Offset',
  description: 'Un ping de 2000 B genera un paquete IP de 2028 B que excede el MTU=1500 de Ethernet. IP lo fragmenta usando los campos ID, Flags MF y Offset. El destino los reensambla.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">MF</span> More Fragments: 1 en todos menos el último. <span class="explain-tag">Offset</span> posición del fragmento en bytes / 8. <span class="explain-tag">ID</span> mismo id en todos los fragmentos del mismo datagrama.</p>
  </div>`,
  useCases: 'ping con payload grande, tunelizaciones',

  generateSteps() {
    // Datagrama de 2028 B (20 IP + 8 ICMP + 2000 datos). MTU=1500, así que:
    // Frag1: 20 IP + 1480 datos, MF=1, Offset=0
    // Frag2: 20 IP + 528 datos, MF=0, Offset=185 (1480/8)
    const fragmentos = [
      { id: 12345, size: 1500, mf: 1, offset: 0,   dataStart: 0,    dataEnd: 1479 },
      { id: 12345, size: 548,  mf: 0, offset: 185, dataStart: 1480, dataEnd: 2007 },
    ];
    return [
      { phase:'init', received:[], desc:
        `<code>C:\\&gt; ping -l 2000 10.0.0.2</code>. Se genera un datagrama IP de <strong>2028 bytes</strong> (20 IP + 8 ICMP + 2000 datos). Como el MTU de Ethernet es <strong>1500 B</strong>, no cabe.` },
      { phase:'fragment', received:[], desc:
        `El nivel IP fragmenta el datagrama en <strong>2 fragmentos</strong> conservando el mismo <code>ID=12345</code>. La cabecera IP se duplica en cada uno.` },
      { phase:'send-1', received:[], sending:0, desc:
        `Fragmento 1: <strong>1500 B</strong> (20 IP + 1480 datos). Flags: <code>MF=1</code>. Offset: <code>0</code>. Contiene la cabecera ICMP completa.` },
      { phase:'send-2', received:[0], sending:1, desc:
        `Fragmento 2: <strong>548 B</strong> (20 IP + 528 datos). Flags: <code>MF=0</code> (último). Offset: <code>185</code> (= 1480/8). Sin cabecera ICMP.` },
      { phase:'reassemble', received:[0,1], desc:
        `El destino recibe ambos, verifica que MF=0 en uno y agrupa por ID y Offset. <strong>Reensambla</strong> el datagrama original de 2028 B y pasa el ICMP completo a la capa superior.` },
    ];
  },

  render(container, step) {
    const fragmentos = [
      { size: 1500, mf: 1, offset: 0,   data: '20 IP · 8 ICMP · 1472 datos' },
      { size: 548,  mf: 0, offset: 185, data: '20 IP · 528 datos' },
    ];

    // Bloque grande del datagrama original
    const originalBlock = `
      <div style="width:100%;max-width:640px;background:${step.phase === 'init' ? RC.amberLight || '#fef3c7' : '#f1f5f9'};border:2px ${step.phase === 'init' ? 'solid' : 'dashed'} ${step.phase === 'init' ? RC.amber : RC.slateL};border-radius:8px;padding:14px;text-align:center">
        <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;color:${step.phase === 'init' ? '#92400e' : RC.muted};margin-bottom:4px">Datagrama IP original</div>
        <div style="font-family:JetBrains Mono,monospace;font-size:.9rem;font-weight:800;color:${step.phase === 'init' ? '#92400e' : RC.muted}">2028 B — no cabe en MTU=1500</div>
      </div>`;

    // Fragmentos
    const fragEls = fragmentos.map((f, i) => {
      const isSending = step.sending === i;
      const isReceived = step.received && step.received.includes(i);
      const color = isReceived ? RC.green : (isSending ? RC.cyan : RC.muted);
      const bg = isReceived ? '#ecfdf5' : (isSending ? '#ecfeff' : '#f8fafc');
      return `
        <div style="flex:${f.size};min-width:180px;background:${bg};border:2px solid ${color};border-radius:8px;padding:12px 14px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
            <span style="font-size:.72rem;font-weight:800;text-transform:uppercase;color:${color === RC.green ? RC.greenD : color === RC.cyan ? RC.cyanD : RC.muted}">Frag ${i+1}</span>
            <span style="font-family:JetBrains Mono,monospace;font-size:.78rem;font-weight:800;color:${RC.txt}">${f.size} B</span>
          </div>
          <div style="font-family:JetBrains Mono,monospace;font-size:.68rem;color:${RC.slateD};line-height:1.6">
            ID=12345<br>
            <strong>MF=${f.mf}</strong> · <strong>Offset=${f.offset}</strong><br>
            <span style="color:${RC.muted}">${f.data}</span>
          </div>
        </div>`;
    }).join('');

    const showFragments = step.phase !== 'init';
    const showReassembly = step.phase === 'reassemble';

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
        ${step.phase === 'init' ? originalBlock : ''}
        ${step.phase === 'fragment' ? `
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:1.8rem">✂️</div>
            <div style="font-size:.85rem;color:${RC.txt};font-weight:600">Fragmentar en 2 paquetes IP</div>
          </div>` : ''}
        ${showFragments ? `<div style="display:flex;gap:12px;width:100%;max-width:640px;flex-wrap:wrap">${fragEls}</div>` : ''}
        ${showReassembly ? `
          <div style="width:100%;max-width:640px;background:#ecfdf5;border:2px solid ${RC.green};border-radius:8px;padding:14px;text-align:center">
            <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;color:${RC.greenD};margin-bottom:4px">✓ Reensamblado</div>
            <div style="font-family:JetBrains Mono,monospace;font-size:.9rem;font-weight:800;color:${RC.greenD}">2028 B — ICMP Echo Request completo</div>
          </div>` : ''}
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════
   4. TRAZA TCP TIPO WIRESHARK (P3)
════════════════════════════════════════════════════════════════════ */
const P_TCP_WIRESHARK = {
  id: 'p-tcp-wireshark', name: 'Traza TCP tipo Wireshark', shortName: 'Traza TCP',
  layer: 'Práctica 3', protocol: 'TCP · SEQ/ACK',
  description: 'Reproduce la captura Wireshark del laboratorio: apertura de conexión con SYN/SYN+ACK/ACK, transferencia de datos con números de secuencia, y cierre con FIN/ACK.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Sequence Numbers</span> Cada segmento lleva el <code>seq</code> del primer byte que transporta. El <code>ack</code> es el próximo byte que el receptor espera.</p>
  </div>`,
  useCases: 'Análisis de capturas con Wireshark',

  generateSteps() {
    const packets = [
      { no: 1, time: '0.000', src: '10.0.0.1',   dst: '10.0.0.2', proto: 'TCP', info: '[SYN] Seq=0 Win=8192 MSS=1460', kind: 'tcp' },
      { no: 2, time: '0.001', src: '10.0.0.2',   dst: '10.0.0.1', proto: 'TCP', info: '[SYN, ACK] Seq=0 Ack=1 Win=8192', kind: 'tcp' },
      { no: 3, time: '0.001', src: '10.0.0.1',   dst: '10.0.0.2', proto: 'TCP', info: '[ACK] Seq=1 Ack=1 Win=8192', kind: 'tcp' },
      { no: 4, time: '0.010', src: '10.0.0.1',   dst: '10.0.0.2', proto: 'HTTP',info: 'GET / HTTP/1.1', kind: 'tcp' },
      { no: 5, time: '0.011', src: '10.0.0.2',   dst: '10.0.0.1', proto: 'TCP', info: '[ACK] Seq=1 Ack=76 Win=8192', kind: 'tcp' },
      { no: 6, time: '0.050', src: '10.0.0.2',   dst: '10.0.0.1', proto: 'HTTP',info: 'HTTP/1.1 200 OK (1024 bytes)', kind: 'tcp' },
      { no: 7, time: '0.051', src: '10.0.0.1',   dst: '10.0.0.2', proto: 'TCP', info: '[ACK] Seq=76 Ack=1025 Win=8192', kind: 'tcp' },
      { no: 8, time: '0.100', src: '10.0.0.1',   dst: '10.0.0.2', proto: 'TCP', info: '[FIN, ACK] Seq=76 Ack=1025', kind: 'tcp' },
      { no: 9, time: '0.101', src: '10.0.0.2',   dst: '10.0.0.1', proto: 'TCP', info: '[FIN, ACK] Seq=1025 Ack=77', kind: 'tcp' },
      { no:10, time: '0.101', src: '10.0.0.1',   dst: '10.0.0.2', proto: 'TCP', info: '[ACK] Seq=77 Ack=1026', kind: 'tcp' },
    ];

    const explanations = [
      `Paquete #1: cliente envía <code>SYN</code> con ISN=0. Inicio del handshake.`,
      `Paquete #2: servidor responde <code>SYN, ACK</code>. Su ISN=0, ACK=1 confirmando el SYN del cliente.`,
      `Paquete #3: cliente cierra el handshake con <code>ACK</code>. Conexión ESTABLECIDA.`,
      `Paquete #4: cliente envía el <code>GET /</code> HTTP (75 bytes). Seq=1 porque el SYN ocupó el byte 0.`,
      `Paquete #5: servidor confirma con <code>ACK=76</code> (siguiente byte esperado).`,
      `Paquete #6: servidor envía la respuesta HTTP (1024 bytes de datos).`,
      `Paquete #7: cliente confirma con <code>ACK=1025</code>.`,
      `Paquete #8: cliente inicia el cierre con <code>FIN, ACK</code>.`,
      `Paquete #9: servidor cierra su lado con <code>FIN, ACK</code>.`,
      `Paquete #10: cliente confirma el FIN del servidor. Conexión CERRADA.`,
    ];

    return packets.map((_, i) => ({ current: i, packets, desc: explanations[i] }));
  },

  render(container, step) {
    const { packets, current } = step;

    const rows = packets.map((p, i) => {
      const cls = i < current ? 'past' : (i === current ? 'current' : 'upcoming');
      const kindCls = p.proto === 'HTTP' ? 'tcp' : p.kind;
      return `<div class="wshark-row ${kindCls} ${cls}">
        <div>${p.no}</div>
        <div>${p.time}</div>
        <div>${p.src}</div>
        <div>${p.dst}</div>
        <div>${p.proto}</div>
        <div>${p.info}</div>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
        <div class="wshark" style="width:100%;max-width:820px">
          <div class="wshark-head">
            <div>No.</div>
            <div>Time</div>
            <div>Source</div>
            <div>Destination</div>
            <div>Protocol</div>
            <div>Info</div>
          </div>
          ${rows}
        </div>
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════
   5. DHCP DORA (P4)
════════════════════════════════════════════════════════════════════ */
const P_DHCP_DORA = {
  id: 'p-dhcp-dora', name: 'DHCP — Diálogo DORA', shortName: 'DHCP DORA',
  layer: 'Práctica 4', protocol: 'DHCP · UDP 67/68',
  description: 'Un cliente sin IP obtiene configuración vía DHCP en 4 mensajes: DISCOVER (broadcast) → OFFER → REQUEST → ACK. Se le asigna dirección, máscara, puerta de enlace y DNS con un tiempo de préstamo.',
  detailedText: `<div class="explain">
    <p><span class="explain-tag">Broadcast</span> DISCOVER y REQUEST se envían a <code>255.255.255.255</code> — el cliente aún no tiene IP y no sabe qué servidor responderá.</p>
    <p><span class="explain-tag">Lease</span> El ACK incluye el <em>lease time</em>. A la mitad, el cliente renueva unicast al servidor.</p>
  </div>`,
  useCases: 'Todas las redes con configuración automática',

  generateSteps() {
    return [
      { phase:'init', mac:'AA:BB:CC:00:00:01', ip:null, config:null, active:['client'], msg:null, desc:
        `El cliente arranca sin dirección IP. Solo conoce su MAC <code>AA:BB:CC:00:00:01</code>. Necesita configuración de red.` },
      { phase:'discover', mac:'AA:BB:CC:00:00:01', ip:null, config:null, active:['client','srv'], msg:{ type:'DISCOVER', from:'0.0.0.0', to:'255.255.255.255', color:RC.amber, label:'DHCP DISCOVER (broadcast)' }, desc:
        `<strong>D — DISCOVER</strong>: broadcast UDP 67 con origen <code>0.0.0.0:68</code> y destino <code>255.255.255.255:67</code>. "¿Alguien puede darme una IP?"` },
      { phase:'offer', mac:'AA:BB:CC:00:00:01', ip:null, config:null, active:['client','srv'], msg:{ type:'OFFER', from:'192.168.1.1', to:'255.255.255.255', color:RC.blue, label:'DHCP OFFER 192.168.1.100' }, desc:
        `<strong>O — OFFER</strong>: el servidor DHCP <code>192.168.1.1</code> ofrece la IP <code>192.168.1.100/24</code>, gateway <code>192.168.1.1</code> y DNS <code>8.8.8.8</code>.` },
      { phase:'request', mac:'AA:BB:CC:00:00:01', ip:null, config:null, active:['client','srv'], msg:{ type:'REQUEST', from:'0.0.0.0', to:'255.255.255.255', color:RC.amber, label:'DHCP REQUEST 192.168.1.100' }, desc:
        `<strong>R — REQUEST</strong>: el cliente <strong>acepta la oferta</strong> con otro broadcast (para que otros servidores DHCP retiren su oferta).` },
      { phase:'ack', mac:'AA:BB:CC:00:00:01', ip:'192.168.1.100', config:{ mask:'255.255.255.0', gw:'192.168.1.1', dns:'8.8.8.8', lease:'3600 s' }, active:['client','srv'], msg:{ type:'ACK', from:'192.168.1.1', to:'192.168.1.100', color:RC.green, label:'DHCP ACK confirma la IP' }, desc:
        `<strong>A — ACK</strong>: el servidor confirma. El cliente configura su interfaz con IP, máscara, gateway y DNS. Lease = 3600 s.` },
      { phase:'done', mac:'AA:BB:CC:00:00:01', ip:'192.168.1.100', config:{ mask:'255.255.255.0', gw:'192.168.1.1', dns:'8.8.8.8', lease:'3600 s' }, active:['client'], msg:null, desc:
        `<code>ipconfig</code> muestra la configuración obtenida. El cliente ya puede comunicar en la red.` },
    ];
  },

  render(container, step) {
    const W = 620, H = 260;
    const client = { x: 110, y: 130, label:'Cliente' };
    const srv    = { x: W-110, y: 130, label:'Servidor DHCP' };

    const isActive = (id) => step.active.includes(id);
    const linkActive = isActive('client') && isActive('srv');
    const wire = `<line x1="${client.x+22}" y1="${client.y}" x2="${srv.x-22}" y2="${srv.y}" stroke="${linkActive?RC.cyan:'#cbd5e1'}" stroke-width="${linkActive?3:2}"/>`;

    const drawNode = (n, id, ip) => `
      <g class="node-host ${isActive(id)?'active':''}">
        <circle cx="${n.x}" cy="${n.y}" r="24" fill="${isActive(id)?'#eff6ff':'white'}" stroke="${RC.blue}" stroke-width="2.5"/>
        <text x="${n.x}" y="${n.y+4}" style="font-family:JetBrains Mono,monospace;font-weight:800;font-size:11px;fill:${RC.txt};text-anchor:middle">${id==='client'?'PC':'DHCP'}</text>
        <text x="${n.x}" y="${n.y+40}" style="font-family:JetBrains Mono,monospace;font-size:10px;fill:${RC.muted};text-anchor:middle;font-weight:600">${ip || '—'}</text>
        <text x="${n.x}" y="${n.y-32}" style="font-family:Inter,sans-serif;font-size:10px;fill:${RC.slateD};text-anchor:middle;font-weight:700">${n.label}</text>
      </g>`;

    let pktEl = '';
    if (step.msg) {
      const cx = (client.x + srv.x) / 2;
      const cy = client.y - 50;
      pktEl = `
        <g>
          <rect x="${cx-90}" y="${cy-16}" width="180" height="32" rx="5" fill="${step.msg.color}" stroke="${RC.txt}" stroke-width="1"/>
          <text x="${cx}" y="${cy-3}" style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:800;fill:white;text-anchor:middle">${step.msg.label}</text>
          <text x="${cx}" y="${cy+9}" style="font-family:JetBrains Mono,monospace;font-size:9px;fill:white;text-anchor:middle;opacity:.85">${step.msg.from} → ${step.msg.to}</text>
        </g>`;
    }

    // Panel de configuración
    const configHTML = step.config
      ? `<table class="rc-tbl" style="font-size:.78rem">
          <tr><th>Parámetro</th><th>Valor</th></tr>
          <tr><td>IP</td><td class="new">${step.ip}</td></tr>
          <tr><td>Máscara</td><td class="new">${step.config.mask}</td></tr>
          <tr><td>Gateway</td><td class="new">${step.config.gw}</td></tr>
          <tr><td>DNS</td><td class="new">${step.config.dns}</td></tr>
          <tr><td>Lease</td><td class="new">${step.config.lease}</td></tr>
        </table>`
      : `<div style="font-size:.72rem;color:${RC.muted};font-style:italic;padding:6px 10px">— sin configuración IP —</div>`;

    // Indicador de fase
    const phaseIdx = { init:0, discover:1, offer:2, request:3, ack:4, done:5 }[step.phase];
    const phases = ['Sin IP', 'DISCOVER', 'OFFER', 'REQUEST', 'ACK', '✓ OK'];
    const phaseBar = `
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center">
        ${phases.map((p, i) => {
          const state = i < phaseIdx ? 'past' : (i === phaseIdx ? 'current' : 'future');
          const bg = state === 'past' ? '#d1fae5' : (state === 'current' ? '#dbeafe' : '#f1f5f9');
          const color = state === 'past' ? RC.greenD : (state === 'current' ? RC.blueD : RC.muted);
          return `<span class="badge" style="background:${bg};color:${color};font-weight:700;padding:5px 10px">${p}</span>`;
        }).join('')}
      </div>`;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
        ${phaseBar}
        <svg class="topo-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:660px">
          ${wire}
          ${drawNode(client, 'client', step.ip)}
          ${drawNode(srv, 'srv', '192.168.1.1')}
          ${pktEl}
        </svg>
        <div style="text-align:center">
          <div style="font-size:.68rem;font-weight:800;color:${RC.muted};text-transform:uppercase;margin-bottom:4px">Configuración del cliente</div>
          ${configHTML}
        </div>
      </div>`;
  }
};

/* ══════════════════════════════════════════════════════════════════
   ÍNDICE DE PRÁCTICAS
════════════════════════════════════════════════════════════════════ */
const PRACTICAS_DATA = {
  'p-ping':          P_PING,
  'p-traceroute':    P_TRACEROUTE,
  'p-fragmentacion': P_FRAGMENTACION,
  'p-tcp-wireshark': P_TCP_WIRESHARK,
  'p-dhcp-dora':     P_DHCP_DORA,
};
