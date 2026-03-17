import type { CSSProperties, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

const API = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:3001"
).trim();

const API_BASE = API.replace(/\/+$/, "");

const SERVICE_SELECT_ROUTE = "/services";
const PROFILE_ROUTE = "/profile";
const REQUEST_TIMEOUT_MS = 15000;
const REVERSE_GEOCODE_TIMEOUT_MS = 8000;
const MAX_UPLOAD_FILE_BYTES = 5 * 1024 * 1024;

const MAX_PROPERTY_IMAGES = 30;
const MAX_TITLE_LENGTH = 160;
const MAX_CITY_LENGTH = 120;
const MAX_AREA_NAME_LENGTH = 160;
const MAX_LOCATION_LENGTH = 255;
const MAX_LOCATION_PLACE_ID_LENGTH = 255;
const MAX_RULES_TEXT_LENGTH = 5000;
const MAX_IMAGE_URL_LENGTH = 2048;

const SERVICE_STORAGE_KEYS = [
  "ownerServiceKey",
  "selectedServiceKey",
  "serviceKey",
  "activeServiceKey",
] as const;

const PHONE_STORAGE_KEYS = [
  "ownerPhoneE164",
  "profilePhoneE164",
  "ownerPhone",
  "phoneE164",
  "phone",
] as const;

const OWNER_ID_STORAGE_KEYS = [
  "ownerId",
  "profileOwnerId",
  "ownerProfileId",
] as const;

const OWNER_EMAIL_STORAGE_KEYS = ["ownerEmail", "profileOwnerEmail"] as const;

const LOCALE_STORAGE_KEYS = [
  "appLocale",
  "locale",
  "language",
  "selectedLanguage",
] as const;

type Locale = "az" | "en" | "ru" | "zh";
type LocationSource = "MANUAL" | "CURRENT_DEVICE" | "MAP_PICKER";
type GeoPermissionStatus = PermissionState | "unsupported" | "unknown";

type FormState = {
  title: string;
  roomCount: string;
  city: string;
  areaName: string;
  location: string;
  locationPlaceId: string;
  locationLat: string;
  locationLng: string;
  locationSource: LocationSource;
  rulesText: string;
  priceHour: string;
  priceDay: string;
  priceWeek: string;
  priceMonth: string;
  priceYear: string;
  imageUrls: string[];
};

type PropertyImageItem = {
  id?: string;
  url?: string | null;
  sortOrder?: number | null;
};

type PropertyApiItem = {
  id: string;
  title?: string;
  roomCount?: number | null;
  city?: string | null;
  areaName?: string | null;
  location?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  locationPlaceId?: string | null;
  locationSource?: LocationSource | null;
  rulesText?: string | null;
  serviceKey?: string | null;
  priceHour?: number | null;
  priceDay?: number | null;
  priceWeek?: number | null;
  priceMonth?: number | null;
  priceYear?: number | null;
  images?: PropertyImageItem[] | null;
  imageCount?: number | null;
};

type ApiEnvelope<T = unknown> = {
  ok?: boolean;
  message?: string;
  error?: string;
  item?: T | null;
  redirectUrl?: string;
  url?: string;
  path?: string;
  mediaUrl?: string;
  fileUrl?: string;
  profilePhotoUrl?: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  roomCount: "",
  city: "",
  areaName: "",
  location: "",
  locationPlaceId: "",
  locationLat: "",
  locationLng: "",
  locationSource: "MANUAL",
  rulesText: "",
  priceHour: "",
  priceDay: "",
  priceWeek: "",
  priceMonth: "",
  priceYear: "",
  imageUrls: [],
};

const UI_TEXT = {
  az: {
    createPageTitle: "Yeni elan yarat",
    editPageTitle: "Elanı redaktə et",
    createBadge: "Elan yarat",
    editBadge: "Elan redaktəsi",
    checkingServiceContext: "Xidmət konteksti yoxlanılır...",
    createSubtitle:
      "Elan seçilmiş xidmət və aktiv owner profili konteksti ilə yaradılır.",
    editSubtitle:
      "Elan mövcud owner profili və seçilmiş xidmət konteksti ilə redaktə olunur.",
    selectedService: "Seçilmiş xidmət",
    backToDashboard: "İdarəetmə panelinə qayıt",
    myListings: "Elanlarım",
    changeService: "Xidməti dəyiş",
    basicInfo: "Əsas məlumatlar",
    locationSection: "Məkan",
    rulesSection: "Qaydalar",
    imagesSection: "Şəkillər",
    pricesSection: "Qiymətlər",
    titleLabel: "Elanın adı",
    roomCountLabel: "Otaq sayı",
    cityLabel: "Şəhər",
    areaNameLabel: "Ərazi adı",
    locationLabel: "Dəqiq məkan / ünvan",
    locationPlaceholder:
      "Ünvanı əl ilə yazın və ya aşağıdakı düymə ilə cari məkanı götürün",
    rulesLabel: "Qaydalar",
    priceHourLabel: "Saatlıq qiymət",
    priceDayLabel: "Günlük qiymət",
    priceWeekLabel: "Həftəlik qiymət",
    priceMonthLabel: "Aylıq qiymət",
    priceYearLabel: "İllik qiymət",
    locationSource: "Məkan mənbəyi",
    locationManual: "Əl ilə daxil edilib",
    locationCurrentDevice: "Cari cihaz məkanı",
    locationMapPicker: "Xəritə seçimi",
    addCurrentLocation: "Cari məkanı əlavə et",
    gettingLocation: "Məkan götürülür...",
    clearCoordinates: "Koordinatları təmizlə",
    geolocationNote:
      "Bu düymə klik zamanı brauzerin geolocation axınını başladır. localhost və HTTPS secure context hesab olunur. İcazə bloklanıbsa, timeout baş veribsə və ya brauzer dəstəkləmirsə, yuxarıda aydın xəta mesajı görünəcək. Koordinatlar UI-də göstərilmir, lakin backend müqaviləsi üçün daxildə saxlanılır.",
    imageSectionInfo: `Minimum 1, maksimum ${MAX_PROPERTY_IMAGES} şəkil. Profil şəkli axınına bənzər şəkildə cihazdan seçib upload edin.`,
    addImage: "Şəkil əlavə et",
    imagesUploading: "Şəkillər upload olunur...",
    noImages: "Hələ şəkil əlavə edilməyib.",
    previewUnavailable: "Preview göstərilə bilmədi",
    imageLabel: "Şəkil",
    deleteButton: "Sil",
    imageStorageNote:
      "Storage və payload üçün nisbi `/uploads/...` yolları saxlanılır. Preview üçün isə şəkil URL-i avtomatik API origin ilə birləşdirilir ki create və edit rejimində eyni cür görünsün.",
    pricingNote:
      "Qeyd: ən azı bir qiymət sahəsi doldurulmalıdır. Owner identifikasiyası storage-dən götürülür. Abunəlik aktiv deyilsə create və edit axını billing səhifəsinə yönləndiriləcək.",
    ownerPhoneMissing:
      "Owner telefon məlumatı tapılmadı. Əvvəl profil səhifəsində məlumatları tamamlayın.",
    goToProfile: "Profilə keç",
    editPropertyMissing: "Redaktə ediləcək elan seçilməyib.",
    backToListings: "Elanlar siyahısına qayıt",
    loadingDetails: "Elan məlumatları yüklənir...",
    saveChanges: "Dəyişiklikləri yadda saxla",
    completeListing: "Elanı tamamla",
    updating: "Yenilənir...",
    creating: "Yaradılır...",
    viewSubscription: "Abunəliyə bax",
    reverseFallbackPrefix: "Cari məkan",
    coordinatesCleared: "Cari məkan koordinatları təmizləndi.",
    locationPermissionCheck: "Brauzer məkan icazəsini yoxlayır...",
    locationPermissionPrompt:
      "Brauzer məkan icazəsi istəyəcək. Açılan pəncərədə icazə verin.",
    locationGrantedLoading: "Cari məkan alınır...",
    locationUnknownLoading:
      "Cari məkan alınır. Brauzer icazə pəncərəsi göstərə bilər.",
    coordinatesReceived: "Koordinatlar alındı, ünvan müəyyən edilir...",
    currentLocationAdded: "Cari məkan uğurla əlavə olundu.",
    currentLocationFallbackAdded:
      "Cari məkan alındı. Ünvan fallback formatında dolduruldu.",
    imageAddedSingle: "1 şəkil uğurla əlavə olundu.",
    imageAddedPluralSuffix: "şəkil uğurla əlavə olundu.",
    serviceFallback: "Xidmət",
    serviceRentHome: "Ev kirayəsi",
    serviceBarber: "Bərbər",
    serviceCarRental: "Avtomobil icarəsi",
    serviceHotel: "Otelçilik",
    serviceBeautySalon: "Gözəllik salonu",
    serviceBabysitter: "Uşaq baxıcısı",
    serviceCleaning: "Təmizlik xidmətləri",
    serviceTechnicalServices: "Texniki xidmətlər",
    serviceSoberDriver: "Ayıq sürücü xidməti",
    errorServiceRequired: "Xidmət seçilməyib.",
    errorPropertyIdRequired: "Redaktə ediləcək elan seçilməyib.",
    errorTitleRequired: "Elanın adı məcburidir.",
    errorCityRequired: "Şəhər məcburidir.",
    errorAreaRequired: "Ərazi adı məcburidir.",
    errorLocationRequired: "Məkan məcburidir.",
    errorRulesRequired: "Qaydalar məcburidir.",
    errorRoomCountInvalid: "Otaq sayı düzgün daxil edilməlidir.",
    errorAtLeastOnePrice: "Ən azı bir qiymət sahəsi doldurulmalıdır.",
    errorAtLeastOneImage: "Ən azı 1 şəkil əlavə etmək mütləqdir.",
    errorMaxImages: `Maksimum ${MAX_PROPERTY_IMAGES} şəkil əlavə etmək olar.`,
    errorInvalidImageUrl: "Şəkil URL-lərindən biri düzgün deyil.",
    errorLatLngTogether: "Latitude və longitude birlikdə doldurulmalıdır.",
    errorCoordinatesRequired:
      "Seçilmiş məkan mənbəyi üçün koordinatlar məcburidir.",
    errorLatRange: "Latitude düzgün intervalda deyil.",
    errorLngRange: "Longitude düzgün intervalda deyil.",
    errorOwnerNotFound:
      "Owner tapılmadı. Əvvəl profil məlumatlarını tamamlayın.",
    errorServiceNotFound: "Xidmət tapılmadı və ya aktiv deyil.",
    errorProfileRequired: "Əvvəl owner profilini tamamlayın.",
    errorPhoneVerificationRequired: "Telefon təsdiqi tamamlanmalıdır.",
    errorServiceSelectionRequired: "Əvvəl xidmət seçimi tamamlanmalıdır.",
    errorPropertyNotFound: "Elan tapılmadı və ya artıq mövcud deyil.",
    errorSubscriptionRequired:
      "Abunəlik aktiv deyil. Billing səhifəsinə yönləndirilirsiniz.",
    errorMultipartRequired: "Şəkil upload formatı düzgün deyil.",
    errorFileMissing: "Yüklənəcək şəkil tapılmadı.",
    errorInvalidImageType: "Yalnız JPG, PNG və WEBP şəkilləri qəbul olunur.",
    errorUploadWriteFailed: "Şəkil yaddaşa yazıla bilmədi.",
    errorInternal: "Server xətası baş verdi. Bir az sonra yenidən cəhd edin.",
    errorTimeout: "Sorğu vaxt aşımına düşdü. Backend cavab vermədi.",
    errorEnvironmentNoGeo: "Cari məkan bu mühitdə istifadə edilə bilmir.",
    errorGeoUnsupported: "Brauzer geolocation dəstəkləmir.",
    errorGeoNotSecure:
      "Cari məkan yalnız secure context-də işləyir. localhost və ya HTTPS üzərindən açın.",
    errorGeoPermissionDenied:
      "Məkan icazəsi brauzerdə bloklanıb. Address bar yanındakı site permissions hissəsindən location access-i açın.",
    errorGeoUnavailable:
      "Cari məkan müəyyən edilə bilmədi. GPS və ya cihaz location xidmətlərini yoxlayın.",
    errorGeoTimeout: "Məkan sorğusu vaxt aşımına düşdü. Yenidən cəhd edin.",
    errorGeoGeneric: "Cari məkan götürülə bilmədi.",
    errorFileTooLarge: "Hər şəkil maksimum 5 MB ola bilər.",
    errorUploadNoPath: "Upload cavabında şəkil yolu tapılmadı.",
    errorGeneric: "Əməliyyat icra edilə bilmədi.",
  },
  en: {
    createPageTitle: "Create new listing",
    editPageTitle: "Edit listing",
    createBadge: "Create listing",
    editBadge: "Edit listing",
    checkingServiceContext: "Checking service context...",
    createSubtitle:
      "The listing is created within the selected service and active owner profile context.",
    editSubtitle:
      "The listing is being edited within the current owner profile and selected service context.",
    selectedService: "Selected service",
    backToDashboard: "Back to dashboard",
    myListings: "My listings",
    changeService: "Change service",
    basicInfo: "Basic information",
    locationSection: "Location",
    rulesSection: "Rules",
    imagesSection: "Images",
    pricesSection: "Prices",
    titleLabel: "Listing title",
    roomCountLabel: "Room count",
    cityLabel: "City",
    areaNameLabel: "Area name",
    locationLabel: "Exact location / address",
    locationPlaceholder:
      "Type the address manually or use the button below to fetch the current location",
    rulesLabel: "Rules",
    priceHourLabel: "Hourly price",
    priceDayLabel: "Daily price",
    priceWeekLabel: "Weekly price",
    priceMonthLabel: "Monthly price",
    priceYearLabel: "Yearly price",
    locationSource: "Location source",
    locationManual: "Entered manually",
    locationCurrentDevice: "Current device location",
    locationMapPicker: "Map picker",
    addCurrentLocation: "Add current location",
    gettingLocation: "Fetching location...",
    clearCoordinates: "Clear coordinates",
    geolocationNote:
      "This button starts the browser geolocation flow on click. localhost and HTTPS are treated as secure contexts. If access is blocked, a timeout occurs, or the browser does not support geolocation, a clear error message will appear above. Coordinates are not displayed in the UI, but they are stored internally for the backend contract.",
    imageSectionInfo: `Minimum 1 and maximum ${MAX_PROPERTY_IMAGES} images. Select from the device and upload, similar to the profile photo flow.`,
    addImage: "Add image",
    imagesUploading: "Uploading images...",
    noImages: "No images have been added yet.",
    previewUnavailable: "Preview could not be shown",
    imageLabel: "Image",
    deleteButton: "Delete",
    imageStorageNote:
      "Relative `/uploads/...` paths are stored for storage and payload. For preview, the image URL is automatically combined with the API origin so it behaves the same in create and edit modes.",
    pricingNote:
      "Note: at least one price field must be filled. Owner identification is read from storage. If the subscription is not active, create and edit flow will redirect to the billing page.",
    ownerPhoneMissing:
      "Owner phone information was not found. Please complete your profile information first.",
    goToProfile: "Go to profile",
    editPropertyMissing: "The listing to edit was not selected.",
    backToListings: "Return to listings",
    loadingDetails: "Loading listing details...",
    saveChanges: "Save changes",
    completeListing: "Complete listing",
    updating: "Updating...",
    creating: "Creating...",
    viewSubscription: "View subscription",
    reverseFallbackPrefix: "Current location",
    coordinatesCleared: "Current location coordinates were cleared.",
    locationPermissionCheck: "The browser is checking location permission...",
    locationPermissionPrompt:
      "The browser will request location access. Please allow it in the popup.",
    locationGrantedLoading: "Fetching current location...",
    locationUnknownLoading:
      "Fetching current location. The browser may show a permission prompt.",
    coordinatesReceived: "Coordinates received, resolving address...",
    currentLocationAdded: "Current location was added successfully.",
    currentLocationFallbackAdded:
      "Current location was obtained. The address was filled in fallback format.",
    imageAddedSingle: "1 image was added successfully.",
    imageAddedPluralSuffix: "images were added successfully.",
    serviceFallback: "Service",
    serviceRentHome: "Home rental",
    serviceBarber: "Barber",
    serviceCarRental: "Car rental",
    serviceHotel: "Hotel",
    serviceBeautySalon: "Beauty salon",
    serviceBabysitter: "Babysitter",
    serviceCleaning: "Cleaning services",
    serviceTechnicalServices: "Technical services",
    serviceSoberDriver: "Sober driver service",
    errorServiceRequired: "No service was selected.",
    errorPropertyIdRequired: "No listing was selected for editing.",
    errorTitleRequired: "Listing title is required.",
    errorCityRequired: "City is required.",
    errorAreaRequired: "Area name is required.",
    errorLocationRequired: "Location is required.",
    errorRulesRequired: "Rules are required.",
    errorRoomCountInvalid: "Room count must be entered correctly.",
    errorAtLeastOnePrice: "At least one price field must be filled.",
    errorAtLeastOneImage: "At least 1 image must be added.",
    errorMaxImages: `A maximum of ${MAX_PROPERTY_IMAGES} images can be added.`,
    errorInvalidImageUrl: "One of the image URLs is invalid.",
    errorLatLngTogether: "Latitude and longitude must be provided together.",
    errorCoordinatesRequired:
      "Coordinates are required for the selected location source.",
    errorLatRange: "Latitude is outside the valid range.",
    errorLngRange: "Longitude is outside the valid range.",
    errorOwnerNotFound:
      "Owner was not found. Please complete your profile information first.",
    errorServiceNotFound: "Service was not found or is inactive.",
    errorProfileRequired: "Please complete the owner profile first.",
    errorPhoneVerificationRequired: "Phone verification must be completed.",
    errorServiceSelectionRequired: "Please complete service selection first.",
    errorPropertyNotFound: "The listing was not found or no longer exists.",
    errorSubscriptionRequired:
      "Subscription is not active. You are being redirected to billing.",
    errorMultipartRequired: "The image upload format is invalid.",
    errorFileMissing: "No file was found to upload.",
    errorInvalidImageType: "Only JPG, PNG, and WEBP images are accepted.",
    errorUploadWriteFailed: "The image could not be written to storage.",
    errorInternal: "A server error occurred. Please try again later.",
    errorTimeout: "The request timed out. The backend did not respond.",
    errorEnvironmentNoGeo:
      "Current location cannot be used in this environment.",
    errorGeoUnsupported: "The browser does not support geolocation.",
    errorGeoNotSecure:
      "Current location works only in a secure context. Open via localhost or HTTPS.",
    errorGeoPermissionDenied:
      "Location access is blocked in the browser. Enable location access from the site permissions near the address bar.",
    errorGeoUnavailable:
      "Current location could not be determined. Check GPS or device location services.",
    errorGeoTimeout: "The location request timed out. Please try again.",
    errorGeoGeneric: "Current location could not be obtained.",
    errorFileTooLarge: "Each image can be at most 5 MB.",
    errorUploadNoPath: "No image path was found in the upload response.",
    errorGeneric: "The operation could not be completed.",
  },
  ru: {
    createPageTitle: "Создать новое объявление",
    editPageTitle: "Редактировать объявление",
    createBadge: "Создание объявления",
    editBadge: "Редактирование объявления",
    checkingServiceContext: "Проверяется контекст услуги...",
    createSubtitle:
      "Объявление создаётся в контексте выбранной услуги и активного профиля владельца.",
    editSubtitle:
      "Объявление редактируется в контексте текущего профиля владельца и выбранной услуги.",
    selectedService: "Выбранная услуга",
    backToDashboard: "Назад в панель",
    myListings: "Мои объявления",
    changeService: "Сменить услугу",
    basicInfo: "Основная информация",
    locationSection: "Локация",
    rulesSection: "Правила",
    imagesSection: "Изображения",
    pricesSection: "Цены",
    titleLabel: "Название объявления",
    roomCountLabel: "Количество комнат",
    cityLabel: "Город",
    areaNameLabel: "Название района",
    locationLabel: "Точная локация / адрес",
    locationPlaceholder:
      "Введите адрес вручную или используйте кнопку ниже, чтобы получить текущее местоположение",
    rulesLabel: "Правила",
    priceHourLabel: "Почасовая цена",
    priceDayLabel: "Суточная цена",
    priceWeekLabel: "Недельная цена",
    priceMonthLabel: "Месячная цена",
    priceYearLabel: "Годовая цена",
    locationSource: "Источник локации",
    locationManual: "Введено вручную",
    locationCurrentDevice: "Текущее местоположение устройства",
    locationMapPicker: "Выбор на карте",
    addCurrentLocation: "Добавить текущее местоположение",
    gettingLocation: "Получение местоположения...",
    clearCoordinates: "Очистить координаты",
    geolocationNote:
      "Эта кнопка запускает геолокацию браузера по нажатию. localhost и HTTPS считаются безопасным контекстом. Если доступ заблокирован, произошёл таймаут или браузер не поддерживает геолокацию, выше появится понятное сообщение об ошибке. Координаты не показываются в интерфейсе, но сохраняются внутри для backend contract.",
    imageSectionInfo: `Минимум 1 и максимум ${MAX_PROPERTY_IMAGES} изображений. Выберите их с устройства и загрузите, как в потоке фото профиля.`,
    addImage: "Добавить изображение",
    imagesUploading: "Изображения загружаются...",
    noImages: "Изображения ещё не добавлены.",
    previewUnavailable: "Предпросмотр недоступен",
    imageLabel: "Изображение",
    deleteButton: "Удалить",
    imageStorageNote:
      "Для storage и payload сохраняются относительные пути `/uploads/...`. Для предпросмотра URL изображения автоматически объединяется с API origin, чтобы одинаково работать в режимах создания и редактирования.",
    pricingNote:
      "Примечание: должно быть заполнено хотя бы одно поле цены. Идентификация владельца берётся из storage. Если подписка не активна, поток создания и редактирования перенаправит на страницу billing.",
    ownerPhoneMissing:
      "Не найдена информация о телефоне владельца. Сначала заполните данные профиля.",
    goToProfile: "Перейти в профиль",
    editPropertyMissing: "Объявление для редактирования не выбрано.",
    backToListings: "Вернуться к списку объявлений",
    loadingDetails: "Загрузка данных объявления...",
    saveChanges: "Сохранить изменения",
    completeListing: "Завершить объявление",
    updating: "Обновление...",
    creating: "Создание...",
    viewSubscription: "Посмотреть подписку",
    reverseFallbackPrefix: "Текущее местоположение",
    coordinatesCleared: "Координаты текущего местоположения очищены.",
    locationPermissionCheck:
      "Браузер проверяет разрешение на доступ к местоположению...",
    locationPermissionPrompt:
      "Браузер запросит доступ к местоположению. Разрешите его во всплывающем окне.",
    locationGrantedLoading: "Получение текущего местоположения...",
    locationUnknownLoading:
      "Получение текущего местоположения. Браузер может показать окно разрешения.",
    coordinatesReceived: "Координаты получены, определяется адрес...",
    currentLocationAdded: "Текущее местоположение успешно добавлено.",
    currentLocationFallbackAdded:
      "Текущее местоположение получено. Адрес заполнен в резервном формате.",
    imageAddedSingle: "1 изображение успешно добавлено.",
    imageAddedPluralSuffix: "изображений успешно добавлено.",
    serviceFallback: "Услуга",
    serviceRentHome: "Аренда жилья",
    serviceBarber: "Барбер",
    serviceCarRental: "Аренда автомобиля",
    serviceHotel: "Отель",
    serviceBeautySalon: "Салон красоты",
    serviceBabysitter: "Няня",
    serviceCleaning: "Клининговые услуги",
    serviceTechnicalServices: "Технические услуги",
    serviceSoberDriver: "Услуга трезвого водителя",
    errorServiceRequired: "Услуга не выбрана.",
    errorPropertyIdRequired: "Объявление для редактирования не выбрано.",
    errorTitleRequired: "Название объявления обязательно.",
    errorCityRequired: "Город обязателен.",
    errorAreaRequired: "Название района обязательно.",
    errorLocationRequired: "Локация обязательна.",
    errorRulesRequired: "Правила обязательны.",
    errorRoomCountInvalid: "Количество комнат указано неверно.",
    errorAtLeastOnePrice: "Необходимо заполнить хотя бы одно поле цены.",
    errorAtLeastOneImage: "Нужно добавить как минимум 1 изображение.",
    errorMaxImages: `Можно добавить максимум ${MAX_PROPERTY_IMAGES} изображений.`,
    errorInvalidImageUrl: "Один из URL изображений неверный.",
    errorLatLngTogether: "Широта и долгота должны передаваться вместе.",
    errorCoordinatesRequired:
      "Для выбранного источника локации координаты обязательны.",
    errorLatRange: "Широта вне допустимого диапазона.",
    errorLngRange: "Долгота вне допустимого диапазона.",
    errorOwnerNotFound: "Владелец не найден. Сначала заполните данные профиля.",
    errorServiceNotFound: "Услуга не найдена или не активна.",
    errorProfileRequired: "Сначала заполните профиль владельца.",
    errorPhoneVerificationRequired:
      "Необходимо завершить подтверждение телефона.",
    errorServiceSelectionRequired: "Сначала завершите выбор услуги.",
    errorPropertyNotFound: "Объявление не найдено или больше не существует.",
    errorSubscriptionRequired:
      "Подписка не активна. Выполняется переход на billing.",
    errorMultipartRequired: "Неверный формат загрузки изображения.",
    errorFileMissing: "Файл для загрузки не найден.",
    errorInvalidImageType: "Принимаются только изображения JPG, PNG и WEBP.",
    errorUploadWriteFailed: "Не удалось сохранить изображение в storage.",
    errorInternal: "Произошла ошибка сервера. Повторите попытку позже.",
    errorTimeout: "Время запроса истекло. Backend не ответил.",
    errorEnvironmentNoGeo: "Текущее местоположение недоступно в этой среде.",
    errorGeoUnsupported: "Браузер не поддерживает геолокацию.",
    errorGeoNotSecure:
      "Текущее местоположение работает только в безопасном контексте. Откройте через localhost или HTTPS.",
    errorGeoPermissionDenied:
      "Доступ к местоположению заблокирован в браузере. Разрешите его в site permissions рядом с адресной строкой.",
    errorGeoUnavailable:
      "Не удалось определить текущее местоположение. Проверьте GPS или службы геолокации устройства.",
    errorGeoTimeout:
      "Запрос местоположения превысил время ожидания. Повторите попытку.",
    errorGeoGeneric: "Не удалось получить текущее местоположение.",
    errorFileTooLarge: "Размер каждого изображения не должен превышать 5 МБ.",
    errorUploadNoPath: "В ответе upload не найден путь изображения.",
    errorGeneric: "Не удалось выполнить операцию.",
  },
  zh: {
    createPageTitle: "创建新房源",
    editPageTitle: "编辑房源",
    createBadge: "创建房源",
    editBadge: "编辑房源",
    checkingServiceContext: "正在检查服务上下文...",
    createSubtitle: "该房源将在所选服务和有效业主资料上下文中创建。",
    editSubtitle: "该房源正在当前业主资料和所选服务上下文中编辑。",
    selectedService: "已选服务",
    backToDashboard: "返回控制台",
    myListings: "我的房源",
    changeService: "更换服务",
    basicInfo: "基本信息",
    locationSection: "位置",
    rulesSection: "规则",
    imagesSection: "图片",
    pricesSection: "价格",
    titleLabel: "房源标题",
    roomCountLabel: "房间数量",
    cityLabel: "城市",
    areaNameLabel: "区域名称",
    locationLabel: "精确位置 / 地址",
    locationPlaceholder: "手动输入地址，或使用下方按钮获取当前位置",
    rulesLabel: "规则",
    priceHourLabel: "小时价格",
    priceDayLabel: "日价格",
    priceWeekLabel: "周价格",
    priceMonthLabel: "月价格",
    priceYearLabel: "年价格",
    locationSource: "位置来源",
    locationManual: "手动输入",
    locationCurrentDevice: "当前设备位置",
    locationMapPicker: "地图选择",
    addCurrentLocation: "添加当前位置",
    gettingLocation: "正在获取位置...",
    clearCoordinates: "清除坐标",
    geolocationNote:
      "点击此按钮将启动浏览器地理定位流程。localhost 和 HTTPS 被视为安全上下文。如果权限被阻止、请求超时或浏览器不支持地理定位，上方会显示清晰的错误信息。坐标不会显示在界面中，但会在内部保存以满足 backend contract。",
    imageSectionInfo: `至少 1 张，最多 ${MAX_PROPERTY_IMAGES} 张图片。像资料照片流程一样，从设备选择并上传。`,
    addImage: "添加图片",
    imagesUploading: "正在上传图片...",
    noImages: "尚未添加任何图片。",
    previewUnavailable: "无法显示预览",
    imageLabel: "图片",
    deleteButton: "删除",
    imageStorageNote:
      "Storage 和 payload 中保存相对路径 `/uploads/...`。预览时会自动与 API origin 拼接，因此在创建和编辑模式下表现一致。",
    pricingNote:
      "说明：至少需要填写一个价格字段。业主身份信息从 storage 中读取。如果订阅未激活，创建和编辑流程将跳转到 billing 页面。",
    ownerPhoneMissing: "未找到业主电话信息。请先完善资料信息。",
    goToProfile: "前往资料页",
    editPropertyMissing: "未选择要编辑的房源。",
    backToListings: "返回房源列表",
    loadingDetails: "正在加载房源详情...",
    saveChanges: "保存修改",
    completeListing: "完成房源",
    updating: "正在更新...",
    creating: "正在创建...",
    viewSubscription: "查看订阅",
    reverseFallbackPrefix: "当前位置",
    coordinatesCleared: "当前位置坐标已清除。",
    locationPermissionCheck: "浏览器正在检查位置权限...",
    locationPermissionPrompt: "浏览器将请求位置访问权限，请在弹窗中允许。",
    locationGrantedLoading: "正在获取当前位置...",
    locationUnknownLoading: "正在获取当前位置，浏览器可能会弹出权限提示。",
    coordinatesReceived: "已获取坐标，正在解析地址...",
    currentLocationAdded: "当前位置已成功添加。",
    currentLocationFallbackAdded: "已获取当前位置，地址已按后备格式填充。",
    imageAddedSingle: "1 张图片已成功添加。",
    imageAddedPluralSuffix: "张图片已成功添加。",
    serviceFallback: "服务",
    serviceRentHome: "房屋出租",
    serviceBarber: "理发",
    serviceCarRental: "汽车租赁",
    serviceHotel: "酒店",
    serviceBeautySalon: "美容沙龙",
    serviceBabysitter: "保姆",
    serviceCleaning: "清洁服务",
    serviceTechnicalServices: "技术服务",
    serviceSoberDriver: "代驾服务",
    errorServiceRequired: "尚未选择服务。",
    errorPropertyIdRequired: "尚未选择要编辑的房源。",
    errorTitleRequired: "房源标题为必填项。",
    errorCityRequired: "城市为必填项。",
    errorAreaRequired: "区域名称为必填项。",
    errorLocationRequired: "位置为必填项。",
    errorRulesRequired: "规则为必填项。",
    errorRoomCountInvalid: "房间数量填写不正确。",
    errorAtLeastOnePrice: "至少需要填写一个价格字段。",
    errorAtLeastOneImage: "至少需要添加 1 张图片。",
    errorMaxImages: `最多可添加 ${MAX_PROPERTY_IMAGES} 张图片。`,
    errorInvalidImageUrl: "其中一张图片的 URL 无效。",
    errorLatLngTogether: "纬度和经度必须同时填写。",
    errorCoordinatesRequired: "所选位置来源必须提供坐标。",
    errorLatRange: "纬度超出有效范围。",
    errorLngRange: "经度超出有效范围。",
    errorOwnerNotFound: "未找到业主。请先完善资料信息。",
    errorServiceNotFound: "未找到服务或服务未激活。",
    errorProfileRequired: "请先完成业主资料。",
    errorPhoneVerificationRequired: "必须完成手机验证。",
    errorServiceSelectionRequired: "请先完成服务选择。",
    errorPropertyNotFound: "未找到房源，或房源已不存在。",
    errorSubscriptionRequired: "订阅未激活。正在跳转到 billing 页面。",
    errorMultipartRequired: "图片上传格式无效。",
    errorFileMissing: "未找到要上传的文件。",
    errorInvalidImageType: "仅接受 JPG、PNG 和 WEBP 图片。",
    errorUploadWriteFailed: "图片无法写入 storage。",
    errorInternal: "服务器发生错误，请稍后重试。",
    errorTimeout: "请求超时，backend 未响应。",
    errorEnvironmentNoGeo: "当前位置在此环境中不可用。",
    errorGeoUnsupported: "浏览器不支持地理定位。",
    errorGeoNotSecure:
      "当前位置仅在安全上下文中可用。请通过 localhost 或 HTTPS 打开。",
    errorGeoPermissionDenied:
      "浏览器已阻止位置权限。请在地址栏旁的 site permissions 中开启位置访问。",
    errorGeoUnavailable: "无法确定当前位置。请检查 GPS 或设备位置服务。",
    errorGeoTimeout: "位置请求超时，请重试。",
    errorGeoGeneric: "无法获取当前位置。",
    errorFileTooLarge: "每张图片最大只能为 5 MB。",
    errorUploadNoPath: "上传响应中未找到图片路径。",
    errorGeneric: "操作无法完成。",
  },
} as const;

type UiText = typeof UI_TEXT.az;

function getUiText(locale: Locale): UiText {
  return (UI_TEXT[locale] ?? UI_TEXT.az) as UiText;
}

function safeServiceKey(input: unknown): string {
  const value = String(input ?? "")
    .trim()
    .toUpperCase();
  if (!value) return "";
  if (!/^[A-Z0-9_-]{2,64}$/.test(value)) return "";
  return value;
}

function safeEntityId(input: unknown): string {
  const value = String(input ?? "").trim();
  if (!value) return "";
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(value)) return "";
  return value;
}

function getQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() || "";
  return value?.trim() || "";
}

function normalizeLocale(value: unknown): Locale | "" {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return "";
  if (raw.startsWith("az")) return "az";
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("ru")) return "ru";
  if (raw.startsWith("zh")) return "zh";
  return "";
}

function readLocaleFromStorage(): Locale | "" {
  return normalizeLocale(readFirstStorageValue(LOCALE_STORAGE_KEYS));
}

function writeLocaleToStorage(locale: Locale) {
  writeStorageValueToKeys(LOCALE_STORAGE_KEYS, locale);
}

function appendLangParam(params: URLSearchParams, locale: Locale) {
  params.set("lang", locale);
}

function digitsOnly(value: string): string {
  return String(value || "").replace(/[^\d]/g, "");
}

function normalizePositiveNumber(value: string): number | null {
  const trimmed = digitsOnly(value).trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return parsed;
}

function normalizeCoordinateInput(value: string): string {
  return String(value || "")
    .replace(",", ".")
    .replace(/[^0-9+.-]/g, "")
    .trim();
}

function parseCoordinate(value: string): number | null {
  const normalized = normalizeCoordinateInput(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeAsciiHeaderValue(value: unknown): string {
  const raw = String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();

  if (!raw) return "";

  let out = "";
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 && code <= 0x7e) {
      out += ch;
    }
  }

  return out.trim();
}

function isValidE164(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(String(value || "").trim());
}

function normalizePhoneForStorage(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const normalized = raw.startsWith("+")
    ? `+${digitsOnly(raw)}`
    : `+${digitsOnly(raw)}`;

  return isValidE164(normalized) ? normalized : "";
}

function normalizeOwnerIdForStorage(value: unknown): string {
  const sanitized = normalizeAsciiHeaderValue(value);
  if (!sanitized) return "";
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(sanitized)) return "";
  return sanitized;
}

function normalizeEmailForStorage(value: unknown): string {
  const sanitized = normalizeAsciiHeaderValue(
    String(value ?? "").toLowerCase(),
  );
  if (!sanitized) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) return "";
  return sanitized;
}

function readFirstStorageValue(keys: readonly string[]): string {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = String(window.localStorage.getItem(key) || "").trim();
    if (value) return value;
  }

  return "";
}

function writeStorageValueToKeys(keys: readonly string[], value: string) {
  if (typeof window === "undefined") return;

  const normalized = String(value || "").trim();
  if (!normalized) return;

  for (const key of keys) {
    window.localStorage.setItem(key, normalized);
  }
}

function getServiceKeyFromStorage(): string {
  return safeServiceKey(readFirstStorageValue(SERVICE_STORAGE_KEYS));
}

function writeServiceKeyToStorage(serviceKey: string) {
  const safe = safeServiceKey(serviceKey);
  if (!safe) return;
  writeStorageValueToKeys(SERVICE_STORAGE_KEYS, safe);
}

function getPhoneFromStorage(): string {
  return normalizePhoneForStorage(readFirstStorageValue(PHONE_STORAGE_KEYS));
}

function writePhoneToStorage(phone: string) {
  const normalized = normalizePhoneForStorage(phone);
  if (!normalized) return;
  writeStorageValueToKeys(PHONE_STORAGE_KEYS, normalized);
}

function getOwnerIdFromStorage(): string {
  return normalizeOwnerIdForStorage(
    readFirstStorageValue(OWNER_ID_STORAGE_KEYS),
  );
}

function getOwnerEmailFromStorage(): string {
  return normalizeEmailForStorage(
    readFirstStorageValue(OWNER_EMAIL_STORAGE_KEYS),
  );
}

function sanitizeHeadersRecord(
  input: Record<string, string>,
): Record<string, string> {
  const output: Record<string, string> = {};

  for (const [key, value] of Object.entries(input)) {
    const sanitizedValue = normalizeAsciiHeaderValue(value);
    if (sanitizedValue) {
      output[key] = sanitizedValue;
    }
  }

  return output;
}

function buildOwnerHeaders(): Record<string, string> {
  const ownerId = getOwnerIdFromStorage();
  const ownerPhone = getPhoneFromStorage();
  const ownerEmail = getOwnerEmailFromStorage();

  return sanitizeHeadersRecord({
    ...(ownerId ? { "x-owner-id": ownerId } : {}),
    ...(ownerPhone ? { "x-owner-phone": ownerPhone } : {}),
    ...(ownerEmail ? { "x-owner-email": ownerEmail } : {}),
  });
}

function humanizeServiceKey(serviceKey: string, text: UiText): string {
  const map: Record<string, string> = {
    RENT_HOME: text.serviceRentHome,
    BARBER: text.serviceBarber,
    CAR_RENTAL: text.serviceCarRental,
    HOTEL: text.serviceHotel,
    BEAUTY_SALON: text.serviceBeautySalon,
    BEAUTY: text.serviceBeautySalon,
    BABYSITTER: text.serviceBabysitter,
    CLEANING: text.serviceCleaning,
    TECHNICAL_SERVICES: text.serviceTechnicalServices,
    SOBER_DRIVER: text.serviceSoberDriver,
  };

  if (!serviceKey) return text.serviceFallback;
  if (map[serviceKey]) return map[serviceKey];

  return serviceKey
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function humanizeLocationSource(source: LocationSource, text: UiText): string {
  if (source === "CURRENT_DEVICE") return text.locationCurrentDevice;
  if (source === "MAP_PICKER") return text.locationMapPicker;
  return text.locationManual;
}

function buildDashboardUrl(serviceKey: string, locale: Locale): string {
  const params = new URLSearchParams();
  if (serviceKey) params.set("serviceKey", serviceKey);
  appendLangParam(params, locale);
  return `/dashboard${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildBillingUrl(serviceKey: string, locale: Locale): string {
  const params = new URLSearchParams();
  if (serviceKey) params.set("serviceKey", serviceKey);
  appendLangParam(params, locale);
  return `/billing${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildPropertiesUrl(serviceKey: string, locale: Locale): string {
  const params = new URLSearchParams();
  if (serviceKey) params.set("serviceKey", serviceKey);
  appendLangParam(params, locale);
  return `/properties${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildEditorPath(
  serviceKey: string,
  isEditMode: boolean,
  propertyId: string,
  locale: Locale,
): string {
  const params = new URLSearchParams();

  if (serviceKey) params.set("serviceKey", serviceKey);
  if (isEditMode) params.set("mode", "edit");
  if (isEditMode && propertyId) params.set("propertyId", propertyId);
  appendLangParam(params, locale);

  return `/properties/create${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildServiceSelectUrl(nextPath: string, locale: Locale): string {
  const params = new URLSearchParams();
  params.set("next", nextPath);
  appendLangParam(params, locale);
  return `${SERVICE_SELECT_ROUTE}?${params.toString()}`;
}

function buildProfileUrl(
  serviceKey: string,
  nextPath: string,
  locale: Locale,
): string {
  const params = new URLSearchParams();
  if (serviceKey) params.set("serviceKey", serviceKey);
  if (nextPath) params.set("next", nextPath);
  appendLangParam(params, locale);
  return `${PROFILE_ROUTE}?${params.toString()}`;
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function withLocaleOnRelativeUrl(urlValue: string, locale: Locale): string {
  const trimmed = String(urlValue || "").trim();
  if (!trimmed || isAbsoluteUrl(trimmed) || typeof window === "undefined") {
    return trimmed;
  }

  try {
    const url = new URL(trimmed, window.location.origin);
    url.searchParams.set("lang", locale);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return trimmed;
  }
}

function normalizeLocationSource(value: unknown): LocationSource {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();
  if (normalized === "CURRENT_DEVICE") return "CURRENT_DEVICE";
  if (normalized === "MAP_PICKER") return "MAP_PICKER";
  return "MANUAL";
}

function normalizeImageUrl(value: unknown): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  if (trimmed.length > MAX_IMAGE_URL_LENGTH) return "";
  if (/[\u0000-\u001F\u007F<>"'`]/.test(trimmed)) return "";
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return "";
  return trimmed;
}

function normalizeImageList(values: string[]): string[] {
  const dedup = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const normalized = normalizeImageUrl(value);
    if (!normalized) continue;
    if (dedup.has(normalized)) continue;
    dedup.add(normalized);
    out.push(normalized);
  }

  return out;
}

function buildMediaPreviewUrl(value: unknown): string {
  const normalized = normalizeImageUrl(value);
  if (!normalized) return "";

  if (isAbsoluteUrl(normalized)) {
    return normalized;
  }

  if (normalized.startsWith("/")) {
    return `${API_BASE}${normalized}`;
  }

  return `${API_BASE}/${normalized}`;
}

function mapPropertyError(message: string, text: UiText): string {
  const normalized = String(message || "").trim();

  if (normalized === "serviceKey is required") return text.errorServiceRequired;
  if (normalized === "propertyId is required")
    return text.errorPropertyIdRequired;
  if (normalized === "title is required") return text.errorTitleRequired;
  if (normalized === "city is required") return text.errorCityRequired;
  if (normalized === "areaName is required") return text.errorAreaRequired;
  if (normalized === "location is required") return text.errorLocationRequired;
  if (normalized === "rulesText is required") return text.errorRulesRequired;
  if (normalized === "roomCount must be a positive integer")
    return text.errorRoomCountInvalid;
  if (normalized === "At least one price field is required")
    return text.errorAtLeastOnePrice;
  if (normalized === "Ən azı 1 şəkil əlavə etmək mütləqdir.")
    return text.errorAtLeastOneImage;
  if (normalized.startsWith("Maksimum ") && normalized.includes("şəkil"))
    return text.errorMaxImages;
  if (
    normalized ===
    "Hər property şəkli üçün düzgün URL və ya media yolu göndərin."
  ) {
    return text.errorInvalidImageUrl;
  }
  if (normalized === "locationLat və locationLng birlikdə göndərilməlidir") {
    return text.errorLatLngTogether;
  }
  if (normalized === "Seçilmiş location source üçün koordinatlar mütləqdir") {
    return text.errorCoordinatesRequired;
  }
  if (normalized === "locationLat düzgün intervalda deyil")
    return text.errorLatRange;
  if (normalized === "locationLng düzgün intervalda deyil")
    return text.errorLngRange;
  if (normalized === "owner not found") return text.errorOwnerNotFound;
  if (normalized === "service not found or inactive")
    return text.errorServiceNotFound;
  if (normalized === "PROFILE_REQUIRED") return text.errorProfileRequired;
  if (normalized === "PHONE_VERIFICATION_REQUIRED")
    return text.errorPhoneVerificationRequired;
  if (normalized === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return text.errorPhoneVerificationRequired;
  }
  if (normalized === "SERVICE_SELECTION_REQUIRED")
    return text.errorServiceSelectionRequired;
  if (normalized === "PROPERTY_NOT_FOUND") return text.errorPropertyNotFound;
  if (normalized === "SUBSCRIPTION_REQUIRED")
    return text.errorSubscriptionRequired;
  if (normalized === "multipart/form-data tələb olunur")
    return text.errorMultipartRequired;
  if (normalized === "Yüklənəcək fayl tapılmadı") return text.errorFileMissing;
  if (normalized === "Yalnız JPG, PNG və WEBP şəkilləri qəbul olunur") {
    return text.errorInvalidImageType;
  }
  if (normalized === "UPLOAD_WRITE_FAILED") return text.errorUploadWriteFailed;
  if (normalized === "internal_error" || normalized === "INTERNAL_ERROR")
    return text.errorInternal;

  return normalized || text.errorGeneric;
}

function toInputNumberValue(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    return "";
  return String(Math.trunc(value));
}

function toCoordinateValue(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return String(value);
}

function mapItemToForm(item: PropertyApiItem): FormState {
  const images = Array.isArray(item.images)
    ? item.images.map((img) => normalizeImageUrl(img?.url)).filter(Boolean)
    : [];

  return {
    title: String(item.title || ""),
    roomCount:
      typeof item.roomCount === "number" &&
      Number.isFinite(item.roomCount) &&
      item.roomCount > 0
        ? String(Math.trunc(item.roomCount))
        : "",
    city: String(item.city || ""),
    areaName: String(item.areaName || ""),
    location: String(item.location || ""),
    locationPlaceId: String(item.locationPlaceId || ""),
    locationLat: toCoordinateValue(item.locationLat),
    locationLng: toCoordinateValue(item.locationLng),
    locationSource: normalizeLocationSource(item.locationSource),
    rulesText: String(item.rulesText || ""),
    priceHour: toInputNumberValue(item.priceHour),
    priceDay: toInputNumberValue(item.priceDay),
    priceWeek: toInputNumberValue(item.priceWeek),
    priceMonth: toInputNumberValue(item.priceMonth),
    priceYear: toInputNumberValue(item.priceYear),
    imageUrls: images,
  };
}

function getUploadUrlFromPayload(
  payload: ApiEnvelope<unknown> | null | undefined,
): string {
  return normalizeImageUrl(
    payload?.url ||
      payload?.path ||
      payload?.mediaUrl ||
      payload?.fileUrl ||
      payload?.profilePhotoUrl ||
      "",
  );
}

function buildReverseGeocodeLabel(
  lat: number,
  lng: number,
  text: UiText,
): string {
  return `${text.reverseFallbackPrefix} (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
}

function isBrowserSecureForGeolocation(): boolean {
  if (typeof window === "undefined") return false;
  if (window.isSecureContext) return true;

  const hostname = String(window.location.hostname || "").toLowerCase();
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
  );
}

async function getGeolocationPermissionStatus(): Promise<GeoPermissionStatus> {
  if (typeof navigator === "undefined") return "unsupported";

  const permissionsApi = (
    navigator as Navigator & {
      permissions?: {
        query: (descriptor: PermissionDescriptor) => Promise<PermissionStatus>;
      };
    }
  ).permissions;

  if (!permissionsApi?.query) {
    return "unsupported";
  }

  try {
    const status = await permissionsApi.query({
      name: "geolocation" as PermissionName,
    });
    return status.state;
  } catch {
    return "unknown";
  }
}

function geolocationErrorMessage(
  error: GeolocationPositionError | null | undefined,
  text: UiText,
): string {
  if (!error) return text.errorGeoGeneric;
  if (error.code === 1) return text.errorGeoPermissionDenied;
  if (error.code === 2) return text.errorGeoUnavailable;
  if (error.code === 3) return text.errorGeoTimeout;
  return text.errorGeoGeneric;
}

function isGeolocationPositionError(
  value: unknown,
): value is GeolocationPositionError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof (value as { code?: unknown }).code === "number"
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

async function readJsonResponse<T extends object>(
  response: Response,
): Promise<T> {
  return response.json().catch(() => ({} as T));
}

function formatMaxLengthMessage(
  label: string,
  count: number,
  locale: Locale,
): string {
  if (locale === "en") {
    return `${label} can be at most ${count} characters.`;
  }
  if (locale === "ru") {
    return `Поле «${label}» может содержать максимум ${count} символов.`;
  }
  if (locale === "zh") {
    return `${label} 最多只能包含 ${count} 个字符。`;
  }
  return `${label} maksimum ${count} simvol ola bilər.`;
}

function formatLocationPlaceIdMaxLength(locale: Locale, count: number): string {
  if (locale === "en") {
    return `locationPlaceId can be at most ${count} characters.`;
  }
  if (locale === "ru") {
    return `locationPlaceId может содержать максимум ${count} символов.`;
  }
  if (locale === "zh") {
    return `locationPlaceId 最多只能包含 ${count} 个字符。`;
  }
  return `locationPlaceId maksimum ${count} simvol ola bilər.`;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function CreatePropertyPage() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [locale, setLocale] = useState<Locale>("az");
  const [localeReady, setLocaleReady] = useState(false);

  const text = useMemo<UiText>(() => getUiText(locale), [locale]);

  const [serviceKey, setServiceKey] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [serviceReady, setServiceReady] = useState(false);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [error, setError] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [failedPreviewMap, setFailedPreviewMap] = useState<
    Record<string, boolean>
  >({});

  const isEditMode = useMemo(() => {
    return getQueryValue(router.query.mode).toLowerCase() === "edit";
  }, [router.query.mode]);

  const propertyId = useMemo(() => {
    return safeEntityId(getQueryValue(router.query.propertyId));
  }, [router.query.propertyId]);

  const resolvedServiceKey = useMemo(() => {
    const fromQuery = safeServiceKey(getQueryValue(router.query.serviceKey));
    return fromQuery || serviceKey;
  }, [router.query.serviceKey, serviceKey]);

  const resolvedOwnerPhone = useMemo(() => {
    return normalizePhoneForStorage(ownerPhone);
  }, [ownerPhone]);

  const currentPagePath = useMemo(() => {
    return buildEditorPath(resolvedServiceKey, isEditMode, propertyId, locale);
  }, [resolvedServiceKey, isEditMode, propertyId, locale]);

  const dashboardHref = useMemo(() => {
    return buildDashboardUrl(resolvedServiceKey, locale);
  }, [resolvedServiceKey, locale]);

  const billingHref = useMemo(() => {
    return buildBillingUrl(resolvedServiceKey, locale);
  }, [resolvedServiceKey, locale]);

  const propertiesHref = useMemo(() => {
    return buildPropertiesUrl(resolvedServiceKey, locale);
  }, [resolvedServiceKey, locale]);

  const servicesHref = useMemo(() => {
    return buildServiceSelectUrl(currentPagePath, locale);
  }, [currentPagePath, locale]);

  const profileHref = useMemo(() => {
    return buildProfileUrl(resolvedServiceKey, currentPagePath, locale);
  }, [resolvedServiceKey, currentPagePath, locale]);

  const displayServiceName = useMemo(() => {
    return humanizeServiceKey(resolvedServiceKey, text);
  }, [resolvedServiceKey, text]);

  const pageTitle = isEditMode ? text.editPageTitle : text.createPageTitle;
  const pageBadge = isEditMode ? text.editBadge : text.createBadge;
  const submitLabel = isEditMode ? text.saveChanges : text.completeListing;

  const normalizedImageUrls = useMemo(() => {
    return normalizeImageList(form.imageUrls);
  }, [form.imageUrls]);

  const previewImages = useMemo(() => {
    return normalizedImageUrls.map((rawUrl) => ({
      rawUrl,
      previewUrl: buildMediaPreviewUrl(rawUrl),
    }));
  }, [normalizedImageUrls]);

  useEffect(() => {
    if (!router.isReady) return;

    const fromQuery =
      normalizeLocale(getQueryValue(router.query.lang)) ||
      normalizeLocale(getQueryValue(router.query.locale)) ||
      normalizeLocale(getQueryValue(router.query.language));

    const nextLocale = fromQuery || readLocaleFromStorage() || "az";
    setLocale(nextLocale);
    writeLocaleToStorage(nextLocale);
    setLocaleReady(true);
  }, [router.isReady, router.query.lang, router.query.locale, router.query.language]);

  useEffect(() => {
    if (!router.isReady || !localeReady) return;

    const currentLang =
      normalizeLocale(getQueryValue(router.query.lang)) ||
      normalizeLocale(getQueryValue(router.query.locale)) ||
      normalizeLocale(getQueryValue(router.query.language));

    const hasServiceInQuery = Boolean(safeServiceKey(getQueryValue(router.query.serviceKey)));
    const hasCanonicalLang = currentLang === locale;

    if (hasServiceInQuery && hasCanonicalLang) return;

    const nextPath = buildEditorPath(
      safeServiceKey(getQueryValue(router.query.serviceKey)),
      isEditMode,
      propertyId,
      locale,
    );

    void router.replace(nextPath, undefined, {
      shallow: true,
      scroll: false,
    });
  }, [
    router,
    router.isReady,
    router.query.lang,
    router.query.locale,
    router.query.language,
    router.query.serviceKey,
    locale,
    localeReady,
    isEditMode,
    propertyId,
  ]);

  useEffect(() => {
    if (!localeReady || !router.isReady) return;

    const fromQuery = safeServiceKey(getQueryValue(router.query.serviceKey));
    const fromStorage = getServiceKeyFromStorage();
    const resolved = fromQuery || fromStorage;

    if (!resolved) {
      setServiceReady(true);
      void router.replace(buildServiceSelectUrl(currentPagePath, locale));
      return;
    }

    writeServiceKeyToStorage(resolved);
    setServiceKey(resolved);
    setOwnerPhone(getPhoneFromStorage());
    setServiceReady(true);
  }, [
    localeReady,
    router.isReady,
    router.query.serviceKey,
    router,
    currentPagePath,
    locale,
  ]);

  useEffect(() => {
    if (!serviceReady || !resolvedServiceKey) return;

    const phone = getPhoneFromStorage();
    if (!phone) {
      void router.replace(
        buildProfileUrl(resolvedServiceKey, currentPagePath, locale),
      );
      return;
    }

    setOwnerPhone(phone);
  }, [serviceReady, resolvedServiceKey, currentPagePath, locale, router]);

  useEffect(() => {
    if (isEditMode) return;
    setForm(EMPTY_FORM);
    setDetailLoading(false);
    setError(null);
    setGeoStatus(null);
    setImageStatus(null);
  }, [isEditMode, resolvedServiceKey]);

  const handleOwnerAccessRedirect = useCallback(
    async (
      rawMessage: string,
      payload?: ApiEnvelope<unknown>,
    ): Promise<boolean> => {
      if (!resolvedServiceKey) return false;

      if (rawMessage === "PROFILE_REQUIRED") {
        await router.replace(
          buildProfileUrl(resolvedServiceKey, currentPagePath, locale),
        );
        return true;
      }

      if (
        rawMessage === "PHONE_VERIFICATION_REQUIRED" ||
        rawMessage === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
      ) {
        await router.replace(
          buildProfileUrl(resolvedServiceKey, currentPagePath, locale),
        );
        return true;
      }

      if (rawMessage === "SERVICE_SELECTION_REQUIRED") {
        await router.replace(buildServiceSelectUrl(currentPagePath, locale));
        return true;
      }

      if (rawMessage === "SUBSCRIPTION_REQUIRED") {
        const redirectUrl = String(payload?.redirectUrl || "").trim();

        if (redirectUrl) {
          if (isAbsoluteUrl(redirectUrl)) {
            window.location.assign(redirectUrl);
            return true;
          }

          await router.replace(withLocaleOnRelativeUrl(redirectUrl, locale));
          return true;
        }

        await router.replace(buildBillingUrl(resolvedServiceKey, locale));
        return true;
      }

      return false;
    },
    [resolvedServiceKey, router, currentPagePath, locale],
  );

  useEffect(() => {
    if (!serviceReady) return;
    if (!isEditMode) return;
    if (!resolvedServiceKey) return;

    if (!propertyId) {
      setError(text.editPropertyMissing);
      setForm(EMPTY_FORM);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        setDetailLoading(true);
        setError(null);
        setGeoStatus(null);
        setImageStatus(null);

        const qs = new URLSearchParams();
        qs.set("serviceKey", resolvedServiceKey);

        const storedPhone = getPhoneFromStorage();
        if (storedPhone) {
          qs.set("phone", storedPhone);
        }

        const url = `${API_BASE}/owner/properties/${encodeURIComponent(propertyId)}?${qs.toString()}`;

        const res = await fetchWithTimeout(url, {
          method: "GET",
          headers: buildOwnerHeaders(),
        });

        const data = await readJsonResponse<ApiEnvelope<PropertyApiItem>>(res);
        const message = String(data.message || data.error || "").trim();

        if (!res.ok || !data.ok) {
          if (!cancelled) {
            const redirected = await handleOwnerAccessRedirect(message, data);
            if (redirected) return;
          }

          throw new Error(message || `HTTP ${res.status}`);
        }

        const item = data.item ?? null;
        if (!item || !item.id) {
          throw new Error("PROPERTY_NOT_FOUND");
        }

        if (!cancelled) {
          const itemServiceKey = safeServiceKey(item.serviceKey);
          if (itemServiceKey && itemServiceKey !== resolvedServiceKey) {
            writeServiceKeyToStorage(itemServiceKey);
            setServiceKey(itemServiceKey);
          }

          setForm(mapItemToForm(item));
        }
      } catch (err: unknown) {
        if (cancelled) return;

        if (isAbortError(err)) {
          setError(text.errorTimeout);
        } else {
          setError(mapPropertyError(getErrorMessage(err, "Load error"), text));
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    serviceReady,
    isEditMode,
    resolvedServiceKey,
    propertyId,
    handleOwnerAccessRedirect,
    text,
  ]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateDigits<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: digitsOnly(value) as FormState[K] }));
  }

  function removeImage(index: number) {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  }

  function openImagePicker() {
    if (imageUploading || submitting || detailLoading) return;
    imageInputRef.current?.click();
  }

  function clearCoordinates() {
    setForm((prev) => ({
      ...prev,
      locationLat: "",
      locationLng: "",
      locationPlaceId: "",
      locationSource: "MANUAL",
    }));
    setError(null);
    setGeoStatus(text.coordinatesCleared);
  }

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        String(lat),
      )}&lon=${encodeURIComponent(String(lng))}&zoom=18&addressdetails=1`;

      const res = await fetchWithTimeout(
        url,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Accept-Language": locale === "az" ? "az,en" : locale,
          },
        },
        REVERSE_GEOCODE_TIMEOUT_MS,
      );

      if (!res.ok) return "";

      const data = await readJsonResponse<{
        display_name?: string;
        name?: string;
      }>(res);

      return String(data.display_name || data.name || "").trim();
    } catch {
      return "";
    }
  }

  async function handleUseCurrentLocation() {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      setError(text.errorEnvironmentNoGeo);
      return;
    }

    if (!navigator.geolocation) {
      setError(text.errorGeoUnsupported);
      return;
    }

    if (!isBrowserSecureForGeolocation()) {
      setError(text.errorGeoNotSecure);
      return;
    }

    setGeoLoading(true);
    setError(null);
    setGeoStatus(text.locationPermissionCheck);

    try {
      const permission = await getGeolocationPermissionStatus();

      if (permission === "denied") {
        setError(text.errorGeoPermissionDenied);
        setGeoStatus(null);
        return;
      }

      if (permission === "prompt") {
        setGeoStatus(text.locationPermissionPrompt);
      } else if (permission === "granted") {
        setGeoStatus(text.locationGrantedLoading);
      } else {
        setGeoStatus(text.locationUnknownLoading);
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 0,
          });
        },
      );

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setGeoStatus(text.coordinatesReceived);

      const address = await reverseGeocode(lat, lng);
      const fallbackLabel = buildReverseGeocodeLabel(lat, lng, text);

      setForm((prev) => ({
        ...prev,
        locationSource: "CURRENT_DEVICE",
        locationLat: String(lat),
        locationLng: String(lng),
        locationPlaceId: "",
        location: address || fallbackLabel,
      }));

      setGeoStatus(
        address ? text.currentLocationAdded : text.currentLocationFallbackAdded,
      );
    } catch (err: unknown) {
      setGeoStatus(null);
      setError(
        geolocationErrorMessage(
          isGeolocationPositionError(err) ? err : null,
          text,
        ),
      );
    } finally {
      setGeoLoading(false);
    }
  }

  async function uploadSingleImage(file: File): Promise<string> {
    const endpoints = [
      `${API_BASE}/owner/media/upload`,
      `${API_BASE}/media/upload`,
    ];

    let lastError: string = text.errorGeneric;

    for (const endpoint of endpoints) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", "property-image");

        if (resolvedServiceKey) {
          formData.append("serviceKey", resolvedServiceKey);
        }

        const res = await fetchWithTimeout(`${endpoint}?kind=property-image`, {
          method: "POST",
          headers: buildOwnerHeaders(),
          body: formData,
        });

        const data = await readJsonResponse<ApiEnvelope>(res);
        const uploadUrl = getUploadUrlFromPayload(data);
        const message = String(data.message || data.error || "").trim();

        if (!res.ok || !data.ok) {
          lastError = mapPropertyError(message || `HTTP ${res.status}`, text);
          continue;
        }

        if (!uploadUrl) {
          lastError = text.errorUploadNoPath;
          continue;
        }

        return uploadUrl;
      } catch (err: unknown) {
        if (isAbortError(err)) {
          lastError = text.errorTimeout;
        } else {
          lastError = mapPropertyError(
            getErrorMessage(err, text.errorGeneric),
            text,
          );
        }
      }
    }

    throw new Error(lastError);
  }

  async function handleImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    setError(null);
    setImageStatus(null);

    const currentCount = normalizedImageUrls.length;
    const remaining = MAX_PROPERTY_IMAGES - currentCount;

    if (remaining <= 0) {
      setError(text.errorMaxImages);
      return;
    }

    const selected = files.slice(0, remaining);

    for (const file of selected) {
      if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
        setError(text.errorInvalidImageType);
        return;
      }

      if (file.size > MAX_UPLOAD_FILE_BYTES) {
        setError(text.errorFileTooLarge);
        return;
      }
    }

    setImageUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of selected) {
        const uploadedUrl = await uploadSingleImage(file);
        uploadedUrls.push(uploadedUrl);
      }

      setForm((prev) => {
        const next = normalizeImageList([...prev.imageUrls, ...uploadedUrls]);
        return {
          ...prev,
          imageUrls: next,
        };
      });

      setFailedPreviewMap((prev) => {
        const next = { ...prev };
        for (const url of uploadedUrls) {
          delete next[url];
        }
        return next;
      });

      setImageStatus(
        uploadedUrls.length === 1
          ? text.imageAddedSingle
          : `${uploadedUrls.length} ${text.imageAddedPluralSuffix}`,
      );
    } catch (err: unknown) {
      setError(mapPropertyError(getErrorMessage(err, text.errorGeneric), text));
    } finally {
      setImageUploading(false);
    }
  }

  function validate(): string | null {
    if (!resolvedServiceKey) return text.errorServiceRequired;
    if (isEditMode && !propertyId) return text.errorPropertyIdRequired;
    if (!resolvedOwnerPhone) {
      return text.ownerPhoneMissing;
    }

    const title = form.title.trim();
    const city = form.city.trim();
    const areaName = form.areaName.trim();
    const location = form.location.trim();
    const rulesText = form.rulesText.trim();
    const locationPlaceId = form.locationPlaceId.trim();

    if (!title) return text.errorTitleRequired;
    if (title.length > MAX_TITLE_LENGTH) {
      return formatMaxLengthMessage(text.titleLabel, MAX_TITLE_LENGTH, locale);
    }

    if (!form.roomCount.trim()) return text.errorRoomCountInvalid;

    if (!city) return text.errorCityRequired;
    if (city.length > MAX_CITY_LENGTH) {
      return formatMaxLengthMessage(text.cityLabel, MAX_CITY_LENGTH, locale);
    }

    if (!areaName) return text.errorAreaRequired;
    if (areaName.length > MAX_AREA_NAME_LENGTH) {
      return formatMaxLengthMessage(
        text.areaNameLabel,
        MAX_AREA_NAME_LENGTH,
        locale,
      );
    }

    if (!location) return text.errorLocationRequired;
    if (location.length > MAX_LOCATION_LENGTH) {
      return formatMaxLengthMessage(
        text.locationLabel,
        MAX_LOCATION_LENGTH,
        locale,
      );
    }

    if (locationPlaceId.length > MAX_LOCATION_PLACE_ID_LENGTH) {
      return formatLocationPlaceIdMaxLength(locale, MAX_LOCATION_PLACE_ID_LENGTH);
    }

    if (!rulesText) return text.errorRulesRequired;
    if (rulesText.length > MAX_RULES_TEXT_LENGTH) {
      return formatMaxLengthMessage(
        text.rulesLabel,
        MAX_RULES_TEXT_LENGTH,
        locale,
      );
    }

    const roomCount = Number(form.roomCount);
    if (!Number.isInteger(roomCount) || roomCount <= 0) {
      return text.errorRoomCountInvalid;
    }

    const priceValues = [
      normalizePositiveNumber(form.priceHour),
      normalizePositiveNumber(form.priceDay),
      normalizePositiveNumber(form.priceWeek),
      normalizePositiveNumber(form.priceMonth),
      normalizePositiveNumber(form.priceYear),
    ];

    if (priceValues.every((value) => value === null)) {
      return text.errorAtLeastOnePrice;
    }

    const images = normalizeImageList(form.imageUrls);
    if (images.length < 1) {
      return text.errorAtLeastOneImage;
    }
    if (images.length > MAX_PROPERTY_IMAGES) {
      return text.errorMaxImages;
    }

    const lat = parseCoordinate(form.locationLat);
    const lng = parseCoordinate(form.locationLng);
    const hasLat = lat !== null;
    const hasLng = lng !== null;

    if (hasLat !== hasLng) {
      return text.errorLatLngTogether;
    }

    if (hasLat && (lat < -90 || lat > 90)) {
      return text.errorLatRange;
    }

    if (hasLng && (lng < -180 || lng > 180)) {
      return text.errorLngRange;
    }

    if (
      (form.locationSource === "CURRENT_DEVICE" ||
        form.locationSource === "MAP_PICKER") &&
      (!hasLat || !hasLng)
    ) {
      return text.errorCoordinatesRequired;
    }

    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setGeoStatus(null);
    setImageStatus(null);
    setSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        roomCount: Number(form.roomCount),
        city: form.city.trim(),
        areaName: form.areaName.trim(),
        location: form.location.trim(),
        locationPlaceId: form.locationPlaceId.trim() || null,
        locationLat: parseCoordinate(form.locationLat),
        locationLng: parseCoordinate(form.locationLng),
        locationSource: form.locationSource,
        rulesText: form.rulesText.trim(),
        serviceKey: resolvedServiceKey,
        phone: resolvedOwnerPhone,
        priceHour: normalizePositiveNumber(form.priceHour),
        priceDay: normalizePositiveNumber(form.priceDay),
        priceWeek: normalizePositiveNumber(form.priceWeek),
        priceMonth: normalizePositiveNumber(form.priceMonth),
        priceYear: normalizePositiveNumber(form.priceYear),
        imageUrls: normalizeImageList(form.imageUrls),
      };

      const isEditing = isEditMode && !!propertyId;
      const qs = new URLSearchParams();
      qs.set("serviceKey", resolvedServiceKey);

      const url = isEditing
        ? `${API_BASE}/owner/properties/${encodeURIComponent(propertyId)}?${qs.toString()}`
        : `${API_BASE}/owner/properties/create?${qs.toString()}`;

      const res = await fetchWithTimeout(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildOwnerHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await readJsonResponse<ApiEnvelope>(res);
      const message = String(
        data.message || data.error || `HTTP ${res.status}`,
      ).trim();

      if (!res.ok || !data.ok) {
        const redirected = await handleOwnerAccessRedirect(message, data);
        if (redirected) return;

        setError(mapPropertyError(message, text));
        return;
      }

      writePhoneToStorage(resolvedOwnerPhone);
      writeServiceKeyToStorage(resolvedServiceKey);
      await router.push(buildPropertiesUrl(resolvedServiceKey, locale));
    } catch (err: unknown) {
      if (isAbortError(err)) {
        setError(text.errorTimeout);
      } else {
        setError(mapPropertyError(getErrorMessage(err, "Submit error"), text));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!localeReady || !serviceReady) {
    return (
      <div style={pageStyle}>
        <div style={heroCardStyle}>
          <div style={shellStyle}>
            <div style={heroInnerStyle}>
              <div style={heroBadgeStyle}>{pageBadge}</div>
              <h1 style={titleStyle}>{pageTitle}</h1>
              <p style={subtitleStyle}>{text.checkingServiceContext}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!resolvedServiceKey) return null;

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        <div style={heroCardStyle}>
          <div style={heroInnerStyle}>
            <div style={heroBadgeStyle}>{pageBadge}</div>
            <h1 style={titleStyle}>{pageTitle}</h1>
            <p style={subtitleStyle}>
              {isEditMode ? text.editSubtitle : text.createSubtitle}
            </p>

            <div style={heroMetaStackStyle}>
              <div style={serviceCardStyle}>
                <div style={metaLabelStyle}>{text.selectedService}</div>
                <div style={serviceTitleStyle}>{displayServiceName}</div>
                <div style={serviceKeyStyle}>{resolvedServiceKey}</div>
              </div>

              <div style={heroActionsStyle}>
                <Link href={dashboardHref} style={secondaryButtonStyle}>
                  {text.backToDashboard}
                </Link>

                <Link href={propertiesHref} style={secondaryButtonStyle}>
                  {text.myListings}
                </Link>

                <Link href={servicesHref} style={secondaryButtonStyle}>
                  {text.changeService}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionTitleStyle}>{text.basicInfo}</div>

          {!resolvedOwnerPhone ? (
            <div style={errorBoxStyle}>
              {text.ownerPhoneMissing}{" "}
              <Link href={profileHref} style={inlineLinkStyle}>
                {text.goToProfile}
              </Link>
            </div>
          ) : null}

          {isEditMode && !propertyId ? (
            <div style={errorBoxStyle}>
              {text.editPropertyMissing}{" "}
              <Link href={propertiesHref} style={inlineLinkStyle}>
                {text.backToListings}
              </Link>
            </div>
          ) : null}

          {detailLoading ? (
            <div style={noteBoxStyle}>{text.loadingDetails}</div>
          ) : null}
          {geoStatus ? <div style={okBoxStyle}>✅ {geoStatus}</div> : null}
          {imageStatus ? <div style={okBoxStyle}>✅ {imageStatus}</div> : null}

          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={groupGridStyle}>
              <Input
                label={text.titleLabel}
                value={form.title}
                onChange={(v) => update("title", v)}
                disabled={detailLoading || submitting || imageUploading}
              />

              <NumericInput
                label={text.roomCountLabel}
                value={form.roomCount}
                onChange={(v) => updateDigits("roomCount", v)}
                disabled={detailLoading || submitting || imageUploading}
              />

              <Input
                label={text.cityLabel}
                value={form.city}
                onChange={(v) => update("city", v)}
                disabled={detailLoading || submitting || imageUploading}
              />

              <Input
                label={text.areaNameLabel}
                value={form.areaName}
                onChange={(v) => update("areaName", v)}
                disabled={detailLoading || submitting || imageUploading}
              />
            </div>

            <div style={sectionDividerStyle} />

            <div style={sectionTitleStyle}>{text.locationSection}</div>

            <div style={locationSourceCardStyle}>
              <div style={metaLabelStyle}>{text.locationSource}</div>
              <div style={locationSourceValueStyle}>
                {humanizeLocationSource(form.locationSource, text)}
              </div>
            </div>

            <Input
              label={text.locationLabel}
              value={form.location}
              onChange={(v) => update("location", v)}
              disabled={detailLoading || submitting || imageUploading}
              placeholder={text.locationPlaceholder}
            />

            <div style={actionsRowStyle}>
              <button
                type="button"
                onClick={() => void handleUseCurrentLocation()}
                disabled={
                  detailLoading || submitting || geoLoading || imageUploading
                }
                style={{
                  ...secondaryButtonAsButtonStyle,
                  ...(detailLoading ||
                  submitting ||
                  geoLoading ||
                  imageUploading
                    ? disabledButtonStyle
                    : {}),
                }}
              >
                {geoLoading ? text.gettingLocation : text.addCurrentLocation}
              </button>

              <button
                type="button"
                onClick={clearCoordinates}
                disabled={
                  detailLoading || submitting || geoLoading || imageUploading
                }
                style={{
                  ...secondaryButtonAsButtonStyle,
                  ...(detailLoading ||
                  submitting ||
                  geoLoading ||
                  imageUploading
                    ? disabledButtonStyle
                    : {}),
                }}
              >
                {text.clearCoordinates}
              </button>
            </div>

            <div style={noteBoxStyle}>{text.geolocationNote}</div>

            <div style={sectionDividerStyle} />

            <div style={sectionTitleStyle}>{text.rulesSection}</div>

            <TextArea
              label={text.rulesLabel}
              value={form.rulesText}
              onChange={(v) => update("rulesText", v)}
              disabled={detailLoading || submitting || imageUploading}
            />

            <div style={sectionDividerStyle} />

            <div style={sectionTitleStyle}>{text.imagesSection}</div>

            <div style={imageMetaRowStyle}>
              <div style={noteTextStyle}>{text.imageSectionInfo}</div>
              <div style={imageCountPillStyle}>
                {normalizedImageUrls.length}/{MAX_PROPERTY_IMAGES}
              </div>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) => void handleImageFileChange(e)}
            />

            <div style={actionsRowStyle}>
              <button
                type="button"
                onClick={openImagePicker}
                disabled={
                  detailLoading ||
                  submitting ||
                  imageUploading ||
                  normalizedImageUrls.length >= MAX_PROPERTY_IMAGES
                }
                style={{
                  ...secondaryButtonAsButtonStyle,
                  ...(detailLoading ||
                  submitting ||
                  imageUploading ||
                  normalizedImageUrls.length >= MAX_PROPERTY_IMAGES
                    ? disabledButtonStyle
                    : {}),
                }}
              >
                {imageUploading ? text.imagesUploading : text.addImage}
              </button>
            </div>

            {normalizedImageUrls.length === 0 ? (
              <div style={imagePlaceholderStyle}>{text.noImages}</div>
            ) : (
              <div style={uploadedGridStyle}>
                {previewImages.map(({ rawUrl, previewUrl }, index) => (
                  <div key={`${rawUrl}-${index}`} style={uploadedCardStyle}>
                    {failedPreviewMap[rawUrl] || !previewUrl ? (
                      <div style={imageBrokenStyle}>
                        {text.previewUnavailable}
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt={`${text.imageLabel} ${index + 1}`}
                        style={uploadedImageStyle}
                        onError={() =>
                          setFailedPreviewMap((prev) => ({
                            ...prev,
                            [rawUrl]: true,
                          }))
                        }
                      />
                    )}

                    <div style={uploadedCardFooterStyle}>
                      <div style={uploadedCardMetaStyle}>
                        {text.imageLabel} {index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={detailLoading || submitting || imageUploading}
                        style={{
                          ...dangerButtonStyle,
                          ...(detailLoading || submitting || imageUploading
                            ? disabledButtonStyle
                            : {}),
                        }}
                      >
                        {text.deleteButton}
                      </button>
                    </div>

                    <div style={uploadedUrlStyle}>{rawUrl}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={noteBoxStyle}>{text.imageStorageNote}</div>

            <div style={sectionDividerStyle} />

            <div style={sectionTitleStyle}>{text.pricesSection}</div>

            <div style={priceGridStyle}>
              <NumericInput
                label={text.priceHourLabel}
                value={form.priceHour}
                onChange={(v) => updateDigits("priceHour", v)}
                disabled={detailLoading || submitting || imageUploading}
              />

              <NumericInput
                label={text.priceDayLabel}
                value={form.priceDay}
                onChange={(v) => updateDigits("priceDay", v)}
                disabled={detailLoading || submitting || imageUploading}
              />

              <NumericInput
                label={text.priceWeekLabel}
                value={form.priceWeek}
                onChange={(v) => updateDigits("priceWeek", v)}
                disabled={detailLoading || submitting || imageUploading}
              />

              <NumericInput
                label={text.priceMonthLabel}
                value={form.priceMonth}
                onChange={(v) => updateDigits("priceMonth", v)}
                disabled={detailLoading || submitting || imageUploading}
              />

              <NumericInput
                label={text.priceYearLabel}
                value={form.priceYear}
                onChange={(v) => updateDigits("priceYear", v)}
                disabled={detailLoading || submitting || imageUploading}
              />
            </div>

            <div style={noteBoxStyle}>{text.pricingNote}</div>

            {error ? <div style={errorBoxStyle}>❌ {error}</div> : null}

            <div style={submitPanelStyle}>
              <div style={actionsRowStyle}>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    detailLoading ||
                    imageUploading ||
                    !resolvedOwnerPhone ||
                    (isEditMode && !propertyId)
                  }
                  style={{
                    ...primaryButtonStyle,
                    ...(submitting ||
                    detailLoading ||
                    imageUploading ||
                    !resolvedOwnerPhone ||
                    (isEditMode && !propertyId)
                      ? disabledButtonStyle
                      : {}),
                  }}
                >
                  {submitting
                    ? isEditMode
                      ? text.updating
                      : text.creating
                    : submitLabel}
                </button>

                <Link href={billingHref} style={secondaryButtonStyle}>
                  {text.viewSubscription}
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          ...inputStyle,
          ...(disabled ? disabledInputStyle : {}),
        }}
      />
    </label>
  );
}

function NumericInput({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        pattern="[0-9]*"
        disabled={disabled}
        style={{
          ...inputStyle,
          ...(disabled ? disabledInputStyle : {}),
        }}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
        style={{
          ...textAreaStyle,
          ...(disabled ? disabledInputStyle : {}),
        }}
      />
    </label>
  );
}

const pageStyle: CSSProperties = {
  width: "100%",
  minHeight: "100dvh",
  margin: 0,
  padding: "0 0 40px",
  overflowX: "clip",
  background: `
    radial-gradient(circle at top left, rgba(177, 209, 88, 0.18) 0%, transparent 22%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10) 0%, transparent 22%),
    radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.08) 0%, transparent 20%),
    linear-gradient(180deg, #eef2ea 0%, #e9eee7 52%, #e6ece4 100%)
  `,
};

const shellStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1280,
  margin: "0 auto",
  padding: "0 clamp(14px, 4vw, 28px)",
  display: "grid",
  gap: 14,
  boxSizing: "border-box",
};

const heroCardStyle: CSSProperties = {
  position: "relative",
  width: "100vw",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  padding: "26px 0 22px",
  background: `
    radial-gradient(circle at 12% 18%, rgba(166, 214, 94, 0.18) 0%, transparent 22%),
    radial-gradient(circle at 88% 14%, rgba(59, 130, 246, 0.16) 0%, transparent 24%),
    linear-gradient(180deg, #f2f5ef 0%, #edf2ec 100%)
  `,
  borderTop: "1px solid rgba(15, 23, 42, 0.08)",
  borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.34), 0 18px 36px rgba(15, 23, 42, 0.05)",
  overflow: "hidden",
  boxSizing: "border-box",
};

const heroInnerStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1280,
  margin: "0 auto",
  padding: "0 clamp(14px, 4vw, 28px)",
  boxSizing: "border-box",
  display: "grid",
  gap: 0,
};

const heroBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "fit-content",
  minHeight: 32,
  padding: "0 12px",
  borderRadius: 999,
  background: "#0f172a",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "14px 0 0 0",
  fontSize: "clamp(30px, 5.2vw, 44px)",
  lineHeight: 1.04,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.035em",
  maxWidth: "none",
  textWrap: "balance",
};

const subtitleStyle: CSSProperties = {
  margin: "14px 0 0 0",
  fontSize: "clamp(14px, 2.2vw, 16px)",
  lineHeight: 1.78,
  color: "#475569",
  maxWidth: "none",
};

const heroMetaStackStyle: CSSProperties = {
  marginTop: 18,
  display: "grid",
  gap: 14,
};

const serviceCardStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  borderRadius: 24,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  padding: "clamp(16px, 3vw, 22px)",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const metaLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const serviceTitleStyle: CSSProperties = {
  marginTop: 10,
  fontSize: "clamp(22px, 4vw, 28px)",
  lineHeight: 1.15,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.03em",
  minWidth: 0,
  wordBreak: "break-word",
};

const serviceKeyStyle: CSSProperties = {
  marginTop: 8,
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.7,
  wordBreak: "break-word",
};

const heroActionsStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  alignItems: "stretch",
};

const cardStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  background: `
    radial-gradient(circle at top right, rgba(163, 230, 53, 0.08), transparent 22%),
    radial-gradient(circle at bottom left, rgba(37, 99, 235, 0.08), transparent 24%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 24,
  padding: "clamp(16px, 3.4vw, 28px)",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  overflow: "hidden",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "clamp(18px, 2.6vw, 20px)",
  lineHeight: 1.2,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const formStyle: CSSProperties = {
  marginTop: 18,
  display: "grid",
  gap: 18,
};

const groupGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const priceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  minWidth: 0,
};

const fieldLabelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: "#334155",
  lineHeight: 1.4,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: 52,
  padding: "14px 15px",
  borderRadius: 14,
  border: "1px solid rgba(15, 23, 42, 0.10)",
  background: "#ffffff",
  fontSize: 14,
  lineHeight: 1.5,
  outline: "none",
  color: "#0f172a",
  boxSizing: "border-box",
  boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.03)",
};

const textAreaStyle: CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: 140,
  fontFamily: "inherit",
};

const disabledInputStyle: CSSProperties = {
  opacity: 0.7,
  cursor: "not-allowed",
  background: "#f8fafc",
};

const sectionDividerStyle: CSSProperties = {
  margin: "2px 0",
  height: 1,
  background: "rgba(15, 23, 42, 0.08)",
};

const noteBoxStyle: CSSProperties = {
  padding: "14px 15px",
  borderRadius: 16,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.8,
};

const noteTextStyle: CSSProperties = {
  flex: "1 1 260px",
  minWidth: 0,
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.72,
};

const errorBoxStyle: CSSProperties = {
  padding: "14px 15px",
  border: "1px solid rgba(239, 68, 68, 0.24)",
  background: "linear-gradient(180deg, #fffafa 0%, #fef2f2 100%)",
  color: "#991b1b",
  borderRadius: 16,
  fontWeight: 700,
  lineHeight: 1.65,
  wordBreak: "break-word",
};

const okBoxStyle: CSSProperties = {
  padding: "14px 15px",
  border: "1px solid rgba(34, 197, 94, 0.24)",
  background: "linear-gradient(180deg, #f8fff9 0%, #edfdf2 100%)",
  color: "#166534",
  borderRadius: 16,
  fontWeight: 700,
  lineHeight: 1.65,
  wordBreak: "break-word",
};

const actionsRowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "stretch",
  width: "100%",
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "1 1 240px",
  minHeight: 50,
  minWidth: 0,
  width: "100%",
  padding: "12px 18px",
  borderRadius: 15,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: 14,
  lineHeight: 1.35,
  textAlign: "center",
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.14)",
};

const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minWidth: 0,
  minHeight: 50,
  padding: "12px 18px",
  borderRadius: 15,
  border: "1px solid rgba(15, 23, 42, 0.10)",
  background: "#ffffff",
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 14,
  lineHeight: 1.35,
  textAlign: "center",
  whiteSpace: "normal",
  wordBreak: "break-word",
  boxSizing: "border-box",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
};

const secondaryButtonAsButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 42,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(239, 68, 68, 0.24)",
  background: "linear-gradient(180deg, #fffafa 0%, #fef2f2 100%)",
  color: "#991b1b",
  fontWeight: 800,
  cursor: "pointer",
  flexShrink: 0,
  whiteSpace: "nowrap",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.7,
  cursor: "not-allowed",
};

const inlineLinkStyle: CSSProperties = {
  color: "#991b1b",
  fontWeight: 800,
  textDecoration: "underline",
};

const locationSourceCardStyle: CSSProperties = {
  padding: "15px 16px",
  borderRadius: 16,
  border: "1px solid rgba(59, 130, 246, 0.18)",
  background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
};

const locationSourceValueStyle: CSSProperties = {
  marginTop: 6,
  color: "#1d4ed8",
  fontWeight: 800,
  fontSize: 15,
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const imageMetaRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const imageCountPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "flex-start",
  minHeight: 30,
  padding: "0 11px",
  borderRadius: 999,
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.10)",
  fontSize: 12,
  fontWeight: 800,
  color: "#0f172a",
  boxShadow: "0 6px 14px rgba(15, 23, 42, 0.05)",
  flexShrink: 0,
};

const imagePlaceholderStyle: CSSProperties = {
  padding: "16px 15px",
  borderRadius: 16,
  border: "1px dashed rgba(15, 23, 42, 0.18)",
  background: "rgba(255,255,255,0.72)",
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.75,
};

const uploadedGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: 14,
};

const uploadedCardStyle: CSSProperties = {
  borderRadius: 20,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  padding: 14,
  display: "grid",
  gap: 12,
  minWidth: 0,
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
};

const uploadedImageStyle: CSSProperties = {
  width: "100%",
  height: "clamp(180px, 34vw, 220px)",
  objectFit: "cover",
  borderRadius: 14,
  border: "1px solid rgba(15, 23, 42, 0.10)",
  background: "#ffffff",
};

const imageBrokenStyle: CSSProperties = {
  width: "100%",
  height: "clamp(180px, 34vw, 220px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: 12,
  borderRadius: 14,
  border: "1px dashed rgba(15, 23, 42, 0.18)",
  background: "#ffffff",
  color: "#64748b",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.6,
};

const uploadedCardFooterStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const uploadedCardMetaStyle: CSSProperties = {
  flex: "1 1 140px",
  minWidth: 0,
  fontSize: 13,
  fontWeight: 800,
  color: "#0f172a",
  lineHeight: 1.5,
};

const uploadedUrlStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  lineHeight: 1.65,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

const submitPanelStyle: CSSProperties = {
  position: "sticky",
  bottom: 12,
  zIndex: 3,
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "rgba(255, 255, 255, 0.88)",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
  backdropFilter: "blur(14px)",
};