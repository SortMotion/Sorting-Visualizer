# Sorting Visualizer
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
