import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { CallRecordsTable } from "@/components/CallRecordsTable";
import { LiveCallInterface } from "@/components/LiveCallInterface";
import { RecordDetailsModal } from "@/components/RecordDetailsModal";
import { CallTypeSelector, CallType } from "@/components/CallTypeSelector";
import { vapiApiService } from "@/lib/vapi-api";
import { useToast } from "@/hooks/use-toast";

export interface CallRecordMessage {
  role: "user" | "assistant" | "system";
  content: string;
  time?: number;
}

export interface CallRecord {
  id: string;
  callStatus: "completed" | "pending" | "failed";
  startedAt: string;
  endedAt?: string;
  summary?: string;
  endedReason?: string;
  recordingUrl?: string;
  assistantId?: string;
  webCallUrl?: string;
  transcriptSnippet?: string;
  transcript?: string;
  messages?: CallRecordMessage[];
  // Parsed (may be inaccurate)
  candidateName?: string;
  phoneNumber?: string;
  position?: string;
  experience?: string;
}

export interface CallSummary {
  candidateName: string;
  phoneNumber: string;
  position: string;
  experience: string;
  interviewDate: string;
}

// Utility function for managing call records using API
const useCallRecords = () => {
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);

  const addCallRecord = (newRecord: CallRecord) => {
    setCallRecords(prev => [newRecord, ...prev]);
  };

  const loadCallRecords = async (force: boolean = false) => {
    // Prevent multiple rapid API calls (debounce)
    const now = Date.now();
    if (!force && now - lastLoadTime < 5000) { // 5 second debounce
      console.log('⏳ Skipping API call - too soon since last call');
      return;
    }

    setLoading(true);
    setError(null);
    setLastLoadTime(now);
    
    try {
      console.log('🔄 Loading call records from API...');
      const vapiLogs = await vapiApiService.getAllCallLogs();
      
      // Convert logs to our CallRecord format
      const records = vapiLogs.map(log => vapiApiService.convertToCallRecord(log));
      
      console.log(`✅ Loaded ${records.length} call records`);
      setCallRecords(records);
    } catch (err) {
      console.error('❌ Failed to load call records:', err);
      setError('Failed to load records.');
      
      // Fallback to mock data if API fails
      console.log('🔄 Falling back to sample data...');
      setCallRecords([
        {
          id: "1",
          callStatus: "completed",
          startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          endedAt: new Date().toISOString(),
          summary: "Intro greeting; caller hung up shortly after.",
          endedReason: "customer-ended-call",
          recordingUrl: undefined,
          assistantId: "assist-123",
          webCallUrl: undefined,
          transcriptSnippet: "AI: Good afternoon...",
          candidateName: undefined,
          phoneNumber: undefined,
          position: undefined,
          experience: undefined,
        },
        {
          id: "2",
          callStatus: "pending",
          startedAt: new Date().toISOString(),
          summary: "Call in progress.",
        },
        {
          id: "3",
          callStatus: "failed",
          startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          summary: "No answer.",
          endedReason: "no-answer",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load call records on component mount
  useEffect(() => {
    loadCallRecords();
  }, []); // Empty dependency array to run only once

  return { callRecords, addCallRecord, loadCallRecords, loading, error };
};

const Index = () => {
  const { callRecords, addCallRecord, loadCallRecords, loading, error } = useCallRecords();
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "active" | "ended">("idle");
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CallRecord | null>(null);
  const [showRecordDetails, setShowRecordDetails] = useState(false);
  const [callType, setCallType] = useState<CallType>("inbound");
  const [phoneNumber, setPhoneNumber] = useState("");
  const { toast } = useToast();
  const [showStartPopup, setShowStartPopup] = useState(true);

  const handleCallStart = () => {
    console.log("🚀 Starting inbound call...");
    setCallStatus("connecting");
    setIsCallActive(true);
    setShowCallInterface(true);
    // Simulate connection delay
    setTimeout(() => {
      setCallStatus("active");
    }, 2000);
  };

  const handleOutboundCallStart = () => {
    console.log("🚀 Starting outbound call to:", phoneNumber);
    setCallStatus("connecting");
    setIsCallActive(true);
    setShowCallInterface(true);
    // For outbound calls, we'll handle the actual calling in the LiveCallInterface
    setTimeout(() => {
      setCallStatus("active");
    }, 2000);
  };

  const handleMinimizeCall = () => {
    console.log("📱 Minimizing call window");
    setIsCallMinimized(true);
  };

  const handleMaximizeCall = () => {
    console.log("📱 Maximizing call window");
    setIsCallMinimized(false);
  };

  const handleCloseCall = () => {
    console.log("❌ Closing call window");
    setShowCallInterface(false);
    setIsCallMinimized(false);
    setCallStatus("idle");
    setIsCallActive(false);
  };

  const handleCallEnd = () => {
    console.log("📞 Call ended");
    setCallStatus("ended");
    setIsCallActive(false);

    // Notify and close the live call overlay immediately
    toast({ title: "Call ended" });
    setShowCallInterface(false);

    // Optionally refresh records shortly after
    setTimeout(() => {
      loadCallRecords(true);
      setCallStatus("idle");
    }, 1000);
  };

  const handleViewRecord = (record: CallRecord) => {
    setSelectedRecord(record);
    setShowRecordDetails(true);
  };

  const handleCloseRecordDetails = () => {
    setShowRecordDetails(false);
    setSelectedRecord(null);
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {/* Call Records Section */}
        <div className="bg-card rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Call Records
            </h2>
            <button
              onClick={() => loadCallRecords(true)}
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-destructive text-lg">⚠️</div>
                <div className="flex-1">
                  <p className="text-destructive text-sm font-medium">
                    Connection Failed
                  </p>
                  <p className="text-destructive text-xs mt-1">
                    Failed to load records.
                  </p>
                  <p className="text-muted-foreground text-xs mt-2">
                    Showing sample data.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {loading && callRecords.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading records…</p>
              </div>
            </div>
          ) : (
            <CallRecordsTable records={callRecords} onViewRecord={handleViewRecord} />
          )}
        </div>
      </main>

      {/* Call Type Selector */}
      {!showCallInterface && showStartPopup && (
        <div className="fixed bottom-6 right-6 z-40">
          <CallTypeSelector
            callType={callType}
            onCallTypeChange={setCallType}
            phoneNumber={phoneNumber}
            onPhoneNumberChange={setPhoneNumber}
            onStartCall={callType === "inbound" ? handleCallStart : handleOutboundCallStart}
            isCallActive={isCallActive}
            onClose={() => setShowStartPopup(false)}
          />
        </div>
      )}

      {/* Re-open Start New Call button when popup is closed */}
      {!showCallInterface && !showStartPopup && (
        <button
          onClick={() => setShowStartPopup(true)}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          title="Start New Call"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.19a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>
      )}

      {/* Full Screen Call Interface */}
      {showCallInterface && !isCallMinimized && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            {/* Control Buttons */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              {/* Minimize Button */}
              <button
                onClick={handleMinimizeCall}
                className="w-10 h-10 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/90 transition-all duration-200 border border-border/20"
                title="Minimize"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              {/* Close Button */}
              {/* <button
                onClick={handleCloseCall}
                className="w-10 h-10 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/90 transition-all duration-200 border border-border/20"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button> */}
            </div>
            
            <LiveCallInterface
              isCallActive={isCallActive}
              callStatus={callStatus}
              callType={callType}
              phoneNumber={phoneNumber}
              onCallStart={callType === "inbound" ? handleCallStart : handleOutboundCallStart}
              onCallEnd={handleCallEnd}
            />
          </div>
        </div>
      )}

      {/* Minimized Call Interface */}
      {showCallInterface && isCallMinimized && (
        <div className="fixed bottom-6 left-6 z-50">
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {/* Call Status Indicator */}
              <div className={`w-3 h-3 rounded-full ${
                callStatus === "active" || isCallActive 
                  ? "bg-green-500 animate-pulse" 
                  : callStatus === "connecting" 
                    ? "bg-yellow-500 animate-pulse" 
                    : "bg-gray-400"
              }`}></div>
              
              {/* Call Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {callType === "inbound" ? "Inbound Call" : `Calling ${phoneNumber}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {callStatus === "active" ? "Connected" : 
                   callStatus === "connecting" ? "Connecting..." : 
                   "Ready"}
                </p>
              </div>
              
              {/* Control Buttons */}
              <div className="flex gap-1">
                <button
                  onClick={handleMaximizeCall}
                  className="w-8 h-8 bg-primary/10 hover:bg-primary/20 rounded-lg flex items-center justify-center text-primary transition-colors"
                  title="Maximize"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                
                <button
                  onClick={handleCloseCall}
                  className="w-8 h-8 bg-destructive/10 hover:bg-destructive/20 rounded-lg flex items-center justify-center text-destructive transition-colors"
                  title="End Call"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Details Modal */}
      {showRecordDetails && selectedRecord && (
        <RecordDetailsModal
          isOpen={showRecordDetails}
          onClose={handleCloseRecordDetails}
          record={selectedRecord}
        />
      )}
    </div>
  );
};

export default Index;
