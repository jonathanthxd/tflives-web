import { cn } from "@/shared/utilities/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "tfl-glass tfl-glass-soft rounded-2xl border text-card-foreground",
        className
      )}
      {...props}
    />
  );
}

export { Card };
