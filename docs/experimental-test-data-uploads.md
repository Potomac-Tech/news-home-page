# Experimental Test Data Uploads

Task 042 adds the first Scout/Command upload flow for Earth test data.

## Member Surface

- `/member/test-data`: protected route for Scout users, Command users, and
  authorized staff.
- Explorer-only members see a paid-access gate.
- Signed-out users are redirected through Supabase Auth.
- Local runs without Potomac Supabase public environment variables show a
  configuration gate instead of fallback upload data.

## Storage and Metadata

Uploads use the private Supabase Storage bucket:

- `experimental-test-data`

Each object path starts with the uploader's Supabase user ID. Metadata is stored
in `experimental_test_data_uploads` with:

- dataset title
- optional test environment and campaign labels
- original filename
- CSV/XLSX format
- MIME type and byte size
- validation status and validation errors
- upload timestamp

The upload API accepts only `.csv` and `.xlsx` files up to 6 MB. This keeps the
initial flow aligned with Supabase's standard upload guidance for small files;
larger datasets should move to resumable uploads in a later task.

## Access Control

Authorization uses normalized `member_role_assignments`, not user-editable
metadata. Uploads are allowed for:

- `scout`
- `command_user`
- `editor`
- `analyst`
- `admin`

Storage RLS only allows insertion when the object path starts with
`auth.uid()`. Metadata RLS only allows the uploader, relevant organization
admins, and authorized staff to read upload records. Explorer-only and signed-out
users are blocked by the page, the API route, and database policies.

## Validation Scope

The current flow validates file presence, extension, MIME type, and size before
uploading. It does not parse rows or compare columns yet. Task 043 should add
dataset selection, comparison logic, assumptions, and clearer row/column-level
validation after files are available in private storage.

## Comparison Dashboard

Task 043 adds a scaffolded comparison workflow on the same `/member/test-data`
page. Paid members can select one accepted upload and one approved, available or
preview reference dataset from `dataset_catalog_entries`.

Comparison runs are stored in `experimental_test_data_comparisons` with:

- selected upload
- selected reference dataset
- status
- result summary
- assumptions
- limitations
- compatibility score

The first comparison method is intentionally limited to metadata and scope
alignment. It records the file format, campaign context, reference provider,
dataset kind, data types, and a preliminary score. It does not parse file rows,
normalize units, or calculate statistical fit. The result card displays those
limitations so members understand the output is a planning signal, not an
analyst-approved data product.

## Verification Notes

Live upload verification requires:

- Potomac Supabase public URL and publishable key for project
  `xlpkdoeldtlhearqajat`
- applied migrations `20260630030304_experimental_test_data_uploads.sql` and
  `20260630030735_experimental_test_data_comparisons.sql`
- signed-in Scout or Command test user
- Supabase Storage enabled for the private bucket
