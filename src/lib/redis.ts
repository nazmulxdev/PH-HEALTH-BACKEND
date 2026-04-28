import { createClient, RedisClientType } from "redis";
import { config } from "../config/env";
import AppError from "../shared/AppError";

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    try {
      const redisUrl = config.REDIS_URL;
      this.client = createClient({ url: redisUrl });

      // Handle connection events

      this.client.on("error", (error) => {
        console.error("Redis Error:", error);
        this.isConnected = false;
      });
      this.client.on("connect", () => {
        this.isConnected = true;
        console.log("Redis connected");
      });

      this.client.on("ready", () => {
        this.isConnected = true;
        console.log("Redis ready");
      });

      this.client.on("reconnecting", () => {
        this.isConnected = false;
        console.log("Redis reconnecting");
      });
      this.client.on("end", () => {
        this.isConnected = false;
        console.log("Redis disconnected");
      });

      // Connect to redis
      await this.client.connect();
      this.isConnected = true;
      console.log("Redis connected successfully");
    } catch (error) {
      this.isConnected = false;
      console.error("Redis connection error:", error);
    }
  }

  // Ensure redis connection is established and client is ready
  private ensureConnection(): RedisClientType {
    if (!this.client) {
      throw new AppError(
        500,
        "Redis is not connected",
        "REDIS_CONNECTION_ERROR",
      );
    }

    if (!this.isConnected) {
      throw new AppError(500, "Redis is not ready to use", "REDIS_NOT_READY");
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    try {
      const client = this.ensureConnection();
      return await client.get(key);
    } catch (error) {
      console.error("Error getting data from Redis:", error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const client = this.ensureConnection();
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      await client.set(key, stringValue, ttl ? { EX: ttl } : undefined);
    } catch (error) {
      console.error("Error setting data in Redis:", error);
    }
  }

  async update(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const client = this.ensureConnection();
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      await client.set(key, stringValue, ttl ? { EX: ttl } : undefined);
    } catch (error) {
      console.error("Error updating data in Redis:", error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const client = this.ensureConnection();
      await client.del(key);
    } catch (error) {
      console.error("Error deleting data from Redis:", error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const client = this.ensureConnection();
      await client.ping();
      return true;
    } catch (error) {
      console.error("Error checking Redis availability:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        console.log("Redis disconnected");
      }
    } catch (error) {
      console.error("Error disconnecting from Redis:", error);
    }
  }
}

export const redisService = new RedisService();
