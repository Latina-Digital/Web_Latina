import React, { useState } from 'react';
import {
  ExternalLink,
  Save,
  Share2,
  X,
} from 'lucide-react';
import { CompanySocialNetworks } from '../types/erp';

interface SocialNetworksConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  socialNetworks: CompanySocialNetworks;
  onSaveSocialNetworks: (updated: CompanySocialNetworks) => void;
}

export const SocialNetworksConfigModal: React.FC<SocialNetworksConfigModalProps> = ({
  isOpen,
  onClose,
  socialNetworks,
  onSaveSocialNetworks,
}) => {
  const [facebook, setFacebook] = useState(socialNetworks.facebook);
  const [instagram, setInstagram] = useState(socialNetworks.instagram);
  const [tiktok, setTiktok] = useState(socialNetworks.tiktok);
  const [youtube, setYoutube] = useState(socialNetworks.youtube);
  const [whatsapp, setWhatsapp] = useState(socialNetworks.whatsapp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSocialNetworks({
      facebook: facebook.trim(),
      instagram: instagram.trim(),
      tiktok: tiktok.trim(),
      youtube: youtube.trim(),
      whatsapp: whatsapp.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="social-modal-title"
      className="fixed inset-0 z-[9999] modal-layer-top bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-[#0B2861] skeuo-modal-3d">
        {/* Header */}
        <div className="relative overflow-hidden p-6 bg-gradient-to-r from-[#0B2861] via-[#133A85] to-[#0B2861] text-white flex items-center justify-between border-b-2 border-[#FFD100]">
          <div className="relative z-10 flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-[#FFD100]" />
            <div>
              <h3 id="social-modal-title" className="text-base font-extrabold font-display">
                Configuración de Redes Sociales Oficiales
              </h3>
              <p className="text-[11px] text-blue-200">
                Facebook · Instagram · TikTok · YouTube · WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="relative z-10 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer skeuo-btn-3d"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Actualice los enlaces directos a sus perfiles corporativos. Se reflejarán
            instantáneamente en la cabecera, pie de página y botones de contacto del portal.
          </p>

          {/* Facebook */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fa-brands fa-facebook text-blue-600 text-sm"></i>
                <span>Enlace de Facebook:</span>
              </span>
              {facebook && (
                <a
                  href={facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  Probar <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </label>
            <input
              type="url"
              required
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fa-brands fa-instagram text-pink-600 text-sm"></i>
                <span>Enlace de Instagram:</span>
              </span>
              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-pink-600 hover:underline flex items-center gap-0.5"
                >
                  Probar <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </label>
            <input
              type="url"
              required
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>

          {/* TikTok */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fa-brands fa-tiktok text-slate-900 text-sm"></i>
                <span>Enlace de TikTok:</span>
              </span>
              {tiktok && (
                <a
                  href={tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-slate-800 hover:underline flex items-center gap-0.5"
                >
                  Probar <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </label>
            <input
              type="url"
              required
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="https://tiktok.com/@..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>

          {/* YouTube */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fa-brands fa-youtube text-red-600 text-sm"></i>
                <span>Enlace de Canal de YouTube:</span>
              </span>
              {youtube && (
                <a
                  href={youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-red-600 hover:underline flex items-center gap-0.5"
                >
                  Probar <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </label>
            <input
              type="url"
              required
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              placeholder="https://youtube.com/@..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fa-brands fa-whatsapp text-emerald-600 text-sm"></i>
                <span>Enlace / Número de WhatsApp:</span>
              </span>
              {whatsapp && (
                <a
                  href={whatsapp.startsWith('http') ? whatsapp : `https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5"
                >
                  Probar <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </label>
            <input
              type="text"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="https://wa.me/593979732435 o +593 97 973 2435"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold skeuo-btn-3d cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0B2861] hover:bg-blue-950 text-white font-black flex items-center gap-1.5 shadow-md cursor-pointer skeuo-btn-3d"
            >
              <Save className="w-3.5 h-3.5 text-[#FFD100]" />
              <span>Guardar Redes Sociales</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
