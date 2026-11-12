# Segurança, arquitetura e LGPD

## 1. Objetivo e princípio obrigatório

Este documento define os requisitos mínimos de segurança e privacidade para evolução do Controle Operacional de Demandas.

**Regra inegociável:** nenhuma funcionalidade nova poderá enfraquecer a segurança ou a privacidade das funcionalidades existentes.

A documentação descreve requisitos e decisões pretendidas. Ela não certifica que todos os controles já estejam implementados.

## 2. Situação técnica identificada

Na versão do código analisada durante o planejamento:
- O frontend está concentrado em `index.html`.
- A aplicação utiliza Firebase Authentication e Firestore.
- O fluxo ainda contém autenticação anônima como alternativa.
- Há configuração operacional persistida no Firestore, incluindo PINs, operadores e catálogo SAP.
- Dados diários de demandas e insumos são sincronizados com o Firestore.
- Existe uma constante legada `TEMP_INITIAL_PIN = "0000"`.

Esses pontos exigem migração cuidadosa. A presença de autenticação anônima e PIN compartilhado não deve ser tratada como modelo final de identidade. Não remover ou alterar o fluxo atual sem planejar migração, testes, regras do Firestore e preservação dos dados existentes.

## 3. Modelo de identidade planejado

- Cada pessoa terá um nome de usuário único e uma senha individual.
- Não será exigido e-mail corporativo nesta etapa.
- O cadastro será realizado por um Administrador autorizado.
- A primeira senha será temporária e deverá ser trocada no primeiro acesso.
- O administrador poderá solicitar redefinição, mas nunca consultar a senha atual.
- Contas poderão ser bloqueadas e reativadas sem apagar o histórico operacional.
- Não haverá senha mestra compartilhada nem senha padrão permanente.
- O identificador interno do usuário (UID) será a referência de autoria nos registros.

Como o Firebase Authentication não oferece autenticação nativa por nome de usuário e senha, a solução deverá usar um serviço backend para validar credenciais e estabelecer uma sessão confiável. A implementação deverá ser escolhida após validar o ambiente Vercel, Firebase e a estratégia de sessão.

## 4. Requisitos de autenticação e sessão

- Senhas nunca podem ser armazenadas em texto puro.
- Usar algoritmo moderno de hash de senha, preferencialmente Argon2id; avaliar compatibilidade e operação no runtime escolhido. bcrypt pode ser alternativa tecnicamente justificada.
- Nunca armazenar senha, hash, token de sessão ou segredo administrativo no frontend, localStorage ou repositório.
- Aplicar limite de tentativas, atraso progressivo e proteção contra força bruta.
- Mensagens de erro de login não devem revelar se um usuário existe.
- Exigir troca de senha temporária no primeiro acesso.
- Revogar sessões após bloqueio de conta ou redefinição de senha, conforme desenho adotado.
- Definir expiração de sessão, encerramento de sessão e política de dispositivos compartilhados.
- Não permitir que o navegador determine o próprio perfil ou eleve suas permissões.

## 5. Backend e autorização

- Toda ação privilegiada deve ser validada no backend.
- O backend deve validar a identidade da sessão e o estado ativo da conta.
- O perfil e as permissões devem vir de fonte confiável, nunca de campos livremente enviados pelo cliente.
- A API deve validar formato, tamanho, tipo e consistência dos dados recebidos.
- Segredos do Firebase Admin e demais credenciais privadas devem ficar exclusivamente em variáveis de ambiente protegidas na Vercel.
- A configuração Firebase pública do frontend não é uma senha; a proteção depende de autenticação, regras e autorização corretas.
- Firestore deve adotar negação por padrão e liberar somente operações explicitamente autorizadas.
- Acesso anônimo deve ser desativado após a migração segura e validação de todos os fluxos.
- Não expor coleções ou documentos operacionais publicamente.

## 6. Matriz inicial de permissões

Esta matriz é uma proposta inicial e precisa de aprovação da liderança antes da implementação definitiva. O Supervisor possui autonomia de coordenação, mas as ações são liberadas separadamente por módulo. Ter permissão para delegar não significa ter permissão para editar, validar, cancelar ou concluir uma demanda.

| Ação | Operador | Supervisor | Administrador |
|---|---|---|---|
| Consultar módulos liberados | Sim | Sim | Sim |
| Consultar indicadores e visão geral | Conforme acesso | Sim | Sim |
| Criar/editar demanda operacional | Conforme módulo | Conforme permissão específica | Sim, quando necessário |
| Alterar status operacional | Conforme regra | Conforme permissão específica | Conforme regra |
| Consultar Ao Vivo | Conforme política | Sim | Sim |
| Delegar/reatribuir OM emergencial | Não, salvo autorização | Sim, conforme habilitação | Sim, quando necessário |
| Delegar/reatribuir OMs de Máquinas | Não, salvo autorização | A definir por módulo | Sim, quando necessário |
| Delegar/reatribuir OMs de SIM Cards | Não, salvo autorização | A definir por módulo | Sim, quando necessário |
| Delegar/reatribuir demandas de Insumos | Não, salvo autorização | A definir por módulo | Sim, quando necessário |
| Consultar auditoria operacional | Não, salvo liberação | Sim, conforme escopo | Sim |
| Gerenciar usuários | Não | Não | Sim |
| Redefinir senha de usuário | Não | Não | Sim |
| Bloquear/reativar usuário | Não | Não | Sim |
| Alterar permissões | Não | Não | Sim |
| Alterar configurações globais | Não, salvo permissão específica | Não | Sim |
| Consultar auditoria administrativa | Não | Não, salvo autorização específica | Sim |
| Apagar trilha de auditoria | Não | Não | Não |

### Regras para delegação por módulo

- A autorização deve ser definida por combinação de perfil, módulo e ação (por exemplo: `supervisor + emergenciais + delegate`).
- O Supervisor só pode atribuir a demanda a usuário ativo, habilitado no módulo e autorizado para aquela atividade.
- A delegação não altera o autor original da OM e não permite executar ações em nome do operador.
- Registrar UID do Supervisor, UID do operador designado, OM, módulo, data/hora do servidor, ação e motivo quando exigido.
- Reatribuições devem preservar o histórico anterior e a justificativa aplicável.
- Não conceder permissões automaticamente por meio da delegação.
- Antes de liberar delegação em Máquinas, SIM Cards ou Insumos, validar o fluxo de trabalho, regras de negócio, status, efeitos de sincronização e impactos nos relatórios daquele módulo.
- A matriz final deverá ser aprovada pela liderança operacional e implementada no backend e nas regras do banco, não apenas na interface.

A administração do sistema não deve significar permissão irrestrita para apagar registros de auditoria.

## 7. Auditoria e rastreabilidade

Registrar, para eventos relevantes:
- UID do autor autenticado.
- Data e hora geradas no servidor.
- Tipo de ação.
- Identificador do registro afetado (por exemplo, OM).
- Resultado da operação.
- Justificativa quando exigida.
- Alterações relevantes, preferencialmente como diferenças mínimas entre antes e depois.

Não registrar:
- Senhas ou hashes de senha.
- Tokens, cookies ou chaves privadas.
- Dados pessoais sem necessidade.
- Conteúdo completo de planilhas quando um resumo ou identificador for suficiente.

A auditoria deve ter proteção contra alteração indevida por usuários comuns e política definida de retenção.

## 8. Proteção de dados e LGPD

A aplicação deve apoiar os princípios de:
- Finalidade e transparência.
- Adequação e necessidade (minimização).
- Qualidade e exatidão dos dados.
- Segurança e prevenção.
- Acesso restrito e prestação de contas.

Antes da operação oficial, definir com a organização:
1. Quem é o controlador e quem atua como operador de dados pessoais.
2. Finalidades e bases legais aplicáveis a cada categoria de dado.
3. Quais dados pessoais são realmente necessários.
4. Quem pode acessar cada categoria.
5. Prazo de retenção e procedimento de descarte.
6. Como atender solicitações dos titulares, quando aplicável.
7. Como registrar, avaliar e comunicar incidentes conforme responsabilidades e prazos aplicáveis.
8. Quais fornecedores/processadores participam do tratamento e quais condições contratuais se aplicam.

Não inserir dados pessoais sensíveis ou informações de clientes/colaboradores em ambientes de teste sem autorização e controles adequados. Usar dados fictícios para treinamento.

**Importante:** implementar controles técnicos não equivale, isoladamente, a garantir conformidade legal com a LGPD. A organização deve validar as responsabilidades, bases legais, avisos e procedimentos com sua área responsável por privacidade/jurídico.

## 9. Backups, continuidade e incidentes

Definir antes da produção:
- Frequência e retenção dos backups.
- Responsável por verificar a execução.
- Testes periódicos de restauração.
- Procedimento de contingência em indisponibilidade.
- Canal para comunicar incidente ou suspeita de acesso indevido.
- Processo de contenção, preservação de evidências, avaliação e comunicação.
- Responsável por autorizar retorno à operação.

Nunca testar restauração ou migração diretamente sobre a única cópia dos dados de produção.

## 10. Implantação segura por etapas

1. Inventariar dados, coleções, regras atuais e dependências da autenticação anônima.
2. Criar ambiente de teste e cópia/backup verificável.
3. Implementar backend e autenticação individual sem expor segredos.
4. Criar bootstrap administrativo seguro, de uso único, sem credencial fixa no código.
5. Migrar usuários e permissões com procedimento controlado.
6. Atualizar regras Firestore e validar acesso por perfil.
7. Testar bloqueio, redefinição, expiração e revogação de sessão.
8. Testar leitura, gravação, sincronização e recuperação dos dados operacionais.
9. Desativar autenticação anônima e PIN legado somente após aceite.
10. Publicar, monitorar e manter plano de rollback.

## 11. Checklist de liberação

- [ ] Não há senha padrão ou compartilhada no código.
- [ ] Nenhuma senha é armazenada em texto puro.
- [ ] Não há chave privada ou segredo no GitHub/frontend.
- [ ] Usuário bloqueado não consegue continuar usando a aplicação.
- [ ] Operador não consegue executar ação administrativa via chamada direta.
- [ ] Regras Firestore negam acesso não autorizado.
- [ ] Auditoria identifica UID autenticado e horário confiável.
- [ ] Falhas de conexão não causam perda silenciosa de dados.
- [ ] Backup e restauração foram testados.
- [ ] Manuais, aviso de privacidade e procedimentos foram revisados.
- [ ] Responsável operacional e responsável técnico aprovaram a liberação.
