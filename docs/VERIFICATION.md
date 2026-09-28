# HERO recovery release: historical Virginia-build evidence

This page documents the earlier Virginia release. For the current nationwide ZIP and map build, see [nationwide walkthrough](evidence/nationwide-walkthrough.md) and [live Foundry results](evidence/live-ai-nationwide-final.json). The current automated suite passes 59 tests.

Checked September 27, 2026. Baseline: GitHub `main` and the local checkout matched `e4ea89881cecb023320e81029c5c4350b17f0830` before implementation. The screenshots and live checks use local uncommitted changes, not a claim that GitHub has been updated. The final file hashes are recorded in `evidence/build-sha256.json`.

## Automated checks

`npm test`: **44 passed, 0 failed**. The original 39 tests remain; five focused recovery tests cover all need catalogs, progress ownership, bilingual exports, malformed/action/URL/privacy output rejection, and the server's authoritative action context. Existing tests retain initial/later emergency guards, provider timeout/authentication errors, profile exclusions, accounts, preparedness, declaration context and public-only service-worker caching. Static-route/cache tests include both new recovery files.

## Live provider evidence

The stored Foundry prompt agent is version **5**, with the existing model and no external tools. Its instructions match `chat-policy.mjs`. The final demo server used this policy and the new response validator.

| Captured request | Result | End-to-end API time |
| --- | --- | --- |
| First post-privacy-update English check | 502 `invalid_output`; rejected by validation | 2,469 ms |
| First post-privacy-update Spanish check | 200; known `damage-locality` action | 1,407 ms |
| Follow-up English check | 200; known `damage-locality` action | 1,508 ms |
| Follow-up Spanish check | 200; known `damage-locality` action | 2,331 ms |

Both reports are retained: [first pair](evidence/live-ai-policy-validation.json), [follow-up pair](evidence/live-ai.json). These four synthetic calls are not a reliability estimate. A separate live browser call returned a real explanation and a catalog-rendered action. Earlier live review found an address solicitation; the policy was strengthened and common English/Spanish address solicitations now have a focused rejection test. No raw failed provider response was logged, so the specific reason for the retained 502 is not attributed to that guard.

The test requests used fictional current locality and need, with `useProfile: false`. They sent no saved household record or helper edits. Screenshots show fictional data in an isolated temporary database. No Azure tokens, keys or endpoints are included in these artifacts.

## Browser walkthrough

Human participants: **0**. One automated end-to-end fallback journey and targeted browser checks were performed in the Codex embedded Chromium browser. This is engineering verification, not a human usability study.

| Check | Observation |
| --- | --- |
| First useful action | 9,231.1 ms from opening intake to the next painted result in one food/supplies walkthrough. Includes automation/tool pacing; excludes initial page load. |
| Plan rendering | 22.3 ms from final-answer handling to the next animation-frame paint in that same walkthrough. AI was deliberately unconfigured. |
| Progress | Marked one of four property actions; refresh and a round trip through Plan ahead retained the mark and changed the prominent next action. |
| Helper content | Exact preview reflected user questions, remaining/completed actions and official links. A [reviewed English sample](evidence/reviewed-summary-en.txt) was saved from the visible text area as evidence, not claimed as a browser download. |
| Optional profile fields | Home and size started unchecked. Checking them added only those fields. Fictional children/medical-power answers stayed out of the summary. Revoking home after a manual edit disabled exports until rebuilding, which removed home and retained the selected size. |
| Memory boundary | Refresh removed helper questions/edits while retaining recovery progress. |
| Language | English/Spanish switching updated recovery actions, reasons, controls and summary boilerplate. User-authored questions retained their own text. |
| Keyboard/mobile | Locality selected using typing, arrow key and Enter. Checkbox focus preserved after rerender. At 390 CSS pixels, document width equaled viewport width with no horizontal overflow. First recovery action appeared before chat. Wider layout also inspected. |
| AI failure | An isolated server with AI configuration empty displayed AI unavailable. Plan, helper review and export controls stayed usable. This is a controlled configuration failure, not an Azure outage. |
| Offline | Stopped that isolated server and reloaded. The cached public guide displayed the explicit connection-unavailable notice. No account/profile data was supplied by the cache. |
| Export timing | 1.8 ms for Blob creation and download initiation in one observation. This is not disk completion time. The embedded browser did not expose a completed download event. |
| Print | Print action invoked and text remained available; the embedded browser did not expose an OS print/PDF preview. Final PDF pagination is unverified. |

Observed difficulties led to: restoring an explicit retry button after refresh; preserving summary edits with a context-change notice; requiring rebuild after revoking optional data; and tightening AI address wording. There are no human difficulty observations to report.

## Remaining release checks

- Confirm the organizer's final edit/submission cutoff and acceptance of the demo format. Public searches did not establish a definitive final cutoff; the supplied competitor review also did not contain one. [CCI's public events page](https://cyberinitiative.org/events-programs.html) is a reference, not evidence of permission to submit late.
- Run a short walkthrough with available people. Record count, time definitions, each observed difficulty, and resulting changes; do not extrapolate from a tiny sample.
- Open text downloads and inspect English/Spanish PDF pages in the browser used for submission. Check only reviewed text is present and links/page wrapping remain legible.
- Obtain professional Spanish and screen-reader review before making accessibility or translation quality claims.

No cost savings, eligibility accuracy, service availability, dispatch capability, or improved resident outcomes have been measured.

## General-disaster scope update

At the user’s request, HERO now covers hurricanes, floods, wildfires, severe storms and other disasters. Public English/Spanish headings, titles and intake wording were verified in the browser. Preparedness alert/route tasks link to the existing general Ready.gov plan, with task IDs and saved completion preserved. Foundry policy version 6 explicitly prevents assuming a hazard from the questionnaire. The original response/timing reports above remain historical evidence of the recovery release; the new scope check is recorded separately in `evidence/live-ai-disasters.json`.

## Language expansion — September 27, 2026

- Current regression gate: **50/50 tests passed**, including the original 39 tests. `evidence/tests.txt` records this run.
- Seven options: English, Spanish, Modern Standard Arabic, Simplified Chinese, Korean, Vietnamese and Tagalog. Each additional language includes 498 bundled public strings. See `LANGUAGES.md` for the historical Virginia data used to prioritize them and the limits of the Census categories.
- All five needs retain their canonical action IDs and approved URLs in every language. Tests cover translated plans, summaries, checklist text, 911, dynamic values, resident-authored text preservation, server language selection, private-draft exclusion, localized emergency replies, and Unicode word limits.
- Browser checks confirmed all seven language switches preserve a marked action and an edited summary verbatim, including literal HTML-like text in a textarea. Arabic reverses direction; other languages restore left-to-right flow. Evidence: `evidence/language-browser-checks.json`.
- The five added languages and English had no horizontal overflow at 375 CSS pixels in the recovery journey. Evidence: `evidence/language-mobile-checks.json`; screenshot: `screenshots/recovery-ar-mobile.png`. Arabic preference survived account refresh and navigation to the offline fallback. Chinese household questions and Arabic account/offline controls were inspected. The cached-public-assets regression gate still excludes private APIs.
- Foundry policy **version 9** matches the multilingual policy. Live checks initially caught malformed output with explanation text outside JSON; the server rejected it. A broad Vietnamese address-solicitation pattern was corrected so ordinary county questions are accepted. The stored formatting instructions were strengthened; locality names must remain as supplied. The initial validation report is retained in `evidence/live-ai-languages-validation.json`.
- The final exact-preview-build check produced valid structured replies in all seven languages, with selected-language wording and approved action IDs. One synthetic request per language took **1,183–2,226 ms**; see `evidence/live-ai-languages.json`. No household profile was sent. These are individual observations, not reliability or translation-quality guarantees.
- Qualified native-speaker review, screen-reader review and actual OS print/PDF/download inspection remain open. Automated literal/completeness checks do not verify every translation or every AI statement. Human participant sample size remains **0**.
- The existing five-minute video predates this language expansion; these reports and the running preview are the current language evidence.

## Language welcome menu — September 27, 2026

- First-visit selection, Arabic right-to-left layout after selection, preference persistence after refresh, and reopening with the selected language were checked in the running preview. The menu stays left to right and labels Arabic’s reading direction.
- At 375 × 812 CSS pixels, all seven choices were visible without horizontal overflow. Keyboard focus wraps inside the dialog; Escape after reopening preserves the current language and returns focus to the opener.
- All **50 automated tests pass** after the change. Public locale packs now contain **499 strings**. The service-worker public-cache version was updated.
- Evidence: `evidence/language-welcome-checks.json`, `screenshots/language-welcome.png`, and `evidence/tests.txt`. The welcome menu runs locally and does not contact an AI service.

## French and explicit confirmation — September 27, 2026

- French is the eighth interface language. Its 499 public translations cover the guest journey, approved recovery actions, summaries, preparation, account controls and public offline guide. French preserves action IDs, official links, Virginia locality names and resident-authored content.
- First visits require a language selection followed by **Confirm**; selection alone leaves the menu open and the page unchanged. Escape cannot enter the site on a first visit. Subsequent visits remember the confirmed language; reopening can be cancelled. The top selector also uses confirmation.
- At 375 × 812 CSS pixels, there was no horizontal overflow. The language options scroll while confirmation remains visible. Tab and Shift+Tab wrap through Confirm and the emergency link. Evidence: `evidence/language-confirm-checks.json` and `screenshots/language-confirm-mobile.png`.
- All **50 tests pass**, including French localized provider context, narrow urgent disclosures with no provider calls, address-solicitation rejection and export literals. The service-worker public-cache version was updated.
- Foundry policy **version 10** includes French. One fictional request through the running port-3000 preview returned valid French wording and `damage-locality` in **2,179 ms**. See `evidence/live-ai-french.json`. No household profile was sent; this single observation does not establish reliability or native-speaker translation quality.

## Immediate language previews and smaller welcome text — September 27, 2026

- All eight selections immediately update the page title, interface language, welcome heading, instructions, emergency link, status, footer and confirmation label while the dialog remains open. The confirm button contains only the selected language’s wording. Native language names stay recognizable in their own scripts. Arabic applies right-to-left flow to the menu and page.
- Confirmation saves the selection and opens the page. Cancelling a reopened preview restores the last confirmed language; refreshing an unconfirmed preview uses that saved language. The first-visit confirmation requirement is retained.
- Welcome headings were reduced from 27–34 to 25–30 CSS pixels, language names from 20 to 18, and supporting copy and confirmation from 16 to 15. Touch targets remain at least 44 pixels.
- Browser checks covered all eight previews, cancellation and refresh. At 375 × 812 CSS pixels, Arabic and French confirmation controls stayed visible without horizontal overflow. The existing 50-test regression suite passes. Public packs now contain 507 strings, and the public-cache version was updated. Evidence: `evidence/language-preview-checks.json`, `screenshots/language-preview-ar-mobile.png`, and `screenshots/language-welcome.png`.
