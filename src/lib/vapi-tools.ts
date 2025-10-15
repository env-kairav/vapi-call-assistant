// Vapi webhook tools configuration for n8n calendar flow

// IMPORTANT: Set this to your n8n deployment base URL
// Example (self-hosted): https://your-n8n-domain.com/webhook
// Example (n8n Cloud): https://<your-subdomain>.n8n.cloud/webhook
export const N8N_WEBHOOK_BASE_URL =
  "https://envsunill.app.n8n.cloud/webhook";

// Runtime getter that prefers user-configured settings from localStorage
export const getN8nBaseUrl = (): string => {
  try {
    const raw = localStorage.getItem('assistantSettings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.n8nBaseUrl === 'string' && parsed.n8nBaseUrl.trim()) {
        return parsed.n8nBaseUrl;
      }
    }
  } catch (e) {
    // ignore and fallback
  }
  return N8N_WEBHOOK_BASE_URL;
};

export const getAssistantFirstMessage = (): string => {
  try {
    const raw = localStorage.getItem('assistantSettings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.firstMessage === 'string' && parsed.firstMessage.trim()) {
        return parsed.firstMessage;
      }
    }
  } catch (e) {
    // ignore
  }
  return "Hi, this is HR from Envisage Infotech. How can I help you today?";
};

// Webhook paths from the provided n8n flow
// const CALENDAR_AVAILABILITY_PATH = "982fc29b-e89a-484d-b9e8-fa69ef336dc4";
// const CALENDAR_SET_APPOINTMENT_PATH = "2469bb34-9b73-4e74-a3f7-10d2e6ef850c";

// OPTIONAL: Expose an events listing webhook to fetch calendar events for a date range
// Create an n8n webhook that proxies Google Calendar events.list and set its path here
export const N8N_CALENDAR_EVENTS_PATH = "get-all-calender-data"; // provided

export const CALENDAR_AVAILABILITY_TOOL = {
  type: "webhook",
  name: "calendar_availability",
  description:
    "Check if a given ISO 8601 datetime is available on the HR interview calendar.",
  url: `${getN8nBaseUrl()}/calendar_availability`,
  inputSchema: {
    type: "object",
    properties: {
      date: {
        type: "string",
        description:
          "Preferred interview date in dd-mm-yyyy format (e.g., 15-09-2025).",
        format: "date",
      },
    },
    required: ["date"],
  },
  method: "POST",
} as const;

export const CALENDAR_SET_APPOINTMENT_TOOL = {
  type: "webhook",
  name: "calendar_set_appointment",
  description:
    "Create a 1-hour interview event in Google Calendar with candidate details.",
  url: `${getN8nBaseUrl()}/calendar_set_appointment`,
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Full name of the candidate.",
      },
      phone: {
        type: "string",
        description: "Candidate mobile number with country code if possible.",
      },
      date: {
        type: "string",
        description:
          "Interview date in dd-mm-yyyy format (e.g., 15-09-2025).",
        format: "date",
      },
      time: {
        type: "string",
        description: "Interview time in 12-hour format (e.g., 3:15 PM).",
      },
      role: {
        type: "string",
        description: "Role/position the candidate is applying for.",
      },
      experience: {
        type: "string",
        description: "Years of experience in the role.",
      },
      note: {
        type: "string",
        description: "Additional notes or information from the candidate.",
      },
      email: {
        type: "string",
        description: "Candidate's email address.",
      },
    },
    required: ["name", "phone", "date", "time", "role", "experience", "email"],
  },
  method: "POST",
} as const;

export const VAPI_TOOLS = [
  CALENDAR_AVAILABILITY_TOOL,
  CALENDAR_SET_APPOINTMENT_TOOL,
] as const;
