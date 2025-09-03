import React, { useMemo } from "react";

/** Alt detay paneli (bottom sheet).
 *  parcel: GeoJSON Feature --> { properties, info, ... }
 *  onClose: panel kapatma
 */
export default function ParcelDetail({ parcel, onClose }) {
  if (!parcel) return null;

  const p = parcel.properties ?? {};
  const info = parcel.info ?? {};
  const agac = info.agac ?? {};
  const fidan = info.fidan ?? {};

  // 0'dan büyük olan türleri filtrele
  const agacList = useMemo(
    () => Object.entries(agac).filter(([, v]) => Number(v) > 0),
    [agac]
  );
  const fidanList = useMemo(
    () => Object.entries(fidan).filter(([, v]) => Number(v) > 0),
    [fidan]
  );

  const hasTrees = agacList.length > 0 || fidanList.length > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] px-3 sm:px-4">
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-black/30 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* sheet */}
      <div className="mx-auto max-w-3xl rounded-t-2xl bg-white shadow-xl ring-1 ring-black/5">
        {/* drag handle & close */}
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-gray-200" />
          <button
            onClick={onClose}
            className="ml-auto rounded-lg px-2.5 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100"
            aria-label="Kapat"
          >
            Kapat
          </button>
        </div>

        <div className="px-4 pb-4 sm:px-6">
          {/* başlık */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {p.mevkii ? `${p.mahalleAd} • ${p.mevkii}` : p.mahalleAd}
            </h2>
            <span className="inline-flex w-fit items-center rounded-full border border-gray-200 px-3 py-1 text-xs sm:text-sm font-medium text-gray-700">
              Ada/Parsel: {p.adaNo} / {p.parselNo}
            </span>
          </div>

          {/* özet rozetleri */}
          <div className="mt-2 flex flex-wrap gap-2 text-xs sm:text-sm">
            {p.ilAd && p.ilceAd && (
              <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-gray-200">
                {p.ilAd} / {p.ilceAd}
              </span>
            )}
            {p.pafta && (
              <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-gray-200">
                Pafta: {p.pafta}
              </span>
            )}
            {info.tanim && (
              <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-gray-200">
                Tanım: {info.tanim}
              </span>
            )}
          </div>

          {/* bilgiler */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="text-gray-500">Alan</div>
              <div className="font-semibold">{p.alan} m²</div>
            </div>
            {p.zeminKmdurum && (
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-gray-500">Zemin</div>
                <div className="font-semibold">{p.zeminKmdurum}</div>
              </div>
            )}
            {p.nitelik && (
              <div className="rounded-xl bg-gray-50 p-3 sm:col-span-2">
                <div className="text-gray-500">Nitelik</div>
                <div className="font-semibold">{p.nitelik}</div>
              </div>
            )}
          </div>

          {/* ağaç / fidan (yalnızca >0 ise) */}
          {hasTrees && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Ağaç / Fidan
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                {agacList.map(([k, v]) => (
                  <div
                    key={`agac-${k}`}
                    className="rounded-lg bg-green-50 p-2 ring-1 ring-green-100"
                  >
                    <div className="text-gray-600">Ağaç • {k}</div>
                    <div className="font-semibold">{v}</div>
                  </div>
                ))}
                {fidanList.map(([k, v]) => (
                  <div
                    key={`fidan-${k}`}
                    className="rounded-lg bg-amber-50 p-2 ring-1 ring-amber-100"
                  >
                    <div className="text-gray-600">Fidan • {k}</div>
                    <div className="font-semibold">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* açıklama/özet */}
          {p.ozet && (
            <p className="mt-4 text-sm text-gray-700 leading-6">{p.ozet}</p>
          )}
        </div>
      </div>
    </div>
  );
}
