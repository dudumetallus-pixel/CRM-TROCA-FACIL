import { describe, expect, it } from "vitest";
import {
  canCountAttributedSale,
  fromManual,
  fromMetaReferral,
  fromUTM,
  preserveFirstTouch,
} from "./attribution";

describe("origem de leads Troca Fácil", () => {
  it("usa referral real da Meta sem inventar o nome da campanha", () => {
    const lead = fromMetaReferral(
      { source_id: "123", source_type: "ad", ctwa_clid: "abc" },
      "2026-11-01T12:00:00.000Z",
    );
    expect(lead).toMatchObject({
      channel: "meta_ads", evidence: "meta_referral",
      sourceId: "123", clickId: "abc", utmCampaign: null,
    });
  });

  it("não classifica como campanha sem identificador", () => {
    expect(fromMetaReferral({ source_type: "ad" }, "2026-11-01T12:00:00Z")).toBeNull();
  });

  it("normaliza origem do Instagram pago e mantém UTMs explícitas", () => {
    expect(fromUTM(
      { utm_source: "instagram", utm_medium: "paid_social", utm_campaign: "black-friday" },
      "2026-11-01T12:00:00Z",
    )).toMatchObject({ channel: "meta_ads", utmCampaign: "black-friday" });
  });

  it("não sobrescreve primeira origem conhecida por retorno posterior", () => {
    const first = fromManual("referral", "2026-11-01T12:00:00Z");
    const later = fromManual("google", "2026-11-02T12:00:00Z");
    expect(preserveFirstTouch(first, later)).toBe(first);
  });

  it("substitui origem desconhecida quando aparece evidência", () => {
    const first = fromManual("unknown", "2026-11-01T12:00:00Z");
    const later = fromManual("store", "2026-11-02T12:00:00Z");
    expect(preserveFirstTouch(first, later)).toBe(later);
  });

  it("só conta venda confirmada no ERP", () => {
    expect(canCountAttributedSale({ status: "confirmed", erpSaleId: "sale-1", amountCents: 100000 })).toBe(true);
    expect(canCountAttributedSale({ status: "proposed", erpSaleId: "sale-1", amountCents: 100000 })).toBe(false);
    expect(canCountAttributedSale({ status: "confirmed", erpSaleId: null, amountCents: 100000 })).toBe(false);
  });
});
