import { VAPI_API_KEY, VAPI_API_BASE_URL } from "./vapi-config";

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
  status: "queued" | "ringing" | "in-progress" | "forwarding" | "ended";
  endedReason?: string;
  messages?: Array<{
    role: "user" | "assistant" | "system" | string;
    time: number;
    message?: string;
    secondsFromStart: number;
    content?: string;
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
    analysisCostBreakdown?: Record<string, any>;
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
    messagesOpenAIFormatted?: Array<{ role: string; content: string }>;
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

// Outbound call types
export interface OutboundCallCustomer {
  number: string;
}

export interface OutboundCallRequest {
  assistantId: string;
  customer: OutboundCallCustomer;
  phoneNumberId?: string;
  // Optional: pass assistant preferences (voice, model, transcriber, firstMessage, variables, tools, etc.)
  assistantOverrides?: Record<string, any>;
}

export interface OutboundCallResponse {
  id: string;
  assistantId: string;
  customer: OutboundCallCustomer;
  status: "queued" | "ringing" | "in-progress" | "ended";
  startedAt?: string;
  endedAt?: string;
  cost?: number;
}

// Phone number types
export interface VapiPhoneNumber {
  id: string;
  orgId: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  twilioAccountSid: string;
  name: string;
  provider: string;
  status: string;
}

export interface VapiPhoneNumbersResponse {
  data?: VapiPhoneNumber[];
  hasMore?: boolean;
  nextCursor?: string;
  // The API might return the array directly
  [key: string]: any;
}

// Vapi API service class
export class VapiApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = VAPI_API_KEY;
    this.baseUrl = VAPI_API_BASE_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Check if API key is properly configured
    if (this.apiKey === "YOUR_VAPI_PRIVATE_KEY_HERE" || !this.apiKey) {
      throw new Error(
        "Vapi API Error: Private key not configured. Please set your Vapi private key in src/lib/vapi-config.ts"
      );
    }

    console.log(`🔄 Making Vapi API request to: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Vapi API Error: ${response.status} - ${errorText}`);

      if (response.status === 401) {
        throw new Error(
          "Vapi API Error: Unauthorized. Please check your API key in src/lib/vapi-config.ts"
        );
      } else if (response.status === 403) {
        throw new Error(
          "Vapi API Error: Forbidden. Please check your API permissions."
        );
      } else if (response.status === 404) {
        throw new Error("Vapi API Error: Resource not found.");
      } else if (response.status >= 500) {
        throw new Error(
          "Vapi API Error: Server error. Please try again later."
        );
      } else {
        throw new Error(`Vapi API Error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log(`✅ Vapi API response:`, data);
    console.log(`📊 Response type:`, typeof data);
    console.log(`📊 Is array:`, Array.isArray(data));
    console.log(
      `📊 Has data property:`,
      data && typeof data === "object" && "data" in data
    );

    return data;
  }

  // Get phone numbers
  async getPhoneNumbers(): Promise<VapiPhoneNumber[]> {
    console.log("🔄 Fetching phone numbers...");
    const response = await this.makeRequest<VapiPhoneNumbersResponse>(
      "/phone-number",
      {
        method: "GET",
      }
    );

    // Handle different response structures
    if (Array.isArray(response)) {
      return response;
    } else if (response && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.warn("Unexpected phone numbers response structure:", response);
      return [];
    }
  }

  // Get call logs
  async getCallLogs(limit: number = 100): Promise<VapiCallLog[]> {
    console.log(`�� Fetching call logs (limit: ${limit})...`);
    const response = await this.makeRequest<VapiCallLogsResponse>("/call", {
      method: "GET",
    });

    // Handle different response structures
    if (Array.isArray(response)) {
      return response;
    } else if (response && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.warn("Unexpected call logs response structure:", response);
      return [];
    }
  }

  // Get individual call details
  async getCallDetails(callId: string): Promise<VapiCallDetails> {
    console.log(`🔄 Fetching call details for: ${callId}`);
    return await this.makeRequest<VapiCallDetails>(`/call/${callId}`, {
      method: "GET",
    });
  }

  // Create outbound call
  async createOutboundCall(
    request: OutboundCallRequest
  ): Promise<OutboundCallResponse> {
    console.log("🔄 Creating outbound call to:", request.customer.number);
    const response = await this.makeRequest<OutboundCallResponse>(
      "/call/phone",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
    console.log("✅ Outbound call created:", response);
    return response;
  }

  // Check if transcript is already formatted with AI:/User: labels
  private isPreFormattedTranscript(transcript: string): boolean {
    return transcript.includes("AI:") || transcript.includes("User:");
  }

  // Extract transcript from multiple possible sources
  private extractTranscript(vapiLog: VapiCallLog): string {
    console.log("🔍 Extracting transcript from call log:", vapiLog.id);

    // Try different sources for transcript data
    let transcript = "";

    // 1. Direct transcript field (highest priority)
    if (vapiLog.transcript && vapiLog.transcript.trim()) {
      transcript = vapiLog.transcript;
      console.log(
        "📝 Found direct transcript:",
        transcript.substring(0, 100) + "..."
      );

      // If it's already formatted with AI:/User:, use it as-is
      if (this.isPreFormattedTranscript(transcript)) {
        console.log("📝 Transcript is pre-formatted, using as-is");
        return transcript;
      }
    }

    // 2. Artifact transcript
    if (
      !transcript &&
      vapiLog.artifact?.transcript &&
      vapiLog.artifact.transcript.trim()
    ) {
      transcript = vapiLog.artifact.transcript;
      console.log(
        "📝 Found artifact transcript:",
        transcript.substring(0, 100) + "..."
      );

      // If it's already formatted with AI:/User:, use it as-is
      if (this.isPreFormattedTranscript(transcript)) {
        console.log("📝 Artifact transcript is pre-formatted, using as-is");
        return transcript;
      }
    }

    // 3. Build transcript from messages (only if no pre-formatted transcript found)
    if (!transcript && vapiLog.messages && vapiLog.messages.length > 0) {
      const messageTranscripts = vapiLog.messages
        .filter((msg) => msg.content || msg.message)
        .map((msg) => {
          const role =
            msg.role === "user"
              ? "User"
              : msg.role === "assistant"
              ? "AI"
              : "System";
          const content = msg.content || msg.message || "";
          return `${role}: ${content}`;
        })
        .join("\n");

      if (messageTranscripts.trim()) {
        transcript = messageTranscripts;
        console.log(
          "📝 Built transcript from messages:",
          transcript.substring(0, 100) + "..."
        );
      }
    }

    // 4. Try artifact messages (only if no pre-formatted transcript found)
    if (
      !transcript &&
      vapiLog.artifact?.messages &&
      Array.isArray(vapiLog.artifact.messages)
    ) {
      const artifactMessages = vapiLog.artifact.messages
        .filter((msg: any) => msg.content || msg.message)
        .map((msg: any) => {
          const role =
            msg.role === "user"
              ? "User"
              : msg.role === "assistant"
              ? "AI"
              : "System";
          const content = msg.content || msg.message || "";
          return `${role}: ${content}`;
        })
        .join("\n");

      if (artifactMessages.trim()) {
        transcript = artifactMessages;
        console.log(
          "📝 Built transcript from artifact messages:",
          transcript.substring(0, 100) + "..."
        );
      }
    }

    if (!transcript) {
      console.log("⚠️ No transcript found for call:", vapiLog.id);
    }

    return transcript;
  }

  // Convert Vapi call log to our internal format
  convertToCallRecord(vapiLog: VapiCallLog): any {
    const callType = vapiLog.type === "outbound" ? "outbound" : "inbound";

    // Extract transcript from multiple sources
    const transcript = this.extractTranscript(vapiLog);

    return {
      id: vapiLog.id,
      callType,
      phoneNumber: vapiLog.webCallUrl || "N/A",
      duration: this.calculateDuration(vapiLog.startedAt, vapiLog.endedAt),
      status: vapiLog.status,
      startedAt: vapiLog.startedAt,
      endedAt: vapiLog.endedAt,
      cost: vapiLog.cost || 0,
      transcript: transcript,
      recordingUrl: vapiLog.recordingUrl || vapiLog.stereoRecordingUrl,
      summary: vapiLog.summary || "",
      messages: vapiLog.messages || [],
      endedReason: vapiLog.endedReason,
      assistantId: vapiLog.assistantId,
      orgId: vapiLog.orgId,
      createdAt: vapiLog.createdAt,
      updatedAt: vapiLog.updatedAt,
      costBreakdown: vapiLog.costBreakdown,
      assistantOverrides: vapiLog.assistantOverrides,
      analysis: vapiLog.analysis,
      artifact: vapiLog.artifact,
      costs: vapiLog.costs,
      monitor: vapiLog.monitor,
      transport: vapiLog.transport,
    };
  }

  private calculateDuration(startedAt: string, endedAt?: string): string {
    if (!endedAt) return "Ongoing";

    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const diffMs = end.getTime() - start.getTime();

    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

// Create and export a singleton instance
export const vapiApiService = new VapiApiService();
