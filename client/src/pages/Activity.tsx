import { useLogs } from "@/hooks/use-logs";
import { Sidebar } from "@/components/Sidebar";
import { format } from "date-fns";
import { Terminal, AlertCircle, CheckCircle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Activity() {
  const { data: logs, isLoading } = useLogs(100);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "error": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeStyle = (type: string) => {
     switch (type) {
      case "error": return "border-l-red-500 bg-red-500/5";
      case "success": return "border-l-green-500 bg-green-500/5";
      case "warning": return "border-l-yellow-500 bg-yellow-500/5";
      default: return "border-l-blue-500 bg-blue-500/5";
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-widest uppercase mb-1 flex items-center gap-3">
            <Terminal className="w-8 h-8 text-primary" />
            System Logs
          </h1>
          <p className="text-muted-foreground text-sm font-mono">Live feed from all deployed units.</p>
        </header>

        <div className="glass-panel rounded-xl border border-white/10 overflow-hidden min-h-[600px] flex flex-col">
          <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
            <span className="text-xs font-mono text-muted-foreground uppercase">Console Output</span>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-2 font-mono text-sm">
            {logs?.map((log) => (
              <div 
                key={log.id} 
                className={cn(
                  "p-3 rounded border-l-2 flex gap-3 transition-opacity hover:opacity-100 opacity-90",
                  getTypeStyle(log.type)
                )}
              >
                <div className="mt-0.5">{getTypeIcon(log.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-muted-foreground opacity-70">
                      {log.timestamp ? format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss") : "-"}
                    </span>
                    {log.accountId && (
                      <span className="text-xs bg-white/10 px-1.5 rounded text-white/70">
                        Unit-{log.accountId}
                      </span>
                    )}
                  </div>
                  <p className="text-white/90 break-words">{log.content}</p>
                </div>
              </div>
            ))}
            
            {logs?.length === 0 && !isLoading && (
              <div className="text-center py-20 text-muted-foreground">
                No logs recorded yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
