# FlipForm → Flip OS — Etapa 2: leitura autorizada

A conexão de diagnóstico com a Agência Pollo já foi confirmada em 24/11/2026.
**Não substituir ou perder a chave de diagnóstico existente.**

## Pré-requisito obrigatório
Primeiro publicar no FlipForm o PR #639 (endpoint de introspecção de chaves de leitura).
O endpoint `GET /api/v1/credential-identity?scope=...` autentica a chave M2M e retorna
`tenantId`, `integrationId`, `scope`; o Flip OS rejeita se não coincidirem com
a conexão de diagnóstico já aprovada.

## Ativação
1. CI do Flip OS verde, código integrado e migração `web/drizzle/0004_external_connection_keys.sql`
   aplicada **somente** ao banco Neon do Flip OS; registrar migration no journal.
2. No FlipForm, proprietário da Agência Pollo → Integrações e API → integração
   `Flip OS` ativa: emitir **Chave de leitura de pipelines** e
   **Chave de leitura de formulários**. Máximo de 5 credenciais ativas por integração;
   não gerar outras sem necessidade.
3. No Flip OS, Apps → FlipForm → Ver detalhes → Consultas do FlipForm:
   selecionar cada recurso, colar a chave no campo protegido **dentro do aplicativo**,
   clicar Autorizar leitura.
4. Conferir que o mesmo tenant e integrationId foram comprovados pelo FlipForm.
   Clicar Consultar para apresentar a primeira página de registros. Quando zero
   registros, dizer explicitamente "nenhum registro ativo retornado", sem inventar dados.
5. Revogação: remover chave local no Flip OS e revogar a chave correspondente no FlipForm.

## Segurança e limitações
- Chaves AES-256-GCM criptografadas no Neon do Flip OS e ligadas à sua organização.
- A API só aceita caminhos fixos de leitura e retorna catálogo sanitizado, sem
  dados pessoais de leads, sem WhatsApp, documentos, e sem operações de escrita.
- A primeira versão mostra pipelines e formulários ao **proprietário** na tela de Apps.
- **O Pollo CEO ainda não consulta esses dados automaticamente.** A integração com
  a conversa será uma etapa separada, baseada nas permissões e na auditoria.
- A concessão piloto da Agência Pollo estava prevista para expirar em 30/11/2026;
  verificar renovação/aprovação antes do uso prolongado.
- A chave de leitura deve ser inserida apenas na interface HTTPS, nunca no GitHub
  ou nas conversas com assistentes.

## Troca da integração de diagnóstico
Cada chave de leitura armazena o `remoteIntegrationId` comprovado no cadastramento. Se a conexão de diagnóstico for alterada para outra integração dentro da mesma empresa, a consulta e o status só aceitam chaves cujo ID corresponda ao da conexão atual. As chaves antigas ficam inoperantes até que sejam substituídas; não são devolvidas ou usadas para consultas.
