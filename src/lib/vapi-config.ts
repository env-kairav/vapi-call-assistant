// Vapi configuration
export const VAPI_PUBLIC_KEY = "9b36d5f1-454a-4c8c-a7da-009b6dc0492c";
// NOTE: You need to replace this with your actual Vapi PRIVATE key for API calls
// The public key above is only for client-side Web SDK calls
export const VAPI_API_KEY = "5a9b8d30-0daf-40c7-96fb-7e38953d3a6b"; // Replace with your actual private key
export const VAPI_ASSISTANT_ID = "bdd33dbe-423c-40a6-afe4-27030e84514e";

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
    "Hi! You've reached Envisage Infotech HR. How may I assist you today?",
  // Remove endCallMessage to prevent immediate ending
});
