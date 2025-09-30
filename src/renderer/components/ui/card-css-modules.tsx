import * as React from "react";
import styles from "./card.module.css";
import { cn } from "shared/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive" | "bordered" | "flat" | "elevated";
  padding?: "sm" | "md" | "lg" | "none";
  loading?: boolean;
  error?: boolean;
  success?: boolean;
  warning?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      padding = "md",
      loading = false,
      error = false,
      success = false,
      warning = false,
      children,
      ...props
    },
    ref
  ) => {
    const cardClasses = cn(
      styles.card,
      {
        [styles.cardInteractive]: variant === "interactive",
        [styles.cardBordered]: variant === "bordered",
        [styles.cardFlat]: variant === "flat",
        [styles.cardElevated]: variant === "elevated",
        [styles.cardPaddingSm]: padding === "sm",
        [styles.cardPaddingLg]: padding === "lg",
        [styles.cardNoPadding]: padding === "none",
        [styles.cardLoading]: loading,
        [styles.cardError]: error,
        [styles.cardSuccess]: success,
        [styles.cardWarning]: warning,
      },
      className
    );

    return (
      <div className={cardClasses} ref={ref} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  withActions?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, withActions = false, children, ...props }, ref) => {
    const headerClasses = cn(
      styles.cardHeader,
      {
        [styles.cardHeaderWithActions]: withActions,
      },
      className
    );

    return (
      <div className={headerClasses} ref={ref} {...props}>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = "h3", children, ...props }, ref) => {
    return (
      <Component
        className={cn(styles.cardTitle, className)}
        ref={ref}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, children, ...props }, ref) => {
  return (
    <p className={cn(styles.cardDescription, className)} ref={ref} {...props}>
      {children}
    </p>
  );
});

CardDescription.displayName = "CardDescription";

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  withDivider?: boolean;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, withDivider = false, children, ...props }, ref) => {
    const contentClasses = cn(
      styles.cardContent,
      {
        [styles.cardWithDivider]: withDivider,
      },
      className
    );

    return (
      <div className={contentClasses} ref={ref} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn(styles.cardFooter, className)} ref={ref} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
