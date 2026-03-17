import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const arMessages = {
  common: {
    brand: {
      homeAriaLabel: "الصفحة الرئيسية",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "اختيار اللغة",
      selectorMenuAriaLabel: "قائمة اختيار اللغة",
      currentLocaleTitle: "اللغة الحالية: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "لوحة تحكم المالك",
        checkingContext: "جارٍ التحقق من سياق الخدمة...",
        subtitle:
          "لا تُفتح لوحة التحكم إلا بعد اكتمال تسجيل المالك وإتمام مسار الاشتراك. تظهر أدناه الخدمة النشطة والخطة وحالة الوصول.",
      },
      summary: {
        activeServiceLabel: "الخدمة النشطة",
        ownerLabel: "المالك",
        paidUntilLabel: "مدفوع حتى",
        loadingStatus: "جارٍ التحقق من الحالة...",
        activeServiceFallback: "لم يتم العثور على خدمة نشطة",
        serviceGenericLabel: "الخدمة",
      },
      notes: {
        loading: "جارٍ التحقق من الحالة...",
        active:
          "ملاحظة: تعمل روابط لوحة التحكم ضمن سياق الخدمة المحددة. تم توحيد مسار إنشاء الإعلان وتعديله وحذفه داخل قسم إعلاناتي.",
        locked:
          "ملاحظة: لوحة التحكم مقفلة عمدًا في هذه المرحلة. استخدم زر الإجراء أعلاه للانتقال إلى الخطوة التالية.",
      },
      errors: {
        prefix: "خطأ",
        dashboardStateLoadFailed: "تعذر تحميل حالة لوحة التحكم.",
        completeOwnerProfileFirst: "أكمل ملف المالك أولاً.",
        phoneVerificationRequired: "يجب إكمال التحقق من الهاتف.",
        serviceSelectionRequired: "يجب إكمال اختيار الخدمة أولاً.",
        activeSubscriptionNotFound: "لم يتم العثور على اشتراك نشط.",
        serviceNotFoundOrInactive: "لم يتم العثور على الخدمة أو أنها غير نشطة.",
        serverErrorOccurred:
          "حدث خطأ في الخادم. يُرجى المحاولة مرة أخرى لاحقًا.",
        ownerIdentityRequired: "أكمل ملف المالك أولاً.",
      },
      cards: {
        properties: {
          title: "إعلاناتي",
          text: "اعرض جميع إعلاناتك، وأنشئ إعلانًا جديدًا، وعدّل الإعلانات النشطة، واحذفها.",
        },
        profile: {
          title: "بيانات الملف الشخصي",
          text: "أدر الاسم ورقم الهاتف وسائر بيانات الملف الشخصي.",
        },
        billing: {
          title: "الاشتراك والمدفوعات",
          text: "تحقق من الحالة وانتقل إلى مسار الدفع.",
        },
        bookings: {
          title: "طلبات الحجز",
          text: "وافق على الطلبات الواردة أو ارفضها.",
        },
        lockedChip: "مقفل",
        lockedDescriptions: {
          profile:
            "يبقى هذا القسم مقفلاً داخل لوحة التحكم. استخدم زر الإجراء أعلاه لفتح صفحة الملف الشخصي.",
          billing:
            "في هذه المرحلة، يتم فتح قسم الاشتراك عبر زر الإجراء. وتبقى بطاقة لوحة التحكم مقفلة.",
          properties:
            "يصبح إنشاء الإعلانات وتعديلها وحذفها متاحًا فقط بعد اكتمال تسجيل المالك والاشتراك.",
          default:
            "هذا القسم غير متاح حتى يكتمل تسجيل المالك والاشتراك.",
        },
      },
      states: {
        profileRequired: {
          badge: "لوحة التحكم مقفلة",
          title: "ملف المالك مطلوب",
          description:
            "لاستخدام الخدمات، يجب أولاً إدخال بيانات المالك. وحتى يكتمل الملف الشخصي، ستظل لوحة التحكم والفوترة والأقسام الأخرى مقفلة.",
          cta: "الانتقال إلى صفحة الملف الشخصي",
        },
        phoneVerificationRequired: {
          badge: "يلزم التحقق عبر OTP",
          title: "لم يتم التحقق من الهاتف",
          description:
            "تم إنشاء الملف الشخصي كمسودة، لكن لا يُعد المالك نشطًا حتى يتم التحقق من الهاتف عبر OTP. ستظل لوحة التحكم وبقية إمكانات المالك مقفلة.",
          cta: "انتقل إلى الملف الشخصي وأكمل التحقق",
        },
        serviceSelectionRequired: {
          badge: "اختيار الخدمة مطلوب",
          title: "أكمل خطوة الخدمات أولاً",
          description:
            "بعد اكتمال الملف الشخصي، يجب على المالك العودة أولاً إلى قسم الخدمات. ستظل لوحة التحكم مقفلة في هذه المرحلة.",
          cta: "الانتقال إلى الخدمات",
        },
        subscriptionRequired: {
          badge: "الاشتراك مطلوب",
          title: "لا يوجد اشتراك نشط",
          description:
            "تم اختيار خدمة، لكن لم يكتمل الدفع أو أن الاشتراك غير نشط. ستظل لوحة التحكم مقفلة، وستبقى عمليات المالك الأخرى محجوبة.",
          cta: "الانتقال إلى الاشتراك",
        },
        active: {
          badge: "نشط",
          title: "لوحة التحكم مفتوحة",
          description:
            "الاشتراك نشط. يمكن للمالك إنشاء الإعلانات، وإدارتها، ومعالجة طلبات الحجز، واستخدام النظام بالكامل.",
          cta: "عرض الخدمات",
        },
      },
      meta: {
        serviceCodeLabel: "رمز الخدمة",
        planLabel: "الخطة",
        accessLabel: "حالة الوصول",
        planStandardLabel: "قياسية",
        planPlusLabel: "بلس",
        accessActiveLabel: "مفتوح",
        accessLockedLabel: "مقفل",
      },
      services: {
        RENT_HOME: "تأجير المنازل",
        BARBER: "الحلاقة",
        CAR_RENTAL: "تأجير السيارات",
        HOTEL: "فندق",
        BEAUTY_SALON: "صالون تجميل",
        BABYSITTER: "جليسة أطفال",
        CLEANING: "خدمات التنظيف",
        TECHNICAL_SERVICES: "الخدمات التقنية",
      },
    },
    services: {
      hero: {
        pageTitle: "اختيار الخدمة",
        lockedDescription:
          "هذه الصفحة هي نقطة الدخول إلى مسار إعداد المالك. وحتى يكتمل الملف الشخصي والتحقق من الهاتف، يظل مسار الخدمة والفوترة ولوحة التحكم مقفلة.",
        activeDescription:
          "اختر الخطة أولاً، ثم اختر الخدمة التي تريد المتابعة بها. إذا لم يكن هناك اشتراك نشط، فالخطوة التالية هي الفوترة. لا تُفتح لوحة التحكم إلا بعد إتمام الفوترة بنجاح.",
        currentStateLabel: "الحالة الحالية",
      },
      summary: {
        previewMode: "الخدمات في وضع المعاينة",
        selectedPlanOnly: "خطة {planLabel}",
        selectedPlanWithStatus: "خطة {planLabel} • {statusLabel}",
        activePlanWithStatus:
          "الخطة النشطة: {activePlanLabel} • {statusLabel}",
        billingCompleted: "اكتملت الفوترة",
        billingPending: "الفوترة قيد الانتظار",
        planChangePending: "الفوترة مطلوبة لتغيير الخطة",
      },
      gate: {
        onboardingLabel: "الإعداد",
        profileRequired: {
          title: "ملف المالك مطلوب",
          message:
            "لاستخدام الخدمات، يجب أولاً إدخال بيانات المالك. وحتى يكتمل الملف الشخصي، ستظل الفوترة ولوحة التحكم مقفلتين.",
          cta: "الانتقال إلى صفحة الملف الشخصي",
        },
        phoneVerificationRequired: {
          title: "التحقق من الهاتف مطلوب",
          message:
            "تم حفظ الملف الشخصي، لكن يجب التحقق من الهاتف عبر OTP. وحتى يكتمل التحقق من الهاتف، سيبقى اختيار الخدمة في وضع المعاينة وستظل الفوترة / لوحة التحكم مقفلتين.",
          cta: "انتقل إلى الملف الشخصي وأكمل التحقق",
        },
      },
      plans: {
        stepLabel: "الخطوة 1",
        title: "اختر الخطة",
        activeDescription:
          "يصبح اختيار الخطة نشطًا فقط بعد اكتمال الملف الشخصي والتحقق من الهاتف.",
        lockedDescription:
          "بطاقات الخطة للمعاينة فقط حاليًا. لا يمكنك المتابعة حتى يكتمل الملف الشخصي والتحقق من الهاتف.",
        standard: {
          label: "قياسية",
          badge: "خطة شهرية",
          description: "خيار بسيط ومستقر لمسار المالك الأساسي.",
          helper: "تُعرض الإعلانات بالترتيب القياسي.",
        },
        plus: {
          label: "بلس",
          badge: "ظهور ذو أولوية",
          description: "ظهور أعلى ضمن الفئة والفلاتر نفسها.",
          helper: "تظهر إعلانات بلس قبل الإعلانات القياسية.",
        },
        selectedChip: "محدد",
        lockedNote: "اختيار الخطة مقفل حتى اكتمال الملف الشخصي",
      },
      serviceList: {
        stepLabel: "الخطوة 2",
        title: "اختر الخدمة",
        activeDescription:
          "بعد اختيار الخدمة، تكون الخطوة التالية هي الفوترة. أما الخدمات التي لديها اشتراك نشط، فيصبح الوصول المباشر إلى لوحة التحكم متاحًا فقط لتلك الخطة النشطة.",
        lockedDescription:
          "حتى يكتمل إعداد المالك، يظل اختيار الخدمة في وضع المعاينة وتبقى المتابعة محجوبة.",
        carouselAria: "التنقل بين الخدمات",
        previousServices: "الخدمات السابقة",
        nextServices: "الخدمات التالية",
        loadingServices:
          "تعذر تحميل الخدمات مؤقتًا. يُرجى المحاولة مرة أخرى لاحقًا.",
        requestTimeout: "انتهت مهلة الطلب. لم يستجب الخادم الخلفي.",
        noServices: "لم يتم العثور على أي خدمات.",
        profileCompletionInfo:
          "سيصبح اختيار الخدمة نشطًا هنا بعد اكتمال الملف الشخصي والتحقق من الهاتف.",
      },
      badges: {
        activeSubscription: "اشتراك نشط",
        continueWithPlus: "المتابعة مع بلس",
        continueWithStandard: "المتابعة مع القياسية",
        selected: "محدد",
        activePlanLabel: "الخطة النشطة",
        changePlanBadge: "تغيير الخطة",
      },
      meta: {
        planLabel: "الخطة",
        priceLabel: "السعر",
        priceInactive: "السعر غير نشط",
      },
      cards: {
        fallbackDescription:
          "مسار المالك لهذه الخدمة نشط ويمكنك الانتقال إلى المرحلة التالية.",
        lockedFooter:
          "لا يمكنك المتابعة بهذه الخدمة حتى يكتمل الملف الشخصي والتحقق من الهاتف",
        activeFooterFallback: "يتوفر اشتراك نشط",
        activeFooterWithDate: "نشط حتى • {paidUntil}",
        billingFooter: "بعد اختيار هذه الخدمة، ستكون الخطوة التالية هي الفوترة",
        planChangeFooter: "الفوترة مطلوبة للخطة المحددة",
        planChangeFooterWithActivePlan:
          "الخطة النشطة: {activePlanLabel} • الفوترة مطلوبة للخطة المحددة",
        titleFallback: "الخدمة",
      },
      selection: {
        flowLabel: "المسار المحدد",
        notSelected: "لم يتم اختيار خدمة",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst: "للمتابعة، اختر أولاً خدمة من الأعلى.",
        billingCompletedFlow:
          "يوجد اشتراك نشط ظاهر للخطة المحددة لهذه الخدمة. الفوترة مكتملة بالفعل، وستؤدي المتابعة إلى فتح لوحة التحكم.",
        billingPendingFlow:
          "تم اختيار الخدمة. الخطوة التالية هي الفوترة. لن تصبح لوحة التحكم نشطة حتى يكتمل الدفع بنجاح.",
        planChangeMessage:
          "لديك حاليًا اشتراك نشط في خطة {activePlanLabel}. إذا قمت بتحديث الاشتراك إلى خطة {targetPlanLabel}، فسيتم إلغاء الخطة النشطة السابقة وتفعيل خطة {targetPlanLabel} لمدة 30 يومًا التالية.",
        resetService: "إعادة تعيين الخدمة",
        chooseServiceButton: "اختر الخدمة",
        changePlanButton: "انتقل إلى الفوترة وحدّث الخطة",
        goToProfile: "الانتقال إلى صفحة الملف الشخصي",
        goToDashboard: "الانتقال إلى لوحة التحكم",
        goToBilling: "الانتقال إلى الفوترة",
        redirecting: "جارٍ إعادة التوجيه...",
      },
      status: {
        profileRequired: "الملف الشخصي مطلوب",
        phoneRequired: "التحقق من الهاتف قيد الانتظار",
        active: "نشط",
        billingRequired: "الفوترة مطلوبة",
        serviceSelection: "اختيار الخدمة",
        planChangeRequired: "تغيير الخطة مطلوب",
      },
      errors: {
        ownerNotFoundLoadError: "لم يتم العثور على ملف المالك.",
        servicesLoadErrorFallback: "تعذر تحميل الخدمات",
        servicesLoadErrorWithStatus: "تعذر تحميل الخدمات (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;