// API Backend - Almox Licensing
// Endpoint: /api/check-payment

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
    const { licenseKey } = req.body;

    // Validar entrada
    if (!licenseKey) {
      return res.status(400).json({ 
        error: 'License key is required' 
      });
    }

    // Buscar licença e último pagamento
    const { data: license, error } = await supabase
      .from('licenses')
      .select(`
        *,
        payments (
          amount,
          status,
          payment_method,
          transaction_id,
          created_at
        )
      `)
      .eq('license_key', licenseKey)
      .single();

    if (error || !license) {
      return res.status(404).json({ 
        error: 'License not found' 
      });
    }

    // Buscar último pagamento
    const payments = license.payments || [];
    const lastPayment = payments
      .filter(p => p.status === 'paid')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!lastPayment) {
      return res.status(200).json({
        active: false,
        status: 'no_payment',
        message: 'No payment found for this license'
      });
    }

    // Calcular próximo pagamento baseado no plano
    const paymentCycle = getPaymentCycle(license.plan);
    const lastPaymentDate = new Date(lastPayment.created_at);
    const nextPaymentDate = new Date(lastPaymentDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + paymentCycle);

    const now = new Date();
    const isActive = now < nextPaymentDate;

    // Log da verificação
    await supabase.from('license_logs').insert({
      license_id: license.id,
      action: 'payment_check',
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    return res.status(200).json({
      active: isActive,
      status: isActive ? 'paid' : 'expired',
      lastPayment: lastPayment.created_at,
      nextPayment: nextPaymentDate.toISOString(),
      amount: lastPayment.amount,
      paymentMethod: lastPayment.payment_method,
      transactionId: lastPayment.transaction_id,
      daysUntilExpiry: Math.max(0, Math.ceil((nextPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    });

  } catch (error) {
    console.error('Payment check error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

function getPaymentCycle(plan: string): number {
  const cycles = {
    trial: 0,
    basic: 1,
    professional: 1,
    enterprise: 1
  };
  
  return cycles[plan as keyof typeof cycles] || 1;
}
