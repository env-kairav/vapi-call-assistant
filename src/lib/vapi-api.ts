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
          `Vapi API Error: Unauthorized (401) - Invalid API key. Please check that you're using your Vapi PRIVATE key (not public key) in src/lib/vapi-config.ts. Error: ${errorText}`
        );
      }

      if (response.status === 400) {
        throw new Error(
          `Vapi API Error: Bad Request (400) - ${errorText}. Please check the API endpoint and parameters.`
        );
      }

      throw new Error(`Vapi API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Vapi API response:`, data);
    console.log(`📊 Response type:`, typeof data);
    console.log(`📊 Is array:`, Array.isArray(data));
    console.log(`📊 Has data property:`, "data" in data);
    if ("data" in data) {
      console.log(`📊 Data property type:`, typeof (data as any).data);
      console.log(`📊 Data is array:`, Array.isArray((data as any).data));
    }
    return data;
  }

  // Get call logs with pagination
  async getCallLogs(
    limit: number = 100,
    cursor?: string
  ): Promise<VapiCallLogsResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (cursor) {
      params.append("cursor", cursor);
    }

    // Try the correct endpoint - based on Vapi docs, it should be /call (singular)
    return this.makeRequest<VapiCallLogsResponse>(`/call?${params.toString()}`);
  }

  // Get specific call details
  async getCallDetails(callId: string): Promise<VapiCallDetails> {
    return this.makeRequest<VapiCallDetails>(`/call/${callId}`);
  }

  // Create outbound call - Updated to use correct endpoint
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
          logs = response as unknown as VapiCallLog[];
          hasMore = false;
        } else if (
          (response as any).data &&
          Array.isArray((response as any).data)
        ) {
          // API returns {data: [...]}
          logs = (response as any).data;
          hasMore = (response as any).hasMore || false;
          cursor = (response as any).nextCursor;
        } else {
          console.error("Unexpected API response structure:", response);
          break;
        }

        allLogs.push(...logs);

        if (!hasMore) break;
      }

      return allLogs;
    } catch (error) {
      console.error(
        "Failed to get call logs from /call endpoint, trying alternative...",
        error
      );

      // Try alternative endpoint
      try {
        return await this.getCallLogsAlternative();
      } catch (altError) {
        console.error("Alternative endpoint also failed:", altError);
        throw error; // Throw original error
      }
    }
  }

  // Alternative method to get call logs
  private async getCallLogsAlternative(): Promise<VapiCallLog[]> {
    console.log("🔄 Trying alternative endpoint: /calls");

    const params = new URLSearchParams({
      limit: "100",
    });

    const response = await this.makeRequest<VapiCallLogsResponse>(
      `/calls?${params.toString()}`
    );

    // Handle different response structures
    if (Array.isArray(response)) {
      return response as unknown as VapiCallLog[];
    } else if (
      (response as any).data &&
      Array.isArray((response as any).data)
    ) {
      return (response as any).data;
    } else {
      console.error("Unexpected alternative API response structure:", response);
      return [];
    }
  }

  // Convert Vapi call log to our CallRecord-like format
  convertToCallRecord(vapiLog: VapiCallLog) {
    // Extract candidate information from transcript or metadata (parsed; may be inaccurate)
    const candidateName = this.extractCandidateName(vapiLog);
    const phoneNumber = this.extractPhoneNumber(vapiLog);
    const position = this.extractPosition(vapiLog);
    const experience = this.extractExperience(vapiLog);

    // Convert status
    const callStatus = this.convertCallStatus(vapiLog.status);

    // Compute useful fields
    const startedAtIso = vapiLog.startedAt;
    const endedAtIso = vapiLog.endedAt;
    const summary = vapiLog.summary || (vapiLog.analysis as any)?.summary;
    const recordingUrl =
      vapiLog.recordingUrl ||
      vapiLog.artifact?.recordingUrl ||
      vapiLog.artifact?.recording?.mono?.combinedUrl;
    const transcriptFull = (
      vapiLog.transcript ||
      vapiLog.artifact?.transcript ||
      ""
    )?.toString();
    const transcriptSnippet = transcriptFull?.slice(0, 140);

    // Normalize messages from both sources
    // Determine call type (inbound vs outbound)
    // VAPI logs usually have a 'type' field that indicates the call direction
    const callType: "inbound" | "outbound" =
      vapiLog.type === "outboundPhoneCall" ? "outbound" : "inbound";

    const normalizedMessages = this.normalizeMessages(vapiLog);

    return {
      id: vapiLog.id,
      callType,
      callStatus,
      startedAt: startedAtIso,
      endedAt: endedAtIso,
      summary,
      endedReason: vapiLog.endedReason,
      recordingUrl,
      assistantId: vapiLog.assistantId,
      webCallUrl: vapiLog.webCallUrl,
      transcriptSnippet,
      transcript: transcriptFull,
      messages: normalizedMessages,
      // Parsed fields
      candidateName,
      phoneNumber,
      position,
      experience,
    };
  }

  private normalizeMessages(vapiLog: VapiCallLog) {
    const collected: Array<{
      role: "user" | "assistant" | "system";
      content: string;
      time?: number;
    }> = [];

    const mapRole = (
      r?: string
    ): "user" | "assistant" | "system" | undefined => {
      if (!r) return undefined;
      const lower = r.toLowerCase();
      if (lower === "bot" || lower === "assistant") return "assistant";
      if (lower === "user" || lower === "customer") return "user";
      if (lower === "system") return "system";
      return undefined;
    };

    // Top-level messages
    if (Array.isArray(vapiLog.messages)) {
      for (const m of vapiLog.messages as any[]) {
        if (!m) continue;
        const role = mapRole(m.role);
        const content = (m.message ?? m.content ?? "").toString();
        if (!role || !content) continue;
        collected.push({ role, content, time: (m as any).time });
      }
    }

    // Artifact messages
    if (Array.isArray(vapiLog.artifact?.messages)) {
      for (const m of vapiLog.artifact!.messages as any[]) {
        if (!m) continue;
        const role = mapRole(m.role);
        const content = (m.message ?? m.content ?? "").toString();
        const time = (m.time as number) || undefined;
        if (!role || !content) continue;
        collected.push({ role, content, time });
      }
    }

    // OpenAI formatted messages
    if (Array.isArray(vapiLog.artifact?.messagesOpenAIFormatted)) {
      for (const m of vapiLog.artifact!.messagesOpenAIFormatted as any[]) {
        if (!m) continue;
        const role = mapRole(m.role);
        const content = (m.content ?? "").toString();
        if (!role || !content) continue;
        collected.push({ role, content });
      }
    }

    // Sort by time if available
    collected.sort((a, b) => {
      if (a.time == null && b.time == null) return 0;
      if (a.time == null) return 1;
      if (b.time == null) return -1;
      return a.time - b.time;
    });

    // Deduplicate by role+content (trimmed) and remove adjacent duplicates
    const seen = new Set<string>();
    const unique: typeof collected = [];
    for (const m of collected) {
      const key = `${m.role}|${m.content.trim()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (unique.length > 0) {
        const prev = unique[unique.length - 1];
        if (prev.role === m.role && prev.content.trim() === m.content.trim()) {
          continue;
        }
      }
      unique.push(m);
    }

    // Fallback: if still empty but we have a transcript, create a single assistant message
    if (
      unique.length === 0 &&
      (vapiLog.transcript || vapiLog.artifact?.transcript)
    ) {
      unique.push({
        role: "assistant",
        content: (
          vapiLog.transcript ||
          vapiLog.artifact?.transcript ||
          ""
        ).toString(),
      });
    }

    return unique;
  }

  // Helper methods to extract information from call logs
  private extractCandidateName(vapiLog: VapiCallLog): string | undefined {
    // Try to extract from artifact messages first
    if (vapiLog.artifact?.messages) {
      const userMessages = vapiLog.artifact.messages.filter(
        (msg: any) => msg.role === "user"
      );
      for (const msg of userMessages) {
        const nameMatch = (msg.message as string).match(
          /name[:\s]+([A-Za-z\s]+)/i
        );
        if (nameMatch) {
          return nameMatch[1].trim();
        }
      }
    }

    // Try to extract from main messages
    if (vapiLog.messages) {
      const userMessages = vapiLog.messages.filter(
        (msg) => msg.role === "user"
      );
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

    return undefined;
  }

  private extractPosition(vapiLog: VapiCallLog): string | undefined {
    // Try to extract from artifact messages first
    if (vapiLog.artifact?.messages) {
      const userMessages = vapiLog.artifact.messages.filter(
        (msg: any) => msg.role === "user"
      );
      for (const msg of userMessages) {
        const positionMatch = (msg.message as string).match(
          /(developer|engineer|designer|manager|analyst|angular|react|node|\.net|ios|ionic)/i
        );
        if (positionMatch) {
          return positionMatch[1];
        }
      }
    }

    // Try to extract from main messages
    if (vapiLog.messages) {
      const userMessages = vapiLog.messages.filter(
        (msg) => msg.role === "user"
      );
      for (const msg of userMessages) {
        const positionMatch = msg.message.match(
          /(developer|engineer|designer|manager|analyst|angular|react|node|\.net|ios|ionic)/i
        );
        if (positionMatch) {
          return positionMatch[1];
        }
      }
    }

    // Try to extract from transcript
    if (vapiLog.transcript) {
      const positionMatch = vapiLog.transcript.match(
        /(developer|engineer|designer|manager|analyst|angular|react|node|\.net|ios|ionic)/i
      );
      if (positionMatch) {
        return positionMatch[1];
      }
    }

    return undefined;
  }

  private extractExperience(vapiLog: VapiCallLog): string | undefined {
    // Try to extract from artifact messages first
    if (vapiLog.artifact?.messages) {
      const userMessages = vapiLog.artifact.messages.filter(
        (msg: any) => msg.role === "user"
      );
      for (const msg of userMessages) {
        const experienceMatch = (msg.message as string).match(
          /(\d+)\s*(year|yr)/i
        );
        if (experienceMatch) {
          return `${experienceMatch[1]} years`;
        }
      }
    }

    // Try to extract from main messages
    if (vapiLog.messages) {
      const userMessages = vapiLog.messages.filter(
        (msg) => msg.role === "user"
      );
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

    return undefined;
  }

  private extractPhoneNumber(vapiLog: VapiCallLog): string | undefined {
    // Try to extract from artifact messages first
    if (vapiLog.artifact?.messages) {
      const userMessages = vapiLog.artifact.messages.filter(
        (msg: any) => msg.role === "user"
      );
      for (const msg of userMessages) {
        const phoneMatch = (msg.message as string).match(
          /(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})/
        );
        if (phoneMatch) {
          return phoneMatch[1];
        }
      }
    }

    // Try to extract from main messages
    if (vapiLog.messages) {
      const userMessages = vapiLog.messages.filter(
        (msg) => msg.role === "user"
      );
      for (const msg of userMessages) {
        const phoneMatch = msg.message.match(
          /(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})/
        );
        if (phoneMatch) {
          return phoneMatch[1];
        }
      }
    }

    // Try to extract from transcript
    if (vapiLog.transcript) {
      const phoneMatch = vapiLog.transcript.match(
        /(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})/
      );
      if (phoneMatch) {
        return phoneMatch[1];
      }
    }

    return undefined;
  }

  private convertCallStatus(
    vapiStatus: string
  ): "completed" | "pending" | "failed" {
    switch (vapiStatus) {
      case "ended":
        return "completed";
      case "in-progress":
      case "ringing":
      case "queued":
        return "pending";
      default:
        return "failed";
    }
  }
}

// Export singleton instance
export const vapiApiService = new VapiApiService();
