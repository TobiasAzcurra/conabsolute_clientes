import { useEffect, useRef } from "react";
import Items from "../pages/menu/Items";
import { useClient } from "../contexts/ClientContext";
import { useLocation } from "react-router-dom";
import { SORT_OPTIONS } from "../constants/sortOptions";

const NavMenu = () => {
  const navRef = useRef(null);
  const animationRef = useRef(null);
  const interactionTimeoutRef = useRef(null);
  const isUserInteracting = useRef(false);
  const {
    categories,
    productTags,
    clientAssets,
    activeFilters,
    setActiveFilters,
    activeSortOption,
    setActiveSortOption,
  } = useClient();

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    let scrollAmount = nav.scrollLeft || 0;
    let isResetting = false;
    const speed = 0.5;
    const resetDuration = 800;

    const scroll = () => {
      if (isUserInteracting.current || isResetting) {
        animationRef.current = requestAnimationFrame(scroll);
        return;
      }

      const maxScroll = nav.scrollWidth - nav.clientWidth;

      if (scrollAmount >= maxScroll) {
        isResetting = true;
        const startTime = performance.now();
        const startScroll = nav.scrollLeft;

        const resetAnimation = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / resetDuration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3);

          nav.scrollLeft = startScroll * (1 - easedProgress);

          if (progress < 1) {
            requestAnimationFrame(resetAnimation);
          } else {
            scrollAmount = 0;
            isResetting = false;
            animationRef.current = requestAnimationFrame(scroll);
          }
        };

        requestAnimationFrame(resetAnimation);
      } else {
        scrollAmount += speed;
        nav.scrollLeft = scrollAmount;
        animationRef.current = requestAnimationFrame(scroll);
      }
    };

    const startInteraction = () => {
      isUserInteracting.current = true;
      clearTimeout(interactionTimeoutRef.current);
    };

    const endInteraction = () => {
      clearTimeout(interactionTimeoutRef.current);
      interactionTimeoutRef.current = setTimeout(() => {
        isUserInteracting.current = false;
        scrollAmount = nav.scrollLeft;
      }, 2000);
    };

    nav.addEventListener("mousedown", startInteraction);
    nav.addEventListener("mousemove", startInteraction);
    nav.addEventListener("mouseup", endInteraction);
    nav.addEventListener("wheel", () => {
      startInteraction();
      endInteraction();
    });

    nav.addEventListener("touchstart", startInteraction);
    nav.addEventListener("touchmove", startInteraction);
    nav.addEventListener("touchend", endInteraction);

    animationRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      clearTimeout(interactionTimeoutRef.current);

      nav.removeEventListener("mousedown", startInteraction);
      nav.removeEventListener("mousemove", startInteraction);
      nav.removeEventListener("mouseup", endInteraction);
      nav.removeEventListener("wheel", endInteraction);

      nav.removeEventListener("touchstart", startInteraction);
      nav.removeEventListener("touchmove", startInteraction);
      nav.removeEventListener("touchend", endInteraction);
    };
  }, []);

  const location = useLocation();
  const pathParts = location.pathname.split("/");
  const activeCategory = pathParts[pathParts.length - 1];

  // ✅ Manejar click en filtros (multi-selección)
  const handleFilterClick = (tagId) => {
    setActiveFilters(
      (prev) =>
        prev.includes(tagId)
          ? prev.filter((id) => id !== tagId) // Quitar si ya está
          : [...prev, tagId] // Agregar si no está
    );
  };

  // ✅ Manejar click en sort
  const handleSortClick = (sortId) => {
    setActiveSortOption((prev) => (prev === sortId ? null : sortId)); // Toggle
  };

  return (
    <div className="relative z-[99]">
      <p className="text-gray-50 px-4 text-2xl font-medium mb-3 text-center font-coolvetica">
        {clientAssets?.heroTitle || "Elegí lo que más te guste"}
      </p>
      <nav
        ref={navRef}
        className="flex flex-row w-full gap-1 pb-4 px-4 overflow-x-auto nav-scroll-hide"
        style={{ scrollBehavior: "auto", WebkitOverflowScrolling: "touch" }}
      >
        {categories.map((cat) => (
          <Items
            key={cat.id}
            img={cat.image || cat.img || "/menu/defaultPortada.jpeg"}
            categoryId={cat.id}
            name={cat.name || cat.id}
            isActive={activeCategory === cat.id}
          />
        ))}
      </nav>
      <div className="px-4 flex flex-row items-center gap-4  pb-4 overflow-x-auto nav-scroll-hide">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="h-6 flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
          />
        </svg>
        <div className="flex flex-row font-coolvetica gap-1 flex-shrink-0">
          {/* ✅ Tags de filtro desde DB */}
          {productTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleFilterClick(tag.id)}
              className={`shadow-lg shadow-gray-200 bg-gray-50 w-fit px-4 rounded-full text-xs h-10 items-center flex font-light whitespace-nowrap transition-all ${
                activeFilters.includes(tag.id)
                  ? "border-2 border-gray-900 text-gray-900"
                  : "text-gray-600 "
              }`}
            >
              {tag.name}
            </button>
          ))}

          {/* ✅ Separador visual */}
          {productTags.length > 0 && (
            <div className="w-px h-6 bg-gray-300 self-center mx-1" />
          )}

          {/* ✅ Tags de ordenamiento */}
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSortClick(option.id)}
              className={`shadow-lg shadow-gray-200 bg-gray-50 w-fit px-4 rounded-full text-xs h-10 items-center flex font-light whitespace-nowrap transition-all ${
                activeSortOption === option.id
                  ? "border-2 border-gray-900 text-gray-900"
                  : "text-gray-600 "
              }`}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NavMenu;
