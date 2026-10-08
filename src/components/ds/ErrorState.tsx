import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

export function ErrorState({
  title,
  message,
  onRetry,
  className,
}: {
  title: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("card flex flex-col items-center px-6 py-10 text-center", className)}>
      <TriangleAlert className="h-6 w-6 text-warning" aria-hidden="true" />
      <p className="mt-3 font-medium">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-secondary mt-5">
          Tentar de novo
        </button>
      )}
    </div>
  );
}
