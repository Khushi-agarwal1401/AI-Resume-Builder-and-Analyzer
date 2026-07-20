import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "accent";
  size?: "sm" | "md" | "lg";
}

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-sm font-semibold text-body transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        "h-10 px-5",
        variant === "primary" && "bg-black text-white hover:bg-gray-900",
        variant === "accent" && "bg-accent-500 text-white hover:bg-accent-600",
        variant === "secondary" && "bg-white text-black border border-gray-300 hover:bg-gray-50",
        variant === "ghost" && "bg-transparent text-black hover:bg-gray-100",
        variant === "destructive" && "bg-white text-error border border-error hover:bg-red-50",
        size === "sm" && "h-8 px-3 text-small",
        size === "lg" && "h-12 px-6 text-body-lg",
        className
      )}
      {...props}
    />
  );
}
