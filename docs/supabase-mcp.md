# Supabase MCP Configuration

The canonical Supabase project for this workspace is `xlpkdoeldtlhearqajat`.

Do not use `nwoluvjdojzayozyzlob`; that project ref is explicitly wrong for this workspace.

## Configuration

- Project MCP config: `.mcp.json`
- Supabase MCP URL: `https://mcp.supabase.com/mcp?project_ref=xlpkdoeldtlhearqajat`
- Local Codex config inspected during setup: `%USERPROFILE%\.codex\config.toml`

The local Codex config already contains a `supabase` MCP server entry with the same project-scoped URL. The project-level `.mcp.json` records the same target so MCP clients that read project config are also scoped to the correct project.

## Authentication Status

The hosted Supabase MCP endpoint was reachable during setup. An unauthenticated probe returned HTTP `401`, which is expected before an OAuth session is attached.

This automation run could not verify an authenticated Supabase MCP tool call because Supabase MCP tools were not exposed in the current session. After authenticating or reloading the MCP client, Supabase tool calls should remain project-scoped by the `project_ref=xlpkdoeldtlhearqajat` URL parameter.

## References

- Supabase MCP docs: https://supabase.com/docs/guides/ai-tools/mcp
- Supabase changelog: https://supabase.com/changelog
