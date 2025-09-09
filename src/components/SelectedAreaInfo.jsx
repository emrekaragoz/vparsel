import React, { useMemo, useState, useContext, useRef, useEffect } from "react";
import useParcels from "../hooks/useParcels.js";
import { ParcelContext } from "../contexts/ParcelContext.jsx";
import logo from "../assets/resim.webp";

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

function Section({ title, children, className = "" }) {
  return (
    <section className={`sai-card ${className}`}>
      <div className="sai-card-title">{title}</div>
      <div className="sai-card-body">{children}</div>
    </section>
  );
}

export default function SelectedAreaInfo({ parcel }) {
  const { parcels } = useParcels();
  const { selectedParcel, setSelectedParcel, groupMode, groupedParcels } = useContext(ParcelContext);

  const [openList, setOpenList] = useState(false);
  
  // ===== DRAG (logodan tut) =====
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);
  const startOffsetRef = useRef(0);
  const maxOffsetRef = useRef(0);
  useEffect(() => {
    const onResize = () =>
      (maxOffsetRef.current = Math.round(window.innerHeight * 0.6));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const onPointerMove = (e) => {
    const y = e.clientY ?? (e.touches?.[0]?.clientY || 0);
    let next = startOffsetRef.current + (y - startYRef.current);
    next = Math.max(0, Math.min(next, maxOffsetRef.current));
    setOffset(next);
  };
  const endDrag = () => {
    const max = maxOffsetRef.current;
    setDragging(false);
    setOffset((prev) => (prev > max * 0.55 ? max : 0));
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
  };
  const startDrag = (e) => {
    e.preventDefault();
    setDragging(true);
    startYRef.current = e.clientY ?? (e.touches?.[0]?.clientY || 0);
    startOffsetRef.current = offset;
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", endDrag, { passive: true });
  };

  // ===== Kaynak veri: tekli mi çoklu mu? =====
  const selectedList = useMemo(() => {
    if (groupMode) {
      return parcels.filter((p) => groupedParcels.includes(p.id));
    }
    return parcel ? [parcel] : [];
  }, [groupMode, groupedParcels, parcels, parcel]);

  // Birleştirilmiş alan, ağaç/fidan ve tür dağılımı
  const combined = useMemo(() => {
    let alanM2 = 0;
    let agacToplam = 0;
    let fidanToplam = 0;
    const agacMap = new Map(); // tür -> adet
    const fidanMap = new Map();

    selectedList.forEach((p) => {
      const props = p.properties ?? p ?? {};
      const info = p.info ?? {};
      alanM2 += toFloatFlexible(props.alan ?? p.alan);

      const ag = info.agac || {};
      const fd = info.fidan || {};
      for (const [k, v] of Object.entries(ag)) {
        const n = toFloatFlexible(v);
        if (n > 0) {
          agacToplam += n;
          agacMap.set(k, (agacMap.get(k) || 0) + n);
        }
      }
      for (const [k, v] of Object.entries(fd)) {
        const n = toFloatFlexible(v);
        if (n > 0) {
          fidanToplam += n;
          fidanMap.set(k, (fidanMap.get(k) || 0) + n);
        }
      }
    });

    const agacList = Array.from(agacMap.entries()).sort((a, b) => b[1] - a[1]);
    const fidanList = Array.from(fidanMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    return { alanM2, agacToplam, fidanToplam, agacList, fidanList };
  }, [selectedList]);

  // Tekli görünüm için ilk öğenin meta bilgileri
  const firstProps = selectedList[0]?.properties ?? selectedList[0] ?? {};
  const infoFirst = selectedList[0]?.info ?? {};
  const mahalle = firstProps.mahalleAd ?? firstProps.mahalle ?? "-";
  const ada = firstProps.adaNo ?? firstProps.ada ?? "-";
  const parselNo = firstProps.parselNo ?? firstProps.parsel ?? "-";
  const tanim = infoFirst.tanim || firstProps.tanim || "-";

  // Metrikler (tekli ve grup için farklı hesaplama)
  const AVG_TREE_AREA_M2 = 36; // ihtiyaca göre değiştir
  let donumVal = 0;
  let totalTrees = 0;
  let plantableCount = 0;
  let treesPerDonum = 0;
  let occupancyPct = 0;

  if (groupMode && selectedList.length > 1) {
    // Grup seçimi: her metrik ayrı ayrı hesaplanıp ortalanacak/toplanacak
    let donumSum = 0;
    let treesPerDonumSum = 0;
    let occupancySum = 0;
    let plantableSum = 0;
    let validCount = 0;
    selectedList.forEach((p) => {
      const props = p.properties ?? p ?? {};
      const info = p.info ?? {};
      const alanM2 = toFloatFlexible(props.alan ?? p.alan);
      const donum = alanM2 > 0 ? alanM2 / 1000 : 0;
      const agacTop = Object.values(info.agac || {}).reduce((s, v) => s + toFloatFlexible(v), 0);
      const fidanTop = Object.values(info.fidan || {}).reduce((s, v) => s + toFloatFlexible(v), 0);
      const total = agacTop + fidanTop;
      const used = total * AVG_TREE_AREA_M2;
      const free = Math.max(0, alanM2 - used);
      const plantable = Math.floor(free / AVG_TREE_AREA_M2);
      const tpd = donum > 0 ? total / donum : 0;
      const occ = alanM2 > 0 ? Math.min(100, (used / alanM2) * 100) : 0;
      donumSum += donum;
      treesPerDonumSum += tpd;
      occupancySum += occ;
      plantableSum += plantable;
      validCount++;
    });
    donumVal = donumSum;
    treesPerDonum = validCount > 0 ? treesPerDonumSum / validCount : 0;
    occupancyPct = validCount > 0 ? occupancySum / validCount : 0;
    plantableCount = plantableSum; // SUM for group
    totalTrees = combined.agacToplam + combined.fidanToplam;
  } else {
    // Tekli veya tekli grup
    donumVal = combined.alanM2 > 0 ? combined.alanM2 / 1000 : 0;
    totalTrees = combined.agacToplam + combined.fidanToplam;
    const usedArea = totalTrees * AVG_TREE_AREA_M2;
    const freeArea = Math.max(0, combined.alanM2 - usedArea);
    plantableCount = Math.floor(freeArea / AVG_TREE_AREA_M2);
    treesPerDonum = donumVal > 0 ? totalTrees / donumVal : 0;
    occupancyPct = combined.alanM2 > 0 ? Math.min(100, (usedArea / combined.alanM2) * 100) : 0;
  }

  return (
    <div
      style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 9990 }}
    >
      <div
        className={`sai-draggable ${dragging ? "dragging" : ""}`}
        style={{ transform: `translateY(${offset}px)` }}
      >
        <div style={{ maxWidth: 1100, margin: "8px auto" }}>
          <div className="sai-panel sai-scroll">
            {/* Başlık */}
            <div className="sai-head sai-head-3">
              <div className="sai-head-left">
                {groupMode ? `(Seçili: ${selectedList.length} Alan)` : ""}
              </div>

              <div
                className="sai-head-center"
                onPointerDown={startDrag}
                style={{ touchAction: "none" }}
              >
                <img src={logo} alt="Logo" className="sai-head-logo" />
              </div>

              <div className="sai-head-right">
                <button
                  type="button"
                  className="sai-btn"
                  onClick={() => setOpenList(true)}
                >
                  Parsel Listeleri
                </button>
              </div>
            </div>

            {selectedList.length ? (
              <>
                {/* Üst satır: Tanım • Parsel • Dönüm */}
                <div className="sai-row-3">
                  <Section title="Tanım">
                    <div className="sai-desc">
                      {groupMode ? tanim : infoFirst.tanim || "-"}
                    </div>
                  </Section>

                  <Section title="">
                    <div className="sai-kv">
                      <div>
                        <span className="key">Mahalle</span>
                        <span className="val">{mahalle}</span>
                      </div>
                      <div>
                        <span className="key">Ada / Parsel</span>
                        <span className="val">
                          {groupMode
                            ? `${selectedList.length} parsel`
                            : `${ada} / ${parselNo}`}
                        </span>
                      </div>
                    </div>
                  </Section>

                  <Section title="">
                    <div className="sai-metric">
                      {donumVal ? `${nfArea.format(donumVal)} dönüm` : "-"}
                    </div>
                    <div className="sai-sub">
                      ≈ {nfArea.format(combined.alanM2)} m²
                    </div>
                  </Section>
                </div>

                {/* 3 metrik: Dönüme düşen • Dikilebilir • Doluluk */}
                <div className="sai-row-3">
                  <Section title="Dönüme Düşen Ağaç">
                    <div className="sai-metric">
                      {donumVal ? nfArea.format(treesPerDonum) : "-"}
                    </div>
                  </Section>
                  <Section title="Kaç Fidan Dikilebilir?">
                    <div className="sai-metric">
                      {nfInt.format(plantableCount)}
                    </div>
                  </Section>
                  <Section title="Doluluk">
                    <div className="sai-metric">
                      {nfArea.format(occupancyPct)}%
                    </div>
                  </Section>
                </div>
                {/* Ağaç • Fidan (birleşik listeler) */}
                <div className="sai-row">
                  <Section
                    title={`🌳Ağaç • Toplam ${nfInt.format(combined.agacToplam)}`}
                  >
                    {combined.agacList.length ? (
                      <ul className="sai-list">
                        {combined.agacList.map(([name, n]) => (
                          <li key={`ag-${name}`} className="sai-list-item">
                            <span className="sai-list-name">
                              {(name || "-").toString().toUpperCase("tr-TR")}
                            </span>
                            <span className="sai-count-badge">
                              {nfInt.format(n)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="sai-sub">Kayıtlı ağaç yok.</div>
                    )}
                  </Section>

                  <Section
                    title={`🌱Fidan • Toplam ${nfInt.format(
                      combined.fidanToplam
                    )}`}
                  >
                    {combined.fidanList.length ? (
                      <ul className="sai-list">
                        {combined.fidanList.map(([name, n]) => (
                          <li key={`fd-${name}`} className="sai-list-item">
                            <span className="sai-list-name">
                              {(name || "-").toString().toUpperCase("tr-TR")}
                            </span>
                            <span className="sai-count-badge">
                              {nfInt.format(n)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="sai-sub">Kayıtlı fidan yok.</div>
                    )}
                  </Section>
                </div>

              </>
            ) : (
              <div className="sai-empty">
                Henüz seçim yok. Haritadan parsel seçin.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Parsel Listeleri Modal (değişmeden kalabilir) ===== */}
      <div className={`plist-root ${openList ? "open" : ""}`}>
        <div className="plist-backdrop" onClick={() => setOpenList(false)} />
        <div
          className="plist-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Parsel Listeleri"
        >
          <div className="plist-header">
            <div className="plist-title">Parsel Listeleri</div>
            <button className="plist-close" onClick={() => setOpenList(false)}>
              Kapat
            </button>
          </div>

          <div className="plist-list">
            {parcels.map((p) => {
              const pr = p.properties || {};
              const tanim = (p.info && p.info.tanim) || pr.tanim || "-";
              const adaNo = pr.adaNo ?? p.ada ?? "-";
              const parNo = pr.parselNo ?? p.parsel ?? "-";
              const alan = pr.alan ?? p.alan ?? "-";

              // Doluluk progress renk geçişli (0% kırmızı -> 100% yeşil)
              const aM2 = toFloatFlexible(alan);
              const agacTop = Object.values(p.info?.agac || {}).reduce(
                (s, v) => s + toFloatFlexible(v),
                0
              );
              const fidanTop = Object.values(p.info?.fidan || {}).reduce(
                (s, v) => s + toFloatFlexible(v),
                0
              );
              const used = (agacTop + fidanTop) * 36;
              const pct = aM2 > 0 ? Math.min(100, (used / aM2) * 100) : 0;
              const red = [239, 68, 68],
                green = [34, 197, 94];
              const t = pct / 100,
                mix = red.map((r, i) => Math.round(r + (green[i] - r) * t));
              const barColor = `rgb(${mix.join(",")})`;

              return (
                <div
                  key={p.id}
                  className="plist-item"
                  onClick={() => {
                    setSelectedParcel(p.id);
                    setOpenList(false);
                  }}
                  title="Parseli seç"
                >
                  <div className="plist-row-1">{tanim}</div>
                  <div className="plist-row-2">
                    <span className="pill-inline">
                      Ada/Parsel: {adaNo} / {parNo}
                    </span>
                    <span className="pill-inline">
                      Alan: {nfInt.format(toFloatFlexible(alan))} m²
                    </span>
                    <span
                      className="pill-progress"
                      role="img"
                      aria-label={`Doluluk ${Math.round(pct)}%`}
                    >
                      <span
                        className="pill-progress-fill"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                      <span className="pill-progress-label">
                        {Math.round(pct)}%
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* ===== /Modal ===== */}
    </div>
  );
}
