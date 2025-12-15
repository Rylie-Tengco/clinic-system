import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
  children: React.ReactNode;
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center justify-center rounded-full px-2 text-xs font-medium whitespace-nowrap",
        {
          "bg-blue-100 text-blue-800": variant === "default",
          "bg-gray-100 text-gray-800": variant === "secondary",
          "bg-green-100 text-green-800": variant === "success",
          "bg-yellow-100 text-yellow-800": variant === "warning",
          "bg-red-100 text-red-800": variant === "destructive",
          "border border-gray-300 bg-white text-gray-700": variant === "outline",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}