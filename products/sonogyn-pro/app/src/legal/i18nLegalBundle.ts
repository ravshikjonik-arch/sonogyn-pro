import type { I18n } from "i18n-js";

/** Legal & compliance copy (RU / EN / ES). Template-level text — obtain counsel before production reliance. */
const LEGAL: Record<"ru" | "en" | "es", Record<string, string>> = {
  ru: {
    legal_consent_before_use_title: "Перед использованием приложения",
    legal_consent_intro:
      "Приложение предназначено для врачей ультразвуковой диагностики и смежных специальностей.\n\n" +
      "Функции на основе искусственного интеллекта (ИИ) являются вспомогательными и не заменяют клиническое решение, очный осмотр и действующие клинические руководства.\n\n" +
      "Вы обязуетесь соблюдать медицинскую этику и правила профессионального сообщества.\n\n" +
      "Запрещены оскорбления, дискриминация, разжигание ненависти (в том числе на почве расы, религии, национальности, пола, инвалидности или иных признаков), спам и публикация персональных данных пациентов (ФИО, контакты, идентификаторы и т.п.). Используйте только обезличенные материалы.\n\n" +
      "Продолжая работу, вы соглашаетесь с Пользовательским соглашением, Политикой конфиденциальности и правилами платформы распространения приложений (Apple App Store / Google Play).",
    legal_consent_cb_terms: "Я принимаю Пользовательское соглашение",
    legal_consent_cb_privacy: "Я ознакомлен(а) с Политикой конфиденциальности",
    legal_consent_cb_ai: "Я понимаю, что ИИ является вспомогательным инструментом",
    legal_consent_read_terms: "Открыть текст: Пользовательское соглашение",
    legal_consent_read_privacy: "Открыть текст: Политика конфиденциальности",
    legal_consent_checks_header: "Подтверждения",
    legal_consent_continue: "Продолжить",
    legal_consent_public_doc_hint:
      "Для магазинов приложений также доступны публичные URL политики и условий (см. экраны ниже и настройки разработчика).",
    legal_url_placeholder_hint:
      "Внешние ссылки на политику и условия появятся после настройки реальных HTTPS URL в приложении (сейчас отключено, чтобы избежать зависаний на тестовых адресах).",
    legal_terms_title: "Пользовательское соглашение",
    legal_privacy_title: "Политика конфиденциальности",
    legal_disclaimer_title: "Медицинский отказ от ответственности",
    legal_doc_effective: "Версия документа",
    legal_open_external: "Открыть в браузере",
    legal_url_privacy_label: "Публичный URL политики конфиденциальности",
    legal_url_terms_label: "Публичный URL пользовательского соглашения",
    profile_legal_header: "Правовая информация",
    profile_legal_terms: "Пользовательское соглашение",
    profile_legal_privacy: "Политика конфиденциальности",
    profile_legal_disclaimer: "Медицинский disclaimer",
    legal_not_device_footer:
      "Приложение не является медицинским изделием (SaMD/Medical Device) в понимании регуляторов, если иное прямо не заявлено разработчиком в маркетинговых материалах и сертификации.",
    legal_terms_body: `1. Назначение приложения
Приложение предназначено для образовательной и вспомогательной профессиональной деятельности врачей, работающих с ультразвуковой диагностикой и смежными задачами. Оно не предназначено для самодиагностики или самолечения пациентами без медицинского образования.

2. Искусственный интеллект (ИИ)
Выводы и подсказки ИИ не являются медицинским диагнозом, заключением врачебной комиссии или назначением лечения. Разработчик не гарантирует полноту, актуальность или применимость автоматических рекомендаций к конкретному пациенту.

3. Ответственность
Пользователь самостоятельно принимает клинические и организационные решения и несёт профессиональную ответственность в рамках своей юрисдикции. Разработчик не несёт ответственности за клинические исходы, решения пользователя или третьих лиц.

4. Контент пользователей
Пользователь несёт полную ответственность за размещаемые тексты, изображения и иные материалы, включая соблюдение законодательства о персональных данных, врачебной тайне и лицензировании.

5. Запрещённый контент и поведение
Запрещены: оскорбления, спам, разжигание ненависти (включая расовую, религиозную и иную), дискриминация, публикация персональных данных пациентов, незаконный контент, вредоносное поведение, обход модерации.

6. Модерация
Администрация вправе без предварительного уведомления удалять контент, ограничивать функции, приостанавливать или блокировать учётные записи при нарушении правил или по требованию закона.

7. Подписка PRO (автопродление)
При наличии платной подписки: это автоматически продлеваемая подписка (auto-renewable), если иное не указано в оферте магазина. Управление и отмена подписки выполняются в настройках учётной записи Apple ID (Подписки) или Google Play (Платежи и подписки). Возвраты — по правилам соответствующего магазина.

8. Изменения условий
Разработчик может обновлять настоящее соглашение. Существенные изменения доводятся до сведения через приложение или иные разумные каналы. Продолжение использования после обновления может означать согласие с новой редакцией, если это допускается применимым правом.

9. Контакты
Обращения по вопросам соглашения: через раздел поддержки / контакт, указанный разработчиком в магазине приложений.`,
    legal_privacy_body: `1. Кто обрабатывает данные
Оператором является разработчик приложения (см. карточку приложения в App Store / Google Play). При использовании облачных функций (например, Firebase) обработка может осуществляться совместно с указанными в настройках SDK поставщиками инфраструктуры.

2. Какие данные могут собираться
— Технические и диагностические данные устройства и приложения (логи сбоев, версия ОС).
— Учётные / псевдоанонимные идентификаторы (например, анонимный UID для облачных функций).
— Контент, который пользователь добровольно размещает (описания кейсов, комментарии, изображения), в объёме, необходимом для работы сервиса.
— Данные о покупках и статусе подписки через Apple / Google (обрабатываются магазином и/или выбранным провайдером платежей).

3. Аналитика и коммуникации
Приложение может использовать инструменты аналитики или обмена данными с бэкендом для улучшения продукта. Мы не продаём персональные данные третьим лицам в рекламных целях. Любая маркетинговая рассылка (если появится) будет опираться на отдельное согласие, где это требуется законом.

4. Хранение и защита
Данные хранятся на защищённых серверах с ограничением доступа. Пользователь обязан использовать устойчивые пароли на устройстве и соблюдать политики клиники по работе с медицинской информацией.

5. Персональные данные пациентов
Пользователь обязан деидентифицировать данные пациента. Запрещена публикация ФИО, адресов, номеров полисов, уникальных идентификаторов и иной персональной информации. Нарушение может привести к блокировке аккаунта и передаче сведений уполномоченным органам при наличии законных оснований.

6. Права пользователя
В зависимости от юрисдикции: право на доступ, исправление, удаление, ограничение обработки, возражение и переносимость данных — через запрос к оператору.

7. Отсутствие продажи данных
Мы не продаём ваши персональные данные в смысле «data broker» (торговля базами для рекламы третьих сторон).

8. Международные передачи
При использовании облаков данные могут обрабатываться за пределами вашей страны — с применением стандартных механизмов защиты, предусмотренных поставщиком инфраструктуры и применимым правом.`,
    legal_disclaimer_body: `Приложение не является медицинским изделием и не заменяет клиническое решение врача, очный осмотр, лабораторные и инструментальные исследования, а также действующие клинические рекомендации и стандарты медицинской помощи.

Информация в приложении носит справочно-образовательный характер. Для постановки диагноза, выбора тактики лечения и медицинских назначений обращайтесь к действующему законодательству и профессиональным протоколам вашей юрисдикции.`,
  },
  en: {
    legal_consent_before_use_title: "Before you use the app",
    legal_consent_intro:
      "This app is intended for licensed healthcare professionals involved in ultrasound and related clinical workflows.\n\n" +
      "Artificial intelligence (AI) features are assistive only. They are not a medical diagnosis and do not replace independent clinical judgment, physical examination, or applicable clinical guidelines.\n\n" +
      "You agree to uphold medical ethics and professional community standards.\n\n" +
      "Harassment, discrimination, hate (including race, religion, nationality, gender, disability, or other protected characteristics), spam, and publication of patient personal data (name, contact details, identifiers, etc.) are prohibited. Use de-identified materials only.\n\n" +
      "By continuing, you agree to the Terms of Use, Privacy Policy, and the distribution platform rules (Apple App Store / Google Play).",
    legal_consent_cb_terms: "I accept the Terms of Use",
    legal_consent_cb_privacy: "I have read the Privacy Policy",
    legal_consent_cb_ai: "I understand that AI is an assistive tool",
    legal_consent_read_terms: "Open document: Terms of Use",
    legal_consent_read_privacy: "Open document: Privacy Policy",
    legal_consent_checks_header: "Confirmations",
    legal_consent_continue: "Continue",
    legal_consent_public_doc_hint:
      "For store review, public HTTPS URLs for the Privacy Policy and Terms should be published and kept up to date in developer metadata.",
    legal_url_placeholder_hint:
      "External browser links are disabled until you configure real HTTPS URLs in the app (prevents hangs on placeholder hosts).",
    legal_terms_title: "Terms of Use",
    legal_privacy_title: "Privacy Policy",
    legal_disclaimer_title: "Medical disclaimer",
    legal_doc_effective: "Document version",
    legal_open_external: "Open in browser",
    legal_url_privacy_label: "Public Privacy Policy URL",
    legal_url_terms_label: "Public Terms of Use URL",
    profile_legal_header: "Legal & compliance",
    profile_legal_terms: "Terms of Use",
    profile_legal_privacy: "Privacy Policy",
    profile_legal_disclaimer: "Medical disclaimer",
    legal_not_device_footer:
      "Unless expressly certified otherwise by the developer, the app is not positioned as a regulated Software as a Medical Device (SaMD) / medical device.",
    legal_terms_body: `1. Purpose
The app supports educational and ancillary professional use by clinicians working with ultrasound. It is not intended for lay self-diagnosis or self-treatment.

2. Artificial intelligence
AI outputs are not a diagnosis, formal report, or prescription. The developer does not warrant completeness, timeliness, or fitness for a particular patient.

3. Responsibility
You remain solely responsible for clinical and operational decisions within your license and jurisdiction. The developer is not liable for outcomes based on your use of the app.

4. User content
You are responsible for texts, images, and other materials you submit, including compliance with privacy law, professional secrecy, and licensing.

5. Prohibited conduct
No harassment, spam, hate, discrimination, patient identifiable information, illegal content, or attempts to circumvent moderation.

6. Moderation
We may remove content, restrict features, suspend, or block accounts without prior notice where permitted by law or platform policy.

7. PRO subscription (auto-renew)
Paid plans may be auto-renewable subscriptions as offered by Apple/Google. Manage or cancel in Apple ID Subscriptions or Google Play subscriptions. Refunds follow store rules.

8. Changes
We may update these terms. Material changes will be communicated in-app or by other reasonable means. Continued use may constitute acceptance where allowed by law.

9. Contact
Use the support channel listed on the store listing for legal inquiries.`,
    legal_privacy_body: `1. Controller
The developer identified in the store listing acts as the primary controller. Cloud providers (e.g., Firebase) may process data as subprocessors.

2. Data categories
Device/app diagnostics, pseudonymous identifiers, user-generated clinical educational content you submit, and subscription status via Apple/Google/payment providers.

3. Analytics & communications
We may use analytics or backend telemetry to improve the product. We do not sell personal data to data brokers. Marketing communications, if any, will rely on consent where required.

4. Storage & security
Data is stored on access-controlled infrastructure. You must secure your device and follow institutional policies for medical information.

5. Patient data
You must de-identify patient information. Do not post names, addresses, insurance numbers, or other identifiers. Violations may lead to account termination and lawful disclosure.

6. Rights
Depending on jurisdiction: access, rectification, erasure, restriction, objection, and portability—contact the operator.

7. No sale of personal data
We do not sell personal information in the brokered advertising sense.

8. International transfers
Cloud processing may occur outside your country using provider safeguards permitted by applicable law.`,
    legal_disclaimer_body: `The app is not a medical device and does not replace a physician’s clinical decision, in-person examination, laboratory or imaging work-up, or applicable clinical practice guidelines.

Information is educational and reference in nature. For diagnosis, treatment, and prescribing, follow the laws and professional standards of your jurisdiction.`,
  },
  es: {
    legal_consent_before_use_title: "Antes de usar la aplicación",
    legal_consent_intro:
      "La aplicación está destinada a profesionales sanitarios con formación en ecografía y flujos clínicos afines.\n\n" +
      "Las funciones de inteligencia artificial (IA) son auxiliares. No constituyen diagnóstico médico ni sustituyen el juicio clínico independiente, la exploración física ni las guías clínicas aplicables.\n\n" +
      "Usted se compromete a respetar la ética médica y las normas de la comunidad profesional.\n\n" +
      "Están prohibidos el acoso, la discriminación, el odio (incluidos motivos raciales, religiosos, de nacionalidad, de género, discapacidad u otros), el spam y la publicación de datos personales del paciente (nombre, contacto, identificadores, etc.). Utilice solo material desidentificado.\n\n" +
      "Al continuar, acepta los Términos de uso, la Política de privacidad y las reglas de la plataforma de distribución (Apple App Store / Google Play).",
    legal_consent_cb_terms: "Acepto los Términos de uso",
    legal_consent_cb_privacy: "He leído la Política de privacidad",
    legal_consent_cb_ai: "Entiendo que la IA es una herramienta auxiliar",
    legal_consent_read_terms: "Abrir documento: Términos de uso",
    legal_consent_read_privacy: "Abrir documento: Política de privacidad",
    legal_consent_checks_header: "Confirmaciones",
    legal_consent_continue: "Continuar",
    legal_consent_public_doc_hint:
      "Para la revisión de tiendas, los enlaces HTTPS públicos a la Política de privacidad y a los Términos deben estar publicados y actualizados en los metadatos del desarrollador.",
    legal_url_placeholder_hint:
      "Los enlaces externos se habilitan cuando configure URLs HTTPS reales (desactivado con hosts de ejemplo para evitar bloqueos).",
    legal_terms_title: "Términos de uso",
    legal_privacy_title: "Política de privacidad",
    legal_disclaimer_title: "Descargo de responsabilidad médica",
    legal_doc_effective: "Versión del documento",
    legal_open_external: "Abrir en el navegador",
    legal_url_privacy_label: "URL pública de la Política de privacidad",
    legal_url_terms_label: "URL pública de los Términos de uso",
    profile_legal_header: "Legal y cumplimiento",
    profile_legal_terms: "Términos de uso",
    profile_legal_privacy: "Política de privacidad",
    profile_legal_disclaimer: "Descargo médico",
    legal_not_device_footer:
      "Salvo certificación expresa en contrario por el desarrollador, la aplicación no se presenta como un software dispositivo médico (SaMD) regulado.",
    legal_terms_body: `1. Finalidad
La aplicación apoya el uso educativo y profesional complementario en ecografía. No está destinada al autodiagnóstico o autotratamiento de pacientes sin titulación sanitaria.

2. Inteligencia artificial
Los resultados de IA no son diagnóstico, informe oficial ni prescripción. El desarrollador no garantiza integridad, vigencia o idoneidad para un paciente concreto.

3. Responsabilidad
Usted es responsable de las decisiones clínicas y operativas conforme a su licencia y jurisdicción. El desarrollador no responde por los resultados clínicos derivados del uso.

4. Contenido del usuario
Usted es responsable de textos, imágenes y demás materiales, incluido el cumplimiento de la normativa de protección de datos, secreto profesional y licencias.

5. Conducta prohibida
Sin acoso, spam, odio, discriminación, datos identificables del paciente, contenido ilícito ni elusión de la moderación.

6. Moderación
Podemos eliminar contenido, restringir funciones, suspender o bloquear cuentas sin previo aviso cuando lo permita la ley o la política de la plataforma.

7. Suscripción PRO (renovación automática)
Los planes de pago pueden ser suscripciones de renovación automática según Apple/Google. Gestione o cancele en Suscripciones de Apple ID o Google Play. Los reembolsos siguen las reglas de la tienda.

8. Cambios
Podemos actualizar estos términos. Los cambios sustanciales se comunicarán en la app u otros medios razonables. El uso continuado puede implicar aceptación cuando lo permita la ley.

9. Contacto
Utilice el canal de soporte indicado en la ficha de la tienda.`,
    legal_privacy_body: `1. Responsable del tratamiento
El desarrollador indicado en la tienda actúa como responsable principal. Proveedores en la nube (p. ej., Firebase) pueden tratar datos como encargados.

2. Categorías de datos
Diagnóstico del dispositivo/app, identificadores seudónimos, contenido generado por el usuario que usted envía, y estado de suscripción vía Apple/Google/proveedores de pago.

3. Análisis y comunicaciones
Podemos usar analítica o telemetría para mejorar el producto. No vendemos datos personales a intermediarios publicitarios. Comunicaciones comerciales, si las hubiera, se basarán en el consentimiento cuando sea obligatorio.

4. Almacenamiento y seguridad
Los datos se almacenan en infraestructura con control de acceso. Asegure su dispositivo y siga las políticas institucionales sobre información médica.

5. Datos del paciente
Debe desidentificar la información. No publique nombres, direcciones, números de póliza u otros identificadores. Las infracciones pueden conllevar el cierre de la cuenta y divulgaciones legales.

6. Derechos
Según jurisdicción: acceso, rectificación, supresión, limitación, oposición y portabilidad — contacte al operador.

7. No venta de datos personales
No vendemos información personal en el sentido de intermediación publicitaria.

8. Transferencias internacionales
El procesamiento en la nube puede realizarse fuera de su país con las salvaguardas del proveedor permitidas por la ley aplicable.`,
    legal_disclaimer_body: `La aplicación no es un dispositivo médico y no sustituye la decisión clínica del médico, la exploración presencial, las pruebas de laboratorio o imagen, ni las guías de práctica clínica aplicables.

La información es de carácter educativo y de referencia. Para diagnóstico, tratamiento y prescripción, siga la legislación y los estándares profesionales de su jurisdicción.`,
  },
};

export function attachLegalTranslations(i18n: I18n) {
  (["ru", "en", "es"] as const).forEach((loc) => {
    const base = (i18n.translations[loc] ?? {}) as Record<string, string>;
    i18n.translations[loc] = { ...base, ...LEGAL[loc] };
  });
}
