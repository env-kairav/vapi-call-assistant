import { useState, useEffect, useRef, useCallback } from "react";
import Vapi from "@vapi-ai/web";
import {
  VAPI_PUBLIC_KEY,
  VAPI_ASSISTANT_ID,
  getVapiConfig,
} from "@/lib/vapi-config";
import { setupSpeechRecognition } from "@/lib/speech-recognition";

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
    vapi.on("call-start", () => {
      console.log("📞 Call started");
      setConnected(true);
      addMessage("system", "Call connected successfully!");
      // Start voice recognition
      setTimeout(() => {
        recognitionRef.current?.start();
      }, 1000);
    });

    vapi.on("call-end", () => {
      console.log("📞 Call ended");
      setConnected(false);
      setAssistantIsSpeaking(false);
      setVolumeLevel(0);
      setUserSpeaking(false);
      setCurrentSpeech("");
      recognitionRef.current?.stop();
      addMessage("system", "Call ended");
    });

    vapi.on("speech-start", () => {
      console.log("🤖 Assistant started speaking");
      setAssistantIsSpeaking(true);
      // Temporarily stop recognition while assistant is speaking
      recognitionRef.current?.stop();
    });

    vapi.on("speech-end", () => {
      console.log("🤖 Assistant finished speaking");
      setAssistantIsSpeaking(false);
      // Resume recognition after assistant finishes speaking
      if (connected) {
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 500);
      }
    });

    vapi.on("volume-level", (volume) => {
      setVolumeLevel(volume);
    });

    vapi.on("message", (message) => {
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
      } else if (message.type === "error") {
        console.error("❌ Error:", message);
        addMessage(
          "system",
          `Error: ${message.error?.message || "Unknown error"}`
        );
      }
    });

    vapi.on("error", (error) => {
      console.error("❌ Vapi error:", error);
      addMessage("system", `Vapi Error: ${error.message || "Unknown error"}`);
    });

    return () => {
      recognitionRef.current?.stop();
      vapi.stop();
    };
  }, [vapi, addMessage]);

  const startCall = useCallback(async () => {
    try {
      console.log("Starting call initialization...");
      addMessage("system", "Starting call...");

      // Request microphone access with specific settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      });

      console.log("🎤 Microphone access granted");
      addMessage("system", "Microphone connected successfully");

      // Get current time for the config
      const currentTime = new Date().toLocaleString();

      // Start the call with configuration
      await vapi.start(VAPI_ASSISTANT_ID, {
        firstMessage:
          "Hi!, you've reached Envisage Infotech HR. How may I assist you today?",
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel voice - professional female
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
Rule: Must be a future date.
Error Message: “Selected date is in the past. Please choose a future date.”

Working Days: 
Rule: Allowed only Monday–Friday.
Error Message: “Appointments can only be scheduled on weekdays (Monday to Friday).”

Working Hours:
Rule: Time must be between 10:30 AM – 7:30 PM.
Error Message: “Selected time is outside working hours  10:30 AM – 7:30 PM. Please choose a valid slot.”

Mobile Number:
Rule: Must be a valid 10-digit number.
Error Message: “Invalid mobile number. Please provide a 10-digit valid phone number.”

[Interview Scheduling – Step by Step]

Ask full name first:
“Can I have your full name, please?”

Confirm name, then ask mobile number:
“Thank you, [Name]. Can I get your mobile number?”

Ask preferred interview date:
“What date would you prefer for your interview?”

Ask preferred time:
“And what time works best for you?”

Ask role applied for:
“Which role are you applying for?”

Ask years of experience:
“How many years of experience do you have in this role?”

Optional: Ask for additional notes:
“Do you want to share any additional notes or information?”


Based on the given date and time, first check availability. If the run node returns true, proceed with booking the interview. Otherwise, respond with a message saying that the slot is not available for the requested time.

Confirm all details together:
“Just to confirm, here’s what I have:

Name: …

Mobile: …

Date: …

Time: …

Role: …

Experience: …

Notes: …
Is everything correct?”

Schedule interview and confirm:
“Thank you! Your interview is scheduled. We look forward to meeting you.”

Closure:
“Thank you for contacting Envisage Infotech HR. Have a great day.”

[Response Guidelines]

Answer only the question asked.

Keep responses under 30 words if possible.

Confirm details clearly when collecting information.

Use polite, concise, and friendly language.

Avoid repeating questions unnecessarily.`,
            },
            {
              role: "system",
              content: `TOOLS USAGE\n- To check availability: call tool 'calendar_availability' with { date: ISO_8601_start_datetime }.\n- You MUST NOT call 'calendar_set_appointment' until you have a tool result from 'calendar_availability' that explicitly says { status: "available" } for the SAME datetime.\n- If unavailable, compute the next hour from the requested start (e.g., +1 hour) and call 'calendar_availability' again; propose the first available hour found.\n- After user agrees, create appointment: call tool 'calendar_set_appointment' with { name, Phone, date: confirmed start }.\n- The appointment is always 1 hour; only send the start datetime.\n- Do not fabricate tool results; wait for the tool response before proceeding.\n- Keep asking one question at a time and confirm details before booking.`,
            },
          ],
        },
      });

      setConnected(true);
      addMessage("system", "Call connected successfully!");

      // Start speech recognition
      setTimeout(() => {
        recognitionRef.current?.start();
      }, 1000);
    } catch (error: any) {
      console.error("Error starting call:", error);
      addMessage("system", `Failed to start call: ${error.message || error}`);
    }
  }, [vapi, addMessage]);

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
    stopCall,
    toggleMute,
    sendMessage,
    addMessage,
  };
};
