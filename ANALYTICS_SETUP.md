# Google Analytics configuration

Configured on 2026-09-17 for the standalone **Between Lines** account (`408499995`) and property (`554714343`). Web stream: **Between Lines Web** (`15793071585`), public Measurement ID: `G-T312558HVQ`. Reporting uses India time and INR.

Enhanced measurement is enabled at the owner's request. Optional account data sharing remains disabled. Collection still requires visitor consent.

## Setup or reconnect

1. Open https://analytics.google.com/ and create an account/property for Between Lines.
2. Add a Web data stream for https://mayankmalviya64.github.io/between-lines/.
3. Keep Enhanced measurement ON as requested by the owner. Leave Google Signals and user-provided data collection off.
4. Copy the public Measurement ID beginning G-.
5. Set measurementId in pages/analytics-config.json to that ID and commit to main. GitHub Actions deploys the change.
6. Visit the deployed site, allow usage analytics, and check Realtime in Google Analytics. Open the demo and change a filter to check feature events. Standard reports may take 24–48 hours.

An empty or invalid Measurement ID loads no Google Analytics script. Analytics is opt-in; declining or blocking it means those visits are absent. Visitors can withdraw through Change preference without losing their loaded chat.

## Events

Allowlisted custom event names: page_view, import_started, import_completed, import_failed, demo_opened, filter_used, relationship_changed, chat_cleared. These events have no chat-related parameters. Relationship changes are counted without sending the chosen relationship type. Custom event page URLs exclude query strings and fragments; referrer is suppressed.

Custom events do not send chat text, imported filenames, participant names, conversation statistics, or error strings. Google Analytics uses cookies and collects technical browser/device data. Reports are accessed through the owner's Google Analytics account; the website never exposes private reports.

Enhanced measurement independently adds applicable automatic events, including scrolls, outbound clicks, site search, video engagement, downloads and form interactions. Their metadata can include link URLs, search terms, download names and form attributes; these automatic events are not restricted by the custom-event allowlist. Keep private conversation data out of URLs, link targets, download links and form attributes. See [Google's event and parameter reference](https://support.google.com/analytics/answer/9216061).

## Acceptance checks after configuration

Before consent or after declining, no Google Analytics script should be loaded on a fresh visit. After consent, named events should appear in Realtime. Withdrawing prevents further events without clearing the chat. No Measurement ID or blocked storage means collection stays off.
