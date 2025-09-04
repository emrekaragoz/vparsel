import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // <-- ekle
import App from "./App.jsx";
import { ParcelProvider } from "./contexts/ParcelContext.jsx";

import "./styles.css";
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter basename="/vparsel">   {/* GitHub Pages alt dizini */}
    <ParcelProvider>
      <App />
    </ParcelProvider>
  </BrowserRouter>
);
