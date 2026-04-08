# Almox-Licensing - Módulo 1: Database e APIs Core

## Visão Geral

Este módulo implementa a fundação do sistema de licenciamento Almox-Licensing, incluindo:
- Database schema completo
- APIs core de validação e registro
- Sistema de health check
- Interface de testes

## Estrutura do Módulo

```
almox-licensing/
|
|-- lib/                          # Bibliotecas compartilhadas
|   |-- types/license.ts          # Tipos TypeScript
|   |-- database.ts               # Conexão Supabase
|   |-- utils.ts                  # Utilitários gerais
|
|-- api/                          # APIs Vercel Functions
|   |-- health.ts                 # Health check
|   |-- register-trial.ts         # Registro de trial
|   |-- validate-license.ts       # Validação de licença
|
|-- scripts/                      # Scripts utilitários
|   |-- database-setup.sql        # Setup do database
|
|-- public/                       # Frontend de testes
|   |-- index.html                # Interface de testes
|   |-- css/style.css             # Estilos
|   |-- js/
|       |-- api-client.js         # Cliente API
|       |-- test-interface.js    # Interface de testes
|
|-- .env.example                  # Variáveis de ambiente
```

## Setup do Ambiente

### 1. Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
# Configurações obrigatórias
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Configurações opcionais
NODE_ENV=development
ENCRYPTION_KEY=sua-chave-de-criptografia
```

### 2. Setup do Database

1. Acesse o [Dashboard Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Copie e execute o script: `scripts/database-setup.sql`

O script irá criar:
- Tabelas: `installations`, `licenses`, `validation_logs`
- Índices para performance
- Funções úteis
- Views para analytics
- Triggers automáticos

### 3. Instalação de Dependências

```bash
npm install
```

## Testes Locais

### 1. Iniciar Servidor Local

```bash
# Usando Vercel CLI
npm install -g vercel
vercel dev

# Ou usando Node.js (se configurado)
npm run dev
```

### 2. Acessar Interface de Testes

Abra no navegador: `http://localhost:3000`

A interface oferece:

#### Status do Sistema
- Verificação de conexão com database
- Status das APIs
- Health check completo

#### Testes das APIs

1. **Registrar Instalação Trial**
   - Preencha o formulário com dados de teste
   - Clique em "Registrar Trial"
   - Verifique o resultado e logs

2. **Validar Licença**
   - Use o Installation ID e License Key retornados
   - Clique em "Validar Licença"
   - Verifique se a validação foi bem-sucedida

3. **Health Check**
   - Clique em "Verificar Saúde do Sistema"
   - Analise o status retornado

#### Logs do Sistema
- Visualize logs em tempo real
- Exporte logs para análise
- Limpe logs quando necessário

## APIs Disponíveis

### Health Check

```http
GET /api/health
```

Resposta:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-15T10:30:00.000Z",
  "response_time_ms": 45,
  "version": "1.0.0",
  "environment": "development",
  "services": {
    "database": {
      "healthy": true
    }
  }
}
```

### Registrar Trial

```http
POST /api/register-trial
```

Body:
```json
{
  "installation_id": "ALX_1641234567890_abc123_hardware123",
  "name": "João Silva",
  "email": "joao@teste.com",
  "phone": "(11) 99999-8888",
  "company": "Empresa Teste",
  "version": "1.0.0",
  "os_info": "Windows 10",
  "hardware_fingerprint": "abc123def456"
}
```

Resposta:
```json
{
  "success": true,
  "installation_id": "ALX_1641234567890_abc123_hardware123",
  "license_key": "TRIAL_1641234567890_ABC123_CHECKSUM",
  "trial_expires_at": "2024-12-22T10:30:00.000Z",
  "message": "Trial ativado com sucesso!"
}
```

### Validar Licença

```http
POST /api/validate-license
```

Body:
```json
{
  "installation_id": "ALX_1641234567890_abc123_hardware123",
  "license_key": "TRIAL_1641234567890_ABC123_CHECKSUM",
  "validation_context": {
    "hardware_fingerprint": "abc123def456",
    "ip_address": "189.45.123.45",
    "user_agent": "Mozilla/5.0..."
  }
}
```

Resposta (Sucesso):
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
  },
  "business_data": {
    "last_payment": null,
    "payment_amount": null,
    "installation_date": "2024-12-15T10:30:00.000Z"
  }
}
```

Resposta (Erro):
```json
{
  "valid": false,
  "error": "TRIAL_EXPIRED",
  "expired_at": "2024-12-22T10:30:00.000Z",
  "customer_email": "joao@teste.com"
}
```

## Database Schema

### Tabela: installations

| Coluna | Tipo | Descrição |
|--------|------|------------|
| id | UUID | ID primário |
| installation_id | VARCHAR(100) | ID único da instalação |
| customer_name | VARCHAR(200) | Nome do cliente |
| customer_email | VARCHAR(200) | Email do cliente |
| status | VARCHAR(20) | Status: trial, licensed, expired, suspended |
| trial_expires_at | TIMESTAMP | Expiração do trial |
| created_at | TIMESTAMP | Data de criação |

### Tabela: licenses

| Coluna | Tipo | Descrição |
|--------|------|------------|
| id | UUID | ID primário |
| license_key | VARCHAR(100) | Chave da licença |
| installation_id | VARCHAR(100) | ID da instalação |
| license_type | VARCHAR(50) | Tipo: trial, monthly, annual, etc. |
| status | VARCHAR(20) | Status: active, expired, suspended |
| expires_at | TIMESTAMP | Data de expiração |
| features | JSONB | Funcionalidades permitidas |

### Tabela: validation_logs

| Coluna | Tipo | Descrição |
|--------|------|------------|
| id | UUID | ID primário |
| installation_id | VARCHAR(100) | ID da instalação |
| granted | BOOLEAN | Se a validação foi concedida |
| response_time_ms | INTEGER | Tempo de resposta |
| created_at | TIMESTAMP | Data da validação |

## Deploy em Produção

### 1. Configurar Vercel

O projeto já está configurado para deploy no Vercel através do `vercel.json`.

### 2. Variáveis de Ambiente no Vercel

Configure as variáveis de ambiente no dashboard do Vercel:

1. Acesse o projeto no Vercel
2. Vá para **Settings** > **Environment Variables**
3. Adicione as variáveis do `.env`

### 3. Deploy

```bash
git add .
git commit -m "Módulo 1: Database e APIs Core"
git push origin main
```

O Vercel irá automaticamente:
- Buildar o projeto
- Deployar as APIs
- Publicar o frontend
- Configurar as rotas

## Verificação do Deploy

Após o deploy, verifique:

1. **Health Check**: `https://seu-domínio.vercel.app/api/health`
2. **Interface de Testes**: `https://seu-domínio.vercel.app`
3. **Logs no Vercel**: Dashboard > Functions > Logs

## Troubleshooting

### Problemas Comuns

#### 1. "Database connection error"
- Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` estão corretos
- Confirme se as tabelas foram criadas no Supabase

#### 2. "License not found"
- Verifique se o `installation_id` e `license_key` estão corretos
- Confirme se a licença existe no database

#### 3. "CORS error"
- Verifique se as APIs estão permitindo requisições do seu domínio
- Confirme se os headers CORS estão configurados

#### 4. "Build failed"
- Verifique se todas as dependências estão instaladas
- Confirme se os arquivos TypeScript estão compilando

### Logs e Debugging

- Use a interface de testes para visualizar logs em tempo real
- Verifique os logs no Vercel Dashboard
- Use o browser console para erros de frontend

## Próximos Passos

Após concluir o Módulo 1:

1. **Módulo 2**: Sistema Cliente (Trial + Instalação)
2. **Módulo 3**: Integração ASAAS
3. **Módulo 4**: Painel Administrativo
4. **Módulo 5**: Funcionalidades Avançadas
5. **Módulo 6**: Analytics e Relatórios

## Critérios de Aceite

O Módulo 1 está completo quando:

- [ ] Database schema criado e funcionando
- [ ] APIs respondem corretamente
- [ ] Health check retorna status healthy
- [ ] Registro de trial funciona
- [ ] Validação de licença opera
- [ ] Interface de testes funcional
- [ ] Deploy em produção estável
- [ ] Logs são registrados corretamente

## Suporte

Para dúvidas ou problemas:

1. Verifique os logs na interface de testes
2. Consulte o troubleshooting acima
3. Analise os logs no Vercel Dashboard
4. Revise este README para configurações

---

**Status do Módulo 1**: Em desenvolvimento  
**Última atualização**: 15/12/2024  
**Versão**: 1.0.0
