import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  MessageSquare,
  Search,
  Truck,
} from 'lucide-react';
import { Shipment, ShipmentStatus, UserRole } from '../types/erp';
import {
  findShipmentByQuery,
  formatShipmentStatusLabel,
  getNextShipmentStatus,
  getPermissionsForRole,
} from '../utils/erpLogic';

interface ShipmentTrackingViewProps {
  shipments: Shipment[];
  initialTrackingQuery?: string;
  currentRole: UserRole;
  onAdvanceShipmentStage: (shipmentId: string) => void;
  onSendTrackingNotification: (shipment: Shipment, channel: 'whatsapp' | 'email') => void;
}

const LOGISTICS_STAGES: { key: ShipmentStatus; label: string; desc: string }[] = [
  {
    key: 'preparacion',
    label: '01. Alistamiento en Planta',
    desc: 'Embalaje industrial pesado y verificación de lote.',
  },
  {
    key: 'control_calidad',
    label: '02. Control de Calidad ISO',
    desc: 'Certificación metrológica y sellado de seguridad E2EE.',
  },
  {
    key: 'en_transito',
    label: '03. Tránsito en Corredor Logístico',
    desc: 'Monitoreo satelital GPS activo en unidad de transporte.',
  },
  {
    key: 'centro_distribucion',
    label: '04. Hub de Distribución Regional',
    desc: 'Despacho de última milla programado hacia planta cliente.',
  },
  {
    key: 'entregado',
    label: '05. Entregado y Conformidad Firmada',
    desc: 'Recepción validada con acta digital del cliente.',
  },
];

export const ShipmentTrackingView: React.FC<ShipmentTrackingViewProps> = ({
  shipments,
  initialTrackingQuery,
  currentRole,
  onAdvanceShipmentStage,
  onSendTrackingNotification,
}) => {
  const permissions = getPermissionsForRole(currentRole);
  const [queryInput, setQueryInput] = useState(initialTrackingQuery || '');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(
    shipments[0]?.id || 'shp_01'
  );
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (initialTrackingQuery) {
      setQueryInput(initialTrackingQuery);
      const found = findShipmentByQuery(shipments, initialTrackingQuery);
      if (found) {
        setSelectedShipmentId(found.id);
        setSearchFeedback(null);
      }
    }
  }, [initialTrackingQuery, shipments]);

  const activeShipment =
    shipments.find((s) => s.id === selectedShipmentId) || shipments[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = findShipmentByQuery(shipments, queryInput);
    if (match) {
      setSelectedShipmentId(match.id);
      setSearchFeedback(null);
    } else {
      setSearchFeedback(
        `No se encontró ninguna guía activa que coincida con "${queryInput}". Seleccione una guía de la lista inferior.`
      );
    }
  };

  const currentStageIndex = LOGISTICS_STAGES.findIndex(
    (st) => st.key === activeShipment?.status
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-slate-500">
          Portal de Consulta en Línea para Clientes y Operadores · Telemetría GPS · Alertas WhatsApp & Email
        </p>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          Rastreo de Envíos en Línea y Estado de Despachos
        </h1>
      </div>

      {/* Customer Online Tracking Search Box */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <label htmlFor="shipment-tracking-search" className="sr-only">
              Ingrese número de guía, código de pedido o nombre del cliente
            </label>
            <input
              id="shipment-tracking-search"
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ingrese N° de Guía (ej. IL-ENV-8901), Código de Pedido (PED-2026-102) o Cliente..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Truck className="w-4 h-4" />
            Consultar Guía en Línea
          </button>
        </form>

        {/* Quick Select Buttons for Active Shipments */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Guías activas rápidas:</span>
          {shipments.map((shp) => (
            <button
              key={shp.id}
              type="button"
              onClick={() => {
                setSelectedShipmentId(shp.id);
                setQueryInput(shp.trackingCode);
                setSearchFeedback(null);
              }}
              className={`px-3 py-1 text-xs font-mono font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                activeShipment?.id === shp.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {shp.trackingCode} ({shp.progress}%)
            </button>
          ))}
        </div>

        {searchFeedback && (
          <div role="status" className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            {searchFeedback}
          </div>
        )}
      </div>

      {/* Active Shipment Detail & 5-Stage Visual Pipeline */}
      {activeShipment && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  Guía {activeShipment.trackingCode}
                </span>
                <span>·</span>
                <span className="font-mono">Orden {activeShipment.orderCode}</span>
                <span>·</span>
                <span>Unidad: {activeShipment.carrier}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Destinatario: {activeShipment.clientName}
              </h2>
              <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Origen: <strong>{activeShipment.origin}</strong></span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span>Destino: <strong>{activeShipment.destination}</strong></span>
                <span>·</span>
                <span>Entrega Estimada: <strong className="font-mono">{activeShipment.estimatedDelivery}</strong></span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onSendTrackingNotification(activeShipment, 'whatsapp')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Notificar Avance por WhatsApp
              </button>
              <button
                type="button"
                onClick={() => onSendTrackingNotification(activeShipment, 'email')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Mail className="w-3.5 h-3.5" />
                Enviar Reporte por Correo
              </button>
              {permissions.canUpdateShipments && activeShipment.status !== 'entregado' && (
                <button
                  type="button"
                  onClick={() => onAdvanceShipmentStage(activeShipment.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Avanzar a: {formatShipmentStatusLabel(getNextShipmentStatus(activeShipment.status))}
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span>Progreso Logístico de Ruta</span>
              <span className="font-mono tabular-nums text-slate-900">
                {activeShipment.progress}% Completado
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-transform duration-200 origin-left"
                style={{ transform: `scaleX(${activeShipment.progress / 100})` }}
              />
            </div>
          </div>

          {/* 5-Stage Checkpoints Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
            {LOGISTICS_STAGES.map((stage, idx) => {
              const isCompleted = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div
                  key={stage.key}
                  className={`p-4 rounded-lg border ${
                    isCurrent
                      ? 'bg-slate-900 text-white border-slate-900'
                      : isCompleted
                      ? 'bg-slate-50 text-slate-900 border-slate-300'
                      : 'bg-white text-slate-400 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold">
                      Etapa {idx + 1}/5
                    </span>
                    {isCompleted && (
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          isCurrent ? 'text-emerald-400' : 'text-emerald-700'
                        }`}
                      />
                    )}
                  </div>
                  <p className="text-xs font-bold mt-2">{stage.label}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isCurrent
                        ? 'text-slate-300'
                        : isCompleted
                        ? 'text-slate-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
