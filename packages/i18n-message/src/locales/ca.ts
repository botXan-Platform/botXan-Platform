import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const caMessages = {
  common: {
    brand: {
      homeAriaLabel: "Pàgina inicial",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Selecció d'idioma",
      selectorMenuAriaLabel: "Menú de selecció d'idioma",
      currentLocaleTitle: "Idioma actual: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Tauler del propietari",
        checkingContext: "S'està comprovant el context del servei...",
        subtitle:
          "El tauler només s'obre després de completar el procés d'incorporació del propietari i el flux de subscripció. A continuació es mostren el servei actiu, el pla i l'estat d'accés.",
      },
      summary: {
        activeServiceLabel: "Servei actiu",
        ownerLabel: "Propietari",
        paidUntilLabel: "Pagat fins a",
        loadingStatus: "S'està comprovant l'estat...",
        activeServiceFallback: "No s'ha trobat cap servei actiu",
        serviceGenericLabel: "Servei",
      },
      notes: {
        loading: "S'està comprovant l'estat...",
        active:
          "Nota: els enllaços del tauler funcionen amb el context del servei seleccionat. El flux de crear, editar i suprimir anuncis està unificat dins de la secció Els meus anuncis.",
        locked:
          "Nota: el tauler està bloquejat intencionadament en aquesta etapa. Utilitzeu el botó d'acció de dalt per al pas següent.",
      },
      errors: {
        prefix: "Error",
        dashboardStateLoadFailed:
          "No s'ha pogut carregar l'estat del tauler.",
        completeOwnerProfileFirst:
          "Completeu primer el perfil del propietari.",
        phoneVerificationRequired:
          "Cal completar la verificació del telèfon.",
        serviceSelectionRequired:
          "Cal completar primer la selecció del servei.",
        activeSubscriptionNotFound:
          "No s'ha trobat cap subscripció activa.",
        serviceNotFoundOrInactive:
          "No s'ha trobat el servei o no està actiu.",
        serverErrorOccurred:
          "S'ha produït un error del servidor. Torneu-ho a provar més tard.",
        ownerIdentityRequired:
          "Completeu primer el perfil del propietari.",
      },
      cards: {
        properties: {
          title: "Els meus anuncis",
          text: "Consulteu tots els anuncis, creeu-ne un de nou, editeu els anuncis actius i suprimiu-los.",
        },
        profile: {
          title: "Dades del perfil",
          text: "Gestioneu el vostre nom, número de telèfon i altres dades del perfil.",
        },
        billing: {
          title: "Subscripció i pagaments",
          text: "Comproveu l'estat i aneu al flux de pagament.",
        },
        bookings: {
          title: "Sol·licituds de reserva",
          text: "Aproveu o rebutgeu les sol·licituds entrants.",
        },
        lockedChip: "Bloquejat",
        lockedDescriptions: {
          profile:
            "Aquesta secció roman bloquejada dins del tauler. Feu servir el botó d'acció de dalt per obrir la pàgina del perfil.",
          billing:
            "En aquesta etapa, la secció de subscripció s'obre mitjançant el botó d'acció. La targeta del tauler roman bloquejada.",
          properties:
            "Crear, editar i suprimir anuncis només està disponible després de completar la incorporació del propietari i la subscripció.",
          default:
            "Aquesta secció no està disponible fins que no es completin la incorporació del propietari i la subscripció.",
        },
      },
      states: {
        profileRequired: {
          badge: "El tauler està bloquejat",
          title: "Cal el perfil del propietari",
          description:
            "Per utilitzar els serveis, primer heu d'introduir les dades del propietari. Fins que el perfil no estigui complet, el tauler, la facturació i altres seccions romandran bloquejats.",
          cta: "Aneu a la pàgina del perfil",
        },
        phoneVerificationRequired: {
          badge: "Cal verificació OTP",
          title: "El telèfon no està verificat",
          description:
            "El perfil s'ha creat com a esborrany, però el propietari no es considera actiu fins que el telèfon no es verifica amb OTP. El tauler i altres capacitats del propietari romandran bloquejats.",
          cta: "Aneu al perfil i completeu la verificació",
        },
        serviceSelectionRequired: {
          badge: "Cal seleccionar un servei",
          title: "Completeu primer el pas dels serveis",
          description:
            "Un cop completat el perfil, el propietari ha de tornar primer a la secció de serveis. El tauler roman bloquejat en aquesta etapa.",
          cta: "Aneu als serveis",
        },
        subscriptionRequired: {
          badge: "Cal subscripció",
          title: "No hi ha cap subscripció activa",
          description:
            "S'ha seleccionat un servei, però el pagament no s'ha completat o la subscripció no està activa. El tauler romandrà bloquejat i altres processos del propietari continuaran bloquejats.",
          cta: "Aneu a la subscripció",
        },
        active: {
          badge: "Actiu",
          title: "El tauler està obert",
          description:
            "La subscripció està activa. El propietari pot crear anuncis, gestionar-los, gestionar sol·licituds de reserva i utilitzar el sistema completament.",
          cta: "Veure serveis",
        },
      },
      meta: {
        serviceCodeLabel: "Codi del servei",
        planLabel: "Pla",
        accessLabel: "Estat d'accés",
        planStandardLabel: "Estàndard",
        planPlusLabel: "Plus",
        accessActiveLabel: "Obert",
        accessLockedLabel: "Bloquejat",
      },
      services: {
        RENT_HOME: "Lloguer d'habitatges",
        BARBER: "Barberia",
        CAR_RENTAL: "Lloguer de cotxes",
        HOTEL: "Hotel",
        BEAUTY_SALON: "Saló de bellesa",
        BABYSITTER: "Cangur",
        CLEANING: "Serveis de neteja",
        TECHNICAL_SERVICES: "Serveis tècnics",
      },
    },
    services: {
      hero: {
        pageTitle: "Selecció de servei",
        lockedDescription:
          "Aquesta pàgina és el punt d'entrada de l'onboarding del propietari. Fins que el perfil i la verificació del telèfon no estiguin completats, el flux del servei, la facturació i el tauler romandran bloquejats.",
        activeDescription:
          "Primer trieu un pla i després trieu el servei amb què voleu continuar. Si no hi ha cap subscripció activa, el pas següent és la facturació. El tauler només s'obrirà després de completar correctament la facturació.",
        currentStateLabel: "Estat actual",
      },
      summary: {
        previewMode: "Els serveis estan en mode de previsualització",
        selectedPlanOnly: "Pla {planLabel}",
        selectedPlanWithStatus: "Pla {planLabel} • {statusLabel}",
        activePlanWithStatus: "Pla actiu: {activePlanLabel} • {statusLabel}",
        billingCompleted: "facturació completada",
        billingPending: "facturació pendent",
        planChangePending: "cal facturació per canviar de pla",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "Cal el perfil del propietari",
          message:
            "Per utilitzar els serveis, primer heu d'introduir les dades del propietari. Fins que el perfil no estigui complet, la facturació i el tauler romandran bloquejats.",
          cta: "Aneu a la pàgina del perfil",
        },
        phoneVerificationRequired: {
          title: "Cal la verificació del telèfon",
          message:
            "El perfil s'ha desat, però el telèfon s'ha de verificar amb OTP. Fins que la verificació del telèfon no estigui completada, la selecció del servei romandrà en mode de previsualització i la facturació / el tauler continuaran bloquejats.",
          cta: "Aneu al perfil i completeu la verificació",
        },
      },
      plans: {
        stepLabel: "Pas 1",
        title: "Trieu un pla",
        activeDescription:
          "La selecció del pla només s'activa després de completar el perfil i la verificació del telèfon.",
        lockedDescription:
          "Les targetes del pla són actualment només de previsualització. No podeu continuar fins que el perfil i la verificació del telèfon no estiguin completats.",
        standard: {
          label: "Estàndard",
          badge: "Pla mensual",
          description:
            "Una opció simple i estable per al flux principal del propietari.",
          helper: "Els anuncis es mostren en l'ordre estàndard.",
        },
        plus: {
          label: "Plus",
          badge: "Visibilitat prioritària",
          description:
            "Més visibilitat dins de la mateixa categoria i els mateixos filtres.",
          helper:
            "Els anuncis Plus es mostren abans que els anuncis estàndard.",
        },
        selectedChip: "Seleccionat",
        lockedNote:
          "La selecció del pla queda bloquejada fins que es completi el perfil",
      },
      serviceList: {
        stepLabel: "Pas 2",
        title: "Trieu un servei",
        activeDescription:
          "Després de seleccionar un servei, el pas següent és la facturació. Per als serveis amb una subscripció activa, l'accés directe al tauler només estarà disponible per a aquest pla actiu.",
        lockedDescription:
          "Fins que no es completi l'onboarding del propietari, la selecció del servei romandrà en mode de previsualització i la continuació quedarà bloquejada.",
        carouselAria: "Navega entre serveis",
        previousServices: "Serveis anteriors",
        nextServices: "Serveis següents",
        loadingServices:
          "No s'han pogut carregar els serveis temporalment. Torneu-ho a provar més tard.",
        requestTimeout:
          "La sol·licitud ha superat el temps límit. El backend no ha respost.",
        noServices: "No s'ha trobat cap servei.",
        profileCompletionInfo:
          "La selecció del servei s'activarà aquí després de completar el perfil i la verificació del telèfon.",
      },
      badges: {
        activeSubscription: "Subscripció activa",
        continueWithPlus: "Continua amb Plus",
        continueWithStandard: "Continua amb Estàndard",
        selected: "Seleccionat",
        activePlanLabel: "Pla actiu",
        changePlanBadge: "Canvi de pla",
      },
      meta: {
        planLabel: "Pla",
        priceLabel: "Preu",
        priceInactive: "El preu no està actiu",
      },
      cards: {
        fallbackDescription:
          "El flux del propietari per a aquest servei està actiu i podeu continuar a la fase següent.",
        lockedFooter:
          "No podeu continuar amb aquest servei fins que el perfil i la verificació del telèfon no estiguin completats",
        activeFooterFallback: "Hi ha una subscripció activa disponible",
        activeFooterWithDate: "Actiu fins a • {paidUntil}",
        billingFooter:
          "Després de seleccionar aquest servei, el pas següent serà la facturació",
        planChangeFooter:
          "Cal facturació per al pla seleccionat",
        planChangeFooterWithActivePlan:
          "Pla actiu: {activePlanLabel} • Cal facturació per al pla seleccionat",
        titleFallback: "Servei",
      },
      selection: {
        flowLabel: "Flux seleccionat",
        notSelected: "No s'ha seleccionat cap servei",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Per continuar, primer trieu un servei de dalt.",
        billingCompletedFlow:
          "Hi ha una subscripció activa visible per al pla seleccionat d'aquest servei. La facturació ja s'ha completat i continuar obrirà el tauler.",
        billingPendingFlow:
          "El servei ha estat seleccionat. El pas següent és la facturació. El tauler no s'activarà fins que el pagament s'hagi completat correctament.",
        planChangeMessage:
          "Actualment teniu una subscripció activa al pla {activePlanLabel}. Si actualitzeu la subscripció al pla {targetPlanLabel}, el pla actiu anterior es cancel·larà i el pla {targetPlanLabel} s'activarà durant els propers 30 dies.",
        resetService: "Restableix el servei",
        chooseServiceButton: "Tria el servei",
        changePlanButton:
          "Aneu a la facturació i actualitzeu el pla",
        goToProfile: "Aneu a la pàgina del perfil",
        goToDashboard: "Aneu al tauler",
        goToBilling: "Aneu a la facturació",
        redirecting: "S'està redirigint...",
      },
      status: {
        profileRequired: "Cal perfil",
        phoneRequired: "Verificació del telèfon pendent",
        active: "Actiu",
        billingRequired: "Cal facturació",
        serviceSelection: "Selecció de servei",
        planChangeRequired: "Cal canvi de pla",
      },
      errors: {
        ownerNotFoundLoadError:
          "No s'ha trobat el perfil del propietari.",
        servicesLoadErrorFallback:
          "No s'han pogut carregar els serveis",
        servicesLoadErrorWithStatus:
          "No s'han pogut carregar els serveis (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;