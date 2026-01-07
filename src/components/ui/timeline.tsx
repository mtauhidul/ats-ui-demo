import * as React from "react";
import { cn } from "@/lib/utils";

type TimelineProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "vertical" | "horizontal";
  vertItemSpacing?: number;
};

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, orientation = "vertical", vertItemSpacing = 130, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative",
          orientation === "vertical" && "flex flex-col",
          className
        )}
        style={
          orientation === "vertical"
            ? { gap: `${vertItemSpacing}px` }
            : undefined
        }
        {...props}
      >
        {orientation === "vertical" && (
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
        )}
        {children}
      </div>
    );
  }
);
Timeline.displayName = "Timeline";

type TimelineItemProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline";
};

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const dotColors = {
      default: "bg-primary border-primary",
      secondary: "bg-secondary border-secondary",
      destructive: "bg-destructive border-destructive",
      outline: "bg-background border-primary",
    };

    return (
      <div ref={ref} className={cn("relative flex gap-6", className)} {...props}>
        <div className="relative flex flex-col items-center shrink-0">
          <div
            className={cn(
              "w-4 h-4 rounded-full border-2",
              dotColors[variant]
            )}
          />
        </div>
        <div className="flex-1 pb-8">
          {children}
        </div>
      </div>
    );
  }
);
TimelineItem.displayName = "TimelineItem";

const TimelineItemTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold text-foreground mb-2", className)}
    {...props}
  />
));
TimelineItemTitle.displayName = "TimelineItemTitle";

const TimelineItemDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
TimelineItemDescription.displayName = "TimelineItemDescription";

export { Timeline, TimelineItem, TimelineItemTitle, TimelineItemDescription };
