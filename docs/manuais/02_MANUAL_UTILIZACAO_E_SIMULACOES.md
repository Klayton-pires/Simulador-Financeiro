# 📗 MANUAL 02: GUIA COMPLETO DE UTILIZAÇÃO & SIMULAÇÕES FINANCEIRAS
**Sistema:** NANUCLOUD - Plataforma de Gestão, Simulação de Preços & Despacho Aduaneiro  
**Versão:** 2.5 Enterprise  
**Classificação:** Manual Operacional & Contabilístico  

---

## 1. Módulo de Simulação Local (Comércio vs Prestação de Serviços)

O simulador financeiro local possui dois modos fundamentais, adaptados às realidades fiscais de Angola (AGT), Portugal (AT) e normas internacionais.

### 📦 Modo 1: Comércio Geral / Venda de Produtos
Indicado para revenda de mercadorias, lojas, supermercados, distribuição e retalho.
1. **Preço de Custo Base (SEM IVA) [Obrigatório]:**
   * Introduza o custo de aquisição unitário do produto líquido de impostos dedutíveis.
   * Exemplo: `10.000,00 Kz`.
   * *Sincronização Automática:* Se preferir digitar o valor da fatura Com IVA, o campo ao lado calcula imediatamente a base sem IVA com base na taxa selecionada.
2. **Definição da Margem de Lucro ou Preço Pretendido:**
   * **Opção A (Por Margem %):** Insira a margem que deseja aplicar sobre o custo (ex: `25%` ou `40%`). O sistema calcula o Preço de Venda ao Público (PVP).
   * **Opção B (Por Preço Fixo - PVP):** Se já souber por quanto quer vender (ex: `15.000,00 Kz`), insira no campo PVP Fixo e o sistema revelará a margem real e o lucro líquido exato.
3. **Taxa de TPA / Terminal de Pagamento Automático (%):**
   * Comissão bancária retida pela operadora (ex: EMIS em Angola, padrão 1%).
4. **Resultados e Desdobramento Contábil Gerado:**
   * Preço de Venda ao Público (PVP) Sem IVA e Com IVA.
   * Valor do IVA a liquidar e IVA a entregar aos cofres do Estado.
   * Dedução da comissão TPA.
   * Provisão do Imposto Industrial (25% em Angola sobre o lucro operacional).
   * Lucro Líquido Real que fica na conta da empresa.

---

### 💼 Modo 2: Prestação de Serviços & Consultoria
Indicado para advogados, consultores, empresas de TI, engenharia, contabilidade, manutenção, formação e freelancers.

> 💡 **Princípio Contabilístico:** Na prestação de serviços **não existe preço de custo de compra de mercadoria**. O valor central é o **Honorário / Valor do Serviço Pretendido**.

1. **Valor Total do Serviço / Honorário Pretendido (PVP Fatura) [Principal]:**
   * Introduza o montante total a faturar ao cliente (ex: `100.000,00 Kz`).
2. **Custos Operacionais Diretos (Opcional - Padrão 0 Kz):**
   * Caso existam despesas diretas reembolsáveis, materiais ou subcontratados, insira no campo de custos. Caso contrário, mantenha `0 Kz`.
3. **Retenção na Fonte (%):**
   * Na faturação de serviços entre pessoas coletivas ou profissionais, a lei obriga o cliente a reter uma percentagem na fonte e entregar à Administração Fiscal.
   * **Atalhos Rápidos Disponíveis:**
     * **Angola Serviços (6.5%):** Conforme Código do Imposto Industrial / IRT da AGT.
     * **Portugal Profissionais Liberais (11.5%):** IRS Art.º 101.º CIRS.
     * **Retenção Geral (25%):** Serviços a entidades não residentes ou taxas liberatórias.
     * **Isenção (0%):** Serviços com certificado de dispensa de retenção na fonte.
4. **Matriz de Cenários Inteligente para Serviços:**
   O simulador gera automaticamente 4 análises comparativas:
   * **Cenário Pretendido:** Montante Líquido Real que entra no banco após a Retenção na Fonte (ex: 6.5%) e TPA.
   * **Cenário sem Retenção (0%):** Valor total recebido em caso de isenção.
   * **Cenário Transferência Direta (0% TPA):** Valor sem custos de intermediação bancária.
   * **Cenário Retenção Alternativa:** Comparação de impacto de outras taxas fiscais.

---

## 2. Módulo de Importação & Despacho Aduaneiro

Indicado para importadores, despachantes aduaneiros e empresas de comércio internacional.

1. **Campos de Entrada da Pauta Aduaneira:**
   * **País de Origem:** China, Emirados Árabes Unidos (Dubai), Portugal, EUA, África do Sul, etc.
   * **País de Destino:** Angola (Pauta Aduaneira AGT), Portugal (Pauta UE), etc.
   * **Valor FOB (Free on Board):** Valor da mercadoria na fatura comercial do fornecedor externo.
   * **Frete Internacional:** Custo do transporte marítimo ou aéreo.
   * **Seguro de Transporte Internacional:** Valor da apólice de seguro de carga.
   * **Direitos Aduaneiros (%):** Alíquota da Pauta Aduaneira (ex: 2%, 10%, 20%, 30%).
   * **Imposto Especial de Consumo - IEC (%):** Para bebidas, tabaco, viaturas de luxo ou supérfluos.
   * **Outras Despesas Portuárias & Despacho:** Taxas da EPAL, Terminal de Contentores, honorários do despachante.
2. **Cálculo Oficial em Cascata:**
   $$\text{CIF} = \text{FOB} + \text{Frete} + \text{Seguro}$$
   $$\text{Direitos Aduaneiros} = \text{CIF} \times \text{Taxa Direitos}$$
   $$\text{IEC} = (\text{CIF} + \text{Direitos}) \times \text{Taxa IEC}$$
   $$\text{Taxa de Estatística Aduaneira} = \text{CIF} \times 0.5\%$$
   $$\text{Base de IVA Aduaneiro} = \text{CIF} + \text{Direitos} + \text{IEC} + \text{Taxa Estatística}$$
   $$\text{Custo Nacionalizado (Landed Cost)} = \text{CIF} + \text{Total Encargos Aduaneiros}$$
   $$\text{PVP Recomendado} = \text{Custo Nacionalizado} \times (1 + \text{Margem})$$

---

## 3. Módulo de Operações em Lote via Excel (.xlsx / .csv)

Permite carregar tabelas de preços com centenas ou milhares de linhas de forma instantânea:
* O sistema possui **Reconhecimento Automático de Colunas**, detetando colunas de nomes e preços independentemente da ordem.
* Possui **Mapeador Manual de Colunas** para o utilizador selecionar qual coluna deve ser lida caso a planilha possua estrutura atípica.
* Valida todas as linhas antes da execução, emitindo alertas caso existam erros de formatação ou se o ficheiro ultrapassar o limite seguro de processamento.
* Exporta o ficheiro enriquecido com colunas padronizadas NANUCLOUD e cores diferenciadas.
