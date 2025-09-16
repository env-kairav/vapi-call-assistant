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
  if (obj.dateTime) return obj.dateTime;
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
  const startIso = toIsoFromGoogleDate(
    e.start ?? e.startTime ?? e.startDateTime
  );
  const endIso = toIsoFromGoogleDate(e.end ?? e.endTime ?? e.endDateTime);
  if (!startIso || !endIso) return null;
  return {
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
}

export const calendarApi = {
  async listEvents(
    _startIso?: string,
    _endIso?: string
  ): Promise<CalendarApiEvent[]> {
    if (!N8N_CALENDAR_EVENTS_PATH) {
      return [];
    }

    const url = `${N8N_WEBHOOK_BASE_URL}/${N8N_CALENDAR_EVENTS_PATH}`;
    const res = await fetch(url, {
      method: "GET",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch calendar events: ${res.status} ${text}`);
    }

    const data = await res.json();
    console.log("calendarApi: raw response", data);

    let raw: any[] = [];
    const normalize = (arr: any[]) =>
      arr.map((item: any) => (item && item.json ? item.json : item));

    if (Array.isArray(data)) {
      raw = normalize(data);
    } else if (data && Array.isArray(data.data)) {
      raw = normalize(data.data);
    } else if (data && Array.isArray(data.body)) {
      raw = normalize(data.body);
    } else if (data && data.json && Array.isArray(data.json)) {
      raw = normalize(data.json);
    } else if (data && data.items && Array.isArray(data.items)) {
      raw = normalize(data.items);
    } else if (data && data.json && typeof data.json === "object") {
      raw = [data.json];
    } else if (
      data &&
      typeof data === "object" &&
      (data.start || data.summary || data.id)
    ) {
      raw = [data];
    }

    const mapped = raw
      .map(mapGoogleEvent)
      .filter((x): x is CalendarApiEvent => Boolean(x));

    console.log("calendarApi: total mapped events", mapped.length);

    // Return all events; filtering happens client-side by visible week
    return mapped;
  },
};
