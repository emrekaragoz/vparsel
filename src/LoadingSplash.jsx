import React, { useEffect, useState } from "react";
import logo from "./assets/resim.webp";

export default function LoadingSplash({ minDuration = 2000 }) {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(() => setShow(false), 1100); // fade süresiyle uyumlu
    }, minDuration);
    return () => clearTimeout(timer);
  }, [minDuration]);

  if (!show) return null;
  return (
    <div className={`splash-root${fade ? " splash-fadeout" : ""}`}>
      <div className={`splash-img-wrap${fade ? " splash-img-move" : ""}`}>
        <img
          src={logo}
          alt="Yükleniyor..."
          className="splash-img"
          draggable={false}
          style={{ objectFit: "contain", imageRendering: "auto" }}
        />
        {!fade && (
          <>
            <div className="splash-title">Parsel Sorgulama</div>
            <div className="splash-dots" aria-label="Yükleniyor">
              <span className="splash-dot">.</span>
              <span className="splash-dot">.</span>
              <span className="splash-dot">.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
