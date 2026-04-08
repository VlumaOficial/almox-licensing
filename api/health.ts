import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkDatabaseHealth } from '../lib/database';
import { log } from '../lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  
  try {
    log('info', 'Health check iniciado');
    
    // Verificar saúde do database
    const dbHealth = await checkDatabaseHealth();
    
    // Verificar variáveis de ambiente
    const envHealth = {
      supabase_url: !!process.env.SUPABASE_URL,
      supabase_key: !!process.env.SUPABASE_SERVICE_KEY,
      node_env: process.env.NODE_ENV || 'unknown'
    };
    
    // Calcular tempo de resposta
    const responseTime = Date.now() - startTime;
    
    // Status geral
    const allHealthy = dbHealth.healthy && envHealth.supabase_url && envHealth.supabase_key;
    
    const healthData = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      services: {
        database: {
          healthy: dbHealth.healthy,
          error: dbHealth.error
        },
        environment: envHealth
      },
      uptime: process.uptime()
    };
    
    log('info', 'Health check concluído', { 
      status: healthData.status,
      response_time: responseTime 
    });
    
    // Retornar status baseado na saúde geral
    if (allHealthy) {
      res.status(200).json(healthData);
    } else {
      res.status(503).json(healthData);
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    log('error', 'Health check falhou', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      response_time: responseTime 
    });
    
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
