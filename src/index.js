import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ParcelProvider } from "./contexts/ParcelContext.jsx";

import "./styles.css";
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById("root")).render(
  <ParcelProvider>
    <App />
  </ParcelProvider>
);
