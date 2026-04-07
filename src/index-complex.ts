// Ponto de entrada principal do módulo de licenciamento

// Provider principal
export { default as LicensingProvider } from './components/LicensingProvider';

// Hooks
export { useLicense, useMachineInfo, useLicenseStats } from './hooks';

// Utilitários
export { LicenseManager } from './utils/LicenseManager';
export { MachineDetector } from './utils/MachineDetector';
export { CryptoHelper } from './utils/CryptoHelper';
export { PricingHelper } from './utils/PricingHelper';
export { ApiClient } from './utils/ApiClient';

// Configurações
export { defaultConfig } from './config/default';

// Tipos
export type {
  LicenseInfo,
  LicensePlan,
  LicenseConfig,
  PlanConfig,
  ActivationRequest,
  ActivationResponse,
  ValidationRequest,
  ValidationResponse,
  MachineInfo,
  LicenseUsage,
  LicenseStats,
  LicenseContextValue,
  LicenseProviderProps,
  UseLicenseReturn,
  UseMachineInfoReturn,
  PricingHelpers,
  ApiClient,
  LicensingEventMap,
  LicensingError,
  ErrorCode
} from './types';

// Configurações padrão
export { defaultConfig } from './config/default';

// Versão
export const VERSION = '1.0.0';

// Exportação padrão
export default LicensingProvider;
