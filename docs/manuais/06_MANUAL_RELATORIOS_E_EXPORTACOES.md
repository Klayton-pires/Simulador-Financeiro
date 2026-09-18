# 📑 MANUAL 06: GUIA DE RELATÓRIOS EXECUTIVOS EM PDF & EXPORTAÇÕES
**Sistema:** NANUCLOUD - Plataforma de Gestão, Simulação de Preços & Despacho Aduaneiro  
**Versão:** 2.5 Enterprise  
**Classificação:** Manual de Emissão de Relatórios e Auditoria Contábil  

---

## 1. Geração de Relatórios Executivos em PDF

O NANUCLOUD possui motor integrado para geração de relatórios formais em PDF com layout corporativo de alta definição:

### Elementos Contidos no Relatório PDF Oficial:
1. **Cabeçalho Institucional:** Logótipo NANUCLOUD, data e hora da emissão e carimbo de autenticidade digital.
2. **Dados do Cliente / Empresa:** Nome da empresa solicitante, NIF e identificador da simulação.
3. **Quadro Resumo Financeiro:**
   * Preço de Custo / Valor Base do Serviço.
   * Alíquota de IVA aplicada e valor liquidado.
   * Percentagem de Margem de Lucro e Lucro Bruto.
   * Dedução de comissões de pagamento (TPA / Multicaixa).
   * Retenção na Fonte deduzida (se aplicável ao regime de prestação de serviços).
   * Preço de Venda ao Público Recomendado (PVP).
   * Lucro Líquido Real final após impostos.
4. **Nota Legal de Conformidade Fiscal:** Informação sobre a legislação tributária aplicada (ex: AGT - República de Angola).

---

## 2. Como Emitir um Relatório PDF

### A. A partir do Simulador Local / Serviços
1. Execute a simulação com os valores pretendidos.
2. Na tabela de resultados ou no card do cenário selecionado, clique no botão **"📄 Gerar Relatório PDF"**.
3. O ficheiro PDF é compilado e descarregado instantaneamente para a sua pasta de transferências.

### B. A partir do Módulo de Despacho Aduaneiro
1. Preencha os dados do FOB, frete, direitos e taxas aduaneiras.
2. Clique em **"📄 Emitir Relatório Aduaneiro em PDF"**.
3. O relatório detalha todas as etapas do desembaraço aduaneiro (CIF, Direitos, IEC, Taxa Estatística e Custo Nacionalizado).

---

## 3. Exportações para Excel (.xlsx) e CSV

* **Operações em Lote:** Após carregar a planilha e o sistema aplicar as fórmulas, clique em **"📥 Exportar Planilha Calculada (.xlsx)"**.
* O Excel resultante inclui as colunas originais do cliente preservadas, acrescidas das novas colunas oficiais da NANUCLOUD com cabeçalhos claros e estilização diferenciada.
* **Histórico Global de Consultas:** No Painel Administrativo, clique em **"Exportar Histórico Completo (.csv)"** para integração direta com softwares de contabilidade (ex: Primavera, PHC, SAP, Sage).
