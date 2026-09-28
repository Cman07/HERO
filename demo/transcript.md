# HERO: narrated walkthrough

Edited browser captures · fictional data · local system-voice narration

## 0:00–0:30 · A clearer next step

HERO helps Virginia residents find a clearer next step after a disaster. A resident may know what they need, but still face uncertainty about what to do first and what to ask a helper. This walkthrough uses fictional information and actual local browser captures. HERO provides a curated recovery plan, optional AI explanation, and a reviewed summary that the resident controls.

## 0:30–1:30 · From need to recovery plan

The guest journey starts with three short questions. First, HERO checks for immediate danger and directs emergencies to nine one one. Next, the resident selects a current Virginia county or independent city, or skips that question. Finally, they choose a need. A deterministic plan appears before the AI reply. Housing, supplies, property damage, in person assistance, and an uncertain need each have different tasks. In this fictional property damage example, the resident has reviewed the official application route. The next incomplete action is now prominent: confirm where the damage occurred. Current locality, saved home locality, and damage locality are separate. Each action explains why it was selected and includes an approved federal destination and review date. Completion means the resident marked a step; it does not confirm an agency action. Progress survives refresh in the same tab and resets when the intake or account changes.

## 1:30–2:15 · A bounded role for Foundry

This captured response came from the configured Microsoft Foundry agent. It explains why the location of damage matters, using an action already in the recovery plan. The server supplies approved candidate actions and validated resident reported completion. The model must return a short reply and up to three known action identifiers. HERO rejects malformed output, unknown actions, excessive text, and prohibited links. It renders action titles and destinations from its own catalog. The interface only says AI reply received after a successful response. Foundry cannot check the nearest recovery center, determine eligibility, submit an application, or mark tasks complete. Invalid output leaves the resident plan available.

## 2:15–3:00 · Prepare a summary for a helper

The resident can prepare a summary without relying on AI. The review includes their stated need, current locality, explicitly selected damage locality, completed and remaining actions, approved links, language, and date. They can add unresolved questions and edit the exact text that will be exported. Saved home locality and household size are included only after separate selection here. Saved health, disability, and support answers, and the chat history, are excluded. Summary edits stay in page memory and are never sent to Foundry. Printing, text download, and a copy fallback support a portable handoff. Exporting does not contact a helper, reserve assistance, or create a case record.

## 3:00–3:45 · Preparedness stays personal

HERO also retains the existing preparedness journey. This fictional household has selected children and a need to plan for powered medical equipment. Local rules add relevant preparation tasks, including discussing backup arrangements with a care team or equipment provider. Those saved support answers do not enter the AI request or the recovery helper summary. Preparedness completion is stored with the encrypted local profile. Recovery progress remains separate in the current tab. Accounts are optional, and saved profiles stay on the host computer. Residents should keep exported copies private. Encryption protects stored payloads, while access to both the database and its key remains an important host security boundary.

## 3:45–4:05 · English and Spanish

English and Spanish cover the intake, recovery actions, explanations, and export boilerplate. The catalog preserves the same action identifiers and approved destinations in both languages. Resident written questions are not silently translated. Professional Spanish review remains a release check.

## 4:05–4:20 · A cached public guide

Here the isolated demo server was stopped and the public guide still loaded. The notice explains which services require a connection. Accounts, saved profiles, chat, and FEMA responses are excluded from the public cache.

## 4:20–4:45 · Controlled AI failure

This is a controlled failure demonstration with the AI provider deliberately unconfigured. It is not a claim of an Azure outage. The status says AI unavailable, while the food and supplies plan, helper review, and export controls remain usable. The resident can continue working from curated guidance and approved destinations. No model response is needed to obtain a meaningful plan.

## 4:45–5:00 · Evidence and practical limits

All forty four automated tests pass. The final English and Spanish live checks succeeded. These are synthetic observations, with no human participants. HERO provides guidance and a portable summary; it does not guarantee assistance or outcomes.
