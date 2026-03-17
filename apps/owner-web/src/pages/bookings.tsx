import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "http://127.0.0.1:3001"
  ).trim();
}

const REQUEST_TIMEOUT_MS = 15000;
const REQUEST_TIMEOUT_ERROR = "__REQUEST_TIMEOUT__";
const HISTORY_STATUSES = ["APPROVED", "REJECTED", "EXPIRED"] as const;

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

const OWNER_EMAIL_STORAGE_KEYS = [
  "ownerEmail",
  "profileOwnerEmail",
] as const;

const LOCALE_STORAGE_KEYS = [
  "ownerWebLocale",
  "appLocale",
  "locale",
  "language",
] as const;

const SERVICES_ROUTE = "/services";
const PAGE_ROUTE = "/bookings";

type Locale = "az" | "en" | "ru" | "zh";
type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

type BookingRow = {
  id: string;
  status: string;
  rentalType: string;
  startAt: string;
  endAt: string;
  totalPrice: number;
  expiresAt: string | null;
  property: {
    id: string;
    title: string | null;
    city: string | null;
    areaName: string | null;
    roomCount: number | null;
  };
};

type HistoryStats = {
  total: number;
  approved: number;
  rejected: number;
  expired: number;
};

type HistoryMonthGroup = {
  monthKey: string;
  monthDate: Date;
  monthLabel: string;
  shortMonthLabel: string;
  title: string;
  subtitle: string;
  items: BookingRow[];
  stats: HistoryStats;
  isCurrentMonth: boolean;
};

type BookingsApiResponse = {
  ok?: boolean;
  items?: BookingRow[];
  message?: string;
  error?: string;
  redirectUrl?: string;
};

type UiText = {
  panelBadge: string;
  pageTitle: string;
  pageSubtitle: string;
  loadingContext: string;
  selectedServiceLabel: string;
  backToDashboard: string;
  changeService: string;
  refresh: string;
  refreshing: string;
  pendingFilter: string;
  successPrefix: string;
  errorPrefix: string;
  loadingRequests: string;
  noPendingTitle: string;
  noPendingSubtitle: string;
  approve: string;
  reject: string;
  approvingBlockedExpired: string;
  requestApproved: string;
  requestRejected: string;
  monthlyHistoryEyebrow: string;
  archiveHistoryEyebrow: string;
  currentMonthHistoryTitle: string;
  monthlyHistoryOpen: string;
  monthlyHistoryBack: string;
  monthlyHistoryIntroTitle: string;
  monthlyHistoryIntroSubtitle: string;
  monthlyHistoryNote: string;
  expandMonthCard: string;
  collapseMonthCard: string;
  monthHistoryLoading: string;
  olderMonthsAvailableSuffix: string;
  olderMonthsSingle: string;
  totalLabel: string;
  approvedLabel: string;
  rejectedLabel: string;
  expiredLabel: string;
  rentalTypeLabel: string;
  statusLabel: string;
  startDateLabel: string;
  endDateLabel: string;
  answerDeadlineLabel: string;
  expiredInline: string;
  unknownListing: string;
  currentMonthEmptyHistory: string;
  monthEmptyHistory: string;
  billingPageLink: string;
  serviceFallback: string;
  roomUnit: string;
  locationFallback: string;
  loadingError: string;
  profileRequired: string;
  phoneVerificationRequired: string;
  serviceSelectionRequired: string;
  subscriptionRequired: string;
  serviceNotFoundOrInactive: string;
  bookingNotFound: string;
  bookingAlreadyProcessed: string;
  bookingExpired: string;
  internalError: string;
  loadTimeout: string;
  actionTimeout: string;
  rentalHourly: string;
  rentalDaily: string;
  rentalWeekly: string;
  rentalMonthly: string;
  statusPending: string;
  statusApproved: string;
  statusRejected: string;
  statusExpired: string;
  statusUnknown: string;
  serviceRentHome: string;
  serviceBarber: string;
  serviceCarRental: string;
  serviceHotel: string;
  serviceBeautySalon: string;
  serviceBabysitter: string;
  serviceCleaning: string;
  serviceTechnicalServices: string;
  serviceSoberDriver: string;
};

const MONTH_NAMES: Record<Locale, readonly string[]> = {
  az: [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "İyun",
    "İyul",
    "Avqust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  ru: [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ],
  zh: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
};

const UI_TEXT: Record<Locale, UiText> = {
  az: {
    panelBadge: "Sahibkar paneli",
    pageTitle: "Rezervasiya sorğuları",
    pageSubtitle:
      "Seçilmiş xidmət üzrə gözləyən rezervasiya sorğularını buradan idarə edə bilərsiniz.",
    loadingContext: "Xidmət konteksti yoxlanılır...",
    selectedServiceLabel: "Seçilmiş xidmət",
    backToDashboard: "İdarəetmə panelinə qayıt",
    changeService: "Xidməti dəyiş",
    refresh: "Yenilə",
    refreshing: "Yenilənir...",
    pendingFilter: "Filtr: Gözləmədə",
    successPrefix: "Uğurlu əməliyyat:",
    errorPrefix: "Xəta:",
    loadingRequests: "Sorğular yüklənir...",
    noPendingTitle: "Hazırda gözləyən sorğu yoxdur",
    noPendingSubtitle: "Yeni rezervasiya sorğusu daxil olduqda burada görünəcək.",
    approve: "Təsdiqlə",
    reject: "Rədd et",
    approvingBlockedExpired:
      "Müddəti başa çatmış rezervasiya sorğusu təsdiqlənə bilməz",
    requestApproved: "Rezervasiya sorğusu təsdiqləndi.",
    requestRejected: "Rezervasiya sorğusu rədd edildi.",
    monthlyHistoryEyebrow: "Aylıq tarixçə",
    archiveHistoryEyebrow: "Arxiv tarixçəsi",
    currentMonthHistoryTitle: "Cari ayın sorğu tarixçəsi",
    monthlyHistoryOpen: "Tarixçəyə daxil ol",
    monthlyHistoryBack: "← Geri qayıt",
    monthlyHistoryIntroTitle: "Aylıq sorğu tarixçəsi",
    monthlyHistoryIntroSubtitle:
      "Cari ay və əvvəlki aylar üzrə qəbul edilmiş, rədd edilmiş və müddəti başa çatmış sorğular aşağıdakı kartlarda saxlanılır.",
    monthlyHistoryNote:
      "Yeni ay başladıqda həmin ay üçün ayrıca kart avtomatik olaraq ən yuxarıda yaradılır. Əvvəlki ayların kartları isə tarix ardıcıllığı ilə aşağıda qalır.",
    expandMonthCard: "Kartı aç",
    collapseMonthCard: "Kartı bağla",
    monthHistoryLoading: "Tarixçə yüklənir...",
    olderMonthsAvailableSuffix: "əvvəlki ay kartı da mövcuddur.",
    olderMonthsSingle: "1 əvvəlki ay kartı da mövcuddur.",
    totalLabel: "Cəmi",
    approvedLabel: "Qəbul",
    rejectedLabel: "Rədd",
    expiredLabel: "Müddəti başa çatıb",
    rentalTypeLabel: "İcarə növü",
    statusLabel: "Vəziyyət",
    startDateLabel: "Başlanğıc tarixi",
    endDateLabel: "Bitiş tarixi",
    answerDeadlineLabel: "Cavab üçün son vaxt",
    expiredInline: "(müddəti başa çatıb)",
    unknownListing: "Elan",
    currentMonthEmptyHistory:
      "Cari ay üzrə qəbul edilmiş, rədd edilmiş və ya müddəti başa çatmış sorğu tarixçəsi yoxdur.",
    monthEmptyHistory:
      "Bu ay üzrə qəbul edilmiş, rədd edilmiş və ya müddəti başa çatmış sorğu tarixçəsi yoxdur.",
    billingPageLink: "Abunəlik səhifəsinə keç",
    serviceFallback: "Xidmət",
    roomUnit: "otaq",
    locationFallback: "Məlumat göstərilməyib",
    loadingError: "Rezervasiya sorğuları yüklənmədi.",
    profileRequired: "Əvvəlcə sahibkar profilini tamamlayın.",
    phoneVerificationRequired: "Telefon təsdiqi tamamlanmalıdır.",
    serviceSelectionRequired: "Əvvəlcə xidmət seçimi tamamlanmalıdır.",
    subscriptionRequired: "Bu xidmət üçün aktiv abunəlik tələb olunur.",
    serviceNotFoundOrInactive: "Xidmət tapılmadı və ya aktiv deyil.",
    bookingNotFound: "Rezervasiya sorğusu tapılmadı və ya artıq mövcud deyil.",
    bookingAlreadyProcessed: "Bu rezervasiya sorğusu artıq emal olunub.",
    bookingExpired:
      "Rezervasiya sorğusunun müddəti başa çatdığı üçün təsdiqlənə bilməz.",
    internalError:
      "Server xətası baş verdi. Zəhmət olmasa bir qədər sonra yenidən cəhd edin.",
    loadTimeout: "Sorğu vaxt aşımına düşdü. Backend cavab vermədi.",
    actionTimeout: "Əməliyyat vaxt aşımına düşdü. Backend cavab vermədi.",
    rentalHourly: "Saatlıq",
    rentalDaily: "Günlük",
    rentalWeekly: "Həftəlik",
    rentalMonthly: "Aylıq",
    statusPending: "Gözləmədə",
    statusApproved: "Qəbul edilib",
    statusRejected: "Rədd edilib",
    statusExpired: "Müddəti başa çatıb",
    statusUnknown: "Naməlum",
    serviceRentHome: "Ev icarəsi",
    serviceBarber: "Bərbər xidməti",
    serviceCarRental: "Avtomobil icarəsi",
    serviceHotel: "Otel xidməti",
    serviceBeautySalon: "Gözəllik salonu",
    serviceBabysitter: "Uşaq baxıcısı xidməti",
    serviceCleaning: "Təmizlik xidməti",
    serviceTechnicalServices: "Texniki xidmətlər",
    serviceSoberDriver: "Ayıq sürücü xidməti",
  },
  en: {
    panelBadge: "Owner panel",
    pageTitle: "Booking requests",
    pageSubtitle:
      "You can manage pending booking requests for the selected service from here.",
    loadingContext: "Checking service context...",
    selectedServiceLabel: "Selected service",
    backToDashboard: "Back to dashboard",
    changeService: "Change service",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    pendingFilter: "Filter: Pending",
    successPrefix: "Successful action:",
    errorPrefix: "Error:",
    loadingRequests: "Loading requests...",
    noPendingTitle: "There are no pending requests right now",
    noPendingSubtitle: "New booking requests will appear here when they arrive.",
    approve: "Approve",
    reject: "Reject",
    approvingBlockedExpired: "An expired booking request cannot be approved",
    requestApproved: "The booking request was approved.",
    requestRejected: "The booking request was rejected.",
    monthlyHistoryEyebrow: "Monthly history",
    archiveHistoryEyebrow: "Archive history",
    currentMonthHistoryTitle: "Current month request history",
    monthlyHistoryOpen: "Open history",
    monthlyHistoryBack: "← Go back",
    monthlyHistoryIntroTitle: "Monthly request history",
    monthlyHistoryIntroSubtitle:
      "Approved, rejected, and expired requests for the current month and previous months are stored in the cards below.",
    monthlyHistoryNote:
      "When a new month starts, a separate card for that month is created automatically at the top. Cards from previous months remain below in chronological order.",
    expandMonthCard: "Open card",
    collapseMonthCard: "Close card",
    monthHistoryLoading: "Loading history...",
    olderMonthsAvailableSuffix: "previous month cards are also available.",
    olderMonthsSingle: "1 previous month card is also available.",
    totalLabel: "Total",
    approvedLabel: "Approved",
    rejectedLabel: "Rejected",
    expiredLabel: "Expired",
    rentalTypeLabel: "Rental type",
    statusLabel: "Status",
    startDateLabel: "Start date",
    endDateLabel: "End date",
    answerDeadlineLabel: "Response deadline",
    expiredInline: "(expired)",
    unknownListing: "Listing",
    currentMonthEmptyHistory:
      "There is no approved, rejected, or expired request history for the current month.",
    monthEmptyHistory:
      "There is no approved, rejected, or expired request history for this month.",
    billingPageLink: "Go to subscription page",
    serviceFallback: "Service",
    roomUnit: "room",
    locationFallback: "Information not provided",
    loadingError: "Booking requests could not be loaded.",
    profileRequired: "Complete the owner profile first.",
    phoneVerificationRequired: "Phone verification must be completed.",
    serviceSelectionRequired: "Complete service selection first.",
    subscriptionRequired: "An active subscription is required for this service.",
    serviceNotFoundOrInactive: "The service was not found or is not active.",
    bookingNotFound: "The booking request was not found or no longer exists.",
    bookingAlreadyProcessed: "This booking request has already been processed.",
    bookingExpired:
      "The booking request cannot be approved because it has expired.",
    internalError: "A server error occurred. Please try again later.",
    loadTimeout: "The request timed out. The backend did not respond.",
    actionTimeout: "The action timed out. The backend did not respond.",
    rentalHourly: "Hourly",
    rentalDaily: "Daily",
    rentalWeekly: "Weekly",
    rentalMonthly: "Monthly",
    statusPending: "Pending",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    statusExpired: "Expired",
    statusUnknown: "Unknown",
    serviceRentHome: "Home rental",
    serviceBarber: "Barber service",
    serviceCarRental: "Car rental",
    serviceHotel: "Hotel service",
    serviceBeautySalon: "Beauty salon",
    serviceBabysitter: "Babysitter service",
    serviceCleaning: "Cleaning service",
    serviceTechnicalServices: "Technical services",
    serviceSoberDriver: "Sober driver service",
  },
  ru: {
    panelBadge: "Панель владельца",
    pageTitle: "Запросы на бронирование",
    pageSubtitle:
      "Здесь можно управлять ожидающими запросами на бронирование по выбранной услуге.",
    loadingContext: "Проверяется контекст услуги...",
    selectedServiceLabel: "Выбранная услуга",
    backToDashboard: "Вернуться в панель",
    changeService: "Изменить услугу",
    refresh: "Обновить",
    refreshing: "Обновляется...",
    pendingFilter: "Фильтр: В ожидании",
    successPrefix: "Успешное действие:",
    errorPrefix: "Ошибка:",
    loadingRequests: "Запросы загружаются...",
    noPendingTitle: "Сейчас нет ожидающих запросов",
    noPendingSubtitle:
      "Новые запросы на бронирование появятся здесь после поступления.",
    approve: "Подтвердить",
    reject: "Отклонить",
    approvingBlockedExpired:
      "Просроченный запрос на бронирование нельзя подтвердить",
    requestApproved: "Запрос на бронирование подтверждён.",
    requestRejected: "Запрос на бронирование отклонён.",
    monthlyHistoryEyebrow: "История по месяцам",
    archiveHistoryEyebrow: "Архивная история",
    currentMonthHistoryTitle: "История запросов за текущий месяц",
    monthlyHistoryOpen: "Открыть историю",
    monthlyHistoryBack: "← Назад",
    monthlyHistoryIntroTitle: "История запросов по месяцам",
    monthlyHistoryIntroSubtitle:
      "Подтверждённые, отклонённые и просроченные запросы за текущий и предыдущие месяцы сохраняются в карточках ниже.",
    monthlyHistoryNote:
      "Когда начинается новый месяц, отдельная карточка за этот месяц автоматически создаётся сверху. Карточки за предыдущие месяцы остаются ниже в хронологическом порядке.",
    expandMonthCard: "Открыть карточку",
    collapseMonthCard: "Закрыть карточку",
    monthHistoryLoading: "История загружается...",
    olderMonthsAvailableSuffix: "карточки за предыдущие месяцы также доступны.",
    olderMonthsSingle: "Также доступна 1 карточка за предыдущий месяц.",
    totalLabel: "Всего",
    approvedLabel: "Подтверждено",
    rejectedLabel: "Отклонено",
    expiredLabel: "Истекло",
    rentalTypeLabel: "Тип аренды",
    statusLabel: "Статус",
    startDateLabel: "Дата начала",
    endDateLabel: "Дата окончания",
    answerDeadlineLabel: "Крайний срок ответа",
    expiredInline: "(срок истёк)",
    unknownListing: "Объявление",
    currentMonthEmptyHistory:
      "За текущий месяц нет истории подтверждённых, отклонённых или просроченных запросов.",
    monthEmptyHistory:
      "За этот месяц нет истории подтверждённых, отклонённых или просроченных запросов.",
    billingPageLink: "Перейти на страницу подписки",
    serviceFallback: "Услуга",
    roomUnit: "комната",
    locationFallback: "Информация не указана",
    loadingError: "Не удалось загрузить запросы на бронирование.",
    profileRequired: "Сначала заполните профиль владельца.",
    phoneVerificationRequired:
      "Необходимо завершить подтверждение телефона.",
    serviceSelectionRequired: "Сначала завершите выбор услуги.",
    subscriptionRequired: "Для этой услуги требуется активная подписка.",
    serviceNotFoundOrInactive: "Услуга не найдена или неактивна.",
    bookingNotFound: "Запрос на бронирование не найден или уже недоступен.",
    bookingAlreadyProcessed: "Этот запрос на бронирование уже обработан.",
    bookingExpired:
      "Запрос на бронирование нельзя подтвердить, так как срок его действия истёк.",
    internalError:
      "Произошла ошибка сервера. Пожалуйста, повторите попытку позже.",
    loadTimeout: "Время ожидания запроса истекло. Backend не ответил.",
    actionTimeout: "Время ожидания действия истекло. Backend не ответил.",
    rentalHourly: "Почасовая",
    rentalDaily: "Посуточная",
    rentalWeekly: "Понедельная",
    rentalMonthly: "Помесячная",
    statusPending: "В ожидании",
    statusApproved: "Подтверждено",
    statusRejected: "Отклонено",
    statusExpired: "Истекло",
    statusUnknown: "Неизвестно",
    serviceRentHome: "Аренда жилья",
    serviceBarber: "Услуги барбера",
    serviceCarRental: "Аренда автомобиля",
    serviceHotel: "Гостиничная услуга",
    serviceBeautySalon: "Салон красоты",
    serviceBabysitter: "Услуги няни",
    serviceCleaning: "Услуги уборки",
    serviceTechnicalServices: "Технические услуги",
    serviceSoberDriver: "Услуга трезвого водителя",
  },
  zh: {
    panelBadge: "房东面板",
    pageTitle: "预订请求",
    pageSubtitle: "您可以在此处管理所选服务的待处理预订请求。",
    loadingContext: "正在检查服务上下文...",
    selectedServiceLabel: "已选服务",
    backToDashboard: "返回管理面板",
    changeService: "更换服务",
    refresh: "刷新",
    refreshing: "正在刷新...",
    pendingFilter: "筛选：待处理",
    successPrefix: "操作成功：",
    errorPrefix: "错误：",
    loadingRequests: "正在加载请求...",
    noPendingTitle: "当前没有待处理请求",
    noPendingSubtitle: "当新的预订请求到达时，将显示在这里。",
    approve: "批准",
    reject: "拒绝",
    approvingBlockedExpired: "已过期的预订请求不能被批准",
    requestApproved: "预订请求已批准。",
    requestRejected: "预订请求已拒绝。",
    monthlyHistoryEyebrow: "月度历史",
    archiveHistoryEyebrow: "归档历史",
    currentMonthHistoryTitle: "本月请求历史",
    monthlyHistoryOpen: "进入历史",
    monthlyHistoryBack: "← 返回",
    monthlyHistoryIntroTitle: "月度请求历史",
    monthlyHistoryIntroSubtitle:
      "当前月份及以往月份中已批准、已拒绝和已过期的请求保存在下方卡片中。",
    monthlyHistoryNote:
      "当新月份开始时，该月份的新卡片会自动创建并显示在最上方。此前月份的卡片会按时间顺序保留在下方。",
    expandMonthCard: "展开卡片",
    collapseMonthCard: "收起卡片",
    monthHistoryLoading: "正在加载历史...",
    olderMonthsAvailableSuffix: "张上一个月份卡片也可查看。",
    olderMonthsSingle: "另有 1 张上一个月份卡片可查看。",
    totalLabel: "总计",
    approvedLabel: "已批准",
    rejectedLabel: "已拒绝",
    expiredLabel: "已过期",
    rentalTypeLabel: "租赁类型",
    statusLabel: "状态",
    startDateLabel: "开始日期",
    endDateLabel: "结束日期",
    answerDeadlineLabel: "回复截止时间",
    expiredInline: "（已过期）",
    unknownListing: "房源",
    currentMonthEmptyHistory:
      "当前月份没有已批准、已拒绝或已过期的请求历史。",
    monthEmptyHistory: "本月没有已批准、已拒绝或已过期的请求历史。",
    billingPageLink: "前往订阅页面",
    serviceFallback: "服务",
    roomUnit: "间",
    locationFallback: "未提供信息",
    loadingError: "未能加载预订请求。",
    profileRequired: "请先完成房东资料。",
    phoneVerificationRequired: "必须完成电话验证。",
    serviceSelectionRequired: "请先完成服务选择。",
    subscriptionRequired: "该服务需要有效订阅。",
    serviceNotFoundOrInactive: "未找到该服务或该服务未激活。",
    bookingNotFound: "未找到该预订请求，或该请求已不存在。",
    bookingAlreadyProcessed: "该预订请求已被处理。",
    bookingExpired: "该预订请求已过期，因此无法批准。",
    internalError: "发生服务器错误。请稍后重试。",
    loadTimeout: "请求已超时，后端未响应。",
    actionTimeout: "操作已超时，后端未响应。",
    rentalHourly: "按小时",
    rentalDaily: "按天",
    rentalWeekly: "按周",
    rentalMonthly: "按月",
    statusPending: "待处理",
    statusApproved: "已批准",
    statusRejected: "已拒绝",
    statusExpired: "已过期",
    statusUnknown: "未知",
    serviceRentHome: "住房租赁",
    serviceBarber: "理发服务",
    serviceCarRental: "汽车租赁",
    serviceHotel: "酒店服务",
    serviceBeautySalon: "美容沙龙",
    serviceBabysitter: "保姆服务",
    serviceCleaning: "清洁服务",
    serviceTechnicalServices: "技术服务",
    serviceSoberDriver: "代驾服务",
  },
};

function normalizeQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return (value[0] || "").trim();
  return (value || "").trim();
}

function normalizeLocale(value: unknown): Locale | "" {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";

  if (raw.startsWith("az")) return "az";
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("ru")) return "ru";
  if (raw.startsWith("zh")) return "zh";

  return "";
}

function readFirstStorageValue(keys: readonly string[]): string {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = String(window.localStorage.getItem(key) || "").trim();
    if (value) return value;
  }

  return "";
}

function writeStorageValue(keys: readonly string[], value: string) {
  if (typeof window === "undefined") return;

  const normalized = String(value || "").trim();
  if (!normalized) return;

  for (const key of keys) {
    window.localStorage.setItem(key, normalized);
  }
}

function getLocaleFromStorage(): Locale | "" {
  return normalizeLocale(readFirstStorageValue(LOCALE_STORAGE_KEYS));
}

function writeLocaleToStorage(locale: Locale) {
  writeStorageValue(LOCALE_STORAGE_KEYS, locale);
}

function getUiText(locale: Locale): UiText {
  return UI_TEXT[locale] || UI_TEXT.az;
}

function formatReadableDateTime(
  value: string | null | undefined,
  locale: Locale
): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const monthNames = MONTH_NAMES[locale] || MONTH_NAMES.az;
  const day = date.getDate();
  const month = monthNames[date.getMonth()] || "";
  const year = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  if (locale === "en") {
    return `${month} ${day}, ${year} ${hh}:${mm}`;
  }

  if (locale === "zh") {
    return `${year}年${month}${day}日 ${hh}:${mm}`;
  }

  return `${day} ${month} ${year} ${hh}:${mm}`;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const timestamp = new Date(expiresAt).getTime();
  if (Number.isNaN(timestamp)) return false;
  return timestamp <= Date.now();
}

function safeServiceKey(value: unknown): string {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized) return "";
  if (!/^[A-Z0-9_-]{2,64}$/.test(normalized)) return "";
  return normalized;
}

function digitsOnly(input: string): string {
  return String(input || "").replace(/[^\d]/g, "");
}

function isValidE164(value: string): boolean {
  const normalized = String(value || "").trim();
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

function normalizeAsciiHeaderValue(value: unknown): string {
  const raw = String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();

  if (!raw) return "";

  let output = "";
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 && code <= 0x7e) {
      output += ch;
    }
  }

  return output.trim();
}

function normalizeOwnerIdForStorage(value: unknown): string {
  const sanitized = normalizeAsciiHeaderValue(value);
  if (!sanitized) return "";
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(sanitized)) return "";
  return sanitized;
}

function normalizeEmailForStorage(value: unknown): string {
  const sanitized = normalizeAsciiHeaderValue(String(value ?? "").toLowerCase());
  if (!sanitized) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) return "";
  return sanitized;
}

function normalizePhoneForStorage(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const normalized = `+${digitsOnly(raw)}`;
  return isValidE164(normalized) ? normalized : "";
}

function getServiceKeyFromStorage(): string {
  return safeServiceKey(readFirstStorageValue(SERVICE_STORAGE_KEYS));
}

function getPhoneFromStorage(): string {
  return normalizePhoneForStorage(readFirstStorageValue(PHONE_STORAGE_KEYS));
}

function getOwnerIdFromStorage(): string {
  return normalizeOwnerIdForStorage(readFirstStorageValue(OWNER_ID_STORAGE_KEYS));
}

function getOwnerEmailFromStorage(): string {
  return normalizeEmailForStorage(readFirstStorageValue(OWNER_EMAIL_STORAGE_KEYS));
}

function writeServiceKeyToStorage(serviceKey: string) {
  const safe = safeServiceKey(serviceKey);
  if (!safe) return;
  writeStorageValue(SERVICE_STORAGE_KEYS, safe);
}

function humanizeServiceKey(serviceKey: string, text: UiText): string {
  const map: Record<string, string> = {
    RENT_HOME: text.serviceRentHome,
    BARBER: text.serviceBarber,
    CAR_RENTAL: text.serviceCarRental,
    HOTEL: text.serviceHotel,
    BEAUTY: text.serviceBeautySalon,
    BEAUTY_SALON: text.serviceBeautySalon,
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

function sanitizeHeadersRecord(input: Record<string, string>): Record<string, string> {
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

function appendLangParam(params: URLSearchParams, locale: Locale) {
  params.set("lang", locale);
}

function buildBookingsUrl(serviceKey: string, locale: Locale): string {
  const params = new URLSearchParams();

  if (serviceKey) {
    params.set("serviceKey", serviceKey);
  }

  appendLangParam(params, locale);

  return `${PAGE_ROUTE}${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildDashboardUrl(serviceKey: string, locale: Locale): string {
  const params = new URLSearchParams();

  if (serviceKey) {
    params.set("serviceKey", serviceKey);
  }

  appendLangParam(params, locale);

  return `/dashboard${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildBillingUrl(serviceKey: string, locale: Locale): string {
  const params = new URLSearchParams();

  if (serviceKey) {
    params.set("serviceKey", serviceKey);
  }

  appendLangParam(params, locale);

  return `/billing${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildServicesUrl(nextPath: string, serviceKey: string | undefined, locale: Locale): string {
  const params = new URLSearchParams();

  if (nextPath) {
    params.set("next", nextPath);
  }

  if (serviceKey) {
    params.set("serviceKey", serviceKey);
  }

  appendLangParam(params, locale);

  return `${SERVICES_ROUTE}${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildProfileUrl(serviceKey: string, nextPath: string, locale: Locale): string {
  const params = new URLSearchParams();

  if (serviceKey) {
    params.set("serviceKey", serviceKey);
  }

  if (nextPath) {
    params.set("next", nextPath);
  }

  appendLangParam(params, locale);

  return `/profile${params.toString() ? `?${params.toString()}` : ""}`;
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(String(value || "").trim());
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

function normalizeBackendErrorCode(raw: string): string {
  const value = String(raw || "").trim();
  if (!value) return "";

  if (value.toLowerCase() === "service not found or inactive") {
    return "SERVICE_NOT_FOUND_OR_INACTIVE";
  }
  if (value.toLowerCase() === "owner not found") {
    return "OWNER_NOT_FOUND";
  }

  return value.toUpperCase();
}

function getReadableError(raw: string, text: UiText): string {
  const errorCode = normalizeBackendErrorCode(raw);

  if (!errorCode) return text.loadingError;
  if (errorCode === "PROFILE_REQUIRED" || errorCode === "OWNER_NOT_FOUND") {
    return text.profileRequired;
  }
  if (
    errorCode === "PHONE_VERIFICATION_REQUIRED" ||
    errorCode === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
  ) {
    return text.phoneVerificationRequired;
  }
  if (errorCode === "SERVICE_SELECTION_REQUIRED") return text.serviceSelectionRequired;
  if (errorCode === "SUBSCRIPTION_REQUIRED") return text.subscriptionRequired;
  if (errorCode === "SERVICE_NOT_FOUND_OR_INACTIVE") return text.serviceNotFoundOrInactive;
  if (errorCode === "BOOKING_NOT_FOUND") return text.bookingNotFound;
  if (errorCode === "BOOKING_ALREADY_PROCESSED") return text.bookingAlreadyProcessed;
  if (errorCode === "BOOKING_EXPIRED") return text.bookingExpired;
  if (errorCode === "INTERNAL_ERROR") return text.internalError;
  if (errorCode === REQUEST_TIMEOUT_ERROR) return text.loadTimeout;

  return raw || text.loadingError;
}

function getRentalTypeLabel(value: string, text: UiText): string {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "HOURLY") return text.rentalHourly;
  if (normalized === "DAILY") return text.rentalDaily;
  if (normalized === "WEEKLY") return text.rentalWeekly;
  if (normalized === "MONTHLY") return text.rentalMonthly;
  return normalized || text.statusUnknown;
}

function getStatusLabel(value: string, text: UiText): string {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "PENDING") return text.statusPending;
  if (normalized === "APPROVED") return text.statusApproved;
  if (normalized === "REJECTED") return text.statusRejected;
  if (normalized === "EXPIRED") return text.statusExpired;
  return normalized || text.statusUnknown;
}

function getStatusBadgeStyle(status: string): CSSProperties {
  const normalized = String(status || "").trim().toUpperCase();

  if (normalized === "APPROVED") {
    return {
      background: "#ecfdf5",
      color: "#166534",
      border: "1px solid #86efac",
    };
  }

  if (normalized === "REJECTED") {
    return {
      background: "#fef2f2",
      color: "#991b1b",
      border: "1px solid #fca5a5",
    };
  }

  if (normalized === "EXPIRED") {
    return {
      background: "#fff7ed",
      color: "#9a3412",
      border: "1px solid #fdba74",
    };
  }

  return {
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
  };
}

function parseSafeDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date: Date, locale: Locale): string {
  const monthNames = MONTH_NAMES[locale] || MONTH_NAMES.az;
  const month = monthNames[date.getMonth()] || "";
  const year = date.getFullYear();

  if (locale === "zh") {
    return `${year}年${month}`;
  }

  return `${month} ${year}`;
}

function getCompactMonthLabel(date: Date, locale: Locale): string {
  return getMonthLabel(date, locale);
}

function sortByNewestDate(items: BookingRow[]): BookingRow[] {
  return [...items].sort((a, b) => {
    const aStart = parseSafeDate(a.startAt)?.getTime() ?? 0;
    const bStart = parseSafeDate(b.startAt)?.getTime() ?? 0;
    return bStart - aStart;
  });
}

function formatMoney(value: number, locale: Locale): string {
  if (!Number.isFinite(value)) return "0";
  try {
    return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : locale).format(value);
  } catch {
    return String(value);
  }
}

function getBookingLocationText(row: BookingRow, text: UiText): string {
  const city = String(row.property?.city || "").trim();
  const areaName = String(row.property?.areaName || "").trim();
  const roomCount =
    typeof row.property?.roomCount === "number" ? row.property.roomCount : null;

  const locationBase = `${city || text.locationFallback}${areaName ? ` / ${areaName}` : ""}`;

  if (roomCount === null) {
    return locationBase;
  }

  return `${locationBase} • ${roomCount} ${text.roomUnit}`;
}

function getHistoryBucketDate(row: BookingRow): Date | null {
  return parseSafeDate(row.startAt) || parseSafeDate(row.endAt) || parseSafeDate(row.expiresAt);
}

function getHistoryStats(items: BookingRow[]): HistoryStats {
  const approved = items.filter((item) => String(item.status).toUpperCase() === "APPROVED").length;
  const rejected = items.filter((item) => String(item.status).toUpperCase() === "REJECTED").length;
  const expired = items.filter((item) => String(item.status).toUpperCase() === "EXPIRED").length;

  return {
    total: items.length,
    approved,
    rejected,
    expired,
  };
}

function getHistoryTitle(monthLabel: string, isCurrentMonth: boolean, text: UiText, locale: Locale): string {
  if (isCurrentMonth) {
    return text.currentMonthHistoryTitle;
  }

  if (locale === "en") {
    return `${monthLabel} request history`;
  }

  if (locale === "ru") {
    return `История запросов за ${monthLabel}`;
  }

  if (locale === "zh") {
    return `${monthLabel}请求历史`;
  }

  return `${monthLabel} ayına aid sorğu tarixçəsi`;
}

function getHistorySubtitle(monthLabel: string, locale: Locale): string {
  if (locale === "en") {
    return `Approved, rejected, and expired requests for ${monthLabel} are shown here.`;
  }

  if (locale === "ru") {
    return `Здесь отображаются подтверждённые, отклонённые и просроченные запросы за ${monthLabel}.`;
  }

  if (locale === "zh") {
    return `这里显示 ${monthLabel} 的已批准、已拒绝和已过期请求。`;
  }

  return `${monthLabel} üzrə qəbul edilmiş, rədd edilmiş və müddəti başa çatmış sorğular burada görünür.`;
}

function getHistoryEntrySubtitle(
  currentMonthLabel: string,
  olderHistoryGroupCount: number,
  text: UiText,
  locale: Locale
): string {
  let baseText = "";

  if (locale === "en") {
    baseText = `View the approved, rejected, and expired requests for ${currentMonthLabel}.`;
  } else if (locale === "ru") {
    baseText = `Вы можете просмотреть подтверждённые, отклонённые и просроченные запросы за ${currentMonthLabel}.`;
  } else if (locale === "zh") {
    baseText = `查看 ${currentMonthLabel} 的已批准、已拒绝和已过期请求。`;
  } else {
    baseText = `${currentMonthLabel} üzrə qəbul edilmiş, rədd edilmiş və müddəti başa çatmış sorğulara baxın.`;
  }

  if (olderHistoryGroupCount <= 0) {
    return baseText;
  }

  if (olderHistoryGroupCount === 1) {
    return `${baseText} ${text.olderMonthsSingle}`;
  }

  return `${baseText} ${olderHistoryGroupCount} ${text.olderMonthsAvailableSuffix}`;
}

function buildHistoryMonthGroups(
  items: BookingRow[],
  currentMonthAnchor: Date,
  locale: Locale,
  text: UiText
): HistoryMonthGroup[] {
  const currentMonthDate = getMonthStart(currentMonthAnchor);
  const currentMonthKey = getMonthKey(currentMonthDate);

  const groupsMap = new Map<
    string,
    {
      monthDate: Date;
      items: BookingRow[];
    }
  >();

  for (const row of items) {
    const bucketDate = getHistoryBucketDate(row);
    if (!bucketDate) continue;

    const monthDate = getMonthStart(bucketDate);
    const monthKey = getMonthKey(monthDate);

    if (!groupsMap.has(monthKey)) {
      groupsMap.set(monthKey, {
        monthDate,
        items: [],
      });
    }

    groupsMap.get(monthKey)?.items.push(row);
  }

  if (!groupsMap.has(currentMonthKey)) {
    groupsMap.set(currentMonthKey, {
      monthDate: currentMonthDate,
      items: [],
    });
  }

  return [...groupsMap.entries()]
    .map(([monthKey, group]) => {
      const isCurrentMonth = monthKey === currentMonthKey;
      const monthLabel = getMonthLabel(group.monthDate, locale);
      const shortMonthLabel = getCompactMonthLabel(group.monthDate, locale);
      const sortedItems = sortByNewestDate(group.items);

      return {
        monthKey,
        monthDate: group.monthDate,
        monthLabel,
        shortMonthLabel,
        title: getHistoryTitle(monthLabel, isCurrentMonth, text, locale),
        subtitle: getHistorySubtitle(monthLabel, locale),
        items: sortedItems,
        stats: getHistoryStats(sortedItems),
        isCurrentMonth,
      };
    })
    .sort((a, b) => b.monthDate.getTime() - a.monthDate.getTime());
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error
      ? error.name === "AbortError"
      : false;
}

async function fetchJsonWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ response: Response; data: BookingsApiResponse }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as BookingsApiResponse;
    return { response, data };
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw new Error(REQUEST_TIMEOUT_ERROR);
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function OwnerBookingsPage() {
  const router = useRouter();
  const API = useMemo(() => apiBase(), []);

  const [locale, setLocale] = useState<Locale>("az");
  const text = useMemo(() => getUiText(locale), [locale]);

  const [serviceKey, setServiceKey] = useState<string>("");
  const [ready, setReady] = useState(false);
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => new Date());
  const [historyViewOpen, setHistoryViewOpen] = useState(false);
  const [openHistoryMonthKeys, setOpenHistoryMonthKeys] = useState<string[]>([]);

  const [items, setItems] = useState<BookingRow[]>([]);
  const [historyItems, setHistoryItems] = useState<BookingRow[]>([]);
  const [err, setErr] = useState("");
  const [errCode, setErrCode] = useState("");
  const [busyId, setBusyId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [actionInfo, setActionInfo] = useState("");

  const resolvedServiceKey = useMemo(() => {
    const fromQuery = safeServiceKey(normalizeQueryValue(router.query.serviceKey));
    return fromQuery || serviceKey;
  }, [router.query.serviceKey, serviceKey]);

  const currentPagePath = useMemo(() => {
    return buildBookingsUrl(resolvedServiceKey, locale);
  }, [locale, resolvedServiceKey]);

  const dashboardHref = useMemo(() => {
    return buildDashboardUrl(resolvedServiceKey, locale);
  }, [locale, resolvedServiceKey]);

  const billingHref = useMemo(() => {
    return buildBillingUrl(resolvedServiceKey, locale);
  }, [locale, resolvedServiceKey]);

  const servicesHref = useMemo(() => {
    return buildServicesUrl(currentPagePath, resolvedServiceKey, locale);
  }, [currentPagePath, locale, resolvedServiceKey]);

  const displayServiceName = useMemo(() => {
    return humanizeServiceKey(resolvedServiceKey, text);
  }, [resolvedServiceKey, text]);

  const currentMonthLabel = useMemo(() => {
    return getMonthLabel(monthAnchor, locale);
  }, [locale, monthAnchor]);

  const currentMonthKey = useMemo(() => {
    return getMonthKey(getMonthStart(monthAnchor));
  }, [monthAnchor]);

  const historyMonthGroups = useMemo(() => {
    return buildHistoryMonthGroups(historyItems, monthAnchor, locale, text);
  }, [historyItems, locale, monthAnchor, text]);

  const currentMonthHistoryGroup = useMemo<HistoryMonthGroup>(() => {
    return (
      historyMonthGroups.find((group) => group.monthKey === currentMonthKey) || {
        monthKey: currentMonthKey,
        monthDate: getMonthStart(monthAnchor),
        monthLabel: currentMonthLabel,
        shortMonthLabel: getCompactMonthLabel(monthAnchor, locale),
        title: text.currentMonthHistoryTitle,
        subtitle: getHistorySubtitle(currentMonthLabel, locale),
        items: [],
        stats: {
          total: 0,
          approved: 0,
          rejected: 0,
          expired: 0,
        },
        isCurrentMonth: true,
      }
    );
  }, [currentMonthKey, currentMonthLabel, historyMonthGroups, locale, monthAnchor, text]);

  const olderHistoryGroupCount = useMemo(() => {
    return historyMonthGroups.filter(
      (group) => !group.isCurrentMonth && group.items.length > 0
    ).length;
  }, [historyMonthGroups]);

  useEffect(() => {
    if (!router.isReady) return;

    const resolvedLocale =
      normalizeLocale(normalizeQueryValue(router.query.lang)) ||
      normalizeLocale(normalizeQueryValue(router.query.locale)) ||
      normalizeLocale(normalizeQueryValue(router.query.language)) ||
      getLocaleFromStorage() ||
      "az";

    setLocale(resolvedLocale);
    writeLocaleToStorage(resolvedLocale);
  }, [router.isReady, router.query.lang, router.query.language, router.query.locale]);

  useEffect(() => {
    if (!router.isReady) return;

    const fromQuery = safeServiceKey(normalizeQueryValue(router.query.serviceKey));
    const fromStorage = getServiceKeyFromStorage();
    const resolved = fromQuery || fromStorage;

    if (!resolved) {
      setReady(true);
      void router.replace(buildServicesUrl(buildBookingsUrl("", locale), undefined, locale));
      return;
    }

    writeServiceKeyToStorage(resolved);
    setServiceKey(resolved);
    setReady(true);

    const currentLang = normalizeLocale(normalizeQueryValue(router.query.lang));
    if (!fromQuery || currentLang !== locale) {
      void router.replace(
        {
          pathname: PAGE_ROUTE,
          query: { serviceKey: resolved, lang: locale },
        },
        undefined,
        { shallow: true, scroll: false }
      );
    }
  }, [locale, router, router.isReady, router.query.lang, router.query.serviceKey]);

  useEffect(() => {
    const now = new Date();
    const nextMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      1,
      0
    );
    const waitMs = Math.max(1000, nextMonthStart.getTime() - now.getTime());

    const timer = window.setTimeout(() => {
      setMonthAnchor(new Date());
    }, waitMs);

    return () => window.clearTimeout(timer);
  }, [currentMonthKey]);

  useEffect(() => {
    setHistoryViewOpen(false);
    setOpenHistoryMonthKeys([]);
  }, [resolvedServiceKey]);

  useEffect(() => {
    if (!historyViewOpen) return;

    setOpenHistoryMonthKeys((prev) => {
      if (prev.includes(currentMonthKey)) return prev;
      return [currentMonthKey, ...prev];
    });
  }, [historyViewOpen, currentMonthKey]);

  useEffect(() => {
    if (!actionInfo) return;

    const timer = window.setTimeout(() => {
      setActionInfo("");
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [actionInfo]);

  const toggleHistoryMonthCard = useCallback((monthKey: string) => {
    setOpenHistoryMonthKeys((prev) =>
      prev.includes(monthKey)
        ? prev.filter((key) => key !== monthKey)
        : [monthKey, ...prev]
    );
  }, []);

  const handleAccessRedirect = useCallback(
    async (rawMessage: string, payload?: BookingsApiResponse): Promise<boolean> => {
      const normalizedCode = normalizeBackendErrorCode(rawMessage);

      if (
        normalizedCode === "PROFILE_REQUIRED" ||
        normalizedCode === "OWNER_NOT_FOUND"
      ) {
        await router.replace(buildProfileUrl(resolvedServiceKey, currentPagePath, locale));
        return true;
      }

      if (
        normalizedCode === "PHONE_VERIFICATION_REQUIRED" ||
        normalizedCode === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
      ) {
        await router.replace(buildProfileUrl(resolvedServiceKey, currentPagePath, locale));
        return true;
      }

      if (normalizedCode === "SERVICE_SELECTION_REQUIRED") {
        await router.replace(buildServicesUrl(currentPagePath, resolvedServiceKey, locale));
        return true;
      }

      if (normalizedCode === "SUBSCRIPTION_REQUIRED") {
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
    [currentPagePath, locale, resolvedServiceKey, router]
  );

  const requestBookingsByStatus = useCallback(
    async (
      activeServiceKey: string,
      status: BookingStatus
    ): Promise<{ redirected: boolean; items: BookingRow[] }> => {
      const qs = new URLSearchParams();
      qs.set("status", status);
      qs.set("serviceKey", activeServiceKey);

      const storedPhone = getPhoneFromStorage();
      if (storedPhone) {
        qs.set("phone", storedPhone);
      }

      const { response, data } = await fetchJsonWithTimeout(
        `${API}/owner/bookings?${qs.toString()}`,
        {
          method: "GET",
          headers: buildOwnerHeaders(),
        }
      );

      const rawMessage = String(data?.message || data?.error || "").trim();

      if (!response.ok || !data?.ok) {
        const redirected = await handleAccessRedirect(rawMessage, data);
        if (redirected) {
          return { redirected: true, items: [] };
        }

        throw new Error(rawMessage || `HTTP ${response.status}`);
      }

      return {
        redirected: false,
        items: Array.isArray(data?.items) ? data.items : [],
      };
    },
    [API, handleAccessRedirect]
  );

  const load = useCallback(
    async (activeServiceKey: string) => {
      if (!activeServiceKey) return;

      setErr("");
      setErrCode("");
      setLoading(true);

      try {
        const pendingResult = await requestBookingsByStatus(activeServiceKey, "PENDING");

        if (pendingResult.redirected) {
          return;
        }

        const historyResults = await Promise.all(
          HISTORY_STATUSES.map((status) => requestBookingsByStatus(activeServiceKey, status))
        );

        if (historyResults.some((result) => result.redirected)) {
          return;
        }

        setItems(pendingResult.items);

        const mergedHistory = historyResults.flatMap((result) => result.items);
        setHistoryItems(sortByNewestDate(mergedHistory));
      } catch (error: unknown) {
        if (error instanceof Error && error.message === REQUEST_TIMEOUT_ERROR) {
          setErrCode(REQUEST_TIMEOUT_ERROR);
          setErr(text.loadTimeout);
        } else if (error instanceof Error) {
          setErrCode(normalizeBackendErrorCode(error.message));
          setErr(getReadableError(error.message, text));
        } else {
          setErrCode("");
          setErr(text.loadingError);
        }

        setItems([]);
        setHistoryItems([]);
      } finally {
        setLoading(false);
      }
    },
    [requestBookingsByStatus, text]
  );

  const act = useCallback(
    async (id: string, action: "approve" | "reject") => {
      if (!id || !resolvedServiceKey) return;

      setBusyId(id);
      setErr("");
      setErrCode("");
      setActionInfo("");

      const previousItems = items;
      setItems((prev) => prev.filter((item) => item.id !== id));

      try {
        const qs = new URLSearchParams();
        qs.set("serviceKey", resolvedServiceKey);

        const storedPhone = getPhoneFromStorage();
        if (storedPhone) {
          qs.set("phone", storedPhone);
        }

        const { response, data } = await fetchJsonWithTimeout(
          `${API}/owner/bookings/${encodeURIComponent(id)}/${action}?${qs.toString()}`,
          {
            method: "POST",
            headers: buildOwnerHeaders(),
          }
        );

        const rawMessage = String(data?.message || data?.error || "").trim();

        if (!response.ok || !data?.ok) {
          setItems(previousItems);

          const redirected = await handleAccessRedirect(rawMessage, data);
          if (redirected) return;

          throw new Error(rawMessage || `HTTP ${response.status}`);
        }

        setActionInfo(action === "approve" ? text.requestApproved : text.requestRejected);
        await load(resolvedServiceKey);
      } catch (error: unknown) {
        setItems(previousItems);

        if (error instanceof Error && error.message === REQUEST_TIMEOUT_ERROR) {
          setErrCode(REQUEST_TIMEOUT_ERROR);
          setErr(text.actionTimeout);
        } else if (error instanceof Error) {
          setErrCode(normalizeBackendErrorCode(error.message));
          setErr(getReadableError(error.message, text));
        } else {
          setErrCode("");
          setErr(text.loadingError);
        }
      } finally {
        setBusyId("");
      }
    },
    [API, handleAccessRedirect, items, load, resolvedServiceKey, text]
  );

  useEffect(() => {
    if (!ready || !resolvedServiceKey) return;
    void load(resolvedServiceKey);
  }, [ready, resolvedServiceKey, currentMonthKey, load]);

  if (!ready) {
    return (
      <div style={pageStyle}>
        <div style={shellStyle}>
          <div style={heroCardStyle}>
            <div style={heroInnerStyle}>
              <h1 style={titleStyle}>{text.pageTitle}</h1>
              <p style={subtitleStyle}>{text.loadingContext}</p>
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
            <div style={heroBadgeStyle}>{text.panelBadge}</div>
            <h1 style={titleStyle}>{text.pageTitle}</h1>
            <p style={subtitleStyle}>{text.pageSubtitle}</p>

            <div style={contextCardStyle}>
              <div style={contextLabelStyle}>{text.selectedServiceLabel}</div>
              <div style={contextTitleStyle}>{displayServiceName}</div>
              <div style={contextMetaStyle}>{resolvedServiceKey}</div>
            </div>

            <div style={topActionsStyle}>
              <Link href={dashboardHref} style={secondaryLinkStyle}>
                {text.backToDashboard}
              </Link>

              <Link href={servicesHref} style={secondaryLinkStyle}>
                {text.changeService}
              </Link>

              <button
                type="button"
                onClick={() => {
                  setActionInfo("");
                  void load(resolvedServiceKey);
                }}
                style={btnSecondary}
                disabled={loading}
              >
                {loading ? text.refreshing : text.refresh}
              </button>

              <div style={filterBadgeStyle}>{text.pendingFilter}</div>
            </div>
          </div>
        </div>

        {actionInfo ? (
          <div style={successBoxStyle}>
            <b>{text.successPrefix}</b> {actionInfo}
          </div>
        ) : null}

        {err ? (
          <div style={errorBoxStyle}>
            <b>{text.errorPrefix}</b> {err}

            {errCode === "SUBSCRIPTION_REQUIRED" ? (
              <div style={errorActionsStyle}>
                <Link href={billingHref} style={secondaryLinkStyle}>
                  {text.billingPageLink}
                </Link>

                <Link href={servicesHref} style={secondaryLinkStyle}>
                  {text.changeService}
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        {loading && items.length === 0 ? (
          <div style={cardStyle}>
            <div style={mutedStyle}>{text.loadingRequests}</div>
          </div>
        ) : null}

        {!loading && !err && items.length === 0 ? (
          <div style={cardStyle}>
            <div style={emptyTitleStyle}>{text.noPendingTitle}</div>
            <div style={mutedStyle}>{text.noPendingSubtitle}</div>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div style={listStyle}>
            {items.map((booking) => {
              const expired = isExpired(booking.expiresAt);
              const title = (booking.property?.title ?? "").trim() || text.unknownListing;
              const sub = getBookingLocationText(booking, text);

              const approveDisabled = busyId === booking.id || expired;
              const rejectDisabled = busyId === booking.id;

              return (
                <div key={booking.id} style={propertyCardStyle}>
                  <div style={propertyHeaderStyle}>
                    <div style={propertyHeaderCopyStyle}>
                      <div style={propertyTitleStyle}>{title}</div>
                      <div style={propertyMetaStyle}>{sub}</div>
                    </div>

                    <div style={priceStyle}>{formatMoney(booking.totalPrice, locale)} AZN</div>
                  </div>

                  <div style={detailsGridStyle}>
                    <div style={detailItemStyle}>
                      <b>{text.rentalTypeLabel}:</b> {getRentalTypeLabel(booking.rentalType, text)}
                    </div>
                    <div style={detailItemStyle}>
                      <b>{text.statusLabel}:</b> {getStatusLabel(booking.status, text)}
                    </div>
                    <div style={detailItemStyle}>
                      <b>{text.startDateLabel}:</b>{" "}
                      {formatReadableDateTime(booking.startAt, locale)}
                    </div>
                    <div style={detailItemStyle}>
                      <b>{text.endDateLabel}:</b>{" "}
                      {formatReadableDateTime(booking.endAt, locale)}
                    </div>

                    {booking.expiresAt ? (
                      <div
                        style={{
                          ...detailItemStyle,
                          color: expired ? "#b00020" : "#374151",
                        }}
                      >
                        <b>{text.answerDeadlineLabel}:</b>{" "}
                        {formatReadableDateTime(booking.expiresAt, locale)}{" "}
                        {expired ? text.expiredInline : ""}
                      </div>
                    ) : null}
                  </div>

                  <div style={actionsRowStyle}>
                    <button
                      type="button"
                      onClick={() => void act(booking.id, "approve")}
                      disabled={approveDisabled}
                      style={{ ...btnPrimary, ...(approveDisabled ? disabledButtonStyle : {}) }}
                      title={expired ? text.approvingBlockedExpired : ""}
                    >
                      {busyId === booking.id ? "..." : text.approve}
                    </button>

                    <button
                      type="button"
                      onClick={() => void act(booking.id, "reject")}
                      disabled={rejectDisabled}
                      style={{ ...btnDanger, ...(rejectDisabled ? disabledButtonStyle : {}) }}
                    >
                      {busyId === booking.id ? "..." : text.reject}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {!historyViewOpen ? (
          <button
            type="button"
            onClick={() => {
              setHistoryViewOpen(true);
              setOpenHistoryMonthKeys([currentMonthKey]);
            }}
            style={historyEntryCardButtonStyle}
          >
            <div style={historyEntryCardInnerStyle}>
              <div style={historyCopyBlockStyle}>
                <div style={historyEntryEyebrowStyle}>{text.monthlyHistoryEyebrow}</div>
                <div style={historyEntryTitleStyle}>{text.currentMonthHistoryTitle}</div>
                <div style={historyEntrySubtitleStyle}>
                  {getHistoryEntrySubtitle(currentMonthLabel, olderHistoryGroupCount, text, locale)}
                </div>

                <div style={historyStatsGridStyle}>
                  <div style={historyStatCardStyle}>
                    <div style={historyStatLabelStyle}>{text.totalLabel}</div>
                    <div style={historyStatValueStyle}>{currentMonthHistoryGroup.stats.total}</div>
                  </div>

                  <div style={historyStatCardStyle}>
                    <div style={historyStatLabelStyle}>{text.approvedLabel}</div>
                    <div style={historyStatValueStyle}>
                      {currentMonthHistoryGroup.stats.approved}
                    </div>
                  </div>

                  <div style={historyStatCardStyle}>
                    <div style={historyStatLabelStyle}>{text.rejectedLabel}</div>
                    <div style={historyStatValueStyle}>
                      {currentMonthHistoryGroup.stats.rejected}
                    </div>
                  </div>

                  <div style={historyStatCardStyle}>
                    <div style={historyStatLabelStyle}>{text.expiredLabel}</div>
                    <div style={historyStatValueStyle}>{currentMonthHistoryGroup.stats.expired}</div>
                  </div>
                </div>

                <div style={historyEntryActionWrapStyle}>
                  <div style={historyEntryActionStyle}>{text.monthlyHistoryOpen}</div>
                </div>
              </div>
            </div>
          </button>
        ) : (
          <div style={historySectionStyle}>
            <div style={historyToolbarStyle}>
              <button
                type="button"
                onClick={() => setHistoryViewOpen(false)}
                style={historyBackButtonStyle}
              >
                {text.monthlyHistoryBack}
              </button>
            </div>

            <div style={historySectionHeaderStyle}>
              <div style={historyCopyBlockStyle}>
                <div style={historySectionTitleStyle}>{text.monthlyHistoryIntroTitle}</div>
                <div style={historySectionSubtitleStyle}>
                  {text.monthlyHistoryIntroSubtitle}
                </div>
              </div>
            </div>

            <div style={historyNoteStyle}>{text.monthlyHistoryNote}</div>

            {loading && historyItems.length === 0 ? (
              <div style={historyEmptyStyle}>{text.monthHistoryLoading}</div>
            ) : null}

            {!loading && historyMonthGroups.length === 0 ? (
              <div style={historyEmptyStyle}>{text.currentMonthEmptyHistory}</div>
            ) : null}

            {historyMonthGroups.length > 0 ? (
              <div style={historyMonthCardListStyle}>
                {historyMonthGroups.map((group) => {
                  const isOpen = openHistoryMonthKeys.includes(group.monthKey);

                  return (
                    <div key={group.monthKey} style={historyMonthCardStyle}>
                      <button
                        type="button"
                        onClick={() => toggleHistoryMonthCard(group.monthKey)}
                        style={historyMonthCardToggleStyle}
                      >
                        <div style={historyMonthCardToggleInnerStyle}>
                          <div style={historyCopyBlockStyle}>
                            <div style={historyEntryEyebrowStyle}>
                              {group.isCurrentMonth
                                ? text.monthlyHistoryEyebrow
                                : text.archiveHistoryEyebrow}
                            </div>

                            <div style={historyMonthCardTitleStyle}>{group.title}</div>
                            <div style={historyMonthCardSubtitleStyle}>{group.subtitle}</div>

                            <div style={historyStatsGridStyle}>
                              <div style={historyStatCardStyle}>
                                <div style={historyStatLabelStyle}>{text.totalLabel}</div>
                                <div style={historyStatValueStyle}>{group.stats.total}</div>
                              </div>

                              <div style={historyStatCardStyle}>
                                <div style={historyStatLabelStyle}>{text.approvedLabel}</div>
                                <div style={historyStatValueStyle}>{group.stats.approved}</div>
                              </div>

                              <div style={historyStatCardStyle}>
                                <div style={historyStatLabelStyle}>{text.rejectedLabel}</div>
                                <div style={historyStatValueStyle}>{group.stats.rejected}</div>
                              </div>

                              <div style={historyStatCardStyle}>
                                <div style={historyStatLabelStyle}>{text.expiredLabel}</div>
                                <div style={historyStatValueStyle}>{group.stats.expired}</div>
                              </div>
                            </div>

                            <div style={historyEntryActionWrapStyle}>
                              <div style={historyEntryActionStyle}>
                                {isOpen ? text.collapseMonthCard : text.expandMonthCard}
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>

                      {isOpen ? (
                        <div style={historyMonthCardBodyStyle}>
                          {group.items.length === 0 ? (
                            <div style={historyEmptyStyle}>
                              {group.isCurrentMonth
                                ? text.currentMonthEmptyHistory
                                : text.monthEmptyHistory}
                            </div>
                          ) : (
                            <div style={historyListStyle}>
                              {group.items.map((booking) => {
                                const title =
                                  (booking.property?.title ?? "").trim() || text.unknownListing;
                                const sub = getBookingLocationText(booking, text);

                                return (
                                  <div key={`history-${group.monthKey}-${booking.id}`} style={historyItemStyle}>
                                    <div style={historyItemTopStyle}>
                                      <div style={historyCopyBlockStyle}>
                                        <div style={historyItemTitleStyle}>{title}</div>
                                        <div style={historyItemMetaStyle}>{sub}</div>
                                      </div>

                                      <div style={historyItemSideStyle}>
                                        <div style={historyPriceStyle}>
                                          {formatMoney(booking.totalPrice, locale)} AZN
                                        </div>
                                        <div
                                          style={{
                                            ...historyStatusBadgeStyle,
                                            ...getStatusBadgeStyle(booking.status),
                                          }}
                                        >
                                          {getStatusLabel(booking.status, text)}
                                        </div>
                                      </div>
                                    </div>

                                    <div style={historyDetailsGridStyle}>
                                      <div style={detailItemStyle}>
                                        <b>{text.rentalTypeLabel}:</b>{" "}
                                        {getRentalTypeLabel(booking.rentalType, text)}
                                      </div>
                                      <div style={detailItemStyle}>
                                        <b>{text.startDateLabel}:</b>{" "}
                                        {formatReadableDateTime(booking.startAt, locale)}
                                      </div>
                                      <div style={detailItemStyle}>
                                        <b>{text.endDateLabel}:</b>{" "}
                                        {formatReadableDateTime(booking.endAt, locale)}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100dvh",
  background: `
    radial-gradient(circle at top left, rgba(177, 209, 88, 0.18) 0%, transparent 22%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10) 0%, transparent 22%),
    radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.08) 0%, transparent 20%),
    linear-gradient(180deg, #eef2ea 0%, #e9eee7 52%, #e6ece4 100%)
  `,
  padding: "0px 0 32px",
  overflowX: "hidden",
};

const shellStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1280,
  margin: "0 auto",
  padding: "0 16px",
  display: "grid",
  gap: 20,
  boxSizing: "border-box",
};

const heroCardStyle: CSSProperties = {
  position: "relative",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
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
};

const heroInnerStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1280,
  margin: "0 auto",
  padding: "34px 16px 32px",
  boxSizing: "border-box",
};

const heroBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 32,
  padding: "0 12px",
  borderRadius: 999,
  background: "#0f172a",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  width: "fit-content",
};

const titleStyle: CSSProperties = {
  margin: "14px 0 0 0",
  fontSize: 32,
  lineHeight: 1.1,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.03em",
};

const subtitleStyle: CSSProperties = {
  margin: "12px 0 0 0",
  fontSize: 15,
  lineHeight: 1.75,
  color: "#475569",
  maxWidth: 920,
};

const contextCardStyle: CSSProperties = {
  marginTop: 18,
  borderRadius: 22,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  padding: 18,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
};

const contextLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const contextTitleStyle: CSSProperties = {
  marginTop: 10,
  fontSize: 24,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const contextMetaStyle: CSSProperties = {
  marginTop: 8,
  color: "#64748b",
  fontSize: 13,
  wordBreak: "break-word",
  lineHeight: 1.7,
};

const topActionsStyle: CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  gap: 10,
  alignItems: "stretch",
};

const filterBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  padding: "0 14px",
  borderRadius: 14,
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.10)",
  color: "#0f172a",
  fontWeight: 800,
  fontSize: 13,
  textAlign: "center",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
};

const cardStyle: CSSProperties = {
  background: `
    radial-gradient(circle at top right, rgba(163, 230, 53, 0.08), transparent 22%),
    radial-gradient(circle at bottom left, rgba(37, 99, 235, 0.08), transparent 24%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 22,
  padding: 20,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: 14,
};

const propertyCardStyle: CSSProperties = {
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 22,
  padding: 18,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
};

const propertyHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const propertyHeaderCopyStyle: CSSProperties = {
  minWidth: 0,
  flex: "1 1 240px",
};

const propertyTitleStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const propertyMetaStyle: CSSProperties = {
  marginTop: 8,
  color: "#475569",
  fontSize: 15,
  lineHeight: 1.7,
};

const priceStyle: CSSProperties = {
  fontWeight: 900,
  color: "#0f172a",
  fontSize: 18,
  letterSpacing: "-0.02em",
};

const detailsGridStyle: CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 10,
  color: "#334155",
  fontSize: 14,
  lineHeight: 1.75,
};

const detailItemStyle: CSSProperties = {
  minWidth: 0,
};

const actionsRowStyle: CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
  gap: 10,
};

const emptyTitleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  color: "#0f172a",
  marginBottom: 8,
  letterSpacing: "-0.02em",
};

const mutedStyle: CSSProperties = {
  color: "#64748b",
  lineHeight: 1.7,
};

const errorBoxStyle: CSSProperties = {
  padding: 14,
  border: "1px solid rgba(239, 68, 68, 0.24)",
  background: "linear-gradient(180deg, #fffafa 0%, #fef2f2 100%)",
  color: "#991b1b",
  borderRadius: 16,
  fontWeight: 700,
  lineHeight: 1.7,
};

const successBoxStyle: CSSProperties = {
  padding: 14,
  border: "1px solid rgba(34, 197, 94, 0.24)",
  background: "linear-gradient(180deg, #f8fff9 0%, #edfdf2 100%)",
  color: "#166534",
  borderRadius: 16,
  fontWeight: 700,
  lineHeight: 1.7,
};

const errorActionsStyle: CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  gap: 10,
};

const secondaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  width: "100%",
  padding: "0 18px",
  borderRadius: 14,
  border: "1px solid rgba(15, 23, 42, 0.10)",
  background: "#ffffff",
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 700,
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
  textAlign: "center",
};

const btnPrimary: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  background: "#0f172a",
  color: "#ffffff",
  border: "1px solid #0f172a",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.14)",
  width: "100%",
  minHeight: 46,
};

const btnSecondary: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  width: "100%",
  padding: "0 18px",
  borderRadius: 14,
  background: "#ffffff",
  color: "#0f172a",
  border: "1px solid rgba(15, 23, 42, 0.10)",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
  textAlign: "center",
};

const btnDanger: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  background: "#7f1d1d",
  color: "#ffffff",
  border: "1px solid #7f1d1d",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(127, 29, 29, 0.16)",
  width: "100%",
  minHeight: 46,
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
};

const historyEntryCardButtonStyle: CSSProperties = {
  width: "100%",
  textAlign: "left",
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 24,
  padding: 0,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  cursor: "pointer",
};

const historyEntryCardInnerStyle: CSSProperties = {
  padding: 20,
  display: "block",
};

const historyCopyBlockStyle: CSSProperties = {
  minWidth: 0,
};

const historyEntryEyebrowStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#2563eb",
};

const historyEntryTitleStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 26,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const historyEntrySubtitleStyle: CSSProperties = {
  marginTop: 10,
  color: "#475569",
  fontSize: 15,
  lineHeight: 1.75,
  maxWidth: 620,
};

const historyStatsGridStyle: CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const historyStatCardStyle: CSSProperties = {
  minHeight: 62,
  padding: "10px 12px",
  borderRadius: 16,
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  boxShadow: "0 6px 14px rgba(15, 23, 42, 0.05)",
  display: "grid",
  gap: 4,
  alignContent: "center",
};

const historyStatLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#64748b",
  lineHeight: 1.35,
};

const historyStatValueStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.1,
};

const historyEntryActionWrapStyle: CSSProperties = {
  marginTop: 14,
};

const historyEntryActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  width: "100%",
  padding: "0 16px",
  borderRadius: 14,
  background: "#0f172a",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: 13,
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.12)",
  boxSizing: "border-box",
};

const historySectionStyle: CSSProperties = {
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 24,
  padding: 20,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
};

const historyToolbarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-start",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 18,
};

const historyBackButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "0 16px",
  borderRadius: 14,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.14)",
};

const historySectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const historySectionTitleStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const historySectionSubtitleStyle: CSSProperties = {
  marginTop: 8,
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.7,
};

const historyNoteStyle: CSSProperties = {
  marginTop: 14,
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(59, 130, 246, 0.18)",
  background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
  color: "#1e40af",
  fontSize: 13,
  lineHeight: 1.7,
};

const historyEmptyStyle: CSSProperties = {
  marginTop: 14,
  padding: 16,
  borderRadius: 16,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.7,
};

const historyMonthCardListStyle: CSSProperties = {
  marginTop: 16,
  display: "grid",
  gap: 16,
};

const historyMonthCardStyle: CSSProperties = {
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
};

const historyMonthCardToggleStyle: CSSProperties = {
  width: "100%",
  textAlign: "left",
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
};

const historyMonthCardToggleInnerStyle: CSSProperties = {
  padding: 20,
  display: "block",
};

const historyMonthCardTitleStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 24,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const historyMonthCardSubtitleStyle: CSSProperties = {
  marginTop: 10,
  color: "#475569",
  fontSize: 15,
  lineHeight: 1.75,
  maxWidth: 620,
};

const historyMonthCardBodyStyle: CSSProperties = {
  padding: "0 20px 20px 20px",
};

const historyListStyle: CSSProperties = {
  marginTop: 14,
  display: "grid",
  gap: 14,
};

const historyItemStyle: CSSProperties = {
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 24%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)
  `,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 18,
  padding: 16,
};

const historyItemTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const historyItemTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "#0f172a",
};

const historyItemMetaStyle: CSSProperties = {
  marginTop: 6,
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.7,
};

const historyItemSideStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  justifyItems: "end",
};

const historyPriceStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: 17,
  color: "#0f172a",
};

const historyStatusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 32,
  padding: "0 12px",
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 12,
  whiteSpace: "nowrap",
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.10)",
  color: "#0f172a",
};

const historyDetailsGridStyle: CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 8,
  color: "#334155",
  fontSize: 14,
  lineHeight: 1.75,
};