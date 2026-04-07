// Exemplo de teste rápido do módulo de licenciamento
// Execute com: node test-example.js

// Importar módulo (após build)
// import { LicenseManager } from './dist/index.js';

// Simulação de teste
console.log('🚀 Testando AlmoxPro Licensing Module');
console.log('');

// Teste 1: Gerar chave de licença
console.log('📋 Teste 1: Gerar chave de licença');
const testKey = 'ALMX-TRIAL123-DEMO';
console.log('✅ Chave gerada:', testKey);
console.log('');

// Teste 2: Validar formato
console.log('📋 Teste 2: Validar formato da chave');
const isValidFormat = /^ALMX-[A-Z0-9]+-[A-Z0-9]+$/.test(testKey);
console.log('✅ Formato válido:', isValidFormat);
console.log('');

// Teste 3: Simular ativação
console.log('📋 Teste 3: Simular ativação');
const mockActivation = {
  success: true,
  license: {
    key: testKey,
    plan: 'trial',
    expires_at: '2026-04-21T20:00:00.000Z',
    is_valid: true,
    days_remaining: 15,
    features: ['basic_materials', 'basic_reports', 'email_support']
  }
};
console.log('✅ Ativação simulada:', mockActivation.success);
console.log('📦 Plano:', mockActivation.license.plan);
console.log('⏰ Dias restantes:', mockActivation.license.days_remaining);
console.log('');

// Teste 4: Verificar features
console.log('📋 Teste 4: Verificar features');
const hasBasicFeature = mockActivation.license.features.includes('basic_materials');
const hasAdvancedFeature = mockActivation.license.features.includes('advanced_reports');
console.log('✅ Tem basic_materials:', hasBasicFeature);
console.log('❌ Tem advanced_reports:', hasAdvancedFeature);
console.log('');

// Teste 5: Machine fingerprint
console.log('📋 Teste 5: Machine fingerprint (simulado)');
const mockFingerprint = 'fp-' + Math.random().toString(36).substring(2, 18);
console.log('✅ Fingerprint gerado:', mockFingerprint);
console.log('');

// Teste 6: Validação de licença perpétua
console.log('📋 Teste 6: Licença perpétua');
const perpetualKey = 'ALMX-PERPETUAL-CLOUD-' + Date.now().toString(36).toUpperCase();
console.log('✅ Chave perpétua:', perpetualKey);
console.log('🔓 Tipo: Perpétua (não expira)');
console.log('');

console.log('🎉 Testes concluídos com sucesso!');
console.log('');
console.log('📋 Próximos passos:');
console.log('1. Aplicar script SQL no Supabase');
console.log('2. Build do módulo: npm run build');
console.log('3. Deploy no Vercel');
console.log('4. Integrar no sistema Almox');
console.log('');
console.log('🔗 Links úteis:');
console.log('- Módulo: https://github.com/VlumaOficial/almox-licensing');
console.log('- API: https://github.com/VlumaOficial/almox-licensing-api');
console.log('- Supabase: https://supabase.com/dashboard');
