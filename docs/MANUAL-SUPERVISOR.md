# Manual do Supervisor

**Público:** pessoas autorizadas a acompanhar a operação sem administrar contas ou configurações de segurança.  
**Status:** guia inicial; ajustar telas e permissões após implementação e aprovação da matriz de acesso.

## 1. Papel do Supervisor

O Supervisor acompanha o andamento das demandas, consulta indicadores, coordena a distribuição do trabalho e identifica situações que precisam de intervenção. Pode delegar OMs emergenciais a operadores habilitados, conforme as regras da operação. Seu acesso deve ser delimitado por módulo e ação.

O Supervisor não:
- Cria, bloqueia ou reativa usuários.
- Redefine senhas ou administra credenciais.
- Concede ou altera permissões de acesso ao sistema.
- Altera configurações de segurança.
- Apaga ou modifica trilhas de auditoria.
- Usa a conta de outra pessoa ou compartilha sua própria conta.

## 2. Acesso

1. Entre pelo endereço oficial com sua conta individual.
2. Confira se seu perfil está identificado como Supervisor.
3. Utilize somente os módulos liberados.
4. Encerre a sessão ao terminar, principalmente em equipamento compartilhado.
5. Em caso de acesso indevido ou perfil incorreto, comunique o ADM.

## 3. Coordenação e delegação de demandas

O Supervisor pode distribuir trabalho nos módulos em que sua conta tiver permissão explícita. A primeira aplicação prevista é a delegação de OMs emergenciais. A expansão para Máquinas, SIM Cards e Insumos depende da validação das regras específicas de cada processo.

### Fluxo de delegação

1. Abra o módulo autorizado e selecione a demanda/OM.
2. Confira prioridade, prazo, status e informações necessárias para execução.
3. Selecione um operador ativo, habilitado no módulo e disponível conforme a escala.
4. Confirme a atribuição e inclua a orientação operacional necessária.
5. Confira se a atribuição foi salva e se o responsável aparece corretamente.
6. Acompanhe o andamento e intervenha quando houver impedimento.
7. Se precisar reatribuir, informe o motivo quando exigido e preserve a trilha da atribuição anterior.

### Limites por módulo

| Módulo | Autonomia prevista do Supervisor | Situação |
|---|---|---|
| OMs Emergenciais | Delegar e reatribuir para operadores habilitados | Primeira prioridade |
| Máquinas | Delegação/atribuição conforme regras do módulo | A validar |
| SIM Cards | Delegação/atribuição conforme regras do módulo | A validar |
| Insumos | Distribuição de atividades conforme etapas do processo | A validar |
| Canceladas | Consulta e encaminhamento; reativação depende de regra específica | A validar |
| DRP e Distribuição / Base GRADE | Acompanhamento; edição somente se expressamente autorizada | A validar |

A permissão para delegar não concede automaticamente autorização para editar todos os campos, alterar status, validar, cancelar, reabrir ou concluir uma demanda. Cada ação deve ser autorizada separadamente.

**Regras de controle:** a delegação não altera o autor original da OM nem permite que o Supervisor se passe pelo operador. O sistema deve registrar o UID do Supervisor que delegou, o UID do operador designado, data/hora do servidor, módulo, OM, ação e motivo quando exigido. O operador designado continua responsável por registrar suas próprias ações com sua conta.

O Supervisor só pode delegar para pessoas ativas, habilitadas no módulo e autorizadas para aquela atividade. Não pode atribuir uma demanda a uma conta bloqueada ou conceder permissão por meio da própria delegação.

## 4. Acompanhamento da operação

- Consulte a Visão geral para acompanhar os indicadores disponíveis.
- Utilize os filtros de data e módulo para analisar o período correto.
- Acompanhe pendências, divergências e demandas prioritárias.
- Consulte Ao Vivo para entender a sequência de atividades recentes.
- Verifique o registro original antes de concluir que existe erro.

Indicadores são instrumentos de acompanhamento. Antes de tomar uma decisão, considere a regra de cálculo, o período e a qualidade dos dados apresentados.

## 5. Auditoria e rastreabilidade

Quando precisar esclarecer uma alteração:
1. Localize o registro ou OM.
2. Consulte o evento, horário, autor e descrição disponíveis ao seu perfil.
3. Compare com o contexto operacional.
4. Encaminhe a divergência ao responsável pela correção.
5. Preserve os registros e evidências.

A consulta deve ter finalidade operacional legítima. Não utilize a auditoria para monitorar pessoas fora do escopo de trabalho.

## 6. Solicitações ao ADM

Encaminhe ao ADM solicitações de:
- Criação ou bloqueio de conta.
- Redefinição de senha.
- Mudança de perfil ou permissão.
- Ajuste de configuração global.

A solicitação deve informar a necessidade operacional e, quando aplicável, a aprovação da liderança. Não solicite que o ADM compartilhe credenciais de terceiros.

## 7. Incidentes e falhas

Se identificar atividade não reconhecida, exposição de dados ou suspeita de acesso indevido:
1. Não tente contornar o controle nem investigar usando outra conta.
2. Preserve as informações mínimas necessárias, sem divulgar dados em canais abertos.
3. Comunique imediatamente o canal interno definido e o responsável técnico.
4. Siga o procedimento de incidente.

## 8. Checklist de acompanhamento

- [ ] Consultei o período e os filtros corretos.
- [ ] Analisei os indicadores considerando seus critérios.
- [ ] Encaminhei divergências ao responsável correto.
- [ ] Não alterei dados ou permissões fora do meu escopo.
- [ ] Protegi as informações consultadas.
- [ ] Encerrei minha sessão.

## 9. Limites deste manual

As permissões reais dependem da matriz aprovada e da implementação efetiva no backend e no Firestore. Este manual não concede acesso por si só. Se uma tela permitir ação incompatível com o perfil, interrompa o uso e comunique o responsável técnico.
