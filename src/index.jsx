import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom"; // 👈 HashRouter
import App from "./App.jsx";
import { ParcelProvider } from "./contexts/ParcelContext.jsx";

import "./styles.css";
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById("root")).render(
  <HashRouter>
    <ParcelProvider>
      <App />
    </ParcelProvider>
  </HashRouter>
);
