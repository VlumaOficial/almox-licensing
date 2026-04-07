// Tipos principais do sistema de licenciamento

export interface LicenseInfo {
  key: string;
  plan: LicensePlan;
  expiry: string;
  machineId: string;
  isValid: boolean;
  daysRemaining: number;
  features: string[];
  activatedAt?: string;
  lastValidated?: string;
}

export type LicensePlan = 
  | 'trial'
  | 'basic' 
  | 'professional'
  | 'enterprise'
  | 'perpetual_cloud'
  | 'perpetual_local';

export interface LicenseConfig {
  // Configuração da API
  api: {
    endpoint: string;
    apiKey: string;
    timeout?: number;
    retries?: number;
  };
  
  // Configuração do banco
  database: {
    type: 'postgresql' | 'supabase' | 'mysql';
    host?: string;
    port?: number;
    database: string;
    username?: string;
    password?: string;
    connectionString?: string;
  };
  
  // Configuração dos planos
  plans: PlanConfig;
  
  // Configuração de validação
  validation: {
    onlineCheckInterval: number; // minutos
    offlineGracePeriod: number; // dias
    maxMachines: number;
  };
  
  // Configuração de segurança
  security: {
    encryptionKey: string;
    hashAlgorithm: string;
    machineFingerprint: boolean;
  };
}

export interface PlanConfig {
  trial: {
    days: number;
    users: number;
    materials: number;
    features: string[];
  };
  
  basic: {
    monthly: number;
    quarterly: number;
    semiannual: number;
    yearly: number;
    users: number;
    materials: number;
    features: string[];
  };
  
  professional: {
    monthly: number;
    quarterly: number;
    semiannual: number;
    yearly: number;
    users: number;
    materials: number;
    features: string[];
  };
  
  enterprise: {
    monthly: number;
    quarterly: number;
    semiannual: number;
    yearly: number;
    users: number;
    materials: number;
    features: string[];
  };
  
  perpetual: {
    cloud: number;
    local: number;
    features: string[];
  };
}

export interface ActivationRequest {
  key: string;
  machineId: string;
  email?: string;
  metadata?: Record<string, any>;
}

export interface ActivationResponse {
  success: boolean;
  license?: {
    plan: LicensePlan;
    expires_at: string;
    features: string[];
    machine_limit: number;
  };
  error?: string;
  code?: string;
}

export interface ValidationRequest {
  key: string;
  machineId: string;
  lastValidated?: string;
}

export interface ValidationResponse {
  success: boolean;
  license?: LicenseInfo;
  error?: string;
  code?: string;
}

export interface MachineInfo {
  id: string;
  fingerprint: string;
  userAgent: string;
  platform: string;
  cores: number;
  memory: number;
  firstSeen: string;
  lastSeen: string;
  isActive: boolean;
}

export interface LicenseUsage {
  licenseKey: string;
  machineId: string;
  timestamp: string;
  action: 'validate' | 'activate' | 'deactivate' | 'check';
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface LicenseStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  trialLicenses: number;
  perpetualLicenses: number;
  totalMachines: number;
  activeMachines: number;
  revenue: {
    monthly: number;
    yearly: number;
    total: number;
  };
  plans: {
    [key in LicensePlan]: {
      count: number;
      revenue: number;
    };
  };
}

// Tipos para componentes React
export interface LicenseContextValue {
  licenseInfo: LicenseInfo | null;
  isLoading: boolean;
  error: string | null;
  isValid: boolean;
  plan: LicensePlan | null;
  daysRemaining: number;
  features: string[];
  activateLicense: (key: string) => Promise<boolean>;
  validateLicense: () => Promise<void>;
  refreshLicense: () => Promise<void>;
  deactivateLicense: () => Promise<boolean>;
}

export interface LicenseProviderProps {
  children: React.ReactNode;
  config: LicenseConfig;
  onLicenseChange?: (license: LicenseInfo | null) => void;
  onError?: (error: string) => void;
}

// Tipos para hooks
export interface UseLicenseReturn extends LicenseContextValue {}

export interface UseMachineInfoReturn {
  machineId: string;
  fingerprint: string;
  info: MachineInfo;
  isLoading: boolean;
  error: string | null;
}

// Tipos para utilitários
export interface PricingHelpers {
  formatCurrency: (value: number, currency?: string) => string;
  calculateDiscountedPrice: (basePrice: number, discountRate: number) => number;
  getQuarterlyPrice: (monthlyPrice: number) => number;
  getSemianualPrice: (monthlyPrice: number) => number;
  getYearlyPrice: (monthlyPrice: number) => number;
  displayLimit: (value: number) => string;
  isUnlimited: (value: number) => boolean;
}

// Tipos para API
export interface ApiClient {
  activate: (request: ActivationRequest) => Promise<ActivationResponse>;
  validate: (request: ValidationRequest) => Promise<ValidationResponse>;
  deactivate: (machineId: string) => Promise<boolean>;
  getStats: () => Promise<LicenseStats>;
  getUsage: (licenseKey: string) => Promise<LicenseUsage[]>;
}

// Tipos para eventos
export interface LicensingEventMap {
  'license-activated': { license: LicenseInfo };
  'license-deactivated': { license: LicenseInfo };
  'license-expired': { license: LicenseInfo };
  'license-refreshed': { license: LicenseInfo };
  'validation-failed': { error: string; code: string };
  'activation-failed': { error: string; code: string };
  'machine-changed': { oldMachine: string; newMachine: string };
}

// Tipos para erros
export class LicensingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'LicensingError';
  }
}

export type ErrorCode = 
  | 'INVALID_KEY'
  | 'EXPIRED_LICENSE'
  | 'MACHINE_LIMIT_EXCEEDED'
  | 'PLAN_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'VALIDATION_FAILED'
  | 'ACTIVATION_FAILED'
  | 'DEACTIVATION_FAILED'
  | 'CONFIG_ERROR'
  | 'ENCRYPTION_ERROR';

// Exportações
export * from './components';
export * from './hooks';
export * from './utils';
export * from './api';
