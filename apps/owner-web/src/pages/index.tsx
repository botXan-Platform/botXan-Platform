// apps/owner-web/src/pages/index.tsx

import type { CSSProperties } from "react";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";

const DASHBOARD_ROUTE = "/dashboard";
const PAGE_LOCALE = "az";
const LOADING_MESSAGE = "botXan sahib paneli yüklənir...";

function normalizeQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return String(value[0] || "").trim();
  }

  return String(value || "").trim();
}

function buildDashboardHref(params?: {
  serviceKey?: string;
  plan?: string;
}): string {
  const searchParams = new URLSearchParams();
  searchParams.set("lang", PAGE_LOCALE);

  if (params?.serviceKey) {
    searchParams.set("serviceKey", params.serviceKey);
  }

  if (params?.plan) {
    searchParams.set("plan", params.plan);
  }

  const queryString = searchParams.toString();
  return queryString ? `${DASHBOARD_ROUTE}?${queryString}` : DASHBOARD_ROUTE;
}

export default function HomePage() {
  const router = useRouter();

  const dashboardHref = useMemo(() => {
    const serviceKey = normalizeQueryValue(router.query.serviceKey);
    const plan = normalizeQueryValue(router.query.plan);

    return buildDashboardHref({
      serviceKey: serviceKey || undefined,
      plan: plan || undefined,
    });
  }, [router.query.plan, router.query.serviceKey]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    void router.replace(dashboardHref, undefined, {
      shallow: true,
      scroll: false,
    });
  }, [dashboardHref, router, router.isReady]);

  return (
    <main style={pageStyle} aria-busy="true" aria-live="polite">
      <div role="status" style={statusStyle}>
        {LOADING_MESSAGE}
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = {
  width: "100%",
  minHeight: "100dvh",
  margin: 0,
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const statusStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "24px 16px",
  color: "#0f172a",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 16,
  fontWeight: 700,
  lineHeight: 1.5,
  textAlign: "center",
};