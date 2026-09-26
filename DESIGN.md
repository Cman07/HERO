# Virginia Flood Guide — design system

Adapted from [Chat for impact / Turn.io on Refero](https://styles.refero.design/style/18975f37-2e5d-47ca-9367-8b201d20390d) for accessible flood assistance and household preparedness.

## Foundations

- Forest green `#0a3922`: brand, strong headings, navigation, selected controls.
- Warm white `#fbfcf8`: page canvas; white: form and content surfaces.
- Mint `#d2f2e3` / pale sage `#e4f7ee`, sky `#ccf0f8`, lavender `#eee2ff`: supporting sections and cards.
- Coral `#ff643b`: primary actions, paired with deep green text `#062a18` for contrast.
- Red `#a82b22` on `#fff1ee`: emergency actions, errors, and deletion warnings.
- DM Sans variable font (400–700), bundled in `assets/fonts` under the SIL Open Font License. Use `font-display: swap` and system font fallbacks; no remote font request.
- Body: 18px / 1.6. Controls: 16px or larger. Display: up to 64px, 40px on small screens. Supporting labels: at least 14px.
- 1280px page width; 24px card corners, pill action buttons, 4px spacing unit. Prefer surface colors and borders to shadows.

## Components and layout

- White shared header with wave mark, Home / Find help now / Plan ahead / account navigation. Navigation wraps on mobile without a menu dependency.
- Compact emergency banner before the homepage's forest green split hero. Two pastel pathway cards contain the actual actions; a decorative local SVG depicts a household and community.
- Focused questionnaire and profile cards, bordered answer tiles, visible checked states, strong focus outlines, and clear progress.
- Official referrals, declaration context, private reminders, and conversation each have distinct visual surfaces. Retain source attribution and uncertainty wording.
- Checklist task rows show Done / To do in text as well as checkbox state. Print remains black on white with source URLs and no navigation or controls.
- One column below 900px for the hero; pathway/resource grids stack below 660px. Touch targets are at least 44px. Avoid decorative animation; respect reduced motion for the existing help reveal.

## Behavior contracts

Retain all existing IDs, data attributes, hidden states, form labels, status/live regions, focus and scroll behavior, routes, API payloads, and profile schemas. No profile-save consent checkbox. The separate account import and AI sharing controls remain associated with their existing actions. Google sign-in retains Google's rendered button.
