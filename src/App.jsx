import { BrowserRouter } from "react-router-dom";
import AppRouter from "./Router";
import "./fontAwesome";

function App() {
	return (
		<BrowserRouter>
			<AppRouter />
		</BrowserRouter>
	);
}

export default App;
