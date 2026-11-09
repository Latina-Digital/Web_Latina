import React, { useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  Mail,
  MessageSquare,
  Send,
} from 'lucide-react';
import {
  NotificationChannel,
  NotificationLog,
  NotificationRule,
  NotificationSeverity,
} from '../types/erp';

interface NotificationsViewProps {
  notifications: NotificationLog[];
  rules: NotificationRule[];
  onToggleRule: (ruleId: string, channelKey: 'whatsappEnabled' | 'emailEnabled' | 'criticalPushEnabled') => void;
  onDispatchNotification: (payload: {
    channel: NotificationChannel;
    recipientName: string;
    recipientTarget: string;
    subject: string;
    message: string;
    severity: NotificationSeverity;
  }) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  rules,
  onToggleRule,
  onDispatchNotification,
}) => {
  const [channel, setChannel] = useState<NotificationChannel>('whatsapp');
  const [recipientName, setRecipientName] = useState('');
  const [recipientTarget, setRecipientTarget] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<NotificationSeverity>('info');
  const [channelFilter, setChannelFilter] = useState<'todos' | NotificationChannel>('todos');

  const filteredLogs = notifications.filter(
    (n) => channelFilter === 'todos' || n.channel === channelFilter
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientTarget.trim() || !message.trim()) return;
    onDispatchNotification({
      channel,
      recipientName: recipientName.trim(),
      recipientTarget: recipientTarget.trim(),
      subject: subject.trim() || 'Alerta Industrial Latina',
      message: message.trim(),
      severity,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-slate-500">
          Motor Automatizado Multi-Canal · WhatsApp Business API · Correo SMTP Cifrado · Alertas Críticas en Tiempo Real
        </p>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          Sistema de Notificaciones Automatizadas y Alertas Críticas
        </h1>
      </div>

      {/* 2-Column Layout: Dispatch Console + Customizable Rules Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Manual / Automated Dispatch Form */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-base font-bold text-slate-900">
            Emitir Notificación Instantánea (WhatsApp / Correo / Alerta Crítica)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Despacha mensajes transaccionales firmados a clientes o supervisores de planta.
          </p>

          <form onSubmit={handleSend} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="notif-channel" className="block text-xs font-semibold text-slate-700 mb-1">
                  Canal de Envío
                </label>
                <select
                  id="notif-channel"
                  value={channel}
                  onChange={(e) => {
                    const ch = e.target.value as NotificationChannel;
                    setChannel(ch);
                    if (ch === 'whatsapp') setRecipientTarget('+57 310 489 2210');
                    if (ch === 'email') setRecipientTarget('compras@constructoraandina.co');
                    if (ch === 'sistema_critico') setRecipientTarget('Canal #Guardia-Planta-24-7');
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="whatsapp">WhatsApp Business API</option>
                  <option value="email">Correo Electrónico Corporativo (TLS)</option>
                  <option value="sistema_critico">Alerta Crítica en Tiempo Real (Panel)</option>
                </select>
              </div>

              <div>
                <label htmlFor="notif-severity" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nivel de Prioridad
                </label>
                <select
                  id="notif-severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as NotificationSeverity)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="info">Informativa / Seguimiento</option>
                  <option value="alerta">Preventiva / Alerta Operativa</option>
                  <option value="critica">Crítica (Prioridad Inmediata)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="notif-recipient" className="block text-xs font-semibold text-slate-700 mb-1">
                  Cliente o Área Destino
                </label>
                <input
                  id="notif-recipient"
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="notif-target" className="block text-xs font-semibold text-slate-700 mb-1">
                  Número WhatsApp / Correo / Canal
                </label>
                <input
                  id="notif-target"
                  type="text"
                  value={recipientTarget}
                  onChange={(e) => setRecipientTarget(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notif-subject" className="block text-xs font-semibold text-slate-700 mb-1">
                Asunto de la Notificación
              </label>
              <input
                id="notif-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="notif-message" className="block text-xs font-semibold text-slate-700 mb-1">
                Mensaje Automatizado / Contenido
              </label>
              <textarea
                id="notif-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Disparar Notificación Ahora
            </button>
          </form>
        </div>

        {/* Customizable Notification Rules Matrix */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-base font-bold text-slate-900">
            Reglas de Notificaciones Automatizadas Personalizables
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Active o desactive qué eventos disparan mensajes automáticos por WhatsApp, Email o Alerta Crítica.
          </p>

          <div className="divide-y divide-slate-100">
            {rules.map((rule) => (
              <div key={rule.id} className="py-3.5 space-y-2">
                <div>
                  <p className="text-xs font-bold text-slate-900">{rule.eventLabel}</p>
                  <p className="text-xs text-slate-500">{rule.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.whatsappEnabled}
                      onChange={() => onToggleRule(rule.id, 'whatsappEnabled')}
                      className="rounded border-slate-300 text-slate-900"
                    />
                    <span className="font-medium text-slate-700">WhatsApp API</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.emailEnabled}
                      onChange={() => onToggleRule(rule.id, 'emailEnabled')}
                      className="rounded border-slate-300 text-slate-900"
                    />
                    <span className="font-medium text-slate-700">Correo Electrónico</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.criticalPushEnabled}
                      onChange={() => onToggleRule(rule.id, 'criticalPushEnabled')}
                      className="rounded border-slate-300 text-slate-900"
                    />
                    <span className="font-medium text-slate-700">Alerta Crítica en Panel</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-Time Delivery Log */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bitácora de Notificaciones y Alertas Despachadas en Tiempo Real
            </h2>
            <p className="text-xs text-slate-500">
              Historial auditado de envíos por WhatsApp, Correo Electrónico y Alertas de Sistema
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['todos', 'whatsapp', 'email', 'sistema_critico'] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannelFilter(ch)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  channelFilter === ch
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ch === 'todos'
                  ? 'Todos'
                  : ch === 'whatsapp'
                  ? 'WhatsApp'
                  : ch === 'email'
                  ? 'Correo'
                  : 'Críticas'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {filteredLogs.map((log) => (
            <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {log.channel === 'whatsapp' ? (
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                  ) : log.channel === 'email' ? (
                    <Mail className="w-3.5 h-3.5 text-slate-700" />
                  ) : (
                    <BellRing className="w-3.5 h-3.5 text-amber-700" />
                  )}
                  <span className="font-bold text-slate-900">{log.subject}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-medium text-slate-700">{log.recipientName}</span>
                  <span className="font-mono text-slate-500">({log.recipientTarget})</span>
                </div>
                <p className="text-slate-600">{log.message}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums text-slate-500">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {log.status.toUpperCase()}
                </span>
                <span>{log.createdAt.slice(0, 16).replace('T', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
