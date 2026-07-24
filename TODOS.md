# TODOs

## Security

- [ ] **Harden SMTP transport TLS** — `src/api/contact.js` and `src/api/reservations.js`
  create the nodemailer transport with `secure: smtpPort === 465` and no `requireTLS`.
  On port 587, if the SMTP server does not advertise STARTTLS, nodemailer sends the
  AUTH credentials in plaintext (credential-interception risk — the same class of issue
  the nodemailer 9.x bump addressed). Add `requireTLS: true` to force STARTTLS on
  non-465 ports.
  - **Why deferred:** could break a client SMTP host that lacks STARTTLS. Confirm the
    client's SMTP server supports STARTTLS before enabling, and ship as its own change.
  - **Surfaced by:** nodemailer 6→9 bump (PR #19).
