# Plano técnico — identidade, permissões e delegação operacional

**Branch de trabalho:** `refactor/dashboard-navigation`  
**Status:** planejamento técnico baseado na auditoria do frontend em 12/11/2026.  
**Regra:** não liberar ações privilegiadas enquanto a autorização não for validada fora do navegador.

## 1. Objetivo

Implementar autenticação individual sem e-mail corporativo obrigatório, perfis Administrador/Supervisor/Operador e delegação de demandas pelo Supervisor. A primeira rotina de delegação será OMs Emergenciais.

## 2. Bloqueio técnico encontrado

O estado atual usa autenticação anônima como fallback, seleção de operador e PIN legado no frontend. O nome de operador usado no log é obtido de `state.currentOperator`. A configuração que contém PINs e operadores é sincronizada para Firestore pelo cliente.

Esse modelo não permite provar que uma ação foi feita pela pessoa identificada no navegador nem autorizar Supervisor com confiança. Uma permissão implementada apenas em JavaScript não protege a operação.

## 3. Sequência obrigatória de implementação

### Fase 0 — inventário e preparação
- Confirmar projeto Firebase, Firestore database, Authentication providers e regras atualmente publicadas.
- Confirmar estrutura Vercel e método atual de deploy.
- Exportar/backup dos documentos existentes e validar restauração.
- Mapear todos os pontos de leitura/escrita do Firestore no frontend.
- Mapear os usos do PIN legado e os dados operacionais associados.
- Definir plano de migração e rollback sem perda de dados.

**Critério de saída:** inventário de infraestrutura e dados revisado; backup verificável.

### Fase 1 — identidade e sessão
- Implementar backend em Vercel Functions (ou arquitetura equivalente validada).
- Criar cadastro individual com username único, senha temporária e troca obrigatória no primeiro acesso.
- Guardar apenas hash moderno de senha (Argon2id preferencial; alternativa justificada).
- Emitir/validar sessão confiável; nunca aceitar UID, perfil ou nome de ator enviados como autoridade pelo navegador.
- Implementar rate limiting, mensagens de erro não enumeráveis, expiração e revogação de sessão.
- Provisionar o primeiro ADM por procedimento de bootstrap de uso único, fora do código-fonte.
- Migrar gradualmente usuários sem apagar dados históricos.

**Critério de saída:** testes comprovam login, logout, troca inicial, redefinição, bloqueio, revogação e rejeição de acesso anônimo a operações protegidas.

### Fase 2 — autorização e persistência
- Definir fonte confiável para contas, perfis e permissões.
- Aplicar princípio de negar por padrão.
- Implementar matriz perfil + módulo + ação no backend.
- Revisar regras Firestore para negar acesso não autorizado; não confiar em ocultação de interface.
- Definir quais leituras/escritas permanecem diretas do cliente e quais passam obrigatoriamente pela API.
- Proteger dados de configuração e remover PINs do documento público após migração.

**Critério de saída:** testes negativos demonstram que Operador não executa ações de Supervisor/ADM e que usuário bloqueado não opera.

### Fase 3 — delegação de OMs Emergenciais
Criar operação backend para delegar/reatribuir uma OM, com:
- Identificador estável da OM e data operacional.
- Verificação de que o solicitante é Supervisor ativo e possui permissão `emergenciais:delegate`.
- Verificação de que o destinatário está ativo e habilitado para o módulo.
- Validação do estado atual da OM e regras de reatribuição.
- Registro append-only de cada evento, sem sobrescrever a atribuição anterior.
- Autor do evento derivado da sessão validada no backend.
- Data/hora gerada no servidor.
- Motivo obrigatório na reatribuição, se a política operacional assim definir.
- Resposta clara em caso de conflito ou atualização concorrente.

Campos mínimos sugeridos para o evento:
`eventId`, `dateKey`, `omId`, `module`, `action`, `actorUid`, `actorDisplayNameSnapshot`, `fromOperatorUid`, `toOperatorUid`, `reason`, `createdAt`.

O nome é apenas uma fotografia para leitura; UIDs são os identificadores de referência. Não registrar senha, token ou dados pessoais desnecessários.

**Critério de saída:** testes de autorização, destinatário inativo, OM inexistente, reatribuição, concorrência, auditoria e sincronização aprovados.

### Fase 4 — interface de delegação
- Exibir responsável atual e histórico resumido na lista de Emergenciais.
- Exibir ação Delegar somente para quem possui a permissão, como conveniência de interface.
- Abrir modal com operador elegível, confirmação e justificativa quando aplicável.
- Atualizar a tela somente após confirmação da API.
- Tratar erros de permissão, conflito e falha de rede sem perder os dados já existentes.

### Fase 5 — expansão por módulo
Somente após validar Emergenciais, analisar separadamente Máquinas, SIM Cards e Insumos. Cada módulo exige mapeamento de status, responsável, validações, importação, sincronização e efeitos nos indicadores. A permissão não será propagada automaticamente entre módulos.

## 4. Plano de testes mínimos

- Login inválido, usuário inexistente e senha incorreta com resposta genérica.
- Usuário bloqueado, sessão expirada e token revogado.
- Operador tentando chamar diretamente a API de delegação.
- Supervisor sem permissão específica tentando delegar em outro módulo.
- Tentativa de delegar para usuário inativo/não habilitado.
- Reatribuição preservando evento anterior.
- Duas alterações concorrentes na mesma OM.
- Falha de rede antes/depois da gravação.
- Auditoria com autor derivado do backend.
- Verificação de que nenhum PIN/senha/token aparece em documentos públicos ou logs.
- Regressão dos fluxos atuais de OMs, SIM Cards, Insumos, filtros por data e sincronização.

## 5. LGPD e governança

Antes da liberação operacional, definir finalidade e base legal com a organização, minimização dos dados, perfis de acesso, retenção, canal para solicitações dos titulares, resposta a incidentes, responsáveis e fornecedores envolvidos. Este plano é técnico e não constitui certificação ou parecer jurídico de conformidade.

## 6. Critério de liberação

A funcionalidade só será considerada pronta quando backend, regras do banco, testes positivos/negativos, backup/rollback, documentação e treinamento estiverem validados. Um controle visual no frontend não atende a esse critério.

## 7. Inventário confirmado no código-fonte (12/11/2026)

Auditoria da versão atual de `index.html` na branch `refactor/dashboard-navigation`:

- A aba Emergenciais é renderizada por `renderSpecialTabs()`. A lista inclui registros não cancelados com `isEmergencial === true` ou `status === "EMERGENCIAL"`; portanto, a OM pode continuar na aba mesmo depois de mudar de status, desde que a marcação seja preservada.
- O responsável operacional atual está no campo `colaborador` do objeto da OM. O importador DRP preserva `colaborador`, `status`, `validatedBy`, `updatedBy` e `updatedAt` de registros anteriores.
- O objeto de estado ainda usa `currentOperator` como identidade ativa no navegador e `operators` como lista simples de nomes. Não há UID individual nem cadastro de perfil/permissão por usuário.
- `pushAudit(om, actionText)` registra `who` a partir de `state.currentOperator` e cria `timestamp` com o relógio do navegador. O log é mantido em memória/localStorage e sincronizado pelo cliente; não é uma trilha imutável nem uma prova de identidade.
- `syncToCloud()` grava `oms` e `auditLog` diretamente do navegador no documento diário do Firestore. `syncConfigToCloud()` também grava `pins`, `operators` e `sapCatalog` no documento público de configuração.
- O fluxo de conexão ainda permite `signInAnonymously()` quando não há token customizado. O repositório não contém, na raiz, `package.json`, `vercel.json`, `firebase.json` ou `firestore.rules`; a existência/configuração de funções Vercel e regras publicadas precisa ser confirmada no painel e na configuração real do projeto.

### Decisão de implementação

O campo `colaborador` será tratado como **responsável atual legado**, não como identidade autenticada. A nova atribuição deve ser acrescentada sem destruir esse dado histórico durante a migração. O modelo futuro deverá separar:

- `assignedToUid`: UID confiável do responsável atual;
- `assignedToNameSnapshot`: nome exibido no momento da atribuição;
- `assignmentHistory[]`: eventos append-only com UID do autor, UID anterior, UID destinatário, motivo e timestamp do servidor.

Não será adicionado botão ativo de delegação nem gravação client-side de atribuição antes da camada de autenticação/autorização. Isso evitará criar um fluxo que pareça protegido, mas possa ser forjado pelo próprio navegador.

