import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-5 h-5", className)}>
      {/* Outer Orbit (Teal) */}
      <div className="absolute inset-0 rounded-full border border-[#0d9488]/20 animate-[spin_2.5s_linear_infinite]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] h-[20%] bg-[#0d9488] rounded-full shadow-[0_0_4px_#0d9488]" />
      </div>
      
      {/* Inner Orbit (Violet) */}
      <div className="absolute inset-[25%] rounded-full border border-[#6366f1]/20 animate-[spin_1.5s_linear_infinite_reverse]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[25%] h-[25%] bg-[#6366f1] rounded-full shadow-[0_0_4px_#6366f1]" />
      </div>
    </div>
  );
}
