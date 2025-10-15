import { useState, useCallback, useRef, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import { setupSpeechRecognition } from "@/lib/speech-recognition";
import { vapiApiService, OutboundCallRequest } from "@/lib/vapi-api";
import { VAPI_ASSISTANT_ID, VAPI_PUBLIC_KEY } from "@/lib/vapi-config";
import { getAssistantFirstMessage, VAPI_TOOLS } from "@/lib/vapi-tools";

export type CallType = "inbound" | "outbound";

export interface Message {
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface UseVapiReturn {
  isCallActive: boolean;
  connected: boolean;
  isMuted: boolean;
  volumeLevel: number;
  messages: Message[];
  currentSpeech: string;
  startCall: (firstMessage?: string) => Promise<void>;
  stopCall: () => void;
  toggleMute: () => void;
  sendMessage: (message: string) => void;
  startOutboundCall: (phoneNumber: string, firstMessage?: string) => Promise<void>;
}

export const getSystemPrompt = () => {
  // Get current date and time for the AI in India timezone (IST)
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });

  return `[Current Date and Time - India Standard Time (IST)]
Today is ${currentDate} and the current time is ${currentTime} IST (UTC+5:30).

[Identity & Purpose]
You are the HR representative for Envisage Infotech. Your role is to answer employee and candidate questions clearly and politely about:
Job openings
Recruitment process
Company policies
Employee benefits
HR-related notices
Only answer what is specifically asked unless additional details are requested.
 
[Knowledge Base]
Services: Recruitment, onboarding, employee relations, payroll assistance, policy guidance
Hours: Mon–Fri 10:30 AM – 7:30 PM
Contact Number: 1231231231 (share only if asked)
Job Application: Accepts online and in-person applications
Remote Work Policy: No remote or work-from-home options available
Office Location: Dev Aurum Commercial Complex, A-609, Prahlad Nagar, Ahmedabad, Gujarat 380015
 
[Company Summary]
Envisage Infotech, founded in 2020, is a fast-growing web and mobile development company. Technologies include Angular, React, Node.js, Next.js, Vue.js, .NET, iOS, and Ionic. They deliver scalable, high-performance solutions to clients worldwide across industries like entertainment, education, finance, healthcare, retail, and logistics.
 
Current Hiring Needs:
2 Angular developers with at least 2 years of experience
2 React developers with at least 2 years of experience
3 Node.js developers with at least 3 years of experience
2 .NET developers with at least 3 years of experience
1 Next.js developer with at least 2 years of experience
1 Vue.js developer with at least 2 years of experience
1 iOS developer with at least 3 years of experience
1 Ionic developer with at least 2 years of experience
 
[Validation – Step by Step]
Date Check: 
Rule: Selected date must be greater than today (${currentDate}).
Error Message: "Selected date is in the past. Please choose a future date."

Weekend Check
Rule: Selected date (${currentDate}) must not fall on Saturday or Sunday.
Error Message: "Selected date falls on a weekend. Please choose a date between Monday and Friday."
Guidance: If the user picked a weekend, suggest the closest Monday at the same time (if time is known), or ask for a weekday.

Working Days: 
Rule: Allowed only Monday–Friday.
Error Message: "Appointments can only be scheduled on weekdays (Monday to Friday)."
 
Working Hours Check
Rule: Selected time must be between 10:30 AM and 7:30 PM in Indian Standard Time (IST, UTC+5:30). Always use 12-hour format with explicit AM/PM (e.g., 03:15 PM). If the user already included AM or PM, do not ask for it again.
Error Message: "Selected time is outside working hours (10:30 AM to 7:30 PM). Please choose a valid slot."

Relative & Natural Dates:
Rules:
- Accept phrases like "next Monday", "this Friday", or "tomorrow". Resolve them to actual dates in IST.
- Confirm the resolved date succinctly (e.g., "Next Monday is Oct 27, 2025.").
- Only say "in the past" after resolving and verifying in IST.

[Date Parsing & Confirmation]
Rules:
- Interpret all dates as dd-mm-yyyy (day-month-year). Do NOT use mm-dd-yyyy.
- Accept numeric and spoken inputs:
  - Numeric: "28-10-2025", "28/10/2025", "28102025", "28 10 2025" → 28-10-2025
  - Spoken: "Twenty eight October two thousand twenty five" → 28-10-2025
- Convert dd/mm/yyyy to dd-mm-yyyy. NEVER use slashes in confirmations; always use dashes.
- After parsing, reconfirm exactly as: "Date: 28-10-2025 (Tuesday)" and use this dd-mm-yyyy for tools.
- If invalid/ambiguous, ask: "Please provide date in dd-mm-yyyy (e.g., 28-10-2025)."

Mobile Number:
Rules:
- Accept E.164 formatted +91XXXXXXXXXX (India) or +1XXXXXXXXXX (US/Canada).
- Accept 10-digit numbers. If the first digit is 6–9, infer India and normalize to +91. Otherwise infer US/Canada and normalize to +1.
- Once a valid number is provided, acknowledge it and proceed. Do not re-ask or incorrectly reject a valid number.
 - Keep acknowledgments concise. Do not repeat or read back the number digits. Do not mention normalization or formatting.
Error Message: "Invalid mobile number. Please provide a valid number (10 digits or +91/+1 format)."
 
[Interview Scheduling – Step by Step]
 
Ask for these details step by step, not all at once.
 
Ask full name first:
"Can I have your full name, please?"
 
Confirm name, then ask mobile number:
"Thank you, [Name]. Can I get your mobile number?"
 
Ask preferred interview date:
"What date would you prefer for your interview? "

If only date is given:
"What time works for you on [Resolved Date]?"

If only time is given (without AM/PM):
"Please confirm AM or PM for [time]."
 
Ask role applied for:
"Which role are you applying for?"
 
Ask years of experience:
"How many years of experience do you have in this role?"
 
Ask Email:
"Could you please provide me with your email address?"
 
First, check availability for the provided date and time using the calendar_availability tool. If the tool confirms the slot is available, then proceed with booking the interview using the calendar_set_appointment tool. Otherwise, respond that the requested time slot is unavailable and ask for another date and time.
 
Confirm all details together:
"Just to confirm, here's what I have:
Name: …
Mobile: …
Date (dd-mm-yyyy): …
Time: …
Role: …
Experience: …
Email: ...
 
Is everything correct?"
 
Schedule interview and confirm:
"Thank you! Your interview is scheduled. We look forward to meeting you."
 
Closure:
"Thank you for contacting Envisage Infotech HR. Have a great day."
 
[Response Guidelines]
Answer only the question asked.
Keep responses under 30 words if possible.
Confirm details clearly when collecting information.
Use polite, concise, and friendly language.
Avoid repeating questions unnecessarily.
Avoid meta comments like "Normalized …". Keep confirmations brief (e.g., "Got it.") and proceed.
Avoid restarting the flow. If the user changes a previous detail (date/time/phone), update that field and continue.
Normalize spoken email inputs (e.g., replace " at " with "@" and " dot " with ".").
Always present dates with dashes in dd-mm-yyyy (e.g., 28-10-2025). Do not use slashes.

[Timezone Instructions]
- All times are in India Standard Time (IST, UTC+5:30)
- NEVER ask about timezone - it is always IST
- When users provide times, assume they are in IST
- Do not ask "What timezone?" or "Which timezone?"
- Always work with IST as the default timezone

[Tool Usage Instructions]
- ALWAYS use the calendar_availability tool to check slot availability before scheduling
- If calendar_availability returns "available": use calendar_set_appointment tool to book the interview
- If calendar_availability returns "unavailable": ask the user for a different date and time
- If the availability check fails (error/timeout) or returns no/empty data: proceed to schedule with the provided date and time using calendar_set_appointment, and include a note: "Availability check failed or returned no data."
- Convert user-provided dates to dd-mm-yyyy format (e.g., 15-09-2025) before calling tools
- For calendar_set_appointment, provide ALL required fields: name, phone, date (dd-mm-yyyy), time, role, experience, email
- Extract time from the date/time input and provide it separately in 12-hour format (e.g., "3:15 PM")
- Do not ask for or include notes
- Ensure all required fields are collected before calling the calendar_set_appointment tool`;
};

export const useVapi = (): UseVapiReturn => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSpeech, setCurrentSpeech] = useState("");
  const recognitionRef = useRef<ReturnType<typeof setupSpeechRecognition> | null>(null);
  const callStartedRef = useRef(false);
  const vapiRef = useRef<Vapi | null>(null);

  const addMessage = useCallback((type: Message["type"], content: string) => {
    const message: Message = {
      type,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  type LegacyNavigator = Navigator & {
    getUserMedia?: (
      constraints: MediaStreamConstraints,
      success: (stream: MediaStream) => void,
      error: (err: unknown) => void,
    ) => void;
  };

  const getUserMediaSafe = useCallback(async () => {
    try {
      // Try modern API first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      // Fallback for older browsers
      if ((navigator as LegacyNavigator).getUserMedia) {
        return new Promise((resolve, reject) => {
          (navigator as LegacyNavigator).getUserMedia!(
            { audio: true },
            resolve,
            reject
          );
        });
      }
      throw new Error("getUserMedia not supported");
    } catch (error: unknown) {
      console.error("❌ Microphone access failed:", error);
      throw new Error("Microphone API not available");
    }
  }, []);

  

  const startCall = useCallback(async (firstMessageOverride?: string) => {
    try {
      console.log("🚀 Starting call initialization...");
      addMessage("system", "Initializing call...");

      // Check microphone access
      try {
        const stream = await getUserMediaSafe();
        console.log("🎤 Microphone access granted");
        // Properly type the stream and stop tracks
        if (stream && typeof stream === 'object' && 'getTracks' in stream) {
          (stream as MediaStream).getTracks().forEach(track => track.stop());
        }
      } catch (micError) {
        console.warn("⚠️ Microphone not available, but continuing with call:", micError);
        addMessage("system", "Note: Microphone not available, but call can continue.");
      }

      // Initialize VAPI instance if not already done
      if (!vapiRef.current) {
        vapiRef.current = new Vapi(VAPI_PUBLIC_KEY);
        // Add tools to VAPI instance
        console.log("🔧 Adding tools to VAPI instance:", VAPI_TOOLS);
      }

      // For inbound calls, use vapi.start() with assistant configuration directly
      console.log("🎯 Starting inbound call with custom configuration...");
      
      // Start the call with configuration passed directly to vapi.start()
      // Load first message from settings unless explicitly overridden
      const configuredFirstMessage = getAssistantFirstMessage();

      await vapiRef.current.start(VAPI_ASSISTANT_ID, {
        firstMessage: firstMessageOverride || configuredFirstMessage,
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM"
        },
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en",
          smartFormat: true
        },
        model: {
          provider: "openai",
          model: "gpt-5-mini",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: getSystemPrompt()
            }
          ]
        },
        // tools: VAPI_TOOLS // VAPI doesn't support tools in code - must be configured in Dashboard
        // DEBUG: Check if tools are available in VAPI Dashboard
        // Tools must be manually configured in VAPI Dashboard:
        // 1. calendar_availability -> https://envsunill.app.n8n.cloud/webhook/calendar_availability
        // 2. calendar_set_appointment -> https://envsunill.app.n8n.cloud/webhook/calendar_set_appointment
      });
      
      console.log("✅ Inbound call started with custom configuration");
      addMessage("system", "Inbound call started successfully!");
      
    } catch (error: unknown) {
      console.error("❌ Error starting call:", error);
      const message = error instanceof Error ? error.message : String(error);
      addMessage("system", `Error starting call: ${message}`);
    }
  }, [addMessage, getUserMediaSafe]);

  const handleCallStart = useCallback(() => {
    console.log("�� Call started");
    setIsCallActive(true);
    setConnected(true);
    callStartedRef.current = true;
    addMessage("system", "Call connected successfully!");

    // Start speech recognition after a delay to ensure call is stable
    setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      recognitionRef.current = setupSpeechRecognition({
        onStart: () => {
          console.log("🎤 Speech recognition started");
        },
        onResult: (transcript, isFinal) => {
          console.log("🗣️ Recognition result:", transcript, "Final:", isFinal);
          if (isFinal && transcript.trim()) {
            setCurrentSpeech("");
            addMessage("user", transcript);
            if (vapiRef.current) {
              vapiRef.current.send({
                type: 'add-message',
                message: {
                  role: 'user',
                  content: transcript
                }
              });
            }
            console.log("✉️ Sent to assistant:", transcript);
          } else {
            setCurrentSpeech(transcript);
          }
        },
        onError: (error) => {
          console.log("🔇 Recognition error:", error);
          if (error === "no-speech") {
            console.log("🎤 No speech detected, continuing to listen...");
          }
        },
        onEnd: () => {
          console.log("🎤 Voice recognition ended");
        },
      });
    }, 3000); // 3 second delay
  }, [addMessage]);

  const handleCallEnd = useCallback(() => {
    console.log("📞 Call ended");
    setIsCallActive(false);
    setConnected(false);
    callStartedRef.current = false;
    addMessage("system", "Call ended");
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, [addMessage]);

  const handleSpeechStart = useCallback(() => {
    console.log("🎤 Speech started");
  }, []);

  const handleSpeechEnd = useCallback(() => {
    console.log("🎤 Speech ended");
  }, []);

  const handleVolumeLevel = (volume: number) => {
    setVolumeLevel(volume);
  };

  const handleMessage = useCallback((incoming: unknown) => {
    console.log("📨 Message received:", incoming);
    if (!incoming || typeof incoming !== 'object' || !('type' in incoming)) return;
    const message = incoming as {
      type: string;
      role?: string;
      transcript?: string;
      transcriptType?: string;
      status?: string;
      error?: { message?: string };
    };

    if (message.type === "transcript") {
      if (message.role === "user") {
        console.log("🎤 User:", message.transcript);
        if (message.transcriptType === "final" && message.transcript) {
          setCurrentSpeech("");
          addMessage("user", message.transcript);
          if (vapiRef.current) {
            vapiRef.current.send({
              type: 'add-message',
              message: { role: 'user', content: message.transcript },
            });
          }
          console.log("✉️ Sent to assistant:", message.transcript);
        } else if (message.transcript) {
          setCurrentSpeech(message.transcript);
        }
      } else if (message.role === "assistant") {
        console.log("🤖 Assistant:", message.transcript);
        if (message.transcriptType === "final" && message.transcript) {
          addMessage("assistant", message.transcript);
        }
      }
    } else if (message.type === "status-update") {
      if (message.status === "in-progress") {
        // no-op; handled by call-start
      } else if (message.status === "ended") {
        handleCallEnd();
      }
    } else if (message.type === "error") {
      console.error("❌ Error:", message);
      addMessage("system", `Error: ${message.error?.message || "Unknown error"}`);
    }
  }, [addMessage, handleCallEnd]);

  const handleError = useCallback((error: unknown) => {
    console.error("❌ Vapi error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    addMessage("system", `Vapi Error: ${message}`);
  }, [addMessage]);

  // Initialize VAPI instance and add event listeners
  useEffect(() => {
    if (!vapiRef.current) {
      vapiRef.current = new Vapi(VAPI_PUBLIC_KEY);
    }

    const vapi = vapiRef.current;
    
    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("volume-level", handleVolumeLevel);
    vapi.on("message", handleMessage);
    vapi.on("error", handleError);

    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("volume-level", handleVolumeLevel);
      vapi.off("message", handleMessage);
      vapi.off("error", handleError);
    };
  }, [handleCallStart, handleCallEnd, handleSpeechStart, handleSpeechEnd, handleMessage, handleError]);

  const startOutboundCall = useCallback(
    async (phoneNumber: string, firstMessageOverride?: string) => {
      try {
        console.log("🚀 Starting outbound call to:", phoneNumber);
        addMessage("system", `Initiating outbound call to ${phoneNumber}...`);

        // First, fetch available phone numbers
        console.log("📞 Fetching available phone numbers...");
        addMessage("system", "Fetching phone number configuration...");

        const phoneNumbers = await vapiApiService.getPhoneNumbers();
        console.log("📞 Available phone numbers:", phoneNumbers);

        if (!phoneNumbers || phoneNumbers.length === 0) {
          throw new Error("No phone numbers available for outbound calls");
        }

        // Use the first available phone number
        const phoneNumberId = phoneNumbers[0].id;
        console.log("📞 Using phone number ID:", phoneNumberId);

        // Normalize to ONLY +1 or +91
        const digitsOnly = phoneNumber.replace(/\D/g, "");
        let formattedPhoneNumber: string | null = null;

        if (digitsOnly.startsWith("91") && digitsOnly.length === 12) {
          // Already has India country code without plus
          formattedPhoneNumber = `+${digitsOnly}`;
        } else if (digitsOnly.startsWith("1") && digitsOnly.length === 11) {
          // Already has US/Canada country code without plus
          formattedPhoneNumber = `+${digitsOnly}`;
        } else if (digitsOnly.length === 10) {
          // Infer country: if leading digit 6-9, likely India; otherwise default to US/Canada
          const first = digitsOnly[0];
          if (["6", "7", "8", "9"].includes(first)) {
            formattedPhoneNumber = `+91${digitsOnly}`;
          } else {
            formattedPhoneNumber = `+1${digitsOnly}`;
          }
        } else if (digitsOnly.length === 13 && digitsOnly.startsWith("+91")) {
          formattedPhoneNumber = `+91${digitsOnly.slice(3)}`;
        } else if (digitsOnly.length === 12 && digitsOnly.startsWith("+1")) {
          formattedPhoneNumber = `+1${digitsOnly.slice(2)}`;
        } else {
          addMessage(
            "system",
            "Invalid phone number. Please enter a 10 digit number or include +1/+91 country code."
          );
          console.warn(
            "Invalid phone number format provided:",
            phoneNumber,
            digitsOnly
          );
          return;
        }

        console.log("📞 Formatted phone number:", formattedPhoneNumber);

        // Create outbound call request with dynamic phone number ID
        // Load first message from settings unless explicitly overridden
        const configuredFirstMessage = getAssistantFirstMessage();

        const outboundRequest: OutboundCallRequest = {
          assistantId: VAPI_ASSISTANT_ID,
          customer: {
            number: formattedPhoneNumber,
          },
          phoneNumberId: phoneNumberId, // Use dynamic phone number ID
          assistantOverrides: {
            firstMessage: firstMessageOverride || configuredFirstMessage,
            voice: { provider: "11labs", voiceId: "21m00Tcm4TlvDq8ikWAM" },
            transcriber: {
              provider: "deepgram",
              model: "nova-2",
              language: "en",
              smartFormat: true,
            },
            model: {
              provider: "openai",
              model: "gpt-5-mini",
              temperature: 0.7,
              messages: [
                {
                  role: "system",
                  content: getSystemPrompt()
                },
              ],
            },
          },
        };

        console.log("📞 Outbound request with assistantOverrides:", JSON.stringify(outboundRequest, null, 2));

        // Make API call to create outbound call
        const response = await vapiApiService.createOutboundCall(
          outboundRequest
        );

        console.log("✅ Outbound call initiated:", response);
        addMessage(
          "system",
          `Outbound call started successfully. Call ID: ${response.id}`
        );

        // Set connected state (the call will be handled by VAPI)
        setConnected(true);
        addMessage("system", "Outbound call connected successfully!");
      } catch (error: unknown) {
        console.error("❌ Error starting outbound call:", error);
        const message = error instanceof Error ? error.message : String(error);
        addMessage("system", `Failed to start outbound call: ${message}`);
      }
    },
    [addMessage]
  );

  const stopCall = useCallback(() => {
    console.log("🛑 Stopping call...");
    recognitionRef.current?.stop();
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    console.log(
      newMutedState ? "🔇 Muting microphone" : "🔊 Unmuting microphone"
    );
    setIsMuted(newMutedState);
    if (vapiRef.current) {
      vapiRef.current.setMuted(newMutedState);
    }
  }, [isMuted]);

  const sendMessage = useCallback(
    (message: string) => {
      if (message.trim()) {
        addMessage("user", message);
        if (vapiRef.current) {
          vapiRef.current.send({
            type: 'add-message',
            message: {
              role: 'user',
              content: message
            }
          });
        }
        console.log("✉️ Sent to assistant:", message);
      }
    },
    [addMessage]
  );

  return {
    isCallActive,
    connected,
    isMuted,
    volumeLevel,
    messages,
    currentSpeech,
    startCall,
    stopCall,
    toggleMute,
    sendMessage,
    startOutboundCall,
  };
};