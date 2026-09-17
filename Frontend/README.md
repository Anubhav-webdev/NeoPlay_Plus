# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Project Structure (quick reference)

- `src/` — application source code
	- `components/` — reusable React components grouped by feature (e.g. `Home`, `cards`, `Auth`, `Video`)
	- `constants/` — static data, constants and mock fixtures (e.g. `data.jsx`)
	- `redux/` — Redux store and slices for global state
	- `assets/`, `public/`, `photo&Video/` — images, videos and static files
- `index.html`, `vite.config.js` — Vite entry and configuration

## How to run (frontend)

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Notes: `HomeCreators.jsx` overview and suggestions

- File: `src/components/Home/HomeCreators.jsx`
- Purpose: renders a horizontally-scrollable "Trending Creators" band using `framer-motion` for entrance animations and a small horizontal-scroll hook from `HomeConstants.jsx`.
- Key collaborators:
	- `useHScroll()` (from `HomeConstants.jsx`) — returns a `ref` and `scroll(dir)` helper used by the `ScrollButtons` controls.
	- `ScrollButtons` and `ChannelLabel` (UI primitives in `HomeConstants.jsx`).
	- `CreatorCard` (component at `src/components/cards/CreatorCards.jsx`).
	- Data: `creators` array from `src/constants/data.jsx`.

Recommended improvements / observations

- Accessibility
	- Add `onFocus`/`onBlur` handlers to `ScrollButtons` to mirror the `onMouseEnter`/`onMouseLeave` visual states so keyboard users get the same affordance.
	- Ensure the scroll container is reachable by keyboard (tabindex when appropriate) and consider `aria-live` or `aria-roledescription` if the content updates dynamically.

- Robustness & data shape
	- `CreatorCard` expects some avatar/props, but the `creators` fixture is minimal. Keep a consistent data shape or add defensive fallbacks (already present in the card). Consider centralizing a `Creator` type or PropTypes/TypeScript for clarity.

- Performance & UX
	- The stagger delay `delay: index * 0.04` can result in long cumulative delays for large lists — consider capping the delay or using a shorter base delay.
	- For many creators, consider virtualization or reducing animation work to avoid jank.

- Code hygiene
	- Use consistent keying (you already use `singleCreator.id || index` — prefer stable unique `id` when available).
	- Consider extracting small UI primitives into their own files if `HomeConstants.jsx` grows large — it currently mixes tokens, hooks and several components.

- Testing & types
	- Add PropTypes or migrate components to TypeScript for better safety.
	- Add a simple unit / snapshot test around the `HomeCreators` render and the scroll behaviour.

If you'd like, I can automatically apply the small accessibility fixes to `ScrollButtons` (add focus handlers and keyboard-visible styles), add a capped animation delay, and update `Frontend/README.md` with live commands. Tell me which changes to apply next.
