import { SupportedLang } from './translations';

/**
 * Universal phrase translations for instant zero-latency DOM & component translation
 * across all 10 supported languages.
 */
export const PHRASE_DICTIONARY: Record<string, Partial<Record<SupportedLang, string>>> = {
  // Disclaimer
  'Aviso: O Simulador Financeiro Nanucloud tem finalidade informativa e não dispensa a consulta de um profissional de contas.': {
    en: 'Notice: The Nanucloud Financial Simulator is for informational purposes only and does not replace consulting an accounting professional.',
    es: 'Aviso: El Simulador Financiero Nanucloud tiene fines informativos y no sustituye la consulta de un profesional contable.',
    fr: 'Avis : Le simulateur financier Nanucloud est fourni à titre informatif et ne dispense pas de consulter un professionnel comptable.',
    zh: '注意：Nanucloud 财务模拟器仅供参考，不能代替咨询专业会计人员。',
    ar: 'ملاحظة: محاكي نانو كلاود المالي لأغراض إعلامية فقط ولا يغني عن استشارة محاسب قانوني.',
    ja: 'ご注意：Nanucloud財務シミュレーターは情報提供を目的としており、専門会計士への相談に代わるものではありません。',
    it: 'Avviso: Il Simulatore Finanziario Nanucloud è a scopo informativo e non sostituisce la consulenza di un professionista contabile.',
    ko: '알림: Nanucloud 재무 시뮬레이터는 정보 제공 목적이며 공인 회계사 상담을 대신할 수 없습니다.',
    hi: 'सूचना: नानुक्लाउड वित्तीय सिम्युलेटर केवल सूचनात्मक उद्देश्यों के लिए है और लेखा पेशेवर से परामर्श की जगह नहीं लेता है।'
  },
  'A utilização deste aplicativo não dispensa a consulta de um profissional de contas': {
    en: 'The use of this application does not replace consulting an accounting professional',
    es: 'El uso de esta aplicación no sustituye la consulta de un profesional contable',
    fr: "L'utilisation de cette application ne dispense pas de consulter un professionnel comptable",
    zh: '使用本应用程序不能代替咨询专业会计人员',
    ar: 'استخدام هذا التطبيق لا يغني عن استشارة محاسب قانوني',
    ja: '本アプリケーションのご利用は、専門会計士へのご相談に代わるものではありません',
    it: "L'uso di questa applicazione non sostituisce la consulenza di un professionista contabile",
    ko: '본 앱의 사용은 전문 회계사 상담을 대신할 수 없습니다',
    hi: 'इस एप्लिकेशन का उपयोग लेखा पेशेवर के परामर्श का स्थान नहीं लेता है'
  },
  'Aviso Legal Nanucloud: A utilização deste simulador não dispensa a consulta de um profissional de contas ou contabilista certificado.': {
    en: 'Nanucloud Legal Notice: The use of this simulator does not replace consulting a certified accountant.',
    es: 'Aviso Legal Nanucloud: El uso de este simulador no sustituye la consulta de un profesional contable certificado.',
    fr: 'Avis Légal Nanucloud : L’utilisation de ce simulateur ne remplace pas la consultation d’un expert-comptable certifié.',
    zh: 'Nanucloud 法律声明：使用本模拟器不能代替咨询注册会计师。',
    ar: 'إشعار قانوني نانو كلاود: استخدام هذا المحاكي لا يغني عن استشارة محاسب قانوني معتمد.',
    ja: 'Nanucloud免責事項：本シミュレーターのご利用は公認会計士への相談に代わるものではありません。',
    it: 'Avviso Legale Nanucloud: L’uso di questo simulatore non sostituisce la consulenza di un commercialista abilitato.',
    ko: 'Nanucloud 법적 고지: 본 시뮬레이터 사용은 공인회계사 상담을 대신하지 않습니다.',
    hi: 'नानुक्लाउड कानूनी सूचना: इस सिम्युलेटर का उपयोग किसी प्रमाणित लेखाकार के परामर्श का स्थान नहीं लेता है।'
  },

  // Navigation & Modules
  'Vendas & Comércio (PVP)': {
    en: 'Sales & Local Trade (RRP)',
    es: 'Ventas y Comercio Local (PVP)',
    fr: 'Ventes et Commerce Local (PVC)',
    zh: '销售与本地贸易（建议零售价）',
    ar: 'المبيعات والتجارة المحلية',
    ja: '販売・国内取引（定価）',
    it: 'Vendite e Commercio Locale',
    ko: '판매 및 국내 무역 (권장소비자가격)',
    hi: 'बिक्री और स्थानीय व्यापार (PVP)'
  },
  'Prestação de Serviços & Consultoria': {
    en: 'Services & Consulting Fees',
    es: 'Prestación de Servicios y Consultoría',
    fr: 'Prestation de Services & Conseil',
    zh: '专业服务与咨询',
    ar: 'الخدمات والاستشارات',
    ja: 'サービス・コンサルティング業務',
    it: 'Prestazione Servizi e Consulenza',
    ko: '전문 용역 및 컨설팅',
    hi: 'सेवाएं और परामर्श'
  },
  'Intermediários & Corretagem': {
    en: 'Intermediaries & Brokerage',
    es: 'Intermediarios y Corretaje',
    fr: 'Intermédiaires et Courtage',
    zh: '中介代理与经纪',
    ar: 'الوساطة والسمسرة التجارية',
    ja: '仲介・ブローカー取引',
    it: 'Intermediari e Mediazione',
    ko: '중개 및 브로커 무역',
    hi: 'मध्यस्थता और दलाली'
  },
  'Modo Celular Básico / POS': {
    en: 'Basic Mobile Mode / POS',
    es: 'Modo Móvil Básico / POS',
    fr: 'Mode Mobile Basique / POS',
    zh: '基础移动端模式 / POS',
    ar: 'وضع الجوال البسيط / نقطة بيع',
    ja: 'ベーシックモバイルモード / POS',
    it: 'Modalità Cellulare Base / POS',
    ko: '기본 모바일 모드 / POS',
    hi: 'बेसिक मोबाइल मोड / POS'
  },
  'Importação Aduaneira': {
    en: 'Customs Import & Duties',
    es: 'Importación Aduanera',
    fr: 'Importation Douanière',
    zh: '海关进口与清关',
    ar: 'الاستيراد والتخليص الجمركي',
    ja: '通関・輸入業務',
    it: 'Importazione Doganale',
    ko: '세관 수입 및 통관',
    hi: 'सीमा शुल्क आयात'
  },
  'Lotes Excel (.xlsx)': {
    en: 'Excel Batch Processing (.xlsx)',
    es: 'Lotes Excel (.xlsx)',
    fr: 'Lots Excel (.xlsx)',
    zh: 'Excel 批量处理 (.xlsx)',
    ar: 'معالجة دفعات إكسل (.xlsx)',
    ja: 'Excel一括処理 (.xlsx)',
    it: 'Elaborazione Batch Excel (.xlsx)',
    ko: 'Excel 일괄 처리 (.xlsx)',
    hi: 'एक्सेल बैच (.xlsx)'
  },
  'API REST ERP & Lojas': {
    en: 'REST API & ERP Integration',
    es: 'API REST ERP y Tiendas',
    fr: 'API REST ERP & E-commerce',
    zh: 'REST API 与 ERP 对接',
    ar: 'واجهة برمجية وتكامل ERP',
    ja: 'REST API・ERP連携',
    it: 'API REST ERP e Negozi',
    ko: 'REST API 및 ERP 연동',
    hi: 'REST API और ERP'
  },
  'Matriz Fiscal de Taxas': {
    en: 'Tax Rate Matrix',
    es: 'Matriz Fiscal de Tasas',
    fr: 'Matrice Fiscale des Taux',
    zh: '税率矩阵表',
    ar: 'مصفوفة الضرائب والرسوم',
    ja: '税率マトリックス',
    it: 'Matrice Fiscale delle Aliquote',
    ko: '세율 매트릭스',
    hi: 'कर दर मैट्रिक्स'
  },
  'IA Fiscal & Notícias Oficiais': {
    en: 'Fiscal AI & Official Updates',
    es: 'IA Fiscal y Noticias Oficiales',
    fr: 'IA Fiscale & Actualités',
    zh: '财税人工智能与政策动态',
    ar: 'الذكاء الاصطناعي الضريبي والأخبار',
    ja: '税務AI・公式情報',
    it: 'IA Fiscale e Notizie Ufficiali',
    ko: '세무 AI 및 공식 뉴스',
    hi: 'वित्तीय AI एवं समाचार'
  },
  'Docs & Deploy': {
    en: 'Docs & Deployment',
    es: 'Documentación y Despliegue',
    fr: 'Documentation & Déploiement',
    zh: '文档与部署',
    ar: 'التوثيق والنشر',
    ja: 'ドキュメント・展開',
    it: 'Documentazione e Deploy',
    ko: '문서 및 배포',
    hi: 'दस्तावेज़ और परिनियोजन'
  },

  // Core Actions & Buttons
  'Recalcular / Atualizar Simulação': {
    en: 'Recalculate / Update Simulation',
    es: 'Recalcular / Actualizar Simulación',
    fr: 'Recalculer / Mettre à jour la simulation',
    zh: '重新计算 / 更新模拟',
    ar: 'إعادة الحساب / تحديث المحاكاة',
    ja: '再計算 / シミュレーション更新',
    it: 'Ricalcola / Aggiorna Simulazione',
    ko: '다시 계산 / 시뮬레이션 업데이트',
    hi: 'पुनर्गणना / सिमुलेशन अपडेट करें'
  },
  'Recalcular / Atualizar Simulação Manual': {
    en: 'Recalculate / Update Manual Simulation',
    es: 'Recalcular / Actualizar Simulación Manual',
    fr: 'Recalculer / Mettre à jour manuellement',
    zh: '重新计算 / 更新手动模拟',
    ar: 'إعادة الحساب اليدوي / التحديث',
    ja: '手動シミュレーション再計算 / 更新',
    it: 'Ricalcola / Aggiorna Simulazione Manuale',
    ko: '수동 시뮬레이션 재계산 / 업데이트',
    hi: 'मैन्युअल सिमुलेशन पुनर्गणना'
  },
  'Dossiê PDF': {
    en: 'PDF Dossier',
    es: 'Dossier PDF',
    fr: 'Dossier PDF',
    zh: 'PDF 报表',
    ar: 'تقرير PDF',
    ja: 'PDFレポート',
    it: 'Dossier PDF',
    ko: 'PDF 보고서',
    hi: 'PDF रिपोर्ट'
  },
  'Exportar Excel': {
    en: 'Export Excel',
    es: 'Exportar Excel',
    fr: 'Exporter Excel',
    zh: '导出 Excel',
    ar: 'تصدير إكسل',
    ja: 'Excel出力',
    it: 'Esporta Excel',
    ko: 'Excel 내보내기',
    hi: 'एक्सेल निर्यात'
  },
  'EM DIRETO': {
    en: 'LIVE',
    es: 'EN VIVO',
    fr: 'EN DIRECT',
    zh: '实时',
    ar: 'مباشر',
    ja: 'ライブ',
    it: 'IN DIRETTA',
    ko: '실시간',
    hi: 'लाइव'
  },
  'Modo Amigável': {
    en: 'Friendly Mode',
    es: 'Modo Fácil',
    fr: 'Mode Convivial',
    zh: '友好简易模式',
    ar: 'الوضع البسيط',
    ja: 'かんたんモード',
    it: 'Modalità Semplice',
    ko: '친화적 모드',
    hi: 'सरल मोड'
  },
  'Modo Avançado': {
    en: 'Advanced Mode',
    es: 'Modo Avanzado',
    fr: 'Mode Avancé',
    zh: '高级专业模式',
    ar: 'الوضع المتقدم',
    ja: 'アドバンスモード',
    it: 'Modalità Avanzata',
    ko: '고급 모드',
    hi: 'उन्नत मोड'
  },
  'Voltar aos planos': {
    en: 'Back to plans',
    es: 'Volver a los planes',
    fr: 'Retour aux forfaits',
    zh: '返回套餐',
    ar: 'العودة إلى الخطط',
    ja: 'プラン一覧に戻る',
    it: 'Torna ai piani',
    ko: '플랜 목록으로 돌아가기',
    hi: 'योजनाओं पर वापस जाएं'
  },
  'A PROCESSAR...': {
    en: 'PROCESSING...',
    es: 'PROCESANDO...',
    fr: 'TRAITEMENT EN COURS...',
    zh: '处理中...',
    ar: 'جاري المعالجة...',
    ja: '処理中...',
    it: 'ELABORAZIONE...',
    ko: '처리 중...',
    hi: 'प्रक्रिया जारी है...'
  },

  // Common Financial Terms & Labels
  'Preço de Custo (SEM IVA)': {
    en: 'Cost Price (Excl. VAT)',
    es: 'Precio de Coste (Sin IVA)',
    fr: "Prix de revient (Hors TVA)",
    zh: '成本价（不含税）',
    ar: 'سعر التكلفة (بدون ضريبة)',
    ja: '仕入原価（税抜）',
    it: 'Prezzo di Costo (senza IVA)',
    ko: '원가 (VAT 별도)',
    hi: 'लागत मूल्य (कर बिना)'
  },
  'Preço de Custo (COM IVA)': {
    en: 'Cost Price (Incl. VAT)',
    es: 'Precio de Coste (Con IVA)',
    fr: 'Prix de revient (TTC)',
    zh: '成本价（含税）',
    ar: 'سعر التكلفة (شامل الضريبة)',
    ja: '仕入原価（税込）',
    it: 'Prezzo di Costo (con IVA)',
    ko: '원가 (VAT 포함)',
    hi: 'लागत मूल्य (कर सहित)'
  },
  'Margem de Lucro Desejada (%)': {
    en: 'Target Profit Margin (%)',
    es: 'Margen de Beneficio Deseado (%)',
    fr: 'Marge Bénéficiaire Ciblée (%)',
    zh: '目标利润率 (%)',
    ar: 'هامش الربح المستهدف (%)',
    ja: '目標利益率 (%)',
    it: 'Margine di Profitto Desiderato (%)',
    ko: '목표 이익률 (%)',
    hi: 'वांछित लाभ मार्जिन (%)'
  },
  'Preço de Venda Líquido (s/ IVA)': {
    en: 'Net Selling Price (Excl. VAT)',
    es: 'Precio de Venta Neto (s/ IVA)',
    fr: 'Prix de Vente Net (HT)',
    zh: '净销售价（不含税）',
    ar: 'سعر البيع الصافي (بدون ضريبة)',
    ja: '税抜販売価格',
    it: 'Prezzo di Vendita Netto (senza IVA)',
    ko: '순판매가 (VAT 제외)',
    hi: 'शुद्ध विक्रय मूल्य'
  },
  'PVP Final Recomendado (c/ IVA)': {
    en: 'Recommended Final Retail Price (Incl. VAT)',
    es: 'PVP Final Recomendado (c/ IVA)',
    fr: 'Prix de Vente Recommandé (TTC)',
    zh: '推荐零售最终含税价',
    ar: 'سعر البيع النهائي الموصى به (شامل الضريبة)',
    ja: '最終推奨小売価格（税込）',
    it: 'PVP Finale Consigliato (con IVA)',
    ko: '최종 권장소비자가 (VAT 포함)',
    hi: 'अंतिम खुदरा मूल्य (कर सहित)'
  },
  'Lucro Bruto por Unidade': {
    en: 'Gross Profit per Unit',
    es: 'Beneficio Bruto por Unidad',
    fr: 'Bénéfice Brut par Unité',
    zh: '单件毛利润',
    ar: 'الربح الإجمالي للوحدة',
    ja: '単価あたり粗利益',
    it: 'Utile Lordo per Unità',
    ko: '개당 매출총이익',
    hi: 'प्रति इकाई सकल लाभ'
  },
  'Margem Real de Lucro Líquido': {
    en: 'Actual Net Profit Margin',
    es: 'Margen Real de Beneficio Neto',
    fr: 'Marge Réelle de Bénéfice Net',
    zh: '实际净利润率',
    ar: 'هامش الربح الصافي الفعلي',
    ja: '実質純利益率',
    it: 'Margine Reale di Utile Netto',
    ko: '실제 순이익률',
    hi: 'वास्तविक शुद्ध लाभ मार्जिन'
  },
  'IVA a Entregar ao Estado': {
    en: 'VAT to Pay to Tax Authorities',
    es: 'IVA a Liquidar al Estado',
    fr: "TVA nette à reverser à l'État",
    zh: '应缴纳增值税',
    ar: 'ضريبة القيمة المضافة المستحقة للدولة',
    ja: '国庫納付消費税額',
    it: 'IVA da Versare allo Stato',
    ko: '국가 납부 부가가치세',
    hi: 'देय कर राशि'
  },
  'Ponto de Equilíbrio (Break-Even)': {
    en: 'Break-Even Point',
    es: 'Punto de Equilibrio (Break-Even)',
    fr: "Point Mort (Seuil de Rentabilité)",
    zh: '盈亏平衡点 (Break-Even)',
    ar: 'نقطة التعادل',
    ja: '損益分岐点',
    it: 'Punto di Pareggio (Break-Even)',
    ko: '손익분기점',
    hi: 'ब्रेक-इवन बिंदु'
  },
  'Taxa de IVA / Imposto': {
    en: 'VAT / Tax Rate',
    es: 'Tipo de IVA / Impuesto',
    fr: "Taux de TVA / Impôt",
    zh: '增值税/税率',
    ar: 'معدل ضريبة القيمة المضافة',
    ja: '消費税率',
    it: 'Aliquota IVA / Imposta',
    ko: '부가가치세율',
    hi: 'वैट / कर दर'
  },
  'Taxa TPA / Multicaixa (Opcional)': {
    en: 'POS / Card Processing Fee (Optional)',
    es: 'Comisión TPA / Tarjeta (Opcional)',
    fr: 'Frais TPE / Carte Bancaire (Optionnel)',
    zh: 'POS刷卡费率（可选）',
    ar: 'رسوم الدفع بالبطاقة/POS (اختياري)',
    ja: 'POS・決済手数料（任意）',
    it: 'Commissione POS / Carta (Opzionale)',
    ko: 'POS/카드 수수료 (선택)',
    hi: 'कार्ड / पीओएस शुल्क (वैकल्पिक)'
  },
  'Comissão de Intermediação': {
    en: 'Intermediation Commission',
    es: 'Comisión de Intermediación',
    fr: "Commission d'intermédiation",
    zh: '中介佣金',
    ar: 'عمولة الوساطة',
    ja: '仲介手数料',
    it: 'Commissione di Intermediazione',
    ko: '중개 수수료',
    hi: 'मध्यस्थता कमीशन'
  },
  'Retenção na Fonte': {
    en: 'Withholding Tax (WHT)',
    es: 'Retención en la Fuente',
    fr: 'Retenue à la source',
    zh: '代扣代缴税',
    ar: 'الضريبة المستقطعة من المنبع',
    ja: '源泉徴収税',
    it: 'Ritenuta d’Acconto',
    ko: '원천징수세',
    hi: 'स्रोत पर कर कटौती (TDS)'
  },

  // Payment Methods
  'Multicaixa Express (MCX)': {
    en: 'Multicaixa Express (MCX)',
    es: 'Multicaixa Express (MCX)',
    fr: 'Multicaixa Express (MCX)',
    zh: 'Multicaixa Express (MCX)',
    ar: 'ملتيكاشا إكسبريس (MCX)',
    ja: 'Multicaixa Express (MCX)',
    it: 'Multicaixa Express (MCX)',
    ko: '멀티카이샤 익스프레스 (MCX)',
    hi: 'मल्टीकाइक्सा एक्सप्रेस (MCX)'
  },
  'Transferência Bancária (IBAN)': {
    en: 'Bank Transfer (IBAN)',
    es: 'Transferencia Bancaria (IBAN)',
    fr: 'Virement Bancaire (IBAN)',
    zh: '银行电汇（IBAN）',
    ar: 'تحويل مصرفي (IBAN)',
    ja: '銀行振込（IBAN）',
    it: 'Bonifico Bancario (IBAN)',
    ko: '은행 송금 (IBAN)',
    hi: 'बैंक ट्रांसफर (IBAN)'
  },
  'ProxyPay (Referência ATM)': {
    en: 'ProxyPay (ATM Reference)',
    es: 'ProxyPay (Referencia ATM)',
    fr: 'ProxyPay (Référence ATM)',
    zh: 'ProxyPay (ATM 参考编号)',
    ar: 'ProxyPay (مرجع الصراف)',
    ja: 'ProxyPay (ATM参照コード)',
    it: 'ProxyPay (Riferimento ATM)',
    ko: 'ProxyPay (ATM 결제코드)',
    hi: 'ProxyPay (एटीएम संदर्भ)'
  },
  'PayPay África (Carteira Digital)': {
    en: 'PayPay Africa (Digital Wallet)',
    es: 'PayPay África (Billetera Digital)',
    fr: 'PayPay Afrique (Portefeuille Numérique)',
    zh: 'PayPay 非洲（数字钱包）',
    ar: 'PayPay إفريقيا (محفظة رقمية)',
    ja: 'PayPay アフリカ（デジタルウォレット）',
    it: 'PayPay Africa (Portafoglio Digitale)',
    ko: 'PayPay 아프리카 (전자지갑)',
    hi: 'PayPay अफ्रीका (डिजिटल वॉलेट)'
  },
  'Alipay (Pagamento Internacional)': {
    en: 'Alipay (International Payment)',
    es: 'Alipay (Pago Internacional)',
    fr: 'Alipay (Paiement International)',
    zh: '支付宝 Alipay（国际跨境支付）',
    ar: 'Alipay (دفع دولي)',
    ja: 'Alipay（国際決済）',
    it: 'Alipay (Pagamento Internazionale)',
    ko: '알리페이 Alipay (해외 결제)',
    hi: 'Alipay (अंतर्राष्ट्रीय भुगतान)'
  },
  'Inteligência Fiscal': {
    en: 'Fiscal Intelligence',
    es: 'Inteligencia Fiscal',
    fr: 'Intelligence Fiscale',
    zh: '财税智能',
    ar: 'الذكاء الضريبي',
    ja: '税務インテリジェンス',
    it: 'Intelligenza Fiscale',
    ko: '세무 인텔리전스',
    hi: 'वित्तीय बुद्धिमत्ता'
  },
  'Ecossistema & Apps': {
    en: 'Ecosystem & Apps',
    es: 'Ecosistema y Apps',
    fr: 'Écosystème et Applications',
    zh: '生态系统与应用',
    ar: 'المنظومة والتطبيقات',
    ja: 'エコシステム・アプリ',
    it: 'Ecosistema e App',
    ko: '생태계 및 앱',
    hi: 'पारिस्थितिकी तंत्र और ऐप्स'
  },
  '8 PLATAFORMAS': {
    en: '8 PLATFORMS',
    es: '8 PLATAFORMAS',
    fr: '8 PLATEFORMES',
    zh: '8个跨平台终端',
    ar: '8 منصات',
    ja: '8プラットフォーム',
    it: '8 PIATTAFORME',
    ko: '8개 플랫폼',
    hi: '8 प्लेटफार्म'
  },
  'Simuladores & Ferramentas': {
    en: 'Simulators & Tools',
    es: 'Simuladores y Herramientas',
    fr: 'Simulateurs et Outils',
    zh: '模拟器与工具箱',
    ar: 'المحاكيات والأدوات',
    ja: 'シミュレーター・ツール',
    it: 'Simulatori e Strumenti',
    ko: '시뮬레이터 및 도구',
    hi: 'सिम्युलेटर और उपकरण'
  },
  'Administração & CRM': {
    en: 'Management & CRM',
    es: 'Administración y CRM',
    fr: 'Administration & CRM',
    zh: '系统管理与客户关系',
    ar: 'الإدارة ونظام العملاء',
    ja: '管理・CRM',
    it: 'Amministrazione e CRM',
    ko: '관리 및 CRM',
    hi: 'प्रबंधन और सीआरएम'
  },
  'Conta & Preferências': {
    en: 'Account & Preferences',
    es: 'Cuenta y Preferencias',
    fr: 'Compte et Préférences',
    zh: '账户与偏好设置',
    ar: 'الحساب والتفضيلات',
    ja: 'アカウント・設定',
    it: 'Account e Preferenze',
    ko: '계정 및 환경설정',
    hi: 'खाता और प्राथमिकताएं'
  },
  'Sair da Conta': {
    en: 'Log Out',
    es: 'Cerrar Sesión',
    fr: 'Se Déconnecter',
    zh: '退出登录',
    ar: 'تسجيل الخروج',
    ja: 'ログアウト',
    it: 'Disconnetti',
    ko: '로그아웃',
    hi: 'लॉग आउट'
  },
  'Regime Geral': {
    en: 'General Regime',
    es: 'Régimen General',
    fr: 'Régime Général',
    zh: '通用税制',
    ar: 'النظام العام',
    ja: '一般制度',
    it: 'Regime Generale',
    ko: '일반 과세제도',
    hi: 'सामान्य व्यवस्था'
  },
  'Regime Simplificado': {
    en: 'Simplified Regime',
    es: 'Régimen Simplificado',
    fr: 'Régime Simplifié',
    zh: '简易税制',
    ar: 'النظام المبسط',
    ja: '簡易制度',
    it: 'Regime Semplificato',
    ko: '간이 과세제도',
    hi: 'सरलीकृत व्यवस्था'
  },
  'Regime de Exclusão': {
    en: 'Exclusion Regime',
    es: 'Régimen de Exclusión',
    fr: "Régime d'Exclusion",
    zh: '豁免税制',
    ar: 'نظام الاستثناء',
    ja: '免税・適用除外制度',
    it: 'Regime di Esclusione',
    ko: '면세/제외 제도',
    hi: 'बहिष्करण व्यवस्था'
  },
  'PUBLICIDADE PATROCINADA': {
    en: 'SPONSORED ADVERTISING',
    es: 'PUBLICIDAD PATROCINADA',
    fr: 'PUBLICITÉ COMMANDITÉE',
    zh: '赞助广告',
    ar: 'إعلانات دعائية',
    ja: 'スポンサー広告',
    it: 'PUBBLICITÀ SPONSORIZZATA',
    ko: '스폰서 광고',
    hi: 'प्रायोजित विज्ञापन'
  }
};

/**
 * Fast lookup to translate text using the built-in dictionary
 */
export function lookupPhrase(text: string, lang: SupportedLang): string | null {
  if (!text || lang === 'pt') return text;
  const trimmed = text.trim();
  const entry = PHRASE_DICTIONARY[trimmed];
  if (entry && entry[lang]) {
    return entry[lang]!;
  }
  return null;
}
