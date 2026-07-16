# Estimated Coordinated Lunar Time Methodology

The homepage `Estimated LTC` display is a research estimate of how a reference clock on the lunar surface advances relative to UTC. It is not an adopted lunar civil timezone and must not be used for navigation, mission operations, or precision time transfer.

## Display Convention

- Synchronization epoch: `1977-01-01T00:00:00.000Z`
- Mean lunar-surface gain: `56.0256 microseconds per Earth day`
- Display precision: nearest millisecond
- Calculation:

```text
elapsed_days = (UTC - epoch) / 86,400 seconds
offset = elapsed_days * 56.0256 microseconds
estimated_LTC = UTC + offset
```

The 1977 date matches the conventional relativistic reference epoch used in the cited time-transformation work. Setting the displayed UTC/LTC offset to zero at that epoch is a Cabeus Explorer product convention because an internationally adopted LTC realization and zero offset do not yet exist.

## Interpretation

Coordinated Lunar Time is intended to become a common time reference for lunar and cislunar systems, traceable to UTC. Clocks near the Moon advance slightly faster than comparable clocks on Earth because the Moon has a different gravitational potential and motion. NASA describes the future operational standard as a weighted average of atomic clocks at the Moon.

The homepage uses the secular mean rate derived by Turyshev, Williams, Boggs, and Park. Their model gives `56.0256 microseconds/day` and identifies periodic terms with a largest amplitude of about `0.470 microseconds`. The display omits periodic, topographic, and site-dependent corrections because they are much smaller than its one-millisecond display precision.

## Sources

- NASA, [NASA to Develop Lunar Time Standard for Exploration Initiatives](https://www.nasa.gov/solar-system/moon/nasa-to-develop-lunar-time-standard-for-exploration-initiatives/), September 12, 2024.
- NIST, [A Relativistic Framework to Establish Coordinate Time on the Moon and Beyond](https://www.nist.gov/publications/relativistic-framework-establish-coordinate-time-moon-and-beyond), February 17, 2024.
- Turyshev et al., [Relativistic Time Transformations Between the Solar System Barycenter, Earth, and Moon](https://arxiv.org/abs/2406.16147), equation 82 and associated discussion.
- Bourgoin, Defraigne, and Meynadier, [Lunar reference timescale](https://doi.org/10.1088/1681-7575/ae2c03), *Metrologia* 63 (2026) 015003.
- White House Office of Science and Technology Policy, [Celestial Time Standardization Policy](https://www.whitehouse.gov/wp-content/uploads/2024/04/Celestial-Time-Standardization-Policy.pdf), April 2, 2024.

## Replacement Trigger

Replace this estimate when the BIPM/CGPM, IAU, NASA, or another recognized international standards body publishes an adopted LTC realization with conventional values, a defined zero offset, and a maintained UTC transformation. Preserve the `Estimated` label until that replacement is verified.
