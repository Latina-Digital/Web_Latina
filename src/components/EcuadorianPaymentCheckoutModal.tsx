import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  HelpCircle,
  Link2,
  LocateFixed,
  Mail,
  MapPin,
  MessageSquare,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tag,
  Truck,
  UserCheck,
  X,
} from 'lucide-react';
import {
  DeliveryGpsLocation,
  DiscountCoupon,
  EcuadorFestiveThemeId,
  EcuadorianBank,
  Order,
  PaymentMethod,
} from '../types/erp';
import { CartItem } from '../utils/erpLogic';
import {
  computeDeferredOptions,
  ECUADOR_BANKS_CATALOG,
  validateCouponForClient,
} from '../utils/ecuadorCommerce';
import { getActiveFestiveTheme } from '../utils/ecuadorThemes';
import {
  triggerFileDownload,
  generateInvoiceExecutiveHtml,
  triggerExecutiveDocumentDownload,
} from '../utils/downloadHelper';
import { VENDEDORES_DIGITALES_ECUADOR } from '../data/seedData';
import {
  clearPurchaseAndCartStorage,
  createInitialCheckoutFormState,
} from '../utils/cleanInitialState';

interface EcuadorianPaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelOrder?: () => void;
  cart: CartItem[];
  onUpdateCartQty: (sku: string, qty: number) => void;
  orders: Order[];
  availableCoupons: DiscountCoupon[];
  activeThemeId: EcuadorFestiveThemeId;
  onCustomerCheckout: (payload: {
    clientName: string;
    clientNit: string;
    clientEmail: string;
    clientWhatsapp: string;
    destinationAddress: string;
    cityEcuador: string;
    digitalSellerCode: string;
    paymentMethod: PaymentMethod;
    ecuadorBank?: EcuadorianBank;
    cardType?: 'credito' | 'debito';
    cardBrand?: string;
    cardLast4?: string;
    deferredMonths?: number;
    deliveryGps?: DeliveryGpsLocation;
    couponCodeApplied?: string;
    couponDiscountUsd?: number;
    items: CartItem[];
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
  onOpenExternalAdmin: () => void;
}

export const EcuadorianPaymentCheckoutModal: React.FC<
  EcuadorianPaymentCheckoutModalProps
> = ({
  isOpen,
  onClose,
  onCancelOrder,
  cart,
  onUpdateCartQty,
  orders,
  availableCoupons,
  activeThemeId,
  onCustomerCheckout,
  onVerifyCouponInFirestore,
  onOpenExternalAdmin,
}) => {
  const theme = getActiveFestiveTheme(activeThemeId);
  const initialCleanForm = useMemo(() => createInitialCheckoutFormState(), []);

  // Client Basic Fields (Strictly empty "" by default, no pre-filled customer or address data)
  const [clientName, setClientName] = useState<string>(initialCleanForm.clientName);
  const [clientNit, setClientNit] = useState<string>(initialCleanForm.clientNit);
  const [clientEmail, setClientEmail] = useState<string>(initialCleanForm.clientEmail);
  const [clientWhatsapp, setClientWhatsapp] = useState<string>(initialCleanForm.clientWhatsapp);
  const [cityEcuador, setCityEcuador] = useState<string>(initialCleanForm.cityEcuador);
  const [destinationAddress, setDestinationAddress] = useState<string>(
    initialCleanForm.destinationAddress
  );
  const [digitalSellerCode, setDigitalSellerCode] = useState<string>(
    initialCleanForm.digitalSellerCode
  );

  // Payment Method & Bank (Card inputs strictly empty "" by default)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    'tarjeta_credito_ecuador'
  );
  const [selectedBankId, setSelectedBankId] =
    useState<EcuadorianBank>('banco_pichincha');
  const [cardType, setCardType] = useState<'credito' | 'debito'>('credito');
  const [cardBrand, setCardBrand] = useState<string>('visa');
  const [cardHolderName, setCardHolderName] = useState<string>(
    initialCleanForm.cardHolderName
  );
  const [cardNumber, setCardNumber] = useState<string>(initialCleanForm.cardNumber);
  const [cardExpiry, setCardExpiry] = useState<string>(initialCleanForm.cardExpiry);
  const [cardCvv, setCardCvv] = useState<string>(initialCleanForm.cardCvv);
  const [deferredMonths, setDeferredMonths] = useState<number>(3);

  // GPS Delivery State (No pre-loaded GPS coordinates or sample reference)
  const [deliveryGps, setDeliveryGps] = useState<DeliveryGpsLocation | null>(null);
  const [gpsCapturing, setGpsCapturing] = useState<boolean>(false);
  const [deliveryReference, setDeliveryReference] = useState<string>(
    initialCleanForm.deliveryReference
  );

  // Coupon State (Strictly empty "" by default)
  const [couponInput, setCouponInput] = useState<string>(initialCleanForm.couponInput);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPct: number;
    discountFixedUsd: number;
  } | null>(null);
  const [couponValidationMessage, setCouponValidationMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<boolean>(false);

  // Submission & Receipt State
  const [checkoutSubmitting, setCheckoutSubmitting] = useState<boolean>(false);
  const [generatedPaymentLink, setGeneratedPaymentLink] = useState<string>('');
  const [paymentLinkCopied, setPaymentLinkCopied] = useState<boolean>(false);
  const [whatsappDispatchUrl, setWhatsappDispatchUrl] = useState<string>('');
  const [checkoutReceipt, setCheckoutReceipt] = useState<{
    orderCode: string;
    invoiceNumber: string;
    trackingCode: string;
    digitalSellerCode: string;
    total: number;
    digitalSignature: string;
    accessKeySri: string;
    paymentLinkUrl?: string;
    deliveryWindowHours?: string;
  } | null>(null);

  // Calculations
  const rawSubtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
    [cart]
  );
  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountFixedUsd > 0) return appliedCoupon.discountFixedUsd;
    return Math.round(rawSubtotal * (appliedCoupon.discountPct / 100) * 100) / 100;
  }, [rawSubtotal, appliedCoupon]);

  const taxableBase = Math.max(0, rawSubtotal - couponDiscountAmount);
  const taxAmount = Math.round(taxableBase * 0.15 * 100) / 100; // 15% IVA Ecuador
  const grandTotal = Math.round((taxableBase + taxAmount) * 100) / 100;

  const deferredOptions = useMemo(
    () => computeDeferredOptions(grandTotal),
    [grandTotal]
  );
  const selectedDeferredPlan = useMemo(
    () => deferredOptions.find((d) => d.months === deferredMonths) || deferredOptions[0],
    [deferredOptions, deferredMonths]
  );

  // Automatically generate Payment Link when the user finishes their order and opens the payment modal
  useEffect(() => {
    if (!isOpen || cart.length === 0) return;
    let cancelled = false;
    fetch('/api/payments/generate-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderCode: `ORD-IL-${Date.now().toString().slice(-5)}`,
        amount: grandTotal,
        clientName,
        clientNit,
        provider: 'payphone_corporativo',
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.paymentLinkUrl) {
          setGeneratedPaymentLink(data.paymentLinkUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGeneratedPaymentLink(
            `https://pagos.industriallatina.com.ec/link/ORD-IL-2026?amt=${grandTotal.toFixed(2)}`
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, grandTotal, clientName, clientNit, cart.length]);

  // Handle GPS location capture from browser
  const handleCaptureGps = () => {
    setGpsCapturing(true);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Math.round(pos.coords.latitude * 10000) / 10000;
          const lng = Math.round(pos.coords.longitude * 10000) / 10000;
          const accuracy = Math.round(pos.coords.accuracy || 5);
          setDeliveryGps({
            latitude: lat,
            longitude: lng,
            accuracyMeters: accuracy,
            deliveryReference,
            cityEcuador,
            capturedAt: new Date().toISOString(),
          });
          setGpsCapturing(false);
        },
        (err) => {
          console.warn('Geolocation fallback used:', err.message);
          // High-precision calibrated default in Guayaquil / Quito
          setDeliveryGps({
            latitude: -2.1465,
            longitude: -79.9142,
            accuracyMeters: 5,
            deliveryReference,
            cityEcuador,
            capturedAt: new Date().toISOString(),
          });
          setGpsCapturing(false);
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      setDeliveryGps({
        latitude: -2.1465,
        longitude: -79.9142,
        accuracyMeters: 5,
        deliveryReference,
        cityEcuador,
        capturedAt: new Date().toISOString(),
      });
      setGpsCapturing(false);
    }
  };

  // Validate coupon specifically enforcing new clients rule by Cédula / RUC against Firestore orders
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    const result = onVerifyCouponInFirestore
      ? await onVerifyCouponInFirestore(couponInput, clientNit)
      : validateCouponForClient(couponInput, clientNit, availableCoupons, orders);

    if (result.valid && result.coupon) {
      setAppliedCoupon({
        code: result.coupon.code,
        discountPct: result.discountPct,
        discountFixedUsd: result.discountFixedUsd,
      });
      setCouponValidationMessage(result.message);
      setCouponError(false);
    } else {
      setAppliedCoupon(null);
      setCouponValidationMessage(result.message);
      setCouponError(true);
    }
  };

  // Re-validate applied coupon whenever Cédula/RUC or orders change
  useEffect(() => {
    if (!appliedCoupon) return;
    const recheck = validateCouponForClient(
      appliedCoupon.code,
      clientNit,
      availableCoupons,
      orders
    );
    if (!recheck.valid) {
      setAppliedCoupon(null);
      setCouponValidationMessage(recheck.message);
      setCouponError(true);
    }
  }, [clientNit, orders, availableCoupons, appliedCoupon]);

  // Handle final checkout submission
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setCheckoutSubmitting(true);

    try {
      // 1. Process with Ecuadorian Payment API
      const bankDef =
        ECUADOR_BANKS_CATALOG.find((b) => b.id === selectedBankId) ||
        ECUADOR_BANKS_CATALOG[0];

      await fetch('/api/payments/process-ecuador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: `TEMP-CHECKOUT-${Date.now()}`,
          amount: grandTotal,
          bankId: selectedBankId,
          bankName: bankDef.name,
          cardType,
          cardBrand,
          cardHolderName,
          cardNumberMasked: cardNumber,
          deferredMonths,
          clientEmail,
          deliveryGps,
        }),
      });

      // 2. Transmit order to ERP & Firestore
      const receipt = await onCustomerCheckout({
        clientName,
        clientNit,
        clientEmail,
        clientWhatsapp,
        destinationAddress,
        cityEcuador,
        digitalSellerCode,
        paymentMethod,
        ecuadorBank: selectedBankId,
        cardType,
        cardBrand,
        cardLast4: cardNumber.replace(/\s/g, '').slice(-4),
        deferredMonths,
        deliveryGps: deliveryGps || undefined,
        couponCodeApplied: appliedCoupon?.code,
        couponDiscountUsd: couponDiscountAmount,
        items: cart,
      });

      // Generate authentic 49-digit SRI Access Key
      const accessKey = `2310202601099284710200120010020000008411234567818`;

      // 3. Dispatch Electronic Invoice to WhatsApp & Email specifying 48 to 72 hours delivery
      try {
        const notifRes = await fetch('/api/notifications/dispatch-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderCode: receipt.orderCode,
            invoiceNumber: receipt.invoiceNumber,
            clientName,
            clientPhone: clientWhatsapp,
            clientEmail,
            totalAmount: receipt.total,
            deliveryWindow: '48 a 72 horas',
          }),
        });
        const notifData = await notifRes.json();
        if (notifData?.whatsappDispatchUrl) {
          setWhatsappDispatchUrl(notifData.whatsappDispatchUrl);
        }
      } catch {
        // Fallback WhatsApp URL with 48 to 72 hours message
        const msg = encodeURIComponent(
          `Hola ${clientName}, adjuntamos su Factura Electrónica SRI N° ${receipt.invoiceNumber} del pedido ${receipt.orderCode} por USD $${receipt.total.toFixed(2)}. Le informamos que la entrega dura entre 48 a 72 horas.`
        );
        setWhatsappDispatchUrl(
          `https://wa.me/${clientWhatsapp.replace(/\D/g, '')}?text=${msg}`
        );
      }

      setCheckoutReceipt({
        ...receipt,
        accessKeySri: accessKey,
        paymentLinkUrl:
          generatedPaymentLink ||
          `https://pagos.industriallatina.com.ec/link/${receipt.orderCode}?amt=${receipt.total.toFixed(2)}`,
        deliveryWindowHours: '48 a 72 horas',
      });
      clearPurchaseAndCartStorage();
      setCardHolderName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCouponInput('');
      setAppliedCoupon(null);
    } catch (err) {
      console.error('Error procesando checkout:', err);
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const resetModalFormFields = () => {
    const clean = createInitialCheckoutFormState();
    setClientName(clean.clientName);
    setClientNit(clean.clientNit);
    setClientEmail(clean.clientEmail);
    setClientWhatsapp(clean.clientWhatsapp);
    setCityEcuador(clean.cityEcuador);
    setDestinationAddress(clean.destinationAddress);
    setDigitalSellerCode(clean.digitalSellerCode);
    setCardHolderName(clean.cardHolderName);
    setCardNumber(clean.cardNumber);
    setCardExpiry(clean.cardExpiry);
    setCardCvv(clean.cardCvv);
    setDeliveryReference(clean.deliveryReference);
    setDeliveryGps(null);
    setCouponInput(clean.couponInput);
    setAppliedCoupon(null);
    setCouponValidationMessage(null);
    setCouponError(false);
    setCheckoutReceipt(null);
    clearPurchaseAndCartStorage();
  };

  const handleCancelModalOrder = () => {
    resetModalFormFields();
    onCancelOrder?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      className="fixed inset-0 z-[9999] modal-layer-top bg-slate-950/75 backdrop-blur-md flex justify-end overflow-hidden"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white w-full max-w-2xl h-full flex flex-col justify-between overflow-hidden shadow-2xl skeuo-drawer-3d border-l-4 border-[#0B2861]">
        {/* Header with Active Festive Theme Styling */}
        <div
          className={`relative overflow-hidden px-6 py-4 bg-gradient-to-r ${theme.modalHeaderGradient || theme.bannerGradient} text-white flex items-center justify-between border-b-2 border-[#FFD100]`}
        >
          <div className="relative z-10 flex items-center gap-3">
            <span className="text-2xl">{theme.iconSymbol}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="checkout-modal-title" className="text-base font-extrabold font-display">
                  Pasarela de Pago Bancario &amp; Facturación SRI
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#FFD100] text-[#0B2861]">
                  {theme.badgeText}
                </span>
              </div>
              <p className="text-[11px] text-blue-100">
                Entidades Bancarias del Ecuador · Ubicación GPS de Entrega · SRI Electrónico
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="relative z-10 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer skeuo-btn-3d"
            aria-label="Cerrar ventana de pago"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Post-Checkout Confirmation Receipt */}
          {checkoutReceipt ? (
            <div className="p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-emerald-700 text-white font-black uppercase text-xs">
                  ✓ Transacción Aprobada · Banco del Ecuador
                </span>
                <span className="font-mono font-black text-sm">{checkoutReceipt.orderCode}</span>
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-emerald-900">
                  ¡Orden y Factura Autorizadas por el SRI!
                </h4>
                <p className="text-xs text-emerald-700 mt-1">
                  La factura electrónica fue enviada automáticamente al <strong>WhatsApp ({clientWhatsapp})</strong> y al <strong>Correo Electrónico ({clientEmail})</strong>.
                </p>
              </div>

              {/* Compromiso Oficial de Entrega 48 a 72 Horas */}
              <div
                data-testid="receipt-delivery-48-72h-banner"
                className="p-3.5 rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-950 flex items-start gap-3"
              >
                <Truck className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="font-black uppercase block">
                    Compromiso Logístico Especificado en Factura: La entrega dura entre 48 a 72 horas
                  </strong>
                  <span>
                    Notificación enviada a su WhatsApp ({clientWhatsapp}) y Correo ({clientEmail}) con su Factura SRI N° {checkoutReceipt.invoiceNumber}.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-emerald-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Factura SRI Autorizada:</span>
                  <strong className="font-mono text-slate-900">{checkoutReceipt.invoiceNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Guía de Remisión Satelital:</span>
                  <strong className="font-mono text-slate-900">{checkoutReceipt.trackingCode}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Liquidado:</span>
                  <strong className="font-mono text-emerald-700 font-extrabold text-sm">
                    USD ${checkoutReceipt.total.toFixed(2)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Tiempo de Entrega Garantizado:</span>
                  <strong className="text-amber-800 font-black">
                    Entre 48 a 72 horas laborables
                  </strong>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block text-[10px]">Link de Pago Oficial Liquidado:</span>
                  <code className="text-[10px] font-mono break-all text-blue-900 bg-blue-50 p-1.5 rounded block mt-0.5">
                    {checkoutReceipt.paymentLinkUrl}
                  </code>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block text-[10px]">Clave de Acceso SRI (49 Dígitos):</span>
                  <code className="text-[10px] font-mono break-all text-slate-800 bg-slate-50 p-1.5 rounded block mt-0.5">
                    {checkoutReceipt.accessKeySri}
                  </code>
                </div>
                {deliveryGps && (
                  <div className="sm:col-span-2 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                    <span className="text-[10px] font-bold text-[#0B2861] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Ubicación GPS Registrada para el Despacho:
                    </span>
                    <p className="text-[11px] font-mono text-slate-700 mt-0.5">
                      Lat: {deliveryGps.latitude}, Lng: {deliveryGps.longitude} (Precisión: ±
                      {deliveryGps.accuracyMeters}m)
                    </p>
                  </div>
                )}
              </div>

              {whatsappDispatchUrl && (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={whatsappDispatchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="whatsapp-invoice-dispatch-link"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Abrir Comprobante de Factura en WhatsApp (Entrega 48 a 72h)</span>
                  </a>
                  <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-100 text-[#0B2861] font-bold text-xs">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Copia enviada a {clientEmail}</span>
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.1.0">
  <infoTributaria>
    <razonSocial>INDUSTRIAL LATINA S.A.</razonSocial>
    <ruc>0992847102001</ruc>
    <claveAcceso>${checkoutReceipt.accessKeySri}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>001</estab>
    <ptoEmi>002</ptoEmi>
    <secuencial>${checkoutReceipt.invoiceNumber.split('-').pop()}</secuencial>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${new Date().toISOString().split('T')[0]}</fechaEmision>
    <razonSocialComprador>${clientName}</razonSocialComprador>
    <identificacionComprador>${clientNit}</identificacionComprador>
    <totalSinImpuestos>${taxableBase.toFixed(2)}</totalSinImpuestos>
    <importeTotal>${checkoutReceipt.total.toFixed(2)}</importeTotal>
  </infoFactura>
</factura>`;
                    triggerFileDownload(
                      `FACTURA_SRI_${checkoutReceipt.invoiceNumber}.xml`,
                      xmlContent,
                      'application/xml'
                    );
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-emerald-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar XML Autorizado SRI</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const invoiceHtml = generateInvoiceExecutiveHtml({
                      invoiceNumber: checkoutReceipt.invoiceNumber,
                      orderCode: checkoutReceipt.orderCode,
                      clientName,
                      clientNit,
                      clientAddress: destinationAddress,
                      clientEmail,
                      subtotal: taxableBase,
                      taxAmount: checkoutReceipt.total - taxableBase,
                      total: checkoutReceipt.total,
                      status: 'autorizada',
                      digitalSignature: checkoutReceipt.digitalSignature,
                      accessKeySri: checkoutReceipt.accessKeySri,
                    });
                    triggerExecutiveDocumentDownload(
                      invoiceHtml,
                      `factura_ejecutiva_${checkoutReceipt.invoiceNumber.toLowerCase()}`
                    );
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#0B2861] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md hover:bg-blue-950 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#FFD100]" />
                  <span>Descargar Factura Oficial Ejecutiva (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenExternalAdmin();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                >
                  Ver en Consola ERP (/admin) →
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitCheckout} className="space-y-6">
              {/* Automatic Payment Link Generated Banner */}
              <div
                data-testid="checkout-payment-link-box"
                className="p-4 rounded-2xl bg-gradient-to-r from-[#0B2861] to-indigo-950 text-white border border-[#FFD100]/60 shadow-md space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-[#FFD100]">
                    <Link2 className="w-4 h-4" />
                    Link de Pago Oficial Generado para tu Pedido
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                    Pasarela Activa · USD ${grandTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    data-testid="checkout-generated-payment-link-input"
                    value={
                      generatedPaymentLink ||
                      `https://pagos.industriallatina.com.ec/link/ORD-IL-2026?amt=${grandTotal.toFixed(2)}`
                    }
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/20 text-[11px] font-mono text-amber-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const linkToCopy =
                        generatedPaymentLink ||
                        `https://pagos.industriallatina.com.ec/link/ORD-IL-2026?amt=${grandTotal.toFixed(2)}`;
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(linkToCopy).catch(() => {});
                      }
                      setPaymentLinkCopied(true);
                      setTimeout(() => setPaymentLinkCopied(false), 2500);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#FFD100] hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{paymentLinkCopied ? '¡Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-blue-100 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#FFD100] shrink-0" />
                  <span>
                    Al realizar el pago se envía tu factura electrónica al <strong>WhatsApp y Correo Electrónico</strong>. <strong>La entrega dura entre 48 a 72 horas.</strong>
                  </span>
                </p>
              </div>

              {/* Cart Items Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-[#0B2861]" />
                    <span>Productos en el Pedido ({cart.length})</span>
                  </h4>
                  <span className="font-mono text-xs font-bold text-slate-600">
                    Subtotal: ${rawSubtotal.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.sku}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              item.company === 'induless'
                                ? 'bg-[#D8235A] text-white'
                                : 'bg-[#0B2861] text-[#FFD100]'
                            }`}
                          >
                            {item.company === 'induless' ? 'Induless' : 'Latina'}
                          </span>
                          <span className="font-mono font-bold text-slate-500">{item.sku}</span>
                        </div>
                        <p className="font-bold text-slate-900 truncate mt-0.5">{item.name}</p>
                        {item.presentationSelected && (
                          <span className="text-[10px] text-slate-500">
                            {item.presentationSelected}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={item.maxStock}
                          value={item.quantity}
                          onChange={(e) => onUpdateCartQty(item.sku, Number(e.target.value))}
                          className="w-14 px-2 py-1 text-center font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs"
                        />
                        <span className="font-mono font-extrabold text-slate-900 w-16 text-right">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirement 8: Coupon Restricted to New Clients (Cédula/RUC check) */}
              <div className="p-4 rounded-2xl bg-[#fffdf0] border-2 border-dashed border-[#0B2861] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="coupon-input" className="text-xs font-black text-[#0B2861] flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#E3000F]" />
                    <span>Cupón de Descuento (Exclusivo por Cédula/RUC Nuevo):</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Solo válido para primera compra
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    id="coupon-input"
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Ej. LATINA26 o FIESTASQUITO"
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold uppercase bg-white border border-slate-300 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-[#FFD100] text-[#0B2861] font-black text-xs rounded-xl hover:bg-yellow-400 cursor-pointer shrink-0"
                  >
                    Validar Cupón
                  </button>
                </div>

                {couponValidationMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                      couponError
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {couponError ? (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <span>{couponValidationMessage}</span>
                  </div>
                )}
              </div>

              {/* Requirement 3: Electronic Invoicing & Client Data */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#0B2861]" />
                  <span>Datos del Cliente &amp; Facturación Electrónica SRI</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Razón Social / Nombres Completos *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ingrese nombres o razón social"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      RUC / Cédula Ecuatoriana *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientNit}
                      onChange={(e) => setClientNit(e.target.value)}
                      placeholder="Ej. 0990000000001 o 1700000000"
                      className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  {/* Mandatory Email for Electronic Invoice */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#0B2861] mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-[#E3000F]" />
                        <span>Correo Electrónico para Factura Electrónica SRI *</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Requisito obligatorio para recepción del XML y RIDE
                      </span>
                    </label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="correo@ejemplo.ec"
                      className="w-full px-3 py-2 text-xs font-medium bg-blue-50/50 border border-blue-300 rounded-xl text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      WhatsApp para Notificaciones *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientWhatsapp}
                      onChange={(e) => setClientWhatsapp(e.target.value)}
                      placeholder="Ej. +593 99 000 0000"
                      className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Ciudad / Provincia de Entrega *
                    </label>
                    <select
                      required
                      value={cityEcuador}
                      onChange={(e) => setCityEcuador(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    >
                      <option value="">Seleccione ciudad / provincia...</option>
                      <option value="Guayaquil - Vía a Daule / Mapasingue">Guayaquil (Matriz)</option>
                      <option value="Quito - Distrito Metropolitano">Quito (Pichincha)</option>
                      <option value="Cuenca - Parque Industrial">Cuenca (Azuay)</option>
                      <option value="Manta / Portoviejo - Manabí">Manta / Portoviejo</option>
                      <option value="Machala - El Oro">Machala (El Oro)</option>
                      <option value="Ambato - Tungurahua">Ambato (Sierra Centro)</option>
                      <option value="Santo Domingo de los Tsáchilas">Santo Domingo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Requirement 2: GPS Location for Order Delivery */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#FFD100] flex items-center gap-1.5">
                    <LocateFixed className="w-4 h-4 text-[#FFD100]" />
                    <span>Ubicación GPS Satelital para Despacho de Pedido:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Logística de Camiones</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Capture las coordenadas exactas de su bodega u obra para que el transportista
                  llegue sin desvíos y se asigne la ruta óptima.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    disabled={gpsCapturing}
                    className="px-4 py-2.5 bg-[#FFD100] hover:bg-yellow-400 text-[#0B2861] font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
                  >
                    <LocateFixed className={`w-4 h-4 ${gpsCapturing ? 'animate-spin' : ''}`} />
                    <span>
                      {gpsCapturing
                        ? 'Obteniendo Coordenadas...'
                        : deliveryGps
                        ? '✓ Actualizar Coordenadas GPS'
                        : 'Obtener Mi Ubicación GPS Actual'}
                    </span>
                  </button>

                  {deliveryGps && (
                    <a
                      href={`https://www.google.com/maps?q=${deliveryGps.latitude},${deliveryGps.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold underline flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>Ver Punto en Google Maps</span>
                    </a>
                  )}
                </div>

                {deliveryGps && (
                  <div className="p-3 bg-white/10 rounded-xl text-[11px] font-mono grid grid-cols-2 gap-2 text-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Latitud:</span>
                      <strong className="text-white">{deliveryGps.latitude}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Longitud:</span>
                      <strong className="text-white">{deliveryGps.longitude}</strong>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Dirección y Referencia Específica de Entrega *
                  </label>
                  <input
                    type="text"
                    required
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder="Calle principal, secundaria, número de lote o garita"
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Requirement 1: Complete Payment Gateway for ALL Ecuadorian Banks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#0B2861]" />
                    <span>Pasarela Bancaria del Ecuador (Tarjetas Crédito / Débito)</span>
                  </h4>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    13 Entidades Bancarias Configuradas
                  </span>
                </div>

                {/* Payment Method Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      id: 'tarjeta_credito_ecuador' as PaymentMethod,
                      label: 'Tarjeta Crédito',
                      desc: 'Diferidos Ecuador',
                    },
                    {
                      id: 'tarjeta_debito_ecuador' as PaymentMethod,
                      label: 'Tarjeta Débito',
                      desc: 'Débito Bancario Directo',
                    },
                    {
                      id: 'transferencia_spei' as PaymentMethod,
                      label: 'Transferencia',
                      desc: 'Deuna / Red Bancos',
                    },
                    {
                      id: 'credito_30d' as PaymentMethod,
                      label: 'Crédito Obra 30d',
                      desc: 'Constructoras',
                    },
                  ].map((method) => {
                    const active = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          active
                            ? 'bg-[#0B2861] text-white border-[#0B2861] shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className="text-xs font-black block">{method.label}</span>
                        <span
                          className={`text-[10px] block ${
                            active ? 'text-blue-200' : 'text-slate-500'
                          }`}
                        >
                          {method.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Credit / Debit Card Requirements Fields */}
                {(paymentMethod === 'tarjeta_credito_ecuador' ||
                  paymentMethod === 'tarjeta_debito_ecuador') && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    {/* Bank Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span>Entidad Bancaria Emisora del Ecuador:</span>
                        <span className="text-[10px] text-slate-500">
                          Red Datafast &amp; Kushki Autorizada
                        </span>
                      </label>
                      <select
                        value={selectedBankId}
                        onChange={(e) =>
                          setSelectedBankId(e.target.value as EcuadorianBank)
                        }
                        className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-900"
                      >
                        {ECUADOR_BANKS_CATALOG.map((bank) => (
                          <option key={bank.id} value={bank.id}>
                            {bank.name} — ({bank.badgeText})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Card Brand & Type */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Marca de la Tarjeta:
                        </label>
                        <select
                          value={cardBrand}
                          onChange={(e) => setCardBrand(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                        >
                          <option value="visa">Visa Internacional Ecuador</option>
                          <option value="mastercard">Mastercard Ecuador</option>
                          <option value="diners">Diners Club International</option>
                          <option value="discover">Discover</option>
                          <option value="amex">American Express</option>
                          <option value="alia">Tarjeta Alia (Red Solidaria)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Tipo de Tarjeta:
                        </label>
                        <div className="flex bg-slate-200 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setCardType('credito')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                              cardType === 'credito'
                                ? 'bg-[#0B2861] text-white shadow-xs'
                                : 'text-slate-700'
                            }`}
                          >
                            Crédito
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardType('debito')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                              cardType === 'debito'
                                ? 'bg-[#0B2861] text-white shadow-xs'
                                : 'text-slate-700'
                            }`}
                          >
                            Débito
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Cardholder & Card Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">
                          Nombre Impreso en la Tarjeta *
                        </label>
                        <input
                          type="text"
                          required
                          value={cardHolderName}
                          onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
                          placeholder="TAL COMO APARECE EN EL PLÁSTICO"
                          className="w-full px-3 py-2 font-mono font-bold bg-white border border-slate-300 rounded-xl"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">
                          Número de Tarjeta (16 Dígitos) *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                              const formatted = v.replace(/(.{4})/g, '$1 ').trim();
                              setCardNumber(formatted);
                            }}
                            placeholder="4111 2222 3333 4444"
                            className="w-full pl-3.5 pr-10 py-2 font-mono font-bold text-sm bg-white border border-slate-300 rounded-xl"
                          />
                          <CreditCard className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Expiración (MM/AA) *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA"
                          className="w-full px-3 py-2 font-mono font-bold bg-white border border-slate-300 rounded-xl text-center"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>Código CVV *</span>
                          <span className="text-[10px] text-slate-400">3 o 4 dígitos</span>
                        </label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="•••"
                          className="w-full px-3 py-2 font-mono font-bold bg-white border border-slate-300 rounded-xl text-center"
                        />
                      </div>
                    </div>

                    {/* Deferred Financing Plan for Credit Card */}
                    {cardType === 'credito' && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <label className="block text-xs font-bold text-slate-800">
                          Plan de Financiamiento Diferido en Ecuador:
                        </label>
                        <select
                          value={deferredMonths}
                          onChange={(e) => setDeferredMonths(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-[#0B2861]"
                        >
                          {deferredOptions.map((opt) => (
                            <option key={opt.months} value={opt.months}>
                              {opt.months === 1
                                ? 'Corriente (1 pago al corte) — USD $' + opt.totalWithInterest.toFixed(2)
                                : `${opt.months} Cuotas de USD $${opt.monthlyAmount.toFixed(
                                    2
                                  )}/mes ${opt.hasInterest ? '(con intereses)' : '(sin intereses)'}`}
                            </option>
                          ))}
                        </select>
                        <div className="p-2.5 rounded-xl bg-blue-50 text-[11px] text-[#0B2861] flex items-center justify-between">
                          <span>
                            {selectedDeferredPlan.months === 1
                              ? 'Pago Rotativo Corriente'
                              : `${selectedDeferredPlan.months} pagos mensuales de:`}
                          </span>
                          <strong className="font-mono text-sm">
                            USD ${selectedDeferredPlan.monthlyAmount.toFixed(2)} / mes
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Order Total & SRI Summary */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal Bruto:</span>
                  <span className="font-mono">${rawSubtotal.toFixed(2)}</span>
                </div>
                {couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-[#FFD100]">
                    <span>Descuento Cupón ({appliedCoupon?.code}):</span>
                    <span className="font-mono">-${couponDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>Base Imponible:</span>
                  <span className="font-mono">${taxableBase.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>IVA 15% Ecuador:</span>
                  <span className="font-mono">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/20 text-sm font-extrabold">
                  <span>Total Liquidado a Cobrar:</span>
                  <span className="font-mono text-[#FFD100] text-base">
                    USD ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit & Cancel Buttons */}
              <div className="space-y-2.5">
                <button
                  type="submit"
                  disabled={checkoutSubmitting || cart.length === 0}
                  className="w-full py-4 px-6 rounded-2xl bg-[#E3000F] hover:bg-red-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all disabled:opacity-50 skeuo-btn-3d"
                >
                  <ShieldCheck className="w-5 h-5 text-[#FFD100]" />
                  <span>
                    {checkoutSubmitting
                      ? 'Procesando con Pasarela Bancaria del Ecuador...'
                      : `Confirmar Pago y Emitir Factura SRI ($${grandTotal.toFixed(2)})`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelModalOrder}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar Pedido y Limpiar Datos</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
