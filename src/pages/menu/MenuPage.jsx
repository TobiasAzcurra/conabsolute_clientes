import logo from "../../assets/anheloTMwhite.png";
import { useLocation, useNavigate } from "react-router-dom";
import "animate.css/animate.min.css";
import { useEffect, useState } from "react";

export const items = {
	burgers: "burgers",
	combos: "combos",
	papas: "papas",
	bebidas: "bebidas",
};
const MenuPage = () => {
	const { pathname } = useLocation();
	const navigate = useNavigate();

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

	useEffect(() => {
		const timer = setTimeout(() => {
			navigate("/menu/burgers");
		}, 2000);
		return () => clearTimeout(timer);
	}, [navigate]);

	return (
		<div className="bg-gradient-to-b from-black via-black to-red-main flex items-center justify-center h-screen">
			<div className="text-center">
				<img
					className="mb-1 w-72 animate__animated animate__fadeInUp animate__slow"
					src={logo}
					alt="ANHELO"
				/>
				<p className="text-white text-sm font-semibold animate__animated animate__fadeInUp animate__slow animate__delay-1s">
					Vas a pedir más.
				</p>
			</div>
		</div>
	);
};

export default MenuPage;
