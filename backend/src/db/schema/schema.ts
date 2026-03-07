import {
  pgTable,
  text,
  boolean,
  uuid,
  timestamp,
  unique,
  foreignKey,
} from 'drizzle-orm/pg-core';

export const userPreferences = pgTable(
  'user_preferences',
  {
    email: text('email').primaryKey(),
    acceptMessages: boolean('accept_messages').default(true).notNull(),
    showEmail: boolean('show_email').default(false).notNull(),
    showPhone: boolean('show_phone').default(false).notNull(),
    showCompany: boolean('show_company').default(true).notNull(),
    showTitle: boolean('show_title').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
);

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    participant1Email: text('participant1_email').notNull(),
    participant2Email: text('participant2_email').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('unique_participants').on(
      table.participant1Email,
      table.participant2Email
    ),
  ]
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderEmail: text('sender_email').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
);

export const userReports = pgTable(
  'user_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportingUserEmail: text('reporting_user_email').notNull(),
    reportedUserEmail: text('reported_user_email').notNull(),
    reason: text('reason').notNull(),
    notes: text('notes'),
    conversationId: uuid('conversation_id'),
    messageId: uuid('message_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    status: text('status').default('pending').notNull(),
  }
);

export const blockedUsers = pgTable(
  'blocked_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockerEmail: text('blocker_email').notNull(),
    blockedEmail: text('blocked_email').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('unique_blocker_blocked').on(table.blockerEmail, table.blockedEmail),
  ]
);
