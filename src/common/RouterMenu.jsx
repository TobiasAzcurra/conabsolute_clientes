// RouterMenu.jsx

import { Outlet } from "react-router-dom";
import MenuPage from "../pages/menu/MenuPage";

export const RouterMenu = ({ onAnimationEnd }) => {
	return (
		<>
			<MenuPage onAnimationEnd={onAnimationEnd} />
			<Outlet />
		</>
	);
};

export default RouterMenu;
