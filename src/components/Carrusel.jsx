import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';

const DEFAULT_INTERVAL = 3000;

const GradientOverlay = ({ position = 'top' }) => (
  <div
    className={`absolute left-0 right-0 h-1/3 ${
      position === 'top'
        ? 'top-0 bg-gradient-to-b from-black to-transparent opacity-30'
        : 'bottom-0 bg-gradient-to-t from-black to-transparent opacity-50'
    }`}
  />
);

const Carrusel = ({ images = [], interval = DEFAULT_INTERVAL }) => {
  const location = useLocation();
  const isCarritoPage = useMemo(
    () => location.pathname.includes('/carrito'),
    [location.pathname]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [imagesState, setImagesState] = useState([
    { src: '', visible: true },
    { src: '', visible: false },
  ]);

  useEffect(() => {
    if (images.length > 0) {
      setImagesState([
        { src: images[0], visible: true },
        { src: '', visible: false },
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

  if (images.length === 0) {
    return (
      <div className="w-full h-[300px] overflow-hidden relative bg-gray-100 flex items-center justify-center"></div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="w-full h-[300px] overflow-hidden relative">
        <img
          src={images[0]}
          alt="Hero"
          className={`absolute top-0 left-0 w-full h-full object-cover z-10 ${
            isCarritoPage ? 'brightness-50' : ''
          }`}
        />
        {!isCarritoPage && (
          <>
            <GradientOverlay position="top" />
            <GradientOverlay position="bottom" />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] overflow-hidden relative">
      {imagesState.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt={`Carrusel ${i}`}
          className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${
            img.visible ? 'opacity-100 z-10' : 'opacity-0 z-0'
          } ${isCarritoPage ? 'brightness-50' : ''}`}
        />
      ))}

      {!isCarritoPage && (
        <>
          <GradientOverlay position="top" />
          <GradientOverlay position="bottom" />
        </>
      )}
    </div>
  );
};

export default Carrusel;
