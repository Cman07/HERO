// Shared, curated recovery actions. Household support answers never enter this catalog.
(() => {
const languageCopy = typeof module !== 'undefined' ? require('./language.cjs') : window.heroLanguageCopy;
const reviewedAt = '2026-09-26';
const sources = {
  assistance: { name: 'DisasterAssistance.gov', url: 'https://www.disasterassistance.gov/' },
  center: { name: 'FEMA Disaster Recovery Center locator', url: 'https://egateway.fema.gov/ESF6/DRCLocator' }
};
const action = (id, stage, source, en, es) => ({ id, stage, source: sources[source], reviewedAt, en, es });
const plans = {
  'A place to stay': [
    action('housing-options', 'next', 'assistance',
      ['Check housing assistance options', 'Open DisasterAssistance.gov and review the assistance and application information for your situation.', 'You asked for a place to stay. This is the official starting point for exploring federal assistance.'],
      ['Consulte las opciones de ayuda para vivienda', 'Abra DisasterAssistance.gov y revise la información sobre ayuda y solicitudes para su situación.', 'Usted busca un lugar donde quedarse. Este es el punto de partida oficial para explorar la ayuda federal.']),
    action('housing-representative', 'next', 'center',
      ['Check whether a recovery center is available', 'Use the official locator. Confirm hours and services directly before traveling. A recovery center provides assistance information; it is not a shelter reservation.', 'A representative can help you understand housing-related assistance and other referrals.'],
      ['Consulte si hay un centro de recuperación disponible', 'Use el localizador oficial. Confirme el horario y los servicios antes de viajar. Un centro ofrece información sobre ayuda; no es una reserva de alojamiento.', 'Un representante puede ayudarle a entender las opciones de vivienda y otras referencias.']),
    action('housing-questions', 'prepare', 'center',
      ['Prepare your housing questions', 'Write down what you need to ask: which options may apply, what to prepare, and how to follow up. Keep private details for the official representative.', 'A short question list helps you explain your need without repeating your whole story.'],
      ['Prepare sus preguntas sobre vivienda', 'Anote qué necesita preguntar: qué opciones podrían corresponder, qué preparar y cómo dar seguimiento. Reserve los datos privados para el representante oficial.', 'Una lista breve le ayuda a explicar su necesidad sin repetir toda su historia.'])
  ],
  'Food or basic supplies': [
    action('supplies-options', 'next', 'assistance',
      ['Review assistance for basic needs', 'Explore the official assistance information. This guide has not verified immediate food distribution or supplies in your locality.', 'You asked for food or basic supplies; the official site can help you explore assistance options.'],
      ['Revise la ayuda para necesidades básicas', 'Explore la información oficial sobre ayuda. Esta guía no ha verificado la distribución inmediata de alimentos o suministros en su localidad.', 'Usted necesita alimentos o suministros básicos; el sitio oficial permite explorar opciones de ayuda.']),
    action('supplies-referrals', 'next', 'center',
      ['Ask a representative about available referrals', 'Check the recovery center locator and confirm services before visiting. Ask which assistance or referrals may address your immediate needs.', 'Availability varies. A representative can help you clarify which options to check directly.'],
      ['Pregunte a un representante por las referencias disponibles', 'Consulte el localizador de centros y confirme los servicios antes de ir. Pregunte qué ayuda o referencias podrían atender sus necesidades inmediatas.', 'La disponibilidad varía. Un representante puede ayudarle a aclarar qué opciones consultar directamente.']),
    action('supplies-questions', 'prepare', 'center',
      ['List the supplies you need to ask about', 'Prepare a short list of your needs and questions about access and follow-up. Do not enter private medical or identifying details here.', 'Specific questions make the conversation with a helper more useful.'],
      ['Anote los suministros por los que necesita preguntar', 'Prepare una lista breve de necesidades y preguntas sobre acceso y seguimiento. No introduzca aquí datos médicos privados ni de identificación.', 'Las preguntas concretas hacen más útil la conversación con una persona que le ayude.'])
  ],
  'Help after property damage': [
    action('damage-application', 'next', 'assistance',
      ['Review the official application route', 'Use DisasterAssistance.gov to check application information and current options. The agency determines eligibility and whether an application is available.', 'You reported property damage. The official application route explains how to ask for assistance.'],
      ['Revise la vía oficial para solicitar ayuda', 'Use DisasterAssistance.gov para consultar la información sobre solicitudes y las opciones actuales. La agencia determina la elegibilidad y la disponibilidad de solicitudes.', 'Usted indicó daños a la propiedad. La vía oficial explica cómo solicitar ayuda.']),
    action('damage-locality', 'next', 'assistance',
      ['Confirm where the damage occurred', 'Keep the damage location distinct from where you are now and where you usually live. You can optionally check FEMA declaration context below; a declaration is not an eligibility decision.', 'Your current locality may differ from the place where damage happened.'],
      ['Confirme dónde ocurrieron los daños', 'Distinga el lugar de los daños de su ubicación actual y su hogar habitual. Puede consultar abajo el contexto de declaraciones de FEMA; una declaración no determina su elegibilidad.', 'Su localidad actual puede ser distinta del lugar donde ocurrieron los daños.']),
    action('damage-prepare', 'prepare', 'assistance',
      ['Review what information to prepare privately', 'Review the application checklist on the official site before applying. Gather the information it requests privately; HERO does not collect documents, identifiers or financial details.', 'Preparing from the official checklist can make the application conversation easier.'],
      ['Revise qué información preparar en privado', 'Revise la lista de verificación del sitio oficial antes de solicitar ayuda. Reúna en privado la información solicitada; HERO no recopila documentos, identificadores ni datos financieros.', 'Prepararse con la lista oficial puede facilitar la conversación sobre la solicitud.']),
    action('damage-questions', 'prepare', 'center',
      ['Prepare questions about your next step', 'Use a recovery center, if available, to ask about unclear requirements or follow-up. Confirm center details directly before traveling.', 'A representative should resolve questions about your individual application.'],
      ['Prepare preguntas sobre el siguiente paso', 'Si hay un centro disponible, consulte allí los requisitos o el seguimiento que no entienda. Confirme los detalles antes de viajar.', 'Un representante debe resolver las preguntas sobre su solicitud individual.'])
  ],
  'In-person assistance': [
    action('visit-locator', 'next', 'center',
      ['Check the official recovery center locator', 'Open the locator to check whether a center is available. HERO may display FEMA-reported listings on the map, but cannot verify current status, hours, or services.', 'You prefer help from a representative in person.'],
      ['Consulte el localizador oficial de centros', 'Abra el localizador para comprobar si hay un centro disponible. HERO puede mostrar en el mapa los centros reportados por FEMA, pero no puede verificar su estado, horario ni servicios actuales.', 'Usted prefiere recibir ayuda de un representante en persona.']),
    action('visit-confirm', 'next', 'center',
      ['Confirm details before you travel', 'Check the selected center’s hours, location and services directly. Confirm any access arrangements with the center.', 'Confirming details helps you prepare for a useful visit.'],
      ['Confirme los detalles antes de viajar', 'Consulte directamente el horario, la ubicación y los servicios del centro elegido. Confirme con el centro cualquier adaptación necesaria para el acceso.', 'Confirmar los detalles le ayuda a prepararse para una visita útil.']),
    action('visit-questions', 'prepare', 'center',
      ['Prepare your questions for the visit', 'Write a short description of the help you need and the questions still unanswered. Review and export a helper summary below.', 'A summary gives you a clear starting point for the conversation.'],
      ['Prepare sus preguntas para la visita', 'Escriba una descripción breve de la ayuda que necesita y las preguntas pendientes. Revise y exporte un resumen para una persona que le ayude.', 'Un resumen le da un punto de partida claro para la conversación.'])
  ],
  'Something else / not sure': [
    action('unsure-options', 'next', 'assistance',
      ['Explore the official assistance starting point', 'Review the types of help and application information on DisasterAssistance.gov. You do not need to know a program name to start exploring.', 'You are unsure where to begin. Start with the official overview.'],
      ['Explore el punto de partida oficial para obtener ayuda', 'Revise los tipos de ayuda y la información sobre solicitudes en DisasterAssistance.gov. No necesita conocer el nombre de un programa para empezar.', 'Usted no sabe por dónde empezar. Comience con la información general oficial.']),
    action('unsure-representative', 'next', 'center',
      ['Check options for speaking with a representative', 'Use the locator to check whether an in-person center is available. Confirm its services and hours directly.', 'A representative can help clarify your needs and possible next steps.'],
      ['Consulte las opciones para hablar con un representante', 'Use el localizador para consultar si hay un centro presencial disponible. Confirme directamente sus servicios y horarios.', 'Un representante puede ayudarle a aclarar sus necesidades y los posibles pasos siguientes.']),
    action('unsure-questions', 'prepare', 'center',
      ['Write down what you still need help understanding', 'Prepare one or two questions for a helper. You can edit them in the summary without including your chat or saved support answers.', 'A short list helps keep the conversation focused on what you need.'],
      ['Anote lo que todavía necesita entender', 'Prepare una o dos preguntas para una persona que le ayude. Puede editarlas en el resumen sin incluir el chat ni sus respuestas guardadas sobre apoyo.', 'Una lista breve ayuda a centrar la conversación en sus necesidades.'])
  ]
};
const copy = {
  en: { plan: 'HERO — Recovery plan', summary: 'HERO — Summary for a helper', prepared: 'Prepared', language: 'Language', need: 'Help requested', current: 'Current locality', damage: 'Damage locality', home: 'Selected saved home locality', size: 'Selected saved household size', unknown: 'Not provided', done: 'Completed (reported by you)', remaining: 'Remaining actions', questions: 'Questions for a helper', none: 'None recorded', source: 'Source', reviewed: 'Guidance reviewed', why: 'Why this step', safety: 'In immediate danger or seriously injured, call 911. HERO cannot contact responders.', limits: 'General guidance. Agencies determine eligibility. Confirm application availability and center details directly.', privacy: 'Keep this copy private. Downloading or printing does not contact a helper or reserve assistance.', progress: 'Progress is reported by you; it does not confirm an agency action.' },
  es: { plan: 'HERO — Plan de recuperación', summary: 'HERO — Resumen para una persona que le ayude', prepared: 'Preparado', language: 'Idioma', need: 'Ayuda solicitada', current: 'Localidad actual', damage: 'Localidad de los daños', home: 'Localidad del hogar guardado seleccionada', size: 'Número de personas del hogar guardado seleccionado', unknown: 'No indicada', done: 'Completado (según usted)', remaining: 'Acciones pendientes', questions: 'Preguntas para una persona que le ayude', none: 'Ninguna registrada', source: 'Fuente', reviewed: 'Guía revisada', why: 'Por qué este paso', safety: 'Si está en peligro inmediato o tiene lesiones graves, llame al 911. HERO no puede contactar a los servicios de emergencia.', limits: 'Orientación general. Las agencias determinan la elegibilidad. Confirme directamente la disponibilidad de solicitudes y los detalles de los centros.', privacy: 'Guarde esta copia en privado. Descargar o imprimir no contacta a nadie ni reserva ayuda.', progress: 'El progreso lo indica usted; no confirma ninguna acción de una agencia.' }
};
const needsEs = ['Un lugar donde quedarse', 'Alimentos o suministros básicos', 'Ayuda por daños a la propiedad', 'Ayuda en persona', 'Otra cosa / no estoy seguro/a'];
const disasterLabels = { flood: 'flood', hurricane: 'hurricane or tropical storm', wildfire: 'wildfire', 'severe-storm': 'tornado or severe storm', 'winter-storm': 'winter storm', earthquake: 'earthquake', other: 'other or uncertain disaster' };
function getPlan(need, language = 'en', context = {}) {
  if (!Object.hasOwn(plans, need)) throw new Error('Choose a valid help need.');
  const tasks = plans[need].map(({ en, es, ...record }) => {
    const [title, detail, reason] = language === 'es' ? es : en.map(text => languageCopy.translate(text, language));
    return { ...record, source: { ...record.source, name: languageCopy.translate(record.source.name, language) }, title, detail, reason };
  });
  const listing = context.localListing;
  const relevant = listing && ((listing.kind === 'shelter' && need === 'A place to stay' && /^shelter:/.test(listing.id || '')) || (listing.kind === 'center' && ['In-person assistance', 'A place to stay', 'Something else / not sure'].includes(need) && /^center:/.test(listing.id || '')));
  if (relevant) {
    const title = languageCopy.translate(listing.kind === 'shelter' ? 'Check this reported shelter listing' : 'Check this reported recovery center listing', language);
    const detail = `${languageCopy.translate('FEMA reports a listing near the selected ZIP', language)}: ${listing.name}. ${languageCopy.translate('Review its map card and confirm current hours, services, and availability before traveling. A listing does not reserve assistance.', language)}`;
    const reason = languageCopy.translate('You asked for help that may benefit from a local FEMA listing.', language);
    tasks.unshift({ id: 'confirm-reported-listing', stage: 'next', title, detail, reason, source: { name: languageCopy.translate('View listing on HERO map', language), url: `#resource-${encodeURIComponent(listing.id)}` }, reviewedAt });
  }
  if (context.currentZip && context.placeLabel) tasks[0].reason += ` ${languageCopy.translate('Current approximate ZIP area', language)}: ${context.placeLabel}.`;
  if (context.disasterType && disasterLabels[context.disasterType]) {
    const hazard = languageCopy.translate(disasterLabels[context.disasterType], language);
    tasks[0].reason += ` ${languageCopy.translate('Disaster reported', language)}: ${hazard}.`;
    tasks.push({ id: 'disaster-followup', stage: 'prepare', title: languageCopy.translate('Ask about assistance for your disaster type', language),
      detail: `${languageCopy.translate('Tell an official representative which disaster affected you and ask what assistance may apply', language)}: ${hazard}. ${languageCopy.translate('HERO has not confirmed a declaration or eligibility.', language)}`,
      reason: languageCopy.translate('The type of disaster can change which official programs and questions are relevant.', language), source: { ...sources.assistance, name: languageCopy.translate(sources.assistance.name, language) }, reviewedAt });
  }
  return tasks;
}
function normalizeCompleted(need, value = [], context = {}) {
  const ids = getPlan(need, 'en', context).map(a => a.id);
  if (!Array.isArray(value) || value.length > ids.length || value.some(id => typeof id !== 'string' || !ids.includes(id))) throw new Error('Choose valid recovery actions.');
  return [...new Set(value)];
}
function textSnapshot({ need, currentLocality = null, currentZip = null, placeLabel = null, disasterType = null, damageLocality = null, damageZip = null, localListing = null, selectedListing = null, completedActionIds = [], language = 'en', now = new Date(), summary = false, questions = '', homeLocality = null, homeZip = null, householdSize = null }) {
  const lang = languageCopy.normalizeLanguage(language);
  const t = copy[lang] || Object.fromEntries(Object.entries(copy.en).map(([key,text]) => [key, languageCopy.translate(text, lang)]));
  const context = { currentZip, placeLabel, disasterType, localListing };
  const tasks = getPlan(need, lang, context); const completed = new Set(normalizeCompleted(need, completedActionIds, context));
  const label = lang === 'es' ? needsEs[Object.keys(plans).indexOf(need)] : languageCopy.translate(need, lang);
  const zipFlow = disasterType !== null || currentZip !== null;
  const lines = [summary ? t.summary : t.plan, `${t.prepared}: ${now.toISOString().slice(0, 10)}`, `${t.language}: ${languageCopy.languages[lang].nativeName}`, '', `${t.need}: ${label}`, `${zipFlow ? languageCopy.translate('Current ZIP', lang) : t.current}: ${currentZip || currentLocality || t.unknown}`, `${zipFlow ? languageCopy.translate('Damage ZIP', lang) : t.damage}: ${damageZip || damageLocality || t.unknown}`];
  if (disasterType) lines.push(`${languageCopy.translate('Disaster type', lang)}: ${languageCopy.translate(disasterLabels[disasterType] || disasterType, lang)}`);
  if (summary && selectedListing) lines.push(`${languageCopy.translate('Selected local listing', lang)}: ${selectedListing.name} — ${selectedListing.address || t.unknown} (${selectedListing.category || t.unknown}; ${selectedListing.source}; ${selectedListing.status || t.unknown}; ${selectedListing.checkedAt || t.unknown})`);
  if (summary && (homeZip || homeLocality)) lines.push(`${homeZip ? languageCopy.translate('Selected saved home ZIP', lang) : t.home}: ${homeZip || homeLocality}`);
  if (summary && householdSize && householdSize !== 'unspecified') lines.push(`${t.size}: ${householdSize}`);
  lines.push('', t.safety, t.limits, t.progress, '');
  for (const done of [false, true]) {
    lines.push(done ? t.done : t.remaining);
    const selected = tasks.filter(a => completed.has(a.id) === done);
    if (!selected.length) lines.push(t.none);
    for (const a of selected) lines.push(`[${done ? 'x' : ' '}] ${a.title}`, a.detail, `${t.source}: ${a.source.name} — ${a.source.url}`, `${t.reviewed}: ${a.reviewedAt}`, '');
  }
  if (summary) lines.push('', t.questions, questions.trim() || t.none);
  lines.push('', t.privacy, '');
  return lines.join('\n');
}
// Only canonical progress is stored. Summary edits, profiles, chat and damage locality are absent.
function progressRecord(owner, answers, completedActionIds, context = {}) {
  if (!owner || answers.danger !== 'no') return null;
  if (Object.hasOwn(answers, 'currentZip')) return { version: 2, owner, need: answers.need, currentZip: answers.currentZip, disasterType: answers.disasterType, completedActionIds: normalizeCompleted(answers.need, completedActionIds, context) };
  return { version: 1, owner, need: answers.need, locality: answers.locality, completedActionIds: normalizeCompleted(answers.need, completedActionIds) };
}
function restoreProgress(record, owner, answers, context = {}) {
  if (!record || !owner || record.owner !== owner || record.need !== answers.need || answers.danger !== 'no') return [];
  if (Object.hasOwn(answers, 'currentZip')) {
    if (record.version !== 2 || record.currentZip !== answers.currentZip || record.disasterType !== answers.disasterType) return [];
  } else if (record.version !== 1 || record.locality !== answers.locality) return [];
  // A FEMA listing can disappear between visits. Preserve completed catalog steps
  // while dropping a listing action that is no longer present in this plan.
  if (!Array.isArray(record.completedActionIds)) return [];
  const validIds = new Set(getPlan(answers.need, 'en', context).map(action => action.id));
  return [...new Set(record.completedActionIds.filter(id => typeof id === 'string' && validIds.has(id)))];
}
const recovery = { getPlan, normalizeCompleted, textSnapshot, progressRecord, restoreProgress, needs: Object.keys(plans), sources, reviewedAt };
if (typeof module !== 'undefined') module.exports = recovery;
if (typeof window !== 'undefined') window.heroRecovery = recovery;
})();
