export interface Permisos {
  dashboard: {
    acceder: boolean;
  };

  existencias: {
    productos: {
      ver: boolean;
      crear: boolean;
      editar: boolean;
      cambiarEstado: boolean;
    };
    traslados: {
      ver: boolean;
      crear: boolean;
      editar: boolean;
      cambiarEstado: boolean;
      anular: boolean;
    };
    bodegas: {
      ver: boolean;
      crear: boolean;
      editar: boolean;
      cambiarEstado: boolean;
      eliminar: boolean;
    };
  };

  compras: {
    proveedores: {
      ver: boolean;
      crear: boolean;
      editar: boolean;
      cambiarEstado: boolean;
      eliminar: boolean;
    };
    ordenesCompra: {
      ver: boolean;
      crear: boolean;
      descargar: boolean;
      editar: boolean;
      cambiarEstado: boolean;
      anular: boolean;
    };
    remisionesCompra: {
      ver: boolean;
      crear: boolean;
      descargar: boolean;
      editar: boolean;
      cambiarEstado: boolean;
      anular: boolean;
    };
  };

  ventas: {
    clientes: {
      ver: boolean;
      crear: boolean;
      editar: boolean;
      cambiarEstado: boolean;
      eliminar: boolean;
    };
    cotizaciones: {
      ver: boolean;
      crear: boolean;
      descargar: boolean;
      editar: boolean;
      cambiarEstado: boolean;
      anular: boolean;
    };
    ordenesVenta: {
      ver: boolean;
      crear: boolean;
      descargar: boolean;
      editar: boolean;
      cambiarEstado: boolean;
      anular: boolean;
    };
    remisionesVenta: {
      ver: boolean;
      crear: boolean;
      descargar: boolean;
      editar: boolean;
      cambiarEstado: boolean;
      anular: boolean;
    };
    pagos: {
      ver: boolean;
      crear: boolean;
      agregarAbonos: boolean;
      anular: boolean;
    };
  };

  administracion: {
    roles: {
      ver: boolean;
      crear: boolean;
      editar: boolean;
      cambiarEstado: boolean;
      eliminar: boolean;
    };
    usuarios: {
      ver: boolean;
      crear: boolean;
      editar: boolean;
      eliminar: boolean;
      cambiarEstado: boolean;
      restablecerContrasena: boolean;
    };

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

// Función para crear permisos vacíos
export const createEmptyPermisos = (): Permisos => ({
  dashboard: {
    acceder: false,
  },

  existencias: {
    productos: {
      ver: false,
      crear: false,
      editar: false,
      cambiarEstado: false,
    },
    traslados: {
      ver: false,
      crear: false,
      editar: false,
      cambiarEstado: false,
      anular: false,
    },
    bodegas: {
      ver: false,
      crear: false,
      editar: false,
      cambiarEstado: false,
      eliminar: false,
    },
  },

  compras: {
    proveedores: {
      ver: false,
      crear: false,
      editar: false,
      cambiarEstado: false,
      eliminar: false,
    },
    ordenesCompra: {
      ver: false,
      crear: false,
      descargar: false,
      editar: false,
      cambiarEstado: false,
      anular: false,
    },
    remisionesCompra: {
      ver: false,
      crear: false,
      descargar: false,
      editar: false,
      cambiarEstado: false,
      anular: false,
    },
  },

  ventas: {
    clientes: {
      ver: false,
      crear: false,
      editar: false,
      cambiarEstado: false,
      eliminar: false,
    },
    cotizaciones: {
      ver: false,
      crear: false,
      descargar: false,
      editar: false,
      cambiarEstado: false,
      anular: false,
    },
    ordenesVenta: {
      ver: false,
      crear: false,
      descargar: false,
      editar: false,
      cambiarEstado: false,
      anular: false,
    },
    remisionesVenta: {
      ver: false,
      crear: false,
      descargar: false,
      editar: false,
      cambiarEstado: false,
      anular: false,
    },
    pagos: {
      ver: false,
      crear: false,
      agregarAbonos: false,
      anular: false,
    },
  },

  administracion: {
    roles: {
      ver: false,
      crear: false,
      editar: false,
      cambiarEstado: false,
      eliminar: false,
    },
    usuarios: {
      ver: false,
      crear: false,
      editar: false,
      eliminar: false,
      cambiarEstado: false,
      restablecerContrasena: false,
    },
  },
});

// Función para crear permisos completos
export const createFullPermisos = (): Permisos => ({
  dashboard: {
    acceder: true,
  },

  existencias: {
    productos: {
      ver: true,
      crear: true,
      editar: true,
      cambiarEstado: true,
    },
    traslados: {
      ver: true,
      crear: true,
      editar: true,
      cambiarEstado: true,
      anular: true,
    },
    bodegas: {
      ver: true,
      crear: true,
      editar: true,
      cambiarEstado: true,
      eliminar: true,
    },
  },

  compras: {
    proveedores: {
      ver: true,
      crear: true,
      editar: true,
      cambiarEstado: true,
      eliminar: true,
    },
    ordenesCompra: {
      ver: true,
      crear: true,
      descargar: true,
      editar: true,
      cambiarEstado: true,
      anular: true,
    },
    remisionesCompra: {
      ver: true,
      crear: true,
      descargar: true,
      editar: true,
      cambiarEstado: true,
      anular: true,
    },
  },

  ventas: {
    clientes: {
      ver: true,
      crear: true,
      editar: true,
      cambiarEstado: true,
      eliminar: true,
    },
    cotizaciones: {
      ver: true,
      crear: true,
      descargar: true,
      editar: true,
      cambiarEstado: true,
      anular: true,
    },
    ordenesVenta: {
      ver: true,
      crear: true,
      descargar: true,
      editar: true,
      cambiarEstado: true,
      anular: true,
    },
    remisionesVenta: {
      ver: true,
      crear: true,
      descargar: true,
      editar: true,
      cambiarEstado: true,
      anular: true,
    },
    pagos: {
      ver: true,
      crear: true,
      agregarAbonos: true,
      anular: true,
    },
  },

  administracion: {
    roles: {
      ver: true,
      crear: true,
      editar: true,
      cambiarEstado: true,
      eliminar: true,
    },
    usuarios: {
      ver: true,
      crear: true,
      editar: true,
      eliminar: true,
      cambiarEstado: true,
      restablecerContrasena: true,
    },
  },
});

// Datos iniciales de roles
export const rolesData: Rol[] = [
  {
    id: 1,
    nombre: "Administrador",
    descripcion: "Acceso completo a todas las funcionalidades del sistema",
    permisos: createFullPermisos(),
    usuariosAsignados: 2,
    estado: true,
  },
  {
    id: 4,
    nombre: "Vendedor",
    descripcion: "Gestión comercial de clientes, cotizaciones, órdenes, remisiones y pagos",
    permisos: {
      ...createEmptyPermisos(),
      dashboard: { acceder: true },
      ventas: {
        clientes: {
          ver: true,
          crear: true,
          editar: true,
          cambiarEstado: false,
          eliminar: false,
        },
        cotizaciones: {
          ver: true,
          crear: true,
          descargar: true,
          editar: true,
          cambiarEstado: true,
          anular: true,
        },
        ordenesVenta: {
          ver: true,
          crear: true,
          descargar: true,
          editar: true,
          cambiarEstado: true,
          anular: true,
        },
        remisionesVenta: {
          ver: true,
          crear: true,
          descargar: true,
          editar: true,
          cambiarEstado: true,
          anular: true,
        },
        pagos: {
          ver: true,
          crear: true,
          agregarAbonos: true,
          anular: false,
        },
      },
      existencias: {
        ...createEmptyPermisos().existencias,
        productos: {
          ver: true,
          crear: false,
          editar: false,
          cambiarEstado: false,
        },
      },
    },
    usuariosAsignados: 8,
    estado: true,
  },
  {
    id: 8,
    nombre: "Auxiliar Administrativo",
    descripcion: "Apoyo administrativo en compras, ventas y pagos",
    permisos: {
      ...createEmptyPermisos(),
      dashboard: { acceder: true },
      compras: {
        proveedores: {
          ver: true,
          crear: true,
          editar: true,
          cambiarEstado: true,
          eliminar: false,
        },
        ordenesCompra: {
          ver: true,
          crear: true,
          descargar: true,
          editar: true,
          cambiarEstado: true,
          anular: false,
        },
        remisionesCompra: {
          ver: true,
          crear: true,
          descargar: true,
          editar: true,
          cambiarEstado: true,
          anular: false,
        },
      },
      ventas: {
        clientes: {
          ver: true,
          crear: true,
          editar: true,
          cambiarEstado: true,
          eliminar: false,
        },
        cotizaciones: {
          ver: true,
          crear: true,
          descargar: true,
          editar: true,
          cambiarEstado: true,
          anular: false,
        },
        ordenesVenta: {
          ver: true,
          crear: false,
          descargar: true,
          editar: false,
          cambiarEstado: false,
          anular: false,
        },
        remisionesVenta: {
          ver: true,
          crear: false,
          descargar: true,
          editar: false,
          cambiarEstado: false,
          anular: false,
        },
        pagos: {
          ver: true,
          crear: true,
          agregarAbonos: true,
          anular: false,
        },
      },
    },
    usuariosAsignados: 3,
    estado: true,
  },
  {
    id: 5,
    nombre: "Auxiliar de Bodega",
    descripcion: "Gestión de productos, existencias y traslados",
    permisos: {
      ...createEmptyPermisos(),
      dashboard: { acceder: true },
      existencias: {
        productos: {
          ver: true,
          crear: false,
          editar: false,
          cambiarEstado: false,
        },
        traslados: {
          ver: true,
          crear: true,
          editar: true,
          cambiarEstado: true,
          anular: true,
        },
        bodegas: {
          ver: true,
          crear: false,
          editar: false,
          cambiarEstado: false,
          eliminar: false,
        },
      },
    },
    usuariosAsignados: 5,
    estado: true,
  },
  {
    id: 9,
    nombre: "Conductor",
    descripcion: "Consulta y apoyo en remisiones y traslados",
    permisos: {
      ...createEmptyPermisos(),
      dashboard: { acceder: true },
      existencias: {
        ...createEmptyPermisos().existencias,
        traslados: {
          ver: true,
          crear: false,
          editar: false,
          cambiarEstado: true,
          anular: false,
        },
      },
      compras: {
        ...createEmptyPermisos().compras,
        remisionesCompra: {
          ver: true,
          crear: false,
          descargar: true,
          editar: false,
          cambiarEstado: true,
          anular: false,
        },
      },
      ventas: {
        ...createEmptyPermisos().ventas,
        remisionesVenta: {
          ver: true,
          crear: false,
          descargar: true,
          editar: false,
          cambiarEstado: true,
          anular: false,
        },
      },
    },
    usuariosAsignados: 4,
    estado: true,
  },
  {
    id: 7,
    nombre: "Rol de Prueba",
    descripcion: "Rol sin usuarios asignados para pruebas de eliminación",
    permisos: createEmptyPermisos(),
    usuariosAsignados: 0,
    estado: false,
  },
];