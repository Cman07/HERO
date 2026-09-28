# Language support

The language choices were originally selected using Virginia data. HERO now serves ZIP areas nationwide; this document is the historical basis for the existing eight language packs, not a ranking of languages spoken throughout the United States.

HERO offers English, Spanish, Arabic, Simplified Chinese, Korean, Vietnamese, Tagalog and French across the guest intake, recovery plans, reviewed helper summaries, preparedness checklist, account/profile controls and exports. Arabic uses a right-to-left layout. Residents choose a language; HERO does not infer it from their location or identity. On the first visit, a welcome menu shows all eight languages in their own scripts before the site opens. The Arabic option explains that it reads right to left. Selecting a card immediately previews the entire interface and welcome-menu copy in that language. Residents must press the localized confirmation button to enter the page and save their choice; the button contains only the selected language’s wording. Language names remain in their own scripts so residents can recognize each option. HERO remembers the confirmed selection in browser storage; residents can reopen the menu through “Choose language” beside the existing language selector. The menu adopts the selected language’s reading direction and supports keyboard navigation. On a first visit, Escape keeps the menu open until the choice is confirmed. When the menu is reopened, Escape cancels the pending choice and retains the confirmed language. Changes through the top language selector also open the confirmation menu.

## Why these additions

Virginia's [2024 DMAS Language and Disability Access Plan, pages 19–20](https://dmas.virginia.gov/media/r0ka0cfp/ld-access-plan-2024-copy-for-the-general-public.pdf) reproduces statewide **2022 ACS five-year estimates**, table B16001, for residents aged five and older speaking a language at home:

| Category | Estimated speakers | HERO option |
| --- | ---: | --- |
| Spanish | 605,710 | Español (existing) |
| Arabic | 59,293 | العربية |
| Chinese, including Mandarin and Cantonese | 58,872 | 简体中文 (Simplified Chinese) |
| Korean | 56,747 | 한국어 |
| Vietnamese | 52,098 | Tiếng Việt |
| Tagalog, including Filipino | 47,045 | Tagalog |
| French, including Cajun | 33,822 | Français |

These are historical estimates, not a claim about today's exact ranking or English proficiency. They establish a documented statewide basis for this release. A newer Census API request did not return usable estimate data during implementation. The Chinese Census category does not measure script preference; Simplified Chinese is the explicit written-language option implemented here. Traditional Chinese remains a separate future addition.

The next category combines Amharic, Somali and other Afro-Asiatic languages (40,652). It cannot be treated as an Amharic-only count. French is the next individually named language category and is included in this release. Urdu (33,407), Persian including Farsi/Dari (33,224), and Hindi (31,033) also warrant future coverage. Counts are estimates; the table reproduced by DMAS does not include margins of error.

## Translation and privacy

The six additional packs were generated from **public editorial copy only** using the existing Azure model. They are stored as editable JSON in `locales/` and bundled into `locales.cjs`. Runtime language changes need no translation API and send no resident information. This is draft localization: automated completeness/literal checks and an implementation review do not substitute for qualified native-speaker review of wording and usability.

Approved action IDs, canonical questionnaire values, dates, URLs, and Virginia locality names remain unchanged. User-entered summary edits and questions are preserved verbatim. Existing chat replies and FEMA record titles retain their original language. New AI requests carry the selected language name. Official sites and Google sign-in may offer their own language controls.

Emergency intake gates work in every interface language. The additional urgent-message patterns catch specific clear statements in the supported languages; they are not comprehensive emergency assessment. AI output remains subject to the action/URL/length checks. Unicode word segmentation enforces the word limit, with an additional 1,200-character ceiling for every language.

## Maintenance

1. Add or update English public-copy keys in `docs/localization-source.json`.
2. Edit each `locales/*.json` pack with reviewed translations. Keep placeholders and 911 unchanged.
3. Run `node docs/build-locales.mjs` to regenerate the offline bundle without network access.
4. Run `npm test`, then check all languages in the browser and exports.
5. `node docs/localize-public-copy.mjs` is an explicit operator tool for generating missing public translations through Azure. It reads configuration credentials but never profiles, conversations or helper drafts. It makes billable model requests; ordinary use of HERO never calls this script.

The service worker includes the language bundle and continues to exclude private APIs and account data from its cache.
