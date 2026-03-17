import type { AppMessagesCatalog } from "../catalog.js";
import { LANGUAGE_AUTONYMS } from "../shared/localeNames.js";

export const idMessages = {
  common: {
    brand: {
      homeAriaLabel: "Halaman utama",
      fallbackName: "botXan",
    },
    language: {
      selectorAriaLabel: "Pemilihan bahasa",
      selectorMenuAriaLabel: "Menu pemilihan bahasa",
      currentLocaleTitle: "Bahasa saat ini: {language}",
      localeNames: LANGUAGE_AUTONYMS,
    },
  },
  owner: {
    dashboard: {
      hero: {
        title: "Dasbor pemilik",
        checkingContext: "Sedang memeriksa konteks layanan...",
        subtitle:
          "Dasbor hanya akan terbuka setelah onboarding pemilik dan alur langganan selesai. Layanan aktif, paket, dan status akses ditampilkan di bawah.",
      },
      summary: {
        activeServiceLabel: "Layanan aktif",
        ownerLabel: "Pemilik",
        paidUntilLabel: "Dibayar hingga",
        loadingStatus: "Sedang memeriksa status...",
        activeServiceFallback: "Tidak ada layanan aktif yang ditemukan",
        serviceGenericLabel: "Layanan",
      },
      notes: {
        loading: "Sedang memeriksa status...",
        active:
          "Catatan: tautan di dasbor bekerja dengan konteks layanan yang dipilih. Alur membuat, mengedit, dan menghapus listing telah disatukan di bagian Listing saya.",
        locked:
          "Catatan: dasbor sengaja dikunci pada tahap ini. Gunakan tombol aksi di atas untuk langkah berikutnya.",
      },
      errors: {
        prefix: "Kesalahan",
        dashboardStateLoadFailed: "Status dasbor tidak dapat dimuat.",
        completeOwnerProfileFirst: "Selesaikan profil pemilik terlebih dahulu.",
        phoneVerificationRequired: "Verifikasi telepon harus diselesaikan.",
        serviceSelectionRequired:
          "Pemilihan layanan harus diselesaikan terlebih dahulu.",
        activeSubscriptionNotFound: "Tidak ditemukan langganan aktif.",
        serviceNotFoundOrInactive:
          "Layanan tidak ditemukan atau tidak aktif.",
        serverErrorOccurred:
          "Terjadi kesalahan server. Silakan coba lagi nanti.",
        ownerIdentityRequired:
          "Selesaikan profil pemilik terlebih dahulu.",
      },
      cards: {
        properties: {
          title: "Listing saya",
          text: "Lihat semua listing Anda, buat listing baru, edit listing aktif, dan hapus listing.",
        },
        profile: {
          title: "Detail profil",
          text: "Kelola nama, nomor telepon, dan detail profil lainnya.",
        },
        billing: {
          title: "Langganan dan pembayaran",
          text: "Periksa status dan lanjutkan ke alur pembayaran.",
        },
        bookings: {
          title: "Permintaan pemesanan",
          text: "Setujui atau tolak permintaan yang masuk.",
        },
        lockedChip: "Terkunci",
        lockedDescriptions: {
          profile:
            "Bagian ini tetap terkunci di dalam dasbor. Gunakan tombol aksi di atas untuk membuka halaman profil.",
          billing:
            "Pada tahap ini, bagian langganan dibuka melalui tombol aksi. Kartu dasbor tetap terkunci.",
          properties:
            "Membuat, mengedit, dan menghapus listing hanya tersedia setelah onboarding pemilik dan langganan selesai.",
          default:
            "Bagian ini tidak tersedia sampai onboarding pemilik dan langganan selesai.",
        },
      },
      states: {
        profileRequired: {
          badge: "Dasbor terkunci",
          title: "Profil pemilik wajib diisi",
          description:
            "Untuk menggunakan layanan, Anda harus terlebih dahulu mengisi informasi pemilik. Sampai profil selesai, dasbor, penagihan, dan bagian lainnya akan tetap terkunci.",
          cta: "Buka halaman profil",
        },
        phoneVerificationRequired: {
          badge: "Verifikasi OTP diperlukan",
          title: "Telepon belum diverifikasi",
          description:
            "Profil telah dibuat sebagai draf, tetapi pemilik belum dianggap aktif sampai telepon diverifikasi dengan OTP. Dasbor dan kemampuan pemilik lainnya akan tetap terkunci.",
          cta: "Buka profil dan selesaikan verifikasi",
        },
        serviceSelectionRequired: {
          badge: "Pemilihan layanan diperlukan",
          title: "Selesaikan langkah layanan terlebih dahulu",
          description:
            "Setelah profil selesai, pemilik harus kembali ke bagian layanan terlebih dahulu. Dasbor tetap terkunci pada tahap ini.",
          cta: "Buka layanan",
        },
        subscriptionRequired: {
          badge: "Langganan diperlukan",
          title: "Tidak ada langganan aktif",
          description:
            "Sebuah layanan telah dipilih, tetapi pembayaran belum selesai atau langganan tidak aktif. Dasbor akan tetap terkunci dan proses pemilik lainnya juga akan diblokir.",
          cta: "Buka langganan",
        },
        active: {
          badge: "Aktif",
          title: "Dasbor terbuka",
          description:
            "Langganan aktif. Pemilik dapat membuat listing, mengelola listing, menangani permintaan pemesanan, dan menggunakan sistem sepenuhnya.",
          cta: "Lihat layanan",
        },
      },
      meta: {
        serviceCodeLabel: "Kode layanan",
        planLabel: "Paket",
        accessLabel: "Status akses",
        planStandardLabel: "Standar",
        planPlusLabel: "Plus",
        accessActiveLabel: "Terbuka",
        accessLockedLabel: "Terkunci",
      },
      services: {
        RENT_HOME: "Sewa rumah",
        BARBER: "Barber",
        CAR_RENTAL: "Sewa mobil",
        HOTEL: "Hotel",
        BEAUTY_SALON: "Salon kecantikan",
        BABYSITTER: "Pengasuh anak",
        CLEANING: "Layanan kebersihan",
        TECHNICAL_SERVICES: "Layanan teknis",
      },
    },
    services: {
      hero: {
        pageTitle: "Pemilihan layanan",
        lockedDescription:
          "Halaman ini adalah titik masuk onboarding pemilik. Sampai profil dan verifikasi telepon selesai, alur layanan, penagihan, dan dasbor akan tetap terkunci.",
        activeDescription:
          "Pilih paket terlebih dahulu, lalu pilih layanan yang ingin Anda lanjutkan. Jika tidak ada langganan aktif, langkah berikutnya adalah penagihan. Dasbor hanya akan terbuka setelah penagihan berhasil diselesaikan.",
        currentStateLabel: "Status saat ini",
      },
      summary: {
        previewMode: "Layanan berada dalam mode pratinjau",
        selectedPlanOnly: "Paket {planLabel}",
        selectedPlanWithStatus: "Paket {planLabel} • {statusLabel}",
        activePlanWithStatus: "Paket aktif: {activePlanLabel} • {statusLabel}",
        billingCompleted: "penagihan selesai",
        billingPending: "penagihan tertunda",
        planChangePending: "penagihan diperlukan untuk perubahan paket",
      },
      gate: {
        onboardingLabel: "Onboarding",
        profileRequired: {
          title: "Profil pemilik wajib diisi",
          message:
            "Untuk menggunakan layanan, Anda harus terlebih dahulu mengisi detail pemilik. Sampai profil selesai, penagihan dan dasbor akan tetap terkunci.",
          cta: "Buka halaman profil",
        },
        phoneVerificationRequired: {
          title: "Verifikasi telepon diperlukan",
          message:
            "Profil telah disimpan, tetapi telepon harus diverifikasi dengan OTP. Sampai verifikasi telepon selesai, pemilihan layanan akan tetap dalam mode pratinjau dan penagihan / dasbor akan tetap terkunci.",
          cta: "Buka profil dan selesaikan verifikasi",
        },
      },
      plans: {
        stepLabel: "Langkah 1",
        title: "Pilih paket",
        activeDescription:
          "Pemilihan paket hanya menjadi aktif setelah profil dan verifikasi telepon selesai.",
        lockedDescription:
          "Kartu paket saat ini hanya untuk pratinjau. Anda tidak dapat melanjutkan sampai profil dan verifikasi telepon selesai.",
        standard: {
          label: "Standar",
          badge: "Paket bulanan",
          description:
            "Pilihan yang sederhana dan stabil untuk alur utama pemilik.",
          helper: "Listing ditampilkan dalam urutan standar.",
        },
        plus: {
          label: "Plus",
          badge: "Visibilitas prioritas",
          description:
            "Visibilitas yang lebih tinggi dalam kategori dan filter yang sama.",
          helper: "Listing Plus ditampilkan sebelum listing standar.",
        },
        selectedChip: "Dipilih",
        lockedNote: "Pemilihan paket terkunci sampai profil selesai",
      },
      serviceList: {
        stepLabel: "Langkah 2",
        title: "Pilih layanan",
        activeDescription:
          "Setelah memilih layanan, langkah berikutnya adalah penagihan. Untuk layanan dengan langganan aktif, akses langsung ke dasbor hanya tersedia untuk paket aktif tersebut.",
        lockedDescription:
          "Sampai onboarding pemilik selesai, pemilihan layanan akan tetap dalam mode pratinjau dan kelanjutan akan diblokir.",
        carouselAria: "Berpindah antar layanan",
        previousServices: "Layanan sebelumnya",
        nextServices: "Layanan berikutnya",
        loadingServices:
          "Layanan tidak dapat dimuat untuk sementara. Silakan coba lagi nanti.",
        requestTimeout:
          "Waktu permintaan habis. Backend tidak memberikan respons.",
        noServices: "Tidak ada layanan yang ditemukan.",
        profileCompletionInfo:
          "Pemilihan layanan akan menjadi aktif di sini setelah profil dan verifikasi telepon selesai.",
      },
      badges: {
        activeSubscription: "Langganan aktif",
        continueWithPlus: "Lanjutkan dengan Plus",
        continueWithStandard: "Lanjutkan dengan Standar",
        selected: "Dipilih",
        activePlanLabel: "Paket aktif",
        changePlanBadge: "Perubahan paket",
      },
      meta: {
        planLabel: "Paket",
        priceLabel: "Harga",
        priceInactive: "Harga tidak aktif",
      },
      cards: {
        fallbackDescription:
          "Alur pemilik untuk layanan ini aktif dan Anda dapat melanjutkan ke tahap berikutnya.",
        lockedFooter:
          "Anda tidak dapat melanjutkan dengan layanan ini sampai profil dan verifikasi telepon selesai",
        activeFooterFallback: "Langganan aktif tersedia",
        activeFooterWithDate: "Aktif hingga • {paidUntil}",
        billingFooter:
          "Setelah memilih layanan ini, langkah berikutnya adalah penagihan",
        planChangeFooter:
          "Penagihan diperlukan untuk paket yang dipilih",
        planChangeFooterWithActivePlan:
          "Paket aktif: {activePlanLabel} • Penagihan diperlukan untuk paket yang dipilih",
        titleFallback: "Layanan",
      },
      selection: {
        flowLabel: "Alur yang dipilih",
        notSelected: "Tidak ada layanan yang dipilih",
        selectedHeadline: "{serviceTitle} • {planLabel}",
        selectServiceFirst:
          "Untuk melanjutkan, pilih terlebih dahulu satu layanan di atas.",
        billingCompletedFlow:
          "Langganan aktif terlihat untuk paket yang dipilih pada layanan ini. Penagihan sudah selesai, dan melanjutkan akan membuka dasbor.",
        billingPendingFlow:
          "Layanan telah dipilih. Langkah berikutnya adalah penagihan. Dasbor tidak akan aktif sampai pembayaran berhasil diselesaikan.",
        planChangeMessage:
          "Saat ini Anda memiliki langganan aktif untuk paket {activePlanLabel}. Jika Anda memperbarui langganan ke paket {targetPlanLabel}, paket aktif sebelumnya akan dibatalkan dan paket {targetPlanLabel} akan diaktifkan untuk 30 hari berikutnya.",
        resetService: "Atur ulang layanan",
        chooseServiceButton: "Pilih layanan",
        changePlanButton: "Buka penagihan dan perbarui paket",
        goToProfile: "Buka halaman profil",
        goToDashboard: "Buka dasbor",
        goToBilling: "Buka penagihan",
        redirecting: "Mengalihkan...",
      },
      status: {
        profileRequired: "Profil wajib diisi",
        phoneRequired: "Verifikasi telepon tertunda",
        active: "Aktif",
        billingRequired: "Penagihan diperlukan",
        serviceSelection: "Pemilihan layanan",
        planChangeRequired: "Perubahan paket diperlukan",
      },
      errors: {
        ownerNotFoundLoadError: "Profil pemilik tidak ditemukan.",
        servicesLoadErrorFallback: "Layanan tidak dapat dimuat",
        servicesLoadErrorWithStatus:
          "Layanan tidak dapat dimuat (HTTP {status})",
      },
    },
  },
} as const satisfies AppMessagesCatalog;