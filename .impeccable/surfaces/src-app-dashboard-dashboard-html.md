---
version: 1
slug: 'src-app-dashboard-dashboard-html'
primary_target: 'src/app/dashboard/dashboard.html'
related_targets: ['src/app/settings/settings.html']
---

# Market dashboard and producer settings

Mode: Operate. Audience: engineers evaluating the assignment. The task is to
compare live metrics, control the run, and apply validated producer settings.
The user selected the settlement ledger and direct implementation in Angular.

## Direction contract

THESIS: A continuous settlement ledger makes current prices and cumulative
totals equally readable. The market table is the working surface.

OWN-WORLD: Warm off-white paper, white table surface, deep green ink, a restrained
rust accent for negative imbalance, IBM Plex Sans, thin rules, tabular figures.
Controls are compact rectangles with clear focus and state text.

STORY: A reviewer sees the simulated market and current run immediately, pauses
without losing totals, and applies settings with an explicit reset explanation.

FIRST VIEWPORT: A slim navigation bar sits above a 36px market heading with Pause
on its right. One horizontal run strip precedes a full-width six-column table.
Below it, a compact count and metric definitions explain the data. Settings use
the same sheet with three vertically aligned fields and an Apply action.

FORM: Settlement ledger, grounded candidate 3, seed e4b347fa. Shared alignment,
one continuous surface, and fixed numerical baselines carry its discipline.
The signature interaction is freezing the live ledger with an acknowledged Pause,
then resuming the same cumulative totals; no decorative tick animation.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
