# Production Content Import

Editors and admins import reviewed production content from `/admin/content` with
a UTF-8 JSON manifest no larger than 2 MB. Importing stages records for release
review; it does not bypass each destination module's existing publish action.

## Manifest Contract

The root object uses `manifest_version: "1.0"` and a `records` array containing
1 to 250 items. Supported `content_type` values are `cms_story`,
`carousel_slide`, `tracker_row`, `udri_cta`, `pathfinder_cta`, `source_cta`,
`auth_request_access`, `upgrade_fixture`, `profile_completion_fixture`, and
`contract_award`.

Every record requires a unique `record_key`, final `title` and `body_copy`, the
editor's Supabase user UUID in `approved_by`, a past `approved_at` timestamp,
HTTPS `citation_urls`, approved `source_registry_ids`, a future `expires_at`,
and at least one asset with `reference`, `review_status: "reviewed"`, and useful
`alt_text`. The `payload` object must include the fields required by its content
type. Auth fixtures must use their exact production route.

```json
{
  "manifest_version": "1.0",
  "records": [{
    "record_key": "story:lunar-brief",
    "content_type": "cms_story",
    "title": "Reviewed lunar market brief",
    "body_copy": "Final reviewed production copy.",
    "approved_by": "00000000-0000-4000-8000-000000000000",
    "approved_at": "2026-07-14T19:00:00Z",
    "citation_urls": ["https://www.nasa.gov/reference"],
    "source_registry_ids": ["00000000-0000-4000-8000-000000000001"],
    "expires_at": "2026-08-14T19:00:00Z",
    "assets": [{
      "reference": "content-submissions/story/hero.webp",
      "review_status": "reviewed",
      "alt_text": "Reviewed lunar surface mission image"
    }],
    "payload": {
      "slug": "lunar-brief",
      "public_summary": "Reviewed summary",
      "public_teaser_markdown": "Reviewed teaser",
      "body_markdown": "Reviewed full story body"
    }
  }]
}
```

Blocked rows remain visible in the import dashboard with exact remediation
codes. Replace missing or placeholder content, complete editor review, approve
the source registry record, or review the referenced asset, then import a new
manifest. Do not edit the validator to allow temporary production content.
