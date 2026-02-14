
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { botManager } from "./bot/manager";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // --- Accounts ---
  app.get(api.accounts.list.path, async (req, res) => {
    const accounts = await storage.getAccounts();
    res.json(accounts);
  });

  app.post(api.accounts.create.path, async (req, res) => {
    try {
      const input = api.accounts.create.input.parse(req.body);
      const account = await storage.createAccount(input);
      res.status(201).json(account);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.accounts.get.path, async (req, res) => {
    const account = await storage.getAccount(Number(req.params.id));
    if (!account) return res.status(404).json({ message: "Account not found" });
    res.json(account);
  });

  app.put(api.accounts.update.path, async (req, res) => {
    const id = Number(req.params.id);
    try {
      const input = api.accounts.update.input.parse(req.body);
      const account = await storage.updateAccount(id, input);
      
      // Update running bot config if active
      if (account.status === 'running') {
        botManager.updateConfig(id, account);
      }
      
      res.json(account);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(404).json({ message: "Account not found" });
    }
  });

  app.delete(api.accounts.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await botManager.stopBot(id); // Ensure stopped before delete
    await storage.deleteAccount(id);
    res.status(204).send();
  });

  // --- Actions ---
  app.post(api.accounts.start.path, async (req, res) => {
    const id = Number(req.params.id);
    const account = await storage.getAccount(id);
    if (!account) return res.status(404).json({ message: "Account not found" });

    try {
      await botManager.startBot(account);
      await storage.updateAccount(id, { status: "running" });
      res.json({ message: "Account started" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post(api.accounts.stop.path, async (req, res) => {
    const id = Number(req.params.id);
    await botManager.stopBot(id);
    await storage.updateAccount(id, { status: "stopped" });
    res.json({ message: "Account stopped" });
  });

  app.post(api.accounts.command.path, async (req, res) => {
    const id = Number(req.params.id);
    const { type, payload } = req.body;
    
    const success = await botManager.executeCommand(id, type, payload);
    if (success) {
      res.json({ message: "Command executed" });
    } else {
      res.status(400).json({ message: "Failed to execute command. Is the bot running?" });
    }
  });

  app.post(api.accounts.solveCaptcha.path, async (req, res) => {
     const id = Number(req.params.id);
     // In a real scenario, this would verify the solution or just unblock the bot
     await botManager.resumeAfterCaptcha(id);
     res.json({ message: "Resumed" });
  });

  // --- Logs ---
  app.get(api.logs.list.path, async (req, res) => {
    const accountId = req.query.accountId ? Number(req.query.accountId) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const logs = await storage.getLogs(accountId, limit);
    res.json(logs);
  });

  return httpServer;
}
