import React from "react";

export default function ZetaLogo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className} 
      fill="currentColor" 
    >
      <text 
        x="50%" 
        y="50%" 
        dominantBaseline="central" 
        textAnchor="middle" 
        fontFamily="Georgia, serif" 
        fontStyle="italic" 
        fontWeight="bold" 
        fontSize="22"
      >
        ζ
      </text>
    </svg>
  );
}
