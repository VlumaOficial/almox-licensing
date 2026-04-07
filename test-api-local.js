// TESTE LOCAL DA API - ALMOX LICENSING
// Execute: node test-api-local.js

const { createClient } = require('@supabase/supabase-js');

// Configuração - SUBSTITUA COM SUAS CREDENCIAIS
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
    console.log('=== TESTE DE CONEXÃO SUPABASE ===\n');
    
    try {
        // Teste 1: Verificar planos
        console.log('1. Testando planos disponíveis...');
        const { data: plans, error: plansError } = await supabase
            .from('license_plans')
            .select('*');
        
        if (plansError) {
            console.error('Erro nos planos:', plansError);
        } else {
            console.log(`Planos encontrados: ${plans.length}`);
            plans.forEach(plan => {
                console.log(`  - ${plan.name}: ${plan.display_name} (R$${plan.monthly_price || 0}/mês)`);
            });
        }
        
        // Teste 2: Verificar licenças demo
        console.log('\n2. Testando licenças demo...');
        const { data: licenses, error: licensesError } = await supabase
            .from('licenses')
            .select('*')
            .like('license_key', '%-DEMO');
        
        if (licensesError) {
            console.error('Erro nas licenças:', licensesError);
        } else {
            console.log(`Licenças demo encontradas: ${licenses.length}`);
            licenses.forEach(license => {
                console.log(`  - ${license.license_key}: ${license.plan} (${license.status})`);
            });
        }
        
        // Teste 3: Testar função de validação
        console.log('\n3. Testando função de validação...');
        const { data: validation, error: validationError } = await supabase
            .rpc('validate_license', {
                p_license_key: 'ALMX-TRIAL123-DEMO',
                p_machine_id: 'machine-test-001',
                p_fingerprint: 'fp-test-001'
            });
        
        if (validationError) {
            console.error('Erro na validação:', validationError);
        } else {
            console.log('Validação bem-sucedida:');
            console.log(`  - Sucesso: ${validation[0]?.success}`);
            console.log(`  - Licença: ${validation[0]?.license_info?.plan}`);
            console.log(`  - Dias restantes: ${validation[0]?.license_info?.days_remaining}`);
        }
        
        // Teste 4: Verificar usuário admin
        console.log('\n4. Testando usuário admin...');
        const { data: admin, error: adminError } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'admin@almoxpro.com')
            .single();
        
        if (adminError) {
            console.error('Erro no admin:', adminError);
        } else {
            console.log('Usuário admin encontrado:');
            console.log(`  - Email: ${admin.email}`);
            console.log(`  - Nome: ${admin.name}`);
            console.log(`  - Role: ${admin.role}`);
        }
        
        console.log('\n=== TESTE CONCLUÍDO ===');
        console.log('Se todos os testes passaram, sua API está pronta para deploy!');
        
    } catch (error) {
        console.error('Erro geral:', error);
    }
}

// Executar teste
testSupabaseConnection();
