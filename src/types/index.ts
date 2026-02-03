export type {
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,
  SingleResponse,
  ApiErrorBody,
  Channel,
  NotificationStatus,
  TemplateStatus,
  Environment,
  ApiKeyType,
  RequestOptions,
} from './common.ts';

export type {
  SendNotificationParams,
  Notification,
  MessageAttempt,
  ListNotificationsParams,
} from './notifications.ts';

export type {
  CreateTemplateParams,
  UpdateTemplateParams,
  Template,
  PreviewTemplateParams,
  PreviewContentParams,
  PreviewResult,
  ValidateContentParams,
  ValidationResult,
  ListTemplatesParams,
} from './templates.ts';

export type {
  SendStep,
  DelayStep,
  FallbackStep,
  WorkflowStep,
  CreateWorkflowParams,
  UpdateWorkflowParams,
  Workflow,
  TriggerWorkflowParams,
  WorkflowRun,
  WorkflowRunStatus,
  StepResult,
  ListWorkflowsParams,
  ListWorkflowRunsParams,
} from './workflows.ts';

export type {
  CreateSubscriberParams,
  UpdateSubscriberParams,
  Subscriber,
  NotificationPreference,
  UpdatePreferencesParams,
  SubscriberPreferences,
  BulkImportParams,
  BulkImportResult,
  InAppNotification,
  ListInAppParams,
  UnreadCountResult,
  ListSubscribersParams,
} from './subscribers.ts';

export type {
  CreateChannelParams,
  UpdateChannelParams,
  ChannelConfiguration,
  TestChannelResult,
} from './channels.ts';

export type {
  CreateDomainParams,
  Domain,
  DomainStatus,
  DnsRecord,
  DomainHealth,
  DomainAlert,
  ListDomainsParams,
} from './domains.ts';

export type {
  CreateWebhookParams,
  UpdateWebhookParams,
  Webhook,
  WebhookDelivery,
  ListWebhooksParams,
  ListDeliveriesParams,
} from './webhooks.ts';

export type {
  CreateApiKeyParams,
  ApiKey,
} from './api-keys.ts';

export type {
  AnalyticsPeriod,
  Granularity,
  AnalyticsParams,
  TimeseriesParams,
  TopTemplatesParams,
  AnalyticsOverview,
  ChannelAnalytics,
  TimeseriesPoint,
  TemplateAnalytics,
} from './analytics.ts';
