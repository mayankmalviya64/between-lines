# Activate Google Analytics

1. Open https://analytics.google.com/ and create an account/property for Between Lines.
2. Add a Web data stream for https://mayankmalviya64.github.io/between-lines/.
3. Turn OFF Enhanced measurement for the stream to avoid automatic form, download and other events. Leave Google Signals and user-provided data collection off.
4. Copy the public Measurement ID beginning G-.
5. Set measurementId in pages/analytics-config.json to that ID and commit to main. GitHub Actions deploys the change.
6. Visit the deployed site, allow usage analytics, and check Realtime in Google Analytics. Open the demo and change a filter to check feature events. Standard reports may take 24–48 hours.

Until step 5, this deployment loads no Google Analytics script. Analytics is opt-in; declining or blocking it means those visits are absent. Visitors can withdraw through Change preference without losing their loaded chat.

## Events

Allowlisted event names: page_view, import_started, import_completed, import_failed, demo_opened, filter_used, relationship_changed, chat_cleared. Events have no chat-related parameters. Relationship changes are counted without sending the chosen relationship type. Page URLs exclude query strings and fragments; referrer is suppressed.

No chat text, filenames, participant names, conversation statistics, or error strings are sent. Google Analytics uses cookies and collects technical browser/device data. Do not enable additional automatic collection or send user identifiers. Reports are accessed through the owner's Google Analytics account; the website never exposes private reports.

## Acceptance checks after configuration

Before consent or after declining, no Google Analytics script should be loaded on a fresh visit. After consent, named events should appear in Realtime. Withdrawing prevents further events without clearing the chat. No Measurement ID or blocked storage means collection stays off.
