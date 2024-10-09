import { items } from "../../../pages/menu/MenuPage";
import MyTextChange from "../../text";
import Card from "../card";

const Section = ({ products = [], path }) => {
	let originalsBurgers = [];
	let ourCollection = [];
	let satisfyer = [];
	let promo = [];

	if (items.burgers === path) {
		promo = products.filter((product) => {
			return product.type.includes("promo");
		});

		originalsBurgers = products.filter((product) => {
			return product.type.includes("originals");
		});
		ourCollection = products.filter((product) => {
			return product.type.includes("our");
		});
		satisfyer = products.filter((product) => {
			return product.type.includes("satisfyer");
		});
	} else {
		ourCollection = products;
	}

	setTimeout(() => {
		window.scrollTo(0, 0);
	}, 10);

	return (
		<>
			{items.burgers === path ? (
				<div className="mt-8 mb-4 mr-4 ml-4 ">
					{satisfyer.length > 0 && (
						<div className="section">
							<p className="font-bold text-5xl text-center  mb-4 text-black font-coolvetica">
								Satisfyers
							</p>
							<div className=" grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center mb-8 ">
								{satisfyer.map(({ name, description, price, id, img }, i) => (
									<Card
										key={i}
										img={img}
										name={name}
										description={description}
										price={price}
										path={path}
										id={id}
									/>
								))}
							</div>
						</div>
					)}
					{originalsBurgers.length > 0 && (
						<div className="section">
							<p className="font-bold text-5xl text-center  mb-4 text-black font-coolvetica">
								Originals
							</p>
							<div className=" grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center mb-2 ">
								{originalsBurgers.map(
									({ name, description, price, id, img }, i) => (
										<Card
											key={i}
											img={img}
											name={name}
											description={description}
											price={price}
											path={path}
											id={id}
										/>
									)
								)}
							</div>
						</div>
					)}
					{ourCollection.length > 0 && (
						<div className="section">
							<p className="font-bold text-5xl text-center  mb-4 text-black font-coolvetica">
								Masterpieces
							</p>
							<div className=" grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
								{ourCollection.map(
									({ name, description, price, id, img }, i) => (
										<Card
											key={i}
											img={img}
											name={name}
											description={description}
											price={price}
											path={path}
											id={id}
										/>
									)
								)}
							</div>
						</div>
					)}
				</div>
			) : (
				<div className="mt-4 mb-4 mr-4 ml-4 grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
					{products.length > 0 ? (
						products.map(({ name, description, price, id, img }, i) => (
							<Card
								key={i}
								img={img}
								name={name}
								description={description}
								price={price}
								path={path}
								id={id}
							/>
						))
					) : (
						<span>No hay nada xd</span>
					)}
				</div>
			)}
		</>
	);
};

export default Section;
