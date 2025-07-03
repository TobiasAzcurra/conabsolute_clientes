import { useEffect, useRef } from "react";
import Items from "../pages/menu/Items";
import { useClient } from "../contexts/ClientContext";

const NavMenu = () => {
  const navRef = useRef(null);
  const animationRef = useRef(null);
  const interactionTimeoutRef = useRef(null);
  const isUserInteracting = useRef(false);
  const { categories } = useClient();

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
        // sincroniza scrollAmount actual al reanudar animación
        scrollAmount = nav.scrollLeft;
      }, 2000);
    };

    // Eventos para desktop
    nav.addEventListener("mousedown", startInteraction);
    nav.addEventListener("mousemove", startInteraction);
    nav.addEventListener("mouseup", endInteraction);
    nav.addEventListener("wheel", () => {
      startInteraction();
      endInteraction();
    });

    // Eventos para mobile
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

  return (
    <div className="relative z-[99]">
      <p className="text-gray-100 px-4 text-center text-2xl mb-3 font-medium font-coolvetica">
        ¿Salen unos mates?
      </p>
      <nav
        ref={navRef}
        className="flex flex-row w-full gap-1 px-4 overflow-x-auto nav-scroll-hide"
        style={{ scrollBehavior: "auto", WebkitOverflowScrolling: "touch" }}
      >
        {categories.map((cat) => (
          <Items
            key={cat.id}
            img={cat.image || cat.img || "/menu/defaultPortada.jpeg"}
            name={cat.id}
          />
        ))}
      </nav>
    </div>
  );
};

export default NavMenu;
