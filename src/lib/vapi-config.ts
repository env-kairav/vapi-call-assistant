// Vapi configuration
export const VAPI_PUBLIC_KEY = "ac92cb80-4013-4def-b576-416fd4f606df";
// NOTE: You need to replace this with your actual Vapi PRIVATE key for API calls
// The public key above is only for client-side Web SDK calls
export const VAPI_API_KEY = "32fad1fc-d402-4e3a-8ba5-52f34747f411"; // Replace with your actual private key
export const VAPI_ASSISTANT_ID = "788b77a2-ab0d-49d5-b0b6-449e5a1ac120";

// Vapi API endpoints
export const VAPI_API_BASE_URL = "https://api.vapi.ai";

export const getVapiConfig = (currentTime: string) => ({
  variableValues: {
    now: currentTime,
  },
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
  silenceTimeoutMs: 5000, // Wait 5 seconds of silence before ending
  endCallOnSilence: false, // Don't end call on silence
  interruptible: true, // Allow interrupting the assistant
  firstMessage:
    "Good hahahahhahahahah, you've reached Envisage Infotech. I'm the HR here. How may I assist you today?",
  endCallMessage:
    "Thank you for contacting Envisage Infotech HR. Have a great day.",
  voicemailMessage: "Please call back when you're available.",
});
