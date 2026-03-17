import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const deMessages = {
  common: {
    brand: {
      homeAriaLabel: "Startseite",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Sprachauswahl",
      selectorMenuAriaLabel: "Menü zur Sprachauswahl",
      currentLocaleTitle: "Aktuelle Sprache: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Inhaber-Dashboard",
        checkingContext: "Dienstkontext wird geprüft...",
        subtitle:
          "Das Dashboard wird erst geöffnet, nachdem das Onboarding des Inhabers und der Abonnementablauf abgeschlossen sind. Der aktive Dienst, der Tarif und der Zugriffsstatus werden unten angezeigt.",
      },
      summary: {
        activeServiceLabel: "Aktiver Dienst",
        ownerLabel: "Inhaber",
        paidUntilLabel: "Bezahlt bis",
        loadingStatus: "Status wird geprüft...",
        activeServiceFallback: "Kein aktiver Dienst gefunden",
        serviceGenericLabel: "Dienst",
      },
      notes: {
        loading: "Status wird geprüft...",
        active:
          "Hinweis: Dashboard-Links arbeiten mit dem ausgewählten Dienstkontext. Der Ablauf zum Erstellen, Bearbeiten und Löschen von Einträgen ist im Bereich Meine Einträge zusammengeführt.",
        locked:
          "Hinweis: Das Dashboard ist in dieser Phase absichtlich gesperrt. Verwenden Sie die Aktionsschaltfläche oben für den nächsten Schritt.",
      },
      errors: {
        prefix: "Fehler",
        dashboardStateLoadFailed:
          "Der Status des Dashboards konnte nicht geladen werden.",
        completeOwnerProfileFirst:
          "Vervollständigen Sie zuerst das Inhaberprofil.",
        phoneVerificationRequired:
          "Die Telefonverifizierung muss abgeschlossen werden.",
        serviceSelectionRequired:
          "Die Dienstauswahl muss zuerst abgeschlossen werden.",
        activeSubscriptionNotFound:
          "Es wurde kein aktives Abonnement gefunden.",
        serviceNotFoundOrInactive:
          "Der Dienst wurde nicht gefunden oder ist nicht aktiv.",
        serverErrorOccurred:
          "Es ist ein Serverfehler aufgetreten. Bitte versuchen Sie es später erneut.",
        ownerIdentityRequired:
          "Vervollständigen Sie zuerst das Inhaberprofil.",
      },
      cards: {
        properties: {
          title: "Meine Einträge",
          text: "Alle Einträge anzeigen, einen neuen Eintrag erstellen, aktive Einträge bearbeiten und löschen.",
        },
        profile: {
          title: "Profildaten",
          text: "Verwalten Sie Ihren Namen, Ihre Telefonnummer und weitere Profildaten.",
        },
        billing: {
          title: "Abonnement und Zahlungen",
          text: "Prüfen Sie den Status und wechseln Sie in den Zahlungsvorgang.",
        },
        bookings: {
          title: "Buchungsanfragen",
          text: "Eingehende Anfragen annehmen oder ablehnen.",
        },
        lockedChip: "Gesperrt",
        lockedDescriptions: {
          profile:
            "Dieser Bereich bleibt innerhalb des Dashboards gesperrt. Verwenden Sie die Aktionsschaltfläche oben, um die Profilseite zu öffnen.",
          billing:
            "In dieser Phase wird der Abonnementbereich über die Aktionsschaltfläche geöffnet. Die Dashboard-Karte bleibt gesperrt.",
          properties:
            "Das Erstellen, Bearbeiten und Löschen von Einträgen ist erst verfügbar, nachdem das Inhaber-Onboarding und das Abonnement abgeschlossen sind.",
          default:
            "Dieser Bereich ist nicht verfügbar, bis das Inhaber-Onboarding und das Abonnement abgeschlossen sind.",
        },
      },
      states: {
        profileRequired: {
          badge: "Dashboard ist gesperrt",
          title: "Inhaberprofil ist erforderlich",
          description:
            "Um Dienste zu nutzen, müssen Sie zuerst die Inhaberdaten eingeben. Bis das Profil abgeschlossen ist, bleiben Dashboard, Abrechnung und andere Bereiche gesperrt.",
          cta: "Zur Profilseite gehen",
        },
        phoneVerificationRequired: {
          badge: "OTP-Verifizierung erforderlich",
          title: "Telefon ist nicht verifiziert",
          description:
            "Das Profil wurde als Entwurf erstellt, aber der Inhaber gilt erst dann als aktiv, wenn das Telefon per OTP verifiziert wurde. Das Dashboard und andere Inhaberfunktionen bleiben gesperrt.",
          cta: "Zum Profil gehen und Verifizierung abschließen",
        },
        serviceSelectionRequired: {
          badge: "Dienstauswahl erforderlich",
          title: "Schließen Sie zuerst den Dienstschritt ab",
          description:
            "Nachdem das Profil abgeschlossen ist, muss der Inhaber zuerst zum Dienstbereich zurückkehren. Das Dashboard bleibt in dieser Phase gesperrt.",
          cta: "Zu den Diensten gehen",
        },
        subscriptionRequired: {
          badge: "Abonnement erforderlich",
          title: "Kein aktives Abonnement",
          description:
            "Ein Dienst wurde ausgewählt, aber die Zahlung wurde nicht abgeschlossen oder das Abonnement ist nicht aktiv. Das Dashboard bleibt gesperrt und andere Inhaberprozesse bleiben blockiert.",
          cta: "Zum Abonnement gehen",
        },
        active: {
          badge: "Aktiv",
          title: "Dashboard ist geöffnet",
          description:
            "Das Abonnement ist aktiv. Der Inhaber kann Einträge erstellen, Einträge verwalten, Buchungsanfragen bearbeiten und das System vollständig nutzen.",
          cta: "Dienste anzeigen",
        },
      },
      meta: {
        serviceCodeLabel: "Dienstcode",
        planLabel: "Tarif",
        accessLabel: "Zugriffsstatus",
        planStandardLabel: "Standard",
        planPlusLabel: "Plus",
        accessActiveLabel: "Offen",
        accessLockedLabel: "Gesperrt",
      },
      services: {
        RENT_HOME: "Hausvermietung",
        BARBER: "Barbier",
        CAR_RENTAL: "Autovermietung",
        HOTEL: "Hotel",
        BEAUTY_SALON: "Schönheitssalon",
        BABYSITTER: "Babysitter",
        CLEANING: "Reinigungsdienste",
        TECHNICAL_SERVICES: "Technische Dienste",
      },
    },
    services: {
      hero: {
        pageTitle: "Dienstauswahl",
        lockedDescription:
          "Diese Seite ist der Einstiegspunkt für das Onboarding des Inhabers. Bis Profil und Telefonverifizierung abgeschlossen sind, bleiben Dienstablauf, Abrechnung und Dashboard gesperrt.",
        activeDescription:
          "Wählen Sie zuerst einen Tarif und dann den Dienst, mit dem Sie fortfahren möchten. Wenn kein aktives Abonnement vorhanden ist, ist die Abrechnung der nächste Schritt. Das Dashboard wird erst nach erfolgreicher Abrechnung geöffnet.",
        currentStateLabel: "Aktueller Status",
      },
      summary: {
        previewMode: "Dienste befinden sich im Vorschaumodus",
        selectedPlanOnly: "{planLabel}-Tarif",
        selectedPlanWithStatus: "{planLabel}-Tarif • {statusLabel}",
        activePlanWithStatus:
          "Aktiver Tarif: {activePlanLabel} • {statusLabel}",
        billingCompleted: "Abrechnung abgeschlossen",
        billingPending: "Abrechnung ausstehend",
        planChangePending:
          "Für eine Tarifänderung ist eine Abrechnung erforderlich",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "Inhaberprofil ist erforderlich",
          message:
            "Um Dienste zu nutzen, müssen Sie zuerst die Inhaberdaten eingeben. Bis das Profil abgeschlossen ist, bleiben Abrechnung und Dashboard gesperrt.",
          cta: "Zur Profilseite gehen",
        },
        phoneVerificationRequired: {
          title: "Telefonverifizierung ist erforderlich",
          message:
            "Das Profil wurde gespeichert, aber das Telefon muss per OTP verifiziert werden. Bis die Telefonverifizierung abgeschlossen ist, bleibt die Dienstauswahl im Vorschaumodus und Abrechnung / Dashboard bleiben gesperrt.",
          cta: "Zum Profil gehen und Verifizierung abschließen",
        },
      },
      plans: {
        stepLabel: "Schritt 1",
        title: "Wählen Sie einen Tarif",
        activeDescription:
          "Die Tarifauswahl wird erst aktiv, nachdem Profil und Telefonverifizierung abgeschlossen sind.",
        lockedDescription:
          "Die Tarifkarten dienen derzeit nur zur Vorschau. Sie können nicht fortfahren, bis Profil und Telefonverifizierung abgeschlossen sind.",
        standard: {
          label: "Standard",
          badge: "Monatstarif",
          description:
            "Eine einfache und stabile Wahl für den zentralen Inhaberablauf.",
          helper: "Einträge werden in der Standardreihenfolge angezeigt.",
        },
        plus: {
          label: "Plus",
          badge: "Priorisierte Sichtbarkeit",
          description:
            "Höhere Sichtbarkeit innerhalb derselben Kategorie und derselben Filter.",
          helper:
            "Plus-Einträge werden vor Standard-Einträgen angezeigt.",
        },
        selectedChip: "Ausgewählt",
        lockedNote:
          "Die Tarifauswahl bleibt bis zum Abschluss des Profils gesperrt",
      },
      serviceList: {
        stepLabel: "Schritt 2",
        title: "Wählen Sie einen Dienst",
        activeDescription:
          "Nach der Auswahl eines Dienstes ist die Abrechnung der nächste Schritt. Bei Diensten mit aktivem Abonnement wird der direkte Dashboard-Zugang nur für diesen aktiven Tarif verfügbar.",
        lockedDescription:
          "Bis das Onboarding des Inhabers abgeschlossen ist, bleibt die Dienstauswahl im Vorschaumodus und das Fortfahren wird blockiert.",
        carouselAria: "Zwischen Diensten navigieren",
        previousServices: "Vorherige Dienste",
        nextServices: "Nächste Dienste",
        loadingServices:
          "Die Dienste konnten vorübergehend nicht geladen werden. Bitte versuchen Sie es später erneut.",
        requestTimeout:
          "Die Anfrage hat das Zeitlimit überschritten. Das Backend hat nicht geantwortet.",
        noServices: "Es wurden keine Dienste gefunden.",
        profileCompletionInfo:
          "Die Dienstauswahl wird hier aktiv, nachdem Profil und Telefonverifizierung abgeschlossen sind.",
      },
      badges: {
        activeSubscription: "Aktives Abonnement",
        continueWithPlus: "Mit Plus fortfahren",
        continueWithStandard: "Mit Standard fortfahren",
        selected: "Ausgewählt",
        activePlanLabel: "Aktiver Tarif",
        changePlanBadge: "Tarifänderung",
      },
      meta: {
        planLabel: "Tarif",
        priceLabel: "Preis",
        priceInactive: "Preis ist nicht aktiv",
      },
      cards: {
        fallbackDescription:
          "Der Inhaberablauf für diesen Dienst ist aktiv und Sie können zur nächsten Phase übergehen.",
        lockedFooter:
          "Sie können mit diesem Dienst nicht fortfahren, bis Profil und Telefonverifizierung abgeschlossen sind",
        activeFooterFallback: "Ein aktives Abonnement ist verfügbar",
        activeFooterWithDate: "Aktiv bis • {paidUntil}",
        billingFooter:
          "Nachdem Sie diesen Dienst ausgewählt haben, ist die Abrechnung der nächste Schritt",
        planChangeFooter:
          "Für den ausgewählten Tarif ist eine Abrechnung erforderlich",
        planChangeFooterWithActivePlan:
          "Aktiver Tarif: {activePlanLabel} • Für den ausgewählten Tarif ist eine Abrechnung erforderlich",
        titleFallback: "Dienst",
      },
      selection: {
        flowLabel: "Ausgewählter Ablauf",
        notSelected: "Kein Dienst ausgewählt",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Wählen Sie zum Fortfahren zuerst oben einen Dienst aus.",
        billingCompletedFlow:
          "Für den ausgewählten Tarif dieses Dienstes ist ein aktives Abonnement sichtbar. Die Abrechnung ist bereits abgeschlossen, und das Fortfahren öffnet das Dashboard.",
        billingPendingFlow:
          "Der Dienst wurde ausgewählt. Der nächste Schritt ist die Abrechnung. Das Dashboard wird erst aktiv, wenn die Zahlung erfolgreich abgeschlossen wurde.",
        planChangeMessage:
          "Sie haben derzeit ein aktives Abonnement für den Tarif {activePlanLabel}. Wenn Sie das Abonnement auf den Tarif {targetPlanLabel} aktualisieren, wird der bisher aktive Tarif gekündigt und der Tarif {targetPlanLabel} für die nächsten 30 Tage aktiviert.",
        resetService: "Dienst zurücksetzen",
        chooseServiceButton: "Dienst auswählen",
        changePlanButton:
          "Zur Abrechnung gehen und Tarif aktualisieren",
        goToProfile: "Zur Profilseite gehen",
        goToDashboard: "Zum Dashboard gehen",
        goToBilling: "Zur Abrechnung gehen",
        redirecting: "Weiterleitung...",
      },
      status: {
        profileRequired: "Profil erforderlich",
        phoneRequired: "Telefonverifizierung ausstehend",
        active: "Aktiv",
        billingRequired: "Abrechnung erforderlich",
        serviceSelection: "Dienstauswahl",
        planChangeRequired: "Tarifänderung erforderlich",
      },
      errors: {
        ownerNotFoundLoadError: "Inhaberprofil wurde nicht gefunden.",
        servicesLoadErrorFallback:
          "Die Dienste konnten nicht geladen werden",
        servicesLoadErrorWithStatus:
          "Die Dienste konnten nicht geladen werden (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;