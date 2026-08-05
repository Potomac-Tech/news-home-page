# Cabeus Terminal Frontend V1 Archive

This directory preserves the July 2026 Cabeus Terminal preview that previously
rendered beneath the public Intelligence hero.

It was removed from live routes because the Terminal is not ready for complete
integration. The archive includes:

- The module workspace and membership-aware preview UI.
- The module definitions and route resolver.
- The original integration manifest.

To restore it, first complete the Terminal data and service integration review.
Then move the frontend definitions back into `lib/terminal`, restore the
workspace under `app/terminal/_integration`, and re-enable the module routes
with current authorization, source, and production-readiness verification.
