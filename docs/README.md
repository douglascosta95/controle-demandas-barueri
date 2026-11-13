# Documentação — Controle Operacional de Demandas

**Projeto:** Controle Operacional de Demandas — CD Barueri/SP  
**Repositório:** `douglascosta95/controle-demandas-barueri`  
**Branch de trabalho:** `refactor/dashboard-navigation`

Esta pasta reúne a documentação técnica, os procedimentos operacionais, os manuais por perfil e o plano de treinamento.

## Documentos

1. [Visão geral e escopo do sistema](VISAO-GERAL-E-ESCOPO.md)
2. [Segurança, arquitetura e LGPD](SEGURANCA-ARQUITETURA-LGPD.md)
3. [Manual do Administrador](MANUAL-ADMINISTRADOR.md)
4. [Manual do Operador](MANUAL-OPERADOR.md)
5. [Plano de treinamento e capacitação](PLANO-DE-TREINAMENTO.md)

## Situação e controle de versão

A documentação diferencia:
- **Em uso / identificado no código:** funcionalidade localizada na versão analisada do projeto.
- **Planejado:** requisito acordado, ainda dependente de implementação ou validação.
- **A validar:** fluxo que precisa ser confirmado com usuários e testes no ambiente publicado.

Não considere uma funcionalidade planejada como disponível até que ela esteja implementada, testada e liberada.

## Regras para manter a documentação confiável

- Atualizar os documentos sempre que uma funcionalidade, permissão ou procedimento mudar.
- Registrar a versão do sistema à qual o treinamento e os manuais se referem.
- Não inserir senhas, tokens, chaves privadas, dados pessoais reais ou informações confidenciais nos documentos.
- Usar dados fictícios nos exemplos e treinamentos.
- Manter os documentos na mesma branch de desenvolvimento da funcionalidade correspondente e revisar antes da publicação.

## Princípios do projeto

1. Segurança e privacidade não podem ser enfraquecidas por novas funcionalidades.
2. Cada pessoa utiliza sua própria conta; credenciais não são compartilhadas.
3. Permissões são verificadas no servidor, não apenas escondidas na interface.
4. Ações relevantes devem gerar trilha de auditoria confiável.
5. Dados operacionais devem ser preservados durante mudanças e migrações.
6. O sistema deve coletar e expor somente os dados necessários à operação.
