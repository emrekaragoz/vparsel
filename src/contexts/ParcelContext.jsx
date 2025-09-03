import { createContext, useState } from "react";

export const ParcelContext = createContext();

export function ParcelProvider({ children }) {
  const [selectedParcel, setSelectedParcel] = useState(null); // id

  return (
    <ParcelContext.Provider value={{ selectedParcel, setSelectedParcel }}>
      {children}
    </ParcelContext.Provider>
  );
}
