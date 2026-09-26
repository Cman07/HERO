// F3: plain-language referrals. This file makes no live eligibility or availability checks.
const assistanceUrl = 'https://www.disasterassistance.gov/';
const centerUrl = 'https://egateway.fema.gov/ESF6/DRCLocator';

const plans = {
  'A place to stay': [
    { name: 'DisasterAssistance.gov', url: assistanceUrl, reason: 'Explore current assistance options related to housing and follow the official application instructions.' },
    { name: 'FEMA Disaster Recovery Center locator', url: centerUrl, reason: 'Check whether an in-person center is available. Staff may be able to explain housing and rental assistance.' }
  ],
  'Food or basic supplies': [
    { name: 'DisasterAssistance.gov', url: assistanceUrl, reason: 'Use the official assistance finder to look for current food and basic-needs options.' },
    { name: 'FEMA Disaster Recovery Center locator', url: centerUrl, reason: 'If a center is available, ask staff about other assistance and referrals.' }
  ],
  'Help after property damage': [
    { name: 'DisasterAssistance.gov', url: assistanceUrl, reason: 'Check official disaster assistance and application steps for damage at the affected location.' },
    { name: 'FEMA Disaster Recovery Center locator', url: centerUrl, reason: 'Find a center where you can ask a representative about an application or notices.' }
  ],
  'In-person assistance': [
    { name: 'FEMA Disaster Recovery Center locator', url: centerUrl, reason: 'Search for a center and check its location, hours, and services before going.' },
    { name: 'DisasterAssistance.gov', url: assistanceUrl, reason: 'You can also explore assistance and the official online application route.' }
  ],
  'Something else / not sure': [
    { name: 'DisasterAssistance.gov', url: assistanceUrl, reason: 'Explore types of disaster assistance and the official application route.' },
    { name: 'FEMA Disaster Recovery Center locator', url: centerUrl, reason: 'If a center is available, ask a representative about your options.' }
  ]
};

function getFloodReferrals(need) {
  const selectedNeed = Object.hasOwn(plans, need) ? need : 'Something else / not sure';
  return {
    selectedNeed,
    resources: plans[selectedNeed],
    locationNote: selectedNeed === 'Help after property damage'
      ? 'If an official form asks where damage occurred, give the damage location. It may differ from where you are now.'
      : 'Your current locality is not used to check live assistance or center availability.'
  };
}

if (typeof module !== 'undefined') module.exports = { getFloodReferrals };
if (typeof window !== 'undefined') window.getFloodReferrals = getFloodReferrals;
