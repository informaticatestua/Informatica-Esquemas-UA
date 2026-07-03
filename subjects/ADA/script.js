/* ================================================================
   AlgoVisual — script.js
   Visualizador Interactivo de Algoritmos
   Análisis y Diseño de Algoritmos — 2º Curso, 2º Semestre
   ================================================================
   ARQUITECTURA:
   · Cada algoritmo define: { info, generateSteps(), render() }
   · generateSteps() pre-calcula TODOS los pasos antes de mostrarlos
     → permite ir adelante y atrás sin recalcular nada
   · render(container, step) pinta el estado de un paso concreto
   · AlgoVisualApp gestiona la reproducción, controles y navegación
   ================================================================ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   METADATOS DE CATEGORÍAS
════════════════════════════════════════════════════════════════ */
const CATEGORIES = [
  {
    id: 'divide',
    name: 'Divide y Vencerás',
    icon: '⚔️',
    algoIds: ['binary-search', 'merge-sort', 'quick-sort', 'quick-select', 'hanoi']
  },
  {
    id: 'dynamic',
    name: 'Programación Dinámica',
    icon: '📊',
    algoIds: ['fibonacci', 'binomial-coeff', 'knapsack-01', 'rod-cutting']
  },
  {
    id: 'greedy',
    name: 'Algoritmos Voraces',
    icon: '💡',
    algoIds: ['coin-change', 'fractional-knapsack', 'kruskal', 'prim']
  },
  {
    id: 'backtracking',
    name: 'Vuelta Atrás',
    icon: '🔄',
    algoIds: ['n-queens', 'permutations']
  },
  {
    id: 'branch-bound',
    name: 'Ramificación y Poda',
    icon: '✂️',
    algoIds: ['knapsack-bb']
  }
];

/* ════════════════════════════════════════════════════════════════
   REGISTRO GLOBAL DE ALGORITMOS
════════════════════════════════════════════════════════════════ */
const ALGORITHMS = {
  'binary-search':         ALGO_BINARY_SEARCH,
  'merge-sort':            ALGO_MERGE_SORT,
  'quick-sort':            ALGO_QUICK_SORT,
  'quick-select':          ALGO_QUICK_SELECT,
  'hanoi':                 ALGO_HANOI,
  'fibonacci':             ALGO_FIBONACCI,
  'binomial-coeff':        ALGO_BINOMIAL,
  'knapsack-01':           ALGO_KNAPSACK,
  'rod-cutting':           ALGO_ROD_CUTTING,
  'coin-change':           ALGO_COIN_CHANGE,
  'fractional-knapsack':   ALGO_FRAC_KNAPSACK,
  'kruskal':               ALGO_KRUSKAL,
  'prim':                  ALGO_PRIM,
  'n-queens':              ALGO_N_QUEENS,
  'permutations':          ALGO_PERMUTATIONS,
  'knapsack-bb':           ALGO_KNAPSACK_BB,
};

/* ════════════════════════════════════════════════════════════════
   CLASE PRINCIPAL DE LA APLICACIÓN
   Gestiona la UI, selección de algoritmos y la reproducción
════════════════════════════════════════════════════════════════ */
class AlgoVisualApp {
  constructor() {
    // Estado
    this.algo        = null;   // algoritmo activo
    this.steps       = [];     // pasos pre-calculados
    this.stepIdx     = 0;      // paso actual
    this.playing     = false;  // ¿reproducción automática activa?
    this.timer       = null;   // setInterval para auto-play
    this.isPracticaMode = false;
    // Velocidad: índice slider → ms entre pasos
    this.speedMap    = { 1: 2200, 2: 1300, 3: 700, 4: 380, 5: 150 };

    this._initDOM();
    this._buildSidebar();
    this._buildWelcome();
    this._bindControls();
  }

  /* ── Cachear referencias al DOM ── */
  _initDOM() {
    const $ = id => document.getElementById(id);
    this.dom = {
      welcome:     $('welcomeScreen'),
      welcomePractica: $('welcomePractica'),
      algoView:    $('algoView'),
      practicaView:$('practicaView'),
      sidebarNav:  $('sidebarNav'),
      sidebarNavPractica: $('sidebarNavPractica'),
      welcomeCats: $('welcomeCategories'),
      searchInput: $('searchInput'),
      
      // Teoria IDs
      bcCat:       $('bcCategory'),
      bcAlgo:      $('bcAlgo'),
      badges:      $('complexityBadges'),
      infoCard:    $('infoCard'),
      canvas:      $('visualizerCanvas'),
      counter:     $('stepCounter'),
      stepText:    $('stepText'),
      
      // Practica IDs
      bcPracticaCat: $('bcPracticaCat'),
      bcPracticaTitle: $('bcPracticaTitle'),
      practicaBadges: $('practicaBadges'),
      practicaInfo: $('practicaInfo'),
      practicaCanvas: $('practicaCanvas'),
      practicaCounter: $('practicaStepCounter'),
      
      // Controls (Teoría)
      btnReset:    $('btnReset'),
      btnPrev:     $('btnPrev'),
      btnPlay:     $('btnPlayPause'),
      btnNext:     $('btnNext'),
      speed:       $('speedSlider'),
      speedVal:    $('speedValue'),
      playIcon:    $('playIcon'),
      pauseIcon:   $('pauseIcon'),
      playLabel:   $('playLabel'),

      // Controls (Práctica)
      pBtnReset:   $('pBtnReset'),
      pBtnPrev:    $('pBtnPrev'),
      pBtnPlay:    $('pBtnPlayPause'),
      pBtnNext:    $('pBtnNext'),
      pSpeed:      $('pSpeedSlider'),
      pSpeedVal:   $('pSpeedValue'),
      pPlayIcon:   $('pPlayIcon'),
      pPauseIcon:  $('pPauseIcon'),
      pPlayLabel:  $('pPlayLabel'),
    };
  }

  /* ── Construir el menú lateral con categorías y algoritmos ── */
  _buildSidebar() {
    this.dom.sidebarNav.innerHTML = '';
    this.dom.sidebarNavPractica.innerHTML = '';
    
    const buildNav = (categoriesData, algorithmsData, container) => {
      categoriesData.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'nav-category';

        const algosHTML = cat.algoIds.map(id => {
          const a = algorithmsData[id]; if (!a) return '';
          return `<div class="nav-item" data-id="${id}" data-is-practica="${algorithmsData === PRACTICAS_DATA}" role="button" tabindex="0">${
            ''}<div class="nav-item-dot"></div>${a.shortName}</div>`;
        }).join('');

        div.innerHTML = `
          <div class="nav-category-header">
            <span class="category-icon">${cat.icon}</span>
            <span>${cat.name}</span>
            <svg class="category-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <div class="nav-category-items">${algosHTML}</div>`;

        div.querySelectorAll('.nav-item').forEach(el => {
          el.addEventListener('click', () => this.loadAlgorithm(el.dataset.id, el.dataset.isPractica === 'true'));
          el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') this.loadAlgorithm(el.dataset.id, el.dataset.isPractica === 'true'); });
        });

        container.appendChild(div);

        const header = div.querySelector('.nav-category-header');
        const items  = div.querySelector('.nav-category-items');
        // Todas empiezan colapsadas; se abren con un solo clic (altura calculada al vuelo)
        div.classList.add('collapsed');
        items.style.maxHeight = '0';
        header.addEventListener('click', () => {
          const abrir = div.classList.contains('collapsed');
          // Acordeón: cerrar todas las secciones de este menú
          container.querySelectorAll('.nav-category').forEach(otra => {
            otra.classList.add('collapsed');
            const oi = otra.querySelector('.nav-category-items');
            if (oi) oi.style.maxHeight = '0';
          });
          // Abrir esta si estaba cerrada (si ya estaba abierta, queda cerrada)
          if (abrir) {
            div.classList.remove('collapsed');
            items.style.maxHeight = items.scrollHeight + 'px';
          }
        });
      });
    };

    buildNav(CATEGORIES, ALGORITHMS, this.dom.sidebarNav);
    buildNav(PRACTICAS, PRACTICAS_DATA, this.dom.sidebarNavPractica);

    // Abrir por defecto la primera categoría de Teoría (su menú es visible al cargar)
    const primera = this.dom.sidebarNav.querySelector('.nav-category');
    if (primera) {
      primera.classList.remove('collapsed');
      const pi = primera.querySelector('.nav-category-items');
      if (pi) pi.style.maxHeight = pi.scrollHeight + 'px';
    }
  }

  /* ── Construir tarjetas de bienvenida ── */
  _buildWelcome() {
    // Actualizar contador total
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
          <div class="welcome-cat-count">${cat.algoIds.length} algoritmos</div>
          <div class="welcome-cat-algos">${names.join(' · ')}</div>
        </div>`;
    }).join('');

    this.dom.welcomeCats.querySelectorAll('.welcome-cat-card').forEach(card => {
      card.addEventListener('click', () => this.loadAlgorithm(card.dataset.first));
      card.addEventListener('keydown', e => { if (e.key === 'Enter') this.loadAlgorithm(card.dataset.first); });
    });
  }

  /* ── Conectar todos los controles ── */
  _bindControls() {
    this.dom.btnPrev.addEventListener('click',  () => this._prev());
    this.dom.btnNext.addEventListener('click',  () => this._next());
    this.dom.btnReset.addEventListener('click', () => this._reset());
    this.dom.btnPlay.addEventListener('click',  () => this._togglePlay());

    this.dom.speed.addEventListener('input', e => {
      this.dom.speedVal.textContent = e.target.value + '×';
      if (this.playing) { this._stopPlay(); this._startPlay(); }
    });

    // Controles de la vista de Prácticas (mismos manejadores, estado compartido)
    if (this.dom.pBtnPrev)  this.dom.pBtnPrev.addEventListener('click',  () => this._prev());
    if (this.dom.pBtnNext)  this.dom.pBtnNext.addEventListener('click',  () => this._next());
    if (this.dom.pBtnReset) this.dom.pBtnReset.addEventListener('click', () => this._reset());
    if (this.dom.pBtnPlay)  this.dom.pBtnPlay.addEventListener('click',  () => this._togglePlay());
    if (this.dom.pSpeed) {
      this.dom.pSpeed.addEventListener('input', e => {
        if (this.dom.pSpeedVal) this.dom.pSpeedVal.textContent = e.target.value + '×';
        if (this.playing) { this._stopPlay(); this._startPlay(); }
      });
    }

    // Búsqueda en tiempo real (el input es opcional)
    if (this.dom.searchInput) {
      this.dom.searchInput.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('.nav-item').forEach(el => {
          const a = ALGORITHMS[el.dataset.id];
          if (!a) return;
          const match = !q || a.name.toLowerCase().includes(q) || a.shortName.toLowerCase().includes(q);
          el.style.display = match ? '' : 'none';
        });
      });
    }

    // Teclado global: ← → Espacio
    document.addEventListener('keydown', e => {
      if (!this.algo || ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); this._next(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); this._prev(); }
      if (e.key === ' ')          { e.preventDefault(); this._togglePlay(); }
    });
  }

  /* ════════════════════════════════════════════════════════════════
     CARGA Y RENDERIZADO DE ALGORITMOS
  ════════════════════════════════════════════════════════════════ */

  /** Carga un algoritmo por su id y prepara la visualización */
  loadAlgorithm(id, isPractica = false) {
    const algo = isPractica ? PRACTICAS_DATA[id] : ALGORITHMS[id]; if (!algo) return;
    this.isPracticaMode = isPractica;

    // Detener reproducción anterior
    this._stopPlay();

    // Marcar activo en sidebar
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-id="${id}"]`);
    if (navItem) {
      navItem.classList.add('active');
      const catDiv = navItem.closest('.nav-category');
      const nav = catDiv ? catDiv.parentElement : null;
      if (catDiv && nav) {
        // Acordeón: abrir la categoría del algoritmo y cerrar las demás de su menú
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

    if (isPractica) {
      this.dom.welcomePractica.style.display  = 'none';
      this.dom.practicaView.style.display = 'block';
      
      const cat = PRACTICAS.find(c => c.algoIds.includes(id));
      this.dom.bcPracticaCat.textContent  = cat ? cat.name : '';
      this.dom.bcPracticaTitle.textContent = algo.name;

      this.dom.practicaBadges.innerHTML = `
        <span class="badge badge-time">⏱ ${algo.timeComplexity}</span>
        <span class="badge badge-space">💾 ${algo.spaceComplexity}</span>`;

      this.dom.practicaInfo.innerHTML = `
        <div class="info-card-title">${algo.name}</div>
        <p class="info-card-desc">${algo.description}</p>
        ${algo.detailedText ? algo.detailedText : ''}
        <div class="info-card-details" style="margin-top:15px;">
          <div class="info-detail">
            <div class="info-detail-label">Tiempo</div>
            <div class="info-detail-value">${algo.timeComplexity}</div>
          </div>
          <div class="info-detail">
            <div class="info-detail-label">Espacio</div>
            <div class="info-detail-value">${algo.spaceComplexity}</div>
          </div>
        </div>`;
    } else {
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
          ${algo.useCases ? `
          <div class="info-detail" style="flex:1">
            <div class="info-detail-label">Casos de uso</div>
            <div class="info-detail-value" style="font-size:.76rem;white-space:normal;font-family:Inter">${algo.useCases}</div>
          </div>` : ''}
        </div>`;
    }

    this.steps   = algo.generateSteps();
    this.stepIdx = 0;
    this._render();
    this._updateControls();
  }

  /* ── Renderizar el paso actual ── */
  _render() {
    if (!this.algo || !this.steps.length) return;
    const step = this.steps[this.stepIdx];
    
    const canvas = this.isPracticaMode ? this.dom.practicaCanvas : this.dom.canvas;
    const counter = this.isPracticaMode ? this.dom.practicaCounter : this.dom.counter;
    
    // Animación de entrada
    canvas.classList.remove('fade-in');
    void canvas.offsetWidth; // force reflow
    canvas.classList.add('fade-in');

    // Delegar a la función render del algoritmo activo
    this.algo.render(canvas, step);

    // Contador y texto
    if (counter) counter.textContent = `Paso ${this.stepIdx + 1} / ${this.steps.length}`;
    if (!this.isPracticaMode && this.dom.stepText) this.dom.stepText.innerHTML = step.desc || '';
  }

  /* ── Grupos de controles (Teoría + Práctica) ── */
  _controlGroups() {
    return [
      { prev: this.dom.btnPrev,  next: this.dom.btnNext,  playIcon: this.dom.playIcon,  pauseIcon: this.dom.pauseIcon,  playLabel: this.dom.playLabel },
      { prev: this.dom.pBtnPrev, next: this.dom.pBtnNext, playIcon: this.dom.pPlayIcon, pauseIcon: this.dom.pPauseIcon, playLabel: this.dom.pPlayLabel },
    ];
  }

  /* ── Actualizar estado de los botones ── */
  _updateControls() {
    const atStart = this.stepIdx <= 0;
    const atEnd   = this.stepIdx >= this.steps.length - 1;
    this._controlGroups().forEach(g => {
      if (g.prev) g.prev.disabled = atStart;
      if (g.next) g.next.disabled = atEnd;
    });
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

  _togglePlay() {
    this.playing ? this._stopPlay() : this._startPlay();
  }

  _startPlay() {
    if (this.stepIdx >= this.steps.length - 1) this._reset();
    this.playing = true;
    this._controlGroups().forEach(g => {
      if (g.playIcon)  g.playIcon.style.display  = 'none';
      if (g.pauseIcon) g.pauseIcon.style.display = '';
      if (g.playLabel) g.playLabel.textContent   = 'Pausar';
    });
    const slider = this.isPracticaMode ? this.dom.pSpeed : this.dom.speed;
    const delay = this.speedMap[+(slider ? slider.value : 3)] || 700;
    this.timer = setInterval(() => {
      if (this.stepIdx >= this.steps.length - 1) { this._stopPlay(); return; }
      this._next();
    }, delay);
  }

  _stopPlay() {
    this.playing = false;
    clearInterval(this.timer);
    this._controlGroups().forEach(g => {
      if (g.playIcon)  g.playIcon.style.display  = '';
      if (g.pauseIcon) g.pauseIcon.style.display = 'none';
      if (g.playLabel) g.playLabel.textContent   = 'Reproducir';
    });
  }
}

/* ════════════════════════════════════════════════════════════════
   PUNTO DE ENTRADA
════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AlgoVisualApp();
});
