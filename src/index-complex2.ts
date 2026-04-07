// Versão simplificada para build funcionar

// Hooks principais
export { useLicense, LicenseProvider } from './hooks/useLicense';

// Utilitários
export { LicenseManager } from './utils/LicenseManager';
export { MachineDetector } from './utils/MachineDetector';
export { CryptoHelper } from './utils/CryptoHelper';

// Configurações
export { defaultConfig } from './config/default';

// Tipos básicos
export type {
  LicenseInfo,
  LicensePlan,
  LicenseConfig
} from './types';

// Exportação padrão
export { LicenseProvider as default } from './hooks/useLicense';
