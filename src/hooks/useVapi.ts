import { useState, useEffect, useRef, useCallback } from "react";
import Vapi from "@vapi-ai/web";
import {
  VAPI_PUBLIC_KEY,
  VAPI_ASSISTANT_ID,
  getVapiConfig,
} from "@/lib/vapi-config";
import { setupSpeechRecognition } from "@/lib/speech-recognition";
import { vapiApiService, OutboundCallRequest } from "@/lib/vapi-api";

interface Message {
  time: string;
  type: "user" | "assistant" | "system";
  content: string;
}

interface UseVapiReturn {
  // State
  connected: boolean;
  assistantIsSpeaking: boolean;
  volumeLevel: number;
  isMuted: boolean;
  messages: Message[];
  userSpeaking: boolean;
  currentSpeech: string;
  isListening: boolean;
  microphoneStatus: "inactive" | "listening" | "speaking";

  // Actions
  startCall: () => Promise<void>;
  startOutboundCall: (phoneNumber: string) => Promise<void>;
  stopCall: () => void;
  toggleMute: () => void;
  sendMessage: (message: string) => void;
  addMessage: (type: "user" | "assistant" | "system", content: string) => void;
}

export const useVapi = (): UseVapiReturn => {
  const [vapi] = useState(() => new Vapi(VAPI_PUBLIC_KEY));
  const [connected, setConnected] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState<
    "inactive" | "listening" | "speaking"
  >("inactive");

  const recognitionRef = useRef<any>(null);
  const callStartedRef = useRef(false);

  // Cross-browser microphone access helper
  const getUserMediaSafe = useCallback(
    async (constraints: MediaStreamConstraints) => {
      try {
        const nav: any = navigator as any;
        if (
          nav &&
          nav.mediaDevices &&
          typeof nav.mediaDevices.getUserMedia === "function"
        ) {
          return await nav.mediaDevices.getUserMedia(constraints);
        }
        const legacyGetUserMedia =
          nav &&
          (nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia);
        if (legacyGetUserMedia) {
          return await new Promise<MediaStream>((resolve, reject) => {
            legacyGetUserMedia.call(nav, constraints, resolve, reject);
          });
        }
        throw new Error("Microphone API not available");
      } catch (err) {
        throw err;
      }
    },
    []
  );

  const addMessage = useCallback(
    (type: "user" | "assistant" | "system", content: string) => {
      setMessages((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          type,
          content,
        },
      ]);
    },
    []
  );

  // Initialize speech recognition
  useEffect(() => {
    recognitionRef.current = setupSpeechRecognition({
      onStart: () => {
        console.log("🎤 Voice recognition started");
        setMicrophoneStatus("listening");
        setIsListening(true);
      },
      onEnd: () => {
        console.log("🎤 Voice recognition ended");
        setIsListening(false);
        setMicrophoneStatus("inactive");
        if (connected) {
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 100);
        }
      },
      onResult: (transcript, isFinal) => {
        console.log("🗣️ Recognition result:", transcript, "Final:", isFinal);
        setMicrophoneStatus("speaking");
        setUserSpeaking(true);
        setCurrentSpeech(transcript);

        if (isFinal) {
          vapi.send({
            type: "add-message",
            message: {
              role: "user",
              content: transcript,
            },
          });
          console.log("✉️ Sent to assistant:", transcript);
          setMicrophoneStatus("listening");
          setUserSpeaking(false);
          setCurrentSpeech("");
        }
      },
      onError: (error) => {
        if (error === "no-speech") {
          console.log("🎤 No speech detected, continuing to listen...");
          setMicrophoneStatus("listening");
          return;
        }

        console.error("🔇 Recognition error:", error);
        setMicrophoneStatus("inactive");

        if (connected) {
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 1000);
        }
      },
    });

    return () => {
      recognitionRef.current?.stop();
    };
  }, [connected, vapi]);

  // Set up Vapi event listeners
  useEffect(() => {
    const handleCallStart = () => {
      console.log("📞 Call started - setting connected to true");
      callStartedRef.current = true;
      setConnected(true);
      addMessage("system", "Call connected successfully!");

      // Start voice recognition after a delay
      setTimeout(() => {
        console.log("🎤 Starting speech recognition...");
        recognitionRef.current?.start();
      }, 3000);
    };

    const handleCallEnd = () => {
      console.log("📞 Call ended - setting connected to false");
      callStartedRef.current = false;
      setConnected(false);
      setAssistantIsSpeaking(false);
      setVolumeLevel(0);
      setUserSpeaking(false);
      setCurrentSpeech("");
      recognitionRef.current?.stop();
      addMessage("system", "Call ended");
    };

    const handleSpeechStart = () => {
      console.log("🤖 Assistant started speaking");
      setAssistantIsSpeaking(true);
      // Temporarily stop recognition while assistant is speaking
      recognitionRef.current?.stop();
    };

    const handleSpeechEnd = () => {
      console.log("🤖 Assistant finished speaking");
      setAssistantIsSpeaking(false);
      // Resume recognition after assistant finishes speaking
      if (connected) {
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 500);
      }
    };

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

    // Add event listeners
    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("volume-level", handleVolumeLevel);
    vapi.on("message", handleMessage);
    vapi.on("error", handleError);

    return () => {
      // Remove event listeners
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("volume-level", handleVolumeLevel);
      vapi.off("message", handleMessage);
      vapi.off("error", handleError);

      // Do NOT stop the call here; only explicit stopCall should end it
      recognitionRef.current?.stop();
    };
  }, [vapi, addMessage]);

  const startCall = useCallback(async () => {
    try {
      console.log("🚀 Starting call initialization...");
      addMessage("system", "Starting call...");

      // Environment checks
      if (typeof window === "undefined" || typeof navigator === "undefined") {
        throw new Error("This feature requires a browser environment.");
      }
      if (!window.isSecureContext) {
        addMessage(
          "system",
          "Microphone requires a secure context (HTTPS or localhost). Please use HTTPS and allow microphone access."
        );
      }

      // Try to request microphone access, but do not block if unavailable
      let micOk = false;
      try {
        await getUserMediaSafe({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 48000,
          },
        });
        micOk = true;
        console.log("🎤 Microphone access granted");
        addMessage("system", "Microphone connected successfully");
      } catch (micErr: any) {
        console.warn(
          "⚠️ Microphone not available, continuing without mic:",
          micErr
        );
        addMessage(
          "system",
          "Microphone not available. Continuing without mic — you may not be heard by the assistant."
        );
      }

      // Get current time for the config
      const currentTime = new Date().toLocaleString();

      // Start the call regardless of mic, so at least the assistant can speak
      await vapi.start(VAPI_ASSISTANT_ID, {
        firstMessage:
          "Hi! You've reached Envisage Infotech HR. How may I assist you today?",
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
        },
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
              content: `Current date and time: ${currentTime}
 
You are the HR representative for Envisage Infotech. Your role is to answer employee and candidate questions clearly and politely about:

Job openings, Recruitment process, Company policies, Employee benefits, HR-related notices

Only answer what is specifically asked unless additional details are requested.

Services: Recruitment, onboarding, employee relations, payroll assistance, policy guidance
Hours: Mon–Fri 10:30 AM – 7:30 PM
Contact Number: 1231231231 (share only if asked)
Job Application: Accepts online and in-person applications
Remote Work Policy: No remote or work-from-home options available
Office Location: Dev Aurum Commercial Complex, A-609, Prahlad Nagar, Ahmedabad, Gujarat 380015

[Company Summary]
Envisage Infotech, founded in 2020, is a fast-growing web and mobile development company. Technologies include Angular, React, Node.js, Next.js, Vue.js, .NET, iOS, and Ionic.

Current Hiring Needs:
- 2 Angular developers with at least 2 years of experience
- 2 React developers with at least 2 years of experience  
- 3 Node.js developers with at least 3 years of experience
- 2 .NET developers with at least 3 years of experience
- 1 Next.js developer with at least 2 years of experience
- 1 Vue.js developer with at least 2 years of experience
- 1 iOS developer with at least 3 years of experience
- 1 Ionic developer with at least 2 years of experience

[Response Guidelines]
- Answer only the question asked
- Keep responses under 30 words if possible
- Confirm details clearly when collecting information
- Use polite, concise, and friendly language
- Avoid repeating questions unnecessarily.`,
            },
          ],
        },
      });

      console.log("✅ VAPI call started successfully");
      addMessage(
        "system",
        micOk
          ? "Call connected successfully!"
          : "Call connected (microphone unavailable)"
      );
    } catch (error: any) {
      console.error("❌ Error starting call:", error);
      const msg = error?.message || String(error);
      addMessage("system", `Failed to start call: ${msg}`);
    }
  }, [vapi, addMessage, getUserMediaSafe]);

  const startOutboundCall = useCallback(
    async (phoneNumber: string) => {
      try {
        console.log("🚀 Starting outbound call to:", phoneNumber);
        addMessage("system", `Initiating outbound call to ${phoneNumber}...`);

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

        // Create outbound call request (keep phoneNumberId as is)
        const outboundRequest: OutboundCallRequest = {
          assistantId: VAPI_ASSISTANT_ID,
          customer: {
            number: formattedPhoneNumber,
          },
          phoneNumberId: "17709e0f-b96e-4d3d-98c4-4fe3563606d0",
          assistantOverrides: {
            firstMessage:
              "Hi! You've reached Envisage Infotech HR. How may I assist you today?",
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
                  content: `Current date and time: ${new Date().toLocaleString()}
\nYou are the HR representative for Envisage Infotech. Your role is to answer employee and candidate questions clearly and politely about job openings, recruitment process, company policies, employee benefits, and HR-related notices. Keep responses concise and confirm details when collecting information.`,
                },
              ],
            },
          },
        };

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
    [addMessage]
  );

  const stopCall = useCallback(() => {
    console.log("🛑 Stopping call...");
    recognitionRef.current?.stop();
    vapi.stop();
  }, [vapi]);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    console.log(
      newMutedState ? "🔇 Muting microphone" : "🔊 Unmuting microphone"
    );
    vapi.setMuted(newMutedState);
    setIsMuted(newMutedState);
    addMessage(
      "system",
      newMutedState ? "Microphone muted" : "Microphone unmuted"
    );
  }, [vapi, isMuted, addMessage]);

  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim()) return;

      console.log("💬 Sending message:", message);
      vapi.send({
        type: "add-message",
        message: {
          role: "user",
          content: message,
        },
      });

      addMessage("user", message);
    },
    [vapi, addMessage]
  );

  return {
    // State
    connected,
    assistantIsSpeaking,
    volumeLevel,
    isMuted,
    messages,
    userSpeaking,
    currentSpeech,
    isListening,
    microphoneStatus,

    // Actions
    startCall,
    startOutboundCall,
    stopCall,
    toggleMute,
    sendMessage,
    addMessage,
  };
};
