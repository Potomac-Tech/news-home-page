# Cabeus Mean Time Methodology

`Cabeus Mean Time` (`CMT`) is a Cabeus Explorer product convention that maps
the Moon's mean solar day to a familiar 24-hour clock at Cabeus longitude.
It is intended to convey the approximate mean position of the Sun:

- `00:00` mean midnight
- `06:00` mean dawn
- `12:00` mean noon
- `18:00` mean dusk

CMT is not Coordinated Lunar Time, an adopted civil timezone, or a
mission-operations standard.

## Display Convention

- Reference new moon: `2026-07-14T09:43:00.000Z`
- Mean synodic period: `29.5305888531` Earth days
- Cabeus reference longitude: `35.5 degrees west`
- CMT hours per mean lunar solar day: `24`
- One CMT hour: approximately `29.53059` Earth hours
- One CMT minute: approximately `29.53059` Earth minutes

Although the lunar day/night cycle is often described as roughly four weeks,
the authoritative mean synodic period is about 29.53 Earth days. The
calculation uses that value instead of rounding the cycle to 28 days.

## Calculation

Longitude is east-positive, so Cabeus is `-35.5 degrees`.

```text
elapsed_cycles = (UTC - reference_new_moon) / mean_synodic_period
cycle_fraction = elapsed_cycles modulo 1
prime_meridian_hours = cycle_fraction * 24
longitude_offset_hours = -35.5 / 15
CMT = (prime_meridian_hours + longitude_offset_hours) modulo 24
```

At astronomical new moon, the lunar prime meridian is assigned mean midnight.
The longitude correction shifts that mean solar clock westward to Cabeus.

The next mean dawn or dusk is calculated from the remaining fraction of the
same 29.5305888531-day cycle. CMT therefore runs about 29.53 times slower than
an Earth clock.

## Interpretation Limits

CMT is an idealized mean solar clock. It does not calculate actual local
illumination from a high-precision lunar ephemeris. It omits:

- Lunar libration and variation between individual synodic cycles.
- Solar declination and the effects of Cabeus's high southern latitude.
- Local crater walls, slopes, horizon geometry, and eclipses.
- Permanent shadow inside Cabeus crater.

The display uses `Mean daylight` and `Mean lunar night` deliberately. A
daylight label does not mean that sunlight reaches a particular point inside
Cabeus crater. CMT must not be used for landing, power, thermal, navigation,
or mission-planning decisions.

## Sources

- U.S. Naval Observatory, [Dates of Primary Phases of the Moon](https://aa.usno.navy.mil/calculated/moon/phases?date=2026-05-23&format=p&nump=50&submit=Get+Data), giving the July 14, 2026 new moon at 09:43 Universal Time.
- U.S. Naval Observatory, *Explanatory Supplement to the Astronomical Almanac*, Chapter 15, equation 15.2, giving a mean synodic period of `29.5305888531` days near the year 2000 and noting that individual cycles can vary by up to seven hours.
- NASA Technical Reports Server, [Radioisotope Power Systems to Enable Extended Lunar Science and In-Situ Resource Utilization Missions](https://ntrs.nasa.gov/citations/20180004489), describing the lunar solar day as about `29.5 days` or `708 hours`.
- NASA Technical Reports Server, [Physics-Informed Machine Learning to Identify Features in LCROSS NIR Data](https://ntrs.nasa.gov/citations/20250003292), identifying the LCROSS Cabeus target at approximately `84.9 degrees south, 35.5 degrees west`.

## Replacement Trigger

Replace the mean-cycle approximation with a reviewed ephemeris calculation if
the product later needs actual site illumination, local horizon events, or
mission-grade solar geometry. Preserve the `Cabeus Mean Time` label only while
the reference longitude and 24-hour mean-solar convention remain unchanged.
