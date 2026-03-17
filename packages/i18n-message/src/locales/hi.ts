import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const hiMessages = {
  common: {
    brand: {
      homeAriaLabel: "मुखपृष्ठ",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "भाषा चयन",
      selectorMenuAriaLabel: "भाषा चयन मेनू",
      currentLocaleTitle: "वर्तमान भाषा: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "मालिक डैशबोर्ड",
        checkingContext: "सेवा संदर्भ जाँचा जा रहा है...",
        subtitle:
          "डैशबोर्ड केवल तब खुलता है जब मालिक ऑनबोर्डिंग और सदस्यता प्रक्रिया पूरी हो जाती है। सक्रिय सेवा, योजना और पहुँच की स्थिति नीचे दिखाई गई है।",
      },
      summary: {
        activeServiceLabel: "सक्रिय सेवा",
        ownerLabel: "मालिक",
        paidUntilLabel: "भुगतान मान्य तिथि",
        loadingStatus: "स्थिति जाँची जा रही है...",
        activeServiceFallback: "कोई सक्रिय सेवा नहीं मिली",
        serviceGenericLabel: "सेवा",
      },
      notes: {
        loading: "स्थिति जाँची जा रही है...",
        active:
          "नोट: डैशबोर्ड लिंक चुने गए सेवा संदर्भ के साथ काम करते हैं। लिस्टिंग बनाना, संपादित करना और हटाना अब मेरी लिस्टिंग्स अनुभाग में एकीकृत है।",
        locked:
          "नोट: इस चरण में डैशबोर्ड जानबूझकर लॉक रखा गया है। अगले चरण के लिए ऊपर दिया गया एक्शन बटन उपयोग करें।",
      },
      errors: {
        prefix: "त्रुटि",
        dashboardStateLoadFailed: "डैशबोर्ड की स्थिति लोड नहीं हो सकी।",
        completeOwnerProfileFirst: "पहले मालिक की प्रोफ़ाइल पूरी करें।",
        phoneVerificationRequired: "फ़ोन सत्यापन पूरा करना आवश्यक है।",
        serviceSelectionRequired: "पहले सेवा चयन पूरा करना आवश्यक है।",
        activeSubscriptionNotFound: "कोई सक्रिय सदस्यता नहीं मिली।",
        serviceNotFoundOrInactive: "सेवा नहीं मिली या सक्रिय नहीं है।",
        serverErrorOccurred:
          "सर्वर त्रुटि हुई। कृपया कुछ देर बाद फिर प्रयास करें।",
        ownerIdentityRequired: "पहले मालिक की प्रोफ़ाइल पूरी करें।",
      },
      cards: {
        properties: {
          title: "मेरी लिस्टिंग्स",
          text: "अपनी सभी लिस्टिंग्स देखें, नई लिस्टिंग बनाएँ, सक्रिय लिस्टिंग्स संपादित करें और उन्हें हटाएँ।",
        },
        profile: {
          title: "प्रोफ़ाइल विवरण",
          text: "अपना नाम, फ़ोन नंबर और अन्य प्रोफ़ाइल विवरण प्रबंधित करें।",
        },
        billing: {
          title: "सदस्यता और भुगतान",
          text: "स्थिति जाँचें और भुगतान प्रक्रिया पर जाएँ।",
        },
        bookings: {
          title: "बुकिंग अनुरोध",
          text: "आने वाले अनुरोधों को स्वीकार या अस्वीकार करें।",
        },
        lockedChip: "लॉक्ड",
        lockedDescriptions: {
          profile:
            "यह अनुभाग डैशबोर्ड के भीतर लॉक रहेगा। प्रोफ़ाइल पृष्ठ खोलने के लिए ऊपर दिया गया एक्शन बटन उपयोग करें।",
          billing:
            "इस चरण में सदस्यता अनुभाग एक्शन बटन के माध्यम से खुलता है। डैशबोर्ड कार्ड लॉक रहता है।",
          properties:
            "लिस्टिंग बनाना, संपादित करना और हटाना केवल मालिक ऑनबोर्डिंग और सदस्यता पूरी होने के बाद उपलब्ध होता है।",
          default:
            "यह अनुभाग मालिक ऑनबोर्डिंग और सदस्यता पूरी होने तक उपलब्ध नहीं है।",
        },
      },
      states: {
        profileRequired: {
          badge: "डैशबोर्ड लॉक है",
          title: "मालिक प्रोफ़ाइल आवश्यक है",
          description:
            "सेवाओं का उपयोग करने के लिए पहले मालिक की जानकारी भरना आवश्यक है। जब तक प्रोफ़ाइल पूरी नहीं होती, डैशबोर्ड, बिलिंग और अन्य अनुभाग लॉक रहेंगे।",
          cta: "प्रोफ़ाइल पृष्ठ पर जाएँ",
        },
        phoneVerificationRequired: {
          badge: "OTP सत्यापन आवश्यक है",
          title: "फ़ोन सत्यापित नहीं है",
          description:
            "प्रोफ़ाइल ड्राफ़्ट के रूप में बनाई गई है, लेकिन OTP द्वारा फ़ोन सत्यापन पूरा होने तक मालिक को सक्रिय नहीं माना जाएगा। डैशबोर्ड और अन्य मालिक सुविधाएँ लॉक रहेंगी।",
          cta: "प्रोफ़ाइल पर जाएँ और सत्यापन पूरा करें",
        },
        serviceSelectionRequired: {
          badge: "सेवा चयन आवश्यक है",
          title: "पहले सेवा चरण पूरा करें",
          description:
            "प्रोफ़ाइल पूरी होने के बाद मालिक को पहले सेवा अनुभाग में वापस जाना होगा। इस चरण में डैशबोर्ड लॉक रहेगा।",
          cta: "सेवाओं पर जाएँ",
        },
        subscriptionRequired: {
          badge: "सदस्यता आवश्यक है",
          title: "कोई सक्रिय सदस्यता नहीं है",
          description:
            "एक सेवा चुनी गई है, लेकिन भुगतान पूरा नहीं हुआ है या सदस्यता सक्रिय नहीं है। डैशबोर्ड लॉक रहेगा और मालिक की अन्य प्रक्रियाएँ भी अवरुद्ध रहेंगी।",
          cta: "सदस्यता पर जाएँ",
        },
        active: {
          badge: "सक्रिय",
          title: "डैशबोर्ड खुला है",
          description:
            "सदस्यता सक्रिय है। मालिक लिस्टिंग बना सकता है, लिस्टिंग्स प्रबंधित कर सकता है, बुकिंग अनुरोधों को संभाल सकता है और सिस्टम का पूर्ण उपयोग कर सकता है।",
          cta: "सेवाएँ देखें",
        },
      },
      meta: {
        serviceCodeLabel: "सेवा कोड",
        planLabel: "योजना",
        accessLabel: "पहुँच की स्थिति",
        planStandardLabel: "स्टैंडर्ड",
        planPlusLabel: "प्लस",
        accessActiveLabel: "खुला",
        accessLockedLabel: "लॉक्ड",
      },
      services: {
        RENT_HOME: "घर किराया",
        BARBER: "नाई",
        CAR_RENTAL: "कार किराया",
        HOTEL: "होटल",
        BEAUTY_SALON: "ब्यूटी सैलून",
        BABYSITTER: "बेबीसिटर",
        CLEANING: "सफ़ाई सेवाएँ",
        TECHNICAL_SERVICES: "तकनीकी सेवाएँ",
      },
    },
    services: {
      hero: {
        pageTitle: "सेवा चयन",
        lockedDescription:
          "यह पृष्ठ मालिक ऑनबोर्डिंग का प्रवेश बिंदु है। जब तक प्रोफ़ाइल और फ़ोन सत्यापन पूरा नहीं होता, सेवा प्रवाह, बिलिंग और डैशबोर्ड लॉक रहेंगे।",
        activeDescription:
          "पहले योजना चुनें, फिर वह सेवा चुनें जिसके साथ आप आगे बढ़ना चाहते हैं। यदि कोई सक्रिय सदस्यता नहीं है, तो अगला चरण बिलिंग है। डैशबोर्ड केवल सफल बिलिंग के बाद खुलेगा।",
        currentStateLabel: "वर्तमान स्थिति",
      },
      summary: {
        previewMode: "सेवाएँ प्रीव्यू मोड में हैं",
        selectedPlanOnly: "{planLabel} योजना",
        selectedPlanWithStatus: "{planLabel} योजना • {statusLabel}",
        activePlanWithStatus: "सक्रिय योजना: {activePlanLabel} • {statusLabel}",
        billingCompleted: "बिलिंग पूरी हो चुकी है",
        billingPending: "बिलिंग लंबित है",
        planChangePending: "योजना बदलने के लिए बिलिंग आवश्यक है",
      },
      gate: {
        onboardingLabel: "ऑनबोर्डिंग",
        profileRequired: {
          title: "मालिक प्रोफ़ाइल आवश्यक है",
          message:
            "सेवाओं का उपयोग करने के लिए पहले मालिक का विवरण दर्ज करना आवश्यक है। जब तक प्रोफ़ाइल पूरी नहीं होती, बिलिंग और डैशबोर्ड लॉक रहेंगे।",
          cta: "प्रोफ़ाइल पृष्ठ पर जाएँ",
        },
        phoneVerificationRequired: {
          title: "फ़ोन सत्यापन आवश्यक है",
          message:
            "प्रोफ़ाइल सहेजी जा चुकी है, लेकिन फ़ोन को OTP के माध्यम से सत्यापित करना होगा। जब तक फ़ोन सत्यापन पूरा नहीं होता, सेवा चयन प्रीव्यू मोड में रहेगा और बिलिंग / डैशबोर्ड लॉक रहेंगे।",
          cta: "प्रोफ़ाइल पर जाएँ और सत्यापन पूरा करें",
        },
      },
      plans: {
        stepLabel: "चरण 1",
        title: "योजना चुनें",
        activeDescription:
          "योजना चयन केवल प्रोफ़ाइल और फ़ोन सत्यापन पूरा होने के बाद सक्रिय होता है।",
        lockedDescription:
          "योजना कार्ड अभी केवल प्रीव्यू के लिए हैं। जब तक प्रोफ़ाइल और फ़ोन सत्यापन पूरा नहीं होता, आप आगे नहीं बढ़ सकते।",
        standard: {
          label: "स्टैंडर्ड",
          badge: "मासिक योजना",
          description:
            "मुख्य मालिक प्रवाह के लिए एक सरल और स्थिर विकल्प।",
          helper: "लिस्टिंग्स मानक क्रम में दिखाई जाती हैं।",
        },
        plus: {
          label: "प्लस",
          badge: "प्राथमिक दृश्यता",
          description:
            "उसी श्रेणी और उन्हीं फ़िल्टरों में अधिक ऊँची दृश्यता।",
          helper: "प्लस लिस्टिंग्स मानक लिस्टिंग्स से पहले दिखाई जाती हैं।",
        },
        selectedChip: "चयनित",
        lockedNote: "प्रोफ़ाइल पूरी होने तक योजना चयन लॉक है",
      },
      serviceList: {
        stepLabel: "चरण 2",
        title: "सेवा चुनें",
        activeDescription:
          "सेवा चुनने के बाद अगला चरण बिलिंग होगा। जिन सेवाओं की सक्रिय सदस्यता है, उनके लिए केवल उसी सक्रिय योजना पर सीधा डैशबोर्ड एक्सेस उपलब्ध होगा।",
        lockedDescription:
          "जब तक मालिक ऑनबोर्डिंग पूरी नहीं होती, सेवा चयन प्रीव्यू मोड में रहेगा और आगे बढ़ना अवरुद्ध रहेगा।",
        carouselAria: "सेवाओं के बीच नेविगेट करें",
        previousServices: "पिछली सेवाएँ",
        nextServices: "अगली सेवाएँ",
        loadingServices:
          "सेवाएँ अस्थायी रूप से लोड नहीं हो सकीं। कृपया बाद में फिर प्रयास करें।",
        requestTimeout:
          "अनुरोध का समय समाप्त हो गया। बैकएंड ने प्रतिक्रिया नहीं दी।",
        noServices: "कोई सेवाएँ नहीं मिलीं।",
        profileCompletionInfo:
          "प्रोफ़ाइल और फ़ोन सत्यापन पूरा होने के बाद यहाँ सेवा चयन सक्रिय हो जाएगा।",
      },
      badges: {
        activeSubscription: "सक्रिय सदस्यता",
        continueWithPlus: "प्लस के साथ जारी रखें",
        continueWithStandard: "स्टैंडर्ड के साथ जारी रखें",
        selected: "चयनित",
        activePlanLabel: "सक्रिय योजना",
        changePlanBadge: "योजना परिवर्तन",
      },
      meta: {
        planLabel: "योजना",
        priceLabel: "मूल्य",
        priceInactive: "मूल्य सक्रिय नहीं है",
      },
      cards: {
        fallbackDescription:
          "इस सेवा के लिए मालिक प्रवाह सक्रिय है और आप अगले चरण में जा सकते हैं।",
        lockedFooter:
          "प्रोफ़ाइल और फ़ोन सत्यापन पूरा होने तक आप इस सेवा के साथ आगे नहीं बढ़ सकते",
        activeFooterFallback: "एक सक्रिय सदस्यता उपलब्ध है",
        activeFooterWithDate: "सक्रिय है • {paidUntil}",
        billingFooter: "इस सेवा को चुनने के बाद अगला चरण बिलिंग होगा",
        planChangeFooter: "चयनित योजना के लिए बिलिंग आवश्यक है",
        planChangeFooterWithActivePlan:
          "सक्रिय योजना: {activePlanLabel} • चयनित योजना के लिए बिलिंग आवश्यक है",
        titleFallback: "सेवा",
      },
      selection: {
        flowLabel: "चयनित प्रवाह",
        notSelected: "कोई सेवा चयनित नहीं है",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "आगे बढ़ने के लिए पहले ऊपर से एक सेवा चुनें।",
        billingCompletedFlow:
          "इस सेवा की चयनित योजना के लिए एक सक्रिय सदस्यता दिखाई दे रही है। बिलिंग पहले ही पूरी हो चुकी है और आगे बढ़ने पर डैशबोर्ड खुल जाएगा।",
        billingPendingFlow:
          "सेवा चुन ली गई है। अगला चरण बिलिंग है। भुगतान सफलतापूर्वक पूरा होने तक डैशबोर्ड सक्रिय नहीं होगा।",
        planChangeMessage:
          "आपके पास वर्तमान में {activePlanLabel} योजना की सक्रिय सदस्यता है। यदि आप सदस्यता को {targetPlanLabel} योजना में अपडेट करते हैं, तो पिछली सक्रिय योजना रद्द कर दी जाएगी और {targetPlanLabel} योजना अगले 30 दिनों के लिए सक्रिय हो जाएगी।",
        resetService: "सेवा रीसेट करें",
        chooseServiceButton: "सेवा चुनें",
        changePlanButton: "बिलिंग पर जाएँ और योजना अपडेट करें",
        goToProfile: "प्रोफ़ाइल पृष्ठ पर जाएँ",
        goToDashboard: "डैशबोर्ड पर जाएँ",
        goToBilling: "बिलिंग पर जाएँ",
        redirecting: "रीडायरेक्ट किया जा रहा है...",
      },
      status: {
        profileRequired: "प्रोफ़ाइल आवश्यक है",
        phoneRequired: "फ़ोन सत्यापन लंबित है",
        active: "सक्रिय",
        billingRequired: "बिलिंग आवश्यक है",
        serviceSelection: "सेवा चयन",
        planChangeRequired: "योजना परिवर्तन आवश्यक है",
      },
      errors: {
        ownerNotFoundLoadError: "मालिक प्रोफ़ाइल नहीं मिली।",
        servicesLoadErrorFallback: "सेवाएँ लोड नहीं हो सकीं",
        servicesLoadErrorWithStatus:
          "सेवाएँ लोड नहीं हो सकीं (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;