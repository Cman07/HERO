# Virginia Flood Guide

The local F2 page keeps its three-question intake and opens an AI chat after the final answer. The chat sends the answers and conversation to an Azure OpenAI deployment through `server.mjs`. The API key stays on the server. The page always shows the two official resource links, including when chat is unavailable.

The locality question uses a searchable list of Virginia's 95 counties and 38 independent cities from the [U.S. Census Bureau county geography list](https://tigerweb.geo.census.gov/tigerwebmain/Files/acs25/tigerweb_acs25_county_2024_acs24_va.html). The list is bundled locally, so filtering works even when the page is opened without the chat server. Selecting a locality confirms the choice; no free-text locality is sent to the chat.

## Run locally

1. Use Node.js 20.6 or later. Copy `.env.example` to `.env` and fill in the endpoint, chat deployment name, and API key from your Azure AI Foundry resource. Keep `.env` private.
2. Run `node --env-file=.env server.mjs`.
3. Open `http://127.0.0.1:3000`.

The endpoint should be the resource origin, for example `https://YOUR-RESOURCE.openai.azure.com` or `https://YOUR-RESOURCE.services.ai.azure.com`. The server calls the Azure OpenAI v1 chat completions route and uses the deployment name as `model`. Without configuration, the page and questionnaire still work, but the chat reports that it is unavailable.

The assistant uses only the two supplied federal destinations for referrals and is instructed not to claim current conditions, application status, center availability, or eligibility. Those instructions reduce risk but cannot guarantee every model answer. Review the emergency wording and model behavior before public use. This local project does not contain the prior Sites source or its hosting configuration, so these changes are not published to that Site.

Run `npm test` to check the chat endpoint's intake validation, emergency gate, and Azure request construction.
