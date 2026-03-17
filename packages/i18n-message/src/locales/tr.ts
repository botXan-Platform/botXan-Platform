import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const trMessages = {
  common: {
    brand: {
      homeAriaLabel: "Ana sayfa",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Dil seçimi",
      selectorMenuAriaLabel: "Dil seçimi menüsü",
      currentLocaleTitle: "Geçerli dil: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Sahip paneli",
        checkingContext: "Hizmet bağlamı kontrol ediliyor...",
        subtitle:
          "Panel yalnızca sahip onboarding süreci ve abonelik akışı tamamlandıktan sonra açılır. Aktif hizmet, plan ve erişim durumu aşağıda gösterilir.",
      },
      summary: {
        activeServiceLabel: "Aktif hizmet",
        ownerLabel: "Sahip",
        paidUntilLabel: "Ödeme geçerlilik tarihi",
        loadingStatus: "Durum kontrol ediliyor...",
        activeServiceFallback: "Aktif hizmet bulunamadı",
        serviceGenericLabel: "Hizmet",
      },
      notes: {
        loading: "Durum kontrol ediliyor...",
        active:
          "Not: panel bağlantıları seçilen hizmet bağlamı ile çalışır. İlan oluşturma, düzenleme ve silme akışı İlanlarım bölümünde birleştirilmiştir.",
        locked:
          "Not: panel bu aşamada kasıtlı olarak kilitli tutulur. Sonraki adım için yukarıdaki işlem düğmesini kullanın.",
      },
      errors: {
        prefix: "Hata",
        dashboardStateLoadFailed: "Panel durumu yüklenemedi.",
        completeOwnerProfileFirst: "Önce sahip profilini tamamlayın.",
        phoneVerificationRequired:
          "Telefon doğrulaması tamamlanmalıdır.",
        serviceSelectionRequired:
          "Önce hizmet seçimi tamamlanmalıdır.",
        activeSubscriptionNotFound: "Aktif abonelik bulunamadı.",
        serviceNotFoundOrInactive:
          "Hizmet bulunamadı veya aktif değil.",
        serverErrorOccurred:
          "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.",
        ownerIdentityRequired: "Önce sahip profilini tamamlayın.",
      },
      cards: {
        properties: {
          title: "İlanlarım",
          text: "Tüm ilanlarınızı görüntüleyin, yeni ilan oluşturun, aktif ilanları düzenleyin ve silin.",
        },
        profile: {
          title: "Profil bilgileri",
          text: "Adınızı, telefon numaranızı ve diğer profil bilgilerinizi yönetin.",
        },
        billing: {
          title: "Abonelik ve ödemeler",
          text: "Durumu kontrol edin ve ödeme akışına geçin.",
        },
        bookings: {
          title: "Rezervasyon talepleri",
          text: "Gelen talepleri onaylayın veya reddedin.",
        },
        lockedChip: "Kilitli",
        lockedDescriptions: {
          profile:
            "Bu bölüm panel içinde kilitli kalır. Profil sayfasını açmak için yukarıdaki işlem düğmesini kullanın.",
          billing:
            "Bu aşamada abonelik bölümü işlem düğmesiyle açılır. Panel kartı kilitli kalır.",
          properties:
            "İlan oluşturma, düzenleme ve silme yalnızca sahip onboarding süreci ve abonelik tamamlandıktan sonra kullanılabilir.",
          default:
            "Bu bölüm, sahip onboarding süreci ve abonelik tamamlanana kadar kullanılamaz.",
        },
      },
      states: {
        profileRequired: {
          badge: "Panel kilitli",
          title: "Sahip profili gereklidir",
          description:
            "Hizmetleri kullanmak için önce sahip bilgileri girilmelidir. Profil tamamlanana kadar panel, faturalandırma ve diğer bölümler kilitli kalır.",
          cta: "Profil sayfasına git",
        },
        phoneVerificationRequired: {
          badge: "OTP doğrulaması gereklidir",
          title: "Telefon doğrulanmadı",
          description:
            "Profil taslak olarak oluşturuldu, ancak telefon OTP ile doğrulanana kadar sahip aktif sayılmaz. Panel ve diğer sahip yetenekleri kilitli kalır.",
          cta: "Profile git ve doğrulamayı tamamla",
        },
        serviceSelectionRequired: {
          badge: "Hizmet seçimi gereklidir",
          title: "Önce hizmet adımını tamamlayın",
          description:
            "Profil tamamlandıktan sonra sahip önce hizmetler bölümüne dönmelidir. Bu aşamada panel kilitli kalır.",
          cta: "Hizmetlere git",
        },
        subscriptionRequired: {
          badge: "Abonelik gereklidir",
          title: "Aktif abonelik yok",
          description:
            "Bir hizmet seçildi, ancak ödeme tamamlanmadı veya abonelik aktif değil. Panel kilitli kalır ve diğer sahip süreçleri de engellenir.",
          cta: "Aboneliğe git",
        },
        active: {
          badge: "Aktif",
          title: "Panel açık",
          description:
            "Abonelik aktiftir. Sahip ilan oluşturabilir, ilanları yönetebilir, rezervasyon taleplerini işleyebilir ve sistemi tam olarak kullanabilir.",
          cta: "Hizmetleri görüntüle",
        },
      },
      meta: {
        serviceCodeLabel: "Hizmet kodu",
        planLabel: "Plan",
        accessLabel: "Erişim durumu",
        planStandardLabel: "Standart",
        planPlusLabel: "Plus",
        accessActiveLabel: "Açık",
        accessLockedLabel: "Kilitli",
      },
      services: {
        RENT_HOME: "Ev kiralama",
        BARBER: "Berber",
        CAR_RENTAL: "Araç kiralama",
        HOTEL: "Otel",
        BEAUTY_SALON: "Güzellik salonu",
        BABYSITTER: "Bebek bakıcısı",
        CLEANING: "Temizlik hizmetleri",
        TECHNICAL_SERVICES: "Teknik hizmetler",
      },
    },
    services: {
      hero: {
        pageTitle: "Hizmet seçimi",
        lockedDescription:
          "Bu sayfa sahip onboarding sürecinin giriş noktasıdır. Profil ve telefon doğrulaması tamamlanana kadar hizmet akışı, faturalandırma ve panel kilitli kalır.",
        activeDescription:
          "Önce bir plan seçin, ardından devam etmek istediğiniz hizmeti seçin. Aktif bir abonelik yoksa sonraki adım faturalandırmadır. Panel yalnızca faturalandırma başarıyla tamamlandıktan sonra açılır.",
        currentStateLabel: "Geçerli durum",
      },
      summary: {
        previewMode: "Hizmetler önizleme modundadır",
        selectedPlanOnly: "{planLabel} planı",
        selectedPlanWithStatus: "{planLabel} planı • {statusLabel}",
        activePlanWithStatus:
          "Aktif plan: {activePlanLabel} • {statusLabel}",
        billingCompleted: "faturalandırma tamamlandı",
        billingPending: "faturalandırma bekleniyor",
        planChangePending:
          "plan değişikliği için faturalandırma gereklidir",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "Sahip profili gereklidir",
          message:
            "Hizmetleri kullanmak için önce sahip bilgilerini girmelisiniz. Profil tamamlanana kadar faturalandırma ve panel kilitli kalır.",
          cta: "Profil sayfasına git",
        },
        phoneVerificationRequired: {
          title: "Telefon doğrulaması gereklidir",
          message:
            "Profil kaydedildi, ancak telefon OTP ile doğrulanmalıdır. Telefon doğrulaması tamamlanana kadar hizmet seçimi önizleme modunda kalır ve faturalandırma / panel kilitli olur.",
          cta: "Profile git ve doğrulamayı tamamla",
        },
      },
      plans: {
        stepLabel: "Adım 1",
        title: "Bir plan seçin",
        activeDescription:
          "Plan seçimi yalnızca profil ve telefon doğrulaması tamamlandıktan sonra etkinleşir.",
        lockedDescription:
          "Plan kartları şu anda yalnızca önizleme içindir. Profil ve telefon doğrulaması tamamlanana kadar devam edemezsiniz.",
        standard: {
          label: "Standart",
          badge: "Aylık plan",
          description:
            "Temel sahip akışı için basit ve kararlı bir seçim.",
          helper: "İlanlar standart sıralamayla gösterilir.",
        },
        plus: {
          label: "Plus",
          badge: "Öncelikli görünürlük",
          description:
            "Aynı kategori ve aynı filtrelerde daha yüksek görünürlük sağlar.",
          helper:
            "Plus ilanlar standart ilanlardan önce gösterilir.",
        },
        selectedChip: "Seçildi",
        lockedNote:
          "Profil tamamlanana kadar plan seçimi kilitlidir",
      },
      serviceList: {
        stepLabel: "Adım 2",
        title: "Bir hizmet seçin",
        activeDescription:
          "Bir hizmet seçildikten sonra sonraki adım faturalandırmadır. Aktif aboneliği olan hizmetlerde doğrudan panel erişimi yalnızca o aktif plan için açılır.",
        lockedDescription:
          "Sahip onboarding süreci tamamlanana kadar hizmet seçimi önizleme modunda kalır ve devam etme engellenir.",
        carouselAria: "Hizmetler arasında gezin",
        previousServices: "Önceki hizmetler",
        nextServices: "Sonraki hizmetler",
        loadingServices:
          "Hizmetler geçici olarak yüklenemedi. Lütfen daha sonra tekrar deneyin.",
        requestTimeout:
          "İstek zaman aşımına uğradı. Backend yanıt vermedi.",
        noServices: "Hiç hizmet bulunamadı.",
        profileCompletionInfo:
          "Profil ve telefon doğrulaması tamamlandıktan sonra hizmet seçimi burada etkinleşecektir.",
      },
      badges: {
        activeSubscription: "Aktif abonelik",
        continueWithPlus: "Plus ile devam et",
        continueWithStandard: "Standart ile devam et",
        selected: "Seçildi",
        activePlanLabel: "Aktif plan",
        changePlanBadge: "Plan değişikliği",
      },
      meta: {
        planLabel: "Plan",
        priceLabel: "Fiyat",
        priceInactive: "Fiyat aktif değil",
      },
      cards: {
        fallbackDescription:
          "Bu hizmet için sahip akışı aktiftir ve sonraki aşamaya geçebilirsiniz.",
        lockedFooter:
          "Profil ve telefon doğrulaması tamamlanana kadar bu hizmetle devam edemezsiniz",
        activeFooterFallback: "Aktif bir abonelik mevcut",
        activeFooterWithDate: "Şu tarihe kadar aktif • {paidUntil}",
        billingFooter:
          "Bu hizmeti seçtikten sonra sonraki adım faturalandırma olacaktır",
        planChangeFooter:
          "Seçilen plan için faturalandırma gereklidir",
        planChangeFooterWithActivePlan:
          "Aktif plan: {activePlanLabel} • Seçilen plan için faturalandırma gereklidir",
        titleFallback: "Hizmet",
      },
      selection: {
        flowLabel: "Seçilen akış",
        notSelected: "Hiç hizmet seçilmedi",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Devam etmek için önce yukarıdan bir hizmet seçin.",
        billingCompletedFlow:
          "Bu hizmetin seçilen planı için aktif bir abonelik görünüyor. Faturalandırma zaten tamamlandı ve devam etmek paneli açacaktır.",
        billingPendingFlow:
          "Hizmet seçildi. Sonraki adım faturalandırmadır. Ödeme başarıyla tamamlanana kadar panel etkin olmayacaktır.",
        planChangeMessage:
          "Şu anda {activePlanLabel} planı için aktif bir aboneliğiniz var. Aboneliği {targetPlanLabel} planına güncellerseniz önceki aktif plan iptal edilecek ve {targetPlanLabel} planı sonraki 30 gün boyunca etkinleştirilecektir.",
        resetService: "Hizmeti sıfırla",
        chooseServiceButton: "Hizmet seç",
        changePlanButton:
          "Faturalandırmaya git ve planı güncelle",
        goToProfile: "Profil sayfasına git",
        goToDashboard: "Panele git",
        goToBilling: "Faturalandırmaya git",
        redirecting: "Yönlendiriliyor...",
      },
      status: {
        profileRequired: "Profil gereklidir",
        phoneRequired: "Telefon doğrulaması bekleniyor",
        active: "Aktif",
        billingRequired: "Faturalandırma gereklidir",
        serviceSelection: "Hizmet seçimi",
        planChangeRequired: "Plan değişikliği gereklidir",
      },
      errors: {
        ownerNotFoundLoadError: "Sahip profili bulunamadı.",
        servicesLoadErrorFallback: "Hizmetler yüklenemedi",
        servicesLoadErrorWithStatus:
          "Hizmetler yüklenemedi (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;