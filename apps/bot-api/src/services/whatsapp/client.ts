import { env } from "../../config/env.js";
import fs from "fs";
import path from "path";

export type SendResult = {
  providerMessageId: string;
};

// WhatsApp Cloud API endpoint
const GRAPH_VERSION = env.WHATSAPP_GRAPH_VERSION || "v19.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

const REQUEST_TIMEOUT = 15_000;
const MAX_RETRIES = 3;

// ===============================
// ✅ WhatsApp hard limits (practical-safe)
// ===============================
// NOTE: These are the common Cloud API constraints used in practice.
// If your account has slightly different enforcement, we still stay safely under typical caps.
const LIMITS = {
  textBody: 4096,
  interactiveBody: 1024,
  footerText: 60,
  headerText: 60,

  // interactive button/list constraints
  buttonTitle: 20,
  buttonText: 20,

  listSectionTitle: 24,
  listRowTitle: 24,
  listRowDesc: 72,

  // action ids are generally safe under 256; keep it conservative
  actionId: 200,

  // list totals — Cloud API usually allows up to 10 sections and 10 rows/section in many contexts
  maxSections: 10,
  maxRowsPerSection: 10,
  maxReplyButtons: 3,
};

// ===============================
// ✅ Local MOCK logging (JSONL)
// ===============================
const MOCK_LOG_DIR = process.env.WA_MOCK_LOG_DIR || ".wa-mock";
const MOCK_LOG_FILE = path.join(MOCK_LOG_DIR, "outbound.jsonl");

function mockWrite(payload: any) {
  try {
    fs.mkdirSync(MOCK_LOG_DIR, { recursive: true });
    fs.appendFileSync(
      MOCK_LOG_FILE,
      JSON.stringify({ ts: Date.now(), payload }) + "\n",
      { encoding: "utf8" }
    );
  } catch {
    // dev: ignore
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter(ms: number) {
  const j = Math.floor(Math.random() * 250);
  return ms + j;
}

async function fetchWithTimeout(url: string, options: any, timeout: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function safeStr(v: unknown): string {
  return String(v ?? "").trim();
}

function clip(s: string, max: number): string {
  const v = safeStr(s);
  if (max <= 0) return "";
  return v.length <= max ? v : v.slice(0, max);
}

function sanitizeId(id: unknown): string {
  // Keep ids compact & stable; WA accepts arbitrary strings but keep it conservative
  const v = safeStr(id);
  const clean = v.replace(/\s+/g, " ").trim();
  return clip(clean, LIMITS.actionId);
}

// ===============================
// ✅ Meta error parsing (diagnostic)
// ===============================
function parseMetaError(json: any): { summary: string; fbtraceId?: string; code?: number; subcode?: number } {
  if (!json?.error) return { summary: "Unknown WhatsApp error (no error field)" };

  const e = json.error;
  const code = typeof e.code === "number" ? e.code : undefined;
  const subcode = typeof e.error_subcode === "number" ? e.error_subcode : undefined;
  const fbtraceId = typeof e.fbtrace_id === "string" ? e.fbtrace_id : undefined;

  const parts: string[] = [];
  if (e.type) parts.push(String(e.type));
  if (code != null) parts.push(`code=${code}`);
  if (subcode != null) parts.push(`subcode=${subcode}`);
  if (e.message) parts.push(String(e.message));

  // error_data is often extremely useful (e.g. "details", "messaging_product", "phone_number_id")
  if (e.error_data) {
    try {
      parts.push(`data=${JSON.stringify(e.error_data)}`);
    } catch {
      // ignore
    }
  }

  return {
    summary: parts.join(" | ").trim(),
    fbtraceId,
    code,
    subcode,
  };
}

function isTransientHttpStatus(status: number): boolean {
  // retry-worthy: rate limit / server errors / gateway timeouts
  return status === 429 || (status >= 500 && status <= 599);
}

function shouldRetry(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  // AbortController timeout -> retry
  if (msg.includes("AbortError") || msg.toLowerCase().includes("aborted")) return true;
  return false;
}

// ===============================
// ✅ Local validator (Meta-like guard)
// ===============================
function assertInteractivePayload(payload: any) {
  if (!payload || payload.type !== "interactive") return;

  const it = payload?.interactive;
  const t = it?.type;
  if (!t) throw new Error("interactive.type missing");

  if (t === "button") {
    const body = it?.body?.text;
    if (!safeStr(body)) throw new Error("interactive(button): body.text missing");
    const btns = it?.action?.buttons;
    if (!Array.isArray(btns) || btns.length < 1) throw new Error("interactive(button): no buttons");
    if (btns.length > LIMITS.maxReplyButtons) throw new Error("interactive(button): > 3 buttons");
    for (const b of btns) {
      const id = b?.reply?.id;
      const title = b?.reply?.title;
      if (!safeStr(id) || !safeStr(title)) throw new Error("interactive(button): button id/title missing");
    }
    return;
  }

  if (t === "list") {
    const body = it?.body?.text;
    if (!safeStr(body)) throw new Error("interactive(list): body.text missing");
    const button = it?.action?.button;
    if (!safeStr(button)) throw new Error("interactive(list): action.button missing");

    const sections = it?.action?.sections;
    if (!Array.isArray(sections) || sections.length < 1) throw new Error("interactive(list): no sections");

    let totalRows = 0;
    for (const s of sections) {
      const st = safeStr(s?.title);
      const rows = s?.rows;
      if (!st) throw new Error("interactive(list): section title missing");
      if (!Array.isArray(rows) || rows.length < 1) throw new Error("interactive(list): section rows missing/empty");
      totalRows += rows.length;

      for (const r of rows) {
        const id = safeStr(r?.id);
        const title = safeStr(r?.title);
        if (!id || !title) throw new Error("interactive(list): row id/title missing");
      }
    }
    if (totalRows < 1) throw new Error("interactive(list): no rows");
    return;
  }

  if (t === "cta_url") {
    const body = it?.body?.text;
    if (!safeStr(body)) throw new Error("interactive(cta_url): body.text missing");
    const url = it?.action?.parameters?.url;
    const display = it?.action?.parameters?.display_text;
    if (!safeStr(display)) throw new Error("interactive(cta_url): display_text missing");
    if (!safeStr(url)) throw new Error("interactive(cta_url): url missing");
    return;
  }

  // Unknown interactive type
  throw new Error(`interactive: unsupported type "${String(t)}"`);
}

// ===============================
// ✅ payload builders validate & clamp
// ===============================
function buildTextPayload(to: string, body: string) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: clip(body, LIMITS.textBody) },
  };
}

function buildReplyButtonsPayload(params: { to: string; body: string; buttons: ReplyButton[]; footerText?: string }) {
  const { to, body, buttons, footerText } = params;

  const safeButtons = (buttons || [])
    .slice(0, LIMITS.maxReplyButtons)
    .map((b) => ({
      type: "reply",
      reply: {
        id: sanitizeId(b.id),
        title: clip(b.title, LIMITS.buttonTitle),
      },
    }))
    // drop empties
    .filter((b) => b.reply.id && b.reply.title);

  return {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: clip(body, LIMITS.interactiveBody) },
      ...(footerText ? { footer: { text: clip(footerText, LIMITS.footerText) } } : {}),
      action: { buttons: safeButtons },
    },
  };
}

function buildListPayload(params: {
  to: string;
  body: string;
  buttonText: string;
  sections: ListSection[];
  headerText?: string;
  footerText?: string;
}) {
  const { to, body, buttonText, sections, headerText, footerText } = params;

  const safeSections = (sections || [])
    .slice(0, LIMITS.maxSections)
    .map((s) => {
      const rows = (s.rows || [])
        .slice(0, LIMITS.maxRowsPerSection)
        .map((r) => ({
          id: sanitizeId(r.id),
          title: clip(r.title, LIMITS.listRowTitle),
          ...(r.description ? { description: clip(r.description, LIMITS.listRowDesc) } : {}),
        }))
        .filter((r) => r.id && r.title);

      return {
        title: clip(s.title, LIMITS.listSectionTitle),
        rows,
      };
    })
    .filter((s) => s.title && Array.isArray(s.rows) && s.rows.length > 0);

  return {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      ...(headerText ? { header: { type: "text", text: clip(headerText, LIMITS.headerText) } } : {}),
      body: { text: clip(body, LIMITS.interactiveBody) },
      ...(footerText ? { footer: { text: clip(footerText, LIMITS.footerText) } } : {}),
      action: {
        button: clip(buttonText, LIMITS.buttonText),
        sections: safeSections,
      },
    },
  };
}

function buildCtaUrlPayload(params: { to: string; body: string; displayText: string; url: string; footerText?: string }) {
  const { to, body, displayText, url, footerText } = params;

  // URL: keep as-is but trim whitespace
  const safeUrl = safeStr(url);

  return {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: { text: clip(body, LIMITS.interactiveBody) },
      ...(footerText ? { footer: { text: clip(footerText, LIMITS.footerText) } } : {}),
      action: {
        name: "cta_url",
        parameters: {
          display_text: clip(displayText, LIMITS.buttonText),
          url: safeUrl,
        },
      },
    },
  };
}

// ===============================
// ✅ send core (retry only transient)
// ===============================
async function sendToWhatsApp(payload: any): Promise<SendResult> {
  // Local validator (works for both mock + real; catches errors early)
  assertInteractivePayload(payload);

  // MOCK MODE
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    const fakeId = "mock-" + Date.now();

    console.log("📨 MOCK WhatsApp send");
    console.log("To:", payload?.to);
    console.log("Type:", payload?.type, "InteractiveType:", payload?.interactive?.type);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    mockWrite(payload);

    return { providerMessageId: fakeId };
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        BASE_URL,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        REQUEST_TIMEOUT
      );

      // Read as text first => lets us debug non-json bodies
      const rawText = await res.text().catch(() => "");
      const json = rawText ? JSON.parse(rawText) : {};

      if (!res.ok) {
        const meta = parseMetaError(json);
        const msg =
          `WhatsApp send failed (${res.status}): ${meta.summary}` +
          (meta.fbtraceId ? ` | fbtrace_id=${meta.fbtraceId}` : "");

        // retry only on transient HTTP statuses
        if (isTransientHttpStatus(res.status) && attempt < MAX_RETRIES - 1) {
          const delay = jitter(800 * Math.pow(2, attempt));
          console.warn(`WhatsApp transient error, retry in ${delay}ms ->`, msg);
          await sleep(delay);
          continue;
        }

        throw new Error(msg);
      }

      const providerMessageId = json?.messages?.[0]?.id;
      if (!providerMessageId) {
        // This is usually non-retriable; still allow one retry if response shape is weird
        if (attempt < MAX_RETRIES - 1) {
          const delay = jitter(500 * Math.pow(2, attempt));
          console.warn(`WhatsApp response missing id, retry in ${delay}ms`);
          await sleep(delay);
          continue;
        }
        throw new Error("WhatsApp send OK but no message id");
      }

      return { providerMessageId };
    } catch (err) {
      // Retry only for abort/timeout/network-ish errors
      if (attempt < MAX_RETRIES - 1 && shouldRetry(err)) {
        const delay = jitter(800 * Math.pow(2, attempt));
        console.warn(`WhatsApp retry in ${delay}ms`, err);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }

  throw new Error("WhatsApp send unreachable");
}

// ===============================
// ✅ Public API
// ===============================
export async function sendTextMessage(to: string, body: string): Promise<SendResult> {
  return sendToWhatsApp(buildTextPayload(to, body));
}

export type ReplyButton = {
  id: string;
  title: string;
};

export async function sendReplyButtonsMessage(params: {
  to: string;
  body: string;
  buttons: ReplyButton[];
  footerText?: string;
}): Promise<SendResult> {
  const payload = buildReplyButtonsPayload(params);

  // Hard guard: if no valid buttons, degrade to text
  const btns = payload?.interactive?.action?.buttons ?? [];
  if (!btns.length) {
    return sendTextMessage(params.to, clip(params.body, LIMITS.textBody));
  }

  return sendToWhatsApp(payload);
}

export type ListRow = {
  id: string;
  title: string;
  description?: string;
};

export type ListSection = {
  title: string;
  rows: ListRow[];
};

export async function sendListMessage(params: {
  to: string;
  body: string;
  buttonText: string;
  sections: ListSection[];
  headerText?: string;
  footerText?: string;
}): Promise<SendResult> {
  const payload = buildListPayload(params);

  // Hard guard: if sections got emptied by sanitation, degrade to text
  const sections = payload?.interactive?.action?.sections ?? [];
  if (!sections.length) {
    return sendTextMessage(params.to, clip(params.body, LIMITS.textBody));
  }

  return sendToWhatsApp(payload);
}

export async function sendCtaUrlMessage(params: {
  to: string;
  body: string;
  displayText: string;
  url: string;
  footerText?: string;
}): Promise<SendResult> {
  const payload = buildCtaUrlPayload(params);

  // Guard: if URL empty, degrade to text
  if (!payload?.interactive?.action?.parameters?.url) {
    return sendTextMessage(params.to, clip(params.body, LIMITS.textBody));
  }

  return sendToWhatsApp(payload);
}