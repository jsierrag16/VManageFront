import RoutesModule from './routes/RoutesModule';

import { AuthProvider } from './shared/context/AuthContext';
import { TrasladosProvider } from './shared/context/TrasladosContext';
import { ProductosProvider } from './shared/context/ProductosContext';

export default function App() {
  return (
    <AuthProvider>
      <TrasladosProvider>
        <ProductosProvider>
          <RoutesModule />
        </ProductosProvider>
      </TrasladosProvider>
    </AuthProvider>
  );
}


