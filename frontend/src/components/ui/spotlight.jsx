import React from "react";
import { cn } from "@/lib/utils";

export const Spotlight = ({ className, fill }) => {
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-[1] w-[800px] h-[800px] opacity-20",
        className
      )}
      style={{
        background: `radial-gradient(circle, ${fill || 'white'} 0%, transparent 60%)`,
        mixBlendMode: 'screen'
      }}
    />
  );
};
