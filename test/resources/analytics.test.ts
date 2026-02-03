import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, createTestClient, envelope } from '../helpers.ts';

let mock: ReturnType<typeof mockFetch> | undefined;
afterEach(() => { mock?.restore(); });

describe('Analytics', () => {
  describe('overview()', () => {
    it('GETs /analytics/overview with period', async () => {
      mock = mockFetch({
        status: 200,
        body: envelope({ total_sent: 1000, total_delivered: 950, total_failed: 50, delivery_rate: 95.0, period: '7d' }),
      });
      const n = createTestClient();
      const result = await n.analytics.overview({ period: '7d' });
      assert.equal(result.total_sent, 1000);
      assert.equal(result.delivery_rate, 95.0);
      assert.equal(mock.lastUrl().searchParams.get('period'), '7d');
    });

    it('works without params (defaults)', async () => {
      mock = mockFetch({
        status: 200,
        body: envelope({ total_sent: 100, total_delivered: 90, total_failed: 10, delivery_rate: 90.0, period: '24h' }),
      });
      const n = createTestClient();
      const result = await n.analytics.overview();
      assert.equal(result.total_sent, 100);
    });
  });

  describe('byChannel()', () => {
    it('GETs /analytics/channels', async () => {
      mock = mockFetch({
        status: 200,
        body: {
          data: [
            { channel: 'email', sent: 500, delivered: 480, failed: 20, delivery_rate: 96.0 },
            { channel: 'whatsapp', sent: 300, delivered: 290, failed: 10, delivery_rate: 96.7 },
          ],
        },
      });
      const n = createTestClient();
      const result = await n.analytics.byChannel({ period: '24h' });
      assert.equal(result.length, 2);
      assert.equal(result[0].channel, 'email');
      assert.equal(result[1].channel, 'whatsapp');
      assert.equal(mock.lastUrl().pathname, '/v1/analytics/channels');
    });
  });

  describe('timeseries()', () => {
    it('GETs /analytics/timeseries with granularity', async () => {
      mock = mockFetch({
        status: 200,
        body: {
          data: [
            { timestamp: '2025-01-01T00:00:00Z', sent: 100, delivered: 95, failed: 5 },
            { timestamp: '2025-01-02T00:00:00Z', sent: 120, delivered: 115, failed: 5 },
          ],
        },
      });
      const n = createTestClient();
      const result = await n.analytics.timeseries({ period: '7d', granularity: 'day' });
      assert.equal(result.length, 2);
      assert.equal(result[0].sent, 100);
      assert.equal(mock.lastUrl().searchParams.get('granularity'), 'day');
    });
  });

  describe('topTemplates()', () => {
    it('GETs /analytics/templates with limit', async () => {
      mock = mockFetch({
        status: 200,
        body: {
          data: [
            { template_id: 'tpl-1', template_name: 'Welcome', sent: 500, delivered: 490, delivery_rate: 98.0 },
          ],
        },
      });
      const n = createTestClient();
      const result = await n.analytics.topTemplates({ period: '30d', limit: 5 });
      assert.equal(result.length, 1);
      assert.equal(result[0].template_name, 'Welcome');
      assert.equal(mock.lastUrl().searchParams.get('limit'), '5');
      assert.equal(mock.lastUrl().pathname, '/v1/analytics/templates');
    });
  });
});
