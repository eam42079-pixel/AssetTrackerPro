# TanMar Receiver Service Request

Companion QR service app, exported from published version 6.

This application needs its own D1 database and an `ADMIN_SHARED_SECRET` matching the tracker. Use `.dev.vars.example` locally. Apply its migrations separately.

See the [root README](../README.md) for setup and [IT handoff guide](../docs/IT-HANDOFF.md) for configuration, migration and hosting.

The form saves a request and opens a prefilled email; it does not send automatically. Review `TEST_RECIPIENT` in `app/page.tsx` before production.
