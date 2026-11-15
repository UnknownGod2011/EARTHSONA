# NASA Space Apps submission checklist

**Submission window:** November 14, 2026 at 9:00 a.m. through **November 15, 2026 at 11:59 p.m.** in the selected Local Event’s time zone. The Universal Event uses the Team Owner’s area of residence. Follow the Local Lead’s separate schedule for local presentations or judging. [Official dates and time zones](https://www.spaceappschallenge.org/resources/project-submission-guide/#project-submission-start-end-times)

## Project form copy

Use the following text and confirm links from a signed-out browser before adding them to the official form. [Official field instructions](https://www.spaceappschallenge.org/resources/project-submission-guide/#project-page-form-field-instructions)

**Project Name**

EARTHSONA

**Challenge**

The Earth Information Jukebox

**High-Level Project Summary**

EARTHSONA turns official NASA Earth Information Center maps into sound and lets learners hear how the Arctic band and global mean changed across two ten-year windows. Luma guides the first listen, then reveals the exact NASA GISTEMP values behind each note. Visitors can explore 146 years of annual temperature anomalies across latitude bands on a shared pitch scale.

**Link to Project Demo**

[Team’s YouTube demo](https://www.youtube.com/watch?v=6VNh-8TCNbA) · [Hosted demo copy](https://earthsona.vercel.app/demo/) · [Direct MP4](https://earthsona.vercel.app/demo/earthsona.mp4)

**Link to Final Project**

Public interactive project and repository. [Vercel](https://earthsona.vercel.app/) · [GitHub Pages](https://unknowngod2011.github.io/EARTHSONA/) · [Source code](https://github.com/UnknownGod2011/EARTHSONA)

**Detailed Project Description**

EARTHSONA offers two ways to listen to the same underlying record. In NASA frames, choose a 2023, 2024, or 2025 temperature anomaly map and hear six notes as the scan moves south. The browser reads red and blue channels from the rendered map and generates each note with Web Audio. The maps use different palettes and processing, so the pixel score reflects the source image’s color and layout.

In Climate globe, choose one or two NASA GISS surface temperature records and hear them on one pitch scale. Zero anomaly plays at 220 Hz, and a 2°C increase raises the pitch an octave. The paired readings, timeline, and latitude-band globe track the calendar year and connect the sound to the published annual values. The latest ten-year window, 2016–2025, averaged about 2.38°C higher in the Arctic band than its 1980–1989 mean, while the comparable global difference was about 0.77°C. Each latitude band combines temperatures across all longitudes. Both differences compare departures from the corresponding 1951–1980 baseline.

Keyboard-accessible playback controls, map descriptions, exact readings, and data tables give learners multiple ways to explore the same record. EARTHSONA uses browser JavaScript, Canvas, Web Audio, Vite, and a pinned NASA data snapshot.

**Use of Super Intelligence (SI)**

The team supplied the Earth-data listening concept and selected the published cut. OpenAI Codex assisted with source research, implementation, tests, documentation and demo production. NASA supplied the climate data, maps and Blue Marble imagery. EARTHSONA reuses AI-assisted Luma artwork on the site. Narration was synthesized with ElevenLabs using Jessica and Eleven v4. Method & Sources carries the site credits. The scientific sounds are synthesized in the browser directly from NASA values and pixels. [Official SI rules](https://www.spaceappschallenge.org/resources/project-submission-guide/#project-page-form-field-instructions)

**NASA Data**

NASA GISS GISTEMP v4 annual zonal Land–Ocean Temperature Index provides the 1880–2025 climate tracks, chart, and globe band values. Official Earth Information Center maps from NASA’s Scientific Visualization Studio provide the source pixels for the frame sonification. NASA Earth Observatory Blue Marble imagery provides the globe’s geographic basemap. [GISTEMP overview](https://data.giss.nasa.gov/gistemp/) · [Annual table](https://data.giss.nasa.gov/gistemp/tabledata_v4/ZonAnn.Ts+dSST.csv) · [EIC catalog](https://svs.gsfc.nasa.gov/gallery/earth-information-center/) · [2023 NASA SVS map](https://svs.gsfc.nasa.gov/5207/) · [2024 NASA SVS map](https://svs.gsfc.nasa.gov/5450/) · [2025 NASA SVS map](https://svs.gsfc.nasa.gov/5603/) · [Blue Marble](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/)

**Space Agency Partner Data and Other References**

The included NASA GISTEMP product draws on NOAA GHCN v4 and ERSST v5. EARTHSONA uses the NASA files cited above and relies on the web platform, Vite, and the Geist, Instrument Serif, and IBM Plex Mono font families. List every reference in the release and acknowledge each type of use with its applicable license. [Data and citations](DATASET_RESEARCH.md) · [Tools and licenses](OPEN_SOURCE_RESEARCH.md)

## Participant and final delivery

- [ ] Confirm the 2026 event registration, assigned challenge, and team membership in the official dashboard. A one-person team is eligible for Global Judging through a Local Event. The Universal Event requires at least two people. Local Event members must be confirmed and appear on the Members tab. Maximum team size is six. [Eligibility](https://www.spaceappschallenge.org/resources/judging-awards-guide/#eligibility-for-global-judging)
- [x] Public final project and source are available. The team’s YouTube upload is the submission demo link, and the website hosts the team’s MP4 as an alternative. [Demo format and hosting](https://www.spaceappschallenge.org/resources/project-submission-guide/#tips-for-creating-a-project-demo)
- [ ] Add screenshots to the official Project tab if desired. The site accepts JPG, PNG, and GIF images up to 10 MB. Upload video, documents, and slides to a public destination and include their links.
- [ ] Check final credits, open-source terms, SI disclosure, and the participant’s rights to the submitted materials. The guide specifies visible watermarks for generated images and video, and descriptive text and metadata for generated audio, code, and data. Exclude recognizable identities, likenesses and voices of minors from deliverables. [Project submission guide](https://www.spaceappschallenge.org/resources/project-submission-guide/) · [Participant terms](https://www.spaceappschallenge.org/legal/)
- [ ] In **My Team → Project**, complete every required field, acknowledge the **Terms and Conditions** and **Confirm All Work is Original** fields, and select **Submit for Judging** before your event’s deadline. Verify the on-page confirmation. The participant is responsible for final approval and submission. [Official submission steps](https://www.spaceappschallenge.org/resources/project-submission-guide/#submitting-your-project)
