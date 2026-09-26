import type { AppLanguage } from '../../lib/i18n'

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }

// Contact numbers are intentionally different: this is the number shown to
// the user, but the actual tel:/wa.me links point elsewhere per the exact
// values given for these documents - not run through normalizePhone/
// telHref, since those would reformat the tel: link with a "+" prefix and
// break the literal tel:0526779642 target specified. Same for every
// language - a phone number isn't translated.
export const LEGAL_CONTACT = {
  displayPhone: '050-995-6406',
  telHref: 'tel:0526779642',
  whatsappHref: 'https://wa.me/972526779642'
}

export const LEGAL_LAST_UPDATED: Record<AppLanguage, string> = {
  ar: '10 سبتمبر 2026',
  en: 'September 10, 2026',
  he: '10 בספטמבר 2026'
}

// English and Hebrew are AI-produced translations of the Arabic text the
// user provided (which remains the authoritative source) - not a
// professional/legal translation. Good enough for the app to no longer be
// Arabic-only, but worth a native-speaker/legal read-through before treating
// either as the binding text in its language.
export const privacyPolicyBlocks: Record<AppLanguage, LegalBlock[]> = {
  ar: [
    { type: 'p', text: 'في أخوو (AKHOO) نحترم خصوصية مستخدمينا ونسعى إلى حماية المعلومات الشخصية التي يتم جمعها أو معالجتها من خلال التطبيق.' },
    { type: 'p', text: 'توضح هذه السياسة أنواع المعلومات التي قد نجمعها، وكيف نستخدمها، ومتى قد تتم مشاركتها، وما الخيارات المتاحة للمستخدم للتحكم ببياناته.' },
    { type: 'p', text: 'باستخدام تطبيق أخوو أو إنشاء حساب فيه، فإنك تقر بأنك اطلعت على سياسة الخصوصية هذه.' },

    { type: 'h2', text: '1. المعلومات التي قد نجمعها' },
    { type: 'p', text: 'قد يجمع أخوو المعلومات اللازمة لتشغيل خدمات التطبيق، بحسب طريقة استخدامك له.' },

    { type: 'h3', text: 'معلومات الحساب' },
    { type: 'p', text: 'قد تشمل:' },
    { type: 'ul', items: ['الاسم.', 'رقم الهاتف.', 'صورة الملف الشخصي إذا اخترت إضافتها.', 'معرف داخلي للحساب.', 'معلومات ضرورية للمصادقة وتأمين الحساب.'] },

    { type: 'h3', text: 'معلومات الموقع' },
    { type: 'p', text: 'قد يستخدم أخوو موقعك التقريبي أو الدقيق عندما تكون هذه المعلومات ضرورية لتشغيل إحدى ميزات التطبيق، مثل:' },
    { type: 'ul', items: ['إنشاء طلب مساعدة.', 'عرض طلبات المساعدة القريبة.', 'ربط طالب المساعدة بالمستخدم الذي قبل المهمة.', 'متابعة المهمة النشطة.', 'عرض خدمات سيارات وأعمال قريبة منك.'] },
    { type: 'p', text: 'نسعى إلى عدم كشف الموقع الدقيق للمستخدمين غير المخولين بالاطلاع عليه.' },

    { type: 'h3', text: 'بيانات طلبات المساعدة' },
    { type: 'p', text: 'قد تشمل:' },
    { type: 'ul', items: ['نوع المشكلة.', 'وصف الطلب.', 'موقع الطلب.', 'وقت إنشاء الطلب.', 'حالة الطلب أو المهمة.', 'وقت الوصول أو الإكمال أو الإلغاء.', 'الصور التي يختار المستخدم رفعها.', 'المعلومات المرتبطة بالمستخدمين المشاركين في المهمة.'] },

    { type: 'h3', text: 'النقاط والمكافآت' },
    { type: 'p', text: 'قد نحتفظ بمعلومات مرتبطة بنظام النقاط، مثل:' },
    { type: 'ul', items: ['رصيد النقاط.', 'كيفية اكتساب النقاط.', 'تاريخ العمليات.', 'المكافآت أو العروض التي تم استخدامها.', 'النقاط التي تم خصمها أو إلغاؤها.'] },

    { type: 'h3', text: 'عضوية أخوو+' },
    { type: 'p', text: 'إذا تم استخدام عضوية أخوو+، قد نعالج بيانات مثل:' },
    { type: 'ul', items: ['حالة الاشتراك.', 'نوع الخطة.', 'تاريخ بدء الاشتراك.', 'تاريخ التجديد أو الانتهاء.', 'معرفات المعاملات اللازمة للتحقق من الاشتراك.'] },
    { type: 'p', text: 'لا يقوم أخوو بتخزين رقم البطاقة البنكية الكامل أو رمز الحماية الخاص بالبطاقة داخل قاعدة بيانات التطبيق.' },

    { type: 'h3', text: 'معلومات تقنية' },
    { type: 'p', text: 'قد نجمع معلومات فنية ضرورية لتحسين الأمان والاستقرار، مثل:' },
    { type: 'ul', items: ['نوع الجهاز.', 'نظام التشغيل.', 'إصدار التطبيق.', 'معرف الإشعارات.', 'بيانات الأعطال والأخطاء.', 'معلومات أمنية تساعد على منع الاحتيال أو إساءة الاستخدام.'] },

    { type: 'h2', text: '2. كيف نستخدم المعلومات' },
    { type: 'p', text: 'قد نستخدم المعلومات التي نجمعها من أجل:' },
    { type: 'ul', items: ['إنشاء الحساب وإدارته.', 'تشغيل خدمة طلب المساعدة وتقديمها.', 'تحديد الطلبات أو الخدمات القريبة.', 'تنفيذ ومتابعة المهمات.', 'إرسال إشعارات مرتبطة بالحساب أو المهمة.', 'إدارة النقاط والمكافآت.', 'عرض العروض الأسبوعية.', 'تشغيل مزايا أخوو+.', 'عرض الأعمال والخدمات المتعلقة بالسيارات.', 'منع الاحتيال وسوء الاستخدام.', 'حماية المستخدمين.', 'تحسين أداء التطبيق.', 'تقديم الدعم والمساعدة للمستخدمين.'] },

    { type: 'h2', text: '3. مشاركة المعلومات' },
    { type: 'p', text: 'لا يقوم أخوو ببيع المعلومات الشخصية للمستخدمين.' },
    { type: 'p', text: 'قد تتم مشاركة معلومات محدودة عندما تكون ضرورية لتشغيل الخدمة.' },
    { type: 'p', text: 'فعلى سبيل المثال، بعد قبول مهمة مساعدة، قد يحصل طرفا المهمة على المعلومات الضرورية لتنفيذ المساعدة، مثل الاسم أو الموقع المطلوب للوصول إلى مكان المهمة.' },
    { type: 'p', text: 'وقد يستخدم أخوو مزودي خدمات خارجيين لتشغيل بعض أجزاء التطبيق، مثل:' },
    { type: 'ul', items: ['قواعد البيانات والاستضافة.', 'الخرائط وخدمات الموقع.', 'الإشعارات.', 'خدمات المصادقة.', 'معالجة الاشتراكات.', 'مراقبة الأعطال والأمان.'] },
    { type: 'p', text: 'يتم استخدام هذه الخدمات فقط بالقدر اللازم لتشغيل التطبيق.' },

    { type: 'h2', text: '4. استخدام الموقع الجغرافي' },
    { type: 'p', text: 'قد يكون الموقع ضروريًا لبعض وظائف أخوو.' },
    { type: 'p', text: 'قبل قبول المهمة، قد يتم عرض موقع تقريبي فقط.' },
    { type: 'p', text: 'بعد قبول المهمة، قد يتم توفير الموقع الأدق للمستخدمين المشاركين في المهمة عندما يكون ذلك ضروريًا للوصول وتقديم المساعدة.' },
    { type: 'p', text: 'عند انتهاء المهمة أو انتهاء الحاجة التشغيلية، لا يفترض استمرار استخدام الموقع المباشر لأغراض المهمة.' },
    { type: 'p', text: 'يمكنك تغيير صلاحيات الموقع من إعدادات هاتفك، ولكن تعطيلها قد يؤدي إلى توقف بعض ميزات أخوو عن العمل.' },

    { type: 'h2', text: '5. الصور والملفات' },
    { type: 'p', text: 'قد يسمح التطبيق للمستخدم برفع صور مرتبطة بطلب المساعدة.' },
    { type: 'p', text: 'ننصح بعدم رفع:' },
    { type: 'ul', items: ['صور تحتوي على معلومات شخصية غير ضرورية.', 'مستندات حساسة.', 'صور لأشخاص آخرين دون ضرورة أو إذن مناسب.'] },
    { type: 'p', text: 'نسعى إلى تقييد الوصول إلى صور الطلبات الخاصة على الأشخاص المخولين فقط.' },

    { type: 'h2', text: '6. نظام النقاط' },
    { type: 'p', text: 'النقاط داخل أخوو هي جزء من برنامج مكافآت داخلي.' },
    { type: 'p', text: 'النقاط:' },
    { type: 'ul', items: ['ليست أموالًا.', 'ليست عملة رقمية.', 'ليس لها قيمة نقدية ثابتة.', 'لا يمكن سحبها نقدًا.'] },
    { type: 'p', text: 'قد يحصل المستخدم على نقاط مقابل أنشطة معتمدة، مثل إتمام مساعدة حقيقية وفق قواعد التطبيق.' },
    { type: 'p', text: 'وقد يتم استخدام النقاط للاستفادة من عروض أو مكافآت يحددها أخوو من وقت لآخر.' },

    { type: 'h2', text: '7. أخوو+' },
    { type: 'p', text: 'قد يقدم التطبيق عضوية اختيارية مدفوعة باسم أخوو+.' },
    { type: 'p', text: 'قد تمنح العضوية مزايا إضافية، مثل عروض أو خصومات حصرية.' },
    { type: 'p', text: 'الاشتراك في أخوو+ لا يعطي المستخدم أولوية في الحصول على المساعدة الأساسية ولا يمنع غير المشتركين من طلب أو تقديم المساعدة.' },

    { type: 'h2', text: '8. الاحتفاظ بالبيانات' },
    { type: 'p', text: 'نحتفظ بالمعلومات فقط للمدة اللازمة:' },
    { type: 'ul', items: ['لتشغيل الخدمة.', 'لحماية المستخدمين.', 'لمنع الاحتيال.', 'لحل النزاعات.', 'للالتزام بمتطلبات قانونية أو تنظيمية عند الحاجة.'] },
    { type: 'p', text: 'قد تختلف مدة الاحتفاظ حسب نوع البيانات.' },
    { type: 'p', text: 'لا ينبغي الاحتفاظ بالموقع المباشر أو البيانات الحساسة لفترة أطول من الحاجة الفعلية إليها.' },

    { type: 'h2', text: '9. حماية المعلومات' },
    { type: 'p', text: 'يستخدم أخوو إجراءات تقنية وتنظيمية تهدف إلى حماية بيانات المستخدمين، مثل:' },
    { type: 'ul', items: ['التحكم في صلاحيات الوصول.', 'حماية الجلسات.', 'تقييد الوصول إلى المعلومات الخاصة.', 'حماية قواعد البيانات والتخزين.', 'مراقبة العمليات الحساسة.', 'منع التلاعب وسوء الاستخدام.'] },
    { type: 'p', text: 'ومع ذلك، لا يمكن ضمان أمان أي نظام إلكتروني بشكل مطلق.' },

    { type: 'h2', text: '10. حذف الحساب' },
    { type: 'p', text: 'يمكن للمستخدم طلب حذف حسابه من داخل التطبيق عندما تكون هذه الميزة متاحة.' },
    { type: 'p', text: 'عند حذف الحساب، نسعى إلى حذف أو فصل البيانات الشخصية المرتبطة بالمستخدم، باستثناء البيانات التي قد يكون من الضروري الاحتفاظ بها لفترة محدودة لأسباب أمنية أو قانونية أو لمنع الاحتيال.' },

    { type: 'h2', text: '11. حقوق المستخدم' },
    { type: 'p', text: 'يمكن للمستخدم التواصل معنا بخصوص:' },
    { type: 'ul', items: ['المعلومات المرتبطة بحسابه.', 'تصحيح معلومات غير صحيحة.', 'حذف الحساب.', 'الاستفسار عن كيفية استخدام المعلومات.', 'أي مشكلة تتعلق بالخصوصية.'] },

    { type: 'h2', text: '12. المستخدمون دون سن 18' },
    { type: 'p', text: 'حسابات أخوو مخصصة حاليًا للمستخدمين الذين تبلغ أعمارهم 18 عامًا أو أكثر.' },
    { type: 'p', text: 'يمكن لشخص بالغ مسؤول طلب مساعدة لصالح شخص آخر عند الحاجة.' },

    { type: 'h2', text: '13. خدمات وأعمال خارجية' },
    { type: 'p', text: 'قد يحتوي التطبيق على معلومات أو روابط أو عروض مقدمة من كراجات أو محلات أو مقدمي خدمات مستقلين.' },
    { type: 'p', text: 'قد تكون لهذه الجهات سياسات خصوصية وشروط خاصة بها، ولا يعتبر أخوو مسؤولًا عن طريقة تعامل جهة مستقلة مع بيانات حصلت عليها مباشرة من المستخدم خارج التطبيق.' },

    { type: 'h2', text: '14. تحديث سياسة الخصوصية' },
    { type: 'p', text: 'قد نقوم بتحديث هذه السياسة عند تطوير أخوو أو إضافة ميزات جديدة.' },
    { type: 'p', text: 'سيتم نشر النسخة المحدثة داخل التطبيق، وقد يتم إشعار المستخدم بالتغييرات المهمة عندما يكون ذلك مناسبًا.' },

    { type: 'h2', text: '15. التواصل معنا' },
    { type: 'p', text: 'إذا كان لديك استفسار يتعلق بالخصوصية أو بيانات حسابك أو استخدام التطبيق، يمكنك التواصل معنا على:' }
  ],
  en: [
    { type: 'p', text: "At AKHOO, we respect our users' privacy and are committed to protecting the personal information collected or processed through the app." },
    { type: 'p', text: 'This policy explains the types of information we may collect, how we use it, when it may be shared, and what options are available to you to control your data.' },
    { type: 'p', text: 'By using the AKHOO app or creating an account, you acknowledge that you have read this privacy policy.' },

    { type: 'h2', text: '1. Information We May Collect' },
    { type: 'p', text: "AKHOO may collect the information needed to operate the app's services, depending on how you use it." },

    { type: 'h3', text: 'Account Information' },
    { type: 'p', text: 'May include:' },
    { type: 'ul', items: ['Your name.', 'Your phone number.', 'A profile photo, if you choose to add one.', 'An internal account identifier.', 'Information necessary for authentication and account security.'] },

    { type: 'h3', text: 'Location Information' },
    { type: 'p', text: "AKHOO may use your approximate or precise location when this information is necessary to operate one of the app's features, such as:" },
    { type: 'ul', items: ['Creating a help request.', 'Showing nearby help requests.', 'Connecting the person requesting help with the user who accepted the mission.', 'Tracking an active mission.', 'Showing car-related services and businesses near you.'] },
    { type: 'p', text: 'We aim not to expose your precise location to users who are not authorized to see it.' },

    { type: 'h3', text: 'Help Request Data' },
    { type: 'p', text: 'May include:' },
    { type: 'ul', items: ['The type of problem.', 'The request description.', 'The request location.', 'The time the request was created.', 'The status of the request or mission.', 'The time of arrival, completion, or cancellation.', 'Photos you choose to upload.', 'Information related to the users involved in the mission.'] },

    { type: 'h3', text: 'Points and Rewards' },
    { type: 'p', text: 'We may retain information related to the points system, such as:' },
    { type: 'ul', items: ['Your points balance.', 'How points were earned.', 'Transaction history.', 'Rewards or offers that have been redeemed.', 'Points that were deducted or cancelled.'] },

    { type: 'h3', text: 'AKHOO+ Membership' },
    { type: 'p', text: 'If AKHOO+ membership is used, we may process data such as:' },
    { type: 'ul', items: ['Subscription status.', 'Plan type.', 'Subscription start date.', 'Renewal or expiration date.', 'Transaction identifiers needed to verify the subscription.'] },
    { type: 'p', text: "AKHOO does not store your full card number or card security code in the app's database." },

    { type: 'h3', text: 'Technical Information' },
    { type: 'p', text: 'We may collect technical information necessary to improve security and stability, such as:' },
    { type: 'ul', items: ['Device type.', 'Operating system.', 'App version.', 'Notification identifier.', 'Crash and error data.', 'Security information that helps prevent fraud or misuse.'] },

    { type: 'h2', text: '2. How We Use Information' },
    { type: 'p', text: 'We may use the information we collect to:' },
    { type: 'ul', items: ['Create and manage your account.', 'Operate and provide the help-request service.', 'Identify nearby requests or services.', 'Carry out and track missions.', 'Send notifications related to your account or mission.', 'Manage points and rewards.', 'Show weekly offers.', 'Operate AKHOO+ features.', 'Show car-related businesses and services.', 'Prevent fraud and misuse.', 'Protect users.', 'Improve app performance.', 'Provide support and assistance to users.'] },

    { type: 'h2', text: '3. Sharing Information' },
    { type: 'p', text: "AKHOO does not sell users' personal information." },
    { type: 'p', text: 'Limited information may be shared when necessary to operate the service.' },
    { type: 'p', text: "For example, after a help mission is accepted, both parties to the mission may receive the information necessary to carry out the help, such as the name or the location needed to reach the mission's location." },
    { type: 'p', text: 'AKHOO may use external service providers to operate some parts of the app, such as:' },
    { type: 'ul', items: ['Databases and hosting.', 'Maps and location services.', 'Notifications.', 'Authentication services.', 'Subscription processing.', 'Crash and security monitoring.'] },
    { type: 'p', text: 'These services are used only to the extent necessary to operate the app.' },

    { type: 'h2', text: '4. Use of Geographic Location' },
    { type: 'p', text: "Location may be necessary for some of AKHOO's functions." },
    { type: 'p', text: 'Before a mission is accepted, only an approximate location may be shown.' },
    { type: 'p', text: 'After the mission is accepted, a more precise location may be provided to the users involved in the mission when necessary to reach the location and provide help.' },
    { type: 'p', text: "Once the mission ends or the operational need ends, continued use of live location for the mission's purposes should not be assumed." },
    { type: 'p', text: "You can change location permissions from your phone's settings, but disabling them may cause some AKHOO features to stop working." },

    { type: 'h2', text: '5. Photos and Files' },
    { type: 'p', text: 'The app may allow you to upload photos related to a help request.' },
    { type: 'p', text: 'We recommend not uploading:' },
    { type: 'ul', items: ['Photos containing unnecessary personal information.', 'Sensitive documents.', 'Photos of other people without necessity or appropriate permission.'] },
    { type: 'p', text: 'We aim to restrict access to request photos to authorized persons only.' },

    { type: 'h2', text: '6. The Points System' },
    { type: 'p', text: 'Points within AKHOO are part of an internal rewards program.' },
    { type: 'p', text: 'Points:' },
    { type: 'ul', items: ['Are not money.', 'Are not a digital currency.', 'Have no fixed cash value.', 'Cannot be withdrawn as cash.'] },
    { type: 'p', text: "You may earn points for approved activities, such as completing a genuine help mission according to the app's rules." },
    { type: 'p', text: 'Points may be used to redeem offers or rewards determined by AKHOO from time to time.' },

    { type: 'h2', text: '7. AKHOO+' },
    { type: 'p', text: 'The app may offer an optional paid membership called AKHOO+.' },
    { type: 'p', text: 'The membership may grant additional benefits, such as exclusive offers or discounts.' },
    { type: 'p', text: 'Subscribing to AKHOO+ does not give you priority in receiving basic help, and does not prevent non-subscribers from requesting or providing help.' },

    { type: 'h2', text: '8. Data Retention' },
    { type: 'p', text: 'We retain information only for as long as necessary:' },
    { type: 'ul', items: ['To operate the service.', 'To protect users.', 'To prevent fraud.', 'To resolve disputes.', 'To comply with legal or regulatory requirements when needed.'] },
    { type: 'p', text: 'The retention period may vary depending on the type of data.' },
    { type: 'p', text: 'Live location or sensitive data should not be retained longer than actually needed.' },

    { type: 'h2', text: '9. Protecting Information' },
    { type: 'p', text: "AKHOO uses technical and organizational measures aimed at protecting users' data, such as:" },
    { type: 'ul', items: ['Controlling access permissions.', 'Protecting sessions.', 'Restricting access to private information.', 'Protecting databases and storage.', 'Monitoring sensitive operations.', 'Preventing tampering and misuse.'] },
    { type: 'p', text: 'However, the absolute security of any electronic system cannot be guaranteed.' },

    { type: 'h2', text: '10. Account Deletion' },
    { type: 'p', text: 'You can request to delete your account from within the app when this feature is available.' },
    { type: 'p', text: 'When an account is deleted, we aim to delete or disassociate the personal data linked to the user, except for data that may need to be retained for a limited period for security, legal, or fraud-prevention reasons.' },

    { type: 'h2', text: '11. User Rights' },
    { type: 'p', text: 'You can contact us regarding:' },
    { type: 'ul', items: ['The information linked to your account.', 'Correcting inaccurate information.', 'Deleting your account.', 'Asking how information is used.', 'Any issue related to privacy.'] },

    { type: 'h2', text: '12. Users Under 18' },
    { type: 'p', text: 'AKHOO accounts are currently intended for users aged 18 or older.' },
    { type: 'p', text: 'A responsible adult may request help on behalf of someone else when needed.' },

    { type: 'h2', text: '13. External Services and Businesses' },
    { type: 'p', text: 'The app may contain information, links, or offers provided by independent garages, shops, or service providers.' },
    { type: 'p', text: "These parties may have their own privacy policies and terms, and AKHOO is not responsible for how an independent party handles data it obtained directly from you outside the app." },

    { type: 'h2', text: '14. Updating the Privacy Policy' },
    { type: 'p', text: 'We may update this policy as AKHOO evolves or new features are added.' },
    { type: 'p', text: 'The updated version will be published within the app, and you may be notified of important changes when appropriate.' },

    { type: 'h2', text: '15. Contact Us' },
    { type: 'p', text: 'If you have a question about privacy, your account data, or using the app, you can contact us at:' }
  ],
  he: [
    { type: 'p', text: 'באחוו (AKHOO) אנו מכבדים את פרטיות המשתמשים שלנו ופועלים להגן על המידע האישי שנאסף או מעובד באמצעות האפליקציה.' },
    { type: 'p', text: 'מדיניות זו מסבירה אילו סוגי מידע אנו עשויים לאסוף, כיצד אנו משתמשים בו, מתי הוא עשוי להיות משותף, ואילו אפשרויות עומדות לרשות המשתמש לשליטה בנתוניו.' },
    { type: 'p', text: 'בשימוש באפליקציית אחוו או ביצירת חשבון בה, אתם מאשרים שקראתם את מדיניות פרטיות זו.' },

    { type: 'h2', text: '1. מידע שאנו עשויים לאסוף' },
    { type: 'p', text: 'אחוו עשויה לאסוף את המידע הדרוש להפעלת שירותי האפליקציה, בהתאם לאופן שבו אתם משתמשים בה.' },

    { type: 'h3', text: 'מידע על החשבון' },
    { type: 'p', text: 'עשוי לכלול:' },
    { type: 'ul', items: ['שם מלא.', 'מספר טלפון.', 'תמונת פרופיל, אם בחרתם להוסיף.', 'מזהה פנימי לחשבון.', 'מידע הנחוץ לאימות ולאבטחת החשבון.'] },

    { type: 'h3', text: 'מידע מיקום' },
    { type: 'p', text: 'אחוו עשויה להשתמש במיקומכם המשוער או המדויק כאשר מידע זה נחוץ להפעלת אחד מתפקודי האפליקציה, כגון:' },
    { type: 'ul', items: ['יצירת בקשת עזרה.', 'הצגת בקשות עזרה קרובות.', 'חיבור בין מבקש העזרה למשתמש שקיבל את המשימה.', 'מעקב אחר משימה פעילה.', 'הצגת עסקים ושירותי רכב הקרובים אליכם.'] },
    { type: 'p', text: 'אנו פועלים שלא לחשוף מיקום מדויק למשתמשים שאינם מורשים לצפות בו.' },

    { type: 'h3', text: 'נתוני בקשות עזרה' },
    { type: 'p', text: 'עשוי לכלול:' },
    { type: 'ul', items: ['סוג התקלה.', 'תיאור הבקשה.', 'מיקום הבקשה.', 'שעת יצירת הבקשה.', 'סטטוס הבקשה או המשימה.', 'שעת ההגעה, ההשלמה או הביטול.', 'תמונות שבחרתם להעלות.', 'מידע הקשור למשתמשים המעורבים במשימה.'] },

    { type: 'h3', text: 'נקודות ותגמולים' },
    { type: 'p', text: 'אנו עשויים לשמור מידע הקשור למערכת הנקודות, כגון:' },
    { type: 'ul', items: ['יתרת הנקודות.', 'אופן צבירת הנקודות.', 'היסטוריית פעולות.', 'תגמולים או מבצעים שמומשו.', 'נקודות שנוכו או בוטלו.'] },

    { type: 'h3', text: 'מנוי אחוו+' },
    { type: 'p', text: 'אם נעשה שימוש במנוי אחוו+, אנו עשויים לעבד נתונים כגון:' },
    { type: 'ul', items: ['סטטוס המנוי.', 'סוג התוכנית.', 'תאריך תחילת המנוי.', 'תאריך חידוש או תפוגה.', 'מזהי עסקאות הנחוצים לאימות המנוי.'] },
    { type: 'p', text: 'אחוו אינה שומרת את מספר כרטיס האשראי המלא או את קוד האבטחה של הכרטיס במסד הנתונים של האפליקציה.' },

    { type: 'h3', text: 'מידע טכני' },
    { type: 'p', text: 'אנו עשויים לאסוף מידע טכני הנחוץ לשיפור האבטחה והיציבות, כגון:' },
    { type: 'ul', items: ['סוג המכשיר.', 'מערכת ההפעלה.', 'גרסת האפליקציה.', 'מזהה התראות.', 'נתוני קריסות ושגיאות.', 'מידע אבטחה המסייע במניעת הונאה או שימוש לרעה.'] },

    { type: 'h2', text: '2. כיצד אנו משתמשים במידע' },
    { type: 'p', text: 'אנו עשויים להשתמש במידע שאנו אוספים כדי:' },
    { type: 'ul', items: ['ליצור ולנהל את החשבון.', 'להפעיל ולספק את שירות בקשת העזרה.', 'לזהות בקשות או שירותים קרובים.', 'לבצע ולעקוב אחר משימות.', 'לשלוח התראות הקשורות לחשבון או למשימה.', 'לנהל נקודות ותגמולים.', 'להציג מבצעים שבועיים.', 'להפעיל את תכונות אחוו+.', 'להציג עסקים ושירותים הקשורים לרכב.', 'למנוע הונאה ושימוש לרעה.', 'להגן על המשתמשים.', 'לשפר את ביצועי האפליקציה.', 'לספק תמיכה וסיוע למשתמשים.'] },

    { type: 'h2', text: '3. שיתוף מידע' },
    { type: 'p', text: 'אחוו אינה מוכרת את המידע האישי של המשתמשים.' },
    { type: 'p', text: 'מידע מוגבל עשוי להיות משותף כאשר הדבר נחוץ להפעלת השירות.' },
    { type: 'p', text: 'לדוגמה, לאחר קבלת משימת עזרה, שני הצדדים למשימה עשויים לקבל את המידע הדרוש לביצוע העזרה, כגון השם או המיקום הנדרש להגעה למקום המשימה.' },
    { type: 'p', text: 'אחוו עשויה להשתמש בספקי שירות חיצוניים להפעלת חלקים מסוימים באפליקציה, כגון:' },
    { type: 'ul', items: ['מסדי נתונים ואחסון.', 'מפות ושירותי מיקום.', 'התראות.', 'שירותי אימות.', 'עיבוד מנויים.', 'ניטור קריסות ואבטחה.'] },
    { type: 'p', text: 'שירותים אלה משמשים רק במידה הנחוצה להפעלת האפליקציה.' },

    { type: 'h2', text: '4. שימוש במיקום גאוגרפי' },
    { type: 'p', text: 'מיקום עשוי להיות נחוץ לחלק מהתפקודים של אחוו.' },
    { type: 'p', text: 'לפני קבלת המשימה, ייתכן שיוצג מיקום משוער בלבד.' },
    { type: 'p', text: 'לאחר קבלת המשימה, ייתכן שיסופק מיקום מדויק יותר למשתמשים המעורבים במשימה כאשר הדבר נחוץ להגעה ולמתן העזרה.' },
    { type: 'p', text: 'עם סיום המשימה או תום הצורך התפעולי, אין להניח שהשימוש במיקום החי לצורכי המשימה נמשך.' },
    { type: 'p', text: 'ניתן לשנות את הרשאות המיקום מהגדרות הטלפון, אך השבתתן עלולה לגרום להפסקת פעולתם של חלק מתפקודי אחוו.' },

    { type: 'h2', text: '5. תמונות וקבצים' },
    { type: 'p', text: 'האפליקציה עשויה לאפשר למשתמש להעלות תמונות הקשורות לבקשת עזרה.' },
    { type: 'p', text: 'אנו ממליצים שלא להעלות:' },
    { type: 'ul', items: ['תמונות המכילות מידע אישי שאינו נחוץ.', 'מסמכים רגישים.', 'תמונות של אנשים אחרים ללא צורך או אישור מתאים.'] },
    { type: 'p', text: 'אנו פועלים להגביל את הגישה לתמונות הבקשות לאנשים המורשים בלבד.' },

    { type: 'h2', text: '6. מערכת הנקודות' },
    { type: 'p', text: 'הנקודות באחוו הן חלק מתוכנית תגמולים פנימית.' },
    { type: 'p', text: 'הנקודות:' },
    { type: 'ul', items: ['אינן כסף.', 'אינן מטבע דיגיטלי.', 'אין להן ערך כספי קבוע.', 'לא ניתן למשוך אותן כמזומן.'] },
    { type: 'p', text: 'המשתמש עשוי לקבל נקודות עבור פעילויות מאושרות, כגון השלמת עזרה אמיתית בהתאם לכללי האפליקציה.' },
    { type: 'p', text: 'ניתן להשתמש בנקודות למימוש מבצעים או תגמולים שאחוו קובעת מעת לעת.' },

    { type: 'h2', text: '7. אחוו+' },
    { type: 'p', text: 'האפליקציה עשויה להציע מנוי בתשלום, אופציונלי, בשם אחוו+.' },
    { type: 'p', text: 'המנוי עשוי להעניק הטבות נוספות, כגון מבצעים או הנחות בלעדיות.' },
    { type: 'p', text: 'הרשמה למנוי אחוו+ אינה מעניקה למשתמש עדיפות בקבלת עזרה בסיסית ואינה מונעת ממי שאינו מנוי לבקש או לספק עזרה.' },

    { type: 'h2', text: '8. שמירת נתונים' },
    { type: 'p', text: 'אנו שומרים את המידע רק למשך הזמן הנחוץ:' },
    { type: 'ul', items: ['להפעלת השירות.', 'להגנה על המשתמשים.', 'למניעת הונאה.', 'לפתרון מחלוקות.', 'לעמידה בדרישות חוקיות או רגולטוריות בעת הצורך.'] },
    { type: 'p', text: 'משך השמירה עשוי להשתנות בהתאם לסוג הנתונים.' },
    { type: 'p', text: 'אין לשמור מיקום חי או נתונים רגישים לפרק זמן ארוך מהצורך בפועל.' },

    { type: 'h2', text: '9. הגנה על המידע' },
    { type: 'p', text: 'אחוו נוקטת באמצעים טכניים וארגוניים שמטרתם להגן על נתוני המשתמשים, כגון:' },
    { type: 'ul', items: ['בקרת הרשאות גישה.', 'הגנה על הפעלות (sessions).', 'הגבלת הגישה למידע פרטי.', 'הגנה על מסדי נתונים ואחסון.', 'ניטור פעולות רגישות.', 'מניעת מניפולציה ושימוש לרעה.'] },
    { type: 'p', text: 'עם זאת, לא ניתן להבטיח את אבטחתה המוחלטת של כל מערכת אלקטרונית.' },

    { type: 'h2', text: '10. מחיקת חשבון' },
    { type: 'p', text: 'המשתמש יכול לבקש למחוק את חשבונו מתוך האפליקציה כאשר תכונה זו זמינה.' },
    { type: 'p', text: 'עם מחיקת החשבון, אנו פועלים למחוק או לנתק את המידע האישי המשויך למשתמש, למעט נתונים שייתכן שיהיה צורך לשמור לפרק זמן מוגבל מטעמי אבטחה, משפט או מניעת הונאה.' },

    { type: 'h2', text: '11. זכויות המשתמש' },
    { type: 'p', text: 'המשתמש יכול לפנות אלינו בנוגע ל:' },
    { type: 'ul', items: ['המידע המשויך לחשבונו.', 'תיקון מידע שגוי.', 'מחיקת החשבון.', 'בירור אופן השימוש במידע.', 'כל בעיה הקשורה לפרטיות.'] },

    { type: 'h2', text: '12. משתמשים מתחת לגיל 18' },
    { type: 'p', text: 'חשבונות אחוו מיועדים כיום למשתמשים בני 18 ומעלה.' },
    { type: 'p', text: 'מבוגר אחראי יכול לבקש עזרה עבור אדם אחר בעת הצורך.' },

    { type: 'h2', text: '13. שירותים ועסקים חיצוניים' },
    { type: 'p', text: 'האפליקציה עשויה לכלול מידע, קישורים או מבצעים המוצעים על ידי מוסכים, חנויות או נותני שירות עצמאיים.' },
    { type: 'p', text: 'לגורמים אלה עשויות להיות מדיניות פרטיות ותנאים משלהם, ואחוו אינה אחראית לאופן שבו גורם עצמאי מטפל בנתונים שקיבל ישירות מהמשתמש מחוץ לאפליקציה.' },

    { type: 'h2', text: '14. עדכון מדיניות הפרטיות' },
    { type: 'p', text: 'אנו עשויים לעדכן מדיניות זו ככל שאחוו מתפתחת או שמתווספות תכונות חדשות.' },
    { type: 'p', text: 'הגרסה המעודכנת תפורסם בתוך האפליקציה, וייתכן שהמשתמש יקבל הודעה על שינויים משמעותיים כאשר הדבר מתאים.' },

    { type: 'h2', text: '15. יצירת קשר' },
    { type: 'p', text: 'אם יש לך שאלה בנוגע לפרטיות, לנתוני החשבון שלך או לשימוש באפליקציה, ניתן ליצור איתנו קשר באמצעות:' }
  ]
}

export const termsOfUseBlocks: Record<AppLanguage, LegalBlock[]> = {
  ar: [
    { type: 'p', text: 'مرحبًا بك في أخوو (AKHOO).' },
    { type: 'p', text: 'تنظم شروط الاستخدام هذه استخدامك لتطبيق أخوو وخدماته.' },
    { type: 'p', text: 'باستخدام التطبيق أو إنشاء حساب، فإنك توافق على الالتزام بهذه الشروط.' },

    { type: 'h2', text: '1. طبيعة خدمة أخوو' },
    { type: 'p', text: 'أخوو منصة تقنية ومجتمعية تهدف إلى تسهيل:' },
    { type: 'ul', items: ['طلب المساعدة على الطريق.', 'تقديم المساعدة للمستخدمين الآخرين.', 'متابعة المهمات.', 'جمع واستخدام النقاط.', 'اكتشاف خدمات وأعمال متعلقة بالسيارات.', 'استخدام العروض والمكافآت.', 'الاستفادة من أخوو+ عند الاشتراك.'] },
    { type: 'p', text: 'أخوو ليس جهة طوارئ أو إسعاف أو شرطة أو إطفاء.' },

    { type: 'h2', text: '2. حالات الطوارئ' },
    { type: 'p', text: 'يجب عدم استخدام أخوو كبديل عن خدمات الطوارئ الرسمية.' },
    { type: 'p', text: 'إذا كان هناك خطر فوري على الحياة أو السلامة أو الممتلكات، يجب التواصل مع جهة الطوارئ المختصة.' },
    { type: 'p', text: 'ولا ينبغي لأي مستخدم تنفيذ مهمة إذا رأى أنها قد تعرضه أو تعرض الآخرين للخطر.' },

    { type: 'h2', text: '3. العمر والأهلية' },
    { type: 'p', text: 'يجب أن يكون عمر صاحب الحساب 18 عامًا أو أكثر.' },
    { type: 'p', text: 'عند إنشاء الحساب، يقر المستخدم بأنه مؤهل لاستخدام التطبيق وتقديم المعلومات المطلوبة.' },

    { type: 'h2', text: '4. الحساب' },
    { type: 'p', text: 'المستخدم مسؤول عن:' },
    { type: 'ul', items: ['تقديم معلومات صحيحة.', 'المحافظة على أمان الحساب.', 'حماية كلمة المرور أو رموز التحقق.', 'عدم مشاركة بيانات المصادقة مع الآخرين.', 'إبلاغ أخوو إذا اشتبه في استخدام غير مصرح به لحسابه.'] },
    { type: 'p', text: 'لا يجوز انتحال شخصية شخص آخر.' },

    { type: 'h2', text: '5. طلب المساعدة' },
    { type: 'p', text: 'يجب أن يكون طلب المساعدة:' },
    { type: 'ul', items: ['حقيقيًا.', 'مرتبطًا بحاجة فعلية.', 'قانونيًا.', 'ضمن نطاق الخدمات التي يسمح بها أخوو.'] },
    { type: 'p', text: 'يمنع إنشاء طلبات وهمية أو مضللة.' },

    { type: 'h2', text: '6. تقديم المساعدة' },
    { type: 'p', text: 'تقديم المساعدة من خلال أخوو يتم بشكل اختياري.' },
    { type: 'p', text: 'يجب على المستخدم الذي يختار تقديم المساعدة:' },
    { type: 'ul', items: ['التصرف بمسؤولية.', 'مراعاة السلامة.', 'عدم تنفيذ أعمال تتطلب ترخيصًا أو خبرة مهنية إذا لم يكن مؤهلًا لذلك.', 'إلغاء أو ترك المهمة إذا كانت غير آمنة.'] },

    { type: 'h2', text: '7. العلاقة بين المستخدمين' },
    { type: 'p', text: 'أخوو يوفر منصة للربط بين المستخدمين.' },
    { type: 'p', text: 'استخدام شخص للتطبيق كمساعد لا يعني أنه موظف أو ممثل رسمي لأخوو.' },
    { type: 'p', text: 'ولا يضمن أخوو:' },
    { type: 'ul', items: ['وجود مساعد في كل وقت.', 'وصول المساعد خلال وقت معين.', 'نجاح كل مهمة.', 'مستوى محدد من الخبرة لدى المستخدم الآخر.'] },

    { type: 'h2', text: '8. النقاط' },
    { type: 'p', text: 'النقاط هي مكافآت رقمية داخلية.' },
    { type: 'p', text: 'النقاط:' },
    { type: 'ul', items: ['لا تعتبر أموالًا.', 'لا يمكن تحويلها إلى نقد.', 'لا يجوز بيعها.', 'تخضع لشروط نظام المكافآت.'] },
    { type: 'p', text: 'يحق لأخوو إلغاء النقاط التي تم الحصول عليها من خلال:' },
    { type: 'ul', items: ['مهام وهمية.', 'تلاعب بالنظام.', 'احتيال.', 'إساءة استخدام.', 'حسابات متعددة تستخدم لغرض الحصول على نقاط بطريقة غير مشروعة.'] },

    { type: 'h2', text: '9. عروض النقاط الأسبوعية' },
    { type: 'p', text: 'قد يوفر أخوو عددًا محدودًا من العروض التي يمكن للمستخدمين الاستفادة منها باستخدام النقاط دون الحاجة إلى الاشتراك في أخوو+.' },
    { type: 'p', text: 'قد تتغير هذه العروض بشكل أسبوعي أو دوري.' },
    { type: 'p', text: 'وقد يتغير:' },
    { type: 'ul', items: ['نوع العرض.', 'عدد النقاط المطلوبة.', 'مدة العرض.', 'عدد مرات الاستخدام.', 'عدد العروض المتاحة.'] },
    { type: 'p', text: 'لا يضمن توفر عرض معين بشكل دائم.' },

    { type: 'h2', text: '10. أخوو+' },
    { type: 'p', text: 'أخوو+ عضوية اختيارية مدفوعة قد توفر:' },
    { type: 'ul', items: ['عروضًا إضافية.', 'خصومات خاصة.', 'مزايا حصرية.', 'إمكانية الوصول إلى مجموعة أوسع من عروض شركاء أخوو.'] },
    { type: 'p', text: 'أخوو+ لا يعطي المشترك أولوية في المساعدة الأساسية ولا يؤثر على قدرة غير المشترك على طلب أو تقديم المساعدة.' },

    { type: 'h2', text: '11. الاشتراكات والمدفوعات' },
    { type: 'p', text: 'قد تتم معالجة اشتراكات أخوو+ من خلال متجر التطبيقات أو أي وسيلة دفع معتمدة يتم توفيرها.' },
    { type: 'p', text: 'قد تخضع عمليات:' },
    { type: 'ul', items: ['الدفع.', 'التجديد.', 'الإلغاء.', 'الاسترداد.'] },
    { type: 'p', text: 'لشروط الجهة التي تمت عملية الدفع من خلالها.' },

    { type: 'h2', text: '12. الأعمال والشركاء' },
    { type: 'p', text: 'قد يعرض أخوو خدمات أو عروضًا من جهات مستقلة مثل:' },
    { type: 'ul', items: ['كراجات.', 'محلات إطارات.', 'بطاريات.', 'خدمات غسيل وتنظيف السيارات.', 'خدمات صيانة.', 'قطع ومستلزمات سيارات.'] },
    { type: 'p', text: 'كل جهة مسؤولة عن:' },
    { type: 'ul', items: ['خدماتها.', 'الأسعار.', 'جودة العمل.', 'الضمان.', 'الالتزامات الخاصة بها.'] },
    { type: 'p', text: 'لا يعني ظهور جهة داخل أخوو أن أخوو هو مقدم الخدمة الفعلية ما لم يذكر خلاف ذلك بوضوح.' },

    { type: 'h2', text: '13. العروض والخصومات' },
    { type: 'p', text: 'قد تكون العروض:' },
    { type: 'ul', items: ['محدودة المدة.', 'محدودة الكمية.', 'متوفرة في مواقع معينة فقط.', 'مرتبطة بعدد معين من النقاط.', 'حصرية لمشتركي أخوو+.'] },
    { type: 'p', text: 'يتحمل المستخدم مسؤولية مراجعة شروط العرض قبل استخدامه.' },

    { type: 'h2', text: '14. الإلغاء والانسحاب من المهمة' },
    { type: 'p', text: 'يجوز لطالب المساعدة أو المساعد إلغاء المهمة بحسب حالتها وقواعد التطبيق.' },
    { type: 'p', text: 'قد يطلب التطبيق سبب الإلغاء أو ترك المهمة لأغراض:' },
    { type: 'ul', items: ['السلامة.', 'الجودة.', 'منع إساءة الاستخدام.', 'تحسين الخدمة.'] },

    { type: 'h2', text: '15. المحتوى الذي يرفعه المستخدم' },
    { type: 'p', text: 'يتحمل المستخدم مسؤولية المعلومات أو الصور التي يرفعها.' },
    { type: 'p', text: 'يمنع رفع محتوى:' },
    { type: 'ul', items: ['غير قانوني.', 'مسيء.', 'مضلل.', 'غير متعلق بطلب المساعدة.', 'ينتهك خصوصية الآخرين.'] },

    { type: 'h2', text: '16. الاستخدام المحظور' },
    { type: 'p', text: 'يمنع استخدام أخوو من أجل:' },
    { type: 'ul', items: ['الاحتيال.', 'التهديد.', 'المضايقة.', 'التلاعب بنظام النقاط.', 'إنشاء مهام وهمية.', 'اختراق التطبيق.', 'محاولة تجاوز أنظمة الأمان.', 'جمع بيانات مستخدمين دون إذن.', 'أي نشاط غير قانوني.'] },

    { type: 'h2', text: '17. تعليق أو إغلاق الحساب' },
    { type: 'p', text: 'يحق لأخوو اتخاذ إجراءات مناسبة إذا تبين أن المستخدم:' },
    { type: 'ul', items: ['انتهك هذه الشروط.', 'ارتكب احتيالًا.', 'أساء استخدام التطبيق.', 'هدد سلامة مستخدم آخر.', 'حاول التلاعب بالنقاط أو النظام.'] },
    { type: 'p', text: 'وقد تشمل الإجراءات:' },
    { type: 'ul', items: ['التحذير.', 'تقييد بعض الميزات.', 'تعليق الحساب.', 'إغلاق الحساب.'] },

    { type: 'h2', text: '18. حذف الحساب' },
    { type: 'p', text: 'يمكن للمستخدم طلب حذف حسابه من إعدادات التطبيق.' },
    { type: 'p', text: 'إذا كان لدى المستخدم اشتراك مدفوع يتم إدارته من متجر خارجي، فقد يحتاج إلى إلغاء الاشتراك من خلال المتجر بشكل منفصل.' },

    { type: 'h2', text: '19. توفر الخدمة' },
    { type: 'p', text: 'نعمل على توفير أخوو بأفضل صورة ممكنة، لكن لا نضمن أن:' },
    { type: 'ul', items: ['الخدمة ستعمل دون انقطاع.', 'الموقع سيكون دقيقًا دائمًا.', 'المساعد سيكون متاحًا دائمًا.', 'العروض ستكون متوفرة بشكل مستمر.', 'التطبيق سيكون خاليًا تمامًا من الأعطال.'] },

    { type: 'h2', text: '20. الملكية الفكرية' },
    { type: 'p', text: 'اسم أخوو / AKHOO والشعار والواجهة والتصميمات والبرمجيات والمحتوى المملوك لأخوو لا يجوز نسخه أو استخدامه أو إعادة توزيعه دون إذن مناسب.' },

    { type: 'h2', text: '21. تحديث شروط الاستخدام' },
    { type: 'p', text: 'يجوز تعديل شروط الاستخدام عند تطوير الخدمة أو إضافة ميزات جديدة.' },
    { type: 'p', text: 'سيتم نشر النسخة المحدثة داخل التطبيق، وقد يتم إشعار المستخدم بالتغييرات الجوهرية.' },

    { type: 'h2', text: '22. التواصل معنا' },
    { type: 'p', text: 'لأي استفسار أو مشكلة تتعلق باستخدام أخوو، يمكنك التواصل معنا على:' }
  ],
  en: [
    { type: 'p', text: 'Welcome to AKHOO.' },
    { type: 'p', text: 'These Terms of Use govern your use of the AKHOO app and its services.' },
    { type: 'p', text: 'By using the app or creating an account, you agree to be bound by these terms.' },

    { type: 'h2', text: "1. The Nature of AKHOO's Service" },
    { type: 'p', text: 'AKHOO is a technology and community platform aimed at facilitating:' },
    { type: 'ul', items: ['Requesting roadside help.', 'Providing help to other users.', 'Tracking missions.', 'Earning and using points.', 'Discovering car-related services and businesses.', 'Using offers and rewards.', 'Benefiting from AKHOO+ when subscribed.'] },
    { type: 'p', text: 'AKHOO is not an emergency, ambulance, police, or fire service.' },

    { type: 'h2', text: '2. Emergencies' },
    { type: 'p', text: 'AKHOO must not be used as a substitute for official emergency services.' },
    { type: 'p', text: 'If there is an immediate danger to life, safety, or property, you must contact the appropriate emergency service.' },
    { type: 'p', text: 'No user should carry out a mission if they believe it may put themselves or others at risk.' },

    { type: 'h2', text: '3. Age and Eligibility' },
    { type: 'p', text: 'The account holder must be 18 years of age or older.' },
    { type: 'p', text: 'When creating an account, you confirm that you are eligible to use the app and to provide the required information.' },

    { type: 'h2', text: '4. Your Account' },
    { type: 'p', text: 'You are responsible for:' },
    { type: 'ul', items: ['Providing accurate information.', 'Keeping your account secure.', 'Protecting your password or verification codes.', 'Not sharing authentication details with others.', 'Notifying AKHOO if you suspect unauthorized use of your account.'] },
    { type: 'p', text: 'Impersonating another person is not permitted.' },

    { type: 'h2', text: '5. Requesting Help' },
    { type: 'p', text: 'A help request must be:' },
    { type: 'ul', items: ['Genuine.', 'Related to an actual need.', 'Lawful.', 'Within the scope of services AKHOO allows.'] },
    { type: 'p', text: 'Creating fake or misleading requests is prohibited.' },

    { type: 'h2', text: '6. Providing Help' },
    { type: 'p', text: 'Providing help through AKHOO is voluntary.' },
    { type: 'p', text: 'A user who chooses to provide help must:' },
    { type: 'ul', items: ['Act responsibly.', 'Observe safety.', 'Not perform work that requires a license or professional expertise if not qualified to do so.', 'Cancel or leave the mission if it is unsafe.'] },

    { type: 'h2', text: '7. Relationship Between Users' },
    { type: 'p', text: 'AKHOO provides a platform to connect users.' },
    { type: 'p', text: "A person's use of the app as a helper does not mean they are an employee or official representative of AKHOO." },
    { type: 'p', text: 'AKHOO does not guarantee:' },
    { type: 'ul', items: ['That a helper will be available at all times.', 'That a helper will arrive within a certain time.', 'That every mission will succeed.', 'A specific level of expertise from the other user.'] },

    { type: 'h2', text: '8. Points' },
    { type: 'p', text: 'Points are internal digital rewards.' },
    { type: 'p', text: 'Points:' },
    { type: 'ul', items: ['Are not considered money.', 'Cannot be converted into cash.', 'May not be sold.', 'Are subject to the terms of the rewards system.'] },
    { type: 'p', text: 'AKHOO has the right to cancel points obtained through:' },
    { type: 'ul', items: ['Fake missions.', 'Manipulating the system.', 'Fraud.', 'Misuse.', 'Multiple accounts used to obtain points unlawfully.'] },

    { type: 'h2', text: '9. Weekly Points Offers' },
    { type: 'p', text: 'AKHOO may provide a limited number of offers that users can redeem using points, without needing to subscribe to AKHOO+.' },
    { type: 'p', text: 'These offers may change weekly or periodically.' },
    { type: 'p', text: 'The following may change:' },
    { type: 'ul', items: ['The type of offer.', 'The number of points required.', 'The duration of the offer.', 'The number of times it can be used.', 'The number of available offers.'] },
    { type: 'p', text: 'The permanent availability of a specific offer is not guaranteed.' },

    { type: 'h2', text: '10. AKHOO+' },
    { type: 'p', text: 'AKHOO+ is an optional paid membership that may provide:' },
    { type: 'ul', items: ['Additional offers.', 'Special discounts.', 'Exclusive benefits.', 'Access to a wider range of AKHOO partner offers.'] },
    { type: 'p', text: "AKHOO+ does not give a subscriber priority in basic help, and does not affect a non-subscriber's ability to request or provide help." },

    { type: 'h2', text: '11. Subscriptions and Payments' },
    { type: 'p', text: 'AKHOO+ subscriptions may be processed through the app store or any approved payment method provided.' },
    { type: 'p', text: 'The following may be subject to:' },
    { type: 'ul', items: ['Payment.', 'Renewal.', 'Cancellation.', 'Refunds.'] },
    { type: 'p', text: 'the terms of the platform through which the payment was made.' },

    { type: 'h2', text: '12. Businesses and Partners' },
    { type: 'p', text: 'AKHOO may display services or offers from independent parties such as:' },
    { type: 'ul', items: ['Garages.', 'Tire shops.', 'Batteries.', 'Car wash and cleaning services.', 'Maintenance services.', 'Car parts and supplies.'] },
    { type: 'p', text: 'Each party is responsible for:' },
    { type: 'ul', items: ['Its services.', 'Prices.', 'Quality of work.', 'Warranty.', 'Its own obligations.'] },
    { type: 'p', text: "A party's appearance within AKHOO does not mean that AKHOO is the actual service provider, unless clearly stated otherwise." },

    { type: 'h2', text: '13. Offers and Discounts' },
    { type: 'p', text: 'Offers may be:' },
    { type: 'ul', items: ['Limited in time.', 'Limited in quantity.', 'Available only in certain locations.', 'Tied to a specific number of points.', 'Exclusive to AKHOO+ subscribers.'] },
    { type: 'p', text: "You are responsible for reviewing an offer's terms before using it." },

    { type: 'h2', text: '14. Cancellation and Withdrawal from a Mission' },
    { type: 'p', text: 'Either the person requesting help or the helper may cancel a mission according to its status and the app\'s rules.' },
    { type: 'p', text: 'The app may ask for the reason for cancellation or leaving the mission for purposes of:' },
    { type: 'ul', items: ['Safety.', 'Quality.', 'Preventing misuse.', 'Improving the service.'] },

    { type: 'h2', text: '15. User-Uploaded Content' },
    { type: 'p', text: 'You are responsible for the information or photos you upload.' },
    { type: 'p', text: 'It is prohibited to upload content that is:' },
    { type: 'ul', items: ['Illegal.', 'Offensive.', 'Misleading.', 'Unrelated to the help request.', "In violation of others' privacy."] },

    { type: 'h2', text: '16. Prohibited Use' },
    { type: 'p', text: 'AKHOO may not be used for:' },
    { type: 'ul', items: ['Fraud.', 'Threats.', 'Harassment.', 'Manipulating the points system.', 'Creating fake missions.', 'Hacking the app.', 'Attempting to bypass security systems.', "Collecting users' data without permission.", 'Any unlawful activity.'] },

    { type: 'h2', text: '17. Account Suspension or Closure' },
    { type: 'p', text: 'AKHOO has the right to take appropriate action if it is found that a user has:' },
    { type: 'ul', items: ['Violated these terms.', 'Committed fraud.', 'Misused the app.', "Threatened another user's safety.", 'Attempted to manipulate points or the system.'] },
    { type: 'p', text: 'Actions may include:' },
    { type: 'ul', items: ['A warning.', 'Restricting certain features.', 'Suspending the account.', 'Closing the account.'] },

    { type: 'h2', text: '18. Account Deletion' },
    { type: 'p', text: "You can request to delete your account from the app's settings." },
    { type: 'p', text: 'If you have a paid subscription managed through an external store, you may need to cancel it through that store separately.' },

    { type: 'h2', text: '19. Service Availability' },
    { type: 'p', text: 'We work to provide AKHOO in the best possible way, but we do not guarantee that:' },
    { type: 'ul', items: ['The service will operate without interruption.', 'Location will always be accurate.', 'A helper will always be available.', 'Offers will be continuously available.', 'The app will be completely free of glitches.'] },

    { type: 'h2', text: '20. Intellectual Property' },
    { type: 'p', text: 'The name AKHOO / أخوو, the logo, the interface, the designs, the software, and the content owned by AKHOO may not be copied, used, or redistributed without appropriate permission.' },

    { type: 'h2', text: '21. Updating the Terms of Use' },
    { type: 'p', text: 'The Terms of Use may be amended as the service evolves or new features are added.' },
    { type: 'p', text: 'The updated version will be published within the app, and you may be notified of material changes.' },

    { type: 'h2', text: '22. Contact Us' },
    { type: 'p', text: 'For any question or issue related to using AKHOO, you can contact us at:' }
  ],
  he: [
    { type: 'p', text: 'ברוכים הבאים לאחוו (AKHOO).' },
    { type: 'p', text: 'תנאי שימוש אלה מסדירים את השימוש שלך באפליקציית אחוו ובשירותיה.' },
    { type: 'p', text: 'בשימוש באפליקציה או ביצירת חשבון, אתם מסכימים להיות מחויבים לתנאים אלה.' },

    { type: 'h2', text: '1. אופי השירות של אחוו' },
    { type: 'p', text: 'אחוו היא פלטפורמה טכנולוגית וקהילתית שמטרתה להקל על:' },
    { type: 'ul', items: ['בקשת עזרה בדרכים.', 'מתן עזרה למשתמשים אחרים.', 'מעקב אחר משימות.', 'צבירה ושימוש בנקודות.', 'גילוי עסקים ושירותים הקשורים לרכב.', 'שימוש במבצעים ובתגמולים.', 'הנאה מהטבות אחוו+ בעת מנוי.'] },
    { type: 'p', text: 'אחוו אינה גוף חירום, אמבולנס, משטרה או כיבוי אש.' },

    { type: 'h2', text: '2. מצבי חירום' },
    { type: 'p', text: 'אין להשתמש באחוו כתחליף לשירותי חירום רשמיים.' },
    { type: 'p', text: 'אם קיימת סכנה מיידית לחיים, לבטיחות או לרכוש, יש לפנות לגורם החירום המוסמך.' },
    { type: 'p', text: 'אין למשתמש לבצע משימה אם הוא סבור שהיא עלולה לסכן אותו או אחרים.' },

    { type: 'h2', text: '3. גיל וכשירות' },
    { type: 'p', text: 'בעל החשבון חייב להיות בן 18 ומעלה.' },
    { type: 'p', text: 'בעת יצירת החשבון, המשתמש מצהיר כי הוא כשיר להשתמש באפליקציה ולמסור את המידע הנדרש.' },

    { type: 'h2', text: '4. החשבון' },
    { type: 'p', text: 'המשתמש אחראי על:' },
    { type: 'ul', items: ['מסירת מידע נכון.', 'שמירה על אבטחת החשבון.', 'הגנה על הסיסמה או קודי האימות.', 'אי-שיתוף פרטי האימות עם אחרים.', 'עדכון אחוו אם קיים חשד לשימוש בלתי מורשה בחשבון.'] },
    { type: 'p', text: 'אין להתחזות לאדם אחר.' },

    { type: 'h2', text: '5. בקשת עזרה' },
    { type: 'p', text: 'בקשת עזרה חייבת להיות:' },
    { type: 'ul', items: ['אמיתית.', 'קשורה לצורך ממשי.', 'חוקית.', 'בגבולות השירותים שאחוו מתירה.'] },
    { type: 'p', text: 'אסור ליצור בקשות מזויפות או מטעות.' },

    { type: 'h2', text: '6. מתן עזרה' },
    { type: 'p', text: 'מתן עזרה דרך אחוו נעשה על בסיס התנדבותי.' },
    { type: 'p', text: 'משתמש שבוחר לספק עזרה חייב:' },
    { type: 'ul', items: ['לפעול באחריות.', 'להקפיד על בטיחות.', 'לא לבצע עבודות המצריכות רישיון או מומחיות מקצועית אם אינו כשיר לכך.', 'לבטל או לעזוב את המשימה אם היא אינה בטוחה.'] },

    { type: 'h2', text: '7. היחסים בין המשתמשים' },
    { type: 'p', text: 'אחוו מספקת פלטפורמה לחיבור בין משתמשים.' },
    { type: 'p', text: 'השימוש של אדם באפליקציה כמסייע אינו אומר שהוא עובד או נציג רשמי של אחוו.' },
    { type: 'p', text: 'אחוו אינה מבטיחה:' },
    { type: 'ul', items: ['שיהיה מסייע זמין בכל עת.', 'שהמסייע יגיע בתוך זמן מסוים.', 'שכל משימה תצליח.', 'רמת מומחיות מסוימת אצל המשתמש האחר.'] },

    { type: 'h2', text: '8. נקודות' },
    { type: 'p', text: 'הנקודות הן תגמולים דיגיטליים פנימיים.' },
    { type: 'p', text: 'הנקודות:' },
    { type: 'ul', items: ['אינן נחשבות כסף.', 'לא ניתן להמיר אותן למזומן.', 'אסור למכור אותן.', 'כפופות לתנאי מערכת התגמולים.'] },
    { type: 'p', text: 'אחוו רשאית לבטל נקודות שהושגו באמצעות:' },
    { type: 'ul', items: ['משימות מזויפות.', 'מניפולציה של המערכת.', 'הונאה.', 'שימוש לרעה.', 'ריבוי חשבונות המשמשים להשגת נקודות באופן בלתי חוקי.'] },

    { type: 'h2', text: '9. מבצעי נקודות שבועיים' },
    { type: 'p', text: 'אחוו עשויה לספק מספר מוגבל של מבצעים שמשתמשים יכולים לממש באמצעות נקודות, ללא צורך במנוי לאחוו+.' },
    { type: 'p', text: 'מבצעים אלה עשויים להשתנות מדי שבוע או מעת לעת.' },
    { type: 'p', text: 'עשויים להשתנות:' },
    { type: 'ul', items: ['סוג המבצע.', 'מספר הנקודות הנדרש.', 'משך המבצע.', 'מספר הפעמים לשימוש.', 'מספר המבצעים הזמינים.'] },
    { type: 'p', text: 'אין ערובה לזמינות קבועה של מבצע מסוים.' },

    { type: 'h2', text: '10. אחוו+' },
    { type: 'p', text: 'אחוו+ הוא מנוי אופציונלי בתשלום שעשוי לספק:' },
    { type: 'ul', items: ['מבצעים נוספים.', 'הנחות מיוחדות.', 'הטבות בלעדיות.', 'גישה למגוון רחב יותר של מבצעי שותפי אחוו.'] },
    { type: 'p', text: 'אחוו+ אינו מעניק למנוי עדיפות בעזרה הבסיסית ואינו משפיע על יכולתו של מי שאינו מנוי לבקש או לספק עזרה.' },

    { type: 'h2', text: '11. מנויים ותשלומים' },
    { type: 'p', text: 'מנויי אחוו+ עשויים להיות מעובדים דרך חנות האפליקציות או כל אמצעי תשלום מאושר שיסופק.' },
    { type: 'p', text: 'הפעולות הבאות עשויות להיות כפופות ל:' },
    { type: 'ul', items: ['תשלום.', 'חידוש.', 'ביטול.', 'החזר כספי.'] },
    { type: 'p', text: 'תנאי הגורם שדרכו בוצע התשלום.' },

    { type: 'h2', text: '12. עסקים ושותפים' },
    { type: 'p', text: 'אחוו עשויה להציג שירותים או מבצעים מגורמים עצמאיים כגון:' },
    { type: 'ul', items: ['מוסכים.', 'חנויות צמיגים.', 'מצברים.', 'שירותי שטיפה וניקוי רכב.', 'שירותי תחזוקה.', 'חלקים ואביזרים לרכב.'] },
    { type: 'p', text: 'כל גורם אחראי על:' },
    { type: 'ul', items: ['השירותים שלו.', 'המחירים.', 'איכות העבודה.', 'האחריות.', 'ההתחייבויות שלו.'] },
    { type: 'p', text: 'הופעתו של גורם באחוו אינה אומרת שאחוו הוא נותן השירות בפועל, אלא אם צוין אחרת במפורש.' },

    { type: 'h2', text: '13. מבצעים והנחות' },
    { type: 'p', text: 'המבצעים עשויים להיות:' },
    { type: 'ul', items: ['מוגבלים בזמן.', 'מוגבלים בכמות.', 'זמינים במיקומים מסוימים בלבד.', 'קשורים למספר נקודות מסוים.', 'בלעדיים למנויי אחוו+.'] },
    { type: 'p', text: 'המשתמש אחראי לבדוק את תנאי המבצע לפני השימוש בו.' },

    { type: 'h2', text: '14. ביטול ופרישה ממשימה' },
    { type: 'p', text: 'מבקש העזרה או המסייע רשאים לבטל את המשימה בהתאם למצבה ולכללי האפליקציה.' },
    { type: 'p', text: 'האפליקציה עשויה לבקש את הסיבה לביטול או לעזיבת המשימה לצרכי:' },
    { type: 'ul', items: ['בטיחות.', 'איכות.', 'מניעת שימוש לרעה.', 'שיפור השירות.'] },

    { type: 'h2', text: '15. תוכן שמעלה המשתמש' },
    { type: 'p', text: 'המשתמש אחראי למידע או לתמונות שהוא מעלה.' },
    { type: 'p', text: 'אסור להעלות תוכן:' },
    { type: 'ul', items: ['בלתי חוקי.', 'פוגעני.', 'מטעה.', 'שאינו קשור לבקשת העזרה.', 'המפר את פרטיותם של אחרים.'] },

    { type: 'h2', text: '16. שימוש אסור' },
    { type: 'p', text: 'אסור להשתמש באחוו לצורך:' },
    { type: 'ul', items: ['הונאה.', 'איום.', 'הטרדה.', 'מניפולציה של מערכת הנקודות.', 'יצירת משימות מזויפות.', 'פריצה לאפליקציה.', 'ניסיון לעקוף מערכות אבטחה.', 'איסוף נתוני משתמשים ללא רשות.', 'כל פעילות בלתי חוקית.'] },

    { type: 'h2', text: '17. השעיה או סגירת חשבון' },
    { type: 'p', text: 'אחוו רשאית לנקוט בצעדים מתאימים אם יתברר שהמשתמש:' },
    { type: 'ul', items: ['הפר תנאים אלה.', 'ביצע הונאה.', 'עשה שימוש לרעה באפליקציה.', 'איים על בטיחותו של משתמש אחר.', 'ניסה לתמרן נקודות או את המערכת.'] },
    { type: 'p', text: 'הצעדים עשויים לכלול:' },
    { type: 'ul', items: ['אזהרה.', 'הגבלת תכונות מסוימות.', 'השעיית החשבון.', 'סגירת החשבון.'] },

    { type: 'h2', text: '18. מחיקת חשבון' },
    { type: 'p', text: 'המשתמש יכול לבקש למחוק את חשבונו מהגדרות האפליקציה.' },
    { type: 'p', text: 'אם למשתמש יש מנוי בתשלום המנוהל דרך חנות חיצונית, ייתכן שיהיה עליו לבטל את המנוי דרך החנות בנפרד.' },

    { type: 'h2', text: '19. זמינות השירות' },
    { type: 'p', text: 'אנו פועלים לספק את אחוו באופן הטוב ביותר האפשרי, אך איננו מבטיחים כי:' },
    { type: 'ul', items: ['השירות יפעל ללא הפרעה.', 'המיקום יהיה תמיד מדויק.', 'מסייע יהיה תמיד זמין.', 'המבצעים יהיו זמינים באופן רציף.', 'האפליקציה תהיה נקייה לחלוטין מתקלות.'] },

    { type: 'h2', text: '20. קניין רוחני' },
    { type: 'p', text: 'השם אחוו / AKHOO, הלוגו, הממשק, העיצובים, התוכנה והתוכן שבבעלות אחוו אסורים בהעתקה, בשימוש או בהפצה מחדש ללא אישור מתאים.' },

    { type: 'h2', text: '21. עדכון תנאי השימוש' },
    { type: 'p', text: 'ניתן לתקן את תנאי השימוש ככל שהשירות מתפתח או שמתווספות תכונות חדשות.' },
    { type: 'p', text: 'הגרסה המעודכנת תפורסם בתוך האפליקציה, וייתכן שהמשתמש יקבל הודעה על שינויים מהותיים.' },

    { type: 'h2', text: '22. יצירת קשר' },
    { type: 'p', text: 'לכל שאלה או בעיה הקשורה לשימוש באחוו, ניתן ליצור איתנו קשר באמצעות:' }
  ]
}
