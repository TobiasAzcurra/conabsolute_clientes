import logo from "../../assets/anheloTMwhite.png";
import fries from "../../assets/fries.png";
import advisory from "../../assets/advisory.png";
import { useLocation } from "react-router-dom";
import "animate.css/animate.min.css";
import { useEffect, useState } from "react";
import Items from "./Items";
import deadpool from "../../assets/deadpool.png";
import logoRojo from "../../assets/logoRojo.png";
import box from "../../assets/box.png";

export const items = {
	burgers: "burgers",
	combos: "combos",
	papas: "papas",
	bebidas: "bebidas",
};
const MenuPage = () => {
	const { pathname } = useLocation();

	const [selectedItem, setSelectedItem] = useState("");
	const [locationMenu, setLocationMenu] = useState(true);

	const handleItemClick = (item) => {
		setSelectedItem(item);
	};

	useEffect(() => {
		const pathParts = pathname.split("/");
		const lastPart = pathParts[pathParts.length - 1];
		// si selecciono PROMOCIONES que no se actualice el selected item

		if (selectedItem === "PROMOCIONES") {
			setSelectedItem("PROMOCIONES");
		} else {
			setSelectedItem(lastPart);
		}

		setLocationMenu(pathname.startsWith("/menu/"));
	}, [pathname]);

	return (
		<div
			className={`bg-gradient-to-b from-red-800  to-zinc-950 p-7 flex justify-center transition-all duration-1000 ${
				locationMenu
					? "min-h-0"
					: "min-h-screen flex-col overflow-hidden items-center justify-center"
			}`}
		>
			{pathname.startsWith("/menu/") ? null : (
				<>
					{/* <div className="absolute bottom-4 animate__animated animate__fadeIn animate__slower left-4 font-antonio text-white  font-medium text-xs">
						<img src={logo} className="h-5" />
						VAS A PEDIR MÁS.
					</div>
					<img
						src={advisory}
						className="h-9 absolute right-4 bottom-4 animate__animated animate__fadeIn animate__slower "
					/> */}
					<div className="mb-8 flex flex-col items-center animate__animated animate__fadeIn animate__slower">
						<img className=" mb-4 w-96" src={logoRojo} alt="nada" />
						<a className="text-white text-center text-xs">
							Advertencia, vas a pedir más.
						</a>
						<a className="text-white text-center text-xs">Elegí:</a>
					</div>
				</>
			)}

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
					{/* <Items
            selectedItem={selectedItem}
            img={combos}
            name={items.combos}
            handleItemClick={handleItemClick}
          /> */}
				</ul>
			</nav>
		</div>
	);
};

export default MenuPage;
