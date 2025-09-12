import { Phone, PhoneOff, Mic, MicOff, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useVapi } from "@/hooks/useVapi";

interface LiveCallInterfaceProps {
  isCallActive: boolean;
  callStatus: "idle" | "connecting" | "active" | "ended";
  onCallStart: () => void;
  onCallEnd: () => void;
  onCallSummary?: (summary: any) => void;
}

export const LiveCallInterface = ({ 
  isCallActive, 
  callStatus, 
  onCallStart, 
  onCallEnd,
  onCallSummary 
}: LiveCallInterfaceProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  
  // Use Vapi hook
  const {
    connected,
    assistantIsSpeaking,
    volumeLevel,
    isMuted: vapiMuted,
    messages,
    userSpeaking,
    currentSpeech,
    isListening,
    microphoneStatus,
    startCall: vapiStartCall,
    stopCall: vapiStopCall,
    toggleMute: vapiToggleMute,
    sendMessage
  } = useVapi();

  // Handle Vapi call events
  useEffect(() => {
    if (connected && !isCallActive) {
      onCallStart();
    } else if (!connected && isCallActive) {
      onCallEnd();
    }
  }, [connected, isCallActive, onCallStart, onCallEnd]);

  // Handle call summary when call ends
  useEffect(() => {
    if (!connected && isCallActive && onCallSummary) {
      // Extract candidate information from messages
      const candidateInfo = extractCandidateInfo(messages);
      if (candidateInfo) {
        onCallSummary(candidateInfo);
      }
    }
  }, [connected, isCallActive, messages, onCallSummary]);

  const extractCandidateInfo = (messages: any[]) => {
    const userMessages = messages.filter(msg => msg.type === 'user');
    const assistantMessages = messages.filter(msg => msg.type === 'assistant');
    
    // Simple extraction logic - in a real app, you'd have more sophisticated parsing
    const nameMatch = userMessages.find(msg => 
      msg.content.toLowerCase().includes('name') || 
      msg.content.match(/^[A-Za-z\s]+$/)
    );
    
    const phoneMatch = userMessages.find(msg => 
      msg.content.match(/\d{10}/) || 
      msg.content.match(/\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
    );
    
    const roleMatch = userMessages.find(msg => 
      msg.content.toLowerCase().includes('developer') ||
      msg.content.toLowerCase().includes('engineer') ||
      msg.content.toLowerCase().includes('designer')
    );
    
    const experienceMatch = userMessages.find(msg => 
      msg.content.match(/\d+\s*(year|yr)/i)
    );

    if (nameMatch || phoneMatch || roleMatch) {
      return {
        candidateName: nameMatch?.content || "Unknown",
        phoneNumber: phoneMatch?.content || "Not provided",
        position: roleMatch?.content || "Not specified",
        experience: experienceMatch?.content || "Not specified",
        interviewDate: new Date().toLocaleString()
      };
    }
    
    return null;
  };

  const getStatusBadge = () => {
    if (connected) {
      return <Badge className="bg-status-completed/20 text-status-completed border-status-completed/30">Connected</Badge>;
    }
    
    switch (callStatus) {
      case "connecting":
        return <Badge className="bg-status-pending/20 text-status-pending border-status-pending/30">Connecting...</Badge>;
      case "active":
        return <Badge className="bg-status-completed/20 text-status-completed border-status-completed/30">Active</Badge>;
      case "ended":
        return <Badge className="bg-muted/20 text-muted-foreground border-muted/30">Call Ended</Badge>;
      default:
        return <Badge variant="secondary">Ready</Badge>;
    }
  };

  const getCircleClasses = () => {
    const baseClasses = "w-40 h-40 rounded-full flex items-center justify-center relative transition-all duration-500";
    
    if (connected) {
      return `${baseClasses} bg-gradient-siri shadow-intense animate-pulse-glow border-4 border-white/20`;
    }
    
    switch (callStatus) {
      case "connecting":
        return `${baseClasses} bg-gradient-siri shadow-glow animate-pulse-glow border-4 border-transparent`;
      case "active":
        return `${baseClasses} bg-gradient-siri shadow-intense animate-pulse-glow border-4 border-white/20`;
      case "ended":
        return `${baseClasses} bg-muted/20 border-4 border-muted`;
      default:
        return `${baseClasses} bg-gradient-call border-4 border-border hover:border-call-active hover:shadow-glow transition-all duration-500`;
    }
  };

  return (
    <div className="bg-card rounded-xl p-8 shadow-card text-center space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Live Interview Assistant
        </h2>
        {getStatusBadge()}
      </div>

      {/* Siri-like Animated Circle */}
      <div className="flex justify-center relative">
        <div className={getCircleClasses()}>
          {/* Pulse rings for active state */}
          {(callStatus === "active" || connected) && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-call-pulse animate-pulse-ring opacity-75 pointer-events-none"></div>
              <div className="absolute inset-0 rounded-full border-2 border-call-pulse animate-pulse-ring opacity-50 pointer-events-none" style={{ animationDelay: "0.5s" }}></div>
            </>
          )}
          
          {/* Center orb */}
          <div className="relative z-10">
            {(callStatus === "active" || connected) ? (
              <div className="w-12 h-12 bg-gradient-siri rounded-full animate-pulse-glow opacity-90 shadow-glow"></div>
            ) : (
              <div className="w-10 h-10 bg-gradient-call rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-foreground opacity-80" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Call Controls */}
      <div className="flex justify-center items-center space-x-4 relative z-20">
        {!connected && callStatus !== "connecting" ? (
          <Button
            onClick={vapiStartCall}
            className="bg-gradient-primary hover:shadow-intense px-8 py-3 text-base font-medium transition-all duration-300"
            disabled={callStatus === "ended"}
          >
            <Phone className="w-5 h-5 mr-2" />
            Start Call
          </Button>
        ) : (
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="lg"
              onClick={vapiToggleMute}
              className={`border-border hover:border-warning ${vapiMuted ? 'bg-warning/20 text-warning' : ''}`}
              disabled={!connected}
            >
              {vapiMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowMessages(!showMessages)}
              className="border-border hover:border-primary"
              disabled={!connected}
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
            
            <Button
              variant="destructive"
              size="lg"
              onClick={vapiStopCall}
              className="bg-destructive hover:bg-destructive/90 px-6 relative z-20"
              disabled={!connected}
              style={{ pointerEvents: 'auto' }}
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              End Call
            </Button>
          </div>
        )}
      </div>

      {/* Status Information */}
      {(callStatus === "active" || connected) && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Assistant is listening and ready to help with the interview</p>
          <p className="text-xs">AI will automatically capture candidate details</p>
          {assistantIsSpeaking && <p className="text-xs text-blue-500">Assistant is speaking...</p>}
          {userSpeaking && <p className="text-xs text-green-500">User is speaking...</p>}
          {currentSpeech && <p className="text-xs text-gray-600">"{currentSpeech}"</p>}
        </div>
      )}

      {/* Messages Display */}
      {showMessages && connected && (
        <div className="mt-6 p-4 bg-muted/20 rounded-lg max-h-60 overflow-y-auto">
          <h4 className="text-sm font-medium mb-3">Conversation</h4>
          <div className="space-y-2">
            {messages.filter(msg => msg.type === 'user' || msg.type === 'assistant').map((msg, index) => (
              <div key={index} className={`text-xs p-2 rounded ${
                msg.type === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                <div className="font-medium">{msg.type === 'user' ? 'You' : 'Assistant'}</div>
                <div>{msg.content}</div>
                <div className="text-xs opacity-70">{msg.time}</div>
              </div>
            ))}
          </div>
          
          {/* Text Input */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-2 py-1 text-xs border rounded"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage(customMessage);
                  setCustomMessage('');
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                sendMessage(customMessage);
                setCustomMessage('');
              }}
              disabled={!customMessage.trim()}
            >
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};