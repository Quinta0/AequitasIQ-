import React from 'react';

const MeshGradientBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <div 
        className="w-full h-full bg-background/80 
          animate-[hue-rotate_12s_linear_infinite]"
        style={{
          backgroundImage: `
            radial-gradient(at 96% 8%, hsl(var(--primary) / 0.7) 0px, transparent 50%),
            radial-gradient(at 32% 8%, hsl(var(--secondary) / 0.5) 0px, transparent 50%),
            radial-gradient(at 64% 88%, hsl(var(--accent) / 0.4) 0px, transparent 50%),
            radial-gradient(at 39% 83%, hsl(var(--chart-1) / 0.6) 0px, transparent 50%),
            radial-gradient(at 30% 21%, hsl(var(--chart-2) / 0.5) 0px, transparent 50%),
            radial-gradient(at 66% 54%, hsl(var(--chart-3) / 0.4) 0px, transparent 50%),
            radial-gradient(at 74% 47%, hsl(var(--chart-4) / 0.5) 0px, transparent 50%)
          `
        }}
      />
    </div>
  );
};

export default MeshGradientBackground;