import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Bot sessions table - track bot connections and activities
export const botSessions = pgTable('bot_sessions', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  serverHost: varchar('server_host', { length: 255 }).notNull(),
  serverPort: integer('server_port').notNull(),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  isActive: boolean('is_active').default(true).notNull(),
  reconnectAttempts: integer('reconnect_attempts').default(0).notNull(),
  disconnectReason: varchar('disconnect_reason', { length: 100 }),
  position: jsonb('position'), // Store x, y, z coordinates
});

// Player interactions table - track chat messages and commands
export const playerInteractions = pgTable('player_interactions', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => botSessions.id),
  playerName: varchar('player_name', { length: 50 }).notNull(),
  messageType: varchar('message_type', { length: 20 }).notNull(), // 'chat', 'command', 'join', 'leave'
  message: text('message'),
  botResponse: text('bot_response'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Server status tracking
export const serverStatus = pgTable('server_status', {
  id: serial('id').primaryKey(),
  serverHost: varchar('server_host', { length: 255 }).notNull(),
  serverPort: integer('server_port').notNull(),
  isOnline: boolean('is_online').notNull(),
  playerCount: integer('player_count').default(0),
  lastChecked: timestamp('last_checked').defaultNow().notNull(),
  errorMessage: text('error_message'),
});

// Bot statistics
export const botStats = pgTable('bot_stats', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => botSessions.id),
  totalChatMessages: integer('total_chat_messages').default(0),
  totalPlayersInteracted: integer('total_players_interacted').default(0),
  totalBlocksBroken: integer('total_blocks_broken').default(0),
  totalItemsCrafted: integer('total_items_crafted').default(0),
  uptime: integer('uptime').default(0), // in seconds
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// Username history for ban evasion tracking
export const usernameHistory = pgTable('username_history', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  serverHost: varchar('server_host', { length: 255 }).notNull(),
  serverPort: integer('server_port').notNull(),
  wasBanned: boolean('was_banned').default(false),
  banReason: text('ban_reason'),
  usedAt: timestamp('used_at').defaultNow().notNull(),
});

// Relations
export const botSessionsRelations = relations(botSessions, ({ many }) => ({
  interactions: many(playerInteractions),
  stats: many(botStats),
}));

export const playerInteractionsRelations = relations(playerInteractions, ({ one }) => ({
  session: one(botSessions, {
    fields: [playerInteractions.sessionId],
    references: [botSessions.id],
  }),
}));

export const botStatsRelations = relations(botStats, ({ one }) => ({
  session: one(botSessions, {
    fields: [botStats.sessionId],
    references: [botSessions.id],
  }),
}));

// Type exports
export type BotSession = typeof botSessions.$inferSelect;
export type InsertBotSession = typeof botSessions.$inferInsert;
export type PlayerInteraction = typeof playerInteractions.$inferSelect;
export type InsertPlayerInteraction = typeof playerInteractions.$inferInsert;
export type ServerStatus = typeof serverStatus.$inferSelect;
export type InsertServerStatus = typeof serverStatus.$inferInsert;
export type BotStats = typeof botStats.$inferSelect;
export type InsertBotStats = typeof botStats.$inferInsert;
export type UsernameHistory = typeof usernameHistory.$inferSelect;
export type InsertUsernameHistory = typeof usernameHistory.$inferInsert;