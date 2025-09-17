import {
  N8N_WEBHOOK_BASE_URL,
  N8N_CALENDAR_EVENTS_PATH,
} from "@/lib/vapi-tools";

export interface CalendarApiEvent {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  color?: string;
  description?: string;
  htmlLink?: string;
  hangoutLink?: string;
  startTimeZone?: string;
  endTimeZone?: string;
}

function toIsoFromGoogleDate(obj: any): string | undefined {
  if (!obj) return undefined;
  // Google Calendar returns either dateTime (ISO) or date (YYYY-MM-DD for all day)
  if (obj.dateTime) {
    // Handle timezone-aware dates properly
    const date = new Date(obj.dateTime);
    return date.toISOString();
  }
  if (obj.date) {
    // treat all-day as start of that day
    return new Date(obj.date + "T00:00:00").toISOString();
  }
  return undefined;
}

function extractHangoutLink(e: any): string | undefined {
  if (e.hangoutLink) return e.hangoutLink;
  const ep = e.conferenceData?.entryPoints;
  if (Array.isArray(ep)) {
    const video = ep.find((p: any) => p.entryPointType === "video" && p.uri);
    if (video?.uri) return video.uri;
  }
  return undefined;
}

function mapGoogleEvent(e: any): CalendarApiEvent | null {
  console.log("🔍 Mapping Google event:", e);
  
  const startIso = toIsoFromGoogleDate(
    e.start ?? e.startTime ?? e.startDateTime
  );
  const endIso = toIsoFromGoogleDate(e.end ?? e.endTime ?? e.endDateTime);
  
  console.log("📅 Start ISO:", startIso);
  console.log("�� End ISO:", endIso);
  
  if (!startIso || !endIso) {
    console.warn("⚠️ Skipping event due to missing start/end dates:", e);
    return null;
  }
  
  const mapped = {
    id: String(
      e.id ?? `${startIso}-${endIso}-${e.summary || e.title || "Event"}`
    ),
    title: String(e.summary ?? e.title ?? "Event"),
    start: startIso,
    end: endIso,
    color: undefined,
    description: e.description ? String(e.description) : undefined,
    htmlLink: e.htmlLink ? String(e.htmlLink) : undefined,
    hangoutLink: extractHangoutLink(e),
    startTimeZone: e.start?.timeZone,
    endTimeZone: e.end?.timeZone,
  };
  
  console.log("✅ Mapped event:", mapped);
  return mapped;
}

export const calendarApi = {
  async listEvents(
    _startIso?: string,
    _endIso?: string
  ): Promise<CalendarApiEvent[]> {
    if (!N8N_CALENDAR_EVENTS_PATH) {
      console.log("⚠️ No calendar events path configured");
      return [];
    }

    const url = `${N8N_WEBHOOK_BASE_URL}/${N8N_CALENDAR_EVENTS_PATH}`;
    console.log("🔄 Fetching calendar events from:", url);
    
    try {
      const res = await fetch(url, {
        method: "GET",
      });

      if (!res.ok) {
        const text = await res.text();
        console.warn(`Calendar API error: ${res.status} ${text}`);
        return [];
      }

      // Parse JSON with error handling - removed content-length check
      let data: any = null;
      try {
        const responseText = await res.text();
        
        // Check if response is empty or just whitespace
        if (!responseText.trim()) {
          console.log("calendarApi: empty response body, returning empty array");
          return [];
        }
        
        data = JSON.parse(responseText);
        console.log("📊 Calendar API raw response:", data);
        console.log("📊 Response type:", typeof data);
        console.log("📊 Is array:", Array.isArray(data));
      } catch (jsonError) {
        console.warn("calendarApi: failed to parse JSON response", jsonError);
        return [];
      }

      // If data is null or undefined, return empty array
      if (!data) {
        console.log("calendarApi: no data received, returning empty array");
        return [];
      }

      let raw: any[] = [];
      
      // Handle direct array response (your current API structure)
      if (Array.isArray(data)) {
        raw = data;
        console.log("📊 Using direct array response, length:", raw.length);
      } else if (data && Array.isArray(data.data)) {
        raw = data.data;
        console.log("📊 Using data.data array, length:", raw.length);
      } else if (data && Array.isArray(data.body)) {
        raw = data.body;
        console.log("📊 Using data.body array, length:", raw.length);
      } else if (data && data.json && Array.isArray(data.json)) {
        raw = data.json;
        console.log("📊 Using data.json array, length:", raw.length);
      } else if (data && data.items && Array.isArray(data.items)) {
        raw = data.items;
        console.log("📊 Using data.items array, length:", raw.length);
      } else if (data && data.json && typeof data.json === "object") {
        raw = [data.json];
        console.log("📊 Using single data.json object");
      } else if (
        data &&
        typeof data === "object" &&
        (data.start || data.summary || data.id)
      ) {
        raw = [data];
        console.log("📊 Using single event object");
      } else {
        console.warn("📊 Unknown response structure:", data);
        return [];
      }

      console.log("🔄 Processing", raw.length, "raw events...");
      
      const mapped = raw
        .map(mapGoogleEvent)
        .filter((x): x is CalendarApiEvent => Boolean(x));

      console.log("✅ Calendar API: total mapped events", mapped.length);
      console.log("📅 Mapped events:", mapped);

      return mapped;
    } catch (error) {
      console.error("calendarApi: network or other error", error);
      return [];
    }
  },
};
