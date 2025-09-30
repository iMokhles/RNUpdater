import * as React from "react";
import styles from "./button.module.css";
import { cn } from "shared/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "sm" | "md" | "lg" | "xl" | "icon";
  asChild?: boolean;
  loading?: boolean;
  iconOnly?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      asChild = false,
      loading = false,
      iconOnly = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Build CSS class names
    const buttonClasses = cn(
      styles.button,
      {
        [styles.buttonDefault]: variant === "default",
        [styles.buttonDestructive]: variant === "destructive",
        [styles.buttonOutline]: variant === "outline",
        [styles.buttonSecondary]: variant === "secondary",
        [styles.buttonGhost]: variant === "ghost",
        [styles.buttonLink]: variant === "link",
        [styles.buttonSm]: size === "sm",
        [styles.buttonMd]: size === "md",
        [styles.buttonLg]: size === "lg",
        [styles.buttonXl]: size === "xl",
        [styles.buttonIconOnly]: iconOnly || size === "icon",
        [styles.buttonLoading]: loading,
        [styles.buttonWithIcon]: React.Children.count(children) > 1,
      },
      className
    );

    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <div className={styles.buttonRipple} />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
