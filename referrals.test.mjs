import test from 'node:test';
import assert from 'node:assert/strict';
import referrals from './referrals.cjs';

const needs = [
  'A place to stay',
  'Food or basic supplies',
  'Help after property damage',
  'In-person assistance',
  'Something else / not sure'
];
const approvedUrls = new Set([
  'https://www.disasterassistance.gov/',
  'https://egateway.fema.gov/ESF6/DRCLocator'
]);

test('every need shows both approved official destinations', () => {
  for (const need of needs) {
    const plan = referrals.getFloodReferrals(need);
    assert.equal(plan.selectedNeed, need);
    assert.deepEqual(new Set(plan.resources.map(resource => resource.url)), approvedUrls);
    assert.ok(plan.resources.every(resource => resource.reason.length > 20));
  }
});

test('in-person help leads with the Recovery Center locator', () => {
  const plan = referrals.getFloodReferrals('In-person assistance');
  assert.equal(plan.resources[0].url, 'https://egateway.fema.gov/ESF6/DRCLocator');
  assert.match(plan.resources[0].reason, /hours/);
});

test('property damage guidance distinguishes the damage location', () => {
  const plan = referrals.getFloodReferrals('Help after property damage');
  assert.match(plan.locationNote, /where damage occurred/);
  assert.match(plan.locationNote, /differ from where you are now/);
});
