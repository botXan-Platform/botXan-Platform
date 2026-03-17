import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const azMessages = {
  common: {
    brand: {
      homeAriaLabel: "Ana səhifə",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Dil seçimi",
      selectorMenuAriaLabel: "Dil seçimi menyusu",
      currentLocaleTitle: "Cari dil: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Sahibkar paneli",
        checkingContext: "Xidmət konteksti yoxlanılır...",
        subtitle:
          "İdarəetmə paneli yalnız sahibkar qeydiyyatı və abunəlik mərhələsi tamamlandıqdan sonra açılır. Aktiv xidmət, plan və giriş statusu aşağıda göstərilir.",
      },
      summary: {
        activeServiceLabel: "Aktiv xidmət",
        ownerLabel: "Sahibkar",
        paidUntilLabel: "Qüvvədə olma tarixi",
        loadingStatus: "Status yoxlanılır...",
        activeServiceFallback: "Aktiv xidmət tapılmadı",
        serviceGenericLabel: "Xidmət",
      },
      notes: {
        loading: "Status yoxlanılır...",
        active:
          "Qeyd: idarəetmə paneli keçidləri seçilmiş xidmət konteksti ilə işləyir. Elan yaratma, redaktə etmə və silmə axını Elanlarım bölməsində birləşdirilib.",
        locked:
          "Qeyd: idarəetmə paneli bu mərhələdə məqsədli şəkildə bağlı saxlanılır. Növbəti addım üçün yuxarıdakı hərəkət düyməsindən istifadə edin.",
      },
      errors: {
        prefix: "Xəta",
        dashboardStateLoadFailed: "İdarəetmə panelinin vəziyyəti yüklənmədi.",
        completeOwnerProfileFirst: "Əvvəlcə sahibkar profilini tamamlayın.",
        phoneVerificationRequired: "Telefon təsdiqi tamamlanmalıdır.",
        serviceSelectionRequired: "Əvvəlcə xidmət seçimi tamamlanmalıdır.",
        activeSubscriptionNotFound: "Aktiv abunəlik tapılmadı.",
        serviceNotFoundOrInactive: "Xidmət tapılmadı və ya aktiv deyil.",
        serverErrorOccurred:
          "Server xətası baş verdi. Bir qədər sonra yenidən cəhd edin.",
        ownerIdentityRequired: "Əvvəlcə sahibkar profilini tamamlayın.",
      },
      cards: {
        properties: {
          title: "Elanlarım",
          text: "Bütün elanlarınızı göstərin, yeni elan yaradın, aktiv elanları redaktə edin və silin.",
        },
        profile: {
          title: "Profil məlumatları",
          text: "Ad, telefon və digər profil məlumatlarınızı idarə edin.",
        },
        billing: {
          title: "Abunəlik və ödənişlər",
          text: "Statusu yoxlayın və ödəniş mərhələsinə keçin.",
        },
        bookings: {
          title: "Rezervasiya sorğuları",
          text: "Daxil olan sorğuları təsdiqləyin və ya rədd edin.",
        },
        lockedChip: "Bağlıdır",
        lockedDescriptions: {
          profile:
            "Bu bölmə idarəetmə paneli daxilində bağlıdır. Profil səhifəsinə keçmək üçün yuxarıdakı hərəkət düyməsindən istifadə edin.",
          billing:
            "Bu mərhələdə abunəlik bölməsi hərəkət düyməsi ilə açılır. İdarəetmə panelindəki kart bağlı saxlanılır.",
          properties:
            "Elan yaratma, redaktə etmə və silmə yalnız sahibkar qeydiyyatı və abunəlik tamamlandıqdan sonra açılır.",
          default:
            "Bu bölmə sahibkar qeydiyyatı və abunəlik tamamlanmadan açılmır.",
        },
      },
      states: {
        profileRequired: {
          badge: "İdarəetmə paneli bağlıdır",
          title: "Sahibkar profili məcburidir",
          description:
            "Xidmətlərdən yararlanmaq üçün əvvəlcə sahibkar məlumatları tam daxil edilməlidir. Profil tamamlanmadan idarəetmə paneli, abunəlik və digər bölmələr açılmır.",
          cta: "Profil səhifəsinə keç",
        },
        phoneVerificationRequired: {
          badge: "OTP təsdiqi tələb olunur",
          title: "Telefon təsdiqlənməyib",
          description:
            "Profil qaralama kimi yaradılıb, lakin telefon OTP ilə təsdiqlənmədən sahibkar aktiv hesab edilmir. İdarəetmə paneli və digər imkanlar bağlı qalır.",
          cta: "Profilə keç və təsdiqi tamamla",
        },
        serviceSelectionRequired: {
          badge: "Xidmət seçimi tələb olunur",
          title: "Əvvəlcə xidmət mərhələsini tamamlayın",
          description:
            "Profil tamamlandıqdan sonra sahibkar əvvəlcə xidmətlər bölməsinə qayıtmalıdır. Bu mərhələdə idarəetmə paneli hələ bağlı qalır.",
          cta: "Xidmətlərə keç",
        },
        subscriptionRequired: {
          badge: "Abunəlik tələb olunur",
          title: "Aktiv abunəlik yoxdur",
          description:
            "Xidmət seçilib, lakin ödəniş tamamlanmayıb və ya abunəlik aktiv deyil. İdarəetmə paneli bağlı qalır və digər sahibkar prosesləri bloklanır.",
          cta: "Abunəlik bölməsinə keç",
        },
        active: {
          badge: "Aktivdir",
          title: "İdarəetmə paneli açıqdır",
          description:
            "Abunəlik aktivdir. Sahibkar elan yarada, elanlarını idarə edə, rezervasiya sorğularını işləyə və sistemdən tam istifadə edə bilər.",
          cta: "Xidmətlərə bax",
        },
      },
      meta: {
        serviceCodeLabel: "Xidmət kodu",
        planLabel: "Plan",
        accessLabel: "Giriş statusu",
        planStandardLabel: "Standart",
        planPlusLabel: "Plus",
        accessActiveLabel: "Açıqdır",
        accessLockedLabel: "Bağlıdır",
      },
      services: {
        RENT_HOME: "Ev icarəsi",
        BARBER: "Bərbər",
        CAR_RENTAL: "Avtomobil icarəsi",
        HOTEL: "Otel",
        BEAUTY_SALON: "Gözəllik salonu",
        BABYSITTER: "Uşaq baxıcısı",
        CLEANING: "Təmizlik xidmətləri",
        TECHNICAL_SERVICES: "Texniki xidmətlər",
      },
    },
    services: {
      hero: {
        pageTitle: "Xidmət seçimi",
        lockedDescription:
          "Bu səhifə sahibkar onboarding giriş nöqtəsidir. Profil və telefon təsdiqi tamamlanmadan xidmət axını, billing və idarəetmə paneli bağlı qalır.",
        activeDescription:
          "Əvvəl planı seçin, sonra davam etmək istədiyiniz xidməti seçin. Aktiv abunəlik yoxdursa, növbəti addım billing-dir. İdarəetmə paneli yalnız billing uğurla tamamlandıqdan sonra açılır.",
        currentStateLabel: "Cari vəziyyət",
      },
      summary: {
        previewMode: "Xidmətlər preview rejimindədir",
        selectedPlanOnly: "{planLabel} planı",
        selectedPlanWithStatus: "{planLabel} planı • {statusLabel}",
        activePlanWithStatus: "Aktiv plan: {activePlanLabel} • {statusLabel}",
        billingCompleted: "billing tamamlanıb",
        billingPending: "billing gözlənilir",
        planChangePending: "plan dəyişikliyi üçün billing tələb olunur",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "Sahibkar profili tələb olunur",
          message:
            "Xidmətlərdən yararlanmaq üçün əvvəlcə sahibkar məlumatlarını daxil etməlisiniz. Profil tamamlanmadan billing və idarəetmə paneli bağlı qalır.",
          cta: "Profil səhifəsinə keç",
        },
        phoneVerificationRequired: {
          title: "Telefon təsdiqi tələb olunur",
          message:
            "Profil yadda saxlanılıb, lakin telefon OTP ilə təsdiqlənməlidir. Telefon təsdiqi tamamlanmadan xidmət seçimi preview rejimində qalır və billing / idarəetmə paneli bloklanır.",
          cta: "Profilə keç və təsdiqi tamamla",
        },
      },
      plans: {
        stepLabel: "1-ci addım",
        title: "Plan seç",
        activeDescription:
          "Plan seçimi yalnız profil və telefon təsdiqindən sonra aktiv olur.",
        lockedDescription:
          "Plan kartları hazırda yalnız preview üçündür. Profil və telefon təsdiqi tamamlanmadan davam etmək mümkün deyil.",
        standard: {
          label: "Standart",
          badge: "Aylıq plan",
          description: "Əsas sahibkar axını üçün sadə və stabil seçimdir.",
          helper: "Elanlar standart sıralama ilə göstərilir.",
        },
        plus: {
          label: "Plus",
          badge: "Prioritet görünürlük",
          description: "Eyni kateqoriya və eyni filtrlərdə daha yuxarı görünürlük verir.",
          helper: "Plus elanlar standart elanlardan əvvəl göstərilir.",
        },
        selectedChip: "Seçilmişdir",
        lockedNote: "Profil tamamlanmadan plan seçimi bağlıdır",
      },
      serviceList: {
        stepLabel: "2-ci addım",
        title: "Xidmət seç",
        activeDescription:
          "Xidmət seçildikdən sonra növbəti addım billing-dir. Aktiv abunəliyi olan xidmətdə isə yalnız həmin aktiv plan üzrə birbaşa idarəetmə panelinə keçid açılır.",
        lockedDescription:
          "Sahibkar onboarding tamamlanana qədər xidmət seçimi preview rejimindədir və davam etmək bloklanır.",
        carouselAria: "Xidmətlər arasında hərəkət",
        previousServices: "Əvvəlki xidmətlər",
        nextServices: "Növbəti xidmətlər",
        loadingServices:
          "Xidmətləri müvəqqəti yükləmək mümkün olmadı. Bir qədər sonra yenidən cəhd edin.",
        requestTimeout: "Sorğunun vaxtı bitdi. Backend cavab vermədi.",
        noServices: "Heç bir xidmət tapılmadı.",
        profileCompletionInfo:
          "Profil və telefon təsdiqi tamamlandıqdan sonra xidmət seçimi burada aktiv olacaq.",
      },
      badges: {
        activeSubscription: "Aktiv abunəlik",
        continueWithPlus: "Plus ilə davam et",
        continueWithStandard: "Standart ilə davam et",
        selected: "Seçilmiş",
        activePlanLabel: "Aktiv plan",
        changePlanBadge: "Plan dəyişikliyi",
      },
      meta: {
        planLabel: "Plan",
        priceLabel: "Qiymət",
        priceInactive: "Qiymət aktiv deyil",
      },
      cards: {
        fallbackDescription:
          "Bu xidmət üzrə sahibkar axını aktivdir və növbəti mərhələyə keçə bilərsiniz.",
        lockedFooter:
          "Profil və telefon təsdiqi tamamlanmadan bu xidmətlə davam etmək mümkün deyil",
        activeFooterFallback: "Aktiv abunəlik mövcuddur",
        activeFooterWithDate: "Aktivdir • {paidUntil}",
        billingFooter:
          "Bu xidməti seçdikdən sonra növbəti addım billing olacaq",
        planChangeFooter: "Seçilmiş plan üçün billing tələb olunur",
        planChangeFooterWithActivePlan:
          "Aktiv plan: {activePlanLabel} • Seçilmiş plan üçün billing tələb olunur",
        titleFallback: "Xidmət",
      },
      selection: {
        flowLabel: "Seçilmiş axın",
        notSelected: "Xidmət seçilməyib",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Davam etmək üçün əvvəl yuxarıdan bir xidmət seçin.",
        billingCompletedFlow:
          "Bu xidmət üzrə seçdiyiniz plan üçün aktiv abunəlik görünür. Billing artıq tamamlanıb və davam etdikdə idarəetmə paneli açılacaq.",
        billingPendingFlow:
          "Xidmət seçilib. Növbəti addım billing-dir. Ödəniş uğurla tamamlanmadan idarəetmə paneli aktiv olmayacaq.",
        planChangeMessage:
          "Hazırda {activePlanLabel} planı üzrə aktiv abunəliyiniz var. Abunəliyi {targetPlanLabel} planına yeniləsəniz, əvvəlki aktiv plan ləğv ediləcək və {targetPlanLabel} planı növbəti 30 gün üçün aktivləşdiriləcək.",
        resetService: "Xidməti sıfırla",
        chooseServiceButton: "Xidmət seç",
        changePlanButton: "Billing-ə keç və planı yenilə",
        goToProfile: "Profil səhifəsinə keç",
        goToDashboard: "İdarəetmə panelinə keç",
        goToBilling: "Billing-ə keç",
        redirecting: "Yönləndirilir...",
      },
      status: {
        profileRequired: "Profil tələb olunur",
        phoneRequired: "Telefon təsdiqi gözlənilir",
        active: "Aktiv",
        billingRequired: "Billing tələb olunur",
        serviceSelection: "Xidmət seçimi",
        planChangeRequired: "Plan dəyişikliyi tələb olunur",
      },
      errors: {
        ownerNotFoundLoadError: "Sahibkar profili tapılmadı.",
        servicesLoadErrorFallback: "Xidmətlər yüklənmədi",
        servicesLoadErrorWithStatus: "Xidmətlər yüklənmədi (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;