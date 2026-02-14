import { useAccounts } from "@/hooks/use-accounts";
import { Sidebar } from "@/components/Sidebar";
import { StatsCard } from "@/components/StatsCard";
import { AccountCard } from "@/components/AccountCard";
import { CreateAccountModal } from "@/components/CreateAccountModal";
import { Zap, Shield, Trophy, Coins, Users, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { data: accounts, isLoading, error } = useAccounts();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-primary">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-destructive">
        Error loading dashboard: {error.message}
      </div>
    );
  }

  const runningCount = accounts?.filter(a => a.status === "running").length || 0;
  const captchaCount = accounts?.filter(a => a.status === "captcha").length || 0;
  const totalCaught = accounts?.reduce((acc, curr) => acc + curr.totalCaught, 0) || 0;
  const totalCoins = accounts?.reduce((acc, curr) => acc + curr.totalCoins, 0) || 0;

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-widest uppercase mb-1">Fleet Command</h1>
            <p className="text-muted-foreground text-sm font-mono">System Operational • {accounts?.length} Units Online</p>
          </div>
          <CreateAccountModal />
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatsCard 
            title="Active Units" 
            value={runningCount} 
            icon={<Zap className="w-6 h-6" />} 
            color="green" 
          />
          <StatsCard 
            title="Captcha Alerts" 
            value={captchaCount} 
            icon={<Shield className="w-6 h-6" />} 
            color={captchaCount > 0 ? "red" : "primary"}
            trend={captchaCount > 0 ? "ACTION REQ" : "SECURE"}
          />
          <StatsCard 
            title="Total Catches" 
            value={totalCaught.toLocaleString()} 
            icon={<Trophy className="w-6 h-6" />} 
            color="secondary" 
          />
          <StatsCard 
            title="Total Coins" 
            value={totalCoins.toLocaleString()} 
            icon={<Coins className="w-6 h-6" />} 
            color="accent" 
          />
        </div>

        {/* Accounts Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            DEPLOYED UNITS
          </h2>
        </div>

        {accounts?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
            <Users className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No Units Deployed</h3>
            <p className="text-muted-foreground mb-6">Initialize a new account to begin operations.</p>
            <CreateAccountModal />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
            {accounts?.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
