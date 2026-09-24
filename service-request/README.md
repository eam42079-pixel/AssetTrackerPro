# TanMar Receiver Service Request

Companion QR service app, updated from published version 7.

This application needs its own D1 database and an `ADMIN_SHARED_SECRET` matching the tracker. Use `.dev.vars.example` locally. Apply its migrations separately.

See the [root README](../README.md) for setup and [IT handoff guide](../docs/IT-HANDOFF.md) for configuration, migration and hosting.

The public form saves an asset-only request with requester contact, work site information, error code and GPS. For testing it opens a prefilled email draft to `TEST_RECIPIENT`; the user must tap Send. IT will replace this step with server-side email, using the private tracker registry to add account and receiver identifiers. Email is not sent automatically until that integration is configured.
