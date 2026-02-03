export type AnalyticsPeriod = '1h' | '24h' | '7d' | '30d';
export type Granularity = 'hour' | 'day';

// ── Params ──────────────────────────────────────────

export interface AnalyticsParams {
  period?: AnalyticsPeriod;
}

export interface TimeseriesParams extends AnalyticsParams {
  granularity?: Granularity;
}

export interface TopTemplatesParams extends AnalyticsParams {
  limit?: number;
}

// ── Response objects ────────────────────────────────

export interface AnalyticsOverview {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  delivery_rate: number;
  period: AnalyticsPeriod;
}

export interface ChannelAnalytics {
  channel: string;
  sent: number;
  delivered: number;
  failed: number;
  delivery_rate: number;
}

export interface TimeseriesPoint {
  timestamp: string;
  sent: number;
  delivered: number;
  failed: number;
}

export interface TemplateAnalytics {
  template_id: string;
  template_name: string;
  sent: number;
  delivered: number;
  delivery_rate: number;
}
