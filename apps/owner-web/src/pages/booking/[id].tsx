import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { DateRange, type Range } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { formatAzDateTime } from "../../utils/dateFormat";


type RentalType = "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";

const ALLOWED_RENTAL_TYPES: RentalType[] = [
  "HOURLY",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
];

function digitsOnly(s: string) {
  return String(s ?? "").replace(/[^\d]/g, "");
}

function normalizePhoneToWaId(input: string) {
  const digits = digitsOnly(String(input ?? "").trim());
  if (!digits) return "";

  if (digits.startsWith("994")) return digits;
  if (digits.length === 10 && digits.startsWith("0")) return "994" + digits.slice(1);
  if (digits.length === 9) return "994" + digits;

  return digits;
}

function validatePhone(input: string) {
  const waId = normalizePhoneToWaId(input);

  if (!waId) {
    return { ok: false as const, waId: "", error: "Telefon nömrəsi boş ola bilməz." };
  }

  if (!/^\d+$/.test(waId)) {
    return { ok: false as const, waId: "", error: "Telefon nömrəsinin formatı yanlışdır." };
  }

  if (!waId.startsWith("994")) {
    return {
      ok: false as const,
      waId: "",
      error: "Telefon nömrəsi Azərbaycan formatında olmalıdır.",
    };
  }

  if (waId.length !== 12) {
    return {
      ok: false as const,
      waId: "",
      error: "Telefon nömrəsinin uzunluğu yanlışdır.",
    };
  }

  return { ok: true as const, waId, error: "" };
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function formatDateForApi(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

function normalizeSelectedRange(input: Range, todaySource = new Date()): Range {
  const today = getStartOfDay(todaySource);

  const rawStart = isValidDate(input.startDate) ? getStartOfDay(input.startDate) : today;
  const rawEnd = isValidDate(input.endDate) ? getStartOfDay(input.endDate) : rawStart;

  const selectionContainsPastDate =
    rawStart.getTime() < today.getTime() || rawEnd.getTime() < today.getTime();

  let nextStart = rawStart;
  let nextEnd = rawEnd;

  if (selectionContainsPastDate) {
    nextStart = today;
    nextEnd = today;
  }

  if (nextEnd.getTime() < nextStart.getTime()) {
    nextEnd = nextStart;
  }

  return {
    ...input,
    startDate: nextStart,
    endDate: nextEnd,
    key: input.key || "selection",
  };
}

function getRentalTypeLabel(type: RentalType) {
  if (type === "HOURLY") return "Saatlıq";
  if (type === "DAILY") return "Günlük";
  if (type === "WEEKLY") return "Həftəlik";
  if (type === "MONTHLY") return "Aylıq";
  return type;
}

export default function BookingPage() {
  const router = useRouter();

  const draftId = useMemo(() => {
    const v = router.query.id;
    return typeof v === "string" ? v : "";
  }, [router.query.id]);

  const isDevMode = useMemo(() => {
    const v = router.query.dev;
    return v === "1" || v === "true";
  }, [router.query.dev]);

  const [range, setRange] = useState<Range>(() => {
    const today = getStartOfDay(new Date());
    return {
      startDate: today,
      endDate: addDays(today, 1),
      key: "selection",
    };
  });

  const [propertyId, setPropertyId] = useState("");
  const [phone, setPhone] = useState("");
  const [rentalType, setRentalType] = useState<RentalType>("DAILY");

  const [errors, setErrors] = useState<{
    propertyId?: string;
    phone?: string;
    rentalType?: string;
    dateRange?: string;
  }>({});

  const [status, setStatus] = useState("");

  const selectedStartText = useMemo(() => {
    return formatAzDateTime(range?.startDate);
  }, [range?.startDate]);

  const selectedEndText = useMemo(() => {
    return formatAzDateTime(range?.endDate);
  }, [range?.endDate]);

  function validateAll() {
    const next: typeof errors = {};
    const today = getStartOfDay(new Date());
    const start = range?.startDate;
    const end = range?.endDate;

    if (!ALLOWED_RENTAL_TYPES.includes(rentalType)) {
      next.rentalType = "İcarə növü yanlışdır.";
    }

    if (!isValidDate(start)) {
      next.dateRange = "Başlanğıc tarixi seçilməyib.";
    } else if (!isValidDate(end)) {
      next.dateRange = "Bitiş tarixi seçilməyib.";
    } else {
      const normalizedStart = getStartOfDay(start);
      const normalizedEnd = getStartOfDay(end);

      if (normalizedStart.getTime() < today.getTime()) {
        next.dateRange =
          "Cari gündən əvvəlki tarixlər üçün rezervasiya sorğusu göndərilə bilməz.";
      } else if (normalizedEnd.getTime() < today.getTime()) {
        next.dateRange =
          "Cari gündən əvvəlki tarixlər üçün rezervasiya sorğusu göndərilə bilməz.";
      } else if (normalizedEnd.getTime() < normalizedStart.getTime()) {
        next.dateRange = "Bitiş tarixi başlanğıc tarixindən əvvəl ola bilməz.";
      }
    }

    if (isDevMode) {
      if (!propertyId.trim()) {
        next.propertyId = "Əmlak identifikatoru boş ola bilməz.";
      }

      const phoneCheck = validatePhone(phone);
      if (!phoneCheck.ok) {
        next.phone = phoneCheck.error;
      }
    }

    setErrors(next);
    return next;
  }

  async function submit() {
    setStatus("");

    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://127.0.0.1:3001";

    const next = validateAll();
    if (Object.keys(next).length > 0) return;

    const start = range?.startDate;
    const end = range?.endDate;
    const today = getStartOfDay(new Date());

    if (!isValidDate(start)) {
      setStatus("Başlanğıc tarixi seçilməyib.");
      return;
    }

    if (!isValidDate(end)) {
      setStatus("Bitiş tarixi seçilməyib.");
      return;
    }

    const normalizedStart = getStartOfDay(start);
    const normalizedEnd = getStartOfDay(end);

    if (normalizedStart.getTime() < today.getTime() || normalizedEnd.getTime() < today.getTime()) {
      setStatus("Cari gündən əvvəlki tarixlər üçün rezervasiya sorğusu göndərilə bilməz.");
      return;
    }

    if (normalizedEnd.getTime() < normalizedStart.getTime()) {
      setStatus("Bitiş tarixi başlanğıc tarixindən əvvəl ola bilməz.");
      return;
    }

    const payload: {
      rentalType: RentalType;
      startAt: string;
      endAt: string;
      draftId: string;
      propertyId?: string;
      phone?: string;
    } = {
      rentalType,
      startAt: formatDateForApi(normalizedStart),
      endAt: formatDateForApi(normalizedEnd),
      draftId,
    };

    if (isDevMode) {
      payload.propertyId = propertyId.trim();
      payload.phone = normalizePhoneToWaId(phone);
    }

    setStatus("Sorğu göndərilir...");

    try {
      const resp = await fetch(`${base}/booking/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => ({} as Record<string, unknown>));

      if (!resp.ok) {
        const msg =
          String(data?.message ?? "") ||
          (resp.status === 409 ? "DATES_TAKEN" : `HTTP_${resp.status}`);

        setStatus(`Server xətası (${resp.status}). ${msg}`);
        return;
      }

      setStatus(
        `Rezervasiya sorğusu yaradıldı.
Rezervasiya identifikatoru: ${String(data?.bookingId ?? "?")}
Hesablanmış məbləğ: ${String(data?.price ?? "?")} AZN`
      );
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error && e.message ? e.message : "Naməlum xəta baş verdi.";
      setStatus(`API ilə əlaqə qurulmadı.
${errorMessage}`);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}>
      <h2>Rezervasiya sorğusu</h2>

      <div style={{ opacity: 0.8, marginBottom: 10 }}>
        URL identifikatoru: <code>{draftId || "(yüklənir...)"}</code>{" "}
        {isDevMode ? <span style={{ marginLeft: 8 }}>(inkişaf rejimi)</span> : null}
      </div>

      {isDevMode && (
        <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          <label>
            Əmlak identifikatoru
            <input
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              style={{ padding: 8, width: "100%" }}
            />
            {errors.propertyId && <div style={{ color: "crimson" }}>{errors.propertyId}</div>}
          </label>

          <label>
            Telefon nömrəsi
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ padding: 8, width: "100%" }}
            />
            {errors.phone && <div style={{ color: "crimson" }}>{errors.phone}</div>}
          </label>
        </div>
      )}

      <label style={{ display: "block", marginBottom: 12 }}>
        İcarə növü
        <select
          value={rentalType}
          onChange={(e) => setRentalType(e.target.value as RentalType)}
          style={{ display: "block", padding: 8, marginTop: 6 }}
        >
          {ALLOWED_RENTAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {getRentalTypeLabel(t)}
            </option>
          ))}
        </select>
        {errors.rentalType && (
          <div style={{ color: "crimson", marginTop: 6 }}>{errors.rentalType}</div>
        )}
      </label>

      <div style={{ marginBottom: 16 }}>
        <DateRange
          ranges={[range]}
          onChange={(item) => {
            const normalizedRange = normalizeSelectedRange(item.selection, new Date());
            setRange(normalizedRange);
            setErrors((prev) => ({ ...prev, dateRange: undefined }));
            setStatus("");
          }}
          moveRangeOnFirstSelection={false}
          minDate={getStartOfDay(new Date())}
        />
        <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
          Cari gündən əvvəlki tarixlər seçilə bilməz.
        </div>
        {errors.dateRange && (
          <div style={{ marginTop: 8, color: "crimson" }}>{errors.dateRange}</div>
        )}
      </div>

      <div
        style={{
          marginBottom: 16,
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          background: "#fafafa",
          display: "grid",
          gap: 8,
        }}
      >
        <div>
          <b>İcarə növü:</b> {getRentalTypeLabel(rentalType)}
        </div>
        <div>
          <b>Başlanğıc tarixi:</b> {selectedStartText}
        </div>
        <div>
          <b>Bitiş tarixi:</b> {selectedEndText}
        </div>
      </div>

      <button type="button" onClick={submit} style={{ padding: "10px 14px" }}>
        Təsdiq et
      </button>

      {status ? (
        <pre style={{ marginTop: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {status}
        </pre>
      ) : null}
    </div>
  );
}