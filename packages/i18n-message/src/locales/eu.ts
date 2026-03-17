import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const euMessages = {
  common: {
    brand: {
      homeAriaLabel: "Hasierako orria",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Hizkuntza hautaketa",
      selectorMenuAriaLabel: "Hizkuntza hautaketaren menua",
      currentLocaleTitle: "Uneko hizkuntza: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Jabearen panela",
        checkingContext: "Zerbitzuaren testuingurua egiaztatzen ari da...",
        subtitle:
          "Panela jabearen erregistroa eta harpidetza-fluxua amaitu ondoren bakarrik irekitzen da. Behean zerbitzu aktiboa, plana eta sarbide-egoera agertzen dira.",
      },
      summary: {
        activeServiceLabel: "Zerbitzu aktiboa",
        ownerLabel: "Jabea",
        paidUntilLabel: "Ordaindua data honetara arte",
        loadingStatus: "Egoera egiaztatzen ari da...",
        activeServiceFallback: "Ez da zerbitzu aktiborik aurkitu",
        serviceGenericLabel: "Zerbitzua",
      },
      notes: {
        loading: "Egoera egiaztatzen ari da...",
        active:
          "Oharra: paneleko estekek hautatutako zerbitzuaren testuinguruarekin funtzionatzen dute. Iragarkiak sortu, editatu eta ezabatzeko fluxua Nire iragarkiak atalean bateratu da.",
        locked:
          "Oharra: panela nahita blokeatuta dago fase honetan. Erabili goiko ekintza-botoia hurrengo urratserako.",
      },
      errors: {
        prefix: "Errorea",
        dashboardStateLoadFailed: "Ezin izan da panelaren egoera kargatu.",
        completeOwnerProfileFirst: "Lehenik osatu jabearen profila.",
        phoneVerificationRequired:
          "Telefonoaren egiaztapena osatu behar da.",
        serviceSelectionRequired:
          "Lehenik zerbitzu-hautaketa osatu behar da.",
        activeSubscriptionNotFound:
          "Ez da harpidetza aktiborik aurkitu.",
        serviceNotFoundOrInactive:
          "Zerbitzua ez da aurkitu edo ez dago aktibo.",
        serverErrorOccurred:
          "Zerbitzari-errore bat gertatu da. Saiatu berriro geroago.",
        ownerIdentityRequired: "Lehenik osatu jabearen profila.",
      },
      cards: {
        properties: {
          title: "Nire iragarkiak",
          text: "Ikusi iragarki guztiak, sortu iragarki berria, editatu iragarki aktiboak eta ezabatu.",
        },
        profile: {
          title: "Profilaren datuak",
          text: "Kudeatu zure izena, telefono-zenbakia eta profilaren gainerako datuak.",
        },
        billing: {
          title: "Harpidetza eta ordainketak",
          text: "Egiaztatu egoera eta joan ordainketa-fluxura.",
        },
        bookings: {
          title: "Erreserba-eskaerak",
          text: "Onartu edo baztertu sarrerako eskaerak.",
        },
        lockedChip: "Blokeatuta",
        lockedDescriptions: {
          profile:
            "Atal hau blokeatuta geratzen da panelaren barruan. Erabili goiko ekintza-botoia profilaren orria irekitzeko.",
          billing:
            "Fase honetan, harpidetza-atala ekintza-botoiaren bidez irekitzen da. Paneleko txartela blokeatuta geratzen da.",
          properties:
            "Iragarkiak sortu, editatu eta ezabatzeko aukera jabearen erregistroa eta harpidetza amaitu ondoren bakarrik aktibatzen da.",
          default:
            "Atal hau ez dago erabilgarri jabearen erregistroa eta harpidetza amaitu arte.",
        },
      },
      states: {
        profileRequired: {
          badge: "Panela blokeatuta dago",
          title: "Jabearen profila beharrezkoa da",
          description:
            "Zerbitzuak erabiltzeko, lehenik jabearen informazioa sartu behar da. Profila osatu arte, panela, fakturazioa eta gainerako atalak blokeatuta egongo dira.",
          cta: "Joan profilaren orrira",
        },
        phoneVerificationRequired: {
          badge: "OTP egiaztapena behar da",
          title: "Telefonoa ez dago egiaztatuta",
          description:
            "Profila zirriborro gisa sortu da, baina jabea ez da aktibotzat hartzen telefonoa OTP bidez egiaztatu arte. Panela eta jabearen beste gaitasunak blokeatuta geratuko dira.",
          cta: "Joan profilera eta osatu egiaztapena",
        },
        serviceSelectionRequired: {
          badge: "Zerbitzu-hautaketa behar da",
          title: "Osatu lehenik zerbitzuen urratsa",
          description:
            "Profila osatu ondoren, jabeak lehenik zerbitzuen atalera itzuli behar du. Panela blokeatuta mantentzen da fase honetan.",
          cta: "Joan zerbitzuetara",
        },
        subscriptionRequired: {
          badge: "Harpidetza behar da",
          title: "Ez dago harpidetza aktiborik",
          description:
            "Zerbitzu bat hautatu da, baina ordainketa ez da amaitu edo harpidetza ez dago aktibo. Panela blokeatuta geratuko da eta jabearen beste prozesuak ere blokeatuta egongo dira.",
          cta: "Joan harpidetzara",
        },
        active: {
          badge: "Aktibo",
          title: "Panela irekita dago",
          description:
            "Harpidetza aktibo dago. Jabeak iragarkiak sor ditzake, iragarkiak kudeatu, erreserba-eskaerak prozesatu eta sistema osorik erabili.",
          cta: "Ikusi zerbitzuak",
        },
      },
      meta: {
        serviceCodeLabel: "Zerbitzu-kodea",
        planLabel: "Plana",
        accessLabel: "Sarbide-egoera",
        planStandardLabel: "Estandarra",
        planPlusLabel: "Plus",
        accessActiveLabel: "Irekita",
        accessLockedLabel: "Blokeatuta",
      },
      services: {
        RENT_HOME: "Etxebizitza-alokairua",
        BARBER: "Bizargina",
        CAR_RENTAL: "Auto-alokairua",
        HOTEL: "Hotela",
        BEAUTY_SALON: "Apaindegia",
        BABYSITTER: "Haurren zaintzailea",
        CLEANING: "Garbiketa-zerbitzuak",
        TECHNICAL_SERVICES: "Zerbitzu teknikoak",
      },
    },
    services: {
      hero: {
        pageTitle: "Zerbitzu-hautaketa",
        lockedDescription:
          "Orri hau jabearen onboarding-aren sarrera-puntua da. Profila eta telefonoaren egiaztapena osatu arte, zerbitzuaren fluxua, fakturazioa eta panela blokeatuta egongo dira.",
        activeDescription:
          "Lehenik aukeratu plan bat, eta gero aukeratu zein zerbitzurekin jarraitu nahi duzun. Harpidetza aktiborik ez badago, hurrengo urratsa fakturazioa da. Panela fakturazioa behar bezala amaitu ondoren bakarrik irekiko da.",
        currentStateLabel: "Uneko egoera",
      },
      summary: {
        previewMode: "Zerbitzuak aurrebista moduan daude",
        selectedPlanOnly: "{planLabel} plana",
        selectedPlanWithStatus: "{planLabel} plana • {statusLabel}",
        activePlanWithStatus:
          "Plan aktiboa: {activePlanLabel} • {statusLabel}",
        billingCompleted: "fakturazioa osatuta",
        billingPending: "fakturazioa zain",
        planChangePending: "fakturazioa behar da plana aldatzeko",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "Jabearen profila beharrezkoa da",
          message:
            "Zerbitzuak erabiltzeko, lehenik jabearen datuak sartu behar dituzu. Profila osatu arte, fakturazioa eta panela blokeatuta egongo dira.",
          cta: "Joan profilaren orrira",
        },
        phoneVerificationRequired: {
          title: "Telefonoaren egiaztapena behar da",
          message:
            "Profila gorde da, baina telefonoa OTP bidez egiaztatu behar da. Telefonoaren egiaztapena osatu arte, zerbitzu-hautaketa aurrebista moduan egongo da eta fakturazioa / panela blokeatuta egongo dira.",
          cta: "Joan profilera eta osatu egiaztapena",
        },
      },
      plans: {
        stepLabel: "1. urratsa",
        title: "Aukeratu plan bat",
        activeDescription:
          "Plan-hautaketa aktibo bihurtzen da profila eta telefonoaren egiaztapena osatu ondoren bakarrik.",
        lockedDescription:
          "Plan-txartelak aurrebistarako dira une honetan. Ezin duzu jarraitu profila eta telefonoaren egiaztapena osatu arte.",
        standard: {
          label: "Estandarra",
          badge: "Hileko plana",
          description:
            "Jabearen oinarrizko fluxurako aukera erraza eta egonkorra.",
          helper:
            "Iragarkiak ordena estandarrean erakusten dira.",
        },
        plus: {
          label: "Plus",
          badge: "Lehentasunezko ikusgarritasuna",
          description:
            "Ikusgarritasun handiagoa kategoria eta iragazki berdinen barruan.",
          helper:
            "Plus iragarkiak iragarki estandarren aurretik erakusten dira.",
        },
        selectedChip: "Hautatuta",
        lockedNote:
          "Plan-hautaketa blokeatuta dago profila osatu arte",
      },
      serviceList: {
        stepLabel: "2. urratsa",
        title: "Aukeratu zerbitzu bat",
        activeDescription:
          "Zerbitzua hautatu ondoren, hurrengo urratsa fakturazioa da. Harpidetza aktiboa duten zerbitzuetan, panelerako sarbide zuzena plan aktibo horretarako bakarrik egongo da erabilgarri.",
        lockedDescription:
          "Jabearen onboarding-a osatu arte, zerbitzu-hautaketa aurrebista moduan egongo da eta jarraitzea blokeatuta egongo da.",
        carouselAria: "Nabigatu zerbitzuen artean",
        previousServices: "Aurreko zerbitzuak",
        nextServices: "Hurrengo zerbitzuak",
        loadingServices:
          "Ezin izan dira zerbitzuak aldi baterako kargatu. Saiatu berriro geroago.",
        requestTimeout:
          "Eskaeraren denbora amaitu da. Backend-ak ez du erantzun.",
        noServices: "Ez da zerbitzurik aurkitu.",
        profileCompletionInfo:
          "Zerbitzu-hautaketa hemen aktibatuko da profila eta telefonoaren egiaztapena osatu ondoren.",
      },
      badges: {
        activeSubscription: "Harpidetza aktiboa",
        continueWithPlus: "Jarraitu Plus-rekin",
        continueWithStandard: "Jarraitu Estandarra-rekin",
        selected: "Hautatuta",
        activePlanLabel: "Plan aktiboa",
        changePlanBadge: "Plan-aldaketa",
      },
      meta: {
        planLabel: "Plana",
        priceLabel: "Prezioa",
        priceInactive: "Prezioa ez dago aktibo",
      },
      cards: {
        fallbackDescription:
          "Zerbitzu honetarako jabearen fluxua aktibo dago eta hurrengo fasera joan zaitezke.",
        lockedFooter:
          "Ezin duzu zerbitzu honekin jarraitu profila eta telefonoaren egiaztapena osatu arte",
        activeFooterFallback:
          "Harpidetza aktibo bat erabilgarri dago",
        activeFooterWithDate: "Aktibo data honetara arte • {paidUntil}",
        billingFooter:
          "Zerbitzu hau hautatu ondoren, hurrengo urratsa fakturazioa izango da",
        planChangeFooter:
          "Fakturazioa behar da hautatutako planerako",
        planChangeFooterWithActivePlan:
          "Plan aktiboa: {activePlanLabel} • Fakturazioa behar da hautatutako planerako",
        titleFallback: "Zerbitzua",
      },
      selection: {
        flowLabel: "Hautatutako fluxua",
        notSelected: "Ez da zerbitzurik hautatu",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Jarraitzeko, lehenik aukeratu goiko zerbitzuetako bat.",
        billingCompletedFlow:
          "Zerbitzu honen hautatutako planerako harpidetza aktibo bat ikus daiteke. Fakturazioa dagoeneko osatuta dago, eta jarraitzeak panela irekiko du.",
        billingPendingFlow:
          "Zerbitzua hautatu da. Hurrengo urratsa fakturazioa da. Panela ez da aktibo egongo ordainketa behar bezala osatu arte.",
        planChangeMessage:
          "Une honetan harpidetza aktibo bat duzu {activePlanLabel} planarekin. Harpidetza {targetPlanLabel} planera eguneratzen baduzu, aurreko plan aktiboa bertan behera geratuko da eta {targetPlanLabel} plana hurrengo 30 egunetan aktibatuko da.",
        resetService: "Berrezarri zerbitzua",
        chooseServiceButton: "Aukeratu zerbitzua",
        changePlanButton:
          "Joan fakturaziora eta eguneratu plana",
        goToProfile: "Joan profilaren orrira",
        goToDashboard: "Joan panelera",
        goToBilling: "Joan fakturaziora",
        redirecting: "Birbideratzen...",
      },
      status: {
        profileRequired: "Profila beharrezkoa da",
        phoneRequired: "Telefonoaren egiaztapena zain",
        active: "Aktibo",
        billingRequired: "Fakturazioa behar da",
        serviceSelection: "Zerbitzu-hautaketa",
        planChangeRequired: "Plan-aldaketa behar da",
      },
      errors: {
        ownerNotFoundLoadError:
          "Ez da jabearen profila aurkitu.",
        servicesLoadErrorFallback:
          "Ezin izan dira zerbitzuak kargatu",
        servicesLoadErrorWithStatus:
          "Ezin izan dira zerbitzuak kargatu (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;