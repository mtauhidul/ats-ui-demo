import type React from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { GridPattern } from "@/components/ui/grid-pattern";

type PlatformModuleType = {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  href: string;
  color: string;
};

type PlatformModuleCardProps = React.ComponentProps<"div"> & {
  module: PlatformModuleType;
};

export function PlatformModuleCard({
  module,
  className,
}: PlatformModuleCardProps) {
  return (
    <Link
      to={module.href}
      className={cn(
        "group relative overflow-hidden bg-background",
        "border rounded-lg transition-colors duration-200",
        "hover:border-foreground/20",
        "p-6",
        className
      )}
    >
      {/* Subtle grid pattern background */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <GridPattern
          className="absolute inset-0 h-full w-full stroke-foreground/5"
          height={32}
          width={32}
          x={0}
          y={0}
        />
      </div>
      
      {/* Icon - cleaner presentation */}
      <div className="relative mb-6">
        <module.icon
          aria-hidden
          className="size-7"
          style={{ color: module.color }}
          strokeWidth={1.5}
        />
      </div>
      
      <h3 className="text-base font-semibold text-foreground mb-2.5">
        {module.title}
      </h3>
      
      <p className="text-sm text-muted-foreground leading-relaxed font-light">
        {module.description}
      </p>
    </Link>
  );
}
