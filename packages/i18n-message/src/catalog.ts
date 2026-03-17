import type { Locale, MessageValue } from "i18n-core";

export type LocaleNameMessages = {
  readonly [Key in Locale]: MessageValue;
};

export interface AppMessagesCatalog {
  readonly common: {
    readonly brand: {
      readonly homeAriaLabel: MessageValue;
      readonly fallbackName: MessageValue;
    };
    readonly language: {
      readonly selectorAriaLabel: MessageValue;
      readonly selectorMenuAriaLabel: MessageValue;
      readonly currentLocaleTitle: MessageValue;
      readonly localeNames: LocaleNameMessages;
    };
  };
  readonly owner: {
    readonly dashboard: {
      readonly hero: {
        readonly title: MessageValue;
        readonly checkingContext: MessageValue;
        readonly subtitle: MessageValue;
      };
      readonly summary: {
        readonly activeServiceLabel: MessageValue;
        readonly ownerLabel: MessageValue;
        readonly paidUntilLabel: MessageValue;
        readonly loadingStatus: MessageValue;
        readonly activeServiceFallback: MessageValue;
        readonly serviceGenericLabel: MessageValue;
      };
      readonly notes: {
        readonly loading: MessageValue;
        readonly active: MessageValue;
        readonly locked: MessageValue;
      };
      readonly errors: {
        readonly prefix: MessageValue;
        readonly dashboardStateLoadFailed: MessageValue;
        readonly completeOwnerProfileFirst: MessageValue;
        readonly phoneVerificationRequired: MessageValue;
        readonly serviceSelectionRequired: MessageValue;
        readonly activeSubscriptionNotFound: MessageValue;
        readonly serviceNotFoundOrInactive: MessageValue;
        readonly serverErrorOccurred: MessageValue;
        readonly ownerIdentityRequired: MessageValue;
      };
      readonly cards: {
        readonly properties: {
          readonly title: MessageValue;
          readonly text: MessageValue;
        };
        readonly profile: {
          readonly title: MessageValue;
          readonly text: MessageValue;
        };
        readonly billing: {
          readonly title: MessageValue;
          readonly text: MessageValue;
        };
        readonly bookings: {
          readonly title: MessageValue;
          readonly text: MessageValue;
        };
        readonly lockedChip: MessageValue;
        readonly lockedDescriptions: {
          readonly profile: MessageValue;
          readonly billing: MessageValue;
          readonly properties: MessageValue;
          readonly default: MessageValue;
        };
      };
      readonly states: {
        readonly profileRequired: {
          readonly badge: MessageValue;
          readonly title: MessageValue;
          readonly description: MessageValue;
          readonly cta: MessageValue;
        };
        readonly phoneVerificationRequired: {
          readonly badge: MessageValue;
          readonly title: MessageValue;
          readonly description: MessageValue;
          readonly cta: MessageValue;
        };
        readonly serviceSelectionRequired: {
          readonly badge: MessageValue;
          readonly title: MessageValue;
          readonly description: MessageValue;
          readonly cta: MessageValue;
        };
        readonly subscriptionRequired: {
          readonly badge: MessageValue;
          readonly title: MessageValue;
          readonly description: MessageValue;
          readonly cta: MessageValue;
        };
        readonly active: {
          readonly badge: MessageValue;
          readonly title: MessageValue;
          readonly description: MessageValue;
          readonly cta: MessageValue;
        };
      };
      readonly meta: {
        readonly serviceCodeLabel: MessageValue;
        readonly planLabel: MessageValue;
        readonly accessLabel: MessageValue;
        readonly planStandardLabel: MessageValue;
        readonly planPlusLabel: MessageValue;
        readonly accessActiveLabel: MessageValue;
        readonly accessLockedLabel: MessageValue;
      };
      readonly services: {
        readonly RENT_HOME: MessageValue;
        readonly BARBER: MessageValue;
        readonly CAR_RENTAL: MessageValue;
        readonly HOTEL: MessageValue;
        readonly BEAUTY_SALON: MessageValue;
        readonly BABYSITTER: MessageValue;
        readonly CLEANING: MessageValue;
        readonly TECHNICAL_SERVICES: MessageValue;
      };
    };
    readonly services: {
      readonly hero: {
        readonly pageTitle: MessageValue;
        readonly lockedDescription: MessageValue;
        readonly activeDescription: MessageValue;
        readonly currentStateLabel: MessageValue;
      };
      readonly summary: {
        readonly previewMode: MessageValue;
        readonly selectedPlanOnly: MessageValue;
        readonly selectedPlanWithStatus: MessageValue;
        readonly activePlanWithStatus: MessageValue;
        readonly billingCompleted: MessageValue;
        readonly billingPending: MessageValue;
        readonly planChangePending: MessageValue;
      };
      readonly gate: {
        readonly onboardingLabel: MessageValue;
        readonly profileRequired: {
          readonly title: MessageValue;
          readonly message: MessageValue;
          readonly cta: MessageValue;
        };
        readonly phoneVerificationRequired: {
          readonly title: MessageValue;
          readonly message: MessageValue;
          readonly cta: MessageValue;
        };
      };
      readonly plans: {
        readonly stepLabel: MessageValue;
        readonly title: MessageValue;
        readonly activeDescription: MessageValue;
        readonly lockedDescription: MessageValue;
        readonly standard: {
          readonly label: MessageValue;
          readonly badge: MessageValue;
          readonly description: MessageValue;
          readonly helper: MessageValue;
        };
        readonly plus: {
          readonly label: MessageValue;
          readonly badge: MessageValue;
          readonly description: MessageValue;
          readonly helper: MessageValue;
        };
        readonly selectedChip: MessageValue;
        readonly lockedNote: MessageValue;
      };
      readonly serviceList: {
        readonly stepLabel: MessageValue;
        readonly title: MessageValue;
        readonly activeDescription: MessageValue;
        readonly lockedDescription: MessageValue;
        readonly carouselAria: MessageValue;
        readonly previousServices: MessageValue;
        readonly nextServices: MessageValue;
        readonly loadingServices: MessageValue;
        readonly requestTimeout: MessageValue;
        readonly noServices: MessageValue;
        readonly profileCompletionInfo: MessageValue;
      };
      readonly badges: {
        readonly activeSubscription: MessageValue;
        readonly continueWithPlus: MessageValue;
        readonly continueWithStandard: MessageValue;
        readonly selected: MessageValue;
        readonly activePlanLabel: MessageValue;
        readonly changePlanBadge: MessageValue;
      };
      readonly meta: {
        readonly planLabel: MessageValue;
        readonly priceLabel: MessageValue;
        readonly priceInactive: MessageValue;
      };
      readonly cards: {
        readonly fallbackDescription: MessageValue;
        readonly lockedFooter: MessageValue;
        readonly activeFooterFallback: MessageValue;
        readonly activeFooterWithDate: MessageValue;
        readonly billingFooter: MessageValue;
        readonly planChangeFooter: MessageValue;
        readonly planChangeFooterWithActivePlan: MessageValue;
        readonly titleFallback: MessageValue;
      };
      readonly selection: {
        readonly flowLabel: MessageValue;
        readonly notSelected: MessageValue;
        readonly selectedHeadline: MessageValue;
        readonly selectServiceFirst: MessageValue;
        readonly billingCompletedFlow: MessageValue;
        readonly billingPendingFlow: MessageValue;
        readonly planChangeMessage: MessageValue;
        readonly resetService: MessageValue;
        readonly chooseServiceButton: MessageValue;
        readonly changePlanButton: MessageValue;
        readonly goToProfile: MessageValue;
        readonly goToDashboard: MessageValue;
        readonly goToBilling: MessageValue;
        readonly redirecting: MessageValue;
      };
      readonly status: {
        readonly profileRequired: MessageValue;
        readonly phoneRequired: MessageValue;
        readonly active: MessageValue;
        readonly billingRequired: MessageValue;
        readonly serviceSelection: MessageValue;
        readonly planChangeRequired: MessageValue;
      };
      readonly errors: {
        readonly ownerNotFoundLoadError: MessageValue;
        readonly servicesLoadErrorFallback: MessageValue;
        readonly servicesLoadErrorWithStatus: MessageValue;
      };
    };
  };
}