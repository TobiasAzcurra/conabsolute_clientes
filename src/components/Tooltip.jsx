import React, { useState } from "react";

const Tooltip = ({ text, duration = 10000, className = "", position = "right" }) => {
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = () => {
    setIsVisible(true);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  };

  const getPositionClasses = () => {
    // Base classes for the tooltip container
    const baseClasses = `
      absolute z-50 w-72
      bottom-full mb-2
      transition-all duration-200 ease-out
    `;

    // Position-specific classes
    const positionClasses = position === "left" 
      ? "right-0" // Align to the right edge of the container
      : "left-0"; // Default - align to the left edge

    // Visibility classes
    const visibilityClasses = isVisible
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-2 pointer-events-none";

    return `${baseClasses} ${positionClasses} ${visibilityClasses}`;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Tooltip */}
      <div className={getPositionClasses()}>
        <div className="relative bg-black bg-opacity-50 backdrop-blur-sm 
          rounded-2xl shadow-lg border border-gray-200
          overflow-hidden"
        >
          <div className="px-4 py-3">
            <p
              className="text-gray-100 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: text }}
            />
          </div>
        </div>
      </div>

      {/* Info Icon */}
      <div
        onClick={showTooltip}
        className="cursor-pointer hover:bg-gray-100 rounded-full transition-colors duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 text-black"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
};

export default Tooltip;