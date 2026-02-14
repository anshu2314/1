import { Link, useLocation } from "wouter";
import { LayoutDashboard, Activity, ShieldAlert, Bot, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Fleet Dashboard", icon: LayoutDashboard },
    { href: "/activity", label: "System Logs", icon: Activity },
    { href: "/captcha", label: "Captcha Center", icon: ShieldAlert },
  ];

  return (
    <div className="w-64 h-screen bg-card/50 backdrop-blur-xl border-r border-white/10 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-white">POKÉBOT</h1>
            <p className="text-xs text-primary font-mono tracking-widest">V2.0.77</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 group",
                  isActive 
                    ? "bg-primary/20 border border-primary/30 text-white shadow-[0_0_10px_rgba(124,58,237,0.2)]" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "group-hover:text-white")} />
                <span className="font-medium tracking-wide">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_#7c3aed]" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="bg-black/40 rounded-lg p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-secondary" />
            <span className="text-xs font-mono text-secondary">SYSTEM STATUS</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground font-data">
              <span>CPU</span>
              <span className="text-white">12%</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="h-full bg-secondary w-[12%]" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground font-data">
              <span>MEMORY</span>
              <span className="text-white">45%</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[45%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
