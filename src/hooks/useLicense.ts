// Hook principal para gerenciar licenciamento
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { LicenseInfo, LicenseContextValue, LicenseProviderProps } from '../types';
import { LicenseManager } from '../utils/LicenseManager';
import { MachineDetector } from '../utils/MachineDetector';

// Contexto para licenciamento
const LicenseContext = React.createContext<LicenseContextValue | null>(null);

export const useLicense = (): LicenseContextValue => {
  const context = useContext(LicenseContext);
  
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  
  return context;
};

// Provider do contexto
export const LicenseProvider: React.FC<LicenseProviderProps> = ({ 
  children, 
  config, 
  onLicenseChange, 
  onError 
}) => {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar LicenseManager
  const licenseManager = LicenseManager.getInstance();

  // Ativar licença
  const activateLicense = useCallback(async (key: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const machineId = await MachineDetector.getMachineId();
      const fingerprint = await MachineDetector.getFingerprint();
      
      const result = await licenseManager.activateLicense({
        key,
        machineId,
        fingerprint,
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: new Date().toISOString()
        }
      });
      
      if (result.success) {
        setLicenseInfo(result.license || null);
        onLicenseChange?.(result.license || null);
        return true;
      } else {
        setError(result.error || 'Activation failed');
        onError?.(result.error || 'Activation failed');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [licenseManager, onLicenseChange, onError]);

  // Validar licença
  const validateLicense = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await licenseManager.validateLicense();
      
      if (result.success) {
        setLicenseInfo(result.license || null);
        onLicenseChange?.(result.license || null);
      } else {
        setError(result.error || 'Validation failed');
        onError?.(result.error || 'Validation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [licenseManager, onLicenseChange, onError]);

  // Atualizar licença
  const refreshLicense = useCallback(async (): Promise<void> => {
    await validateLicense();
  }, [validateLicense]);

  // Desativar licença
  const deactivateLicense = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await licenseManager.deactivateLicense();
      
      if (result) {
        setLicenseInfo(null);
        onLicenseChange?.(null);
        MachineDetector.clearMachineId();
        return true;
      } else {
        setError('Failed to deactivate license');
        onError?.('Failed to deactivate license');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [licenseManager, onLicenseChange, onError]);

  // Inicialização
  useEffect(() => {
    const initializeLicense = async () => {
      try {
        setIsLoading(true);
        
        // Verificar se máquina mudou
        const machineChanged = await MachineDetector.hasMachineChanged();
        
        if (machineChanged) {
          console.warn('Machine changed, revalidating license');
          await validateLicense();
        } else {
          // Carregar licença existente
          const currentLicense = licenseManager.getCurrentLicense();
          setLicenseInfo(currentLicense);
          onLicenseChange?.(currentLicense);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Initialization error';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLicense();
  }, [validateLicense, onLicenseChange, onError]);

  // Verificação periódica
  useEffect(() => {
    if (!licenseInfo || !licenseInfo.isValid) {
      return;
    }

    // Para licenças perpétuas, verificar a cada 24 horas
    // Para licenças recorrentes, verificar a cada hora
    const interval = licenseInfo.plan?.startsWith('perpetual') ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    
    const validationInterval = setInterval(async () => {
      await validateLicense();
    }, interval);

    return () => clearInterval(validationInterval);
  }, [licenseInfo, validateLicense]);

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

  return React.createElement(
    LicenseContext.Provider,
    { value: contextValue },
    children
  );
};

// Hook para informações da máquina
export const useMachineInfo = () => {
  const [machineInfo, setMachineInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getMachineInfo = async () => {
      try {
        const info = await MachineDetector.getInstance().getDetailedInfo();
        setMachineInfo(info);
      } catch (error) {
        console.error('Error getting machine info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getMachineInfo();
  }, []);

  return { machineInfo, isLoading };
};

// Hook para estatísticas de licença
export const useLicenseStats = () => {
  const { licenseInfo } = useLicense();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    if (!licenseInfo?.key) {
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Implementar chamada à API para estatísticas
      // const response = await fetch(`${config.api.endpoint}/stats/${licenseInfo.key}`);
      // const data = await response.json();
      // setStats(data);
    } catch (error) {
      console.error('Error loading license stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [licenseInfo]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, isLoading, loadStats };
};

export default LicenseProvider;
