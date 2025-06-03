import { useEffect, useRef } from "react";
import Items from "../pages/menu/Items";

export const items = {
  burgers: "burgers",
  combos: "combos",
  papas: "papas",
  bebidas: "bebidas",
};

const NavMenu = ({ selectedItem, handleItemClick }) => {
  const navRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    let scrollAmount = 0;
    let isResetting = false;
    const speed = 0.5; // velocidad del scroll (ajustable)
    const resetDuration = 800; // duración de la animación de reinicio en ms

    const scroll = () => {
      if (isResetting) {
        // No hacer nada mientras se está ejecutando la animación de reinicio
        animationRef.current = requestAnimationFrame(scroll);
        return;
      }

      const maxScroll = nav.scrollWidth - nav.clientWidth;

      if (scrollAmount >= maxScroll) {
        // Iniciar animación de reinicio
        isResetting = true;
        const startTime = performance.now();
        const startScroll = nav.scrollLeft;

        const resetAnimation = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / resetDuration, 1);

          // Función de easing para una animación más suave (ease-out)
          const easedProgress = 1 - Math.pow(1 - progress, 3);

          nav.scrollLeft = startScroll * (1 - easedProgress);

          if (progress < 1) {
            requestAnimationFrame(resetAnimation);
          } else {
            // Reiniciar valores para continuar el scroll automático
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

    animationRef.current = requestAnimationFrame(scroll);

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div>
      <p className="text-gray-100 text-center text-2xl mb-3 font-bold font-coolvetica">
        Elegí
      </p>
      <nav
        ref={navRef}
        className="flex flex-row w-full gap-2 px-4 overflow-x-auto scrollbar-hide"
        style={{ scrollBehavior: "auto" }} // Asegurar que no interfiera con nuestra animación personalizada
      >
        <Items
          selectedItem={selectedItem}
          img={"/menu/matePortada.jpeg"}
          name="Mates"
          handleItemClick={handleItemClick}
        />
        <Items
          selectedItem={selectedItem}
          img={"/menu/termoPortada.jpeg"}
          name="Termos"
          handleItemClick={handleItemClick}
        />
        <Items
          selectedItem={selectedItem}
          img={"/menu/bombillaPortada.jpeg"}
          name="Bombillas"
          handleItemClick={handleItemClick}
        />
        <Items
          selectedItem={selectedItem}
          img={"/menu/yerbaPortada.jpeg"}
          name="Yerba"
          handleItemClick={handleItemClick}
        />
        <Items
          selectedItem={selectedItem}
          img={"/menu/canastaPortada.jpeg"}
          name="Canastas"
          handleItemClick={handleItemClick}
        />
      </nav>
    </div>
  );
};

export default NavMenu;
