import { BrowserRouter } from "react-router-dom";
import AppRouter from "./Router";
import "./fontAwesome";
import OrderChecker from "./components/OrderChecker"

function App() {
	return (
		<BrowserRouter>
		<OrderChecker />
			<AppRouter />
		</BrowserRouter>
	);
}

export default App;
