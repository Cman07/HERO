# Nationwide build walkthrough — September 27, 2026 EDT

One scripted browser walkthrough used fictional ZIPs and no personal details. No external participants were available; these observations are product QA, not a usability study.

| Check | Observation |
| --- | --- |
| Fresh help page | Charlottesville was labeled as an example and the current ZIP was blank. USGS hospital and fire/EMS directory pins appeared, with FEMA source status and a text list. |
| New York `10001` | Map recentered to New York. A FEMA-reported shelter appeared with confirmation wording; the housing plan linked to its map card. |
| Puerto Rico `00601` | ZIP kept its leading zero, map and plan changed to Adjuntas, and wildfire/property-damage answers produced a different plan. |
| Damage ZIP `22902` | Census offered three county candidates; a separate county selection preceded the FEMA declaration lookup. |
| Progress and export | Marked shelter-listing progress survived refresh in the same tab. The summary included only the explicitly selected listing, exposed an editable exact-text preview, and requested a text download. |
| Profile | A synthetic home ZIP `00601` and household size `2` saved in a temporary test database. Both were optional and unchecked in the helper summary. The profile page's missing household-size control was found and repaired during this walkthrough. |
| Layout | Desktop map and list displayed side by side. At 390 px width the layout stacked without visible horizontal overflow. Arabic right-to-left layout was also reviewed. |

The final build rendered its first deterministic plan action **11.9 ms after the final need selection** in this one browser run. The plan text download request was issued in **0.4 ms**; this measures the UI request, not completion of a file save. The [live Foundry report](live-ai-nationwide-final.json) records **3,227 ms English** and **1,430 ms Spanish** replies through the final local server. These single-run timings are not representative performance estimates.

During repeated live checks, one model reply was rejected as unverified and another used unsupported “nearby” wording. The deterministic plan stayed available; the output guard now rejects unsupported nearby-center assertions in English and Spanish. A later final-build check returned valid structured replies in both languages. No claim is made about assistance outcomes, cost savings, or translation review by native speakers.
