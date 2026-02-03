import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, createTestClient, envelope, paginatedEnvelope } from '../helpers.ts';

let mock: ReturnType<typeof mockFetch> | undefined;
afterEach(() => { mock?.restore(); });

const SAMPLE_WORKFLOW = {
  id: 'wf-1', slug: 'welcome-flow', name: 'Welcome Flow',
  steps: [
    { type: 'send', channel: 'email', template: 'welcome' },
    { type: 'delay', duration: '1h' },
    { type: 'send', channel: 'whatsapp', template: 'welcome-wa' },
  ],
  version: 1, active: true, created_at: '', updated_at: '',
};

const SAMPLE_RUN = {
  id: 'run-1', workflow_id: 'wf-1', workflow_slug: 'welcome-flow',
  workflow_version: 1, status: 'running', recipient: '+5511999',
  created_at: '', updated_at: '',
};

describe('Workflows', () => {
  describe('create()', () => {
    it('POSTs to /workflows with step definitions', async () => {
      mock = mockFetch({ status: 201, body: envelope(SAMPLE_WORKFLOW) });
      const n = createTestClient();
      const result = await n.workflows.create({
        slug: 'welcome-flow',
        name: 'Welcome Flow',
        steps: [
          { type: 'send', channel: 'email', template: 'welcome' },
          { type: 'delay', duration: '1h' },
          { type: 'fallback', channels: ['whatsapp', 'sms'], template: 'fallback-tpl' },
        ],
      });
      assert.equal(result.id, 'wf-1');
      assert.equal(result.steps.length, 3);
      assert.equal(mock.lastRequest().method, 'POST');
      const body = mock.lastRequest().body as Record<string, unknown>;
      assert.equal((body.steps as unknown[]).length, 3);
    });
  });

  describe('list()', () => {
    it('GETs /workflows', async () => {
      mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_WORKFLOW]) });
      const n = createTestClient();
      const result = await n.workflows.list();
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].slug, 'welcome-flow');
    });
  });

  describe('get()', () => {
    it('GETs /workflows/:id', async () => {
      mock = mockFetch({ status: 200, body: envelope(SAMPLE_WORKFLOW) });
      const n = createTestClient();
      const result = await n.workflows.get('wf-1');
      assert.equal(result.id, 'wf-1');
      assert.ok(mock.lastUrl().pathname.endsWith('/workflows/wf-1'));
    });
  });

  describe('update()', () => {
    it('PUTs to /workflows/:id (creates new version)', async () => {
      mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_WORKFLOW, version: 2, name: 'Updated' }) });
      const n = createTestClient();
      const result = await n.workflows.update('wf-1', { name: 'Updated' });
      assert.equal(result.version, 2);
      assert.equal(mock.lastRequest().method, 'PUT');
    });
  });

  describe('delete()', () => {
    it('DELETEs /workflows/:id', async () => {
      mock = mockFetch({ status: 204 });
      const n = createTestClient();
      await n.workflows.delete('wf-1');
      assert.equal(mock.lastRequest().method, 'DELETE');
    });
  });

  describe('trigger()', () => {
    it('POSTs to /workflows/:slug/trigger', async () => {
      mock = mockFetch({ status: 202, body: envelope(SAMPLE_RUN) });
      const n = createTestClient();
      const result = await n.workflows.trigger('welcome-flow', {
        recipient: '+5511999999999',
        data: { name: 'João', plan: 'pro' },
      });
      assert.equal(result.id, 'run-1');
      assert.equal(result.status, 'running');
      assert.ok(mock.lastUrl().pathname.endsWith('/workflows/welcome-flow/trigger'));
      assert.deepEqual(mock.lastRequest().body, {
        recipient: '+5511999999999',
        data: { name: 'João', plan: 'pro' },
      });
    });
  });

  describe('listRuns()', () => {
    it('GETs /workflow-runs with filters', async () => {
      mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_RUN]) });
      const n = createTestClient();
      const result = await n.workflows.listRuns({ status: 'running' });
      assert.equal(result.data.length, 1);
      assert.equal(mock.lastUrl().searchParams.get('status'), 'running');
    });
  });

  describe('getRun()', () => {
    it('GETs /workflow-runs/:id with step results', async () => {
      const runWithSteps = {
        ...SAMPLE_RUN,
        step_results: [
          { step_index: 0, step_type: 'send', status: 'completed', executed_at: '' },
        ],
      };
      mock = mockFetch({ status: 200, body: envelope(runWithSteps) });
      const n = createTestClient();
      const result = await n.workflows.getRun('run-1');
      assert.equal(result.step_results!.length, 1);
      assert.equal(result.step_results![0].step_type, 'send');
    });
  });

  describe('cancelRun()', () => {
    it('POSTs to /workflow-runs/:id/cancel', async () => {
      mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_RUN, status: 'cancelled' }) });
      const n = createTestClient();
      const result = await n.workflows.cancelRun('run-1');
      assert.equal(result.status, 'cancelled');
      assert.ok(mock.lastUrl().pathname.endsWith('/workflow-runs/run-1/cancel'));
    });
  });

  describe('listAll()', () => {
    it('returns async iterator', async () => {
      mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_WORKFLOW], null, false) });
      const n = createTestClient();
      const items = [];
      for await (const wf of n.workflows.listAll()) { items.push(wf); }
      assert.equal(items.length, 1);
    });
  });
});
