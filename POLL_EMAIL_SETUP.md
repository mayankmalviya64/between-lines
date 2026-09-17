# Poll email notifications

The prepared gift build sends the chosen option ID automatically after a click.
The current live website retains its previous WhatsApp sharing until email is verified.

Backend: https://muskan-caption-poll.mayankmalviya64.workers.dev
The recipient is a `NOTIFY_EMAIL` Worker secret, never a browser-supplied address.
A random `POLL_TOKEN` secret also appears only inside the encrypted gift; existing
unlock keys remain usable. Only allowlisted captions are emailed. Chat text and
passcodes are never sent. The notification identifies a visitor's poll choice,
not a verified identity. Request IDs avoid duplicate acknowledged retries; a
persistent daily limit allows 20 requests per day.

Email delivery uses FormSubmit. Their first submission requests one-time recipient
email activation: https://formsubmit.co/ and https://formsubmit.co/documentation.
They retain submitted form data for 30 days; this payload includes only the selected
caption, option number, site URL and generic source text.

Pending activation:
1. Recipient secret configured through Wrangler stdin (completed).
2. Setup test triggered the activation email (completed); recipient must click Activate Form.
3. Confirm the verification email and test real delivery to the inbox.
4. Set EMAIL_READY to true in wrangler.poll.jsonc and deploy the backend.
5. Build and publish the gift bundle and encrypted payload together.
6. Verify a poll submission arrives as email, and an identical request is not resent.

EMAIL_READY remains false until verification. Do not claim email delivery merely
from a provider HTTP response; observe the test in the recipient inbox.
