# Central Lab Feature — Release Summary

- **Deploy time:** 2026-08-03 18:44 (+07, Monday)
- **Commit:** generated this release
- **Purpose:** New "Central Lab" page with a binary door-code calculator, boss respawn timers, and boss info tables.

## What changed

### Modified files
| File | Change |
| --- | --- |
| `src/App.tsx` | Added hash-based routing (`#/central-lab`) with a `hashchange` listener; renders `CentralLabPage` on that route. |
| `src/components/Header/index.tsx` | Added the new `CentralLabButton` to the header controls. |
| `src/locales/messages.ts` | Added 25 new translation keys for **English**, **Portuguese**, and **Thai**. |

### New files (untracked → tracked)
- `src/pages/CentralLab/index.tsx` — Central Lab page composing Binary Calculator, Boss Timer, and Boss Info.
- `src/data/centralLab.ts` — element/race lookup data, 3-stage boss list (with HP), boss durations, default set names.
- `src/components/CentralLabButton/` — header link button to `#/central-lab`.
- `src/components/CentralLab/BinaryCalculator.tsx` — computes `(day + month) × 5`, converts to 8-bit binary, highlights which switches to press.
- `src/components/CentralLab/BossTimer.tsx` — three sets of independent countdown timers; per-set rename; sound/notification/speech alert when a timer finishes.
- `src/components/CentralLab/BossInfo.tsx` — boss reference tables with links to divine-pride.net.
- `src/components/CentralLab/styles.ts` — shared styled components.

## What it does
- 🧪 Central Lab page reachable via `#/central-lab` or the 🧪 header button.
- Binary door code calculator → decimal + ON-switch list.
- Boss countdown timers (stage durations) with rename + finish alerts.
- Boss info lookup table (name / HP / race / element / weak) per stage.

## Deploy notes
- Build + push prepared with `npm run deploy:lite`.