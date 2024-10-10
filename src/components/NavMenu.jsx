import Items from "../pages/menu/Items";
import box from "../assets/box.png";
import fries from "../assets/fries.png";

export const items = {
	burgers: "burgers",
	combos: "combos",
	papas: "papas",
	bebidas: "bebidas",
};

const NavMenu = ({ selectedItem, handleItemClick, locationMenu }) => {
	return (
		<nav className="flex flex-row w-full gap-2 justify-center px-4">
			<Items
				selectedItem={selectedItem}
				img={"/menu/coca.png"}
				name={items.bebidas}
				handleItemClick={handleItemClick}
			/>
			<Items
				selectedItem={selectedItem}
				img={box}
				name={items.burgers}
				handleItemClick={handleItemClick}
			/>
			<Items
				selectedItem={selectedItem}
				img={fries}
				name={items.papas}
				handleItemClick={handleItemClick}
			/>
		</nav>
	);
};

export default NavMenu;
