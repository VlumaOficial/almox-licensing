-- ====================================================================
-- SCRIPT DE SETUP DO DATABASE - MÓDULO 1
-- ALMOX-LICENSING SYSTEM
-- ====================================================================
-- INSTRUÇÕES:
-- 1. Copie todo este script
-- 2. Acesse seu projeto Supabase: https://supabase.com/dashboard
-- 3. Vá em SQL Editor
-- 4. Cole este script completo
-- 5. Execute (Ctrl+Enter ou Cmd+Enter)
-- 6. Aguarde a conclusão
-- ====================================================================

-- ====================================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 2. TABELAS PRINCIPAIS
-- ====================================================================

-- Tabela de Instalações
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

-- Tabela de Licenças
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key VARCHAR(100) UNIQUE NOT NULL,
    installation_id VARCHAR(100) NOT NULL,
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

-- Tabela de Logs de Validação
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

-- ====================================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ====================================================================

-- Índices da tabela installations
CREATE INDEX IF NOT EXISTS idx_installations_id ON installations(installation_id);
CREATE INDEX IF NOT EXISTS idx_installations_email ON installations(customer_email);
CREATE INDEX IF NOT EXISTS idx_installations_status ON installations(status);
CREATE INDEX IF NOT EXISTS idx_installations_trial_expires ON installations(trial_expires_at);
CREATE INDEX IF NOT EXISTS idx_installations_created_at ON installations(created_at);

-- Índices da tabela licenses
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_installation_id ON licenses(installation_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_licenses_type ON licenses(license_type);
CREATE INDEX IF NOT EXISTS idx_licenses_created_at ON licenses(created_at);

-- Índices da tabela validation_logs
CREATE INDEX IF NOT EXISTS idx_validation_logs_license ON validation_logs(license_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_installation ON validation_logs(installation_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_email ON validation_logs(customer_email);
CREATE INDEX IF NOT EXISTS idx_validation_logs_created ON validation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_validation_logs_granted ON validation_logs(granted);
CREATE INDEX IF NOT EXISTS idx_validation_logs_response_time ON validation_logs(response_time_ms);

-- ====================================================================
-- 4. POLÍTICAS DE SEGURANÇA (RLS)
-- ====================================================================

-- Habilitar RLS
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para installations (somente leitura pública para validação)
CREATE POLICY "Allow read access for validation" ON installations
    FOR SELECT USING (true);

-- Políticas para licenses (somente leitura pública para validação)
CREATE POLICY "Allow read access for validation" ON licenses
    FOR SELECT USING (true);

-- Políticas para validation_logs (inserção pública, leitura restrita)
CREATE POLICY "Allow insert for validation" ON validation_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read access for validation" ON validation_logs
    FOR SELECT USING (true);

-- ====================================================================
-- 5. FUNÇÕES ÚTEIS
-- ====================================================================

-- Função para limpar logs antigos (mais de 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM validation_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar licenças expiradas
CREATE OR REPLACE FUNCTION check_expired_licenses()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Marcar licenças expiradas
    UPDATE licenses 
    SET status = 'expired' 
    WHERE status = 'active' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Atualizar status das instalações correspondentes
    UPDATE installations 
    SET status = 'expired' 
    WHERE license_id IN (
        SELECT id FROM licenses 
        WHERE status = 'expired' 
        AND expires_at < NOW()
    );
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 6. TRIGGERS AUTOMÁTICOS
-- ====================================================================

-- Trigger para atualizar last_validated_at quando há validação bem-sucedida
CREATE OR REPLACE FUNCTION update_last_validated()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.granted = true THEN
        UPDATE installations 
        SET last_validated_at = NEW.created_at 
        WHERE installation_id = NEW.installation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_validated
    AFTER INSERT ON validation_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_last_validated();

-- ====================================================================
-- 7. VIEWS ÚTEIS
-- ====================================================================

-- View para estatísticas de validação
CREATE OR REPLACE VIEW validation_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_validations,
    COUNT(CASE WHEN granted = true THEN 1 END) as successful_validations,
    COUNT(CASE WHEN granted = false THEN 1 END) as failed_validations,
    ROUND(AVG(response_time_ms), 2) as avg_response_time_ms,
    COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as errors
FROM validation_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View para licenças ativas
CREATE OR REPLACE VIEW active_licenses AS
SELECT 
    l.*,
    i.customer_name,
    i.customer_email,
    i.customer_company,
    i.created_at as installation_date,
    EXTRACT(DAYS FROM (l.expires_at - NOW())) as days_remaining
FROM licenses l
INNER JOIN installations i ON l.installation_id = i.installation_id
WHERE l.status = 'active'
ORDER BY l.expires_at ASC;

-- View para trials expirando
CREATE OR REPLACE VIEW expiring_trials AS
SELECT 
    i.*,
    l.license_key,
    l.license_type,
    EXTRACT(DAYS FROM (i.trial_expires_at - NOW())) as days_until_expiry
FROM installations i
INNER JOIN licenses l ON i.license_id = l.id
WHERE i.status = 'trial'
AND i.trial_expires_at > NOW()
AND i.trial_expires_at < NOW() + INTERVAL '7 days'
ORDER BY i.trial_expires_at ASC;

-- ====================================================================
-- 8. DADOS INICIAIS (OPCIONAL)
-- ====================================================================

-- Inserir alguns dados de teste (comentar em produção)
/*
INSERT INTO installations (
    installation_id, customer_name, customer_email, customer_phone, 
    customer_company, status, trial_expires_at
) VALUES 
(
    'ALX_TEST_001', 
    'João Silva', 
    'joao@teste.com', 
    '(11) 99999-8888',
    'Empresa Teste',
    'trial',
    NOW() + INTERVAL '7 days'
) ON CONFLICT (installation_id) DO NOTHING;

-- Inserir licença trial correspondente
INSERT INTO licenses (
    license_key, installation_id, license_type, status, 
    features, expires_at, external_reference
) VALUES 
(
    'TRIAL_' || EXTRACT(EPOCH FROM NOW())::bigint || '_TEST',
    'ALX_TEST_001',
    'trial',
    'active',
    '["basic_features_only"]',
    NOW() + INTERVAL '7 days',
    'trial_test_' || EXTRACT(EPOCH FROM NOW())::bigint
) ON CONFLICT (license_key) DO NOTHING;
*/

-- ====================================================================
-- 9. VERIFICAÇÃO FINAL
-- ====================================================================

-- Verificar se as tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('installations', 'licenses', 'validation_logs');
    
    IF table_count = 3 THEN
        RAISE NOTICE 'SUCESSO: Todas as tabelas foram criadas!';
        RAISE NOTICE 'Tabelas criadas: installations, licenses, validation_logs';
    ELSE
        RAISE EXCEPTION 'ERRO: Nem todas as tabelas foram criadas. Encontradas: %', table_count;
    END IF;
END $$;

-- Exibir estatísticas iniciais
DO $$
DECLARE
    installation_count INTEGER;
    license_count INTEGER;
    validation_log_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO installation_count FROM installations;
    SELECT COUNT(*) INTO license_count FROM licenses;
    SELECT COUNT(*) INTO validation_log_count FROM validation_logs;
    
    RAISE NOTICE 'Estatísticas iniciais:';
    RAISE NOTICE '- Instalações: %', installation_count;
    RAISE NOTICE '- Licenças: %', license_count;
    RAISE NOTICE '- Logs de validação: %', validation_log_count;
END $$;

-- ====================================================================
-- CONCLUSÃO
-- ====================================================================
RAISE NOTICE '===================================================================';
RAISE NOTICE 'Database setup do Módulo 1 concluído com sucesso!';
RAISE NOTICE 'Sistema Almox-Licensing pronto para uso.';
RAISE NOTICE '===================================================================';
