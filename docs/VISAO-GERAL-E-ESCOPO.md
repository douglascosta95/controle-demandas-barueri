# Visão geral e escopo funcional

## 1. Objetivo

O Controle Operacional de Demandas apoia a organização, consulta, acompanhamento e rastreabilidade das demandas operacionais do CD Barueri/SP. A aplicação reúne rotinas que hoje exigem acompanhamento manual, reduz retrabalho e oferece visibilidade sobre o andamento das atividades.

A aplicação não substitui os sistemas corporativos oficiais nem autoriza, por si só, movimentações em sistemas externos. Os registros devem seguir os procedimentos operacionais vigentes.

## 2. Perfis de acesso

### Supervisor
Perfil de acompanhamento da operação, sem privilégios de administração de contas:
- Consultar indicadores e acompanhar demandas dos módulos autorizados.
- Delegar OMs emergenciais a operadores habilitados e atribuir responsáveis conforme a escala e as regras operacionais.
- Reatribuir uma OM quando necessário, registrando motivo e preservando o histórico da atribuição anterior.
- Definir prioridade operacional e acompanhar o aceite/execução da demanda, conforme regras aprovadas.
- Acompanhar atividades recentes e consultar auditoria operacional, conforme política aprovada.
- Consultar pendências, divergências e resultados da equipe.
- Solicitar correções ou ajustes administrativos ao ADM, sem alterar permissões ou credenciais.
- Não criar, bloquear ou redefinir usuários.
- Não alterar configurações de segurança nem apagar trilhas de auditoria.

### Administrador (ADM)
Perfil responsável pela administração do ambiente e dos acessos. O escopo planejado inclui:
- Criar, editar, bloquear e reativar usuários.
- Atribuir perfis e permissões conforme responsabilidade.
- Emitir redefinição de senha temporária, sem visualizar a senha atual.
- Consultar trilhas de auditoria e eventos administrativos.
- Manter cadastros de apoio autorizados.
- Acompanhar a integridade operacional e solicitar suporte técnico.

O perfil ADM não deve utilizar a conta de outra pessoa nem apagar evidências de auditoria.

### Operador
Perfil destinado à execução das rotinas operacionais autorizadas:
- Consultar e registrar demandas conforme seu nível de acesso.
- Atualizar informações e status permitidos.
- Realizar importações, conferências e fracionamentos previstos no processo.
- Consultar histórico e atividades disponíveis ao seu perfil.
- Comunicar divergências e solicitar correções quando não tiver permissão para executá-las.

O operador não administra usuários, não altera configurações de segurança e não deve tentar contornar bloqueios ou validações. A delegação e a reatribuição de OMs são realizadas por Supervisor ou perfil expressamente autorizado.

## 3. Módulos e processos

O escopo funcional identificado no projeto inclui os seguintes grupos. Os detalhes de disponibilidade devem ser conferidos na versão publicada.

### Visão geral
Painel de acompanhamento com indicadores e resumos operacionais. Os indicadores devem ter definição clara, fonte identificável e critérios consistentes de cálculo.

### Demandas de aluguel
- **Máquinas:** registro e acompanhamento de OMs relacionadas a máquinas.
- **SIM Cards:** controle das demandas de SIM Cards.
- **Emergenciais:** acompanhamento de demandas classificadas como emergenciais.
- **Canceladas:** consulta e controle das demandas canceladas.

Os registros devem preservar identificação da OM, informações operacionais necessárias, status e histórico das alterações relevantes.

### Outras demandas — Insumos
- Consulta por data.
- Importação de planilhas compatíveis, após conferência do arquivo.
- Organização das OMs e dados de apoio.
- Fracionamento em lote, quando aplicável.
- Separação de regras para Agência e PA/Corner.
- Geração/consulta das informações necessárias à solicitação de nota fiscal.

Regra operacional acordada: demandas de Agência são identificadas pelo prefixo **AG** e exigem solicitação de NF; PA/Corner não exige solicitação de NF pelo fluxo descrito. O fracionamento é realizado em lote, não OM por OM. Confirmar a regra com a liderança antes de alterar o processo.

### Planejamento
- DRP e Distribuição.
- Base GRADE.

A documentação detalhada desses fluxos deverá ser complementada com as regras de negócio, responsáveis, entradas, saídas e critérios de atualização validados pela operação.

### Configurações e cadastros
- Códigos SAP.
- Equipe e operadores.

A manutenção desses dados deverá ser restrita a pessoas autorizadas. Alterações em cadastros compartilhados devem ser auditáveis.

### Ao Vivo
Painel de consulta de atividades recentes, aberto sob demanda para não poluir a tela principal. O desenho acordado prevê visualização por colaborador, filtragem por data, horário, OM e descrição da ação, com atualização em tempo real quando suportada pela conexão.

A identidade do autor deve vir da sessão autenticada validada pelo backend. Não se deve aceitar como prova de autoria um nome enviado livremente pelo navegador.

## 4. Regras transversais

- Usar a data correta antes de registrar ou consultar uma operação.
- Conferir os dados importados antes de confirmar o processamento.
- Não compartilhar usuário, senha ou sessão.
- Não inserir dados pessoais desnecessários em observações.
- Não contornar validações, PINs legados ou controles de permissão.
- Comunicar falhas, duplicidades e divergências ao responsável.
- Não apagar registros para corrigir erros; utilizar o fluxo de correção autorizado, preservando histórico.

## 5. Critérios de aceite de funcionalidades

Uma funcionalidade só deve ser considerada pronta quando:
1. O fluxo estiver implementado e testado.
2. As permissões forem verificadas no backend e no banco.
3. Os dados persistirem e forem recuperáveis conforme política definida.
4. Os eventos relevantes estiverem registrados na auditoria.
5. O comportamento de erro e perda de conexão estiver documentado.
6. O manual e o treinamento estiverem atualizados.
7. A validação operacional tiver sido realizada por pessoa responsável.

## 6. Itens a validar com a operação

- Regras completas de cada status de OM.
- Quem pode criar, editar, validar, cancelar ou reabrir registros.
- Critérios e responsáveis pelo DRP e pela Base GRADE.
- Formatos oficiais de planilha e colunas obrigatórias.
- Política de retenção dos registros e da auditoria.
- Indicadores oficiais do dashboard e sua fórmula.
- Procedimento de contingência quando o sistema ou a internet estiver indisponível.
