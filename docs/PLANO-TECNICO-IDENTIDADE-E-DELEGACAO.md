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

## 8. Primeira fundação de API (12/11/2026)

Foram adicionados à branch, sem ativação no frontend:

- `api/_lib/firebase-admin.js`: inicialização do Firebase Admin por credencial de ambiente e verificação de ID token Firebase (inclui verificação de revogação).
- `api/auth/me.js`: endpoint autenticado para consultar identidade e claims.
- `api/oms/delegate.js`: endpoint POST para delegar OM emergencial, validar perfil/permissão, validar destinatário ativo/habilitado, preservar histórico de atribuição e atualizar o documento diário em transação Firestore.
- `package.json`: dependência `firebase-admin` para execução das funções Node na Vercel.

### Claims exigidas (assinadas pelo Firebase Admin)

A autorização é baseada em custom claims assinadas, nunca em `role`, `permissions` ou `modules` enviados no corpo da requisição:

```json
{
  "role": "supervisor",
  "permissions": {
    "emergenciais": { "delegate": true }
  },
  "modules": ["emergenciais"]
}
```

Para ADM, a claim `role` deve ser `admin`. Para o destinatário, a claim `modules` deve conter `emergenciais`. O documento `system_users/{uid}` mantém o cadastro operacional e precisa conter ao menos `active: true` e `name`. A API não aceita o nome ou perfil enviado pelo navegador como prova de identidade.

### Configuração necessária na Vercel

Cadastrar em Project Settings → Environment Variables:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON completo da conta de serviço Firebase Admin, com permissão mínima necessária para Auth e Firestore. Nunca colocar esse valor no GitHub, HTML, navegador ou documentação.
- `CD_FIREBASE_APP_ID`: ID usado no caminho Firestore da aplicação. Se omitido, a API usa `cd-barueri-sp`; confirmar que corresponde ao ID atualmente usado pelo frontend.

Instalar/deployar a branch para a Vercel depois de configurar as variáveis. As funções ainda não ficam utilizáveis sem essas variáveis, os usuários Firebase provisionados, os documentos `system_users/{uid}` e as custom claims corretas.

### Limites desta entrega

Esta é uma fundação de backend, não uma migração completa de autenticação. O frontend legado ainda permite autenticação anônima e gravações diretas no Firestore. Portanto:

- Não apresentar o botão de delegação nem considerar a API liberada para operação até integrar o frontend com Firebase Auth individual e ID token.
- Revisar e publicar regras Firestore que bloqueiem clientes não autorizados de gravar atribuições, histórico, documentos de usuário e trilha de auditoria. O Admin SDK da API opera com privilégios administrativos e não substitui as regras para os clientes.
- A tela atual ainda não chama `/api/oms/delegate`; esta entrega não altera o comportamento operacional existente.
- Antes de produção, testar com contas de ADM, Supervisor autorizado, Supervisor sem permissão, Operador habilitado, Operador desabilitado e usuário anônimo; testar também OM inexistente, cancelada, não emergencial e reatribuição.
- A auditoria legada do cliente continua editável pelo próprio cliente. A imutabilidade completa requer migrar o log para coleção própria gravada exclusivamente pelo backend e bloquear escrita direta dos clientes.

### Contrato inicial da API

`POST /api/oms/delegate` com Bearer ID token Firebase e JSON:

```json
{
  "date": "2026-11-12",
  "om": "OM-12345",
  "targetUid": "UID_FIREBASE_DO_OPERADOR",
  "reason": "Redistribuição de demanda emergencial"
}
```

O campo `date` usa a data operacional do documento diário. O endpoint retorna sucesso somente após a transação Firestore. A interface ainda precisa resolver o UID do destinatário e enviar o token Firebase atual.

## 9. Decisão de escopo — primeira versão funcional com PIN individual (12/11/2026)

A primeira entrega será validada operacionalmente antes da ativação da autenticação robusta. Isso não cancela nem substitui as fases futuras deste documento.

### Primeira versão
- Cada usuário terá seu próprio PIN; não haverá uma senha compartilhada como identidade de todos.
- O ADM poderá criar usuários, atribuir perfil e definir ou redefinir o PIN inicial.
- Supervisor e Operador entrarão com seu PIN individual e terão a interface ajustada ao perfil.
- O PIN `0000` poderá ser usado somente como PIN provisório inicial, com orientação para troca quando o fluxo estiver disponível.
- Os módulos operacionais devem funcionar de ponta a ponta: leitura, gravação, filtros, persistência, delegação conforme a regra operacional aprovada e histórico visível.
- A validação será feita em ciclos curtos, com testes diários e registro de aprovado, pendente e defeito.

### Limite de segurança da versão com PIN
O PIN individual nesta fase é um mecanismo provisório de identificação e organização de acesso para demonstração/teste controlado. Não equivale a autenticação forte. Não apresentar a versão como protegida contra adulteração no navegador, acesso direto ao Firestore ou falsificação de identidade. Não usar essa fase para dados pessoais ou operacionais sensíveis em produção sem aprovação explícita da organização e controles adicionais.

Não armazenar PIN em texto puro. A implementação deve minimizar exposição e evitar incluir PIN em logs, auditoria, exportações ou documentos públicos. Um hash calculado exclusivamente no navegador não transforma um PIN curto em credencial forte; portanto, não deve ser descrito como proteção equivalente ao backend.

### Arquitetura que deve ser preservada desde já
Mesmo com PIN simples na primeira versão, manter as responsabilidades separadas para permitir substituição gradual do mecanismo de autenticação:

1. **AuthProvider**: interface única para entrar, sair e obter o usuário atual. A primeira implementação será `PinAuthProvider`; a futura poderá ser `FirebaseAuthProvider` ou sessão emitida pela API.
2. **UserRepository**: leitura e manutenção dos cadastros, perfis, estado ativo e módulos habilitados. A interface não deve depender da estrutura física atual do documento Firestore.
3. **PermissionService**: centralizar a matriz perfil + módulo + ação. A tela consulta essa camada para exibir/ocultar ações, sem espalhar comparações de nomes de perfil pelo código.
4. **OperationalRepository**: centralizar operações de leitura e gravação de OMs, insumos, máquinas, SIM Cards e demais módulos, evitando chamadas Firestore duplicadas e dispersas na interface.
5. **AuditService**: centralizar os eventos operacionais com estrutura estável (ator, ação, módulo, registro, data/hora e detalhes necessários). Na primeira fase, o registro é apenas histórico operacional do ambiente de teste; na fase robusta, a autoria e o horário serão validados/gerados no servidor e a trilha será protegida contra alteração pelo cliente.
6. **DelegationService**: manter uma operação única de delegação, com validações e histórico. Na primeira fase, só habilitar o fluxo se o comportamento e os limites do ambiente de teste estiverem claros; na fase robusta, encaminhar a operação à API autenticada já preparada.

### Regras de evolução
- Componentes de tela não devem validar PIN diretamente nem escrever PIN em documentos de dados operacionais.
- Não usar nome exibido como identificador estável; cada usuário deve ter um ID interno único, preservado na migração.
- Perfis e permissões devem ser dados estruturados, não inferidos pelo texto do nome do usuário.
- Não acoplar o código à implementação provisória de PIN. A migração futura deve trocar o provedor de autenticação e o adaptador de persistência, preservando telas, regras operacionais e histórico.
- A API Firebase Admin já adicionada permanece como fundação futura, mas não deve ser tratada como login funcional da primeira fase até que haja integração e testes completos.
- A variável de ambiente da conta de serviço não torna o frontend seguro nem bloqueia gravações diretas. As regras atuais do Firestore precisam ser auditadas antes de qualquer uso real com dados sensíveis.

### Critério de aceite da primeira versão
- ADM cria usuário com identificador único, nome, perfil e PIN individual.
- PIN incorreto não permite entrar; usuário inativo não consegue iniciar sessão na interface.
- O usuário conectado é identificado de forma consistente nas telas e no histórico operacional.
- As permissões visuais seguem a matriz acordada para ADM, Supervisor e Operador.
- Os fluxos operacionais salvam, recarregam e preservam dados e filtros conforme especificado.
- Testes de regressão diários são registrados; defeitos críticos impedem considerar a funcionalidade concluída.
- A documentação deixa explícito que a autenticação por PIN é provisória e que a fase robusta continua planejada.
