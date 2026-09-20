import React, { useState } from 'react';
import {
  Code,
  Key,
  Copy,
  Check,
  Zap,
  Layers,
  FileSpreadsheet,
  Globe,
  Lock,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Server,
  RefreshCw,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { UserSafe, ApiIntegrationConfig } from '../types';
import { INITIAL_API_CONFIGS } from '../data/mockDatabase';

interface ApiIntegrationsTabProps {
  user: UserSafe | null;
  onOpenPlans: () => void;
  onOpenAuth: () => void;
}

export const ApiIntegrationsTab: React.FC<ApiIntegrationsTabProps> = ({
  user,
  onOpenPlans,
  onOpenAuth
}) => {
  const [selectedSystem, setSelectedSystem] = useState<string>('PHC');
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'guide' | 'excel' | 'test'>('config');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [generatedKey, setGeneratedKey] = useState<string>(() =>
    user ? `nanu_live_${user.id.slice(0, 6)}_${Math.random().toString(36).substring(2, 10)}` : `nanu_live_${Math.random().toString(36).substring(2, 12)}`
  );

  // Pre-configured system profiles
  const SYSTEM_PROFILES: Record<string, {
    category: string;
    singlePriceField: boolean;
    recommendedFields: string[];
    description: string;
    samplePayload: Record<string, any>;
    excelSnippet: string;
  }> = {
    PHC: {
      category: 'ERP Gestão',
      singlePriceField: true,
      recommendedFields: ['custo_fornecedor', 'taxa_iva', 'margem_comercial', 'preco_venda_pvp1', 'retencao_fonte'],
      description: 'Ideal para PHC CS e PHC FX. Calcula o PVP final com IVA e TPA para gravação direta no campo "Preço 1" do artigo.',
      samplePayload: {
        item_code: 'ART-001',
        cost_base: 50000,
        margin_percent: 25,
        vat_rate: 14,
        country: 'AO',
        tpa_enabled: true
      },
      excelSnippet: '=WEBSERVICE("https://api.nanucloud.com/v1/price?cost=50000&margin=25&vat=14&key=" & A1)'
    },
    Primavera: {
      category: 'ERP Gestão',
      singlePriceField: true,
      recommendedFields: ['PrecoCusto', 'TaxaIVA', 'MargemPretendida', 'PVP1_Recomendado', 'TaxaRetencao'],
      description: 'Integração com Primavera BSS v9/v10 via Web API ou triggers de base de dados. Sincroniza a tabela ArtigoMoeda.',
      samplePayload: {
        Artigo: 'EQUIP-90',
        PrecoCusto: 120000,
        Margem: 30,
        IVA: 14,
        Pais: 'AO'
      },
      excelSnippet: '=NANUCLOUD_PVP(PrecoCusto, Margem, TaxaIVA)'
    },
    SAP: {
      category: 'ERP Gestão',
      singlePriceField: false,
      recommendedFields: ['KBETR_Cost', 'MWST_Tax', 'Profit_Margin', 'KONP_Price_Condition', 'WHT_Rate'],
      description: 'Integração com SAP S/4HANA e SAP Business One através de OData / REST API de Pricing Conditions.',
      samplePayload: {
        material_number: 'MAT_100234',
        cost_price: 250000,
        profit_margin: 20,
        tax_code: 'I14',
        withholding_tax: 6.5
      },
      excelSnippet: 'Power Query OData: https://api.nanucloud.com/odata/v4/CalculatePrice'
    },
    Sage: {
      category: 'ERP Gestão',
      singlePriceField: true,
      recommendedFields: ['PUP_Custo', 'Taxa_IVA', 'Margem_Real', 'PVP_Venda_Sugerido'],
      description: 'Compatível com Sage 50c, Sage 100cloud e Sage X3 para atualização dinâmica de tarifas.',
      samplePayload: {
        ref_artigo: 'SAGE-8821',
        custo_unitario: 15000,
        margem_percentagem: 35,
        taxa_iva: 14
      },
      excelSnippet: '=WEBSERVICE("https://api.nanucloud.com/v1/calc?cost=15000&margin=35&vat=14")'
    },
    Odoo: {
      category: 'ERP Gestão',
      singlePriceField: false,
      recommendedFields: ['standard_price', 'taxes_id', 'list_price', 'gross_profit', 'retention_withholding'],
      description: 'Módulo Python / JSON-RPC para Odoo v16/v17/v18. Atualiza `list_price` automaticamente no modelo `product.template`.',
      samplePayload: {
        product_id: 104,
        cost_price: 32000,
        margin_percent: 22,
        country_code: 'AO'
      },
      excelSnippet: 'API REST JSON-RPC endpoint: /api/v1/odoo/sync'
    },
    Moloni: {
      category: 'ERP Gestão',
      singlePriceField: true,
      recommendedFields: ['cost_price', 'taxes', 'price', 'profit_margin'],
      description: 'Integração direta com o software de faturação online Moloni para Portugal e Angola.',
      samplePayload: {
        product_id: 99128,
        cost_price: 45.0,
        margin: 30,
        vat_rate: 23,
        country: 'PT'
      },
      excelSnippet: '=WEBSERVICE("https://api.nanucloud.com/v1/price?cost=45&margin=30&vat=23")'
    },
    'XD Software': {
      category: 'ERP Gestão & POS',
      singlePriceField: true,
      recommendedFields: ['PrecoCusto', 'TaxaIVA', 'MargemLucro', 'PVP1', 'PVP2', 'FamiliaArtigo'],
      description: 'Conector para XD Gestão Comercial, XD POS e XD Rest. Atualiza tarifas de venda e regras fiscais diretamente na base de dados.',
      samplePayload: {
        artigo_id: 'XD-9921',
        custo_aquisicao: 45000,
        margem_percentagem: 30,
        taxa_iva: 14,
        pais: 'AO'
      },
      excelSnippet: '=WEBSERVICE("https://api.nanucloud.com/v1/xd/calc?cost=45000&margin=30&vat=14")'
    },
    WooCommerce: {
      category: 'E-commerce',
      singlePriceField: true,
      recommendedFields: ['_regular_price', '_tax_class', '_cost_of_goods', '_calculated_pvp'],
      description: 'Plugin para WordPress / WooCommerce. Permite cotação instantânea no carrinho e precificação automática na loja.',
      samplePayload: {
        sku: 'WOO-SHIRT-01',
        cost_of_goods: 8500,
        target_margin: 40,
        vat_rate: 14
      },
      excelSnippet: 'Webhook Endpoint: https://api.nanucloud.com/v1/woocommerce/webhook'
    },
    Shopify: {
      category: 'E-commerce',
      singlePriceField: true,
      recommendedFields: ['variant_price', 'cost_per_item', 'calculated_margin', 'vat_included_price'],
      description: 'Aplicativo privado Shopify GraphQL / REST para sincronização de custos e preços finais nos produtos.',
      samplePayload: {
        variant_id: 'gid://shopify/ProductVariant/849201',
        unit_cost: 25.0,
        profit_margin: 50,
        tax_rate: 23
      },
      excelSnippet: 'Shopify Admin API Proxy'
    },
    'Excel / Power Query': {
      category: 'Planilhas & BI',
      singlePriceField: false,
      recommendedFields: ['CustoBase', 'Pais', 'AliquotaIVA', 'MargemPerc', 'PVPFinal', 'LucroLiquidoReal', 'TaxaTPA'],
      description: 'Integração nativa com Excel (.xlsx) usando Power Query ou funções VBA WEBSERVICE sem instalar plugins.',
      samplePayload: {
        CustoBase: 10000,
        Margem: 20,
        IVA: 14,
        Pais: 'AO'
      },
      excelSnippet: '=WEBSERVICE("https://api.nanucloud.com/v1/excel-calc?cost=" & A2 & "&margin=" & B2 & "&vat=" & C2 & "&key=" & $D$1)'
    },
    'Custom REST': {
      category: 'Personalizado',
      singlePriceField: false,
      recommendedFields: ['cost', 'margin', 'vat_rate', 'country_code', 'service_retention_rate', 'transport_mode'],
      description: 'API REST universal em formato JSON com autenticação Bearer Token para qualquer software proprietário.',
      samplePayload: {
        cost: 75000,
        margin: 25,
        vat_rate: 14,
        country: 'AO',
        service_type: 'product'
      },
      excelSnippet: 'curl -X POST https://api.nanucloud.com/v1/calculate/product'
    }
  };

  const currentProfile = SYSTEM_PROFILES[selectedSystem] || SYSTEM_PROFILES['Custom REST'];

  const isApiUnlockedForUser = user && (user.isApiUnlocked || user.role === 'super_admin' || user.role === 'admin_level1');

  const handleCopyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText('https://api.nanucloud.com/v1/calculate/product');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const hasValidPlanAndBalance = Boolean(
    user && 
    (user.isApiUnlocked || user.role === 'super_admin' || user.role === 'admin_level1') &&
    (user.queriesRemaining > 0 || user.role === 'super_admin' || user.role === 'admin_level1')
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Development Status Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-amber-300">
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>
            <strong>Aviso de Engenharia:</strong> O Módulo de Integrações & APIs REST (PHC, Primavera, XD Software, SAP, etc.) encontra-se em <strong>desenvolvimento contínuo (Beta Ativo)</strong> com novos endpoints lançados regularmente.
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 font-bold self-start sm:self-auto shrink-0">
          EM DESENVOLVIMENTO
        </span>
      </div>

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#1E293B] via-indigo-950/40 to-[#1E293B] border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 font-mono">CENTRAL DE INTEGRAÇÃO & API REST</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono uppercase tracking-wider">
                  Multi-ERP Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Conecte o motor fiscal NANUCLOUD ao XD Software, PHC, Primavera, SAP, Sage, WooCommerce ou Excel.
              </p>
            </div>
          </div>

          {!hasValidPlanAndBalance && (
            <button
              onClick={user ? onOpenPlans : onOpenAuth}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs font-mono py-2.5 px-5 rounded-xl uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" /> {user ? 'Aderir a um Plano com Módulo API' : 'Iniciar Sessão para Ativar API'}
            </button>
          )}
        </div>
      </div>

      {/* Gated Access: If user is on Free plan or has no credits / not unlocked */}
      {!hasValidPlanAndBalance ? (
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-6 max-w-2xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-mono uppercase">
              Módulo de API & Conectores Bloqueado
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto font-sans">
              No modo gratuito ou sem saldo ativo de créditos, a documentação técnica, chaves de acesso e endpoints REST para ERPs (XD Software, Primavera, PHC) não estão disponíveis.
            </p>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-left space-y-2 text-xs font-mono text-slate-300">
            <p className="font-bold text-indigo-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Benefícios do Módulo API NANUCLOUD:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>Chave de API Bearer Token vinculada diretamente ao saldo da sua conta;</li>
              <li>Sincronização em tempo real de PVP com XD Software, PHC e Primavera;</li>
              <li>Consumo de créditos por chamada de cálculo fiscal automatizada;</li>
              <li>Bloqueio de segurança e renovação automática via planos Nanucloud.</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={user ? onOpenPlans : onOpenAuth}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs font-mono uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>{user ? 'Escolher Plano com Módulo API' : 'Criar Conta / Iniciar Sessão'}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'config', label: '1. Seletor de ERP & Campos Recomendados', icon: Layers },
          { id: 'guide', label: '2. Guia & Manual da API', icon: BookOpen },
          { id: 'excel', label: '3. Integração Passo a Passo no Excel', icon: FileSpreadsheet },
          { id: 'test', label: '4. Simulador de Requisição (Console)', icon: Terminal }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeSubTab === tab.id
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Configuração e Seletor de Sistemas */}
      {activeSubTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Lista de Sistemas Disponíveis */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" /> SELECIONE O SEU SISTEMA / ERP
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ao selecionar, os campos recomendados e a estrutura de resposta são ativados automaticamente:
            </p>

            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {Object.keys(SYSTEM_PROFILES).map((sysName) => {
                const isSelected = selectedSystem === sysName;
                return (
                  <button
                    key={sysName}
                    onClick={() => setSelectedSystem(sysName)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {sysName}
                        {SYSTEM_PROFILES[sysName].singlePriceField && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                            1 Campo PVP
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{SYSTEM_PROFILES[sysName].category}</span>
                    </div>
                    <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Chave de API & Campos Recomendados Ativados */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Chave de API da Conta do Utilizador */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-400" /> CHAVE DE API DA SUA CONTA
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {isApiUnlockedForUser ? 'Ativa & Registrada' : 'Acesso Livre'}
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3">
                <code className="text-xs font-mono text-emerald-400 truncate flex-1">
                  {generatedKey}
                </code>
                <button
                  onClick={handleCopyKey}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey ? 'Copiado!' : 'Copiar'}
                </button>
              </div>

              {!isApiUnlockedForUser && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-center justify-between">
                  <span>A API em produção requer adesão a um plano com módulo API (Diamante ou Personalizado).</span>
                  <button
                    onClick={onOpenPlans}
                    className="font-bold underline text-amber-200 hover:text-white"
                  >
                    Ver Planos
                  </button>
                </div>
              )}
            </div>

            {/* Painel do Sistema Selecionado & Campos Recomendados */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    {selectedSystem} — Campos Recomendados & Integração
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{currentProfile.description}</p>
                </div>
              </div>

              {/* Destaque para sistemas com apenas 1 campo de preço */}
              {currentProfile.singlePriceField && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3.5 text-xs text-indigo-200 flex items-start gap-3">
                  <Server className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-indigo-300 font-mono uppercase block mb-0.5">
                      SISTEMA COM APENAS 1 CAMPO DE PREÇO (PVP DIRETO):
                    </strong>
                    <p className="text-slate-300 leading-relaxed">
                      O {selectedSystem} foi configurado para receber o valor calculado no campo oficial de PVP final recomendado. A API calcula o Custo + Margem + IVA + TPA e retorna a resposta pronta para sobrescrever diretamente o campo de venda do seu artigo.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-2">
                  CAMPOS RECOMENDADOS ATIVADOS PARA O {selectedSystem.toUpperCase()}:
                </label>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.recommendedFields.map((field) => (
                    <span
                      key={field}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              {/* Endpoint URL */}
              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1.5">
                  ENDPOINT REST DA API (MÉTODO POST):
                </label>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3">
                  <code className="text-xs font-mono text-indigo-300 truncate flex-1">
                    https://api.nanucloud.com/v1/calculate/product
                  </code>
                  <button
                    onClick={handleCopyUrl}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUrl ? 'Copiado!' : 'Copiar URL'}
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 2: Guia e Manual Explicativo Completo */}
      {activeSubTab === 'guide' && (
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
          
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" /> GUIA OFICIAL DE INTEGRAÇÃO DA API NANUCLOUD
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Documentação técnica para programadores, consultores de ERP e analistas de sistemas
            </p>
          </div>

          {/* O que é uma API? */}
          <div className="space-y-2 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-indigo-300 font-mono uppercase">
              1. O QUE É UMA API E PARA QUE SERVE A NOSSA?
            </h3>
            <p>
              <strong>API (Application Programming Interface):</strong> É uma ponte de comunicação eletrónica direta entre sistemas. Em vez de abrir o simulador e digitar manualmente os custos e margens de cada artigo, o seu software de gestão (ERP, Loja Virtual ou Excel) envia os dados automaticamente para o servidor NANUCLOUD e recebe de volta a resposta instantânea com todos os desdobramentos fiscais (Custo Base, IVA Liquidado, Taxa TPA, Preço Final Recomendado e Lucro Líquido Real).
            </p>
          </div>

          {/* Como funciona o fluxo */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-indigo-300 font-mono uppercase">
              2. FLUXO DE REQUISIÇÃO & RESPOSTA
            </h3>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-300 marker:text-indigo-400">
              <li>O ERP do utilizador faz uma requisição HTTP POST para <code>https://api.nanucloud.com/v1/calculate/product</code>.</li>
              <li>Envia no cabeçalho <code>Authorization: Bearer &lt;SUA_CHAVE_API&gt;</code> e no corpo (JSON) o custo, margem e país.</li>
              <li>O motor NANUCLOUD valida a chave, aplica as regras fiscais vigentes do país selecionado e retorna o JSON estruturado em menos de 50ms.</li>
              <li>O ERP grava o preço final diretamente na ficha do artigo ou emite o orçamento automaticamente.</li>
            </ol>
          </div>

          {/* Exemplo de Código cURL & Resposta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-mono font-bold text-slate-200 mb-2">Exemplo de Requisição (cURL / POST):</h4>
              <pre className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-emerald-400 border border-slate-800 overflow-x-auto">
{`curl -X POST https://api.nanucloud.com/v1/calculate/product \\
  -H "Authorization: Bearer ${generatedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "cost_base": 50000,
    "margin_percent": 25,
    "vat_rate": 14,
    "country_code": "AO",
    "use_tpa": true
  }'`}
              </pre>
            </div>

            <div>
              <h4 className="font-mono font-bold text-slate-200 mb-2">Resposta JSON Retornada pelo Servidor:</h4>
              <pre className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-indigo-300 border border-slate-800 overflow-x-auto">
{`{
  "status": "success",
  "data": {
    "cost_base": 50000.00,
    "margin_applied": 25.0,
    "gross_sale_price": 66666.67,
    "vat_rate": 14.0,
    "vat_amount": 9333.33,
    "pvp_final_recommended": 76000.00,
    "tpa_fee_rate": 1.0,
    "tpa_fee_amount": 760.00,
    "net_profit_real": 15906.67,
    "currency": "Kz"
  }
}`}
              </pre>
            </div>
          </div>

          {/* Como ajustar sistemas com apenas 1 campo de preço */}
          <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-amber-300 font-mono uppercase">
              3. COMO AJUSTAR ERPS QUE TÊM APENAS 1 CAMPO DE PREÇO DE VENDA?
            </h3>
            <p className="text-slate-300">
              Muitos softwares de faturação simples possuem apenas um campo <code>PVP</code> na base de dados. O programador do ERP só precisa mapear a variável <code>data.pvp_final_recommended</code> para o campo de preço da base de dados do artigo. Não é necessário alterar a estrutura do banco de dados do ERP; o nosso motor entrega o valor exato pronto a faturar.
            </p>
          </div>

        </div>
      )}

      {/* TAB 3: Integração no Excel Passo a Passo */}
      {activeSubTab === 'excel' && (
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
          
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> COMO INTEGRAR A API DIRETAMENTE NO EXCEL (.XLSX)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Utilize fórmulas nativas do Excel para precificar milhares de linhas em segundos
              </p>
            </div>
          </div>

          {/* Método 1: Função WEBSERVICE */}
          <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 font-mono font-bold text-slate-100 text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">1</span>
              MÉTODO 1: USANDO A FÓRMULA NATIVA WEBSERVICE (EXCEL 2013+)
            </div>
            <p>
              No Excel, pode chamar a API diretamente na célula com a fórmula nativa <code>=WEBSERVICE()</code> sem qualquer macro ou plugin:
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-emerald-400 text-xs">
              =WEBSERVICE(&quot;https://api.nanucloud.com/v1/quick-pvp?cost=&quot; &amp; A2 &amp; &quot;&amp;margin=&quot; &amp; B2 &amp; &quot;&amp;vat=&quot; &amp; C2 &amp; &quot;&amp;key={generatedKey}&quot;)
            </div>
            <p className="text-slate-400 text-[11px]">
              Onde A2 = Preço de Custo, B2 = Margem desejada (ex: 25) e C2 = Alíquota de IVA (ex: 14). O Excel preenche o PVP automaticamente.
            </p>
          </div>

          {/* Método 2: Power Query */}
          <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 font-mono font-bold text-slate-100 text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">2</span>
              MÉTODO 2: POWER QUERY PARA GRANDES PLANILHAS EM LOTE
            </div>
            <ol className="list-decimal pl-5 space-y-2 text-slate-300 marker:text-emerald-400">
              <li>No Excel, clique no menu <strong>Dados</strong> &gt; <strong>Obter Dados</strong> &gt; <strong>Da Web</strong>.</li>
              <li>Introduza o URL da API NANUCLOUD: <code>https://api.nanucloud.com/v1/calculate/batch</code></li>
              <li>Nas opções avançadas, adicione o cabeçalho <code>Authorization</code> com o valor <code>Bearer {generatedKey}</code>.</li>
              <li>O Power Query cria uma tabela dinâmica sincronizada que recalcula todos os preços sempre que clicar em <strong>Atualizar Tudo</strong>.</li>
            </ol>
          </div>

        </div>
      )}

      {/* TAB 4: Console de Teste Interativo */}
      {activeSubTab === 'test' && (
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" /> CONSOLE DE TESTES DA API (SIMULAÇÃO AO VIVO)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Envie um pacote de teste para verificar a resposta em tempo real
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1">CUSTO BASE</label>
                <input
                  type="number"
                  defaultValue={50000}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono font-bold text-slate-300 block mb-1">MARGEM (%)</label>
                  <input
                    type="number"
                    defaultValue={25}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono font-bold text-slate-300 block mb-1">IVA (%)</label>
                  <input
                    type="number"
                    defaultValue={14}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="button"
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <RefreshCw className="w-4 h-4" /> Executar Teste de Chamada à API
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 space-y-2 overflow-x-auto">
              <div className="text-slate-500 text-[10px] uppercase border-b border-slate-800 pb-1">Status: 200 OK • Tempo de Resposta: 34ms</div>
              <pre>{JSON.stringify({
                status: "success",
                api_version: "v1.2",
                system_target: selectedSystem,
                calculation: {
                  cost_base: 50000.0,
                  gross_sale_price: 66666.67,
                  vat_rate: "14%",
                  vat_amount: 9333.33,
                  pvp_final_recommended: 76000.0,
                  tpa_fee_rate: "1%",
                  tpa_fee_amount: 760.0,
                  net_profit_real: 15906.67
                }
              }, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
};
