# CLAUDE.md

Guía para trabajar en este repositorio. El contenido de la interfaz está en **español**; mantén ese idioma en todo lo que sea visible para el usuario.

## Qué es este proyecto

**UniCode / Informatica Esquemas UA** es un sitio web **estático** que agrupa esquemas, apuntes y *visualizadores interactivos* de las asignaturas del grado de Ingeniería Informática (Universidad de Alicante).

Está pensado como un **hub**: una página índice lista las asignaturas por curso y semestre, y cada asignatura disponible enlaza a su propia mini-aplicación dentro de `subjects/`.

- La página raíz ([index.html](index.html)) es el índice de asignaturas. Casi todas aparecen como *"No disponible"* (muestran un aviso *toast*); solo las marcadas como **Disponible** enlazan a contenido real.
- Única asignatura implementada a día de hoy: **ADA — Análisis y Diseño de Algoritmos** (2º curso), en [subjects/ADA/](subjects/ADA/). Es una app llamada **AlgoVisual** que anima algoritmos y prácticas paso a paso.

## Stack y cómo ejecutarlo

- **HTML + CSS + JavaScript vanilla.** Sin framework, sin bundler, sin `package.json`, sin dependencias npm. No hay paso de *build*.
- Única dependencia externa: fuentes de Google Fonts (Inter y JetBrains Mono) cargadas por `<link>`. Todo lo demás es local.
- **Para ejecutar:** abre [index.html](index.html) en el navegador, o sirve la carpeta con un servidor estático (p. ej. `python -m http.server`). Se recomienda un servidor local porque las apps de asignatura cargan varios `.js` por rutas relativas.
- **No hay tests, linter ni CI.** La verificación es manual en el navegador.

## Estructura

```
.
├── index.html          # Índice de asignaturas (hub raíz)
├── script.js           # Pestañas de curso + toast "no disponible"
├── styles.css           # Estilos del hub
└── subjects/
    └── ADA/            # App AlgoVisual (Análisis y Diseño de Algoritmos)
        ├── index.html          # Layout: sidebar + visualizador; toggle Teoría/Práctica
        ├── script.js           # Motor AlgoVisualApp (reproducción, controles, sidebar)
        ├── algoritmos_data.js  # Datos de los algoritmos de TEORÍA + helpers compartidos
        ├── practicas_data.js   # Datos de las PRÁCTICAS (usa helpers de algoritmos_data.js)
        └── styles.css
```

El hub raíz y cada asignatura son independientes: comparten estética pero **no comparten código** (el `script.js`/`styles.css` de la raíz no es el de ADA).

## Arquitectura de una app de asignatura (AlgoVisual, ADA)

El patrón central es un **motor de reproducción genérico** que consume "algoritmos" descritos como datos. Vale la pena entenderlo antes de tocar ADA:

- **Cada algoritmo/práctica es un objeto** con la forma:
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
- **`AlgoVisualApp`** (en [subjects/ADA/script.js](subjects/ADA/script.js)) es la clase que orquesta todo: construye el menú lateral, carga un algoritmo, guarda `steps`/`stepIdx`, y maneja play/pausa/siguiente/anterior/reset/velocidad y atajos de teclado (`←` `→` `Espacio`).

### Registro y categorías

- **Teoría** ([algoritmos_data.js](subjects/ADA/algoritmos_data.js)): cada algoritmo se define como `const ALGO_XXX = {...}` y se registra en el objeto `ALGORITHMS` de [script.js](subjects/ADA/script.js). Las agrupaciones del menú están en el array `CATEGORIES` (Divide y Vencerás, Programación Dinámica, Voraces, Vuelta Atrás, Ramificación y Poda), donde cada categoría lista los `algoIds` que contiene.
- **Práctica** ([practicas_data.js](subjects/ADA/practicas_data.js)): mismo patrón con `PRACTICAS` (categorías) y `PRACTICAS_DATA` (objetos indexados por id). Las prácticas actuales resuelven **el mismo laberinto** (`MAZE`) con cinco técnicas distintas —fuerza bruta, memoización, backtracking, voraz y ramificación y poda— más un Bubble Sort.
- Helpers compartidos `legend(...)` y `clone2D(...)` se definen en `algoritmos_data.js` y también los usa `practicas_data.js` (por eso el orden de los `<script>` en el HTML importa: `algoritmos_data.js` va antes que `practicas_data.js`).

## Cómo añadir contenido

**Añadir un algoritmo de teoría a ADA:**
1. En [algoritmos_data.js](subjects/ADA/algoritmos_data.js), define `const ALGO_NUEVO = { ... }` con `generateSteps()` y `render()`.
2. En [script.js](subjects/ADA/script.js), regístralo en `ALGORITHMS` con su `id`.
3. Añade su `id` a los `algoIds` de la categoría correspondiente en `CATEGORIES`.
   (Los contadores de la pantalla de bienvenida se calculan solos desde `ALGORITHMS`/`CATEGORIES`.)

**Añadir una práctica:** igual, pero en [practicas_data.js](subjects/ADA/practicas_data.js) usando `PRACTICAS_DATA` y `PRACTICAS`.

**Marcar/añadir una asignatura como disponible en el hub:** en [index.html](index.html), edita el `<a class="subject-item ...">` correspondiente: pon `href` a `subjects/<CODIGO>/index.html`, quita la clase `muted`/el `onclick="showToast"`, añade la clase `active` y cambia el badge a `<span class="status-badge ready">Disponible</span>`.

**Crear una asignatura nueva:** duplica la estructura de `subjects/ADA/` en `subjects/<CODIGO>/` y adáptala. El enlace de vuelta al hub apunta a `../../index.html`.

## Convenciones

- Todo el texto de UI, comentarios y nombres de dominio va en **español**.
- Los ficheros CSS usan variables (`:root { --... }`) y separadores de sección con líneas `════`. Sigue ese estilo al ampliarlos.
- Los pasos de visualización renderizan HTML como *string* (`innerHTML`), con clases CSS para colorear estados (activo, comparado, ordenado, muro, camino…). Reutiliza las clases y la paleta `C` existentes en lugar de introducir colores sueltos.
- Rutas siempre **relativas**; el sitio debe poder servirse desde cualquier subdirectorio.
