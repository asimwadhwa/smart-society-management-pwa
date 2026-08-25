'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Siren, Loader2 } from 'lucide-react';

interface EmergencyButtonProps {
  onTrigger: (notes?: string) => Promise<void>;
  disabled?: boolean;
  hasActiveEmergency?: boolean;
  userFlat?: string;
  triggerLoading?: boolean;
}

export default function EmergencyButton({
  onTrigger,
  disabled = false,
  hasActiveEmergency = false,
  userFlat = '',
  triggerLoading = false,
}: EmergencyButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const handleTrigger = async () => {
    setIsLoading(true);
    try {
      await onTrigger(notes || undefined);
      setIsDialogOpen(false);
      setNotes('');
    } catch (error) {
      console.error('Failed to trigger emergency:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonLoading = isLoading || triggerLoading;

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled || hasActiveEmergency}
        className={`
          relative w-full p-6 rounded-2xl shadow-lg transition-all duration-300
          ${hasActiveEmergency
            ? 'bg-gray-100 cursor-not-allowed'
            : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-[0.98] cursor-pointer'
          }
          ${!hasActiveEmergency && !disabled ? 'hover:shadow-xl' : ''}
        `}
      >

        <div className="relative flex flex-col items-center gap-3">
          <div
            className={`${
              hasActiveEmergency ? 'opacity-50' : ''
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Siren className={`w-8 h-8 ${hasActiveEmergency ? 'text-gray-400' : 'text-white'}`} />
            </div>
          </div>
          <div>
            <h3
              className={`text-xl font-bold ${
                hasActiveEmergency ? 'text-gray-400' : 'text-white'
              }`}
            >
              {hasActiveEmergency ? 'Emergency Active' : 'EMERGENCY'}
            </h3>
            <p
              className={`text-sm ${
                hasActiveEmergency ? 'text-gray-400' : 'text-red-100'
              }`}
            >
              {hasActiveEmergency
                ? 'Someone already triggered an alert'
                : 'Tap if stuck in lift'}
            </p>
          </div>
        </div>
      </button>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!isButtonLoading) {
          setIsDialogOpen(open);
          if (!open) setNotes('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Siren className="w-5 h-5" />
              Confirm Emergency Alert
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Are you sure you want to trigger a <strong>lift emergency alert</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-2">
            <p className="text-sm text-amber-800">
              <strong>⚠ Important:</strong> This will immediately notify all residents, 
              the manager, and the watchman via email. Only use this if someone is 
              actually stuck in the lift.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-gray-600">
                Alert will be sent from: <strong>Flat {userFlat}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Additional Notes (optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g., Which floor? How many people stuck?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isButtonLoading}
                className="resize-none"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setNotes('');
              }}
              disabled={isButtonLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleTrigger}
              disabled={isButtonLoading}
              className="gap-2"
            >
              {isButtonLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Alert...
                </>
              ) : (
                <>
                  <Siren className="w-4 h-4" />
                  Yes, Send Alert
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
