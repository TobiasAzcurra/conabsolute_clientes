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
	const [isFirstAnimation, setIsFirstAnimation] = useState(true);
	const [isSecondAnimation, setIsSecondAnimation] = useState(true);

	const handleItemClick = (item) => {
		setSelectedItem(item);
	};

	useEffect(() => {
		const pathParts = pathname.split("/");
		const lastPart = pathParts[pathParts.length - 1];

		if (selectedItem === "PROMOCIONES") {
			setSelectedItem("PROMOCIONES");
		} else {
			setSelectedItem(lastPart);
		}

		setLocationMenu(pathname.startsWith("/menu/"));
	}, [pathname]);

	useEffect(() => {
		// Switch to the second part after the first animation ends
		if (isFirstAnimation) {
			const timer = setTimeout(() => {
				setIsFirstAnimation(false);
			}, 1000); // Duration of the first animation in milliseconds
			return () => clearTimeout(timer);
		}
	}, [isFirstAnimation]);

	useEffect(() => {
		// Switch to redirect after the second animation ends
		if (!isFirstAnimation && isSecondAnimation) {
			const timer = setTimeout(() => {
				setIsSecondAnimation(false);
				// navigate("/menu/burgers"); // Redirect to /menu after the second animation ends
			}, 2000); // Duration of the second animation in milliseconds
			return () => clearTimeout(timer);
		}
	}, [isFirstAnimation, isSecondAnimation, navigate]);

	// Inject styles into the document head
	useEffect(() => {
		const style = document.createElement("style");
		style.innerHTML = `
      @keyframes moveRightToLeft {
        0% {
          transform: translateX(100vw) scale(4); /* Start off the right edge and scaled */
        }
        100% {
          transform: translateX(-50vw) scale(4); /* Move off the left edge and maintain scale */
        }
      }

      @keyframes gradientAnimation {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }

      .moving-logo-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden; /* Ensure the logo doesn't create scrollbars */
      }

      .moving-logo {
        position: absolute;
        top: 50%;
        left: 100%;
        transform: translate(-50%, -50%) scale(4);
        animation: moveRightToLeft 1s linear forwards;
        /* Ensure the image can grow beyond its container */
        will-change: transform;
      }

      .breathing-gradient {
       background: linear-gradient(100deg, #000000 0%, #000000 25%, #C00100 100%, #000000 75%, #000000 100%);

        background-size: 200% 200%;
        animation: gradientAnimation 6s ease infinite;
      }
    `;
		document.head.appendChild(style);
		return () => {
			document.head.removeChild(style);
		};
	}, []);

	return (
		<div
			className={`breathing-gradient flex items-center justify-center h-screen`}
		>
			{isFirstAnimation ? (
				// First Animation: Logo moving from right to left
				<div className="moving-logo-container">
					<img className="moving-logo " src={logo} alt="ANHELO" />
				</div>
			) : isSecondAnimation ? (
				// Second Part: Existing content with fade-in animation
				<div className="text-center">
					<img
						className="mb-1 w-72 animate__animated animate__fadeInUp animate__slow "
						src={logo}
						alt="ANHELO"
					/>
					<p className="text-white text-sm font-semibold animate__animated animate__fadeInUp animate__slow  animate__delay-1s">
						Vas a pedir más.
					</p>
				</div>
			) : null}
		</div>
	);
};

export default MenuPage;
