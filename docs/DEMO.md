# Five-minute HERO demo

This recording shows the earlier Virginia three-question build. It does not demonstrate the current nationwide ZIP survey or resource map; use [README.md](../README.md) for the current journey.

## Delivered recording

`demo/hero-five-minute-demo.mp4` is a five-minute narrated walkthrough assembled from actual local browser captures and recorded API evidence. Narration is a local system voice. It is an edited sequence of captured states, not an uninterrupted screen recording. The Foundry response shown was received from the genuine configured agent; the AI failure section is explicitly labeled a controlled unconfigured-provider demonstration. All household details are fictional.

The transcript is in `demo/transcript.md`; `demo/captions.srt` provides timed captions. Generated media is kept out of Git by default. The source storyboard and screenshots remain versionable. No upload or submission has been made.

## Recording sequence

| Time | Show | Explain |
| --- | --- | --- |
| 0:00–0:30 | HERO home | Virginia resident problem; a clear next step without an account |
| 0:30–1:30 | Intake and recovery plan | Three questions; distinct tasks; reasons, approved links, review dates and resident-reported progress |
| 1:30–2:15 | Genuine Foundry result | Explains curated actions; UI renders catalog labels/links; status reflects outcome |
| 2:15–3:00 | Helper review | Edit exactly what is exported; saved sensitive fields and chat excluded; no helper contact |
| 3:00–3:45 | Existing preparedness | Optional fictional household; tailored local tasks; private profile boundary |
| 3:45–4:20 | Spanish and offline captures | Bilingual fixed copy; only public guide cached |
| 4:20–4:45 | Controlled AI failure | Provider deliberately unconfigured; plan and helper review still available |
| 4:45–5:00 | Evidence | 44 tests, live bilingual calls, sample-size limits and practical boundaries |

## Reproduce a continuous personal recording

1. Use Node 24, install dependencies, run `npm test`, then start HERO. Use a separate `PROFILE_DATA_DIR` for fictional demo records. Keep `.env`, terminals with account details, and real saved profiles out of frame.
2. Run `npm run sync:ai-policy` and the bilingual live check against the exact port used for recording. Preserve failures as well as successes. Reauthenticate through Azure CLI if needed.
3. Start as a guest: No immediate danger, current Fairfax city, property damage. Mark the application route as reviewed. Keep current, home and damage locality distinct.
4. Show a genuinely received AI reply and its catalog action. Never substitute mock text while labeling it live. Do not measure latency from edited video timing.
5. Open helper review, enter a fictional unresolved question, inspect optional fields and export. Check the downloaded file and OS print/PDF preview in a supported browser. Those native dialogs were not exposed by the embedded browser used for this implementation.
6. Show the existing preparedness checklist with fictional household values. Explain that support answers shape local tasks and do not enter the AI payload or helper summary automatically.
7. Switch to Spanish. For offline, first load the public shell online, stop only the demo server, then reload. Clearly distinguish cached guidance from live services.
8. For the failure segment, use a separate port and temporary data directory with `FOUNDRY_AGENT_ENDPOINT`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, and `AZURE_OPENAI_API_KEY` set to empty strings. Label this as a controlled configuration failure. Do not break the working agent to simulate an outage.
9. End with the observed measurements in [VERIFICATION.md](VERIFICATION.md). Human sample size is zero until a real walkthrough occurs. Confirm the submission cutoff and review the complete recording before uploading.

## Human walkthrough worksheet

For each available participant, ask them to obtain a plan, mark a step and prepare a summary using fictional data. Record start/end definitions, assistance needed, confused wording, accidental inclusions, keyboard/device issues and whether the export matches the preview. Record the number of participants and individual observations; avoid outcome claims.
