// API Backend - Almox Licensing
// Endpoint: /api/deactivate-license

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config/index.js';

const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey
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
    const { licenseKey, reason } = req.body;

    // Validar entrada
    if (!licenseKey) {
      return res.status(400).json({ 
        error: 'License key is required' 
      });
    }

    // Buscar licença
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (error || !license) {
      return res.status(404).json({ 
        error: 'License not found' 
      });
    }

    // Desativar licença (setar expiração para agora)
    const { error: updateError } = await supabase
      .from('licenses')
      .update({ 
        expiry_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'deactivated'
      })
      .eq('license_key', licenseKey);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to deactivate license' });
    }

    // Log da desativação
    await supabase.from('license_logs').insert({
      license_id: license.id,
      action: 'deactivate',
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      deactivated: true,
      deactivatedAt: new Date().toISOString(),
      reason: reason || 'Manual deactivation'
    });

  } catch (error) {
    console.error('Deactivation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}
