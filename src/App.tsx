import RoutesModule from "./routes/RoutesModule";
import { AuthProvider } from "./shared/context/AuthContext";
import { Toaster } from "@/shared/components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
          {/* 🔔 Toaster global */}
          <Toaster />
          <RoutesModule />
    </AuthProvider>
  );
}