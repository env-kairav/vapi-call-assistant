import { X, User, Phone, Briefcase, Calendar, Award, AlertCircle, Bot } from "lucide-react";
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

  // Parse transcript into chat messages
  const parseTranscriptToMessages = (transcript: string) => {
    if (!transcript) return [];
    
    console.log("🔍 Parsing transcript:", transcript.substring(0, 200) + "...");
    
    // Split by lines and filter out empty lines
    const lines = transcript.split('\n').filter(line => line.trim());
    const messages: Array<{ role: string; content: string; timestamp?: string }> = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check for AI: or User: patterns
      if (trimmedLine.startsWith('AI:')) {
        messages.push({
          role: 'assistant',
          content: trimmedLine.substring(3).trim(),
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (trimmedLine.startsWith('User:')) {
        messages.push({
          role: 'user',
          content: trimmedLine.substring(5).trim(),
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (messages.length > 0) {
        // If line doesn't start with AI: or User:, append to last message
        const lastMessage = messages[messages.length - 1];
        lastMessage.content += ' ' + trimmedLine;
      }
    });
    
    console.log("📝 Parsed messages:", messages.length, "messages");
    return messages;
  };

  const renderChat = () => {
    if (!record.messages || record.messages.length === 0) return null;
    
    console.log("🔍 RecordDetailsModal: Rendering messages:", record.messages);
    
    return (
      <div className="space-y-3 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
        {record.messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map((m, idx) => {
            // Get the message content from various possible fields
            const content = m.content || m.message || "";
            console.log(`🔍 Message ${idx}:`, { role: m.role, content, message: m.message });
            
            return (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
                  }`}>
                    {m.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  
                  {/* Message bubble */}
                  <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-md' 
                      : 'bg-muted/40 text-foreground rounded-bl-md'
                  }`}>
                    <div className="text-xs opacity-70 mb-1 font-medium">
                      {m.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    );
  };

  // Render transcript as beautiful chat
  const renderTranscript = () => {
    if (!record.transcript) return null;
    
    console.log("🔍 RecordDetailsModal: Rendering transcript:", record.transcript);
    
    const messages = parseTranscriptToMessages(record.transcript);
    
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Transcript</p>
        <div className="bg-muted/10 rounded-xl p-4 max-h-64 sm:max-h-72 overflow-y-auto">
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((message, idx) => (
                <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    
                    {/* Message bubble */}
                    <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-md' 
                        : 'bg-muted/40 text-foreground rounded-bl-md'
                    }`}>
                      <div className="text-xs opacity-70 mb-1 font-medium">
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-muted/20 text-sm text-foreground whitespace-pre-wrap">
              {record.transcript}
            </div>
          )}
        </div>
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Call Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Call Type</div>
                <div className="font-medium text-foreground capitalize">{record.callType}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Duration</div>
                <div className="font-medium text-foreground">{record.duration}</div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Summary</p>
            <div className="p-3 rounded-lg bg-muted/20 text-sm text-foreground">
              {record.summary || record.transcriptSnippet || '—'}
            </div>
          </div>

          {/* Transcript: Prioritize transcript over messages */}
          {record.transcript ? (
            renderTranscript()
          ) : (record.messages && record.messages.length > 0) ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Transcript</p>
              <div className="bg-muted/10 rounded-xl p-4 max-h-64 sm:max-h-72 overflow-y-auto">
                {renderChat()}
              </div>
            </div>
          ) : null}

          {/* Parsed Candidate Info (may be inaccurate) */}
          {(record.candidateName || record.position || record.experience) && (
            <div className="pt-2 border-t border-border/20 space-y-3">
              <p className="text-xs text-muted-foreground">Parsed from conversation (may be inaccurate)</p>

              {record.candidateName && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Candidate Name</div>
                    <div className="font-medium text-foreground">{record.candidateName}</div>
                  </div>
                </div>
              )}

              {record.position && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Position</div>
                    <div className="font-medium text-foreground">{record.position}</div>
                  </div>
                </div>
              )}

              {record.experience && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted/20 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Experience</div>
                    <div className="font-medium text-foreground">{record.experience}</div>
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
