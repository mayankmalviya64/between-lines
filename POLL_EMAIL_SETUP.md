# Poll email notifications

The live gift sends only the selected caption, party verdict, request ID, site URL
and generic visitor description to FormSubmit once both polls have answers, in one combined email. Gmail is receive-only:
no Gmail sending credentials are present or used. FormSubmit sends the emails.

The hidden FormSubmit form ID is stored inside both encrypted gift envelopes.
The recipient address is absent from the public JavaScript. Existing unlock keys
remain usable. Chat text and passcodes are never sent to FormSubmit.

The original Cloudflare relay is disabled (EMAIL_READY=false): FormSubmit rate-limited
its shared network address. The browser submits directly using the hidden form ID.
The sending state disables repeat choices, but provider timeouts followed by retries
may produce duplicate emails; server-side idempotency and quotas do not apply to
this direct route. Notifications describe a visitor choice, not a verified identity.

Recipient activation completed. A clearly marked setup poll choice was accepted;
its receipt was checked in Gmail before publication.

FormSubmit documentation: https://formsubmit.co/documentation
FormSubmit retains submitted form data for 30 days. No chat content is included.

Incomplete polls never send. A successful answer pair is remembered locally to avoid
resending the same pair; changing an answer can send a new combined update.
