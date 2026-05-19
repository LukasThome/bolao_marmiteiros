# Deploy — Bolão dos Marmiteiros

## Plataforma: Vercel

### Setup inicial (uma vez)

1. **Criar projeto no Vercel**
   - Importar repositório do GitHub
   - Framework: Next.js (detectado automaticamente)
   - Root directory: `/` (raiz do repo)

2. **Configurar variáveis de ambiente no painel da Vercel**

   | Variável | Ambiente |
   |----------|----------|
   | `DATABASE_URL` | Production + Preview |
   | `NEXTAUTH_SECRET` | Production + Preview |
   | `NEXTAUTH_URL` | Production (`https://bolao-dos-marmiteiros.vercel.app`) |
   | `GOOGLE_CLIENT_ID` | Production + Preview |
   | `GOOGLE_CLIENT_SECRET` | Production + Preview |

3. **Configurar `postinstall` no `package.json`** para gerar o Prisma Client no build:
   ```json
   "postinstall": "prisma generate"
   ```

4. **MongoDB Atlas**
   - Criar cluster (M0 Free Tier suficiente para início)
   - Criar usuário de banco com senha forte
   - Whitelist IP `0.0.0.0/0` (Vercel usa IPs dinâmicos)
   - Copiar connection string para `DATABASE_URL`

5. **Google OAuth**
   - Criar projeto no Google Cloud Console
   - Ativar Google+ API
   - Criar credenciais OAuth 2.0
   - Adicionar redirect URIs:
     - `https://bolao-dos-marmiteiros.vercel.app/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (para dev)

---

## Deploy automático

| Evento | Resultado |
|--------|-----------|
| Push para `main` | Deploy em produção |
| Push para `develop` | Deploy em preview |
| PR aberto | Deploy em preview único do PR |

---

## Comandos manuais

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy de preview
vercel

# Deploy de produção
vercel --prod

# Puxar variáveis de ambiente para .env.local
vercel env pull .env.local
```

---

## Banco de dados em produção

```bash
# Sincronizar schema (primeira vez ou após mudanças)
DATABASE_URL="<prod-url>" npx prisma db push

# Popular com dados iniciais (apenas uma vez)
DATABASE_URL="<prod-url>" npm run db:seed
```

> ⚠️ **Nunca rode `db:seed` em produção com dados reais já existentes.**

---

## Monitoramento

- **Logs de build:** Vercel Dashboard → Deployments → Build Logs
- **Logs de runtime:** Vercel Dashboard → Functions → Logs
- **Erros:** configurar Sentry (opcional, fase futura)
