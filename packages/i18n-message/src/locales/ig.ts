import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const igMessages = {
  common: {
    brand: {
      homeAriaLabel: "Ibe mbido",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Nhọrọ asụsụ",
      selectorMenuAriaLabel: "Ndepụta nhọrọ asụsụ",
      currentLocaleTitle: "Asụsụ ugbu a: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Dashboard nke onye nwe ya",
        checkingContext: "A na-enyocha ọnọdụ ọrụ...",
        subtitle:
          "Dashboard ahụ ga-emeghe naanị mgbe emechara onboarding nke onye nwe ya na usoro ndebanye aha. A na-egosi ọrụ dị irè, atụmatụ, na ọnọdụ ohere n'okpuru.",
      },
      summary: {
        activeServiceLabel: "Ọrụ dị irè",
        ownerLabel: "Onye nwe ya",
        paidUntilLabel: "A kwụrụ ruo",
        loadingStatus: "A na-enyocha ọnọdụ...",
        activeServiceFallback: "Achọtaghị ọrụ dị irè ọ bụla",
        serviceGenericLabel: "Ọrụ",
      },
      notes: {
        loading: "A na-enyocha ọnọdụ...",
        active:
          "Rịba ama: njikọ dị na dashboard na-arụ ọrụ site na ọnọdụ ọrụ a họrọrọ. Usoro imepụta, idezi, na ihichapụ ndepụta ejikọtala n'ime ngalaba Ndepụta m.",
        locked:
          "Rịba ama: dashboard a ka e mechiri n'ụzọ a tụrụ atụmatụ na ogbo a. Jiri bọtịnụ omume dị n'elu maka nzọụkwụ ọzọ.",
      },
      errors: {
        prefix: "Njehie",
        dashboardStateLoadFailed:
          "Enweghị ike ibudata ọnọdụ dashboard.",
        completeOwnerProfileFirst:
          "Biko mezue profaịlụ onye nwe ya tupu mbụ.",
        phoneVerificationRequired:
          "A ga-emecha nkwenye ekwentị.",
        serviceSelectionRequired:
          "A ga-emecha ịhọrọ ọrụ tupu mbụ.",
        activeSubscriptionNotFound:
          "Achọtaghị ndebanye aha dị irè.",
        serviceNotFoundOrInactive:
          "Achọtaghị ọrụ ahụ ma ọ bụ na ọ naghị arụ ọrụ.",
        serverErrorOccurred:
          "Njehie sava mere. Biko nwaa ọzọ n'oge ọzọ.",
        ownerIdentityRequired:
          "Biko mezue profaịlụ onye nwe ya tupu mbụ.",
      },
      cards: {
        properties: {
          title: "Ndepụta m",
          text: "Lee ndepụta gị niile, mepụta ndepụta ọhụrụ, dezie ndepụta ndị na-arụ ọrụ, ma hichapụ ha.",
        },
        profile: {
          title: "Nkọwa profaịlụ",
          text: "Jikwaa aha gị, nọmba ekwentị, na nkọwa profaịlụ ndị ọzọ.",
        },
        billing: {
          title: "Ndebanye aha na ịkwụ ụgwọ",
          text: "Lelee ọnọdụ ma gaa n'ihu na usoro ịkwụ ụgwọ.",
        },
        bookings: {
          title: "Arịrịọ ntinye akwụkwọ",
          text: "Kwenye ma ọ bụ jụ arịrịọ ndị na-abata.",
        },
        lockedChip: "Akpọchiri",
        lockedDescriptions: {
          profile:
            "Ngalaba a ka na-anọchi akpọchiri n'ime dashboard. Jiri bọtịnụ omume dị n'elu mepee ibe profaịlụ.",
          billing:
            "N'ogbo a, a na-emeghe ngalaba ndebanye aha site na bọtịnụ omume. Kaadị dashboard ahụ ka na-anọchi akpọchiri.",
          properties:
            "Imepụta, idezi, na ihichapụ ndepụta ga-adị naanị mgbe emechara onboarding nke onye nwe ya na ndebanye aha.",
          default:
            "Ngalaba a agaghị adị ruo mgbe emechara onboarding nke onye nwe ya na ndebanye aha.",
        },
      },
      states: {
        profileRequired: {
          badge: "Dashboard akpọchiri",
          title: "A chọrọ profaịlụ onye nwe ya",
          description:
            "Iji jiri ọrụ, ị ga-ebu ụzọ tinye ozi onye nwe ya. Ruo mgbe a ga-emecha profaịlụ ahụ, dashboard, ịkwụ ụgwọ, na ngalaba ndị ọzọ ga-anọgide akpọchiri.",
          cta: "Gaa na ibe profaịlụ",
        },
        phoneVerificationRequired: {
          badge: "A chọrọ nkwenye OTP",
          title: "Ekwentị ahụ anaghị akwado",
          description:
            "E mepụtara profaịlụ ahụ dịka draft, mana a gaghị ewere onye nwe ya dị ka onye na-arụ ọrụ ruo mgbe ekwentị ahụ ga-akwado site na OTP. Dashboard na ikike ndị ọzọ nke onye nwe ya ga-anọgide akpọchiri.",
          cta: "Gaa na profaịlụ ma mezue nkwenye",
        },
        serviceSelectionRequired: {
          badge: "A chọrọ ịhọrọ ọrụ",
          title: "Biko mezue nzọụkwụ ọrụ tupu mbụ",
          description:
            "Mgbe emechara profaịlụ, onye nwe ya ga-ebu ụzọ laghachi na ngalaba ọrụ. Dashboard ahụ ka na-anọchi akpọchiri n'ogbo a.",
          cta: "Gaa na ọrụ",
        },
        subscriptionRequired: {
          badge: "A chọrọ ndebanye aha",
          title: "Enweghị ndebanye aha dị irè",
          description:
            "A họrọla otu ọrụ, mana akwụghị ụgwọ ahụ ma ọ bụ ndebanye aha ahụ anaghị arụ ọrụ. Dashboard ahụ ga-anọgide akpọchiri, a ga-egbochikwa usoro ndị ọzọ nke onye nwe ya.",
          cta: "Gaa na ndebanye aha",
        },
        active: {
          badge: "Na-arụ ọrụ",
          title: "Dashboard emegheela",
          description:
            "Ndebanye aha ahụ na-arụ ọrụ. Onye nwe ya nwere ike imepụta ndepụta, jikwaa ndepụta, hazie arịrịọ ntinye akwụkwọ, ma jiri usoro ahụ n'ụzọ zuru ezu.",
          cta: "Lee ọrụ",
        },
      },
      meta: {
        serviceCodeLabel: "Koodu ọrụ",
        planLabel: "Atụmatụ",
        accessLabel: "Ọnọdụ ohere",
        planStandardLabel: "Standard",
        planPlusLabel: "Plus",
        accessActiveLabel: "Emeghe",
        accessLockedLabel: "Akpọchiri",
      },
      services: {
        RENT_HOME: "Mgbazinye ụlọ",
        BARBER: "Barber",
        CAR_RENTAL: "Mgbazinye ụgbọ ala",
        HOTEL: "Ụlọ nkwari akụ",
        BEAUTY_SALON: "Ụlọ mma",
        BABYSITTER: "Onye na-elekọta nwa",
        CLEANING: "Ọrụ nhicha",
        TECHNICAL_SERVICES: "Ọrụ teknụzụ",
      },
    },
    services: {
      hero: {
        pageTitle: "Nhọrọ ọrụ",
        lockedDescription:
          "Ibe a bụ ebe mbido onboarding nke onye nwe ya. Ruo mgbe a ga-emecha profaịlụ na nkwenye ekwentị, usoro ọrụ, billing, na dashboard ga-anọgide akpọchiri.",
        activeDescription:
          "Họrọ atụmatụ mbụ, mgbe ahụ họrọ ọrụ ịchọrọ iji gaa n'ihu. Ọ bụrụ na enweghị ndebanye aha dị irè, nzọụkwụ na-esote bụ billing. Dashboard ga-emeghe naanị mgbe billing gachara nke ọma.",
        currentStateLabel: "Ọnọdụ ugbu a",
      },
      summary: {
        previewMode: "Ọrụ dị na ọnọdụ preview",
        selectedPlanOnly: "Atụmatụ {planLabel}",
        selectedPlanWithStatus: "Atụmatụ {planLabel} • {statusLabel}",
        activePlanWithStatus:
          "Atụmatụ dị irè: {activePlanLabel} • {statusLabel}",
        billingCompleted: "billing agwụla",
        billingPending: "a ka na-eche billing",
        planChangePending:
          "a chọrọ billing maka mgbanwe atụmatụ",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "A chọrọ profaịlụ onye nwe ya",
          message:
            "Iji jiri ọrụ, ị ga-ebu ụzọ tinye nkọwa onye nwe ya. Ruo mgbe a ga-emecha profaịlụ ahụ, billing na dashboard ga-anọgide akpọchiri.",
          cta: "Gaa na ibe profaịlụ",
        },
        phoneVerificationRequired: {
          title: "A chọrọ nkwenye ekwentị",
          message:
            "A zọpụtala profaịlụ ahụ, mana a ga-akwado ekwentị ahụ site na OTP. Ruo mgbe nkwenye ekwentị ga-ezu, nhọrọ ọrụ ga-anọgide na ọnọdụ preview, billing / dashboard ga-anọgidekwa akpọchiri.",
          cta: "Gaa na profaịlụ ma mezue nkwenye",
        },
      },
      plans: {
        stepLabel: "Nzọụkwụ 1",
        title: "Họrọ atụmatụ",
        activeDescription:
          "Nhọrọ atụmatụ ga-arụ ọrụ naanị mgbe emechara profaịlụ na nkwenye ekwentị.",
        lockedDescription:
          "Kaadị atụmatụ dị ugbu a bụ naanị maka preview. Ị gaghị enwe ike ịga n'ihu ruo mgbe emechara profaịlụ na nkwenye ekwentị.",
        standard: {
          label: "Standard",
          badge: "Atụmatụ kwa ọnwa",
          description:
            "Nhọrọ dị mfe ma kwụsie ike maka isi usoro onye nwe ya.",
          helper:
            "A na-egosi ndepụta n'usoro Standard.",
        },
        plus: {
          label: "Plus",
          badge: "Ngosipụta nwere mbu ụzọ",
          description:
            "Ngosipụta ka elu n'ime otu ụdị na otu filters.",
          helper:
            "A na-egosi ndepụta Plus tupu ndepụta Standard.",
        },
        selectedChip: "A họrọla",
        lockedNote:
          "A na-akpọchi nhọrọ atụmatụ ruo mgbe profaịlụ ga-ezu",
      },
      serviceList: {
        stepLabel: "Nzọụkwụ 2",
        title: "Họrọ ọrụ",
        activeDescription:
          "Mgbe ịhọrọchara ọrụ, nzọụkwụ na-esote bụ billing. Maka ọrụ ndị nwere ndebanye aha dị irè, ohere ozugbo na dashboard ga-adị naanị maka atụmatụ ahụ dị irè.",
        lockedDescription:
          "Ruo mgbe onboarding nke onye nwe ya ga-ezu, nhọrọ ọrụ ga-anọgide na ọnọdụ preview, a ga-egbochikwa ịga n'ihu.",
        carouselAria: "Gagharịa n'etiti ọrụ",
        previousServices: "Ọrụ gara aga",
        nextServices: "Ọrụ na-esote",
        loadingServices:
          "Enweghị ike ibudata ọrụ nwa oge. Biko nwaa ọzọ mgbe e mesịrị.",
        requestTimeout:
          "Oge arịrịọ ahụ agwụla. Backend azaghị.",
        noServices: "Achọtaghị ọrụ ọ bụla.",
        profileCompletionInfo:
          "Nhọrọ ọrụ ga-arụ ọrụ ebe a mgbe emechara profaịlụ na nkwenye ekwentị.",
      },
      badges: {
        activeSubscription: "Ndebanye aha dị irè",
        continueWithPlus: "Gaa n'ihu na Plus",
        continueWithStandard: "Gaa n'ihu na Standard",
        selected: "A họrọla",
        activePlanLabel: "Atụmatụ dị irè",
        changePlanBadge: "Mgbanwe atụmatụ",
      },
      meta: {
        planLabel: "Atụmatụ",
        priceLabel: "Ọnụahịa",
        priceInactive: "Ọnụahịa adịghị arụ ọrụ",
      },
      cards: {
        fallbackDescription:
          "Usoro onye nwe ya maka ọrụ a na-arụ ọrụ ma ị nwere ike ịga n'ihu na ogbo ọzọ.",
        lockedFooter:
          "Ị gaghị enwe ike ịga n'ihu na ọrụ a ruo mgbe emechara profaịlụ na nkwenye ekwentị",
        activeFooterFallback:
          "Ndebanye aha dị irè dị",
        activeFooterWithDate: "Na-arụ ọrụ ruo • {paidUntil}",
        billingFooter:
          "Mgbe ịhọrọchara ọrụ a, nzọụkwụ na-esote ga-abụ billing",
        planChangeFooter:
          "A chọrọ billing maka atụmatụ a họrọrọ",
        planChangeFooterWithActivePlan:
          "Atụmatụ dị irè: {activePlanLabel} • A chọrọ billing maka atụmatụ a họrọrọ",
        titleFallback: "Ọrụ",
      },
      selection: {
        flowLabel: "Usoro a họrọrọ",
        notSelected: "Enweghị ọrụ a họrọrọ",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Iji gaa n'ihu, buru ụzọ họrọ otu ọrụ n'elu.",
        billingCompletedFlow:
          "A na-ahụ ndebanye aha dị irè maka atụmatụ a họrọrọ nke ọrụ a. Billing agwụla, ịga n'ihu ga-emepe dashboard.",
        billingPendingFlow:
          "A họrọla ọrụ ahụ. Nzọụkwụ na-esote bụ billing. Dashboard agaghị arụ ọrụ ruo mgbe akwụchara ụgwọ nke ọma.",
        planChangeMessage:
          "Ị nwere ugbu a ndebanye aha dị irè maka atụmatụ {activePlanLabel}. Ọ bụrụ na ị melite ndebanye aha ahụ gaa na atụmatụ {targetPlanLabel}, a ga-akagbu atụmatụ mbụ dị irè, a ga-eme ka atụmatụ {targetPlanLabel} rụọ ọrụ maka ụbọchị 30 na-esote.",
        resetService: "Tọgharịa ọrụ",
        chooseServiceButton: "Họrọ ọrụ",
        changePlanButton:
          "Gaa na billing ma melite atụmatụ",
        goToProfile: "Gaa na ibe profaịlụ",
        goToDashboard: "Gaa na dashboard",
        goToBilling: "Gaa na billing",
        redirecting: "A na-ebugharị...",
      },
      status: {
        profileRequired: "A chọrọ profaịlụ",
        phoneRequired: "Nkwenye ekwentị ka na-echere",
        active: "Na-arụ ọrụ",
        billingRequired: "A chọrọ billing",
        serviceSelection: "Nhọrọ ọrụ",
        planChangeRequired: "A chọrọ mgbanwe atụmatụ",
      },
      errors: {
        ownerNotFoundLoadError:
          "Achọtaghị profaịlụ onye nwe ya.",
        servicesLoadErrorFallback:
          "Enweghị ike ibudata ọrụ",
        servicesLoadErrorWithStatus:
          "Enweghị ike ibudata ọrụ (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;