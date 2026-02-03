<p align="center">
  <h1 align="center">@notifica/node</h1>
  <p align="center">SDK oficial do <a href="https://usenotifica.com.br">Notifica</a> para Node.js</p>
  <p align="center">Infraestrutura de notificações para o Brasil 🇧🇷</p>
</p>

<p align="center">
  <a href="https://github.com/notifica-tech/notifica-node/actions"><img src="https://github.com/notifica-tech/notifica-node/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@notifica/node"><img src="https://img.shields.io/npm/v/@notifica/node.svg" alt="npm"></a>
  <a href="https://github.com/notifica-tech/notifica-node/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@notifica/node.svg" alt="license"></a>
  <a href="https://www.npmjs.com/package/@notifica/node"><img src="https://img.shields.io/npm/dm/@notifica/node.svg" alt="downloads"></a>
</p>

---

WhatsApp, Email, SMS, Push e In-App em uma API unificada. Zero dependências. TypeScript nativo.

## Instalação

```bash
npm install @notifica/node
```

> Requer **Node.js 18+** (usa `fetch` nativo).

## Início Rápido

```typescript
import { Notifica } from '@notifica/node';

const notifica = new Notifica('nk_live_...');

// Enviar uma notificação via WhatsApp
const notification = await notifica.notifications.send({
  channel: 'whatsapp',
  to: '+5511999999999',
  template: 'welcome',
  data: { name: 'João' },
});

console.log(notification.id);     // 'notif-uuid'
console.log(notification.status); // 'pending'
```

## Configuração

```typescript
// Simples — apenas API key
const notifica = new Notifica('nk_live_...');

// Configuração completa
const notifica = new Notifica({
  apiKey: 'nk_live_...',
  baseUrl: 'https://api.usenotifica.com.br/v1', // padrão
  timeout: 15000,        // 15s (padrão: 30s)
  maxRetries: 5,         // padrão: 3
  autoIdempotency: true, // padrão: true
});
```

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `apiKey` | `string` | — | **Obrigatório.** Sua API key (`nk_live_...` ou `nk_test_...`) |
| `baseUrl` | `string` | `https://api.usenotifica.com.br/v1` | URL base da API |
| `timeout` | `number` | `30000` | Timeout em ms |
| `maxRetries` | `number` | `3` | Retentativas automáticas em 429/5xx |
| `autoIdempotency` | `boolean` | `true` | Gerar chave de idempotência automática para POSTs |

---

## Recursos

### Notifications — Envio e consulta

```typescript
// Enviar notificação
const notification = await notifica.notifications.send({
  channel: 'whatsapp',  // 'email' | 'whatsapp' | 'sms' | 'in_app' | 'push'
  to: '+5511999999999',
  template: 'welcome',
  data: { name: 'João' },
  metadata: { source: 'signup-flow' },
});

// Listar (com paginação manual)
const { data, meta } = await notifica.notifications.list({
  channel: 'email',
  status: 'delivered',
  limit: 50,
});
const page2 = await notifica.notifications.list({ cursor: meta.cursor });

// Auto-paginação com async iterator
for await (const n of notifica.notifications.listAll({ channel: 'email' })) {
  console.log(n.id, n.status);
}

// Detalhes + tentativas de entrega
const detail = await notifica.notifications.get('notif-uuid');
const attempts = await notifica.notifications.listAttempts('notif-uuid');
```

### Templates — Gerenciamento

```typescript
// Criar
const template = await notifica.templates.create({
  channel: 'email',
  slug: 'welcome-email',
  name: 'Email de Boas-Vindas',
  content: 'Olá {{name}}, bem-vindo ao {{company}}!',
  variants: {
    subject: 'Bem-vindo, {{name}}!',
    html_body: '<h1>Olá {{name}}</h1><p>Bem-vindo ao {{company}}!</p>',
  },
  status: 'active',
});

// Listar / obter / atualizar / deletar
const { data } = await notifica.templates.list({ channel: 'email' });
await notifica.templates.update('tpl-uuid', { status: 'active' });
await notifica.templates.delete('tpl-uuid');

// Preview com variáveis
const preview = await notifica.templates.preview('tpl-uuid', {
  variables: { name: 'João', company: 'Empresa Ltda' },
});
console.log(preview.rendered.subject); // "Bem-vindo, João!"

// Preview de conteúdo arbitrário (para editor em tempo real)
const livePreview = await notifica.templates.previewContent({
  content: 'Oi {{name}}!',
  channel: 'email',
  variables: { name: 'Maria' },
});

// Validar template
const validation = await notifica.templates.validate('tpl-uuid');
console.log(validation.valid, validation.warnings);
```

### Workflows — Orquestração

```typescript
// Criar workflow
const workflow = await notifica.workflows.create({
  slug: 'welcome-flow',
  name: 'Fluxo de Boas-Vindas',
  steps: [
    { type: 'send', channel: 'email', template: 'welcome-email' },
    { type: 'delay', duration: '1h' },
    { type: 'send', channel: 'whatsapp', template: 'welcome-whatsapp' },
  ],
});

// Disparar workflow
const run = await notifica.workflows.trigger('welcome-flow', {
  recipient: '+5511999999999',
  data: { name: 'João', plan: 'pro' },
});

// Gerenciar execuções
const { data: runs } = await notifica.workflows.listRuns({ status: 'running' });
const runDetail = await notifica.workflows.getRun('run-uuid');
await notifica.workflows.cancelRun('run-uuid');
```

**Tipos de step:**

| Tipo | Campos | Descrição |
|------|--------|-----------|
| `send` | `channel`, `template` | Envia notificação pelo canal |
| `delay` | `duration` (`5m`, `1h`, `1d`) | Pausa a execução |
| `fallback` | `channels[]`, `template` | Tenta canais em ordem até sucesso |

### Subscribers — Gerenciamento de destinatários

```typescript
// Criar/atualizar (upsert por external_id)
const subscriber = await notifica.subscribers.create({
  external_id: 'user-123',
  email: 'joao@empresa.com.br',
  phone: '+5511999998888',
  name: 'João Silva',
  locale: 'pt_BR',
  timezone: 'America/Sao_Paulo',
  custom_properties: { plan: 'pro' },
});

// Listar (com busca)
const { data } = await notifica.subscribers.list({ search: 'joao' });

// Atualizar / deletar (LGPD — nullifica PII, irreversível!)
await notifica.subscribers.update('sub-uuid', { name: 'João S.' });
await notifica.subscribers.delete('sub-uuid');

// Preferências de notificação
const prefs = await notifica.subscribers.getPreferences('sub-uuid');
await notifica.subscribers.updatePreferences('sub-uuid', {
  preferences: [
    { category: 'marketing', channel: 'email', enabled: false },
    { category: 'transactional', channel: 'whatsapp', enabled: true },
  ],
});

// Import em lote (transacional — tudo ou nada)
const result = await notifica.subscribers.bulkImport({
  subscribers: [
    { external_id: 'user-1', email: 'a@empresa.com.br', name: 'Ana' },
    { external_id: 'user-2', email: 'b@empresa.com.br', name: 'Bruno' },
  ],
});
```

**Notificações In-App:**

```typescript
const { data } = await notifica.subscribers.listNotifications('sub-uuid', { unread_only: true });
await notifica.subscribers.markRead('sub-uuid', 'notif-uuid');
await notifica.subscribers.markAllRead('sub-uuid');
const count = await notifica.subscribers.getUnreadCount('sub-uuid');
```

### Channels — Configuração de canais

```typescript
const channel = await notifica.channels.create({
  channel: 'email',
  provider: 'aws_ses',
  credentials: { access_key_id: 'AKIA...', secret_access_key: '...', region: 'us-east-1' },
  settings: { from_address: 'noreply@empresa.com.br', from_name: 'Empresa' },
});

const channels = await notifica.channels.list();
const test = await notifica.channels.test('email');
```

### Domains — Domínios de envio

```typescript
// Registrar domínio e configurar DNS
const domain = await notifica.domains.create({ domain: 'suaempresa.com.br' });
// → Configure os registros em domain.dns_records no seu provedor DNS

const verified = await notifica.domains.verify(domain.id);
const health = await notifica.domains.getHealth(domain.id);
const alerts = await notifica.domains.listAlerts();
```

### Webhooks — Eventos outbound

```typescript
const webhook = await notifica.webhooks.create({
  url: 'https://meuapp.com.br/webhooks/notifica',
  events: ['notification.delivered', 'notification.failed'],
});
// ⚠️ Salve webhook.signing_secret — mostrado apenas na criação!

await notifica.webhooks.test(webhook.id);
const deliveries = await notifica.webhooks.listDeliveries(webhook.id);
```

**Verificação de assinatura:**

```typescript
app.post('/webhooks/notifica', async (req, res) => {
  const payload = req.body;       // raw body string
  const signature = req.headers['x-notifica-signature'];
  const secret = process.env.WEBHOOK_SECRET!;

  const valid = await notifica.webhooks.verify(payload, signature, secret);
  if (!valid) return res.status(401).send('Assinatura inválida');

  // Processar evento...
  res.status(200).send('OK');
});

// Ou a versão que lança erro automaticamente:
await notifica.webhooks.verifyOrThrow(payload, signature, secret);
```

### API Keys — Gerenciamento de chaves

```typescript
const key = await notifica.apiKeys.create({
  key_type: 'secret',
  label: 'Backend Production',
  environment: 'production',
});
// ⚠️ Salve key.raw_key — mostrado apenas na criação!

const keys = await notifica.apiKeys.list();
await notifica.apiKeys.revoke('key-uuid');
```

### Analytics — Métricas

```typescript
const overview = await notifica.analytics.overview({ period: '7d' });
const channels = await notifica.analytics.byChannel({ period: '24h' });
const timeseries = await notifica.analytics.timeseries({ period: '7d', granularity: 'day' });
const top = await notifica.analytics.topTemplates({ period: '30d', limit: 5 });
```

---

## Tratamento de Erros

O SDK lança erros tipados para cada cenário:

```typescript
import {
  NotificaError,    // Erro base
  ApiError,         // Qualquer erro da API (4xx, 5xx)
  ValidationError,  // 422 — dados inválidos
  RateLimitError,   // 429 — rate limit excedido
  TimeoutError,     // Timeout de conexão
} from '@notifica/node';

try {
  await notifica.notifications.send({ channel: 'email', to: 'x' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.status);     // 422
    console.log(error.message);    // "Email inválido"
    console.log(error.details);    // { email: ["is invalid"] }
    console.log(error.requestId);  // "req-abc-123" (para suporte)
  }
  if (error instanceof RateLimitError) {
    console.log(error.retryAfter); // 30 (segundos)
  }
  if (error instanceof ApiError) {
    console.log(error.status, error.code);
  }
}
```

## Idempotência

O SDK gera automaticamente chaves de idempotência para todas as requests POST, prevenindo operações duplicadas em caso de retry de rede.

```typescript
// Automático (padrão)
await notifica.notifications.send({ channel: 'email', to: 'a@b.com' });

// Chave customizada (útil para deduplicação por lógica de negócio)
await notifica.notifications.send(
  { channel: 'email', to: 'a@b.com' },
  { idempotencyKey: 'signup-user-123' },
);
```

## Retries Automáticos

Retenta automaticamente em falhas transientes:

- **429** Too Many Requests — respeita header `Retry-After`
- **5xx** Server errors — backoff exponencial com jitter

```typescript
const notifica = new Notifica({
  apiKey: 'nk_live_...',
  maxRetries: 5, // padrão: 3
});
```

## Paginação

```typescript
// 1. Manual (cursor-based)
let cursor: string | undefined;
do {
  const page = await notifica.notifications.list({ cursor, limit: 100 });
  for (const n of page.data) { console.log(n.id); }
  cursor = page.meta.has_more ? page.meta.cursor ?? undefined : undefined;
} while (cursor);

// 2. Auto-paginação (async iterator)
for await (const n of notifica.notifications.listAll()) {
  console.log(n.id);
}
```

## Tipos TypeScript

Todos os tipos são exportados:

```typescript
import type {
  Notification,
  SendNotificationParams,
  Template,
  Workflow,
  WorkflowStep,
  Subscriber,
  Channel,
  NotificationStatus,
  PaginatedResponse,
} from '@notifica/node';
```

---

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Type check
npm run typecheck

# Rodar testes (requer Node 22+)
npm test

# Build
npm run build
```

## Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça fork do repositório
2. Crie sua branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

## Requisitos

- **Node.js 18+** (usa `fetch` nativo e `crypto.subtle`)
- **Zero dependências** externas

## Links

- [Documentação](https://docs.usenotifica.com.br)
- [API Reference](https://docs.usenotifica.com.br/api-reference)
- [Dashboard](https://app.usenotifica.com.br)
- [GitHub](https://github.com/notifica-tech/notifica-node)

## Licença

[MIT](./LICENSE) © [Notifica](https://usenotifica.com.br)
