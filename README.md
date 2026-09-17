# Between Lines

Private, browser-based WhatsApp DM analysis. Includes automatic date detection, response times, initiative, message detail, warmth, signature openers and closings, date filters and locally generated suggestions.

## Development

Use Node 22.16+ and pnpm. Run `pnpm install --frozen-lockfile`, then `pnpm dev`. `pnpm build` creates `pages-dist`.

## Publish

In **Settings → Pages**, select **GitHub Actions** as the source. Run the **Deploy GitHub Pages** workflow.

## Analytics status

Google Analytics is connected for the Pages deployment and requires visitor consent; see ANALYTICS_SETUP.md. Optional Cloudflare AI integration is prepared for the rolling last three calendar months, requires separate consent to send message text, and stays disabled until its Worker origin is configured. Local suggestions remain available. See AI_SETUP.md and GITHUB_PAGES.md.

Chats remain in browser memory; never commit exports, names, secrets or admin keys.
