// API Backend - Almox Licensing
// Endpoint: /api/validate-license

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { licenseKey, machineId, version } = req.body;

    // Validar entrada
    if (!licenseKey || !machineId) {
      return res.status(400).json({ 
        error: 'License key and machine ID are required' 
      });
    }

    // Buscar licença no banco
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (error || !license) {
      return res.status(404).json({ 
        valid: false,
        error: 'License not found' 
      });
    }

    // Verificar se expirou
    const now = new Date();
    const expiry = new Date(license.expiry_date);
    const isExpired = now > expiry;

    // Verificar máquina
    const machineValid = license.machine_id === machineId;

    // Calcular dias restantes
    const daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Determinar funcionalidades por plano
    const features = getFeaturesByPlan(license.plan);

    // Log da validação
    await supabase.from('license_logs').insert({
      license_id: license.id,
      action: 'validate',
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    // Retornar resposta
    return res.status(200).json({
      valid: !isExpired && machineValid,
      plan: license.plan,
      expiry: license.expiry_date,
      features,
      daysRemaining,
      machineValid,
      isExpired,
      clientId: license.client_id
    });

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

function getFeaturesByPlan(plan: string): string[] {
  const features = {
    trial: ['basic_inventory', 'limited_reports'],
    basic: ['inventory', 'reports', 'export'],
    professional: ['inventory', 'reports', 'export', 'advanced_analytics', 'api_access'],
    enterprise: ['inventory', 'reports', 'export', 'advanced_analytics', 'api_access', 'custom_features', 'priority_support']
  };
  
  return features[plan as keyof typeof features] || [];
}
