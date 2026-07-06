/* ================================================================
   Sistemas Operativos — script.js
   Visualizador Interactivo de Sistemas Operativos — 2º Curso, 1er Semestre
   ================================================================ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   METADATOS DE CATEGORÍAS
════════════════════════════════════════════════════════════════ */
const CATEGORIES = [
  {
    id: 'procesos',
    name: 'Procesos y Cambio de Contexto',
    icon: '🧬',
    algoIds: ['estados-proceso', 'cambio-contexto', 'procesos-hilos']
  },
  {
    id: 'planificacion',
    name: 'Planificación de CPU',
    icon: '⏱️',
    algoIds: ['fcfs', 'sjf', 'srtf', 'round-robin']
  },
  {
    id: 'memoria',
    name: 'Gestión de Memoria',
    icon: '🧠',
    algoIds: ['particiones', 'paginacion', 'segmentacion']
  },
  {
    id: 'virtual',
    name: 'Memoria Virtual',
    icon: '💾',
    algoIds: ['tlb-pagefault', 'fifo-belady', 'lru', 'clock']
  },
  {
    id: 'io',
    name: 'Entrada/Salida',
    icon: '💿',
    algoIds: ['disk-scheduling']
  }
];

/* ════════════════════════════════════════════════════════════════
   REGISTRO GLOBAL
════════════════════════════════════════════════════════════════ */
const ALGORITHMS = {
  'estados-proceso':  SO_ESTADOS,
  'cambio-contexto':  SO_CONTEXTO,
  'procesos-hilos':   SO_HILOS,
  'fcfs':             SO_FCFS,
  'sjf':              SO_SJF,
  'srtf':             SO_SRTF,
  'round-robin':      SO_RR,
  'particiones':      SO_PARTICIONES,
  'paginacion':       SO_PAGINACION,
  'segmentacion':     SO_SEGMENTACION,
  'tlb-pagefault':    SO_TLB,
  'fifo-belady':      SO_FIFO,
  'lru':              SO_LRU,
  'clock':            SO_CLOCK,
  'disk-scheduling':  SO_DISK,
};

/* ════════════════════════════════════════════════════════════════
   CLASE PRINCIPAL
════════════════════════════════════════════════════════════════ */
class SOApp {
  constructor() {
    this.algo        = null;
    this.steps       = [];
    this.stepIdx     = 0;
    this.playing     = false;
    this.timer       = null;
    this.isPracticaMode = false;
    this.speedMap    = { 1: 2200, 2: 1300, 3: 700, 4: 380, 5: 150 };

    this._initDOM();
    this._buildSidebar();
    this._buildWelcome();
    this._bindControls();
  }

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

      bcCat:       $('bcCategory'),
      bcAlgo:      $('bcAlgo'),
      badges:      $('complexityBadges'),
      infoCard:    $('infoCard'),
      canvas:      $('visualizerCanvas'),
      counter:     $('stepCounter'),
      stepText:    $('stepText'),

      bcPracticaCat: $('bcPracticaCat'),
      bcPracticaTitle: $('bcPracticaTitle'),
      practicaBadges: $('practicaBadges'),
      practicaInfo: $('practicaInfo'),
      practicaCanvas: $('practicaCanvas'),
      practicaCounter: $('practicaStepCounter'),
      practicaStepText: $('practicaStepText'),

      btnReset:    $('btnReset'),
      btnPrev:     $('btnPrev'),
      btnPlay:     $('btnPlayPause'),
      btnNext:     $('btnNext'),
      speed:       $('speedSlider'),
      speedVal:    $('speedValue'),
      playIcon:    $('playIcon'),
      pauseIcon:   $('pauseIcon'),
      playLabel:   $('playLabel'),

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

  _buildSidebar() {
    this.dom.sidebarNav.innerHTML = '';
    this.dom.sidebarNavPractica.innerHTML = '';

    const buildNav = (categoriesData, algorithmsData, container) => {
      categoriesData.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'nav-category';

        const algosHTML = cat.algoIds.map(id => {
          const a = algorithmsData[id]; if (!a) return '';
          return `<div class="nav-item" data-id="${id}" data-is-practica="${algorithmsData === PRACTICAS_DATA}" role="button" tabindex="0"><div class="nav-item-dot"></div>${a.shortName}</div>`;
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
    };

    buildNav(CATEGORIES, ALGORITHMS, this.dom.sidebarNav);
    buildNav(PRACTICAS, PRACTICAS_DATA, this.dom.sidebarNavPractica);

    const primera = this.dom.sidebarNav.querySelector('.nav-category');
    if (primera) {
      primera.classList.remove('collapsed');
      const pi = primera.querySelector('.nav-category-items');
      if (pi) pi.style.maxHeight = pi.scrollHeight + 'px';
    }
  }

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

  _bindControls() {
    this.dom.btnPrev.addEventListener('click',  () => this._prev());
    this.dom.btnNext.addEventListener('click',  () => this._next());
    this.dom.btnReset.addEventListener('click', () => this._reset());
    this.dom.btnPlay.addEventListener('click',  () => this._togglePlay());

    this.dom.speed.addEventListener('input', e => {
      this.dom.speedVal.textContent = e.target.value + '×';
      if (this.playing) { this._stopPlay(); this._startPlay(); }
    });

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

    document.addEventListener('keydown', e => {
      if (!this.algo || ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); this._next(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); this._prev(); }
      if (e.key === ' ')          { e.preventDefault(); this._togglePlay(); }
    });
  }

  loadAlgorithm(id, isPractica = false) {
    const algo = isPractica ? PRACTICAS_DATA[id] : ALGORITHMS[id]; if (!algo) return;
    this.isPracticaMode = isPractica;

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

    const topic = algo.topic || algo.timeComplexity || '—';
    const kind = algo.kind || algo.spaceComplexity || '—';

    if (isPractica) {
      this.dom.welcomePractica.style.display  = 'none';
      this.dom.practicaView.style.display = 'flex';

      const cat = PRACTICAS.find(c => c.algoIds.includes(id));
      this.dom.bcPracticaCat.textContent  = cat ? cat.name : '';
      this.dom.bcPracticaTitle.textContent = algo.name;

      this.dom.practicaBadges.innerHTML = `
        <span class="badge badge-topic">🧪 ${topic}</span>
        <span class="badge badge-kind">🔧 ${kind}</span>`;

      this.dom.practicaInfo.innerHTML = `
        <div class="info-card-title">${algo.name}</div>
        <p class="info-card-desc">${algo.description}</p>
        ${algo.detailedText ? algo.detailedText : ''}
        <div class="info-card-details" style="margin-top:15px;">
          <div class="info-detail">
            <div class="info-detail-label">Práctica</div>
            <div class="info-detail-value">${topic}</div>
          </div>
          <div class="info-detail">
            <div class="info-detail-label">Herramientas</div>
            <div class="info-detail-value">${kind}</div>
          </div>
          ${algo.useCases ? `
          <div class="info-detail" style="flex:1">
            <div class="info-detail-label">Sistema</div>
            <div class="info-detail-value" style="font-size:.76rem;white-space:normal;font-family:Inter">${algo.useCases}</div>
          </div>` : ''}
        </div>`;
    } else {
      this.dom.welcome.style.display  = 'none';
      this.dom.algoView.style.display = 'flex';

      const cat = CATEGORIES.find(c => c.algoIds.includes(id));
      this.dom.bcCat.textContent  = cat ? cat.name : '';
      this.dom.bcAlgo.textContent = algo.name;

      this.dom.badges.innerHTML = `
        <span class="badge badge-topic">📚 ${topic}</span>
        <span class="badge badge-kind">🔧 ${kind}</span>`;

      this.dom.infoCard.innerHTML = `
        <div class="info-card-title">${algo.name}</div>
        <p class="info-card-desc">${algo.description}</p>
        ${algo.detailedText ? algo.detailedText : ''}
        <div class="info-card-details">
          <div class="info-detail">
            <div class="info-detail-label">Tema</div>
            <div class="info-detail-value">${topic}</div>
          </div>
          <div class="info-detail">
            <div class="info-detail-label">Tipo</div>
            <div class="info-detail-value">${kind}</div>
          </div>
          ${algo.useCases ? `
          <div class="info-detail" style="flex:1">
            <div class="info-detail-label">SO donde aparece</div>
            <div class="info-detail-value" style="font-size:.76rem;white-space:normal;font-family:Inter">${algo.useCases}</div>
          </div>` : ''}
        </div>`;
    }

    this.steps   = algo.generateSteps();
    this.stepIdx = 0;
    this._render();
    this._updateControls();
  }

  _render() {
    if (!this.algo || !this.steps.length) return;
    const step = this.steps[this.stepIdx];

    const canvas = this.isPracticaMode ? this.dom.practicaCanvas : this.dom.canvas;
    const counter = this.isPracticaMode ? this.dom.practicaCounter : this.dom.counter;
    const stepText = this.isPracticaMode ? this.dom.practicaStepText : this.dom.stepText;

    canvas.classList.remove('fade-in');
    void canvas.offsetWidth;
    canvas.classList.add('fade-in');

    this.algo.render(canvas, step);

    if (counter) counter.textContent = `Paso ${this.stepIdx + 1} / ${this.steps.length}`;
    if (stepText) stepText.innerHTML = step.desc || '';
  }

  _controlGroups() {
    return [
      { prev: this.dom.btnPrev,  next: this.dom.btnNext,  playIcon: this.dom.playIcon,  pauseIcon: this.dom.pauseIcon,  playLabel: this.dom.playLabel },
      { prev: this.dom.pBtnPrev, next: this.dom.pBtnNext, playIcon: this.dom.pPlayIcon, pauseIcon: this.dom.pPauseIcon, playLabel: this.dom.pPlayLabel },
    ];
  }

  _updateControls() {
    const atStart = this.stepIdx <= 0;
    const atEnd   = this.stepIdx >= this.steps.length - 1;
    this._controlGroups().forEach(g => {
      if (g.prev) g.prev.disabled = atStart;
      if (g.next) g.next.disabled = atEnd;
    });
  }

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

document.addEventListener('DOMContentLoaded', () => {
  window.app = new SOApp();
});
