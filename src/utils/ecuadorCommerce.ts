import {
  CompanySettings,
  DiscountCoupon,
  EcuadorianBank,
  FlashFlyerPromo,
  Order,
} from '../types/erp';

export interface BankEntityDefinition {
  id: EcuadorianBank;
  name: string;
  shortName: string;
  colorHex: string;
  supportedCards: ('visa' | 'mastercard' | 'diners' | 'amex' | 'discover' | 'alia')[];
  allowsDeferred: boolean;
  maxDeferredMonths: number;
  badgeText: string;
}

export const ECUADOR_BANKS_CATALOG: BankEntityDefinition[] = [
  {
    id: 'banco_pichincha',
    name: 'Banco Pichincha',
    shortName: 'Pichincha',
    colorHex: '#FFD100',
    supportedCards: ['visa', 'mastercard', 'diners', 'discover'],
    allowsDeferred: true,
    maxDeferredMonths: 24,
    badgeText: 'Líder en Cobertura Nacional',
  },
  {
    id: 'banco_guayaquil',
    name: 'Banco Guayaquil',
    shortName: 'Guayaquil',
    colorHex: '#D8235A',
    supportedCards: ['visa', 'mastercard', 'amex'],
    allowsDeferred: true,
    maxDeferredMonths: 24,
    badgeText: 'Banco Guayaquil · Primero Tú',
  },
  {
    id: 'produbanco',
    name: 'Produbanco (Grupo Promerica)',
    shortName: 'Produbanco',
    colorHex: '#007A3D',
    supportedCards: ['visa', 'mastercard'],
    allowsDeferred: true,
    maxDeferredMonths: 24,
    badgeText: 'Banca Digital & Verde',
  },
  {
    id: 'banco_pacifico',
    name: 'Banco del Pacífico',
    shortName: 'Pacífico',
    colorHex: '#005A9C',
    supportedCards: ['visa', 'mastercard'],
    allowsDeferred: true,
    maxDeferredMonths: 18,
    badgeText: 'Red de Autoservicios',
  },
  {
    id: 'banco_bolivariano',
    name: 'Banco Bolivariano (Bankard)',
    shortName: 'Bolivariano',
    colorHex: '#002B49',
    supportedCards: ['visa', 'mastercard'],
    allowsDeferred: true,
    maxDeferredMonths: 18,
    badgeText: 'Bankard Visa / Mastercard',
  },
  {
    id: 'banco_internacional',
    name: 'Banco Internacional',
    shortName: 'Internacional',
    colorHex: '#E3000F',
    supportedCards: ['visa', 'mastercard'],
    allowsDeferred: true,
    maxDeferredMonths: 12,
    badgeText: 'Queremos Ser Más',
  },
  {
    id: 'banco_del_austro',
    name: 'Banco del Austro',
    shortName: 'Austro',
    colorHex: '#93278F',
    supportedCards: ['visa', 'mastercard', 'alia'],
    allowsDeferred: true,
    maxDeferredMonths: 18,
    badgeText: 'El Banco de Nuestra Gente',
  },
  {
    id: 'cooperativa_jep',
    name: 'Cooperativa JEP (Juventud Ecuatoriana Progresista)',
    shortName: 'Coop. JEP',
    colorHex: '#1E824C',
    supportedCards: ['visa', 'mastercard'],
    allowsDeferred: true,
    maxDeferredMonths: 12,
    badgeText: 'Mayor Cooperativa de Ahorro y Crédito',
  },
  {
    id: 'cooperativa_29_octubre',
    name: 'Cooperativa 29 de Octubre',
    shortName: '29 de Octubre',
    colorHex: '#C0392B',
    supportedCards: ['visa'],
    allowsDeferred: true,
    maxDeferredMonths: 12,
    badgeText: 'Fuerzas Armadas & Civil',
  },
  {
    id: 'cooperativa_alianza_valle',
    name: 'Cooperativa Alianza del Valle',
    shortName: 'Alianza Valle',
    colorHex: '#27AE60',
    supportedCards: ['visa'],
    allowsDeferred: true,
    maxDeferredMonths: 12,
    badgeText: 'Sierra & Costa',
  },
  {
    id: 'mutualista_pichincha',
    name: 'Mutualista Pichincha',
    shortName: 'Mutualista',
    colorHex: '#2980B9',
    supportedCards: ['visa', 'mastercard'],
    allowsDeferred: true,
    maxDeferredMonths: 12,
    badgeText: 'Especialista en Crédito de Construcción',
  },
  {
    id: 'payphone_ecuador',
    name: 'PayPhone Ecuador (Billetera / Tarjeta Virtual)',
    shortName: 'PayPhone',
    colorHex: '#FF5722',
    supportedCards: ['visa', 'mastercard'],
    allowsDeferred: false,
    maxDeferredMonths: 1,
    badgeText: 'Pago QR & App Móvil Directa',
  },
  {
    id: 'datafast_kushki',
    name: 'Datafast / Kushki Red Ecuatoriana',
    shortName: 'Datafast / Kushki',
    colorHex: '#0B2861',
    supportedCards: ['visa', 'mastercard', 'diners', 'amex', 'discover', 'alia'],
    allowsDeferred: true,
    maxDeferredMonths: 24,
    badgeText: 'Switch Bancario Nacional 3D Secure',
  },
];

export interface DeferredOption {
  months: number;
  label: string;
  hasInterest: boolean;
  interestPct: number;
  monthlyAmount: number;
  totalWithInterest: number;
}

export function computeDeferredOptions(totalAmount: number): DeferredOption[] {
  const safeTotal = Math.max(1, Number(totalAmount) || 0);

  const plans = [
    { months: 1, label: 'Corriente / Rotativo (1 solo pago sin recargo)', hasInterest: false, interestPct: 0 },
    { months: 3, label: '3 meses sin intereses (Promoción Industrial Latina)', hasInterest: false, interestPct: 0 },
    { months: 6, label: '6 meses sin intereses (Convenio Bancario Ecuador)', hasInterest: false, interestPct: 0 },
    { months: 9, label: '9 meses con intereses (Tasa BCE 1.15% mensual)', hasInterest: true, interestPct: 0.052 },
    { months: 12, label: '12 meses sin intereses (Compras mayores a USD $150)', hasInterest: false, interestPct: 0 },
    { months: 18, label: '18 meses con intereses (Tasa fija preferencial)', hasInterest: true, interestPct: 0.098 },
    { months: 24, label: '24 meses con intereses (Obras y constructoras)', hasInterest: true, interestPct: 0.134 },
  ];

  return plans.map((p) => {
    const totalWithInterest = Math.round(safeTotal * (1 + p.interestPct) * 100) / 100;
    const monthlyAmount = Math.round((totalWithInterest / p.months) * 100) / 100;
    return {
      months: p.months,
      label: p.label,
      hasInterest: p.hasInterest,
      interestPct: p.interestPct,
      monthlyAmount,
      totalWithInterest,
    };
  });
}

/**
 * Normalizes an Ecuadorian Cédula or RUC and checks if it belongs to a new customer
 * by verifying that no non-cancelled orders exist for that identification in Firestore/ERP.
 */
export function isNewCustomerByNit(
  clientNit: string,
  existingOrders: Order[]
): boolean {
  const cleanNit = (clientNit || '').trim().replace(/[^0-9a-zA-Z]/g, '');
  if (!cleanNit || cleanNit.length < 4) {
    return false;
  }
  const hasPriorOrders = existingOrders.some((order) => {
    const orderNit = (order.clientNit || '').trim().replace(/[^0-9a-zA-Z]/g, '');
    return orderNit === cleanNit && order.status !== 'cancelado';
  });
  return !hasPriorOrders;
}

/**
 * Validates a discount coupon:
 * Critical Requirement: Verify if the client's Cédula or RUC belongs to a new customer
 * using the existing orders database (Firestore + ERP) before applying the discount.
 */
export function validateCouponForClient(
  couponCode: string,
  clientNit: string,
  availableCoupons: DiscountCoupon[],
  existingOrders: Order[]
): {
  valid: boolean;
  discountPct: number;
  discountFixedUsd: number;
  coupon?: DiscountCoupon;
  isNewCustomer: boolean;
  message: string;
} {
  const cleanCode = (couponCode || '').trim().toUpperCase();
  const cleanNit = (clientNit || '').trim().replace(/[^0-9a-zA-Z]/g, '');

  if (!cleanCode) {
    return {
      valid: false,
      discountPct: 0,
      discountFixedUsd: 0,
      isNewCustomer: false,
      message: 'Ingrese un código de cupón.',
    };
  }

  const foundCoupon = availableCoupons.find(
    (c) => c.code.toUpperCase() === cleanCode && c.active !== false
  );

  if (!foundCoupon) {
    return {
      valid: false,
      discountPct: 0,
      discountFixedUsd: 0,
      isNewCustomer: false,
      message: `El cupón '${cleanCode}' no es válido, está desactivado o ha expirado.`,
    };
  }

  if (!cleanNit || cleanNit.length < 4) {
    return {
      valid: false,
      discountPct: 0,
      discountFixedUsd: 0,
      coupon: foundCoupon,
      isNewCustomer: false,
      message: 'Para aplicar este cupón ingrese primero una Cédula o RUC ecuatoriano válido.',
    };
  }

  const newCustomer = isNewCustomerByNit(clientNit, existingOrders);
  const enforceNewClientCheck = foundCoupon.onlyNewClients !== false;

  if (enforceNewClientCheck && !newCustomer) {
    return {
      valid: false,
      discountPct: 0,
      discountFixedUsd: 0,
      coupon: foundCoupon,
      isNewCustomer: false,
      message: `El cupón '${foundCoupon.code}' es exclusivo para CLIENTES NUEVOS en su primera compra. La Cédula/RUC '${clientNit.trim()}' ya registra pedidos existentes en Firestore.`,
    };
  }

  const resolvedPct =
    foundCoupon.discountType === 'fixed'
      ? 0
      : foundCoupon.discountPct ?? foundCoupon.discountValue ?? 0;
  const resolvedFixed =
    foundCoupon.discountType === 'fixed'
      ? foundCoupon.discountFixedUsd ?? foundCoupon.discountValue ?? 0
      : foundCoupon.discountFixedUsd || 0;

  return {
    valid: true,
    discountPct: resolvedPct,
    discountFixedUsd: resolvedFixed,
    coupon: foundCoupon,
    isNewCustomer: newCustomer,
    message: `¡Cupón '${foundCoupon.code}' validado en Firestore! Cédula/RUC '${clientNit.trim()}' verificada como cliente nuevo (${resolvedFixed > 0 ? `-$${resolvedFixed.toFixed(2)} USD` : `-${resolvedPct}%`}).`,
  };
}

export interface CheckoutCouponEvaluationResult {
  couponRequested: boolean;
  applied: boolean;
  isNewCustomer: boolean;
  finalDiscountUsd: number;
  couponCodeApplied?: string;
  validationMessage: string | null;
}

/**
 * Evaluates and enforces coupon eligibility during handleCustomerCheckout
 * against the existing orders database fetched from Firestore.
 */
export function evaluateCheckoutCouponForOrder(params: {
  couponCodeApplied?: string;
  couponDiscountUsd?: number;
  clientNit: string;
  cartSubtotal: number;
  availableCoupons: DiscountCoupon[];
  existingOrders: Order[];
}): CheckoutCouponEvaluationResult {
  const cleanSubtotal = Math.max(0, Number(params.cartSubtotal) || 0);
  const requestedCode = (params.couponCodeApplied || '').trim().toUpperCase();
  const requestedDiscount = Math.max(0, Number(params.couponDiscountUsd) || 0);
  const couponRequested = Boolean(requestedCode) || requestedDiscount > 0;
  const newCustomer = isNewCustomerByNit(params.clientNit, params.existingOrders);

  if (!couponRequested) {
    return {
      couponRequested: false,
      applied: false,
      isNewCustomer: newCustomer,
      finalDiscountUsd: 0,
      couponCodeApplied: undefined,
      validationMessage: null,
    };
  }

  const effectiveCode = requestedCode || 'LATINA26';
  const validation = validateCouponForClient(
    effectiveCode,
    params.clientNit,
    params.availableCoupons,
    params.existingOrders
  );

  if (!validation.valid || !validation.coupon) {
    return {
      couponRequested: true,
      applied: false,
      isNewCustomer: validation.isNewCustomer,
      finalDiscountUsd: 0,
      couponCodeApplied: undefined,
      validationMessage: validation.message,
    };
  }

  if (
    validation.coupon.minPurchaseUsd &&
    cleanSubtotal < validation.coupon.minPurchaseUsd
  ) {
    return {
      couponRequested: true,
      applied: false,
      isNewCustomer: validation.isNewCustomer,
      finalDiscountUsd: 0,
      couponCodeApplied: undefined,
      validationMessage: `El cupón '${validation.coupon.code}' requiere una compra mínima de USD $${validation.coupon.minPurchaseUsd.toFixed(2)} (Subtotal actual: USD $${cleanSubtotal.toFixed(2)}).`,
    };
  }

  const calculatedDiscount = resolveCouponDiscount(validation.coupon, cleanSubtotal);
  const finalDiscountUsd =
    calculatedDiscount > 0
      ? Math.min(cleanSubtotal, calculatedDiscount)
      : Math.min(cleanSubtotal, requestedDiscount);

  return {
    couponRequested: true,
    applied: finalDiscountUsd > 0,
    isNewCustomer: validation.isNewCustomer,
    finalDiscountUsd: Math.round(finalDiscountUsd * 100) / 100,
    couponCodeApplied: validation.coupon.code,
    validationMessage: validation.message,
  };
}

export const INITIAL_DISCOUNT_COUPONS: DiscountCoupon[] = [
  {
    id: 'coup_latina26',
    code: 'LATINA26',
    discountPct: 10,
    onlyNewClients: true,
    minPurchaseUsd: 20,
    expiresAt: '2026-12-31',
    description: '10% de descuento de bienvenida en tu primera compra por Cédula o RUC nuevo.',
    active: true,
    themeAffinity: 'corporativo',
  },
  {
    id: 'coup_guayaquil',
    code: 'VIVAGUAYAQUIL',
    discountPct: 15,
    onlyNewClients: true,
    minPurchaseUsd: 50,
    expiresAt: '2026-10-31',
    description: '15% de descuento por fiestas julinas/octubrinas para clientes nuevos en Guayas.',
    active: true,
    themeAffinity: 'guayaquil',
  },
  {
    id: 'coup_quito',
    code: 'FIESTASQUITO',
    discountPct: 15,
    onlyNewClients: true,
    minPurchaseUsd: 50,
    expiresAt: '2026-12-15',
    description: '15% de descuento en pinturas de interior por Fiestas de Quito para nuevos clientes.',
    active: true,
    themeAffinity: 'quito',
  },
  {
    id: 'coup_carnaval',
    code: 'CARNAVAL2026',
    discountPct: 12,
    onlyNewClients: true,
    minPurchaseUsd: 30,
    expiresAt: '2026-03-31',
    description: '12% de descuento en pinturas impermeables y selladores para clientes primerizos.',
    active: true,
    themeAffinity: 'carnaval',
  },
  {
    id: 'coup_fin_ano',
    code: 'PROSPERIDAD2026',
    discountPct: 14,
    onlyNewClients: true,
    minPurchaseUsd: 40,
    expiresAt: '2026-01-15',
    description: '14% OFF especial de Fin de Año y Año Nuevo en ferretería e iluminación LED.',
    active: true,
    themeAffinity: 'navidad',
  },
];

export const INITIAL_FLASH_FLYERS: FlashFlyerPromo[] = [
  {
    id: 'flyer_01',
    title: '¡Flash Julino & Octubrino · Guayaquil!',
    subtitle: 'Látex Vinil Acrílico Duralín Forte con 25% de ahorro directo en planta',
    badge: 'OFERTA RELÁMPAGO 48H',
    sku: 'LAT-LVA-01',
    productName: 'Duralín Premium Forte Galón',
    originalPrice: 24.99,
    promotionalPrice: 19.99,
    discountPct: 20,
    countdownEndsAt: '2026-10-25T23:59:59Z',
    bannerGradient: 'from-[#009FE3] via-[#0B2861] to-[#005B94]',
    activeTheme: 'guayaquil',
    active: true,
  },
  {
    id: 'flyer_02',
    title: '¡Especial Quiteño · Carita de Dios!',
    subtitle: 'Pintura Satinada Tipo 1 Lavable en tonos marfil, perla y blanco puro',
    badge: 'SUPER PRECIO FIESTAS',
    sku: 'LAT-SAT-01',
    productName: 'Pintura Satinada Tipo 1 Galón',
    originalPrice: 28.5,
    promotionalPrice: 22.8,
    discountPct: 20,
    countdownEndsAt: '2026-12-06T23:59:59Z',
    bannerGradient: 'from-[#922B21] via-[#154360] to-[#F39C12]',
    activeTheme: 'quito',
    active: true,
  },
  {
    id: 'flyer_03',
    title: '¡Renovación Total de Fin de Año!',
    subtitle: 'Paneles LED Redondos Induless 18W + Fregadero Inox en combo arquitectónico',
    badge: 'COMBO NAVIDEÑO',
    sku: 'PRL18E',
    productName: 'Panel LED 18W Empotrable Induless',
    originalPrice: 8.5,
    promotionalPrice: 5.95,
    discountPct: 30,
    countdownEndsAt: '2026-12-31T23:59:59Z',
    bannerGradient: 'from-[#196F3D] via-[#C0392B] to-[#F4D03F]',
    activeTheme: 'navidad',
    active: true,
  },
];

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  officialContactEmail: 'compras@industriallatina.com.ec',
  officialNotificationWhatsapp: '+593 97 973 2435',
  distributorsInboxEmail: 'distribuidores@industriallatina.com.ec',
  distributorsWhatsapp: '+593 97 973 2435',
  socialNetworks: {
    facebook: 'https://www.facebook.com/IndustrialLatinaEc',
    instagram: 'https://www.instagram.com/industriallatina_ec',
    tiktok: 'https://www.tiktok.com/@industriallatina.ec',
    youtube: 'https://www.youtube.com/@industriallatinaecuador',
    whatsapp: 'https://wa.me/593979732435',
  },
  activeFestiveTheme: 'corporativo',
};

export function resolveCouponDiscount(
  coupon: DiscountCoupon | null | undefined,
  subtotal: number
): number {
  if (!coupon || !coupon.active) return 0;
  if (coupon.discountType === 'fixed' || (coupon.discountFixedUsd && coupon.discountFixedUsd > 0)) {
    const fixedVal = coupon.discountFixedUsd || coupon.discountValue || 0;
    return Math.min(subtotal, fixedVal);
  }
  const pct = coupon.discountPct ?? coupon.discountValue ?? 0;
  return Number(((subtotal * pct) / 100).toFixed(2));
}

export const DEFAULT_COMPANY_SETTINGS = INITIAL_COMPANY_SETTINGS;
export const DEFAULT_COUPONS = INITIAL_DISCOUNT_COUPONS;
export const DEFAULT_FLASH_FLYERS = INITIAL_FLASH_FLYERS;
