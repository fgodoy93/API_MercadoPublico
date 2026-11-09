import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const hasValidDatabaseUrl = Boolean(
  process.env.DATABASE_URL && process.env.DATABASE_URL.trim().startsWith('postgres')
);

const sequelize = hasValidDatabaseUrl
  ? new Sequelize(process.env.DATABASE_URL.trim(), {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: process.env.DB_SSL === 'false'
        ? {}
        : {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

// Modelos
const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  contrasena: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  underscored: true
});

const PerfilEmpresa = sequelize.define('PerfilEmpresa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  nombreEmpresa: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  rutEmpresa: {
    type: DataTypes.STRING(20)
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  servicios: {
    type: DataTypes.TEXT
  },
  experienciaAnos: {
    type: DataTypes.INTEGER
  },
  regiones: {
    type: DataTypes.STRING(255)
  },
  tiposLicitacion: {
    type: DataTypes.STRING(255)
  },
  presupuestoMinimo: {
    type: DataTypes.DECIMAL(15, 2)
  },
  presupuestoMaximo: {
    type: DataTypes.DECIMAL(15, 2)
  },
  rubrosPrincipales: {
    type: DataTypes.TEXT
  },
  palabrasExcluidas: {
    type: DataTypes.TEXT
  },
  coberturaNacional: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  habilitadoChileProveedores: {
    type: DataTypes.STRING(50),
    defaultValue: 'si'
  },
  capacidadGarantia: {
    type: DataTypes.DECIMAL(15, 2)
  },
  interesCompraAgil: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  certificaciones: {
    type: DataTypes.TEXT
  },
  esActivo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'perfiles_empresa',
  timestamps: true,
  underscored: true
});

const LicitacionGuardada = sequelize.define('LicitacionGuardada', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  codigoLicitacion: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  datosLicitacion: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  nivelMatch: {
    type: DataTypes.INTEGER
  },
  analisisIa: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  estado: {
    type: DataTypes.STRING(50)
  },
  perfilId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  etapaPipeline: {
    type: DataTypes.STRING(50),
    defaultValue: 'evaluacion'
  },
  montoOfertado: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  costoEstimado: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  notasInternas: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  checklist: {
    type: DataTypes.JSONB,
    defaultValue: {
      basesLeidas: false,
      preguntasForo: false,
      anexoAdministrativo: false,
      ofertaTecnica: false,
      ofertaEconomica: false,
      garantiaLista: false
    }
  }
}, {
  tableName: 'licitaciones_guardadas',
  timestamps: true,
  underscored: true
});

const FiltroBusqueda = sequelize.define('FiltroBusqueda', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  nombreFiltro: {
    type: DataTypes.STRING(255)
  },
  palabraClave: {
    type: DataTypes.STRING(255)
  },
  codigoOrganismo: {
    type: DataTypes.STRING(50)
  },
  region: {
    type: DataTypes.STRING(100)
  },
  tipoLicitacion: {
    type: DataTypes.STRING(50)
  },
  montoMinimo: {
    type: DataTypes.DECIMAL(15, 2)
  },
  montoMaximo: {
    type: DataTypes.DECIMAL(15, 2)
  },
  fechaInicio: {
    type: DataTypes.DATE
  },
  fechaFin: {
    type: DataTypes.DATE
  },
  estadoLicitacion: {
    type: DataTypes.STRING(50)
  }
}, {
  tableName: 'filtros_busqueda',
  timestamps: true,
  underscored: true,
  updatedAt: false
});

const LicitacionCache = sequelize.define('LicitacionCache', {
  codigoExterno: {
    type: DataTypes.STRING(100),
    primaryKey: true
  },
  datos: {
    type: DataTypes.JSONB,
    allowNull: false
  }
}, {
  tableName: 'licitaciones_cache',
  timestamps: true,
  underscored: true
});

// Relaciones
Usuario.hasMany(PerfilEmpresa, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
PerfilEmpresa.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Usuario.hasMany(LicitacionGuardada, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
LicitacionGuardada.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Usuario.hasMany(FiltroBusqueda, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
FiltroBusqueda.belongsTo(Usuario, { foreignKey: 'usuarioId' });

export { sequelize, Usuario, PerfilEmpresa, LicitacionGuardada, FiltroBusqueda, LicitacionCache };
