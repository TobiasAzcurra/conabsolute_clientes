import { Link, useNavigate } from "react-router-dom";
import arrow from "../../assets/arrowIcon.png";

const ArrowBack = () => {
	const navigate = useNavigate();

	const handleGoBack = () => {
		navigate(-1); // Navega hacia la página previa
	};

	return (
		<div
			className="absolute top-2 left-4 flex flex-row items-center gap-2 cursor-pointer"
			onClick={handleGoBack} // Añadimos el evento onClick aquí
		>
			<img src={arrow} className="h-2 rotate-180" alt="" />
			<p className="font-coolvetica font-bold">Volver</p>
		</div>
	);
};

export default ArrowBack;
