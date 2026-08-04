# Cabeus Editorial Studio

## Entry points

- Editor login: `https://cabeus-explorer.jake-249.workers.dev/studio/login`
- Signed-in workspace: `https://cabeus-explorer.jake-249.workers.dev/studio`

Only active `editor` and `admin` role assignments can open the workspace. Other
authenticated members are returned to the member area by the shared editorial
authorization guard.

## Newsroom workflow

1. Select **New story** or choose an existing article from the story queue.
2. Drop a `.docx` manuscript into the Word import area or enter the story directly.
3. Edit the headline and standfirst. Reorder story sections with the drag handles.
4. Write the public teaser or use **Draft from opening** as a starting point.
5. Compare the homepage and full-story previews.
6. Save the draft. After review, publish the saved article.

Every save creates a CMS version. The original Word file is retained in the private
`editorial-source-documents` bucket and is not exposed through a public URL.

## Content model

- **Headline:** Main public article title.
- **Standfirst:** Concise explanation of the event and its significance.
- **Public teaser:** Search-visible context available before the membership gate.
- **Story body:** Full member content, represented as reorderable sections.
- **Reader access:** Explorer, Scout, or Cabeus Council entitlement requirement.
- **Search fields:** Optional search title, description, direct-answer summary, and slug.
