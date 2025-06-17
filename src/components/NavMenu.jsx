import { useEffect, useRef, useState } from "react";
import Items from "../pages/menu/Items";
import { getCategoriesByClient } from "../firebase/getCategories";
import { useParams } from "react-router-dom";

const NavMenu = ({ selectedItem, handleItemClick }) => {
  const { slug } = useParams();
  const navRef = useRef(null);
  const animationRef = useRef(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getCategoriesByClient(slug);
        setCategories(cats);
      } catch (err) {
        console.error("❌ Error al obtener categorías:", err);
      }
    };

    if (slug) fetchCategories();
  }, [slug]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    let scrollAmount = 0;
    let isResetting = false;
    const speed = 0.5;
    const resetDuration = 800;

    const scroll = () => {
      if (isResetting) {
        animationRef.current = requestAnimationFrame(scroll);
        return;
      }

      const maxScroll = nav.scrollWidth - nav.clientWidth;

      if (scrollAmount >= maxScroll) {
        isResetting = true;
        const startTime = performance.now();
        const startScroll = nav.scrollLeft;

        const resetAnimation = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / resetDuration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3);

          nav.scrollLeft = startScroll * (1 - easedProgress);

          if (progress < 1) {
            requestAnimationFrame(resetAnimation);
          } else {
            scrollAmount = 0;
            isResetting = false;
            animationRef.current = requestAnimationFrame(scroll);
          }
        };

        requestAnimationFrame(resetAnimation);
      } else {
        scrollAmount += speed;
        nav.scrollLeft = scrollAmount;
        animationRef.current = requestAnimationFrame(scroll);
      }
    };

    animationRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative z-[99]">
      <p className="text-gray-100 px-4 text-center text-2xl mb-3 font-medium font-coolvetica">
        ¿Salen unos mates?
      </p>
      <nav
        ref={navRef}
        className="flex flex-row w-full gap-2 px-4 overflow-x-auto scrollbar-hide"
        style={{ scrollBehavior: "auto" }}
      >
        {categories.map((cat) => (
          <Items
            key={cat.id}
            selectedItem={selectedItem}
            img={cat.image || "/menu/defaultPortada.jpeg"}
            name={cat.id}
            handleItemClick={handleItemClick}
          />
        ))}
      </nav>
    </div>
  );
};

export default NavMenu;
