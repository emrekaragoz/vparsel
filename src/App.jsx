import React, { useContext, useState, useEffect } from "react";
import MapContainer from "./components/Map/MapContainer.jsx";
import SelectedAreaInfo from "./components/SelectedAreaInfo.jsx";
import { ParcelProvider, ParcelContext } from "./contexts/ParcelContext.jsx";
import useParcels from "./hooks/useParcels.js";
import LoadingSplash from "./LoadingSplash.jsx";

function Shell() {
  const { parcels } = useParcels();
  const { selectedParcel } = useContext(ParcelContext);
  const selected = parcels.find((p) => p.id === selectedParcel) || null;

  return (
    <>
      <main className="map-wrap">
        <MapContainer />
      </main>

      {/* Alt panel */}
      <SelectedAreaInfo parcel={selected} />
    </>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="app-root">
      {showSplash && <LoadingSplash minDuration={2000} />}
      <ParcelProvider>
        <Shell />
      </ParcelProvider>
    </div>
  );
}
