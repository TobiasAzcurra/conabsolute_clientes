import { BrowserRouter } from "react-router-dom";
import AppRouter from "./Router";
import VersionChecker from "./components/VersionChecker";
import "./fontAwesome";

function App() {
  return (
    <BrowserRouter>
      <VersionChecker>
        <AppRouter />
      </VersionChecker>
    </BrowserRouter>
  );
}

export default App;