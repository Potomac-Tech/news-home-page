# Pricing and Upgrade Entry Points

Task 053 adds public and member-facing upgrade entry points for Explorer,
Scout, and Command.

## Public Pricing Page

`/pricing` explains:

- Explorer: free after manual approval through `/apply`
- Scout: self-serve annual upgrade at `$25,000/user/year` from the member
  workspace checkout flow
- Command: organization-level manual sales/admin approval through `/command`

The page includes tier cards, a capability comparison table, upgrade-path links,
canonical metadata, Open Graph metadata, and Product/Offer JSON-LD.

## Navigation

Pricing is linked from:

- Public header navigation
- Public homepage Member Access section
- Member workspace as "Compare tiers"

Scout checkout remains server-side through the existing member workspace
`ScoutCheckoutButton`, which posts to `/api/stripe/scout-checkout` and requires
an approved signed-in member. Command interest remains connected to `/command`.

## Verification Limit

The public pricing page can be verified locally without Supabase credentials.
Live Scout checkout still requires a signed-in approved member, configured
Stripe secret, configured Scout Price ID, and active Supabase project keys.
