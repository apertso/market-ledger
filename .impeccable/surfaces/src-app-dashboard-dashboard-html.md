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

FIRST VIEWPORT: A 48px navigation bar sits above a 20px market heading with Pause
and the required plain producer state on its right. A dense six-column table uses
13px values and 8px/12px padding on desktop, with no optional counters or footer.
On phones each instrument uses a compact three-column, two-line group exposing
all five metrics without horizontal scrolling. Settings use three compact field
rows and Apply with a single reset notice. Phones retain 24px headings, 16px values,
and 44px touch targets. The user's refinement
removes descriptive prose, disclosure, status lights, optional metadata, oversized
blocks, and redundant controls.

FORM: Settlement ledger, grounded candidate 3, seed e4b347fa. Shared alignment,
one continuous surface, and fixed numerical baselines carry its discipline.
The signature interaction is freezing the live ledger with an acknowledged Pause,
then resuming the same cumulative totals; no decorative tick animation.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
