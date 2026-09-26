const profilePreparation = typeof module !== 'undefined' ? require('./preparedness.cjs') : window.floodPreparedness;
const profileQuestions = [
  { key: 'pregnant', label: 'Are you or anyone in your household pregnant?' },
  { key: 'children', label: 'Do children live in your household?' },
  { key: 'olderAdults', label: 'Does anyone in your household need support related to older age?' },
  { key: 'disability', label: 'Do you or anyone in your household have a disability or access needs?' },
  { key: 'mobility', label: 'Would anyone need help moving around or leaving home?' },
  { key: 'medicalPower', label: 'Does anyone depend on electricity for medical equipment?' },
  { key: 'transport', label: 'Would your household need help with transportation?' },
  { key: 'pets', label: 'Do you have pets or service animals to plan for?' }
];
const answerValues = ['unspecified', 'yes', 'no'];
function normalizeProfile(value, localities) {
  if (!value) throw new Error('Profile answers are required.');
  if (value.homeLocality !== null && !localities.includes(value.homeLocality)) throw new Error('Select a home locality from the list or skip it.');
  if (!['unspecified', '1', '2', '3', '4', '5+'].includes(value.householdSize)) throw new Error('Select a household size.');
  const result = { version: 2, homeLocality: value.homeLocality, householdSize: value.householdSize };
  for (const { key } of profileQuestions) {
    if (!answerValues.includes(value[key])) throw new Error('Choose yes, no, or prefer not to say for each question.');
    result[key] = value[key];
  }
  result.completedTasks = profilePreparation.normalizeCompletedTasks(value.completedTasks ?? [], result);
  return result;
}
const profileSchema = { profileQuestions, normalizeProfile };
if (typeof module !== 'undefined') module.exports = profileSchema;
if (typeof window !== 'undefined') window.floodProfileSchema = profileSchema;
