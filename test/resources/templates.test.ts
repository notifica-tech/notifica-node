import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, createTestClient, envelope, paginatedEnvelope } from '../helpers.ts';

let mock: ReturnType<typeof mockFetch> | undefined;
afterEach(() => { mock?.restore(); });

const SAMPLE_TEMPLATE = {
  id: 'tpl-1', slug: 'welcome', name: 'Welcome', channel: 'email',
  content: 'Olá {{name}}', variables: ['name'], language: 'pt_BR',
  status: 'active', created_at: '', updated_at: '',
};

describe('Templates', () => {
  describe('create()', () => {
    it('POSTs to /templates and unwraps data', async () => {
      mock = mockFetch({ status: 201, body: envelope(SAMPLE_TEMPLATE) });
      const n = createTestClient();
      const result = await n.templates.create({
        channel: 'email',
        slug: 'welcome',
        name: 'Welcome',
        content: 'Olá {{name}}',
      });
      assert.equal(result.id, 'tpl-1');
      assert.equal(result.slug, 'welcome');
      assert.equal(mock.lastRequest().method, 'POST');
      assert.equal(mock.lastUrl().pathname, '/v1/templates');
    });

    it('sends all optional fields', async () => {
      mock = mockFetch({ status: 201, body: envelope(SAMPLE_TEMPLATE) });
      const n = createTestClient();
      await n.templates.create({
        channel: 'email', slug: 'welcome', name: 'Welcome', content: 'x',
        variables: ['name'], variants: { subject: 'Hi {{name}}' },
        language: 'pt_BR', status: 'active', metadata: { v: 1 },
        provider_template_id: 'ext-1',
      });
      const body = mock.lastRequest().body as Record<string, unknown>;
      assert.deepEqual(body.variables, ['name']);
      assert.deepEqual(body.variants, { subject: 'Hi {{name}}' });
      assert.equal(body.provider_template_id, 'ext-1');
    });
  });

  describe('list()', () => {
    it('GETs /templates with filters', async () => {
      mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_TEMPLATE]) });
      const n = createTestClient();
      const result = await n.templates.list({ channel: 'email', status: 'active' });
      assert.equal(result.data.length, 1);
      assert.equal(mock.lastUrl().searchParams.get('channel'), 'email');
      assert.equal(mock.lastUrl().searchParams.get('status'), 'active');
    });
  });

  describe('get()', () => {
    it('GETs /templates/:id', async () => {
      mock = mockFetch({ status: 200, body: envelope(SAMPLE_TEMPLATE) });
      const n = createTestClient();
      const result = await n.templates.get('tpl-1');
      assert.equal(result.id, 'tpl-1');
      assert.ok(mock.lastUrl().pathname.endsWith('/templates/tpl-1'));
    });
  });

  describe('update()', () => {
    it('PUTs to /templates/:id', async () => {
      mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_TEMPLATE, name: 'Updated' }) });
      const n = createTestClient();
      const result = await n.templates.update('tpl-1', { name: 'Updated', status: 'active' });
      assert.equal(result.name, 'Updated');
      assert.equal(mock.lastRequest().method, 'PUT');
      assert.deepEqual(mock.lastRequest().body, { name: 'Updated', status: 'active' });
    });
  });

  describe('delete()', () => {
    it('DELETEs /templates/:id', async () => {
      mock = mockFetch({ status: 204 });
      const n = createTestClient();
      await n.templates.delete('tpl-1');
      assert.equal(mock.lastRequest().method, 'DELETE');
      assert.ok(mock.lastUrl().pathname.endsWith('/templates/tpl-1'));
    });
  });

  describe('preview()', () => {
    it('POSTs to /templates/:id/preview with variables', async () => {
      mock = mockFetch({
        status: 200,
        body: envelope({
          rendered: { body: 'Olá João', subject: 'Bem-vindo, João!' },
          variables: ['name'],
          validation: { valid: true, errors: [], warnings: [] },
        }),
      });
      const n = createTestClient();
      const result = await n.templates.preview('tpl-1', { variables: { name: 'João' } });
      assert.equal(result.rendered.body, 'Olá João');
      assert.equal(result.validation.valid, true);
      assert.ok(mock.lastUrl().pathname.endsWith('/templates/tpl-1/preview'));
    });
  });

  describe('previewContent()', () => {
    it('POSTs to /templates/preview with arbitrary content', async () => {
      mock = mockFetch({
        status: 200,
        body: envelope({
          rendered: { body: 'Oi Maria!' },
          variables: ['name'],
          validation: { valid: true, errors: [], warnings: [] },
        }),
      });
      const n = createTestClient();
      const result = await n.templates.previewContent({
        content: 'Oi {{name}}!', channel: 'email', variables: { name: 'Maria' },
      });
      assert.equal(result.rendered.body, 'Oi Maria!');
      assert.equal(mock.lastUrl().pathname, '/v1/templates/preview');
    });
  });

  describe('validate()', () => {
    it('POSTs to /templates/:id/validate', async () => {
      mock = mockFetch({
        status: 200,
        body: envelope({ valid: true, errors: [], warnings: ['Add a subject'], variables: ['name'] }),
      });
      const n = createTestClient();
      const result = await n.templates.validate('tpl-1');
      assert.equal(result.valid, true);
      assert.equal(result.warnings.length, 1);
      assert.ok(mock.lastUrl().pathname.endsWith('/templates/tpl-1/validate'));
    });
  });

  describe('validateContent()', () => {
    it('POSTs to /templates/validate with arbitrary content', async () => {
      mock = mockFetch({
        status: 200,
        body: envelope({ valid: false, errors: ['Missing body'], warnings: [], variables: [] }),
      });
      const n = createTestClient();
      const result = await n.templates.validateContent({ content: '', channel: 'email' });
      assert.equal(result.valid, false);
      assert.equal(result.errors.length, 1);
      assert.equal(mock.lastUrl().pathname, '/v1/templates/validate');
    });
  });

  describe('listAll()', () => {
    it('returns async iterator', async () => {
      mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_TEMPLATE], null, false) });
      const n = createTestClient();
      const items = [];
      for await (const tpl of n.templates.listAll()) { items.push(tpl); }
      assert.equal(items.length, 1);
    });
  });
});
