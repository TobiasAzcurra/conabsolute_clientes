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
					{/* {promo.length > 0 && (
            <div className="section">
              <div className="flex flex-col items-start  mb-2">
                <p className="font-bold text-5xl text-black font-antonio">
                  PROMOCIONES.
                </p>
                <MyTextChange
                  nameOne={"BBQ: ANHELO"}
                  nameTwo={"2x1"}
                  position={"items-start"}
                />
              </div>
              <div className=" grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center mb-8 ">
                {promo.map(({ name, description, price, id, img }, i) => (
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
          )} */}

					{satisfyer.length > 0 && (
						<div className="section">
							<div className="flex flex-col items-start  mb-2">
								<p className="font-bold text-5xl text-black font-antonio">
									SATISFYERS.
								</p>
								<MyTextChange
									nameOne={"BEST SELLER"}
									nameTwo={"SATISFYER BCN CHEESEBURGER"}
									position={"items-start"}
								/>
							</div>
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
							<div className="flex flex-row justify-end gap-1 items-end mb-2">
								<MyTextChange
									nameOne={"BEST SELLER"}
									nameTwo={"DOBLE CHEESBURGER"}
									position={"items-end"}
								/>
								<p className="text-right font-bold text-5xl font-antonio text-black mb-1">
									ORIGINALS.
								</p>
							</div>
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
							<div className="flex flex-col mt-8 items-start  mb-2 ">
								<p className="font-bold text-5xl text-black font-antonio">
									MASTERPIECES
								</p>

								<MyTextChange
									nameOne={"BEST SELLER"}
									nameTwo={"BBQ BCN CHEESBURGER"}
									position={"items-start"}
								/>
							</div>
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
{
	/* <div className="mt-4 mb-4 mr-4 ml-4 grid grid-cols-5 sm:grid-cols-2 gap-4 justify-items-center min-h-screen">
          {originalsBurgers.length > 0 && (
            <div>
              <h2>Originals Burgers</h2>
              {originalsBurgers.map(({ name, description, price, id }, i) => (
                <Card
                  key={i}
                  name={name}
                  description={description}
                  price={price}
                  path={path}
                  id={id}
                />
              ))}
            </div>
          )}
          {ourCollection.length > 0 && (
            <div>
              <h2>Our Collection</h2>
              {ourCollection.map(({ name, description, price, id }, i) => (
                <Card
                  key={i}
                  name={name}
                  description={description}
                  price={price}
                  path={path}
                  id={id}
                />
              ))}
            </div>
          )}
        </div> */
}
