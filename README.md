# @notifica/node

SDK oficial do Notifica para Node.js — infraestrutura de notificações para o Brasil.

WhatsApp, Email, SMS, Push e In-App em uma API unificada.

## Instalação

```bash
npm install @notifica/node
```

> Requer **Node.js 18+** (usa `fetch` nativo).

## Início Rápido

```typescript
import { Notifica } from '@notifica/node';

const notifica = new Notifica('nk_live_...');

// Enviar uma notificação
const notification = await notifica.notifications.send({
  channel: 'whatsapp',
  to: '+5511999999999',
  template: 'welcome',
  data: { name: 'João' },
});

console.log(notification.id); // 'notif-uuid'
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
  timeout: 15000,     // 15s (padrão: 30s)
  maxRetries: 5,      // padrão: 3
  autoIdempotency: true, // padrão: true
});
```

### Opções

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `apiKey` | `string` | — | **Obrigatório.** Sua API key (`nk_live_...` ou `nk_test_...`) |
| `baseUrl` | `string` | `https://api.usenotifica.com.br/v1` | URL base da API |
| `timeout` | `number` | `30000` | Timeout em ms |
| `maxRetries` | `number` | `3` | Retentativas em 429/5xx |
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

// Listar notificações (com paginação)
const { data, meta } = await notifica.notifications.list({
  channel: 'email',
  status: 'delivered',
  limit: 50,
});

// Próxima página
const page2 = await notifica.notifications.list({ cursor: meta.cursor });

// Auto-paginação com async iterator
for await (const n of notifica.notifications.listAll({ channel: 'email' })) {
  console.log(n.id, n.status);
}

// Detalhes de uma notificação
const n = await notifica.notifications.get('notif-uuid');

// Tentativas de entrega
const attempts = await notifica.notifications.listAttempts('notif-uuid');
```

### Templates — Gerenciamento

```typescript
// Criar template
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

// Listar
const { data } = await notifica.templates.list({ channel: 'email' });

// Atualizar
await notifica.templates.update('tpl-uuid', { status: 'active' });

// Preview com variáveis
const preview = await notifica.templates.preview('tpl-uuid', {
  variables: { name: 'João', company: 'Empresa Ltda' },
});
console.log(preview.rendered.subject); // "Bem-vindo, João!"

// Preview de conteúdo arbitrário (editor em tempo real)
const livePreview = await notifica.templates.previewContent({
  content: 'Oi {{name}}!',
  channel: 'email',
  variables: { name: 'Maria' },
});

// Validar template
const validation = await notifica.templates.validate('tpl-uuid');
console.log(validation.valid); // true

// Deletar
await notifica.templates.delete('tpl-uuid');
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

// Listar execuções
const { data: runs } = await notifica.workflows.listRuns({
  workflow_id: workflow.id,
  status: 'running',
});

// Detalhes da execução (com step_results)
const runDetail = await notifica.workflows.getRun('run-uuid');

// Cancelar execução
await notifica.workflows.cancelRun('run-uuid');
```

#### Tipos de step

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

// Atualizar
await notifica.subscribers.update('sub-uuid', { name: 'João S.' });

// Deletar (LGPD — nullifica PII, irreversível)
await notifica.subscribers.delete('sub-uuid');

// Preferências
const prefs = await notifica.subscribers.getPreferences('sub-uuid');
await notifica.subscribers.updatePreferences('sub-uuid', {
  preferences: [
    { category: 'marketing', channel: 'email', enabled: false },
    { category: 'transactional', channel: 'whatsapp', enabled: true },
  ],
});

// Import em lote (transacional)
const result = await notifica.subscribers.bulkImport({
  subscribers: [
    { external_id: 'user-1', email: 'a@empresa.com.br', name: 'Ana' },
    { external_id: 'user-2', email: 'b@empresa.com.br', name: 'Bruno' },
  ],
});
console.log(result.imported); // 2
```

#### Notificações In-App

```typescript
// Listar notificações in-app
const { data } = await notifica.subscribers.listNotifications('sub-uuid', {
  unread_only: true,
});

// Marcar como lida
await notifica.subscribers.markRead('sub-uuid', 'notif-uuid');

// Marcar todas como lidas
await notifica.subscribers.markAllRead('sub-uuid');

// Contagem de não lidas
const count = await notifica.subscribers.getUnreadCount('sub-uuid');
```

### Channels — Configuração de canais

```typescript
// Configurar canal
const channel = await notifica.channels.create({
  channel: 'email',
  provider: 'aws_ses',
  credentials: {
    access_key_id: 'AKIA...',
    secret_access_key: '...',
    region: 'us-east-1',
  },
  settings: {
    from_address: 'noreply@empresa.com.br',
    from_name: 'Empresa',
  },
});

// Listar configurações
const channels = await notifica.channels.list();

// Testar canal
const test = await notifica.channels.test('email');
console.log(test.success); // true
```

### Domains — Domínios de envio

```typescript
// Registrar domínio
const domain = await notifica.domains.create({ domain: 'suaempresa.com.br' });
// Configure os registros DNS retornados em domain.dns_records

// Verificar DNS
const verified = await notifica.domains.verify(domain.id);
console.log(verified.status); // 'verified'

// Saúde do domínio
const health = await notifica.domains.getHealth(domain.id);
console.log(health.dns_valid, health.dkim_valid, health.spf_valid);

// Alertas
const alerts = await notifica.domains.listAlerts();
```

### Webhooks — Eventos outbound

```typescript
// Criar webhook
const webhook = await notifica.webhooks.create({
  url: 'https://meuapp.com.br/webhooks/notifica',
  events: ['notification.delivered', 'notification.failed'],
});
// ⚠️ Salve webhook.signing_secret — mostrado apenas na criação!

// Testar webhook
await notifica.webhooks.test(webhook.id);

// Listar entregas
const deliveries = await notifica.webhooks.listDeliveries(webhook.id);
```

#### Verificação de assinatura

```typescript
// No seu endpoint de webhook:
app.post('/webhooks/notifica', async (req, res) => {
  const payload = req.body;       // raw body string
  const signature = req.headers['x-notifica-signature'];
  const secret = process.env.WEBHOOK_SECRET!;

  const valid = await notifica.webhooks.verify(payload, signature, secret);
  if (!valid) {
    return res.status(401).send('Assinatura inválida');
  }

  // Processar evento...
  res.status(200).send('OK');
});

// Ou versão que lança erro:
await notifica.webhooks.verifyOrThrow(payload, signature, secret);
```

### API Keys — Gerenciamento de chaves

```typescript
// Criar API key
const key = await notifica.apiKeys.create({
  key_type: 'secret',
  label: 'Backend Production',
  environment: 'production',
});
// ⚠️ Salve key.raw_key — mostrado apenas na criação!

// Listar chaves (sem raw_key)
const keys = await notifica.apiKeys.list();

// Revogar chave
await notifica.apiKeys.revoke('key-uuid');
```

### Analytics — Métricas

```typescript
// Overview
const overview = await notifica.analytics.overview({ period: '7d' });
console.log(`Taxa de entrega: ${overview.delivery_rate}%`);

// Por canal
const channels = await notifica.analytics.byChannel({ period: '24h' });

// Série temporal
const timeseries = await notifica.analytics.timeseries({
  period: '7d',
  granularity: 'day',
});

// Top templates
const top = await notifica.analytics.topTemplates({ period: '30d', limit: 5 });
```

---

## Tratamento de Erros

O SDK lança erros tipados para diferentes cenários:

```typescript
import {
  NotificaError,    // Erro base
  ApiError,         // Qualquer erro da API
  ValidationError,  // 422 — dados inválidos
  RateLimitError,   // 429 — rate limit excedido
  TimeoutError,     // Timeout de conexão
} from '@notifica/node';

try {
  await notifica.notifications.send({ ... });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.status);     // 422
    console.log(error.message);    // "Invalid email"
    console.log(error.details);    // { email: ["is invalid"] }
    console.log(error.requestId);  // "req-abc-123"
  }

  if (error instanceof RateLimitError) {
    console.log(error.retryAfter); // 30 (segundos)
  }

  if (error instanceof TimeoutError) {
    console.log(error.message); // "Request timed out after 30000ms"
  }

  if (error instanceof ApiError) {
    console.log(error.status);     // HTTP status code
    console.log(error.code);       // "not_found", "unauthorized", etc.
    console.log(error.requestId);  // ID para suporte
  }
}
```

## Idempotência

O SDK gera automaticamente chaves de idempotência para todas as requests POST. Isso previne operações duplicadas em caso de retry.

```typescript
// Automático (padrão)
await notifica.notifications.send({ ... });

// Chave customizada
await notifica.notifications.send(
  { channel: 'email', to: 'a@b.com' },
  { idempotencyKey: 'signup-user-123' },
);

// Desabilitar auto-idempotência
const notifica = new Notifica({
  apiKey: 'nk_live_...',
  autoIdempotency: false,
});
```

## Retries Automáticos

O SDK retenta automaticamente em:
- **429** Too Many Requests — respeita header `Retry-After`
- **5xx** Server errors — backoff exponencial (500ms, 1s, 2s + jitter)

```typescript
const notifica = new Notifica({
  apiKey: 'nk_live_...',
  maxRetries: 5,  // padrão: 3
});
```

## Paginação

Duas formas de paginar:

```typescript
// 1. Manual (cursor-based)
let cursor: string | undefined;
do {
  const page = await notifica.notifications.list({ cursor, limit: 100 });
  for (const n of page.data) {
    console.log(n.id);
  }
  cursor = page.meta.has_more ? page.meta.cursor ?? undefined : undefined;
} while (cursor);

// 2. Auto-paginação (async iterator)
for await (const n of notifica.notifications.listAll()) {
  console.log(n.id);
}
```

## Tipos TypeScript

Todos os tipos são exportados para uso direto:

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
} from '@notifica/node';
```

## Requisitos

- **Node.js 18+** (usa `fetch` nativo e `crypto.subtle`)
- **Zero dependências** externas

## Links

- [Documentação](https://docs.usenotifica.com.br)
- [API Reference](https://docs.usenotifica.com.br/api-reference)
- [Dashboard](https://app.usenotifica.com.br)

## Licença

MIT
