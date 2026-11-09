import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  MapPin,
  MessageCircle,
  Plus,
  Share2,
  Sparkles,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { CompanyBlogEvent, EcuadorFestiveThemeId } from '../types/erp';
import { getActiveFestiveTheme } from '../utils/ecuadorThemes';

interface CompanyEventsBlogSectionProps {
  onShowToast?: (msg: string) => void;
  activeThemeId?: EcuadorFestiveThemeId;
}

export const INITIAL_BLOG_EVENTS: CompanyBlogEvent[] = [
  {
    id: 'evt_01',
    title: 'Capacitación Técnica en Obra: Sistemas Elastoméricos & Sellado Alcalino',
    category: 'eventos_clientes',
    date: '18 de Octubre, 2026',
    location: 'Centro de Convenciones de Guayaquil & Obra Vía a la Costa',
    author: 'Departamento Técnico Industrial Latina',
    readTime: '4 min de lectura',
    imageUrl:
      'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80',
    summary:
      'Más de 120 maestros de obra, contratistas y aplicadores certificados participaron en la jornada práctica de aplicación de Duralín Forte y recubrimientos impermeables.',
    content:
      'Durante la jornada, los ingenieros de Industrial Latina realizaron pruebas hidrostáticas en vivo demostrando cómo la membrana elastomérica sella microfisuras térmicas producidas por el calor de la Costa ecuatoriana.',
    highlights: [
      'Demostración de rodillos de pelo corto 3/8" y equipos airless Graco',
      'Certificados de asistencia avalados bajo normativa NTE INEN 2090',
      'Entrega de kits de aplicación profesional a los maestros destacados',
    ],
    attendeesCount: '120+ contratistas',
    isPublished: true,
  },
  {
    id: 'evt_02',
    title: 'Celebración del 46º Aniversario de Fundación de Industrial Latina',
    category: 'festividades_internas',
    date: '12 de Octubre, 2026',
    location: 'Planta Matriz Vía a Daule Km 8.5 · Guayaquil',
    author: 'Comité de Clima Laboral & Gerencia General',
    readTime: '3 min de lectura',
    imageUrl:
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    summary:
      'Homenaje a los colaboradores con más de 25 años de trayectoria en la compañía, entrega de medallas al mérito industrial y almuerzo de confraternidad ecuatoriana.',
    content:
      'En un emotivo encuentro junto a las familias de los operarios de planta, técnicos de laboratorio químico y equipo de logística, celebramos más de cuatro décadas transformando la infraestructura del Ecuador.',
    highlights: [
      'Reconocimiento a 18 colaboradores pioneros con más de 25 años de servicio',
      'Presentación del plan de modernización de planta y sostenibilidad 2027',
      'Confraternidad deportiva y agasajo gastronómico tradicional',
    ],
    attendeesCount: '280 colaboradores',
    isPublished: true,
  },
  {
    id: 'evt_03',
    title: 'Feria Ferretera Nacional Induless & Lanzamiento Conductor CONDEX 2026',
    category: 'eventos_clientes',
    date: '05 de Octubre, 2026',
    location: 'Parque Bicentenario · Quito',
    author: 'Dirección Comercial Induless Ecuador',
    readTime: '5 min de lectura',
    imageUrl:
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
    summary:
      'Encuentro con las 350 principales ferreterías y distribuidoras del Austro y Sierra Norte presentando la nueva línea de iluminación LED y cables de cobre certificado.',
    content:
      'Induless presentó su catálogo técnico 2026 destacando las planchas termoacústicas Techoforte y los paneles LED de 18W con rendimiento lumínico superior y cero parpadeo.',
    highlights: [
      'Alianzas comerciales con ferreterías de Pichincha, Tungurahua y Azuay',
      'Sorteo de órdenes de compra por USD $5,000 en insumos de construcción',
      'Mesas de negociación directa con despacho prioritario',
    ],
    attendeesCount: '350 ferreterías',
    isPublished: true,
  },
  {
    id: 'evt_04',
    title: 'Agasajo de Fin de Año & Tradición de Monigotes del Equipo Humano',
    category: 'festividades_internas',
    date: '28 de Diciembre, 2025',
    location: 'Bodega Central Mapasingue Este · Guayaquil',
    author: 'Talento Humano Industrial Latina',
    readTime: '3 min de lectura',
    imageUrl:
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
    summary:
      'Tradicional concurso de monigotes y años viejos elaborados por las brigadas de planta, entrega de canastas navideñas y premiación al mejor compañero.',
    content:
      'Como cada diciembre, el equipo demostró su creatividad esculpiendo monigotes con material reciclado y pinturas Latina, cerrando un año de récord en toneladas despachadas.',
    highlights: [
      'Concurso inter-departamental de años viejos con premios en efectivo',
      'Entrega de canastas navideñas para el 100% de la nómina',
      'Mensaje de gratitud de la presidencia ejecutiva',
    ],
    attendeesCount: 'Todas las áreas',
    isPublished: true,
  },
];

export const CompanyEventsBlogSection: React.FC<CompanyEventsBlogSectionProps> = ({
  onShowToast,
  activeThemeId = 'quito',
}) => {
  const activeFestiveTheme = getActiveFestiveTheme(activeThemeId);
  const [events, setEvents] = useState<CompanyBlogEvent[]>(INITIAL_BLOG_EVENTS);
  const [filterCategory, setFilterCategory] = useState<
    'todos' | 'eventos_clientes' | 'festividades_internas'
  >('todos');

  // Modal to publish a new event
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'eventos_clientes' | 'festividades_internas'>(
    'eventos_clientes'
  );
  const [newDate, setNewDate] = useState('23 de Octubre, 2026');
  const [newLocation, setNewLocation] = useState('Guayaquil · Planta Matriz');
  const [newSummary, setNewSummary] = useState('');
  const [newHighlight, setNewHighlight] = useState('');
  const [newImageUrl, setNewImageUrl] = useState(
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'
  );

  const filteredEvents = events.filter((e) =>
    filterCategory === 'todos' ? true : e.category === filterCategory
  );

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: CompanyBlogEvent = {
      id: `evt_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      date: newDate.trim(),
      location: newLocation.trim(),
      author: 'Comunicaciones Industrial Latina',
      readTime: '3 min de lectura',
      imageUrl: newImageUrl,
      summary: newSummary.trim() || 'Evento corporativo de Industrial Latina.',
      content: newSummary.trim(),
      highlights: newHighlight
        ? [newHighlight.trim()]
        : ['Participación activa de la comunidad Latina'],
      attendeesCount: 'Personal y clientes invitados',
      isPublished: true,
    };

    setEvents([created, ...events]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewSummary('');
    onShowToast?.('¡Nuevo evento o festividad publicado en el blog con éxito!');
  };

  const handleShareEventWhatsApp = (event: CompanyBlogEvent) => {
    const text = `*${event.title}*\n📍 ${event.location}\n📅 ${event.date}\n${event.summary}\n\nConoce más en el portal oficial de Industrial Latina & Induless.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="blog-eventos-section" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#E3000F] bg-red-50 px-2.5 py-0.5 rounded">
            Blog &amp; Eventos de Empresa
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0B2861] font-display mt-1">
            Eventos con Clientes &amp; Festividades Internas
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Compartimos nuestras actividades en obras, ferias de construcción, capacitaciones a
            maestros pintores y las celebraciones de nuestro equipo humano.
          </p>
        </div>

        {/* Action: Publish new event */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-[#0B2861] hover:bg-blue-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-[#FFD100]" />
          <span>Publicar Evento o Festividad</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'todos' as const, label: 'Todos los Eventos & Artículos' },
          { id: 'eventos_clientes' as const, label: '🤝 Eventos con Clientes & Ferias' },
          { id: 'festividades_internas' as const, label: '🎉 Festividades Internas de Empresa' },
        ].map((tab) => {
          const active = filterCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterCategory(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-[#0B2861] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredEvents.map((event) => {
          const isInternal = event.category === 'festividades_internas';
          return (
            <article
              key={event.id}
              className="bg-white rounded-3xl overflow-hidden border-2 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              style={{
                borderColor: '#e2e8f0',
                borderTopWidth: '5px',
                borderTopColor: isInternal ? '#D8235A' : activeFestiveTheme.accentColor,
              }}
            >
              <div>
                <div className="relative h-60 w-full overflow-hidden bg-slate-900">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-xs ${
                        isInternal
                          ? 'bg-[#D8235A] text-white'
                          : 'bg-[#0B2861] text-[#FFD100]'
                      }`}
                    >
                      {isInternal ? 'Festividad Interna' : 'Evento con Clientes'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-xs flex items-center gap-1 border border-white/20 ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}
                    >
                      <span>{activeFestiveTheme.iconSymbol}</span>
                      <span>{activeFestiveTheme.heroBadge}</span>
                    </span>
                  </div>

                  {event.attendeesCount && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 text-white font-mono text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#FFD100]" />
                        <span>{event.attendeesCount}</span>
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="flex items-center gap-3 text-[11px] text-slate-300 mb-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#FFD100]" /> {event.date}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-red-400" /> {event.location}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold leading-snug drop-shadow-sm group-hover:text-[#FFD100] transition-colors">
                      {event.title}
                    </h3>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">{event.summary}</p>

                  {event.highlights && event.highlights.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                      <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wide block">
                        Momentos Destacados:
                      </span>
                      <ul className="space-y-1 text-slate-600">
                        {event.highlights.map((hl, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">{event.author}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareEventWhatsApp(event)}
                    className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Compartir</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal to Publish New Event */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-event-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-[#0B2861] animate-fade-in-up">
            <div className="p-5 bg-[#0B2861] text-white flex items-center justify-between border-b-2 border-[#FFD100]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FFD100]" />
                <h3 id="new-event-modal-title" className="text-base font-extrabold font-display">
                  Publicar Nuevo Evento o Celebración
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Título del Evento *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Feria de Innovación Técnica & Capacitación en Obra"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Categoría:</label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as 'eventos_clientes' | 'festividades_internas')
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="eventos_clientes">Evento con Clientes / Feria</option>
                    <option value="festividades_internas">Festividad Interna de Empresa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Fecha:</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Ubicación / Ciudad *</label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Guayaquil · Planta Vía a Daule"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Resumen de la Actividad *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Describa el objetivo del evento, clientes asistentes o la celebración del equipo humano."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Momento Destacado:</label>
                <input
                  type="text"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="Ej. Demostración práctica con 80 maestros certificados"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">URL de la Fotografía:</label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B2861] hover:bg-blue-950 text-white font-black flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#FFD100]" />
                  <span>Publicar Evento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
