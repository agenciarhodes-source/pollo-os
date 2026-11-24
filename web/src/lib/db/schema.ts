import { boolean, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/*
 * O banco do Pollo OS (PostgreSQL no Neon).
 *
 * As sete primeiras tabelas são as do login (Better Auth) e das empresas (plugin "organization"),
 * no formato que a biblioteca espera. As outras são do Pollo OS e TODAS têm organization_id:
 * toda leitura e escrita filtra por ele, para uma empresa nunca ver dados de outra.
 */

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ---------- Login ---------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ---------- Empresas ---------- */

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  createdAt: createdAt(),
});

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("member_org_user_idx").on(t.organizationId, t.userId)],
);

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
});

/* ---------- Pollo OS ---------- */

/** Um agente da empresa. O Pollo CEO não fica aqui: é o mesmo para toda empresa, definido no código. */
export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    purpose: text("purpose").notNull().default(""),
    /** estrategico | tatico | operacional */
    level: text("level").notNull().default("operacional"),
    model: text("model").notNull().default("equilibrado"),
    shape: text("shape").notNull(),
    color: text("color").notNull(),
    face: text("face").notNull(),
    mood: text("mood").notNull(),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("agents_org_idx").on(t.organizationId)],
);

/** Em quais apps cada agente pode trabalhar. */
export const agentAppAccess = pgTable(
  "agent_app_access",
  {
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    appId: text("app_id").notNull(),
    grantedBy: text("granted_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.agentId, t.appId] }), index("agent_app_access_org_idx").on(t.organizationId)],
);

/**
 * Uma conversa de uma pessoa com um agente. agent_key é o id de um agente da empresa ou
 * "pollo-ceo". Por enquanto, uma conversa por pessoa e agente.
 */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    agentKey: text("agent_key").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("conversations_org_user_agent_idx").on(t.organizationId, t.userId, t.agentKey)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    /** user | assistant */
    role: text("role").notNull(),
    text: text("text").notNull(),
    /** Resposta de demonstração, não gerada por IA. */
    demo: boolean("demo").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)],
);

/** O consumo de IA, por empresa, agente, serviço e modalidade. Fica vazio até a IA ser ligada. */
export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    agentKey: text("agent_key").notNull(),
    service: text("service").notNull(),
    /** texto | voz */
    modality: text("modality").notNull(),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    seconds: integer("seconds").notNull().default(0),
    /** Custo em milionésimos de dólar, para não perder centavos em somas. */
    costMicros: integer("cost_micros").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("usage_events_org_idx").on(t.organizationId, t.createdAt)],
);

/* ---------- Agenda: reuniões executivas com o Pollo CEO ---------- */

/**
 * Uma reunião executiva com o Pollo CEO. A agenda de vendas e atendimento fica no FlipForm;
 * esta é a da relação do empresário com a IA.
 * status: rascunho | agendada | em_andamento | concluida | cancelada
 */
export const executiveMeetings = pgTable(
  "executive_meetings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    agentKey: text("agent_key").notNull().default("pollo-ceo"),
    title: text("title").notNull(),
    agenda: text("agenda").notNull().default(""),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    timezone: text("timezone").notNull().default("America/Sao_Paulo"),
    status: text("status").notNull().default("rascunho"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("executive_meetings_org_start_idx").on(t.organizationId, t.startsAt)],
);

/** Quem pode ver e participar da reunião. Quem cria entra sempre. */
export const meetingParticipants = pgTable(
  "meeting_participants",
  {
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => executiveMeetings.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.meetingId, t.userId] }), index("meeting_participants_user_idx").on(t.organizationId, t.userId)],
);

/**
 * A ata da reunião. Enquanto não há IA, quem escreve é a pessoa. Só vale (e só pode entrar na
 * memória da empresa) depois de confirmada; confirmada, não muda mais.
 */
export const meetingMinutes = pgTable("meeting_minutes", {
  meetingId: uuid("meeting_id")
    .primaryKey()
    .references(() => executiveMeetings.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  summary: text("summary").notNull().default(""),
  /** [{ text }] */
  decisions: text("decisions").notNull().default("[]"),
  /** [{ text, owner, due }] */
  actionItems: text("action_items").notNull().default("[]"),
  openQuestions: text("open_questions").notNull().default(""),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  confirmedBy: text("confirmed_by").references(() => user.id, { onDelete: "set null" }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ---------- Segundo Cérebro: a memória da empresa ---------- */

/**
 * Um item da memória da empresa.
 * kind: nota | decisao | aprendizado | documento | fonte
 * visibility: empresa (todos da empresa veem) | privada (só quem criou)
 * As decisões que vêm de uma ata confirmada trazem a reunião de origem.
 */
export const memoryItems = pgTable(
  "memory_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("nota"),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    /** De onde veio, em texto legível (ex.: "Ata da reunião Revisão da semana, 23/11/2026"). */
    source: text("source").notNull().default(""),
    /** Endereço de um documento ou fonte externa. */
    url: text("url"),
    sourceMeetingId: uuid("source_meeting_id").references(() => executiveMeetings.id, { onDelete: "set null" }),
    visibility: text("visibility").notNull().default("empresa"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("memory_items_org_idx").on(t.organizationId, t.updatedAt)],
);

/** Uma ligação entre dois itens da memória (lida nos dois sentidos). */
export const memoryLinks = pgTable(
  "memory_links",
  {
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    fromId: uuid("from_id")
      .notNull()
      .references(() => memoryItems.id, { onDelete: "cascade" }),
    toId: uuid("to_id")
      .notNull()
      .references(() => memoryItems.id, { onDelete: "cascade" }),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.fromId, t.toId] })],
);

/* ---------- Atividade ---------- */

/**
 * O registro do que aconteceu no Pollo OS: quem fez, o quê e quando. Só se acrescenta; nunca se
 * edita. action: ex. "agente.criado", "reuniao.iniciada", "ata.confirmada", "memoria.criada".
 */
export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    /** Frase legível do que aconteceu. */
    summary: text("summary").notNull(),
    /** Só pessoas que podem ver o alvo veem o evento: empresa | privada (só o autor). */
    visibility: text("visibility").notNull().default("empresa"),
    createdAt: createdAt(),
  },
  (t) => [index("activity_events_org_idx").on(t.organizationId, t.createdAt)],
);


/**
 * Central connection registry. Each organization owns its credential;
 * the remote FlipForm tenant is derived from verified M2M identity, never user input.
 * Only diagnostic scope is supported by the first connector release.
 */
export const externalConnections = pgTable(
  "external_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id").notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    remoteTenantId: text("remote_tenant_id").notNull(),
    remoteIntegrationId: text("remote_integration_id").notNull(),
    encryptedCredential: text("encrypted_credential").notNull(),
    scope: text("scope").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("external_connections_org_provider_idx").on(t.organizationId, t.provider),
    uniqueIndex("external_connections_provider_tenant_idx").on(t.provider, t.remoteTenantId),
  ],
);

/** Scoped, encrypted READ credentials under a previously verified connection. */
export const externalConnectionKeys = pgTable(
  "external_connection_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    connectionId: uuid("connection_id").notNull()
      .references(() => externalConnections.id, { onDelete: "cascade" }),
    scope: text("scope").notNull(),
    /** Identity proved by the scoped bearer, not by the UI. */
    remoteIntegrationId: text("remote_integration_id").notNull(),
    encryptedCredential: text("encrypted_credential").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("external_connection_keys_conn_scope_idx").on(t.connectionId, t.scope)],
);
