import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("block text-sm font-medium text-muted-foreground mb-2", className)}
      {...props}
    />
  );
}

export { Label };
