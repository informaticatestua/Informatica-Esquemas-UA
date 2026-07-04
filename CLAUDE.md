# CLAUDE.md

Guía para trabajar en este repositorio. El contenido de la interfaz está en **español**; mantén ese idioma en todo lo que sea visible para el usuario.

## Qué es este proyecto

**Informatica Esquemas UA** es un sitio web **estático** que agrupa esquemas, apuntes y *visualizadores interactivos* de las asignaturas del grado de Ingeniería Informática (Universidad de Alicante).

Está pensado como un **hub**: una página índice lista las asignaturas por curso y semestre, y cada asignatura disponible enlaza a su propia mini-aplicación dentro de `subjects/`.

- La página raíz ([index.html](index.html)) es el índice de asignaturas. La mayoría aparecen como *"Próximamente"* (muestran un aviso *toast*); solo las marcadas como **Disponible** enlazan a contenido real.
- Asignaturas implementadas a día de hoy (ambas de 2º curso):
  - **ADA — Análisis y Diseño de Algoritmos**, en [subjects/ADA/](subjects/ADA/). App **AlgoVisual** que anima algoritmos de teoría y prácticas paso a paso.
  - **PED — Programación y Estructura de Datos**, en [subjects/PED/](subjects/PED/). App que anima estructuras de datos (árboles, hash, montículos, grafos…) y sus operaciones paso a paso.

## Stack y cómo ejecutarlo

- **HTML + CSS + JavaScript vanilla.** Sin framework, sin bundler, sin `package.json`, sin dependencias npm. No hay paso de *build*.
- Única dependencia externa: fuentes de Google Fonts (Inter y JetBrains Mono) cargadas por `<link>`. Todo lo demás es local.
- El sitio se despliega en **Vercel** (incluye su script de Web Analytics en [index.html](index.html)).
- **Para ejecutar:** abre [index.html](index.html) en el navegador, o sirve la carpeta con un servidor estático (p. ej. `python -m http.server`). Se recomienda un servidor local porque las apps de asignatura cargan varios `.js` por rutas relativas.
- **No hay tests, linter ni CI.** La verificación es manual en el navegador.

## Estructura

```
.
├── index.html          # Índice de asignaturas (hub raíz)
├── script.js           # Pestañas de curso + toast "no disponible"
├── styles.css          # Estilos del hub
└── subjects/
    ├── ADA/            # App AlgoVisual (Análisis y Diseño de Algoritmos)
    │   ├── index.html          # Layout: sidebar + visualizador; toggle Teoría/Práctica
    │   ├── script.js           # Motor AlgoVisualApp (reproducción, controles, sidebar)
    │   ├── algoritmos_data.js  # Datos de los algoritmos de TEORÍA + helpers compartidos
    │   ├── practicas_data.js   # Datos de las PRÁCTICAS (usa helpers de algoritmos_data.js)
    │   └── styles.css
    └── PED/            # App de Estructuras de Datos (Programación y Estructura de Datos)
        ├── index.html          # Layout: sidebar + visualizador
        ├── script.js           # Motor EstructurasApp (reproducción, controles, sidebar)
        ├── estructuras_data.js # Datos de las estructuras + helpers propios (legend, C…)
        └── styles.css
```

El hub raíz y cada asignatura son independientes: comparten estética pero **no comparten código** (cada carpeta tiene su propio `script.js`/`styles.css`).

## Arquitectura de una app de asignatura

Tanto ADA como PED siguen el **mismo patrón**: un **motor de reproducción genérico** que consume "algoritmos" (o estructuras) descritos como datos. Vale la pena entenderlo antes de tocar cualquiera de las dos:

- **Cada algoritmo/estructura es un objeto** con la forma:
  ```js
  {
    id, name, shortName,
    timeComplexity, spaceComplexity,
    description, detailedText, useCases,   // texto informativo (HTML)
    generateSteps(),                        // → array de "pasos" precalculados
    render(container, step)                 // pinta UN paso concreto en el DOM
  }
  ```
- **`generateSteps()` precalcula TODOS los pasos por adelantado.** Cada paso es un objeto de estado que incluye una descripción `desc` (HTML). Esto permite avanzar y retroceder sin recomputar nada.
- **`render(container, step)`** es una función pura de pintado: dado un paso, escribe el `innerHTML` del canvas. No guarda estado propio.
- **La clase orquestadora** (`AlgoVisualApp` en [subjects/ADA/script.js](subjects/ADA/script.js), `EstructurasApp` en [subjects/PED/script.js](subjects/PED/script.js)) construye el menú lateral, carga un algoritmo, guarda `steps`/`stepIdx`, y maneja play/pausa/siguiente/anterior/reset/velocidad y atajos de teclado (`←` `→` `Espacio`).

### Registro y categorías

En ambas apps, cada visualizador se define como `const ALGO_XXX = {...}`, se registra en el objeto `ALGORITHMS` de su `script.js` y se agrupa en el array `CATEGORIES` (cada categoría lista los `algoIds` que contiene). Los contadores de la pantalla de bienvenida se calculan solos desde `ALGORITHMS`/`CATEGORIES`.

- **ADA — Teoría** ([algoritmos_data.js](subjects/ADA/algoritmos_data.js)): categorías **Divide y Vencerás, Programación Dinámica, Algoritmos Voraces, Vuelta Atrás y Ramificación y Poda**.
- **ADA — Práctica** ([practicas_data.js](subjects/ADA/practicas_data.js)): mismo patrón con `PRACTICAS` (categorías) y `PRACTICAS_DATA` (objetos indexados por id). Las prácticas actuales resuelven **el mismo laberinto** (`MAZE`) con cinco técnicas distintas —fuerza bruta, memoización, backtracking, voraz y ramificación y poda— más un Bubble Sort. ADA alterna entre Teoría y Práctica mediante un *toggle* en su cabecera.
- **PED** ([estructuras_data.js](subjects/PED/estructuras_data.js)): categorías **Árboles Binarios** (recorridos preorden/inorden/postorden/niveles), **Árboles de Búsqueda** (ABB, AVL con rotaciones, árboles 2-3 y 2-3-4), **Conjuntos y Hashing** (dispersión cerrada y abierta), **Colas de Prioridad** (montículos, Heapsort, DEAP) y **Grafos** (matriz de adyacencia, DFS, BFS).

### Helpers compartidos

- En **ADA**, los helpers `legend(...)` y `clone2D(...)` se definen en `algoritmos_data.js` y también los usa `practicas_data.js` (por eso el orden de los `<script>` en el HTML importa: `algoritmos_data.js` va antes que `practicas_data.js`).
- En **PED**, `estructuras_data.js` define sus propios helpers de dibujo (paleta `C`, `legend(...)`, funciones SVG para árboles/heaps/grafos) en el mismo fichero.

## Cómo añadir contenido

**Añadir un algoritmo de teoría a ADA:**
1. En [algoritmos_data.js](subjects/ADA/algoritmos_data.js), define `const ALGO_NUEVO = { ... }` con `generateSteps()` y `render()`.
2. En [script.js](subjects/ADA/script.js), regístralo en `ALGORITHMS` con su `id`.
3. Añade su `id` a los `algoIds` de la categoría correspondiente en `CATEGORIES`.
   (Los contadores de la pantalla de bienvenida se calculan solos desde `ALGORITHMS`/`CATEGORIES`.)

**Añadir una práctica a ADA:** igual, pero en [practicas_data.js](subjects/ADA/practicas_data.js) usando `PRACTICAS_DATA` y `PRACTICAS`.

**Añadir una estructura a PED:** mismo patrón que la teoría de ADA, pero en [estructuras_data.js](subjects/PED/estructuras_data.js) y registrando en el `ALGORITHMS`/`CATEGORIES` de [subjects/PED/script.js](subjects/PED/script.js).

**Marcar/añadir una asignatura como disponible en el hub:** en [index.html](index.html), edita el `<a class="subject-item ...">` correspondiente: pon `href` a `subjects/<CODIGO>/index.html`, quita la clase `muted`/el `onclick="showToast"`, añade la clase `active` y cambia el badge a `<span class="status-badge ready">Disponible</span>`.

**Crear una asignatura nueva:** duplica la estructura de `subjects/ADA/` o `subjects/PED/` en `subjects/<CODIGO>/` y adáptala. El enlace de vuelta al hub apunta a `../../index.html`.

## Convenciones

- Todo el texto de UI, comentarios y nombres de dominio va en **español**.
- El `<title>` de cada página es corto: **"Informatica Esquemas UA"** en el hub raíz y el **código de la asignatura** (p. ej. `ADA`, `PED`) en cada app.
- Los ficheros CSS usan variables (`:root { --... }`) y separadores de sección con líneas `════`. Sigue ese estilo al ampliarlos.
- Los pasos de visualización renderizan HTML como *string* (`innerHTML`), con clases CSS para colorear estados (activo, comparado, ordenado, muro, camino…). Reutiliza las clases y la paleta `C` existentes en lugar de introducir colores sueltos.
- Rutas siempre **relativas**; el sitio debe poder servirse desde cualquier subdirectorio.
