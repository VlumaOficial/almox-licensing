// API Backend - Almox Licensing
// Endpoint: /api/admin/licenses

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetLicenses(req, res);
      case 'POST':
        return await handleCreateLicense(req, res);
      case 'PUT':
        return await handleUpdateLicense(req, res);
      case 'DELETE':
        return await handleDeleteLicense(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

async function handleGetLicenses(req: VercelRequest, res: VercelResponse) {
  const { page = 1, limit = 50, plan, status, search } = req.query;
  
  let query = supabase
    .from('licenses')
    .select(`
      *,
      payments (
        amount,
        status,
        created_at
      ),
      license_logs (
        action,
        created_at
      )
    `, { count: 'exact' });

  // Aplicar filtros
  if (plan) {
    query = query.eq('plan', plan);
  }
  
  if (status) {
    if (status === 'active') {
      query = query.gt('expiry_date', new Date().toISOString());
    } else if (status === 'expired') {
      query = query.lte('expiry_date', new Date().toISOString());
    }
  }
  
  if (search) {
    query = query.or(`license_key.ilike.%${search}%,machine_id.ilike.%${search}%`);
  }

  // Paginação
  const offset = (Number(page) - 1) * Number(limit);
  query = query.range(offset, offset + Number(limit) - 1);

  const { data, error, count } = await query.order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch licenses' });
  }

  return res.status(200).json({
    licenses: data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      pages: Math.ceil((count || 0) / Number(limit))
    }
  });
}

async function handleCreateLicense(req: VercelRequest, res: VercelResponse) {
  const { licenseKey, plan, clientInfo, expiryDays = 30 } = req.body;

  if (!licenseKey || !plan) {
    return res.status(400).json({ 
      error: 'License key and plan are required' 
    });
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  const { data, error } = await supabase
    .from('licenses')
    .insert({
      license_key: licenseKey,
      plan,
      expiry_date: expiryDate.toISOString(),
      client_info: clientInfo || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error || !data) {
    return res.status(500).json({ error: 'Failed to create license' });
  }

  return res.status(201).json({
    success: true,
    license: data
  });
}

async function handleUpdateLicense(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({ error: 'License ID is required' });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('licenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return res.status(500).json({ error: 'Failed to update license' });
  }

  return res.status(200).json({
    success: true,
    license: data
  });
}

async function handleDeleteLicense(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'License ID is required' });
  }

  const { error } = await supabase
    .from('licenses')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete license' });
  }

  return res.status(200).json({
    success: true,
    message: 'License deleted successfully'
  });
}
