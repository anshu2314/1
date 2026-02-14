import { useState } from "react";
import { type Account } from "@shared/schema";
import { useStartAccount, useStopAccount, useDeleteAccount, useAccountCommand } from "@/hooks/use-accounts";
import { Play, Square, Trash2, MessageSquare, ShoppingCart, Activity, AlertTriangle, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AccountCard({ account }: { account: Account }) {
  const start = useStartAccount();
  const stop = useStopAccount();
  const del = useDeleteAccount();
  const command = useAccountCommand();
  
  const [sayText, setSayText] = useState("");
  const [marketId, setMarketId] = useState(account.marketId || "");

  const handleSay = () => {
    if (!sayText) return;
    command.mutate({ id: account.id, type: "say", payload: sayText });
    setSayText("");
  };

  const handleBuy = () => {
    if (!marketId) return;
    command.mutate({ id: account.id, type: "market_buy", payload: marketId });
  };
  
  const handleClick = (btn: string) => {
    command.mutate({ id: account.id, type: "click", payload: btn });
  };

  const statusColor = 
    account.status === "running" ? "text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : 
    account.status === "captcha" ? "text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" :
    account.status === "resting" ? "text-yellow-500" :
    "text-muted-foreground";

  return (
    <div className="glass-panel rounded-xl border border-white/5 hover:border-primary/30 transition-all duration-300 relative overflow-hidden group">
      {/* Status Bar Top */}
      <div className={cn("h-1 w-full absolute top-0 left-0", 
        account.status === "running" ? "bg-green-500" : 
        account.status === "captcha" ? "bg-red-500 animate-pulse" : 
        "bg-gray-700"
      )} />

      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-white tracking-wide">{account.name}</h3>
              <Badge variant="outline" className={cn("uppercase text-[10px] tracking-widest bg-black/50 border-0", statusColor)}>
                {account.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">ID: {account.id.toString().padStart(4, '0')}</p>
          </div>
          
          <div className="flex gap-2">
            {account.status === "running" ? (
              <Button 
                size="icon" 
                variant="outline" 
                className="bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20 hover:text-red-400"
                onClick={() => stop.mutate(account.id)}
                disabled={stop.isPending}
              >
                <Square className="w-4 h-4 fill-current" />
              </Button>
            ) : (
              <Button 
                size="icon" 
                variant="outline" 
                className="bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20 hover:text-green-400"
                onClick={() => start.mutate(account.id)}
                disabled={start.isPending}
              >
                <Play className="w-4 h-4 fill-current" />
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-white/10 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Terminate Unit?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the account configuration and stats.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => del.mutate(account.id)} className="bg-red-600 hover:bg-red-700 text-white border-0">Terminate</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-black/30 p-2 rounded border border-white/5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Total</p>
            <p className="text-lg font-bold font-data text-white">{account.totalCaught}</p>
          </div>
          <div className="bg-black/30 p-2 rounded border border-white/5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Shiny</p>
            <p className="text-lg font-bold font-data text-yellow-400">{account.totalShiny}</p>
          </div>
          <div className="bg-black/30 p-2 rounded border border-white/5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Coins</p>
            <p className="text-lg font-bold font-data text-secondary">{account.totalCoins}</p>
          </div>
        </div>

        {/* Captcha Alert */}
        {account.status === "captcha" && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase">
              <AlertTriangle className="w-4 h-4" />
              Captcha Detected
            </div>
            {account.captchaUrl && (
              <a href={account.captchaUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline text-red-400 hover:text-red-300">
                Solve Now
              </a>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground hover:text-white border-white/10 bg-black/20">
                <MessageSquare className="w-3 h-3 mr-2" />
                Send Message / Command
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-card border-white/10 p-3">
              <div className="flex gap-2">
                <Input 
                  placeholder="Type message..." 
                  value={sayText}
                  onChange={(e) => setSayText(e.target.value)}
                  className="bg-black/50 border-white/10 h-8 text-xs"
                />
                <Button size="sm" className="h-8 bg-primary hover:bg-primary/80" onClick={handleSay}>Send</Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground hover:text-white border-white/10 bg-black/20">
                <ShoppingCart className="w-3 h-3 mr-2" />
                Market Buy
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-card border-white/10 p-3">
              <div className="flex gap-2">
                <Input 
                  placeholder="Market ID..." 
                  value={marketId}
                  onChange={(e) => setMarketId(e.target.value)}
                  className="bg-black/50 border-white/10 h-8 text-xs font-mono"
                />
                <Button size="sm" className="h-8 bg-secondary hover:bg-secondary/80 text-black" onClick={handleBuy}>Buy</Button>
              </div>
            </PopoverContent>
          </Popover>
          
           <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground hover:text-white border-white/10 bg-black/20">
                <MousePointerClick className="w-3 h-3 mr-2" />
                Click Button
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-card border-white/10 p-3">
              <div className="grid grid-cols-2 gap-2">
                 <Button size="sm" variant="outline" className="text-xs" onClick={() => handleClick("Confirm")}>Confirm</Button>
                 <Button size="sm" variant="outline" className="text-xs" onClick={() => handleClick("Battle")}>Battle</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
