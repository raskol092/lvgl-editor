# P4 Dashboard example

The dashboard of `hwconf/p4_dashboard/lisp/nav_test.lisp` (P4 firmware) redrawn in the editor: 6 screens of 800×480
(Main 1: speed ring, charts, temperatures and power; Main 2: settings, statistics, diagnostics) in a dark theme,
with Prev / Next navigation buttons and 4 logic graphs:

| Graph | What it shows |
| --- | --- |
| Max speed caption | event trigger (slider `VALUE_CHANGED`) + Lisp code block updates the "45 km/h" label |
| Max speed bar follows the slider | no trigger: *Get property* → *Set value* runs live |
| Uptime counter | timer trigger, every second |
| SD card LED blinks | timer trigger + *Show/Hide* toggle |

* `p4-dashboard.lvgl.json` — in the editor: **Import** (opens it as a new project).
* `lisp/` — what **Download ZIP** produces (`main.lisp` + `ui/`), ready for VESC Tool → Upload.
* `build.ts` — regenerates both: `npx vite-node examples/p4-dashboard/build.ts`.
