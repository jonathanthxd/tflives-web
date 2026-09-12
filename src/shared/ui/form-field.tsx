import { cloneElement, isValidElement, useId, type ReactElement } from "react";
import { Label } from "@/shared/ui/label";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  description?: string;
  required?: boolean;
  optionalLabel?: string;
  children: React.ReactNode;
}

function FormField({ label, htmlFor, error, description, required, optionalLabel, children }: FormFieldProps) {
  const descriptionId = useId();
  const errorId = useId();
  const describedBy = [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  const field = isValidElement<{ "aria-describedby"?: string; "aria-invalid"?: boolean }>(children)
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string; "aria-invalid"?: boolean }>, {
        "aria-describedby": [children.props["aria-describedby"], describedBy].filter(Boolean).join(" ") || undefined,
        "aria-invalid": error ? true : children.props["aria-invalid"],
      })
    : children;

  return (
    <div>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
        {!required && optionalLabel && <span className="ml-1 font-normal text-muted-foreground">({optionalLabel})</span>}
      </Label>
      {field}
      {description && <p id={descriptionId} className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</p>}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export { FormField };
