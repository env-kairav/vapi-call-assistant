import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { CallRecordsTable } from "@/components/CallRecordsTable";
import { LiveCallInterface } from "@/components/LiveCallInterface";
import { CallSummaryModal } from "@/components/CallSummaryModal";
import { RecordDetailsModal } from "@/components/RecordDetailsModal";
import { vapiApiService } from "@/lib/vapi-api";

export interface CallRecord {
  id: string;
  candidateName: string;
  phoneNumber: string;
  position: string;
  experience: string;
  interviewDate: string;
  callStatus: "completed" | "pending" | "failed";
}

export interface CallSummary {
  candidateName: string;
  phoneNumber: string;
  position: string;
  experience: string;
  interviewDate: string;
}

// Utility function for managing call records using Vapi API
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
      console.log('🔄 Loading call records from Vapi API...');
      const vapiLogs = await vapiApiService.getAllCallLogs();
      
      // Convert Vapi logs to our CallRecord format
      const records = vapiLogs.map(log => vapiApiService.convertToCallRecord(log));
      
      console.log(`✅ Loaded ${records.length} call records from Vapi`);
      setCallRecords(records);
    } catch (err) {
      console.error('❌ Failed to load call records:', err);
      
      let errorMessage = 'Failed to load call records';
      if (err instanceof Error) {
        if (err.message.includes('response.data is not iterable')) {
          errorMessage = 'API response format error. Please check Vapi API configuration.';
        } else if (err.message.includes('404')) {
          errorMessage = 'API endpoint not found. Please verify the Vapi API endpoint.';
        } else if (err.message.includes('401')) {
          errorMessage = 'Unauthorized. Please check your Vapi API key.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Fallback to mock data if API fails
      console.log('🔄 Falling back to mock data...');
      setCallRecords([
        {
          id: "1",
          candidateName: "John Smith",
          phoneNumber: "+1 (555) 987-6543",
          position: "Full Stack Developer",
          experience: "3 years",
          interviewDate: "2024-01-15 10:30 AM",
          callStatus: "completed"
        },
        {
          id: "2", 
          candidateName: "Emily Davis",
          phoneNumber: "+1 (555) 456-7890",
          position: "UI/UX Designer",
          experience: "2 years",
          interviewDate: "2024-01-14 2:15 PM",
          callStatus: "completed"
        },
        {
          id: "3",
          candidateName: "Michael Johnson",
          phoneNumber: "+1 (555) 321-0987",
          position: "Backend Developer",
          experience: "4 years", 
          interviewDate: "2024-01-13 11:00 AM",
          callStatus: "pending"
        }
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
  const [showCallSummary, setShowCallSummary] = useState(false);
  const [callSummary, setCallSummary] = useState<CallSummary | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "active" | "ended">("idle");
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CallRecord | null>(null);
  const [showRecordDetails, setShowRecordDetails] = useState(false);

  const handleCallStart = () => {
    setCallStatus("connecting");
    setIsCallActive(true);
    setShowCallInterface(true);
    // Simulate connection delay
    setTimeout(() => {
      setCallStatus("active");
    }, 2000);
  };

  const handleCallEnd = () => {
    setCallStatus("ended");
    setIsCallActive(false);
    
    // Show call summary after call ends
    const summary: CallSummary = {
      candidateName: "Sarah Johnson",
      phoneNumber: "+1 (555) 123-4567",
      position: "Senior Frontend Developer",
      experience: "5 years",
      interviewDate: new Date().toLocaleString(),
    };
    
    setCallSummary(summary);
    setShowCallSummary(true);
    
    setTimeout(() => {
      setCallStatus("idle");
      setShowCallInterface(false);
    }, 3000);
  };

  const handleViewRecord = (record: CallRecord) => {
    setSelectedRecord(record);
    setShowRecordDetails(true);
  };

  const handleCloseRecordDetails = () => {
    setShowRecordDetails(false);
    setSelectedRecord(null);
  };

  const handleCloseSummary = () => {
    if (callSummary) {
      // Add the call summary to records - APPENDS to existing records, doesn't replace
      const newRecord: CallRecord = {
        id: Date.now().toString(),
        candidateName: callSummary.candidateName,
        phoneNumber: callSummary.phoneNumber,
        position: callSummary.position,
        experience: callSummary.experience,
        interviewDate: callSummary.interviewDate,
        callStatus: "completed",
      };
      // Use the utility function to append new record
      addCallRecord(newRecord);
    }
    setShowCallSummary(false);
    setCallSummary(null);
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
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-destructive text-lg">⚠️</div>
                <div className="flex-1">
                  <p className="text-destructive text-sm font-medium">
                    Vapi API Connection Failed
                  </p>
                  <p className="text-destructive text-xs mt-1">
                    {error}
                  </p>
                  {error.includes('Private key not configured') && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <p className="text-yellow-800 font-medium">How to fix:</p>
                      <ol className="text-yellow-700 mt-1 list-decimal list-inside space-y-1">
                        <li>Go to your Vapi dashboard</li>
                        <li>Copy your <strong>Private Key</strong> (not Public Key)</li>
                        <li>Replace <code>YOUR_VAPI_PRIVATE_KEY_HERE</code> in <code>src/lib/vapi-config.ts</code></li>
                        <li>Refresh the page</li>
                      </ol>
                    </div>
                  )}
                  <p className="text-muted-foreground text-xs mt-2">
                    Showing fallback data. Call records will be fetched from Vapi once configured.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {loading && callRecords.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading call records from Vapi...</p>
              </div>
            </div>
          ) : (
            <CallRecordsTable records={callRecords} onViewRecord={handleViewRecord} />
          )}
        </div>
      </main>

      {/* Floating Call Widget */}
      {!showCallInterface && (
        <button
          onClick={() => setShowCallInterface(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-siri rounded-full shadow-glow hover:shadow-intense transition-all duration-300 animate-pulse-glow z-40"
        >
          <div className="w-full h-full bg-gradient-call rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-foreground rounded-full opacity-80"></div>
          </div>
        </button>
      )}

      {/* Full Screen Call Interface */}
      {showCallInterface && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowCallInterface(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/90 transition-all duration-200 border border-border/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <LiveCallInterface
              isCallActive={isCallActive}
              callStatus={callStatus}
              onCallStart={handleCallStart}
              onCallEnd={handleCallEnd}
              onCallSummary={(summary) => {
                setCallSummary(summary);
                setShowCallSummary(true);
                // Refresh call records after new call
                setTimeout(() => {
                  loadCallRecords(true);
                }, 2000);
              }}
            />
          </div>
        </div>
      )}

      {/* Call Summary Modal */}
      <CallSummaryModal
        isOpen={showCallSummary}
        onClose={handleCloseSummary}
        callSummary={callSummary}
      />

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