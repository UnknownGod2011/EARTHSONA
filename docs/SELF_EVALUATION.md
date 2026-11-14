# Self-evaluation

| Judging criterion | Outcome and evidence |
| --- | --- |
| Relevance | The official challenge asks participants to pair EIC visuals with their own sonification. Three authentic EIC maps supply real browser-read pixels for the stripe scan, and the map highlights each stripe as its note plays. |
| Validity | The annual comparison uses NASA GISTEMP’s original zonal values and an unchanged shared pitch scale. The numeric table, formula, checksums, preserved NASA legends and direct sources are inspectable. A colored area of a map is not an area-weighted measurement. |
| Creativity | An interactive scan of the actual NASA map sits beside a quantitative comparison of the underlying record. Prior climate sonifications established latitude-based temperature listening, so this project’s contribution is the two linked listening modes and an inspectable comparison. |
| Impact | The same observation can be explored by listening, reading its value, finding it on the globe or following its trace. This helps learners connect an interval to a temperature difference. Learning outcomes have not been measured. |
| Presentation | The observatory opens directly to a playable example. The demo switches from map colors to scientific values before showing the data and attribution. Screenshots record the running app. |

## Issues found and addressed

- **Challenge coverage.** The initial numeric concept alone paired a globe with audio but did not generate audio from EIC frames. Added a separate, tested pixel scan for all three selected maps.
- **Scientific interpretation.** Archive maps use different palettes. Added separate sound-source labels and guidance to use the numeric tracks for comparisons between years. Limited the globe to band-wide averages and disclosed color saturation and baseline.
- **Interaction.** Fixed the solo transport label, unified the slider and chart ranges, recalculated the chart width on resize, retained numerical inspection with missing imagery, and enabled mobile page scrolling over the globe.

## Remaining limits

- The EIC scan is based on RGB differences in rendered graphics. It has six approximate latitude stripes, ignores dark/gray samples, and uses no geographic area weighting. It cannot recover numeric temperatures or support a quantitative comparison between palettes.
- Regional plots summarize broad latitude bands and include varying uncertainty, especially near the poles and early in the record. The app does not fit trends, model causality, or report significance. The snapshots need explicit refresh when NASA updates the source.
- The two voices use stereo position, waveform, and note order so the comparison remains distinguishable on a mono speaker. How readily users perceive the encoding has not been evaluated with a participant study. [Testing details](TESTING.md)

## Guided listen update

The walkthrough poses one question before revealing the data. It plays the same instrument and level for all four notes so the listener can compare the two intervals. The last step gives the actual annual-mean calculation, two periods, source table and change values. The global reference includes the Arctic. Keyboard and browser operation are verified. Listener comprehension and assistive-technology usability have not been measured with participants.
