// API Backend - Almox Licensing
// Endpoint: /api/activate-license

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
    const { licenseKey, machineId, plan, clientInfo } = req.body;

    // Validar entrada
    if (!licenseKey || !machineId || !plan) {
      return res.status(400).json({ 
        error: 'License key, machine ID and plan are required' 
      });
    }

    // Validar formato da chave
    if (!licenseKey.startsWith('ALMX-') || licenseKey.length < 10) {
      return res.status(400).json({ 
        error: 'Invalid license key format' 
      });
    }

    // Verificar se licença já existe
    const { data: existingLicense, error: checkError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (existingLicense) {
      // Se já existe, apenas atualizar máquina se for diferente
      if (existingLicense.machine_id !== machineId) {
        const { error: updateError } = await supabase
          .from('licenses')
          .update({ 
            machine_id: machineId,
            updated_at: new Date().toISOString()
          })
          .eq('license_key', licenseKey);

        if (updateError) {
          return res.status(500).json({ error: 'Failed to update license' });
        }
      }

      return res.status(200).json({
        success: true,
        activated: true,
        expiry: existingLicense.expiry_date,
        plan: existingLicense.plan,
        message: 'License already activated'
      });
    }

    // Calcular data de expiração baseado no plano
    const expiryDate = calculateExpiryDate(plan);

    // Criar nova licença
    const { data: newLicense, error: insertError } = await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        plan,
        expiry_date: expiryDate,
        machine_id: machineId,
        client_info: clientInfo || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError || !newLicense) {
      return res.status(500).json({ 
        error: 'Failed to create license' 
      });
    }

    // Log da ativação
    await supabase.from('license_logs').insert({
      license_id: newLicense.id,
      action: 'activate',
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      activated: true,
      expiry: expiryDate,
      plan,
      licenseId: newLicense.id,
      message: 'License activated successfully'
    });

  } catch (error) {
    console.error('Activation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

function calculateExpiryDate(plan: string): string {
  const now = new Date();
  
  switch (plan) {
    case 'trial':
      // 15 dias de trial
      now.setDate(now.getDate() + 15);
      break;
    case 'basic':
    case 'professional':
    case 'enterprise':
      // 30 dias para planos pagos
      now.setMonth(now.getMonth() + 1);
      break;
    default:
      // Padrão de 30 dias
      now.setMonth(now.getMonth() + 1);
  }
  
  return now.toISOString();
}
