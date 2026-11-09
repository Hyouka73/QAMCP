Synthetic test-only self-signed certificate and unencrypted key. They authenticate no
real service and MUST NOT be used in production. Committed deliberately so tests need
neither OpenSSL nor a certificate installer. Trust is supplied to a single request via
`tls_ca`; no operating-system trust store is modified.

Generated with OpenSSL 3:

```sh
openssl req -x509 -newkey rsa:2048 -nodes -keyout test-only.key -out test-only.pem \
  -subj '/CN=recon.test/O=QAP Synthetic Test Only' \
  -addext 'subjectAltName=DNS:recon.test' -days 3650
```

Validity: 2026-10-28 through 2036-10-25. Renew this synthetic fixture before expiry.
