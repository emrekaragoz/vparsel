import { createContext, useState } from "react";

export const ParcelContext = createContext();

export function ParcelProvider({ children }) {
  const [selectedParcel, setSelectedParcel] = useState(null);

  // Gruplama
  const [groupMode, setGroupMode] = useState(false);
  const [groupedParcels, setGroupedParcels] = useState([]);

  const toggleGroupParcel = (id) => {
    setGroupedParcels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGroupMode = (val) => {
    setGroupMode(val);
    if (val) {
      // grup açılıyorsa tekli seçimi temizle
      setSelectedParcel(null);
    } else {
      // grup kapanıyorsa listeyi temizle
      setGroupedParcels([]);
    }
  };

  return (
    <ParcelContext.Provider
      value={{
        selectedParcel,
        setSelectedParcel,
        groupMode,
        setGroupMode: handleGroupMode,
        groupedParcels,
        setGroupedParcels,
        toggleGroupParcel,
      }}
    >
      {children}
    </ParcelContext.Provider>
  );
}
