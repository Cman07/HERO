// Bundled public interface copy. Translation never reads resident inputs.
const localePacks = typeof module !== 'undefined' ? require('./locales.cjs') : window.heroLocalePacks;
const languages = {
 en: { name: 'English', nativeName: 'English', dir: 'ltr' },
 es: { name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
 ar: { name: 'Modern Standard Arabic', nativeName: 'العربية', dir: 'rtl' },
 'zh-Hans': { name: 'Simplified Chinese', nativeName: '简体中文', dir: 'ltr' },
 ko: { name: 'Korean', nativeName: '한국어', dir: 'ltr' },
 vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', dir: 'ltr' },
 tl: { name: 'Tagalog (Filipino)', nativeName: 'Tagalog', dir: 'ltr' },
 fr: { name: 'French', nativeName: 'Français', dir: 'ltr' }
};
const normalizeLanguage = code => Object.hasOwn(languages, code) ? code : 'en';
const spanish = Object.fromEntries(`
Skip to main content|Saltar al contenido principal
Virginia Flood Guide|Guía de inundaciones de Virginia
Virginia Flood Guide home|Inicio de la guía de inundaciones de Virginia
Flood Guide|Guía de inundaciones
Home|Inicio
Find help now|Buscar ayuda ahora
Find help now →|Buscar ayuda ahora →
Plan ahead|Prepararse
Sign in|Iniciar sesión
Account|Cuenta
Main navigation|Navegación principal
In immediate danger or seriously injured?|¿Está en peligro inmediato o tiene lesiones graves?
This guide cannot contact responders. Call emergency services directly.|Esta guía no puede contactar a los servicios de emergencia. Llámelos directamente.
Call 911 ↗|Llamar al 911 ↗
Call 911|Llamar al 911
Call 911 using your phone|Llamar al 911 desde su teléfono
A guide for Virginia residents|Una guía para residentes de Virginia
Disaster assistance|Ayuda ante desastres
in|en
Virginia.|Virginia.
A clearer next step, for you and your household. Find official help after a disaster or prepare your household for an emergency.|Un próximo paso más claro para usted y su hogar. Encuentre ayuda oficial después de un desastre o prepare su hogar para una emergencia.
For hurricanes, floods, wildfires, severe storms and other disasters.|Para huracanes, inundaciones, incendios forestales, tormentas fuertes y otros desastres.
Choose where to start|Elija por dónde empezar
After a disaster|Después de un desastre
Three short questions. Official resources and a conversation about next steps.|Tres preguntas breves. Recursos oficiales y una conversación sobre los próximos pasos.
Before an emergency|Antes de una emergencia
Build a household profile and a preparedness checklist you can return to.|Cree un perfil del hogar y una lista de preparación que pueda volver a consultar.
Finding help is free to use. No account or profile needed.|Buscar ayuda es gratis. No necesita cuenta ni perfil.
A little planning goes a long way|Un poco de planificación ayuda mucho
Your household.|Su hogar.
Your next step.|Su próximo paso.
Find help now questions|Preguntas para buscar ayuda ahora
Question 1 of 3|Pregunta 1 de 3
Question 2 of 3|Pregunta 2 de 3
Question 3 of 3|Pregunta 3 de 3
Are you in immediate danger or seriously injured?|¿Está en peligro inmediato o tiene lesiones graves?
If you need emergency help, call 911 directly. This site cannot contact responders.|Si necesita ayuda de emergencia, llame directamente al 911. Este sitio no puede contactar a los servicios de emergencia.
Yes|Sí
I'm not sure|No estoy seguro/a
No|No
Call 911 for immediate help|Llame al 911 para recibir ayuda inmediata
If you are in danger, seriously injured, or unsure whether you need emergency help, call 911. This guide cannot assess an emergency or contact responders for you.|Si está en peligro, tiene lesiones graves o no sabe si necesita ayuda de emergencia, llame al 911. Esta guía no puede evaluar una emergencia ni contactar a los servicios de emergencia por usted.
Where are you right now?|¿Dónde está ahora?
Choose the Virginia county or independent city where you are now. This may differ from where you live or where the disaster caused damage. You can skip this question.|Elija el condado o la ciudad independiente de Virginia donde está ahora. Puede ser diferente de donde vive o donde el desastre causó daños. Puede omitir esta pregunta.
I'm at my saved home locality now|Ahora estoy en la localidad de mi hogar guardado
Select your current Virginia locality|Seleccione su localidad actual en Virginia
Type or choose a locality|Escriba o elija una localidad
Virginia localities|Localidades de Virginia
Virginia home localities|Localidades del hogar en Virginia
Virginia damage localities|Localidades de los daños en Virginia
Choose one option from the list, then continue. A city and a county with the same name are separate choices.|Elija una opción de la lista y continúe. Una ciudad y un condado con el mismo nombre son opciones distintas.
Continue|Continuar
I don't know / skip|No sé / omitir
Back|Atrás
What kind of help are you looking for?|¿Qué tipo de ayuda busca?
Choose the closest option to see official next steps. You can also ask a follow-up question in the chat.|Elija la opción más cercana para ver los próximos pasos oficiales. También puede hacer una pregunta en el chat.
Share only my saved home locality and household size with Azure AI alongside today's answers. Saved health and support details stay local.|Compartir solo la localidad de mi hogar guardado y el número de personas del hogar con Azure AI junto con las respuestas de hoy. Los datos guardados de salud y apoyo permanecen locales.
A place to stay|Un lugar donde quedarse
Food or basic supplies|Alimentos o suministros básicos
Help after property damage|Ayuda por daños a la propiedad
In-person assistance|Ayuda en persona
Something else / not sure|Otra cosa / no estoy seguro/a
Your next steps|Sus próximos pasos
Official places to start|Sitios oficiales para empezar
These links can help you check current options directly.|Estos enlaces le permiten consultar las opciones actuales directamente.
Explore assistance and the official application route.|Consulte la ayuda y la vía oficial para solicitarla.
FEMA Disaster Recovery Center locator|Localizador de Centros de Recuperación por Desastre de FEMA
Check for an in-person center and its current details.|Compruebe si hay un centro presencial y consulte sus datos actuales.
Assistance agencies determine eligibility. Check each official site for current applications, center availability, hours, and services.|Las agencias de ayuda determinan quién reúne los requisitos. Consulte cada sitio oficial para ver solicitudes actuales, disponibilidad de centros, horarios y servicios.
FEMA declaration context|Contexto de declaraciones de FEMA
Choose where the damage occurred. This may differ from your home or current location. This optional check sends only that locality’s public code to FEMA; it does not send your profile or chat.|Elija dónde ocurrieron los daños. Puede ser diferente de su hogar o ubicación actual. Esta consulta opcional envía a FEMA solo el código público de esa localidad; no envía su perfil ni su chat.
Filter damage localities|Filtrar localidades con daños
Type to filter counties and cities|Escriba para filtrar condados y ciudades
Select the damage locality|Seleccione la localidad donde hubo daños
Check FEMA records|Consultar registros de FEMA
No damage locality selected. Declaration status unknown.|No se seleccionó una localidad con daños. Se desconoce el estado de las declaraciones.
Declaration status unknown. Select the damage locality and check FEMA records.|Se desconoce el estado de las declaraciones. Seleccione la localidad con daños y consulte los registros de FEMA.
These are historical declaration records for all incident types. Match incident dates and details with an official representative. A declaration or program designation does not establish your eligibility, confirm applications are open, or show current conditions.|Estos registros históricos incluyen todos los tipos de incidentes. Confirme las fechas y los detalles con un representante oficial. Una declaración o designación de programa no determina si usted reúne los requisitos, no confirma que se acepten solicitudes ni indica las condiciones actuales.
Source: OpenFEMA Disaster Declarations Summaries|Fuente: resúmenes de declaraciones de desastres de OpenFEMA
Your private household reminders|Recordatorios privados de su hogar
These come from your saved answers and are not sent to the AI. Review whether they still apply. When speaking directly with a representative through the official resources above, explain any support your household needs.|Se basan en sus respuestas guardadas y no se envían a la IA. Revise si aún corresponden. Al hablar directamente con un representante mediante los recursos oficiales anteriores, explique qué apoyo necesita su hogar.
Review or edit your household profile|Revisar o editar el perfil de su hogar
Keep the conversation going|Continuar la conversación
Ask a follow-up question|Hacer otra pregunta
Your completed questionnaire answers are kept in this browser tab so you can continue after a refresh. Your answers and messages are sent to Azure AI for this conversation. This guide does not save chat history. If you opt in above, only saved home locality and household size are included. Saved health, disability, and other support answers stay local. The chat cannot verify your location or check eligibility, live conditions, or application availability. Keep private health and identifying details out of messages.|Las respuestas completadas del cuestionario se conservan en esta pestaña del navegador para que pueda continuar después de recargar. Sus respuestas y mensajes se envían a Azure AI para esta conversación. Esta guía no guarda el historial del chat. Si lo autoriza arriba, solo se incluyen la localidad del hogar guardado y su tamaño. Las respuestas guardadas sobre salud, discapacidad y apoyo permanecen locales. El chat no puede verificar su ubicación, requisitos, condiciones actuales ni disponibilidad de solicitudes. No incluya datos privados de salud ni de identidad en los mensajes.
Chat messages|Mensajes del chat
For example: Where can I ask about temporary housing?|Por ejemplo: ¿Dónde puedo preguntar sobre alojamiento temporal?
Send message|Enviar mensaje
Go straight to the source|Consultar directamente la fuente
Official resources, clear next steps.|Recursos oficiales y próximos pasos claros.
Open the official site to check current details directly.|Abra el sitio oficial para consultar los datos actuales directamente.
Find and apply for federal disaster assistance.|Busque y solicite ayuda federal por desastre.
FEMA Recovery Center locator|Localizador de centros de recuperación de FEMA
Check whether an in-person center is available near you.|Compruebe si hay un centro presencial cerca de usted.
Official links reviewed September 25, 2026. This page does not check live alerts, evacuation orders, center hours, or assistance status.|Enlaces oficiales revisados el 25 de septiembre de 2026. Esta página no consulta alertas en vivo, órdenes de evacuación, horarios de centros ni el estado de la ayuda.
This independent guide does not determine whether you qualify for assistance.|Esta guía independiente no determina si usted reúne los requisitos para recibir ayuda.
← Back to HERO|← Volver a HERO
A little preparation, more peace of mind|Un poco de preparación, más tranquilidad
Your plan.|Su plan.
Take a few minutes to record what your household may need. Every question is optional. You can find help without a profile.|Dedique unos minutos a registrar lo que su hogar podría necesitar. Todas las preguntas son opcionales. Puede buscar ayuda sin un perfil.
Household profile|Perfil del hogar
Checking your sign-in…|Comprobando su sesión…
Manage account|Administrar cuenta
Checking for a saved profile…|Buscando un perfil guardado…
Where do you call home?|¿Dónde vive?
Your home locality helps you prepare. When finding help, you’ll confirm where you are now separately.|La localidad de su hogar le ayuda a prepararse. Al buscar ayuda, confirmará por separado dónde está ahora.
Search counties and independent cities|Buscar condados y ciudades independientes
Home locality|Localidad del hogar
(optional)|(opcional)
Skip / clear home locality|Omitir / borrar la localidad del hogar
No home locality selected.|No se seleccionó una localidad del hogar.
How many people are in your household?|¿Cuántas personas hay en su hogar?
Prefer not to say|Prefiero no responder
5 or more|5 o más
Who are you planning for?|¿Para quién se está preparando?
Include yourself and anyone in your household. You don’t need to share names or medical details.|Incluya a usted y a las demás personas de su hogar. No necesita compartir nombres ni detalles médicos.
What support might help?|¿Qué apoyo podría ayudar?
These answers stay in your local profile and are not sent to the AI chatbot.|Estas respuestas permanecen en su perfil local y no se envían al chatbot de IA.
Review your profile|Revisar su perfil
You can return to any step to change an answer.|Puede volver a cualquier paso para cambiar una respuesta.
Save profile on this browser|Guardar perfil en este navegador
Save profile to account|Guardar perfil en la cuenta
Back to main page|Volver a la página principal
Delete this saved profile?|¿Eliminar este perfil guardado?
This removes the household answers from the local database. You can create a new profile later. Your account will remain.|Esto elimina las respuestas del hogar de la base de datos local. Puede crear un perfil nuevo más adelante. Su cuenta se conservará.
Delete profile|Eliminar perfil
Keep profile|Conservar perfil
Delete saved profile|Eliminar perfil guardado
Personal preparedness checklist|Lista personal de preparación
Start with these general preparation tasks. Save a profile above to tailor your checklist.|Empiece con estas tareas generales de preparación. Guarde un perfil para adaptar su lista.
Preparation only. This guide does not check live alerts, safe routes, open shelters or eligibility. In immediate danger or seriously injured, call|Solo para prepararse. Esta guía no consulta alertas en vivo, rutas seguras, refugios abiertos ni requisitos para recibir ayuda. Si está en peligro inmediato o tiene lesiones graves, llame al
Edit household answers|Editar respuestas del hogar
Print / save as PDF|Imprimir / guardar como PDF
Download checklist (.txt)|Descargar lista (.txt)
View or copy checklist text|Ver o copiar el texto de la lista
Checklist text|Texto de la lista
Select all text|Seleccionar todo el texto
Your checklist may reflect private household needs. Keep printed and downloaded copies private. Exports include tasks and progress, without your account name or raw profile answers.|Su lista puede reflejar necesidades privadas del hogar. Mantenga privadas las copias impresas y descargadas. Las exportaciones incluyen tareas y progreso, sin el nombre de su cuenta ni las respuestas originales del perfil.
Review any needs you did not share. Federal guidance reviewed September 26, 2026. Sources are linked beneath each task.|Revise las necesidades que no compartió. Orientación federal revisada el 26 de septiembre de 2026. Las fuentes aparecen debajo de cada tarea.
JavaScript is needed to build your checklist. Visit|Se necesita JavaScript para crear su lista. Visite
Ready.gov to make a plan|Ready.gov para hacer un plan
Finding help does not require a profile. In immediate danger or seriously injured, call|No necesita un perfil para buscar ayuda. Si está en peligro inmediato o tiene lesiones graves, llame al
Optional account|Cuenta opcional
Your household profile|Perfil de su hogar
Keep your household plan close. Come back to your saved answers and checklist whenever you need them.|Tenga a mano el plan de su hogar. Vuelva a sus respuestas guardadas y a su lista cuando las necesite.
Continue with Google|Continuar con Google
Checking Google sign-in…|Comprobando el inicio de sesión con Google…
Create account|Crear cuenta
Username|Nombre de usuario
3–32 letters, numbers, dots, underscores, or hyphens. Choose a username you’ll remember.|De 3 a 32 letras, números, puntos, guiones bajos o guiones. Elija un nombre que recuerde.
Password|Contraseña
Use 12–128 characters.|Use entre 12 y 128 caracteres.
Confirm password|Confirmar contraseña
Your saved account profile is available whenever you sign in here. Signing out ends this browser’s account session.|Su perfil guardado está disponible cuando inicia sesión aquí. Al cerrar sesión, se cierra la sesión de la cuenta en este navegador.
A separate profile was saved on this browser before you signed in. You can move it into your account if your account has no profile yet.|Antes de iniciar sesión se guardó otro perfil en este navegador. Puede moverlo a su cuenta si esta aún no tiene un perfil.
I want to move this browser’s saved profile into my account’s local encrypted storage. The browser-only copy will be removed.|Quiero mover el perfil guardado en este navegador al almacenamiento local cifrado de mi cuenta. Se eliminará la copia exclusiva del navegador.
Move browser profile to account|Mover el perfil del navegador a la cuenta
Review or edit profile|Revisar o editar perfil
Sign out|Cerrar sesión
Continue without an account|Continuar sin cuenta
Back to Plan ahead|Volver a Prepararse
In immediate danger or seriously injured, call|Si está en peligro inmediato o tiene lesiones graves, llame al
. Finding help does not require an account.|. No necesita una cuenta para buscar ayuda.
Are you or anyone in your household pregnant?|¿Usted o alguien de su hogar está embarazada?
Do children live in your household?|¿Viven niños en su hogar?
Does anyone in your household need support related to older age?|¿Alguien de su hogar necesita apoyo relacionado con la edad avanzada?
Do you or anyone in your household have a disability or access needs?|¿Usted o alguien de su hogar tiene alguna discapacidad o necesidades de accesibilidad?
Would anyone need help moving around or leaving home?|¿Alguien necesitaría ayuda para desplazarse o salir de casa?
Does anyone depend on electricity for medical equipment?|¿Alguien depende de la electricidad para equipos médicos?
Would your household need help with transportation?|¿Su hogar necesitaría ayuda con el transporte?
Do you have pets or service animals to plan for?|¿Tiene mascotas o animales de servicio que deban incluirse en el plan?
Household size|Número de personas del hogar
Not provided|No indicado
Explore current assistance options related to housing and follow the official application instructions.|Consulte las opciones actuales de ayuda para vivienda y siga las instrucciones oficiales de solicitud.
Check whether an in-person center is available. Staff may be able to explain housing and rental assistance.|Compruebe si hay un centro presencial disponible. El personal podría explicar la ayuda para vivienda y alquiler.
Use the official assistance finder to look for current food and basic-needs options.|Use el buscador oficial de ayuda para consultar opciones actuales de alimentos y necesidades básicas.
If a center is available, ask staff about other assistance and referrals.|Si hay un centro disponible, pregunte al personal sobre otras ayudas y recursos.
Check official disaster assistance and application steps for damage at the affected location.|Consulte la ayuda oficial por desastre y los pasos para solicitarla por daños en el lugar afectado.
Find a center where you can ask a representative about an application or notices.|Busque un centro donde pueda preguntar a un representante sobre una solicitud o avisos.
Search for a center and check its location, hours, and services before going.|Busque un centro y consulte su ubicación, horarios y servicios antes de ir.
You can also explore assistance and the official online application route.|También puede consultar la ayuda y la vía oficial para solicitarla en línea.
Explore types of disaster assistance and the official application route.|Consulte los tipos de ayuda por desastre y la vía oficial para solicitarla.
If a center is available, ask a representative about your options.|Si hay un centro disponible, pregunte a un representante sobre sus opciones.
If an official form asks where damage occurred, give the damage location. It may differ from where you are now.|Si un formulario oficial pregunta dónde ocurrieron los daños, indique ese lugar. Puede ser diferente de donde está ahora.
Your current locality is not used to check live assistance or center availability.|Su localidad actual no se usa para consultar ayuda en vivo ni disponibilidad de centros.
Pregnancy in your household.|Embarazo en su hogar.
Children in your household.|Niños en su hogar.
Support related to older age.|Apoyo relacionado con la edad avanzada.
Disability or accessibility needs.|Discapacidad o necesidades de accesibilidad.
Help with moving around or leaving home.|Ayuda para desplazarse o salir de casa.
Electricity needed for medical equipment.|Electricidad necesaria para equipos médicos.
Transportation support.|Apoyo para el transporte.
Pets or service animals to plan for.|Mascotas o animales de servicio que incluir en el plan.
Choose how you will receive official alerts|Elija cómo recibirá alertas oficiales
Review emergency alert options and make sure your household can receive and understand warnings.|Revise las opciones de alertas de emergencia y asegúrese de que su hogar pueda recibir y comprender los avisos.
Make a household communication plan|Haga un plan de comunicación del hogar
Choose emergency contacts and meeting places. Keep a copy of the contact plan where your household can find it.|Elija contactos de emergencia y lugares de encuentro. Guarde una copia del plan de contactos donde su hogar pueda encontrarla.
Review routes and places to go|Revise las rutas y los lugares a donde ir
Learn and practice your evacuation routes and shelter plan in advance. Follow official instructions during an emergency; this checklist does not identify safe routes or open shelters.|Aprenda y practique de antemano las rutas de evacuación y el plan de refugio. Siga las instrucciones oficiales durante una emergencia; esta lista no identifica rutas seguras ni refugios abiertos.
Gather and review emergency supplies|Reúna y revise los suministros de emergencia
Use the official kit guide to plan food, water, lighting and other supplies for your household. Review the kit regularly.|Use la guía oficial del kit para planificar alimentos, agua, iluminación y otros suministros para su hogar. Revise el kit periódicamente.
Discuss household care and support|Hable sobre el cuidado y el apoyo del hogar
Agree with trusted people on who can help with household care, communication and supplies. Include caregivers in the plan when appropriate.|Acuerde con personas de confianza quién puede ayudar con el cuidado, la comunicación y los suministros del hogar. Incluya a cuidadores en el plan cuando corresponda.
Plan accessible communication and practical assistance|Planifique comunicación accesible y ayuda práctica
Create a support network and discuss help with communication, mobility and assistive devices before an emergency.|Cree una red de apoyo y hable sobre ayuda con la comunicación, movilidad y dispositivos de asistencia antes de una emergencia.
Discuss backup arrangements for powered equipment|Hable sobre alternativas para equipos eléctricos
Discuss power-loss planning for medical or assistive equipment with your care team or equipment provider. Use their guidance for your equipment.|Hable con su equipo de atención o proveedor de equipos sobre cómo prepararse ante un corte de electricidad para equipos médicos o de asistencia. Siga sus indicaciones para su equipo.
Arrange transportation support in advance|Organice apoyo para el transporte con anticipación
Discuss transportation and accessibility requirements with your support network. Confirm arrangements directly; this guide cannot book transport.|Hable sobre las necesidades de transporte y accesibilidad con su red de apoyo. Confirme los acuerdos directamente; esta guía no puede reservar transporte.
Include pets and service animals in your plan|Incluya mascotas y animales de servicio en su plan
Plan supplies, transport and a place that can accommodate your animals. Confirm arrangements directly before relying on them.|Planifique suministros, transporte y un lugar que pueda recibir a sus animales. Confirme los acuerdos directamente antes de depender de ellos.
Ready.gov — Floods|Ready.gov — Inundaciones
Ready.gov — Make a plan|Ready.gov — Hacer un plan
Ready.gov — Build a kit|Ready.gov — Preparar un kit
Ready.gov — People with disabilities|Ready.gov — Personas con discapacidades
Ready.gov — Prepare your pets|Ready.gov — Preparar a sus mascotas
Done|Completado
To do|Pendiente
Language|Idioma
Connection unavailable: the public guide is available. Accounts, saved profiles, chat, FEMA checks and external sites need a connection. Nothing is queued for automatic sending.|Sin conexión: la guía pública está disponible. Las cuentas, los perfiles guardados, el chat, las consultas de FEMA y los sitios externos necesitan conexión. No se enviará nada automáticamente.
English and Spanish guide text is bundled locally. Chat replies and FEMA record titles keep their original language. Official sites may have their own language controls.|El texto de la guía en inglés y español está incluido localmente. Las respuestas del chat y los títulos de los registros de FEMA mantienen su idioma original. Los sitios oficiales pueden tener sus propios controles de idioma.
Start conversation / retry|Iniciar conversación / reintentar
Chat needs a connection. Your question is still available to retry.|El chat necesita conexión. Su pregunta sigue disponible para reintentar.
Chat took too long. Retry when your connection is ready, or use the official links.|El chat tardó demasiado. Reintente cuando tenga conexión o use los enlaces oficiales.
JavaScript is off. You can use the official resources below. Questionnaire, account and profile controls need JavaScript.|JavaScript está desactivado. Puede usar los recursos oficiales de abajo. Los cuestionarios, las cuentas y los perfiles necesitan JavaScript.
Chat is not configured yet. Use the official referrals on this page.|El chat aún no está configurado. Use los recursos oficiales de esta página.
Finding a helpful next step…|Buscando un próximo paso útil…
Chat is unavailable right now. Use the official referrals above.|El chat no está disponible ahora. Use los recursos oficiales anteriores.
Chat is unavailable right now.|El chat no está disponible ahora.
No localities match your search.|Ninguna localidad coincide con su búsqueda.
The locality list is unavailable. You can skip this question.|La lista de localidades no está disponible. Puede omitir esta pregunta.
Select a county or independent city from the list, or choose skip.|Seleccione un condado o una ciudad independiente de la lista, o elija omitir.
Select where the damage occurred from the list.|Seleccione de la lista dónde ocurrieron los daños.
Your saved profile could not be loaded. You can still find help with today’s answers.|No se pudo cargar su perfil guardado. Puede buscar ayuda con las respuestas de hoy.
Saving your profile…|Guardando su perfil…
Your household profile is saved.|Se guardó el perfil de su hogar.
Could not reach profile storage. Your answers are still on this page; please try again.|No se pudo conectar al almacenamiento. Sus respuestas siguen en esta página; vuelva a intentarlo.
Deleting your saved profile…|Eliminando su perfil guardado…
Your saved profile has been deleted.|Se eliminó su perfil guardado.
Saved checklist progress was deleted with your profile.|Se eliminó el progreso guardado de la lista junto con su perfil.
Your sign-in changed. The form now shows this account’s profile.|Su sesión cambió. El formulario ahora muestra el perfil de esta cuenta.
Profile storage could not be loaded.|No se pudo cargar el almacenamiento de perfiles.
Sign-in status is unavailable.|El estado de la sesión no está disponible.
Could not load your profile. Reload this page to try again. You can still find help without a profile.|No se pudo cargar su perfil. Recargue la página para reintentar. Puede buscar ayuda sin un perfil.
Checklist ready. Your progress is saved with this profile.|Su lista está preparada. Su progreso se guarda con este perfil.
General preparation tasks. Progress stays on this page until you save a profile above; your saved answers will tailor the checklist.|Tareas generales de preparación. El progreso permanece en esta página hasta guardar un perfil; sus respuestas guardadas adaptarán la lista.
Progress updated on this page. Save a profile to keep it for later.|Se actualizó el progreso en esta página. Guarde un perfil para conservarlo.
Saving checklist progress…|Guardando el progreso de la lista…
Checklist progress saved.|Se guardó el progreso de la lista.
Download requested. If it does not appear, use the checklist text below. Keep your copy private.|Se solicitó la descarga. Si no aparece, use el texto de la lista que sigue. Mantenga privada su copia.
Link your Google account|Vincular su cuenta de Google
Google sign-in is not configured yet. Username/password sign-in is available below.|El inicio de sesión con Google aún no está configurado. Puede usar su nombre de usuario y contraseña abajo.
Choose Google to link it to this HERO account. Your existing profile will stay with this account.|Elija Google para vincularlo a esta cuenta de HERO. Su perfil actual permanecerá en esta cuenta.
Choose your Google account to sign in or create a HERO account. Sign in from any device to access your saved profile on this site.|Elija su cuenta de Google para iniciar sesión o crear una cuenta de HERO. Inicie sesión desde cualquier dispositivo conectado a este sitio para acceder a su perfil guardado.
Google sign-in is unavailable right now. You can still use username and password.|El inicio de sesión con Google no está disponible ahora. Puede usar su nombre de usuario y contraseña.
Linking Google…|Vinculando Google…
Signing in with Google…|Iniciando sesión con Google…
Google is connected. Open Plan ahead to review your profile.|Google está conectado. Abra Prepararse para revisar su perfil.
The passwords do not match.|Las contraseñas no coinciden.
Select a home locality from the list or skip it.|Seleccione una localidad del hogar de la lista u omítala.
Select a household size.|Seleccione el número de personas del hogar.
Choose yes, no, or prefer not to say for each question.|Elija sí, no o prefiero no responder en cada pregunta.
HERO — Personal preparedness checklist|HERO — Lista personal de preparación
Preparation only. This is not a live alert, evacuation instruction, shelter availability check or eligibility decision. In immediate danger or seriously injured, call 911.|Solo para prepararse. No es una alerta en vivo, instrucción de evacuación, consulta de refugios ni decisión sobre requisitos. Si está en peligro inmediato o tiene lesiones graves, llame al 911.
This checklist may reflect private household needs. Keep your copy private.|Esta lista puede reflejar necesidades privadas del hogar. Mantenga privada su copia.
Review any needs you did not share. Home, current and damage locations may differ.|Revise las necesidades que no compartió. Su hogar, ubicación actual y lugar de los daños pueden ser distintos.
Federal guidance reviewed 2026-09-26.|Orientación federal revisada el 26-09-2026.

FEMA declaration records|Registros de declaraciones de FEMA
Choose an account action|Elija una acción de cuenta
Language settings|Opciones de idioma
Plan ahead — Virginia Flood Guide|Prepararse — Guía de inundaciones de Virginia
Your account — Virginia Flood Guide|Su cuenta — Guía de inundaciones de Virginia
You are a guest. Save on this browser, or sign in before filling the form to save to an account.|Es un visitante. Guarde en este navegador o inicie sesión antes de rellenar el formulario para guardar en una cuenta.
You are offline. Reconnect to save or load your profile. Your answers stay on this page.|Está sin conexión. Vuelva a conectarse para guardar o cargar su perfil. Sus respuestas permanecen en esta página.
You are offline. Reconnect to use your account.|Está sin conexión. Vuelva a conectarse para usar su cuenta.
Creating your account…|Creando su cuenta…
Signing in…|Iniciando sesión…
Account created. You can now save a profile from Plan ahead.|Cuenta creada. Ahora puede guardar un perfil desde Prepararse.
You are signed in. Open Plan ahead to review your profile.|Ha iniciado sesión. Abra Prepararse para revisar su perfil.
The request took too long. Try signing in again.|La solicitud tardó demasiado. Intente iniciar sesión de nuevo.
Signing out…|Cerrando sesión…
You are signed out. Your account profile is still saved for your next sign-in.|Ha cerrado sesión. El perfil de su cuenta sigue guardado para la próxima vez.
Agree to move the browser profile into your account first.|Primero acepte mover el perfil del navegador a su cuenta.
Moving your profile…|Moviendo su perfil…
Your profile is now saved to your account. Open Plan ahead to review it.|Su perfil ahora está guardado en su cuenta. Abra Prepararse para revisarlo.
Your account is ready.|Su cuenta está lista.
Sign in, create an account, or continue as a guest.|Inicie sesión, cree una cuenta o continúe como visitante.
Accounts could not be loaded. Reload to try again, or continue to Find help now.|No se pudieron cargar las cuentas. Recargue para reintentar o continúe en Buscar ayuda ahora.
Profile storage is unavailable.|El almacenamiento de perfiles no está disponible.
Profile storage is unavailable. You can still find help.|El almacenamiento de perfiles no está disponible. Puede buscar ayuda.
Accounts are unavailable right now. You can still find help.|Las cuentas no están disponibles ahora. Puede buscar ayuda.
Chat did not return an answer. Use the official referrals on this page.|El chat no devolvió una respuesta. Use los recursos oficiales de esta página.
Chat is unavailable right now. Use the official referrals on this page.|El chat no está disponible ahora. Use los recursos oficiales de esta página.
Check the questionnaire answers and message, then try again.|Revise las respuestas del cuestionario y el mensaje, y vuelva a intentarlo.
Choose a damage locality and try again.|Elija una localidad con daños y vuelva a intentarlo.
Choose a valid checklist task.|Elija una tarea válida de la lista.
Confirm that you are not in immediate danger and select a damage locality.|Confirme que no está en peligro inmediato y seleccione una localidad con daños.
Could not copy your profile. Please try again.|No se pudo copiar su perfil. Vuelva a intentarlo.
Google sign-in has not been configured yet. Use username and password.|El inicio de sesión con Google aún no está configurado. Use su nombre de usuario y contraseña.
No browser profile is available to copy.|No hay un perfil del navegador disponible para copiar.
Please wait a minute before checking declarations again.|Espere un minuto antes de consultar las declaraciones de nuevo.
Please wait a minute before sending more messages.|Espere un minuto antes de enviar más mensajes.
Reload the account page and try Google again.|Recargue la página de cuenta y pruebe Google de nuevo.
Request not allowed.|Solicitud no permitida.
Save a household profile before saving checklist progress.|Guarde un perfil del hogar antes de guardar el progreso de la lista.
Saved household context is unavailable. Turn off profile use to continue.|El contexto guardado del hogar no está disponible. Desactive el uso del perfil para continuar.
Sign in before copying your browser profile.|Inicie sesión antes de copiar el perfil del navegador.
The profile could not be read or saved. Your draft is still on this page; please try again.|No se pudo leer o guardar el perfil. Su borrador sigue en esta página; vuelva a intentarlo.
Too many sign-in attempts. Try again in 15 minutes.|Demasiados intentos de inicio de sesión. Reintente en 15 minutos.
Your account already has a profile. Edit it from Plan ahead instead.|Su cuenta ya tiene un perfil. Edítelo desde Prepararse.
Your session expired. Sign in again before changing your profile.|Su sesión venció. Inicie sesión de nuevo antes de cambiar su perfil.
Your session expired. Sign out and reload before using Google.|Su sesión venció. Cierre sesión y recargue antes de usar Google.
Your sign-in changed. Reload the profile before changing it.|Su sesión cambió. Recargue el perfil antes de cambiarlo.
Agree to move this browser profile into your account first.|Primero acepte mover el perfil de este navegador a su cuenta.
Account service is unavailable.|El servicio de cuentas no está disponible.
Last successful FEMA check: not available.|Última consulta exitosa de FEMA: no disponible.
You|Usted

Start over|Empezar de nuevo
AI assistance|Ayuda de IA
Talk with the Flood Guide|Conversar con la guía de inundaciones
Ask one question at a time. The assistant uses your survey answers to suggest official resources and may ask a follow-up question.|Haga una pregunta a la vez. El asistente usa sus respuestas del cuestionario para sugerir recursos oficiales y puede hacer otra pregunta.
Clear conversation|Borrar conversación
Conversation cleared. Start again when ready.|Se borró la conversación. Empiece de nuevo cuando esté listo/a.
If you may be in immediate danger or seriously injured,|Si podría estar en peligro inmediato o tiene lesiones graves,
call 911 directly|llame directamente al 911
. This chat cannot contact responders.|. Este chat no puede contactar a los servicios de emergencia.
AI assistance is unavailable right now. Use the official resources or speak with a representative.|La ayuda de IA no está disponible ahora. Use los recursos oficiales o hable con un representante.
`.trim().split('\n').map(line => line.split('|')));
Object.assign(spanish, Object.fromEntries(`Rebuild the summary to apply your household-detail selections before exporting.|Reconstruya el resumen para aplicar sus selecciones de datos del hogar antes de exportar.
HERO explains your recovery plan and may ask one follow-up question.|HERO explica su plan de recuperación y puede hacer una pregunta de seguimiento.
Ask HERO / retry|Preguntar a HERO / reintentar
HERO home|Inicio de HERO
Virginia Disaster Assistance Navigator|Orientación sobre ayuda ante desastres en Virginia
HERO — Virginia Disaster Assistance Navigator|HERO — Orientación sobre ayuda ante desastres en Virginia
Plan ahead — HERO — Virginia Disaster Assistance Navigator|Prepararse — HERO — Orientación sobre ayuda ante desastres en Virginia
Your account — HERO — Virginia Disaster Assistance Navigator|Su cuenta — HERO — Orientación sobre ayuda ante desastres en Virginia
Your recovery plan|Su plan de recuperación
Edit your answers|Editar sus respuestas
Do next|Pasos siguientes
Prepare for your conversation|Prepárese para la conversación
Progress is reported by you and kept in this tab. It does not confirm an agency action.|Usted indica el progreso y se guarda en esta pestaña. No confirma ninguna acción de una agencia.
Agencies determine eligibility. Confirm application availability and center details directly.|Las agencias determinan la elegibilidad. Confirme directamente la disponibilidad de solicitudes y los detalles de los centros.
Print / Save as PDF|Imprimir / Guardar como PDF
Download plan text|Descargar el texto del plan
Prepare a summary for a helper|Preparar un resumen para una persona que le ayude
Plan text / copy|Texto del plan / copiar
Recovery plan text|Texto del plan de recuperación
Select plan text|Seleccionar el texto del plan
Review your summary for a helper|Revise el resumen para una persona que le ayude
Review and edit the exact text before you share it. Exporting does not contact a helper or reserve assistance.|Revise y edite el texto exacto antes de compartirlo. Exportar no contacta a nadie ni reserva ayuda.
Saved health, disability and support answers and your chat are excluded. Edits stay on this page and are not sent to AI. Keep identifying and private medical details out of this summary.|Se excluyen sus respuestas guardadas sobre salud, discapacidad y apoyo, y su chat. Las ediciones permanecen en esta página y no se envían a la IA. No incluya datos de identificación ni datos médicos privados en este resumen.
Optional saved household details|Datos guardados del hogar opcionales
Questions you want to ask|Preguntas que desea hacer
What do you still need help understanding?|¿Qué necesita todavía entender mejor?
Rebuild summary from current plan|Reconstruir el resumen con el plan actual
Rebuilding replaces edits in the preview below. Your questions above are kept.|Reconstruir reemplaza las ediciones de la vista previa. Se conservan sus preguntas de arriba.
Your plan or selections changed. Rebuild the summary to include them, or export the draft you have reviewed.|Su plan o sus selecciones cambiaron. Reconstruya el resumen para incluirlos o exporte el borrador que ha revisado.
Exact summary to print or download|Resumen exacto para imprimir o descargar
Print summary / Save as PDF|Imprimir resumen / Guardar como PDF
Download summary text|Descargar el texto del resumen
Select summary text|Seleccionar el texto del resumen
Official resources and guidance limits|Recursos oficiales y límites de la orientación
Ask HERO about your next step|Pregunte a HERO sobre su siguiente paso
Not checked|Sin comprobar
Connecting|Conectando
AI reply received|Respuesta de IA recibida
AI unavailable|IA no disponible
Emergency guidance — AI was not contacted|Orientación de emergencia — no se contactó a la IA
Your questions go to Azure AI. Keep private health and identifying details out of messages.|Sus preguntas se envían a Azure AI. No incluya datos médicos privados ni de identificación en los mensajes.
How HERO uses your information|Cómo usa HERO su información
AI returned an unverified answer. Your recovery plan is still available.|La IA devolvió una respuesta no verificada. Su plan de recuperación sigue disponible.
Choose valid recovery actions.|Elija acciones de recuperación válidas.`.split("\n").map(line => line.split("|"))));
const patterns = [
 [/^Google account linked: (.+)\. Either sign-in method opens this same profile if you created a password account\.$/, (_, email) => `Cuenta de Google vinculada: ${email}. Si creó una cuenta con contraseña, ambos métodos abren este mismo perfil.`],
 [/^Declaration status unknown for (.+?)\. (.+)$/, (_, place, detail) => `Se desconoce el estado de las declaraciones para ${place}. ${detail.startsWith('Previously') ? 'Los registros anteriores se muestran como contexto histórico. Consulte de nuevo o confirme los detalles con los recursos oficiales.' : 'No se pudieron consultar los datos de FEMA. Puede usar los recursos oficiales de ayuda anteriores.'}`],
 [/^Retrieved (\d+) recent declaration records for (.+) \(all incident types\)\.(.*)$/, (_, n, place, more) => `Se consultaron ${n} registros recientes para ${place} (todos los tipos de incidentes).${more ? ' Hay más registros históricos en la fuente.' : ''}`],
 [/^No declaration records returned for (.+)\. This does not rule out other assistance\.$/, (_, place) => `No se devolvieron registros de declaraciones para ${place}. Esto no descarta otras ayudas.`],
 [/^Last successful FEMA check: (.+?)( — stale\.| — cached for up to 15 minutes\.|\.)$/, (_, date, state) => `Última consulta exitosa de FEMA: ${date}${state.includes('stale') ? ' — datos antiguos.' : state.includes('cached') ? ' — en caché hasta 15 minutos.' : '.'}`],
 [/^Progress was not saved\. (.+)$/, (_, error) => `No se guardó el progreso. ${translate(error, 'es')}`],
 [/^Step (\d+) of 4$/, (_, n) => `Paso ${n} de 4`],
 [/^Step (\d+)$/, (_, n) => `Paso ${n}`],
 [/^(\d+) (locality available\.|localities available\.)$/, (_, n) => `${n} ${n === '1' ? 'localidad disponible' : 'localidades disponibles'}.`],
 [/^(\d+) (damage localities|options) available\. Select one from the list\.$/, (_, n) => `${n} localidades disponibles. Seleccione una de la lista.`],
 [/^Selected home: (.+)$/, (_, n) => `Hogar seleccionado: ${n}`],
 [/^(\d+) of (\d+) tasks complete(.*)$/, (_, n, total) => `${n} de ${total} tareas completadas. Puede volver a cualquier tarea.`],
 [/^Prepared: (.+)$/, (_, d) => `Preparado: ${d}`],
 [/^Source: (.+)$/, (_, s) => `Fuente: ${translate(s, 'es')}`],
 [/^Current locality: not provided\. Help requested: (.+)\.$/, (_, need) => `Localidad actual: no indicada. Ayuda solicitada: ${translate(need, 'es')}.`],
 [/^Current locality you entered: (.+)\. Help requested: (.+)\.$/, (_, place, need) => `Localidad actual indicada: ${place}. Ayuda solicitada: ${translate(need, 'es')}.`],
 [/^Based on your request for (.+), start with these official sites:$/, (_, need) => `Según su solicitud de ${translate(Object.keys(spanish).find(k => k.toLowerCase() === need) || need, 'es')}, empiece con estos sitios oficiales:`],
 [/^Your saved home locality is (.+)\. Use it only if you are there now\.$/, (_, place) => `La localidad de su hogar guardado es ${place}. Úsela solo si está allí ahora.`],
 [/^Saved home: (.+)\. Household size: (.+)\.$/, (_, place, size) => `Hogar guardado: ${place === 'not provided' ? 'no indicado' : place}. Personas del hogar: ${size === 'not provided' ? 'no indicado' : size}.`],
 [/^Signed in as (.+?)(\. This profile belongs to your account\.)?$/, (_, user, suffix) => `Sesión iniciada como ${user}${suffix ? '. Este perfil pertenece a su cuenta.' : ''}`],
 [/^Profile saved to (your account|this browser)\. Review or update your answers below\.$/, (_, dest) => `Perfil guardado en ${dest === 'your account' ? 'su cuenta' : 'este navegador'}. Revise o actualice sus respuestas.`],
 [/^No household profile is saved to (your account|this browser)\.$/, (_, dest) => `No hay un perfil guardado en ${dest === 'your account' ? 'su cuenta' : 'este navegador'}.`],
 [/^Based on your saved household answers\. Update and save the form to change these tasks\. Progress saves to (.+)$/, (_, dest) => `Según sus respuestas guardadas. Edite y guarde el formulario para cambiar las tareas. El progreso se guarda en ${dest === 'your account.' ? 'su cuenta.' : 'el perfil de este navegador.'}`],
 [/^Checking FEMA records for (.+)…$/, (_, place) => `Consultando registros de FEMA para ${place}…`],
 [/^\[([x ])\] (.+)$/, (_, state, title) => `[${state}] ${translate(title, 'es')}`]
];
function translate(text, language = 'en') {
 if (language === 'en' || typeof text !== 'string') return text;
 const key = text.trim();
 if (language !== 'es' && Object.hasOwn(localePacks || {}, language)) {
  const pack = localePacks[language];
  if (Object.hasOwn(pack, key)) return text.replace(key, () => pack[key]);
  const fill = (template, values) => (pack[template] || template).replace(/\{(\w+)\}/g, (_, token) => values[token] ?? `{${token}}`);
  const t = value => translate(value, language);
  const dynamic = [
   [/^Step (\d+) of 4$/, m => fill('Step {n} of 4', {n:m[1]})],
   [/^Step (\d+)$/, m => fill('Step {n}', {n:m[1]})],
   [/^(\d+) localit(?:y|ies) available\.$/, m => fill('{n} localities available.', {n:m[1]})],
   [/^(\d+) (?:damage localities|options) available\. Select one from the list\.$/, m => fill('{n} options available. Select one from the list.', {n:m[1]})],
   [/^Selected home: (.+)$/, m => fill('Selected home: {place}', {place:m[1]})],
   [/^(\d+) of (\d+) tasks complete.*$/, m => fill('{n} of {total} tasks complete. You can return to any task.', {n:m[1],total:m[2]})],
   [/^(\d+) of (\d+) recovery actions marked complete by you\.$/, m => fill('{n} of {total} recovery actions marked complete by you.', {n:m[1],total:m[2]})],
   [/^Prepared: (.+)$/, m => fill('Prepared: {date}', {date:m[1]})],
   [/^Source: (.+)$/, m => { const source = m[1].match(/^(.+) — (https?:\/\/.+)$/); return fill('Source: {source}', {source:source ? `${t(source[1])} — ${source[2]}` : t(m[1])}); }],
   [/^Current locality: not provided\. Help requested: (.+)\.$/, m => fill('Current locality: not provided. Help requested: {need}.', {need:t(m[1])})],
   [/^Current locality you entered: (.+)\. Help requested: (.+)\.$/, m => fill('Current locality you entered: {place}. Help requested: {need}.', {place:m[1],need:t(m[2])})],
   [/^Based on your request for (.+), start with these official sites:$/, m => fill('Based on your request for {need}, start with these official sites:', {need:t(Object.keys(spanish).find(k=>k.toLowerCase()===m[1])||m[1])})],
   [/^Your saved home locality is (.+)\. Use it only if you are there now\.$/, m => fill('Your saved home locality is {place}. Use it only if you are there now.', {place:m[1]})],
   [/^Saved home: (.+)\. Household size: (.+)\.$/, m => fill('Saved home: {place}. Household size: {size}.', {place:t(m[1]),size:t(m[2])})],
   [/^Signed in as (.+?)(\. This profile belongs to your account\.)?$/, m => fill(m[2] ? 'Signed in as {user}. This profile belongs to your account.' : 'Signed in as {user}', {user:m[1]})],
   [/^Google account linked: (.+)\. Either sign-in method opens this same profile if you created a password account\.$/, m => fill('Google account linked: {email}. Either sign-in method opens this same profile if you created a password account.', {email:m[1]})],
   [/^Profile saved to (your account|this browser)\. Review or update your answers below\.$/, m => fill('Profile saved to {dest}. Review or update your answers below.', {dest:t(m[1])})],
   [/^No household profile is saved to (your account|this browser)\.$/, m => fill('No household profile is saved to {dest}.', {dest:t(m[1])})],
   [/^Based on your saved household answers\. Update and save the form to change these tasks\. Progress saves to (.+)$/, m => fill('Based on your saved household answers. Update and save the form to change these tasks. Progress saves to {dest}', {dest:t(m[1])})],
   [/^Checking FEMA records for (.+)…$/, m => fill('Checking FEMA records for {place}…', {place:m[1]})],
   [/^Declaration status unknown for (.+?)\. (.+)$/, m => fill('Declaration status unknown for {place}. {detail}', {place:m[1],detail:t(m[2].startsWith('Previously') ? 'Previously retrieved records are shown as historical context. Check again or confirm with official resources.' : 'FEMA data could not be checked. You can still use the official assistance resources above.')})],
   [/^Retrieved (\d+) recent declaration records for (.+) \(all incident types\)\.(.*)$/, m => fill('Retrieved {n} recent declaration records for {place} (all incident types).', {n:m[1],place:m[2]})+(m[3] ? ' '+t('More historical records are available at the source.') : '')],
   [/^No declaration records returned for (.+)\. This does not rule out other assistance\.$/, m => fill('No declaration records returned for {place}. This does not rule out other assistance.', {place:m[1]})],
   [/^Last successful FEMA check: (.+?)( — stale\.| — cached for up to 15 minutes\.|\.)$/, m => fill('Last successful FEMA check: {date}{state}', {date:m[1],state:t(m[2])})],
   [/^Progress was not saved\. (.+)$/, m => fill('Progress was not saved. {error}', {error:t(m[1])})],
   [/^\[([x ])\] (.+)$/, m => `[${m[1]}] ${t(m[2])}`]
  ];
  for (const [pattern, render] of dynamic) { const match = key.match(pattern); if (match) return text.replace(key, () => render(match)); }
  return text;
 }
 if (language !== 'es') return text;
 if (Object.hasOwn(spanish, key)) return text.replace(key, spanish[key]);
 for (const [pattern, replacement] of patterns) if (pattern.test(key)) return text.replace(key, key.replace(pattern, replacement));
 return text;
}
spanish['Guide text is bundled on your device. AI replies and FEMA records keep their original language. Official sites may have their own language controls.'] = 'El texto de la guía está incluido en su dispositivo. Las respuestas de IA y los registros de FEMA mantienen su idioma original. Los sitios oficiales pueden tener sus propios controles de idioma.';
spanish['Choose language'] = 'Elegir idioma';
spanish['Visit official site ↗'] = 'Visitar el sitio oficial ↗';
Object.assign(spanish, {
 'Google could not be loaded.': 'No se pudo cargar Google.',
 'Could not delete your profile. Please try again.': 'No se pudo eliminar su perfil. Vuelva a intentarlo.',
 'Check your connection and try again.': 'Compruebe su conexión y vuelva a intentarlo.',
 'Use a username with 3–32 letters, numbers, dots, underscores, or hyphens.': 'Use un nombre de usuario con 3–32 letras, números, puntos, guiones bajos o guiones.',
 'Use a password with 12–128 characters.': 'Use una contraseña de 12–128 caracteres.',
 'That username is already in use. Choose another or sign in.': 'Ese nombre de usuario ya está en uso. Elija otro o inicie sesión.',
 'The username or password is incorrect.': 'El nombre de usuario o la contraseña es incorrecto.',
 'Your sign-in changed or expired. Reload the account page.': 'Su sesión cambió o venció. Recargue la página de la cuenta.',
 'Google identity is invalid.': 'La identidad de Google no es válida.',
 'Sign in again before linking Google.': 'Inicie sesión de nuevo antes de vincular Google.',
 'This Google account already belongs to another HERO account. Sign out to use it; profiles will not be merged.': 'Esta cuenta de Google ya pertenece a otra cuenta de HERO. Cierre sesión para usarla; los perfiles no se combinarán.',
 'Google sign-in could not be verified. Reload and try again.': 'No se pudo verificar el inicio de sesión con Google. Recargue y vuelva a intentarlo.'
});
Object.assign(spanish, {
  "Choose your language": "Elija su idioma",
  "Select the language you’re most comfortable with, then press Confirm.": "Seleccione el idioma con el que se sienta más cómodo y pulse Confirmar.",
  "You can change your language anytime using the menu at the top of the page.": "Puede cambiar de idioma en cualquier momento desde el menú de la parte superior de la página.",
  "Selected language:": "Idioma seleccionado:",
  "Choose a language to enable Confirm.": "Elija un idioma para activar Confirmar.",
  "Press Confirm to enter HERO.": "Pulse Confirmar para entrar en HERO.",
  "Reads right to left": "Se lee de derecha a izquierda",
  "Confirm": "Confirmar"
});
Object.assign(spanish, localePacks?.es || {});
const languageCopy = { spanish, translate, languages, normalizeLanguage };
if (typeof module !== 'undefined') module.exports = languageCopy;
if (typeof window !== 'undefined') window.heroLanguageCopy = languageCopy;
