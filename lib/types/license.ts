// Tipos básicos do sistema de licenciamento

export interface Installation {
  id: string;
  installation_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_company?: string;
  customer_document?: string;
  system_version?: string;
  os_info?: string;
  hardware_fingerprint?: string;
  status: 'trial' | 'licensed' | 'expired' | 'suspended';
  created_at: string;
  trial_expires_at?: string;
  licensed_at?: string;
  last_validated_at?: string;
  license_id?: string;
}

export interface License {
  id: string;
  license_key: string;
  installation_id: string;
  license_type: string;
  status: 'active' | 'expired' | 'suspended' | 'deleted';
  features: string[];
  recurring: boolean;
  created_at: string;
  expires_at: string;
  last_payment_at?: string;
  next_payment_at?: string;
  last_payment_id?: string;
  last_payment_amount?: number;
  external_reference?: string;
  metadata?: Record<string, any>;
}

export interface LicenseType {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_days: number; // -1 para vitalícia
  recurring: boolean;
  features: string[];
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  installation_id: string;
  plan_id: string;
  amount: number;
  customer_email: string;
  payment_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  created_at: string;
  confirmed_at?: string;
}

export interface PaymentConfirmation {
  id: string;
  customer_email: string;
  license_id?: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  billing_type?: string;
  external_reference?: string;
  processor: string;
  processor_data?: Record<string, any>;
  created_at: string;
}

export interface ValidationLog {
  id: string;
  license_id?: string;
  installation_id: string;
  customer_email: string;
  validation_context?: Record<string, any>;
  response_time_ms?: number;
  granted: boolean;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  hardware_fingerprint?: string;
  created_at: string;
}

export interface ValidationResult {
  valid: boolean;
  license_info?: {
    customer_name: string;
    license_type: string;
    features: string[];
    expires_at: string;
    days_remaining?: number;
    recurring: boolean;
    installation_id: string;
  };
  business_data?: {
    last_payment?: string;
    payment_amount?: number;
    installation_date?: string;
  };
  error?: string;
  expired_at?: string;
  customer_email?: string;
}

export interface TrialSetupResult {
  success: boolean;
  installation_id: string;
  license_key: string;
  trial_expires_at: string;
  message: string;
  error?: string;
}

export interface InstallationData {
  installation_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  version?: string;
  os_info?: string;
  hardware_fingerprint?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  recurring: boolean;
  features: string[];
  popular?: boolean;
}

export interface PaymentLinkData {
  customer: {
    name: string;
    email: string;
    phone: string;
    document?: string;
  };
  amount: number;
  description: string;
  billingType: 'ONE_TIME' | 'UNLIMITED';
  cycle?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  externalReference: string;
  webhook_url: string;
}

export interface PaymentLink {
  paymentId: string;
  invoiceUrl: string;
  paymentLink: string;
  qrCode?: string;
  amount: number;
  status: string;
  externalReference: string;
}

export interface LicenseConfig {
  type: string;
  recurring: boolean;
  duration_days: number;
  features: string[];
  amount: number;
}

export interface LicenseCreationData {
  customer: {
    name: string;
    email: string;
    phone: string;
    document?: string;
  };
  payment_id: string;
  license_config: LicenseConfig;
  external_reference: string;
}

export interface LicenseData {
  license_key: string;
  license_type: string;
  expires_at: string;
  features: string[];
  customer_email: string;
}
