import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const glMessages = {
  common: {
    brand: {
      homeAriaLabel: "Páxina principal",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Selección de idioma",
      selectorMenuAriaLabel: "Menú de selección de idioma",
      currentLocaleTitle: "Idioma actual: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Panel do propietario",
        checkingContext: "Comprobando o contexto do servizo...",
        subtitle:
          "O panel só se abre despois de completar o proceso de incorporación do propietario e o fluxo de subscrición. A continuación móstranse o servizo activo, o plan e o estado de acceso.",
      },
      summary: {
        activeServiceLabel: "Servizo activo",
        ownerLabel: "Propietario",
        paidUntilLabel: "Pagado ata",
        loadingStatus: "Comprobando o estado...",
        activeServiceFallback: "Non se atopou ningún servizo activo",
        serviceGenericLabel: "Servizo",
      },
      notes: {
        loading: "Comprobando o estado...",
        active:
          "Nota: as ligazóns do panel funcionan co contexto do servizo seleccionado. O fluxo de crear, editar e eliminar anuncios está unificado dentro da sección Os meus anuncios.",
        locked:
          "Nota: o panel está bloqueado intencionadamente nesta fase. Use o botón de acción superior para o seguinte paso.",
      },
      errors: {
        prefix: "Erro",
        dashboardStateLoadFailed:
          "Non se puido cargar o estado do panel.",
        completeOwnerProfileFirst:
          "Complete primeiro o perfil do propietario.",
        phoneVerificationRequired:
          "Debe completarse a verificación do teléfono.",
        serviceSelectionRequired:
          "Primeiro debe completarse a selección do servizo.",
        activeSubscriptionNotFound:
          "Non se atopou ningunha subscrición activa.",
        serviceNotFoundOrInactive:
          "Non se atopou o servizo ou non está activo.",
        serverErrorOccurred:
          "Produciuse un erro no servidor. Ténteo de novo máis tarde.",
        ownerIdentityRequired:
          "Complete primeiro o perfil do propietario.",
      },
      cards: {
        properties: {
          title: "Os meus anuncios",
          text: "Vexa todos os anuncios, cree un novo, edite os anuncios activos e elimíneos.",
        },
        profile: {
          title: "Datos do perfil",
          text: "Xestione o seu nome, número de teléfono e outros datos do perfil.",
        },
        billing: {
          title: "Subscrición e pagos",
          text: "Comprobe o estado e continúe co fluxo de pagamento.",
        },
        bookings: {
          title: "Solicitudes de reserva",
          text: "Aprobe ou rexeite as solicitudes entrantes.",
        },
        lockedChip: "Bloqueado",
        lockedDescriptions: {
          profile:
            "Esta sección permanece bloqueada dentro do panel. Use o botón de acción superior para abrir a páxina do perfil.",
          billing:
            "Nesta fase, a sección de subscrición ábrese mediante o botón de acción. A tarxeta do panel permanece bloqueada.",
          properties:
            "Crear, editar e eliminar anuncios só estará dispoñible despois de completar a incorporación do propietario e a subscrición.",
          default:
            "Esta sección non está dispoñible ata que se completen a incorporación do propietario e a subscrición.",
        },
      },
      states: {
        profileRequired: {
          badge: "O panel está bloqueado",
          title: "Requírese o perfil do propietario",
          description:
            "Para usar os servizos, primeiro debe introducir a información do propietario. Ata que o perfil estea completo, o panel, a facturación e outras seccións permanecerán bloqueados.",
          cta: "Ir á páxina do perfil",
        },
        phoneVerificationRequired: {
          badge: "Requírese verificación OTP",
          title: "O teléfono non está verificado",
          description:
            "O perfil creouse como borrador, pero o propietario non se considera activo ata que o teléfono se verifique mediante OTP. O panel e outras capacidades do propietario permanecerán bloqueados.",
          cta: "Ir ao perfil e completar a verificación",
        },
        serviceSelectionRequired: {
          badge: "Requírese selección do servizo",
          title: "Complete primeiro o paso dos servizos",
          description:
            "Despois de completar o perfil, o propietario debe volver primeiro á sección de servizos. O panel permanece bloqueado nesta fase.",
          cta: "Ir aos servizos",
        },
        subscriptionRequired: {
          badge: "Requírese subscrición",
          title: "Non hai ningunha subscrición activa",
          description:
            "Seleccionouse un servizo, pero o pagamento non se completou ou a subscrición non está activa. O panel permanecerá bloqueado e outros procesos do propietario seguirán bloqueados.",
          cta: "Ir á subscrición",
        },
        active: {
          badge: "Activo",
          title: "O panel está aberto",
          description:
            "A subscrición está activa. O propietario pode crear anuncios, xestionar anuncios, procesar solicitudes de reserva e usar o sistema por completo.",
          cta: "Ver servizos",
        },
      },
      meta: {
        serviceCodeLabel: "Código do servizo",
        planLabel: "Plan",
        accessLabel: "Estado de acceso",
        planStandardLabel: "Estándar",
        planPlusLabel: "Plus",
        accessActiveLabel: "Aberto",
        accessLockedLabel: "Bloqueado",
      },
      services: {
        RENT_HOME: "Alugueiro de vivendas",
        BARBER: "Barbeiro",
        CAR_RENTAL: "Alugueiro de coches",
        HOTEL: "Hotel",
        BEAUTY_SALON: "Salón de beleza",
        BABYSITTER: "Coidadora de nenos",
        CLEANING: "Servizos de limpeza",
        TECHNICAL_SERVICES: "Servizos técnicos",
      },
    },
    services: {
      hero: {
        pageTitle: "Selección de servizo",
        lockedDescription:
          "Esta páxina é o punto de entrada do onboarding do propietario. Ata que se completen o perfil e a verificación do teléfono, o fluxo do servizo, a facturación e o panel permanecerán bloqueados.",
        activeDescription:
          "Primeiro escolla un plan e despois escolla o servizo co que quere continuar. Se non hai unha subscrición activa, o seguinte paso é a facturación. O panel só se abrirá despois de completar correctamente a facturación.",
        currentStateLabel: "Estado actual",
      },
      summary: {
        previewMode: "Os servizos están en modo de previsualización",
        selectedPlanOnly: "Plan {planLabel}",
        selectedPlanWithStatus: "Plan {planLabel} • {statusLabel}",
        activePlanWithStatus:
          "Plan activo: {activePlanLabel} • {statusLabel}",
        billingCompleted: "facturación completada",
        billingPending: "facturación pendente",
        planChangePending:
          "requírese facturación para cambiar de plan",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "Requírese o perfil do propietario",
          message:
            "Para usar os servizos, primeiro debe introducir os datos do propietario. Ata que o perfil estea completo, a facturación e o panel permanecerán bloqueados.",
          cta: "Ir á páxina do perfil",
        },
        phoneVerificationRequired: {
          title: "Requírese a verificación do teléfono",
          message:
            "O perfil gardouse, pero o teléfono debe verificarse con OTP. Ata que se complete a verificación do teléfono, a selección do servizo permanecerá en modo de previsualización e a facturación / o panel seguirán bloqueados.",
          cta: "Ir ao perfil e completar a verificación",
        },
      },
      plans: {
        stepLabel: "Paso 1",
        title: "Escolla un plan",
        activeDescription:
          "A selección do plan só se activa despois de completar o perfil e a verificación do teléfono.",
        lockedDescription:
          "As tarxetas do plan son actualmente só de previsualización. Non pode continuar ata que se completen o perfil e a verificación do teléfono.",
        standard: {
          label: "Estándar",
          badge: "Plan mensual",
          description:
            "Unha opción simple e estable para o fluxo principal do propietario.",
          helper: "Os anuncios móstranse na orde estándar.",
        },
        plus: {
          label: "Plus",
          badge: "Visibilidade prioritaria",
          description:
            "Máis visibilidade dentro da mesma categoría e dos mesmos filtros.",
          helper:
            "Os anuncios Plus móstranse antes que os anuncios estándar.",
        },
        selectedChip: "Seleccionado",
        lockedNote:
          "A selección do plan queda bloqueada ata que se complete o perfil",
      },
      serviceList: {
        stepLabel: "Paso 2",
        title: "Escolla un servizo",
        activeDescription:
          "Despois de seleccionar un servizo, o seguinte paso é a facturación. Para os servizos con subscrición activa, o acceso directo ao panel só estará dispoñible para ese plan activo.",
        lockedDescription:
          "Ata que non se complete o onboarding do propietario, a selección do servizo permanecerá en modo de previsualización e a continuación quedará bloqueada.",
        carouselAria: "Navegar entre servizos",
        previousServices: "Servizos anteriores",
        nextServices: "Servizos seguintes",
        loadingServices:
          "Non se puideron cargar os servizos temporalmente. Ténteo de novo máis tarde.",
        requestTimeout:
          "A solicitude esgotou o tempo de espera. O backend non respondeu.",
        noServices: "Non se atopou ningún servizo.",
        profileCompletionInfo:
          "A selección do servizo activarase aquí despois de completar o perfil e a verificación do teléfono.",
      },
      badges: {
        activeSubscription: "Subscrición activa",
        continueWithPlus: "Continuar con Plus",
        continueWithStandard: "Continuar con Estándar",
        selected: "Seleccionado",
        activePlanLabel: "Plan activo",
        changePlanBadge: "Cambio de plan",
      },
      meta: {
        planLabel: "Plan",
        priceLabel: "Prezo",
        priceInactive: "O prezo non está activo",
      },
      cards: {
        fallbackDescription:
          "O fluxo do propietario para este servizo está activo e pode continuar á seguinte fase.",
        lockedFooter:
          "Non pode continuar con este servizo ata que se completen o perfil e a verificación do teléfono",
        activeFooterFallback:
          "Hai unha subscrición activa dispoñible",
        activeFooterWithDate: "Activo ata • {paidUntil}",
        billingFooter:
          "Despois de seleccionar este servizo, o seguinte paso será a facturación",
        planChangeFooter:
          "Requírese facturación para o plan seleccionado",
        planChangeFooterWithActivePlan:
          "Plan activo: {activePlanLabel} • Requírese facturación para o plan seleccionado",
        titleFallback: "Servizo",
      },
      selection: {
        flowLabel: "Fluxo seleccionado",
        notSelected: "Non se seleccionou ningún servizo",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Para continuar, primeiro escolla un servizo arriba.",
        billingCompletedFlow:
          "Hai unha subscrición activa visible para o plan seleccionado deste servizo. A facturación xa está completada e continuar abrirá o panel.",
        billingPendingFlow:
          "O servizo foi seleccionado. O seguinte paso é a facturación. O panel non se activará ata que o pagamento se complete correctamente.",
        planChangeMessage:
          "Actualmente ten unha subscrición activa ao plan {activePlanLabel}. Se actualiza a subscrición ao plan {targetPlanLabel}, o plan activo anterior cancelarase e o plan {targetPlanLabel} activarase durante os próximos 30 días.",
        resetService: "Restablecer servizo",
        chooseServiceButton: "Escoller servizo",
        changePlanButton:
          "Ir á facturación e actualizar o plan",
        goToProfile: "Ir á páxina do perfil",
        goToDashboard: "Ir ao panel",
        goToBilling: "Ir á facturación",
        redirecting: "Redirixindo...",
      },
      status: {
        profileRequired: "Requírese perfil",
        phoneRequired: "Verificación do teléfono pendente",
        active: "Activo",
        billingRequired: "Requírese facturación",
        serviceSelection: "Selección do servizo",
        planChangeRequired: "Requírese cambio de plan",
      },
      errors: {
        ownerNotFoundLoadError:
          "Non se atopou o perfil do propietario.",
        servicesLoadErrorFallback:
          "Non se puideron cargar os servizos",
        servicesLoadErrorWithStatus:
          "Non se puideron cargar os servizos (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;