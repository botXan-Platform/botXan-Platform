import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const yoMessages = {
  common: {
    brand: {
      homeAriaLabel: "Ojú-ìwé àkọ́kọ́",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Yíyan èdè",
      selectorMenuAriaLabel: "Àkójọ yíyan èdè",
      currentLocaleTitle: "Èdè lọwọlọwọ: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Pánẹ́ẹ̀lì oníwun",
        checkingContext: "A ń ṣàyẹ̀wò àyíká iṣẹ́...",
        subtitle:
          "Pánẹ́ẹ̀lì náà máa ṣí sílẹ̀ nìkan lẹ́yìn tí ìforúkọsílẹ̀ oníwun àti ìlànà ìforúkọsílẹ̀ owó oṣù bá parí. Iṣẹ́ tó ń ṣiṣẹ́, ètò, àti ipo ìwọlé ni a fi hàn ní ìsàlẹ̀.",
      },
      summary: {
        activeServiceLabel: "Iṣẹ́ tó ń ṣiṣẹ́",
        ownerLabel: "Oníwun",
        paidUntilLabel: "Sísan dé ọjọ́",
        loadingStatus: "A ń ṣàyẹ̀wò ipo...",
        activeServiceFallback: "A kò rí iṣẹ́ tó ń ṣiṣẹ́",
        serviceGenericLabel: "Iṣẹ́",
      },
      notes: {
        loading: "A ń ṣàyẹ̀wò ipo...",
        active:
          "Àkíyèsí: àwọn ìjápọ̀ nínú pánẹ́ẹ̀lì ń ṣiṣẹ́ pẹ̀lú àyíká iṣẹ́ tí a yàn. Ṣíṣe, ṣàtúnṣe àti píparẹ àwọn listing ni a ti darapọ̀ sínú apá Àwọn listing mi.",
        locked:
          "Àkíyèsí: a ti dì pánẹ́ẹ̀lì náà mọ́ọ̀mọ̀ ní ìpele yìí. Lo bọ́tìnì ìṣe lókè fún ìgbésẹ̀ tó kàn.",
      },
      errors: {
        prefix: "Àṣìṣe",
        dashboardStateLoadFailed:
          "A kò lè gbé ipo pánẹ́ẹ̀lì náà wọlé.",
        completeOwnerProfileFirst: "Kọ́kọ́ parí profaili oníwun.",
        phoneVerificationRequired:
          "Ó gbọdọ̀ parí ìfọwọ́sí fóònù.",
        serviceSelectionRequired:
          "Ó gbọdọ̀ kọ́kọ́ parí yíyan iṣẹ́.",
        activeSubscriptionNotFound:
          "A kò rí ìforúkọsílẹ̀ owó oṣù tó ń ṣiṣẹ́.",
        serviceNotFoundOrInactive:
          "A kò rí iṣẹ́ náà tàbí kò ṣiṣẹ́.",
        serverErrorOccurred:
          "Àṣìṣe sẹ́fà ṣẹlẹ̀. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kansi láìpẹ́.",
        ownerIdentityRequired: "Kọ́kọ́ parí profaili oníwun.",
      },
      cards: {
        properties: {
          title: "Àwọn listing mi",
          text: "Wo gbogbo listing rẹ, ṣẹ̀dá listing tuntun, ṣàtúnṣe àwọn listing tó ń ṣiṣẹ́, kí o sì pa wọ́n rẹ́.",
        },
        profile: {
          title: "Àlàyé profaili",
          text: "Ṣètò orúkọ rẹ, nọ́ńbà fóònù rẹ, àti àwọn àlàyé profaili mìíràn.",
        },
        billing: {
          title: "Ìforúkọsílẹ̀ owó oṣù àti àwọn ìsanwó",
          text: "Ṣàyẹ̀wò ipo kí o sì tẹ̀síwájú sí ìlànà ìsanwó.",
        },
        bookings: {
          title: "Àwọn ìbéèrè ìfipamọ́sí",
          text: "Fọwọ́sí tàbí kọ àwọn ìbéèrè tó wọlé.",
        },
        lockedChip: "Ti di",
        lockedDescriptions: {
          profile:
            "Apá yìí máa wà ní títì nínú pánẹ́ẹ̀lì. Lo bọ́tìnì ìṣe lókè láti ṣí ojú-ìwé profaili.",
          billing:
            "Ní ìpele yìí, apá ìforúkọsílẹ̀ owó oṣù ni a máa ṣí pẹ̀lú bọ́tìnì ìṣe. Káàdì pánẹ́ẹ̀lì náà sì máa wà ní títì.",
          properties:
            "Ṣíṣe, ṣàtúnṣe àti píparẹ listing máa wà ní ààyè nìkan lẹ́yìn tí ìforúkọsílẹ̀ oníwun àti ìforúkọsílẹ̀ owó oṣù bá parí.",
          default:
            "Apá yìí kò sí ní ààyè títí tí ìforúkọsílẹ̀ oníwun àti ìforúkọsílẹ̀ owó oṣù yóò fi parí.",
        },
      },
      states: {
        profileRequired: {
          badge: "Pánẹ́ẹ̀lì ti di",
          title: "Profaili oníwun jẹ́ dandan",
          description:
            "Láti lo àwọn iṣẹ́, o gbọ́dọ̀ kọ́kọ́ fi ìlànà oníwun sílẹ̀. Títí di àsìkò tí profaili yóò fi parí, pánẹ́ẹ̀lì, billing àti àwọn apá mìíràn yóò wà ní títì.",
          cta: "Lọ sí ojú-ìwé profaili",
        },
        phoneVerificationRequired: {
          badge: "Ìfọwọ́sí OTP jẹ́ dandan",
          title: "A kò tíì fọwọ́sí fóònù",
          description:
            "A ṣẹ̀dá profaili náà gẹ́gẹ́ bí àkọọ́lẹ̀ àkànṣe, ṣùgbọ́n a kò ní ka oníwun sí ẹni tó ń ṣiṣẹ́ títí tí a ó fi fọwọ́sí fóònù rẹ̀ pẹ̀lú OTP. Pánẹ́ẹ̀lì àti àwọn agbára oníwun mìíràn yóò wà ní títì.",
          cta: "Lọ sí profaili kí o sì parí ìfọwọ́sí",
        },
        serviceSelectionRequired: {
          badge: "Yíyan iṣẹ́ jẹ́ dandan",
          title: "Kọ́kọ́ parí ìgbésẹ̀ iṣẹ́",
          description:
            "Lẹ́yìn tí profaili bá parí, oníwun gbọ́dọ̀ kọ́kọ́ padà sí apá iṣẹ́. Pánẹ́ẹ̀lì náà yóò wà ní títì ní ìpele yìí.",
          cta: "Lọ sí iṣẹ́",
        },
        subscriptionRequired: {
          badge: "Ìforúkọsílẹ̀ owó oṣù jẹ́ dandan",
          title: "Kò sí ìforúkọsílẹ̀ owó oṣù tó ń ṣiṣẹ́",
          description:
            "A ti yan iṣẹ́ kan, ṣùgbọ́n a kò tíì parí ìsanwó tàbí ìforúkọsílẹ̀ owó oṣù náà kò ṣiṣẹ́. Pánẹ́ẹ̀lì náà yóò wà ní títì, àwọn ìlànà oníwun mìíràn náà sì máa di mọ́.",
          cta: "Lọ sí ìforúkọsílẹ̀ owó oṣù",
        },
        active: {
          badge: "Ń ṣiṣẹ́",
          title: "Pánẹ́ẹ̀lì ti ṣí",
          description:
            "Ìforúkọsílẹ̀ owó oṣù náà ń ṣiṣẹ́. Oníwun lè ṣẹ̀dá listing, ṣètò àwọn listing, ṣiṣẹ́ lórí àwọn ìbéèrè ìfipamọ́sí, kí ó sì lo ètò náà ní kíkún.",
          cta: "Wo àwọn iṣẹ́",
        },
      },
      meta: {
        serviceCodeLabel: "Kóòdù iṣẹ́",
        planLabel: "Ètò",
        accessLabel: "Ipo ìwọlé",
        planStandardLabel: "Standard",
        planPlusLabel: "Plus",
        accessActiveLabel: "Ṣí sílẹ̀",
        accessLockedLabel: "Ti di",
      },
      services: {
        RENT_HOME: "Yíyálé ilé",
        BARBER: "Barber",
        CAR_RENTAL: "Yíyálé ọkọ ayọ́kẹ́lẹ́",
        HOTEL: "Hótẹ́lì",
        BEAUTY_SALON: "Sálọ́nù ẹwà",
        BABYSITTER: "Olùtọ́jú ọmọ",
        CLEANING: "Àwọn iṣẹ́ mímọ́",
        TECHNICAL_SERVICES: "Àwọn iṣẹ́ imọ̀-ẹ̀rọ",
      },
    },
    services: {
      hero: {
        pageTitle: "Yíyan iṣẹ́",
        lockedDescription:
          "Ojú-ìwé yìí ni ibi ìbẹ̀rẹ̀ onboarding oníwun. Títí di àsìkò tí profaili àti ìfọwọ́sí fóònù yóò fi parí, ìṣàn iṣẹ́, billing, àti pánẹ́ẹ̀lì yóò wà ní títì.",
        activeDescription:
          "Kọ́kọ́ yan ètò, lẹ́yìn náà yan iṣẹ́ tí o fẹ́ tẹ̀síwájú pẹ̀lú rẹ̀. Tí kò bá sí ìforúkọsílẹ̀ owó oṣù tó ń ṣiṣẹ́, ìgbésẹ̀ tó kàn ni billing. Pánẹ́ẹ̀lì náà yóò ṣí sílẹ̀ nìkan lẹ́yìn billing tó ṣàṣeyọrí.",
        currentStateLabel: "Ipo lọwọlọwọ",
      },
      summary: {
        previewMode: "Àwọn iṣẹ́ wà ní ipo preview",
        selectedPlanOnly: "Ètò {planLabel}",
        selectedPlanWithStatus: "Ètò {planLabel} • {statusLabel}",
        activePlanWithStatus:
          "Ètò tó ń ṣiṣẹ́: {activePlanLabel} • {statusLabel}",
        billingCompleted: "billing ti parí",
        billingPending: "billing ń dúró",
        planChangePending: "billing jẹ́ dandan fún ayípadà ètò",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "Profaili oníwun jẹ́ dandan",
          message:
            "Láti lo àwọn iṣẹ́, o gbọ́dọ̀ kọ́kọ́ tẹ àwọn àlàyé oníwun wọlé. Títí di àsìkò tí profaili yóò fi parí, billing àti pánẹ́ẹ̀lì yóò wà ní títì.",
          cta: "Lọ sí ojú-ìwé profaili",
        },
        phoneVerificationRequired: {
          title: "Ìfọwọ́sí fóònù jẹ́ dandan",
          message:
            "A ti fi profaili pamọ́, ṣùgbọ́n a gbọdọ̀ fọwọ́sí fóònù náà pẹ̀lú OTP. Títí di àsìkò tí ìfọwọ́sí fóònù yóò fi parí, yíyan iṣẹ́ yóò wà ní ipo preview, billing / pánẹ́ẹ̀lì náà sì yóò wà ní títì.",
          cta: "Lọ sí profaili kí o sì parí ìfọwọ́sí",
        },
      },
      plans: {
        stepLabel: "Ìgbésẹ̀ 1",
        title: "Yan ètò kan",
        activeDescription:
          "Yíyan ètò máa di mímuṣiṣẹ́ nìkan lẹ́yìn tí profaili àti ìfọwọ́sí fóònù bá parí.",
        lockedDescription:
          "Àwọn káàdì ètò jẹ́ fún preview nìkan báyìí. O kò lè tẹ̀síwájú títí tí profaili àti ìfọwọ́sí fóònù yóò fi parí.",
        standard: {
          label: "Standard",
          badge: "Ètò oṣooṣù",
          description:
            "Yíyan tó rọrùn àti tó dájú fún ìṣàn àkọ́kọ́ oníwun.",
          helper: "A ń fi listing hàn ní títò Standard.",
        },
        plus: {
          label: "Plus",
          badge: "Ìfarahàn àkọ́kọ́",
          description:
            "Ó ń fúnni ní ìfarahàn tó ga jù lọ nínú ẹ̀ka àti àlẹ́mọ́ kan náà.",
          helper:
            "Àwọn listing Plus máa hàn ṣáájú àwọn listing Standard.",
        },
        selectedChip: "A ti yàn",
        lockedNote:
          "Yíyan ètò wà ní títì títí di àsìkò tí profaili yóò fi parí",
      },
      serviceList: {
        stepLabel: "Ìgbésẹ̀ 2",
        title: "Yan iṣẹ́ kan",
        activeDescription:
          "Lẹ́yìn tí a bá yan iṣẹ́, ìgbésẹ̀ tó kàn ni billing. Fún àwọn iṣẹ́ tó ní ìforúkọsílẹ̀ owó oṣù tó ń ṣiṣẹ́, ìwọlé taara sí pánẹ́ẹ̀lì yóò ṣí sílẹ̀ nìkan fún ètò tó ń ṣiṣẹ́ yẹn.",
        lockedDescription:
          "Títí di àsìkò tí onboarding oníwun yóò fi parí, yíyan iṣẹ́ yóò wà ní ipo preview, a sì máa dí tẹ̀síwájú mọ́.",
        carouselAria: "Rìn láàrín àwọn iṣẹ́",
        previousServices: "Àwọn iṣẹ́ tó ṣáájú",
        nextServices: "Àwọn iṣẹ́ tó tẹ̀lé",
        loadingServices:
          "A kò lè gbé àwọn iṣẹ́ wọlé fún ìgbà díẹ̀. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kansi láìpẹ́.",
        requestTimeout:
          "Àkókò ìbéèrè ti parí. Backend kò dáhùn.",
        noServices: "A kò rí iṣẹ́ kankan.",
        profileCompletionInfo:
          "Yíyan iṣẹ́ yóò di mímuṣiṣẹ́ níbí lẹ́yìn tí profaili àti ìfọwọ́sí fóònù bá parí.",
      },
      badges: {
        activeSubscription: "Ìforúkọsílẹ̀ owó oṣù tó ń ṣiṣẹ́",
        continueWithPlus: "Tẹ̀síwájú pẹ̀lú Plus",
        continueWithStandard: "Tẹ̀síwájú pẹ̀lú Standard",
        selected: "A ti yàn",
        activePlanLabel: "Ètò tó ń ṣiṣẹ́",
        changePlanBadge: "Ayípadà ètò",
      },
      meta: {
        planLabel: "Ètò",
        priceLabel: "Iye owó",
        priceInactive: "Iye owó kò ṣiṣẹ́",
      },
      cards: {
        fallbackDescription:
          "Ìṣàn oníwun fún iṣẹ́ yìí ń ṣiṣẹ́, o sì lè tẹ̀síwájú sí ìpele tó kàn.",
        lockedFooter:
          "O kò lè tẹ̀síwájú pẹ̀lú iṣẹ́ yìí títí tí profaili àti ìfọwọ́sí fóònù yóò fi parí",
        activeFooterFallback:
          "Ìforúkọsílẹ̀ owó oṣù tó ń ṣiṣẹ́ wà ní ààyè",
        activeFooterWithDate: "Ń ṣiṣẹ́ títí di • {paidUntil}",
        billingFooter:
          "Lẹ́yìn tí o bá yan iṣẹ́ yìí, ìgbésẹ̀ tó kàn ni billing",
        planChangeFooter:
          "Billing jẹ́ dandan fún ètò tí a yàn",
        planChangeFooterWithActivePlan:
          "Ètò tó ń ṣiṣẹ́: {activePlanLabel} • Billing jẹ́ dandan fún ètò tí a yàn",
        titleFallback: "Iṣẹ́",
      },
      selection: {
        flowLabel: "Ìṣàn tí a yàn",
        notSelected: "A kò tíì yan iṣẹ́ kankan",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Láti tẹ̀síwájú, kọ́kọ́ yan iṣẹ́ kan láti òkè.",
        billingCompletedFlow:
          "Ìforúkọsílẹ̀ owó oṣù tó ń ṣiṣẹ́ ń hàn fún ètò tí a yàn fún iṣẹ́ yìí. Billing ti parí tẹ́lẹ̀, tẹ̀síwájú yóò sì ṣí pánẹ́ẹ̀lì náà.",
        billingPendingFlow:
          "A ti yan iṣẹ́ náà. Ìgbésẹ̀ tó kàn ni billing. Pánẹ́ẹ̀lì náà kò ní di mímuṣiṣẹ́ títí tí ìsanwó yóò fi parí ní aṣeyọrí.",
        planChangeMessage:
          "O ní ìforúkọsílẹ̀ owó oṣù tó ń ṣiṣẹ́ báyìí fún ètò {activePlanLabel}. Tí o bá ṣe àtúnṣe ìforúkọsílẹ̀ owó oṣù sí ètò {targetPlanLabel}, a máa fagilé ètò tó ń ṣiṣẹ́ tẹ́lẹ̀, a ó sì mú ètò {targetPlanLabel} ṣiṣẹ́ fún ọjọ́ 30 tó kàn.",
        resetService: "Tún iṣẹ́ ṣe",
        chooseServiceButton: "Yan iṣẹ́",
        changePlanButton:
          "Lọ sí billing kí o sì ṣe àtúnṣe ètò",
        goToProfile: "Lọ sí ojú-ìwé profaili",
        goToDashboard: "Lọ sí pánẹ́ẹ̀lì",
        goToBilling: "Lọ sí billing",
        redirecting: "A ń darí ọ lọ...",
      },
      status: {
        profileRequired: "Profaili jẹ́ dandan",
        phoneRequired: "Ìfọwọ́sí fóònù ń dúró",
        active: "Ń ṣiṣẹ́",
        billingRequired: "Billing jẹ́ dandan",
        serviceSelection: "Yíyan iṣẹ́",
        planChangeRequired: "Ayípadà ètò jẹ́ dandan",
      },
      errors: {
        ownerNotFoundLoadError: "A kò rí profaili oníwun.",
        servicesLoadErrorFallback: "A kò lè gbé àwọn iṣẹ́ wọlé",
        servicesLoadErrorWithStatus:
          "A kò lè gbé àwọn iṣẹ́ wọlé (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;