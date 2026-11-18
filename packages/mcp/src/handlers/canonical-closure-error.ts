/** Fixed public domain failures. Arbitrary port exceptions never use this path. */
const codes = [
  'canonical_report_authorization_or_binding_invalid',
  'canonical_report_receipt_missing_or_invalid',
] as const;

export class CanonicalClosureError extends Error {
  constructor(readonly code: typeof codes[number]) {
    super(code);
  }

  publicCode(): string | undefined {
    return codes.includes(this.code) ? this.code : undefined;
  }
}
