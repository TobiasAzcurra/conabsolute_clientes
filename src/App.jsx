import { BrowserRouter } from 'react-router-dom';
import AppRouter from './Router';
import VersionChecker from './components/VersionChecker';
import { HelmetProvider } from 'react-helmet-async';
import './fontAwesome';

function App() {
  return (
    <BrowserRouter>
      <VersionChecker>
        <HelmetProvider>
          <AppRouter />
        </HelmetProvider>
      </VersionChecker>
    </BrowserRouter>
  );
}

export default App;
