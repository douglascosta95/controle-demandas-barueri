# Manual do Administrador (ADM)

**Público:** pessoas formalmente autorizadas a administrar o Controle Operacional de Demandas.  
**Status:** escopo inicial; revisar telas e nomes de botões após a implementação do painel administrativo.

## 1. Responsabilidade do ADM

O Administrador mantém os acessos e as configurações autorizadas do sistema. Deve proteger as credenciais, conceder somente as permissões necessárias e preservar a rastreabilidade.

O perfil ADM não deve:
- Compartilhar sua conta.
- Utilizar a conta de um operador para executar tarefas.
- Consultar ou solicitar a senha pessoal de outra pessoa.
- Apagar ou alterar a trilha de auditoria para ocultar uma ação.
- Conceder permissões sem justificativa operacional.
- Usar dados reais em testes sem autorização.

## 2. Primeiro acesso

1. Acesse o endereço oficial divulgado pela liderança.
2. Entre com o usuário e a senha temporária fornecidos pelo responsável pelo provisionamento inicial.
3. Troque a senha temporária imediatamente.
4. Confirme que o nome/perfil exibido corresponde à sua conta.
5. Encerre a sessão ao terminar, especialmente em computador compartilhado.

O provisionamento do primeiro ADM deverá ocorrer por procedimento técnico seguro, fora do código-fonte. Não deve existir usuário/senha administrativa fixa em `index.html`.

## 3. Administração de usuários — fluxo planejado

### Criar usuário
1. Abra o painel de Administração/Usuários.
2. Selecione **Novo usuário**.
3. Informe o identificador de usuário e o nome de exibição necessários à operação.
4. Escolha o perfil e as permissões aprovadas pela liderança.
5. Gere uma senha temporária individual.
6. Entregue a credencial diretamente ao colaborador por canal apropriado, sem publicá-la em grupos ou planilhas.
7. Oriente a pessoa a trocar a senha no primeiro acesso.
8. Confirme que a conta foi criada e registre a finalidade do acesso.

Não reutilize senha temporária entre pessoas.

### Redefinir senha
1. Localize a conta correta.
2. Confirme a identidade da pessoa por procedimento interno.
3. Acione **Redefinir senha**.
4. Entregue a nova senha temporária diretamente ao titular.
5. Oriente a troca obrigatória no próximo acesso.
6. Se houver suspeita de comprometimento, solicite revogação das sessões existentes.

O ADM não visualiza a senha antiga nem escolhe uma senha permanente para o usuário.

### Bloquear ou reativar conta
- Bloqueie contas quando houver desligamento, afastamento que exija suspensão, perda de autorização ou suspeita de comprometimento.
- Não exclua a conta apenas para impedir o acesso: o histórico precisa continuar associado ao UID original.
- Reative somente após confirmação de autorização.
- Registre o motivo conforme procedimento interno.

### Alterar perfil ou permissões
- Conceda o menor conjunto de permissões necessário.
- Confirme a aprovação do responsável pela operação.
- Revise permissões periodicamente e após mudança de função.
- Não transforme uma conta em ADM apenas para resolver uma dificuldade pontual.

## 4. Rotinas de acompanhamento

- Conferir usuários ativos e acessos administrativos.
- Revisar cadastros de equipe e operadores.
- Acompanhar alertas, falhas de sincronização e registros inconsistentes.
- Consultar auditoria quando houver dúvida sobre uma alteração.
- Solicitar suporte técnico para problemas de infraestrutura, autenticação ou dados.
- Verificar se os procedimentos e manuais continuam atualizados.

## 5. Auditoria

Ao investigar uma ocorrência:
1. Identifique o registro ou OM afetado.
2. Consulte data, horário, autor autenticado e ação registrada.
3. Compare o histórico disponível.
4. Registre a conclusão e encaminhe para o responsável.
5. Não altere ou remova evidências.

A auditoria é uma ferramenta de rastreabilidade, não um mecanismo para vigiar pessoas fora da finalidade operacional.

## 6. Rotinas operacionais que o ADM também pode executar

Quando necessário e autorizado, o ADM poderá utilizar os módulos operacionais seguindo o Manual do Operador. A conta administrativa deve continuar identificada como ADM; não se deve registrar a ação como se fosse feita por outra pessoa.

## 7. Resposta a incidentes

Em caso de senha exposta, conta suspeita ou acesso indevido:
1. Não tente investigar usando a conta de outra pessoa.
2. Bloqueie a conta afetada, se tiver autorização e se o controle estiver disponível.
3. Preserve horários, identificadores e mensagens de erro relevantes.
4. Avise imediatamente o responsável técnico e o canal interno definido.
5. Não publique prints com dados pessoais ou tokens em grupos abertos.
6. Siga o procedimento interno de incidente e aguarde orientação para reativação.

## 8. Checklist diário do ADM

- [ ] Minha conta está protegida e não foi compartilhada.
- [ ] Não há usuários ativos sem necessidade conhecida.
- [ ] Solicitações de acesso foram aprovadas.
- [ ] Contas que precisam ser bloqueadas foram tratadas.
- [ ] Ocorrências e falhas relevantes foram encaminhadas.
- [ ] Não há senhas ou dados sensíveis expostos em arquivos ou mensagens.
- [ ] Encerrei minha sessão ao finalizar o uso.

## 9. Pontos ainda dependentes de implementação

O painel de usuários, os fluxos de redefinição, bloqueio, gestão de permissões e auditoria administrativa são requisitos planejados. Este manual descreve o procedimento esperado; os passos de tela deverão ser atualizados depois que a interface estiver pronta e testada.
