import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórias');
}

// Cliente Supabase para uso em server-side (APIs)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente Supabase para uso geral (com service key)
export function createSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Função de verificação de saúde do database
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('installations')
      .select('id')
      .limit(1);
    
    if (error) {
      return {
        healthy: false,
        error: `Database connection error: ${error.message}`
      };
    }
    
    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Função para execução com retry
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Espera exponencial
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
}

// Log de operações do database
export function logDatabaseOperation(operation: string, data: any, error?: Error) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    data: error ? undefined : data,
    error: error ? {
      message: error.message,
      stack: error.stack
    } : undefined
  };
  
  console.log('Database Operation:', JSON.stringify(logEntry, null, 2));
}
