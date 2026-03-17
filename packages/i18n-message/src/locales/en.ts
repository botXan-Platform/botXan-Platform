import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const enMessages = {
  common: {
    brand: {
      homeAriaLabel: "Home page",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Language selection",
      selectorMenuAriaLabel: "Language selection menu",
      currentLocaleTitle: "Current language: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Owner dashboard",
        checkingContext: "Checking service context...",
        subtitle:
          "The dashboard opens only after owner onboarding and subscription flow are completed. The active service, plan, and access status are shown below.",
      },
      summary: {
        activeServiceLabel: "Active service",
        ownerLabel: "Owner",
        paidUntilLabel: "Paid until",
        loadingStatus: "Checking status...",
        activeServiceFallback: "No active service found",
        serviceGenericLabel: "Service",
      },
      notes: {
        loading: "Checking status...",
        active:
          "Note: dashboard links work with the selected service context. The create, edit, and delete listing flow is unified inside the My listings section.",
        locked:
          "Note: the dashboard is intentionally locked at this stage. Use the action button above for the next step.",
      },
      errors: {
        prefix: "Error",
        dashboardStateLoadFailed: "Dashboard state could not be loaded.",
        completeOwnerProfileFirst: "Complete the owner profile first.",
        phoneVerificationRequired: "Phone verification must be completed.",
        serviceSelectionRequired: "Service selection must be completed first.",
        activeSubscriptionNotFound: "No active subscription was found.",
        serviceNotFoundOrInactive: "Service was not found or is inactive.",
        serverErrorOccurred: "A server error occurred. Please try again later.",
        ownerIdentityRequired: "Complete the owner profile first.",
      },
      cards: {
        properties: {
          title: "My listings",
          text: "View all listings, create a new listing, edit active listings, and delete them.",
        },
        profile: {
          title: "Profile details",
          text: "Manage your name, phone number, and other profile details.",
        },
        billing: {
          title: "Subscription and billing",
          text: "Check the status and proceed to the payment flow.",
        },
        bookings: {
          title: "Booking requests",
          text: "Approve or reject incoming requests.",
        },
        lockedChip: "Locked",
        lockedDescriptions: {
          profile:
            "This section remains locked inside the dashboard. Use the action button above to open the profile page.",
          billing:
            "At this stage, billing is opened through the action button. The dashboard card remains locked.",
          properties:
            "Creating, editing, and deleting listings become available only after owner onboarding and subscription are completed.",
          default:
            "This section is not available until owner onboarding and subscription are completed.",
        },
      },
      states: {
        profileRequired: {
          badge: "Dashboard is locked",
          title: "Owner profile is required",
          description:
            "To use services, you must first enter owner information. Until the profile is completed, the dashboard, billing, and other sections remain locked.",
          cta: "Go to profile page",
        },
        phoneVerificationRequired: {
          badge: "OTP verification is required",
          title: "Phone is not verified",
          description:
            "The profile has been created as a draft, but the owner is not considered active until the phone is verified with OTP. The dashboard and other owner capabilities remain locked.",
          cta: "Go to profile and complete verification",
        },
        serviceSelectionRequired: {
          badge: "Service selection is required",
          title: "Complete the services step first",
          description:
            "After the profile is completed, the owner must return to the services section first. The dashboard remains locked at this stage.",
          cta: "Go to services",
        },
        subscriptionRequired: {
          badge: "Subscription is required",
          title: "No active subscription",
          description:
            "A service has been selected, but payment has not been completed or the subscription is inactive. The dashboard stays locked and other owner processes remain blocked.",
          cta: "Go to subscription",
        },
        active: {
          badge: "Active",
          title: "Dashboard is open",
          description:
            "The subscription is active. The owner can create listings, manage listings, manage booking requests, and use the system fully.",
          cta: "View services",
        },
      },
      meta: {
        serviceCodeLabel: "Service code",
        planLabel: "Plan",
        accessLabel: "Access status",
        planStandardLabel: "Standard",
        planPlusLabel: "Plus",
        accessActiveLabel: "Open",
        accessLockedLabel: "Locked",
      },
      services: {
        RENT_HOME: "Home rental",
        BARBER: "Barber",
        CAR_RENTAL: "Car rental",
        HOTEL: "Hotel",
        BEAUTY_SALON: "Beauty salon",
        BABYSITTER: "Babysitter",
        CLEANING: "Cleaning services",
        TECHNICAL_SERVICES: "Technical services",
      },
    },
    services: {
      hero: {
        pageTitle: "Service selection",
        lockedDescription:
          "This page is the owner onboarding entry point. Until profile and phone verification are completed, service flow, billing, and dashboard remain locked.",
        activeDescription:
          "First choose a plan, then choose the service you want to continue with. If there is no active subscription, the next step is billing. The dashboard opens only after successful billing.",
        currentStateLabel: "Current state",
      },
      summary: {
        previewMode: "Services are in preview mode",
        selectedPlanOnly: "{planLabel} plan",
        selectedPlanWithStatus: "{planLabel} plan • {statusLabel}",
        activePlanWithStatus: "Active plan: {activePlanLabel} • {statusLabel}",
        billingCompleted: "billing completed",
        billingPending: "billing pending",
        planChangePending: "billing is required for a plan change",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "Owner profile is required",
          message:
            "To use services, you must first enter owner details. Until the profile is completed, billing and dashboard remain locked.",
          cta: "Go to profile page",
        },
        phoneVerificationRequired: {
          title: "Phone verification is required",
          message:
            "The profile has been saved, but the phone must be verified with OTP. Until phone verification is completed, service selection remains in preview mode and billing / dashboard stay locked.",
          cta: "Go to profile and complete verification",
        },
      },
      plans: {
        stepLabel: "Step 1",
        title: "Choose a plan",
        activeDescription:
          "Plan selection becomes active only after profile and phone verification.",
        lockedDescription:
          "Plan cards are currently for preview only. You cannot continue until profile and phone verification are completed.",
        standard: {
          label: "Standard",
          badge: "Monthly plan",
          description: "A simple and stable choice for the core owner flow.",
          helper: "Listings are shown in standard order.",
        },
        plus: {
          label: "Plus",
          badge: "Priority visibility",
          description: "Higher visibility within the same category and filters.",
          helper: "Plus listings are shown before standard listings.",
        },
        selectedChip: "Selected",
        lockedNote: "Plan selection is locked until profile completion",
      },
      serviceList: {
        stepLabel: "Step 2",
        title: "Choose a service",
        activeDescription:
          "After selecting a service, the next step is billing. For services with an active subscription, direct dashboard access becomes available only for that active plan.",
        lockedDescription:
          "Until owner onboarding is completed, service selection remains in preview mode and continuation is blocked.",
        carouselAria: "Navigate between services",
        previousServices: "Previous services",
        nextServices: "Next services",
        loadingServices:
          "Services could not be loaded temporarily. Please try again later.",
        requestTimeout: "The request timed out. The backend did not respond.",
        noServices: "No services were found.",
        profileCompletionInfo:
          "Service selection will become active here after profile and phone verification are completed.",
      },
      badges: {
        activeSubscription: "Active subscription",
        continueWithPlus: "Continue with Plus",
        continueWithStandard: "Continue with Standard",
        selected: "Selected",
        activePlanLabel: "Active plan",
        changePlanBadge: "Plan change",
      },
      meta: {
        planLabel: "Plan",
        priceLabel: "Price",
        priceInactive: "Price is not active",
      },
      cards: {
        fallbackDescription:
          "The owner flow for this service is active and you can proceed to the next stage.",
        lockedFooter:
          "You cannot continue with this service until profile and phone verification are completed",
        activeFooterFallback: "An active subscription is available",
        activeFooterWithDate: "Active until • {paidUntil}",
        billingFooter:
          "After selecting this service, the next step will be billing",
        planChangeFooter: "Billing is required for the selected plan",
        planChangeFooterWithActivePlan:
          "Active plan: {activePlanLabel} • Billing is required for the selected plan",
        titleFallback: "Service",
      },
      selection: {
        flowLabel: "Selected flow",
        notSelected: "No service selected",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst: "To continue, first choose a service above.",
        billingCompletedFlow:
          "An active subscription is visible for the selected plan of this service. Billing is already completed, and continuing will open the dashboard.",
        billingPendingFlow:
          "The service has been selected. The next step is billing. The dashboard will not become active until payment is completed successfully.",
        planChangeMessage:
          "You currently have an active {activePlanLabel} subscription. If you update the subscription to {targetPlanLabel}, the previous active plan will be canceled and the {targetPlanLabel} plan will be activated for the next 30 days.",
        resetService: "Reset service",
        chooseServiceButton: "Choose service",
        changePlanButton: "Go to billing and update plan",
        goToProfile: "Go to profile page",
        goToDashboard: "Go to dashboard",
        goToBilling: "Go to billing",
        redirecting: "Redirecting...",
      },
      status: {
        profileRequired: "Profile required",
        phoneRequired: "Phone verification pending",
        active: "Active",
        billingRequired: "Billing required",
        serviceSelection: "Service selection",
        planChangeRequired: "Plan change required",
      },
      errors: {
        ownerNotFoundLoadError: "Owner profile was not found.",
        servicesLoadErrorFallback: "Services could not be loaded",
        servicesLoadErrorWithStatus: "Services could not be loaded (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;