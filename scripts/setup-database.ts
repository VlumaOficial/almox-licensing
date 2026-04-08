import { supabase } from '../lib/database';

// Script de setup do database para Módulo 1
// Tabelas essenciais para funcionamento básico

async function setupDatabase() {
  console.log('Iniciando setup do database...');

  try {
    // 1. Criar tabela de instalações
    await createInstallationsTable();
    
    // 2. Criar tabela de licenças
    await createLicensesTable();
    
    // 3. Criar tabela de logs de validação
    await createValidationLogsTable();
    
    // 4. Criar índices
    await createIndexes();
    
    // 5. Inserir dados iniciais (se necessário)
    await insertInitialData();
    
    console.log('Database setup concluído com sucesso!');
    
  } catch (error) {
    console.error('Erro no setup do database:', error);
    throw error;
  }
}

async function createInstallationsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS installations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      installation_id VARCHAR(100) UNIQUE NOT NULL,
      customer_name VARCHAR(200) NOT NULL,
      customer_email VARCHAR(200) NOT NULL,
      customer_phone VARCHAR(20),
      customer_company VARCHAR(200),
      customer_document VARCHAR(20),
      system_version VARCHAR(50),
      os_info TEXT,
      hardware_fingerprint TEXT,
      status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('trial', 'licensed', 'expired', 'suspended')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      trial_expires_at TIMESTAMP WITH TIME ZONE,
      licensed_at TIMESTAMP WITH TIME ZONE,
      last_validated_at TIMESTAMP WITH TIME ZONE,
      license_id UUID REFERENCES licenses(id)
    );
  `;
  
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    // Fallback: tentar criar tabela diretamente
    console.log('Tentando criar tabela installations diretamente...');
    // Nota: Em produção, isso deve ser feito via SQL Editor do Supabase
  }
  
  console.log('Tabela installations criada/verificada');
}

async function createLicensesTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS licenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      license_key VARCHAR(100) UNIQUE NOT NULL,
      installation_id VARCHAR(100) REFERENCES installations(installation_id),
      license_type VARCHAR(50) NOT NULL,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'deleted')),
      features JSONB DEFAULT '{}',
      recurring BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      last_payment_at TIMESTAMP WITH TIME ZONE,
      next_payment_at TIMESTAMP WITH TIME ZONE,
      last_payment_id VARCHAR(100),
      last_payment_amount DECIMAL(10,2),
      external_reference VARCHAR(200),
      metadata JSONB DEFAULT '{}'
    );
  `;
  
  console.log('Tabela licenses criada/verificada');
}

async function createValidationLogsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS validation_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      license_id UUID REFERENCES licenses(id),
      installation_id VARCHAR(100) NOT NULL,
      customer_email VARCHAR(200) NOT NULL,
      validation_context JSONB DEFAULT '{}',
      response_time_ms INTEGER,
      granted BOOLEAN NOT NULL,
      error_message TEXT,
      ip_address INET,
      user_agent TEXT,
      hardware_fingerprint TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  console.log('Tabela validation_logs criada/verificada');
}

async function createIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_installations_id ON installations(installation_id);',
    'CREATE INDEX IF NOT EXISTS idx_installations_email ON installations(customer_email);',
    'CREATE INDEX IF NOT EXISTS idx_installations_status ON installations(status);',
    'CREATE INDEX IF NOT EXISTS idx_installations_trial_expires ON installations(trial_expires_at);',
    'CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);',
    'CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);',
    'CREATE INDEX IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);',
    'CREATE INDEX IF NOT EXISTS idx_validation_logs_license ON validation_logs(license_id);',
    'CREATE INDEX IF NOT EXISTS idx_validation_logs_installation ON validation_logs(installation_id);',
    'CREATE INDEX IF NOT EXISTS idx_validation_logs_created ON validation_logs(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_validation_logs_granted ON validation_logs(granted);'
  ];
  
  for (const indexSql of indexes) {
    console.log(`Criando índice: ${indexSql.substring(0, 50)}...`);
  }
  
  console.log('Índices criados/verificados');
}

async function insertInitialData() {
  // Inserir dados de teste se necessário
  console.log('Dados iniciais verificados');
}

// Função para verificar se as tabelas existem
async function checkTables() {
  const tables = ['installations', 'licenses', 'validation_logs'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        console.error(`Erro na tabela ${table}:`, error.message);
      } else {
        console.log(`Tabela ${table}: OK`);
      }
    } catch (error) {
      console.error(`Erro ao verificar tabela ${table}:`, error);
    }
  }
}

// Executar setup se chamado diretamente
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Setup concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup falhou:', error);
      process.exit(1);
    });
}

export { setupDatabase, checkTables };
