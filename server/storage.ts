import { db } from "./db";
import { 
  botSessions, 
  playerInteractions, 
  serverStatus, 
  botStats, 
  usernameHistory,
  type BotSession,
  type InsertBotSession,
  type PlayerInteraction,
  type InsertPlayerInteraction,
  type ServerStatus,
  type InsertServerStatus,
  type BotStats,
  type InsertBotStats,
  type UsernameHistory,
  type InsertUsernameHistory
} from "../shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Bot Session Management
  createBotSession(data: InsertBotSession): Promise<BotSession>;
  updateBotSession(id: number, data: Partial<InsertBotSession>): Promise<BotSession>;
  getCurrentSession(): Promise<BotSession | null>;
  endCurrentSession(reason?: string): Promise<void>;
  
  // Player Interactions
  logPlayerInteraction(data: InsertPlayerInteraction): Promise<PlayerInteraction>;
  getRecentInteractions(limit?: number): Promise<PlayerInteraction[]>;
  
  // Server Status
  updateServerStatus(data: InsertServerStatus): Promise<ServerStatus>;
  getServerStatus(host: string, port: number): Promise<ServerStatus | null>;
  
  // Bot Statistics
  updateBotStats(sessionId: number, data: Partial<InsertBotStats>): Promise<BotStats>;
  getBotStats(sessionId: number): Promise<BotStats | null>;
  
  // Username History
  logUsernameUsage(data: InsertUsernameHistory): Promise<UsernameHistory>;
  checkUsernameHistory(username: string, host: string, port: number): Promise<UsernameHistory | null>;
  getBannedUsernames(host: string, port: number): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  private currentSessionId: number | null = null;

  async createBotSession(data: InsertBotSession): Promise<BotSession> {
    const [session] = await db
      .insert(botSessions)
      .values(data)
      .returning();
    
    this.currentSessionId = session.id;
    return session;
  }

  async updateBotSession(id: number, data: Partial<InsertBotSession>): Promise<BotSession> {
    const [session] = await db
      .update(botSessions)
      .set({ ...data, endTime: data.endTime || new Date() })
      .where(eq(botSessions.id, id))
      .returning();
    
    return session;
  }

  async getCurrentSession(): Promise<BotSession | null> {
    if (!this.currentSessionId) return null;
    
    const [session] = await db
      .select()
      .from(botSessions)
      .where(eq(botSessions.id, this.currentSessionId));
    
    return session || null;
  }

  async endCurrentSession(reason?: string): Promise<void> {
    if (!this.currentSessionId) return;
    
    await db
      .update(botSessions)
      .set({ 
        endTime: new Date(), 
        isActive: false,
        disconnectReason: reason 
      })
      .where(eq(botSessions.id, this.currentSessionId));
    
    this.currentSessionId = null;
  }

  async logPlayerInteraction(data: InsertPlayerInteraction): Promise<PlayerInteraction> {
    const [interaction] = await db
      .insert(playerInteractions)
      .values({
        ...data,
        sessionId: data.sessionId || this.currentSessionId
      })
      .returning();
    
    return interaction;
  }

  async getRecentInteractions(limit: number = 50): Promise<PlayerInteraction[]> {
    return await db
      .select()
      .from(playerInteractions)
      .orderBy(desc(playerInteractions.timestamp))
      .limit(limit);
  }

  async updateServerStatus(data: InsertServerStatus): Promise<ServerStatus> {
    // First try to update existing record
    const existing = await this.getServerStatus(data.serverHost, data.serverPort);
    
    if (existing) {
      const [updated] = await db
        .update(serverStatus)
        .set({ ...data, lastChecked: new Date() })
        .where(and(
          eq(serverStatus.serverHost, data.serverHost),
          eq(serverStatus.serverPort, data.serverPort)
        ))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(serverStatus)
        .values(data)
        .returning();
      
      return created;
    }
  }

  async getServerStatus(host: string, port: number): Promise<ServerStatus | null> {
    const [status] = await db
      .select()
      .from(serverStatus)
      .where(and(
        eq(serverStatus.serverHost, host),
        eq(serverStatus.serverPort, port)
      ))
      .orderBy(desc(serverStatus.lastChecked))
      .limit(1);
    
    return status || null;
  }

  async updateBotStats(sessionId: number, data: Partial<InsertBotStats>): Promise<BotStats> {
    // First try to get existing stats
    const existing = await this.getBotStats(sessionId);
    
    if (existing) {
      const [updated] = await db
        .update(botStats)
        .set({ ...data, lastUpdated: new Date() })
        .where(eq(botStats.sessionId, sessionId))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(botStats)
        .values({ ...data, sessionId })
        .returning();
      
      return created;
    }
  }

  async getBotStats(sessionId: number): Promise<BotStats | null> {
    const [stats] = await db
      .select()
      .from(botStats)
      .where(eq(botStats.sessionId, sessionId));
    
    return stats || null;
  }

  async logUsernameUsage(data: InsertUsernameHistory): Promise<UsernameHistory> {
    const [history] = await db
      .insert(usernameHistory)
      .values(data)
      .returning();
    
    return history;
  }

  async checkUsernameHistory(username: string, host: string, port: number): Promise<UsernameHistory | null> {
    const [history] = await db
      .select()
      .from(usernameHistory)
      .where(and(
        eq(usernameHistory.username, username),
        eq(usernameHistory.serverHost, host),
        eq(usernameHistory.serverPort, port)
      ))
      .orderBy(desc(usernameHistory.usedAt))
      .limit(1);
    
    return history || null;
  }

  async getBannedUsernames(host: string, port: number): Promise<string[]> {
    const banned = await db
      .select()
      .from(usernameHistory)
      .where(and(
        eq(usernameHistory.serverHost, host),
        eq(usernameHistory.serverPort, port),
        eq(usernameHistory.wasBanned, true)
      ));
    
    return banned.map(record => record.username);
  }
}

export const storage = new DatabaseStorage();