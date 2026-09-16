# GitHub Pages deployment

Live site: https://mayankmalviya64.github.io/between-lines/

Pushes to main build and deploy through GitHub Actions. Settings → Pages must use GitHub Actions. Build locally with `pnpm build` (output: pages-dist).

## Usage tracking

Google Analytics 4 integration is prepared but inactive until a Measurement ID is configured. See ANALYTICS_SETUP.md. There is no analytics backend to deploy. Uploaded chats are processed locally and must never be committed.

## AI recommendations

Current recommendations use local rules, not an AI API. A future AI integration requires a separate server endpoint to protect its API key, explicit visitor consent and a minimized summary payload. Never place an AI API key in this public repository or its browser bundle.
