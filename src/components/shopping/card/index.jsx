import { Link } from "react-router-dom";
import currencyFormat from "../../../helpers/currencyFormat";

const Card = ({ name, description, price, img, path, id }) => {
	if (img === "proximamente") {
		return (
			<Link
				to={`/menu/${path}/${id}`}
				onClick={(e) => {
					if (img === "proximamente") e.preventDefault();
				}}
				className="flex items-center justify-center p-24 gap-4 shadow flex-row bg-red-main text-white min-w-full max-w-[400px]"
			>
				<div className="flex flex-col items-center justify-center leading-normal font-antonio">
					<h5 className="mb-2 text-2xl font-bold tracking-tight uppercase">
						próximamente
					</h5>
				</div>
			</Link>
		);
	}

	return (
		<Link
			to={`/menu/${path}/${id}`}
			className="flex items-center p-4 gap-4 shadow flex-row bg-red-main hover:bg-black hover:text-red-main h-52 text-white min-w-full max-w-[400px]"
		>
			<img
				className={`object-cover w-1/3  h-auto md:h-auto md:w-48 ${
					img === "bURGERS.png" ? "pb-20" : ""
				}`}
				src={`/menu/${img}`}
				alt={img}
			/>
			<div className="flex flex-col  justify-between leading-normal font-antonio">
				<h5 className="mb-2 text-2xl font-bold tracking-tight ">
					{name.toUpperCase()}
				</h5>
				<p className="mb-2 text-xs ">{description}</p>
				<span className="font-bold">{currencyFormat(price)}</span>
			</div>
		</Link>
	);
};
export default Card;
