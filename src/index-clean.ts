// Exportação principal do módulo @almoxpro/licensing

// Componentes React
export { LicenseStatus } from './components/LicenseStatus';
export { LicenseGuard } from './components/LicenseGuard';
export { LicenseValidator, LicenseConfigPanel } from './components/LicenseValidator';

// Hooks
export { useLicense, LicenseProvider } from './hooks/useLicense';

// Utilitários
export { LicenseManager } from './utils/LicenseManager';
export { MachineDetector } from './utils/MachineDetector';
export { CryptoHelper } from './utils/CryptoHelper';

// Configurações
export { defaultConfig } from './config/default';

// Tipos
export type {
  LicenseInfo,
  LicensePlan,
  LicenseConfig,
  LicenseProviderProps,
  LicenseContextValue
} from './types';

// Exportação padrão
export { LicenseProvider as default } from './hooks/useLicense';
