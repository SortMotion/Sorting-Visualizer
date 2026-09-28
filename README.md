# Sorting Visualizer
**Integrantes:**
- Andy Plaza Cardenas
- Adriel Ordaz Bravo
- Diego Hernandez Muñoz

## Descripción
- SPA (una sola página) que anima algoritmos de ordenamiento en un `<canvas>`.
- Algoritmos v1: Bubble, Selection, Insertion, Exchange, Gnome, Merge, Quick Sort y Stooge Sort.
- Layout: barra superior (selector de algoritmo) → canvas central (animación) → barra inferior (cantidad de elementos, randomizar, ordenar, controles tipo video: play/pause/velocidad/retroceder).
- Stack: Vite + React + TypeScript, Tailwind CSS, Zustand, desplegado en Vercel.

## Tecnologías Utilizadas
- Vite
- React
- TypeScript
- Tailwind CSS
- Zustand
- Vercel

## Uso de IA (Cada una fue utilizada para generar código, organizar y mejorar la documentación y corregir errores)
- Gemini
- Claude
- ChatGPT

## Requisitos

- Node.js **v26.8.2** — verifica con `node -v`. Si no coincide, instálala desde https://nodejs.org/ o con [nvm](https://github.com/nvm-sh/nvm).
- npm (incluido con Node) y Git.

## Cómo empezar

1. Clona el repo:
   ```bash
   git clone https://github.com/SortMotion/Sorting-Visualizer.git
   cd Sorting-Visualizer
   ```
2. Instala dependencias (ya viene todo configurado: Tailwind v4, Zustand, ESLint + Prettier):
   ```bash
   npm install
   ```
3. Levanta el servidor de desarrollo para confirmar que todo corre:
   ```bash
   npm run dev
   ```
   Abre la URL que muestre la terminal
4. **Antes de tocar código**, lee `Arquitectura.md` (raíz del repo): ahí están los contratos (`src/algorithms/types.ts` con `SortStep` y `SortAlgorithm`, los stores de Zustand) que todos debemos respetar para integrar el trabajo de cada quien sin bloquearnos.
5. Crea tu branch a partir de `main`, según la tarea que tengas asignada en el board:
   ```bash
   git checkout -b feature/<nombre-de-tu-tarea>
   ```
   Ejemplos: `feature/quick-sort`, `feature/topbar`, `feature/gnome-sort`.

## Al terminar tu parte

```bash
npm run lint
git add .
git commit -m "feat: <descripción corta>"
git push -u origin feature/<nombre-de-tu-tarea>
```

- Mensajes de commit en formato [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (`feat:`, `fix:`, `docs:`, `chore:`).
- Abre un Pull Request hacia `main`. La rama `main` está protegida: se requiere mínimo 1 aprobación y resolver todas las conversaciones antes de mergear.
- Mueve tu tarjeta del board: `In Progress` al empezar → `In Review` al abrir el PR → `Done` al mergear.

## Aprendizajes y Conclusiones
**Conclusión**

El desarrollo de SortMotion nos permitió comprender que la claridad en el diseño de una arquitectura es tan importante como la correcta implementación de los algoritmos. Al separar la lógica de ordenamiento de su representación visual mediante funciones generadoras que emiten eventos `SortStep`, logramos que un reproductor independiente pudiera recorrer, pausar, retroceder y acelerar la ejecución sin modificar el código de cada algoritmo. Esta decisión de diseño nos mostró de forma práctica el valor de la separación de responsabilidades y del desacoplamiento entre módulos.

Asimismo, la visualización de los algoritmos nos ayudó a consolidar conceptos teóricos de la asignatura. Observar en paralelo el comportamiento de Quick Sort, Bubble Sort y Stooge Sort sobre los mismos datos nos permitió contrastar de manera tangible las complejidades O(n log n), O(n²) y O(n^2.71), así como distinguir diferencias sutiles entre algoritmos similares, como Selection Sort y Exchange Sort, que comparten el mismo número de comparaciones pero difieren en la cantidad de intercambios.

En el aspecto técnico, enfrentamos retos de rendimiento que nos llevaron a implementar soluciones como los checkpoints de estado y las métricas acumuladas precalculadas, evitando que la interfaz se congelara con algoritmos de gran cantidad de pasos. Finalmente, la definición temprana de contratos entre módulos, el uso de ramas, Pull Requests y revisiones de código nos permitió trabajar de forma paralela y organizada, y el análisis crítico de las limitaciones del sistema, como el pivote fijo en Quick Sort o el consumo de memoria en arreglos grandes, reforzó nuestra capacidad de evaluar y proponer mejoras a nuestro propio trabajo.
