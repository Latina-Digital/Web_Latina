import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Package,
  Truck,
  CreditCard,
  FileText,
  Database,
  Minimize2,
  Maximize2,
  RefreshCw,
  Cpu,
  UserCheck,
} from 'lucide-react';
import { InventoryItem } from '../types/erp';
import {
  GEMINI_CHAT_MODELS,
  GEMINI_SYSTEM_ROLES,
  GeminiChatModelId,
} from '../utils/scienceAndMultimodalLogic';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
  modelUsed?: string;
}

interface IndustrialLatinaAiBotProps {
  inventory: InventoryItem[];
  onOpenCatalogPdf?: () => void;
  onOpenMultimodalLab?: () => void;
}

const QUICK_PROMPTS = [
  {
    label: 'Rendimiento y precios de pinturas',
    prompt: '¿Cuáles son los precios, presentaciones y rendimientos de las pinturas arquitectónicas e impermeabilizantes?',
    icon: Package,
  },
  {
    label: 'Tiempo de entrega (48 a 72h) y Factura',
    prompt: '¿Cuánto demora la entrega de mi pedido y cómo recibo mi factura electrónica?',
    icon: Truck,
  },
  {
    label: 'Link de Pago y Pasarela',
    prompt: '¿Cómo funciona el link de pago al terminar mi pedido y qué métodos aceptan?',
    icon: CreditCard,
  },
  {
    label: 'Fichas técnicas en Google Drive',
    prompt: '¿Dónde puedo ver las fichas técnicas en Google Drive y las imágenes por presentación?',
    icon: FileText,
  },
  {
    label: 'Integración SYSPRO / Latinasoft',
    prompt: '¿Cómo funciona la conexión de facturación electrónica, inventario y pre-pedido con SYSPRO y Latinasoft?',
    icon: Database,
  },
];

export const IndustrialLatinaAiBot: React.FC<IndustrialLatinaAiBotProps> = ({
  inventory,
  onOpenCatalogPdf,
  onOpenMultimodalLab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiChatModelId>('gemini-3.8-flash');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(GEMINI_SYSTEM_ROLES[0].id);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        '¡Hola! Soy el **Asistente Inteligente Multi-Modelo de Industrial Latina & Induless**. Estoy conectado mediante `ai.chats.create` al catálogo oficial, fichas técnicas de Google Drive, pasarela de links de pago, formulación química y conector SYSPRO/Latinasoft.\n\nPuedes elegir arriba el modelo (`gemini-3.8-flash`, `gemini-4-argon` o `gemini-3.1-flash-lite`) y el rol de especialista.',
      timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      source: 'Gemini Multi-Turn Chat',
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const activeRoleObj =
    GEMINI_SYSTEM_ROLES.find((r) => r.id === selectedRoleId) || GEMINI_SYSTEM_ROLES[0];

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const catalogContext = inventory.slice(0, 12).map((item) => ({
        sku: item.sku,
        name: item.name,
        category: item.category,
        price: item.unitPrice,
        presentations: (item.presentations || [])
          .map((p) => `${p.name}: $${p.unitPrice.toFixed(2)}`)
          .join(', '),
        googleDriveUrl:
          item.technicalSheet?.googleDriveUrl ||
          'https://drive.google.com/drive/folders/1IndLatina_TechSheets',
      }));

      const response = await fetch('/api/ai/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          model: selectedModel,
          systemRoleInstruction: activeRoleObj.systemInstruction,
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          catalogContext,
        }),
      });

      const data = await response.json();
      const replyText =
        data?.reply ||
        'En Industrial Latina & Induless contamos con stock inmediato. Recuerda que al pagar con tu Link de Pago enviamos tu factura electrónica por WhatsApp y correo electrónico, y la entrega dura entre 48 a 72 horas.';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
        source: data?.source === 'gemini' ? 'Gemini Chat SDK' : 'Motor Técnico Industrial Latina',
        modelUsed: data?.modelUsed || selectedModel,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        role: 'assistant',
        content:
          'Con gusto te ayudo: todos nuestros productos cuentan con presentaciones desde Litro, Galón, Caneca (5 Gal) hasta Tanque (55 Gal) con imagen específica y ficha técnica en Google Drive. Al finalizar tu pedido se genera tu Link de Pago directo y tu factura electrónica se envía automáticamente a tu WhatsApp y correo electrónico especificando que la entrega dura entre 48 a 72 horas.',
        timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
        source: 'Asistente Técnico Industrial Latina',
        modelUsed: selectedModel,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] modal-layer-top flex flex-col items-end"
      style={{ zIndex: 9999 }}
    >
      {isOpen ? (
        <div
          data-testid="ai-assistant-bot-panel"
          className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'w-[94vw] sm:w-[580px] h-[82vh] max-h-[760px]'
              : 'w-[94vw] sm:w-[430px] h-[600px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white px-4 py-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black tracking-tight text-white">
                    Chatbot Gemini Industrial Latina
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <Sparkles className="w-2.5 h-2.5" /> Multi-Turn
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {activeRoleObj.label} • Modelo: {selectedModel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title={isExpanded ? 'Reducir ventana' : 'Ampliar ventana'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                data-testid="close-ai-bot-btn"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Cerrar asistente"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Model & System Role Selector Bar */}
          <div className="px-3 py-2 bg-slate-900 text-slate-100 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <label className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-bold text-slate-300 shrink-0">Modelo:</span>
              <select
                data-testid="ai-bot-model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as GeminiChatModelId)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-amber-300 focus:outline-none focus:border-amber-400"
              >
                {GEMINI_CHAT_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.badge})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold text-slate-300 shrink-0">Rol:</span>
              <select
                data-testid="ai-bot-role-select"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-emerald-300 focus:outline-none focus:border-emerald-400"
              >
                {GEMINI_SYSTEM_ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Quick prompts bar */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((qp, idx) => {
              const Icon = qp.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendMessage(qp.prompt)}
                  disabled={isLoading}
                  className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-2xs"
                >
                  <Icon className="w-3 h-3 text-blue-600 dark:text-amber-400" />
                  {qp.label}
                </button>
              );
            })}
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-blue-700 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-bl-xs'
                  }`}
                >
                  {msg.content}
                </div>
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  {msg.source && (
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-amber-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {msg.source}
                    </span>
                  )}
                  {msg.modelUsed && (
                    <span className="text-[10px] font-mono text-slate-500">
                      [{msg.modelUsed}]
                    </span>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Ejecutando {selectedModel} con historial multi-turn...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer & Input */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-lg px-2.5 py-1.5">
              <span className="text-[11px] font-medium text-amber-900 dark:text-amber-200">
                Catálogo PDF Minimalista &amp; Estudio IA Multimodal
              </span>
              <div className="flex items-center gap-2">
                {onOpenMultimodalLab && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenMultimodalLab();
                    }}
                    className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline"
                  >
                    Abrir Estudio IA
                  </button>
                )}
                {onOpenCatalogPdf && (
                  <button
                    type="button"
                    onClick={onOpenCatalogPdf}
                    className="text-[11px] font-bold text-blue-700 dark:text-amber-400 hover:underline"
                  >
                    Descargar PDF
                  </button>
                )}
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                data-testid="ai-bot-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe cualquier duda (precios, envíos 48-72h, pagos, química...)"
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                data-testid="ai-bot-send-btn"
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white shadow-sm transition-colors"
                title="Enviar consulta a la IA"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          type="button"
          data-testid="open-ai-bot-btn"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 pl-3.5 pr-4 py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl hover:shadow-2xl border border-amber-400/40 hover:scale-[1.02] transition-all"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black shadow-sm">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-white">
                Asistente IA Industrial Latina
              </span>
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[10px] text-slate-300">
              Multi-Modelo (Argon / Flash / Lite) • 24/7
            </p>
          </div>
        </button>
      )}
    </div>
  );
};
