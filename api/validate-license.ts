// API Backend - Almox Licensing
// Endpoint: /api/validate-license

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createSupabaseClient } from '../lib/database';
import { 
  calculateDaysRemaining, 
  isExpiringSoon,
  formatDate,
  formatLicenseType,
  log
} from '../lib/utils';
import { ValidationResult } from '../lib/types/license';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      valid: false,
      error: 'Método não permitido' 
    });
  }

  try {
    const { 
      installation_id, 
      license_key, 
      validation_context 
    } = req.body;

    log('info', 'Validação de licença iniciada', { 
      installation_id,
      license_key: license_key?.substring(0, 10) + '...'
    });

    // Validar entrada
    if (!installation_id || !license_key) {
      const responseTime = Date.now() - startTime;
      
      log('warn', 'Dados obrigatórios faltando', { 
        installation_id: !!installation_id,
        license_key: !!license_key,
        response_time: responseTime
      });

      return res.status(400).json({
        valid: false,
        error: 'Installation ID e License Key são obrigatórios'
      });
    }

    // Conectar ao Supabase
    const supabase = createSupabaseClient();

    // Buscar licença no banco com dados da instalação
    const { data: license, error } = await supabase
      .from('licenses')
      .select(`
        *,
        installations!inner(
          customer_name,
          customer_email,
          customer_phone,
          installation_id,
          hardware_fingerprint
        )
      `)
      .eq('license_key', license_key)
      .eq('installations.installation_id', installation_id)
      .eq('status', 'active')
      .single();

    if (error || !license) {
      const responseTime = Date.now() - startTime;
      
      log('warn', 'Licença não encontrada ou inativa', { 
        installation_id,
        license_key: license_key?.substring(0, 10) + '...',
        error: error?.message,
        response_time: responseTime
      });

      return res.status(404).json({
        valid: false,
        error: 'Licença não encontrada, inativa ou installation_id inválido'
      });
    }

    // Verificar se licença não expirou
    const now = new Date();
    const expiryDate = new Date(license.expires_at);

    if (expiryDate < now) {
      // Marcar como expirada
      await supabase
        .from('licenses')
        .update({ status: 'expired' })
        .eq('id', license.id);

      await supabase
        .from('installations')
        .update({ status: 'expired' })
        .eq('installation_id', installation_id);

      const responseTime = Date.now() - startTime;
      
      log('info', 'Licença expirada', { 
        installation_id,
        license_id: license.id,
        expired_at: license.expires_at,
        response_time: responseTime
      });

      return res.status(403).json({
        valid: false,
        error: license.license_type === 'trial' ? 'TRIAL_EXPIRED' : 'LICENSE_EXPIRED',
        expired_at: license.expires_at,
        customer_email: license.installations.customer_email
      });
    }

    // Validar hardware fingerprint (anti-pirataria)
    const clientFingerprint = validation_context?.hardware_fingerprint;
    if (clientFingerprint && clientFingerprint !== license.installations.hardware_fingerprint) {
      const responseTime = Date.now() - startTime;
      
      log('warn', 'Hardware fingerprint mismatch', { 
        installation_id,
        expected: license.installations.hardware_fingerprint,
        received: clientFingerprint,
        response_time: responseTime
      });

      return res.status(403).json({
        valid: false,
        error: 'HARDWARE_MISMATCH',
        message: 'Licença não válida para este hardware'
      });
    }

    // Registrar validação (analytics)
    const responseTime = Date.now() - startTime;
    
    await supabase
      .from('validation_logs')
      .insert({
        license_id: license.id,
        installation_id: installation_id,
        customer_email: license.installations.customer_email,
        validation_context: validation_context || {},
        response_time_ms: responseTime,
        granted: true,
        ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
        user_agent: req.headers['user-agent'],
        hardware_fingerprint: clientFingerprint,
        created_at: now.toISOString()
      });

    // Atualizar última validação
    await supabase
      .from('installations')
      .update({ last_validated_at: now.toISOString() })
      .eq('installation_id', installation_id);

    // Preparar resultado
    const result: ValidationResult = {
      valid: true,
      license_info: {
        customer_name: license.installations.customer_name,
        license_type: license.license_type,
        features: license.features,
        expires_at: license.expires_at,
        days_remaining: calculateDaysRemaining(license.expires_at),
        recurring: license.recurring,
        installation_id: installation_id
      },
      business_data: {
        last_payment: license.last_payment_at,
        payment_amount: license.last_payment_amount,
        installation_date: license.installations.created_at
      }
    };

    log('info', 'Licença validada com sucesso', { 
      installation_id,
      license_id: license.id,
      license_type: license.license_type,
      days_remaining: result.license_info?.days_remaining,
      response_time: responseTime
    });

    // Retornar informações da licença
    res.status(200).json(result);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    log('error', 'Erro na validação da licença', { 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      response_time: responseTime
    });

    res.status(500).json({
      valid: false,
      error: 'Erro na validação da licença'
    });
  }
}
