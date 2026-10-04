import React, { useEffect, useState, useRef } from 'react';
import { ExternalLink, Sparkles, TrendingUp, X, Info, ShieldCheck, ChevronRight } from 'lucide-react';
import { trackAdEvent } from '../../utils/googleAnalytics';

export type AdBannerPosition = 'top-leaderboard' | 'in-content' | 'sidebar' | 'footer-banner';

interface GoogleAdBannerProps {
  position: AdBannerPosition;
  publisherId?: string;
  slotId?: string;
  enabled?: boolean;
  isPaidUser?: boolean;
  className?: string;
  onOpenPlans?: () => void;
}

// Exemplos realistas de patrocinadores locais e parceiros comerciais de relevância fiscal e empresarial
const SPONSOR_ADS = [
  {
    id: 'sponsor_agt_phc',
    brand: 'Software de Faturação Certificado AGT',
    title: 'Emita Faturas Certificadas e Conecte o Simulador ao seu ERP',
    description: 'Integração direta com Primavera, PHC e SAP. Exportação automática de ficheiros SAF-T de Angola.',
    cta: 'Saber Mais & Testar Grátis',
    tag: 'ERP & Faturação',
    gradient: 'from-blue-600/20 via-indigo-600/10 to-slate-900',
    borderColor: 'border-blue-500/30',
    link: 'https://www.google.com/search?q=software+de+faturacao+certificado+agt+angola'
  },
  {
    id: 'sponsor_aduaneiro',
    brand: 'Logística Portuária & Despachos Aduaneiros',
    title: 'Desembaraço Aduaneiro Rápido no Porto de Luanda e Aeroporto',
    description: 'Cotações imediatas de fretes marítimos e aéreos. Calcule com precisão os direitos na Pauta Aduaneira.',
    cta: 'Consultar Despachante',
    tag: 'Importação & Fretes',
    gradient: 'from-cyan-600/20 via-sky-600/10 to-slate-900',
    borderColor: 'border-cyan-500/30',
    link: 'https://www.google.com/search?q=despachos+aduaneiros+porto+de+luanda'
  },
  {
    id: 'sponsor_contabilistico',
    brand: 'Gabinete de Contabilidade & Auditoria Fiscal',
    title: 'Reduza Custos Fiscais e Regularize o IVA da sua Empresa',
    description: 'Apoio especializado em Imposto Industrial, Retenção na Fonte 6,5% e mapas de amortização.',
    cta: 'Agendar Consulta',
    tag: 'Auditoria Fiscal',
    gradient: 'from-emerald-600/20 via-teal-600/10 to-slate-900',
    borderColor: 'border-emerald-500/30',
    link: 'https://www.google.com/search?q=consultoria+fiscal+contabilidade+angola'
  },
  {
    id: 'sponsor_tpa_express',
    brand: 'Terminais TPA & Pagamentos Multicaixa',
    title: 'Aceite Cartões e Pagamentos Multicaixa Express Sem Falhas',
    description: 'Taxas reduzidas de TPA a partir de 0,8%. Melhore a margem líquida em cada transação comercial.',
    cta: 'Pedir Terminal TPA',
    tag: 'Fintech & Pagamentos',
    gradient: 'from-amber-600/20 via-orange-600/10 to-slate-900',
    borderColor: 'border-amber-500/30',
    link: 'https://www.google.com/search?q=multicaixa+express+tpa+pagamentos'
  }
];

export const GoogleAdBanner: React.FC<GoogleAdBannerProps> = ({
  position,
  publisherId = 'ca-pub-9428510834729105',
  slotId = '1092847291',
  enabled = true,
  isPaidUser = false,
  className = '',
  onOpenPlans
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [adIndex, setAdIndex] = useState(0);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const hasTrackedImpression = useRef(false);

  // Se estiver desativado nas definições ou utilizador dispensou
  if (!enabled || isDismissed) {
    return null;
  }

  // Alternar anúncio patrocinador periodicamente
  useEffect(() => {
    // Escolher anúncio inicial conforme a posição
    const posOffset = position === 'top-leaderboard' ? 0 : position === 'in-content' ? 1 : position === 'sidebar' ? 2 : 3;
    setAdIndex(posOffset % SPONSOR_ADS.length);

    const interval = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % SPONSOR_ADS.length);
    }, 18000);

    return () => clearInterval(interval);
  }, [position]);

  // Carregar script oficial do Google AdSense
  useEffect(() => {
    if (!publisherId) return;

    if (!document.getElementById('google-adsense-script')) {
      const script = document.createElement('script');
      script.id = 'google-adsense-script';
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      script.crossOrigin = 'anonymous';
      script.onload = () => setIsScriptLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsScriptLoaded(true);
    }

    // Registar impressão para análise de receita
    if (!hasTrackedImpression.current) {
      hasTrackedImpression.current = true;
      trackAdEvent('impression', `${position}_${slotId}`);
    }
  }, [publisherId, position, slotId]);

  // Tentativa de puxar anúncio nativo se o script do Google AdSense responder
  useEffect(() => {
    if (isScriptLoaded && window.adsbygoogle && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // Fallback para visualização de banner patrocinado
      }
    }
  }, [isScriptLoaded]);

  const currentSponsor = SPONSOR_ADS[adIndex];

  const handleAdClick = (e: React.MouseEvent) => {
    trackAdEvent('click', `${position}_${slotId}_${currentSponsor.id}`);
  };

  // 1. BANNER TOPO (Leaderboard horizontal responsivo)
  if (position === 'top-leaderboard') {
    return (
      <div className={`w-full max-w-7xl mx-auto my-3 px-2 sm:px-4 ${className}`}>
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${currentSponsor.gradient} border ${currentSponsor.borderColor} p-3 sm:p-4 shadow-lg backdrop-blur-sm transition-all duration-300`}>
          {/* Header de compliance do Google Ads */}
          <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] mb-2 text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider text-[9px]">
                Anúncio Google Ads
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{currentSponsor.brand}</span>
            </div>
            <div className="flex items-center gap-2">
              {onOpenPlans && (
                <button
                  type="button"
                  onClick={onOpenPlans}
                  className="text-indigo-400 hover:text-indigo-300 transition text-[10px] underline underline-offset-2 hidden sm:inline"
                >
                  Remover anúncios (Plano Pro)
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition"
                title="Fechar este anúncio"
                aria-label="Fechar anúncio"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Conteúdo do Anúncio */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs sm:text-sm font-bold text-white hover:text-indigo-200 transition">
                  {currentSponsor.title}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1 sm:line-clamp-2">
                {currentSponsor.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={currentSponsor.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleAdClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md hover:shadow-indigo-500/25 transition active:scale-95"
              >
                <span>{currentSponsor.cta}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. BANNER IN-CONTENT (Dentro da página de cálculo / simulador)
  if (position === 'in-content') {
    return (
      <div className={`my-6 rounded-2xl bg-gradient-to-br ${currentSponsor.gradient} border ${currentSponsor.borderColor} p-4 sm:p-5 shadow-xl transition-all duration-300 ${className}`}>
        {/* Compliance Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-3 text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px]">
              Publicidade Google
            </span>
            <span className="text-slate-400 hidden sm:inline">Espaço Publicitário Parceiro</span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenPlans && (
              <button
                type="button"
                onClick={onOpenPlans}
                className="text-indigo-400 hover:text-indigo-300 text-[10px] underline underline-offset-2 hidden sm:inline"
              >
                Navegar Sem Anúncios
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-slate-500 hover:text-slate-300 p-0.5 transition"
              title="Dispensar"
              aria-label="Dispensar anúncio"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ad Body */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-200 font-mono font-medium">
                {currentSponsor.tag}
              </span>
              <span className="text-xs text-slate-400 font-medium">{currentSponsor.brand}</span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {currentSponsor.title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentSponsor.description}
            </p>
          </div>

          <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
            <a
              href={currentSponsor.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg transition active:scale-95"
            >
              <span>{currentSponsor.cta}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-[10px] text-slate-500 font-mono">
              ID Slot: {slotId}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. BANNER SIDEBAR / LATERAL (Retângulo compacto 300x250)
  if (position === 'sidebar') {
    return (
      <div className={`rounded-xl bg-gradient-to-b ${currentSponsor.gradient} border ${currentSponsor.borderColor} p-3.5 shadow-md ${className}`}>
        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mb-2 pb-1 border-b border-white/[0.06]">
          <span className="text-amber-400 font-bold uppercase">Anúncio Google</span>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-slate-500 hover:text-slate-300"
            aria-label="Fechar anúncio"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
            {currentSponsor.tag}
          </span>
          <h5 className="text-xs font-bold text-white leading-snug">
            {currentSponsor.title}
          </h5>
          <p className="text-[11px] text-slate-300 line-clamp-2">
            {currentSponsor.description}
          </p>
          <a
            href={currentSponsor.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAdClick}
            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition"
          >
            <span>{currentSponsor.cta}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  // 4. BANNER RODAPÉ (Horizontal antes do footer)
  return (
    <div className={`w-full max-w-7xl mx-auto my-4 px-4 ${className}`}>
      <div className={`rounded-xl bg-slate-900/90 border border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs`}>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold shrink-0">
            Anúncio Google Ads
          </span>
          <div>
            <span className="font-bold text-white block">{currentSponsor.brand}</span>
            <span className="text-slate-400 text-[11px]">{currentSponsor.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={currentSponsor.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAdClick}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center gap-1"
          >
            <span>{currentSponsor.cta}</span>
            <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
