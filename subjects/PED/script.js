/* ================================================================
   PED — script.js
   Visualizador Interactivo de Estructuras de Datos
   Programación y Estructuras de Datos — 2º Curso, 2º Semestre
   ================================================================
   ARQUITECTURA:
   · Cada visualizador define: { info, generateSteps(), render() }
   · generateSteps() pre-calcula TODOS los pasos antes de mostrarlos
     → permite ir adelante y atrás sin recalcular nada
   · render(container, step) pinta el estado de un paso concreto
   · EstructurasApp gestiona la reproducción, controles y navegación
   · Sólo hay contenido de TEORÍA (no hay pestaña de prácticas)
   ================================================================ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   METADATOS DE CATEGORÍAS
════════════════════════════════════════════════════════════════ */
const CATEGORIES = [
  {
    id: 'arboles-binarios',
    name: 'Árboles Binarios',
    icon: '🌲',
    algoIds: ['trav-pre', 'trav-in', 'trav-post', 'trav-lev']
  },
  {
    id: 'arboles-busqueda',
    name: 'Árboles de Búsqueda',
    icon: '🌳',
    algoIds: ['abb-insert', 'abb-delete', 'avl-insert', 'tree-23', 'tree-234']
  },
  {
    id: 'conjuntos-hash',
    name: 'Conjuntos y Hashing',
    icon: '🗃️',
    algoIds: ['hash-closed', 'hash-open']
  },
  {
    id: 'colas-prioridad',
    name: 'Colas de Prioridad',
    icon: '⛰️',
    algoIds: ['heap-insert', 'heap-delete', 'heapsort', 'deap-insert', 'deap-delete']
  },
  {
    id: 'grafos',
    name: 'Grafos',
    icon: '🕸️',
    algoIds: ['graph-rep', 'dfs', 'bfs']
  }
];

/* ════════════════════════════════════════════════════════════════
   REGISTRO GLOBAL DE VISUALIZADORES
════════════════════════════════════════════════════════════════ */
const ALGORITHMS = {
  'trav-pre':     ALGO_PREORDEN,
  'trav-in':      ALGO_INORDEN,
  'trav-post':    ALGO_POSTORDEN,
  'trav-lev':     ALGO_NIVELES,
  'abb-insert':   ALGO_ABB_INSERT,
  'abb-delete':   ALGO_ABB_DELETE,
  'avl-insert':   ALGO_AVL,
  'tree-23':      ALGO_23,
  'tree-234':     ALGO_234,
  'hash-closed':  ALGO_HASH_CLOSED,
  'hash-open':    ALGO_HASH_OPEN,
  'heap-insert':  ALGO_HEAP_INSERT,
  'heap-delete':  ALGO_HEAP_DELETE,
  'heapsort':     ALGO_HEAPSORT,
  'deap-insert':  ALGO_DEAP_INSERT,
  'deap-delete':  ALGO_DEAP_DELETE,
  'graph-rep':    ALGO_GRAPH_REP,
  'dfs':          ALGO_DFS,
  'bfs':          ALGO_BFS,
};

/* ════════════════════════════════════════════════════════════════
   CLASE PRINCIPAL DE LA APLICACIÓN
════════════════════════════════════════════════════════════════ */
class EstructurasApp {
  constructor() {
    this.algo    = null;
    this.steps   = [];
    this.stepIdx = 0;
    this.playing = false;
    this.timer   = null;
    this.speedMap = { 1: 2200, 2: 1300, 3: 700, 4: 380, 5: 150 };

    this._initDOM();
    this._buildSidebar();
    this._buildWelcome();
    this._bindControls();
  }

  _initDOM() {
    const $ = id => document.getElementById(id);
    this.dom = {
      welcome:     $('welcomeScreen'),
      algoView:    $('algoView'),
      sidebarNav:  $('sidebarNav'),
      welcomeCats: $('welcomeCategories'),
      bcCat:       $('bcCategory'),
      bcAlgo:      $('bcAlgo'),
      badges:      $('complexityBadges'),
      infoCard:    $('infoCard'),
      canvas:      $('visualizerCanvas'),
      counter:     $('stepCounter'),
      stepText:    $('stepText'),
      btnReset:    $('btnReset'),
      btnPrev:     $('btnPrev'),
      btnPlay:     $('btnPlayPause'),
      btnNext:     $('btnNext'),
      speed:       $('speedSlider'),
      speedVal:    $('speedValue'),
      playIcon:    $('playIcon'),
      pauseIcon:   $('pauseIcon'),
      playLabel:   $('playLabel'),
    };
  }

  /* ── Construir el menú lateral con categorías y visualizadores ── */
  _buildSidebar() {
    const container = this.dom.sidebarNav;
    container.innerHTML = '';

    CATEGORIES.forEach(cat => {
      const div = document.createElement('div');
      div.className = 'nav-category';

      const algosHTML = cat.algoIds.map(id => {
        const a = ALGORITHMS[id]; if (!a) return '';
        return `<div class="nav-item" data-id="${id}" role="button" tabindex="0"><div class="nav-item-dot"></div>${a.shortName}</div>`;
      }).join('');

      div.innerHTML = `
        <div class="nav-category-header">
          <span class="category-icon">${cat.icon}</span>
          <span>${cat.name}</span>
          <svg class="category-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
        </div>
        <div class="nav-category-items">${algosHTML}</div>`;

      div.querySelectorAll('.nav-item').forEach(el => {
        el.addEventListener('click', () => this.loadAlgorithm(el.dataset.id));
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') this.loadAlgorithm(el.dataset.id); });
      });

      container.appendChild(div);

      const header = div.querySelector('.nav-category-header');
      const items  = div.querySelector('.nav-category-items');
      div.classList.add('collapsed');
      items.style.maxHeight = '0';
      header.addEventListener('click', () => {
        const abrir = div.classList.contains('collapsed');
        container.querySelectorAll('.nav-category').forEach(otra => {
          otra.classList.add('collapsed');
          const oi = otra.querySelector('.nav-category-items');
          if (oi) oi.style.maxHeight = '0';
        });
        if (abrir) {
          div.classList.remove('collapsed');
          items.style.maxHeight = items.scrollHeight + 'px';
        }
      });
    });

    // Abrir por defecto la primera categoría
    const primera = container.querySelector('.nav-category');
    if (primera) {
      primera.classList.remove('collapsed');
      const pi = primera.querySelector('.nav-category-items');
      if (pi) pi.style.maxHeight = pi.scrollHeight + 'px';
    }
  }

  /* ── Construir tarjetas de bienvenida ── */
  _buildWelcome() {
    const total = Object.keys(ALGORITHMS).length;
    const el = document.getElementById('totalAlgos');
    if (el) el.textContent = total;
    const elCats = document.getElementById('totalCats');
    if (elCats) elCats.textContent = CATEGORIES.length;

    this.dom.welcomeCats.innerHTML = CATEGORIES.map(cat => {
      const names = cat.algoIds.map(id => ALGORITHMS[id]?.shortName).filter(Boolean);
      return `
        <div class="welcome-cat-card" data-first="${cat.algoIds[0]}" role="button" tabindex="0">
          <div class="welcome-cat-icon">${cat.icon}</div>
          <div class="welcome-cat-name">${cat.name}</div>
          <div class="welcome-cat-count">${cat.algoIds.length} visualizadores</div>
          <div class="welcome-cat-algos">${names.join(' · ')}</div>
        </div>`;
    }).join('');

    this.dom.welcomeCats.querySelectorAll('.welcome-cat-card').forEach(card => {
      card.addEventListener('click', () => this.loadAlgorithm(card.dataset.first));
      card.addEventListener('keydown', e => { if (e.key === 'Enter') this.loadAlgorithm(card.dataset.first); });
    });
  }

  /* ── Conectar los controles ── */
  _bindControls() {
    this.dom.btnPrev.addEventListener('click',  () => this._prev());
    this.dom.btnNext.addEventListener('click',  () => this._next());
    this.dom.btnReset.addEventListener('click', () => this._reset());
    this.dom.btnPlay.addEventListener('click',  () => this._togglePlay());

    this.dom.speed.addEventListener('input', e => {
      this.dom.speedVal.textContent = e.target.value + '×';
      if (this.playing) { this._stopPlay(); this._startPlay(); }
    });

    document.addEventListener('keydown', e => {
      if (!this.algo || ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); this._next(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); this._prev(); }
      if (e.key === ' ')          { e.preventDefault(); this._togglePlay(); }
    });
  }

  /* ════════════════════════════════════════════════════════════════
     CARGA Y RENDERIZADO
  ════════════════════════════════════════════════════════════════ */
  loadAlgorithm(id) {
    const algo = ALGORITHMS[id]; if (!algo) return;
    this._stopPlay();

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-id="${id}"]`);
    if (navItem) {
      navItem.classList.add('active');
      const catDiv = navItem.closest('.nav-category');
      const nav = catDiv ? catDiv.parentElement : null;
      if (catDiv && nav) {
        nav.querySelectorAll('.nav-category').forEach(otra => {
          if (otra !== catDiv) {
            otra.classList.add('collapsed');
            const oi = otra.querySelector('.nav-category-items');
            if (oi) oi.style.maxHeight = '0';
          }
        });
        catDiv.classList.remove('collapsed');
        const items = catDiv.querySelector('.nav-category-items');
        if (items) items.style.maxHeight = items.scrollHeight + 'px';
      }
    }

    this.algo = algo;
    this.dom.welcome.style.display  = 'none';
    this.dom.algoView.style.display = 'flex';

    const cat = CATEGORIES.find(c => c.algoIds.includes(id));
    this.dom.bcCat.textContent  = cat ? cat.name : '';
    this.dom.bcAlgo.textContent = algo.name;

    this.dom.badges.innerHTML = `
      <span class="badge badge-time">⏱ ${algo.timeComplexity}</span>
      <span class="badge badge-space">💾 ${algo.spaceComplexity}</span>`;

    this.dom.infoCard.innerHTML = `
      <div class="info-card-title">${algo.name}</div>
      <p class="info-card-desc">${algo.description}</p>
      ${algo.detailedText ? algo.detailedText : ''}
      <div class="info-card-details">
        <div class="info-detail">
          <div class="info-detail-label">Tiempo</div>
          <div class="info-detail-value">${algo.timeComplexity}</div>
        </div>
        <div class="info-detail">
          <div class="info-detail-label">Espacio</div>
          <div class="info-detail-value">${algo.spaceComplexity}</div>
        </div>
      </div>`;

    this.steps   = algo.generateSteps();
    this.stepIdx = 0;
    this._render();
    this._updateControls();
  }

  _render() {
    if (!this.algo || !this.steps.length) return;
    const step = this.steps[this.stepIdx];
    const canvas = this.dom.canvas;

    canvas.classList.remove('fade-in');
    void canvas.offsetWidth;
    canvas.classList.add('fade-in');

    this.algo.render(canvas, step);

    if (this.dom.counter) this.dom.counter.textContent = `Paso ${this.stepIdx + 1} / ${this.steps.length}`;
    if (this.dom.stepText) this.dom.stepText.innerHTML = step.desc || '';
  }

  _updateControls() {
    this.dom.btnPrev.disabled = this.stepIdx <= 0;
    this.dom.btnNext.disabled = this.stepIdx >= this.steps.length - 1;
  }

  /* ════════════════════════════════════════════════════════════════
     CONTROLES DE NAVEGACIÓN
  ════════════════════════════════════════════════════════════════ */
  _next() {
    if (this.stepIdx < this.steps.length - 1) {
      this.stepIdx++;
      this._render();
      this._updateControls();
      if (this.stepIdx === this.steps.length - 1) this._stopPlay();
    }
  }

  _prev() {
    if (this.stepIdx > 0) {
      this.stepIdx--;
      this._render();
      this._updateControls();
    }
  }

  _reset() {
    this._stopPlay();
    this.stepIdx = 0;
    this._render();
    this._updateControls();
  }

  _togglePlay() { this.playing ? this._stopPlay() : this._startPlay(); }

  _startPlay() {
    if (this.stepIdx >= this.steps.length - 1) this._reset();
    this.playing = true;
    this.dom.playIcon.style.display  = 'none';
    this.dom.pauseIcon.style.display = '';
    this.dom.playLabel.textContent   = 'Pausar';
    const delay = this.speedMap[+this.dom.speed.value] || 700;
    this.timer = setInterval(() => {
      if (this.stepIdx >= this.steps.length - 1) { this._stopPlay(); return; }
      this._next();
    }, delay);
  }

  _stopPlay() {
    this.playing = false;
    clearInterval(this.timer);
    this.dom.playIcon.style.display  = '';
    this.dom.pauseIcon.style.display = 'none';
    this.dom.playLabel.textContent   = 'Reproducir';
  }
}

/* ════════════════════════════════════════════════════════════════
   PUNTO DE ENTRADA
════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  window.app = new EstructurasApp();
});
