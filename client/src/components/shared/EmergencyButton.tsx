'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Siren } from 'lucide-react';

interface EmergencyButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export default function EmergencyButton({ onClick, disabled, className }: EmergencyButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-8 text-lg rounded-xl shadow-lg',
        'transform transition-all hover:scale-105 active:scale-95',
        'animate-pulse hover:animate-none',
        className
      )}
    >
      <Siren className="w-5 h-5 mr-2" /> EMERGENCY
    </Button>
  );
}
