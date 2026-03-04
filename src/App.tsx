import RoutesModule from "./routes/RoutesModule";

import { AuthProvider } from "./shared/context/AuthContext";
import { TrasladosProvider } from "./shared/context/TrasladosContext";
import { ProductosProvider } from "./shared/context/ProductosContext";

import { Toaster } from "@/shared/components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <TrasladosProvider>
        <ProductosProvider>

          {/* 🔔 Toaster global */}
          <Toaster />

          <RoutesModule />

        </ProductosProvider>
      </TrasladosProvider>
    </AuthProvider>
  );
}