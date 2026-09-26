# Microsoft Hackathon — Virginia Flood Guide

## Goal

Build an AI disaster assistance navigator for Virginia residents preparing for or affected by flooding. Help people find relevant assistance by location, circumstances, and immediate needs, using authoritative government information and plain language. Keep the experience accessible and mobile friendly. Minimize collection of sensitive information and route urgent, sensitive, ambiguous, or high-impact cases to a human representative.

## Prior conversation

Shared ChatGPT context: https://chatgpt.com/share/6ab5afbc-f3f8-83ea-ae7b-46b3a61557b2

The existing Virginia Flood Guide Site was reported as live in the prior conversation. Its F1 start page has a prominent Call 911 action and links to DisasterAssistance.gov and FEMA's Disaster Recovery Center locator. A personal preparedness plan is marked as upcoming. The prior assistant reported its source files at `/workspace/sites/virginia-flood-guide/`, with `dist/index.html` as the main page and `.openai/hosting.json` as the Sites configuration. Those files have **not** been copied into this local project.

## Product decisions

- Focus on flooding in Virginia.
- Use Virginia county or independent city for location questions. A ZIP code may suggest a locality, but the resident must confirm it.
- Keep home locality, current locality, and damage locality distinct.
- Use DisasterAssistance.gov for assistance and application referrals, and the FEMA Disaster Recovery Center locator for nearby help.
- Use OpenFEMA declarations to provide context for the damage locality. A declaration does not establish individual eligibility or confirm applications are open. Display the last successful check time and `status unknown` if data is stale or unavailable.
- Keep the fraud feature out of the plan, per the user's prior request.
- Do not invent current local conditions or Virginia-specific evacuation instructions. The supplied source list lacks an official Virginia source for alerts, evacuation, and detailed flood safety guidance. The prior conversation left open whether one may be added.

## Supplied sources

- https://www.disasterassistance.gov/
- https://www.fema.gov/about/openfema/data-sets
- https://www.fema.gov/about/openfema/api
- https://github.com/FEMA/openfema-samples
- https://egateway.fema.gov/ESF6/DRCLocator
- https://inclusive.microsoft.design/
- https://learn.microsoft.com/en-us/azure/foundry/
- https://learn.microsoft.com/en-us/azure/ai-services/translator/
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live

Microsoft Foundry, Azure Translator, and Voice Live were identified as possible later services. Live AI and language/voice features need setup, credentials, and review of emergency wording.

## Local implementation status

The local Node website in this repository now implements F1–F4 and F5's optional accounts with SQLite. The earlier Sites source is still absent and has not been updated.

- F1: public starting page and immediate-danger 911 action.
- F2: danger, current-locality, and help-need questions.
- F3: source-linked federal referrals with reasons and uncertainty wording.
- F4: optional household questions and review.
- F5: local account creation/sign-in/sign-out, private persistent profile save/edit/delete. Browser-only profiles remain supported; moving one into an account requires consent.
- F6: personal preparedness checklist and print/export (next feature; not implemented).
- F7: OpenFEMA declaration context for the damage locality (not implemented).
- F8: reviewed language and accessibility/low-bandwidth finish (not implemented).
- F9: live AI conversation; server wiring exists, but real replies require Azure configuration.

User preference: SQLite stays local. Saved health, disability, access, and support answers must not be sent to AI. Only home locality and household size may enter optional saved AI context. See FLOOD_GUIDE_README.md for setup and limitations.
