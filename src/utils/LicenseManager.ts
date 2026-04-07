// Gerenciador principal de licenças
import { LicenseInfo, LicensePlan, ActivationRequest, ActivationResponse, ValidationRequest, ValidationResponse } from '../types';
import { getSupabaseConfig } from '../config/supabase';
import { MachineDetector } from './MachineDetector';
import { CryptoHelper } from './CryptoHelper';

export class LicenseManager {
  private static instance: LicenseManager;
  private licenseKey: string | null = null;
  private machineId: string = '';
  private currentLicense: LicenseInfo | null = null;
  private config = getSupabaseConfig(process.env.NODE_ENV as any);

  private constructor() {
    this.initializeLicense();
  }

  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  private async initializeLicense(): Promise<void> {
    // Obter machine ID
    this.machineId = await MachineDetector.getMachineId();
    
    // Carregar licença do localStorage
    this.licenseKey = localStorage.getItem('almox_license_key');
    
    if (this.licenseKey) {
      await this.validateLicense();
    }
  }

  async activateLicense(request: ActivationRequest): Promise<ActivationResponse> {
    try {
      // Verificar se é licença perpétua
      if (request.key.startsWith('ALMX-PERPETUAL-')) {
        return this.activatePerpetualLicense(request);
      }

      // Licença recorrente - validar via API
      const response = await fetch(`${this.config.api.endpoint}/licenses/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.api.apiKey
        },
        body: JSON.stringify({
          ...request,
          machineId: this.machineId,
          fingerprint: await MachineDetector.getFingerprint()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Salvar licença localmente
        this.saveLicenseLocally(result.license);
        this.currentLicense = result.license;
        
        return {
          success: true,
          license: result.license
        };
      } else {
        return {
          success: false,
          error: result.error || 'Activation failed',
          code: result.code
        };
      }
    } catch (error) {
      console.error('License activation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'ACTIVATION_ERROR'
      };
    }
  }

  private async activatePerpetualLicense(request: ActivationRequest): Promise<ActivationResponse> {
    try {
      const planType = request.key.includes('CLOUD') ? 'perpetual_cloud' : 'perpetual_local';
      
      // Criar licença perpétua localmente
      const perpetualLicense: LicenseInfo = {
        key: request.key,
        plan: planType,
        expiry: '2099-12-31T23:59:59.999Z', // Data simbólica
        machineId: this.machineId,
        isValid: true,
        daysRemaining: 999999, // Simbólico
        features: this.getPlanFeatures(planType),
        activatedAt: new Date().toISOString(),
        lastValidated: new Date().toISOString()
      };

      // Salvar localmente
      this.saveLicenseLocally(perpetualLicense);
      this.currentLicense = perpetualLicense;
      
      // Opcional: Notificar API sobre ativação perpétua
      await this.notifyPerpetualActivation(perpetualLicense);

      return {
        success: true,
        license: perpetualLicense
      };
    } catch (error) {
      console.error('Perpetual license activation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'PERPETUAL_ACTIVATION_ERROR'
      };
    }
  }

  async validateLicense(): Promise<ValidationResponse> {
    try {
      if (!this.licenseKey) {
        return {
          success: false,
          error: 'No license key found',
          code: 'NO_LICENSE_KEY'
        };
      }

      // Verificar se é licença perpétua
      if (this.licenseKey.startsWith('ALMX-PERPETUAL-')) {
        return this.validatePerpetualLicense();
      }

      // Licença recorrente - validar via API
      const response = await fetch(`${this.config.api.endpoint}/licenses/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.api.apiKey
        },
        body: JSON.stringify({
          key: this.licenseKey,
          machineId: this.machineId,
          fingerprint: await MachineDetector.getFingerprint()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.currentLicense = result.license;
        return {
          success: true,
          license: result.license
        };
      } else {
        return {
          success: false,
          error: result.error || 'Validation failed',
          code: result.code
        };
      }
    } catch (error) {
      console.error('License validation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'VALIDATION_ERROR'
      };
    }
  }

  private async validatePerpetualLicense(): Promise<ValidationResponse> {
    try {
      const savedLicense = this.getSavedLicense();
      
      if (!savedLicense) {
        return {
          success: false,
          error: 'No saved perpetual license found',
          code: 'NO_SAVED_LICENSE'
        };
      }

      // Licenças perpétuas nunca expiram
      const isValidLicense: LicenseInfo = {
        ...savedLicense,
        isValid: true,
        daysRemaining: 999999,
        lastValidated: new Date().toISOString()
      };

      this.currentLicense = isValidLicense;
      
      return {
        success: true,
        license: isValidLicense
      };
    } catch (error) {
      console.error('Perpetual license validation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'PERPETUAL_VALIDATION_ERROR'
      };
    }
  }

  async deactivateLicense(): Promise<boolean> {
    try {
      if (!this.licenseKey) {
        return false;
      }

      const response = await fetch(`${this.config.api.endpoint}/licenses/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.api.apiKey
        },
        body: JSON.stringify({
          key: this.licenseKey,
          machineId: this.machineId
        })
      });

      if (response.ok) {
        // Limpar licença local
        this.clearLicenseLocally();
        this.currentLicense = null;
        return true;
      }

      return false;
    } catch (error) {
      console.error('License deactivation error:', error);
      return false;
    }
  }

  getCurrentLicense(): LicenseInfo | null {
    return this.currentLicense;
  }

  isLicenseValid(): boolean {
    return this.currentLicense?.isValid || false;
  }

  getDaysRemaining(): number {
    return this.currentLicense?.daysRemaining || 0;
  }

  getCurrentPlan(): LicensePlan | null {
    return this.currentLicense?.plan || null;
  }

  hasFeature(feature: string): boolean {
    return this.currentLicense?.features.includes(feature) || false;
  }

  private saveLicenseLocally(license: LicenseInfo): void {
    localStorage.setItem('almox_license_key', license.key);
    localStorage.setItem('almox_license_plan', license.plan);
    localStorage.setItem('almox_license_expiry', license.expiry);
    localStorage.setItem('almox_license_features', JSON.stringify(license.features));
    localStorage.setItem('almox_license_machine', license.machineId);
    localStorage.setItem('almox_license_activated', license.activatedAt || '');
  }

  private getSavedLicense(): LicenseInfo | null {
    try {
      const key = localStorage.getItem('almox_license_key');
      const plan = localStorage.getItem('almox_license_plan') as LicensePlan;
      const expiry = localStorage.getItem('almox_license_expiry');
      const features = JSON.parse(localStorage.getItem('almox_license_features') || '[]');
      const machineId = localStorage.getItem('almox_license_machine');
      const activatedAt = localStorage.getItem('almox_license_activated');

      if (!key || !plan) {
        return null;
      }

      const daysRemaining = this.calculateDaysRemaining(expiry);
      const isValid = this.isLicenseExpired(expiry);

      return {
        key,
        plan,
        expiry,
        machineId: machineId || '',
        isValid,
        daysRemaining,
        features,
        activatedAt,
        lastValidated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error loading saved license:', error);
      return null;
    }
  }

  private clearLicenseLocally(): void {
    localStorage.removeItem('almox_license_key');
    localStorage.removeItem('almox_license_plan');
    localStorage.removeItem('almox_license_expiry');
    localStorage.removeItem('almox_license_features');
    localStorage.removeItem('almox_license_machine');
    localStorage.removeItem('almox_license_activated');
  }

  private calculateDaysRemaining(expiry: string): number {
    if (!expiry) return 0;
    
    const expiryDate = new Date(expiry);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  private isLicenseExpired(expiry: string): boolean {
    if (!expiry) return true;
    return new Date() <= new Date(expiry);
  }

  private getPlanFeatures(plan: LicensePlan): string[] {
    const planConfigs = this.config.plans;
    
    switch (plan) {
      case 'trial':
        return planConfigs.trial.features;
      case 'basic':
        return planConfigs.basic.features;
      case 'professional':
        return planConfigs.professional.features;
      case 'enterprise':
        return planConfigs.enterprise.features;
      case 'perpetual_cloud':
      case 'perpetual_local':
        return planConfigs.perpetual.features;
      default:
        return [];
    }
  }

  private async notifyPerpetualActivation(license: LicenseInfo): Promise<void> {
    try {
      // Opcional: Notificar API sobre ativação perpétua
      await fetch(`${this.config.api.endpoint}/licenses/perpetual-notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.api.apiKey
        },
        body: JSON.stringify({
          license: license,
          machineId: this.machineId,
          activatedAt: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('Failed to notify perpetual activation:', error);
    }
  }

  // Gerar chaves de licença (para admin)
  generateLicenseKey(plan: LicensePlan, quantity: number = 1): string[] {
    const keys: string[] = [];
    
    for (let i = 0; i < quantity; i++) {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      const checksum = CryptoHelper.hash(`${plan}-${timestamp}-${random}`).substring(0, 4).toUpperCase();
      
      if (plan.startsWith('perpetual')) {
        const type = plan === 'perpetual_cloud' ? 'CLOUD' : 'LOCAL';
        keys.push(`ALMX-PERPETUAL-${type}-${timestamp.toUpperCase()}-${checksum}`);
      } else {
        keys.push(`ALMX-${plan.toUpperCase()}-${timestamp.toUpperCase()}-${checksum}`);
      }
    }
    
    return keys;
  }
}
