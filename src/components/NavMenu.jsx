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

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    let scrollAmount = 0;
    const speed = 0.5; // velocidad del scroll (ajustable)
    const maxScroll = nav.scrollWidth - nav.clientWidth;

    const scroll = () => {
      if (scrollAmount >= maxScroll) {
        scrollAmount = 0; // reinicia al comienzo
        nav.scrollLeft = 0;
      } else {
        scrollAmount += speed;
        nav.scrollLeft = scrollAmount;
      }
      requestAnimationFrame(scroll);
    };

    scroll();
  }, []);

  return (
    <div>
      <p className="text-gray-100 text-center text-2xl mb-3 font-bold font-coolvetica">
        Elegí
      </p>
      <nav
        ref={navRef}
        className="flex flex-row w-full gap-2 px-4 overflow-x-auto scrollbar-hide"
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
