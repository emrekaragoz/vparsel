import React from "react";
import MapContainer from "./components/Map/MapContainer.jsx";

export default function App() {
  return (
    <div className="app-root">
      {/* Tam ekran harita */}
      <main className="map-wrap">
        <MapContainer />
      </main>
    </div>
  );
}
