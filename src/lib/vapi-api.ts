import { VAPI_API_KEY, VAPI_API_BASE_URL } from './vapi-config';

// Types for Vapi API responses (updated based on actual API response)
export interface VapiCallLog {
  id: string;
  assistantId: string;
  type: string;
  startedAt: string;
  endedAt?: string;
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  cost?: number;
  webCallUrl?: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';
  endedReason?: string;
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    time: number;
    message: string;
    secondsFromStart: number;
  }>;
  stereoRecordingUrl?: string;
  costBreakdown?: {
    transport: number;
    stt: number;
    llm: number;
    tts: number;
    vapi: number;
    chat: number;
    total: number;
    llmPromptTokens: number;
    llmCompletionTokens: number;
    ttsCharacters: number;
  };
  assistantOverrides?: Record<string, any>;
  analysis?: Record<string, any>;
  artifact?: {
    recordingUrl?: string;
    stereoRecordingUrl?: string;
    recording?: {
      stereoUrl?: string;
      mono?: {
        combinedUrl?: string;
        assistantUrl?: string;
        customerUrl?: string;
      };
    };
    messages?: Array<any>;
    messagesOpenAIFormatted?: Array<any>;
    transcript?: string;
    logUrl?: string;
    nodes?: Array<any>;
    variableValues?: Record<string, any>;
    variables?: Record<string, any>;
    performanceMetrics?: Record<string, any>;
  };
  costs?: Array<{
    cost: number;
    type: string;
    minutes?: number;
    transcriber?: any;
    model?: any;
    voice?: any;
    promptTokens?: number;
    completionTokens?: number;
    characters?: number;
    subType?: string;
  }>;
  monitor?: {
    listenUrl: string;
    controlUrl: string;
  };
  transport?: {
    callUrl: string;
    provider: string;
    assistantVideoEnabled: boolean;
  };
}

export interface VapiCallLogsResponse {
  data?: VapiCallLog[];
  hasMore?: boolean;
  nextCursor?: string;
  // The API might return the array directly
  [key: string]: any;
}

export interface VapiCallDetails extends VapiCallLog {
  // Additional details for individual call
}

// Vapi API service class
export class VapiApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = VAPI_API_KEY;
    this.baseUrl = VAPI_API_BASE_URL;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Check if API key is properly configured
    if (this.apiKey === 'YOUR_VAPI_PRIVATE_KEY_HERE' || !this.apiKey) {
      throw new Error('Vapi API Error: Private key not configured. Please set your Vapi private key in src/lib/vapi-config.ts');
    }
    
    console.log(`🔄 Making Vapi API request to: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Vapi API Error: ${response.status} - ${errorText}`);
      
      if (response.status === 401) {
        throw new Error(`Vapi API Error: Unauthorized (401) - Invalid API key. Please check that you're using your Vapi PRIVATE key (not public key) in src/lib/vapi-config.ts. Error: ${errorText}`);
      }
      
      if (response.status === 400) {
        throw new Error(`Vapi API Error: Bad Request (400) - ${errorText}. Please check the API endpoint and parameters.`);
      }
      
      throw new Error(`Vapi API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Vapi API response:`, data);
    console.log(`📊 Response type:`, typeof data);
    console.log(`📊 Is array:`, Array.isArray(data));
    console.log(`📊 Has data property:`, 'data' in data);
    if ('data' in data) {
      console.log(`📊 Data property type:`, typeof data.data);
      console.log(`📊 Data is array:`, Array.isArray(data.data));
    }
    return data;
  }

  // Get call logs with pagination
  async getCallLogs(limit: number = 100, cursor?: string): Promise<VapiCallLogsResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    
    if (cursor) {
      params.append('cursor', cursor);
    }

    // Try the correct endpoint - based on Vapi docs, it should be /call (singular)
    return this.makeRequest<VapiCallLogsResponse>(`/call?${params.toString()}`);
  }

  // Get specific call details
  async getCallDetails(callId: string): Promise<VapiCallDetails> {
    return this.makeRequest<VapiCallDetails>(`/call/${callId}`);
  }

  // Get all call logs (handles pagination automatically)
  async getAllCallLogs(): Promise<VapiCallLog[]> {
    try {
      const allLogs: VapiCallLog[] = [];
      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const response = await this.getCallLogs(100, cursor);
        
        // Handle different response structures
        let logs: VapiCallLog[] = [];
        if (Array.isArray(response)) {
          // API returns array directly
          logs = response;
          hasMore = false;
        } else if (response.data && Array.isArray(response.data)) {
          // API returns {data: [...]}
          logs = response.data;
          hasMore = response.hasMore || false;
          cursor = response.nextCursor;
        } else {
          console.error('Unexpected API response structure:', response);
          break;
        }
        
        allLogs.push(...logs);
        
        if (!hasMore) break;
      }

      return allLogs;
    } catch (error) {
      console.error('Failed to get call logs from /call endpoint, trying alternative...', error);
      
      // Try alternative endpoint
      try {
        return await this.getCallLogsAlternative();
      } catch (altError) {
        console.error('Alternative endpoint also failed:', altError);
        throw error; // Throw original error
      }
    }
  }

  // Alternative method to get call logs
  private async getCallLogsAlternative(): Promise<VapiCallLog[]> {
    console.log('🔄 Trying alternative endpoint: /calls');
    
    const params = new URLSearchParams({
      limit: '100',
    });

    const response = await this.makeRequest<VapiCallLogsResponse>(`/calls?${params.toString()}`);
    
    // Handle different response structures
    if (Array.isArray(response)) {
      return response;
    } else if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.error('Unexpected alternative API response structure:', response);
      return [];
    }
  }

  // Convert Vapi call log to our CallRecord format
  convertToCallRecord(vapiLog: VapiCallLog): {
    id: string;
    candidateName: string;
    phoneNumber: string;
    position: string;
    experience: string;
    interviewDate: string;
    callStatus: "completed" | "pending" | "failed";
  } {
    // Extract candidate information from transcript or metadata
    const candidateName = this.extractCandidateName(vapiLog);
    const phoneNumber = this.extractPhoneNumber(vapiLog);
    const position = this.extractPosition(vapiLog);
    const experience = this.extractExperience(vapiLog);
    
    // Convert status
    const callStatus = this.convertCallStatus(vapiLog.status);
    
    // Format date
    const interviewDate = new Date(vapiLog.startedAt).toLocaleString();

    return {
      id: vapiLog.id,
      candidateName,
      phoneNumber,
      position,
      experience,
      interviewDate,
      callStatus,
    };
  }

  // Helper methods to extract information from call logs
  private extractCandidateName(vapiLog: VapiCallLog): string {
    // Try to extract from artifact messages first
    if (vapiLog.artifact?.messages) {
      const userMessages = vapiLog.artifact.messages.filter(msg => msg.role === 'user');
      for (const msg of userMessages) {
        const nameMatch = msg.message.match(/name[:\s]+([A-Za-z\s]+)/i);
        if (nameMatch) {
          return nameMatch[1].trim();
        }
      }
    }

    // Try to extract from main messages
    if (vapiLog.messages) {
      const userMessages = vapiLog.messages.filter(msg => msg.role === 'user');
      for (const msg of userMessages) {
        const nameMatch = msg.message.match(/name[:\s]+([A-Za-z\s]+)/i);
        if (nameMatch) {
          return nameMatch[1].trim();
        }
      }
    }

    // Try to extract from transcript
    if (vapiLog.transcript) {
      const nameMatch = vapiLog.transcript.match(/name[:\s]+([A-Za-z\s]+)/i);
      if (nameMatch) {
        return nameMatch[1].trim();
      }
    }

    // Fallback to call ID
    return `Candidate ${vapiLog.id.slice(-4)}`;
  }

  private extractPosition(vapiLog: VapiCallLog): string {
    // Try to extract from artifact messages first
    if (vapiLog.artifact?.messages) {
      const userMessages = vapiLog.artifact.messages.filter(msg => msg.role === 'user');
      for (const msg of userMessages) {
        const positionMatch = msg.message.match(/(developer|engineer|designer|manager|analyst|angular|react|node|\.net|ios|ionic)/i);
        if (positionMatch) {
          return positionMatch[1];
        }
      }
    }

    // Try to extract from main messages
    if (vapiLog.messages) {
      const userMessages = vapiLog.messages.filter(msg => msg.role === 'user');
      for (const msg of userMessages) {
        const positionMatch = msg.message.match(/(developer|engineer|designer|manager|analyst|angular|react|node|\.net|ios|ionic)/i);
        if (positionMatch) {
          return positionMatch[1];
        }
      }
    }

    // Try to extract from transcript
    if (vapiLog.transcript) {
      const positionMatch = vapiLog.transcript.match(/(developer|engineer|designer|manager|analyst|angular|react|node|\.net|ios|ionic)/i);
      if (positionMatch) {
        return positionMatch[1];
      }
    }

    return "Not specified";
  }

  private extractExperience(vapiLog: VapiCallLog): string {
    // Try to extract from artifact messages first
    if (vapiLog.artifact?.messages) {
      const userMessages = vapiLog.artifact.messages.filter(msg => msg.role === 'user');
      for (const msg of userMessages) {
        const experienceMatch = msg.message.match(/(\d+)\s*(year|yr)/i);
        if (experienceMatch) {
          return `${experienceMatch[1]} years`;
        }
      }
    }

    // Try to extract from main messages
    if (vapiLog.messages) {
      const userMessages = vapiLog.messages.filter(msg => msg.role === 'user');
      for (const msg of userMessages) {
        const experienceMatch = msg.message.match(/(\d+)\s*(year|yr)/i);
        if (experienceMatch) {
          return `${experienceMatch[1]} years`;
        }
      }
    }

    // Try to extract from transcript
    if (vapiLog.transcript) {
      const experienceMatch = vapiLog.transcript.match(/(\d+)\s*(year|yr)/i);
      if (experienceMatch) {
        return `${experienceMatch[1]} years`;
      }
    }

    return "Not specified";
  }

  private extractPhoneNumber(vapiLog: VapiCallLog): string {
    // Try to extract from artifact messages first
    if (vapiLog.artifact?.messages) {
      const userMessages = vapiLog.artifact.messages.filter(msg => msg.role === 'user');
      for (const msg of userMessages) {
        const phoneMatch = msg.message.match(/(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})/);
        if (phoneMatch) {
          return phoneMatch[1];
        }
      }
    }

    // Try to extract from main messages
    if (vapiLog.messages) {
      const userMessages = vapiLog.messages.filter(msg => msg.role === 'user');
      for (const msg of userMessages) {
        const phoneMatch = msg.message.match(/(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})/);
        if (phoneMatch) {
          return phoneMatch[1];
        }
      }
    }

    // Try to extract from transcript
    if (vapiLog.transcript) {
      const phoneMatch = vapiLog.transcript.match(/(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})/);
      if (phoneMatch) {
        return phoneMatch[1];
      }
    }

    return "Not provided";
  }

  private convertCallStatus(vapiStatus: string): "completed" | "pending" | "failed" {
    switch (vapiStatus) {
      case 'ended':
        return 'completed';
      case 'in-progress':
      case 'ringing':
      case 'queued':
        return 'pending';
      default:
        return 'failed';
    }
  }
}

// Export singleton instance
export const vapiApiService = new VapiApiService();
