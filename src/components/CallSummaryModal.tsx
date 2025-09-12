import { X, User, Phone, Briefcase, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CallSummary } from "@/pages/Index";

interface CallSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  callSummary: CallSummary | null;
}

export const CallSummaryModal = ({ isOpen, onClose, callSummary }: CallSummaryModalProps) => {
  if (!isOpen || !callSummary) return null;

  return (
    <div 
      className="fixed inset-0 bg-background/60 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card/90 backdrop-blur-md rounded-2xl shadow-intense max-w-md w-full p-8 animate-fade-in border border-border/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Interview Summary</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Summary Content */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Candidate Name</p>
              <p className="font-medium text-foreground">{callSummary.candidateName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="font-medium text-foreground">{callSummary.phoneNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Position Applied</p>
              <p className="font-medium text-foreground">{callSummary.position}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Experience</p>
              <p className="font-medium text-foreground">{callSummary.experience}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted/20 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Interview Date & Time</p>
              <p className="font-medium text-foreground">{callSummary.interviewDate}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t border-border/30">
          <Button 
            className="w-full bg-gradient-primary hover:shadow-glow"
            onClick={onClose}
          >
            Got it, Thanks
          </Button>
        </div>
      </div>
    </div>
  );
};