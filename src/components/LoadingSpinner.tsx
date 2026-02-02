import React from 'react';
import { Loader2, HardHat } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  fullScreen = false,
  message 
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-safety-orange to-safety-orange-dark rounded-2xl flex items-center justify-center animate-pulse-slow">
            <HardHat className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2">
            <Loader2 className="w-8 h-8 text-safety-orange animate-spin" />
          </div>
        </div>
        {message && (
          <p className="mt-6 text-concrete-400 text-sm animate-pulse">{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className={`${sizeClasses[size]} text-safety-orange animate-spin`} />
      {message && <span className="text-concrete-400 text-sm">{message}</span>}
    </div>
  );
};

// Skeleton components for loading states
export const NoteCardSkeleton: React.FC = () => (
  <div className="bg-slate-850 rounded-xl border border-slate-700/50 overflow-hidden animate-pulse">
    <div className="aspect-video bg-slate-800 skeleton" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-slate-700 rounded skeleton w-3/4" />
      <div className="h-4 bg-slate-700 rounded skeleton w-full" />
      <div className="h-4 bg-slate-700 rounded skeleton w-2/3" />
      <div className="flex items-center gap-2 pt-2">
        <div className="h-3 bg-slate-700 rounded skeleton w-20" />
        <div className="h-3 bg-slate-700 rounded skeleton w-24" />
      </div>
    </div>
  </div>
);

export const NotesGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="masonry-grid">
    {Array.from({ length: count }).map((_, i) => (
      <NoteCardSkeleton key={i} />
    ))}
  </div>
);

export default LoadingSpinner;
