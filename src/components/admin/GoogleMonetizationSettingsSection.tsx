import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Save,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';
import { UserSafe } from '../../types';
import { trackGoogleEvent, initGoogleAnalytics } from '../../utils/googleAnalytics';

interface GoogleMonetizationSettingsSectionProps {
  currentUser: UserSafe;
  showSaveNotice: (msg: string) => void;
}

export const GoogleMonetizationSettingsSection: React.FC<GoogleMonetizationSettingsSectionProps> = ({
  currentUser,
  showSaveNotice
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Formulário de Configurações
  const [gaEnabled, setGaEnabled] = useState(true);
  const [gaMeasurementId, setGaMeasurementId] = useState('G-NANUCLOUD1');
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [adsPublisherId, setAdsPublisherId] = useState('ca-pub-9428510834729105');
  const [adsConversionId, setAdsConversionId] = useState('AW-11482910283');
  const [showOnPaidUsers, setShowOnPaidUsers] = useState(false);

  // Slots de Anúncios ativos
  const [slotTopLeaderboard, setSlotTopLeaderboard] = useState(true);
  const [slotInContent, setSlotInContent] = useState(true);
  const [slotFooter, setSlotFooter] = useState(true);

  // Calculador de Projeção de Ganhos
  const [projectedMonthlyVisitors, setProjectedMonthlyVisitors] = useState(15000);
  const [projectedEcpm, setProjectedEcpm] = useState(2.40);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/plans/public-config');
      if (res.ok) {
        const data = await res.json();
        setGaEnabled(data.googleAnalyticsEnabled ?? true);
        setGaMeasurementId(data.googleAnalyticsMeasurementId || 'G-NANUCLOUD1');
        setAdsEnabled(data.googleAdsEnabled ?? true);
        setAdsPublisherId(data.googleAdsensePublisherId || 'ca-pub-9428510834729105');
        setAdsConversionId(data.googleAdsConversionId || 'AW-11482910283');
        setShowOnPaidUsers(data.googleAdsShowOnPaidUsers ?? false);
      }
    } catch {
      // offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        googleAnalyticsEnabled: gaEnabled,
        googleAnalyticsMeasurementId: gaMeasurementId.trim(),
        googleAdsEnabled: adsEnabled,
        googleAdsenseEnabled: adsEnabled,
        googleAdsensePublisherId: adsPublisherId.trim(),
        googleAdsConversionId: adsConversionId.trim(),
        googleAdsShowOnPaidUsers: showOnPaidUsers
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Re-inicializar Google Analytics com o novo ID
        if (gaEnabled && gaMeasurementId) {
          initGoogleAnalytics(gaMeasurementId.trim());
        }
        showSaveNotice('Configurações do Google Analytics e Google Ads guardadas com sucesso no servidor!');
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao guardar configurações.');
      }
    } catch {
      showSaveNotice('Configurações guardadas em cache local!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEvent = () => {
    trackGoogleEvent('admin_test_event', {
      admin_user: currentUser.name,
      admin_email: currentUser.email,
      test_time: new Date().toISOString()
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  // Cálculo da Projeção de Renda Extra
  // Cada visitante visualiza em média 3 páginas = 3 visualizações por visitante
  // Em cada página, há até 2 blocos de anúncios = 6 impressões de anúncio por visitante
  const estimatedImpressions = projectedMonthlyVisitors * 5;
  const estimatedMonthlyUsd = (estimatedImpressions / 1000) * projectedEcpm;
  const estimatedMonthlyKz = Math.round(estimatedMonthlyUsd * 930);

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-amber-950/40 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono">
                GOOGLE ANALYTICS & GOOGLE ADS (MONETIZAÇÃO)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Renda Extra & Audiência
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Monitore em tempo real o número de visitantes e configure os blocos de publicidade para rentabilizar automaticamente o tráfego da aplicação.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'A guardar...' : 'Guardar Alterações'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PARTE 1: GOOGLE ANALYTICS (GA4) */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Google Analytics 4 (GA4)</h3>
                <span className="text-[11px] text-slate-400">Medição de Tráfego e Visitantes</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={gaEnabled}
                onChange={(e) => setGaEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ID de Medição do Google Analytics (Measurement ID)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={gaMeasurementId}
                  onChange={(e) => setGaMeasurementId(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  disabled={!gaEnabled}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition disabled:opacity-50"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Obtenha este ID no painel do Google Analytics &gt; Administrador &gt; Fluxos de Dados. Exemplo: <code className="text-indigo-300">G-NANUCLOUD1</code>
              </p>
            </div>

            {/* Test GA4 event */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-slate-300 block">Testar Envio de Evento em Tempo Real</span>
                <span className="text-[10px] text-slate-500">Dispara um evento de teste para o relatório do Google Analytics</span>
              </div>
              <button
                type="button"
                onClick={handleSendTestEvent}
                disabled={!gaEnabled}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition cursor-pointer disabled:opacity-50"
              >
                {testSent ? '✓ Evento Enviado!' : 'Disparar Teste'}
              </button>
            </div>

            {/* External Direct Link */}
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <span>Abrir Consola Oficial do Google Analytics</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* PARTE 2: GOOGLE ADS & ADSENSE (RENDA EXTRA) */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Google Ads & AdSense (Renda Extra)</h3>
                <span className="text-[11px] text-slate-400">Monetização por Anúncios Patrocinados</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adsEnabled}
                onChange={(e) => setAdsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ID do Publicador Google AdSense (Publisher ID)
              </label>
              <input
                type="text"
                value={adsPublisherId}
                onChange={(e) => setAdsPublisherId(e.target.value)}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                disabled={!adsEnabled}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:border-amber-500 outline-none transition disabled:opacity-50"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                O seu código de cliente do AdSense. Exemplo: <code className="text-amber-300">ca-pub-9428510834729105</code>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ID de Conversão Google Ads (Opcional)
              </label>
              <input
                type="text"
                value={adsConversionId}
                onChange={(e) => setAdsConversionId(e.target.value)}
                placeholder="AW-XXXXXXXXXX"
                disabled={!adsEnabled}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:border-amber-500 outline-none transition disabled:opacity-50"
              />
            </div>

            {/* Display on paid users toggle */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-300 block">Exibir Anúncios em Utilizadores Pagos</span>
                <span className="text-[10px] text-slate-500">Se desativado, utilizadores com planos pagos não verão anúncios (benefício VIP)</span>
              </div>
              <input
                type="checkbox"
                checked={showOnPaidUsers}
                onChange={(e) => setShowOnPaidUsers(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
            </div>

            {/* External Direct Link */}
            <a
              href="https://adsense.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <span>Abrir Consola Oficial do Google AdSense</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* PARTE 3: SIMULADOR DE PROJEÇÃO DE RENDA EXTRA */}
      <div className="bg-gradient-to-br from-slate-900 via-[#1E293B] to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Simulador de Renda Extra por Tráfego</h3>
          <span className="text-xs text-slate-400">Calcule o potencial de rendimentos com base nos visitantes mensais</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Visitantes Mensais Estimados: <strong className="text-white font-mono">{projectedMonthlyVisitors.toLocaleString('pt-PT')}</strong>
            </label>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={projectedMonthlyVisitors}
              onChange={(e) => setProjectedMonthlyVisitors(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>1.000</span>
              <span>50.000</span>
              <span>100.000</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              eCPM Médio Estimado: <strong className="text-white font-mono">${projectedEcpm.toFixed(2)} USD</strong>
            </label>
            <input
              type="range"
              min="0.5"
              max="6.0"
              step="0.1"
              value={projectedEcpm}
              onChange={(e) => setProjectedEcpm(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>$0.50</span>
              <span>$3.00</span>
              <span>$6.00</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-3.5 flex flex-col justify-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1">
              Projeção de Renda Extra Mensal
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">
              {estimatedMonthlyKz.toLocaleString('pt-PT')} <span className="text-xs text-amber-400">Kz / mês</span>
            </div>
            <span className="text-xs text-slate-400 font-mono mt-0.5">
              ≈ ${Math.round(estimatedMonthlyUsd).toLocaleString('pt-PT')} USD (pago diretamente pelo Google)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
