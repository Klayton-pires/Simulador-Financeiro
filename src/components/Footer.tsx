import React from 'react';
import { MessageSquare, MapPin, Mail, Phone, Globe, Share2, ShieldCheck, Terminal, Cpu, AlertCircle } from 'lucide-react';
import { NanuCloudLogo } from './NanuCloudLogo';
import { SystemSettings } from '../types';

interface FooterProps {
  settings?: SystemSettings | null;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  // Read from settings prop or synchronized localStorage admin contacts
  const localContacts = (() => {
    try {
      const saved = localStorage.getItem('nanucloud_admin_contacts');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const companyName = settings?.companyName || 'NANUCLOUD';
  const address = settings?.companyAddress || 'Angola, Luanda, Viana, Capalanca';
  const email = settings?.supportEmail || settings?.companyEmail1 || localContacts?.supportEmail || 'suporte.simulador@nanucloud.com';

  const rawPhone1 = settings?.companyPhone1 || localContacts?.phones?.[0] || '+244 955 581 862';
  const rawPhone2 = settings?.companyPhone2 || localContacts?.phones?.[1] || '+244 955 580 653';
  const phonesList = [rawPhone1, rawPhone2].filter((p, i, arr) => Boolean(p) && arr.indexOf(p) === i);

  const rawWhatsapp1 = settings?.whatsappSupport1 || localContacts?.whatsapps?.[0] || '+244 944 935 617';
  const rawWhatsapp2 = settings?.whatsappSupport2 || localContacts?.whatsapps?.[1] || '+244 944 935 618';
  const whatsappsList = [rawWhatsapp1, rawWhatsapp2].filter((w, i, arr) => Boolean(w) && arr.indexOf(w) === i);

  const currentYear = new Date().getFullYear();
  const defaultCopyright = `${currentYear} Nanucloud. Todos os direitos reservados.`;
  const copyright = settings?.footerCopyrightText && !settings.footerCopyrightText.includes('Klayton Pires')
    ? settings.footerCopyrightText.replace(/202[0-9]/g, currentYear.toString()).replace(/^©\s*/, '')
    : defaultCopyright;

  // Check which social networks are defined
  const hasSocials = Boolean(
    settings?.socialFacebook ||
    settings?.socialInstagram ||
    settings?.socialLinkedIn ||
    settings?.socialTwitterX ||
    settings?.socialYouTube ||
    settings?.socialWhatsApp
  );

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 mt-auto">
      {/* Top Details & WhatsApp Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left border-b border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <NanuCloudLogo className="h-7" isDarkTheme={true} customLogoUrl={settings?.companyLogoUrl} />
          </div>
          <span className="hidden sm:inline text-slate-700">|</span>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{address}</span>
          </p>
          <span className="hidden sm:inline text-slate-700">|</span>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <a href={`mailto:${email}`} className="hover:text-sky-300 transition-colors">{email}</a>
          </p>
          <span className="hidden sm:inline text-slate-700">|</span>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{phonesList.join(' / ')}</span>
          </p>
          {settings?.companyNif && (
            <>
              <span className="hidden sm:inline text-slate-700">|</span>
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">NIF:</span> {settings.companyNif}
              </p>
            </>
          )}
        </div>

        {/* WhatsApp Support & Social Links */}
        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Direct Support buttons */}
          {whatsappsList.map((waNum, idx) => (
            <a
              key={idx}
              href={`https://wa.me/${waNum.replace(/\D/g, '')}?text=Ola%2C%20preciso%20de%20ajuda%20com%20o%20Simulador%20Nanucloud`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-mono transition-colors"
              title={`Suporte WhatsApp: ${waNum}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{waNum}</span>
            </a>
          ))}

          {/* Optional Social Buttons - Only shown if configured by Super Admin */}
          {settings?.socialFacebook && (
            <a
              href={settings.socialFacebook}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Facebook Oficial"
            >
              <span className="font-bold text-xs px-1">FB</span>
            </a>
          )}
          {settings?.socialInstagram && (
            <a
              href={settings.socialInstagram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Instagram Oficial"
            >
              <span className="font-bold text-xs px-1">IG</span>
            </a>
          )}
          {settings?.socialLinkedIn && (
            <a
              href={settings.socialLinkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white border border-slate-700 transition"
              title="LinkedIn Oficial"
            >
              <span className="font-bold text-xs px-1">IN</span>
            </a>
          )}
          {settings?.socialTwitterX && (
            <a
              href={settings.socialTwitterX}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="X / Twitter Oficial"
            >
              <span className="font-bold text-xs px-1">X</span>
            </a>
          )}
        </div>
      </div>

      {/* Mandatory Accountant Disclaimer Banner */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 border-b border-slate-800/80">
        <div className="flex items-center justify-center gap-2.5 text-xs text-amber-300 text-center bg-amber-500/10 border border-amber-500/20 py-2.5 px-4 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Aviso Legal Nanucloud:</strong> A utilização deste aplicativo tem caráter meramente informativo e estimativo, <strong>não dispensando a consulta de um profissional de contas</strong> ou contabilista certificado.
          </span>
        </div>
      </div>

      {/* Sleek Console Status Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            API STATUS: <span className="text-emerald-400 font-bold">OPERATIONAL</span>
          </span>
          <span>
            ENCRYPTION: <span className="text-emerald-400 font-bold">AES-256 / BCRYPT</span>
          </span>
          <span>
            SESSION TIMEOUT: <span className="text-slate-400">24H</span>
          </span>
          <span className="hidden md:inline">
            SYSTEM: <span className="text-emerald-400 font-bold">ONLINE & SECURE</span>
          </span>
        </div>
        <span>&copy; {copyright}</span>
      </div>
    </footer>
  );
};
