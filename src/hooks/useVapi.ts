import { useState, useCallback, useRef, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import { setupSpeechRecognition } from "@/lib/speech-recognition";
import { vapiApiService, OutboundCallRequest } from "@/lib/vapi-api";
import { VAPI_ASSISTANT_ID, VAPI_PUBLIC_KEY } from "@/lib/vapi-config";

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
  startCall: () => Promise<void>;
  stopCall: () => void;
  toggleMute: () => void;
  sendMessage: (message: string) => void;
  startOutboundCall: (phoneNumber: string) => Promise<void>;
}

export const useVapi = (): UseVapiReturn => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSpeech, setCurrentSpeech] = useState("");
  const recognitionRef = useRef<any>(null);
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

  const getUserMediaSafe = useCallback(async () => {
    try {
      // Try modern API first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      // Fallback for older browsers
      if ((navigator as any).getUserMedia) {
        return new Promise((resolve, reject) => {
          (navigator as any).getUserMedia(
            { audio: true },
            resolve,
            reject
          );
        });
      }
      throw new Error("getUserMedia not supported");
    } catch (error) {
      console.error("❌ Microphone access failed:", error);
      throw new Error("Microphone API not available");
    }
  }, []);

  const getSystemPrompt = useCallback(() => {
    // Get current date and time for the AI
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    return `[Current Date and Time]
Today is ${currentDate} and the current time is ${currentTime}.

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
Rule: Must be a future date from today (${currentDate}).
Error Message: "Selected date is in the past. Please choose a future date."
 
Working Days: 
Rule: Allowed only Monday–Friday.
Error Message: "Appointments can only be scheduled on weekdays (Monday to Friday)."
 
Working Hours:
Rule: Time must be between from 10:30 AM to 7:30 PM.
Error Message: "Selected time is outside working hours from 10:30 AM to 7:30 PM. Please choose a valid slot."
 
Mobile Number:
Rule: Must be a valid 10-digit number.
Error Message: "Invalid mobile number. Please provide a 10-digit valid phone number."
 
[Interview Scheduling – Step by Step]
 
Ask for these details step by step, not all at once.
 
Ask full name first:
"Can I have your full name, please?"
 
Confirm name, then ask mobile number:
"Thank you, [Name]. Can I get your mobile number?"
 
Ask preferred interview date:
"What date would you prefer for your interview?"
 
Ask preferred time:
"And what time works best for you?"
 
Ask role applied for:
"Which role are you applying for?"
 
Ask years of experience:
"How many years of experience do you have in this role?"
 
Ask Email:
"Could you please provide me with your email address?"
 
Optional: Ask for additional notes:
"Do you want to share any additional notes or information?"
 
First, check availability for the provided date and time. If the node confirms the slot is available, then proceed with booking the interview. Otherwise, respond that the requested time slot is unavailable. Also, ensure that the interview scheduling workflow is not triggered until this availability check has returned a response.
 
Confirm all details together:
"Just to confirm, here's what I have:
Name: …
Mobile: …
Date: …
Time: …
Role: …
Experience: …
Email: ...
Notes: …
 
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
Avoid repeating questions unnecessarily.`;
  }, []);

  const startCall = useCallback(async () => {
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
      }

      // For inbound calls, use vapi.start() with assistant configuration directly
      console.log("🎯 Starting inbound call with custom configuration...");
      
      // Start the call with configuration passed directly to vapi.start()
      await vapiRef.current.start(VAPI_ASSISTANT_ID, {
        firstMessage: "Hi, this is HR from Envisage Infotech. How can I help you today?",
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
          model: "gpt-4",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: getSystemPrompt()
            }
          ]
        }
      });
      
      console.log("✅ Inbound call started with custom configuration");
      addMessage("system", "Inbound call started successfully!");
      
    } catch (error: any) {
      console.error("❌ Error starting call:", error);
      addMessage("system", `Error starting call: ${error.message || error}`);
    }
  }, [addMessage, getUserMediaSafe, getSystemPrompt]);

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

  const handleMessage = (message: any) => {
    console.log("📨 Message received:", message);

    if (message.type === "transcript") {
      if (message.role === "user") {
        console.log("🎤 User:", message.transcript);
        if (message.transcriptType === "final") {
          addMessage("user", message.transcript);
        }
      } else if (message.role === "assistant") {
        console.log("🤖 Assistant:", message.transcript);
        if (message.transcriptType === "final") {
          addMessage("assistant", message.transcript);
        }
      }
    } else if (message.type === "status-update") {
      if (message.status === "in-progress") {
        // no-op; handled by call-start
      } else if (message.status === "ended") {
        // ensure we reflect end
        handleCallEnd();
      }
    } else if (message.type === "error") {
      console.error("❌ Error:", message);
      addMessage(
        "system",
        `Error: ${message.error?.message || "Unknown error"}`
      );
    }
  };

  const handleError = (error: any) => {
    console.error("❌ Vapi error:", error);
    addMessage("system", `Vapi Error: ${error.message || "Unknown error"}`);
  };

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
    async (phoneNumber: string) => {
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
        const outboundRequest: OutboundCallRequest = {
          assistantId: VAPI_ASSISTANT_ID,
          customer: {
            number: formattedPhoneNumber,
          },
          phoneNumberId: phoneNumberId, // Use dynamic phone number ID
          assistantOverrides: {
            firstMessage:
              "Hi, this is HR from Envisage Infotech. Would you like to schedule an interview?",
            voice: { provider: "11labs", voiceId: "21m00Tcm4TlvDq8ikWAM" },
            transcriber: {
              provider: "deepgram",
              model: "nova-2",
              language: "en",
              smartFormat: true,
            },
            model: {
              provider: "openai",
              model: "gpt-4",
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
      } catch (error: any) {
        console.error("❌ Error starting outbound call:", error);
        addMessage(
          "system",
          `Failed to start outbound call: ${error.message || error}`
        );
      }
    },
    [addMessage, getSystemPrompt]
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
