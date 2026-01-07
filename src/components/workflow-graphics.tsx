type GraphicProps = {
  color: string;
  className?: string;
};

export const ClientCreationGraphic = ({ color, className }: GraphicProps) => (
  <svg viewBox="0 0 80 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Building structure */}
    <rect x="10" y="20" width="20" height="35" rx="2" fill={`${color}20`} stroke={color} strokeWidth="1.5" />
    <rect x="32" y="15" width="18" height="40" rx="2" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
    <rect x="52" y="22" width="18" height="33" rx="2" fill={`${color}10`} stroke={color} strokeWidth="1.5" />
    {/* Windows */}
    <rect x="14" y="25" width="4" height="4" rx="0.5" fill={color} opacity="0.3" />
    <rect x="22" y="25" width="4" height="4" rx="0.5" fill={color} opacity="0.3" />
    <rect x="36" y="20" width="4" height="4" rx="0.5" fill={color} opacity="0.4" />
    <rect x="42" y="20" width="4" height="4" rx="0.5" fill={color} opacity="0.4" />
    <rect x="56" y="27" width="4" height="4" rx="0.5" fill={color} opacity="0.3" />
    <rect x="62" y="27" width="4" height="4" rx="0.5" fill={color} opacity="0.3" />
  </svg>
);

export const JobCreationGraphic = ({ color, className }: GraphicProps) => (
  <svg viewBox="0 0 80 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Document */}
    <rect x="20" y="10" width="40" height="45" rx="3" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
    {/* Header line */}
    <line x1="26" y1="18" x2="54" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    {/* Checklist items */}
    <circle cx="27" cy="28" r="2.5" stroke={color} strokeWidth="1.5" fill="none" />
    <line x1="33" y1="28" x2="50" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    <circle cx="27" cy="36" r="2.5" stroke={color} strokeWidth="1.5" fill="none" />
    <line x1="33" y1="36" x2="50" y2="36" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    <circle cx="27" cy="44" r="2.5" fill={color} opacity="0.6" />
    <path d="M25.5 44 L27 45.5 L29 43" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="33" y1="44" x2="50" y2="44" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
  </svg>
);

export const CandidateSourcingGraphic = ({ color, className }: GraphicProps) => (
  <svg viewBox="0 0 80 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Multiple profile cards */}
    <rect x="15" y="12" width="22" height="28" rx="3" fill={`${color}20`} stroke={color} strokeWidth="1.5" />
    <rect x="29" y="18" width="22" height="28" rx="3" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
    <rect x="43" y="14" width="22" height="28" rx="3" fill={`${color}10`} stroke={color} strokeWidth="1.5" />
    {/* Avatar circles on front card */}
    <circle cx="54" cy="24" r="4" fill={color} opacity="0.3" />
    <rect x="48" y="30" width="12" height="2" rx="1" fill={color} opacity="0.3" />
    <rect x="50" y="34" width="8" height="1.5" rx="0.75" fill={color} opacity="0.2" />
    {/* Plus icon */}
    <circle cx="20" cy="18" r="6" fill={color} opacity="0.8" />
    <line x1="20" y1="15" x2="20" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="17" y1="18" x2="23" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const ApplicationReviewGraphic = ({ color, className }: GraphicProps) => (
  <svg viewBox="0 0 80 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Resume/document */}
    <rect x="18" y="12" width="32" height="40" rx="2" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
    <line x1="24" y1="20" x2="44" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <line x1="24" y1="26" x2="40" y2="26" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <line x1="24" y1="32" x2="42" y2="32" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    {/* Magnifying glass */}
    <circle cx="54" cy="36" r="10" fill="none" stroke={color} strokeWidth="2" />
    <line x1="61" y1="43" x2="68" y2="50" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    {/* Checkmark inside magnifier */}
    <path d="M49 36 L52 39 L59 32" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
  </svg>
);

export const InterviewSchedulingGraphic = ({ color, className }: GraphicProps) => (
  <svg viewBox="0 0 80 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Calendar */}
    <rect x="15" y="15" width="50" height="40" rx="3" fill={`${color}10`} stroke={color} strokeWidth="1.5" />
    <rect x="15" y="15" width="50" height="10" rx="3" fill={color} opacity="0.2" />
    {/* Calendar dots for days */}
    <circle cx="24" cy="32" r="2" fill={color} opacity="0.2" />
    <circle cx="32" cy="32" r="2" fill={color} opacity="0.2" />
    <circle cx="40" cy="32" r="2" fill={color} opacity="0.2" />
    <circle cx="48" cy="32" r="2" fill={color} opacity="0.2" />
    <circle cx="56" cy="32" r="2" fill={color} opacity="0.2" />
    <circle cx="24" cy="40" r="2" fill={color} opacity="0.2" />
    <circle cx="32" cy="40" r="2" fill={color} opacity="0.2" />
    {/* Highlighted date */}
    <circle cx="40" cy="40" r="4" fill={color} opacity="0.6" />
    <circle cx="48" cy="40" r="2" fill={color} opacity="0.2" />
    <circle cx="56" cy="40" r="2" fill={color} opacity="0.2" />
    {/* Clock icon overlay */}
    <circle cx="54" cy="24" r="8" fill={color} opacity="0.8" />
    <line x1="54" y1="24" x2="54" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="54" y1="24" x2="57" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const OnboardingGraphic = ({ color, className }: GraphicProps) => (
  <svg viewBox="0 0 80 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Two hands shaking */}
    <path 
      d="M15 35 L25 30 L30 32 L35 28 L38 30" 
      stroke={color} 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
      opacity="0.6"
    />
    <path 
      d="M65 35 L55 30 L50 32 L45 28 L42 30" 
      stroke={color} 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
      opacity="0.6"
    />
    {/* Connection/contract in middle */}
    <rect x="32" y="25" width="16" height="20" rx="2" fill={`${color}20`} stroke={color} strokeWidth="1.5" />
    <line x1="36" y1="31" x2="44" y2="31" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    <line x1="36" y1="35" x2="44" y2="35" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    {/* Checkmark */}
    <circle cx="40" cy="40" r="4" fill={color} opacity="0.8" />
    <path d="M38 40 L39.5 41.5 L42 39" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
