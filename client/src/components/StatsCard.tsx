import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: "primary" | "secondary" | "accent" | "green" | "red";
}

export function StatsCard({ title, value, icon, trend, color = "primary" }: StatsCardProps) {
  const colorStyles = {
    primary: "text-primary border-primary/30 bg-primary/10",
    secondary: "text-secondary border-secondary/30 bg-secondary/10",
    accent: "text-accent border-accent/30 bg-accent/10",
    green: "text-green-500 border-green-500/30 bg-green-500/10",
    red: "text-red-500 border-red-500/30 bg-red-500/10",
  };

  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:bg-white/5 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold font-data mt-1 text-white group-hover:scale-105 transition-transform origin-left">
            {value}
          </h3>
        </div>
        <div className={cn("p-3 rounded-lg border backdrop-blur-sm", colorStyles[color])}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center text-xs text-muted-foreground">
          <span className={cn("font-bold mr-2", color === "red" ? "text-red-400" : "text-green-400")}>
            {trend}
          </span>
          since last hour
        </div>
      )}
      
      {/* Decorative background glow */}
      <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-20", 
        color === "primary" ? "bg-primary" : 
        color === "secondary" ? "bg-secondary" : 
        color === "green" ? "bg-green-500" : 
        color === "red" ? "bg-red-500" : "bg-accent"
      )} />
    </div>
  );
}
