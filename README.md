# Between Lines

Private, browser-based WhatsApp DM analysis. Includes automatic date detection, response times, initiative, message detail, warmth, signature openers and closings, date filters and locally generated suggestions.

## Development

Use Node 22.16+ and pnpm. Run `pnpm install --frozen-lockfile`, then `pnpm dev`. `pnpm build` creates `pages-dist`.

## Publish

In **Settings → Pages**, select **GitHub Actions** as the source. Run the **Deploy GitHub Pages** workflow.

## Analytics status

Usage tracking requires a separate server backend and is not yet connected for this Pages deployment. The existing private deployment remains independent. See GITHUB_PAGES.md. AI-generated insights are not connected; suggestions are transparently rule-based.

Chats remain in browser memory; never commit exports, names, secrets or admin keys.
