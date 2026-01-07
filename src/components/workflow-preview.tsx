import { cn } from "@/lib/utils";

type WorkflowStage = {
  graphic: React.ComponentType<{ color: string; className?: string }>;
  title: string;
  description: string;
  highlight: string;
  color: string;
};

type WorkflowPreviewProps = React.ComponentProps<"div"> & {
  stages: WorkflowStage[];
};

export function WorkflowPreview({ stages, className, ...props }: WorkflowPreviewProps) {
  return (
    <div className={cn("relative max-w-5xl mx-auto py-8", className)} {...props}>
      {/* Vertical dotted spine */}
      <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2">
        <div className="h-full w-px border-l-2 border-dotted border-border/60" />
      </div>
      
      <div className="relative space-y-8">
        {stages.map((stage, index) => {
          const isLeft = index % 2 === 0;
          
          return (
            <div
              key={stage.title}
              className="relative flex items-center justify-center"
            >
              {/* Connecting line from spine to card */}
              <div
                className={cn(
                  "absolute top-1/2 h-px bg-border/40 z-0",
                  isLeft ? "left-1/2 right-[52.5%]" : "left-[52.5%] right-1/2"
                )}
              />
              
              {/* Spine node */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                {/* Expanding pulse animation */}
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: stage.color }} />
                {/* Outer glow ring */}
                <div
                  className="absolute inset-0 w-3 h-3 rounded-full blur-sm opacity-60"
                  style={{ backgroundColor: stage.color }}
                />
                {/* Hollow ring dot */}
                <div
                  className="relative w-3 h-3 rounded-full ring-2 ring-background bg-background border"
                  style={{ 
                    borderColor: stage.color,
                    boxShadow: `0 0 15px ${stage.color}40, 0 2px 4px -1px rgb(0 0 0 / 0.1)`
                  }}
                />
              </div>
              
              {/* Content card */}
              <div
                className={cn(
                  "relative w-[42%] z-10",
                  isLeft ? "mr-auto" : "ml-auto"
                )}
              >
                <div 
                  className="group relative rounded-[20px] p-8 transition-all duration-500 overflow-hidden backdrop-blur-sm"
                  style={{
                    backgroundColor: 'rgba(11, 15, 20, 0.85)',
                    border: '1px solid rgba(20, 184, 166, 0.15)',
                    boxShadow: `
                      0 0 0 1px rgba(11, 15, 20, 0.5),
                      0 8px 32px -8px rgba(0, 0, 0, 0.6),
                      0 2px 8px -2px rgba(0, 0, 0, 0.4),
                      inset 0 1px 0 0 rgba(255, 255, 255, 0.03)
                    `,
                  }}
                >
                  {/* Ambient teal glow - corners */}
                  <div 
                    className="absolute inset-0 opacity-40 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `
                        radial-gradient(circle at 0% 0%, rgba(20, 184, 166, 0.08) 0%, transparent 40%),
                        radial-gradient(circle at 100% 100%, rgba(6, 182, 212, 0.08) 0%, transparent 40%)
                      `
                    }}
                  />
                  
                  {/* Hover glow intensification */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `
                        radial-gradient(circle at 50% 0%, rgba(20, 184, 166, 0.12) 0%, transparent 50%),
                        radial-gradient(circle at 0% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 40%)
                      `
                    }}
                  />
                  
                  <div className="relative z-10">
                    {/* Decorative floating elements - integrated into card background */}
                    <div className="absolute -top-4 -right-4 w-32 h-32 opacity-20 pointer-events-none">
                      <div 
                        className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-cyan-400/30 rotate-12"
                        style={{ 
                          boxShadow: '0 0 20px rgba(6, 182, 212, 0.15)'
                        }}
                      />
                      <div 
                        className="absolute top-12 right-12 w-6 h-6 rounded border border-teal-400/25 -rotate-6"
                        style={{ 
                          boxShadow: '0 0 16px rgba(20, 184, 166, 0.12)'
                        }}
                      />
                      <div className="absolute top-8 right-20 w-1 h-1 rounded-full bg-cyan-400/40" 
                        style={{ boxShadow: '0 0 8px rgba(6, 182, 212, 0.4)' }}
                      />
                      <div className="absolute top-16 right-8 w-1 h-1 rounded-full bg-teal-400/30" 
                        style={{ boxShadow: '0 0 6px rgba(20, 184, 166, 0.3)' }}
                      />
                    </div>
                    
                    {/* Graphic Visual - centered, larger */}
                    <div className="flex justify-center mb-6">
                      <stage.graphic 
                        color={stage.color} 
                        className="w-20 h-16 opacity-80 drop-shadow-lg"
                      />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg font-medium text-gray-100 leading-tight mb-3 text-center tracking-tight">
                      {stage.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-400/90 leading-relaxed text-center">
                      {stage.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
