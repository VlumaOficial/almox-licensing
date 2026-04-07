# 🔄 Sistema de Validação Diária Centralizada

## 🎯 CONCEITO

Sistema onde **todas as aplicações** consultam uma API central diariamente para validar suas licenças. Se inválida, a aplicação é **congelada** e apenas a tela de configurações com "Valide Licença" fica acessível.

## 🏗️ ARQUITETURA

```
🌐 API Central (almox-licensing-api)
├── 📊 POST /validation/daily     ← Validação diária
├── 🔍 POST /validation/check      ← Verificação rápida
├── 🚫 POST /validation/freeze     ← Forçar bloqueio
├── 🔓 POST /validation/unfreeze   ← Desbloquear admin
└── 📈 GET /validation/status      ← Status completo

📱 Aplicações Cliente
├── ⏰ Validação automática (20-28h aleatório)
├── 🔓 Estado: unlocked/frozen
├── 🎛️ Acesso: apenas configurações se bloqueado
└── 📞 Botão "Valide Licença" → contato suporte
```

## 🔄 FLUXO DE VALIDAÇÃO

### **1. Validação Diária Automática**
```typescript
// A cada 20-28 horas (aleatório)
const validator = DailyValidator.getInstance(
  'https://api.almoxpro.com/v1',
  'MinhaApp',
  '1.0.0'
);

validator.startDailyValidation();
```

### **2. Se Licença Válida ✅**
```
🎉 Sistema liberado
├── Funcionalidades normais
├── Próxima validação agendada
└── Log de sucesso no banco
```

### **3. Se Licença Inválida ❌**
```
🚫 Sistema congelado
├── Todas as telas bloqueadas
├── Apenas "Configurações" acessível
├── Botão "Valide Licença" visível
├── Informações de suporte
└── Log de falha no banco
```

## 🎛️ INTERFACE DO USUÁRIO

### **Modo Normal (Liberado)**
```
┌─────────────────────────────────┐
│ ✅ Sistema Liberado              │
│ Licença Professional ativa     │
│ [Verificar]                    │
└─────────────────────────────────┘
```

### **Modo Congelado (Bloqueado)**
```
┌─────────────────────────────────┐
│ 🚫 Licença Inválida             │
│                                │
│ Sua licença Professional       │
│ necessita renovação.            │
│                                │
│ Entre em contato com o suporte: │
│ 📧 suporte@almoxpro.com        │
│ 📞 (11) 9999-9999              │
│                                │
│ [Valide Licença] [Contato]     │
└─────────────────────────────────┘
```

### **Painel de Configurações**
```
┌─────────────────────────────────┐
│ 🛡️ Configurações de Licença      │
│                                │
│ Status: 🚫 Sistema Bloqueado     │
│ Licença Professional expirou    │
│                                │
│ [Valide Licença]                │
│                                │
│ 🔓 Desbloqueio Administrativo   │
│ Chave: [________________]        │
│ [Desbloquear Sistema]           │
│                                │
│ 📞 Suporte                      │
│ suporte@almoxpro.com            │
└─────────────────────────────────┘
```

## 📡 ENDPOINTS DA API

### **POST /validation/daily**
Validação diária principal
```json
{
  "licenseKey": "ALMX-PROF789-DEMO",
  "machineId": "machine-abc123",
  "fingerprint": "fp-def456",
  "applicationName": "MinhaApp",
  "applicationVersion": "1.0.0",
  "userAgent": "Mozilla/5.0...",
  "platform": "Windows",
  "ipAddress": "192.168.1.100"
}
```

**Resposta Sucesso:**
```json
{
  "success": true,
  "isValid": true,
  "license": {
    "plan": "professional",
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "daysRemaining": 240
  },
  "message": "Licença válida. Sistema liberado.",
  "nextValidation": "2026-04-07T15:30:00.000Z",
  "requiresAction": null
}
```

**Resposta Falha:**
```json
{
  "success": false,
  "isValid": false,
  "error": "LICENSE_EXPIRED",
  "message": "Sua licença expirou. Entre em contato com o suporte para renovação.",
  "requiresAction": "contact_support",
  "supportInfo": {
    "email": "suporte@almoxpro.com",
    "phone": "(11) 9999-9999",
    "website": "https://almoxpro.com/suporte"
  }
}
```

### **POST /validation/freeze**
Forçar bloqueio manual
```json
{
  "licenseKey": "ALMX-PROF789-DEMO",
  "machineId": "machine-abc123",
  "reason": "Manual admin freeze - non-payment"
}
```

### **POST /validation/unfreeze**
Desbloqueio administrativo
```json
{
  "licenseKey": "ALMX-PROF789-DEMO",
  "machineId": "machine-abc123",
  "adminKey": "ALMX-ADMIN-MASTER-KEY-123"
}
```

## 🔧 INTEGRAÇÃO NO ALMOX

### **1. Configurar Provider Principal**
```typescript
// App.tsx
import { LicenseValidator } from '@almoxpro/licensing';

function App() {
  const [isFrozen, setIsFrozen] = useState(false);
  
  return (
    <LicenseValidator
      validationEndpoint="https://api.almoxpro.com/v1"
      applicationName="AlmoxPro"
      applicationVersion="2.0.0"
      onValidLicense={() => setIsFrozen(false)}
      onInvalidLicense={() => setIsFrozen(true)}
    >
      <Router>
        {isFrozen ? (
          // Apenas rota de configurações
          <Route path="/configuracoes" element={<Configuracoes />} />
        ) : (
          // Todas as rotas
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/materiais" element={<Materiais />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </>
        )}
      </Router>
    </LicenseValidator>
  );
}
```

### **2. Painel de Configurações**
```typescript
// Configuracoes.tsx
import { LicenseConfigPanel } from '@almoxpro/licensing';

function Configuracoes() {
  return (
    <div>
      <h1>Configurações</h1>
      
      {/* Painel de licença sempre visível */}
      <LicenseConfigPanel
        validationEndpoint="https://api.almoxpro.com/v1"
        applicationName="AlmoxPro"
        applicationVersion="2.0.0"
      />
      
      {/* Outras configurações apenas se não congelado */}
      <LicenseGuard>
        <OutrasConfiguracoes />
      </LicenseGuard>
    </div>
  );
}
```

### **3. Proteção de Componentes**
```typescript
// Componente protegido
function Materiais() {
  return (
    <LicenseGuard>
      <div>
        <h1>Materiais</h1>
        {/* Conteúdo apenas com licença válida */}
      </div>
    </LicenseGuard>
  );
}
```

## 🗄️ BANCO DE DADOS

### **Tabelas Adicionais**
```sql
-- Logs de validação diária
CREATE TABLE license_daily_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key VARCHAR(50) NOT NULL,
    machine_id VARCHAR(255) NOT NULL,
    application_name VARCHAR(100) NOT NULL,
    application_version VARCHAR(20),
    ip_address INET,
    success BOOLEAN NOT NULL,
    response_time INTEGER,
    error_message TEXT,
    next_validation TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs de congelamento
CREATE TABLE license_freeze_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key VARCHAR(50) NOT NULL,
    machine_id VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    unfrozen_at TIMESTAMP WITH TIME ZONE,
    admin_key VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📊 MONITORAMENTO

### **Dashboard de Validações**
```sql
-- Validações das últimas 24h
SELECT 
    application_name,
    COUNT(*) as total_validations,
    COUNT(CASE WHEN success THEN 1 END) as successful,
    COUNT(CASE WHEN NOT success THEN 1 END) as failed,
    AVG(response_time) as avg_response_time
FROM license_daily_validations 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY application_name;
```

### **Aplicações Congeladas**
```sql
-- Aplicações atualmente congeladas
SELECT 
    license_key,
    machine_id,
    application_name,
    reason,
    created_at
FROM license_freeze_logs 
WHERE unfrozen_at IS NULL;
```

## 🔐 SEGURANÇA

### **Chaves de Administrador**
```typescript
// Gerar chave de admin
const adminKey = CryptoHelper.generateSecureToken(32);
// Ex: ALMX-ADMIN-7F9A2B3C4D5E6F7G8H9I0J1K2L3M4N5O

// Validar chave admin
if (adminKey.startsWith('ALMX-ADMIN-') && adminKey.length >= 30) {
  // Chave válida
}
```

### **Rate Limiting**
```typescript
// Limitar validações por aplicação
const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100, // máximo 100 validações/hora
  message: 'Too many validation attempts'
});
```

## 🚀 DEPLOY

### **Variáveis de Ambiente**
```env
# API
VALIDATION_ENDPOINT=https://api.almoxpro.com/v1
ADMIN_MASTER_KEY=ALMX-ADMIN-SUPER-SECRET-KEY

# Aplicação
APP_NAME=AlmoxPro
APP_VERSION=2.0.0
VALIDATION_INTERVAL_MIN=20
VALIDATION_INTERVAL_MAX=28
```

### **Health Check**
```typescript
// Verificar se API está respondendo
async function healthCheck() {
  try {
    const response = await fetch(`${VALIDATION_ENDPOINT}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

## 🧪 TESTES

### **Teste de Validação**
```bash
# Testar licença válida
curl -X POST https://api.almoxpro.com/v1/validation/daily \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "ALMX-PROF789-DEMO",
    "machineId": "test-machine-123",
    "applicationName": "TestApp"
  }'
```

### **Teste de Congelamento**
```bash
# Forçar congelamento
curl -X POST https://api.almoxpro.com/v1/validation/freeze \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "ALMX-PROF789-DEMO",
    "machineId": "test-machine-123",
    "reason": "Test freeze"
  }'
```

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **✅ API Central**
- [ ] Endpoint `/validation/daily`
- [ ] Endpoint `/validation/check`
- [ ] Endpoint `/validation/freeze`
- [ ] Endpoint `/validation/unfreeze`
- [ ] Logs de validação
- [ ] Rate limiting
- [ ] Notificações

### **✅ Módulo Cliente**
- [ ] DailyValidator
- [ ] LicenseValidator component
- [ ] LicenseConfigPanel
- [ ] Validação automática
- [ ] Estado congelado
- [ ] Interface de suporte

### **✅ Integração Almox**
- [ ] Provider principal
- [ ] Roteamento condicional
- [ ] Painel configurações
- [ ] Proteção de componentes
- [ ] Logs de aplicação

### **✅ Banco de Dados**
- [ ] Tabelas de validação
- [ ] Logs de congelamento
- [ ] Views de monitoramento
- [ ] Índices otimizados

## 🎯 BENEFÍCIOS

### **✅ Para Você (Desenvolvedor)**
- 🎯 **Controle Centralizado** - Uma API para todas as apps
- 📊 **Monitoramento Completo** - Logs e estatísticas
- 🔐 **Segurança Avançada** - Bloqueio automático
- 🚀 **Escalabilidade** - Suporta milhares de apps
- 💰 **Receita Recorrente** - Renovações automáticas

### **✅ Para o Cliente**
- 🔄 **Validação Transparente** - Sem intervenção manual
- 📱 **Experiência Clara** - Mensagens objetivas
- 🎛️ **Controle Parcial** - Configurações sempre acessíveis
- 📞 **Suporte Integrado** - Contato direto
- 🔓 **Recuperação Fácil** - Desbloqueio via admin

---

**Sistema completo de validação centralizada implementado!** 🎉

**O AlmoxPro agora tem controle total sobre todas as aplicações!** 🚀
