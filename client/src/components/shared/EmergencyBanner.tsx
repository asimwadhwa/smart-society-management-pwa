'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Siren } from 'lucide-react';

interface EmergencyBannerProps {
  flatNo: string;
  timestamp: string;
  onViewDetails?: () => void;
}

export default function EmergencyBanner({ flatNo, timestamp, onViewDetails }: EmergencyBannerProps) {
  return (
    <Alert className="bg-red-600 text-white border-red-600">
      <AlertTitle className="text-lg font-bold flex items-center gap-2">
        <Siren className="w-5 h-5" /> EMERGENCY: Someone stuck in lift!
      </AlertTitle>
      <AlertDescription className="text-red-100">
        <div className="flex justify-between items-center mt-2">
          <span>Flat {flatNo} • {timestamp}</span>
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="bg-white text-red-600 hover:bg-red-50"
            >
              View Details
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
