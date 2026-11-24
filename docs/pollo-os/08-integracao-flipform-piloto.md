# Flip OS — primeira integração real com FlipForm

## O que este PR habilita
1. Em **Apps → FlipForm → Ver detalhes**, proprietário da organização vê um campo seguro para a chave de diagnóstico `ffv1...`.
2. Somente a rota autenticada do servidor valida `GET https://app.flipform.com.br/api/v1/capabilities` por HTTPS sem seguir redirecionamentos.
3. O servidor extrai `tenantId` e `integrationId` **da credencial verificada**, não de um campo enviado pelo cliente.
4. Segredo cifrado AES-256-GCM, nonce aleatório, chave independente `FLIP_OS_CREDENTIAL_ENCRYPTION_KEY` (32 bytes base64) e AAD vinculada à organização.
5. Salvo por organização autenticada; o mesmo tenant remoto não pode ser vinculado a duas organizações do Flip OS. Apenas `owner` acessa teste, conexão e desconexão.
6. Exibe identidade remota, status e data de teste, nunca o segredo. Desconexão remove a cópia local mas **não revoga a chave no FlipForm**.

## Implantação (controle de mudança)
- Em Vercel, definir `FLIP_OS_CREDENTIAL_ENCRYPTION_KEY` como segredo **somente server-side** no projeto do Flip OS. NUNCA utilizar `NEXT_PUBLIC_`, logs ou colar a chave de API no ChatGPT. Não trocar a chave de criptografia sem procedimento de recriptografia das credenciais existentes.
- Aplicar `web/drizzle/0003_external_connections.sql` na instância Neon **do Flip OS**, não no banco do FlipForm. O processo normal do projeto é `npm run db:migrate` com o endereço não-pooled.
- Fazer deploy do código com os checks da branch aprovados; primeiro teste somente com organização interna e chave `integrations.read`, ainda dentro da janela do grant.
- No FlipForm: criar e ativar integração `Flip OS`, emitir **Chave de diagnóstico**. No Flip OS: abrir Apps → FlipForm e usar **Conectar e testar**. Não compartilhar chave por chat.
- Clicar **Testar conexão** e confirmar que `tenantId` corresponde ao tenant piloto autorizado no FlipForm. Em caso de expiração/revogação, emitir nova chave no FlipForm e usar fluxo de atualização a implementar, ou desconectar e reconectar com nova chave.

## Limitações explícitas
- Esta primeira etapa **somente confirma identidade M2M**. A chave de diagnóstico tem escopo `integrations.read` e não autoriza consultas de pipelines, formulários ou dados de leads.
- Leitura de dados no Pollo CEO, múltiplos escopos e rotação de credenciais exigem a próxima etapa do conector; não exibir dados fictícios nem declarar esse recurso como ativo.
- Não há conexão automática por nome da integração: exige autenticação real e consentimento da organização.
- Qualquer novo sistema deverá reutilizar a estrutura `external_connections`, mas com adaptador e validações específicos.
