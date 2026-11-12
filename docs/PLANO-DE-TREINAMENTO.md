# Plano de treinamento — Controle Operacional de Demandas

## 1. Objetivo

Capacitar Administradores e Operadores para utilizar o sistema com segurança, consistência e rastreabilidade. O treinamento deve combinar demonstração, prática supervisionada e verificação de aprendizagem.

**Público:** Administradores (ADM), Operadores e liderança operacional.  
**Formato sugerido:** presencial ou remoto com compartilhamento de tela, usando ambiente de teste e dados fictícios.  
**Pré-requisito:** sistema de treinamento estável, contas individuais de teste e manuais atualizados.

## 2. Trilhas por perfil

### Trilha A — Administrador

<text>**Carga horária sugerida: 3 horas**</text>

| Módulo | Conteúdo | Tempo |
|---|---|---:|
| A1 — Visão geral e responsabilidades | Objetivo, módulos, limites do ADM e responsabilidades | 20 min |
| A2 — Segurança e LGPD | Credenciais, mínimo privilégio, dados pessoais, incidentes | 35 min |
| A3 — Gestão de usuários | Criar conta, perfil, permissões, redefinir senha, bloquear/reativar | 45 min |
| A4 — Configurações e cadastros | Equipe, operadores, códigos SAP e controles de alteração | 25 min |
| A5 — Auditoria e Ao Vivo | Consultar eventos, identificar autoria e investigar divergências | 25 min |
| A6 — Continuidade e suporte | Falhas, sincronização, backups, escalonamento | 15 min |
| A7 — Avaliação prática | Executar cenário completo em ambiente de teste | 15 min |

**Competências esperadas do ADM**
- Administrar contas sem compartilhar ou visualizar senhas.
- Aplicar o menor privilégio necessário.
- Identificar uma ação pelo usuário autenticado e pela trilha de auditoria.
- Bloquear/redefinir acesso conforme procedimento.
- Reconhecer incidente e encaminhar corretamente.
- Entender que administração não autoriza apagar histórico.

### Trilha B — Operador

<text>**Carga horária sugerida: 2 horas e 30 minutos**</text>

| Módulo | Conteúdo | Tempo |
|---|---|---:|
| O1 — Acesso e navegação | Login individual, troca de senha, menus e perfil | 20 min |
| O2 — Demandas de aluguel | Máquinas, SIM Cards, Emergenciais e Canceladas | 35 min |
| O3 — Insumos | Consulta por data, importação e conferência | 35 min |
| O4 — Fracionamento e NF | Lote, regra AG x PA/Corner, conferência de totais | 25 min |
| O5 — Planejamento e Ao Vivo | DRP, GRADE, histórico e acompanhamento | 15 min |
| O6 — Segurança e avaliação | Dados, sessão, erros e exercício prático | 20 min |

**Competências esperadas do Operador**
- Entrar e sair com sua própria conta.
- Navegar pelos módulos liberados.
- Selecionar corretamente a data de referência.
- Registrar e conferir dados sem gerar duplicidade.
- Executar o fluxo de importação e fracionamento autorizado.
- Entender a regra de NF para Agência e PA/Corner.
- Reconhecer quando deve interromper e pedir ajuda.
- Proteger dados e credenciais.

### Trilha C — Supervisor

**Carga horária sugerida: 1 hora e 30 minutos**

| Módulo | Conteúdo | Tempo |
|---|---|---:|
| S1 — Visão geral | Indicadores, módulos e responsabilidades | 20 min |
| S2 — Acompanhamento | Pendências, divergências, Ao Vivo e histórico | 25 min |
| S3 — Auditoria e privacidade | Consulta responsável, limites de acesso e LGPD | 20 min |
| S4 — Escalonamento | Solicitações ao ADM, incidentes e contingência | 10 min |
| S5 — Avaliação prática | Cenário de acompanhamento e encaminhamento | 15 min |

**Competências esperadas do Supervisor**
- Acompanhar a operação sem executar administração de contas.
- Interpretar indicadores e eventos dentro da finalidade operacional.
- Identificar divergências e encaminhar correções ao responsável.
- Respeitar a privacidade e os limites de consulta.
- Escalonar incidentes sem tentar contornar controles.

### Trilha D — Liderança operacional (complementar)

**Carga horária sugerida: 60 minutos**
- Visão geral dos módulos e indicadores.
- Regras de negócio e responsabilidades.
- Acompanhamento de pendências, divergências e produtividade.
- Interpretação da auditoria sem extrapolar sua finalidade.
- Procedimento de escalonamento e contingência.
- Aprovação de acessos e revisão periódica de permissões.

## 3. Roteiro prático — Operador

Utilizar somente dados fictícios:
1. Entrar com usuário de treinamento e trocar senha temporária.
2. Abrir Visão geral e identificar os indicadores apresentados.
3. Consultar uma data específica no módulo de aluguel.
4. Localizar uma OM fictícia e conferir seus dados.
5. Registrar uma alteração permitida e confirmar o resultado.
6. Abrir Insumos e selecionar outra data.
7. Importar uma planilha de treinamento com registros de Agência e PA/Corner.
8. Conferir duplicidades e totais.
9. Executar fracionamento em lote e validar o total distribuído.
10. Identificar quais registros exigem solicitação de NF.
11. Consultar o painel Ao Vivo e localizar a ação recém-realizada.
12. Encerrar a sessão.

## 4. Roteiro prático — Administrador

1. Entrar com conta ADM de treinamento.
2. Criar um usuário fictício com perfil Operador.
3. Atribuir somente permissões necessárias.
4. Entregar senha temporária simulada e confirmar a exigência de troca.
5. Testar redefinição de senha.
6. Bloquear a conta e confirmar que o acesso deixa de funcionar.
7. Reativar a conta com autorização simulada.
8. Alterar uma permissão e validar o efeito.
9. Consultar auditoria e identificar UID, ação, horário e registro afetado.
10. Simular uma suspeita de acesso indevido e executar o fluxo de comunicação.

## 5. Avaliação e liberação

Recomenda-se uma avaliação simples, com nota mínima de 80% e execução correta dos itens críticos.

**Itens críticos — reprovação automática até nova orientação**
- Compartilhar credenciais ou usar a conta de outra pessoa.
- Tentar contornar controles de acesso.
- Importar/confirmar dados sem conferência.
- Apagar evidências ou alterar histórico para ocultar uma ação.
- Expor dados operacionais em canal não autorizado.
- Ignorar suspeita de acesso indevido.

A liberação de acesso deve ocorrer após:
1. Conclusão da trilha correspondente.
2. Aprovação na avaliação.
3. Confirmação de que o usuário recebeu as orientações de segurança.
4. Registro de conclusão do treinamento pela pessoa responsável.

## 6. Materiais de apoio

- Manual do Operador.
- Manual do Administrador.
- Ambiente de treinamento isolado.
- Planilha fictícia para importação de insumos.
- Lista de exercícios por módulo.
- Guia rápido de problemas comuns.
- Canal e responsáveis para suporte.

Não utilizar exportações reais, senhas reais ou dados pessoais reais nos exercícios.

## 7. Reciclagem

Realizar reciclagem:
- Quando houver mudança relevante no sistema.
- Quando um processo operacional for alterado.
- Após ocorrência que indique falha de procedimento.
- Periodicamente, conforme decisão da liderança.

Registrar data, versão do sistema, participantes, conteúdo e resultado da avaliação.

## 8. Indicadores de capacitação

- Percentual de usuários treinados por perfil.
- Percentual de aprovação na primeira tentativa.
- Quantidade de dúvidas/incidentes após a implantação.
- Erros de importação e retrabalho relacionados ao uso.
- Tempo médio até autonomia do novo usuário.

Os indicadores devem ser usados para melhorar treinamento e processo, não para avaliação individual fora da finalidade definida.

## 9. Pendências antes do treinamento oficial

- [ ] Confirmar todos os fluxos reais com a operação.
- [ ] Finalizar autenticação individual e perfis.
- [ ] Implementar painel administrativo.
- [ ] Validar regras de permissão em backend e Firestore.
- [ ] Preparar ambiente de teste isolado.
- [ ] Criar planilha de treinamento com dados fictícios.
- [ ] Capturar telas da versão efetivamente publicada.
- [ ] Definir responsáveis por ministrar e registrar o treinamento.
- [ ] Aprovar procedimentos de privacidade e suporte.
