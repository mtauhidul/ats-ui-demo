import { cn } from "@/lib/utils";

type Metric = {
  value: string;
  label: string;
  description: string;
};

type MetricsSectionProps = React.ComponentProps<"div"> & {
  metrics: Metric[];
};

export function MetricsSection({ metrics, className, ...props }: MetricsSectionProps) {
  return (
    <div className={cn("w-full py-12", className)} {...props}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Dark glass container */}
        <div 
          className="relative rounded-2xl overflow-hidden backdrop-blur-sm border"
          style={{
            backgroundColor: 'rgba(11, 15, 20, 0.6)',
            borderColor: 'rgba(20, 184, 166, 0.12)',
            boxShadow: `
              0 4px 24px -4px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.02)
            `,
          }}
        >
          {/* Ambient teal glow */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `
                radial-gradient(circle at 20% 50%, rgba(20, 184, 166, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)
              `
            }}
          />
          
          {/* Content */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/20">
            {metrics.map((metric) => (
              <div 
                key={metric.label}
                className="px-8 py-6 text-center group hover:bg-teal-500/5 transition-colors duration-300"
              >
                {/* Value */}
                <div 
                  className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent transition-all duration-300"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
                  }}
                >
                  {metric.value}
                </div>
                
                {/* Label */}
                <div className="text-sm font-medium text-gray-200 mb-1.5 tracking-wide">
                  {metric.label}
                </div>
                
                {/* Description */}
                <div className="text-xs text-gray-400/80 leading-relaxed max-w-[200px] mx-auto">
                  {metric.description}
                </div>
                
                {/* Decorative bottom accent */}
                <div 
                  className="mt-4 mx-auto w-12 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(90deg, transparent, #14b8a6, transparent)'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
