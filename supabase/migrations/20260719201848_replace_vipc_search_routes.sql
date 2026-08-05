-- Remove the retired company-grant route from the live search and command indexes.
update public.intelligence_search_records
set
    route_path = '/news',
    title = 'News and Analysis',
    summary = 'Public and member-gated space market reporting, primary-source citations, and strategic lunar industry analysis.',
    snippet = 'Search current market-moving space news and lunar industry intelligence.',
    keywords = array['news', 'markets', 'strategy', 'lunar industry', 'analysis', 'citations'],
    entities = array['NASA', 'Artemis', 'CLPS', 'Moon'],
    updated_at = now()
where source_table = 'terminal_modules'
  and source_slug = 'news';

update public.intelligence_command_entries
set
    route_path = '/news',
    description = 'Open current space market and strategic lunar industry analysis.',
    keywords = array['news', 'markets', 'strategy', 'lunar industry', 'analysis'],
    updated_at = now()
where lower(command_key) = 'search-news';

update public.editorial_articles
set status = 'archived', archived_at = coalesce(archived_at, now()), updated_at = now()
where slug = 'vipc-grant-winner'
  and status <> 'archived';
