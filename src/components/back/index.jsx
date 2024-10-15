import { useNavigate, useLocation } from "react-router-dom";
import arrow from "../../assets/arrowIcon.png";

const ArrowBack = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const handleGoBack = () => {
		if (location.pathname === "/pedido") {
			navigate("/"); // Si estás en "/pedido", navega hacia "/menu"
		} else {
			navigate(-1); // De lo contrario, navega hacia la página previa
		}
	};

	return (
		<div
			className="absolute top-2 left-4 flex flex-row items-center gap-2 cursor-pointer"
			onClick={handleGoBack}
		>
			<img src={arrow} className="h-2 rotate-180" alt="" />
			<p className="font-coolvetica font-bold">Volver</p>
		</div>
	);
};

export default ArrowBack;
