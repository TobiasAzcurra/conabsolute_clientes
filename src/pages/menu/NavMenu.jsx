// NavMenu.js
import Items from "./Items";
import box from "../../assets/box.png";
import fries from "../../assets/fries.png";

export const items = {
	burgers: "burgers",
	combos: "combos",
	papas: "papas",
	bebidas: "bebidas",
};

const NavMenu = ({ selectedItem, handleItemClick, locationMenu }) => {
	return (
		<nav>
			<ul
				className={`animate__animated animate__fadeIn animate__slower  ${
					locationMenu ? " flex flex-row justify-center" : "flex flex-row "
				}`}
			>
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
			</ul>
		</nav>
	);
};

export default NavMenu;
