// Ponto de entrada principal do módulo de licenciamento

// Provider principal
export { default as LicensingProvider } from './components/LicensingProvider';

// Hooks
export { useLicense } from './hooks/useLicense';
export { useMachineInfo } from './hooks/useMachineInfo';
export { useLicenseStats } from './hooks/useLicenseStats';

// Componentes
export { LicenseStatus } from './components/LicenseStatus';
export { LicenseHeader } from './components/LicenseHeader';
export { LicenseGuard } from './components/LicenseGuard';
export { LicenseDialog } from './components/LicenseDialog';
export { PricingCard } from './components/PricingCard';
export { LicenseBadge } from './components/LicenseBadge';

// Utilitários
export { LicenseManager } from './utils/LicenseManager';
export { MachineDetector } from './utils/MachineDetector';
export { CryptoHelper } from './utils/CryptoHelper';
export { PricingHelper } from './utils/PricingHelper';
export { ApiClient } from './utils/ApiClient';

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
