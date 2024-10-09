import { Link, useNavigate } from 'react-router-dom';
import arrowBack from '../../assets/arrowBack.png';

const ArrowBack = ({ category = 'Volver' }) => {
  const navigate = useNavigate();

  return (
    <Link
      className="flex items-center text-xs hover:cursor-pointer font-antonio  sm:font-bold  font-light text-black relative group transition-all duration-300 ease-in-out gap-2"
      onClick={() => navigate(-1)}
    >
      <img src={arrowBack} className="h-1" />
      <span className="bg-left-bottom bg-gradient-to-r from-black py-1 to-black bg-[length:0%_2px] bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500 ease-out">
        {category.toUpperCase()}
      </span>
    </Link>
  );
};

export default ArrowBack;
