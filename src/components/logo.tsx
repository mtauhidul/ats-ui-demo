import type React from "react";

export const LogoIcon = (props: React.ComponentProps<"svg">) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none"
    {...props}
  >
    <path 
      d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M13.1667 8L15.2109 10.1144C16.0703 11.0033 16.5 11.4477 16.5 12C16.5 12.5523 16.0703 12.9967 15.2109 13.8856L13.1667 16M7.5 8L9.54423 10.1144C10.4036 11.0033 10.8333 11.4477 10.8333 12C10.8333 12.5523 10.4036 12.9967 9.54424 13.8856L7.5 16" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const WordmarkIcon = (props: React.ComponentProps<"svg">) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 200 32" 
    fill="none"
    {...props}
  >
    {/* Logo Icon - Larger */}
    <g transform="scale(1.3333)">
      <path 
        d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      <path 
        d="M13.1667 8L15.2109 10.1144C16.0703 11.0033 16.5 11.4477 16.5 12C16.5 12.5523 16.0703 12.9967 15.2109 13.8856L13.1667 16M7.5 8L9.54423 10.1144C10.4036 11.0033 10.8333 11.4477 10.8333 12C10.8333 12.5523 10.4036 12.9967 9.54424 13.8856L7.5 16" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </g>
    
    {/* Arista ATS Text - Black */}
    <text 
      x="38" 
      y="21" 
      fill="hsl(var(--foreground))"
      style={{ 
        fontSize: '18px', 
        fontWeight: '700',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        letterSpacing: '-0.02em'
      }}
    >
      Arista ATS
    </text>
  </svg>
);

