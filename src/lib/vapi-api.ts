import { VAPI_API_KEY, VAPI_API_BASE_URL } from "./vapi-config";

interface ApiError extends Error {
  status?: number;
}

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
    analysisCostBreakdown?: Record<string, unknown>;
  };
  assistantOverrides?: Record<string, unknown>;
  analysis?: Record<string, unknown>;
  artifact?: {
    recordingUrl?: string;
    stereoRecordingUrl?: string;
    recording?: {
      stereoUrl?: string;
      mono?: {
        combinedUrl?: string;
        assistantUrl?: string;
        userUrl?: string;
      };
    };
    transcript?: string;
    messages?: Array<{
      role: "user" | "assistant" | "system" | string;
      time: number;
      message?: string;
      secondsFromStart: number;
      content?: string;
    }>;
  };
}

export interface VapiCallLogsResponse {
  data: VapiCallLog[];
  hasMore: boolean;
}

export type VapiCallDetails = VapiCallLog;

export interface OutboundCallCustomer {
  number: string;
}

export interface OutboundCallRequest {
  assistantId: string;
  customer: OutboundCallCustomer;
  phoneNumberId: string;
  assistantOverrides?: {
    firstMessage?: string;
    voice?: {
      provider: string;
      voiceId: string;
    };
    transcriber?: {
      provider: string;
      model: string;
      language: string;
      smartFormat: boolean;
    };
    model?: {
      provider: string;
      model: string;
      temperature: number;
      messages: Array<{
        role: string;
        content: string;
      }>;
    };
  };
}

export interface OutboundCallResponse {
  id: string;
  assistantId: string;
  customer: OutboundCallCustomer;
  phoneNumberId: string;
  status: string;
  createdAt: string;
}

export interface VapiPhoneNumber {
  id: string;
  number: string;
  provider: string;
  name?: string;
  status?: string;
  createdAt?: string;
  country?: string;
  city?: string;
  cost?: number;
}

export interface VapiPhoneNumbersResponse {
  data: VapiPhoneNumber[];
}

// Create Phone Number payloads (subset focused on common fields per provider)
export type CreatePhoneNumberRequest =
  | {
      provider: "twilio";
      name?: string;
      number: string; // E164
      accountSid: string;
      authToken: string;
      smsEnabled?: boolean;
      description?: string;
    }
  | {
      provider: "vapi" | "byo-phone-number" | "telnyx" | "vonage";
      name?: string;
      number?: string;
      credentialId?: string;
      description?: string;
    };

export type CreatePhoneNumberResponse = unknown; // Diverse per provider – keep flexible

// Exact payload for Twilio import endpoint
export interface ImportTwilioPhoneNumberRequest {
  name: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string; // E164
}
export type ImportTwilioPhoneNumberResponse = unknown;

export interface CallRecord {
  id: string;
  type: "inbound" | "outbound";
  phoneNumber: string;
  duration: string;
  callStatus: "completed" | "pending" | "failed";
  startedAt: string;
  endedAt?: string;
  cost?: number;
  summary?: string;
  transcript?: string;
  messages?: CallRecordMessage[];
}

export interface CallRecordMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface CallSummary {
  summary: string;
  transcript: string;
  messages: CallRecordMessage[];
}

class VapiApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = VAPI_API_BASE_URL;
    this.apiKey = VAPI_API_KEY;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    console.log(`🔄 Making request to: ${url}`);
    console.log(`📋 Request config:`, config);

    try {
      const response = await fetch(url, config);
      console.log(`📊 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        let message = `Request failed with status ${response.status}`;
        try {
          const json = JSON.parse(errorText || "{}");
          if (json && typeof json === "object") {
            message = json.message || json.error || message;
          }
        } catch (_) {
          if (errorText && errorText.trim()) {
            message = errorText;
          }
        }
        console.error(`❌ API Error: ${response.status} - ${message}`);
        const err = new Error(message) as ApiError;
        err.status = response.status;
        throw err;
      }

      const responseText = await response.text();
      console.log(`📝 Response text length: ${responseText.length}`);

      if (!responseText || responseText.trim() === "") {
        console.log("📝 Empty response, returning empty array");
        return [] as T;
      }

      let data: T;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        console.log("📝 Raw response:", responseText);
        throw new Error("Failed to parse JSON response");
      }

      console.log(`✅ Vapi API response:`, data);
      console.log(`📊 Response type:`, typeof data);
      console.log(`📊 Is array:`, Array.isArray(data));
      console.log(
        `📊 Has data property:`,
        data && typeof data === "object" && "data" in data
      );

      return data;
    } catch (error) {
      console.error("❌ Request failed:", error);
      throw error;
    }
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
    console.log(`🔄 Fetching call logs (limit: ${limit})...`);
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

  // Create web call (for inbound calls)
  async createWebCall(
    request: OutboundCallRequest
  ): Promise<OutboundCallResponse> {
    console.log("🔄 Creating web call...");
    const response = await this.makeRequest<OutboundCallResponse>(
      "/call/web",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
    console.log("✅ Web call created:", response);
    return response;
  }

  // Create phone number
  async createPhoneNumber(
    request: CreatePhoneNumberRequest
  ): Promise<CreatePhoneNumberResponse> {
    console.log("🔄 Creating phone number with provider:", request.provider);
    const response = await this.makeRequest<CreatePhoneNumberResponse>(
      "/phone-number",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
    console.log("✅ Phone number created:", response);
    return response;
  }

  // Import Twilio phone number (exact endpoint/payload)
  async importTwilioPhoneNumber(
    request: ImportTwilioPhoneNumberRequest
  ): Promise<ImportTwilioPhoneNumberResponse> {
    console.log("🔄 Importing Twilio phone number:", request.twilioPhoneNumber);
    const response = await this.makeRequest<ImportTwilioPhoneNumberResponse>(
      "/phone-number/import/twilio",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
    console.log("✅ Twilio phone number imported:", response);
    return response;
  }

  // Delete phone number by id
  async deletePhoneNumber(id: string): Promise<unknown> {
    console.log("🗑️ Deleting phone number:", id);
    const response = await this.makeRequest<unknown>(`/phone-number/${id}`, {
      method: "DELETE",
    });
    console.log("✅ Phone number deleted:", response);
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

    // 2. Check artifact.transcript
    if (!transcript && vapiLog.artifact?.transcript) {
      transcript = vapiLog.artifact.transcript;
      console.log(
        "📝 Found artifact transcript:",
        transcript.substring(0, 100) + "..."
      );
    }

    // 3. Check messages array
    if (!transcript && vapiLog.messages && vapiLog.messages.length > 0) {
      const messageTexts = vapiLog.messages
        .filter((msg) => msg.role !== "system")
        .map((msg) => `${msg.role === "user" ? "User" : "AI"}: ${msg.content || msg.message || ""}`)
        .join("\n");
      
      if (messageTexts.trim()) {
        transcript = messageTexts;
        console.log(
          "📝 Found messages transcript:",
          transcript.substring(0, 100) + "..."
        );
      }
    }

    // 4. Check artifact.messages
    if (!transcript && vapiLog.artifact?.messages && vapiLog.artifact.messages.length > 0) {
      const messageTexts = vapiLog.artifact.messages
        .filter((msg) => msg.role !== "system")
        .map((msg) => `${msg.role === "user" ? "User" : "AI"}: ${msg.content || msg.message || ""}`)
        .join("\n");
      
      if (messageTexts.trim()) {
        transcript = messageTexts;
        console.log(
          "📝 Found artifact messages transcript:",
          transcript.substring(0, 100) + "..."
        );
      }
    }

    if (!transcript) {
      console.log("⚠️ No transcript found in any source");
      return "No transcript available";
    }

    console.log("✅ Final transcript extracted:", transcript.substring(0, 200) + "...");
    return transcript;
  }

  // Convert VapiCallLog to CallRecord
  convertToCallRecord(vapiLog: VapiCallLog): CallRecord {
    console.log("🔄 Converting VapiCallLog to CallRecord:", vapiLog.id);

    // Determine call type based on the log
    const callType: "inbound" | "outbound" = vapiLog.type === "inbound" ? "inbound" : "outbound";

    // Map VAPI status to CallRecord callStatus
    const mapStatus = (status: string): "completed" | "pending" | "failed" => {
      switch (status) {
        case "ended":
          return "completed";
        case "in-progress":
        case "ringing":
        case "queued":
        case "forwarding":
          return "pending";
        default:
          return "failed";
      }
    };

    return {
      id: vapiLog.id,
      type: callType,
      phoneNumber: "Unknown", // VAPI doesn't provide phone number in logs
      duration: this.calculateDuration(vapiLog.startedAt, vapiLog.endedAt),
      callStatus: mapStatus(vapiLog.status), // Fixed: use callStatus instead of status
      startedAt: vapiLog.startedAt,
      endedAt: vapiLog.endedAt,
      cost: vapiLog.cost,
      summary: vapiLog.summary,
      transcript: this.extractTranscript(vapiLog),
      messages: vapiLog.messages?.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content || msg.message || "",
        timestamp: msg.time,
      })) || [],
    };
  }

  // Calculate call duration
  private calculateDuration(startedAt: string, endedAt?: string): string {
    if (!endedAt) {
      return "Ongoing";
    }

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
