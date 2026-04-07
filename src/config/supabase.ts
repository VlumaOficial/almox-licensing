// Configuração do Supabase para o módulo de licenciamento
import { LicenseConfig } from '../types';

export const supabaseConfig: LicenseConfig = {
  api: {
    endpoint: 'https://almox-five.vercel.app/api/v1', // Sua API atual no Vercel
    apiKey: process.env.LICENSING_API_KEY || 'default-api-key',
    timeout: 10000,
    retries: 3
  },
  
  database: {
    type: 'supabase',
    connectionString: 'postgresql://postgres.ckkzvzvqgoyxwzzqwhqjx.supabase.co:5432/postgres',
    database: 'postgres'
  },
  
  plans: {
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
        'api_access',
        'mobile_app'
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
        'export_data',
        'mobile_app',
        'integrations'
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
        'sla_guaranteed',
        'mobile_app',
        'advanced_analytics'
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
        'mobile_app',
        'advanced_analytics',
        'lifetime_updates',
        'source_code_access'
      ]
    }
  },
  
  validation: {
    onlineCheckInterval: 60, // 1 hora
    offlineGracePeriod: 7, // 7 dias
    maxMachines: 5
  },
  
  security: {
    encryptionKey: process.env.LICENSING_ENCRYPTION_KEY || 'almox-pro-2024-secure-key',
    hashAlgorithm: 'SHA-256',
    machineFingerprint: true
  }
};

// Configuração específica para desenvolvimento
export const devSupabaseConfig: Partial<LicenseConfig> = {
  api: {
    endpoint: 'http://localhost:3001/api/v1',
    timeout: 5000,
    retries: 1
  },
  validation: {
    onlineCheckInterval: 5, // 5 minutos em dev
    offlineGracePeriod: 30 // 30 dias em dev
  }
};

// Configuração para produção
export const prodSupabaseConfig: Partial<LicenseConfig> = {
  api: {
    endpoint: 'https://almox-five.vercel.app/api/v1',
    timeout: 15000,
    retries: 5
  },
  validation: {
    onlineCheckInterval: 60, // 1 hora em prod
    offlineGracePeriod: 7 // 7 dias em prod
  },
  security: {
    machineFingerprint: true,
    hashAlgorithm: 'SHA-512'
  }
};

// Função para obter configuração baseada no ambiente
export const getSupabaseConfig = (env: 'development' | 'production' | 'test' = 'development'): LicenseConfig => {
  const base = supabaseConfig;
  
  switch (env) {
    case 'development':
      return { ...base, ...devSupabaseConfig };
    case 'production':
      return { ...base, ...prodSupabaseConfig };
    case 'test':
      return { 
        ...base, 
        validation: {
          onlineCheckInterval: 1, // 1 minuto em testes
          offlineGracePeriod: 365 // 1 ano em testes
        }
      };
    default:
      return base;
  }
};

// Função para testar conexão com Supabase
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: supabaseConfig.database.connectionString
    });
    
    await client.connect();
    const result = await client.query('SELECT NOW()');
    await client.end();
    
    console.log('✅ Supabase connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};
