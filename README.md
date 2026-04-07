# 📦 @almoxpro/licensing

Módulo de licenciamento profissional para aplicações React e Node.js.

## 🚀 Features

- ✅ **Licenciamento Online/Offline** - Validação automática com fallback
- ✅ **Múltiplos Planos** - Trial, Basic, Professional, Enterprise, Perpétuos
- ✅ **Segurança Avançada** - Machine fingerprint, criptografia, hash
- ✅ **API REST** - Endpoints completos para gestão
- ✅ **React Hooks** - Integração nativa com React
- ✅ **TypeScript** - Tipagem completa e segura
- ✅ **Customizável** - Configuração flexível de planos e preços
- ✅ **Multi-plataforma** - Web, mobile, desktop

## 📦 Instalação

```bash
# npm
npm install @almoxpro/licensing

# yarn
yarn add @almoxpro/licensing

# pnpm
pnpm add @almoxpro/licensing
```

## 🔧 Configuração Básica

```typescript
import { LicensingProvider } from '@almoxpro/licensing';

function App() {
  return (
    <LicensingProvider
      config={{
        api: {
          endpoint: 'https://api.almoxpro.com/v1',
          apiKey: process.env.LICENSING_API_KEY
        },
        database: {
          type: 'postgresql',
          connectionString: process.env.DATABASE_URL
        },
        plans: {
          basic: { monthly: 157, users: 5 },
          professional: { monthly: 319, users: 20 },
          enterprise: { monthly: 535, users: -1 }
        },
        validation: {
          onlineCheckInterval: 60,
          offlineGracePeriod: 7
        }
      }}
    >
      <YourApp />
    </LicensingProvider>
  );
}
```

## 🎯 Uso com Hooks

```typescript
import { useLicense } from '@almoxpro/licensing';

function ProtectedComponent() {
  const { 
    licenseInfo, 
    isLoading, 
    isValid, 
    plan, 
    daysRemaining,
    activateLicense 
  } = useLicense();

  if (isLoading) return <Loading />;
  if (!isValid) return <LicenseRequired />;

  return (
    <div>
      <h1>Bem-vindo!</h1>
      <p>Plano: {plan}</p>
      <p>Dias restantes: {daysRemaining}</p>
    </div>
  );
}
```

## 🎨 Componentes

### LicenseStatus
```typescript
import { LicenseStatus } from '@almoxpro/licensing';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <LicenseStatus />
    </div>
  );
}
```

### LicenseGuard
```typescript
import { LicenseGuard } from '@almoxpro/licensing';

function PremiumFeature() {
  return (
    <LicenseGuard requiredPlan="professional">
      <AdvancedReports />
    </LicenseGuard>
  );
}
```

### LicenseHeader
```typescript
import { LicenseHeader } from '@almoxpro/licensing';

function Layout() {
  return (
    <div>
      <LicenseHeader />
      <main>Your content</main>
    </div>
  );
}
```

## 🔧 Configuração Avançada

### Planos Customizados
```typescript
const customConfig = {
  plans: {
    starter: {
      monthly: 97,
      users: 3,
      materials: 500,
      features: ['basic_reports', 'email_support']
    },
    professional: {
      monthly: 319,
      users: 20,
      materials: 5000,
      features: ['advanced_reports', 'api_access', 'priority_support']
    },
    perpetual: {
      cloud: 2997,
      local: 3997,
      features: ['lifetime_access', 'source_code', 'priority_support']
    }
  }
};
```

### Segurança
```typescript
const securityConfig = {
  security: {
    encryptionKey: 'your-secret-key',
    hashAlgorithm: 'SHA-512',
    machineFingerprint: true
  },
  validation: {
    onlineCheckInterval: 30, // minutos
    offlineGracePeriod: 14, // dias
    maxMachines: 3
  }
};
```

## 🌐 API Reference

### Ativação de Licença
```typescript
// POST /api/v1/licenses/activate
{
  "key": "ALMX-XXXXX-XXXX",
  "machineId": "machine-fingerprint",
  "email": "user@example.com"
}
```

### Validação de Licença
```typescript
// POST /api/v1/licenses/validate
{
  "key": "ALMX-XXXXX-XXXX",
  "machineId": "machine-fingerprint"
}
```

### Estatísticas
```typescript
// GET /api/v1/licenses/stats
{
  "totalLicenses": 1250,
  "activeLicenses": 980,
  "revenue": {
    "monthly": 45000,
    "yearly": 540000
  }
}
```

## 🏗️ Arquitetura

```
📦 Estrutura do Módulo
├── src/
│   ├── components/     ← Componentes React
│   ├── hooks/         ← Hooks personalizados
│   ├── utils/         ← Utilitários principais
│   ├── types/         ← Tipos TypeScript
│   ├── config/        ← Configurações
│   └── api/          ← Cliente API
├── dist/             ← Build para publicação
├── tests/            ← Testes unitários
└── examples/         ← Exemplos de uso
```

## 🔧 Desenvolvimento

```bash
# Instalar dependências
npm install

# Desenvolvimento com watch
npm run dev

# Build para produção
npm run build

# Rodar testes
npm test

# Lint
npm run lint
```

## 📝 Exemplos

### [Exemplo Básico](./examples/basic/)
Configuração mínima para começar.

### [Exemplo Avançado](./examples/advanced/)
Configuração completa com todos os recursos.

### [Exemplo API](./examples/api/)
Servidor API standalone.

### [Exemplo Multi-tenant](./examples/multi-tenant/)
Sistema com múltiplas organizações.

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para o branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📧 Email: suporte@almoxpro.com
- 💬 Discord: [discord.gg/almoxpro](https://discord.gg/almoxpro)
- 📖 Docs: [docs.almoxpro.com](https://docs.almoxpro.com)

## 🔄 Versões

- v1.0.0 - Versão inicial estável
- v1.1.0 - Suporte a licenças perpétuas
- v1.2.0 - API REST completa
- v2.0.0 - Arquitetura microserviços

---

**Desenvolvido com ❤️ pela [AlmoxPro](https://almoxpro.com)**
