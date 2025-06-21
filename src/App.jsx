import { BrowserRouter } from 'react-router-dom';
import AppRouter from './Router';
import VersionChecker from './components/VersionChecker';
import { HelmetProvider } from 'react-helmet-async';
import { ClientProvider } from './contexts/ClientContext';
import './fontAwesome';

function App() {
  return (
    <BrowserRouter>
      <VersionChecker>
        <HelmetProvider>
          <ClientProvider>
            <AppRouter />
          </ClientProvider>
        </HelmetProvider>
      </VersionChecker>
    </BrowserRouter>
  );
}

export default App;
