import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, createTestClient, envelope } from '../helpers.ts';

let mock: ReturnType<typeof mockFetch> | undefined;
afterEach(() => { mock?.restore(); });

describe('ApiKeys', () => {
  describe('create()', () => {
    it('POSTs to /api-keys and returns raw_key', async () => {
      mock = mockFetch({
        status: 201,
        body: envelope({
          id: 'key-1', key_type: 'secret', label: 'Backend Production',
          prefix: 'nk_live_', environment: 'production',
          raw_key: 'nk_live_aBcDeFgHiJkLmNoPqRsT', created_at: '',
        }),
      });
      const n = createTestClient();
      const result = await n.apiKeys.create({
        key_type: 'secret',
        label: 'Backend Production',
        environment: 'production',
      });
      assert.equal(result.id, 'key-1');
      assert.equal(result.raw_key, 'nk_live_aBcDeFgHiJkLmNoPqRsT');
      assert.equal(result.key_type, 'secret');
      assert.equal(mock.lastUrl().pathname, '/v1/api-keys');
      assert.equal(mock.lastRequest().method, 'POST');
    });
  });

  describe('list()', () => {
    it('GETs /api-keys without raw_key', async () => {
      mock = mockFetch({
        status: 200,
        body: {
          data: [
            { id: 'key-1', key_type: 'secret', label: 'Backend', prefix: 'nk_live_', environment: 'production', created_at: '' },
            { id: 'key-2', key_type: 'public', label: 'Frontend', prefix: 'pk_live_', environment: 'production', created_at: '' },
          ],
        },
      });
      const n = createTestClient();
      const keys = await n.apiKeys.list();
      assert.equal(keys.length, 2);
      assert.equal(keys[0].raw_key, undefined, 'raw_key should not be returned on list');
      assert.equal(keys[1].key_type, 'public');
    });
  });

  describe('revoke()', () => {
    it('DELETEs /api-keys/:id', async () => {
      mock = mockFetch({ status: 204 });
      const n = createTestClient();
      await n.apiKeys.revoke('key-1');
      assert.equal(mock.lastRequest().method, 'DELETE');
      assert.ok(mock.lastUrl().pathname.endsWith('/api-keys/key-1'));
    });
  });
});
