import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../../shared/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    const [checked, setChecked] = React.useState(props.checked || false);

    // Sync internal state with prop changes
    React.useEffect(() => {
      setChecked(props.checked || false);
    }, [props.checked]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = event.target.checked;
      setChecked(newChecked);
      onCheckedChange?.(newChecked);
    };

    return (
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 border-2 border-input rounded-sm cursor-pointer transition-colors",
            "hover:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2",
            checked && "bg-primary border-primary text-primary-foreground",
            className
          )}
          onClick={() => {
            const newChecked = !checked;
            setChecked(newChecked);
            onCheckedChange?.(newChecked);
          }}
        >
          {checked && <Check className="h-3 w-3 absolute top-0.5 left-0.5" />}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
