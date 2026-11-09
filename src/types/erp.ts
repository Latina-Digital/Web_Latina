export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type CompanyBrand = 'industrial_latina' | 'induless';

export type ProductCalculatorType =
  | 'pintura'
  | 'empaste_mortero'
  | 'porcelana'
  | 'techo_losa'
  | 'conductor_electrico'
  | 'iluminacion_led'
  | 'malla_alambre'
  | 'unidad_fija';

export type OrderStatus = 'pendiente' | 'procesando' | 'enviado' | 'entregado' | 'cancelado';
export type PaymentStatus = 'pendiente' | 'pagado' | 'reembolsado';
export type PaymentMethod =
  | 'tarjeta_corporativa'
  | 'tarjeta_credito_ecuador'
  | 'tarjeta_debito_ecuador'
  | 'transferencia_spei'
  | 'credito_30d';

export type EcuadorianBank =
  | 'banco_pichincha'
  | 'banco_guayaquil'
  | 'produbanco'
  | 'banco_pacifico'
  | 'banco_bolivariano'
  | 'banco_internacional'
  | 'banco_del_austro'
  | 'cooperativa_jep'
  | 'cooperativa_29_octubre'
  | 'cooperativa_alianza_valle'
  | 'mutualista_pichincha'
  | 'payphone_ecuador'
  | 'datafast_kushki';

export interface DeliveryGpsLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  deliveryReference?: string;
  formattedAddress?: string;
  cityEcuador?: string;
  capturedAt?: string;
}

export type EcuadorFestiveThemeId =
  | 'corporativo'
  | 'guayaquil'
  | 'quito'
  | 'carnaval'
  | 'difuntos'
  | 'cuenca'
  | 'navidad'
  | 'patrias'
  | 'halloween'
  | 'black_friday';

export type StorefrontSectionId =
  | 'inicio'
  | 'productos'
  | 'calculadora'
  | 'disenador'
  | 'rastreo'
  | 'distribuidores'
  | 'institucional'
  | 'blogs'
  | 'tendencias'
  | 'laboratorio_ia'
  | 'juego_3d';

export type StorefrontSectionsVisibilityMap = Record<StorefrontSectionId, boolean>;

export interface DiscountCoupon {
  id: string;
  code: string;
  discountPct: number;
  discountFixedUsd?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  onlyNewClients: boolean;
  minPurchaseUsd: number;
  expiresAt: string;
  description: string;
  active: boolean;
  themeAffinity?: EcuadorFestiveThemeId;
}

export interface FlashFlyerPromo {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  sku: string;
  productName: string;
  originalPrice: number;
  promotionalPrice: number;
  discountPct: number;
  countdownEndsAt: string;
  bannerGradient: string;
  activeTheme: EcuadorFestiveThemeId;
  imageUrl?: string;
  active: boolean;
}

export interface DistributorApplication {
  id: string;
  contactName: string;
  companyName: string;
  clientNit: string; // RUC o Cédula
  establishmentType: string;
  cityProvince: string;
  address: string;
  phoneWhatsapp: string;
  email: string;
  estimatedMonthlyPurchase: string;
  notes?: string;
  status: 'pendiente' | 'contactado' | 'aprobado' | 'archivado';
  createdAt: string;
}

export interface CompanySocialNetworks {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  whatsapp: string;
}

export interface CompanySettings {
  officialContactEmail: string;
  officialNotificationWhatsapp: string;
  distributorsInboxEmail: string;
  distributorsWhatsapp: string;
  socialNetworks: CompanySocialNetworks;
  activeFestiveTheme: EcuadorFestiveThemeId;
}

export interface CompanyBlogEvent {
  id: string;
  title: string;
  category: 'eventos_clientes' | 'festividades_internas' | 'innovacion_tecnica';
  date: string;
  location: string;
  author: string;
  readTime: string;
  imageUrl: string;
  summary: string;
  content: string;
  highlights: string[];
  attendeesCount?: string;
  isPublished: boolean;
}

export type InvoiceStatus = 'emitida' | 'pagada' | 'anulada';
export type ShipmentStatus =
  | 'preparacion'
  | 'control_calidad'
  | 'en_transito'
  | 'centro_distribucion'
  | 'entregado';
export type NotificationChannel = 'whatsapp' | 'email' | 'sistema_critico';
export type NotificationSeverity = 'info' | 'alerta' | 'critica';
export type UserRole = 'admin' | 'finanzas' | 'logistica' | 'operador' | 'cliente';

export interface ProductTechnicalSheet {
  catalogCode: string;
  normative: string;
  presentationOptions: string[];
  yieldOrCoverage: string;
  dilutionOrMix: string;
  masterPack: string;
  applicationSurface: string;
  recommendedSurfaces?: string[];
  highlights: string[];
  googleDriveUrl?: string;
}

export interface Order {
  id: string;
  orderCode: string;
  clientName: string;
  clientNit: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  digitalSellerCode?: string;
  company?: CompanyBrand | 'mixto';
  cityEcuador?: string;
  clientEmail?: string;
  clientWhatsapp?: string;
  deliveryGps?: DeliveryGpsLocation;
  ecuadorBank?: EcuadorianBank | string;
  cardType?: 'credito' | 'debito';
  cardBrand?: string;
  deferredMonths?: number;
  cardLast4?: string;
  couponCodeApplied?: string;
  couponDiscountUsd?: number;
  paymentLinkUrl?: string;
  preOrderCode?: string;
  deliveryWindowHours?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPresentationPrice {
  name: string;
  unitPrice: number;
  skuSuffix?: string;
  description?: string;
  imageUrl?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  unit: string;
  company?: CompanyBrand;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  presentations?: ProductPresentationPrice[];
  calculatorType?: ProductCalculatorType;
  coverageSqmPerUnit?: number;
  linearMetersPerUnit?: number;
  recommendedEnvironments?: string[];
  technicalSheet?: ProductTechnicalSheet;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderCode: string;
  clientName: string;
  clientNit: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  digitalSignature: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentCheckpoint {
  stage: ShipmentStatus;
  label: string;
  location: string;
  timestamp: string;
  completed: boolean;
}

export interface Shipment {
  id: string;
  trackingCode: string;
  orderCode: string;
  clientName: string;
  origin: string;
  destination: string;
  carrier: string;
  status: ShipmentStatus;
  progress: number;
  estimatedDelivery: string;
  deliveryGps?: DeliveryGpsLocation;
  clientEmail?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  channel: NotificationChannel;
  recipientName: string;
  recipientTarget: string;
  subject: string;
  message: string;
  severity: NotificationSeverity;
  status: 'enviado' | 'entregado' | 'fallido';
  ownerId: string;
  createdAt: string;
}

export interface NotificationRule {
  id: string;
  eventLabel: string;
  description: string;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  criticalPushEnabled: boolean;
}

export interface UserProfile {
  id: string;
  displayName: string;
  department: string;
  role: UserRole;
  email: string;
  phone: string;
  twoFactorEnabled: boolean;
  e2eeKeyFingerprint: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThirdPartyIntegration {
  id: string;
  name: string;
  category: 'finanzas_api' | 'cloud_storage' | 'mensajeria';
  endpoint: string;
  status: 'conectado' | 'sincronizando' | 'requiere_revision';
  lastSync: string;
  e2eeActive: boolean;
  syncedRecords: number;
}

export interface SupportTicket {
  id: string;
  ticketCode: string;
  subject: string;
  priority: 'P1 - Crítica (SLA 15 min)' | 'P2 - Alta (SLA 1h)' | 'P3 - Normal (SLA 4h)';
  assignedEngineer: string;
  status: 'en_atencion' | 'resuelto';
  createdAt: string;
}

export interface PredictiveSkuForecast {
  sku: string;
  productName: string;
  predictedDemandUnits: number;
  recommendedReorderUnits: number;
  stockoutRiskDays: number;
  actionPriority: string;
}

export interface PredictiveAnalyticsResult {
  source: string;
  generatedAt: string;
  horizonDays: number;
  executiveSummary: string;
  projectedRevenueGrowthPct: number;
  projectedRevenueUsd: number;
  supplyChainRiskLevel: string;
  skuForecasts: PredictiveSkuForecast[];
  strategicRecommendations: {
    title: string;
    impactMetric: string;
    detail: string;
  }[];
}

export type InternalConnectionProtocol =
  | 'REST_JSON'
  | 'GRAPHQL'
  | 'SQL_BRIDGE'
  | 'SOAP_XML'
  | 'WEBSOCKET'
  | 'SFTP_BATCH';

export type InternalConnectionEnvironment =
  | 'produccion'
  | 'staging'
  | 'desarrollo_local'
  | 'tunel_vpn';

export type InternalAuthMethod =
  | 'api_key_secret'
  | 'bearer_jwt'
  | 'basic_auth'
  | 'oauth2_client_credentials'
  | 'mtls_cert';

export type InternalSyncDirection = 'bidireccional' | 'importar_al_erp' | 'exportar_a_interno';

export type InternalSyncSchedule =
  | 'tiempo_real_webhook'
  | 'cada_5_min'
  | 'cada_15_min'
  | 'cada_hora'
  | 'manual';

export interface InternalSystemConnection {
  id: string;
  name: string;
  systemBrand: string; // e.g. 'SAP Business One', 'SQL Server On-Premise', 'Oracle NetSuite', 'Sistema Propio Fenix'
  environment: InternalConnectionEnvironment;
  protocol: InternalConnectionProtocol;
  hostEndpoint: string;
  port: number;
  databaseOrSchema: string;
  authMethod: InternalAuthMethod;
  authIdentifier: string; // API Key / Username / Client ID
  authSecretMasked: string;
  customHeadersJson: string;
  syncDirection: InternalSyncDirection;
  syncSchedule: InternalSyncSchedule;
  timeoutMs: number;
  maxRetries: number;
  sslVerify: boolean;
  freeWillOverrideEnabled: boolean; // Permite sobreescritura total sin restricciones desde el ERP
  syncedEntities: ('inventario' | 'pedidos' | 'facturacion' | 'envios' | 'usuarios')[];
  status: 'conectado' | 'pausado' | 'error_handshake';
  lastPingMs: number;
  lastSyncAt: string;
  totalSyncedRecords: number;
}

export interface InternalFieldMapping {
  id: string;
  connectionId: string;
  entity: 'inventario' | 'pedidos' | 'facturacion' | 'envios' | 'clientes';
  internalField: string;
  erpField: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'json';
  transformRule:
    | 'DIRECT'
    | 'UPPERCASE'
    | 'TRIM'
    | 'NUMBER_ROUND_2'
    | 'MULTIPLY_IVA_15'
    | 'DEFAULT_ZERO'
    | 'CUSTOM_EXPRESSION';
  customExpression?: string;
  active: boolean;
}

export interface InternalWebhookConfig {
  id: string;
  eventTrigger:
    | 'order.created'
    | 'inventory.updated'
    | 'inventory.low_stock'
    | 'invoice.authorized'
    | 'shipment.status_changed'
    | 'custom.free_will_event';
  targetUrl: string;
  httpMethod: 'POST' | 'PUT';
  hmacSecret: string;
  active: boolean;
  lastTriggeredAt: string;
  lastStatusCode: number;
}

export interface InternalSyncLog {
  id: string;
  timestamp: string;
  connectionName: string;
  operation: 'PING_HANDSHAKE' | 'PULL_IMPORT' | 'PUSH_EXPORT' | 'CUSTOM_QUERY' | 'BULK_OVERRIDE' | 'WEBHOOK_DISPATCH';
  entity: string;
  recordsAffected: number;
  latencyMs: number;
  statusCode: number;
  status: 'exito' | 'alerta' | 'error';
  summary: string;
}

export type ErpAuditCategory =
  | 'cambio_precio'
  | 'cupon_eliminado'
  | 'cupon_creado'
  | 'cambio_rol'
  | 'inventario_stock'
  | 'facturacion_sri'
  | 'configuracion_erp'
  | 'seguridad_acceso';

export type ErpAuditSeverity = 'alta' | 'media' | 'informativa';

export interface ErpAuditLogEntry {
  id: string;
  auditCode: string;
  timestamp: string;
  actorUser: string;
  actorRole: UserRole;
  category: ErpAuditCategory;
  actionLabel: string;
  targetEntity: string;
  previousValue: string;
  newValue: string;
  severity: ErpAuditSeverity;
  ipAddress: string;
  integrityHash: string;
  notes?: string;
}

export type PaymentGatewayProvider =
  | 'payphone_corporativo'
  | 'datafast_kushki'
  | 'placetopay_ec'
  | 'pichincha_deuna'
  | 'guayaquil_boton_pagos';

export interface PaymentGatewayConfig {
  provider: PaymentGatewayProvider;
  providerLabel: string;
  environment: 'produccion' | 'sandbox';
  merchantId: string;
  terminalId: string;
  paymentLinkBaseUrl: string;
  apiTokenMasked: string;
  secretKeyMasked: string;
  webhookCallbackUrl: string;
  linkExpirationHours: number;
  enablePaymentLinks: boolean;
  enableCreditCards: boolean;
  enableDebitCards: boolean;
  enableQrDeunaPayphone: boolean;
  enableBankTransferSpi: boolean;
  maxDeferredMonths: number;
  settlementBank: string;
  settlementAccountNumber: string;
  autoSendInvoiceWhatsappEmail: boolean;
  deliveryEstimateText: string;
  updatedAt: string;
}

export type ExternalErpConnectorSystem = 'syspro' | 'latinasoft' | 'dual_syspro_latinasoft';

export interface SysproLatinasoftConfig {
  activeSystem: ExternalErpConnectorSystem;
  environment: 'produccion' | 'pruebas';
  sysproEndpointUrl: string;
  sysproCompanyId: string;
  sysproOperatorCode: string;
  latinasoftEndpointUrl: string;
  latinasoftRucEmisor: string;
  latinasoftDatabaseSchema: string;
  apiTokenMasked: string;
  sriEstablishmentCode: string;
  sriEmissionPoint: string;
  warehouseMasterCode: string;
  enableElectronicInvoicing: boolean;
  enableRealTimeInventorySync: boolean;
  enablePreOrderGeneration: boolean;
  preOrderPrefix: string;
  status: 'conectado' | 'sincronizando' | 'pausado';
  lastSyncAt: string;
  syncedInvoicesCount: number;
  syncedSkusCount: number;
  generatedPreOrdersCount: number;
}

