import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const esMessages = {
  common: {
    brand: {
      homeAriaLabel: "Página principal",
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
        title: "Panel del propietario",
        checkingContext: "Se está comprobando el contexto del servicio...",
        subtitle:
          "El panel solo se abre después de completar el proceso de incorporación del propietario y el flujo de suscripción. A continuación se muestran el servicio activo, el plan y el estado de acceso.",
      },
      summary: {
        activeServiceLabel: "Servicio activo",
        ownerLabel: "Propietario",
        paidUntilLabel: "Pagado hasta",
        loadingStatus: "Se está comprobando el estado...",
        activeServiceFallback: "No se encontró ningún servicio activo",
        serviceGenericLabel: "Servicio",
      },
      notes: {
        loading: "Se está comprobando el estado...",
        active:
          "Nota: los enlaces del panel funcionan con el contexto del servicio seleccionado. El flujo para crear, editar y eliminar anuncios está unificado dentro de la sección Mis anuncios.",
        locked:
          "Nota: el panel está bloqueado intencionadamente en esta etapa. Utilice el botón de acción de arriba para el siguiente paso.",
      },
      errors: {
        prefix: "Error",
        dashboardStateLoadFailed:
          "No se pudo cargar el estado del panel.",
        completeOwnerProfileFirst:
          "Complete primero el perfil del propietario.",
        phoneVerificationRequired:
          "La verificación del teléfono debe completarse.",
        serviceSelectionRequired:
          "La selección del servicio debe completarse primero.",
        activeSubscriptionNotFound:
          "No se encontró ninguna suscripción activa.",
        serviceNotFoundOrInactive:
          "No se encontró el servicio o no está activo.",
        serverErrorOccurred:
          "Se produjo un error del servidor. Inténtelo de nuevo más tarde.",
        ownerIdentityRequired:
          "Complete primero el perfil del propietario.",
      },
      cards: {
        properties: {
          title: "Mis anuncios",
          text: "Vea todos sus anuncios, cree uno nuevo, edite los anuncios activos y elimínelos.",
        },
        profile: {
          title: "Datos del perfil",
          text: "Gestione su nombre, número de teléfono y otros datos del perfil.",
        },
        billing: {
          title: "Suscripción y pagos",
          text: "Compruebe el estado y continúe con el flujo de pago.",
        },
        bookings: {
          title: "Solicitudes de reserva",
          text: "Apruebe o rechace las solicitudes entrantes.",
        },
        lockedChip: "Bloqueado",
        lockedDescriptions: {
          profile:
            "Esta sección permanece bloqueada dentro del panel. Utilice el botón de acción de arriba para abrir la página del perfil.",
          billing:
            "En esta etapa, la sección de suscripción se abre mediante el botón de acción. La tarjeta del panel permanece bloqueada.",
          properties:
            "La creación, edición y eliminación de anuncios solo están disponibles después de completar la incorporación del propietario y la suscripción.",
          default:
            "Esta sección no está disponible hasta que se completen la incorporación del propietario y la suscripción.",
        },
      },
      states: {
        profileRequired: {
          badge: "El panel está bloqueado",
          title: "Se requiere el perfil del propietario",
          description:
            "Para utilizar los servicios, primero debe introducir la información del propietario. Hasta que el perfil esté completo, el panel, la facturación y otras secciones permanecerán bloqueados.",
          cta: "Ir a la página del perfil",
        },
        phoneVerificationRequired: {
          badge: "Se requiere verificación OTP",
          title: "El teléfono no está verificado",
          description:
            "El perfil se ha creado como borrador, pero el propietario no se considera activo hasta que el teléfono se verifique con OTP. El panel y otras capacidades del propietario permanecerán bloqueados.",
          cta: "Ir al perfil y completar la verificación",
        },
        serviceSelectionRequired: {
          badge: "Se requiere selección de servicio",
          title: "Complete primero el paso de servicios",
          description:
            "Después de completar el perfil, el propietario debe volver primero a la sección de servicios. El panel permanece bloqueado en esta etapa.",
          cta: "Ir a servicios",
        },
        subscriptionRequired: {
          badge: "Se requiere suscripción",
          title: "No hay suscripción activa",
          description:
            "Se ha seleccionado un servicio, pero el pago no se ha completado o la suscripción no está activa. El panel permanecerá bloqueado y otros procesos del propietario seguirán bloqueados.",
          cta: "Ir a suscripción",
        },
        active: {
          badge: "Activo",
          title: "El panel está abierto",
          description:
            "La suscripción está activa. El propietario puede crear anuncios, gestionarlos, procesar solicitudes de reserva y utilizar el sistema por completo.",
          cta: "Ver servicios",
        },
      },
      meta: {
        serviceCodeLabel: "Código del servicio",
        planLabel: "Plan",
        accessLabel: "Estado de acceso",
        planStandardLabel: "Estándar",
        planPlusLabel: "Plus",
        accessActiveLabel: "Abierto",
        accessLockedLabel: "Bloqueado",
      },
      services: {
        RENT_HOME: "Alquiler de viviendas",
        BARBER: "Barbería",
        CAR_RENTAL: "Alquiler de coches",
        HOTEL: "Hotel",
        BEAUTY_SALON: "Salón de belleza",
        BABYSITTER: "Niñera",
        CLEANING: "Servicios de limpieza",
        TECHNICAL_SERVICES: "Servicios técnicos",
      },
    },
    services: {
      hero: {
        pageTitle: "Selección de servicio",
        lockedDescription:
          "Esta página es el punto de entrada del onboarding del propietario. Hasta que se completen el perfil y la verificación del teléfono, el flujo del servicio, la facturación y el panel permanecerán bloqueados.",
        activeDescription:
          "Primero elija un plan y luego elija el servicio con el que desea continuar. Si no hay una suscripción activa, el siguiente paso es la facturación. El panel solo se abrirá después de completar la facturación correctamente.",
        currentStateLabel: "Estado actual",
      },
      summary: {
        previewMode: "Los servicios están en modo de vista previa",
        selectedPlanOnly: "Plan {planLabel}",
        selectedPlanWithStatus: "Plan {planLabel} • {statusLabel}",
        activePlanWithStatus: "Plan activo: {activePlanLabel} • {statusLabel}",
        billingCompleted: "facturación completada",
        billingPending: "facturación pendiente",
        planChangePending: "se requiere facturación para cambiar de plan",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "Se requiere el perfil del propietario",
          message:
            "Para utilizar los servicios, primero debe introducir los datos del propietario. Hasta que el perfil esté completo, la facturación y el panel permanecerán bloqueados.",
          cta: "Ir a la página del perfil",
        },
        phoneVerificationRequired: {
          title: "Se requiere la verificación del teléfono",
          message:
            "El perfil se ha guardado, pero el teléfono debe verificarse con OTP. Hasta que se complete la verificación del teléfono, la selección de servicio permanecerá en modo de vista previa y la facturación / el panel seguirán bloqueados.",
          cta: "Ir al perfil y completar la verificación",
        },
      },
      plans: {
        stepLabel: "Paso 1",
        title: "Elija un plan",
        activeDescription:
          "La selección del plan solo se activa después de completar el perfil y la verificación del teléfono.",
        lockedDescription:
          "Las tarjetas del plan son solo de vista previa por ahora. No puede continuar hasta que se completen el perfil y la verificación del teléfono.",
        standard: {
          label: "Estándar",
          badge: "Plan mensual",
          description:
            "Una opción simple y estable para el flujo principal del propietario.",
          helper: "Los anuncios se muestran en el orden estándar.",
        },
        plus: {
          label: "Plus",
          badge: "Visibilidad prioritaria",
          description:
            "Mayor visibilidad dentro de la misma categoría y los mismos filtros.",
          helper:
            "Los anuncios Plus se muestran antes que los anuncios estándar.",
        },
        selectedChip: "Seleccionado",
        lockedNote:
          "La selección del plan permanece bloqueada hasta completar el perfil",
      },
      serviceList: {
        stepLabel: "Paso 2",
        title: "Elija un servicio",
        activeDescription:
          "Después de seleccionar un servicio, el siguiente paso es la facturación. Para los servicios con una suscripción activa, el acceso directo al panel solo estará disponible para ese plan activo.",
        lockedDescription:
          "Hasta que se complete el onboarding del propietario, la selección de servicio permanecerá en modo de vista previa y la continuación estará bloqueada.",
        carouselAria: "Navegar entre servicios",
        previousServices: "Servicios anteriores",
        nextServices: "Siguientes servicios",
        loadingServices:
          "No se pudieron cargar los servicios temporalmente. Inténtelo de nuevo más tarde.",
        requestTimeout:
          "La solicitud excedió el tiempo de espera. El backend no respondió.",
        noServices: "No se encontró ningún servicio.",
        profileCompletionInfo:
          "La selección de servicio se activará aquí después de completar el perfil y la verificación del teléfono.",
      },
      badges: {
        activeSubscription: "Suscripción activa",
        continueWithPlus: "Continuar con Plus",
        continueWithStandard: "Continuar con Estándar",
        selected: "Seleccionado",
        activePlanLabel: "Plan activo",
        changePlanBadge: "Cambio de plan",
      },
      meta: {
        planLabel: "Plan",
        priceLabel: "Precio",
        priceInactive: "El precio no está activo",
      },
      cards: {
        fallbackDescription:
          "El flujo del propietario para este servicio está activo y puede continuar a la siguiente etapa.",
        lockedFooter:
          "No puede continuar con este servicio hasta que se completen el perfil y la verificación del teléfono",
        activeFooterFallback: "Hay una suscripción activa disponible",
        activeFooterWithDate: "Activo hasta • {paidUntil}",
        billingFooter:
          "Después de seleccionar este servicio, el siguiente paso será la facturación",
        planChangeFooter:
          "Se requiere facturación para el plan seleccionado",
        planChangeFooterWithActivePlan:
          "Plan activo: {activePlanLabel} • Se requiere facturación para el plan seleccionado",
        titleFallback: "Servicio",
      },
      selection: {
        flowLabel: "Flujo seleccionado",
        notSelected: "No se ha seleccionado ningún servicio",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Para continuar, primero elija un servicio arriba.",
        billingCompletedFlow:
          "Hay una suscripción activa visible para el plan seleccionado de este servicio. La facturación ya está completada y continuar abrirá el panel.",
        billingPendingFlow:
          "El servicio ha sido seleccionado. El siguiente paso es la facturación. El panel no se activará hasta que el pago se complete correctamente.",
        planChangeMessage:
          "Actualmente tiene una suscripción activa al plan {activePlanLabel}. Si actualiza la suscripción al plan {targetPlanLabel}, el plan activo anterior se cancelará y el plan {targetPlanLabel} se activará durante los próximos 30 días.",
        resetService: "Restablecer servicio",
        chooseServiceButton: "Elegir servicio",
        changePlanButton: "Ir a facturación y actualizar el plan",
        goToProfile: "Ir a la página del perfil",
        goToDashboard: "Ir al panel",
        goToBilling: "Ir a facturación",
        redirecting: "Redirigiendo...",
      },
      status: {
        profileRequired: "Se requiere perfil",
        phoneRequired: "Verificación del teléfono pendiente",
        active: "Activo",
        billingRequired: "Se requiere facturación",
        serviceSelection: "Selección de servicio",
        planChangeRequired: "Se requiere cambio de plan",
      },
      errors: {
        ownerNotFoundLoadError: "No se encontró el perfil del propietario.",
        servicesLoadErrorFallback: "No se pudieron cargar los servicios",
        servicesLoadErrorWithStatus:
          "No se pudieron cargar los servicios (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;