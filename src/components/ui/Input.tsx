import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-body font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "h-10 w-full rounded-sm border border-gray-300 bg-white px-3 text-body outline-none transition-all duration-200",
          "focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15",
          error && "border-error focus:border-error focus:ring-error/15",
          className
        )}
        {...props}
      />
      {error && <p className="text-small text-error">{error}</p>}
    </div>
  );
}
