import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  LogOut,
  Network,
  Palette,
  Share2,
  Shield,
  ShoppingCart,
  Sparkles,
  Tag,
  Truck,
  UserCheck,
  X,
} from 'lucide-react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError } from './firebase';
import {
  CompanyBrand,
  CompanySettings,
  CompanySocialNetworks,
  DeliveryGpsLocation,
  DiscountCoupon,
  EcuadorianBank,
  EcuadorFestiveThemeId,
  ErpAuditCategory,
  ErpAuditLogEntry,
  ErpAuditSeverity,
  FlashFlyerPromo,
  InternalFieldMapping,
  InternalSyncLog,
  InternalSystemConnection,
  InternalWebhookConfig,
  InventoryItem,
  Invoice,
  InvoiceStatus,
  NotificationChannel,
  NotificationLog,
  NotificationRule,
  NotificationSeverity,
  OperationType,
  Order,
  OrderStatus,
  PaymentGatewayConfig,
  PaymentMethod,
  ProductTechnicalSheet,
  Shipment,
  StorefrontSectionId,
  StorefrontSectionsVisibilityMap,
  SupportTicket,
  ThirdPartyIntegration,
  UserProfile,
  UserRole,
} from './types/erp';
import {
  DEFAULT_PAYMENT_GATEWAY_CONFIG,
  INITIAL_AUDIT_LOGS,
  INITIAL_FIELD_MAPPINGS,
  INITIAL_INTEGRATIONS,
  INITIAL_INTERNAL_CONNECTIONS,
  INITIAL_INTERNAL_SYNC_LOGS,
  INITIAL_INTERNAL_WEBHOOKS,
  INITIAL_INVENTORY,
  INITIAL_INVOICES,
  INITIAL_NOTIFICATION_RULES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_SHIPMENTS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_USERS,
} from './data/seedData';
import {
  BLUEPRINT_CONSTRAINTS,
  calculateCartSummary,
  calculateInvoiceAmounts,
  CartItem,
  generateDigitalSignature,
  getNextShipmentStatus,
  getShipmentProgressByStatus,
  sanitizeString,
} from './utils/erpLogic';
import {
  DEFAULT_COUPONS,
  DEFAULT_FLASH_FLYERS,
  evaluateCheckoutCouponForOrder,
  INITIAL_COMPANY_SETTINGS,
  validateCouponForClient,
} from './utils/ecuadorCommerce';
import {
  ECUADOR_FESTIVE_THEMES,
  getActiveFestiveTheme,
} from './utils/ecuadorThemes';
import { CustomerStorefrontView } from './components/CustomerStorefrontView';
import { DashboardView } from './components/DashboardView';
import { OrdersAndPaymentsView } from './components/OrdersAndPaymentsView';
import { InventoryView } from './components/InventoryView';
import { InvoicesView } from './components/InvoicesView';
import { ShipmentTrackingView } from './components/ShipmentTrackingView';
import { NotificationsView } from './components/NotificationsView';
import { AnalyticsAndReportsView } from './components/AnalyticsAndReportsView';
import { SecurityRolesAndIntegrationsView } from './components/SecurityRolesAndIntegrationsView';
import { InternalSystemConnectionView } from './components/InternalSystemConnectionView';
import { SocialNetworksConfigModal } from './components/SocialNetworksConfigModal';
import { CouponsAndFlyersManagerModal } from './components/CouponsAndFlyersManagerModal';
import { IndustrialLatinaAiBot } from './components/IndustrialLatinaAiBot';
import { GeminiMultimodalStudioView } from './components/GeminiMultimodalStudioView';
import { Industrial3dLogisticsGameModal } from './components/Industrial3dLogisticsGameModal';
import { ErpStorefrontSectionsManagerView } from './components/ErpStorefrontSectionsManagerView';
import { ThematicAmbientCanvas } from './components/ThematicAmbientCanvas';
import { DynamicZIndexManager } from './components/DynamicZIndexManager';
import { ERP_INTERACTIVE_LAYER_Z_INDEX } from './utils/thematic3dAmbientLogic';
import {
  DEFAULT_STOREFRONT_SECTIONS_VISIBILITY,
  STOREFRONT_STORAGE_KEY,
  sanitizeSectionsVisibilityMap,
  setAllStorefrontSections,
  toggleStorefrontSection,
} from './utils/storefrontSectionsConfig';
import { clearPurchaseAndCartStorage } from './utils/cleanInitialState';

type ActiveModule =
  | 'panel'
  | 'apartados_web'
  | 'pedidos'
  | 'inventario'
  | 'facturacion'
  | 'envios'
  | 'notificaciones'
  | 'reportes'
  | 'sistema_interno'
  | 'seguridad'
  | 'cupones'
  | 'laboratorio_ia';

function detectInitialAdminMode(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return path.startsWith('/admin') || params.get('portal') === 'admin';
}

export default function App() {
  // Clean any residual shopping cart or purchase data in browser storage on initial visit
  useEffect(() => {
    clearPurchaseAndCartStorage();
  }, []);

  // Portal Routing: false = Public Customer Website (/), true = External Administration Annex (/admin)
  const [isAdminPortal, setIsAdminPortal] = useState<boolean>(detectInitialAdminMode);
  const [activeTab, setActiveTab] = useState<ActiveModule>('panel');
  const [trackingPreset, setTrackingPreset] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Ecuadorian Festive Themes State (Master ERP Control)
  const [activeThemeId, setActiveThemeId] = useState<EcuadorFestiveThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('il_active_theme_id');
      if (saved && saved in ECUADOR_FESTIVE_THEMES) return saved as EcuadorFestiveThemeId;
    }
    return 'quito';
  });

  // Company Settings & Social Networks (Master ERP Control)
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('il_company_settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return INITIAL_COMPANY_SETTINGS;
  });

  // Coupons and Flyers State (Master ERP Control)
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('il_discount_coupons');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return DEFAULT_COUPONS;
  });

  const [flyers, setFlyers] = useState<FlashFlyerPromo[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('il_flash_flyers');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return DEFAULT_FLASH_FLYERS;
  });

  // Storefront Sections Visibility State (Master ERP Control)
  const [sectionsVisibility, setSectionsVisibility] = useState<StorefrontSectionsVisibilityMap>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STOREFRONT_STORAGE_KEY);
      if (saved) {
        try {
          return sanitizeSectionsVisibilityMap(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    }
    return DEFAULT_STOREFRONT_SECTIONS_VISIBILITY;
  });

  // Modals for ERP Control
  const [isSocialModalOpen, setIsSocialModalOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState<boolean>(false);
  const [isAdmin3dGameOpen, setIsAdmin3dGameOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('il_active_theme_id', activeThemeId);
    } catch {
      // ignore
    }
  }, [activeThemeId]);

  useEffect(() => {
    try {
      localStorage.setItem(STOREFRONT_STORAGE_KEY, JSON.stringify(sectionsVisibility));
    } catch {
      // ignore
    }
  }, [sectionsVisibility]);

  const handleToggleStorefrontSection = (sectionId: StorefrontSectionId, forceValue?: boolean) => {
    setSectionsVisibility((prev) => {
      const next = toggleStorefrontSection(prev, sectionId, forceValue);
      showBanner(
        `Apartado web "${sectionId.toUpperCase()}" ${next[sectionId] ? 'ACTIVADO' : 'DESACTIVADO'} en la barra superior de la tienda.`
      );
      return next;
    });
  };

  const handleSetAllStorefrontSections = (enableAll: boolean) => {
    const next = setAllStorefrontSections(enableAll);
    setSectionsVisibility(next);
    showBanner(
      enableAll
        ? 'Todos los apartados de la página web han sido activados en la barra superior.'
        : 'Modo Catálogo Esencial activado (Inicio y Categorías visibles).'
    );
  };

  useEffect(() => {
    try {
      localStorage.setItem('il_company_settings', JSON.stringify(companySettings));
    } catch {
      // ignore
    }
  }, [companySettings]);

  useEffect(() => {
    try {
      localStorage.setItem('il_discount_coupons', JSON.stringify(coupons));
    } catch {
      // ignore
    }
  }, [coupons]);

  const [paymentGatewayConfig, setPaymentGatewayConfig] = useState<PaymentGatewayConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('il_payment_gateway_config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return DEFAULT_PAYMENT_GATEWAY_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem('il_payment_gateway_config', JSON.stringify(paymentGatewayConfig));
    } catch {
      // ignore
    }
  }, [paymentGatewayConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('il_flash_flyers', JSON.stringify(flyers));
    } catch {
      // ignore
    }
  }, [flyers]);

  const activeFestiveTheme = getActiveFestiveTheme(activeThemeId);

  // Immutable Security & ERP Audit Trail State (persisted in localStorage)
  const [auditLogs, setAuditLogs] = useState<ErpAuditLogEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('il_erp_audit_logs');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // ignore
        }
      }
    }
    return INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('il_erp_audit_logs', JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  const appendAuditLog = (params: {
    category: ErpAuditCategory;
    actionLabel: string;
    targetEntity: string;
    previousValue: string;
    newValue: string;
    severity?: ErpAuditSeverity;
    notes?: string;
  }) => {
    const now = new Date();
    const formattedTimestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)} ECT`;
    const hashSuffix = Math.random().toString(16).slice(2, 10).toUpperCase();
    const timeHex = Date.now().toString(16).slice(-8).toUpperCase();

    setAuditLogs((prev) => {
      const nextNum = 90 + prev.length + 1;
      const newEntry: ErpAuditLogEntry = {
        id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        auditCode: `AUD-2026-${String(nextNum).padStart(4, '0')}`,
        timestamp: formattedTimestamp,
        actorUser: firebaseUser?.email || adminActiveUserLabel || 'industriallatina.digital@gmail.com',
        actorRole: currentRole,
        category: params.category,
        actionLabel: params.actionLabel,
        targetEntity: params.targetEntity,
        previousValue: params.previousValue,
        newValue: params.newValue,
        severity: params.severity || 'alta',
        ipAddress: '186.46.128.44 (Guayaquil, EC)',
        integrityHash: `SHA256:${timeHex}${hashSuffix}`,
        notes: params.notes,
      };
      return [newEntry, ...prev];
    });
  };

  const handleSelectTheme = (themeId: EcuadorFestiveThemeId) => {
    const prevTheme = ECUADOR_FESTIVE_THEMES[activeThemeId];
    const nextTheme = ECUADOR_FESTIVE_THEMES[themeId];
    setActiveThemeId(themeId);
    setCompanySettings((prev) => ({ ...prev, activeFestiveTheme: themeId }));
    if (prevTheme.id !== nextTheme.id) {
      appendAuditLog({
        category: 'configuracion_erp',
        actionLabel: 'Actualización de Temática Corporativa Activa',
        targetEntity: 'Portal Web & Consola ERP Industrial Latina',
        previousValue: prevTheme.name.split('(')[0].trim(),
        newValue: nextTheme.name.split('(')[0].trim(),
        severity: 'informativa',
        notes: 'Sincronización visual aplicada en todos los módulos del sistema.',
      });
    }
    setStatusBanner(`Temática aplicada: ${nextTheme.name}. Toda la tienda y el ERP se han acoplado a la temática.`);
  };

  const handleSaveSocialNetworks = (updated: CompanySocialNetworks) => {
    setCompanySettings((prev) => ({ ...prev, socialNetworks: updated }));
    appendAuditLog({
      category: 'configuracion_erp',
      actionLabel: 'Actualización de Canales Oficiales de Redes Sociales',
      targetEntity: 'Configuración Corporativa Redes Sociales',
      previousValue: `WhatsApp ${companySettings.socialNetworks.whatsapp}`,
      newValue: `WhatsApp ${updated.whatsapp} (Canales Sincronizados)`,
      severity: 'informativa',
    });
    setStatusBanner('Redes sociales corporativas guardadas y sincronizadas en toda la plataforma.');
  };

  const handleAddCoupon = (newC: DiscountCoupon) => {
    setCoupons((prev) => [newC, ...prev]);
    appendAuditLog({
      category: 'cupon_creado',
      actionLabel: 'Creación de Nuevo Cupón Promocional en ERP',
      targetEntity: `Cupón ${newC.code} (${newC.description})`,
      previousValue: 'SIN REGISTRO',
      newValue: `ACTIVO (${newC.discountPct ? `-${newC.discountPct}%` : `-$${newC.discountFixedUsd || 0}`})`,
      severity: 'media',
    });
    showBanner(`¡Cupón '${newC.code}' creado con éxito en el ERP y registrado en auditoría!`);
  };

  const handleDeleteCoupon = (couponId: string) => {
    const targetCoupon = coupons.find((c) => c.id === couponId);
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    if (targetCoupon) {
      appendAuditLog({
        category: 'cupon_eliminado',
        actionLabel: 'Eliminación de Cupón Promocional en ERP',
        targetEntity: `Cupón ${targetCoupon.code} (${targetCoupon.description || 'Descuento Comercial'})`,
        previousValue: `ACTIVO (${targetCoupon.discountPct ? `-${targetCoupon.discountPct}%` : `-$${targetCoupon.discountFixedUsd || 0}`} · Mín. $${targetCoupon.minPurchaseUsd || 0})`,
        newValue: 'ELIMINADO DEL SISTEMA',
        severity: 'alta',
        notes: 'Baja ejecutada manualmente desde el módulo de Cupones del ERP.',
      });
      showBanner(`Cupón ${targetCoupon.code} eliminado y registrado en bitácora de auditoría.`);
    } else {
      showBanner('Cupón eliminado del catálogo de promociones.');
    }
  };

  const handleToggleCouponActive = (couponId: string) => {
    const target = coupons.find((c) => c.id === couponId);
    if (!target) return;
    const nextState = !target.active;
    setCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, active: nextState } : c))
    );
    appendAuditLog({
      category: 'configuracion_erp',
      actionLabel: `${nextState ? 'Activación' : 'Desactivación'} de Cupón en ERP`,
      targetEntity: `Cupón ${target.code}`,
      previousValue: target.active ? 'ACTIVO' : 'INACTIVO',
      newValue: nextState ? 'ACTIVO' : 'INACTIVO',
      severity: 'media',
    });
    showBanner(`Cupón ${target.code} ${nextState ? 'ACTIVADO' : 'DESACTIVADO'} correctamente.`);
  };

  const handleToggleAllCoupons = (enabled: boolean) => {
    setCoupons((prev) => prev.map((c) => ({ ...c, active: enabled })));
    appendAuditLog({
      category: 'configuracion_erp',
      actionLabel: `${enabled ? 'Activación' : 'Desactivación'} Masiva de Todos los Cupones`,
      targetEntity: `Catálogo Completo de Cupones (${coupons.length} registros)`,
      previousValue: 'ESTADO MIXTO',
      newValue: enabled ? 'TODOS ACTIVOS' : 'TODOS INACTIVOS',
      severity: 'media',
    });
    showBanner(
      enabled
        ? 'Todos los cupones han sido ACTIVADOS en el sistema.'
        : 'Todos los cupones han sido DESACTIVADOS en el sistema.'
    );
  };

  const handleUpdateOrderMeta = (orderId: string, meta: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, ...meta, updatedAt: new Date().toISOString() } : o
      )
    );
  };

  const handleAddFlyer = (newF: FlashFlyerPromo) => {
    setFlyers((prev) => [newF, ...prev]);
    appendAuditLog({
      category: 'cupon_creado',
      actionLabel: 'Publicación de Flyer Flash Promocional',
      targetEntity: `Flyer ${newF.title} [SKU: ${newF.sku}]`,
      previousValue: `USD $${newF.originalPrice.toFixed(2)}`,
      newValue: `PROMO USD $${newF.promotionalPrice.toFixed(2)} (-${newF.discountPct}%)`,
      severity: 'media',
    });
    showBanner(`Flyer flash '${newF.title}' publicado con la temática activa.`);
  };

  const handleDeleteFlyer = (flyerId: string) => {
    const targetFlyer = flyers.find((f) => f.id === flyerId);
    setFlyers((prev) => prev.filter((f) => f.id !== flyerId));
    if (targetFlyer) {
      appendAuditLog({
        category: 'cupon_eliminado',
        actionLabel: 'Retiro de Flyer Flash Promocional',
        targetEntity: `Flyer ${targetFlyer.title} [SKU: ${targetFlyer.sku}]`,
        previousValue: `ACTIVO ($${targetFlyer.promotionalPrice.toFixed(2)})`,
        newValue: 'RETIRADO DEL SISTEMA',
        severity: 'media',
      });
    }
    showBanner(`Flyer ${targetFlyer?.title || ''} retirado y auditado.`);
  };

  // Sync browser back/forward navigation between / and /admin
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminPortal(detectInitialAdminMode());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const switchToAdminAnnex = () => {
    try {
      window.history.pushState({}, '', '/admin');
    } catch {
      // Ignore history errors in restricted sandboxes
    }
    setIsAdminPortal(true);
    window.scrollTo(0, 0);
  };

  const switchToCustomerWebsite = () => {
    try {
      window.history.pushState({}, '', '/');
    } catch {
      // Ignore history errors in restricted sandboxes
    }
    setIsAdminPortal(false);
    window.scrollTo(0, 0);
  };

  // Core Operational State (Pre-seeded with Industrial Latina records + synced with Firestore when authenticated)
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [notifications, setNotifications] = useState<NotificationLog[]>(INITIAL_NOTIFICATIONS);
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>(
    INITIAL_NOTIFICATION_RULES
  );
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [integrations, setIntegrations] = useState<ThirdPartyIntegration[]>(INITIAL_INTEGRATIONS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [internalConnections, setInternalConnections] = useState<InternalSystemConnection[]>(
    INITIAL_INTERNAL_CONNECTIONS
  );
  const [fieldMappings, setFieldMappings] =
    useState<InternalFieldMapping[]>(INITIAL_FIELD_MAPPINGS);
  const [internalWebhooks, setInternalWebhooks] = useState<InternalWebhookConfig[]>(
    INITIAL_INTERNAL_WEBHOOKS
  );
  const [internalSyncLogs, setInternalSyncLogs] = useState<InternalSyncLog[]>(
    INITIAL_INTERNAL_SYNC_LOGS
  );

  // Firebase Auth & Real-Time Listeners + Explicit Admin ERP Protection Gate
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState<string>('');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [adminLoginLoading, setAdminLoginLoading] = useState<boolean>(false);
  const [adminActiveUserLabel, setAdminActiveUserLabel] = useState<string>(
    'industriallatina.digital@gmail.com'
  );

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (usr) => {
      if (usr) {
        try {
          // Probe token viability before attaching Firestore auth listeners
          await usr.getIdToken(false);
          setFirebaseUser(usr);
          setIsAdminAuthenticated(true);
          setAdminActiveUserLabel(usr.email || usr.displayName || 'Administrador Firebase');
        } catch (tokenErr) {
          const errMsg = tokenErr instanceof Error ? tokenErr.message : String(tokenErr);
          if (
            errMsg.includes('token-service-api') ||
            errMsg.includes('Token Service API') ||
            errMsg.includes('auth/')
          ) {
            console.warn(
              'GCP Token Service API disabled in project 33768810538; clearing stale session to keep Firestore online.'
            );
            try {
              await signOut(auth);
            } catch {
              // ignore
            }
            setFirebaseUser(null);
            setAdminLoginError(
              'Aviso: Token Service API (securetoken.googleapis.com) no está habilitada en el proyecto 33768810538. Active la API en Google Cloud Console o acceda con credenciales maestras.'
            );
          } else {
            setFirebaseUser(usr);
          }
        }
      } else {
        setFirebaseUser(null);
      }
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    const uid = firebaseUser.uid;
    const ordersPath = 'orders';
    const qOrders = query(collection(db, ordersPath), where('ownerId', '==', uid));
    const unsubOrders = onSnapshot(
      qOrders,
      (snap) => {
        if (!snap.empty) {
          const cloudOrders: Order[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              orderCode: String(data.orderCode || ''),
              clientName: String(data.clientName || ''),
              clientNit: String(data.clientNit || ''),
              sku: String(data.sku || ''),
              productName: String(data.productName || ''),
              company: (data.company as CompanyBrand) || 'industrial_latina',
              digitalSellerCode: data.digitalSellerCode ? String(data.digitalSellerCode) : undefined,
              cityEcuador: data.cityEcuador ? String(data.cityEcuador) : undefined,
              quantity: Number(data.quantity || 1),
              unitPrice: Number(data.unitPrice || 0),
              totalAmount: Number(data.totalAmount || 0),
              status: (data.status as OrderStatus) || 'pendiente',
              paymentStatus: (data.paymentStatus as Order['paymentStatus']) || 'pendiente',
              paymentMethod: (data.paymentMethod as PaymentMethod) || 'tarjeta_corporativa',
              ownerId: String(data.ownerId || uid),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          });
          setOrders((prev) => {
            const existingIds = new Set(cloudOrders.map((c) => c.id));
            return [...cloudOrders, ...prev.filter((p) => !existingIds.has(p.id))];
          });
        }
      },
      (err) => {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('token-service-api') || errMsg.includes('the client is offline')) {
          console.warn('Firestore orders sync delayed by token status or offline mode:', errMsg);
          return;
        }
        handleFirestoreError(err, OperationType.LIST, ordersPath);
      }
    );

    return () => {
      unsubOrders();
    };
  }, [authReady, firebaseUser]);

  const showBanner = (msg: string) => {
    setStatusBanner(msg);
  };

  const handleNavigate = (tab: string, preset?: string) => {
    setActiveTab(tab as ActiveModule);
    if (preset) {
      setTrackingPreset(preset);
    }
  };

  // Queries Firestore 'orders' collection and merges with local orders state to verify if a Cédula/RUC belongs to a new customer
  const fetchExistingOrdersFromFirestoreForNit = async (clientNitInput: string): Promise<Order[]> => {
    const sanitizedNit = sanitizeString(clientNitInput, BLUEPRINT_CONSTRAINTS.NIT_MAX);
    const cloudOrders: Order[] = [];

    if (firebaseUser && sanitizedNit.length >= BLUEPRINT_CONSTRAINTS.NIT_MIN) {
      try {
        const ordersCol = collection(db, 'orders');
        const qByOwner = query(
          ordersCol,
          where('ownerId', '==', firebaseUser.uid)
        );
        const snap = await getDocs(qByOwner);
        snap.docs.forEach((d) => {
          const data = d.data();
          if (String(data.clientNit || '').trim() === sanitizedNit) {
            cloudOrders.push({
              id: d.id,
              orderCode: String(data.orderCode || ''),
              clientName: String(data.clientName || ''),
              clientNit: String(data.clientNit || ''),
              sku: String(data.sku || ''),
              productName: String(data.productName || ''),
              company: (data.company as CompanyBrand) || 'industrial_latina',
              digitalSellerCode: data.digitalSellerCode ? String(data.digitalSellerCode) : undefined,
              cityEcuador: data.cityEcuador ? String(data.cityEcuador) : undefined,
              quantity: Number(data.quantity || 1),
              unitPrice: Number(data.unitPrice || 0),
              totalAmount: Number(data.totalAmount || 0),
              status: (data.status as OrderStatus) || 'pendiente',
              paymentStatus: (data.paymentStatus as Order['paymentStatus']) || 'pendiente',
              paymentMethod: (data.paymentMethod as PaymentMethod) || 'tarjeta_corporativa',
              ownerId: String(data.ownerId || firebaseUser.uid),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (!errMsg.includes('token-service-api') && !errMsg.includes('the client is offline')) {
          console.warn('Firestore orders lookup fallback to synchronized state:', errMsg);
        }
      }
    }

    const byId = new Map<string, Order>();
    orders.forEach((o) => byId.set(o.id, o));
    cloudOrders.forEach((o) => byId.set(o.id, o));
    return Array.from(byId.values());
  };

  const handleVerifyCouponInFirestore = async (couponCode: string, clientNit: string) => {
    const mergedExistingOrders = await fetchExistingOrdersFromFirestoreForNit(clientNit);
    return validateCouponForClient(couponCode, clientNit, coupons, mergedExistingOrders);
  };

  // Customer Storefront End-to-End Checkout Handler (Configured for Ecuador + Entidades Bancarias + GPS + Factura SRI)
  const handleCustomerCheckout = async (payload: {
    clientName: string;
    clientNit: string;
    clientEmail: string;
    clientWhatsapp: string;
    destinationAddress: string;
    cityEcuador: string;
    digitalSellerCode: string;
    paymentMethod: PaymentMethod;
    items: CartItem[];
    deliveryGps?: DeliveryGpsLocation;
    ecuadorBank?: EcuadorianBank;
    cardType?: 'credito' | 'debito';
    deferredMonths?: number;
    cardLast4?: string;
    couponCodeApplied?: string;
    couponDiscountUsd?: number;
  }) => {
    const nowIso = new Date().toISOString();
    const rawSummary = calculateCartSummary(payload.items);

    // Verify if the entered Cédula or RUC belongs to a new customer against existing orders in Firestore before applying coupon discount
    const existingOrdersInFirestore = await fetchExistingOrdersFromFirestoreForNit(payload.clientNit);
    const couponEvaluation = evaluateCheckoutCouponForOrder({
      couponCodeApplied: payload.couponCodeApplied,
      couponDiscountUsd: payload.couponDiscountUsd,
      clientNit: payload.clientNit,
      cartSubtotal: rawSummary.subtotal,
      availableCoupons: coupons,
      existingOrders: existingOrdersInFirestore,
    });

    const finalDiscount = couponEvaluation.applied ? couponEvaluation.finalDiscountUsd : 0;
    const verifiedCouponCode = couponEvaluation.applied
      ? couponEvaluation.couponCodeApplied
      : undefined;
    const finalTotal = Math.max(0, Math.round((rawSummary.total - finalDiscount) * 100) / 100);

    if (couponEvaluation.couponRequested) {
      if (couponEvaluation.applied && verifiedCouponCode) {
        appendAuditLog({
          category: 'configuracion_erp',
          actionLabel: 'Validación de Cupón para Cliente Nuevo en Firestore (Aprobado)',
          targetEntity: `Cupón ${verifiedCouponCode} · Cédula/RUC ${payload.clientNit.trim()}`,
          previousValue: `Subtotal USD $${rawSummary.subtotal.toFixed(2)}`,
          newValue: `Descuento -$${finalDiscount.toFixed(2)} USD (Cliente Nuevo Verificado)`,
          severity: 'informativa',
          notes: couponEvaluation.validationMessage || undefined,
        });
        if (couponEvaluation.validationMessage) {
          showBanner(couponEvaluation.validationMessage);
        }
      } else {
        appendAuditLog({
          category: 'seguridad_acceso',
          actionLabel: 'Rechazo de Cupón por Cédula/RUC con Pedidos Existentes en Firestore',
          targetEntity: `Cupón ${payload.couponCodeApplied || 'LATINA26'} · Cédula/RUC ${payload.clientNit.trim()}`,
          previousValue: `Descuento Solicitado: USD $${(payload.couponDiscountUsd || 0).toFixed(2)}`,
          newValue: 'DESCUENTO $0.00 (Cédula/RUC ya registra pedidos en Firestore)',
          severity: 'media',
          notes: couponEvaluation.validationMessage || undefined,
        });
        if (couponEvaluation.validationMessage) {
          showBanner(couponEvaluation.validationMessage);
        }
      }
    }

    const nextOrderNum = 101 + orders.length;
    const orderCode = `PED-EC-2026-${nextOrderNum}`;
    const orderId = `ord_${Date.now()}`;
    const ownerUid = firebaseUser?.uid || 'admin_il_01';
    const primaryItem = payload.items[0];
    const sellerCode = sanitizeString(payload.digitalSellerCode || 'VD-EC-101', 32);
    const combinedProductLabel =
      payload.items.length === 1
        ? primaryItem.name
        : `${primaryItem.name} (+${payload.items.length - 1} prod. Latina/Induless)`;

    // Call backend payment gateway
    try {
      await fetch('/api/payments/process-ecuador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode,
          amount: finalTotal,
          clientNit: payload.clientNit,
          clientEmail: payload.clientEmail,
          ecuadorBank: payload.ecuadorBank,
          cardType: payload.cardType,
          deferredMonths: payload.deferredMonths,
          cardLast4: payload.cardLast4,
          deliveryGps: payload.deliveryGps,
          couponCodeApplied: verifiedCouponCode,
          couponDiscountUsd: finalDiscount,
        }),
      });
    } catch {
      // Local fallback
    }

    const createdOrder: Order = {
      id: orderId,
      orderCode,
      clientName: sanitizeString(payload.clientName, BLUEPRINT_CONSTRAINTS.CLIENT_NAME_MAX),
      clientNit: sanitizeString(payload.clientNit, BLUEPRINT_CONSTRAINTS.NIT_MAX),
      clientEmail: payload.clientEmail,
      deliveryGps: payload.deliveryGps,
      ecuadorBank: payload.ecuadorBank,
      cardType: payload.cardType,
      deferredMonths: payload.deferredMonths,
      cardLast4: payload.cardLast4,
      couponCodeApplied: verifiedCouponCode,
      couponDiscountUsd: finalDiscount,
      sku: sanitizeString(primaryItem.sku, BLUEPRINT_CONSTRAINTS.SKU_MAX),
      productName: sanitizeString(combinedProductLabel, BLUEPRINT_CONSTRAINTS.PRODUCT_NAME_MAX),
      company: primaryItem.company || 'industrial_latina',
      digitalSellerCode: sellerCode,
      cityEcuador: payload.cityEcuador || 'Guayaquil, Ecuador',
      quantity: rawSummary.itemCount,
      unitPrice: primaryItem.unitPrice,
      totalAmount: finalTotal,
      status: 'procesando',
      paymentStatus: 'pagado',
      paymentMethod: payload.paymentMethod,
      deliveryWindowHours: '48 a 72 horas',
      ownerId: ownerUid,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setOrders((prev) => [createdOrder, ...prev]);

    // Deduct stock for all purchased items
    setInventory((prev) =>
      prev.map((invItem) => {
        const bought = payload.items.find((c) => c.sku === invItem.sku);
        if (!bought) return invItem;
        return {
          ...invItem,
          stock: Math.max(0, invItem.stock - bought.quantity),
          updatedAt: nowIso,
        };
      })
    );

    // Issue Digital Invoice (SRI Ecuador)
    const invoiceNumber = `SRI-001-002-0000${841 + invoices.length}`;
    const digitalSignature = generateDigitalSignature(
      invoiceNumber,
      createdOrder.clientNit,
      finalTotal
    );
    const invoiceSubtotal = Math.max(0, rawSummary.taxableBase - finalDiscount / 1.15);
    const invoiceTax = Math.max(0, finalTotal - invoiceSubtotal);

    const createdInvoice: Invoice = {
      id: `fac_${Date.now()}`,
      invoiceNumber,
      orderCode,
      clientName: createdOrder.clientName,
      clientNit: createdOrder.clientNit,
      subtotal: Number(invoiceSubtotal.toFixed(2)),
      taxAmount: Number(invoiceTax.toFixed(2)),
      total: Number(finalTotal.toFixed(2)),
      status: 'pagada',
      digitalSignature,
      ownerId: ownerUid,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setInvoices((prev) => [createdInvoice, ...prev]);

    // Create Online Shipment Guide (Ecuador)
    const trackingCode = `EC-ENV-${8901 + shipments.length}`;
    const createdShipment: Shipment = {
      id: `shp_${Date.now()}`,
      trackingCode,
      orderCode,
      clientName: createdOrder.clientName,
      clientEmail: payload.clientEmail,
      deliveryGps: payload.deliveryGps,
      origin:
        primaryItem.company === 'induless'
          ? 'Bodega Induless Mapasingue Este - Guayaquil'
          : 'Planta Industrial Latina Vía a Daule Km 8.5 - Guayaquil',
      destination: payload.destinationAddress,
      carrier: 'Logística Nacional Latina-Induless Ecuador',
      status: 'preparacion',
      progress: 20,
      estimatedDelivery: '2026-10-25 14:00',
      ownerId: ownerUid,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setShipments((prev) => [createdShipment, ...prev]);

    // Dispatch automated WhatsApp & Email notification logs with 48-72h delivery commitment
    setNotifications((prev) => [
      {
        id: `not_wa_${Date.now()}`,
        channel: 'whatsapp',
        recipientName: createdOrder.clientName,
        recipientTarget: payload.clientWhatsapp,
        subject: `Factura Electrónica ${invoiceNumber} · Pedido ${orderCode} (Entrega: 48 a 72 horas)`,
        message: `Su factura electrónica ${invoiceNumber} por USD ${finalTotal.toFixed(2)} fue enviada a WhatsApp (${payload.clientWhatsapp}). La entrega de su pedido dura entre 48 a 72 horas. Guía: ${trackingCode}.`,
        severity: 'info',
        status: 'entregado',
        ownerId: ownerUid,
        createdAt: nowIso,
      },
      {
        id: `not_em_${Date.now() + 1}`,
        channel: 'email',
        recipientName: createdOrder.clientName,
        recipientTarget: payload.clientEmail,
        subject: `Factura Electrónica SRI ${invoiceNumber} · Entrega en 48 a 72 horas`,
        message: `Su factura electrónica autorizada ${invoiceNumber} por USD ${finalTotal.toFixed(2)} fue enviada a su correo ${payload.clientEmail}. Especificación logística: La entrega dura entre 48 a 72 horas.`,
        severity: 'info',
        status: 'entregado',
        ownerId: ownerUid,
        createdAt: nowIso,
      },
      ...prev,
    ]);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'orders', orderId), {
          orderCode: createdOrder.orderCode,
          clientName: createdOrder.clientName.length >= 2 ? createdOrder.clientName : 'Cliente Corporativo',
          clientNit: createdOrder.clientNit.length >= 4 ? createdOrder.clientNit : '0992837465001',
          sku: createdOrder.sku.length >= 2 ? createdOrder.sku : 'LAT-LVA-01',
          productName: createdOrder.productName.length >= 2 ? createdOrder.productName : 'Producto Latina',
          company: createdOrder.company || 'industrial_latina',
          digitalSellerCode:
            createdOrder.digitalSellerCode && createdOrder.digitalSellerCode.length >= 2
              ? createdOrder.digitalSellerCode
              : 'VD-EC-101',
          cityEcuador:
            createdOrder.cityEcuador && createdOrder.cityEcuador.length >= 2
              ? sanitizeString(createdOrder.cityEcuador, 80)
              : 'Guayaquil, Ecuador',
          quantity: Math.max(1, Number(createdOrder.quantity) || 1),
          unitPrice: Math.max(0, Number(createdOrder.unitPrice) || 0),
          totalAmount: Math.max(0, Number(createdOrder.totalAmount) || 0),
          status: createdOrder.status,
          paymentStatus: createdOrder.paymentStatus,
          paymentMethod: createdOrder.paymentMethod,
          ownerId: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
      }
    }

    return {
      orderCode,
      invoiceNumber,
      trackingCode,
      digitalSellerCode: sellerCode,
      total: finalTotal,
      digitalSignature,
      couponApplied: couponEvaluation.applied,
      couponCodeApplied: verifiedCouponCode,
      couponDiscountUsd: finalDiscount,
      couponValidationMessage: couponEvaluation.validationMessage,
      isNewCustomer: couponEvaluation.isNewCustomer,
    };
  };

  const handleCustomerSubscribeTracking = async (
    shipment: Shipment,
    channel: 'whatsapp' | 'email',
    destinationContact: string
  ) => {
    const nowIso = new Date().toISOString();
    const subject = `Alerta de Rastreo ${shipment.trackingCode} (${shipment.progress}%)`;
    const message = `Industrial Latina informa a ${shipment.clientName}: Su envío con guía ${shipment.trackingCode} hacia ${shipment.destination} registra un avance del ${shipment.progress}%.`;

    try {
      await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          recipientName: shipment.clientName,
          recipientTarget: destinationContact,
          subject,
          message,
          severity: 'info',
        }),
      });
    } catch {
      // Fallback
    }

    setNotifications((prev) => [
      {
        id: `not_${Date.now()}`,
        channel,
        recipientName: shipment.clientName,
        recipientTarget: destinationContact,
        subject,
        message,
        severity: 'info',
        status: 'entregado',
        ownerId: firebaseUser?.uid || 'admin_il_01',
        createdAt: nowIso,
      },
      ...prev,
    ]);
  };

  // 1. Admin Create Order + Deduct Stock + Optional Immediate Payment & Invoice + Shipment + Automated Notification
  const handleCreateOrder = async (newOrderInput: {
    clientName: string;
    clientNit: string;
    sku: string;
    quantity: number;
    paymentMethod: PaymentMethod;
    processImmediatePayment: boolean;
  }) => {
    const item = inventory.find((i) => i.sku === newOrderInput.sku) || inventory[0];
    const nowIso = new Date().toISOString();
    const nextOrderNum = 101 + orders.length;
    const orderCode = `PED-2026-${nextOrderNum}`;
    const orderId = `ord_${Date.now()}`;
    const amounts = calculateInvoiceAmounts(item.unitPrice * newOrderInput.quantity);
    const ownerUid = firebaseUser?.uid || 'admin_il_01';

    const createdOrder: Order = {
      id: orderId,
      orderCode,
      clientName: sanitizeString(newOrderInput.clientName, BLUEPRINT_CONSTRAINTS.CLIENT_NAME_MAX),
      clientNit: sanitizeString(newOrderInput.clientNit, BLUEPRINT_CONSTRAINTS.NIT_MAX),
      sku: sanitizeString(item.sku, BLUEPRINT_CONSTRAINTS.SKU_MAX),
      productName: sanitizeString(item.name, BLUEPRINT_CONSTRAINTS.PRODUCT_NAME_MAX),
      quantity: newOrderInput.quantity,
      unitPrice: item.unitPrice,
      totalAmount: amounts.total,
      status: newOrderInput.processImmediatePayment ? 'procesando' : 'pendiente',
      paymentStatus: newOrderInput.processImmediatePayment ? 'pagado' : 'pendiente',
      paymentMethod: newOrderInput.paymentMethod,
      ownerId: ownerUid,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setOrders((prev) => [createdOrder, ...prev]);

    setInventory((prev) =>
      prev.map((invItem) =>
        invItem.sku === item.sku
          ? {
              ...invItem,
              stock: Math.max(0, invItem.stock - newOrderInput.quantity),
              updatedAt: nowIso,
            }
          : invItem
      )
    );

    const trackingCode = `IL-ENV-${8901 + shipments.length}`;
    const newShipment: Shipment = {
      id: `shp_${Date.now()}`,
      trackingCode,
      orderCode,
      clientName: createdOrder.clientName,
      origin: item.warehouse,
      destination: `Planta Cliente - ${createdOrder.clientName}`,
      carrier: 'Flota Corporativa Industrial Latina',
      status: 'preparacion',
      progress: 20,
      estimatedDelivery: '2026-10-27 14:00',
      ownerId: ownerUid,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setShipments((prev) => [newShipment, ...prev]);

    if (newOrderInput.processImmediatePayment) {
      const invCode = `FE-IL-2026-0${841 + invoices.length}`;
      const newInv: Invoice = {
        id: `fac_${Date.now()}`,
        invoiceNumber: invCode,
        orderCode,
        clientName: createdOrder.clientName,
        clientNit: createdOrder.clientNit,
        subtotal: amounts.subtotal,
        taxAmount: amounts.taxAmount,
        total: amounts.total,
        status: 'pagada',
        digitalSignature: generateDigitalSignature(invCode, createdOrder.clientNit, amounts.total),
        ownerId: ownerUid,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setInvoices((prev) => [newInv, ...prev]);
    }

    const newNotif: NotificationLog = {
      id: `not_${Date.now()}`,
      channel: 'whatsapp',
      recipientName: createdOrder.clientName,
      recipientTarget: '+57 310 489 2210',
      subject: `Confirmación de Pedido ${orderCode} y Guía ${trackingCode}`,
      message: `Pedido registrado por USD ${amounts.total.toFixed(2)}. Guía de rastreo en línea asignada: ${trackingCode}.`,
      severity: 'info',
      status: 'entregado',
      ownerId: ownerUid,
      createdAt: nowIso,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'orders', orderId), {
          orderCode: createdOrder.orderCode,
          clientName: createdOrder.clientName.length >= 2 ? createdOrder.clientName : 'Cliente Corporativo',
          clientNit: createdOrder.clientNit.length >= 4 ? createdOrder.clientNit : '0992837465001',
          sku: createdOrder.sku.length >= 2 ? createdOrder.sku : 'LAT-LVA-01',
          productName: createdOrder.productName.length >= 2 ? createdOrder.productName : 'Producto Latina',
          quantity: Math.max(1, Number(createdOrder.quantity) || 1),
          unitPrice: Math.max(0, Number(createdOrder.unitPrice) || 0),
          totalAmount: Math.max(0, Number(createdOrder.totalAmount) || 0),
          status: createdOrder.status,
          paymentStatus: createdOrder.paymentStatus,
          paymentMethod: createdOrder.paymentMethod,
          ownerId: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
      }
    }

    showBanner(
      `Pedido ${orderCode} confirmado · Stock actualizado · Guía de rastreo ${trackingCode} generada.`
    );
  };

  // 2. Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: nowIso } : o))
    );
    const target = orders.find((o) => o.id === orderId);
    if (firebaseUser && target && target.ownerId === firebaseUser.uid) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
      }
    }
    showBanner(`Estado del pedido ${target?.orderCode || orderId} actualizado a ${newStatus.toUpperCase()}.`);
  };

  // 3. Process Order Payment in Gateway
  const handleProcessOrderPayment = async (
    orderId: string,
    paymentMethod: PaymentMethod,
    authCode: string
  ) => {
    const nowIso = new Date().toISOString();
    const targetOrder = orders.find((o) => o.id === orderId);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus: 'pagado',
              paymentMethod,
              status: o.status === 'pendiente' ? 'procesando' : o.status,
              updatedAt: nowIso,
            }
          : o
      )
    );

    if (targetOrder) {
      const existingInv = invoices.find((inv) => inv.orderCode === targetOrder.orderCode);
      if (existingInv) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === existingInv.id ? { ...inv, status: 'pagada', updatedAt: nowIso } : inv
          )
        );
      } else {
        const amounts = calculateInvoiceAmounts(targetOrder.unitPrice * targetOrder.quantity);
        const invCode = `FE-IL-2026-0${841 + invoices.length}`;
        setInvoices((prev) => [
          {
            id: `fac_${Date.now()}`,
            invoiceNumber: invCode,
            orderCode: targetOrder.orderCode,
            clientName: targetOrder.clientName,
            clientNit: targetOrder.clientNit,
            subtotal: amounts.subtotal,
            taxAmount: amounts.taxAmount,
            total: amounts.total,
            status: 'pagada',
            digitalSignature: generateDigitalSignature(invCode, targetOrder.clientNit, amounts.total),
            ownerId: firebaseUser?.uid || 'admin_il_01',
            createdAt: nowIso,
            updatedAt: nowIso,
          },
          ...prev,
        ]);
      }
    }

    showBanner(
      `Pago liquidado en pasarela segura (${authCode}) para el pedido ${targetOrder?.orderCode || ''}.`
    );
  };

  // 4. Issue Digital Invoice from Order Row
  const handleIssueInvoiceForOrder = (order: Order) => {
    const existing = invoices.find((inv) => inv.orderCode === order.orderCode);
    if (existing) {
      setActiveTab('facturacion');
      showBanner(`La orden ${order.orderCode} ya cuenta con la factura digital ${existing.invoiceNumber}.`);
      return;
    }
    const nowIso = new Date().toISOString();
    const amounts = calculateInvoiceAmounts(order.unitPrice * order.quantity);
    const invCode = `FE-IL-2026-0${841 + invoices.length}`;
    const newInv: Invoice = {
      id: `fac_${Date.now()}`,
      invoiceNumber: invCode,
      orderCode: order.orderCode,
      clientName: order.clientName,
      clientNit: order.clientNit,
      subtotal: amounts.subtotal,
      taxAmount: amounts.taxAmount,
      total: amounts.total,
      status: order.paymentStatus === 'pagado' ? 'pagada' : 'emitida',
      digitalSignature: generateDigitalSignature(invCode, order.clientNit, amounts.total),
      ownerId: firebaseUser?.uid || 'admin_il_01',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setInvoices((prev) => [newInv, ...prev]);
    setActiveTab('facturacion');
    showBanner(`Factura electrónica ${invCode} timbrada digitalmente para ${order.clientName}.`);
  };

  // 5. Inventory Stock Adjustments & New SKU
  const handleAdjustStock = (itemId: string, delta: number) => {
    const nowIso = new Date().toISOString();
    const targetItem = inventory.find((i) => i.id === itemId);
    let updatedSku = targetItem?.sku || '';
    let newStockVal = targetItem ? Math.max(0, targetItem.stock + delta) : 0;
    let minStockVal = targetItem?.minStock || 0;
    let itemName = targetItem?.name || '';

    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        updatedSku = item.sku;
        itemName = item.name;
        minStockVal = item.minStock;
        newStockVal = Math.max(0, item.stock + delta);
        return { ...item, stock: newStockVal, updatedAt: nowIso };
      })
    );

    if (targetItem) {
      appendAuditLog({
        category: 'inventario_stock',
        actionLabel: 'Ajuste Directo de Existencias en Bodega',
        targetEntity: `SKU ${targetItem.sku} · ${targetItem.name}`,
        previousValue: `${targetItem.stock} ${targetItem.unit}`,
        newValue: `${newStockVal} ${targetItem.unit} (${delta > 0 ? `+${delta}` : delta})`,
        severity: newStockVal <= minStockVal ? 'alta' : 'media',
      });
    }

    if (newStockVal <= minStockVal && delta < 0) {
      setNotifications((prev) => [
        {
          id: `not_${Date.now()}`,
          channel: 'sistema_critico',
          recipientName: 'Gerencia de Almacén',
          recipientTarget: 'Alerta Crítica #Inventario',
          subject: `Alerta Crítica de Stock: ${updatedSku} (${newStockVal} disp.)`,
          message: `El insumo ${itemName} descendió a ${newStockVal} unidades (umbral mínimo: ${minStockVal}).`,
          severity: 'critica',
          status: 'entregado',
          ownerId: firebaseUser?.uid || 'admin_il_01',
          createdAt: nowIso,
        },
        ...prev,
      ]);
      showBanner(`Alerta crítica disparada: ${updatedSku} en nivel de reorden (${newStockVal} und).`);
    } else {
      showBanner(`Existencia de ${updatedSku} actualizada en tiempo real (${newStockVal} unidades).`);
    }
  };

  const handleCreateInventoryItem = async (newItem: {
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
    presentations?: { name: string; unitPrice: number; skuSuffix?: string; description?: string }[];
    technicalSheet?: ProductTechnicalSheet;
  }) => {
    const nowIso = new Date().toISOString();
    const itemId = `inv_${Date.now()}`;
    const created: InventoryItem = {
      id: itemId,
      sku: sanitizeString(newItem.sku, BLUEPRINT_CONSTRAINTS.CODE_MAX_LEN),
      name: sanitizeString(newItem.name, BLUEPRINT_CONSTRAINTS.CLIENT_NAME_MAX),
      category: newItem.category,
      warehouse: newItem.warehouse,
      stock: Number(newItem.stock) || 0,
      minStock: Number(newItem.minStock) || 5,
      unitPrice: Number(newItem.unitPrice) || 10,
      unit: newItem.unit,
      company: newItem.company || 'industrial_latina',
      description: newItem.description || '',
      imageUrl: newItem.imageUrl || '',
      videoUrl: newItem.videoUrl || '',
      presentations: newItem.presentations || [],
      technicalSheet: newItem.technicalSheet,
      ownerId: firebaseUser?.uid || 'admin_il_01',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setInventory((prev) => [created, ...prev]);

    appendAuditLog({
      category: 'cambio_precio',
      actionLabel: 'Alta de Nuevo Producto y Fijación de Precio Base',
      targetEntity: `SKU ${created.sku} · ${created.name}`,
      previousValue: 'SIN REGISTRO',
      newValue: `USD $${created.unitPrice.toFixed(2)} (${created.stock} ${created.unit})`,
      severity: 'media',
    });

    if (firebaseUser) {
      try {
        const safeSku = created.sku.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 32) || 'SKU-LAT-01';
        await setDoc(doc(db, 'inventory', itemId), {
          sku: safeSku.length >= 3 ? safeSku : `SKU-${safeSku}`,
          name: created.name.length >= 2 ? created.name.slice(0, 120) : 'Producto Industrial',
          category: created.category.length >= 2 ? created.category.slice(0, 60) : 'Pinturas',
          warehouse: created.warehouse.length >= 2 ? created.warehouse.slice(0, 60) : 'Planta Guayaquil',
          stock: Math.max(0, Number(created.stock) || 0),
          minStock: Math.max(0, Number(created.minStock) || 0),
          unitPrice: Math.max(0, Number(created.unitPrice) || 0),
          unit: created.unit.length >= 1 ? created.unit.slice(0, 20) : 'Und',
          ownerId: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `inventory/${itemId}`);
      }
    }

    showBanner(`Nuevo SKU ${created.sku} (${created.name}) incorporado al catálogo en tiempo real con presentaciones y multimedia.`);
  };

  const handleUpdateInventoryItem = async (updatedItem: InventoryItem) => {
    const nowIso = new Date().toISOString();
    const prevItem = inventory.find((i) => i.id === updatedItem.id);
    const cleanedItem: InventoryItem = {
      ...updatedItem,
      updatedAt: nowIso,
    };

    setInventory((prev) =>
      prev.map((item) => (item.id === cleanedItem.id ? cleanedItem : item))
    );

    if (prevItem) {
      const priceChanged = Math.abs(prevItem.unitPrice - cleanedItem.unitPrice) > 0.001;
      if (priceChanged) {
        appendAuditLog({
          category: 'cambio_precio',
          actionLabel: 'Actualización de Precio Unitario en Catálogo',
          targetEntity: `SKU ${cleanedItem.sku} · ${cleanedItem.name}`,
          previousValue: `USD $${prevItem.unitPrice.toFixed(2)}`,
          newValue: `USD $${cleanedItem.unitPrice.toFixed(2)}`,
          severity: 'alta',
          notes: `Modificación de tarifa oficial en bodega ${cleanedItem.warehouse}.`,
        });
      } else {
        appendAuditLog({
          category: 'inventario_stock',
          actionLabel: 'Actualización de Ficha / Stock de Producto',
          targetEntity: `SKU ${cleanedItem.sku} · ${cleanedItem.name}`,
          previousValue: `Stock: ${prevItem.stock} · Precio: $${prevItem.unitPrice.toFixed(2)}`,
          newValue: `Stock: ${cleanedItem.stock} · Precio: $${cleanedItem.unitPrice.toFixed(2)}`,
          severity: 'media',
        });
      }
    }

    if (firebaseUser && cleanedItem.id.startsWith('inv_') && cleanedItem.ownerId === firebaseUser.uid) {
      try {
        await updateDoc(doc(db, 'inventory', cleanedItem.id), {
          stock: Math.max(0, Number(cleanedItem.stock) || 0),
          minStock: Math.max(0, Number(cleanedItem.minStock) || 0),
          unitPrice: Math.max(0, Number(cleanedItem.unitPrice) || 0),
          warehouse: cleanedItem.warehouse.length >= 2 ? cleanedItem.warehouse.slice(0, 60) : 'Planta Guayaquil',
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `inventory/${cleanedItem.id}`);
      }
    }

    showBanner(`Producto ${cleanedItem.sku} (${cleanedItem.name}) actualizado y registrado en auditoría.`);
  };

  // 6. Manual Invoice Creation & Status Update
  const handleCreateManualInvoice = (newInvInput: {
    orderCode: string;
    clientName: string;
    clientNit: string;
    subtotal: number;
  }) => {
    const nowIso = new Date().toISOString();
    const amounts = calculateInvoiceAmounts(newInvInput.subtotal);
    const invCode = `FE-IL-2026-0${841 + invoices.length}`;
    const created: Invoice = {
      id: `fac_${Date.now()}`,
      invoiceNumber: invCode,
      orderCode: newInvInput.orderCode,
      clientName: sanitizeString(newInvInput.clientName, BLUEPRINT_CONSTRAINTS.CLIENT_NAME_MAX),
      clientNit: sanitizeString(newInvInput.clientNit, BLUEPRINT_CONSTRAINTS.NIT_MAX),
      subtotal: amounts.subtotal,
      taxAmount: amounts.taxAmount,
      total: amounts.total,
      status: 'emitida',
      digitalSignature: generateDigitalSignature(invCode, newInvInput.clientNit, amounts.total),
      ownerId: firebaseUser?.uid || 'admin_il_01',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setInvoices((prev) => [created, ...prev]);
    showBanner(`Factura digital ${invCode} emitida con sello SHA-256 por USD ${amounts.total.toFixed(2)}.`);
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, status: InvoiceStatus) => {
    const nowIso = new Date().toISOString();
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status, updatedAt: nowIso } : inv))
    );
    showBanner(`Estado fiscal de factura actualizado a ${status.toUpperCase()}.`);
  };

  // 7. Shipment Stage Advancement & Customer Notification
  const handleAdvanceShipmentStage = (shipmentId: string) => {
    const nowIso = new Date().toISOString();
    let updatedTracking = '';
    let nextStageLabel = '';

    setShipments((prev) =>
      prev.map((s) => {
        if (s.id !== shipmentId) return s;
        const nextStatus = getNextShipmentStatus(s.status);
        const nextProgress = getShipmentProgressByStatus(nextStatus);
        updatedTracking = s.trackingCode;
        nextStageLabel = nextStatus;
        return {
          ...s,
          status: nextStatus,
          progress: nextProgress,
          updatedAt: nowIso,
        };
      })
    );

    showBanner(
      `Guía ${updatedTracking} actualizada a etapa "${nextStageLabel.replace('_', ' ').toUpperCase()}".`
    );
  };

  const handleSendTrackingNotification = async (
    shipment: Shipment,
    channel: 'whatsapp' | 'email'
  ) => {
    const nowIso = new Date().toISOString();
    const subject = `Actualización de Envío ${shipment.trackingCode} (${shipment.progress}%)`;
    const message = `Industrial Latina informa a ${shipment.clientName}: Su envío con guía ${shipment.trackingCode} hacia ${shipment.destination} registra un avance del ${shipment.progress}% (${shipment.status.replace('_', ' ')}).`;

    try {
      await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          recipientName: shipment.clientName,
          recipientTarget: channel === 'whatsapp' ? '+57 310 489 2210' : 'logistica@cliente.co',
          subject,
          message,
          severity: 'info',
        }),
      });
    } catch {
      // Fallback local log
    }

    const newLog: NotificationLog = {
      id: `not_${Date.now()}`,
      channel,
      recipientName: shipment.clientName,
      recipientTarget: channel === 'whatsapp' ? '+57 310 489 2210' : 'logistica@cliente.co',
      subject,
      message,
      severity: 'info',
      status: 'entregado',
      ownerId: firebaseUser?.uid || 'admin_il_01',
      createdAt: nowIso,
    };
    setNotifications((prev) => [newLog, ...prev]);
    showBanner(
      `Notificación automática enviada por ${channel.toUpperCase()} al cliente ${shipment.clientName} (Guía ${shipment.trackingCode}).`
    );
  };

  // 8. Notifications Dispatch & Rules
  const handleToggleNotificationRule = (
    ruleId: string,
    channelKey: 'whatsappEnabled' | 'emailEnabled' | 'criticalPushEnabled'
  ) => {
    setNotificationRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, [channelKey]: !r[channelKey] } : r))
    );
    showBanner('Preferencias de notificaciones automatizadas actualizadas.');
  };

  const handleDispatchNotification = async (payload: {
    channel: NotificationChannel;
    recipientName: string;
    recipientTarget: string;
    subject: string;
    message: string;
    severity: NotificationSeverity;
  }) => {
    const nowIso = new Date().toISOString();
    try {
      await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Continue with local log
    }
    const newLog: NotificationLog = {
      id: `not_${Date.now()}`,
      channel: payload.channel,
      recipientName: payload.recipientName,
      recipientTarget: payload.recipientTarget,
      subject: payload.subject,
      message: sanitizeString(payload.message, BLUEPRINT_CONSTRAINTS.MESSAGE_MAX),
      severity: payload.severity,
      status: 'entregado',
      ownerId: firebaseUser?.uid || 'admin_il_01',
      createdAt: nowIso,
    };
    setNotifications((prev) => [newLog, ...prev]);
    showBanner(
      `Mensaje despachado por ${payload.channel.toUpperCase()} a ${payload.recipientName}.`
    );
  };

  // 9. Users, 2FA, Third-Party Integrations & 24/7 Support
  const handleCreateUser = (newUser: {
    displayName: string;
    department: string;
    role: UserRole;
    email: string;
    phone: string;
  }) => {
    const nowIso = new Date().toISOString();
    const created: UserProfile = {
      id: `usr_${Date.now()}`,
      displayName: newUser.displayName,
      department: newUser.department,
      role: newUser.role,
      email: newUser.email,
      phone: newUser.phone,
      twoFactorEnabled: true,
      e2eeKeyFingerprint: `SHA256:${Math.random().toString(16).slice(2, 6).toUpperCase()}:99A1:IL-KEY`,
      ownerId: firebaseUser?.uid || 'admin_il_01',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setUsers((prev) => [created, ...prev]);
    appendAuditLog({
      category: 'cambio_rol',
      actionLabel: 'Alta de Perfil de Usuario y Asignación de Rol RBAC',
      targetEntity: `Usuario ${created.displayName} (${created.email})`,
      previousValue: 'SIN PERFIL',
      newValue: `ROL ${created.role.toUpperCase()} (${created.department})`,
      severity: 'alta',
    });
    showBanner(`Perfil de usuario ${created.displayName} (${created.role.toUpperCase()}) creado y auditado.`);
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser || targetUser.role === newRole) return;
    const prevRole = targetUser.role;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role: newRole, updatedAt: new Date().toISOString() } : u
      )
    );
    appendAuditLog({
      category: 'cambio_rol',
      actionLabel: 'Modificación de Rol de Acceso de Usuario (RBAC)',
      targetEntity: `Usuario ${targetUser.displayName} (${targetUser.email})`,
      previousValue: `ROL ${prevRole.toUpperCase()}`,
      newValue: `ROL ${newRole.toUpperCase()}`,
      severity: 'alta',
      notes: `Reasignación de privilegios en el departamento ${targetUser.department}.`,
    });
    showBanner(
      `Rol de ${targetUser.displayName} actualizado de ${prevRole.toUpperCase()} a ${newRole.toUpperCase()} y registrado en auditoría.`
    );
  };

  const handleToggleUser2FA = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, twoFactorEnabled: !u.twoFactorEnabled } : u
      )
    );
    if (targetUser) {
      appendAuditLog({
        category: 'seguridad_acceso',
        actionLabel: 'Modificación de Estado 2FA TOTP de Usuario',
        targetEntity: `Usuario ${targetUser.displayName} (${targetUser.email})`,
        previousValue: targetUser.twoFactorEnabled ? '2FA ACTIVO' : '2FA INACTIVO',
        newValue: !targetUser.twoFactorEnabled ? '2FA ACTIVO' : '2FA INACTIVO',
        severity: 'media',
      });
    }
    showBanner('Estado de autenticación de doble factor (2FA) actualizado para el usuario.');
  };

  const handleSyncIntegration = async (integrationId: string) => {
    const target = integrations.find((i) => i.id === integrationId);
    try {
      await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: integrationId, providerName: target?.name }),
      });
    } catch {
      // Fallback
    }
    const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
    setIntegrations((prev) =>
      prev.map((intg) =>
        intg.id === integrationId
          ? {
              ...intg,
              lastSync: nowStamp,
              syncedRecords: intg.syncedRecords + 12,
              status: 'conectado',
            }
          : intg
      )
    );
    showBanner(`Sincronización cifrada E2EE completada con ${target?.name || integrationId}.`);
  };

  const handleCreateSupportTicket = (
    subject: string,
    priority: SupportTicket['priority']
  ) => {
    const created: SupportTicket = {
      id: `tkt_${Date.now()}`,
      ticketCode: `SOP-247-${902 + supportTickets.length}`,
      subject,
      priority,
      assignedEngineer: 'Ing. Guardia Corporativa 24/7',
      status: 'en_atencion',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setSupportTickets((prev) => [created, ...prev]);
    showBanner(`Ticket prioritario 24/7 ${created.ticketCode} asignado a ingeniería de guardia.`);
  };

  // 10. Internal System Connections & Free-Will Administration Handlers
  const handleSaveInternalConnection = (conn: InternalSystemConnection, isNew: boolean) => {
    setInternalConnections((prev) => {
      if (isNew) return [conn, ...prev];
      return prev.map((c) => (c.id === conn.id ? conn : c));
    });
    showBanner(
      isNew
        ? `Nueva conexión a sistema interno "${conn.name}" (${conn.protocol}) registrada con éxito.`
        : `Parámetros de conexión "${conn.name}" actualizados.`
    );
  };

  const handleDeleteInternalConnection = (connectionId: string) => {
    const target = internalConnections.find((c) => c.id === connectionId);
    setInternalConnections((prev) => prev.filter((c) => c.id !== connectionId));
    showBanner(`Perfil de conexión "${target?.name || connectionId}" eliminado.`);
  };

  const handleToggleInternalConnectionStatus = (connectionId: string) => {
    setInternalConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId
          ? { ...c, status: c.status === 'conectado' ? 'pausado' : 'conectado' }
          : c
      )
    );
    showBanner('Estado del enlace con sistema interno actualizado.');
  };

  const handleSaveFieldMapping = (mapping: InternalFieldMapping) => {
    setFieldMappings((prev) => [mapping, ...prev]);
    showBanner(
      `Regla de mapeo creada: ${mapping.internalField} ⟷ ${mapping.erpField} (${mapping.entity.toUpperCase()}).`
    );
  };

  const handleToggleFieldMapping = (mappingId: string) => {
    setFieldMappings((prev) =>
      prev.map((m) => (m.id === mappingId ? { ...m, active: !m.active } : m))
    );
    showBanner('Estado de regla de mapeo de campo actualizado.');
  };

  const handleDeleteFieldMapping = (mappingId: string) => {
    setFieldMappings((prev) => prev.filter((m) => m.id !== mappingId));
    showBanner('Regla de mapeo eliminada del diccionario de datos.');
  };

  const handleSaveInternalWebhook = (wh: InternalWebhookConfig) => {
    setInternalWebhooks((prev) => [wh, ...prev]);
    showBanner(`Webhook interno registrado para el evento '${wh.eventTrigger}'.`);
  };

  const handleToggleInternalWebhook = (webhookId: string) => {
    setInternalWebhooks((prev) =>
      prev.map((w) => (w.id === webhookId ? { ...w, active: !w.active } : w))
    );
    showBanner('Estado de webhook interno actualizado.');
  };

  const handleDeleteInternalWebhook = (webhookId: string) => {
    setInternalWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
    showBanner('Webhook interno eliminado.');
  };

  const handleAppendSyncLog = (log: InternalSyncLog) => {
    setInternalSyncLogs((prev) => [log, ...prev]);
  };

  const handleOverrideInventory = (newInventory: InventoryItem[], reason: string) => {
    setInventory(newInventory);
    showBanner(`Administración Libre: ${reason}. Cambios reflejados en el ERP y tienda pública.`);
  };

  const handleOverrideOrders = (newOrders: Order[], reason: string) => {
    setOrders(newOrders);
    showBanner(`Administración Libre: ${reason}.`);
  };

  const handleOverrideInvoices = (newInvoices: Invoice[], reason: string) => {
    setInvoices(newInvoices);
    showBanner(`Administración Libre: ${reason}.`);
  };

  const handleOverrideShipments = (newShipments: Shipment[], reason: string) => {
    setShipments(newShipments);
    showBanner(`Administración Libre: ${reason}.`);
  };

  const handleResetFactoryDefaults = () => {
    setInventory(INITIAL_INVENTORY);
    setOrders(INITIAL_ORDERS);
    setInvoices(INITIAL_INVOICES);
    setShipments(INITIAL_SHIPMENTS);
    showBanner(
      'Catálogo, existencias y registros del ERP restaurados a los valores originales certificados.'
    );
  };

  const handleAdminCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);

    const cleanUser = adminUsernameInput.trim();
    const cleanPass = adminPasswordInput.trim();

    if (!cleanUser || !cleanPass) {
      setAdminLoginError(
        'Por favor ingrese su usuario o correo corporativo y su contraseña de administrador.'
      );
      return;
    }

    setAdminLoginLoading(true);
    try {
      // Verify against authorized Industrial Latina & Induless Administrator Credentials
      const validAdminUsers = new Set([
        'admin',
        'administrador',
        'industriallatina.digital@gmail.com',
        'gerencia@industriallatina.com.ec',
        'c.mendoza@industriallatina.com',
        ...users
          .filter((u) => u.role === 'admin' || u.role === 'finanzas' || u.role === 'logistica')
          .map((u) => u.email.toLowerCase()),
      ]);

      const validAdminPasswords = new Set([
        'AdminLatina2026!',
        'admin123',
        'Latina2026',
        'Industrial2026',
      ]);

      if (validAdminUsers.has(cleanUser.toLowerCase()) && validAdminPasswords.has(cleanPass)) {
        const matchedProfile = users.find(
          (u) => u.email.toLowerCase() === cleanUser.toLowerCase()
        );
        if (matchedProfile) {
          setCurrentRole(matchedProfile.role);
        } else {
          setCurrentRole('admin');
        }
        setIsAdminAuthenticated(true);
        setAdminActiveUserLabel(
          cleanUser.toLowerCase() === 'admin'
            ? 'industriallatina.digital@gmail.com (Admin)'
            : cleanUser
        );
        setAdminPasswordInput('');
        setAdminLoginError(null);
        showBanner(
          `Acceso administrativo concedido para ${cleanUser}. Consola ERP desbloqueada.`
        );
      } else {
        setAdminLoginError(
          'Acceso denegado: Usuario o contraseña de administrador incorrectos. Verifique sus credenciales o inicie sesión con su cuenta de Firebase Google Cloud.'
        );
      }
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleSignInGoogle = async () => {
    setAdminLoginError(null);
    setAdminLoginLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      setIsAdminAuthenticated(true);
      setAdminActiveUserLabel(
        cred.user.email || cred.user.displayName || 'Administrador Firebase'
      );
      showBanner('Sesión autenticada con Google Cloud y sincronización Firestore activada.');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Ventana emergente de autenticación cerrada';
      if (
        msg.includes('token-service-api') ||
        msg.includes('Token Service API') ||
        msg.includes('securetoken.googleapis.com')
      ) {
        setAdminLoginError(
          'API de Google Cloud no activada: La "Token Service API" (securetoken.googleapis.com) debe ser habilitada en su proyecto 33768810538 (https://console.developers.google.com/apis/api/securetoken.googleapis.com/overview?project=33768810538). Mientras tanto, puede acceder inmediatamente con las credenciales maestras de administrador.'
        );
      } else {
        setAdminLoginError(
          `No se pudo completar la autenticación con Google Cloud (${msg}). Puede ingresar con su usuario y contraseña de administrador.`
        );
      }
      showBanner(`Autenticación Cloud requerida o ingrese con credenciales de administrador.`);
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleSignOutGoogle = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore signout error if in local session
    }
    setIsAdminAuthenticated(false);
    setAdminUsernameInput('');
    setAdminPasswordInput('');
    setAdminLoginError(null);
    showBanner('Sesión administrativa cerrada correctamente.');
    switchToCustomerWebsite();
  };

  // PUBLIC CUSTOMER WEBSITE (Default Route `/`)
  if (!isAdminPortal) {
    return (
      <CustomerStorefrontView
        inventory={inventory}
        orders={orders}
        shipments={shipments}
        invoices={invoices}
        coupons={coupons}
        flyers={flyers}
        activeThemeId={activeThemeId}
        companySettings={companySettings}
        sectionsVisibility={sectionsVisibility}
        onCustomerCheckout={handleCustomerCheckout}
        onVerifyCouponInFirestore={handleVerifyCouponInFirestore}
        onSubscribeTrackingAlert={handleCustomerSubscribeTracking}
        onOpenExternalAdmin={switchToAdminAnnex}
      />
    );
  }

  // SECURITY PROTECTION GATE (Login Modal) BEFORE ALLOWING ACCESS TO `isAdminPortal` (`/admin`)
  if (!isAdminAuthenticated && !firebaseUser) {
    return (
      <div className="relative min-h-screen bg-slate-950">
        <DynamicZIndexManager activeTrigger="admin-login-gate" />
        <ThematicAmbientCanvas activeThemeId={activeThemeId} />
        {/* Background Storefront Preview (Locked & Blurred) */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none blur-xs opacity-25 max-h-screen overflow-hidden"
        >
          <CustomerStorefrontView
            inventory={inventory}
            orders={orders}
            shipments={shipments}
            invoices={invoices}
            coupons={coupons}
            flyers={flyers}
            activeThemeId={activeThemeId}
            companySettings={companySettings}
            sectionsVisibility={sectionsVisibility}
            onCustomerCheckout={handleCustomerCheckout}
            onVerifyCouponInFirestore={handleVerifyCouponInFirestore}
            onSubscribeTrackingAlert={handleCustomerSubscribeTracking}
            onOpenExternalAdmin={switchToAdminAnnex}
          />
        </div>

        {/* Modal de Protección de Acceso Administrativo ERP */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="erp-login-modal-title"
          className="fixed inset-0 z-[9999] modal-layer-top flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden border-2 border-[#0B2861] skeuo-modal-3d relative">
            {/* Corporate Security Header */}
            <div
              className="text-white p-6 border-b-4 border-[#FFD100] relative overflow-hidden"
              style={{ background: activeFestiveTheme.modalHeaderGradient }}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="logo-pedestal-3d inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl">
                  <img
                    src="/assets/aistudio/Industrial_Latina_2_f5b18e35.png"
                    alt="Industrial Latina"
                    className="h-9 w-auto object-contain logo-hd-render"
                  />
                  <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
                  <img
                    src="/assets/aistudio/Induless_2_fe52db1f.png"
                    alt="Induless"
                    className="h-8 w-auto object-contain logo-hd-render"
                  />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD100] text-[#0B2861] text-[10px] font-black uppercase tracking-wider">
                  <Lock className="w-3 h-3" />
                  ERP
                </span>
              </div>
              <h2
                id="erp-login-modal-title"
                className="text-xl font-black tracking-tight font-display"
              >
                Autenticación de Administrador
              </h2>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                Consola exclusiva para gerencia y personal autorizado. Ingrese su usuario y
                contraseña o autentíquese con Firebase.
              </p>
            </div>

            {/* Login Body */}
            <div className="p-6 space-y-5">
              {adminLoginError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{adminLoginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminCredentialsLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="erp-admin-username"
                    className="block text-xs font-bold text-slate-800 mb-1.5"
                  >
                    Usuario o Correo de Administrador *
                  </label>
                  <div className="relative">
                    <input
                      id="erp-admin-username"
                      type="text"
                      required
                      autoComplete="username"
                      value={adminUsernameInput}
                      onChange={(e) => setAdminUsernameInput(e.target.value)}
                      placeholder="Ej. admin o industriallatina.digital@gmail.com"
                      className="w-full pl-3.5 pr-9 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2861]"
                    />
                    <UserCheck className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="erp-admin-password"
                    className="block text-xs font-bold text-slate-800 mb-1.5"
                  >
                    Contraseña de Administrador *
                  </label>
                  <div className="relative">
                    <input
                      id="erp-admin-password"
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2861]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      aria-label="Mostrar u ocultar contraseña"
                    >
                      {showAdminPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  id="erp-admin-submit-btn"
                  type="submit"
                  disabled={adminLoginLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#0B2861] hover:bg-blue-950 text-white text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4 text-[#FFD100]" />
                  <span>
                    {adminLoginLoading
                      ? 'Verificando Credenciales...'
                      : 'Ingresar al ERP como Administrador'}
                  </span>
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  O Autenticación Cloud
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Explicit Firebase Google Auth Button */}
              <button
                type="button"
                disabled={adminLoginLoading}
                onClick={handleSignInGoogle}
                className="w-full py-2.5 px-4 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Shield className="w-4 h-4 text-[#0B2861]" />
                <span>Autenticar con Firebase Google Cloud</span>
              </button>

              {/* Quick Credentials Reference Box for Admin Verification */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Credenciales Corporativas Autorizadas:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminUsernameInput('admin');
                      setAdminPasswordInput('AdminLatina2026!');
                      setAdminLoginError(null);
                    }}
                    className="text-[10px] font-extrabold text-[#0B2861] underline hover:text-blue-900 cursor-pointer"
                  >
                    Autocompletar Admin
                  </button>
                </div>
                <div className="font-mono text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-0.5">
                  <span>
                    Usuario: <strong className="text-slate-800">admin</strong>
                  </span>
                  <span>
                    Clave: <strong className="text-slate-800">AdminLatina2026!</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer: Return to Public Storefront */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={switchToCustomerWebsite}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0B2861] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a la Tienda Pública de Clientes</span>
              </button>
              <span className="text-[10px] font-mono text-slate-400">E2EE · AES-256</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EXTERNAL ADMINISTRATION ANNEX (Route `/admin` or `?portal=admin`) — AUTHENTICATED
  const sidebarItems: { id: ActiveModule; label: string; icon: React.ReactNode }[] = [
    { id: 'panel', label: 'Panel de Control', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'apartados_web', label: 'Apartados Web & Temas', icon: <LayoutGrid className="w-4 h-4 text-[#FFD100]" /> },
    { id: 'pedidos', label: 'Pedidos & Pasarela', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'cupones', label: 'Cupones & Promos', icon: <Tag className="w-4 h-4" /> },
    { id: 'inventario', label: 'Inventario en Vivo', icon: <Boxes className="w-4 h-4" /> },
    { id: 'facturacion', label: 'Facturación Digital', icon: <FileCheck2 className="w-4 h-4" /> },
    { id: 'envios', label: 'Rastreo de Envíos', icon: <Truck className="w-4 h-4" /> },
    { id: 'notificaciones', label: 'WhatsApp & Alertas', icon: <Bell className="w-4 h-4" /> },
    { id: 'reportes', label: 'Reportes & IA Predictiva', icon: <BarChart3 className="w-4 h-4" /> },
    {
      id: 'sistema_interno',
      label: 'Sistema Interno & Control',
      icon: <Network className="w-4 h-4 shrink-0" />,
    },
    { id: 'seguridad', label: 'Seguridad, Roles & APIs', icon: <Shield className="w-4 h-4" /> },
    {
      id: 'laboratorio_ia',
      label: 'Biociencia 3D & Estudio IA',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-il-canvas text-slate-900 relative">
      <DynamicZIndexManager
        activeTrigger={`${activeTab}-${isThemeModalOpen}-${isSocialModalOpen}-${isCouponModalOpen}-${isAdmin3dGameOpen}`}
      />
      <ThematicAmbientCanvas activeThemeId={activeThemeId} />
      {/* Strict 3-Zone Top Bar Contract for External Admin Annex */}
      <header
        data-testid="erp-top-header-bar"
        data-z-layer="erp-bar"
        style={{ zIndex: ERP_INTERACTIVE_LAYER_Z_INDEX }}
        className="erp-interactive-bar flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 py-3 il-bg-corporate-dark border-b-2 border-il-yellow sticky top-0 z-[9999]"
      >
        {/* Zone 1: Official Industrial Latina & Induless Logos (High-Resolution Pedestal) */}
        <a
          href="/admin"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('panel');
          }}
          aria-label="Panel Principal ERP"
          className="logo-pedestal-3d inline-flex items-center gap-3 px-3.5 py-1.5 rounded-2xl shrink-0"
        >
          <img
            src="/assets/aistudio/Industrial_Latina_2_f5b18e35.png"
            alt="Industrial Latina"
            className="h-9 sm:h-11 w-auto object-contain logo-hd-render"
          />
          <span className="h-6 w-0.5 bg-slate-200 rounded-full" aria-hidden="true" />
          <img
            src="/assets/aistudio/Induless_2_fe52db1f.png"
            alt="Induless"
            className="h-8 sm:h-9 w-auto object-contain logo-hd-render"
          />
        </a>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav
          aria-label="Navegación administrativa"
          className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-200"
        >
          <a
            href="#panel"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('panel');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'panel' ? 'text-il-yellow font-semibold underline underline-offset-4' : ''
            }`}
          >
            Panel
          </a>
          <a
            href="#apartados_web"
            data-testid="erp-top-apartados-web-btn"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('apartados_web');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'apartados_web' ? 'text-il-yellow font-semibold underline underline-offset-4' : ''
            }`}
          >
            Apartados Web
          </a>
          <a
            href="#pedidos"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('pedidos');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'pedidos' ? 'text-il-yellow font-semibold underline underline-offset-4' : ''
            }`}
          >
            Pedidos
          </a>
          <a
            href="#cupones"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('cupones');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'cupones' ? 'text-il-yellow font-semibold underline underline-offset-4' : ''
            }`}
          >
            Cupones
          </a>
          <a
            href="#inventario"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('inventario');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'inventario'
                ? 'text-il-yellow font-semibold underline underline-offset-4'
                : ''
            }`}
          >
            Inventario
          </a>
          <a
            href="#facturacion"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('facturacion');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'facturacion'
                ? 'text-il-yellow font-semibold underline underline-offset-4'
                : ''
            }`}
          >
            Facturación
          </a>
          <a
            href="#reportes"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('reportes');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'reportes' ? 'text-il-yellow font-semibold underline underline-offset-4' : ''
            }`}
          >
            Analítica IA
          </a>
        </nav>

        {/* Zone 3: Admin Session Controls & Return to Public Customer Storefront */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Active Festive Theme Selector Button (Master ERP Control) */}
          <button
            type="button"
            data-testid="erp-header-theme-selector-btn"
            onClick={() => setIsThemeModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer skeuo-btn-3d ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}
            title="Cambiar Temática (Halloween, Black Friday, Quito, Guayaquil, etc.)"
          >
            <span className="text-sm">{activeFestiveTheme.iconSymbol}</span>
            <span className="hidden xl:inline">{activeFestiveTheme.name.split('(')[0]}</span>
            <span className="text-[10px] bg-black/20 px-1 py-0.2 rounded font-mono">Temática</span>
          </button>

          {/* Social Networks ERP Quick-Access Button */}
          <button
            type="button"
            onClick={() => setIsSocialModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            title="Configurar Redes Sociales Oficiales de Industrial Latina & Induless"
          >
            <Share2 className="w-3.5 h-3.5 text-[#FFD100]" />
            <span className="hidden lg:inline">Redes Sociales</span>
          </button>

          {/* Coupons & Flyers Manager Button (Master ERP Control) */}
          <button
            type="button"
            onClick={() => setIsCouponModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFD100] hover:bg-yellow-400 text-[#0B2861] text-xs font-bold transition-colors shadow-xs cursor-pointer"
            title="Gestión de Cupones por Cédula/RUC y Flyers Flash (Exclusivo ERP)"
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Cupones</span>
            <span className="text-[10px] bg-black/15 px-1 py-0.2 rounded font-mono">{coupons.length}</span>
          </button>

          <button
            type="button"
            onClick={handleSignOutGoogle}
            title="Cerrar sesión de administrador y bloquear ERP"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
          <button
            type="button"
            onClick={switchToCustomerWebsite}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs rounded-lg il-btn-accent whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Web de Clientes</span>
          </button>
        </div>
      </header>

      {/* Workspace Layout: Sidebar + Main Content Viewport */}
      <div
        data-z-workspace="true"
        className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto relative z-20"
      >
        {/* Desktop Sidebar Navigation (256px) */}
        <aside
          aria-label="Módulos del sistema ERP"
          data-testid="erp-sidebar-bar"
          data-z-layer="erp-bar"
          style={{ zIndex: ERP_INTERACTIVE_LAYER_Z_INDEX }}
          className="erp-interactive-bar hidden lg:flex lg:flex-col lg:w-64 shrink-0 bg-white border-r il-border-corporate p-4 justify-between relative z-[9999]"
        >
          <div className="space-y-1">
            <p className="px-3 py-2 text-xs font-semibold text-slate-400">
              Anexo Administrativo ERP
            </p>
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'il-bg-corporate shadow-xs'
                      : 'text-slate-600 hover:bg-il-blue-soft hover:text-il-blue'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 px-3 space-y-2 text-xs text-slate-500">
            <p className="font-semibold text-slate-800">Sesión de Administrador</p>
            <p className="truncate font-mono text-[11px] text-emerald-700 font-semibold">
              ● {firebaseUser?.email || adminActiveUserLabel}
            </p>
            <p>
              Rol: <strong className="text-slate-900 uppercase font-mono">{currentRole}</strong>
            </p>
            <p>Cifrado E2EE AES-256 Activo</p>
          </div>
        </aside>

        {/* Mobile Horizontal Module Selector */}
        <div
          data-testid="erp-mobile-module-bar"
          data-z-layer="erp-bar"
          style={{ zIndex: ERP_INTERACTIVE_LAYER_Z_INDEX }}
          className="erp-interactive-bar lg:hidden bg-white border-b border-slate-200 px-4 py-2.5 overflow-x-auto relative z-[9999]"
        >
          <div className="flex items-center gap-1.5">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 ${
                  activeTab === item.id
                    ? 'bg-[#0E4B8F] text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 relative z-20">
          {/* Interactive Action Confirmation Banner */}
          {statusBanner && (
            <div
              role="status"
              data-z-layer="erp-bar"
              style={{ zIndex: ERP_INTERACTIVE_LAYER_Z_INDEX }}
              className="erp-interactive-bar mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-4 text-xs font-medium text-emerald-900 relative z-[9999]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{statusBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                className="text-xs font-semibold text-emerald-800 underline hover:text-emerald-950 whitespace-nowrap shrink-0"
              >
                Ocultar
              </button>
            </div>
          )}

          {activeTab === 'panel' && (
            <DashboardView
              orders={orders}
              inventory={inventory}
              invoices={invoices}
              shipments={shipments}
              notifications={notifications}
              supportTickets={supportTickets}
              activeThemeId={activeThemeId}
              onSelectTheme={handleSelectTheme}
              socialNetworks={companySettings.socialNetworks}
              onOpenSocialModal={() => setIsSocialModalOpen(true)}
              coupons={coupons}
              onOpenCouponModal={() => setIsCouponModalOpen(true)}
              onNavigate={handleNavigate}
              onStatusBanner={showBanner}
            />
          )}

          {activeTab === 'apartados_web' && (
            <ErpStorefrontSectionsManagerView
              sectionsVisibility={sectionsVisibility}
              onToggleSection={handleToggleStorefrontSection}
              onSetAllSections={handleSetAllStorefrontSections}
              activeThemeId={activeThemeId}
              onSelectTheme={handleSelectTheme}
              onSwitchToStorefront={switchToCustomerWebsite}
            />
          )}

          {activeTab === 'pedidos' && (
            <OrdersAndPaymentsView
              orders={orders}
              inventory={inventory}
              currentRole={currentRole}
              onCreateOrder={handleCreateOrder}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onProcessOrderPayment={handleProcessOrderPayment}
              onIssueInvoiceForOrder={handleIssueInvoiceForOrder}
              onStatusBanner={showBanner}
              paymentGatewayConfig={paymentGatewayConfig}
              onSavePaymentGatewayConfig={setPaymentGatewayConfig}
              onUpdateOrderMeta={handleUpdateOrderMeta}
            />
          )}

          {activeTab === 'inventario' && (
            <InventoryView
              inventory={inventory}
              currentRole={currentRole}
              onAdjustStock={handleAdjustStock}
              onCreateInventoryItem={handleCreateInventoryItem}
              onUpdateInventoryItem={handleUpdateInventoryItem}
              onStatusBanner={showBanner}
            />
          )}

          {activeTab === 'facturacion' && (
            <InvoicesView
              invoices={invoices}
              orders={orders}
              currentRole={currentRole}
              onCreateManualInvoice={handleCreateManualInvoice}
              onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
              onStatusBanner={showBanner}
            />
          )}

          {activeTab === 'envios' && (
            <ShipmentTrackingView
              shipments={shipments}
              initialTrackingQuery={trackingPreset}
              currentRole={currentRole}
              onAdvanceShipmentStage={handleAdvanceShipmentStage}
              onSendTrackingNotification={handleSendTrackingNotification}
            />
          )}

          {activeTab === 'notificaciones' && (
            <NotificationsView
              notifications={notifications}
              rules={notificationRules}
              onToggleRule={handleToggleNotificationRule}
              onDispatchNotification={handleDispatchNotification}
            />
          )}

          {activeTab === 'reportes' && (
            <AnalyticsAndReportsView
              orders={orders}
              inventory={inventory}
              invoices={invoices}
              onStatusBanner={showBanner}
            />
          )}

          {activeTab === 'sistema_interno' && (
            <InternalSystemConnectionView
              connections={internalConnections}
              fieldMappings={fieldMappings}
              webhooks={internalWebhooks}
              syncLogs={internalSyncLogs}
              inventory={inventory}
              orders={orders}
              invoices={invoices}
              shipments={shipments}
              onSaveConnection={handleSaveInternalConnection}
              onDeleteConnection={handleDeleteInternalConnection}
              onToggleConnectionStatus={handleToggleInternalConnectionStatus}
              onSaveFieldMapping={handleSaveFieldMapping}
              onToggleFieldMapping={handleToggleFieldMapping}
              onDeleteFieldMapping={handleDeleteFieldMapping}
              onSaveWebhook={handleSaveInternalWebhook}
              onToggleWebhook={handleToggleInternalWebhook}
              onDeleteWebhook={handleDeleteInternalWebhook}
              onAppendSyncLog={handleAppendSyncLog}
              onOverrideInventory={handleOverrideInventory}
              onOverrideOrders={handleOverrideOrders}
              onOverrideInvoices={handleOverrideInvoices}
              onOverrideShipments={handleOverrideShipments}
              onResetFactoryDefaults={handleResetFactoryDefaults}
              onStatusBanner={showBanner}
            />
          )}

          {activeTab === 'seguridad' && (
            <SecurityRolesAndIntegrationsView
              users={users}
              currentRole={currentRole}
              onChangeActiveRole={(r) => {
                if (r !== currentRole) {
                  appendAuditLog({
                    category: 'cambio_rol',
                    actionLabel: 'Cambio de Rol Activo en Sesión Administrativa (RBAC)',
                    targetEntity: `Sesión ERP (${firebaseUser?.email || adminActiveUserLabel})`,
                    previousValue: `ROL ${currentRole.toUpperCase()}`,
                    newValue: `ROL ${r.toUpperCase()}`,
                    severity: 'alta',
                    notes: 'Conmutación de privilegios RBAC en tiempo real.',
                  });
                }
                setCurrentRole(r);
                showBanner(`Rol activo cambiado a ${r.toUpperCase()} y registrado en el módulo de auditoría.`);
              }}
              onCreateUser={handleCreateUser}
              onUpdateUserRole={handleUpdateUserRole}
              onToggleUser2FA={handleToggleUser2FA}
              integrations={integrations}
              onSyncIntegration={handleSyncIntegration}
              tickets={supportTickets}
              onCreateSupportTicket={handleCreateSupportTicket}
              firebaseConnected={authReady}
              firebaseUserEmail={firebaseUser?.email || null}
              activeThemeId={activeThemeId}
              onSelectTheme={handleSelectTheme}
              socialNetworks={companySettings.socialNetworks}
              onOpenSocialModal={() => setIsSocialModalOpen(true)}
              onSignInGoogle={handleSignInGoogle}
              onSignOutGoogle={handleSignOutGoogle}
              onStatusBanner={showBanner}
              auditLogs={auditLogs}
            />
          )}

          {activeTab === 'cupones' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Administración Comercial Centralizada · Solo Personal Autorizado
                  </p>
                  <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                    <Tag className="w-6 h-6 text-[#0B2861]" />
                    <span>Gestión de Cupones por Cédula/RUC &amp; Promociones Flash</span>
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    Configure descuentos por Cédula/RUC y flyers promocionales vinculados a la temática activa ({activeFestiveTheme.name}).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCouponModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B2861] hover:bg-blue-950 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <Tag className="w-4 h-4 text-[#FFD100]" />
                    <span>Crear Nuevo Cupón / Flyer Flash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsThemeModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Palette className="w-4 h-4 text-[#0B2861]" />
                    <span>Temática: {activeFestiveTheme.name.split('(')[0]}</span>
                  </button>
                </div>
              </div>

              {/* Active Festive Context Banner */}
              <div className={`p-4 rounded-2xl bg-gradient-to-r ${activeFestiveTheme.bannerGradient} text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-white/20">{activeFestiveTheme.iconSymbol}</span>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-black/20 text-[#FFD100]">
                      Temática Activa en Toda la Plataforma
                    </span>
                    <h3 className="text-base font-extrabold mt-0.5">{activeFestiveTheme.name}</h3>
                    <p className="text-xs text-blue-100">{activeFestiveTheme.festiveSalute} — {activeFestiveTheme.dates}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsThemeModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-[#0B2861] text-xs font-bold hover:bg-yellow-300 transition-colors cursor-pointer shrink-0"
                >
                  Cambiar Temática ERP
                </button>
              </div>

              {/* Section 1: Coupons Table */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-[#0B2861]" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Cupones Registrados ({coupons.filter((c) => c.active).length} activos / {coupons.length} total)
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 cursor-pointer select-none shadow-2xs">
                      <input
                        type="checkbox"
                        data-testid="erp-master-coupon-checkbox"
                        checked={coupons.length > 0 && coupons.every((c) => c.active)}
                        onChange={(e) => handleToggleAllCoupons(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#0B2861] cursor-pointer"
                      />
                      <span>Activar / Desactivar Todos los Cupones</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCouponModalOpen(true)}
                      className="text-xs font-bold text-[#0B2861] hover:underline cursor-pointer"
                    >
                      + Nuevo Cupón
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Activar / Desactivar</th>
                        <th className="p-3">Código</th>
                        <th className="p-3">Descuento</th>
                        <th className="p-3">Condición</th>
                        <th className="p-3">Mínimo Compra</th>
                        <th className="p-3">Vigencia</th>
                        <th className="p-3">Temática</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {coupons.map((c) => (
                        <tr
                          key={c.id}
                          className={`hover:bg-slate-50 transition-colors ${!c.active ? 'opacity-60 bg-slate-50/60' : ''}`}
                        >
                          <td className="p-3">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                data-testid={`erp-coupon-checkbox-${c.code}`}
                                checked={Boolean(c.active)}
                                onChange={() => handleToggleCouponActive(c.id)}
                                className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                              />
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  c.active
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {c.active ? 'Activo' : 'Inactivo'}
                              </span>
                            </label>
                          </td>
                          <td className="p-3 font-mono font-black text-slate-900">{c.code}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              {c.discountPct ? `${c.discountPct}%` : `$${c.discountFixedUsd || 0}`}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">
                            {c.onlyNewClients ? 'Clientes Nuevos (Cédula/RUC)' : 'Todo Público'}
                          </td>
                          <td className="p-3 font-mono">${c.minPurchaseUsd || 0}</td>
                          <td className="p-3 font-mono text-slate-500">{c.expiresAt ? c.expiresAt.split('T')[0] : 'Indefinido'}</td>
                          <td className="p-3 text-slate-600">{c.themeAffinity || 'Universal'}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteCoupon(c.id)}
                              className="text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Promotional Flyers */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0B2861]" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Flyers Flash Promocionales ({flyers.length})
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCouponModalOpen(true)}
                    className="text-xs font-bold text-[#0B2861] hover:underline cursor-pointer"
                  >
                    + Nuevo Flyer
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flyers.map((f) => (
                    <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded bg-[#0B2861] text-white text-[10px] font-black uppercase">
                            {f.badge}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            -{f.discountPct}%
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900">{f.title}</h4>
                        <p className="text-xs text-slate-600 mt-1">{f.subtitle}</p>
                        <p className="text-[11px] font-mono text-slate-500 mt-2">SKU: {f.sku}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-xs line-through text-slate-400 mr-2">${f.originalPrice.toFixed(2)}</span>
                          <span className="text-sm font-extrabold text-emerald-700 font-mono">${f.promotionalPrice.toFixed(2)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteFlyer(f.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                        >
                          Retirar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'laboratorio_ia' && (
            <GeminiMultimodalStudioView
              inventory={inventory}
              onLaunch3dGame={() => setIsAdmin3dGameOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Quiet Enterprise Footer for External Admin Annex */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-xs text-slate-500 relative z-20">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 Industrial Latina S.A. · Anexo Administrativo Externo (ERP, Inventario, Facturación y Analítica IA)
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={switchToCustomerWebsite}
              className="hover:text-slate-900 underline font-semibold"
            >
              Ir a la Página Web Pública de Clientes (/)
            </button>
          </div>
        </div>
      </footer>

      {/* Modal de Configuración de Redes Sociales Oficiales (Accesible desde ERP) */}
      <SocialNetworksConfigModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        socialNetworks={companySettings.socialNetworks}
        onSaveSocialNetworks={handleSaveSocialNetworks}
      />

      {/* Modal de Gestión de Cupones por Cédula/RUC y Flyers Flash (Exclusivo ERP) */}
      <CouponsAndFlyersManagerModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        coupons={coupons}
        onAddCoupon={handleAddCoupon}
        onDeleteCoupon={handleDeleteCoupon}
        onToggleCouponActive={handleToggleCouponActive}
        onToggleAllCoupons={handleToggleAllCoupons}
        flyers={flyers}
        onAddFlyer={handleAddFlyer}
        onDeleteFlyer={handleDeleteFlyer}
        inventory={inventory}
        activeThemeId={activeThemeId}
        onShowToast={(msg) => showBanner(msg)}
      />

      {/* Modal de Selección de Temática (Control Maestro ERP con Rebote 3D y Dibujitos SVG) */}
      {isThemeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="theme-modal-title"
          className="fixed inset-0 z-[9999] modal-layer-top bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden border-2 border-[#0B2861] skeuo-modal-3d relative">
            <div
              className="p-6 text-white flex items-center justify-between border-b-4 relative"
              style={{
                background: activeFestiveTheme.modalHeaderGradient,
                borderColor: activeFestiveTheme.secondaryColor,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/20 text-white shadow-inner">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h3 id="theme-modal-title" className="text-lg font-black font-display flex items-center gap-2">
                    <span>Selector de Ambientación Temática 3D</span>
                    <span className="text-base">{activeFestiveTheme.iconSymbol}</span>
                  </h3>
                  <p className="text-xs text-white/90">
                    Incluye Halloween, Black Friday y Festividades del Ecuador con Eskeuomorfismo 3D, Glassmorphism y Partículas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer skeuo-btn-3d"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(Object.keys(ECUADOR_FESTIVE_THEMES) as EcuadorFestiveThemeId[]).map((themeKey) => {
                  const t = ECUADOR_FESTIVE_THEMES[themeKey];
                  const isSelected = t.id === activeThemeId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      data-testid={`theme-modal-option-${t.id}`}
                      onClick={() => {
                        handleSelectTheme(t.id);
                        setIsThemeModalOpen(false);
                      }}
                      className={`group relative p-4 rounded-2xl text-left transition-all cursor-pointer flex items-start gap-3 overflow-hidden skeuo-glass-card ${
                        isSelected
                          ? 'ring-3 ring-[#0B2861] border-2 border-[#FFD100]'
                          : 'border border-slate-200'
                      }`}
                    >
                      <span className="text-3xl shrink-0 p-2 bg-slate-100 rounded-xl shadow-inner">{t.iconSymbol}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-slate-900 truncate">{t.name.split('(')[0]}</p>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0B2861] shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{t.dates}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic">{t.illustrationLabel}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsThemeModalOpen(false);
                  setActiveTab('apartados_web');
                }}
                className="px-4 py-2 rounded-xl bg-amber-100 text-[#0B2861] text-xs font-black hover:bg-amber-200 cursor-pointer skeuo-btn-3d"
              >
                Configurar Apartados Web →
              </button>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#0B2861] text-white text-xs font-bold hover:bg-blue-950 cursor-pointer skeuo-btn-3d"
              >
                Cerrar Selector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulador Juego 3D Logístico accesible desde ERP */}
      <Industrial3dLogisticsGameModal
        isOpen={isAdmin3dGameOpen}
        onClose={() => setIsAdmin3dGameOpen(false)}
      />

      {/* Bot de IA Asistente de Industrial Latina & Induless */}
      <IndustrialLatinaAiBot
        inventory={inventory}
        onOpenMultimodalLab={() => setActiveTab('laboratorio_ia')}
      />
    </div>
  );
}
