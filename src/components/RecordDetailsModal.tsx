import { X, User, Phone, Briefcase, Calendar, Award, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CallRecord } from "@/pages/Index";

interface RecordDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: CallRecord | null;
}

export const RecordDetailsModal = ({ isOpen, onClose, record }: RecordDetailsModalProps) => {
  if (!isOpen || !record) return null;

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const renderChat = () => {
    if (!record.messages || record.messages.length === 0) return null;
    return (
      <div className="space-y-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
        {record.messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-muted/40 text-foreground'} max-w-[80%] px-3 py-2 rounded-lg text-sm leading-relaxed shadow-sm`}>
                <div className="text-[10px] opacity-70 mb-1 uppercase tracking-wide">
                  {m.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-background/60 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card/90 backdrop-blur-md rounded-2xl shadow-intense max-w-2xl w-full p-4 sm:p-8 animate-fade-in border border-border/20 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Call Details</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-5">
          {/* Status */}
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium text-foreground capitalize">{record.callStatus}{record.endedReason ? ` — ${record.endedReason}` : ''}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted/20 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Started</p>
              <p className="font-medium text-foreground">{formatDate(record.startedAt)}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Call Summary</p>
            <div className="p-3 rounded-lg bg-muted/30 text-sm text-foreground min-h-[56px]">
              {record.summary || record.transcriptSnippet || '—'}
            </div>
          </div>

          {/* Transcript: chat-style */}
          {(record.messages && record.messages.length > 0) ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Transcript</p>
              {renderChat()}
            </div>
          ) : record.transcript ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Transcript</p>
              <div className="p-3 rounded-lg bg-muted/20 text-sm text-foreground max-h-64 sm:max-h-72 overflow-y-auto whitespace-pre-wrap">
                {record.transcript}
              </div>
            </div>
          ) : null}

          {/* Parsed Candidate Info (may be inaccurate) */}
          {(record.candidateName || record.phoneNumber || record.position || record.experience) && (
            <div className="pt-2 border-t border-border/20 space-y-3">
              <p className="text-xs text-muted-foreground">Parsed from conversation (may be inaccurate)</p>

              {record.candidateName && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Candidate Name</p>
                    <p className="font-medium text-foreground">{record.candidateName}</p>
                  </div>
                </div>
              )}

              {record.phoneNumber && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-medium text-foreground">{record.phoneNumber}</p>
                  </div>
                </div>
              )}

              {record.position && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Position Applied</p>
                    <p className="font-medium text-foreground">{record.position}</p>
                  </div>
                </div>
              )}

              {record.experience && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-medium text-foreground">{record.experience}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};