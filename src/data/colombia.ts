// Departamentos y municipios de Colombia
export interface DepartamentoData {
  nombre: string;
  municipios: string[];
}

export const departamentosColombia: DepartamentoData[] = [
  {
    nombre: 'Amazonas',
    municipios: ['Leticia', 'Puerto Nariño']
  },
  {
    nombre: 'Antioquia',
    municipios: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro', 'Apartadó', 'Turbo', 'Caucasia', 'Sabaneta', 'La Estrella']
  },
  {
    nombre: 'Arauca',
    municipios: ['Arauca', 'Arauquita', 'Fortul', 'Puerto Rondón', 'Saravena', 'Tame', 'Cravo Norte']
  },
  {
    nombre: 'Atlántico',
    municipios: ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Puerto Colombia', 'Galapa', 'Santo Tomás', 'Baranoa', 'Juan de Acosta', 'Polonuevo']
  },
  {
    nombre: 'Bolívar',
    municipios: ['Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar', 'Simití', 'Santa Rosa del Sur', 'Mompós', 'Mahates', 'San Juan Nepomuceno']
  },
  {
    nombre: 'Boyacá',
    municipios: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa', 'Villa de Leyva', 'Puerto Boyacá', 'Moniquirá', 'Samacá', 'Nobsa']
  },
  {
    nombre: 'Caldas',
    municipios: ['Manizales', 'La Dorada', 'Chinchiná', 'Villamaría', 'Riosucio', 'Anserma', 'Palestina', 'Aguadas', 'Supía', 'Neira']
  },
  {
    nombre: 'Caquetá',
    municipios: ['Florencia', 'San Vicente del Caguán', 'Puerto Rico', 'El Doncello', 'El Paujil', 'La Montañita', 'Belén de los Andaquíes', 'Albania', 'Curillo', 'Morelia']
  },
  {
    nombre: 'Casanare',
    municipios: ['Yopal', 'Aguazul', 'Villanueva', 'Monterrey', 'Tauramena', 'Paz de Ariporo', 'Maní', 'Trinidad', 'Hato Corozal', 'Pore']
  },
  {
    nombre: 'Cauca',
    municipios: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía', 'Guachené', 'Miranda', 'Corinto', 'Piendamó', 'Caloto', 'Villa Rica']
  },
  {
    nombre: 'Cesar',
    municipios: ['Valledupar', 'Aguachica', 'Bosconia', 'Codazzi', 'La Paz', 'Agustín Codazzi', 'San Diego', 'Curumaní', 'Chimichagua', 'Chiriguaná']
  },
  {
    nombre: 'Chocó',
    municipios: ['Quibdó', 'Istmina', 'Condoto', 'Tadó', 'Acandí', 'Nuquí', 'Bahía Solano', 'El Carmen de Atrato', 'Medio Atrato', 'Bojayá']
  },
  {
    nombre: 'Córdoba',
    municipios: ['Montería', 'Cereté', 'Lorica', 'Sahagún', 'Montelíbano', 'Tierralta', 'Planeta Rica', 'Ayapel', 'Ciénaga de Oro', 'San Pelayo']
  },
  {
    nombre: 'Cundinamarca',
    municipios: ['Bogotá D.C.', 'Soacha', 'Facatativá', 'Zipaquirá', 'Chía', 'Fusagasugá', 'Madrid', 'Mosquera', 'Funza', 'Girardot']
  },
  {
    nombre: 'Guainía',
    municipios: ['Inírida', 'Barranco Minas', 'Mapiripana', 'San Felipe', 'Puerto Colombia', 'La Guadalupe', 'Cacahual', 'Pana Pana', 'Morichal']
  },
  {
    nombre: 'Guaviare',
    municipios: ['San José del Guaviare', 'Calamar', 'El Retorno', 'Miraflores']
  },
  {
    nombre: 'Huila',
    municipios: ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'Algeciras', 'Isnos', 'Rivera', 'Aipe', 'Gigante']
  },
  {
    nombre: 'La Guajira',
    municipios: ['Riohacha', 'Maicao', 'Uribia', 'Manaure', 'Fonseca', 'San Juan del Cesar', 'Albania', 'Villanueva', 'Dibulla', 'Barrancas']
  },
  {
    nombre: 'Magdalena',
    municipios: ['Santa Marta', 'Ciénaga', 'Zona Bananera', 'Fundación', 'Plato', 'El Banco', 'Pivijay', 'Aracataca', 'Santa Ana', 'Sitionuevo']
  },
  {
    nombre: 'Meta',
    municipios: ['Villavicencio', 'Acacías', 'Granada', 'San Martín', 'Puerto López', 'Cumaral', 'Restrepo', 'Puerto Gaitán', 'Guamal', 'Cabuyaro']
  },
  {
    nombre: 'Nariño',
    municipios: ['Pasto', 'Tumaco', 'Ipiales', 'Túquerres', 'Barbacoas', 'Samaniego', 'La Unión', 'Sandoná', 'Cumbal', 'El Charco']
  },
  {
    nombre: 'Norte de Santander',
    municipios: ['Cúcuta', 'Ocaña', 'Villa del Rosario', 'Los Patios', 'Pamplona', 'Villa Caro', 'Tibú', 'El Zulia', 'San Cayetano', 'Sardinata']
  },
  {
    nombre: 'Putumayo',
    municipios: ['Mocoa', 'Puerto Asís', 'Valle del Guamuez', 'Orito', 'Puerto Guzmán', 'Villagarzón', 'San Miguel', 'Puerto Leguízamo', 'Sibundoy', 'Colón']
  },
  {
    nombre: 'Quindío',
    municipios: ['Armenia', 'Calarcá', 'La Tebaida', 'Montenegro', 'Quimbaya', 'Circasia', 'Salento', 'Filandia', 'Córdoba', 'Buenavista']
  },
  {
    nombre: 'Risaralda',
    municipios: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia', 'Marsella', 'Belén de Umbría', 'Apía', 'Pueblo Rico', 'Quinchía', 'Balboa']
  },
  {
    nombre: 'San Andrés y Providencia',
    municipios: ['San Andrés', 'Providencia']
  },
  {
    nombre: 'Santander',
    municipios: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil', 'Málaga', 'Barbosa', 'Socorro', 'Vélez']
  },
  {
    nombre: 'Sucre',
    municipios: ['Sincelejo', 'Corozal', 'Sampués', 'Tolú', 'San Marcos', 'Sincé', 'San Onofre', 'Majagual', 'Coveñas', 'Los Palmitos']
  },
  {
    nombre: 'Tolima',
    municipios: ['Ibagué', 'Espinal', 'Melgar', 'Honda', 'Líbano', 'Mariquita', 'Chaparral', 'Purificación', 'Guamo', 'Flandes']
  },
  {
    nombre: 'Valle del Cauca',
    municipios: ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Buga', 'Jamundí', 'Yumbo', 'Candelaria', 'Florida']
  },
  {
    nombre: 'Vaupés',
    municipios: ['Mitú', 'Carurú', 'Taraira', 'Papunaua', 'Yavaraté', 'Pacoa']
  },
  {
    nombre: 'Vichada',
    municipios: ['Puerto Carreño', 'La Primavera', 'Santa Rosalía', 'Cumaribo']
  }
];
