import React from 'react';
import type { FinancialMood } from '../types';

interface AnimatedMascotProps {
  mood: FinancialMood;
  className?: string;
}

export const AnimatedMascot: React.FC<AnimatedMascotProps> = ({ mood, className = '' }) => {
  // Mouth path morphs based on selected mood
  const getMouthPath = () => {
    switch (mood) {
      case 'surplus':
        return 'M44 70 Q52 82 60 70'; // Wide joyful smile
      case 'tagihan':
        return 'M46 75 Q52 72 58 75'; // Flat, slightly sleepy line
      case 'audit':
        return 'M46 73 L58 73'; // Neutral focused line
      case 'aman':
      default:
        return 'M46 72 C50 78 54 78 58 72'; // Serene gentle curve
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        className="anim-float w-full max-w-[260px] h-auto drop-shadow-sm select-none"
        viewBox="0 0 240 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* CHARACTER 1: Mint Green Serene Circle (Kas Aman) */}
        <g id="char-mint">
          <circle cx="52" cy="70" r="36" fill="#BBF7D0" stroke="#86EFAC" strokeWidth="2.5" />
          
          {/* Animated Blinking Eyes */}
          <g className="anim-blink">
            <path d="M40 64 C44 58 49 58 53 64" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
            <path d="M57 64 C61 58 66 58 70 64" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Morphing Mouth */}
          <path
            d={getMouthPath()}
            stroke="#166534"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />

          {/* Rosy Cheeks */}
          <circle cx="38" cy="73" r="4" fill="#FCA5A5" opacity="0.6" />
          <circle cx="72" cy="73" r="4" fill="#FCA5A5" opacity="0.6" />
        </g>

        {/* CHARACTER 2: Lilac Curious Blob (Audit / Transparansi) */}
        <g id="char-lilac">
          <circle cx="120" cy="54" r="32" fill="#DDD6FE" stroke="#C4B5FD" strokeWidth="2.5" />
          
          <g className="anim-blink">
            <circle cx="111" cy="50" r="4" fill="#5B21B6" />
            <circle cx="129" cy="48" r="4.5" fill="#5B21B6" />
          </g>

          <path d="M115 62 Q120 58 125 62" stroke="#5B21B6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>

        {/* CHARACTER 3: Peach Rounded Box (Tagihan / Peringatan) */}
        <g id="char-peach">
          <rect x="162" y="38" width="54" height="54" rx="20" fill="#FED7AA" stroke="#FDBA74" strokeWidth="2.5" />
          
          <line x1="174" y1="52" x2="183" y2="54" stroke="#9A3412" strokeWidth="3" strokeLinecap="round" />
          <line x1="202" y1="52" x2="193" y2="54" stroke="#9A3412" strokeWidth="3" strokeLinecap="round" />
          <circle cx="188" cy="67" r="5" fill="#9A3412" />
        </g>

        {/* CHARACTER 4: Lemon Geometric Sparkle Star (Surplus) */}
        <path
          className="anim-pulse-glow"
          d="M205 18 L208 28 L218 31 L208 34 L205 44 L202 34 L192 31 L202 28 Z"
          fill="#FEF08A"
          stroke="#FDE047"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};
