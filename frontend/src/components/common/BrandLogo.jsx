import React from 'react';

/**
 * BrandLogo — Professional Vector Brand Mark for SilverHands
 * Clean, modern elder-friendly design using Primary (#3F9BE8) & Dark Blue (#1F6FB2).
 */
export const BrandLogo = ({ className = "w-10 h-10", size = "md" }) => {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10 sm:w-11 sm:h-11",
    lg: "w-14 h-14"
  };

  return (
    <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#3F9BE8] to-[#1F6FB2] shadow-md border border-white/20 ${iconSizes[size] || className}`}>
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-3/5 h-3/5 text-white"
        aria-hidden="true"
      >
        {/* Supportive Elder Caring Hands Vector */}
        <path
          d="M18 28C23.5228 28 28 23.5228 28 18C28 12.4772 23.5228 8 18 8C12.4772 8 8 12.4772 8 18C8 23.5228 12.4772 28 18 28Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 19C13 16.2386 15.2386 14 18 14C20.7614 14 23 16.2386 23 19C23 21.7614 20.7614 24 18 24"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M18 11V8M25 18H28M8 18H11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
