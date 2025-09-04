import React, { useMemo, useState, useContext } from "react";
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
  const { setSelectedParcel } = useContext(ParcelContext);
  const [openList, setOpenList] = useState(false);

  const props = parcel?.properties ?? parcel ?? {};
  const info = parcel?.info ?? {};

  const mahalle = props.mahalleAd ?? props.mahalle ?? "-";
  const ada = props.adaNo ?? props.ada ?? "-";
  const parsel = props.parselNo ?? props.parsel ?? "-";
  const alanRaw = props.alan ?? null;

  const alanM2 = toFloatFlexible(alanRaw);
  const donumVal = alanM2 > 0 ? alanM2 / 1000 : 0;

  const agacObj = info.agac || {};
  const fidanObj = info.fidan || {};

  const agacList = useMemo(
    () =>
      Object.entries(agacObj)
        .map(([k, v]) => [k, toFloatFlexible(v)])
        .filter(([, n]) => n > 0),
    [agacObj]
  );
  const fidanList = useMemo(
    () =>
      Object.entries(fidanObj)
        .map(([k, v]) => [k, toFloatFlexible(v)])
        .filter(([, n]) => n > 0),
    [fidanObj]
  );

  const agacToplam = agacList.reduce((s, [, n]) => s + n, 0);
  const fidanToplam = fidanList.reduce((s, [, n]) => s + n, 0);

  const agacSorted = useMemo(
    () => [...agacList].sort((a, b) => b[1] - a[1]),
    [agacList]
  );
  const fidanSorted = useMemo(
    () => [...fidanList].sort((a, b) => b[1] - a[1]),
    [fidanList]
  );

  return (
    <div
      style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 9990 }}
    >
      <div style={{ maxWidth: 1100, margin: "2px auto" }}>
        <div className="sai-panel sai-scroll">
          {/* Başlık + sağda küçük buton */}
          <div className="sai-head sai-head-3">
            <div className="sai-head-left"></div>

            <div className="sai-head-center">
              <img src={logo} alt="Logo" className="sai-head-logo" />
            </div>

            <div className="sai-head-right">
              <button
                type="button"
                className="sai-btn"
                onClick={() => setOpenList(true)}
                title="Parsel Listeleri"
              >
                Parsel Listeleri
              </button>
            </div>
          </div>

          {parcel ? (
            <>
              {/* 🔹 TANIM • PARSEL • DÖNÜM → AYNI SATIR */}
              <div className="sai-row-3">
                <Section title="">
                  <div className="sai-kv">
                    <div>
                      <span className="key">Mahalle</span>
                      <span className="val">{mahalle}</span>
                    </div>
                    <div>
                      <span className="key">Ada / Parsel</span>
                      <span className="val">
                        {ada} / {parsel}
                      </span>
                    </div>
                  </div>
                </Section>
                <Section title="">
                  <div className="sai-kv">
                    <div>
                      <span className="key">Tanım</span>
                      <span className="val">{info.tanim || "-"}</span>
                    </div>
                  </div>
                  <div className="sai-desc">{}</div>
                </Section>

                <Section title="">
                  <div className="sai-metric">
                    {donumVal ? `${nfArea.format(donumVal)} dönüm` : "-"}
                  </div>
                  {alanM2 ? (
                    <div className="sai-sub">≈ {nfArea.format(alanM2)} m²</div>
                  ) : null}
                </Section>
              </div>

              {/* 🔹 AĞAÇ • FİDAN → ALT SATIR, YAN YANA (dikey liste) */}
              <div className="sai-row">
                <Section title="">
                  <div className="sai-box tree">
                    <div className="sai-box-head">
                      <span className="sai-box-icon">🌳</span>
                      <span className="sai-box-title">Ağaç</span>
                      <span className="sai-box-total">
                        {nfInt.format(agacToplam)}
                      </span>
                    </div>
                    {agacSorted.length ? (
                      <ul className="sai-list">
                        {agacSorted.map(([name, n]) => (
                          <li key={`ag-${name}`} className="sai-list-item">
                            <span className="sai-list-name">
                              {(name || "-").toString().toUpperCase("tr-TR")}
                            </span>
                            <span className="sai-count-badge">
                              {" : " + nfInt.format(n)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="sai-sub">Kayıtlı ağaç çeşidi yok.</div>
                    )}
                  </div>
                </Section>

                <Section title="">
                  <div className="sai-box sapling">
                    <div className="sai-box-head">
                      <span className="sai-box-icon">🌱</span>
                      <span className="sai-box-title">Fidan</span>
                      <span className="sai-box-total">
                        {nfInt.format(fidanToplam)}
                      </span>
                    </div>
                    {fidanSorted.length ? (
                      <ul className="sai-list">
                        {fidanSorted.map(([name, n]) => (
                          <li key={`fd-${name}`} className="sai-list-item">
                            <span className="sai-list-name">
                              {(name || "-").toString().toUpperCase("tr-TR")}
                            </span>
                            <span className="sai-count-badge">
                              {" : " + nfInt.format(n)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="sai-sub">Kayıtlı fidan çeşidi yok.</div>
                    )}
                  </div>
                </Section>
              </div>
            </>
          ) : (
            <div className="sai-empty">
              Henüz bir alan seçilmedi. Haritadan bir poligon seçin.
            </div>
          )}
        </div>
      </div>

      {/* ===== Parsel Listeleri Modal ===== */}
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
                    <span className="pill-inline">Alan: {alan} m²</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* ===== /Parsel Listeleri Modal ===== */}
    </div>
  );
}

