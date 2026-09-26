# Virginia Flood Guide

The local F2 page keeps its three-question intake. F3 uses the selected need to order and explain referrals to DisasterAssistance.gov and FEMA's Disaster Recovery Center locator. These referrals work without the AI service and do not claim that assistance or a center is currently available. The page also opens an AI chat after the final answer. Chat sends the answers and conversation to an Azure OpenAI deployment through `server.mjs`, which keeps the API key off the browser.

The locality question uses a searchable list of Virginia's 95 counties and 38 independent cities from the [U.S. Census Bureau county geography list](https://tigerweb.geo.census.gov/tigerwebmain/Files/acs25/tigerweb_acs25_county_2024_acs24_va.html). The list is bundled locally, so filtering works even when the page is opened without the chat server. Selecting a locality confirms the choice; no free-text locality is sent to the chat.

## Household profile (Plan ahead)

`plan.html` provides a centered, four-step optional form for home locality, household size, pregnancy, children, older-adult support, disability/access needs, mobility, medical-device electricity, transportation, and pets/service animals. Every personal question supports “Prefer not to say.” Residents can review, update, and delete their profile.

Profiles are persisted in a local SQLite database under `.data/profiles.sqlite`. The payload is encrypted with AES-256-GCM; the random 32-byte encryption key is stored separately in `.data/profile.key`. Both are excluded from Git and the static server allowlist. Keep the database and key private; back them up together. Encryption does not protect against someone with access to both files or the running server.

## F5: optional local accounts

The [original feature chart](https://chatgpt.com/share/6ab5afbc-f3f8-83ea-ae7b-46b3a61557b2) defines F5 as optional sign-in and private save/edit/delete controls. Open **Sign in** from the header or **Manage account** on Plan ahead. Create an account with a username (3–32 characters) and password (12–128 characters). Account credentials are local to this running HERO site; Google sign-in and explicit linking are supported when configured; password recovery is not available.

Accounts and hashed session tokens persist in `.data/accounts.sqlite`. Passwords use Node's asynchronous scrypt with a random salt; plaintext passwords are never stored. Account sessions use random HttpOnly, SameSite=Strict cookies, expire after 30 minutes of inactivity or 7 days total, and are revoked on sign-out. Production cookies add Secure; serve over HTTPS for public use. Login/register attempts are limited to 10 per address per 15 minutes within the running server process. Keep `.data` private and back it up with the profile encryption key.

While signed in, the server loads and modifies only that account's profile. A resident can sign in from a new browser connected to the same running site and retrieve the same record. The profile owner is determined by the server session, never by a submitted account or profile ID. Deleting a household profile keeps the account and sign-in intact. The form asks for confirmation before deleting and detects account changes before saving or deleting.

Guests can still use Find help now immediately and save an optional browser-only profile as before. An opaque `hero_profile` cookie associates that browser with its encrypted record. A browser-only profile does not sync between devices; anyone using that browser can see it. Signing in never silently imports it or overwrites an account profile. The account page offers an explicit consent step to move the browser profile into an empty account; a successful move removes the browser-only copy. Sign out after using an account on a shared browser.

**Saved health, disability, access, and support answers never enter the AI request.** The “Find help now” flow shows private household reminders alongside official referrals. An unchecked-by-default option lets the resident share only saved home locality and household size with Azure AI alongside the fresh questionnaire. The server retrieves those two fields from that browser's database record; client-supplied profile IDs or extra profile fields are ignored. Home locality is never automatically assumed to be current or damage locality. Chat messages are still transmitted to Azure, so the UI asks residents not to type private health or identifying details.

The older home-only localStorage profile is not automatically migrated. Create a household profile on the new page. Immediate-danger answers continue to direct residents to 911 without calling AI.

## Run locally

1. Use Node.js 24.14 or later (the database uses built-in `node:sqlite`). Copy `.env.example` to `.env` and fill in the endpoint, chat deployment name, and API key from your Azure AI Foundry resource. Keep `.env` private.
2. Run `npm start`. The server loads `.env` if present and creates the local profile database. Restart the server after changing server routes or configuration.
3. Open `http://127.0.0.1:3000`.

The endpoint should be the resource origin, for example `https://YOUR-RESOURCE.openai.azure.com` or `https://YOUR-RESOURCE.services.ai.azure.com`. The server calls the Azure OpenAI v1 chat completions route and uses the deployment name as `model`. Without configuration, the page and questionnaire still work, but the chat reports that it is unavailable.

The assistant uses only the two supplied federal destinations for referrals and is instructed not to claim current conditions, application status, center availability, or eligibility. Those instructions reduce risk but cannot guarantee every model answer. Review the emergency wording and model behavior before public use. This local project does not contain the prior Sites source or its hosting configuration, so these changes are not published to that Site.

Run `npm test` to check encrypted profile persistence, browser/account isolation, password hashing, session expiry and sign-out, profile validation and CRUD, exclusion of sensitive fields from AI requests, the emergency gate, and static page routes. Tests use temporary databases and a mocked Azure response. Real chatbot replies require your Azure configuration.


## Google sign-in and linking

The account page offers Google sign-in alongside the existing username/password form. If `GOOGLE_CLIENT_ID` is empty, it displays an unavailable message and continues to support local accounts and guests. Profiles stay in the encrypted local SQLite database. Google receives the sign-in interaction, not the household questionnaire. No Gmail or Drive access is requested.

1. In [Google Cloud](https://console.cloud.google.com/), create/select a project. Configure Google Auth Platform branding, audience and test users if using testing mode. Create a **Web application** OAuth client.
2. Register **Authorized JavaScript origins** for `http://localhost:3000` and, once private access is ready, the exact HTTPS address printed by `npm run start:private`. This implementation uses the Google Identity Services popup/callback flow; it does not need a client secret or an authorized redirect URI.
3. Put the client ID ending in `.apps.googleusercontent.com` into `GOOGLE_CLIENT_ID` in the existing `.env` file. Keep existing Azure settings. Restart HERO.
4. Open the registered origin's `/account.html`. Google-only sign-in creates an account with an internal generated username. Return with the same Google account on another connected device to load the same profile.
5. To preserve an existing username/password profile, **sign in with that username first**, then use **Link your Google account**. After linking, either method opens that same account. Signing in with Google while signed out creates/opens its own account; matching emails never silently merge profiles. If Google already belongs to another HERO account, linking is refused; existing profiles are kept.

The server uses Google's official `google-auth-library` to check signatures, audience, issuer and expiry, then checks the nonce and verified email. A ten-minute, one-use SQLite challenge binds sign-in/linking to the browser and the original account session. Google identities are keyed by Google's stable `sub`, not email. The account database migrates existing password accounts in place without changing their profile owner, password hash or sessions. ID tokens are not persisted or logged.

## Private access from other devices (SQLite stays on this computer)

1. Install the official app with `brew install --cask tailscale`. The macOS installer requires your administrator password. Open Tailscale, sign in and approve the macOS VPN setup yourself.
2. Install/sign in to Tailscale on each phone or computer that needs access, using your private network. Restrict access to your own devices.
3. Stop the existing `npm start` process so port 3000 is available. In this HERO directory, run `npm install`, then `npm run start:private`.
4. The helper discovers the connected computer's Tailscale DNS name, starts HERO on loopback, enables Secure cookies and checks writes against that exact HTTPS origin. It runs `tailscale serve --bg http://127.0.0.1:3000` and prints your private HTTPS account-page URL. Follow Tailscale's HTTPS activation instructions if prompted, then retry. It uses **Serve**, which is private to your network.
5. Register that HTTPS origin in Google Cloud as above. On another connected device, open the same HTTPS URL and sign in. Existing profiles remain on this computer; it must stay awake, online, and running HERO.

Ctrl+C stops HERO. The Serve proxy may remain configured; `tailscale serve reset` removes that computer's Serve configuration when you no longer need it. Access through localhost is intended for ordinary `npm start`; private mode uses its printed HTTPS address because account cookies are Secure. No router port forwarding or public website deployment is needed.

Verification: `npm test` covers Google identity separation/linking, existing-account migration, one-use challenges and session rotation, token signature/audience/issuer/expiry/nonce validation, profile isolation, and the existing AI privacy boundary. Tests use generated test signing keys and mocked Google identities; live Google sign-in requires your client ID and approved origin.
