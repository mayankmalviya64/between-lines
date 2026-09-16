# GitHub Pages deployment

The Pages build reuses the current chat dashboard and parser. It runs entirely in the browser. No uploaded chats or secret values belong in this repository.

## Publish

1. Create `mayankmalviya64/between-lines` and initialise it with a README.
2. Upload the project source, excluding node_modules, .env, .sites-runtime, .git, and build output.
3. In Settings → Pages, choose GitHub Actions as the source.
4. The included workflow builds and deploys the site on pushes to main.

Build locally: `pnpm exec vite build --config vite.pages.config.ts`. Output: `pages-dist`.

## Analytics migration is still required

GitHub Pages cannot execute the included server API routes or host D1. The current private Sites deployment continues operating independently.

The Pages adapter accepts the repository variable `PAGES_ANALYTICS_ORIGIN` for a separately deployed compatible backend. That backend must allow the exact Pages origin via CORS (including OPTIONS and Authorization for owner analytics), keep the admin key server-side, and remain accessible to intended visitors. The private Sites URL is not a working public analytics backend. Do not set this variable to it without completing that migration.

Until that backend is ready, the Pages build explicitly reports analytics as unconnected and sends no tracking events. The existing Sites deployment and its data are unchanged. AI generation is also unconnected, as before.
