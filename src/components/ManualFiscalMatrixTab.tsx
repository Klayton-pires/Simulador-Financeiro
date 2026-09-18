import React, { useState } from 'react';
import {
  Table,
  Save,
  Lock,
  Check,
  RotateCcw,
  ShieldAlert,
  Edit2,
  Info,
  Sparkles
} from 'lucide-react';
import { UserSafe } from '../types';
import { COUNTRIES_DB, CountryFiscalConfig, getActiveCountriesDb, saveCustomFiscalMatrix } from '../data/countries';
import { hasUserPermission } from '../data/permissions';

interface ManualFiscalMatrixTabProps {
  currentUser: UserSafe;
}

export const ManualFiscalMatrixTab: React.FC<ManualFiscalMatrixTabProps> = ({ currentUser }) => {
  const canEditMatrix =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'superadmin' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'admin_level1' ||
    hasUserPermission(currentUser, 'can_edit_fiscal_rates');

  const [matrixData, setMatrixData] = useState<Record<string, CountryFiscalConfig>>(() => {
    return getActiveCountriesDb();
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleCellChange = (countryCode: string, field: keyof CountryFiscalConfig, value: any) => {
    if (!canEditMatrix) return;

    setMatrixData((prev) => ({
      ...prev,
      [countryCode]: {
        ...prev[countryCode],
        [field]: value
      }
    }));
  };

  const handleSaveMatrix = () => {
    if (!canEditMatrix) return;
    saveCustomFiscalMatrix(matrixData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (!canEditMatrix) return;
    if (window.confirm('Tem a certeza que deseja restaurar as taxas oficiais padrão do sistema?')) {
      setMatrixData(COUNTRIES_DB);
      localStorage.removeItem('nanucloud_custom_fiscal_matrix');
      window.dispatchEvent(new Event('nanucloud_custom_fiscal_matrix_updated'));
      window.dispatchEvent(new Event('nanucloud_countries_updated'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Table className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 font-mono">MATRIZ FISCAL GLOBAL & TAXAS</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                canEditMatrix ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {canEditMatrix ? 'Edição Autorizada' : 'Modo Somente Leitura'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tabela matricial com os países e alíquotas fiscais (IVA, Retenção, Taxa Estatística, TPA, II e Portais)
            </p>
          </div>
        </div>

        {canEditMatrix ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-3.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
            </button>
            <button
              onClick={handleSaveMatrix}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              {savedSuccess ? 'Guardado!' : 'Guardar Matriz'}
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono text-slate-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" /> Sem permissão de edição
          </div>
        )}
      </div>

      {!canEditMatrix && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs font-mono text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          A sua conta possui permissão apenas de visualização da matriz fiscal. Para alterar taxas, consulte o Super Administrador.
        </div>
      )}

      {/* Matriz Table */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4 min-w-[180px]">País / Autoridade</th>
                <th className="p-4 min-w-[110px]">Moeda</th>
                <th className="p-4 min-w-[130px]">IVA Padrão (%)</th>
                <th className="p-4 min-w-[130px]">Retenção Serviços (%)</th>
                <th className="p-4 min-w-[130px]">Taxa Estatística (%)</th>
                <th className="p-4 min-w-[130px]">Taxa TPA POS (%)</th>
                <th className="p-4 min-w-[180px]">Portal Oficial 100%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {Object.keys(matrixData).map((code) => {
                const item = matrixData[code];
                return (
                  <tr key={code} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        {item.name} <span className="text-[10px] text-indigo-400">({code})</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{item.agency}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold">
                        {item.curr}
                      </span>
                    </td>
                    <td className="p-4">
                      {canEditMatrix ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            defaultValue={item.vatOptions[0]?.r || 14}
                            onChange={(e) => {
                              const newOpts = [...item.vatOptions];
                              if (newOpts[0]) newOpts[0].r = Number(e.target.value);
                              handleCellChange(code, 'vatOptions', newOpts);
                            }}
                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold text-right"
                          />
                          <span className="text-slate-500">%</span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-200">{item.vatOptions[0]?.r || 14}%</span>
                      )}
                    </td>
                    <td className="p-4">
                      {canEditMatrix ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={item.retentionServiceRate || 0}
                            onChange={(e) => handleCellChange(code, 'retentionServiceRate', Number(e.target.value))}
                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold text-right"
                          />
                          <span className="text-slate-500">%</span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-200">{item.retentionServiceRate || 0}%</span>
                      )}
                    </td>
                    <td className="p-4">
                      {canEditMatrix ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={item.statisticalTax || 0}
                            onChange={(e) => handleCellChange(code, 'statisticalTax', Number(e.target.value))}
                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold text-right"
                          />
                          <span className="text-slate-500">%</span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-200">{item.statisticalTax || 0}%</span>
                      )}
                    </td>
                    <td className="p-4">
                      {canEditMatrix ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={item.tpa || 0}
                            onChange={(e) => handleCellChange(code, 'tpa', Number(e.target.value))}
                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold text-right"
                          />
                          <span className="text-slate-500">%</span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-200">{item.tpa || 0}%</span>
                      )}
                    </td>
                    <td className="p-4">
                      <a
                        href={item.officialPortalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline text-[11px] truncate max-w-[200px] block"
                      >
                        {item.officialPortalUrl}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
