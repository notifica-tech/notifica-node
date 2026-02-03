import type { NotificaClient } from '../client.js';
import type { RequestOptions } from '../types/common.js';
import type {
  AnalyticsOverview,
  AnalyticsParams,
  ChannelAnalytics,
  TemplateAnalytics,
  TimeseriesParams,
  TimeseriesPoint,
  TopTemplatesParams,
} from '../types/analytics.js';

export class Analytics {
  constructor(private readonly client: NotificaClient) {}

  /**
   * Métricas gerais (total enviado, entregue, falhas, taxa de entrega).
   *
   * @example
   * ```ts
   * const overview = await notifica.analytics.overview({ period: '7d' });
   * console.log(`Taxa de entrega: ${overview.delivery_rate}%`);
   * ```
   */
  async overview(params?: AnalyticsParams, options?: RequestOptions): Promise<AnalyticsOverview> {
    const response = await this.client.get<{ data: AnalyticsOverview }>(
      '/analytics/overview',
      params as Record<string, unknown>,
      options,
    );
    return response.data;
  }

  /**
   * Métricas por canal.
   */
  async byChannel(params?: AnalyticsParams, options?: RequestOptions): Promise<ChannelAnalytics[]> {
    const response = await this.client.get<{ data: ChannelAnalytics[] }>(
      '/analytics/channels',
      params as Record<string, unknown>,
      options,
    );
    return response.data;
  }

  /**
   * Série temporal de envios.
   */
  async timeseries(params?: TimeseriesParams, options?: RequestOptions): Promise<TimeseriesPoint[]> {
    const response = await this.client.get<{ data: TimeseriesPoint[] }>(
      '/analytics/timeseries',
      params as Record<string, unknown>,
      options,
    );
    return response.data;
  }

  /**
   * Templates mais utilizados.
   */
  async topTemplates(params?: TopTemplatesParams, options?: RequestOptions): Promise<TemplateAnalytics[]> {
    const response = await this.client.get<{ data: TemplateAnalytics[] }>(
      '/analytics/templates',
      params as Record<string, unknown>,
      options,
    );
    return response.data;
  }
}
