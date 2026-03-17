import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const urMessages = {
  common: {
    brand: {
      homeAriaLabel: "مرکزی صفحہ",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "زبان کا انتخاب",
      selectorMenuAriaLabel: "زبان کے انتخاب کا مینو",
      currentLocaleTitle: "موجودہ زبان: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "مالک ڈیش بورڈ",
        checkingContext: "سروس کا سیاق جانچا جا رہا ہے...",
        subtitle:
          "ڈیش بورڈ صرف اس وقت کھلتا ہے جب مالک کی آن بورڈنگ اور سبسکرپشن کا مرحلہ مکمل ہو جائے۔ فعال سروس، پلان اور رسائی کی حالت نیچے دکھائی گئی ہے۔",
      },
      summary: {
        activeServiceLabel: "فعال سروس",
        ownerLabel: "مالک",
        paidUntilLabel: "ادائیگی کی معیاد",
        loadingStatus: "حالت جانچی جا رہی ہے...",
        activeServiceFallback: "کوئی فعال سروس نہیں ملی",
        serviceGenericLabel: "سروس",
      },
      notes: {
        loading: "حالت جانچی جا رہی ہے...",
        active:
          "نوٹ: ڈیش بورڈ کے روابط منتخب کردہ سروس کے سیاق کے ساتھ کام کرتے ہیں۔ فہرست بنانے، ترمیم کرنے اور حذف کرنے کا بہاؤ میری فہرستیں حصے میں یکجا کیا گیا ہے۔",
        locked:
          "نوٹ: اس مرحلے پر ڈیش بورڈ دانستہ طور پر مقفل رکھا گیا ہے۔ اگلے مرحلے کے لیے اوپر موجود ایکشن بٹن استعمال کریں۔",
      },
      errors: {
        prefix: "خرابی",
        dashboardStateLoadFailed: "ڈیش بورڈ کی حالت لوڈ نہیں ہو سکی۔",
        completeOwnerProfileFirst: "پہلے مالک کا پروفائل مکمل کریں۔",
        phoneVerificationRequired: "فون کی توثیق مکمل کرنا ضروری ہے۔",
        serviceSelectionRequired: "پہلے سروس کا انتخاب مکمل کرنا ضروری ہے۔",
        activeSubscriptionNotFound: "کوئی فعال سبسکرپشن نہیں ملی۔",
        serviceNotFoundOrInactive:
          "سروس نہیں ملی یا یہ فعال نہیں ہے۔",
        serverErrorOccurred:
          "سرور میں خرابی پیش آئی۔ براہِ کرم کچھ دیر بعد دوبارہ کوشش کریں۔",
        ownerIdentityRequired: "پہلے مالک کا پروفائل مکمل کریں۔",
      },
      cards: {
        properties: {
          title: "میری فہرستیں",
          text: "اپنی تمام فہرستیں دیکھیں، نئی فہرست بنائیں، فعال فہرستوں میں ترمیم کریں اور انہیں حذف کریں۔",
        },
        profile: {
          title: "پروفائل کی تفصیلات",
          text: "اپنا نام، فون نمبر اور دیگر پروفائل تفصیلات منظم کریں۔",
        },
        billing: {
          title: "سبسکرپشن اور ادائیگیاں",
          text: "حالت دیکھیں اور ادائیگی کے مرحلے کی طرف جائیں۔",
        },
        bookings: {
          title: "بکنگ کی درخواستیں",
          text: "موصول ہونے والی درخواستوں کو منظور کریں یا مسترد کریں۔",
        },
        lockedChip: "مقفل",
        lockedDescriptions: {
          profile:
            "یہ حصہ ڈیش بورڈ کے اندر مقفل رہتا ہے۔ پروفائل صفحہ کھولنے کے لیے اوپر موجود ایکشن بٹن استعمال کریں۔",
          billing:
            "اس مرحلے پر سبسکرپشن کا حصہ ایکشن بٹن کے ذریعے کھلتا ہے۔ ڈیش بورڈ کارڈ مقفل رہتا ہے۔",
          properties:
            "فہرست بنانا، ترمیم کرنا اور حذف کرنا صرف اس وقت دستیاب ہوتا ہے جب مالک کی آن بورڈنگ اور سبسکرپشن مکمل ہو جائے۔",
          default:
            "یہ حصہ اس وقت تک دستیاب نہیں ہوتا جب تک مالک کی آن بورڈنگ اور سبسکرپشن مکمل نہ ہو جائے۔",
        },
      },
      states: {
        profileRequired: {
          badge: "ڈیش بورڈ مقفل ہے",
          title: "مالک کا پروفائل لازمی ہے",
          description:
            "سروسز استعمال کرنے کے لیے پہلے مالک کی معلومات درج کرنا ضروری ہے۔ جب تک پروفائل مکمل نہیں ہوتا، ڈیش بورڈ، بلنگ اور دیگر حصے مقفل رہیں گے۔",
          cta: "پروفائل صفحے پر جائیں",
        },
        phoneVerificationRequired: {
          badge: "OTP توثیق لازمی ہے",
          title: "فون کی توثیق نہیں ہوئی",
          description:
            "پروفائل بطور مسودہ بنایا گیا ہے، لیکن فون کی OTP کے ذریعے توثیق ہونے تک مالک کو فعال نہیں سمجھا جائے گا۔ ڈیش بورڈ اور مالک کی دیگر سہولتیں مقفل رہیں گی۔",
          cta: "پروفائل پر جائیں اور توثیق مکمل کریں",
        },
        serviceSelectionRequired: {
          badge: "سروس کا انتخاب لازمی ہے",
          title: "پہلے سروس کا مرحلہ مکمل کریں",
          description:
            "پروفائل مکمل ہونے کے بعد مالک کو پہلے سروسز کے حصے میں واپس جانا ہوگا۔ اس مرحلے پر ڈیش بورڈ مقفل رہتا ہے۔",
          cta: "سروسز پر جائیں",
        },
        subscriptionRequired: {
          badge: "سبسکرپشن لازمی ہے",
          title: "کوئی فعال سبسکرپشن نہیں",
          description:
            "ایک سروس منتخب کی گئی ہے، لیکن ادائیگی مکمل نہیں ہوئی یا سبسکرپشن فعال نہیں ہے۔ ڈیش بورڈ مقفل رہے گا اور مالک کے دیگر عمل بھی روکے جائیں گے۔",
          cta: "سبسکرپشن پر جائیں",
        },
        active: {
          badge: "فعال",
          title: "ڈیش بورڈ کھلا ہے",
          description:
            "سبسکرپشن فعال ہے۔ مالک فہرستیں بنا سکتا ہے، فہرستوں کا نظم کر سکتا ہے، بکنگ درخواستوں کو سنبھال سکتا ہے اور نظام کو مکمل طور پر استعمال کر سکتا ہے۔",
          cta: "سروسز دیکھیں",
        },
      },
      meta: {
        serviceCodeLabel: "سروس کوڈ",
        planLabel: "پلان",
        accessLabel: "رسائی کی حالت",
        planStandardLabel: "اسٹینڈرڈ",
        planPlusLabel: "پلس",
        accessActiveLabel: "کھلا",
        accessLockedLabel: "مقفل",
      },
      services: {
        RENT_HOME: "گھر کرایہ پر دینا",
        BARBER: "حجام",
        CAR_RENTAL: "گاڑی کرایہ پر دینا",
        HOTEL: "ہوٹل",
        BEAUTY_SALON: "بیوٹی سیلون",
        BABYSITTER: "بچوں کی نگہداشت کرنے والا",
        CLEANING: "صفائی کی خدمات",
        TECHNICAL_SERVICES: "تکنیکی خدمات",
      },
    },
    services: {
      hero: {
        pageTitle: "سروس کا انتخاب",
        lockedDescription:
          "یہ صفحہ مالک آن بورڈنگ کا داخلی نقطہ ہے۔ جب تک پروفائل اور فون کی توثیق مکمل نہیں ہوتی، سروس کا بہاؤ، بلنگ اور ڈیش بورڈ مقفل رہیں گے۔",
        activeDescription:
          "پہلے ایک پلان منتخب کریں، پھر وہ سروس منتخب کریں جس کے ساتھ آپ آگے بڑھنا چاہتے ہیں۔ اگر کوئی فعال سبسکرپشن موجود نہیں ہے تو اگلا مرحلہ بلنگ ہوگا۔ ڈیش بورڈ صرف کامیاب بلنگ کے بعد کھلے گا۔",
        currentStateLabel: "موجودہ حالت",
      },
      summary: {
        previewMode: "سروسز پری ویو موڈ میں ہیں",
        selectedPlanOnly: "{planLabel} پلان",
        selectedPlanWithStatus: "{planLabel} پلان • {statusLabel}",
        activePlanWithStatus:
          "فعال پلان: {activePlanLabel} • {statusLabel}",
        billingCompleted: "بلنگ مکمل ہو چکی ہے",
        billingPending: "بلنگ زیرِ انتظار ہے",
        planChangePending: "پلان تبدیل کرنے کے لیے بلنگ ضروری ہے",
      },
      gate: {
        onboardingLabel: "آن بورڈنگ",
        profileRequired: {
          title: "مالک کا پروفائل لازمی ہے",
          message:
            "سروسز استعمال کرنے کے لیے پہلے مالک کی تفصیلات درج کرنا ضروری ہے۔ جب تک پروفائل مکمل نہیں ہوتا، بلنگ اور ڈیش بورڈ مقفل رہیں گے۔",
          cta: "پروفائل صفحے پر جائیں",
        },
        phoneVerificationRequired: {
          title: "فون کی توثیق لازمی ہے",
          message:
            "پروفائل محفوظ کر لیا گیا ہے، لیکن فون کو OTP کے ذریعے تصدیق کرنا ضروری ہے۔ جب تک فون کی توثیق مکمل نہیں ہوتی، سروس کا انتخاب پری ویو موڈ میں رہے گا اور بلنگ / ڈیش بورڈ مقفل رہیں گے۔",
          cta: "پروفائل پر جائیں اور توثیق مکمل کریں",
        },
      },
      plans: {
        stepLabel: "مرحلہ 1",
        title: "ایک پلان منتخب کریں",
        activeDescription:
          "پلان کا انتخاب صرف پروفائل اور فون کی توثیق مکمل ہونے کے بعد فعال ہوتا ہے۔",
        lockedDescription:
          "فی الحال پلان کارڈز صرف پری ویو کے لیے ہیں۔ جب تک پروفائل اور فون کی توثیق مکمل نہیں ہوتی، آپ آگے نہیں بڑھ سکتے۔",
        standard: {
          label: "اسٹینڈرڈ",
          badge: "ماہانہ پلان",
          description:
            "بنیادی مالک بہاؤ کے لیے ایک سادہ اور مستحکم انتخاب۔",
          helper: "فہرستیں معیاری ترتیب میں دکھائی جاتی ہیں۔",
        },
        plus: {
          label: "پلس",
          badge: "ترجیحی مرئیت",
          description:
            "اسی زمرے اور انہی فلٹرز میں زیادہ نمایاں مرئیت فراہم کرتا ہے۔",
          helper:
            "پلس فہرستیں اسٹینڈرڈ فہرستوں سے پہلے دکھائی جاتی ہیں۔",
        },
        selectedChip: "منتخب شدہ",
        lockedNote:
          "پروفائل مکمل ہونے تک پلان کا انتخاب مقفل ہے",
      },
      serviceList: {
        stepLabel: "مرحلہ 2",
        title: "ایک سروس منتخب کریں",
        activeDescription:
          "سروس منتخب کرنے کے بعد اگلا مرحلہ بلنگ ہوگا۔ جن سروسز کی فعال سبسکرپشن موجود ہے، ان کے لیے براہِ راست ڈیش بورڈ رسائی صرف اسی فعال پلان پر دستیاب ہوگی۔",
        lockedDescription:
          "جب تک مالک آن بورڈنگ مکمل نہیں ہوتی، سروس کا انتخاب پری ویو موڈ میں رہے گا اور آگے بڑھنا روکا جائے گا۔",
        carouselAria: "سروسز کے درمیان نیویگیٹ کریں",
        previousServices: "پچھلی سروسز",
        nextServices: "اگلی سروسز",
        loadingServices:
          "سروسز عارضی طور پر لوڈ نہیں ہو سکیں۔ براہِ کرم بعد میں دوبارہ کوشش کریں۔",
        requestTimeout:
          "درخواست کا وقت ختم ہو گیا۔ بیک اینڈ نے جواب نہیں دیا۔",
        noServices: "کوئی سروس نہیں ملی۔",
        profileCompletionInfo:
          "پروفائل اور فون کی توثیق مکمل ہونے کے بعد یہاں سروس کا انتخاب فعال ہو جائے گا۔",
      },
      badges: {
        activeSubscription: "فعال سبسکرپشن",
        continueWithPlus: "پلس کے ساتھ جاری رکھیں",
        continueWithStandard: "اسٹینڈرڈ کے ساتھ جاری رکھیں",
        selected: "منتخب شدہ",
        activePlanLabel: "فعال پلان",
        changePlanBadge: "پلان کی تبدیلی",
      },
      meta: {
        planLabel: "پلان",
        priceLabel: "قیمت",
        priceInactive: "قیمت فعال نہیں ہے",
      },
      cards: {
        fallbackDescription:
          "اس سروس کے لیے مالک کا بہاؤ فعال ہے اور آپ اگلے مرحلے میں جا سکتے ہیں۔",
        lockedFooter:
          "جب تک پروفائل اور فون کی توثیق مکمل نہیں ہوتی، آپ اس سروس کے ساتھ آگے نہیں بڑھ سکتے",
        activeFooterFallback: "ایک فعال سبسکرپشن دستیاب ہے",
        activeFooterWithDate: "فعال ہے تا • {paidUntil}",
        billingFooter:
          "اس سروس کو منتخب کرنے کے بعد اگلا مرحلہ بلنگ ہوگا",
        planChangeFooter:
          "منتخب شدہ پلان کے لیے بلنگ ضروری ہے",
        planChangeFooterWithActivePlan:
          "فعال پلان: {activePlanLabel} • منتخب شدہ پلان کے لیے بلنگ ضروری ہے",
        titleFallback: "سروس",
      },
      selection: {
        flowLabel: "منتخب شدہ بہاؤ",
        notSelected: "کوئی سروس منتخب نہیں کی گئی",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "آگے بڑھنے کے لیے پہلے اوپر سے ایک سروس منتخب کریں۔",
        billingCompletedFlow:
          "اس سروس کے منتخب شدہ پلان کے لیے ایک فعال سبسکرپشن دکھائی دے رہی ہے۔ بلنگ پہلے ہی مکمل ہو چکی ہے اور آگے بڑھنے سے ڈیش بورڈ کھل جائے گا۔",
        billingPendingFlow:
          "سروس منتخب کر لی گئی ہے۔ اگلا مرحلہ بلنگ ہے۔ جب تک ادائیگی کامیابی سے مکمل نہیں ہوتی، ڈیش بورڈ فعال نہیں ہوگا۔",
        planChangeMessage:
          "اس وقت آپ کے پاس {activePlanLabel} پلان کی ایک فعال سبسکرپشن موجود ہے۔ اگر آپ سبسکرپشن کو {targetPlanLabel} پلان میں اپ ڈیٹ کرتے ہیں تو پچھلا فعال پلان منسوخ ہو جائے گا اور {targetPlanLabel} پلان اگلے 30 دنوں کے لیے فعال کر دیا جائے گا۔",
        resetService: "سروس ری سیٹ کریں",
        chooseServiceButton: "سروس منتخب کریں",
        changePlanButton:
          "بلنگ پر جائیں اور پلان اپ ڈیٹ کریں",
        goToProfile: "پروفائل صفحے پر جائیں",
        goToDashboard: "ڈیش بورڈ پر جائیں",
        goToBilling: "بلنگ پر جائیں",
        redirecting: "ری ڈائریکٹ کیا جا رہا ہے...",
      },
      status: {
        profileRequired: "پروفائل لازمی ہے",
        phoneRequired: "فون کی توثیق زیرِ انتظار ہے",
        active: "فعال",
        billingRequired: "بلنگ لازمی ہے",
        serviceSelection: "سروس کا انتخاب",
        planChangeRequired: "پلان کی تبدیلی لازمی ہے",
      },
      errors: {
        ownerNotFoundLoadError: "مالک کا پروفائل نہیں ملا۔",
        servicesLoadErrorFallback: "سروسز لوڈ نہیں ہو سکیں",
        servicesLoadErrorWithStatus:
          "سروسز لوڈ نہیں ہو سکیں (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;