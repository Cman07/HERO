// F6: curated preparation tasks, reviewed 2026-09-26. No AI or live conditions.
const sources = {
  flood: { name: 'Ready.gov — Floods', url: 'https://www.ready.gov/floods' },
  plan: { name: 'Ready.gov — Make a plan', url: 'https://www.ready.gov/plan' },
  kit: { name: 'Ready.gov — Build a kit', url: 'https://www.ready.gov/kit' },
  access: { name: 'Ready.gov — People with disabilities', url: 'https://www.ready.gov/disability' },
  pets: { name: 'Ready.gov — Prepare your pets', url: 'https://www.ready.gov/pets' }
};
const tasks = [
  { id: 'alerts', title: 'Choose how you will receive official alerts', detail: 'Review emergency alert options and make sure your household can receive and understand warnings.', source: sources.flood },
  { id: 'contacts', title: 'Make a household communication plan', detail: 'Choose emergency contacts and meeting places. Keep a copy of the contact plan where your household can find it.', source: sources.plan },
  { id: 'routes', title: 'Review routes and places to go', detail: 'Learn and practice your evacuation routes and shelter plan in advance. Follow official instructions during an emergency; this checklist does not identify safe routes or open shelters.', source: sources.flood },
  { id: 'supplies', title: 'Gather and review emergency supplies', detail: 'Use the official kit guide to plan food, water, lighting and other supplies for your household. Review the kit regularly.', source: sources.kit },
  { id: 'household-support', title: 'Discuss household care and support', detail: 'Agree with trusted people on who can help with household care, communication and supplies. Include caregivers in the plan when appropriate.', source: sources.plan, when: ['pregnant', 'children', 'olderAdults'] },
  { id: 'access-support', title: 'Plan accessible communication and practical assistance', detail: 'Create a support network and discuss help with communication, mobility and assistive devices before an emergency.', source: sources.access, when: ['disability', 'mobility', 'olderAdults'] },
  { id: 'power-backup', title: 'Discuss backup arrangements for powered equipment', detail: 'Discuss power-loss planning for medical or assistive equipment with your care team or equipment provider. Use their guidance for your equipment.', source: sources.access, when: ['medicalPower'] },
  { id: 'transport-support', title: 'Arrange transportation support in advance', detail: 'Discuss transportation and accessibility requirements with your support network. Confirm arrangements directly; this guide cannot book transport.', source: sources.access, when: ['transport', 'mobility'] },
  { id: 'animal-plan', title: 'Include pets and service animals in your plan', detail: 'Plan supplies, transport and a place that can accommodate your animals. Confirm arrangements directly before relying on them.', source: sources.pets, when: ['pets'] }
];
function getChecklist(profile) {
  return tasks.filter(task => !task.when || task.when.some(key => profile?.[key] === 'yes')).map(({ when, ...task }) => task);
}
function normalizeCompletedTasks(value, profile) {
  if (!Array.isArray(value) || value.length > tasks.length || value.some(id => typeof id !== 'string' || !tasks.some(task => task.id === id))) throw new Error('Choose valid checklist tasks.');
  const available = new Set(getChecklist(profile).map(task => task.id));
  return [...new Set(value)].filter(id => available.has(id));
}
function checklistText(profile, completedTasks = [], date = new Date()) {
  const completed = new Set(normalizeCompletedTasks(completedTasks, profile));
  const items = getChecklist(profile);
  return ['HERO — Personal preparedness checklist', 'Prepared: ' + date.toISOString().slice(0, 10), `${completed.size} of ${items.length} tasks complete`, '',
    'Preparation only. This is not a live alert, evacuation instruction, shelter availability check or eligibility decision. In immediate danger or seriously injured, call 911.',
    'This checklist may reflect private household needs. Keep your copy private.', '',
    ...items.flatMap(task => [`[${completed.has(task.id) ? 'x' : ' '}] ${task.title}`, task.detail, 'Source: ' + task.source.name + ' — ' + task.source.url, '']),
    'Review any needs you did not share. Home, current and damage locations may differ.', 'Federal guidance reviewed 2026-09-26.', ''].join('\n');
}
const preparedness = { getChecklist, normalizeCompletedTasks, checklistText };
if (typeof module !== 'undefined') module.exports = preparedness;
if (typeof window !== 'undefined') window.floodPreparedness = preparedness;
