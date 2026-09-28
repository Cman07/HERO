import test from 'node:test';
import assert from 'node:assert/strict';
import preparedness from './preparedness.cjs';
import schema from './profile.cjs';
import localities from './localities.cjs';
const exampleProfile = (overrides = {}) => ({ homeLocality: 'Albemarle County', householdSize: '3', ...Object.fromEntries(schema.profileQuestions.map(({ key }) => [key, 'yes'])), ...overrides });

test('checklist includes shared preparation tasks and adds only explicitly selected household needs', () => {
  const base = preparedness.getChecklist(null).map(task => task.id);
  assert.deepEqual(base, ['alerts', 'contacts', 'routes', 'supplies']);
  const unspecified = exampleProfile(Object.fromEntries(schema.profileQuestions.map(({ key }) => [key, 'unspecified'])));
  assert.deepEqual(preparedness.getChecklist(unspecified).map(task => task.id), base);
  assert.equal(preparedness.getChecklist(exampleProfile()).length, 9);
  const petsOnly = { ...unspecified, pets: 'yes' };
  assert.deepEqual(preparedness.getChecklist(petsOnly).map(task => task.id), [...base, 'animal-plan']);
  for (const task of preparedness.getChecklist(exampleProfile())) assert.equal(new URL(task.source.url).hostname, 'www.ready.gov');
});

test('old profiles default to empty progress; updates prune tasks that no longer apply', () => {
  assert.deepEqual(schema.normalizeProfile(exampleProfile(), localities).completedTasks, []);
  const old = exampleProfile({ pets: 'no', completedTasks: ['alerts', 'animal-plan', 'alerts'] });
  assert.deepEqual(schema.normalizeProfile(old, localities).completedTasks, ['alerts']);
  for (const completedTasks of [['unknown-task'], [7], 'alerts']) assert.throws(() => schema.normalizeProfile(exampleProfile({ completedTasks }), localities));
});

test('text export includes progress, complete source URLs and limits without raw personal answers', () => {
  const profile = exampleProfile({ completedTasks: ['alerts'], username: 'PRIVATE-USERNAME', householdSize: '5+' });
  const text = preparedness.checklistText(profile, profile.completedTasks, new Date('2026-09-26T12:00:00Z'));
  assert.match(text, /\[x\] Choose how/); assert.match(text, /\[ \] Make a household/);
  assert.match(text, /1 of 9 tasks complete/); assert.match(text, /https:\/\/www.ready.gov\/plan/);
  assert.match(text, /call 911/); assert.match(text, /Keep your copy private/);
  assert.doesNotMatch(text, /PRIVATE-USERNAME|Albemarle County|5\+|pregnant|disability:|updatedAt/);
});
