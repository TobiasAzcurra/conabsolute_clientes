// src/fontAwesome.js
import { library } from "@fortawesome/fontawesome-svg-core";
import {
	faStar as faSolidStar,
	faStarHalfAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons";

library.add(faSolidStar, faStarHalfAlt, faRegularStar);
