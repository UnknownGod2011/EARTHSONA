# Findings from the annual GISTEMP snapshot

These examples use 146 annual Land–Ocean Temperature Index rows from 1880–2025. Each number is a temperature anomaly in °C relative to that series' 1951–1980 baseline. `node scripts/build-climate.mjs --check` verifies that the UI summaries are reproduced from the raw data. [Pinned CSV](../public/data/gistemp-zonal-annual.csv) · [NASA GISS source](https://data.giss.nasa.gov/gistemp/)

## 1. The polar bands diverged in 2016

| Year | Arctic band, 64–90°N | Antarctic band, 64–90°S | Arctic minus Antarctic |
| --- | ---: | ---: | ---: |
| 2015 | +1.99°C | −0.36°C | +2.35°C |
| 2016 | +3.23°C | +0.35°C | +2.88°C |
| 2024 | +2.88°C | +0.71°C | +2.17°C |
| 2025 | +2.93°C | +1.55°C | +1.38°C |

Subtract the `90S-64S` anomaly from `64N-90N` in each paired row. The Arctic zone had a larger anomaly in all four shown years, and the magnitude of the gap varied. The playback preset covers 2014–2025. Each band averages land and sea areas across all longitudes. The gap compares departures from two different local climates and therefore says nothing about the difference in absolute temperature or a particular location. Early estimates have sparser observing coverage. [NASA zonal analysis background](https://data.giss.nasa.gov/gistemp/sources/gistemp.html) · [GISTEMP FAQ](https://data.giss.nasa.gov/gistemp/faq/)

## 2. The Arctic band's decadal mean shifted more than the global mean

| Region | Mean, 1980–1989 | Mean, 2016–2025 | Later minus earlier |
| --- | ---: | ---: | ---: |
| Arctic band | +0.244°C | +2.619°C | +2.375°C |
| Global | +0.247°C | +1.014°C | +0.767°C |

For each region, calculate the arithmetic mean of ten published annual anomaly rows in each inclusive window, then subtract the earlier mean from the later one. The app reports the shifts as about **+2.38°C** and **+0.77°C**, respectively. The listening preset covers 1980–2025 and uses all annual rows, including the intervening years. This comparison describes two specific windows. A trend rate or an attribution claim would require a separate analysis. [NASA GISS annual table](https://data.giss.nasa.gov/gistemp/tabledata_v4/ZonAnn.Ts+dSST.csv) · [Lenssen et al. 2024](https://doi.org/10.1029/2023JD040179)

The Luma walkthrough auditions these same decade means with equal waveform, level and duration for all four notes. In 1980–1989, the Arctic and global means map to about **239.4 Hz** and **239.7 Hz**. In 2016–2025, they map to about **545.3 Hz** and **312.6 Hz**. This demonstrates the difference in pitch intervals for these selected periods. The global mean includes the Arctic and is not an independent comparison group.

## 3. The recent global record has three similarly warm years

Read the published `Glob` point estimate for each year. In 2023 it was **+1.17°C**, in 2024 **+1.28°C**, and in 2025 **+1.19°C**. Those are the three highest point estimates when the 146 rows are ranked. The 0.02°C separation between 2023 and 2025 is within analysis uncertainty. NASA describes those two years as effectively tied. Compare these three years from the same-scale tracks. The companion EIC maps provide finer geographic patterns and have their own color scales. [NASA 2025 analysis release](https://www.nasa.gov/news-release/nasa-releases-global-temperature-data/) · [EIC 2025 visual](https://svs.gsfc.nasa.gov/5603/)
