// Treat formatting differences alike, while keeping every letter and digit required.
// Shared by the publisher and browser so both derive the same encryption key.
export function normalizePasscode(value) {
 return value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}
