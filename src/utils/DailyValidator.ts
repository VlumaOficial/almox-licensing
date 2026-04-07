// Utilitário para validação diária centralizada
import { LicenseInfo, LicensePlan } from '../types';

export interface DailyValidationRequest {
  licenseKey: string;
  machineId: string;
  fingerprint?: string;
  applicationName: string;
  applicationVersion?: string;
  userAgent?: string;
  platform?: string;
  ipAddress?: string;
}

export interface DailyValidationResponse {
  success: boolean;
  isValid: boolean;
  license?: LicenseInfo;
  message: string;
  nextValidation: string;
  requiresAction: string | null;
  supportInfo?: {
    email: string;
    phone: string;
    website: string;
  };
}

export interface ApplicationState {
  isFrozen: boolean;
  lastValidation: string | null;
  nextValidation: string | null;
  licenseInfo: LicenseInfo | null;
  freezeReason?: string;
}

export class DailyValidator {
  private static instance: DailyValidator;
  private validationEndpoint: string;
  private applicationName: string;
  private applicationVersion: string;
  
  private constructor(
    validationEndpoint: string,
    applicationName: string,
    applicationVersion?: string
  ) {
    this.validationEndpoint = validationEndpoint;
    this.applicationName = applicationName;
    this.applicationVersion = applicationVersion || '1.0.0';
  }

  static getInstance(
    validationEndpoint: string,
    applicationName: string,
    applicationVersion?: string
  ): DailyValidator {
    if (!DailyValidator.instance) {
      DailyValidator.instance = new DailyValidator(
        validationEndpoint,
        applicationName,
        applicationVersion
      );
    }
    return DailyValidator.instance;
  }

  // Iniciar validação diária
  async startDailyValidation(): Promise<void> {
    // Obter estado atual
    const state = this.getApplicationState();
    
    // Verificar se precisa validar agora
    if (this.shouldValidateNow(state)) {
      await this.performValidation();
    }
    
    // Agendar próxima validação
    this.scheduleNextValidation(state);
  }

  // Validação manual (botão "Valide Licença")
  async validateNow(): Promise<DailyValidationResponse> {
    try {
      const request = await this.buildValidationRequest();
      const response = await this.callValidationAPI(request);
      
      // Salvar estado
      this.saveApplicationState({
        isFrozen: !response.isValid,
        lastValidation: new Date().toISOString(),
        nextValidation: response.nextValidation,
        licenseInfo: response.license || null
      });
      
      return response;
    } catch (error) {
      console.error('Manual validation error:', error);
      
      return {
        success: false,
        isValid: false,
        message: 'Erro ao validar licença. Tente novamente.',
        nextValidation: new Date(Date.now() + (4 * 60 * 60 * 1000)).toISOString(),
        requiresAction: 'retry_later'
      };
    }
  }

  // Verificar se aplicação está congelada
  isApplicationFrozen(): boolean {
    const state = this.getApplicationState();
    return state.isFrozen;
  }

  // Obter mensagem de status
  getStatusMessage(): string {
    const state = this.getApplicationState();
    
    if (state.isFrozen) {
      if (state.licenseInfo) {
        return `Licença ${state.licenseInfo.plan.toUpperCase()} necessita renovação. Entre em contato com o suporte.`;
      } else {
        return 'Licença inválida. Entre em contato com o suporte.';
      }
    }
    
    if (state.licenseInfo) {
      if (state.licenseInfo.plan.startsWith('perpetual')) {
        return 'Licença perpétua ativa. Sistema liberado.';
      }
      
      const days = state.licenseInfo.daysRemaining;
      if (days <= 7) {
        return `Licença válida por ${days} dias. Sistema liberado.`;
      }
      
      return `Licença ${state.licenseInfo.plan.toUpperCase()} ativa. Sistema liberado.`;
    }
    
    return 'Status da licença desconhecido.';
  }

  // Forçar descongelamento (após renovação)
  async forceUnfreeze(adminKey: string): Promise<boolean> {
    try {
      const state = this.getApplicationState();
      
      if (!state.licenseInfo) {
        return false;
      }

      const response = await fetch(`${this.validationEndpoint}/validation/unfreeze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          licenseKey: state.licenseInfo.key,
          machineId: await this.getMachineId(),
          adminKey: adminKey
        })
      });

      if (response.ok) {
        // Limpar estado congelado
        this.saveApplicationState({
          ...state,
          isFrozen: false,
          freezeReason: undefined
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Force unfreeze error:', error);
      return false;
    }
  }

  private async performValidation(): Promise<void> {
    try {
      const request = await this.buildValidationRequest();
      const response = await this.callValidationAPI(request);
      
      // Salvar estado
      this.saveApplicationState({
        isFrozen: !response.isValid,
        lastValidation: new Date().toISOString(),
        nextValidation: response.nextValidation,
        licenseInfo: response.license || null
      });
      
      // Se inválida, notificar usuário
      if (!response.isValid) {
        this.notifyInvalidLicense(response);
      }
      
    } catch (error) {
      console.error('Daily validation error:', error);
      
      // Em caso de erro, agendar próxima validação mais cedo
      const state = this.getApplicationState();
      this.scheduleNextValidation({
        ...state,
        nextValidation: new Date(Date.now() + (4 * 60 * 60 * 1000)).toISOString()
      });
    }
  }

  private async buildValidationRequest(): Promise<DailyValidationRequest> {
    return {
      licenseKey: this.getStoredLicenseKey(),
      machineId: await this.getMachineId(),
      fingerprint: await this.getFingerprint(),
      applicationName: this.applicationName,
      applicationVersion: this.applicationVersion,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      ipAddress: await this.getIPAddress()
    };
  }

  private async callValidationAPI(request: DailyValidationRequest): Promise<DailyValidationResponse> {
    const response = await fetch(`${this.validationEndpoint}/validation/daily`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private shouldValidateNow(state: ApplicationState): boolean {
    if (!state.nextValidation) {
      return true; // Nunca validou antes
    }
    
    const nextValidationTime = new Date(state.nextValidation);
    const now = new Date();
    
    return now >= nextValidationTime;
  }

  private scheduleNextValidation(state: ApplicationState): void {
    if (!state.nextValidation) {
      return;
    }
    
    const nextValidationTime = new Date(state.nextValidation);
    const now = new Date();
    const delay = nextValidationTime.getTime() - now.getTime();
    
    if (delay > 0) {
      setTimeout(() => {
        this.performValidation();
      }, delay);
    }
  }

  private getApplicationState(): ApplicationState {
    const stored = localStorage.getItem('almox_application_state');
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing application state:', error);
      }
    }
    
    return {
      isFrozen: false,
      lastValidation: null,
      nextValidation: null,
      licenseInfo: null
    };
  }

  private saveApplicationState(state: ApplicationState): void {
    localStorage.setItem('almox_application_state', JSON.stringify(state));
    
    // Disparar evento para UI
    window.dispatchEvent(new CustomEvent('license-state-changed', {
      detail: state
    }));
  }

  private getStoredLicenseKey(): string {
    return localStorage.getItem('almox_license_key') || '';
  }

  private async getMachineId(): Promise<string> {
    const stored = localStorage.getItem('almox_machine_id');
    if (stored) {
      return stored;
    }
    
    // Gerar novo ID se não existir
    const newId = 'machine-' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('almox_machine_id', newId);
    return newId;
  }

  private async getFingerprint(): Promise<string> {
    // Implementar fingerprint real aqui
    return 'fp-' + Math.random().toString(36).substring(2, 18);
  }

  private async getIPAddress(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  private notifyInvalidLicense(response: DailyValidationResponse): void {
    // Disparar evento global
    window.dispatchEvent(new CustomEvent('license-invalid', {
      detail: {
        message: response.message,
        requiresAction: response.requiresAction,
        supportInfo: response.supportInfo
      }
    }));
  }
}

// Hook para React
export const useDailyValidator = (
  validationEndpoint: string,
  applicationName: string,
  applicationVersion?: string
) => {
  const [isFrozen, setIsFrozen] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');
  const [isValidating, setIsValidating] = React.useState(false);
  
  React.useEffect(() => {
    const validator = DailyValidator.getInstance(
      validationEndpoint,
      applicationName,
      applicationVersion
    );
    
    // Verificar estado inicial
    setIsFrozen(validator.isApplicationFrozen());
    setStatusMessage(validator.getStatusMessage());
    
    // Iniciar validação diária
    validator.startDailyValidation();
    
    // Escutar mudanças de estado
    const handleStateChange = (event: CustomEvent) => {
      const state = event.detail;
      setIsFrozen(state.isFrozen);
      setStatusMessage(validator.getStatusMessage());
    };
    
    const handleInvalidLicense = (event: CustomEvent) => {
      const detail = event.detail;
      // Mostrar notificação para usuário
      console.warn('License invalid:', detail);
    };
    
    window.addEventListener('license-state-changed', handleStateChange as EventListener);
    window.addEventListener('license-invalid', handleInvalidLicense as EventListener);
    
    return () => {
      window.removeEventListener('license-state-changed', handleStateChange as EventListener);
      window.removeEventListener('license-invalid', handleInvalidLicense as EventListener);
    };
  }, [validationEndpoint, applicationName, applicationVersion]);
  
  const validateNow = React.useCallback(async (): Promise<DailyValidationResponse> => {
    const validator = DailyValidator.getInstance(
      validationEndpoint,
      applicationName,
      applicationVersion
    );
    
    setIsValidating(true);
    try {
      const response = await validator.validateNow();
      setIsFrozen(validator.isApplicationFrozen());
      setStatusMessage(validator.getStatusMessage());
      return response;
    } finally {
      setIsValidating(false);
    }
  }, [validationEndpoint, applicationName, applicationVersion]);
  
  return {
    isFrozen,
    statusMessage,
    isValidating,
    validateNow,
    forceUnfreeze: async (adminKey: string) => {
      const validator = DailyValidator.getInstance(
        validationEndpoint,
        applicationName,
        applicationVersion
      );
      
      const success = await validator.forceUnfreeze(adminKey);
      if (success) {
        setIsFrozen(false);
        setStatusMessage(validator.getStatusMessage());
      }
      
      return success;
    }
  };
};
