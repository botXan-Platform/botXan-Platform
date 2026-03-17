import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const haMessages = {
  common: {
    brand: {
      homeAriaLabel: "Babban shafi",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Zaɓin harshe",
      selectorMenuAriaLabel: "Menu na zaɓin harshe",
      currentLocaleTitle: "Harshen yanzu: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Dashboard na mai shi",
        checkingContext: "Ana duba yanayin sabis...",
        subtitle:
          "Dashboard ɗin yana buɗewa ne kawai bayan an kammala rajistar mai shi da tsarin biyan kuɗi. Ana nuna sabis mai aiki, tsari, da matsayin shiga a ƙasa.",
      },
      summary: {
        activeServiceLabel: "Sabis mai aiki",
        ownerLabel: "Mai shi",
        paidUntilLabel: "An biya zuwa",
        loadingStatus: "Ana duba matsayi...",
        activeServiceFallback: "Ba a sami sabis mai aiki ba",
        serviceGenericLabel: "Sabis",
      },
      notes: {
        loading: "Ana duba matsayi...",
        active:
          "Lura: hanyoyin dashboard suna aiki da yanayin sabis da aka zaɓa. Tsarin ƙirƙira, gyarawa, da gogewa na tallace-tallace an haɗa su a sashin Tallace-tallacena.",
        locked:
          "Lura: an kulle dashboard ɗin da gangan a wannan mataki. Yi amfani da maɓallin aiki na sama domin mataki na gaba.",
      },
      errors: {
        prefix: "Kuskure",
        dashboardStateLoadFailed:
          "Ba a iya loda matsayin dashboard ɗin ba.",
        completeOwnerProfileFirst: "Da fari ka kammala bayanan mai shi.",
        phoneVerificationRequired:
          "Dole ne a kammala tabbatar da lambar waya.",
        serviceSelectionRequired:
          "Dole ne a fara kammala zaɓin sabis.",
        activeSubscriptionNotFound:
          "Ba a sami biyan kuɗi mai aiki ba.",
        serviceNotFoundOrInactive:
          "Ba a sami sabis ba ko kuma ba ya aiki.",
        serverErrorOccurred:
          "An samu kuskuren uwar garke. A sake gwadawa daga baya.",
        ownerIdentityRequired: "Da fari ka kammala bayanan mai shi.",
      },
      cards: {
        properties: {
          title: "Tallace-tallacena",
          text: "Duba duk tallace-tallacenka, ƙirƙiri sabo, gyara masu aiki, kuma goge su.",
        },
        profile: {
          title: "Bayanan furofayil",
          text: "Sarrafa sunanka, lambar wayarka, da sauran bayanan furofayil.",
        },
        billing: {
          title: "Biyan kuɗi da kuɗaɗe",
          text: "Duba matsayi sannan ka ci gaba zuwa tsarin biyan kuɗi.",
        },
        bookings: {
          title: "Buƙatun yin ajiya",
          text: "Amince ko ƙi buƙatun da suka shigo.",
        },
        lockedChip: "A kulle",
        lockedDescriptions: {
          profile:
            "Wannan sashe yana nan a kulle a cikin dashboard. Yi amfani da maɓallin aiki na sama don buɗe shafin furofayil.",
          billing:
            "A wannan mataki, ana buɗe sashin biyan kuɗi ta maɓallin aiki. Katin dashboard yana nan a kulle.",
          properties:
            "Ƙirƙira, gyarawa, da gogewa na tallace-tallace suna samuwa ne kawai bayan an kammala rajistar mai shi da biyan kuɗi.",
          default:
            "Wannan sashe ba ya samuwa har sai an kammala rajistar mai shi da biyan kuɗi.",
        },
      },
      states: {
        profileRequired: {
          badge: "An kulle dashboard",
          title: "Ana buƙatar bayanan mai shi",
          description:
            "Don amfani da sabis, dole ne ka fara cike bayanan mai shi. Har sai an kammala furofayil, dashboard, biyan kuɗi, da sauran sassa za su kasance a kulle.",
          cta: "Je zuwa shafin furofayil",
        },
        phoneVerificationRequired: {
          badge: "Ana buƙatar tabbatarwar OTP",
          title: "Ba a tabbatar da waya ba",
          description:
            "An ƙirƙiri furofayil ɗin a matsayin daftari, amma ba za a ɗauki mai shi a matsayin mai aiki ba har sai an tabbatar da waya ta OTP. Dashboard da sauran damar mai shi za su kasance a kulle.",
          cta: "Je zuwa furofayil ka kammala tabbatarwa",
        },
        serviceSelectionRequired: {
          badge: "Ana buƙatar zaɓin sabis",
          title: "Da fari ka kammala matakin sabis",
          description:
            "Bayan an kammala furofayil, dole ne mai shi ya fara komawa sashin sabis. Dashboard yana nan a kulle a wannan mataki.",
          cta: "Je zuwa sabis",
        },
        subscriptionRequired: {
          badge: "Ana buƙatar biyan kuɗi",
          title: "Babu biyan kuɗi mai aiki",
          description:
            "An zaɓi sabis, amma ba a kammala biyan kuɗi ba ko kuma biyan kuɗin ba ya aiki. Dashboard zai ci gaba da kasancewa a kulle kuma sauran ayyukan mai shi za su kasance a toshe.",
          cta: "Je zuwa biyan kuɗi",
        },
        active: {
          badge: "Mai aiki",
          title: "Dashboard a buɗe yake",
          description:
            "Biyan kuɗin yana aiki. Mai shi zai iya ƙirƙirar tallace-tallace, sarrafa su, kula da buƙatun yin ajiya, kuma ya yi amfani da tsarin gaba ɗaya.",
          cta: "Duba sabis",
        },
      },
      meta: {
        serviceCodeLabel: "Lambar sabis",
        planLabel: "Tsari",
        accessLabel: "Matsayin shiga",
        planStandardLabel: "Standard",
        planPlusLabel: "Plus",
        accessActiveLabel: "A buɗe",
        accessLockedLabel: "A kulle",
      },
      services: {
        RENT_HOME: "Hayar gida",
        BARBER: "Aski",
        CAR_RENTAL: "Hayar mota",
        HOTEL: "Otal",
        BEAUTY_SALON: "Salon kyau",
        BABYSITTER: "Mai kula da yara",
        CLEANING: "Ayyukan tsaftacewa",
        TECHNICAL_SERVICES: "Ayyukan fasaha",
      },
    },
    services: {
      hero: {
        pageTitle: "Zaɓin sabis",
        lockedDescription:
          "Wannan shafi shi ne wurin shigar onboarding na mai shi. Har sai an kammala furofayil da tabbatar da waya, tsarin sabis, biyan kuɗi, da dashboard za su kasance a kulle.",
        activeDescription:
          "Da farko ka zaɓi tsari, sannan ka zaɓi sabis ɗin da kake son ci gaba da shi. Idan babu biyan kuɗi mai aiki, mataki na gaba shi ne biyan kuɗi. Dashboard zai buɗe ne kawai bayan an kammala biyan kuɗi cikin nasara.",
        currentStateLabel: "Matsayin yanzu",
      },
      summary: {
        previewMode: "Sabis suna cikin yanayin preview",
        selectedPlanOnly: "Tsarin {planLabel}",
        selectedPlanWithStatus: "Tsarin {planLabel} • {statusLabel}",
        activePlanWithStatus:
          "Tsari mai aiki: {activePlanLabel} • {statusLabel}",
        billingCompleted: "an kammala biyan kuɗi",
        billingPending: "ana jiran biyan kuɗi",
        planChangePending: "ana buƙatar biyan kuɗi domin canza tsari",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "Ana buƙatar bayanan mai shi",
          message:
            "Don amfani da sabis, dole ne ka fara shigar da bayanan mai shi. Har sai an kammala furofayil, biyan kuɗi da dashboard za su kasance a kulle.",
          cta: "Je zuwa shafin furofayil",
        },
        phoneVerificationRequired: {
          title: "Ana buƙatar tabbatar da waya",
          message:
            "An ajiye furofayil, amma dole ne a tabbatar da waya ta OTP. Har sai an kammala tabbatar da waya, zaɓin sabis zai ci gaba da kasancewa a yanayin preview kuma biyan kuɗi / dashboard za su kasance a kulle.",
          cta: "Je zuwa furofayil ka kammala tabbatarwa",
        },
      },
      plans: {
        stepLabel: "Mataki na 1",
        title: "Zaɓi tsari",
        activeDescription:
          "Zaɓin tsari yana zama mai aiki ne kawai bayan an kammala furofayil da tabbatar da waya.",
        lockedDescription:
          "Katunan tsari a yanzu na preview ne kawai. Ba za ka iya ci gaba ba har sai an kammala furofayil da tabbatar da waya.",
        standard: {
          label: "Standard",
          badge: "Tsarin wata-wata",
          description:
            "Zaɓi mai sauƙi kuma mai daidaito domin babban tsarin mai shi.",
          helper: "Ana nuna tallace-tallace bisa daidaitaccen jeri.",
        },
        plus: {
          label: "Plus",
          badge: "Fitowar fifiko",
          description:
            "Yana ba da mafi girman gani a cikin rukuni da irin waɗannan matattara.",
          helper:
            "Ana nuna tallace-tallacen Plus kafin na Standard.",
        },
        selectedChip: "An zaɓa",
        lockedNote:
          "Zaɓin tsari yana a kulle har sai an kammala furofayil",
      },
      serviceList: {
        stepLabel: "Mataki na 2",
        title: "Zaɓi sabis",
        activeDescription:
          "Bayan an zaɓi sabis, mataki na gaba shi ne biyan kuɗi. Ga sabis da suke da biyan kuɗi mai aiki, shiga kai tsaye zuwa dashboard zai kasance a buɗe ne kawai ga wannan tsari mai aiki.",
        lockedDescription:
          "Har sai an kammala onboarding na mai shi, zaɓin sabis zai ci gaba da kasancewa a yanayin preview kuma za a hana ci gaba.",
        carouselAria: "Motsa tsakanin sabis",
        previousServices: "Sabis na baya",
        nextServices: "Sabis na gaba",
        loadingServices:
          "Ba a iya loda sabis na ɗan lokaci ba. A sake gwadawa daga baya.",
        requestTimeout:
          "Lokacin buƙata ya ƙare. Backend bai bada amsa ba.",
        noServices: "Ba a sami wani sabis ba.",
        profileCompletionInfo:
          "Zaɓin sabis zai zama mai aiki a nan bayan an kammala furofayil da tabbatar da waya.",
      },
      badges: {
        activeSubscription: "Biyan kuɗi mai aiki",
        continueWithPlus: "Ci gaba da Plus",
        continueWithStandard: "Ci gaba da Standard",
        selected: "An zaɓa",
        activePlanLabel: "Tsari mai aiki",
        changePlanBadge: "Canjin tsari",
      },
      meta: {
        planLabel: "Tsari",
        priceLabel: "Farashi",
        priceInactive: "Farashin ba ya aiki",
      },
      cards: {
        fallbackDescription:
          "Tsarin mai shi na wannan sabis yana aiki kuma za ka iya ci gaba zuwa mataki na gaba.",
        lockedFooter:
          "Ba za ka iya ci gaba da wannan sabis ba har sai an kammala furofayil da tabbatar da waya",
        activeFooterFallback: "Akwai biyan kuɗi mai aiki",
        activeFooterWithDate: "Yana aiki zuwa • {paidUntil}",
        billingFooter:
          "Bayan ka zaɓi wannan sabis, mataki na gaba zai zama biyan kuɗi",
        planChangeFooter:
          "Ana buƙatar biyan kuɗi domin tsarin da aka zaɓa",
        planChangeFooterWithActivePlan:
          "Tsari mai aiki: {activePlanLabel} • Ana buƙatar biyan kuɗi domin tsarin da aka zaɓa",
        titleFallback: "Sabis",
      },
      selection: {
        flowLabel: "Tsarin da aka zaɓa",
        notSelected: "Ba a zaɓi wani sabis ba",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Don ci gaba, da farko ka zaɓi sabis ɗaya daga sama.",
        billingCompletedFlow:
          "Ana ganin biyan kuɗi mai aiki ga tsarin da aka zaɓa na wannan sabis. An riga an kammala biyan kuɗi, kuma ci gaba zai buɗe dashboard.",
        billingPendingFlow:
          "An zaɓi sabis ɗin. Mataki na gaba shi ne biyan kuɗi. Dashboard ba zai zama mai aiki ba har sai an kammala biyan kuɗi cikin nasara.",
        planChangeMessage:
          "A yanzu kana da biyan kuɗi mai aiki na tsarin {activePlanLabel}. Idan ka sabunta biyan kuɗin zuwa tsarin {targetPlanLabel}, za a soke tsohon tsari mai aiki sannan a kunna tsarin {targetPlanLabel} na kwanaki 30 masu zuwa.",
        resetService: "Sake saita sabis",
        chooseServiceButton: "Zaɓi sabis",
        changePlanButton:
          "Je zuwa biyan kuɗi ka sabunta tsarin",
        goToProfile: "Je zuwa shafin furofayil",
        goToDashboard: "Je zuwa dashboard",
        goToBilling: "Je zuwa biyan kuɗi",
        redirecting: "Ana tura ka...",
      },
      status: {
        profileRequired: "Ana buƙatar furofayil",
        phoneRequired: "Ana jiran tabbatar da waya",
        active: "Mai aiki",
        billingRequired: "Ana buƙatar biyan kuɗi",
        serviceSelection: "Zaɓin sabis",
        planChangeRequired: "Ana buƙatar canjin tsari",
      },
      errors: {
        ownerNotFoundLoadError: "Ba a sami furofayil na mai shi ba.",
        servicesLoadErrorFallback: "Ba a iya loda sabis ba",
        servicesLoadErrorWithStatus:
          "Ba a iya loda sabis ba (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;