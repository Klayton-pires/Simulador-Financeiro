import { SystemTheme } from '../types';

export const SYSTEM_THEMES: SystemTheme[] = [
  {
    id: 'theme_enterprise_midnight',
    name: 'Enterprise Midnight (Padrão)',
    accent: '#6366F1', // Indigo 500
    bodyBg: '#0F172A', // Slate 900
    cardBg: '#1E293B', // Slate 800
    fontFamily: 'Inter, sans-serif',
    description: 'Tema escuro executivo de alto contraste, ideal para operações financeiras contínuas e foco visual.'
  },
  {
    id: 'theme_executive_clean',
    name: 'Executive Light Clean',
    accent: '#2563EB', // Blue 600
    bodyBg: '#F8FAFC', // Slate 50
    cardBg: '#FFFFFF', // White
    fontFamily: 'Inter, sans-serif',
    description: 'Tema claro moderno, nítido e corporativo, ideal para ambientes de escritório e relatórios diurnos.'
  },
  {
    id: 'theme_emerald_wealth',
    name: 'Emerald Wealth (Finanças)',
    accent: '#10B981', // Emerald 500
    bodyBg: '#064E3B', // Dark Emerald
    cardBg: '#065F46', // Emerald 800
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    description: 'Tema verde esmeralda inspirado em prosperidade financeira e balanços contábeis de sucesso.'
  },
  {
    id: 'theme_sapphire_royal',
    name: 'Sapphire Royal (Corporativo)',
    accent: '#3B82F6', // Blue 500
    bodyBg: '#0B132B', // Deep Navy
    cardBg: '#1C2541', // Royal Navy
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    description: 'Paleta nobre de azul safira e marinho profundo, transmitindo autoridade e segurança bancária.'
  },
  {
    id: 'theme_amber_sunset',
    name: 'Amber Sunset (Comércio Ativo)',
    accent: '#F59E0B', // Amber 500
    bodyBg: '#18181B', // Zinc 900
    cardBg: '#27272A', // Zinc 800
    fontFamily: 'Outfit, sans-serif',
    description: 'Tema quente de âmbar dourado com carvão grafite, dinâmico para operações de importação e vendas.'
  }
];

export const SYSTEM_FONTS = [
  { id: 'font_system', name: 'Padrão do Sistema (Inter / Sans-serif)', value: 'ui-sans-serif, system-ui, sans-serif' },
  { id: 'font_jakarta', name: 'Plus Jakarta Sans (Corporativa e Nítida)', value: "'Plus Jakarta Sans', sans-serif" },
  { id: 'font_outfit', name: 'Outfit (Moderna e Comercial)', value: "'Outfit', sans-serif" },
  { id: 'font_mono', name: 'JetBrains Mono / Courier (Técnica e Contábil)', value: "'JetBrains Mono', monospace" }
];

export interface HolidayCelebration {
  date: string; // MM-DD
  title: string;
  greeting: string;
  icon: string;
}

export const ANNUAL_HOLIDAYS: HolidayCelebration[] = [
  { date: '01-01', title: 'Ano Novo', greeting: 'Feliz Ano Novo! Que este ciclo seja de grande prosperidade e lucros multiplicados.', icon: '🎉' },
  { date: '02-04', title: 'Início da Luta Armada (Angola)', greeting: 'Honramos a história e a bravura da nação angolana neste dia memorável.', icon: '🇦🇴' },
  { date: '03-08', title: 'Dia Internacional da Mulher', greeting: 'Parabéns a todas as mulheres líderes, empreendedoras e visionárias que movem a economia!', icon: '💐' },
  { date: '04-04', title: 'Dia da Paz e Reconciliação Nacional (Angola)', greeting: 'Celebramos a Paz, o progresso e a estabilidade para o comércio e o país.', icon: '🕊️' },
  { date: '05-01', title: 'Dia Mundial do Trabalhador', greeting: 'A NANUCLOUD saúda todos os profissionais e empreendedores pelo esforço e dedicação diários.', icon: '💼' },
  { date: '09-17', title: 'Dia do Fundador da Nação e Herói Nacional (Angola)', greeting: 'Celebramos a memória e a visão de futuro dos pioneiros da nação.', icon: '🌟' },
  { date: '11-11', title: 'Dia da Independência Nacional (Angola)', greeting: 'Viva a Independência Nacional! Parabéns Angola pelo orgulho e crescimento!', icon: '🇦🇴' },
  { date: '12-25', title: 'Natal', greeting: 'Desejamos a si, à sua família e à sua equipa um Santo e Próspero Natal!', icon: '🎄' },
  { date: '12-31', title: 'Fim de Ano e Balanço Fiscal', greeting: 'Parabéns pelos resultados alcançados neste ano fiscal! Rumo a novos recordes!', icon: '🚀' }
];

export function checkSpecialGreetings(userName: string, userBirthDate?: string): { isSpecial: boolean; title: string; message: string; icon: string } | null {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayMMDD = `${month}-${day}`;

  // 1. Verificar Aniversário
  if (userBirthDate) {
    const birthMMDD = userBirthDate.slice(5); // assuming YYYY-MM-DD
    if (birthMMDD === todayMMDD) {
      return {
        isSpecial: true,
        title: `🎂 Feliz Aniversário, ${userName}!`,
        message: `A equipa NANUCLOUD deseja-lhe um dia repleto de felicidade, saúde e contínuo sucesso nos seus negócios e vida pessoal!`,
        icon: '🎁'
      };
    }
  }

  // 2. Verificar Feriados e Datas Comemorativas
  const holiday = ANNUAL_HOLIDAYS.find((h) => h.date === todayMMDD);
  if (holiday) {
    return {
      isSpecial: true,
      title: `${holiday.icon} ${holiday.title}`,
      message: `Olá, ${userName}! ${holiday.greeting}`,
      icon: holiday.icon
    };
  }

  return null;
}
