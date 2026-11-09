import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  Menu,
  MessageCircle,
  Plus,
  QrCode,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tag,
  User,
  UserCheck,
  Video,
  X,
  Zap,
} from 'lucide-react';
import {
  CompanyBrand,
  CompanySettings,
  CompanySocialNetworks,
  DeliveryGpsLocation,
  DiscountCoupon,
  EcuadorianBank,
  EcuadorFestiveThemeId,
  FlashFlyerPromo,
  InventoryItem,
  Invoice,
  Order,
  PaymentMethod,
  Shipment,
  StorefrontSectionsVisibilityMap,
} from '../types/erp';
import {
  VENDEDORES_DIGITALES_ECUADOR,
} from '../data/seedData';
import {
  buildPdfDocumentStream,
  calculateCartSummary,
  CartItem,
  findShipmentByQuery,
  formatShipmentStatusLabel,
} from '../utils/erpLogic';
import {
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_COUPONS,
  DEFAULT_FLASH_FLYERS,
  resolveCouponDiscount,
  validateCouponForClient,
} from '../utils/ecuadorCommerce';
import {
  ECUADOR_FESTIVE_THEMES,
  getActiveFestiveTheme,
} from '../utils/ecuadorThemes';
import {
  DEFAULT_STOREFRONT_SECTIONS_VISIBILITY,
  computeAdaptiveNavbarMetrics,
  resolveValidStorefrontScreen,
  sanitizeSectionsVisibilityMap,
} from '../utils/storefrontSectionsConfig';
import {
  clearPurchaseAndCartStorage,
  createInitialCheckoutFormState,
  createInitialEmptyCart,
} from '../utils/cleanInitialState';
import {
  triggerFileDownload,
  generateTechnicalSheetExecutiveHtml,
  generateQuotationExecutiveHtml,
  triggerExecutiveDocumentDownload,
} from '../utils/downloadHelper';
import {
  downloadMinimalistCatalogPdf,
  generateMinimalistCatalogExecutiveHtml,
} from '../utils/executiveDocumentGenerator';
import { ProductSchematicSvg } from './ProductSchematicSvg';
import { MaterialCalculatorView } from './MaterialCalculatorView';
import { VirtualEnvironmentDesigner } from './VirtualEnvironmentDesigner';
import { EcuadorianPaymentCheckoutModal } from './EcuadorianPaymentCheckoutModal';
import { DistributorApplicationSection } from './DistributorApplicationSection';
import { CompanyEventsBlogSection } from './CompanyEventsBlogSection';
import { AiDesignTrendsView } from './AiDesignTrendsView';
import { ExecutiveDocumentPreviewModal } from './ExecutiveDocumentPreviewModal';
import { IndustrialLatinaAiBot } from './IndustrialLatinaAiBot';
import { GeminiMultimodalStudioView } from './GeminiMultimodalStudioView';
import { Industrial3dLogisticsGameModal } from './Industrial3dLogisticsGameModal';
import { ThematicAmbientCanvas } from './ThematicAmbientCanvas';
import { ThematicCornerIllustration } from './ThematicCornerIllustration';
import { ThematicCommemorativeBannerArt } from './ThematicCommemorativeBannerArt';
import { DynamicZIndexManager } from './DynamicZIndexManager';
import {
  ERP_INTERACTIVE_LAYER_Z_INDEX,
  MODAL_AND_DRAWER_Z_INDEX,
} from '../utils/thematic3dAmbientLogic';

export type StoreScreen =
  | 'inicio'
  | 'productos'
  | 'calculadora'
  | 'disenador'
  | 'rastreo'
  | 'institucional'
  | 'blogs'
  | 'tendencias'
  | 'laboratorio_ia'
  | 'distribuidores';

interface CustomerStorefrontViewProps {
  inventory: InventoryItem[];
  orders: Order[];
  shipments: Shipment[];
  invoices: Invoice[];
  coupons?: DiscountCoupon[];
  flyers?: FlashFlyerPromo[];
  onCustomerCheckout: (payload: {
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
  }) => Promise<{
    orderCode: string;
    invoiceNumber: string;
    trackingCode: string;
    digitalSellerCode: string;
    total: number;
    digitalSignature: string;
    couponApplied?: boolean;
    couponCodeApplied?: string;
    couponDiscountUsd?: number;
    couponValidationMessage?: string | null;
    isNewCustomer?: boolean;
  }>;
  onVerifyCouponInFirestore?: (
    couponCode: string,
    clientNit: string
  ) => Promise<{
    valid: boolean;
    discountPct: number;
    discountFixedUsd: number;
    coupon?: DiscountCoupon;
    isNewCustomer: boolean;
    message: string;
  }>;
  onSubscribeTrackingAlert: (
    shipment: Shipment,
    channel: 'whatsapp' | 'email',
    destinationContact: string
  ) => void;
  onOpenExternalAdmin: () => void;
  activeThemeId?: EcuadorFestiveThemeId;
  companySettings?: CompanySettings;
  sectionsVisibility?: StorefrontSectionsVisibilityMap;
}

export const CustomerStorefrontView: React.FC<CustomerStorefrontViewProps> = ({
  inventory,
  orders,
  shipments,
  invoices,
  coupons: propCoupons,
  flyers: propFlyers,
  onCustomerCheckout,
  onVerifyCouponInFirestore,
  onSubscribeTrackingAlert,
  onOpenExternalAdmin,
  activeThemeId: propActiveThemeId,
  companySettings: propCompanySettings,
  sectionsVisibility: propSectionsVisibility,
}) => {
  // Screen / Tab Selection State
  const [activeScreen, setActiveScreen] = useState<StoreScreen>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('screen') === 'laboratorio_ia') return 'laboratorio_ia';
    }
    return 'inicio';
  });
  const [is3dGameOpen, setIs3dGameOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('game') === '1' || params.get('autostart') === '1';
    }
    return false;
  });
  const [autoStart3dGame] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('autostart') === '1';
    }
    return false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);

  // Entity & Category Filter State
  const [selectedCompany, setSelectedCompany] = useState<'todas' | CompanyBrand>('todas');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPresentationBySku, setSelectedPresentationBySku] = useState<Record<string, string>>({});

  // Technical Sheet (Ficha Técnica) Modal State
  const [activeTechSheetItem, setActiveTechSheetItem] = useState<InventoryItem | null>(null);

  // Clean any residual cart/purchase storage on initial visit
  useEffect(() => {
    clearPurchaseAndCartStorage();
  }, []);

  // Shopping Cart & Promo State (Strictly empty [] by default, no mock products)
  const [cart, setCart] = useState<CartItem[]>(createInitialEmptyCart);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [executiveModalDoc, setExecutiveModalDoc] = useState<{
    isOpen: boolean;
    title: string;
    html: string;
    filename: string;
  } | null>(null);
  const [couponApplied, setCouponApplied] = useState<boolean>(false);
  const [promoWidgetVisible, setPromoWidgetVisible] = useState<boolean>(true);
  const [copiedCoupon, setCopiedCoupon] = useState<boolean>(false);

  // Quick Paint Calculator State (from the HTML template)
  const [calcM2, setCalcM2] = useState<number>(45);
  const [calcProductType, setCalcProductType] = useState<string>('duralin');
  const [calcGallonsResult, setCalcGallonsResult] = useState<number | null>(null);
  const [calculatorTabMode, setCalculatorTabMode] = useState<'rapido' | 'avanzado'>('rapido');

  // Checkout Form State (All fields strictly empty "" by default, no sample customer or order data)
  const initialCleanForm = useMemo(() => createInitialCheckoutFormState(), []);
  const [clientName, setClientName] = useState<string>(initialCleanForm.clientName);
  const [clientNit, setClientNit] = useState<string>(initialCleanForm.clientNit);
  const [cityEcuador, setCityEcuador] = useState<string>(initialCleanForm.cityEcuador);
  const [destinationAddress, setDestinationAddress] = useState<string>(
    initialCleanForm.destinationAddress
  );
  const [clientEmail, setClientEmail] = useState<string>(initialCleanForm.clientEmail);
  const [clientWhatsapp, setClientWhatsapp] = useState<string>(initialCleanForm.clientWhatsapp);
  const [digitalSellerCode, setDigitalSellerCode] = useState<string>(
    initialCleanForm.digitalSellerCode
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tarjeta_corporativa');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState<boolean>(false);
  const [checkoutReceipt, setCheckoutReceipt] = useState<{
    orderCode: string;
    invoiceNumber: string;
    trackingCode: string;
    digitalSellerCode: string;
    total: number;
    digitalSignature: string;
  } | null>(null);

  // Tracking Section State (Strictly empty "" by default, no sample tracking code)
  const [trackingSearch, setTrackingSearch] = useState<string>(initialCleanForm.trackingSearch);
  const [alertContact, setAlertContact] = useState<string>(initialCleanForm.alertContact);
  const [alertChannel, setAlertChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [storefrontToast, setStorefrontToast] = useState<string | null>(null);

  // Help & Support Modal State
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);

  // Ecuadorian Festive Themes State (Driven strictly from ERP Master Control)
  const activeThemeId = propActiveThemeId || 'quito';
  const activeFestiveTheme = useMemo(() => getActiveFestiveTheme(activeThemeId), [activeThemeId]);

  // Storefront Sections Visibility (Driven from ERP Master Control)
  const effectiveSections = useMemo(
    () => sanitizeSectionsVisibilityMap(propSectionsVisibility || DEFAULT_STOREFRONT_SECTIONS_VISIBILITY),
    [propSectionsVisibility]
  );
  const navMetrics = useMemo(
    () => computeAdaptiveNavbarMetrics(effectiveSections),
    [effectiveSections]
  );

  useEffect(() => {
    const validScreen = resolveValidStorefrontScreen(activeScreen, effectiveSections);
    if (validScreen !== activeScreen) {
      setActiveScreen(validScreen);
    }
  }, [activeScreen, effectiveSections]);

  // Company Settings & Social Networks (Driven strictly from ERP Master Control)
  const companySettings = propCompanySettings || DEFAULT_COMPANY_SETTINGS;

  // Dynamic Coupons & Flash Flyers State (Configured solely inside ERP, displayed here for customers)
  const coupons = propCoupons || DEFAULT_COUPONS;
  const flyers = propFlyers || DEFAULT_FLASH_FLYERS;

  // Checkout Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setStorefrontToast(msg);
  };

  // Validate coupon against client's Cédula/RUC and existing orders
  const cartCouponValidation = useMemo(
    () => validateCouponForClient('LATINA26', clientNit, coupons, orders),
    [clientNit, coupons, orders]
  );

  // Cart summary with 10% coupon discount only if LATINA26 is applied AND Cédula/RUC is verified as a new customer
  const cartSummary = useMemo(
    () =>
      calculateCartSummary(
        cart,
        couponApplied && cartCouponValidation.valid ? cartCouponValidation.discountPct || 10 : 0
      ),
    [cart, couponApplied, cartCouponValidation]
  );

  // Filtered Categories & Products
  const categories = useMemo(() => {
    const scoped =
      selectedCompany === 'todas'
        ? inventory
        : inventory.filter((i) => i.company === selectedCompany);
    const unique = Array.from(new Set(scoped.map((i) => i.category)));
    return ['Todas', ...unique];
  }, [inventory, selectedCompany]);

  const filteredProducts = useMemo(() => {
    return inventory.filter((item) => {
      const matchesCompany =
        selectedCompany === 'todas' || item.company === selectedCompany;
      const matchesCat =
        selectedCategory === 'Todas' || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q);
      return matchesCompany && matchesCat && matchesQuery;
    });
  }, [inventory, selectedCompany, selectedCategory, searchQuery]);

  // Featured Highlight Products for the Landing Page
  const featuredProducts = useMemo(() => {
    return [
      {
        id: 'feat_duralin',
        sku: 'LAT-LVA-01',
        name: 'Duralín Premium Forte',
        badge: 'Más vendido',
        badgeColor: 'bg-[#0B2861]',
        price: 24.99,
        unit: 'galón',
        image:
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        description:
          'Máxima resistencia para exteriores e interiores. Acabado mate perfecto y altamente lavable formulado para clima tropical.',
        yieldCoverage: '25 m² por galón',
        normative: 'NTE INEN 2090 Tipo 1',
        company: 'industrial_latina' as CompanyBrand,
      },
      {
        id: 'feat_satinada',
        sku: 'LAT-SAT-01',
        name: 'Satinada Tipo 1',
        badge: 'Lavable',
        badgeColor: 'bg-[#E3000F]',
        price: 28.5,
        unit: 'galón',
        image:
          'https://images.unsplash.com/photo-1600121848594-d8644e57abab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        description:
          'Acabado sedoso y elegante. Especialmente formulada para interiores, fácil de limpiar sin perder brillo ni tono.',
        yieldCoverage: '20 m² por galón',
        normative: 'NTE INEN 2090 Tipo 1',
        company: 'industrial_latina' as CompanyBrand,
      },
      {
        id: 'feat_esmalte',
        sku: 'LAT-ESM-01',
        name: 'Esmalte Anticorrosivo',
        badge: 'Protección Total',
        badgeColor: 'bg-emerald-700',
        price: 19.99,
        unit: 'galón',
        image:
          'https://images.unsplash.com/photo-1595435345917-8e6844de0d7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        description:
          'Protección 2 en 1 para metales, rejas y madera. Secado rápido y barrera activa contra el óxido en alta humedad.',
        yieldCoverage: '18 m² por galón',
        normative: 'NTE INEN 1006',
        company: 'industrial_latina' as CompanyBrand,
      },
      {
        id: 'feat_led_panel',
        sku: 'PRL18E',
        name: 'Panel LED 18W Induless',
        badge: 'Ahorro 85%',
        badgeColor: 'bg-[#D8235A]',
        price: 5.4,
        unit: 'unidad',
        image:
          'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        description:
          'Iluminación empotrable de alta eficiencia. Luz blanca 6500K y cálida 3000K, driver integrado con protección contra picos.',
        yieldCoverage: '1500 lúmenes',
        normative: 'NTE INEN 3008',
        company: 'induless' as CompanyBrand,
      },
    ];
  }, []);

  // Quick Paint Calculator Handler (from HTML)
  const handleCalculateQuickPaint = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isNaN(calcM2) || calcM2 <= 0) return;

    let yieldPerGallon = 20;
    if (calcProductType === 'duralin') yieldPerGallon = 25;
    if (calcProductType === 'satinada') yieldPerGallon = 20;
    if (calcProductType === 'latex') yieldPerGallon = 15;
    if (calcProductType === 'esmalte') yieldPerGallon = 18;

    const gallonsNeeded = Math.ceil(calcM2 / yieldPerGallon);
    setCalcGallonsResult(gallonsNeeded);
  };

  const handleAddCalculatedQuickToCart = () => {
    if (!calcGallonsResult || calcGallonsResult <= 0) return;

    let targetSku = 'LAT-LVA-01';
    let targetName = 'Duralín Premium Forte Industrial Latina';
    let targetPrice = 24.99;

    if (calcProductType === 'satinada') {
      targetSku = 'LAT-SAT-01';
      targetName = 'Pintura Satinada Tipo 1 Industrial Latina';
      targetPrice = 28.5;
    } else if (calcProductType === 'latex') {
      targetSku = 'LAT-LVA-01';
      targetName = 'Látex Estándar LVA Industrial Latina';
      targetPrice = 14.5;
    } else if (calcProductType === 'esmalte') {
      targetSku = 'LAT-ESM-01';
      targetName = 'Esmalte Sintético Anticorrosivo Industrial Latina';
      targetPrice = 19.99;
    }

    setCart((prev) => {
      const existing = prev.find((c) => c.sku === targetSku);
      if (existing) {
        return prev.map((c) =>
          c.sku === targetSku
            ? { ...c, quantity: c.quantity + calcGallonsResult }
            : c
        );
      }
      return [
        ...prev,
        {
          sku: targetSku,
          name: targetName,
          category: 'Pinturas Arquitectónicas',
          unitPrice: targetPrice,
          unit: 'Galón',
          quantity: calcGallonsResult,
          maxStock: 250,
          company: 'industrial_latina',
          presentationSelected: `Cálculo ${calcM2} m² (${calcGallonsResult} galones recomendados)`,
        },
      ];
    });

    setIsCartOpen(true);
    showToast(
      `Agregado al carrito: ${calcGallonsResult} galones de ${targetName} para cubrir ${calcM2} m².`
    );
  };

  // Add Item to Cart Helper with presentation and price override
  const handleAddToCart = (
    item: InventoryItem | (typeof featuredProducts)[0],
    qtyToAdd = 1,
    customPresentation?: string,
    unitPriceOverride?: number
  ) => {
    const chosenPres =
      customPresentation ||
      ('technicalSheet' in item && item.technicalSheet?.presentationOptions?.[0]) ||
      item.unit;

    const basePrice = 'unitPrice' in item ? item.unitPrice : item.price;
    const finalPrice = unitPriceOverride !== undefined ? unitPriceOverride : basePrice;
    const maxStock = 'stock' in item ? item.stock : 100;
    const category = 'category' in item ? item.category : 'Línea Destacada';

    setCart((prev) => {
      const existing = prev.find(
        (c) => c.sku === item.sku && c.presentationSelected === chosenPres
      );
      if (existing) {
        return prev.map((c) =>
          c.sku === item.sku && c.presentationSelected === chosenPres
            ? {
                ...c,
                quantity: c.quantity + qtyToAdd,
                unitPrice: finalPrice,
              }
            : c
        );
      }
      return [
        ...prev,
        {
          sku: item.sku,
          name: item.name,
          category,
          unitPrice: finalPrice,
          unit: item.unit,
          quantity: qtyToAdd,
          maxStock,
          company: item.company,
          presentationSelected: chosenPres,
        },
      ];
    });

    showToast(
      `Agregado al carrito: ${qtyToAdd}x ${item.name} · ${chosenPres} ($${finalPrice.toFixed(2)})`
    );
  };

  const handleUpdateCartQty = (sku: string, nextQty: number) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((c) => c.sku !== sku));
      return;
    }
    setCart((prev) =>
      prev.map((c) =>
        c.sku === sku ? { ...c, quantity: Math.min(c.maxStock, nextQty) } : c
      )
    );
  };

  // Copy Promo Coupon
  const handleCopyCoupon = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('LATINA26').catch(() => {});
    }
    setCopiedCoupon(true);
    setCouponApplied(true);
    if (cartCouponValidation.valid) {
      showToast(cartCouponValidation.message);
    } else {
      showToast(
        `Cupón LATINA26 copiado. Nota: ${cartCouponValidation.message}`
      );
    }
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const handleApplyCouponDirectly = () => {
    setCouponApplied(true);
    setIsCartOpen(true);
    if (cartCouponValidation.valid) {
      showToast(cartCouponValidation.message);
    } else {
      showToast(cartCouponValidation.message);
    }
  };

  const handleGenerateRandomSellerCode = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 899);
    const newCode = `VD-EC-${randomSuffix}`;
    setDigitalSellerCode(newCode);
    showToast(`Nuevo Código de Vendedor Digital asignado: ${newCode}`);
  };

  const handleDownloadTechnicalSheetPdf = (item: InventoryItem) => {
    const docHtml = generateTechnicalSheetExecutiveHtml(item);
    const filename = `ficha_tecnica_${item.sku.toLowerCase()}`;
    setExecutiveModalDoc({
      isOpen: true,
      title: `Ficha Técnica Oficial · ${item.sku} - ${item.name}`,
      html: docHtml,
      filename,
    });
    triggerExecutiveDocumentDownload(docHtml, filename);
    showToast(`¡Ficha Técnica Oficial generada con logotipos de empresa: ${item.sku}!`);
  };

  const handleDownloadCartQuotation = () => {
    if (cart.length === 0) {
      showToast('Agregue productos al carrito antes de generar la cotización.');
      return;
    }
    const docHtml = generateQuotationExecutiveHtml({
      orderCode: `COT-${Date.now().toString().slice(-6)}`,
      clientName: clientName || 'Cliente Corporativo',
      clientNit: clientNit || '0992847102001',
      clientEmail,
      clientWhatsapp,
      destinationAddress,
      cityEcuador,
      digitalSellerCode,
      items: cart.map((c) => ({
        sku: c.sku,
        name: c.name,
        presentationSelected: c.presentationSelected,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        company: c.company,
      })),
      subtotal: cartSummary.subtotal,
      volumeDiscount: cartSummary.volumeDiscount,
      couponDiscount: cartSummary.couponDiscount,
      taxableBase: cartSummary.taxableBase,
      taxAmount: cartSummary.taxAmount,
      total: cartSummary.total,
    });
    const filename = `cotizacion_oficial_${clientNit || 'cliente'}`;
    setExecutiveModalDoc({
      isOpen: true,
      title: 'Cotización / Proforma Comercial Oficial con Membrete y Cuentas Bancarias',
      html: docHtml,
      filename,
    });
    triggerExecutiveDocumentDownload(docHtml, filename);
    showToast('¡Cotización Oficial generada con membrete ejecutivo y cuentas bancarias!');
  };

  const resetPurchaseFormFields = () => {
    const clean = createInitialCheckoutFormState();
    setClientName(clean.clientName);
    setClientNit(clean.clientNit);
    setCityEcuador(clean.cityEcuador);
    setDestinationAddress(clean.destinationAddress);
    setClientEmail(clean.clientEmail);
    setClientWhatsapp(clean.clientWhatsapp);
    setDigitalSellerCode(clean.digitalSellerCode);
    setCouponApplied(false);
  };

  const handleCancelCustomerOrder = () => {
    setCart(createInitialEmptyCart());
    resetPurchaseFormFields();
    setCheckoutReceipt(null);
    clearPurchaseAndCartStorage();
    showToast('Pedido cancelado: carrito vaciado y datos de compra limpiados.');
  };

  const handleSubmitCustomerCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setCheckoutSubmitting(true);
    try {
      const receipt = await onCustomerCheckout({
        clientName,
        clientNit,
        clientEmail,
        clientWhatsapp,
        destinationAddress: cityEcuador
          ? `${destinationAddress} (${cityEcuador})`
          : destinationAddress,
        cityEcuador,
        digitalSellerCode: digitalSellerCode.trim() || 'VD-EC-101',
        paymentMethod,
        items: cart,
        couponCodeApplied: couponApplied ? 'LATINA26' : undefined,
        couponDiscountUsd: couponApplied ? cartSummary.couponDiscount : 0,
      });
      setCheckoutReceipt(receipt);
      setTrackingSearch(receipt.trackingCode);
      setCart(createInitialEmptyCart());
      resetPurchaseFormFields();
      clearPurchaseAndCartStorage();
      if (couponApplied && receipt.couponValidationMessage) {
        showToast(
          `Pedido ${receipt.orderCode} procesado · ${receipt.couponValidationMessage}`
        );
      } else {
        showToast(
          `Pedido ${receipt.orderCode} transmitido al Administrador con Código de Vendedor Digital ${receipt.digitalSellerCode}.`
        );
      }
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const matchedShipment = useMemo(() => {
    if (!trackingSearch.trim()) return null;
    return findShipmentByQuery(shipments, trackingSearch) || null;
  }, [shipments, trackingSearch]);

  const navigateTo = (screen: StoreScreen) => {
    setActiveScreen(screen);
    setMobileMenuOpen(false);
    setIsCategoryDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans text-gray-800 antialiased bg-gray-50 relative"
      style={
        {
          '--theme-glow-rgba': activeFestiveTheme.glowColorRgba,
          '--theme-bevel-rgba': activeFestiveTheme.bevelHighlightRgba,
        } as React.CSSProperties
      }
    >
      {/* Dynamic Z-Index Layer Manager (Ambient 3D = 10, ERP/Storefront Interactive Bars & Modals = 9999) */}
      <DynamicZIndexManager
        activeTrigger={`${activeScreen}-${isCartOpen}-${helpModalOpen}-${Boolean(activeTechSheetItem)}`}
      />

      {/* Interactive Ambient Thematic Particle Layer (pointer-events: none, z-index: 10) */}
      <ThematicAmbientCanvas activeThemeId={activeThemeId} />

      {/* 1. TOP CORPORATE UTILITY BAR (Without Top Active-Theme Strip) */}
      <header
        id="main-header"
        data-z-layer="erp-bar"
        style={{ zIndex: ERP_INTERACTIVE_LAYER_Z_INDEX }}
        className="erp-interactive-bar sticky top-0 w-full z-[9999] transition-all duration-300 shadow-sm"
      >
        <div
          className={`text-white py-2 px-4 sm:px-6 lg:px-8 border-b-2 bg-gradient-to-r ${activeFestiveTheme.bannerGradient} transition-all duration-300`}
          style={{ borderBottomColor: activeFestiveTheme.secondaryColor }}
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center text-xs sm:text-sm">
            {/* Social Icons configured */}
            <div className="flex space-x-3 items-center">
              {companySettings.socialNetworks.facebook && (
                <a
                  href={companySettings.socialNetworks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="hover:text-[#FFD100] transition-colors"
                  title="Facebook Industrial Latina"
                >
                  <i className="fab fa-facebook-f text-sm sm:text-base"></i>
                </a>
              )}
              {companySettings.socialNetworks.instagram && (
                <a
                  href={companySettings.socialNetworks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="hover:text-[#FFD100] transition-colors"
                  title="Instagram Industrial Latina"
                >
                  <i className="fab fa-instagram text-sm sm:text-base"></i>
                </a>
              )}
              {companySettings.socialNetworks.tiktok && (
                <a
                  href={companySettings.socialNetworks.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok"
                  className="hover:text-[#FFD100] transition-colors"
                  title="TikTok Oficial"
                >
                  <i className="fab fa-tiktok text-sm"></i>
                </a>
              )}
              {companySettings.socialNetworks.youtube && (
                <a
                  href={companySettings.socialNetworks.youtube}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="hover:text-[#FFD100] transition-colors"
                  title="YouTube Industrial Latina"
                >
                  <i className="fab fa-youtube text-sm sm:text-base"></i>
                </a>
              )}
              {companySettings.socialNetworks.whatsapp && (
                <a
                  href={`https://wa.me/${companySettings.socialNetworks.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="hover:text-emerald-400 transition-colors"
                  title="WhatsApp Corporativo"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                </a>
              )}

              <span className="hidden md:inline text-blue-300/60">|</span>
              <span className="hidden md:inline text-[11px] text-blue-100 font-medium">
                Vía a Daule Km 8.5 &amp; Mapasingue Este · Guayaquil
              </span>
            </div>

            {/* Help, User, Cart, Admin Switch */}
            <div className="flex space-x-3 sm:space-x-5 items-center">
              <button
                type="button"
                onClick={() => setHelpModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 hover:text-[#FFD100] transition-colors font-medium cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Ayuda</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  showToast(
                    `Cliente Corporativo: ${clientName} · RUC: ${clientNit} (SRI Ecuador)`
                  );
                }}
                aria-label="Perfil de usuario"
                className="hover:text-[#FFD100] transition-colors flex items-center gap-1 cursor-pointer"
                title={`RUC: ${clientNit}`}
              >
                <User className="w-4 h-4" />
                <span className="hidden lg:inline text-xs font-semibold text-blue-200">
                  {clientName.split(' ')[0]}
                </span>
              </button>

              {/* Shopping Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                aria-label="Abrir carrito de compras"
                className="flex items-center space-x-2 hover:text-[#FFD100] transition-colors cursor-pointer group"
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-[#FFD100] transition-colors" />
                  <span className="absolute -top-2 -right-2 bg-[#E3000F] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                    {cartSummary.itemCount}
                  </span>
                </div>
                <span className="font-bold hidden sm:inline-block font-mono text-[#FFD100]">
                  ${cartSummary.total.toFixed(2)}
                </span>
              </button>

              {/* Botón de Acceso ERP: Botón Único de Usuario en 3D */}
              <button
                type="button"
                data-testid="storefront-erp-access-btn"
                onClick={onOpenExternalAdmin}
                className="relative group inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-white font-bold transition-all duration-200 cursor-pointer select-none
                bg-gradient-to-b from-[#1E4E9E] via-[#0B2861] to-[#04122C]
                border border-[#60A5FA]/40 hover:border-[#FFD100]
                shadow-[0_2px_5px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.45),0_1px_2px_rgba(0,0,0,0.2)]
                hover:shadow-[0_3px_10px_rgba(255,209,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.7)]
                active:translate-y-0.5 active:shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(0,0,0,0.4)]"
                title="Acceso ERP · Panel de Administración"
                aria-label="Acceso ERP - Usuario Administrador"
              >
                <span className="absolute inset-x-0.5 top-0 h-[40%] bg-gradient-to-b from-white/35 to-transparent rounded-t-md pointer-events-none" />
                <span className="relative flex items-center justify-center">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-b from-[#FFE066] via-[#FFD100] to-[#D97706] p-[1.5px] shadow-[0_2px_4px_rgba(0,0,0,0.45)] flex items-center justify-center">
                    <span className="w-full h-full rounded-full bg-[#0B2861] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#FFD100] drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]" />
                    </span>
                  </span>
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 border border-white shadow-xs animate-pulse" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. MAIN FLOATING 3D GLASSMORPHIC NAV BAR — Coupled Dynamically to Active ERP Sections */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-[9999]">
          <div
            data-testid="storefront-category-bar-hd"
            data-z-layer="erp-bar"
            style={{ zIndex: ERP_INTERACTIVE_LAYER_Z_INDEX }}
            className="skeuo-glass-card category-bar-hd erp-interactive-bar rounded-b-2xl sm:rounded-2xl mt-0 sm:-mt-2 flex justify-between items-center gap-3 px-3 sm:px-5 py-2 sm:py-2.5 min-h-[72px] sm:min-h-[84px]"
          >
            {/* Left Logo — High-Definition Protected 3D Pedestal for Industrial Latina & Induless */}
            <div className="shrink-0 flex items-center">
              <button
                type="button"
                onClick={() => navigateTo(resolveValidStorefrontScreen('inicio', effectiveSections))}
                aria-label="Ir a inicio"
                data-testid="brand-logos-hd-pedestal"
                className="logo-pedestal-3d flex items-center gap-2.5 sm:gap-4 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl cursor-pointer shrink-0"
              >
                <img
                  src="/assets/aistudio/Industrial_Latina_2_f5b18e35.png"
                  alt="Industrial Latina"
                  fetchPriority="high"
                  decoding="async"
                  className="h-10 xs:h-11 sm:h-13 md:h-15 w-auto object-contain shrink-0 logo-hd-render"
                />
                <span className="h-7 sm:h-10 w-0.5 bg-slate-200 rounded-full shrink-0" aria-hidden="true" />
                <img
                  src="/assets/aistudio/Induless_2_fe52db1f.png"
                  alt="Induless"
                  fetchPriority="high"
                  decoding="async"
                  className="h-8 xs:h-9 sm:h-11 md:h-12 w-auto object-contain shrink-0 logo-hd-render"
                />
              </button>
            </div>

            {/* Desktop Menu — Dynamically Coupled to Active Sections in ERP */}
            <nav
              aria-label="Navegación principal acoplada"
              data-testid="storefront-coupled-desktop-nav"
              className={`hidden lg:flex flex-1 flex-wrap items-center justify-end ${navMetrics.containerGapClass} pr-1`}
            >
              {effectiveSections.inicio && (
                <button
                  type="button"
                  data-testid="nav-section-inicio"
                  onClick={() => navigateTo('inicio')}
                  className={`font-extrabold ${navMetrics.fontSizeClass} ${navMetrics.itemPaddingClass} tracking-wider uppercase relative group cursor-pointer transition-colors rounded-lg ${
                    activeScreen === 'inicio' ? 'text-[#E3000F] bg-red-50/70' : 'text-gray-800 hover:text-[#E3000F]'
                  }`}
                >
                  INICIO
                  <span
                    className={`absolute bottom-0.5 left-2 right-2 h-0.5 bg-[#E3000F] transform transition-transform origin-left ${
                      activeScreen === 'inicio' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  ></span>
                </button>
              )}

              {/* Categorías Dropdown */}
              {effectiveSections.productos && (
                <div className="relative">
                  <button
                    type="button"
                    data-testid="nav-section-productos"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className={`font-extrabold ${navMetrics.fontSizeClass} ${navMetrics.itemPaddingClass} tracking-wider uppercase transition-colors flex items-center gap-1 group relative cursor-pointer rounded-lg ${
                      activeScreen === 'productos' ? 'text-[#E3000F] bg-red-50/70' : 'text-gray-800 hover:text-[#E3000F]'
                    }`}
                  >
                    CATEGORÍAS <ChevronDown className="w-3.5 h-3.5 mt-0.5" />
                    <span
                      className={`absolute bottom-0.5 left-2 right-2 h-0.5 bg-[#E3000F] transform transition-transform origin-left ${
                        activeScreen === 'productos' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    ></span>
                  </button>

                  {isCategoryDropdownOpen && (
                    <div
                      className="absolute left-0 mt-2 w-64 rounded-2xl py-2 z-[9999] modal-layer-top skeuo-modal-3d bg-white border border-slate-200"
                      style={{ zIndex: MODAL_AND_DRAWER_Z_INDEX }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCompany('todas');
                          setSelectedCategory('Todas');
                          navigateTo('productos');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-gray-800 hover:bg-gray-50 hover:text-[#0B2861] flex items-center justify-between"
                      >
                        <span>Ver Todo el Catálogo</span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {inventory.length}
                        </span>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCompany('industrial_latina');
                          setSelectedCategory('Todas');
                          navigateTo('productos');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-[#0B2861] hover:bg-blue-50 flex items-center justify-between"
                      >
                        <span>Línea Industrial Latina</span>
                        <span className="text-[10px] bg-[#0B2861] text-white px-2 py-0.5 rounded-full">
                          Pinturas &amp; Masillas
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCompany('induless');
                          setSelectedCategory('Todas');
                          navigateTo('productos');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-[#D8235A] hover:bg-pink-50 flex items-center justify-between"
                      >
                        <span>Línea Induless Ecuador</span>
                        <span className="text-[10px] bg-[#D8235A] text-white px-2 py-0.5 rounded-full">
                          LED &amp; Ferretería
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {effectiveSections.calculadora && (
                <button
                  type="button"
                  data-testid="nav-section-calculadora"
                  onClick={() => navigateTo('calculadora')}
                  className={`font-extrabold ${navMetrics.fontSizeClass} ${navMetrics.itemPaddingClass} tracking-wider uppercase transition-colors relative group cursor-pointer rounded-lg ${
                    activeScreen === 'calculadora' ? 'text-[#E3000F] bg-red-50/70' : 'text-gray-800 hover:text-[#E3000F]'
                  }`}
                >
                  CALCULADORA
                  <span
                    className={`absolute bottom-0.5 left-2 right-2 h-0.5 bg-[#E3000F] transform transition-transform origin-left ${
                      activeScreen === 'calculadora' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  ></span>
                </button>
              )}

              {effectiveSections.disenador && (
                <button
                  type="button"
                  data-testid="nav-section-disenador"
                  onClick={() => navigateTo('disenador')}
                  className={`font-extrabold ${navMetrics.fontSizeClass} ${navMetrics.itemPaddingClass} tracking-wider uppercase transition-colors relative group cursor-pointer flex items-center gap-1 rounded-lg ${
                    activeScreen === 'disenador' ? 'text-[#E3000F] bg-red-50/70' : 'text-gray-800 hover:text-[#E3000F]'
                  }`}
                >
                  <span>DISEÑADOR 3D</span>
                  <span className="px-1.5 py-0.2 bg-[#FFD100] text-[#0B2861] text-[9px] font-black rounded">
                    3D
                  </span>
                  <span
                    className={`absolute bottom-0.5 left-2 right-2 h-0.5 bg-[#E3000F] transform transition-transform origin-left ${
                      activeScreen === 'disenador' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  ></span>
                </button>
              )}

              {effectiveSections.rastreo && (
                <button
                  type="button"
                  data-testid="nav-section-rastreo"
                  onClick={() => navigateTo('rastreo')}
                  className={`font-extrabold ${navMetrics.fontSizeClass} ${navMetrics.itemPaddingClass} tracking-wider uppercase transition-colors relative group cursor-pointer rounded-lg ${
                    activeScreen === 'rastreo' ? 'text-[#E3000F] bg-red-50/70' : 'text-gray-800 hover:text-[#E3000F]'
                  }`}
                >
                  RASTREO
                  <span
                    className={`absolute bottom-0.5 left-2 right-2 h-0.5 bg-[#E3000F] transform transition-transform origin-left ${
                      activeScreen === 'rastreo' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  ></span>
                </button>
              )}

              {effectiveSections.distribuidores && (
                <button
                  type="button"
                  data-testid="nav-section-distribuidores"
                  onClick={() => navigateTo('distribuidores')}
                  className={`font-extrabold ${navMetrics.fontSizeClass} ${navMetrics.itemPaddingClass} tracking-wider uppercase transition-colors relative group cursor-pointer flex items-center gap-1 rounded-lg ${
                    activeScreen === 'distribuidores' ? 'text-[#E3000F] bg-red-50/70' : 'text-gray-800 hover:text-[#E3000F]'
                  }`}
                >
                  <span>DISTRIBUIDORES</span>
                  <span className="px-1 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded">
                    RED
                  </span>
                  <span
                    className={`absolute bottom-0.5 left-2 right-2 h-0.5 bg-[#E3000F] transform transition-transform origin-left ${
                      activeScreen === 'distribuidores' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  ></span>
                </button>
              )}

              {effectiveSections.institucional && (
                <button
                  type="button"
                  data-testid="nav-section-institucional"
                  onClick={() => navigateTo('institucional')}
                  className={`font-extrabold ${navMetrics.fontSizeClass} ${navMetrics.itemPaddingClass} tracking-wider uppercase transition-colors relative group cursor-pointer rounded-lg ${
                    activeScreen === 'institucional' ? 'text-[#E3000F] bg-red-50/70' : 'text-gray-800 hover:text-[#E3000F]'
                  }`}
                >
                  INSTITUCIONAL
                  <span
                    className={`absolute bottom-0.5 left-2 right-2 h-0.5 bg-[#E3000F] transform transition-transform origin-left ${
                      activeScreen === 'institucional' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  ></span>
                </button>
              )}

              {effectiveSections.blogs && (
                <button
                  type="button"
                  data-testid="nav-section-blogs"
                  onClick={() => navigateTo('blogs')}
                  className={`font-extrabold ${navMetrics.fontSizeClass} ${navMetrics.itemPaddingClass} tracking-wider uppercase transition-colors relative group cursor-pointer rounded-lg ${
                    activeScreen === 'blogs' ? 'text-[#E3000F] bg-red-50/70' : 'text-gray-800 hover:text-[#E3000F]'
                  }`}
                >
                  BLOGS &amp; EVENTOS
                  <span
                    className={`absolute bottom-0.5 left-2 right-2 h-0.5 bg-[#E3000F] transform transition-transform origin-left ${
                      activeScreen === 'blogs' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  ></span>
                </button>
              )}

              {effectiveSections.tendencias && (
                <button
                  type="button"
                  data-testid="nav-section-tendencias"
                  onClick={() => navigateTo('tendencias')}
                  className={`font-extrabold ${navMetrics.fontSizeClass} ${navMetrics.itemPaddingClass} tracking-wider uppercase transition-colors relative group cursor-pointer flex items-center gap-1 rounded-lg ${
                    activeScreen === 'tendencias' ? 'text-[#E3000F] bg-red-50/70' : 'text-gray-800 hover:text-[#E3000F]'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-[#FFD100]" />
                  <span>TENDENCIAS IA</span>
                  <span
                    className={`absolute bottom-0.5 left-2 right-2 h-0.5 bg-[#E3000F] transform transition-transform origin-left ${
                      activeScreen === 'tendencias' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  ></span>
                </button>
              )}

              {effectiveSections.laboratorio_ia && (
                <button
                  type="button"
                  data-testid="nav-laboratorio-ia-btn"
                  onClick={() => navigateTo('laboratorio_ia')}
                  className={`font-extrabold ${navMetrics.fontSizeClass} ${navMetrics.itemPaddingClass} tracking-wider uppercase transition-colors relative group cursor-pointer flex items-center gap-1 rounded-lg ${
                    activeScreen === 'laboratorio_ia'
                      ? 'text-[#E3000F] bg-red-50/70'
                      : 'text-[#0B2861] hover:text-[#E3000F]'
                  }`}
                >
                  <span>LABORATORIO &amp; IA</span>
                  <span className="px-1.5 py-0.2 bg-[#0B2861] text-[#FFD100] text-[9px] font-black rounded">
                    LAB
                  </span>
                  <span
                    className={`absolute bottom-0.5 left-2 right-2 h-0.5 bg-[#E3000F] transform transition-transform origin-left ${
                      activeScreen === 'laboratorio_ia' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  ></span>
                </button>
              )}

              {effectiveSections.juego_3d && (
                <button
                  type="button"
                  data-testid="nav-3d-game-btn"
                  onClick={() => setIs3dGameOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#FFD100] hover:bg-yellow-400 text-[#0B2861] font-black text-[11px] uppercase tracking-wider cursor-pointer skeuo-btn-3d"
                >
                  JUEGO 3D
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Abrir menú móvil"
                className="text-gray-800 hover:text-[#E3000F] p-2 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown — Coupled to Active Sections */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden bg-white shadow-2xl absolute w-full left-0 top-full border-b border-gray-200 skeuo-modal-3d z-[9999] modal-layer-top max-h-[85vh] overflow-y-auto"
            style={{ zIndex: MODAL_AND_DRAWER_Z_INDEX }}
          >
            {/* Mobile Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-gray-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigateTo('productos');
                  setMobileMenuOpen(false);
                }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Buscar pinturas, empastes, morteros, LED..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B2861] shadow-xs"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </form>
            </div>

            {/* Mobile Nav Links Filtered by Active Sections */}
            <div className="px-4 py-3 divide-y divide-gray-100 text-xs font-bold">
              {effectiveSections.inicio && (
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('inicio');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-3 px-3 flex items-center justify-between rounded-lg transition-colors ${
                    activeScreen === 'inicio' ? 'bg-red-50 text-[#E3000F]' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="uppercase tracking-wider">Inicio</span>
                  {activeScreen === 'inicio' && <CheckCircle2 className="w-4 h-4 text-[#E3000F]" />}
                </button>
              )}

              {effectiveSections.productos && (
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('productos');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-3 px-3 flex items-center justify-between rounded-lg transition-colors ${
                    activeScreen === 'productos' ? 'bg-red-50 text-[#E3000F]' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="uppercase tracking-wider">Catálogo y Categorías</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                    {inventory.length} items
                  </span>
                </button>
              )}

              {effectiveSections.calculadora && (
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('calculadora');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-3 px-3 flex items-center justify-between rounded-lg transition-colors ${
                    activeScreen === 'calculadora' ? 'bg-red-50 text-[#E3000F]' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="uppercase tracking-wider flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#0B2861]" /> Calculadora de Pintura
                  </span>
                  <span className="text-[10px] bg-blue-100 text-[#0B2861] px-2 py-0.5 rounded-full">
                    M² a Galón
                  </span>
                </button>
              )}

              {effectiveSections.disenador && (
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('disenador');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-3 px-3 flex items-center justify-between rounded-lg transition-colors ${
                    activeScreen === 'disenador' ? 'bg-red-50 text-[#E3000F]' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FFD100]" /> Diseñador 3D Fotorrealista
                  </span>
                  <span className="text-[10px] bg-[#FFD100] text-[#0B2861] px-2 py-0.5 rounded-full font-black">
                    6 Dioramas
                  </span>
                </button>
              )}

              {effectiveSections.rastreo && (
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('rastreo');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-3 px-3 flex items-center justify-between rounded-lg transition-colors ${
                    activeScreen === 'rastreo' ? 'bg-red-50 text-[#E3000F]' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="uppercase tracking-wider">Rastreo de Envíos</span>
                  <span className="text-[10px] text-gray-400">Guía SRI</span>
                </button>
              )}

              {effectiveSections.distribuidores && (
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('distribuidores');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-3 px-3 flex items-center justify-between rounded-lg transition-colors ${
                    activeScreen === 'distribuidores' ? 'bg-emerald-50 text-emerald-800' : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <span className="uppercase tracking-wider font-extrabold">Quiero Ser Distribuidor</span>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    Mayoristas
                  </span>
                </button>
              )}

              {effectiveSections.institucional && (
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('institucional');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-3 px-3 flex items-center justify-between rounded-lg transition-colors ${
                    activeScreen === 'institucional' ? 'bg-red-50 text-[#E3000F]' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="uppercase tracking-wider">Institucional &amp; Plantas</span>
                </button>
              )}

              {effectiveSections.blogs && (
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('blogs');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-3 px-3 flex items-center justify-between rounded-lg transition-colors ${
                    activeScreen === 'blogs' ? 'bg-red-50 text-[#E3000F]' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="uppercase tracking-wider">Blogs &amp; Eventos</span>
                </button>
              )}

              {effectiveSections.tendencias && (
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('tendencias');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-3 px-3 flex items-center justify-between rounded-lg transition-colors ${
                    activeScreen === 'tendencias' ? 'bg-red-50 text-[#E3000F]' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FFD100]" /> Tendencias Decoración &amp; IA
                  </span>
                </button>
              )}

              {effectiveSections.laboratorio_ia && (
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('laboratorio_ia');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-3 px-3 flex items-center justify-between rounded-lg transition-colors ${
                    activeScreen === 'laboratorio_ia' ? 'bg-red-50 text-[#E3000F]' : 'text-[#0B2861] hover:bg-blue-50'
                  }`}
                >
                  <span className="uppercase tracking-wider font-extrabold">
                    Laboratorio Biociencia &amp; Estudio IA
                  </span>
                  <span className="text-[10px] bg-[#0B2861] text-[#FFD100] px-2 py-0.5 rounded-full font-black">
                    12 Módulos
                  </span>
                </button>
              )}

              {effectiveSections.juego_3d && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIs3dGameOpen(true);
                  }}
                  className="w-full py-3 px-3 flex items-center justify-between rounded-lg bg-[#FFD100]/20 text-[#0B2861] font-extrabold"
                >
                  <span className="uppercase tracking-wider">Simulador Juego Logístico 3D</span>
                  <span className="text-[10px] bg-[#FFD100] text-[#0B2861] px-2 py-0.5 rounded-full font-black">
                    WebGL
                  </span>
                </button>
              )}
            </div>

            {/* Mobile Contact & Support Footer */}
            <div className="p-4 bg-slate-100 border-t border-gray-200 flex items-center justify-between text-xs">
              <div className="text-gray-600">
                <span className="block font-bold text-gray-900">PBX Ecuador: (04) 211-5400</span>
                <span className="text-[11px]">Guayaquil · Quito · Cuenca</span>
              </div>
              <a
                href="https://wa.me/593987654321?text=Hola,%20deseo%20asesoria%20tecnica%20de%20Industrial%20Latina"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs hover:bg-emerald-500"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Breadcrumb Navigation when viewing dedicated section */}
      {activeScreen !== 'inicio' && (
        <div className="bg-gray-100 border-b border-gray-200 py-3 px-4 sm:px-8 relative z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-gray-500 font-medium">
              <button
                type="button"
                onClick={() => navigateTo('inicio')}
                className="hover:text-[#0B2861] font-bold"
              >
                Inicio
              </button>
              <span>/</span>
              <span className="text-gray-900 font-bold uppercase tracking-wide">
                {activeScreen === 'productos' && 'Catálogo de Productos y Categorías'}
                {activeScreen === 'calculadora' && 'Calculadora de Rendimiento y Materiales'}
                {activeScreen === 'disenador' && 'Diseñador Virtual de Ambientes 3D'}
                {activeScreen === 'rastreo' && 'Rastreo de Envíos y Guías SRI'}
                {activeScreen === 'distribuidores' && 'Programa Oficial de Distribuidores Ecuador'}
                {activeScreen === 'institucional' && 'Acerca de Industrial Latina & Induless'}
                {activeScreen === 'blogs' && 'Eventos con Clientes y Festividades de Empresa'}
                {activeScreen === 'tendencias' && 'Tendencias de Acabados & IA Conectada'}
                {activeScreen === 'laboratorio_ia' &&
                  'Laboratorio Biociencia 3D, Chatbot Multi-Modelo, Video Omni, Voz, Mapas & Lyria'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigateTo('inicio')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B2861] hover:text-[#E3000F] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Inicio</span>
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {storefrontToast && (
        <div
          role="status"
          className="fixed top-24 right-5 z-[9999] modal-layer-top max-w-md bg-[#0B2861] text-white border-l-4 border-[#FFD100] px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-fade-in-up"
          style={{ zIndex: MODAL_AND_DRAWER_Z_INDEX }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#FFD100] shrink-0" />
            <span>{storefrontToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setStorefrontToast(null)}
            className="text-blue-200 hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          SCREEN 1: INICIO (HERO + PRODUCTOS DESTACADOS + CALCULADORA + RESUMEN)
         ========================================================================= */}
      {activeScreen === 'inicio' && (
        <>
          {/* HERO SECTION — High-Definition 3D Commemorative Banner & Volumetric SVG */}
          <section className="relative z-20 min-h-[580px] lg:min-h-[640px] flex items-center pt-24 pb-20 overflow-hidden bg-gray-900">
            {/* High-Resolution 3D Commemorative Banner Backdrop (pointer-events: none; user-select: none) */}
            <ThematicCommemorativeBannerArt
              themeId={activeThemeId}
              variant="hero-backdrop"
            />

            <ThematicCornerIllustration
              themeId={activeThemeId}
              position="top-right"
              size="lg"
              className="right-10 top-10 opacity-95 hidden lg:block"
            />

            {/* Hero Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center h-full">
              <div className="max-w-3xl pt-6 sm:pt-10">
                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                  <span className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText} text-xs font-black uppercase tracking-wider shadow-sm border border-white/20`}>
                    <span className="text-sm">{activeFestiveTheme.iconSymbol}</span>
                    <span>{activeFestiveTheme.heroBadge}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-white/15 backdrop-blur-xs text-white text-xs font-bold border border-white/20 shadow-xs">
                    <span>{activeFestiveTheme.festiveEmoji}</span>
                    <span>{activeFestiveTheme.festiveSalute}</span>
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
                  {activeFestiveTheme.tagline ? (
                    <>
                      {activeFestiveTheme.tagline.split('!')[0]}!{' '}
                      <span className="text-[#FFD100]">
                        {activeFestiveTheme.name.split('(')[0]}
                      </span>
                    </>
                  ) : (
                    <>
                      Transforma tu hogar con colores que{' '}
                      <span className="text-[#FFD100]">duran más</span>.
                    </>
                  )}
                </h1>
                <p className="text-lg md:text-2xl text-blue-100 mb-10 font-light max-w-2xl drop-shadow-md">
                  {activeFestiveTheme.bannerMessage ||
                    'Descubre nuestra línea arquitectónica. Mayor cubrimiento, tecnología lavable y protección total para interiores y exteriores.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => navigateTo('productos')}
                    className="hover:brightness-110 text-white text-base sm:text-lg font-bold py-4 px-8 rounded-full text-center transition-all duration-300 shadow-lg transform hover:-translate-y-1 cursor-pointer"
                    style={{ backgroundColor: activeFestiveTheme.accentColor }}
                  >
                    Ver Catálogo {activeFestiveTheme.festiveEmoji}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('calculadora');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      else navigateTo('calculadora');
                    }}
                    className="bg-[#FFD100] hover:bg-yellow-400 text-[#0B2861] border-2 border-[#FFD100] text-base sm:text-lg font-bold py-4 px-8 rounded-full text-center transition-all duration-300 shadow-lg transform hover:-translate-y-1 cursor-pointer"
                  >
                    Calcula tu Pintura
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('disenador')}
                    className="bg-white/15 hover:bg-white/25 text-white border border-white/30 text-base sm:text-lg font-bold py-4 px-6 rounded-full text-center transition-all duration-300 backdrop-blur-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 text-[#FFD100]" />
                    <span>Diseñador 3D</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* DUAL BRAND SHOWCASE BADGES (LATINA & INDULESS) WITH 3D SKEUOMORPHISM & CORNER SVGS */}
          <section className="bg-white py-8 border-b border-gray-200 relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className="group relative p-6 rounded-2xl skeuo-glass-card flex items-center justify-between border-2 overflow-hidden"
                style={{
                  borderColor: '#bfdbfe',
                  borderLeftWidth: '6px',
                  borderLeftColor: activeFestiveTheme.accentColor,
                }}
              >
                <ThematicCornerIllustration themeId={activeThemeId} position="top-right" size="sm" />
                <div className="pr-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B2861]">
                      Fábrica Matriz Ecuador
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
                      <span>{activeFestiveTheme.iconSymbol}</span>
                      <span>{activeFestiveTheme.heroBadge}</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0B2861]">Industrial Latina</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Pinturas arquitectónicas, empastes, morteros, pegantes y masillas. Planta Vía a
                    Daule Km 8.5.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompany('industrial_latina');
                    setSelectedCategory('Todas');
                    navigateTo('productos');
                  }}
                  className="px-4 py-2 text-white text-xs font-bold rounded-xl shrink-0 ml-4 cursor-pointer skeuo-btn-3d"
                  style={{ backgroundColor: activeFestiveTheme.primaryColor }}
                >
                  Ver Latina
                </button>
              </div>

              <div
                className="group relative p-6 rounded-2xl skeuo-glass-card flex items-center justify-between border-2 overflow-hidden"
                style={{
                  borderColor: '#fbcfe8',
                  borderLeftWidth: '6px',
                  borderLeftColor: activeFestiveTheme.accentColor,
                }}
              >
                <ThematicCornerIllustration themeId={activeThemeId} position="top-right" size="sm" />
                <div className="pr-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D8235A]">
                      Importadora Ferretera
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
                      <span>{activeFestiveTheme.iconSymbol}</span>
                      <span>{activeFestiveTheme.name.split('(')[0]}</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#13314C]">Induless Ecuador</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Cables CONDEX INEN, paneles LED, grifería, techoforte, soldadura y cerraduras.
                    Bodega Mapasingue.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompany('induless');
                    setSelectedCategory('Todas');
                    navigateTo('productos');
                  }}
                  className="px-4 py-2 text-white text-xs font-bold rounded-xl shrink-0 ml-4 cursor-pointer skeuo-btn-3d"
                  style={{ backgroundColor: activeFestiveTheme.accentColor }}
                >
                  Ver Induless
                </button>
              </div>
            </div>
          </section>

          {/* FEATURED PRODUCTS SECTION (`#productos`) — 3D Skeuomorphic Cards with Thematic Corner SVGs */}
          <section id="productos" className="py-20 bg-gray-50/90 border-t border-gray-200 relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-black shadow-xs border border-slate-200 bg-white">
                  <span>{activeFestiveTheme.iconSymbol}</span>
                  <span style={{ color: activeFestiveTheme.primaryColor }}>{activeFestiveTheme.name.split('(')[0]}</span>
                  <span>·</span>
                  <span className="text-gray-500 font-medium">{activeFestiveTheme.heroBadge}</span>
                </div>
                <h3 className="text-[#E3000F] font-bold uppercase tracking-wider mb-2 text-sm sm:text-base">
                  Renueva tus espacios
                </h3>
                <h2 className="text-3xl md:text-5xl font-extrabold text-[#0B2861]">
                  Productos Destacados
                </h2>
                <div
                  className="w-20 h-1.5 mx-auto rounded-full mt-4"
                  style={{ backgroundColor: activeFestiveTheme.secondaryColor || '#FFD100' }}
                ></div>
              </div>

              <ThematicCommemorativeBannerArt
                themeId={activeThemeId}
                variant="section-banner"
                className="mb-10"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="skeuo-glass-card rounded-2xl overflow-hidden group flex flex-col h-full border-2 relative"
                    style={{
                      borderColor: '#e2e8f0',
                      borderTopWidth: '5px',
                      borderTopColor: activeFestiveTheme.accentColor,
                    }}
                  >
                    <ThematicCornerIllustration themeId={activeThemeId} position="top-right" size="sm" />
                    <div className="relative h-60 overflow-hidden bg-gray-200">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="img-zoom w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-1 items-start">
                        <span className={`text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm ${p.badgeColor}`}>
                          {p.badge}
                        </span>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-white/20 ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
                          <span>{activeFestiveTheme.iconSymbol}</span>
                          <span>{activeFestiveTheme.heroBadge}</span>
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs font-mono text-[10px] font-bold px-2 py-0.5 rounded text-gray-700">
                        {p.sku}
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#E3000F] transition-colors leading-snug">
                          {p.name}
                        </h4>
                        <p className="text-gray-500 text-xs leading-relaxed">
                          {p.description}
                        </p>
                        <div className="mt-3 py-1.5 px-2 bg-gray-50 rounded-lg text-[11px] text-gray-600 flex justify-between">
                          <span>Rendimiento:</span>
                          <strong className="text-gray-900">{p.yieldCoverage}</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                        <div>
                          <span className="text-2xl font-black text-gray-900">
                            ${p.price.toFixed(2)}{' '}
                            <span className="text-xs text-gray-400 font-normal">/ {p.unit}</span>
                          </span>
                          <span
                            className="block text-[10px] font-bold mt-0.5"
                            style={{ color: activeFestiveTheme.accentColor }}
                          >
                            {activeFestiveTheme.iconSymbol} Especial {activeFestiveTheme.name.split('(')[0]}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(p, 1)}
                          aria-label={`Agregar ${p.name} al carrito`}
                          className="text-white w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer skeuo-btn-3d"
                          style={{ backgroundColor: activeFestiveTheme.accentColor }}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => navigateTo('productos')}
                  className="inline-block bg-white border-2 text-[#0B2861] hover:bg-[#0B2861] hover:text-white font-bold py-3.5 px-8 rounded-full transition-colors cursor-pointer skeuo-btn-3d"
                  style={{ borderColor: activeFestiveTheme.primaryColor }}
                >
                  Ver Catálogo Completo ({inventory.length} Productos) {activeFestiveTheme.iconSymbol}
                </button>
                <button
                  type="button"
                  data-testid="home-minimalist-catalog-pdf-btn"
                  onClick={() => {
                    const html = generateMinimalistCatalogExecutiveHtml(inventory);
                    setExecutiveModalDoc({
                      isOpen: true,
                      title: 'Catálogo Corporativo Minimalista — Industrial Latina & Induless',
                      html,
                      filename: `Catalogo_Minimalista_Industrial_Latina_${new Date().toISOString().slice(0, 10)}`,
                    });
                    downloadMinimalistCatalogPdf(inventory);
                  }}
                  className="inline-flex items-center gap-2 bg-[#0B2861] hover:bg-blue-950 text-[#FFD100] font-extrabold py-3.5 px-7 rounded-full transition-colors cursor-pointer skeuo-btn-3d"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Catálogo PDF Minimalista (Portada + Ambientes Pintura)</span>
                </button>
              </div>
            </div>
          </section>

          {/* INTERACTIVE PAINT CALCULATOR SECTION (`#calculadora`) — Exact HTML Template replica */}
          <section
            id="calculadora"
            className={`py-20 relative z-20 overflow-hidden text-white bg-gradient-to-br ${activeFestiveTheme.bannerGradient}`}
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#FFD100] opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E3000F] opacity-10 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-16">
                <div className="flex-1 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-[#FFD100] text-[#0B2861] text-xs font-black uppercase tracking-wider inline-block">
                      Herramienta Técnica
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border border-white/20 ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
                      {activeFestiveTheme.iconSymbol} {activeFestiveTheme.heroBadge}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                    Calculadora de Rendimiento
                  </h2>
                  <p className="text-lg md:text-xl text-blue-100 mb-8 font-light">
                    Calcula exactamente cuántos galones necesitas para tu proyecto y evita gastos
                    innecesarios con fórmulas certificadas NTE INEN.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-blue-50 text-sm sm:text-base">
                      <div className="w-6 h-6 rounded-full bg-[#FFD100] text-[#0B2861] flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <span>Cálculos basados en rendimiento real en paredes de construcción.</span>
                    </li>
                    <li className="flex items-center gap-3 text-blue-50 text-sm sm:text-base">
                      <div className="w-6 h-6 rounded-full bg-[#FFD100] text-[#0B2861] flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <span>Ajustado según el tipo de pintura (Duralín, Satinada, Látex o Esmalte).</span>
                    </li>
                    <li className="flex items-center gap-3 text-blue-50 text-sm sm:text-base">
                      <div className="w-6 h-6 rounded-full bg-[#FFD100] text-[#0B2861] flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <span>Cálculo óptimo estimado para 2 manos de acabado cubriente garantizado.</span>
                    </li>
                  </ul>

                  <div className="mt-8 pt-6 border-t border-white/20">
                    <button
                      type="button"
                      onClick={() => navigateTo('calculadora')}
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#FFD100] hover:underline cursor-pointer"
                    >
                      <Calculator className="w-4 h-4" />
                      <span>Abrir Calculadora Dimensional Avanzada (Largo × Alto × Desperdicio) →</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full max-w-md">
                  <div
                    className="skeuo-glass-card p-8 rounded-2xl relative text-gray-800 border-2 overflow-hidden"
                    style={{
                      borderColor: activeFestiveTheme.secondaryColor,
                      borderTopWidth: '6px',
                      borderTopColor: activeFestiveTheme.accentColor,
                    }}
                  >
                    <ThematicCornerIllustration themeId={activeThemeId} position="top-right" size="sm" />
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 pr-10">
                      <span className="text-xs font-extrabold uppercase text-[#0B2861] flex items-center gap-1.5">
                        <span>{activeFestiveTheme.iconSymbol}</span>
                        <span>Cálculo · {activeFestiveTheme.name.split('(')[0]}</span>
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
                        {activeFestiveTheme.heroBadge}
                      </span>
                    </div>

                    <form onSubmit={handleCalculateQuickPaint} className="space-y-5">
                      <div>
                        <label
                          htmlFor="calc-m2"
                          className="block text-sm font-bold text-gray-700 mb-2"
                        >
                          Metros cuadrados a pintar (m²)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            id="calc-m2"
                            value={calcM2}
                            onChange={(e) => setCalcM2(Math.max(1, Number(e.target.value)))}
                            className="w-full pl-4 pr-12 py-3 rounded-lg border-2 border-gray-200 focus:border-[#0B2861] focus:ring-0 transition-colors text-base font-semibold"
                            placeholder="Ej: 45"
                            required
                            min="1"
                          />
                          <span className="absolute right-4 top-3.5 text-gray-400 font-bold text-sm">
                            m²
                          </span>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="calc-type"
                          className="block text-sm font-bold text-gray-700 mb-2"
                        >
                          Producto a aplicar
                        </label>
                        <select
                          id="calc-type"
                          value={calcProductType}
                          onChange={(e) => setCalcProductType(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#0B2861] focus:ring-0 transition-colors bg-white text-sm font-medium"
                          required
                        >
                          <option value="duralin">Duralín Premium Forte (25 m²/gal)</option>
                          <option value="satinada">Satinada Tipo 1 (20 m²/gal)</option>
                          <option value="latex">Látex Estándar LVA (15 m²/gal)</option>
                          <option value="esmalte">Esmalte Sintético Anticorrosivo (18 m²/gal)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full text-white font-bold py-3.5 rounded-lg transition-all shadow-md text-base cursor-pointer hover:brightness-110"
                        style={{ backgroundColor: activeFestiveTheme.accentColor }}
                      >
                        Calcular Rendimiento {activeFestiveTheme.iconSymbol}
                      </button>
                    </form>

                    {calcGallonsResult !== null && (
                      <div
                        id="calc-result-box"
                        className="mt-6 p-5 rounded-xl text-center animate-fade-in-up border-2"
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderColor: activeFestiveTheme.secondaryColor,
                        }}
                      >
                        <h4 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                          Necesitarás aproximadamente:
                        </h4>
                        <p
                          id="calc-result"
                          className="text-3xl font-black text-[#0B2861] font-display"
                        >
                          {calcGallonsResult}{' '}
                          {calcGallonsResult === 1 ? 'galón' : 'galones'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 mb-4">
                          Cálculo estimado para 2 manos de pintura.
                        </p>
                        <button
                          type="button"
                          onClick={handleAddCalculatedQuickToCart}
                          className="w-full py-2.5 px-4 font-bold text-xs uppercase tracking-wide rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:brightness-110"
                          style={{
                            backgroundColor: activeFestiveTheme.secondaryColor || '#FFD100',
                            color: activeFestiveTheme.primaryColor || '#0B2861',
                          }}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Agregar {calcGallonsResult} Galones al Carrito</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3D VIRTUAL DESIGNER PROMO TEASER */}
          {effectiveSections.disenador && (
            <section className="py-16 bg-white border-t border-gray-200 relative z-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                  className={`relative overflow-hidden skeuo-glass-panel bg-gradient-to-r ${activeFestiveTheme.bannerGradient} rounded-3xl p-8 sm:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 border-2`}
                  style={{ borderColor: activeFestiveTheme.secondaryColor }}
                >
                  <ThematicCornerIllustration themeId={activeThemeId} position="top-right" size="md" />
                  <div className="space-y-4 max-w-2xl relative z-10">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText} text-xs font-black uppercase tracking-wider shadow-sm border border-white/20 flex items-center gap-1.5`}
                      >
                        <span>{activeFestiveTheme.iconSymbol}</span>
                        <span>{activeFestiveTheme.heroBadge}</span>
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                        Innovación Interactiva 3D
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-extrabold font-display leading-tight">
                      Visualiza tus combinaciones de pintura y pisos en 3D
                    </h3>
                    <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                      Prueba en tiempo real cómo lucen los colores de Industrial Latina combinados con
                      los acabados y luminarias Induless antes de comprar. Gira la cámara, cambia la luz
                      y añade el ambiente completo al carrito.
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col sm:flex-row gap-3 relative z-10">
                    <button
                      type="button"
                      onClick={() => navigateTo('disenador')}
                      className="px-8 py-4 bg-[#FFD100] hover:bg-yellow-400 text-[#0B2861] font-extrabold text-sm rounded-full transition-all cursor-pointer flex items-center gap-2 skeuo-btn-3d"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Abrir Diseñador 3D</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* DISTRIBUTOR APPLICATION SECTION ON HOMEPAGE */}
          {effectiveSections.distribuidores && (
            <DistributorApplicationSection
              companySettings={companySettings}
              onShowToast={showToast}
              isReadOnly={true}
              activeThemeId={activeThemeId}
            />
          )}
        </>
      )}

      {/* =========================================================================
          SCREEN: DISTRIBUIDORES OFICIALES (DEDICATED FULL VIEW)
         ========================================================================= */}
      {activeScreen === 'distribuidores' && (
        <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20">
          <DistributorApplicationSection
            companySettings={companySettings}
            onShowToast={showToast}
            isReadOnly={true}
            activeThemeId={activeThemeId}
          />
        </section>
      )}

      {/* =========================================================================
          SCREEN 2: PRODUCTOS Y CATEGORÍAS (FULL CATALOG SCREEN)
         ========================================================================= */}
      {activeScreen === 'productos' && (
        <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8 relative z-20">
          {/* Festive Campaign Banner for Catalog */}
          <div
            className={`p-5 rounded-2xl text-white bg-gradient-to-r ${activeFestiveTheme.bannerGradient} flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg border border-white/20`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 rounded-2xl bg-white/20 shadow-inner">
                {activeFestiveTheme.iconSymbol}
              </span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText} shadow-xs`}
                  >
                    {activeFestiveTheme.heroBadge}
                  </span>
                  <span className="text-xs text-[#FFD100] font-bold">
                    {activeFestiveTheme.dates}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  {activeFestiveTheme.name} · Catálogo de Temporada
                </h3>
                <p className="text-xs text-blue-100 font-light">
                  {activeFestiveTheme.festiveSalute} — {activeFestiveTheme.bannerMessage}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs bg-white/20 px-3 py-1.5 rounded-xl font-bold backdrop-blur-xs">
                {activeFestiveTheme.festiveEmoji} Especial Ecuador
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-gray-200 pb-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#E3000F]">
                Catálogo Unificado 2026
              </span>
              <h2 className="text-3xl font-extrabold text-[#0B2861] font-display mt-1">
                Productos por Empresa y Categoría
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
                Consulte las especificaciones técnicas, códigos de catálogo y agregue directamente a
                su carrito de compras con beneficios de {activeFestiveTheme.name}.
              </p>
            </div>

            {/* Company Filter Tabs & Minimalist PDF Button */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                data-testid="storefront-minimalist-catalog-pdf-btn"
                onClick={() => {
                  const html = generateMinimalistCatalogExecutiveHtml(filteredProducts);
                  setExecutiveModalDoc({
                    isOpen: true,
                    title: 'Catálogo Corporativo Minimalista — Industrial Latina & Induless',
                    html,
                    filename: `Catalogo_Minimalista_Industrial_Latina_${new Date().toISOString().slice(0, 10)}`,
                  });
                  downloadMinimalistCatalogPdf(filteredProducts);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2861] hover:bg-blue-950 text-[#FFD100] text-xs font-extrabold shadow-md cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Catálogo PDF Minimalista (Portada + Ambientes)</span>
              </button>

              <div className="flex flex-wrap items-center gap-2 bg-gray-200 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompany('todas');
                    setSelectedCategory('Todas');
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    selectedCompany === 'todas'
                      ? 'bg-[#0B2861] text-white shadow-xs'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Todas las Líneas ({inventory.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompany('industrial_latina');
                    setSelectedCategory('Todas');
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    selectedCompany === 'industrial_latina'
                      ? 'bg-[#0B2861] text-white shadow-xs'
                      : 'text-[#0B2861] hover:bg-white/60'
                  }`}
                >
                  Industrial Latina ({inventory.filter((i) => i.company === 'industrial_latina').length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompany('induless');
                    setSelectedCategory('Todas');
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    selectedCompany === 'induless'
                      ? 'bg-[#D8235A] text-white shadow-xs'
                      : 'text-[#D8235A] hover:bg-white/60'
                  }`}
                >
                  Induless ({inventory.filter((i) => i.company === 'induless').length})
                </button>
              </div>
            </div>
          </div>

          {/* High-Definition Category Filter Bar & Search Bar */}
          <div
            data-testid="catalog-category-bar-hd"
            className="category-bar-hd p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs ${
                    selectedCategory === cat
                      ? 'text-white ring-2 ring-[#FFD100]'
                      : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === cat ? activeFestiveTheme.primaryColor : undefined,
                  }}
                >
                  {selectedCategory === cat && <span className="mr-1">{activeFestiveTheme.iconSymbol}</span>}
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código (ej. LAT-LVA-01, PRL18E)..."
                aria-label="Buscar producto"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0B2861]"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((item) => {
              const isInduless = item.company === 'induless';
              const hasSpecificPres = Boolean(item.presentations && item.presentations.length > 0);
              const presentationOptions = hasSpecificPres
                ? item.presentations!.map((p) => p.name)
                : item.technicalSheet?.presentationOptions || [item.unit];

              const currentPres =
                selectedPresentationBySku[item.sku] || presentationOptions[0];

              const activePresObj = hasSpecificPres
                ? item.presentations!.find((p) => p.name === currentPres)
                : undefined;

              const displayPrice = activePresObj ? activePresObj.unitPrice : item.unitPrice;

              return (
                <article
                  key={item.id}
                  className="skeuo-glass-card rounded-2xl border-2 overflow-hidden flex flex-col justify-between group relative"
                  style={{
                    borderColor: '#e2e8f0',
                    borderTopWidth: '5px',
                    borderTopColor: isInduless ? '#D8235A' : activeFestiveTheme.accentColor,
                  }}
                >
                  <ThematicCornerIllustration themeId={activeThemeId} position="top-right" size="sm" />
                  <div>
                    {/* Visual Media Header */}
                    <div className="relative p-3 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                              isInduless
                                ? 'bg-[#13314C] text-[#FFD100]'
                                : 'bg-[#0B2861] text-[#FFD100]'
                            }`}
                          >
                            {isInduless ? 'INDULESS' : 'INDUSTRIAL LATINA'}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText} border border-white/20`}
                            title={`Edición de temporada: ${activeFestiveTheme.name}`}
                          >
                            {activeFestiveTheme.iconSymbol} {activeFestiveTheme.heroBadge}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                          CÓD: {item.sku}
                        </span>
                      </div>

                      {(() => {
                        const displayImageUrl = activePresObj?.imageUrl || item.imageUrl;
                        return displayImageUrl ? (
                          <div className="relative w-full h-40 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-gray-200">
                            <img
                              src={displayImageUrl}
                              alt={`${item.name} - ${currentPres}`}
                              data-testid={`product-image-${item.sku}`}
                              className="w-full h-full object-cover img-zoom"
                            />
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 text-[#FFD100] text-[10px] font-bold rounded-md backdrop-blur-xs">
                              Vista: {currentPres}
                            </span>
                            {item.videoUrl && (
                              <a
                                href={item.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/80 hover:bg-black text-white text-[10px] font-bold rounded-lg flex items-center gap-1 backdrop-blur-xs transition-colors shadow-xs"
                              >
                                <Video className="w-3 h-3 text-[#FFD100]" />
                                Video
                              </a>
                            )}
                          </div>
                        ) : (
                          <ProductSchematicSvg
                            sku={item.sku}
                            category={item.category}
                            company={item.company}
                            className="w-full h-40 rounded-lg overflow-hidden img-zoom"
                          />
                        );
                      })()}
                    </div>

                    {/* Product Body */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                            {item.category}
                          </span>
                          <h3 className="text-base font-extrabold text-gray-900 group-hover:text-[#E3000F] transition-colors leading-snug mt-0.5">
                            {item.name}
                          </h3>
                        </div>
                        <div className="text-right shrink-0">
                          <div
                            className="text-xl font-extrabold font-mono"
                            style={{ color: isInduless ? '#D8235A' : activeFestiveTheme.primaryColor }}
                          >
                            ${displayPrice.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            {activePresObj ? activePresObj.name : `por ${item.unit}`}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {item.technicalSheet && (
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          <div>
                            <span className="text-gray-400 block text-[10px]">Rendimiento:</span>
                            <strong className="text-gray-800 line-clamp-1">
                              {item.technicalSheet.yieldOrCoverage}
                            </strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px]">Normativa:</span>
                            <strong className="text-gray-800 line-clamp-1">
                              {item.technicalSheet.normative}
                            </strong>
                          </div>
                        </div>
                      )}

                      {/* Presentation Selector with Dynamic Prices */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor={`pres-${item.sku}`}
                            className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide"
                          >
                            Presentación y Precio:
                          </label>
                          {hasSpecificPres && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {item.presentations!.length} presentaciones
                            </span>
                          )}
                        </div>

                        <select
                          id={`pres-${item.sku}`}
                          value={currentPres}
                          onChange={(e) =>
                            setSelectedPresentationBySku((prev) => ({
                              ...prev,
                              [item.sku]: e.target.value,
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold"
                        >
                          {hasSpecificPres
                            ? item.presentations!.map((p) => (
                                <option key={p.name} value={p.name}>
                                  {p.name} — ${p.unitPrice.toFixed(2)} {p.description ? `(${p.description})` : ''}
                                </option>
                              ))
                            : presentationOptions.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="px-5 pb-5 pt-2 space-y-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTechSheetItem(item)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#0B2861]" />
                        <span>Ficha Técnica</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item, 1, currentPres, displayPrice)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-white text-xs font-extrabold transition-all cursor-pointer shadow-sm hover:brightness-110"
                        style={{
                          backgroundColor: isInduless
                            ? '#D8235A'
                            : activeFestiveTheme.accentColor,
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Al Carrito (${displayPrice.toFixed(2)})</span>
                      </button>
                    </div>
                    <a
                      href={
                        item.technicalSheet?.googleDriveUrl ||
                        `https://drive.google.com/file/d/1IndLatina_${item.sku}_FichaTecnica/view?usp=sharing`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`google-drive-tech-link-${item.sku}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0B2861] border border-blue-200 text-[11px] font-bold transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Ver Ficha Técnica Oficial en Google Drive</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================================================
          SCREEN 3: CALCULADORA (DEDICATED CALCULATOR VIEW)
         ========================================================================= */}
      {activeScreen === 'calculadora' && (
        <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8 relative z-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#E3000F]">
                Herramienta de Cubicaje de Pintura &amp; Materiales
              </span>
              <h2 className="text-3xl font-extrabold text-[#0B2861] font-display mt-1">
                Calculadora Técnica de Rendimiento
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
                Seleccione el modo rápido por metros cuadrados o el modo dimensional de obra con
                factor de merma.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-gray-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCalculatorTabMode('rapido')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  calculatorTabMode === 'rapido'
                    ? 'bg-[#0B2861] text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Cálculo Rápido (m²)
              </button>
              <button
                type="button"
                onClick={() => setCalculatorTabMode('avanzado')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  calculatorTabMode === 'avanzado'
                    ? 'bg-[#0B2861] text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Cálculo Dimensional Avanzado
              </button>
            </div>
          </div>

          {calculatorTabMode === 'rapido' ? (
            <div
              className={`text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden bg-gradient-to-br ${activeFestiveTheme.bannerGradient}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#FFD100] text-[#0B2861] text-xs font-black uppercase tracking-wider">
                      Fórmula de Rendimiento Directo
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border border-white/20 ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
                      {activeFestiveTheme.iconSymbol} {activeFestiveTheme.heroBadge}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-extrabold font-display">
                    Calcula tus Galones para Paredes y Fachadas
                  </h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Nuestra fórmula calcula los galones recomendados para 2 manos completas según el
                    tipo de producto: Duralín (25 m²/gal), Satinada (20 m²/gal), Látex (15 m²/gal) o
                    Esmalte (18 m²/gal).
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                    <div className="bg-white/10 p-3 rounded-xl border border-white/15 text-center">
                      <span className="text-[10px] text-blue-200 block uppercase">Duralín Forte</span>
                      <strong className="text-lg text-[#FFD100]">25 m²</strong>
                      <span className="text-[10px] text-blue-200 block">por galón</span>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl border border-white/15 text-center">
                      <span className="text-[10px] text-blue-200 block uppercase">Satinada Tipo 1</span>
                      <strong className="text-lg text-[#FFD100]">20 m²</strong>
                      <span className="text-[10px] text-blue-200 block">por galón</span>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl border border-white/15 text-center">
                      <span className="text-[10px] text-blue-200 block uppercase">Látex Vinílico</span>
                      <strong className="text-lg text-[#FFD100]">15 m²</strong>
                      <span className="text-[10px] text-blue-200 block">por galón</span>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl border border-white/15 text-center">
                      <span className="text-[10px] text-blue-200 block uppercase">Esmalte Antióxido</span>
                      <strong className="text-lg text-[#FFD100]">18 m²</strong>
                      <span className="text-[10px] text-blue-200 block">por galón</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white text-gray-800 p-8 rounded-2xl shadow-2xl border-2"
                  style={{
                    borderColor: activeFestiveTheme.secondaryColor,
                    borderTopWidth: '6px',
                    borderTopColor: activeFestiveTheme.accentColor,
                  }}
                >
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                    <span className="text-xs font-extrabold uppercase text-[#0B2861] flex items-center gap-1.5">
                      <span>{activeFestiveTheme.iconSymbol}</span>
                      <span>Cálculo Técnico · {activeFestiveTheme.name.split('(')[0]}</span>
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
                      {activeFestiveTheme.heroBadge}
                    </span>
                  </div>

                  <form onSubmit={handleCalculateQuickPaint} className="space-y-4">
                    <div>
                      <label htmlFor="scr-calc-m2" className="block text-xs font-bold text-gray-700 mb-1">
                        Metros cuadrados totales a pintar (m²):
                      </label>
                      <input
                        type="number"
                        id="scr-calc-m2"
                        value={calcM2}
                        onChange={(e) => setCalcM2(Math.max(1, Number(e.target.value)))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-bold text-gray-900"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="scr-calc-type" className="block text-xs font-bold text-gray-700 mb-1">
                        Tipo de Pintura:
                      </label>
                      <select
                        id="scr-calc-type"
                        value={calcProductType}
                        onChange={(e) => setCalcProductType(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white font-medium"
                      >
                        <option value="duralin">Duralín Premium Forte</option>
                        <option value="satinada">Satinada Tipo 1</option>
                        <option value="latex">Látex Estándar LVA</option>
                        <option value="esmalte">Esmalte Sintético</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 text-white font-bold rounded-lg shadow-md transition-all cursor-pointer hover:brightness-110"
                      style={{ backgroundColor: activeFestiveTheme.accentColor }}
                    >
                      Calcular Cantidad Requerida {activeFestiveTheme.iconSymbol}
                    </button>
                  </form>

                  {calcGallonsResult !== null && (
                    <div
                      className="mt-6 p-5 rounded-xl text-center animate-fade-in-up border-2"
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderColor: activeFestiveTheme.secondaryColor,
                      }}
                    >
                      <span className="text-xs text-gray-500 font-bold uppercase">Resultado Estimado:</span>
                      <p className="text-3xl font-black text-[#0B2861] mt-1 font-display">
                        {calcGallonsResult} {calcGallonsResult === 1 ? 'galón' : 'galones'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1 mb-3">
                        Garantiza cobertura uniforme a 2 manos.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddCalculatedQuickToCart}
                        className="w-full py-2.5 font-bold text-xs uppercase tracking-wide rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all hover:brightness-110"
                        style={{
                          backgroundColor: activeFestiveTheme.secondaryColor || '#FFD100',
                          color: activeFestiveTheme.primaryColor || '#0B2861',
                        }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Añadir {calcGallonsResult} Galones al Carrito</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <MaterialCalculatorView
              inventory={inventory}
              activeThemeId={activeThemeId}
              onAddCalculatedToCart={(item, qty, presName) => {
                handleAddToCart(item, qty, presName);
                setIsCartOpen(true);
              }}
              onOpenTechSheet={(item) => setActiveTechSheetItem(item)}
            />
          )}
        </section>
      )}

      {/* =========================================================================
          SCREEN 4: DISEÑADOR 3D (VIRTUAL ENVIRONMENT DESIGNER)
         ========================================================================= */}
      {activeScreen === 'disenador' && (
        <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 relative z-20">
          <div className="border-b border-gray-200 pb-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#E3000F]">
              Visualización 3D Fotorrealista
            </span>
            <h2 className="text-3xl font-extrabold text-[#0B2861] font-display mt-1">
              Diseñador de Ambientes Virtuales 3D
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-3xl">
              Configure paredes, pisos cerámicos, empastes y luminarias LED Induless en un espacio
              tridimensional navegable.
            </p>
          </div>

          <VirtualEnvironmentDesigner
            inventory={inventory}
            activeThemeId={activeThemeId}
            onAddCombinationToCart={(combinationItems) => {
              combinationItems.forEach(({ item, quantity }) => {
                handleAddToCart(item, quantity);
              });
              setIsCartOpen(true);
              showToast(
                `Combinación 3D (${combinationItems.length} producto${
                  combinationItems.length === 1 ? '' : 's'
                } Latina / Induless) agregada al carrito.`
              );
            }}
            onInspectProduct={(item) => setActiveTechSheetItem(item)}
          />
        </section>
      )}

      {/* =========================================================================
          SCREEN 5: RASTREO DE ENVÍOS (LOGÍSTICA ECUADOR)
         ========================================================================= */}
      {activeScreen === 'rastreo' && (
        <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8 relative z-20">
          <div className="border-b border-gray-200 pb-6">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#E3000F]">
              Guías SRI &amp; Flota Propia
            </span>
            <h2 className="text-3xl font-extrabold text-[#0B2861] font-display mt-1">
              Rastreo de Envíos en Línea
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              Consulte el estado en vivo de su despacho con el número de guía de remisión o código de
              pedido.
            </p>
          </div>

          {/* Festive Logistics Announcement */}
          <div
            className={`p-4 rounded-xl text-white bg-gradient-to-r ${activeFestiveTheme.bannerGradient} flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-white/20`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 rounded-xl bg-white/20">{activeFestiveTheme.iconSymbol}</span>
              <div>
                <p className="text-xs font-bold text-white">
                  Operaciones Logísticas Especiales: <span className="text-[#FFD100]">{activeFestiveTheme.name}</span>
                </p>
                <p className="text-[11px] text-blue-100">
                  {activeFestiveTheme.festiveSalute} — Envíos exprés garantizados a Guayaquil, Quito, Cuenca, Machala y red vial nacional.
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText} shrink-0`}>
              {activeFestiveTheme.heroBadge}
            </span>
          </div>

          <div
            className="p-8 rounded-2xl bg-white border-2 shadow-sm space-y-6"
            style={{
              borderColor: '#e2e8f0',
              borderTopWidth: '5px',
              borderTopColor: activeFestiveTheme.primaryColor,
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={trackingSearch}
                onChange={(e) => setTrackingSearch(e.target.value)}
                placeholder="Ingrese número de guía (ej. EC-ENV-8901) o pedido..."
                aria-label="Código de rastreo"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (matchedShipment) {
                    showToast(`Guía ${matchedShipment.trackingCode} encontrada.`);
                  } else {
                    showToast('No se encontró guía con ese código.');
                  }
                }}
                className="px-6 py-3 text-white font-bold text-xs uppercase tracking-wide rounded-xl cursor-pointer hover:brightness-110 shadow-sm transition-all"
                style={{ backgroundColor: activeFestiveTheme.primaryColor }}
              >
                Consultar {activeFestiveTheme.iconSymbol}
              </button>
            </div>

            {matchedShipment && (
              <div
                className="p-6 rounded-2xl bg-gray-50 border-2 space-y-6"
                style={{
                  borderColor: '#e2e8f0',
                  borderTopWidth: '5px',
                  borderTopColor: activeFestiveTheme.accentColor,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide block">
                      Número de Guía:
                    </span>
                    <strong
                      className="text-xl font-mono"
                      style={{ color: activeFestiveTheme.primaryColor }}
                    >
                      {matchedShipment.trackingCode}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide block">
                      Orden Asociada:
                    </span>
                    <strong className="text-sm font-mono text-gray-900">
                      {matchedShipment.orderCode}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide block">
                      Cliente:
                    </span>
                    <strong className="text-sm text-gray-900">
                      {matchedShipment.clientName}
                    </strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Etapa: {formatShipmentStatusLabel(matchedShipment.status)}</span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: activeFestiveTheme.accentColor }}
                    >
                      {matchedShipment.progress}% completado
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${matchedShipment.progress}%`,
                        backgroundColor: activeFestiveTheme.accentColor,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div
                    className="p-3 bg-white rounded-xl border-2"
                    style={{ borderLeftWidth: '4px', borderLeftColor: activeFestiveTheme.secondaryColor || '#FFD100' }}
                  >
                    <span className="text-gray-400 block">Origen:</span>
                    <strong className="text-gray-800">{matchedShipment.origin}</strong>
                  </div>
                  <div
                    className="p-3 bg-white rounded-xl border-2"
                    style={{ borderLeftWidth: '4px', borderLeftColor: activeFestiveTheme.accentColor }}
                  >
                    <span className="text-gray-400 block">Destino:</span>
                    <strong className="text-gray-800">{matchedShipment.destination}</strong>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs">
                    <p className="font-bold text-gray-900">Suscripción a Alertas Automatizadas</p>
                    <p className="text-gray-500">Reciba actualizaciones por WhatsApp o Email.</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={alertChannel}
                      onChange={(e) => setAlertChannel(e.target.value as 'whatsapp' | 'email')}
                      className="px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                    </select>
                    <input
                      type="text"
                      value={alertContact}
                      onChange={(e) => setAlertContact(e.target.value)}
                      className="px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-300 rounded-lg flex-1 sm:w-44"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onSubscribeTrackingAlert(matchedShipment, alertChannel, alertContact);
                        showToast(`Alertas activadas para guía ${matchedShipment.trackingCode}.`);
                      }}
                      className="px-4 py-2 bg-[#0B2861] hover:bg-blue-900 text-white font-bold text-xs rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      Suscribir
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          SCREEN 6: INSTITUCIONAL
         ========================================================================= */}
      {activeScreen === 'institucional' && (
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12 relative z-20">
          {/* Festive Dedication Banner */}
          <div
            className={`p-5 rounded-2xl text-white bg-gradient-to-r ${activeFestiveTheme.bannerGradient} flex flex-col md:flex-row items-center justify-between gap-4 shadow-md border border-white/20`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-xl bg-white/20">{activeFestiveTheme.iconSymbol}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}
                  >
                    {activeFestiveTheme.heroBadge}
                  </span>
                  <span className="text-xs text-[#FFD100] font-bold">
                    Celebración Nacional {activeFestiveTheme.dates}
                  </span>
                </div>
                <h3 className="text-lg font-bold">
                  Compromiso Industrial con el Ecuador · {activeFestiveTheme.name}
                </h3>
                <p className="text-xs text-blue-100">
                  {activeFestiveTheme.festiveSalute} — Más de 40 años forjando la infraestructura y hogares de la patria.
                </p>
              </div>
            </div>
            <span className="text-xs bg-white/20 px-3 py-1.5 rounded-full font-bold">
              {activeFestiveTheme.festiveEmoji} Guayaquil · Quito · Cuenca
            </span>
          </div>

          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#E3000F]">
              Nuestra Historia &amp; Compromiso
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0B2861] font-display">
              Industrial Latina &amp; Induless Ecuador
            </h2>
            <div className="w-20 h-1.5 bg-[#FFD100] mx-auto rounded-full"></div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed pt-2">
              Líderes ecuatorianos en la fabricación de pinturas arquitectónicas, empastes, morteros
              e importación ferretera de primera calidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div
              className="bg-white rounded-3xl p-8 border-2 shadow-sm space-y-4"
              style={{
                borderColor: '#e2e8f0',
                borderTopWidth: '6px',
                borderTopColor: activeFestiveTheme.accentColor,
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-sm"
                  style={{ backgroundColor: activeFestiveTheme.primaryColor }}
                >
                  🏭
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
                  <span>{activeFestiveTheme.iconSymbol}</span>
                  <span>{activeFestiveTheme.heroBadge}</span>
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#0B2861]">Planta Industrial Latina</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Ubicada en <strong>Vía a Daule Km 8.5</strong>, diagonal a Florida Norte, en
                Guayaquil. Desde hace más de 40 años producimos recubrimientos de alto rendimiento,
                Látex Vinil Acrílico (LVA), pinturas satinadas, elastoméricos y empastes listos para
                la construcción ecuatoriana.
              </p>
              <ul className="space-y-2 text-xs text-gray-700 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Certificación NTE INEN 2090 para pinturas arquitectónicas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Resistencia contra salitre, hongos y humedad costera</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Capacidad de despacho masivo directo a obras y distribuidoras</span>
                </li>
              </ul>
            </div>

            <div
              className="bg-white rounded-3xl p-8 border-2 shadow-sm space-y-4"
              style={{
                borderColor: '#fbcfe8',
                borderTopWidth: '6px',
                borderTopColor: '#D8235A',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#D8235A] text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  ⚡
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
                  <span>{activeFestiveTheme.iconSymbol}</span>
                  <span>{activeFestiveTheme.name.split('(')[0]}</span>
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#13314C]">Induless Ecuador</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Centro de distribución ferretera en <strong>Mapasingue Este, Calle Séptima</strong>,
                Guayaquil. Importadores directos de conductores eléctricos CONDEX bajo norma INEN,
                focos y paneles LED de alta durabilidad, grifería, techoforte y cerraduras.
              </p>
              <ul className="space-y-2 text-xs text-gray-700 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D8235A]" />
                  <span>Cables de cobre 100% puro garantizados para instalaciones seguras</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D8235A]" />
                  <span>Tecnología LED con 85% de ahorro energético y larga vida útil</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D8235A]" />
                  <span>Inventario sincronizado en tiempo real con facturación electrónica SRI</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SCREEN 7: BLOGS & EVENTOS CORPORATIVOS (CLIENTES & FESTIVIDADES)
         ========================================================================= */}
      {activeScreen === 'blogs' && (
        <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20">
          <CompanyEventsBlogSection activeThemeId={activeThemeId} />
        </section>
      )}

      {/* =========================================================================
          SCREEN 8: TENDENCIAS DECORACIÓN & ACABADOS CON INTELIGENCIA ARTIFICIAL
         ========================================================================= */}
      {activeScreen === 'tendencias' && (
        <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20">
          <AiDesignTrendsView
            inventory={inventory}
            onAddToCart={(item) => handleAddToCart(item, 1)}
            activeThemeId={activeThemeId}
          />
        </section>
      )}

      {/* =========================================================================
          SCREEN 9: LABORATORIO BIOCIENCIA, QUÍMICA 3D & HUB MULTIMODAL GEMINI
         ========================================================================= */}
      {activeScreen === 'laboratorio_ia' && (
        <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20">
          <GeminiMultimodalStudioView
            inventory={inventory}
            onLaunch3dGame={() => setIs3dGameOpen(true)}
          />
        </section>
      )}

      {/* =========================================================================
          FLOATING PROMO WIDGET (#promo-widget) — Exact HTML Template replica
         ========================================================================= */}
      {activeScreen !== 'laboratorio_ia' && !is3dGameOpen && (promoWidgetVisible ? (
        <div
          id="promo-widget"
          className="fixed bottom-6 left-6 z-40 w-[320px] bg-white rounded-2xl shadow-2xl border-4 overflow-hidden animate-bounce-subtle transition-all duration-300"
          style={{ borderColor: activeFestiveTheme.accentColor }}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setPromoWidgetVisible(false)}
            aria-label="Cerrar descuento flotante"
            className="absolute top-2 right-3 text-white hover:text-[#FFD100] focus:outline-none z-20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header with dashed bottom and simulated perforated ticket edges — Styled with Active Festive Theme */}
          <div className={`bg-gradient-to-r ${activeFestiveTheme.bannerGradient} text-white p-4 text-center border-b-2 border-dashed border-white relative`}>
            {/* Simulated perforated ticket edges */}
            <div
              className="absolute -left-3 -bottom-3 w-6 h-6 bg-white rounded-full border-4"
              style={{ borderColor: activeFestiveTheme.accentColor }}
            ></div>
            <div
              className="absolute -right-3 -bottom-3 w-6 h-6 bg-white rounded-full border-4"
              style={{ borderColor: activeFestiveTheme.accentColor }}
            ></div>

            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <span className="text-lg">{activeFestiveTheme.iconSymbol}</span>
              <span className="bg-[#FFD100] text-[#0B2861] text-[10px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-sm">
                {activeFestiveTheme.name.split('(')[0]}
              </span>
            </div>
            <h4 className="text-white font-extrabold text-2xl leading-tight">
              {coupons[0]?.discountFixedUsd
                ? `$${coupons[0].discountFixedUsd} USD OFF`
                : `${coupons[0]?.discountPct ?? coupons[0]?.discountValue ?? 10}% DE DSCTO`}
            </h4>
            <p className="text-yellow-100 text-xs mt-0.5 font-medium">
              {coupons[0]?.onlyNewClients
                ? 'Exclusivo Primer Pedido · Cédula / RUC Nuevo'
                : 'En toda la tienda web'}
            </p>
          </div>

          {/* Body */}
          <div className="p-4 text-center relative bg-[#fffdf0] space-y-3">
            <p className="text-gray-600 text-[11px] font-medium">
              Aplica este código en el carrito antes de pagar con tarjeta:
            </p>

            <div
              className="bg-white border-2 border-dashed rounded-lg p-2.5 flex items-center justify-between shadow-inner"
              style={{ borderColor: activeFestiveTheme.primaryColor }}
            >
              <span
                id="coupon-code"
                className="font-black text-lg tracking-widest pl-2"
                style={{ color: activeFestiveTheme.primaryColor }}
              >
                {coupons[0]?.code || 'LATINA26'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const targetCode = coupons[0]?.code || 'LATINA26';
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(targetCode).catch(() => {});
                  }
                  setCopiedCoupon(true);
                  setCouponApplied(true);
                  showToast(`¡Cupón ${targetCode} copiado y aplicado!`);
                  setTimeout(() => setCopiedCoupon(false), 2500);
                }}
                className="text-white hover:brightness-110 rounded-md w-9 h-9 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                style={{ backgroundColor: activeFestiveTheme.primaryColor }}
                title="Copiar Cupón"
                aria-label={`Copiar cupón ${coupons[0]?.code || 'LATINA26'}`}
              >
                {copiedCoupon ? (
                  <Check className="w-4 h-4 text-[#FFD100]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex">
              <button
                type="button"
                onClick={() => {
                  setCouponApplied(true);
                  setIsCartOpen(true);
                  showToast(`Cupón ${coupons[0]?.code || 'LATINA26'} activo.`);
                }}
                className="w-full text-center bg-[#FFD100] hover:bg-yellow-400 text-[#0B2861] font-extrabold py-2.5 px-3 rounded-xl transition-colors shadow-sm text-xs uppercase tracking-wide cursor-pointer"
              >
                ¡Usar en Carrito!
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPromoWidgetVisible(true)}
          className={`fixed bottom-6 left-6 z-40 bg-gradient-to-r ${activeFestiveTheme.bannerGradient} hover:brightness-110 text-white font-extrabold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border-2 border-[#FFD100] cursor-pointer animate-fade-in-up`}
        >
          <span>{activeFestiveTheme.iconSymbol}</span>
          <span>🏷️ {coupons[0]?.code || 'LATINA26'} (-{coupons[0]?.discountPct ?? coupons[0]?.discountValue ?? 10}%)</span>
        </button>
      ))}

      {/* =========================================================================
          MODAL: AYUDA Y SOPORTE DIRECTO (3D Skeuomorphic + Rebote + Alta Definición)
         ========================================================================= */}
      {helpModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] modal-layer-top bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4"
          style={{ zIndex: MODAL_AND_DRAWER_Z_INDEX }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border-2 border-[#0B2861] skeuo-modal-3d relative">
            <div
              className="text-white p-5 flex items-center justify-between border-b-4 border-[#FFD100]"
              style={{ background: activeFestiveTheme.modalHeaderGradient }}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-[#FFD100]" />
                <h3 className="font-extrabold text-base">Ayuda y Soporte al Cliente</h3>
              </div>
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white skeuo-btn-3d cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-gray-700">
              <p className="font-semibold text-gray-900 text-sm">
                ¿Necesita asesoría técnica en su obra o cotización por volumen?
              </p>
              <div className="space-y-3">
                <div className="p-3.5 skeuo-glass-card rounded-xl border border-gray-200">
                  <strong className="block text-[#0B2861] text-sm">Planta Industrial Latina:</strong>
                  <span>Vía a Daule Km 8.5, diagonal a la Florida Norte, Guayaquil.</span>
                  <p className="mt-1 font-mono">Telf: (04) 287-4100 / WhatsApp: +593 97 973 2435</p>
                </div>
                <div className="p-3.5 skeuo-glass-card rounded-xl border border-gray-200">
                  <strong className="block text-[#D8235A] text-sm">Bodega Induless:</strong>
                  <span>Mapasingue Este, Calle Séptima, Guayaquil.</span>
                  <p className="mt-1 font-mono">WhatsApp Soporte: +593 97 973 2435</p>
                </div>
              </div>
              <div className="pt-2">
                <a
                  href="https://wa.me/593979732435?text=Hola,%20solicito%20asesoria%20de%20Industrial%20Latina%20e%20Induless."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs skeuo-btn-3d"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Contactar Asesor por WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FICHA TÉCNICA OFICIAL DEL PRODUCTO (3D Skeuomorphic + Rebote + Alta Definición)
         ========================================================================= */}
      {activeTechSheetItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tech-sheet-modal-title"
          className="fixed inset-0 z-[9999] modal-layer-top bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4"
          style={{ zIndex: MODAL_AND_DRAWER_Z_INDEX }}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden border-2 border-[#0B2861] skeuo-modal-3d relative">
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                activeTechSheetItem.company === 'induless'
                  ? 'bg-[#13314C] border-b-4 border-[#D8235A]'
                  : 'bg-[#0B2861] border-b-4 border-[#FFD100]'
              }`}
              style={{
                background:
                  activeTechSheetItem.company === 'induless'
                    ? undefined
                    : activeFestiveTheme.modalHeaderGradient,
              }}
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFD100]">
                  FICHA TÉCNICA OFICIAL ·{' '}
                  {activeTechSheetItem.company === 'induless'
                    ? 'INDULESS ECUADOR'
                    : 'INDUSTRIAL LATINA ECUADOR'}
                </span>
                <h3 id="tech-sheet-modal-title" className="text-lg font-extrabold font-display">
                  {activeTechSheetItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTechSheetItem(null)}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer skeuo-btn-3d"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
              {/* Product Media (Image & Video) */}
              {(activeTechSheetItem.imageUrl || activeTechSheetItem.videoUrl) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  {activeTechSheetItem.imageUrl && (
                    <div className="flex flex-col items-center justify-center bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-500 uppercase self-start mb-1">
                        Imagen Oficial:
                      </span>
                      <img
                        src={activeTechSheetItem.imageUrl}
                        alt={activeTechSheetItem.name}
                        className="max-h-40 object-contain rounded"
                      />
                    </div>
                  )}
                  {activeTechSheetItem.videoUrl && (
                    <div className="flex flex-col justify-center bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-[#0B2861]" /> Video de Aplicación en Obra:
                      </span>
                      {activeTechSheetItem.videoUrl.includes('youtube.com') ||
                      activeTechSheetItem.videoUrl.includes('youtu.be') ? (
                        <div className="aspect-video w-full rounded overflow-hidden">
                          <iframe
                            src={
                              activeTechSheetItem.videoUrl.includes('embed')
                                ? activeTechSheetItem.videoUrl
                                : activeTechSheetItem.videoUrl
                                    .replace('watch?v=', 'embed/')
                                    .replace('youtu.be/', 'www.youtube.com/embed/')
                            }
                            title="Video de Aplicación"
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <video
                          src={activeTechSheetItem.videoUrl}
                          controls
                          className="w-full max-h-36 rounded bg-black"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <p className="font-extrabold text-gray-900 uppercase text-[11px] mb-1">
                  Descripción Técnica &amp; Comercial:
                </p>
                <p className="text-gray-700 leading-relaxed">
                  {activeTechSheetItem.description ||
                    'Producto certificado conforme a normativas de construcción de la República del Ecuador.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block">Código / Modelo de Catálogo:</span>
                  <strong className="font-mono text-gray-900 text-sm">
                    {activeTechSheetItem.technicalSheet?.catalogCode || activeTechSheetItem.sku}
                  </strong>
                </div>
                <div className="p-3 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block">Normativa / Certificación:</span>
                  <strong className="text-gray-900">
                    {activeTechSheetItem.technicalSheet?.normative || 'NTE INEN Ecuador'}
                  </strong>
                </div>
                <div className="p-3 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block">Rendimiento / Cobertura:</span>
                  <strong className="text-gray-900">
                    {activeTechSheetItem.technicalSheet?.yieldOrCoverage || 'Ver especificaciones'}
                  </strong>
                </div>
                <div className="p-3 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block">Dilución / Potencia / Mezcla:</span>
                  <strong className="text-gray-900">
                    {activeTechSheetItem.technicalSheet?.dilutionOrMix || 'Listo para uso'}
                  </strong>
                </div>
              </div>

              {/* Presentaciones con Precios Específicos */}
              {activeTechSheetItem.presentations && activeTechSheetItem.presentations.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900 uppercase text-[11px]">
                      Presentaciones Oficiales y Precios de Venta en Ecuador:
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Precios Unitarios Vigentes
                    </span>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700 text-[11px] font-bold border-b border-gray-200">
                          <th className="py-2 px-3">Presentación</th>
                          <th className="py-2 px-3">Rendimiento / Detalle</th>
                          <th className="py-2 px-3 text-right">Precio USD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-[11px]">
                        {activeTechSheetItem.presentations.map((pres, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-bold text-gray-900">
                              {pres.name}
                              {pres.skuSuffix && (
                                <span className="ml-1.5 font-mono text-[10px] text-gray-500 font-normal">
                                  ({activeTechSheetItem.sku}{pres.skuSuffix})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-gray-600">
                              {pres.description || 'Presentación estándar'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 text-xs">
                              ${pres.unitPrice.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-gray-900 mb-1.5">
                    Presentaciones Disponibles:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeTechSheetItem.technicalSheet?.presentationOptions || [
                      activeTechSheetItem.unit,
                    ]).map((pres) => (
                      <span
                        key={pres}
                        className="px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 font-mono text-[11px] font-semibold text-gray-800"
                      >
                        {pres}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
                <strong className="block mb-1">Atributos Técnicos Certificados:</strong>
                <ul className="list-disc list-inside space-y-0.5">
                  {(activeTechSheetItem.technicalSheet?.highlights || [
                    'Garantía técnica de fabricante',
                    'Cumplimiento con estándares NTE INEN Ecuador',
                  ]).map((hl) => (
                    <li key={hl}>{hl}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadTechnicalSheetPdf(activeTechSheetItem)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#0B2861]" />
                  <span>Descargar Ficha Técnica PDF</span>
                </button>

                <a
                  href={
                    activeTechSheetItem.technicalSheet?.googleDriveUrl ||
                    `https://drive.google.com/file/d/1IndLatina_${activeTechSheetItem.sku}_FichaTecnica/view?usp=sharing`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-[#0B2861] text-xs font-extrabold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Ficha en Google Drive</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => {
                  const presObj = activeTechSheetItem.presentations?.[0];
                  const chosenPres = presObj ? presObj.name : activeTechSheetItem.unit;
                  const chosenPrice = presObj ? presObj.unitPrice : activeTechSheetItem.unitPrice;
                  handleAddToCart(activeTechSheetItem, 1, chosenPres, chosenPrice);
                  setActiveTechSheetItem(null);
                  setIsCartOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0B2861] hover:bg-blue-900 text-white text-xs font-extrabold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#FFD100]" />
                <span>Agregar Producto al Carrito</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SHOPPING CART & CHECKOUT DRAWER (3D Skeuomorphic Drawer + Rebote + Alta Definición)
         ========================================================================= */}
      {isCartOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Carrito de compra y tramitación de pedido"
          className="fixed inset-0 z-[9999] modal-layer-top bg-slate-950/75 backdrop-blur-md flex justify-end"
          style={{ zIndex: MODAL_AND_DRAWER_Z_INDEX }}
        >
          <div className="bg-white w-full max-w-xl h-full flex flex-col justify-between overflow-hidden skeuo-drawer-3d relative">
            <div
              className="px-6 py-4 text-white flex items-center justify-between border-b-4 border-[#FFD100]"
              style={{ background: activeFestiveTheme.modalHeaderGradient }}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-5 h-5 text-[#FFD100]" />
                <div>
                  <h3 className="text-base font-extrabold font-display">
                    Carrito de Compra · Industrial Latina &amp; Induless
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Facturación Electrónica SRI &amp; Código de Vendedor Digital
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer skeuo-btn-3d"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Promo Coupon Status Bar */}
              <div className="p-3.5 rounded-xl bg-[#fffdf0] border-2 border-dashed border-[#0B2861] flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-extrabold text-[#0B2861]">
                    {couponApplied ? '✓ Cupón LATINA26 Activo' : '¿Tienes un cupón de descuento?'}
                  </span>
                  <p className="text-[11px] text-gray-500">
                    {couponApplied
                      ? '10% de descuento aplicado en toda la orden.'
                      : 'Aplica LATINA26 para obtener 10% OFF en tu compra web.'}
                  </p>
                </div>
                {!couponApplied ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCouponApplied(true);
                      showToast('¡Cupón LATINA26 aplicado con 10% de descuento!');
                    }}
                    className="px-3 py-1.5 bg-[#FFD100] text-[#0B2861] font-bold text-xs rounded-lg hover:bg-yellow-400 cursor-pointer shrink-0"
                  >
                    Aplicar Cupón
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    -10% APLICADO
                  </span>
                )}
              </div>

              {/* Order Confirmation Receipt if Completed */}
              {checkoutReceipt && (
                <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-700 text-white font-extrabold uppercase text-[10px]">
                      Pedido Registrado
                    </span>
                    <span className="font-mono font-bold">{checkoutReceipt.orderCode}</span>
                  </div>
                  <p className="font-bold text-sm">
                    ¡Orden confirmada exitosamente con factura digital del SRI!
                  </p>
                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-emerald-200 font-mono">
                    <div>
                      <span className="text-gray-500 block text-[10px]">
                        Código Vendedor Digital:
                      </span>
                      <strong className="text-[#0B2861] text-sm">
                        {checkoutReceipt.digitalSellerCode}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">
                        Factura SRI:
                      </span>
                      <strong className="text-gray-900">{checkoutReceipt.invoiceNumber}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Guía Remisión:</span>
                      <strong className="text-gray-900">{checkoutReceipt.trackingCode}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Total Liquidado:</span>
                      <strong className="text-emerald-700">
                        USD ${checkoutReceipt.total.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCartOpen(false);
                        onOpenExternalAdmin();
                      }}
                      className="px-3.5 py-2 rounded-lg bg-[#0B2861] text-white font-bold text-xs cursor-pointer"
                    >
                      Ver en Panel Administrador →
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutReceipt(null)}
                      className="text-xs underline font-semibold text-emerald-800 cursor-pointer"
                    >
                      Nueva Compra
                    </button>
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  Su carrito está vacío. Seleccione productos del catálogo.
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.sku}
                      className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              item.company === 'induless'
                                ? 'bg-[#D8235A] text-white'
                                : 'bg-[#0B2861] text-white'
                            }`}
                          >
                            {item.company === 'induless' ? 'Induless' : 'Industrial Latina'}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-gray-500">
                            {item.sku}
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-gray-900 truncate mt-1">
                          {item.name}
                        </p>
                        {item.presentationSelected && (
                          <p className="text-[11px] text-gray-500">
                            Presentación: {item.presentationSelected}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={item.maxStock}
                          value={item.quantity}
                          aria-label={`Cantidad para ${item.name}`}
                          onChange={(e) =>
                            handleUpdateCartQty(item.sku, Number(e.target.value))
                          }
                          className="w-16 px-2 py-1 text-xs font-mono font-bold text-center bg-white border border-gray-300 rounded-lg"
                        />
                        <div className="text-right w-20 font-mono text-xs font-extrabold text-gray-900">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkout Form */}
              {cart.length > 0 && (
                <form onSubmit={handleSubmitCustomerCheckout} className="space-y-4 border-t border-gray-200 pt-5">
                  <div className="p-4 rounded-xl bg-blue-50 border border-[#0B2861]/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="digital-seller-code"
                        className="text-xs font-extrabold text-[#0B2861] flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Código de Vendedor Digital (Ecuador):</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateRandomSellerCode}
                        className="text-[11px] font-bold text-[#E3000F] underline cursor-pointer"
                      >
                        Generar Código
                      </button>
                    </div>

                    <select
                      id="digital-seller-code"
                      value={digitalSellerCode}
                      onChange={(e) => setDigitalSellerCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-[#0B2861]/40 rounded-lg text-gray-900"
                    >
                      <option value="">Seleccione un vendedor digital (opcional)...</option>
                      {VENDEDORES_DIGITALES_ECUADOR.map((v) => (
                        <option key={v.code} value={v.code}>
                          {v.code} — {v.name} ({v.zone})
                        </option>
                      ))}
                      {digitalSellerCode &&
                        !VENDEDORES_DIGITALES_ECUADOR.some(
                          (v) => v.code === digitalSellerCode
                        ) && (
                          <option value={digitalSellerCode}>
                            {digitalSellerCode} — Vendedor Digital Autogenerado
                          </option>
                        )}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        Cliente / Razón Social (Ecuador)
                      </label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ingrese nombres o razón social"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        RUC / Cédula (SRI Ecuador)
                      </label>
                      <input
                        type="text"
                        required
                        value={clientNit}
                        onChange={(e) => setClientNit(e.target.value)}
                        placeholder="Ej. 0990000000001 o 1700000000"
                        className="w-full px-3 py-2 font-mono bg-gray-50 border border-gray-300 rounded-lg"
                      />
                      {clientNit.trim().length > 0 && (
                        <p
                          className={`text-[10px] font-bold mt-1 ${
                            cartCouponValidation.isNewCustomer
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {cartCouponValidation.isNewCustomer
                            ? '✓ Cédula/RUC de Cliente Nuevo en Firestore (Elegible para Cupón)'
                            : '⚠ Cédula/RUC ya registra pedidos en Firestore (Sin descuento de cliente nuevo)'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        Correo Electrónico (Factura SRI)
                      </label>
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="correo@ejemplo.ec"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        WhatsApp para Notificaciones
                      </label>
                      <input
                        type="text"
                        value={clientWhatsapp}
                        onChange={(e) => setClientWhatsapp(e.target.value)}
                        placeholder="Ej. +593 99 000 0000"
                        className="w-full px-3 py-2 font-mono bg-gray-50 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        Ciudad de Despacho (Ecuador)
                      </label>
                      <select
                        required
                        value={cityEcuador}
                        onChange={(e) => setCityEcuador(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                      >
                        <option value="">Seleccione ciudad de despacho...</option>
                        <option value="Guayaquil - Vía a Daule / Mapasingue">
                          Guayaquil (Planta Matriz)
                        </option>
                        <option value="Quito - Distrito Metropolitano">Quito</option>
                        <option value="Cuenca - Parque Industrial">Cuenca</option>
                        <option value="Manta / Portoviejo - Manabí">Manta / Portoviejo</option>
                        <option value="Machala - El Oro">Machala</option>
                        <option value="Ambato - Tungurahua">Ambato</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        Dirección de Entrega
                      </label>
                      <input
                        type="text"
                        required
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.target.value)}
                        placeholder="Calle principal, número y referencia"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Totals Summary */}
                  <div className="p-4 rounded-xl bg-gray-900 text-white space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal Productos:</span>
                      <span className="font-mono">${cartSummary.subtotal.toFixed(2)}</span>
                    </div>
                    {couponApplied && cartSummary.couponDiscount > 0 && (
                      <div className="flex justify-between text-[#FFD100]">
                        <span>Descuento Cupón LATINA26 (Cliente Nuevo Verificado):</span>
                        <span className="font-mono">-${cartSummary.couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {couponApplied && !cartCouponValidation.valid && (
                      <div className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-500/40 rounded-lg px-2.5 py-1.5">
                        {cartCouponValidation.message}
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Base Imponible:</span>
                      <span className="font-mono">${cartSummary.taxableBase.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Impuesto Fiscal IVA (15% Ecuador):</span>
                      <span className="font-mono">${cartSummary.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/15 text-sm font-extrabold">
                      <span>Total Pedido a Generar (USD):</span>
                      <span className="font-mono text-[#FFD100]">
                        USD ${cartSummary.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Primary CTA: Ecuadorian Payment Gateway with Card, All Banks & GPS */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsPaymentModalOpen(true);
                      }}
                      className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-[#0B2861] via-blue-900 to-[#0B2861] hover:brightness-110 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl border-2 border-[#FFD100] cursor-pointer transition-all"
                    >
                      <CreditCard className="w-5 h-5 text-[#FFD100]" />
                      <span>Pagar con Tarjeta de Bancos del Ecuador &amp; Guardar GPS</span>
                    </button>
                    <p className="text-[11px] text-gray-500 text-center font-medium">
                      🏦 Acepta los 13 bancos y cooperativas del Ecuador, cálculo de diferidos y georreferencia GPS.
                    </p>
                  </div>

                  {/* Descarga Ejecutiva de Proforma / Cotización Oficial */}
                  <button
                    type="button"
                    onClick={handleDownloadCartQuotation}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-blue-50 text-[#0B2861] font-extrabold text-xs flex items-center justify-center gap-2 border-2 border-[#0B2861]/30 cursor-pointer transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4 text-[#0B2861]" />
                    <span>Descargar Proforma / Cotización Ejecutiva (PDF con Logos)</span>
                  </button>

                  <button
                    type="submit"
                    disabled={checkoutSubmitting}
                    className="w-full py-3 px-5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 border border-gray-300 cursor-pointer transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-[#0B2861]" />
                    <span>
                      {checkoutSubmitting
                        ? 'Transmitiendo Pedido...'
                        : `O Pago Rápido / Transferencia ($${cartSummary.total.toFixed(2)})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelCustomerOrder}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-red-200 cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancelar / Vaciar Pedido y Limpiar Datos</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PASARELA DE PAGO CON TARJETAS DE BANCOS DE ECUADOR & GPS LOGÍSTICO
         ========================================================================= */}
      <EcuadorianPaymentCheckoutModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onCancelOrder={handleCancelCustomerOrder}
        cart={cart}
        onUpdateCartQty={handleUpdateCartQty}
        orders={orders}
        availableCoupons={coupons.filter((c) => c.active !== false)}
        activeThemeId={activeThemeId}
        onVerifyCouponInFirestore={onVerifyCouponInFirestore}
        onCustomerCheckout={async (payload) => {
          const res = await onCustomerCheckout({
            ...payload,
            ecuadorBank: payload.ecuadorBank as EcuadorianBank | undefined,
          });
          setCart(createInitialEmptyCart());
          resetPurchaseFormFields();
          clearPurchaseAndCartStorage();
          setCheckoutReceipt(res);
          setTrackingSearch(res.trackingCode);
          return res;
        }}
        onOpenExternalAdmin={onOpenExternalAdmin}
      />

      {/* =========================================================================
          FOOTER — Exact HTML Template replica (#0B2861 + border-t-4 #E3000F)
         ========================================================================= */}
      <footer
        className="bg-[#0B2861] text-white pt-10 pb-12 border-t-4 transition-all duration-300 relative z-20"
        style={{ borderTopColor: activeFestiveTheme.secondaryColor }}
      >
        {/* Festive Theme Banner in Footer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 pb-6 border-b border-blue-900/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-2xl p-1.5 rounded-lg bg-white/10">{activeFestiveTheme.iconSymbol}</span>
            <div>
              <span className="font-extrabold text-[#FFD100] mr-2">{activeFestiveTheme.name}</span>
              <span className="text-blue-200">{activeFestiveTheme.festiveSalute}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
              {activeFestiveTheme.heroBadge}
            </span>
            <span className="text-xs text-blue-300 font-semibold">{activeFestiveTheme.dates}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div className="space-y-3">
            <div className="inline-flex items-center bg-white px-3 py-1.5 rounded-xl shadow-xs">
              <img
                src="/assets/aistudio/Industrial_Latina_2_f5b18e35.png"
                alt="Industrial Latina"
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-blue-200 leading-relaxed">
              Líder en pinturas arquitectónicas, empastes, morteros y soluciones químicas para la
              construcción en Ecuador desde 1980.
            </p>
            <p className="text-blue-300 font-medium">Planta Vía a Daule Km 8.5 · Guayaquil</p>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center bg-white px-3 py-1.5 rounded-xl shadow-xs">
              <img
                src="/assets/aistudio/Induless_2_fe52db1f.png"
                alt="Induless"
                className="h-9 w-auto object-contain"
              />
            </div>
            <p className="text-blue-200 leading-relaxed">
              Importadora de conductores eléctricos CONDEX, iluminación LED, techoforte, grifería y
              ferretería pesada.
            </p>
            <p className="text-blue-300 font-medium">Bodega Mapasingue Este · Guayaquil</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-base font-extrabold text-white">Navegación Rápida</h4>
            <ul className="space-y-1.5 text-blue-200">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('inicio')}
                  className="hover:text-[#FFD100] transition-colors"
                >
                  Inicio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('productos')}
                  className="hover:text-[#FFD100] transition-colors"
                >
                  Catálogo por Empresa
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('calculadora')}
                  className="hover:text-[#FFD100] transition-colors"
                >
                  Calculadora de Pintura
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('disenador')}
                  className="hover:text-[#FFD100] transition-colors"
                >
                  Diseñador Virtual 3D
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('rastreo')}
                  className="hover:text-[#FFD100] transition-colors"
                >
                  Rastreo de Envíos SRI
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-base font-extrabold text-white">Contacto y Redes Oficiales</h4>
            <p className="text-blue-200">
              Atención a nivel nacional para obras, constructoras y ferreterías:
            </p>
            <p className="text-[#FFD100] font-mono font-bold">+593 97 973 2435</p>

            {/* Social Network Links in Footer */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {companySettings.socialNetworks.facebook && (
                <a
                  href={companySettings.socialNetworks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#FFD100] hover:text-[#0B2861] flex items-center justify-center transition-colors"
                  title="Facebook"
                >
                  <i className="fab fa-facebook-f text-xs"></i>
                </a>
              )}
              {companySettings.socialNetworks.instagram && (
                <a
                  href={companySettings.socialNetworks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#FFD100] hover:text-[#0B2861] flex items-center justify-center transition-colors"
                  title="Instagram"
                >
                  <i className="fab fa-instagram text-xs"></i>
                </a>
              )}
              {companySettings.socialNetworks.tiktok && (
                <a
                  href={companySettings.socialNetworks.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#FFD100] hover:text-[#0B2861] flex items-center justify-center transition-colors font-bold text-[10px]"
                  title="TikTok"
                >
                  <i className="fab fa-tiktok"></i>
                </a>
              )}
              {companySettings.socialNetworks.youtube && (
                <a
                  href={companySettings.socialNetworks.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#FFD100] hover:text-[#0B2861] flex items-center justify-center transition-colors"
                  title="YouTube"
                >
                  <i className="fab fa-youtube text-xs"></i>
                </a>
              )}
              {companySettings.socialNetworks.whatsapp && (
                <a
                  href={`https://wa.me/${companySettings.socialNetworks.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenExternalAdmin}
                className="text-[11px] text-blue-300 hover:text-white underline cursor-pointer"
              >
                Anexo Externo: Consola de Administración ERP (/admin)
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 border-t border-blue-900/60 pt-6 text-center">
          <p className="text-gray-400 text-xs sm:text-sm">
            &copy; 2026 Industrial Latina. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* =========================================================================
          MODAL EJECUTIVO: VISOR Y DESCARGA OFICIAL DE DOCUMENTOS CORPORATIVOS
         ========================================================================= */}
      {executiveModalDoc && (
        <ExecutiveDocumentPreviewModal
          isOpen={executiveModalDoc.isOpen}
          onClose={() => setExecutiveModalDoc(null)}
          title={executiveModalDoc.title}
          documentHtml={executiveModalDoc.html}
          filename={executiveModalDoc.filename}
        />
      )}

      {/* =========================================================================
          SIMULADOR JUEGO 3D LOGÍSTICO (THREE.JS FULL-VIEWPORT SHELL)
         ========================================================================= */}
      <Industrial3dLogisticsGameModal
        isOpen={is3dGameOpen}
        onClose={() => setIs3dGameOpen(false)}
        autoStart={autoStart3dGame}
      />

      {/* =========================================================================
          ASISTENTE INTERACTIVO IA INDUSTRIAL LATINA & INDULESS (24/7)
         ========================================================================= */}
      <IndustrialLatinaAiBot
        inventory={inventory}
        onOpenMultimodalLab={() => navigateTo('laboratorio_ia')}
        onOpenCatalogPdf={() => {
          const html = generateMinimalistCatalogExecutiveHtml(inventory);
          setExecutiveModalDoc({
            isOpen: true,
            title: 'Catálogo Corporativo Minimalista — Industrial Latina & Induless',
            html,
            filename: `Catalogo_Minimalista_Industrial_Latina_${new Date().toISOString().slice(0, 10)}`,
          });
          downloadMinimalistCatalogPdf(inventory);
        }}
      />
    </div>
  );
};
