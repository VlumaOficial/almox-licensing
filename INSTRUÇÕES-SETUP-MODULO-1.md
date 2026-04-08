# Instruções de Setup - Módulo 1 Almox-Licensing

## Visão Geral

Este guia completa o Módulo 1 com database funcional, dropando tabelas antigas e recriando o schema correto.

## Pré-requisitos

- Acesso ao projeto Supabase
- Permissões de administrador no Supabase
- Acesso ao dashboard do Vercel

## Passo 1: Setup do Database (10 minutos)

### 1.1 Acessar Supabase
1. Abra: https://supabase.com/dashboard
2. Selecione seu projeto Almox-Licensing
3. Vá para **SQL Editor** no menu lateral

### 1.2 Executar Script SQL
1. Copie todo o conteúdo do arquivo: `scripts/database-setup-with-drop.sql`
2. Cole no SQL Editor do Supabase
3. Clique em **Run** (Ctrl+Enter ou Cmd+Enter)
4. Aguarde a conclusão (deve mostrar "SUCESSO: Todas as tabelas foram criadas!")

### 1.3 Verificar Resultado
No final da execução, você deve ver:
```
SUCESSO: Todas as tabelas foram criadas!
Tabelas criadas: installations, licenses, validation_logs
Estatísticas iniciais:
- Instalações: 0
- Licenças: 0
- Logs de validação: 0
SUCESSO: Todas as views foram criadas!
Database setup do Módulo 1 concluído com sucesso!
```

## Passo 2: Configurar Variáveis de Ambiente (5 minutos)

### 2.1 Obter Credenciais do Supabase
No dashboard do Supabase:
1. Vá para **Settings** > **API**
2. Copie a **Project URL** (SUPABASE_URL)
3. Copie a **service_role** key (SUPABASE_SERVICE_KEY)

### 2.2 Configurar no Vercel
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto Almox-Licensing
3. Vá para **Settings** > **Environment Variables**
4. Adicione as variáveis:

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

### 2.3 Redeploy Automático
Após adicionar as variáveis, o Vercel fará redeploy automático.

## Passo 3: Testar Funcionalidades (10 minutos)

### 3.1 Health Check
Abra no navegador: `https://seu-projeto.vercel.app/api/health`

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-15T10:30:00.000Z",
  "response_time_ms": 45,
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": {
      "healthy": true
    }
  }
}
```

### 3.2 Interface de Testes
Abra: `https://seu-projeto.vercel.app`

Você deve ver:
- [x] Página estilizada (CSS funcionando)
- [x] Status indicators funcionando
- [x] Formulários interativos

### 3.3 Registrar Trial
1. Preencha o formulário "Registrar Instalação Trial"
2. Use dados de teste:
   - Nome: João Silva
   - Email: joao@teste.com
   - Telefone: (11) 99999-8888
   - Empresa: Empresa Teste
3. Clique em "Registrar Trial"

**Resposta esperada:**
```json
{
  "success": true,
  "installation_id": "ALX_1641234567890_abc123_hardware123",
  "license_key": "TRIAL_1641234567890_ABC123_CHECKSUM",
  "trial_expires_at": "2024-12-22T10:30:00.000Z",
  "message": "Trial ativado com sucesso!"
}
```

### 3.4 Validar Licença
1. Use os dados retornados no passo anterior
2. Preencha "Installation ID" e "License Key"
3. Clique em "Validar Licença"

**Resposta esperada:**
```json
{
  "valid": true,
  "license_info": {
    "customer_name": "João Silva",
    "license_type": "trial",
    "features": ["basic_features_only"],
    "expires_at": "2024-12-22T10:30:00.000Z",
    "days_remaining": 7,
    "recurring": false,
    "installation_id": "ALX_1641234567890_abc123_hardware123"
  }
}
```

## Passo 4: Verificação Final (5 minutos)

### 4.1 Checklist de Validação

#### Frontend:
- [ ] Página carrega com estilos CSS
- [ ] Formulários são interativos
- [ ] Logs aparecem em tempo real
- [ ] Sem erros 404 no console

#### APIs:
- [ ] Health check retorna "healthy"
- [ ] Registro de trial funciona
- [ ] Validação de licença opera
- [ ] Sem erros 500/404

#### Database:
- [ ] Tabelas criadas corretamente
- [ ] Dados persistem no Supabase
- [ ] Views funcionam
- [ ] Logs são registrados

### 4.2 Verificar no Supabase
No SQL Editor do Supabase, execute:
```sql
-- Verificar instalações
SELECT * FROM installations;

-- Verificar licenças
SELECT * FROM licenses;

-- Verificar logs de validação
SELECT * FROM validation_logs ORDER BY created_at DESC LIMIT 5;
```

## Troubleshooting

### Problema 1: "Database connection error"
**Causa:** Variáveis de ambiente incorretas
**Solução:** Verifique SUPABASE_URL e SUPABASE_SERVICE_KEY no Vercel

### Problema 2: "column does not exist"
**Causa:** Script SQL não executado completamente
**Solução:** Execute novamente o script `database-setup-with-drop.sql`

### Problema 3: "CORS error"
**Causa:** Headers CORS faltando
**Solução:** Verifique se as APIs têm headers CORS configurados

### Problema 4: "404 Not Found"
**Causa:** Arquivos estáticos não servidos
**Solução:** Verifique configuração do vercel.json

## Comandos Úteis

### Testar APIs via cURL
```bash
# Health check
curl https://seu-projeto.vercel.app/api/health

# Registrar trial
curl -X POST https://seu-projeto.vercel.app/api/register-trial \
  -H "Content-Type: application/json" \
  -d '{"installation_id":"test","name":"Test","email":"test@test.com"}'

# Validar licença
curl -X POST https://seu-projeto.vercel.app/api/validate-license \
  -H "Content-Type: application/json" \
  -d '{"installation_id":"test","license_key":"test"}'
```

### Verificar Logs no Vercel
```bash
vercel logs
```

## Resultado Final

Após seguir todas as instruções, você terá:

### Módulo 1 100% Funcional:
- [x] Database schema correto
- [x] APIs operacionais
- [x] Frontend completo
- [x] Sistema de validação
- [x] Logs e monitoramento
- [x] Interface de testes

### Pronto para Próximos Módulos:
- Módulo 2: Sistema Cliente
- Módulo 3: Integração ASAAS
- Módulo 4: Painel Administrativo

## Suporte

Se encontrar problemas:
1. Verifique os logs no console do browser
2. Consulte os logs no Vercel Dashboard
3. Revise as variáveis de ambiente
4. Execute novamente o script SQL se necessário

---

**Status:** Guia completo para setup do Módulo 1  
**Tempo estimado:** 30 minutos  
**Próximo passo:** Iniciar Módulo 2 após validação
