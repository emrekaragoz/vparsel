import React, { useContext, useMemo, useState } from "react";
import useParcels from "../../hooks/useParcels";
import { ParcelContext } from "../../contexts/ParcelContext";
import logo from "../../assets/resim.webp";

export default function Sidebar() {
  const { parcels } = useParcels();
  const { selectedParcel, setSelectedParcel } = useContext(ParcelContext);

  const [search, setSearch] = useState("");

  // Arama filtresi (mahalle/ada/parsel)
  const filteredParcels = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return parcels;
    return parcels.filter((parcel) => {
      const mahalle = (parcel.mahalle || "").toLowerCase();
      const ada = String(parcel.ada || "").toLowerCase();
      const parsel = String(parcel.parsel || "").toLowerCase();
      return mahalle.includes(s) || ada.includes(s) || parsel.includes(s);
    });
  }, [parcels, search]);

  return (
    <div className="sidebar">
      {/* Logo */}
      <div
        style={{
          background: "#fff",
          padding: "16px 0",
          borderRadius: "12px",
          boxShadow: "0 2px 8px #0001",
          textAlign: "center",
          marginBottom: 18,
        }}
      >
        <img
          src={logo}
          alt="Logo"
          style={{
            height: 60,
            objectFit: "contain",
            margin: "0 auto",
            display: "block",
            background: "#fff",
          }}
        />
      </div>

      {/* Arama */}
      <input
        type="text"
        placeholder="Mahalle, ada, parsel ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          marginBottom: "10px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />

      {/* Liste */}
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {filteredParcels.length ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {filteredParcels.map((parcel) => {
              const isSelected = parcel.id === selectedParcel;
              return (
                <li
                  key={parcel.id}
                  onClick={() => setSelectedParcel(parcel.id)}
                  style={{
                    padding: "6px 8px",
                    marginBottom: "4px",
                    borderRadius: "6px",
                    background: isSelected ? "#007bff" : "#f8f9fa",
                    color: isSelected ? "#fff" : "#333",
                    cursor: "pointer",
                  }}
                >
                  {parcel.mahalle} – Ada: {parcel.ada}, Parsel: {parcel.parsel}
                </li>
              );
            })}
          </ul>
        ) : (
          <p style={{ color: "#666" }}>Sonuç bulunamadı.</p>
        )}
      </div>
    </div>
  );
}
