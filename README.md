# Beauty Agenda 2026

Micro SaaS para agendamento e gerenciamento de salões de beleza e estética 2026.

## 🚀 Stack

- **Frontend**: React.js + Vite + Tailwind CSS
- **Backend**: Node.js + Express (Serverless na Vercel)
- **Banco de Dados**: PostgreSQL (Supabase)
- **Email**: Nodemailer (SMTP/SendGrid)
- **Deploy**: Vercel (Frontend + API) + Supabase

## 📁 Estrutura

```
beauty-schedule-saas/
├── frontend/          # React SPA (cliente + painel admin)
├── api/               # API Express (serverless functions)
├── supabase/          # Migrations SQL
└── vercel.json        # Configuração de deploy
```

## 🛠️ Setup Local

1. **Clone e instale dependências:**
```bash
git clone https://github.com/joaocarlostuc75/beauty-schedule-saas.git
cd beauty-schedule-saas
npm install
cd frontend && npm install
cd ../api && npm install
```

2. **Configure as variáveis de ambiente:**

Crie `.env` em `frontend/`:
```env
VITE_API_URL=http://localhost:3001/api
```

Crie `.env` em `api/`:
```env
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_KEY=sua_service_key
JWT_SECRET=chave_secreta_jwt_minimo_32_caracteres
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email
SMTP_PASS=sua_senha_app
```

3. **Execute as migrations no Supabase:**
- Acesse o SQL Editor do seu projeto Supabase
- Execute o conteúdo de `supabase/migrations/001_initial_schema.sql`

4. **Inicie o ambiente de desenvolvimento:**
```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - API
cd api
npm run dev
```

## 🌐 Deploy

### Vercel
1. Conecte seu repositório GitHub na Vercel
2. Configure as variáveis de ambiente no dashboard
3. Deploy automático a cada push

### Supabase
1. Crie um novo projeto em [supabase.com](https://supabase.com)
2. Execute as migrations SQL
3. Configure Storage bucket `logos` para upload de imagens

## 📱 Funcionalidades

### Público (Clientes)
- Splash Screen com logo do salão
- Agendamento online com seleção de serviços
- Escolha de data/horário com verificação de disponibilidade
- Confirmação por email
- Cancelamento/remarcação via link único

### Painel Admin
- Dashboard com métricas e gráficos
- Agenda interativa (calendário)
- CRUD de serviços, clientes e agendamentos
- Envio manual de notificações por email
- Relatórios de receita e agendamentos
- Controle de acesso (ADMIN/STAFF)
- Bloqueio de datas (férias/indisponibilidade)

## 🔒 Segurança

- Autenticação JWT
- Criptografia de senhas (bcrypt)
- Row Level Security (RLS) no Supabase
- Proteção contra brute-force
- Conformidade LGPD

## 📝 Licença

MIT