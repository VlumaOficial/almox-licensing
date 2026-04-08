import { VercelRequest, VercelResponse } from '@vercel/node';
import { createSupabaseClient } from '../lib/database';
import { 
  generateInstallationId, 
  generateTrialLicenseKey, 
  calculateExpiryDate,
  isValidEmail,
  log,
  generateUniqueTimestamp
} from '../lib/utils';
import { TrialSetupResult, InstallationData } from '../lib/types/license';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas permitir POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido' 
    });
  }

  try {
    log('info', 'Registro de trial iniciado', { 
      method: req.method,
      headers: req.headers
    });

    const {
      installation_id,
      name,
      email,
      phone,
      company,
      version,
      os_info,
      hardware_fingerprint
    } = req.body as InstallationData;

    // 1. Validar dados obrigatórios
    if (!installation_id || !name || !email) {
      log('warn', 'Dados obrigatórios faltando', { 
        installation_id: !!installation_id,
        name: !!name,
        email: !!email
      });
      
      return res.status(400).json({
        success: false,
        error: 'Dados obrigatórios faltando: installation_id, name e email são obrigatórios'
      });
    }

    // 2. Validar formato do email
    if (!isValidEmail(email)) {
      log('warn', 'Email inválido', { email });
      
      return res.status(400).json({
        success: false,
        error: 'Email inválido'
      });
    }

    // 3. Conectar ao Supabase
    const supabase = createSupabaseClient();

    // 4. Verificar se instalação já existe
    const { data: existingInstallation, error: checkError } = await supabase
      .from('installations')
      .select('id, installation_id, customer_email, status')
      .eq('installation_id', installation_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // Erro real do database
      log('error', 'Erro ao verificar instalação existente', { 
        installation_id,
        error: checkError.message 
      });
      
      throw new Error(`Erro ao verificar instalação: ${checkError.message}`);
    }

    if (existingInstallation) {
      log('warn', 'Instalação já existe', { 
        installation_id,
        existing_email: existingInstallation.customer_email,
        status: existingInstallation.status
      });
      
      return res.status(409).json({
        success: false,
        error: 'Instalação já registrada',
        installation: existingInstallation
      });
    }

    // 5. Preparar dados da instalação
    const trialExpiresAt = calculateExpiryDate('trial', 7); // 7 dias de trial
    const licenseKey = generateTrialLicenseKey();

    const installationData = {
      installation_id,
      customer_name: name.trim(),
      customer_email: email.toLowerCase().trim(),
      customer_phone: phone?.trim() || null,
      customer_company: company?.trim() || null,
      system_version: version || null,
      os_info: os_info || null,
      hardware_fingerprint: hardware_fingerprint || null,
      status: 'trial',
      created_at: new Date().toISOString(),
      trial_expires_at: trialExpiresAt,
      last_validated_at: new Date().toISOString()
    };

    log('info', 'Criando nova instalação trial', { 
      installation_id,
      customer_email: installationData.customer_email,
      trial_expires_at: trialExpiresAt
    });

    // 6. Criar instalação
    const { data: installation, error: insertError } = await supabase
      .from('installations')
      .insert(installationData)
      .select()
      .single();

    if (insertError) {
      log('error', 'Erro ao criar instalação', { 
        installation_id,
        error: insertError.message 
      });
      
      throw new Error(`Erro ao criar instalação: ${insertError.message}`);
    }

    // 7. Criar licença trial
    const licenseData = {
      license_key: licenseKey,
      installation_id: installation_id,
      license_type: 'trial',
      status: 'active',
      features: ['basic_features_only'], // Funcionalidades limitadas
      recurring: false,
      created_at: new Date().toISOString(),
      expires_at: trialExpiresAt,
      external_reference: `trial_${generateUniqueTimestamp()}`,
      metadata: {
        created_by: 'system',
        source: 'trial_registration',
        version: version || 'unknown'
      }
    };

    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .insert(licenseData)
      .select()
      .single();

    if (licenseError) {
      log('error', 'Erro ao criar licença trial', { 
        installation_id,
        error: licenseError.message 
      });
      
      // Tentar remover instalação criada
      await supabase
        .from('installations')
        .delete()
        .eq('installation_id', installation_id);
      
      throw new Error(`Erro ao criar licença: ${licenseError.message}`);
    }

    // 8. Atualizar instalação com ID da licença
    const { error: updateError } = await supabase
      .from('installations')
      .update({ license_id: license.id })
      .eq('installation_id', installation_id);

    if (updateError) {
      log('warn', 'Erro ao atualizar instalação com license_id', { 
        installation_id,
        license_id: license.id,
        error: updateError.message 
      });
    }

    // 9. Preparar resultado
    const result: TrialSetupResult = {
      success: true,
      installation_id: installation.installation_id,
      license_key: license.license_key,
      trial_expires_at: installation.trial_expires_at!,
      message: 'Trial ativado com sucesso!'
    };

    log('info', 'Trial registrado com sucesso', { 
      installation_id,
      license_key: license.license_key,
      trial_expires_at: result.trial_expires_at
    });

    // 10. Retornar sucesso
    res.status(201).json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    log('error', 'Falha no registro de trial', { 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      success: false,
      error: 'Erro no registro do trial',
      details: errorMessage
    });
  }
}
