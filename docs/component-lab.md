# Component Lab — Scatter Explorer (experimental)

> **Status:** proposed for V2. This is a read-only exploratory workspace, **not** a diagnostic system or a replacement for **Analysis**. Results from unverified historical files must not be presented as validated test-run conclusions.

## Why this page exists

The production **Analysis** page is designed to review individual runs and compare time-series signals. **Component Lab** asks a different question: *How are two telemetry signals related?* The explorer helps Electrical, Mechanical, Embedded, and Software members investigate hypotheses before deciding which views deserve a place in Analysis.

- **One dot** = a matched pair of X/Y values from a single observation. Its horizontal position is X and vertical position is Y; it is **not** necessarily a point in time.
- **Two colors** can compare recordings; optional colors can instead show four **relative** regions.
- The plot can draw **fewer dots than the number of valid observations** to stay responsive. See the data limitations below.

## Start in 60 seconds

1. In the dashboard, open **Component Lab** (`/#componentLab`).
2. Under **Question**, choose a starting question (e.g. *Electrical · Current vs voltage*). This selects X and Y for you. You can override the axes to build a custom comparison.
3. Under **Data source**, choose either **Historical examples** (works without an API) or **App runs (FastAPI)** (requires the existing backend and its run data).
4. Select **Recording A**; optionally enable **Compare two recordings** and select **Recording B**.
5. Read the scatter, then the compact correlation summary below it. Use **Chart options** only when you need overlays. Use **💡 Help** for an in-page reminder.

**Recommended first demo:** *Electrical · Current vs voltage*. A negative correlation may motivate checking voltage sag under current load. It does **not** diagnose a bad battery. Another useful question is *Mechanical · Speed vs electrical power*, where speed, acceleration, gradient, and driving conditions can all matter.

## Controls

| Control | What it changes |
| --- | --- |
| **Question** | Preset axes and an engineering question; **Custom X / Y** means you chose axes manually. |
| **Data source** | Bundled historical excerpts or read-only data from the current FastAPI application. |
| **X axis / Y axis** | Selects the numerical fields used to pair observations. |
| **Recording A / B** | Source recordings or database runs to compare. |
| **Compare two recordings** | Adds/removes the second series. |
| **Chart options** | Expands advanced displays; collapsed by default. |
| **Correlation summary** | Shows Pearson and Spearman per recording. |
| **Linear trend** | Draws a least-squares straight line as a descriptive reference. |
| **Binned median trend** | Connects the median Y for groups of similar X values; helpful for some curved patterns, but can be misleading with mixed operating modes. Off by default. |
| **Relative regions / Color by** | Splits the **selected data** around shared X and Y medians into low/low, low/high, high/low, high/high. These are **relative groups, not ML classifications**. |
| **Unusual point candidates** | Highlights points far from a binned-median reference using a robust residual heuristic. A highlight is not a confirmed measurement error or mechanical fault. |
| **Points shown per recording** | Limits dots rendered in the browser; does not change statistics computed over the points already loaded. |
| **Point radius** | Visual circle size only. |

## Interpreting the numbers

| Metric | Meaning | Limitation |
| --- | --- | --- |
| **Pearson `r`** | Linear association from -1 (negative) through 0 (weak linear association) to +1 (positive). | A curved relationship may have a low `r`; strong `r` does not establish cause. |
| **Spearman `ρ`** | Association between the **ranks** of X and Y; useful for monotonic patterns that need not be straight. | Does not detect every non-linear pattern, such as a symmetric U shape. |
| **Linear `R²`** | For an ordinary least-squares line with an intercept here, `r²`: how much observed Y variation the straight-line fit accounts for in this selected dataset. | Not predictive performance on unseen runs and not proof of a useful model. |
| **Slope (Y/X)** | The change in fitted Y for a one-unit change in X; **units matter**. | Do not compare slopes between different axis unit choices. |
| **Valid / total** | Number of loaded observations with both selected values finite, versus the supplied total. | Null/blank/non-finite values are excluded, not silently treated as zero. |

### A deliberate sanity check

Choose *Current vs calculated power*. **Electrical power is derived from current and voltage** (`power_w = current_a × voltage_v`), so a Pearson correlation very close to +1 is not an independent scientific discovery. The screenshots from the historical demo show around `1.000` and `0.999` for the two selected excerpts. Use this example to explain **derived-variable correlation**, not motor performance.

### What the grouping means (and does not mean)

The four regions use the **median of the currently selected paired observations** as the X and Y thresholds. Switching recordings or axes changes those thresholds. A point called `High X / Low Y` is high/low **relative to the selected sample**; it is not automatically an efficient run, a healthy system, or an operating-mode classifier.

Likewise, unusual residual candidates use a robust heuristic (median absolute deviation against a binned-median reference). This can flag valid values if the cloud contains multiple operating states. Confirm suspicious observations against time series and sensor metadata.

## Data sources, conversions, and provenance

**Historical examples:** `src/data/componentLabHistorical.json` contains limited excerpts prepared from archived UOSM files (currently `d_73.csv` and `d_75.csv`). Source links are available in the **Data sources** footer of the page. The exact recording boundaries, car identity, and conditions have **not** been verified. Do not describe the excerpts as comparable competition runs.

**App runs (FastAPI):** The frontend calls the existing `GET /runs` endpoint and then the read-only `GET /telemetry/data` endpoint for selected runs using `max_points=600` and requested fields. The data comes from the application's backend **only when it is configured and reachable**. This mode is historical REST retrieval, **not live telemetry or a WebSocket**. It does not alter PostgreSQL, create runs, or import CSV files.

The backend contract stores raw sensor values; the UI converts them exactly once:

| Backend / CSV field | Raw unit | Component Lab field |
| --- | --- | --- |
| `tick` | milliseconds since sensor boot | `elapsed_s = (tick - first_loaded_tick) / 1000` |
| `speed` | meters/hour | `speed_kmh = speed / 1000` |
| `current` | milliamps | `current_a = current / 1000` |
| `voltage` | millivolts | `voltage_v = voltage / 1000` |
| `throttle` | tenths of a percent | `throttle_pct = throttle / 10` |
| derived power | — | `power_w = current_a × voltage_v`, when both inputs exist |

The offset `elapsed_s` describes time since the **first loaded sample**, not wall-clock time. Missing fields remain missing. Electrical power is not mechanical shaft power.

**Sampling caveat:** The app requests **up to 600 source observations per run**, and the scatter may show a smaller subset of those. Correlations operate on **all valid loaded pairs**, not just the displayed dots, but in App mode the loaded sample is **not necessarily the whole run**. Brief spikes and minority regimes can be missed. Always use full-resolution data and appropriate interval handling for final engineering analyses.

Source of truth for raw units and import rules: [backend telemetry contract](https://github.com/UOSupermileage/Telemetry_Backend/blob/main/docs/telemetry-units.md).

## Questions worth reviewing with the teams

- **Mechanical:** Does *speed versus electrical power* separate steady-speed conditions from accelerations or slopes? Which additional measurements (grade, mass, wind, acceleration) would be needed before comparing efficiency?
- **Electrical:** Does voltage change with current, and are those readings sampled and calibrated consistently? Does the pattern persist under comparable conditions?
- **Embedded:** Is throttle meaningful across the recordings? Some historical samples have constant or missing throttle, so correlation can be undefined.
- **Data science:** Can a time trend or a mixed driving regime explain an apparent relationship? What sampling/segmentation strategy is valid for each question?

**Decision gate for integrating with Analysis:** agree with Mechanical/Electrical which specific engineering question and result will inform a decision; then validate it on identified, full-resolution runs. The explorer alone must not issue labels such as *faulty battery*, *efficient driver*, or *optimal driving strategy*.

## Developer notes and tests

The feature is isolated from production Analysis. Files of interest:

- `src/pages/ComponentLabPage.jsx` — page UI, scenario presets, source selection and loading.
- `src/components/ScatterChart.jsx` — reusable XY visualization; axes/overlays are props.
- `src/services/scatterStatistics.js` — Pearson, least-squares line, numeric guards.
- `src/services/scatterInsights.js` — Spearman, binned medians, relative regions, unusual residuals.
- `src/services/componentLabApi.js` — read-only FastAPI adapter and display-unit normalization.
- `src/services/telemetryUnits.js` — shared raw-to-display unit conversions.

```bash
npm run build
npx vitest run --config vitest.component-lab.config.js
npm run dev
```

Visit `http://localhost:5173/#componentLab` after launching Vite. The page can display historical examples without FastAPI; **App runs** requires the usual `VITE_API_BASE_URL=/api` configuration and a running backend. Changes to these docs do not replace tests, manual browser checks, or team validation of the hypotheses.
