# Cloudflare AI setup

The free AI implementation uses `@cf/openai/gpt-oss-120b` through a separate Worker. GitHub Pages remains the website host. No API credential is shipped to the browser.

## Date policy

AI uses the rolling last three calendar months, ending now, independent of the local dashboard filter. UTC calendar arithmetic clamps month-end dates: May 31 minus three months is February 28 (or 29). The browser excludes older and future messages before transmission; the Worker independently rejects out-of-window messages. Imports and existing local insights still support the full export. There is no premium bypass or paid integration yet.

AI consent is separate from local-analysis permission and Google Analytics consent. Consent resets when the imported conversation changes. It identifies Cloudflare as the recipient of actual message text and timestamps and asks for permission from both participants. Speaker headers use A/B; this does not anonymise identifying information inside message text. The UI and privacy notice disclose this boundary.

## Free usage limits

Use a Cloudflare **Workers Free** account. Do not upgrade or attach paid billing for this feature. Workers AI stops at its account-wide 10,000-neuron daily allowance. The SQLite-backed Durable Object reserves at most 8,000 estimated neurons per UTC day for this app, leaving 2,000 for overhead or other account activity. This is an additional conservative app budget, not an exact provider meter or a guaranteed daily chat count.

Reservations use the entire prompt's UTF-8 byte count as a conservative token upper estimate, plus 1,024 tokens for templating, at 31,818 neurons/million input tokens; output reserves all 4,096 possible tokens at 68,182 neurons/million output tokens. Failed requests remain reserved. At most 20 AI requests are reserved daily. Chat JSON is capped at 100,000 UTF-8 bytes to conservatively fit the model context without a tokenizer dependency; larger recent exports are explicitly rejected, never silently truncated. Dates alone do not bound message volume. There is no automatic retry or multi-request chunking in this first version.

Only daily usage counters are stored. Chat contents and results are not stored by this backend or logged by application code. Worker observability is disabled. Cloudflare still processes requests under its own data policy. CORS limits browser origins but is not authentication; the shared quota can be consumed by abuse. Add Turnstile or authenticated accounts before opening this to a large audience.

## Deploy

1. Authenticate the existing Cloudflare account with `npx wrangler login` and verify it uses Workers Free.
2. Run `npx wrangler deploy --config wrangler.ai.jsonc` from the repo. This provisions the AI binding and a SQLite-backed daily budget object.
3. Set `VITE_AI_ORIGIN` to the deployed HTTPS Worker origin. The value is public; never set it to an API credential.
4. For GitHub Pages, set the public origin in `pages/ai-config.json` and build/deploy main. A local `VITE_AI_ORIGIN` can override it.
5. Use only a synthetic sample for the initial live test. Verify JSON insights, the last-three-month window, old-chat exclusion, separate consent, and the quota message. Real visitor chats require that visitor's explicit consent.

The AI feature stays disabled if no origin is configured. Cancelling aborts the browser wait; it cannot recall an already transmitted request. Clearing or replacing the chat aborts outstanding browser requests and removes displayed AI results.

## Validation

`npm run build`, `npx tsc --noEmit`, `node --test tests/ai.test.mjs`, and `npx wrangler deploy --config wrangler.ai.jsonc --dry-run` validate the browser build, types, date/consent/backend safeguards, and Worker packaging. Live Cloudflare inference must be verified separately after account authentication.

Sources: [model](https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/), [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [data policy](https://developers.cloudflare.com/workers-ai/platform/data-usage/).
