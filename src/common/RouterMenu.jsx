import { Outlet } from 'react-router-dom';
import MenuPage from '../pages/menu';

export const RouterMenu = () => {
  return (
    <>
      <MenuPage />

      <Outlet />
    </>
  );
};
