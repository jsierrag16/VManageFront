// Tipos de permisos por módulo
export interface Permisos {
  // Inventario
  inventario: {
    existencias: {
      crear: boolean;
    };
    productos: {
      crear: boolean;
      darDeBaja: boolean;
    };
    traslados: {
      crear: boolean;
    };
    bodegas: {
      crear: boolean;
      editar: boolean;
      eliminar: boolean;
    };
  };
  // Compras
  compras: {
    proveedores: {
      crear: boolean;
      editar: boolean;
      eliminar: boolean;
    };
    ordenesCompra: {
      crear: boolean;
      editar: boolean;
      eliminar: boolean;
      cambiarEstado: boolean;
    };
    remisionesCompra: {
      crear: boolean;
      editar: boolean;
      eliminar: boolean;
      cambiarEstado: boolean;
    };
  };
  // Ventas
  ventas: {
    clientes: {
      crear: boolean;
      editar: boolean;
      eliminar: boolean;
    };
    ordenes: {
      crear: boolean;
      editar: boolean;
      eliminar: boolean;
      cambiarEstado: boolean;
    };
    remisionesVenta: {
      crear: boolean;
      editar: boolean;
      eliminar: boolean;
      cambiarEstado: boolean;
    };
    pagosAbonos: {
      crear: boolean;
      editar: boolean;
      eliminar: boolean;
      cambiarEstado: boolean;
    };
  };
  // Configuración
  configuracion: {
    roles: {
      crear: boolean;
      editar: boolean;
      eliminar: boolean;
      inhabilitar: boolean;
    };
  };
  // Usuarios
  usuarios: {
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
    inhabilitar: boolean;
  };
  // Dashboard (al final)
  dashboard: {
    acceder: boolean;
  };
}

// Tipo de Rol
export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  permisos: Permisos;
  usuariosAsignados: number;
  estado: boolean;
}

// Función para crear permisos vacíos (todos en false)
export const createEmptyPermisos = (): Permisos => ({
  inventario: {
    existencias: {
      crear: false,
    },
    productos: {
      crear: false,
      darDeBaja: false,
    },
    traslados: {
      crear: false,
    },
    bodegas: {
      crear: false,
      editar: false,
      eliminar: false,
    },
  },
  compras: {
    proveedores: {
      crear: false,
      editar: false,
      eliminar: false,
    },
    ordenesCompra: {
      crear: false,
      editar: false,
      eliminar: false,
      cambiarEstado: false,
    },
    remisionesCompra: {
      crear: false,
      editar: false,
      eliminar: false,
      cambiarEstado: false,
    },
  },
  ventas: {
    clientes: {
      crear: false,
      editar: false,
      eliminar: false,
    },
    ordenes: {
      crear: false,
      editar: false,
      eliminar: false,
      cambiarEstado: false,
    },
    remisionesVenta: {
      crear: false,
      editar: false,
      eliminar: false,
      cambiarEstado: false,
    },
    pagosAbonos: {
      crear: false,
      editar: false,
      eliminar: false,
      cambiarEstado: false,
    },
  },
  configuracion: {
    roles: {
      crear: false,
      editar: false,
      eliminar: false,
      inhabilitar: false,
    },
  },
  usuarios: {
    crear: false,
    editar: false,
    eliminar: false,
    inhabilitar: false,
  },
  dashboard: {
    acceder: false,
  },
});

// Función para crear permisos completos (todos en true)
export const createFullPermisos = (): Permisos => ({
  inventario: {
    existencias: {
      crear: true,
    },
    productos: {
      crear: true,
      darDeBaja: true,
    },
    traslados: {
      crear: true,
    },
    bodegas: {
      crear: true,
      editar: true,
      eliminar: true,
    },
  },
  compras: {
    proveedores: {
      crear: true,
      editar: true,
      eliminar: true,
    },
    ordenesCompra: {
      crear: true,
      editar: true,
      eliminar: true,
      cambiarEstado: true,
    },
    remisionesCompra: {
      crear: true,
      editar: true,
      eliminar: true,
      cambiarEstado: true,
    },
  },
  ventas: {
    clientes: {
      crear: true,
      editar: true,
      eliminar: true,
    },
    ordenes: {
      crear: true,
      editar: true,
      eliminar: true,
      cambiarEstado: true,
    },
    remisionesVenta: {
      crear: true,
      editar: true,
      eliminar: true,
      cambiarEstado: true,
    },
    pagosAbonos: {
      crear: true,
      editar: true,
      eliminar: true,
      cambiarEstado: true,
    },
  },
  configuracion: {
    roles: {
      crear: true,
      editar: true,
      eliminar: true,
      inhabilitar: true,
    },
  },
  usuarios: {
    crear: true,
    editar: true,
    eliminar: true,
    inhabilitar: true,
  },
  dashboard: {
    acceder: true,
  },
});

// Datos iniciales de roles
export const rolesData: Rol[] = [
  {
    id: 1,
    nombre: 'Administrador',
    descripcion: 'Acceso completo a todas las funcionalidades del sistema',
    permisos: createFullPermisos(),
    usuariosAsignados: 2,
    estado: true,
  },
  {
    id: 4,
    nombre: 'Vendedor',
    descripcion: 'Creación de órdenes de venta y gestión básica de clientes',
    permisos: {
      inventario: {
        existencias: {
          crear: false,
        },
        productos: {
          crear: false,
          darDeBaja: false,
        },
        traslados: {
          crear: false,
        },
        bodegas: {
          crear: false,
          editar: false,
          eliminar: false,
        },
      },
      compras: {
        proveedores: {
          crear: false,
          editar: false,
          eliminar: false,
        },
        ordenesCompra: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
        remisionesCompra: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
      },
      ventas: {
        clientes: {
          crear: true,
          editar: false,
          eliminar: false,
        },
        ordenes: {
          crear: true,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
        remisionesVenta: {
          crear: true,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
        pagosAbonos: {
          crear: true,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
      },
      configuracion: {
        roles: {
          crear: false,
          editar: false,
          eliminar: false,
          inhabilitar: false,
        },
      },
      usuarios: {
        crear: false,
        editar: false,
        eliminar: false,
        inhabilitar: false,
      },
      dashboard: {
        acceder: true,
      },
    },
    usuariosAsignados: 8,
    estado: true,
  },
  {
    id: 8,
    nombre: 'Auxiliar Administrativo',
    descripcion: 'Gestión administrativa y apoyo en compras y ventas',
    permisos: {
      inventario: {
        existencias: {
          crear: false,
        },
        productos: {
          crear: false,
          darDeBaja: false,
        },
        traslados: {
          crear: false,
        },
        bodegas: {
          crear: false,
          editar: false,
          eliminar: false,
        },
      },
      compras: {
        proveedores: {
          crear: true,
          editar: true,
          eliminar: false,
        },
        ordenesCompra: {
          crear: true,
          editar: true,
          eliminar: false,
          cambiarEstado: false,
        },
        remisionesCompra: {
          crear: true,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
      },
      ventas: {
        clientes: {
          crear: true,
          editar: true,
          eliminar: false,
        },
        ordenes: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
        remisionesVenta: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
        pagosAbonos: {
          crear: true,
          editar: true,
          eliminar: false,
          cambiarEstado: false,
        },
      },
      configuracion: {
        roles: {
          crear: false,
          editar: false,
          eliminar: false,
          inhabilitar: false,
        },
      },
      usuarios: {
        crear: false,
        editar: false,
        eliminar: false,
        inhabilitar: false,
      },
      dashboard: {
        acceder: true,
      },
    },
    usuariosAsignados: 3,
    estado: true,
  },
  {
    id: 5,
    nombre: 'Auxiliar de Bodega',
    descripcion: 'Gestión de inventario y traslados entre bodegas',
    permisos: {
      inventario: {
        existencias: {
          crear: true,
        },
        productos: {
          crear: false,
          darDeBaja: false,
        },
        traslados: {
          crear: true,
        },
        bodegas: {
          crear: false,
          editar: false,
          eliminar: false,
        },
      },
      compras: {
        proveedores: {
          crear: false,
          editar: false,
          eliminar: false,
        },
        ordenesCompra: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
        remisionesCompra: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
      },
      ventas: {
        clientes: {
          crear: false,
          editar: false,
          eliminar: false,
        },
        ordenes: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
        remisionesVenta: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
        pagosAbonos: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
      },
      configuracion: {
        roles: {
          crear: false,
          editar: false,
          eliminar: false,
          inhabilitar: false,
        },
      },
      usuarios: {
        crear: false,
        editar: false,
        eliminar: false,
        inhabilitar: false,
      },
      dashboard: {
        acceder: true,
      },
    },
    usuariosAsignados: 5,
    estado: true,
  },
  {
    id: 9,
    nombre: 'Conductor',
    descripcion: 'Gestión de entregas y traslados de mercancía',
    permisos: {
      inventario: {
        existencias: {
          crear: false,
        },
        productos: {
          crear: false,
          darDeBaja: false,
        },
        traslados: {
          crear: false,
        },
        bodegas: {
          crear: false,
          editar: false,
          eliminar: false,
        },
      },
      compras: {
        proveedores: {
          crear: false,
          editar: false,
          eliminar: false,
        },
        ordenesCompra: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
        remisionesCompra: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: true,
        },
      },
      ventas: {
        clientes: {
          crear: false,
          editar: false,
          eliminar: false,
        },
        ordenes: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
        remisionesVenta: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
        pagosAbonos: {
          crear: false,
          editar: false,
          eliminar: false,
          cambiarEstado: false,
        },
      },
      configuracion: {
        roles: {
          crear: false,
          editar: false,
          eliminar: false,
          inhabilitar: false,
        },
      },
      usuarios: {
        crear: false,
        editar: false,
        eliminar: false,
        inhabilitar: false,
      },
      dashboard: {
        acceder: true,
      },
    },
    usuariosAsignados: 4,
    estado: true,
  },
  {
    id: 7,
    nombre: 'Rol de Prueba',
    descripcion: 'Rol sin usuarios asignados para pruebas de eliminación',
    permisos: createEmptyPermisos(),
    usuariosAsignados: 0,
    estado: false,
  },
];
