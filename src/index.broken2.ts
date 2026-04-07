// Versão funcional mínima do sistema de licenciamento
import React, { useState, useEffect, createContext, useContext } from 'react';

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

export interface LicenseContextValue {
  licenseInfo: LicenseInfo | null;
  isLoading: boolean;
  error: string | null;
  isValid: boolean;
  plan: string | null;
  daysRemaining: number;
  features: string[];
  activateLicense: (key: string) => Promise<boolean>;
  validateLicense: () => Promise<void>;
  refreshLicense: () => Promise<void>;
  deactivateLicense: () => Promise<boolean>;
}

export interface LicenseProviderProps {
  children: React.ReactNode;
  config: any;
  onLicenseChange?: (license: LicenseInfo | null) => void;
  onError?: (error: string) => void;
}

// Contexto
const LicenseContext = createContext<LicenseContextValue | null>(null);

// Hook principal
export const useLicense = (): LicenseContextValue => {
  const context = useContext(LicenseContext);
  
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  
  return context;
};

// Provider
export const LicenseProvider: React.FC<LicenseProviderProps> = ({ 
  children, 
  config, 
  onLicenseChange, 
  onError 
}) => {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ativação de licença
  const activateLicense = async (key: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulação de ativação para teste
      if (key.startsWith('ALMX-')) {
        const newLicense: LicenseInfo = {
          key,
          plan: key.includes('PERPETUAL') ? 'perpetual' : 'professional',
          expiry: key.includes('PERPETUAL') ? '2099-12-31' : '2024-12-31',
          machineId: 'machine-' + Math.random().toString(36).substr(2, 9),
          isValid: true,
          daysRemaining: key.includes('PERPETUAL') ? 999999 : 30,
          features: ['basic_features', 'updates', 'support']
        };
        
        setLicenseInfo(newLicense);
        onLicenseChange?.(newLicense);
        return true;
      }
      
      setError('Chave de licença inválida');
      onError?.('Chave de licença inválida');
      return false;
    } catch (err) {
      setError('Erro ao ativar licença');
      onError?.('Erro ao ativar licença');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Validação
  const validateLicense = async (): Promise<void> => {
    if (!licenseInfo) return;
    
    try {
      // Simulação de validação
      const isValid = licenseInfo.plan === 'perpetual' || 
        new Date(licenseInfo.expiry) > new Date();
      
      setLicenseInfo(prev => prev ? {
        ...prev,
        isValid,
        daysRemaining: isValid ? 
          Math.ceil((new Date(licenseInfo.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
          0
      } : null);
    } catch (err) {
      setError('Erro na validação');
      onError?.('Erro na validação');
    }
  };

  // Refresh
  const refreshLicense = async (): Promise<void> => {
    await validateLicense();
  };

  // Desativação
  const deactivateLicense = async (): Promise<boolean> => {
    try {
      setLicenseInfo(null);
      onLicenseChange?.(null);
      return true;
    } catch (err) {
      setError('Erro ao desativar licença');
      onError?.('Erro ao desativar licença');
      return false;
    }
  };

  // Valores derivados
  const isValid = licenseInfo?.isValid || false;
  const plan = licenseInfo?.plan || null;
  const daysRemaining = licenseInfo?.daysRemaining || 0;
  const features = licenseInfo?.features || [];

  // Context value
  const contextValue: LicenseContextValue = {
    licenseInfo,
    isLoading,
    error,
    isValid,
    plan,
    daysRemaining,
    features,
    activateLicense,
    validateLicense,
    refreshLicense,
    deactivateLicense
  };

  // Inicialização
  useEffect(() => {
    const initializeLicense = async () => {
      try {
        // Carregar licença salva do localStorage
        const savedLicense = localStorage.getItem('almox_license');
        if (savedLicense) {
          const license = JSON.parse(savedLicense);
          setLicenseInfo(license);
          await validateLicense();
        }
      } catch (err) {
        console.error('Erro ao carregar licença salva:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLicense();
  }, []);

  return React.createElement(
    LicenseContext.Provider,
    { value: contextValue },
    children
  );
};

export default LicenseProvider;
