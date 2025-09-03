import React, { useContext, useMemo, useState } from "react";
import useParcels from "../hooks/useParcels.js";
import { ParcelContext } from "../contexts/ParcelContext.jsx";

export default function SidebarDrawer({ open, onClose }) {
  const { parcels } = useParcels();
  const { selectedParcel, setSelectedParcel } = useContext(ParcelContext);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return parcels;
    return parcels.filter((p) => {
      const mahalle = (p.mahalle || "").toLowerCase();
      const ada = String(p.ada || "").toLowerCase();
      const parsel = String(p.parsel || "").toLowerCase();
      return mahalle.includes(s) || ada.includes(s) || parsel.includes(s);
    });
  }, [parcels, search]);

  return (
    <div className={`drawer-root ${open ? "open" : ""}`}>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer-panel">
        <div className="drawer-header">
          <div className="drawer-title">Parseller</div>
          <button className="drawer-close" onClick={onClose}>
            Kapat
          </button>
        </div>

        <div className="drawer-search">
          <input
            type="text"
            placeholder="Mahalle, ada, parsel ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="drawer-list">
          {filtered.length ? (
            filtered.map((p) => {
              const isSel = p.id === selectedParcel;
              return (
                <div
                  key={p.id}
                  className={`drawer-item ${isSel ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedParcel(p.id);
                    onClose();
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {p.mahalle || "-"} — Ada: {p.ada || "-"}, Parsel:{" "}
                    {p.parsel || "-"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: isSel ? "rgba(255,255,255,.9)" : "#6b7280",
                    }}
                  >
                    Alan: {p.alan ? `${p.alan} m²` : "-"}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ color: "#6b7280", padding: 6 }}>Sonuç yok.</div>
          )}
        </div>
      </aside>
    </div>
  );
}
