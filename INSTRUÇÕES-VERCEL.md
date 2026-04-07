# INSTRUÇÕES - CONFIGURAÇÃO VERCEL

## 1. COPIAR CREDENCIAIS SUPABASE

Acesse: https://supabase.com/dashboard
1. Selecione seu projeto
2. Settings > API
3. Copie:
   - Project URL: https://[project-id].supabase.co
   - anon public key: eyJhbGciOiJIUzI1NiIs...
   - JWT Secret: em JWT Secret section

## 2. CONFIGURAR ENVIRONMENT VARIABLES NO VERCEL

Acesse: https://vercel.com/dashboard
1. Selecione projeto almox-licensing
2. Settings > Environment Variables
3. Adicione:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-jwt-secret-here
```

## 3. FAZER DEPLOY

```bash
cd c:\Users\sdore\dyad-apps\almox-licensing
vercel --prod
```

## 4. TESTAR ENDPOINTS

Após deploy, teste:
- https://almox-licensing.vercel.app/api/validate-license
- https://almox-licensing.vercel.app/api/activate-license
- https://almox-licensing.vercel.app/api/check-payment
