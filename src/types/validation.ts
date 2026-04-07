// Tipos para sistema de validação centralizada
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
  supportInfo?: SupportInfo;
}

export interface SupportInfo {
  email: string;
  phone: string;
  website: string;
}

export interface QuickCheckRequest {
  licenseKey: string;
  machineId: string;
}

export interface FreezeRequest {
  licenseKey: string;
  machineId: string;
  reason: string;
}

export interface UnfreezeRequest {
  licenseKey: string;
  machineId: string;
  adminKey: string;
}

export interface LicenseStatusResponse {
  success: boolean;
  license?: LicenseInfo;
  statistics?: LicenseStatistics;
  error?: string;
}

export interface LicenseStatistics {
  totalValidations: number;
  lastValidation: string | null;
  machineCount: number;
  averageResponseTime: number;
}

export interface ValidationLog {
  id: string;
  licenseKey: string;
  machineId: string;
  applicationName: string;
  applicationVersion?: string;
  ipAddress?: string;
  success: boolean;
  responseTime?: number;
  error?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface FreezeLog {
  licenseKey: string;
  machineId: string;
  reason: string;
  timestamp: string;
}

export interface UnfreezeLog {
  licenseKey: string;
  machineId: string;
  timestamp: string;
}

export interface NotificationPayload {
  type: 'application_frozen' | 'consecutive_failures' | 'license_expired';
  licenseKey: string;
  machineId: string;
  applicationName?: string;
  failureCount?: number;
  lastError?: string;
  reason?: string;
}

// Re-exportar tipos principais
export { LicenseInfo, LicensePlan } from './index';
