# Cabeus Explorer Developer API

The paid developer API is available to Scout and Command members at `/api/v1`. API keys are issued from an authenticated member session with `POST /api/member/developer/keys`; the returned secret is shown once and only its SHA-256 hash is retained.

## Authentication and limits

Send a key as `Authorization: Bearer cbe_...` or `X-API-Key: cbe_...`. Every response includes `X-Request-ID`; successful API responses also include `X-RateLimit-Limit` and `X-RateLimit-Remaining`. Scout keys receive 10,000 monthly units, while Command keys receive 250,000 unless an administrator has assigned an override. Endpoint scope restrictions and membership tier checks are evaluated before data is returned.

Errors use this contract:

```json
{"error":{"code":"invalid_api_key","message":"The API key is invalid, expired, paused, or revoked.","request_id":"..."}}
```

Authentication failures return `401`, scope and tier failures return `403`, missing records return `404`, quota failures return `429`, and temporary backend failures return `5xx`.

## Live endpoints

| Method | Endpoint | Tier | Units | Description |
| --- | --- | --- | ---: | --- |
| `GET` | `/api/v1/articles` | Scout | 1 | Published article metadata, public summaries, and SEO fields. |
| `GET` | `/api/v1/lunar-missions` | Scout | 2 | Published lunar missions and status metadata. |
| `GET` | `/api/v1/procurement-regulatory` | Scout | 2 | Published lunar procurements and regulatory records. |
| `GET` | `/api/v1/companies` | Scout | 3 | Published lunar company profiles. |
| `GET` | `/api/v1/command/briefs` | Command | 5 | Command brief alert-feed records belonging to the key owner and organization. |
| `POST` | `/api/v1/exports` | Scout | 5 | Queue a CSV, PDF, or JSON export. |
| `GET` | `/api/v1/exports/{id}` | Scout | 5 | Read export status and file metadata. |
| `GET` | `/api/v1/exports/{id}/download` | Scout | 5 | Redirect to a five-minute private Storage download URL. |

List routes accept `limit` (maximum 100) and `offset` query parameters.

## Export example

```bash
curl -X POST https://cabeus-explorer.jake-249.workers.dev/api/v1/exports \
  -H "Authorization: Bearer $CABEUS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Current lunar missions","source":"lunar_missions","format":"csv"}'
```

Allowed sources are `lunar_articles`, `lunar_missions`, `procurement_regulatory`, `company_profiles`, and, for Command keys, `command_briefs`. A scheduled server worker processes queued jobs. Files remain private, expire after seven days, and are only exposed through short-lived signed links.

## Webhooks

Command members create a subscription from an authenticated session with `POST /api/member/developer/webhooks`:

```json
{
  "name": "Production events",
  "endpoint_url": "https://example.com/cabeus/events",
  "events": ["export.completed", "alert.created"]
}
```

The signing secret is shown once and stored encrypted in Supabase Vault. Deliveries include `X-Cabeus-Event`, `X-Cabeus-Delivery`, `X-Cabeus-Timestamp`, and `X-Cabeus-Signature`. Verify the signature by calculating HMAC-SHA256 over `<timestamp>.<raw request body>` and comparing it with the hex value after `v1=`. Reject stale timestamps to limit replay risk.

Failed deliveries retry with exponential backoff, capped at six hours, for up to eight attempts. Delivery status, response code, latency, and the latest error are retained in the developer portal.

Supported event names are `alert.created`, `saved_search.match`, `watchlist.changed`, `dataset.updated`, `export.completed`, and `command_brief.published`. Export completion events are currently emitted by the production worker; the remaining names are reserved for their corresponding producer integrations.
