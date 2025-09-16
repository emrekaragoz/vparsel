import React, { useMemo, useContext } from "react";
import useParcels from "../hooks/useParcels.js";
import { ParcelContext } from "../contexts/ParcelContext.jsx";

/* ---------- Yardımcılar ---------- */
const toFloatFlexible = (v) => {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  const s = String(v);
  if (s.includes(",")) {
    const cleaned = s
      .replace(/\./g, "")
      .replace(/,/g, ".")
      .replace(/[^\d.-]/g, "");
    return parseFloat(cleaned) || 0;
  }
  const cleaned = s.replace(/,/g, "").replace(/[^\d.-]/g, "");
  return parseFloat(cleaned) || 0;
};
const nfInt = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
const nfArea = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });

const joinText = (arr) =>
  Array.from(
    new Set(
      (arr || [])
        .map((s) => (s == null ? "" : String(s).trim()))
        .filter(Boolean)
    )
  ).join(" / ");

const rangeText = (arr) => {
  const dates = (arr || []).filter(Boolean);
  if (!dates.length) return "-";
  const sorted = [...dates].sort((a, b) => new Date(a) - new Date(b));
  return sorted.length === 1
    ? sorted[0]
    : `${sorted[0]} – ${sorted[sorted.length - 1]}`;
};

/* ---------- Mod tanımları (kolon etiketleri) ---------- */
const MODE_DEFS = {
  ilac: {
    title: "İlaçlama Bilgisi",
    columns: [
      "İlaç Marka",
      "Miktar",
      "Gözlem / Not",
      "Tarih",
      "Durum(Yapıldı,Beklemede,Zamanı Geçti)",
    ],
  },
  hasat: {
    title: "Hasat Haritası",
    columns: [
      "Tür",
      "HasatKg",
      "Gözlem/Not",
      "Tarih",
      "İşçiSayısı",
      "ÇalışılanSaat",
      "ÇıkanYağ",
      "Verim",
    ],
  },
  sayim: {
    title: "Sayım Bilgisi",
    columns: ["Tür", "Ağaç", "Fidan", "Toplam", "Tarih"],
  },
  gubre: {
    title: "Gübreleme",
    columns: [
      "Gübre Cinsi",
      "Miktar",
      "Gözlem/Not",
      "Tarih",
      "Durum(Yapıldı,Beklemede,Zamanı Geçti)",
    ],
  },
};

/* ---------- Özet hesaplayıcılar (çok kayıt → tek satır) ---------- */
function summarizeIlac(list) {
  const marka = [];
  const notlar = [];
  const tarihler = [];
  const durumlar = [];
  let miktarTop = 0;

  list.forEach((p) => {
    const src = p.info?.ilaclama || p.properties?.ilaclama || [];
    (Array.isArray(src) ? src : []).forEach((e) => {
      marka.push(e.marka ?? e.ilac);
      notlar.push(e.not ?? e.gozlem);
      tarihler.push(e.tarih);
      durumlar.push(e.durum);
      miktarTop += toFloatFlexible(e.miktar);
    });
  });

  return {
    "İlaç Marka": joinText(marka) || "-",
    Miktar: miktarTop ? nfArea.format(miktarTop) : "-",
    "Gözlem / Not": joinText(notlar) || "-",
    Tarih: rangeText(tarihler),
    "Durum(Yapıldı,Beklemede,Zamanı Geçti)": joinText(durumlar) || "-",
  };
}

function summarizeHasat(list) {
  const turler = [];
  const notlar = [];
  const tarihler = [];
  let hasatKg = 0;
  let isci = 0;
  let saat = 0;
  let cikanYag = 0;

  list.forEach((p) => {
    const src = p.info?.hasat || p.properties?.hasat || [];
    (Array.isArray(src) ? src : []).forEach((e) => {
      turler.push(e.urun ?? e.tur);
      notlar.push(e.not ?? e.gozlem);
      tarihler.push(e.tarih);
      hasatKg += toFloatFlexible(e.miktar ?? e.hasatKg);
      isci += toFloatFlexible(e.isci ?? e.isciSayisi);
      saat += toFloatFlexible(e.saat ?? e.calisilanSaat);
      cikanYag += toFloatFlexible(e.yag ?? e.cikanYag);
    });
  });

  const verim =
    hasatKg > 0 ? `${nfArea.format((cikanYag / hasatKg) * 100)}%` : "-";

  return {
    Tür: joinText(turler) || "-",
    HasatKg: hasatKg ? nfInt.format(hasatKg) : "-",
    "Gözlem/Not": joinText(notlar) || "-",
    Tarih: rangeText(tarihler),
    İşçiSayısı: isci ? nfInt.format(isci) : "-",
    ÇalışılanSaat: saat ? nfArea.format(saat) : "-",
    ÇıkanYağ: cikanYag ? nfInt.format(cikanYag) : "-",
    Verim: verim,
  };
}

function summarizeSayim(list) {
  // Tür bazlı topla (agac + fidan). Tek satıra sığdırmak için toplamları birleştir.
  const map = new Map(); // tur -> { agac, fidan }
  const tarihler = [];

  list.forEach((p) => {
    const ag = p.info?.agac || {};
    const fd = p.info?.fidan || {};
    const t = p.info?.sayimTarih || p.properties?.sayimTarih;
    if (t) tarihler.push(t);

    for (const [k, v] of Object.entries(ag)) {
      const n = toFloatFlexible(v);
      const o = map.get(k) || { agac: 0, fidan: 0 };
      o.agac += n;
      map.set(k, o);
    }
    for (const [k, v] of Object.entries(fd)) {
      const n = toFloatFlexible(v);
      const o = map.get(k) || { agac: 0, fidan: 0 };
      o.fidan += n;
      map.set(k, o);
    }
  });

  // En baskın türü özet satırına yaz (tek satır gereği)
  const listAgg = Array.from(map.entries()).map(([tur, o]) => ({
    tur,
    agac: o.agac,
    fidan: o.fidan,
    toplam: o.agac + o.fidan,
  }));
  listAgg.sort((a, b) => b.toplam - a.toplam);

  const best = listAgg[0];
  const turText = best
    ? `${best.tur.toUpperCase("tr-TR")} (Toplam ${nfInt.format(best.toplam)})`
    : "-";

  return {
    Tür: turText,
    Ağaç: best ? nfInt.format(best.agac) : "-",
    Fidan: best ? nfInt.format(best.fidan) : "-",
    Toplam: best ? nfInt.format(best.toplam) : "-",
    Tarih: rangeText(tarihler),
  };
}

function summarizeGubre(list) {
  const cins = [];
  const notlar = [];
  const tarihler = [];
  const durumlar = [];
  let miktarTop = 0;

  list.forEach((p) => {
    const src = p.info?.gubre || p.properties?.gubre || [];
    (Array.isArray(src) ? src : []).forEach((e) => {
      cins.push(e.cins ?? e.cinsi ?? e.gubreCinsi);
      notlar.push(e.not ?? e.gozlem);
      tarihler.push(e.tarih);
      durumlar.push(e.durum);
      miktarTop += toFloatFlexible(e.miktar);
    });
  });

  return {
    "Gübre Cinsi": joinText(cins) || "-",
    Miktar: miktarTop ? nfArea.format(miktarTop) : "-",
    "Gözlem/Not": joinText(notlar) || "-",
    Tarih: rangeText(tarihler),
    "Durum(Yapıldı,Beklemede,Zamanı Geçti)": joinText(durumlar) || "-",
  };
}

/* ---------- Basit kart bileşeni ---------- */
function Section({ title, children, className = "" }) {
  return (
    <section className={`sai-card ${className}`}>
      <div className="sai-card-title">{title}</div>
      <div className="sai-card-body">{children}</div>
    </section>
  );
}

/* ======================= ANA BİLEŞEN ======================= */
export default function SelectedAreaInfo({ parcel }) {
  const { parcels } = useParcels();
  const { groupMode, groupedParcels, mapMode } = useContext(ParcelContext);

  /* Seçim listesi (tekli/çoklu) */
  const selectedList = useMemo(() => {
    if (groupMode) return parcels.filter((p) => groupedParcels.includes(p.id));
    return parcel ? [parcel] : [];
  }, [groupMode, groupedParcels, parcels, parcel]);

  /* Üst sabit satır: Tanım • Parsel Bilgisi • Dönüm */
  const base = useMemo(() => {
    let alanM2 = 0;
    selectedList.forEach((p) => {
      const props = p.properties ?? p ?? {};
      alanM2 += toFloatFlexible(props.alan ?? p.alan);
    });
    const donum = alanM2 > 0 ? alanM2 / 1000 : 0;

    const firstProps = selectedList[0]?.properties ?? selectedList[0] ?? {};
    const infoFirst = selectedList[0]?.info ?? {};
    const mahalle = firstProps.mahalleAd ?? firstProps.mahalle ?? "-";
    const ada = firstProps.adaNo ?? firstProps.ada ?? "-";
    const parselNo = firstProps.parselNo ?? firstProps.parsel ?? "-";
    const tanim = infoFirst.tanim || firstProps.tanim || "-";

    return { alanM2, donum, mahalle, ada, parselNo, tanim };
  }, [selectedList]);

  /* Alt tek satır: mapMode’a göre değer üret */
  const modeSummary = useMemo(() => {
    switch (mapMode) {
      case "ilac":
        return summarizeIlac(selectedList);
      case "hasat":
        return summarizeHasat(selectedList);
      case "sayim":
        return summarizeSayim(selectedList);
      case "gubre":
        return summarizeGubre(selectedList);
      default:
        return summarizeIlac(selectedList);
    }
  }, [mapMode, selectedList]);

  const def = MODE_DEFS[mapMode] || MODE_DEFS.ilac;

  return (
    <div
      style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 9990 }}
    >
      <div style={{ maxWidth: 1100, margin: "8px auto" }}>
        <div className="sai-panel">
          {selectedList.length ? (
            <>
              {/* 1) Sabit satır */}
              <div className="sai-row-3">
                <Section title="Tanım">
                  <div className="sai-desc">{base.tanim}</div>
                </Section>

                <Section title="Parsel Bilgisi">
                  <div className="sai-kv">
                    <div>
                      <span className="key">Mahalle</span>
                      <span className="val">{base.mahalle}</span>
                    </div>
                    <div>
                      <span className="key">Ada / Parsel</span>
                      <span className="val">
                        {groupMode
                          ? `${selectedList.length} parsel`
                          : `${base.ada} / ${base.parselNo}`}
                      </span>
                    </div>
                  </div>
                </Section>

                <Section title="Dönüm Bilgisi">
                  <div className="sai-metric">
                    {base.donum ? `${nfArea.format(base.donum)} dönüm` : "-"}
                  </div>
                  <div className="sai-sub">
                    ≈ {nfInt.format(base.alanM2)} m²
                  </div>
                </Section>
              </div>

              {/* 2) Mod satırı — TEK SATIR, soldan sağa sütunlar */}
              <Section title={def.title} className="sai-card mode-one-line">
                <div
                  className="mode-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${def.columns.length}, minmax(0, 1fr))`,
                    gap: 8,
                    alignItems: "start",
                  }}
                >
                  {def.columns.map((col) => (
                    <div key={col} className="mode-cell">
                      <div className="mode-cell-key">{col}</div>
                      <div className="mode-cell-val">
                        {modeSummary[col] != null && modeSummary[col] !== ""
                          ? String(modeSummary[col])
                          : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          ) : (
            <div className="sai-empty">
              Henüz seçim yok. Haritadan parsel seçin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
