# HERO — disaster assistance design system

Flat illustrations, rounded cards, and accessible controls for disaster assistance and household preparedness. The almost-white canvas matches [ReliefRN's background token](https://github.com/wee5h/ReliefRN/blob/main/ReliefRN_website/app/globals.css). Yellow is an accent; large surfaces remain white or pale blue.

## Foundations

- Almost-white blue-gray `#f7f9fa`: page canvas and language-menu backdrop.
- Pale blue `#edf5fa`: hero, supporting panels, chat, resource sections, progress tracks, and completed tasks. White `#ffffff`: header, cards, menus, and fields.
- Warm yellow `#ffd34d`: primary actions, logo, and key badges. Hover `#ffca2d`; pressed `#f4bb21`. Use navy text and borders on strong yellow.
- Pale yellow `#fff5cc`: selected options, user chat messages, and small completion badges.
- Deep navy `#153247`: text, headings, navigation, illustration outlines, focus indicators, and checked controls. Secondary text `#496375`; underlined content links `#214e6a`.
- Decorative border `#d4e1e8`; control border `#708797`. Shadows use navy with restrained opacity. Do not use decorative borders as the sole boundary of interactive controls.
- Red `#a82b22` on `#fff1ee`: emergency actions, errors, and deletion warnings. Red buttons use white text; their hover/pressed color is `#842016`.
- The shared `assets/hero-shield.svg` has a navy outer border, yellow fill, white inset outline, and flat pale-yellow highlight. Use it for every header, welcome menu, and browser icon; the PNG export matches it.
- DM Sans variable font (400–700), bundled in `assets/fonts` under the SIL Open Font License. Use `font-display: swap` and system font fallbacks; no remote font request.
- Body: 18px / 1.6. Controls: 16px or larger. Display: up to 64px, 40px on small screens. Supporting labels: at least 14px.
- 1280px page width; 24px card corners, pill action buttons, 4px spacing unit. Prefer surface colors and borders to shadows.

## Components and layout

- White shared header with the yellow shield mark, Home / Find help now / Plan ahead / account navigation. Navigation wraps on mobile without a menu dependency.
- Compact red emergency banner before the homepage's pale-blue split hero. Two white pathway cards contain the actual actions; the local SVG uses navy outlines, blue and yellow accents, and natural skin tones.
- Focused questionnaire and profile cards, bordered answer tiles, visible checked states, strong focus outlines, and clear progress.
- Official referrals and recovery actions use white cards. Declaration context, private reminders, helper summaries, and conversation use pale-blue surfaces. Yellow first-step badges and selected states identify progress; retain source attribution and uncertainty wording.
- Checklist task rows show Done / To do in text as well as checkbox state. Print remains black on white with source URLs and no navigation or controls.
- One column below 900px for the hero; pathway/resource grids stack below 660px. Touch targets are at least 44px. Avoid decorative animation; respect reduced motion for the existing help reveal.
- Normal text contrast is at least 4.5:1; control boundaries and focus indicators are at least 3:1. Navy on yellow measures 9.29:1; secondary text on pale blue measures 5.73:1. Do not use yellow text on white.

## Behavior contracts

Retain all existing IDs, data attributes, hidden states, form labels, status/live regions, focus and scroll behavior, routes, API payloads, and profile schemas. No profile-save consent checkbox. The separate account import and AI sharing controls remain associated with their existing actions. Google sign-in retains Google's rendered button.
