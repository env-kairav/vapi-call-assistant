// Vapi configuration
export const VAPI_PUBLIC_KEY = "28b1d020-769e-41f6-88d3-3fcb5be1ed03";
// NOTE: You need to replace this with your actual Vapi PRIVATE key for API calls
// The public key above is only for client-side Web SDK calls
export const VAPI_API_KEY = "3743a4c1-5ca8-4b65-804e-60f9a894a1e0"; // Replace with your actual private key
export const VAPI_ASSISTANT_ID = "67e7549f-9606-470f-bd5c-70e377c8932a";

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
