import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import MainLayout from '../../../layouts/MainLayout';

// Componentes extraídos
import { StatsCard } from '../components/StatsCard';
import { DashboardCharts } from '../components/DashboardCharts';

// Páginas / Secciones
import Clientes from '../../clientes/pages/Clientes';
import Proveedores from '../../proveedores/pages/Proveedores';
import Existencias from '../../existencias/pages/Existencias';
import Compras from '../../compras/pages/Compras';
import RemisionesCompra from '../../remisiones/pages/RemisionesCompra';
import Ordenes, { ordenesData } from '../../ordenes/pages/Ordenes';
import Remisiones from '../../remisiones/pages/Remisiones';
import PagosAbonos from '../../pagosAbonos/pages/PagosAbonos';
import Cotizaciones from '../../cotizaciones/pages/Cotizaciones';
import Usuarios from '../../usuarios/pages/Usuarios';
import Roles from '../../roles/pages/Roles';
import Bodegas from '../../bodegas/pages/Bodegas';
import Traslados from '../../traslados/pages/Traslados';
import Perfil from '../../perfil/pages/Perfil';

// Contextos y Datos
import { useTraslados } from '../../../shared/context/TrasladosContext';
import { useProductos } from '../../../shared/context/ProductosContext';
import { clientesData } from '../../../data/clientes';

interface DashboardProps {
  onLogout: () => void;
  currentUser: any;
  onUserUpdate?: (user: any) => void;
  vManageLogo?: string;
  vManageLogoSmall?: string;
  gvmLogo?: string;
}

// Datos de ejemplo para las gráficas
const salesData = [
  { name: 'Ene', ventas: 1475000, compras: 850000 },
  { name: 'Feb', ventas: 944000, compras: 620000 },
  { name: 'Mar', ventas: 2075000, compras: 1180000 },
  { name: 'Abr', ventas: 1850000, compras: 1050000 },
  { name: 'May', ventas: 2200000, compras: 1300000 },
  { name: 'Jun', ventas: 2650000, compras: 1580000 },
  { name: 'Jul', ventas: 2890000, compras: 1720000 },
];

export default function Dashboard({ 
  onLogout, 
  currentUser, 
  onUserUpdate, 
  vManageLogo, 
  vManageLogoSmall, 
  gvmLogo 
}: DashboardProps) {
  
  const { traslados } = useTraslados();
  const { productos } = useProductos();

  // Estados principales controlados por el Dashboard
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedBodega, setSelectedBodega] = useState('Todas las bodegas');

  // --- Lógica de Negocio: Cálculo de Estadísticas ---
  const dashboardStats = useMemo(() => {
    // 1. Filtrar datos según la bodega seleccionada
    const ordenesFiltradas = selectedBodega === 'Todas las bodegas' 
      ? ordenesData 
      : ordenesData.filter(o => o.bodega === selectedBodega);
    
    const clientesFiltrados = selectedBodega === 'Todas las bodegas'
      ? clientesData
      : clientesData.filter(c => c.bodega === selectedBodega);
    
    const productosFiltrados = productos.map(p => {
      if (selectedBodega === 'Todas las bodegas') {
        return { ...p, stockTotal: p.lotes.reduce((sum, l) => sum + l.cantidadDisponible, 0) };
      }
      const lotesBodega = p.lotes.filter(l => l.bodega === selectedBodega);
      return { 
        ...p, 
        stockTotal: lotesBodega.reduce((sum, l) => sum + l.cantidadDisponible, 0),
        lotes: lotesBodega
      };
    }).filter(p => p.stockTotal > 0);
    
    const trasladosFiltrados = selectedBodega === 'Todas las bodegas'
      ? traslados
      : traslados.filter(t => t.bodegaOrigen === selectedBodega || t.bodegaDestino === selectedBodega);
    
    // 2. Calcular totales numéricos
    const totalVentas = ordenesFiltradas.reduce((sum, o) => sum + o.total, 0);
    const totalClientes = clientesFiltrados.length;
    const totalOrdenes = ordenesFiltradas.length;
    const totalProductos = productosFiltrados.length;
    const ordenesEnProceso = ordenesFiltradas.filter(o => o.estado === 'Procesando').length;
    const productosStockBajo = productosFiltrados.filter(p => p.stockTotal < 50).length;
    const trasladosPendientes = trasladosFiltrados.filter(t => t.estado === 'Enviado').length;
    
    // 3. Retornar objeto formateado para las StatsCard
    return {
      totalVentas: {
        value: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalVentas),
        raw: totalVentas,
        change: '+18.5%',
        isPositive: true,
      },
      totalClientes: {
        value: totalClientes.toString(),
        raw: totalClientes,
        change: '+12.3%',
        isPositive: true,
      },
      totalOrdenes: {
        value: totalOrdenes.toString(),
        raw: totalOrdenes,
        change: '+7.8%',
        isPositive: true,
        enProceso: ordenesEnProceso,
      },
      totalProductos: {
        value: totalProductos.toString(),
        raw: totalProductos,
        change: '+5.2%',
        isPositive: true,
        stockBajo: productosStockBajo,
      },
      traslados: {
        value: trasladosFiltrados.length.toString(),
        raw: trasladosFiltrados.length,
        pendientes: trasladosPendientes,
      }
    };
  }, [selectedBodega, traslados, productos]);
  
  // Generar datos para la gráfica de inventario
  const inventoryData = useMemo(() => {
    const categorias: { [key: string]: number } = {};
    productos.forEach(producto => {
      const stockPorBodega = producto.lotes
        .filter(lote => selectedBodega === 'Todas las bodegas' || lote.bodega === selectedBodega)
        .reduce((sum, lote) => sum + lote.cantidadDisponible, 0);
      
      if (!categorias[producto.categoria]) {
        categorias[producto.categoria] = 0;
      }
      categorias[producto.categoria] += stockPorBodega;
    });
    return Object.entries(categorias).map(([name, stock]) => ({ name, stock }));
  }, [selectedBodega, productos]);
  
  // Generar datos para la gráfica de ingresos
  const revenueData = useMemo(() => {
    return salesData.map(item => ({
      name: item.name,
      ingresos: item.ventas * 0.35 // Margen estimado del 35%
    }));
  }, []);

  // --- Renderizado ---
  return (
    <MainLayout
      currentUser={currentUser}
      onLogout={onLogout}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      selectedBodega={selectedBodega}
      setSelectedBodega={(bodega) => {
        setSelectedBodega(bodega);
        toast.success(`Cambiado a ${bodega}`);
      }}
      vManageLogo={vManageLogo}
      vManageLogoSmall={vManageLogoSmall}
      gvmLogo={gvmLogo}
      traslados={traslados} // Pasamos la data para que MainLayout la inyecte en Notificaciones
      productos={productos} // Pasamos la data para que MainLayout la inyecte en Notificaciones
    >
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600">
                Bienvenido al panel de control de VManage
              </p>
            </div>

            {/* Grid de Tarjetas de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Ventas"
                value={dashboardStats.totalVentas.value}
                change={dashboardStats.totalVentas.change}
                isPositive={dashboardStats.totalVentas.isPositive}
                color="blue"
                onClick={() => {
                  setActiveSection('ordenes');
                  toast.info('Redirigiendo a Órdenes de Venta');
                }}
              />
              <StatsCard
                title="Clientes"
                value={dashboardStats.totalClientes.value}
                change={dashboardStats.totalClientes.change}
                isPositive={dashboardStats.totalClientes.isPositive}
                color="green"
                onClick={() => {
                  setActiveSection('clientes');
                  toast.info('Redirigiendo a Clientes');
                }}
              />
              <StatsCard
                title="Órdenes"
                value={dashboardStats.totalOrdenes.value}
                change={dashboardStats.totalOrdenes.change}
                isPositive={dashboardStats.totalOrdenes.isPositive}
                color="orange"
                onClick={() => {
                  setActiveSection('ordenes');
                  toast.info('Redirigiendo a Órdenes');
                }}
              />
              <StatsCard
                title="Productos"
                value={dashboardStats.totalProductos.value}
                change={dashboardStats.totalProductos.change}
                isPositive={dashboardStats.totalProductos.isPositive}
                color="purple"
                onClick={() => {
                  setActiveSection('existencias');
                  toast.info('Redirigiendo a Existencias');
                }}
              />
            </div>

            {/* Gráficas del Dashboard */}
            <DashboardCharts 
              salesData={salesData} 
              inventoryData={inventoryData} 
              revenueData={revenueData} 
            />
          </div>
        )}

        {/* Renderizado Condicional de Secciones */}
        {activeSection === 'existencias' && (
          <Existencias 
            selectedBodega={selectedBodega} 
            onNavigateToTraslados={() => setActiveSection('traslados')} 
          />
        )}
        {activeSection === 'traslados' && <Traslados selectedBodega={selectedBodega} />}
        {activeSection === 'bodegas' && <Bodegas />}
        {activeSection === 'proveedores' && <Proveedores selectedBodega={selectedBodega} />}
        {activeSection === 'ordenescompra' && <Compras selectedBodega={selectedBodega} />}
        {activeSection === 'remisionescompra' && <RemisionesCompra selectedBodega={selectedBodega} />}
        {activeSection === 'clientes' && <Clientes selectedBodega={selectedBodega} />}
        {activeSection === 'cotizaciones' && <Cotizaciones selectedBodega={selectedBodega} />}
        {activeSection === 'ordenes' && <Ordenes currentUser={currentUser} selectedBodega={selectedBodega} />}
        {activeSection === 'remisiones' && <Remisiones currentUser={currentUser} selectedBodega={selectedBodega} />}
        {activeSection === 'pagos' && <PagosAbonos currentUser={currentUser} selectedBodega={selectedBodega} />}
        {activeSection === 'roles' && <Roles />}
        {activeSection === 'usuarios' && <Usuarios selectedBodega={selectedBodega} />}
        {activeSection === 'perfil' && (
          <Perfil 
            currentUser={currentUser} 
            onBack={() => setActiveSection('dashboard')} 
            onUserUpdate={onUserUpdate} 
          />
        )}
      </motion.div>
    </MainLayout>
  );
}