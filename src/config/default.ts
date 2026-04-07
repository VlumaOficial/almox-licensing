// Configuração padrão do sistema de licenciamento

import { LicenseConfig, PlanConfig } from '../types';

export const defaultPlanConfig: PlanConfig = {
  trial: {
    days: 15,
    users: 5,
    materials: 100,
    features: [
      'basic_materials',
      'basic_reports',
      'email_support'
    ]
  },
  
  basic: {
    monthly: 157,
    quarterly: 423,
    semiannual: 798,
    yearly: 1416,
    users: 5,
    materials: 1000,
    features: [
      'basic_materials',
      'basic_reports',
      'email_support',
      'api_access'
    ]
  },
  
  professional: {
    monthly: 319,
    quarterly: 861,
    semiannual: 1626,
    yearly: 2862,
    users: 20,
    materials: 5000,
    features: [
      'advanced_materials',
      'advanced_reports',
      'priority_support',
      'api_access',
      'custom_fields',
      'export_data'
    ]
  },
  
  enterprise: {
    monthly: 535,
    quarterly: 1445,
    semiannual: 2723,
    yearly: 4785,
    users: -1, // ilimitado
    materials: -1, // ilimitado
    features: [
      'unlimited_materials',
      'advanced_reports',
      'dedicated_support',
      'api_access',
      'custom_fields',
      'export_data',
      'multi_branch',
      'custom_integrations',
      'white_label',
      'sla_guaranteed'
    ]
  },
  
  perpetual: {
    cloud: 2997,
    local: 3997,
    features: [
      'unlimited_materials',
      'advanced_reports',
      'dedicated_support',
      'api_access',
      'custom_fields',
      'export_data',
      'multi_branch',
      'custom_integrations',
      'white_label',
      'sla_guaranteed',
      'lifetime_updates',
      'source_code_access'
    ]
  }
};

export const defaultConfig: LicenseConfig = {
  api: {
    endpoint: process.env.LICENSING_API_ENDPOINT || 'https://api.almoxpro.com/v1',
    apiKey: process.env.LICENSING_API_KEY || '',
    timeout: 10000,
    retries: 3
  },
  
  database: {
    type: 'postgresql',
    database: 'almox_licensing',
    // Para Supabase, use connectionString
    connectionString: process.env.LICENSING_DB_URL,
    // Para PostgreSQL local
    host: process.env.LICENSING_DB_HOST,
    port: parseInt(process.env.LICENSING_DB_PORT || '5432'),
    username: process.env.LICENSING_DB_USER,
    password: process.env.LICENSING_DB_PASS
  },
  
  plans: defaultPlanConfig,
  
  validation: {
    onlineCheckInterval: 60, // minutos
    offlineGracePeriod: 7, // dias
    maxMachines: 5
  },
  
  security: {
    encryptionKey: process.env.LICENSING_ENCRYPTION_KEY || 'default-key-change-in-production',
    hashAlgorithm: 'SHA-256',
    machineFingerprint: true
  }
};

// Configuração para desenvolvimento
export const devConfig: Partial<LicenseConfig> = {
  api: {
    endpoint: 'http://localhost:3001/api/v1',
    apiKey: 'dev-key',
    timeout: 5000,
    retries: 1
  },
  validation: {
    onlineCheckInterval: 5, // 5 minutos em dev
    offlineGracePeriod: 30 // 30 dias em dev
  }
};

// Configuração para produção
export const prodConfig: Partial<LicenseConfig> = {
  validation: {
    onlineCheckInterval: 60, // 1 hora em prod
    offlineGracePeriod: 7 // 7 dias em prod
  },
  security: {
    machineFingerprint: true,
    hashAlgorithm: 'SHA-512'
  }
};

// Função para mesclar configurações
export const mergeConfig = (
  base: LicenseConfig,
  override: Partial<LicenseConfig>
): LicenseConfig => {
  return {
    ...base,
    ...override,
    api: { ...base.api, ...override.api },
    database: { ...base.database, ...override.database },
    plans: { ...base.plans, ...override.plans },
    validation: { ...base.validation, ...override.validation },
    security: { ...base.security, ...override.security }
  };
};

// Função para obter configuração baseada no ambiente
export const getConfig = (env: 'development' | 'production' | 'test' = 'development'): LicenseConfig => {
  const base = defaultConfig;
  
  switch (env) {
    case 'development':
      return mergeConfig(base, devConfig);
    case 'production':
      return mergeConfig(base, prodConfig);
    case 'test':
      return mergeConfig(base, {
        validation: {
          onlineCheckInterval: 1, // 1 minuto em testes
          offlineGracePeriod: 365 // 1 ano em testes
        },
        api: {
          endpoint: 'http://localhost:3001/api/v1/test',
          timeout: 1000,
          retries: 0
        }
      });
    default:
      return base;
  }
};
