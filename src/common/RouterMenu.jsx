import { Outlet } from "react-router-dom";
import MenuPage from "../pages/menu/MenuPage";

export const RouterMenu = () => {
	return (
		<>
			<MenuPage />

			<Outlet />
		</>
	);
};
