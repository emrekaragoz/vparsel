import React, { useContext } from "react";
import MapContainer from "./components/Map/MapContainer.jsx";
import SelectedAreaInfo from "./components/SelectedAreaInfo.jsx";
import { ParcelProvider, ParcelContext } from "./contexts/ParcelContext.jsx";
import useParcels from "./hooks/useParcels.js";

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
  return (
    <div className="app-root">
      <ParcelProvider>
        <Shell />
      </ParcelProvider>
    </div>
  );
}
