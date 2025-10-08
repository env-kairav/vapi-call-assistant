// Vapi configuration
export const VAPI_PUBLIC_KEY = "a554dcf5-3745-4bec-93dc-5bd8ee52177b";
// NOTE: You need to replace this with your actual Vapi PRIVATE key for API calls
// The public key above is only for client-side Web SDK calls
export const VAPI_API_KEY = "096aa1ac-6048-4a0e-b24f-37fe68fbd5da"; // Replace with your actual private key
export const VAPI_ASSISTANT_ID = "391cd5b4-643e-460c-bd3c-8a3b7c683b94";

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
  // Remove problematic settings that cause immediate call ending
  // silenceTimeoutMs: 5000, // This was causing calls to end
  // endCallOnSilence: false, // This was causing issues
  interruptible: true, // Allow interrupting the assistant
  firstMessage:
    "Yoo you reached here congs brotherss You've reached Envisage Infotech HR. How may I assist you today?",
  // Remove endCallMessage to prevent immediate ending
});
