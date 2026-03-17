import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const filMessages = {
  common: {
    brand: {
      homeAriaLabel: "Pangunahing pahina",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Pagpili ng wika",
      selectorMenuAriaLabel: "Menu ng pagpili ng wika",
      currentLocaleTitle: "Kasalukuyang wika: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Dashboard ng may-ari",
        checkingContext: "Sinusuri ang konteksto ng serbisyo...",
        subtitle:
          "Magbubukas lamang ang dashboard matapos makumpleto ang onboarding ng may-ari at ang daloy ng subscription. Ipinapakita sa ibaba ang aktibong serbisyo, plano, at katayuan ng access.",
      },
      summary: {
        activeServiceLabel: "Aktibong serbisyo",
        ownerLabel: "May-ari",
        paidUntilLabel: "Bayad hanggang",
        loadingStatus: "Sinusuri ang katayuan...",
        activeServiceFallback: "Walang nahanap na aktibong serbisyo",
        serviceGenericLabel: "Serbisyo",
      },
      notes: {
        loading: "Sinusuri ang katayuan...",
        active:
          "Tandaan: gumagana ang mga link sa dashboard gamit ang napiling konteksto ng serbisyo. Ang paggawa, pag-edit, at pagbura ng listing ay pinagsama sa seksyong Aking mga listing.",
        locked:
          "Tandaan: sadyang naka-lock ang dashboard sa yugtong ito. Gamitin ang action button sa itaas para sa susunod na hakbang.",
      },
      errors: {
        prefix: "Error",
        dashboardStateLoadFailed:
          "Hindi ma-load ang estado ng dashboard.",
        completeOwnerProfileFirst:
          "Kumpletuhin muna ang profile ng may-ari.",
        phoneVerificationRequired:
          "Dapat makumpleto ang beripikasyon ng telepono.",
        serviceSelectionRequired:
          "Dapat munang makumpleto ang pagpili ng serbisyo.",
        activeSubscriptionNotFound:
          "Walang nahanap na aktibong subscription.",
        serviceNotFoundOrInactive:
          "Hindi nakita ang serbisyo o hindi ito aktibo.",
        serverErrorOccurred:
          "Nagkaroon ng error sa server. Pakisubukang muli mamaya.",
        ownerIdentityRequired:
          "Kumpletuhin muna ang profile ng may-ari.",
      },
      cards: {
        properties: {
          title: "Aking mga listing",
          text: "Tingnan ang lahat ng listing, gumawa ng bagong listing, i-edit ang mga aktibong listing, at burahin ang mga ito.",
        },
        profile: {
          title: "Detalye ng profile",
          text: "Pamahalaan ang iyong pangalan, numero ng telepono, at iba pang detalye ng profile.",
        },
        billing: {
          title: "Subscription at bayarin",
          text: "Suriin ang katayuan at magpatuloy sa daloy ng pagbabayad.",
        },
        bookings: {
          title: "Mga kahilingan sa booking",
          text: "Aprubahan o tanggihan ang mga papasok na kahilingan.",
        },
        lockedChip: "Naka-lock",
        lockedDescriptions: {
          profile:
            "Nananatiling naka-lock ang seksyong ito sa loob ng dashboard. Gamitin ang action button sa itaas upang buksan ang pahina ng profile.",
          billing:
            "Sa yugtong ito, binubuksan ang seksyon ng subscription sa pamamagitan ng action button. Nananatiling naka-lock ang card sa dashboard.",
          properties:
            "Magiging available lamang ang paggawa, pag-edit, at pagbura ng mga listing matapos makumpleto ang onboarding ng may-ari at ang subscription.",
          default:
            "Hindi available ang seksyong ito hangga't hindi natatapos ang onboarding ng may-ari at subscription.",
        },
      },
      states: {
        profileRequired: {
          badge: "Naka-lock ang dashboard",
          title: "Kinakailangan ang profile ng may-ari",
          description:
            "Upang magamit ang mga serbisyo, kailangan munang ilagay ang impormasyon ng may-ari. Hangga't hindi kumpleto ang profile, mananatiling naka-lock ang dashboard, billing, at iba pang seksyon.",
          cta: "Pumunta sa pahina ng profile",
        },
        phoneVerificationRequired: {
          badge: "Kinakailangan ang OTP verification",
          title: "Hindi beripikado ang telepono",
          description:
            "Nagawa ang profile bilang draft, ngunit hindi ituturing na aktibo ang may-ari hangga't hindi nabeberipika ang telepono gamit ang OTP. Mananatiling naka-lock ang dashboard at iba pang kakayahan ng may-ari.",
          cta: "Pumunta sa profile at tapusin ang beripikasyon",
        },
        serviceSelectionRequired: {
          badge: "Kinakailangan ang pagpili ng serbisyo",
          title: "Kumpletuhin muna ang hakbang ng mga serbisyo",
          description:
            "Pagkatapos makumpleto ang profile, dapat munang bumalik ang may-ari sa seksyon ng mga serbisyo. Mananatiling naka-lock ang dashboard sa yugtong ito.",
          cta: "Pumunta sa mga serbisyo",
        },
        subscriptionRequired: {
          badge: "Kinakailangan ang subscription",
          title: "Walang aktibong subscription",
          description:
            "Napili na ang isang serbisyo, ngunit hindi pa tapos ang bayad o hindi aktibo ang subscription. Mananatiling naka-lock ang dashboard at mabablock din ang iba pang proseso ng may-ari.",
          cta: "Pumunta sa subscription",
        },
        active: {
          badge: "Aktibo",
          title: "Bukas ang dashboard",
          description:
            "Aktibo ang subscription. Maaaring gumawa ng listing ang may-ari, pamahalaan ang mga listing, iproseso ang mga kahilingan sa booking, at gamitin nang buo ang sistema.",
          cta: "Tingnan ang mga serbisyo",
        },
      },
      meta: {
        serviceCodeLabel: "Code ng serbisyo",
        planLabel: "Plano",
        accessLabel: "Katayuan ng access",
        planStandardLabel: "Standard",
        planPlusLabel: "Plus",
        accessActiveLabel: "Bukas",
        accessLockedLabel: "Naka-lock",
      },
      services: {
        RENT_HOME: "Paupa ng bahay",
        BARBER: "Barbero",
        CAR_RENTAL: "Paupa ng kotse",
        HOTEL: "Hotel",
        BEAUTY_SALON: "Salon ng kagandahan",
        BABYSITTER: "Yaya",
        CLEANING: "Mga serbisyo sa paglilinis",
        TECHNICAL_SERVICES: "Mga serbisyong teknikal",
      },
    },
    services: {
      hero: {
        pageTitle: "Pagpili ng serbisyo",
        lockedDescription:
          "Ang pahinang ito ang entry point ng onboarding ng may-ari. Hangga't hindi pa kumpleto ang profile at beripikasyon ng telepono, mananatiling naka-lock ang daloy ng serbisyo, billing, at dashboard.",
        activeDescription:
          "Pumili muna ng plano, pagkatapos ay piliin ang serbisyong gusto mong ipagpatuloy. Kung walang aktibong subscription, billing ang susunod na hakbang. Magbubukas lamang ang dashboard pagkatapos ng matagumpay na billing.",
        currentStateLabel: "Kasalukuyang katayuan",
      },
      summary: {
        previewMode: "Nasa preview mode ang mga serbisyo",
        selectedPlanOnly: "{planLabel} na plano",
        selectedPlanWithStatus: "{planLabel} na plano • {statusLabel}",
        activePlanWithStatus:
          "Aktibong plano: {activePlanLabel} • {statusLabel}",
        billingCompleted: "kumpleto na ang billing",
        billingPending: "nakabinbin ang billing",
        planChangePending: "kailangan ang billing para sa pagbabago ng plano",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "Kinakailangan ang profile ng may-ari",
          message:
            "Upang magamit ang mga serbisyo, kailangan mo munang ilagay ang detalye ng may-ari. Hangga't hindi pa kumpleto ang profile, mananatiling naka-lock ang billing at dashboard.",
          cta: "Pumunta sa pahina ng profile",
        },
        phoneVerificationRequired: {
          title: "Kinakailangan ang beripikasyon ng telepono",
          message:
            "Nai-save na ang profile, ngunit kailangang beripikahin ang telepono gamit ang OTP. Hangga't hindi pa natatapos ang beripikasyon ng telepono, mananatiling nasa preview mode ang pagpili ng serbisyo at mananatiling naka-lock ang billing / dashboard.",
          cta: "Pumunta sa profile at tapusin ang beripikasyon",
        },
      },
      plans: {
        stepLabel: "Hakbang 1",
        title: "Pumili ng plano",
        activeDescription:
          "Magiging aktibo lamang ang pagpili ng plano matapos makumpleto ang profile at beripikasyon ng telepono.",
        lockedDescription:
          "Para sa preview lamang ang mga card ng plano sa ngayon. Hindi ka makakapagpatuloy hangga't hindi pa kumpleto ang profile at beripikasyon ng telepono.",
        standard: {
          label: "Standard",
          badge: "Buwanang plano",
          description:
            "Isang simple at matatag na pagpipilian para sa pangunahing daloy ng may-ari.",
          helper: "Ipinapakita ang mga listing sa standard na ayos.",
        },
        plus: {
          label: "Plus",
          badge: "Prayoridad na visibility",
          description:
            "Mas mataas na visibility sa loob ng parehong kategorya at mga filter.",
          helper: "Mas nauunang ipinapakita ang mga Plus listing kaysa sa mga Standard listing.",
        },
        selectedChip: "Napili",
        lockedNote:
          "Naka-lock ang pagpili ng plano hanggang makumpleto ang profile",
      },
      serviceList: {
        stepLabel: "Hakbang 2",
        title: "Pumili ng serbisyo",
        activeDescription:
          "Pagkatapos pumili ng serbisyo, billing ang susunod na hakbang. Para sa mga serbisyong may aktibong subscription, magiging available lamang ang direktang access sa dashboard para sa aktibong planong iyon.",
        lockedDescription:
          "Hangga't hindi pa kumpleto ang onboarding ng may-ari, mananatiling nasa preview mode ang pagpili ng serbisyo at mabablock ang pagpapatuloy.",
        carouselAria: "Mag-navigate sa pagitan ng mga serbisyo",
        previousServices: "Mga nakaraang serbisyo",
        nextServices: "Mga susunod na serbisyo",
        loadingServices:
          "Pansamantalang hindi ma-load ang mga serbisyo. Pakisubukang muli mamaya.",
        requestTimeout:
          "Nag-time out ang kahilingan. Hindi tumugon ang backend.",
        noServices: "Walang nahanap na serbisyo.",
        profileCompletionInfo:
          "Magiging aktibo dito ang pagpili ng serbisyo matapos makumpleto ang profile at beripikasyon ng telepono.",
      },
      badges: {
        activeSubscription: "Aktibong subscription",
        continueWithPlus: "Magpatuloy gamit ang Plus",
        continueWithStandard: "Magpatuloy gamit ang Standard",
        selected: "Napili",
        activePlanLabel: "Aktibong plano",
        changePlanBadge: "Pagbabago ng plano",
      },
      meta: {
        planLabel: "Plano",
        priceLabel: "Presyo",
        priceInactive: "Hindi aktibo ang presyo",
      },
      cards: {
        fallbackDescription:
          "Aktibo ang daloy ng may-ari para sa serbisyong ito at maaari kang magpatuloy sa susunod na yugto.",
        lockedFooter:
          "Hindi ka makakapagpatuloy sa serbisyong ito hangga't hindi pa kumpleto ang profile at beripikasyon ng telepono",
        activeFooterFallback: "May available na aktibong subscription",
        activeFooterWithDate: "Aktibo hanggang • {paidUntil}",
        billingFooter:
          "Pagkatapos piliin ang serbisyong ito, billing ang susunod na hakbang",
        planChangeFooter:
          "Kailangan ang billing para sa napiling plano",
        planChangeFooterWithActivePlan:
          "Aktibong plano: {activePlanLabel} • Kailangan ang billing para sa napiling plano",
        titleFallback: "Serbisyo",
      },
      selection: {
        flowLabel: "Napiling daloy",
        notSelected: "Walang napiling serbisyo",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Upang magpatuloy, pumili muna ng isang serbisyo sa itaas.",
        billingCompletedFlow:
          "May nakikitang aktibong subscription para sa napiling plano ng serbisyong ito. Kumpleto na ang billing, at bubuksan ng pagpapatuloy ang dashboard.",
        billingPendingFlow:
          "Napili na ang serbisyo. Billing ang susunod na hakbang. Hindi magiging aktibo ang dashboard hangga't hindi matagumpay na nakukumpleto ang bayad.",
        planChangeMessage:
          "Mayroon ka ngayong aktibong subscription para sa planong {activePlanLabel}. Kung ia-update mo ang subscription sa planong {targetPlanLabel}, makakansela ang nakaraang aktibong plano at maa-activate ang planong {targetPlanLabel} para sa susunod na 30 araw.",
        resetService: "I-reset ang serbisyo",
        chooseServiceButton: "Pumili ng serbisyo",
        changePlanButton: "Pumunta sa billing at i-update ang plano",
        goToProfile: "Pumunta sa pahina ng profile",
        goToDashboard: "Pumunta sa dashboard",
        goToBilling: "Pumunta sa billing",
        redirecting: "Nire-redirect...",
      },
      status: {
        profileRequired: "Kinakailangan ang profile",
        phoneRequired: "Nakabinbin ang beripikasyon ng telepono",
        active: "Aktibo",
        billingRequired: "Kinakailangan ang billing",
        serviceSelection: "Pagpili ng serbisyo",
        planChangeRequired: "Kinakailangan ang pagbabago ng plano",
      },
      errors: {
        ownerNotFoundLoadError: "Hindi nahanap ang profile ng may-ari.",
        servicesLoadErrorFallback: "Hindi ma-load ang mga serbisyo",
        servicesLoadErrorWithStatus:
          "Hindi ma-load ang mga serbisyo (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;