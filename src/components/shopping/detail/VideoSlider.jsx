import React, { useState, useRef, useEffect } from "react";

const VideoSlider = ({ reels = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  const slides = reels;

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (diff > 50) {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    } else if (diff < -50) {
      setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    }
  };

  return (
    <div
      ref={sliderRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden w-full max-w-4xl mx-auto pl-4 pr-2"
    >
      <div
        className="flex transition-transform gap-1 ease-in-out duration-500 rounded-3xl"
        style={{ transform: `translateX(-${currentIndex * 83.33}%)` }}
      >
        {slides.map((src, index) => (
          <div className="min-w-[83.33%] box-border relative" key={index}>
            <video
              src={src}
              autoPlay
              loop
              muted
              playsInline
              className="w-full md:h-[220px] h-auto object-cover rounded-3xl"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoSlider;
