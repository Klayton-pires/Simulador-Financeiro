import React, { useState } from 'react';
import {
  Package,
  Save,
  CheckCircle2,
  Coins,
  ShieldCheck,
  Calendar,
  Sparkles,
  Zap,
  Tag,
  Plus,
  Edit3,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { UserSafe } from '../../types';

export interface PlanConfigItem {
  id: string;
  name: string;
  badge?: string;
  priceKz: number;
  validityDays: number;
  queriesCount: number;
  unlocksImport: boolean;
  unlocksBatch: boolean;
  unlocksApi: boolean;
  supportPriority: 'standard' | 'high' | 'vip';
  isActive: boolean;
  description: string;
}

const DEFAULT_PLANS: PlanConfigItem[] = [
  {
    id: 'plan_starter',
    name: 'Básico Starter',
    badge: 'Popular PME',
    priceKz: 15000,
    validityDays: 30,
    queriesCount: 50,
    unlocksImport: false,
    unlocksBatch: false,
    unlocksApi: false,
    supportPriority: 'standard',
    isActive: true,
    description: 'Ideal para pequenos comerciantes e validação de PVP diário com IVA.'
  },
  {
    id: 'plan_pro',
    name: 'Profissional Mensal',
    badge: 'Recomendado',
    priceKz: 35000,
    validityDays: 30,
    queriesCount: 250,
    unlocksImport: true,
    unlocksBatch: true,
    unlocksApi: false,
    supportPriority: 'high',
    isActive: true,
    description: 'Para contadores, gabinetes fiscais e empresas com lotes Excel e importação.'
  },
  {
    id: 'plan_enterprise',
    name: 'Empresarial Anual',
    badge: 'Melhor Valor',
    priceKz: 180000,
    validityDays: 365,
    queriesCount: 1500,
    unlocksImport: true,
    unlocksBatch: true,
    unlocksApi: true,
    supportPriority: 'vip',
    isActive: true,
    description: 'Para médias e grandes empresas, ERPs integrados via API e lotes ilimitados.'
  },
  {
    id: 'plan_vip_unlimited',
    name: 'Corporativo Ilimitado',
    badge: 'VIP Corporativo',
    priceKz: 350000,
    validityDays: 365,
    queriesCount: 99999,
    unlocksImport: true,
    unlocksBatch: true,
    unlocksApi: true,
    supportPriority: 'vip',
    isActive: true,
    description: 'Consultas ilimitadas para grupos empresariais e suporte prioritário 24/7.'
  }
];

interface PlansManagementSectionProps {
  currentUser: UserSafe;
  showSaveNotice: (msg: string) => void;
}

export const PlansManagementSection: React.FC<PlansManagementSectionProps> = ({
  currentUser,
  showSaveNotice
}) => {
  const [plans, setPlans] = useState<PlanConfigItem[]>(() => {
    const saved = localStorage.getItem('nanucloud_plans_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_PLANS;
  });

  // Free trial credits configuration (Signup bonus defined by admin)
  const [freeRegisterCredits, setFreeRegisterCredits] = useState<number>(() => {
    const saved = localStorage.getItem('nanucloud_free_reg_credits');
    return saved ? Number(saved) : 10;
  });

  const [guestCredits, setGuestCredits] = useState<number>(() => {
    return 0; // Não há consulta grátis para visitantes anónimos
  });

  const [lowBalanceAlertLimit, setLowBalanceAlertLimit] = useState<number>(() => {
    const saved = localStorage.getItem('nanucloud_low_balance_limit');
    return saved ? Number(saved) : 5;
  });

  const handleUpdatePlan = (index: number, field: keyof PlanConfigItem, value: any) => {
    setPlans((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveAll = async () => {
    localStorage.setItem('nanucloud_plans_config', JSON.stringify(plans));
    localStorage.setItem('nanucloud_free_reg_credits', String(freeRegisterCredits));
    localStorage.setItem('nanucloud_guest_credits', '0');
    localStorage.setItem('nanucloud_low_balance_limit', String(lowBalanceAlertLimit));

    // Persistir também nas configurações globais do backend
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeQueriesOnRegister: freeRegisterCredits,
          freeQueriesDaily: 0
        })
      });
    } catch (e) {
      console.warn('Erro ao atualizar configurações no servidor:', e);
    }

    window.dispatchEvent(new Event('nanucloud_plans_updated'));
    showSaveNotice(`Configurações de planos e bónus de inscrição (${freeRegisterCredits} créditos) salvas com sucesso!`);
  };

  return (
    <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200 font-mono text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" /> PLANOS, PACOTES & PREÇOS DE SUBSCRIÇÃO
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
              Comercialização
            </span>
          </div>
          <p className="text-slate-400 mt-1">
            Defina preços em Kwanzas (Kz), quantidade de consultas incluídas, validade em dias e módulos desbloqueados para utilizadores.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer self-start"
        >
          <Save className="w-4 h-4" /> Guardar Todos os Planos
        </button>
      </div>

      {/* Free Trial & Policy Settings Card */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-200 flex items-center gap-2 uppercase text-xs">
            <Coins className="w-4 h-4 text-amber-400" /> Bónus de Inscrição & Política de Créditos aos Utilizadores
          </h4>
          <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
            Definido pelo Administrador
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-3 rounded-lg border border-indigo-500/40 shadow-inner">
            <label className="block text-indigo-300 font-bold text-[11px] mb-1">
              🎁 Bónus de Inscrição (Novos Utilizadores):
            </label>
            <input
              type="number"
              min="0"
              value={freeRegisterCredits}
              onChange={(e) => setFreeRegisterCredits(Math.max(0, Number(e.target.value)))}
              className="w-full bg-slate-900 border border-indigo-500/50 rounded-lg p-2 text-emerald-400 font-extrabold text-sm"
            />
            <span className="text-[10px] text-indigo-300/80 mt-1 block">
              Créditos atribuídos automaticamente ao criar conta de utilizador. Atualiza o marketing em tempo real.
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 opacity-80">
            <label className="block text-slate-400 text-[11px] mb-1">
              Consultas Gratuitas sem Registo (Visitante):
            </label>
            <input
              type="number"
              disabled
              value={0}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-slate-500 font-bold cursor-not-allowed"
            />
            <span className="text-[10px] text-rose-400/90 mt-1 block font-bold">
              Desativado: Não há consultas grátis sem registo na plataforma.
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <label className="block text-slate-400 text-[11px] mb-1">
              Aviso de Saldo Baixo (Limite):
            </label>
            <input
              type="number"
              min="1"
              value={lowBalanceAlertLimit}
              onChange={(e) => setLowBalanceAlertLimit(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-bold"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Exibe alerta quando o utilizador atingir este valor.</span>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className={`border rounded-xl p-5 space-y-4 transition ${
              plan.isActive
                ? 'bg-slate-900/80 border-slate-700 shadow-md'
                : 'bg-slate-950/60 border-slate-800 opacity-60'
            }`}
          >
            {/* Top row */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={plan.name}
                  onChange={(e) => handleUpdatePlan(index, 'name', e.target.value)}
                  className="bg-transparent font-bold text-slate-100 text-sm border-b border-slate-700 focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={plan.badge || ''}
                  onChange={(e) => handleUpdatePlan(index, 'badge', e.target.value)}
                  placeholder="Tag / Destaque"
                  className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded focus:outline-none w-28"
                />
              </div>

              <button
                type="button"
                onClick={() => handleUpdatePlan(index, 'isActive', !plan.isActive)}
                className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded transition cursor-pointer ${
                  plan.isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                }`}
              >
                {plan.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                <span>{plan.isActive ? 'Ativo' : 'Inativo'}</span>
              </button>
            </div>

            {/* Price and Validity */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Preço (Kwanzas):</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={plan.priceKz}
                    onChange={(e) => handleUpdatePlan(index, 'priceKz', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-bold focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  {plan.priceKz.toLocaleString('pt-PT')} Kz
                </span>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Consultas:</label>
                <input
                  type="number"
                  min="1"
                  value={plan.queriesCount}
                  onChange={(e) => handleUpdatePlan(index, 'queriesCount', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-bold focus:outline-none focus:border-emerald-500 text-sm"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {plan.queriesCount >= 99999 ? 'Ilimitadas' : `${plan.queriesCount} buscas`}
                </span>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Validade (Dias):</label>
                <input
                  type="number"
                  min="1"
                  value={plan.validityDays}
                  onChange={(e) => handleUpdatePlan(index, 'validityDays', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-bold focus:outline-none focus:border-emerald-500 text-sm"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {plan.validityDays >= 365 ? '1 Ano' : `${plan.validityDays} dias`}
                </span>
              </div>
            </div>

            {/* Unlocked Modules Checkboxes */}
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-2">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Módulos Desbloqueados pelo Plano:</span>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plan.unlocksImport}
                    onChange={(e) => handleUpdatePlan(index, 'unlocksImport', e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Importação</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plan.unlocksBatch}
                    onChange={(e) => handleUpdatePlan(index, 'unlocksBatch', e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Lotes Excel</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plan.unlocksApi}
                    onChange={(e) => handleUpdatePlan(index, 'unlocksApi', e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>API REST</span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-400 text-[10px] mb-1">Descrição Exibida aos Clientes:</label>
              <textarea
                rows={2}
                value={plan.description}
                onChange={(e) => handleUpdatePlan(index, 'description', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
