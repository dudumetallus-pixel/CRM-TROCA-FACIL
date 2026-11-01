# CRM Troca Fácil — implementação incremental

## Escopo aprovado

12 módulos operacionais + 13º módulo de inteligência de origens de leads.
Modo de IA: **híbrido**, com atendimento automático limitado, copiloto humano
e handoff para vendedor.

Interface proposta do vendedor: **Atender, Funil, Clientes, Retornos, Metas**.
Recursos avançados permanecem acessíveis somente na administração, preservando
rotas e permissões atuais até homologação.

## Ordem e critérios de aceite

1. **Fundação:** inventariar inbox, webhooks, deduplicação, workers, RLS,
   distribuição, funil e histórico. Nenhuma migração no banco de produção.
2. **Origem de leads:** preservar identificadores de referral da Meta e UTMs
   sem adivinhar campanhas; primeiro toque imutável depois de identificado,
   outros toques como eventos; vendas confirmadas somente pelo ERP.
3. **Copiloto + IA híbrida:** modelos com credencial validada, limites de custo,
   ferramentas autorizadas, respostas fundamentadas em estoque/avaliador e
   suspensão imediata da IA quando um humano assumir.
4. **Recuperação:** follow-up, agenda, prevenção de duplicatas e opt-out.
5. **Gestão:** conversão por campanha, por vendedor, receita e margem atribuída,
   sem atribuir automaticamente lucro na ausência de dado do ERP.
6. **Campanhas:** reativação com consentimento, templates aprovados e deduplicação
   de conversões para a Meta.

## Núcleo de atribuição adicionado

`lib/troca-facil/attribution.ts` contém funções puras de:
- extrair evidência Meta (`source_id`/`ctwa_clid`);
- normalizar UTMs;
- preservar primeira origem;
- impedir contar proposta como venda.

Ele **não grava no banco nem está ligado ao webhook ainda**. Antes de conectar,
é obrigatório localizar o fluxo canônico da mensagem entrante e o schema
existente de contatos/conversas/campanhas, evitando duplicar informações.

## Garantias para o desenvolvimento

- `main` estável; alterações na `develop`.
- Nunca inserir chaves de API nos arquivos do repositório.
- Backfill e migrações sempre aditivos/reversíveis e validados em homologação.
- Sem disparo automático de WhatsApp antes de testes de idempotência e handoff.
- Medir conversão com os mesmos denominadores por campanha e por vendedor.
