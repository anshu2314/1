import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertAccount, type UpdateAccountRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// ============================================
// ACCOUNTS HOOKS
// ============================================

export function useAccounts() {
  return useQuery({
    queryKey: [api.accounts.list.path],
    queryFn: async () => {
      const res = await fetch(api.accounts.list.path);
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return api.accounts.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Poll every 5s for stats updates
  });
}

export function useAccount(id: number) {
  return useQuery({
    queryKey: [api.accounts.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.accounts.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch account");
      return api.accounts.get.responses[200].parse(await res.json());
    },
    refetchInterval: 2000, // Faster poll for individual detailed view
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertAccount) => {
      const res = await fetch(api.accounts.create.path, {
        method: api.accounts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.accounts.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create account");
      }
      return api.accounts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      toast({ title: "System Initialized", description: "New account unit deployed successfully.", className: "border-primary text-primary-foreground bg-black" });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Deployment Failed", description: err.message });
    }
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateAccountRequest) => {
      const url = buildUrl(api.accounts.update.path, { id });
      const res = await fetch(url, {
        method: api.accounts.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update account");
      return api.accounts.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      toast({ title: "Configuration Updated", description: "Account settings synchronized." });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.accounts.delete.path, { id });
      const res = await fetch(url, { method: api.accounts.delete.method });
      if (!res.ok) throw new Error("Failed to delete account");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      toast({ title: "Unit Terminated", description: "Account removed from fleet." });
    },
  });
}

// ============================================
// ACTION HOOKS (Start, Stop, Commands)
// ============================================

export function useStartAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.accounts.start.path, { id });
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start account");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      toast({ title: "Protocol Initiated", description: "Account is now running.", className: "border-green-500 text-green-500 bg-black" });
    },
  });
}

export function useStopAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.accounts.stop.path, { id });
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Failed to stop account");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      toast({ title: "Protocol Halted", description: "Account stopped.", variant: "destructive" });
    },
  });
}

export function useAccountCommand() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, type, payload }: { id: number; type: 'say' | 'market_buy' | 'click'; payload: string }) => {
      const url = buildUrl(api.accounts.command.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload }),
      });
      if (!res.ok) throw new Error("Command failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Command Sent", description: "Instruction executed successfully." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Transmission Error", description: "Failed to send command." });
    }
  });
}

export function useSolveCaptcha() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, solution }: { id: number; solution: string }) => {
      const url = buildUrl(api.accounts.solveCaptcha.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solution }),
      });
      if (!res.ok) throw new Error("Failed to submit solution");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      toast({ title: "Captcha Resolved", description: "Security check passed. Resuming operations." });
    },
  });
}
