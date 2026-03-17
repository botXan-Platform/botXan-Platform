import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const itMessages = {
  common: {
    brand: {
      homeAriaLabel: "Pagina iniziale",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Selezione della lingua",
      selectorMenuAriaLabel: "Menu di selezione della lingua",
      currentLocaleTitle: "Lingua corrente: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Dashboard del proprietario",
        checkingContext: "Verifica del contesto del servizio in corso...",
        subtitle:
          "La dashboard si apre solo dopo il completamento dell'onboarding del proprietario e del flusso di abbonamento. Di seguito sono mostrati il servizio attivo, il piano e lo stato di accesso.",
      },
      summary: {
        activeServiceLabel: "Servizio attivo",
        ownerLabel: "Proprietario",
        paidUntilLabel: "Pagato fino al",
        loadingStatus: "Verifica dello stato in corso...",
        activeServiceFallback: "Nessun servizio attivo trovato",
        serviceGenericLabel: "Servizio",
      },
      notes: {
        loading: "Verifica dello stato in corso...",
        active:
          "Nota: i collegamenti della dashboard funzionano con il contesto del servizio selezionato. Il flusso di creazione, modifica ed eliminazione degli annunci è stato unificato nella sezione I miei annunci.",
        locked:
          "Nota: la dashboard è intenzionalmente bloccata in questa fase. Utilizza il pulsante di azione in alto per il passaggio successivo.",
      },
      errors: {
        prefix: "Errore",
        dashboardStateLoadFailed:
          "Impossibile caricare lo stato della dashboard.",
        completeOwnerProfileFirst:
          "Completa prima il profilo del proprietario.",
        phoneVerificationRequired:
          "La verifica del telefono deve essere completata.",
        serviceSelectionRequired:
          "La selezione del servizio deve essere completata prima.",
        activeSubscriptionNotFound:
          "Nessun abbonamento attivo trovato.",
        serviceNotFoundOrInactive:
          "Il servizio non è stato trovato o non è attivo.",
        serverErrorOccurred:
          "Si è verificato un errore del server. Riprova più tardi.",
        ownerIdentityRequired:
          "Completa prima il profilo del proprietario.",
      },
      cards: {
        properties: {
          title: "I miei annunci",
          text: "Visualizza tutti i tuoi annunci, creane uno nuovo, modifica gli annunci attivi ed eliminali.",
        },
        profile: {
          title: "Dettagli del profilo",
          text: "Gestisci il tuo nome, numero di telefono e altri dettagli del profilo.",
        },
        billing: {
          title: "Abbonamento e pagamenti",
          text: "Controlla lo stato e procedi al flusso di pagamento.",
        },
        bookings: {
          title: "Richieste di prenotazione",
          text: "Approva o rifiuta le richieste in arrivo.",
        },
        lockedChip: "Bloccato",
        lockedDescriptions: {
          profile:
            "Questa sezione rimane bloccata all'interno della dashboard. Utilizza il pulsante di azione in alto per aprire la pagina del profilo.",
          billing:
            "In questa fase, la sezione dell'abbonamento viene aperta tramite il pulsante di azione. La scheda della dashboard rimane bloccata.",
          properties:
            "La creazione, la modifica e l'eliminazione degli annunci diventano disponibili solo dopo il completamento dell'onboarding del proprietario e dell'abbonamento.",
          default:
            "Questa sezione non è disponibile finché l'onboarding del proprietario e l'abbonamento non sono completati.",
        },
      },
      states: {
        profileRequired: {
          badge: "La dashboard è bloccata",
          title: "Il profilo del proprietario è obbligatorio",
          description:
            "Per utilizzare i servizi, devi prima inserire le informazioni del proprietario. Finché il profilo non è completato, la dashboard, la fatturazione e le altre sezioni rimarranno bloccate.",
          cta: "Vai alla pagina del profilo",
        },
        phoneVerificationRequired: {
          badge: "È richiesta la verifica OTP",
          title: "Il telefono non è verificato",
          description:
            "Il profilo è stato creato come bozza, ma il proprietario non viene considerato attivo finché il telefono non viene verificato tramite OTP. La dashboard e le altre funzionalità del proprietario rimarranno bloccate.",
          cta: "Vai al profilo e completa la verifica",
        },
        serviceSelectionRequired: {
          badge: "È richiesta la selezione del servizio",
          title: "Completa prima la fase dei servizi",
          description:
            "Dopo il completamento del profilo, il proprietario deve tornare prima alla sezione dei servizi. In questa fase la dashboard rimane bloccata.",
          cta: "Vai ai servizi",
        },
        subscriptionRequired: {
          badge: "È richiesto un abbonamento",
          title: "Nessun abbonamento attivo",
          description:
            "È stato selezionato un servizio, ma il pagamento non è stato completato oppure l'abbonamento non è attivo. La dashboard rimarrà bloccata e anche gli altri processi del proprietario resteranno bloccati.",
          cta: "Vai all'abbonamento",
        },
        active: {
          badge: "Attivo",
          title: "La dashboard è aperta",
          description:
            "L'abbonamento è attivo. Il proprietario può creare annunci, gestirli, elaborare le richieste di prenotazione e utilizzare il sistema completamente.",
          cta: "Visualizza i servizi",
        },
      },
      meta: {
        serviceCodeLabel: "Codice del servizio",
        planLabel: "Piano",
        accessLabel: "Stato di accesso",
        planStandardLabel: "Standard",
        planPlusLabel: "Plus",
        accessActiveLabel: "Aperto",
        accessLockedLabel: "Bloccato",
      },
      services: {
        RENT_HOME: "Affitto di case",
        BARBER: "Barbiere",
        CAR_RENTAL: "Noleggio auto",
        HOTEL: "Hotel",
        BEAUTY_SALON: "Salone di bellezza",
        BABYSITTER: "Babysitter",
        CLEANING: "Servizi di pulizia",
        TECHNICAL_SERVICES: "Servizi tecnici",
      },
    },
    services: {
      hero: {
        pageTitle: "Selezione del servizio",
        lockedDescription:
          "Questa pagina è il punto di ingresso dell'onboarding del proprietario. Finché il profilo e la verifica del telefono non sono completati, il flusso del servizio, la fatturazione e la dashboard rimarranno bloccati.",
        activeDescription:
          "Prima scegli un piano, poi scegli il servizio con cui vuoi continuare. Se non esiste un abbonamento attivo, il passaggio successivo è la fatturazione. La dashboard si aprirà solo dopo il completamento corretto della fatturazione.",
        currentStateLabel: "Stato attuale",
      },
      summary: {
        previewMode: "I servizi sono in modalità anteprima",
        selectedPlanOnly: "Piano {planLabel}",
        selectedPlanWithStatus: "Piano {planLabel} • {statusLabel}",
        activePlanWithStatus:
          "Piano attivo: {activePlanLabel} • {statusLabel}",
        billingCompleted: "fatturazione completata",
        billingPending: "fatturazione in attesa",
        planChangePending:
          "La fatturazione è richiesta per cambiare piano",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "Il profilo del proprietario è obbligatorio",
          message:
            "Per utilizzare i servizi, devi prima inserire i dati del proprietario. Finché il profilo non è completato, la fatturazione e la dashboard rimarranno bloccate.",
          cta: "Vai alla pagina del profilo",
        },
        phoneVerificationRequired: {
          title: "La verifica del telefono è obbligatoria",
          message:
            "Il profilo è stato salvato, ma il telefono deve essere verificato con OTP. Finché la verifica del telefono non è completata, la selezione del servizio rimarrà in modalità anteprima e la fatturazione / dashboard resteranno bloccate.",
          cta: "Vai al profilo e completa la verifica",
        },
      },
      plans: {
        stepLabel: "Passaggio 1",
        title: "Scegli un piano",
        activeDescription:
          "La selezione del piano diventa attiva solo dopo il completamento del profilo e della verifica del telefono.",
        lockedDescription:
          "Le schede del piano sono attualmente solo in anteprima. Non puoi continuare finché il profilo e la verifica del telefono non sono completati.",
        standard: {
          label: "Standard",
          badge: "Piano mensile",
          description:
            "Una scelta semplice e stabile per il flusso principale del proprietario.",
          helper:
            "Gli annunci vengono mostrati nell'ordine standard.",
        },
        plus: {
          label: "Plus",
          badge: "Visibilità prioritaria",
          description:
            "Maggiore visibilità nella stessa categoria e con gli stessi filtri.",
          helper:
            "Gli annunci Plus vengono mostrati prima degli annunci Standard.",
        },
        selectedChip: "Selezionato",
        lockedNote:
          "La selezione del piano è bloccata finché il profilo non è completato",
      },
      serviceList: {
        stepLabel: "Passaggio 2",
        title: "Scegli un servizio",
        activeDescription:
          "Dopo aver selezionato un servizio, il passaggio successivo è la fatturazione. Per i servizi con un abbonamento attivo, l'accesso diretto alla dashboard è disponibile solo per quel piano attivo.",
        lockedDescription:
          "Finché l'onboarding del proprietario non è completato, la selezione del servizio rimarrà in modalità anteprima e la prosecuzione sarà bloccata.",
        carouselAria: "Naviga tra i servizi",
        previousServices: "Servizi precedenti",
        nextServices: "Servizi successivi",
        loadingServices:
          "Impossibile caricare temporaneamente i servizi. Riprova più tardi.",
        requestTimeout:
          "La richiesta è scaduta. Il backend non ha risposto.",
        noServices: "Nessun servizio trovato.",
        profileCompletionInfo:
          "La selezione del servizio diventerà attiva qui dopo il completamento del profilo e della verifica del telefono.",
      },
      badges: {
        activeSubscription: "Abbonamento attivo",
        continueWithPlus: "Continua con Plus",
        continueWithStandard: "Continua con Standard",
        selected: "Selezionato",
        activePlanLabel: "Piano attivo",
        changePlanBadge: "Cambio piano",
      },
      meta: {
        planLabel: "Piano",
        priceLabel: "Prezzo",
        priceInactive: "Il prezzo non è attivo",
      },
      cards: {
        fallbackDescription:
          "Il flusso del proprietario per questo servizio è attivo e puoi procedere alla fase successiva.",
        lockedFooter:
          "Non puoi continuare con questo servizio finché il profilo e la verifica del telefono non sono completati",
        activeFooterFallback: "È disponibile un abbonamento attivo",
        activeFooterWithDate: "Attivo fino al • {paidUntil}",
        billingFooter:
          "Dopo aver selezionato questo servizio, il passaggio successivo sarà la fatturazione",
        planChangeFooter:
          "La fatturazione è richiesta per il piano selezionato",
        planChangeFooterWithActivePlan:
          "Piano attivo: {activePlanLabel} • La fatturazione è richiesta per il piano selezionato",
        titleFallback: "Servizio",
      },
      selection: {
        flowLabel: "Flusso selezionato",
        notSelected: "Nessun servizio selezionato",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Per continuare, scegli prima un servizio qui sopra.",
        billingCompletedFlow:
          "È visibile un abbonamento attivo per il piano selezionato di questo servizio. La fatturazione è già completata e continuare aprirà la dashboard.",
        billingPendingFlow:
          "Il servizio è stato selezionato. Il passaggio successivo è la fatturazione. La dashboard non diventerà attiva finché il pagamento non sarà completato con successo.",
        planChangeMessage:
          "Attualmente hai un abbonamento attivo per il piano {activePlanLabel}. Se aggiorni l'abbonamento al piano {targetPlanLabel}, il precedente piano attivo verrà annullato e il piano {targetPlanLabel} verrà attivato per i prossimi 30 giorni.",
        resetService: "Reimposta servizio",
        chooseServiceButton: "Scegli servizio",
        changePlanButton:
          "Vai alla fatturazione e aggiorna il piano",
        goToProfile: "Vai alla pagina del profilo",
        goToDashboard: "Vai alla dashboard",
        goToBilling: "Vai alla fatturazione",
        redirecting: "Reindirizzamento in corso...",
      },
      status: {
        profileRequired: "Profilo obbligatorio",
        phoneRequired: "Verifica del telefono in attesa",
        active: "Attivo",
        billingRequired: "Fatturazione obbligatoria",
        serviceSelection: "Selezione del servizio",
        planChangeRequired: "Cambio piano obbligatorio",
      },
      errors: {
        ownerNotFoundLoadError:
          "Il profilo del proprietario non è stato trovato.",
        servicesLoadErrorFallback:
          "Impossibile caricare i servizi",
        servicesLoadErrorWithStatus:
          "Impossibile caricare i servizi (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;