import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const taMessages = {
  common: {
    brand: {
      homeAriaLabel: "முகப்பு பக்கம்",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "மொழி தேர்வு",
      selectorMenuAriaLabel: "மொழி தேர்வு பட்டியல்",
      currentLocaleTitle: "தற்போதைய மொழி: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "உரிமையாளர் டாஷ்போர்டு",
        checkingContext: "சேவை சூழல் சரிபார்க்கப்படுகிறது...",
        subtitle:
          "உரிமையாளர் onboarding மற்றும் subscription நடைமுறை முடிந்த பிறகே டாஷ்போர்டு திறக்கும். செயலில் உள்ள சேவை, திட்டம் மற்றும் அணுகல் நிலை கீழே காட்டப்படுகிறது.",
      },
      summary: {
        activeServiceLabel: "செயலில் உள்ள சேவை",
        ownerLabel: "உரிமையாளர்",
        paidUntilLabel: "செலுத்தப்பட்ட காலம் முடியும் தேதி",
        loadingStatus: "நிலை சரிபார்க்கப்படுகிறது...",
        activeServiceFallback: "செயலில் உள்ள சேவை எதுவும் கிடைக்கவில்லை",
        serviceGenericLabel: "சேவை",
      },
      notes: {
        loading: "நிலை சரிபார்க்கப்படுகிறது...",
        active:
          "குறிப்பு: டாஷ்போர்டு இணைப்புகள் தேர்ந்தெடுக்கப்பட்ட சேவை சூழலில் இயங்குகின்றன. listing உருவாக்குதல், திருத்துதல் மற்றும் நீக்குதல் நடைமுறை அனைத்தும் எனது பட்டியல்கள் பகுதியில் ஒருங்கிணைக்கப்பட்டுள்ளது.",
        locked:
          "குறிப்பு: இந்த கட்டத்தில் டாஷ்போர்டு திட்டமிட்டு பூட்டப்பட்டுள்ளது. அடுத்த படிக்காக மேலுள்ள செயல் பொத்தானைப் பயன்படுத்தவும்.",
      },
      errors: {
        prefix: "பிழை",
        dashboardStateLoadFailed:
          "டாஷ்போர்டின் நிலையை ஏற்ற முடியவில்லை.",
        completeOwnerProfileFirst:
          "முதலில் உரிமையாளரின் சுயவிவரத்தை பூர்த்தி செய்யவும்.",
        phoneVerificationRequired:
          "தொலைபேசி சரிபார்ப்பு நிறைவு செய்யப்பட வேண்டும்.",
        serviceSelectionRequired:
          "முதலில் சேவை தேர்வு நிறைவு செய்யப்பட வேண்டும்.",
        activeSubscriptionNotFound:
          "செயலில் உள்ள subscription எதுவும் கிடைக்கவில்லை.",
        serviceNotFoundOrInactive:
          "சேவை கிடைக்கவில்லை அல்லது செயலில் இல்லை.",
        serverErrorOccurred:
          "சர்வர் பிழை ஏற்பட்டது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.",
        ownerIdentityRequired:
          "முதலில் உரிமையாளரின் சுயவிவரத்தை பூர்த்தி செய்யவும்.",
      },
      cards: {
        properties: {
          title: "எனது பட்டியல்கள்",
          text: "உங்கள் அனைத்து பட்டியல்களையும் பார்க்கவும், புதிய பட்டியல் உருவாக்கவும், செயலில் உள்ள பட்டியல்களை திருத்தவும், நீக்கவும்.",
        },
        profile: {
          title: "சுயவிவர விவரங்கள்",
          text: "உங்கள் பெயர், தொலைபேசி எண் மற்றும் பிற சுயவிவர விவரங்களை நிர்வகிக்கவும்.",
        },
        billing: {
          title: "Subscription மற்றும் கட்டணங்கள்",
          text: "நிலையைச் சரிபார்த்து கட்டண நடைமுறைக்கு செல்லவும்.",
        },
        bookings: {
          title: "பதிவு கோரிக்கைகள்",
          text: "உள்வரும் கோரிக்கைகளை ஏற்கவும் அல்லது நிராகரிக்கவும்.",
        },
        lockedChip: "பூட்டப்பட்டது",
        lockedDescriptions: {
          profile:
            "இந்த பகுதி டாஷ்போர்டின் உள்ளே பூட்டப்பட்டிருக்கும். சுயவிவரப் பக்கத்தைத் திறக்க மேலுள்ள செயல் பொத்தானைப் பயன்படுத்தவும்.",
          billing:
            "இந்த கட்டத்தில் subscription பகுதி செயல் பொத்தானின் மூலம் திறக்கப்படும். டாஷ்போர்டு அட்டை பூட்டப்பட்டே இருக்கும்.",
          properties:
            "பட்டியல்கள் உருவாக்குதல், திருத்துதல் மற்றும் நீக்குதல் உரிமையாளர் onboarding மற்றும் subscription முடிந்த பிறகே கிடைக்கும்.",
          default:
            "உரிமையாளர் onboarding மற்றும் subscription முடியும் வரை இந்த பகுதி கிடைக்காது.",
        },
      },
      states: {
        profileRequired: {
          badge: "டாஷ்போர்டு பூட்டப்பட்டுள்ளது",
          title: "உரிமையாளர் சுயவிவரம் அவசியம்",
          description:
            "சேவைகளைப் பயன்படுத்த முதலில் உரிமையாளரின் தகவலை உள்ளிட வேண்டும். சுயவிவரம் நிறைவு ஆகும் வரை டாஷ்போர்டு, billing மற்றும் பிற பகுதிகள் பூட்டப்பட்டிருக்கும்.",
          cta: "சுயவிவரப் பக்கத்திற்குச் செல்லவும்",
        },
        phoneVerificationRequired: {
          badge: "OTP சரிபார்ப்பு அவசியம்",
          title: "தொலைபேசி சரிபார்க்கப்படவில்லை",
          description:
            "சுயவிவரம் draft ஆக உருவாக்கப்பட்டுள்ளது, ஆனால் OTP மூலம் தொலைபேசி சரிபார்க்கப்படும் வரை உரிமையாளர் செயலில் உள்ளவராக கருதப்படமாட்டார். டாஷ்போர்டும் பிற உரிமையாளர் வசதிகளும் பூட்டப்பட்டிருக்கும்.",
          cta: "சுயவிவரத்திற்குச் சென்று சரிபார்ப்பை முடிக்கவும்",
        },
        serviceSelectionRequired: {
          badge: "சேவை தேர்வு அவசியம்",
          title: "முதலில் சேவை படியை முடிக்கவும்",
          description:
            "சுயவிவரம் முடிந்த பிறகு, உரிமையாளர் முதலில் சேவைகள் பகுதிக்கு திரும்ப வேண்டும். இந்த கட்டத்தில் டாஷ்போர்டு பூட்டப்பட்டிருக்கும்.",
          cta: "சேவைகளுக்குச் செல்லவும்",
        },
        subscriptionRequired: {
          badge: "Subscription அவசியம்",
          title: "செயலில் உள்ள subscription இல்லை",
          description:
            "ஒரு சேவை தேர்ந்தெடுக்கப்பட்டுள்ளது, ஆனால் கட்டணம் முடிக்கப்படவில்லை அல்லது subscription செயலில் இல்லை. டாஷ்போர்டு பூட்டப்பட்டிருக்கும்; பிற உரிமையாளர் செயல்முறைகளும் தடுக்கப்படும்.",
          cta: "Subscription பகுதிக்குச் செல்லவும்",
        },
        active: {
          badge: "செயலில் உள்ளது",
          title: "டாஷ்போர்டு திறந்துள்ளது",
          description:
            "Subscription செயலில் உள்ளது. உரிமையாளர் பட்டியல்கள் உருவாக்கலாம், அவற்றை நிர்வகிக்கலாம், பதிவு கோரிக்கைகளை செயல்படுத்தலாம் மற்றும் அமைப்பை முழுமையாக பயன்படுத்தலாம்.",
          cta: "சேவைகளைப் பார்க்கவும்",
        },
      },
      meta: {
        serviceCodeLabel: "சேவை குறியீடு",
        planLabel: "திட்டம்",
        accessLabel: "அணுகல் நிலை",
        planStandardLabel: "ஸ்டாண்டர்டு",
        planPlusLabel: "ப்ளஸ்",
        accessActiveLabel: "திறந்துள்ளது",
        accessLockedLabel: "பூட்டப்பட்டுள்ளது",
      },
      services: {
        RENT_HOME: "வீடு வாடகம்",
        BARBER: "முடி திருத்தும் சேவை",
        CAR_RENTAL: "கார் வாடகம்",
        HOTEL: "ஹோட்டல்",
        BEAUTY_SALON: "அழகு நிலையம்",
        BABYSITTER: "குழந்தை பராமரிப்பாளர்",
        CLEANING: "சுத்தம் செய்யும் சேவைகள்",
        TECHNICAL_SERVICES: "தொழில்நுட்ப சேவைகள்",
      },
    },
    services: {
      hero: {
        pageTitle: "சேவை தேர்வு",
        lockedDescription:
          "இந்த பக்கம் உரிமையாளர் onboarding இற்கான நுழைவு புள்ளி ஆகும். சுயவிவரமும் தொலைபேசி சரிபார்ப்பும் முடியும் வரை சேவை நடைமுறை, billing மற்றும் டாஷ்போர்டு பூட்டப்பட்டிருக்கும்.",
        activeDescription:
          "முதலில் ஒரு திட்டத்தைத் தேர்வு செய்யவும், பிறகு தொடர விரும்பும் சேவையைத் தேர்வு செய்யவும். செயலில் subscription இல்லையெனில் அடுத்த படி billing ஆகும். billing வெற்றிகரமாக முடிந்த பிறகே டாஷ்போர்டு திறக்கும்.",
        currentStateLabel: "தற்போதைய நிலை",
      },
      summary: {
        previewMode: "சேவைகள் preview நிலையில் உள்ளன",
        selectedPlanOnly: "{planLabel} திட்டம்",
        selectedPlanWithStatus: "{planLabel} திட்டம் • {statusLabel}",
        activePlanWithStatus:
          "செயலில் உள்ள திட்டம்: {activePlanLabel} • {statusLabel}",
        billingCompleted: "billing முடிந்தது",
        billingPending: "billing நிலுவையில் உள்ளது",
        planChangePending: "திட்ட மாற்றத்திற்கு billing தேவைப்படுகிறது",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "உரிமையாளர் சுயவிவரம் அவசியம்",
          message:
            "சேவைகளைப் பயன்படுத்த முதலில் உரிமையாளரின் விவரங்களை உள்ளிட வேண்டும். சுயவிவரம் நிறைவு ஆகும் வரை billing மற்றும் டாஷ்போர்டு பூட்டப்பட்டிருக்கும்.",
          cta: "சுயவிவரப் பக்கத்திற்குச் செல்லவும்",
        },
        phoneVerificationRequired: {
          title: "தொலைபேசி சரிபார்ப்பு அவசியம்",
          message:
            "சுயவிவரம் சேமிக்கப்பட்டுள்ளது, ஆனால் தொலைபேசி OTP மூலம் சரிபார்க்கப்பட வேண்டும். தொலைபேசி சரிபார்ப்பு முடியும் வரை சேவை தேர்வு preview நிலையில் இருக்கும் மற்றும் billing / டாஷ்போர்டு பூட்டப்பட்டிருக்கும்.",
          cta: "சுயவிவரத்திற்குச் சென்று சரிபார்ப்பை முடிக்கவும்",
        },
      },
      plans: {
        stepLabel: "படி 1",
        title: "ஒரு திட்டத்தைத் தேர்வு செய்யவும்",
        activeDescription:
          "சுயவிவரமும் தொலைபேசி சரிபார்ப்பும் முடிந்த பிறகே திட்டத் தேர்வு செயலில் வரும்.",
        lockedDescription:
          "திட்ட அட்டைகள் தற்போது preview க்காக மட்டுமே உள்ளன. சுயவிவரமும் தொலைபேசி சரிபார்ப்பும் முடியும் வரை நீங்கள் தொடர முடியாது.",
        standard: {
          label: "ஸ்டாண்டர்டு",
          badge: "மாதாந்திர திட்டம்",
          description:
            "முதன்மை உரிமையாளர் நடைமுறைக்கான எளிய மற்றும் நிலையான தேர்வு.",
          helper: "பட்டியல்கள் ஸ்டாண்டர்டு வரிசையில் காட்டப்படும்.",
        },
        plus: {
          label: "ப்ளஸ்",
          badge: "முன்னுரிமை காட்சி",
          description:
            "அதே வகை மற்றும் அதே வடிகட்டிகளில் அதிக காட்சியளிப்பை வழங்கும்.",
          helper: "ப்ளஸ் பட்டியல்கள் ஸ்டாண்டர்டு பட்டியல்களுக்கு முன் காட்டப்படும்.",
        },
        selectedChip: "தேர்ந்தெடுக்கப்பட்டது",
        lockedNote:
          "சுயவிவரம் முடியும் வரை திட்டத் தேர்வு பூட்டப்பட்டிருக்கும்",
      },
      serviceList: {
        stepLabel: "படி 2",
        title: "ஒரு சேவையைத் தேர்வு செய்யவும்",
        activeDescription:
          "சேவை தேர்ந்தெடுக்கப்பட்ட பிறகு அடுத்த படி billing ஆகும். செயலில் subscription உள்ள சேவைகளுக்கு, அந்த செயலில் திட்டத்திற்கே நேரடி டாஷ்போர்டு அணுகல் கிடைக்கும்.",
        lockedDescription:
          "உரிமையாளர் onboarding முடியும் வரை சேவை தேர்வு preview நிலையில் இருக்கும்; தொடர்வு தடுக்கப்படும்.",
        carouselAria: "சேவைகளுக்கிடையே நகரவும்",
        previousServices: "முந்தைய சேவைகள்",
        nextServices: "அடுத்த சேவைகள்",
        loadingServices:
          "சேவைகளை தற்காலிகமாக ஏற்ற முடியவில்லை. பிறகு மீண்டும் முயற்சிக்கவும்.",
        requestTimeout:
          "கோரிக்கைக்கான நேரம் முடிந்தது. Backend பதிலளிக்கவில்லை.",
        noServices: "எந்த சேவையும் கிடைக்கவில்லை.",
        profileCompletionInfo:
          "சுயவிவரமும் தொலைபேசி சரிபார்ப்பும் முடிந்த பிறகு இங்கே சேவைத் தேர்வு செயலில் வரும்.",
      },
      badges: {
        activeSubscription: "செயலில் உள்ள subscription",
        continueWithPlus: "ப்ளஸ் மூலம் தொடரவும்",
        continueWithStandard: "ஸ்டாண்டர்டு மூலம் தொடரவும்",
        selected: "தேர்ந்தெடுக்கப்பட்டது",
        activePlanLabel: "செயலில் உள்ள திட்டம்",
        changePlanBadge: "திட்ட மாற்றம்",
      },
      meta: {
        planLabel: "திட்டம்",
        priceLabel: "விலை",
        priceInactive: "விலை செயலில் இல்லை",
      },
      cards: {
        fallbackDescription:
          "இந்த சேவைக்கான உரிமையாளர் நடைமுறை செயலில் உள்ளது; நீங்கள் அடுத்த கட்டத்திற்குச் செல்லலாம்.",
        lockedFooter:
          "சுயவிவரமும் தொலைபேசி சரிபார்ப்பும் முடியும் வரை இந்த சேவையுடன் நீங்கள் தொடர முடியாது",
        activeFooterFallback: "செயலில் உள்ள subscription கிடைக்கிறது",
        activeFooterWithDate: "செயலில் உள்ளது • {paidUntil}",
        billingFooter:
          "இந்த சேவையைத் தேர்வு செய்த பிறகு அடுத்த படி billing ஆகும்",
        planChangeFooter:
          "தேர்ந்தெடுக்கப்பட்ட திட்டத்திற்கு billing தேவைப்படுகிறது",
        planChangeFooterWithActivePlan:
          "செயலில் உள்ள திட்டம்: {activePlanLabel} • தேர்ந்தெடுக்கப்பட்ட திட்டத்திற்கு billing தேவைப்படுகிறது",
        titleFallback: "சேவை",
      },
      selection: {
        flowLabel: "தேர்ந்தெடுக்கப்பட்ட நடைமுறை",
        notSelected: "எந்த சேவையும் தேர்ந்தெடுக்கப்படவில்லை",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "தொடர முதலில் மேலிருந்து ஒரு சேவையைத் தேர்வு செய்யவும்.",
        billingCompletedFlow:
          "இந்த சேவையின் தேர்ந்தெடுக்கப்பட்ட திட்டத்திற்கு செயலில் subscription காணப்படுகிறது. billing ஏற்கனவே முடிந்துள்ளது; தொடர்ந்தால் டாஷ்போர்டு திறக்கும்.",
        billingPendingFlow:
          "சேவை தேர்ந்தெடுக்கப்பட்டுள்ளது. அடுத்த படி billing ஆகும். கட்டணம் வெற்றிகரமாக முடியும் வரை டாஷ்போர்டு செயலில் வராது.",
        planChangeMessage:
          "தற்போது உங்களிடம் {activePlanLabel} திட்டத்தின் செயலில் subscription உள்ளது. subscription ஐ {targetPlanLabel} திட்டமாக மாற்றினால், முந்தைய செயலில் திட்டம் ரத்து செய்யப்படும் மற்றும் {targetPlanLabel} திட்டம் அடுத்த 30 நாட்களுக்கு செயலில் இருக்கும்.",
        resetService: "சேவையை மீட்டமைக்கவும்",
        chooseServiceButton: "சேவையைத் தேர்வு செய்யவும்",
        changePlanButton: "billing க்கு சென்று திட்டத்தைப் புதுப்பிக்கவும்",
        goToProfile: "சுயவிவரப் பக்கத்திற்குச் செல்லவும்",
        goToDashboard: "டாஷ்போர்டுக்குச் செல்லவும்",
        goToBilling: "billing க்கு செல்லவும்",
        redirecting: "திருப்பி விடப்படுகிறது...",
      },
      status: {
        profileRequired: "சுயவிவரம் அவசியம்",
        phoneRequired: "தொலைபேசி சரிபார்ப்பு நிலுவையில் உள்ளது",
        active: "செயலில் உள்ளது",
        billingRequired: "billing அவசியம்",
        serviceSelection: "சேவை தேர்வு",
        planChangeRequired: "திட்ட மாற்றம் அவசியம்",
      },
      errors: {
        ownerNotFoundLoadError:
          "உரிமையாளரின் சுயவிவரம் கிடைக்கவில்லை.",
        servicesLoadErrorFallback: "சேவைகளை ஏற்ற முடியவில்லை",
        servicesLoadErrorWithStatus:
          "சேவைகளை ஏற்ற முடியவில்லை (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;