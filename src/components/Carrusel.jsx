import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

const DEFAULT_INTERVAL = 3000;

const Carrusel = ({ images = [], interval = DEFAULT_INTERVAL }) => {
  const location = useLocation();
  const isCarritoPage = useMemo(
    () => location.pathname.includes("/carrito"),
    [location.pathname]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [imagesState, setImagesState] = useState([
    { src: "", visible: true },
    { src: "", visible: false },
  ]);

  useEffect(() => {
    if (images.length > 0) {
      setImagesState([
        { src: images[0], visible: true },
        { src: "", visible: false },
      ]);
    }
  }, [images]);

  useEffect(() => {
    if (images.length <= 1) return;

    const fadeDuration = 500;
    const visibleDuration = interval - fadeDuration;

    const timer = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      const nextLayer = currentLayer === 0 ? 1 : 0;

      setImagesState((prev) => {
        const updated = [...prev];
        updated[nextLayer] = { src: images[nextIndex], visible: true };
        updated[currentLayer] = { ...updated[currentLayer], visible: false };
        return updated;
      });

      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setCurrentLayer(nextLayer);
      }, fadeDuration);
    }, visibleDuration);

    return () => clearTimeout(timer);
  }, [currentIndex, images, currentLayer, interval]);

  return (
    <div className="w-full aspect-square bg-gray-100 overflow-hidden relative">
      {imagesState.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt={`Carrusel ${i}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            img.visible ? "opacity-100 z-10" : "opacity-0 z-0"
          } ${isCarritoPage ? "brightness-50" : ""}`}
        />
      ))}

      {/* Overlay con gradiente */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-gray-200 via-gray-200/30 to-transparent z-20 pointer-events-none" />
    </div>
  );
};

export default Carrusel;
