import Items from "../pages/menu/Items";
import box from "../assets/box.png";
import fries from "../assets/fries.png";

export const items = {
  burgers: "burgers",
  combos: "combos",
  papas: "papas",
  bebidas: "bebidas",
};

const NavMenu = ({ selectedItem, handleItemClick }) => {
  return (
    <div>
      <p className="text-gray-100 text-center text-2xl mb-3 font-bold font-coolvetica">
        Elegí
      </p>
      <nav className="flex flex-row w-full gap-2 px-4 overflow-x-auto scrollbar-hide">
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
