import { useAccounts, useSolveCaptcha } from "@/hooks/use-accounts";
import { Sidebar } from "@/components/Sidebar";
import { ShieldAlert, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Captcha() {
  const { data: accounts, isLoading } = useAccounts();
  const solve = useSolveCaptcha();
  const [solutions, setSolutions] = useState<Record<number, string>>({});

  const captchaAccounts = accounts?.filter(a => a.status === "captcha") || [];

  const handleSolve = (id: number) => {
    // We send an empty solution string to just "resume" if it's external, 
    // or the actual text if we implemented a manual input.
    // For this flow, let's assume user solved it in browser and clicks "I solved it"
    solve.mutate({ id, solution: "manual_resume" });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-widest uppercase mb-1 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            Security Center
          </h1>
          <p className="text-muted-foreground text-sm font-mono">
            {captchaAccounts.length} Units currently compromised by security checks.
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : captchaAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] glass-panel rounded-xl border border-green-500/20 bg-green-500/5">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">ALL SYSTEMS SECURE</h2>
            <p className="text-green-400/80">No active captcha challenges detected across the fleet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {captchaAccounts.map(account => (
              <div key={account.id} className="glass-panel p-6 rounded-xl border border-red-500/30 bg-red-500/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{account.name}</h3>
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Action Required: Solve Captcha
                    </p>
                  </div>

                  <div className="flex gap-4 items-center">
                    {account.captchaUrl ? (
                      <Button variant="outline" className="border-red-500/30 hover:bg-red-500/10 text-red-400" asChild>
                        <a href={account.captchaUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Verification Link
                        </a>
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Link not captured automatically</p>
                    )}

                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                      onClick={() => handleSolve(account.id)}
                      disabled={solve.isPending}
                    >
                      {solve.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Mark as Solved & Resume
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
