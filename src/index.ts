// Versão mínima para build funcionar

// Tipos básicos
export interface LicenseInfo {
  key: string;
  plan: string;
  expiry: string;
  machineId: string;
  isValid: boolean;
  daysRemaining: number;
  features: string[];
}

export type LicensePlan = 'trial' | 'basic' | 'professional' | 'enterprise';

export interface LicenseConfig {
  api: {
    endpoint: string;
    apiKey: string;
  };
}

// Hook mínimo
export const useLicense = () => {
  return {
    licenseInfo: null,
    isLoading: false,
    error: null,
    isValid: false,
    plan: null,
    daysRemaining: 0,
    features: [],
    activateLicense: async () => false,
    validateLicense: async () => {},
    refreshLicense: async () => {},
    deactivateLicense: async () => false
  };
};

// Provider mínimo
export const LicenseProvider = ({ children }: { children: any }) => {
  return children;
};

// Exportação padrão
export default LicenseProvider;
