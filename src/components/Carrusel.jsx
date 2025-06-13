import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import { getClientConfig } from '../firebase/getClientConfig';

import carrusel1 from '../assets/carrusel1.jpg';
import carrusel2 from '../assets/carrusel2.jpg';
import carrusel3 from '../assets/carrusel3.jpg';
import carrusel4 from '../assets/carrusel4.jpg';
import carrusel5 from '../assets/carrusel5.jpg';

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

const Carrusel = ({ interval = DEFAULT_INTERVAL }) => {
  const location = useLocation();
  const { slug } = useParams();
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const [customImages, setCustomImages] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const loadClientConfig = async () => {
      const config = await getClientConfig(slug);
      if (config?.carrusel?.length > 0) {
        setCustomImages(config.carrusel);
      }
    };
    loadClientConfig();
  }, [slug]);

  const images = useMemo(() => {
    if (customImages) return customImages;
    return isDesktop
      ? [carrusel1, carrusel2, carrusel5]
      : [carrusel1, carrusel2, carrusel3, carrusel4, carrusel5];
  }, [customImages, isDesktop]);

  const isCarritoPage = useMemo(
    () => location.pathname.includes('/carrito'),
    [location.pathname]
  );

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setFade(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setFade(false);
      }, 500);
    }, interval);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, images.length, interval]);

  return (
    <div className="w-full h-[300px] overflow-hidden relative">
      <img
        src={images[currentIndex]}
        alt={`Carrusel ${currentIndex + 1}`}
        className={`object-cover w-full h-full transition-opacity duration-500 ${
          fade ? 'opacity-0' : 'opacity-100'
        } ${isCarritoPage ? 'brightness-50' : ''}`}
      />
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
