import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, PhoneCall, Minus, Maximize2, X } from 'lucide-react';
import { useVapi } from '@/hooks/useVapi';
import { useToast } from '@/hooks/use-toast';

export type CallType = 'inbound' | 'outbound';

interface CallTypeSelectorProps {
  callType: CallType;
  onCallTypeChange: (type: CallType) => void;
  phoneNumber: string;
  onPhoneNumberChange: (number: string) => void;
  onStartCall: (firstMessage?: string) => void;
  isCallActive: boolean;
  disabled?: boolean;
  onClose?: () => void;
}

const COUNTRY_CODES = [
  { code: '+1', country: 'US/Canada' },
  { code: '+91', country: 'India' },
];

export const CallTypeSelector: React.FC<CallTypeSelectorProps> = ({
  callType,
  onCallTypeChange,
  phoneNumber,
  onPhoneNumberChange,
  onStartCall,
  isCallActive,
  disabled = false,
  onClose,
}) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState('+1');
  const [minimized, setMinimized] = useState(true);
  const { startOutboundCall } = useVapi();
  const { toast } = useToast();
  const [firstMessage, setFirstMessage] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('assistantSettings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.firstMessage === 'string' && parsed.firstMessage.trim()) {
          return parsed.firstMessage;
        }
      }
    } catch {}
    return 'Hi, this is HR from Envisage Infotech. How can I help you today?';
  });
  const [isFirstMessageDialogOpen, setIsFirstMessageDialogOpen] = useState(false);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, '');
    onPhoneNumberChange(digits);
  };

  const isValidPhoneNumber = (number: string) => {
    const digits = number.replace(/\D/g, '');
    return digits.length === 10; // for +1/+91 we expect 10 digits local part
  };

  const handleStart = async () => {
    if (callType === 'inbound') {
      onStartCall(firstMessage);
      return;
    }

    // Outbound
    if (!isValidPhoneNumber(phoneNumber)) {
      toast({ title: 'Invalid number', description: 'Enter a valid 10-digit number.' });
      return;
    }

    const fullNumber = `${selectedCountryCode}${phoneNumber}`; // useVapi formats to E.164
    try {
      await startOutboundCall(fullNumber, firstMessage);
      toast({ title: 'Call placed', description: `AI assistant is calling ${fullNumber}. Refresh the list after the call to see details.` });
      // Close popup
      onClose?.();
      // Minimize as a fallback if parent does not close
      setMinimized(true);
    } catch (e: any) {
      toast({ title: 'Failed to place call', description: e?.message || 'Unknown error' });
    }
  };

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        title="Start New Call"
      >
        <Phone className="w-5 h-5" />
      </button>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto relative">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Start New Call
          </span>
          <span className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setMinimized(true)} title="Minimize">
              <Minus className="w-4 h-4" />
            </Button>
            {/* {onClose && (
              <Button variant="outline" size="icon" onClick={onClose} title="Close">
                <X className="w-4 h-4" />
              </Button>
            )} */}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Call Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Call Type</Label>
          <RadioGroup
            value={callType}
            onValueChange={(value) => onCallTypeChange(value as CallType)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inbound" id="inbound" />
              <Label htmlFor="inbound" className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4" />
                Inbound Call
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="outbound" id="outbound" />
              <Label htmlFor="outbound" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Outbound Call
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground">
          {callType === 'inbound' ? (
            <p>Select "Inbound Call" to wait for candidates to call the assistant.</p>
          ) : (
            <p>Select "Outbound Call" to have the assistant call a candidate.</p>
          )}
        </div>

        {/* Assistant First Message removed from here; defaults are loaded from settings */}

        {/* Phone Number Input for Outbound Calls */}
        {callType === 'outbound' && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Phone Number</Label>
            <div className="flex gap-2">
              <Select value={selectedCountryCode} onValueChange={setSelectedCountryCode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span>{country.code}</span>
                        <span className="text-xs text-muted-foreground">{country.country}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="tel"
                placeholder={selectedCountryCode === '+1' ? '1234567890' : '1234567890'}
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                className="flex-1"
                disabled={disabled}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Enter a 10-digit number. Only +1 and +91 are supported.
            </div>
          </div>
        )}

        {/* Start Call Button */}
        <Button
          onClick={handleStart}
          disabled={disabled || isCallActive || (callType === 'outbound' && !isValidPhoneNumber(phoneNumber))}
          className="w-full"
          size="lg"
        >
          {isCallActive ? (
            'Call in Progress...'
          ) : callType === 'inbound' ? (
            'Start Inbound Call'
          ) : (
            `Call ${selectedCountryCode}${phoneNumber}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
