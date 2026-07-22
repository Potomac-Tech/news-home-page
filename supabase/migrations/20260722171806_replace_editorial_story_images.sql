update public.editorial_articles
set
    hero_image_url = case slug
        when 'artemis-iii-starlink-optical-relay' then '/artemis-starlink-optical-relay.webp'
        when 'artemis-iii-hardware-stacking' then '/artemis-iii-booster-stacking.webp'
        when 'nasa-lunar-delivery-awards-2028' then '/commercial-lunar-delivery-pipeline.webp'
        else hero_image_url
    end,
    hero_image_alt = case slug
        when 'artemis-iii-starlink-optical-relay' then 'Crewed spacecraft relaying data through optical communications satellites above Earth'
        when 'artemis-iii-hardware-stacking' then 'Solid rocket booster segments being stacked inside a high-bay integration facility'
        when 'nasa-lunar-delivery-awards-2028' then 'Commercial lunar lander deploying scientific instruments and cargo on the Moon'
        else hero_image_alt
    end,
    updated_at = now()
where slug in (
    'artemis-iii-starlink-optical-relay',
    'artemis-iii-hardware-stacking',
    'nasa-lunar-delivery-awards-2028'
);
