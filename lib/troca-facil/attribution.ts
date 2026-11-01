/**
 * Atribuição de origem — núcleo puro do CRM Troca Fácil.
 *
 * Não infere campanhas a partir de texto livre. Apenas normaliza evidência
 * documentada e preserva a primeira origem conhecida. A gravação dos eventos,
 * resolução de IDs da Meta e conciliação de vendas ficam nas integrações.
 */
export type LeadChannel =
  | "meta_ads" | "instagram_organic" | "facebook_organic"
  | "google" | "website" | "referral" | "store" | "other" | "unknown";

export type AttributionEvidence = "meta_referral" | "utm" | "manual" | "unknown";

export interface LeadAttribution {
  channel: LeadChannel;
  evidence: AttributionEvidence;
  sourceId: string | null;
  sourceType: string | null;
  clickId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  capturedAt: string;
}

export interface MetaReferral {
  source_id?: unknown;
  source_type?: unknown;
  ctwa_clid?: unknown;
}

export interface UTMInput {
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_content?: unknown;
  utm_term?: unknown;
}

function clean(value: unknown, limit = 255): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, limit) : null;
}

function normalizedDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("capturedAt must be an ISO date");
  return d.toISOString();
}

function utmChannel(source: string | null, medium: string | null): LeadChannel {
  const s = source?.toLowerCase() ?? "";
  const m = medium?.toLowerCase() ?? "";
  if (s === "facebook" || s === "instagram" || s === "meta" || s === "fb" || s === "ig") {
    if (["paid", "paid_social", "cpc", "ppc", "ads", "social_paid"].includes(m)) return "meta_ads";
    return s === "facebook" || s === "fb" ? "facebook_organic" : "instagram_organic";
  }
  if (s === "google") return "google";
  if (m === "referral" || s === "indicacao" || s === "indicação") return "referral";
  if (s === "loja" || s === "loja_fisica") return "store";
  if (s === "site" || s === "website" || m === "website") return "website";
  return s ? "other" : "unknown";
}

export function fromMetaReferral(
  referral: MetaReferral | null | undefined,
  capturedAt: string,
): LeadAttribution | null {
  if (!referral) return null;
  const sourceId = clean(referral.source_id, 128);
  const clickId = clean(referral.ctwa_clid, 512);
  const sourceType = clean(referral.source_type, 64);
  // Ausência de evidência identificável não vira atribuição paga.
  if (!sourceId && !clickId) return null;
  return {
    channel: "meta_ads", evidence: "meta_referral",
    sourceId, sourceType, clickId,
    utmSource: null, utmMedium: null, utmCampaign: null,
    utmContent: null, utmTerm: null,
    capturedAt: normalizedDate(capturedAt),
  };
}

export function fromUTM(data: UTMInput, capturedAt: string): LeadAttribution | null {
  const utmSource = clean(data.utm_source);
  const utmMedium = clean(data.utm_medium);
  const utmCampaign = clean(data.utm_campaign);
  const utmContent = clean(data.utm_content);
  const utmTerm = clean(data.utm_term);
  if (![utmSource, utmMedium, utmCampaign, utmContent, utmTerm].some(Boolean)) return null;
  return {
    channel: utmChannel(utmSource, utmMedium),
    evidence: "utm",
    sourceId: null, sourceType: null, clickId: null,
    utmSource, utmMedium, utmCampaign, utmContent, utmTerm,
    capturedAt: normalizedDate(capturedAt),
  };
}

export function fromManual(channel: LeadChannel, capturedAt: string): LeadAttribution {
  return {
    channel, evidence: channel === "unknown" ? "unknown" : "manual",
    sourceId: null, sourceType: null, clickId: null,
    utmSource: null, utmMedium: null, utmCampaign: null,
    utmContent: null, utmTerm: null, capturedAt: normalizedDate(capturedAt),
  };
}

/** First-touch é imutável depois de conhecido; last-touch é evento separado. */
export function preserveFirstTouch(
  previous: LeadAttribution | null | undefined,
  incoming: LeadAttribution | null | undefined,
): LeadAttribution | null {
  if (previous && previous.channel !== "unknown") return previous;
  return incoming ?? previous ?? null;
}

/** Nunca confunda clique ou lead com venda: confirmação vem do ERP. */
export function canCountAttributedSale(sale: {
  status: string;
  erpSaleId: string | null;
  amountCents: number | null;
}): boolean {
  return sale.status === "confirmed"
    && Boolean(sale.erpSaleId?.trim())
    && sale.amountCents !== null
    && Number.isSafeInteger(sale.amountCents)
    && sale.amountCents >= 0;
}
