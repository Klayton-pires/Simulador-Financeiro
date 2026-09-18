import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Edit3,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  Check
} from 'lucide-react';
import { UserSafe } from '../types';
import {
  LegalTermsConfig,
  LegalTermSection,
  getLegalTerms,
  saveLegalTerms,
  resetLegalTermsToDefault
} from '../data/legalTerms';

interface LegalTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserSafe | null;
}

export const LegalTermsModal: React.FC<LegalTermsModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const isSuperAdmin =
    currentUser?.role === 'superadmin' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'admin_level1';

  const [terms, setTerms] = useState<LegalTermsConfig>(() => getLegalTerms());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableTerms, setEditableTerms] = useState<LegalTermsConfig>(() => getLegalTerms());
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const current = getLegalTerms();
      setTerms(current);
      setEditableTerms(JSON.parse(JSON.stringify(current)));
      setIsEditing(false);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      const updated = e.detail || getLegalTerms();
      setTerms(updated);
      setEditableTerms(JSON.parse(JSON.stringify(updated)));
    };
    window.addEventListener('nanucloud_legal_terms_updated', handleUpdate);
    return () => window.removeEventListener('nanucloud_legal_terms_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    saveLegalTerms({
      ...editableTerms,
      updatedBy: currentUser?.name || 'Super Administrador'
    });
    setTerms(editableTerms);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleResetDefault = () => {
    if (window.confirm('Tem a certeza de que deseja restaurar os Termos e Condições para o padrão de fábrica da NANUCLOUD?')) {
      const def = resetLegalTermsToDefault();
      setTerms(def);
      setEditableTerms(JSON.parse(JSON.stringify(def)));
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  const handleAddSection = () => {
    const newSec: LegalTermSection = {
      id: `sec_${Date.now()}`,
      title: `${editableTerms.sections.length + 1}. Nova Cláusula Legal`,
      content: 'Insira o texto descritivo desta cláusula legal aqui...',
      bulletPoints: ['Ponto de esclarecimento 1', 'Ponto de esclarecimento 2']
    };
    setEditableTerms({
      ...editableTerms,
      sections: [...editableTerms.sections, newSec]
    });
  };

  const handleRemoveSection = (index: number) => {
    const updated = editableTerms.sections.filter((_, i) => i !== index);
    setEditableTerms({
      ...editableTerms,
      sections: updated
    });
  };

  const handleSectionChange = (index: number, field: keyof LegalTermSection, val: any) => {
    const updated = [...editableTerms.sections];
    updated[index] = { ...updated[index], [field]: val };
    setEditableTerms({ ...editableTerms, sections: updated });
  };

  const handleBulletChange = (secIdx: number, bulletIdx: number, val: string) => {
    const updated = [...editableTerms.sections];
    const bullets = [...(updated[secIdx].bulletPoints || [])];
    bullets[bulletIdx] = val;
    updated[secIdx].bulletPoints = bullets;
    setEditableTerms({ ...editableTerms, sections: updated });
  };

  const handleAddBullet = (secIdx: number) => {
    const updated = [...editableTerms.sections];
    const bullets = [...(updated[secIdx].bulletPoints || [])];
    bullets.push('Novo item de especificação...');
    updated[secIdx].bulletPoints = bullets;
    setEditableTerms({ ...editableTerms, sections: updated });
  };

  const handleRemoveBullet = (secIdx: number, bulletIdx: number) => {
    const updated = [...editableTerms.sections];
    const bullets = (updated[secIdx].bulletPoints || []).filter((_, i) => i !== bulletIdx);
    updated[secIdx].bulletPoints = bullets;
    setEditableTerms({ ...editableTerms, sections: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-100 font-mono leading-tight">
                  {isEditing ? 'EDITAR TERMOS & POLÍTICAS LEGAIS' : terms.title}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  {terms.version || 'v3.4'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                {terms.subtitle} • Atualizado em {terms.lastUpdated}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Super Admin Edit Toggle */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (isEditing) {
                    setEditableTerms(JSON.parse(JSON.stringify(terms)));
                  }
                  setIsEditing(!isEditing);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isEditing
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                }`}
                title="Super Administrador pode editar estes termos"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancelar Edição' : 'Editar Termos (Super Admin)'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title="Fechar Janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccess && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-5 py-2.5 flex items-center gap-2 text-xs font-mono text-emerald-300 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Os Termos de Uso e Políticas foram atualizados com sucesso e já estão em vigor em toda a plataforma!</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs leading-relaxed max-h-[calc(92vh-130px)]">
          
          {/* ===================== VIEW MODE ===================== */}
          {!isEditing && (
            <>
              {/* Important Notice */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3 text-amber-300">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-200 uppercase tracking-wider mb-1 font-mono">
                    {terms.disclaimerTitle}
                  </p>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {terms.disclaimerContent}
                  </p>
                </div>
              </div>

              {/* Dynamic Sections */}
              {terms.sections.map((sec, index) => (
                <div key={sec.id || index} className="space-y-3">
                  <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-indigo-400" /> {sec.title}
                  </h3>
                  
                  {sec.content && (
                    <p className="text-slate-300 leading-relaxed font-sans">
                      {sec.content}
                    </p>
                  )}

                  {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                    <ul className="space-y-2 text-slate-300 pl-4 list-disc marker:text-indigo-500 font-sans">
                      {sec.bulletPoints.map((bp, bpIdx) => (
                        <li key={bpIdx} className="leading-relaxed">
                          {bp}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {/* Custom Extra Clause if configured */}
              {terms.customClause && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-slate-300 font-sans">
                  <span className="font-bold text-indigo-300 font-mono uppercase tracking-wider block mb-1">
                    Nota Complementar & SLA
                  </span>
                  <p className="leading-relaxed">{terms.customClause}</p>
                </div>
              )}

              {/* Contact Information */}
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-300">
                <div>
                  <span className="font-bold text-indigo-200 font-mono block">Canal de Apoio e Jurídico</span>
                  <span className="text-[11px] text-slate-400">{terms.contactSupportText}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 shrink-0">
                  Suporte Oficial NANUCLOUD
                </span>
              </div>
            </>
          )}

          {/* ===================== EDIT MODE (SUPER ADMIN) ===================== */}
          {isEditing && (
            <div className="space-y-6 animate-in fade-in duration-150 font-mono">
              
              {/* Notice for Admin */}
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 text-indigo-300 text-xs">
                <span className="font-bold block mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Modo de Personalização de Termos (Super Administrador)
                </span>
                <p className="text-slate-300 text-[11px] font-sans">
                  Pode alterar todos os textos, avisos de isenção de responsabilidade, cláusulas de reembolso e adicionar novas regras jurídicas. As alterações ficam visíveis imediatamente para todos os clientes e utilizadores.
                </p>
              </div>

              {/* Global Settings */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Cabeçalho & Versão dos Termos
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-1">TÍTULO PRINCIPAL</label>
                    <input
                      type="text"
                      value={editableTerms.title}
                      onChange={(e) => setEditableTerms({ ...editableTerms, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">VERSÃO DO DOCUMENTO</label>
                    <input
                      type="text"
                      value={editableTerms.version}
                      onChange={(e) => setEditableTerms({ ...editableTerms, version: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">SUBTÍTULO / SLOGAN INSTITUCIONAL</label>
                  <input
                    type="text"
                    value={editableTerms.subtitle}
                    onChange={(e) => setEditableTerms({ ...editableTerms, subtitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Disclaimer Editor */}
              <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Caixa de Aviso Essencial / Isenção Prévia
                </h4>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">TÍTULO DO AVISO</label>
                  <input
                    type="text"
                    value={editableTerms.disclaimerTitle}
                    onChange={(e) => setEditableTerms({ ...editableTerms, disclaimerTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">TEXTO DO AVISO DE SIMULADOR</label>
                  <textarea
                    rows={3}
                    value={editableTerms.disclaimerContent}
                    onChange={(e) => setEditableTerms({ ...editableTerms, disclaimerContent: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>
              </div>

              {/* Dynamic Sections Editor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" /> Cláusulas e Secções dos Termos ({editableTerms.sections.length})
                  </h4>

                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Secção
                  </button>
                </div>

                {editableTerms.sections.map((sec, secIdx) => (
                  <div key={sec.id || secIdx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500 block">TÍTULO DA CLÁUSULA #{secIdx + 1}</label>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => handleSectionChange(secIdx, 'title', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSection(secIdx)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                        title="Remover Secção"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-500 block mb-1">CONTEÚDO / PARÁGRAFO EXPLICATIVO</label>
                      <textarea
                        rows={2}
                        value={sec.content}
                        onChange={(e) => handleSectionChange(secIdx, 'content', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-sans"
                      />
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider">Pontos / Alíneas:</span>
                        <button
                          type="button"
                          onClick={() => handleAddBullet(secIdx)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                        >
                          <Plus className="w-3 h-3" /> Adicionar Ponto
                        </button>
                      </div>

                      {(sec.bulletPoints || []).map((bp, bpIdx) => (
                        <div key={bpIdx} className="flex items-center gap-2">
                          <span className="text-indigo-400 text-xs">•</span>
                          <input
                            type="text"
                            value={bp}
                            onChange={(e) => handleBulletChange(secIdx, bpIdx, e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBullet(secIdx, bpIdx)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Remover Ponto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>

              {/* Extra Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">CLÁUSULA COMPLEMENTAR / SLA</label>
                  <textarea
                    rows={2}
                    value={editableTerms.customClause || ''}
                    onChange={(e) => setEditableTerms({ ...editableTerms, customClause: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                    placeholder="Informações adicionais sobre contratos..."
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">CONTACTO DE APOIO & SUPORTE</label>
                  <input
                    type="text"
                    value={editableTerms.contactSupportText}
                    onChange={(e) => setEditableTerms({ ...editableTerms, contactSupportText: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80">
          <div className="text-[11px] text-slate-400 font-mono">
            {isEditing ? (
              <span className="text-amber-300">Modo de Edição Ativo • As alterações entrarão em vigor ao guardar</span>
            ) : (
              <span>NANUCLOUD Compliance & Legal Framework</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                  title="Restaurar padrão"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrão</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Alterações</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
              >
                Compreendi e Concordo
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
