# Muskan's gift

The `muskan-gift` branch builds a separate gift site. The original site remains on `main`.
The gift entry point imports no analytics or AI modules.

Content is encrypted with AES-256-GCM and a PBKDF2-SHA256 key (600,000 iterations).
The passcode is supplied to the encryption script through stdin; never commit it.
To add a chat, run `node scripts/encrypt-gift.mjs /absolute/path/to/export.txt DMY`,
then enter the passcode on stdin and end input. The script validates the personal
chat locally and only writes ciphertext into `public/gift.enc.json`.
Use AUTO or MDY instead of DMY when appropriate. Never put raw exports in this repo.

Successful unlocks store the derived key and a fixed three-hour expiry in this
browser's localStorage. Reopening/refreshing stays unlocked until expiry. Lock now
removes the saved key. The passcode and plaintext are never stored. Browser storage
must be enabled for unlock to survive a refresh. Anyone using an unlocked browser
can read the gift during that window; anyone knowing the passcode can unlock it.
This is passcode protection, not identity verification or account authentication.

The current encrypted payload is a preview letter; the chat has not been supplied.
