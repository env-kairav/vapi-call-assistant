import { Header } from "@/components/Header";
import { useEffect, useMemo, useState, Fragment, useRef } from "react";
import { calendarApi } from "@/lib/calendar-api";

// Expanded hours to include early morning (4 AM to 11 PM)
const hours = Array.from({ length: 20 }, (_, i) => i + 4); // 4:00 - 23:00
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatHour = (h: number) => {
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:00 ${ampm}`;
};

interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  color?: string;
  description?: string;
  htmlLink?: string;
  hangoutLink?: string;
  startTimeZone?: string;
  endTimeZone?: string;
}

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const Calendar = () => {
  // Initialize with today's date by default
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Use ref to track if we've already fetched events to prevent duplicate API calls
  const hasFetchedEvents = useRef(false);

  // Function to deduplicate events
  const deduplicateEvents = (events: CalendarEvent[]): CalendarEvent[] => {
    const seen = new Map<string, CalendarEvent>();
    
    events.forEach(event => {
      // Create a key based on start time, end time, and title to identify duplicates
      const key = `${event.start}-${event.end}-${event.title}`;
      
      if (seen.has(key)) {
        console.log("🔄 Calendar: Found duplicate event, merging:", event.title);
        // If duplicate found, merge descriptions if they're different
        const existing = seen.get(key)!;
        if (event.description && existing.description && event.description !== existing.description) {
          existing.description = `${existing.description}\n---\n${event.description}`;
        }
        // Keep the event with more details (longer description or more properties)
        if ((event.description?.length || 0) > (existing.description?.length || 0)) {
          seen.set(key, event);
        }
      } else {
        seen.set(key, event);
      }
    });
    
    const deduplicated = Array.from(seen.values());
    if (deduplicated.length !== events.length) {
      console.log(`🔄 Calendar: Deduplicated ${events.length - deduplicated.length} duplicate events`);
    }
    
    return deduplicated;
  };

  // Fetch all events once
  useEffect(() => {
    // Prevent duplicate API calls
    if (hasFetchedEvents.current) {
      console.log("🔄 Calendar: Events already fetched, skipping API call");
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      hasFetchedEvents.current = true; // Mark as fetched immediately
      
      try {
        console.log("🔄 Calendar: Fetching events...");
        const list = await calendarApi.listEvents();
        console.log("📅 Calendar: Received events:", list);
        
        // Deduplicate events before setting state
        const deduplicatedEvents = deduplicateEvents(list);
        setEvents(deduplicatedEvents);
        console.log("✅ Calendar: Set events state:", deduplicatedEvents.length, "events");
        
        // Calendar now focuses on today's date by default (no auto-navigation to first event)
        console.log("📅 Calendar: Focusing on today's date by default");
        
      } catch (e: any) {
        console.error("❌ Calendar: Failed to load events:", e);
        setError(e?.message || "Failed to load calendar events");
        setEvents([]);
        hasFetchedEvents.current = false; // Reset on error so we can retry
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []); // Empty dependency array - only run once on mount

  const visibleEvents = useMemo(() => {
    const start = new Date(weekStart).getTime();
    const endTime = (() => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + 7);
      return d.getTime();
    })();
    
    console.log("📅 Calendar: Filtering events for week:", {
      weekStart: new Date(weekStart).toISOString(),
      weekEnd: new Date(endTime).toISOString(),
      totalEvents: events.length
    });
    
    const filtered = events.filter((ev) => {
      const evStart = new Date(ev.start).getTime();
      const evEnd = new Date(ev.end).getTime();
      const overlaps = evStart < endTime && evEnd > start;
      
      console.log("📅 Event check:", {
        title: ev.title,
        start: ev.start,
        end: ev.end,
        evStart: new Date(evStart).toISOString(),
        evEnd: new Date(evEnd).toISOString(),
        overlaps,
        eventDate: new Date(evStart).toDateString(),
        weekStartDate: new Date(start).toDateString(),
        weekEndDate: new Date(endTime).toDateString()
      });
      
      return overlaps;
    });
    
    console.log("📅 Calendar: Visible events:", filtered.length, filtered);
    return filtered;
  }, [events, weekStart]);

  const cellHasEvent = (dayOffset: number, hour: number) => {
    const cellStart = new Date(weekStart);
    cellStart.setDate(weekStart.getDate() + dayOffset);
    cellStart.setHours(hour, 0, 0, 0);

    const cellEnd = new Date(cellStart);
    cellEnd.setHours(hour + 1, 0, 0, 0);

    const matches = visibleEvents.filter((ev) => {
      const evStart = new Date(ev.start);
      const evEnd = new Date(ev.end);
      
      // Check if the event is on the correct date
      const eventDate = evStart.toDateString();
      const cellDate = cellStart.toDateString();
      
      // Check if the event is in the correct hour
      const eventStartHour = evStart.getHours();
      
      // Event should appear only if:
      // 1. It's on the correct date
      // 2. It starts in the correct hour
      const shouldShow = eventDate === cellDate && eventStartHour === hour;
      
      if (shouldShow) {
        console.log("📅 Cell event match:", {
          dayOffset,
          hour,
          cellDate,
          eventDate,
          event: ev.title,
          eventStartHour,
          cellStart: cellStart.toISOString(),
          cellEnd: cellEnd.toISOString(),
          evStart: evStart.toISOString(),
          evEnd: evEnd.toISOString()
        });
      }
      
      return shouldShow;
    });
    
    return matches;
  };

  const getDateLabel = (dayOffset: number) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + dayOffset);
    return `${d.getDate()}`;
  };

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);

  const goToToday = () => setCurrentDate(new Date());
  const goPrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const goNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };
  const changeMonth = (m: number) => {
    setCurrentDate(new Date(currentYear, m, 1));
  };
  const changeYear = (y: number) => {
    setCurrentDate(new Date(y, currentMonth, 1));
  };

  const onJumpDate = (value: string) => {
    if (!value) return;
    const [y, m, day] = value.split('-').map(Number);
    if (!y || !m || !day) return;
    setCurrentDate(new Date(y, m - 1, day));
  };

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const formatTime = (iso: string, tz?: string) => {
    try {
      const date = new Date(iso);
      return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${tz ? ` (${tz})` : ''}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <Header />

      <main className="container mx-auto px-3 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Weekly Calendar</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={goPrevWeek} className="px-3 py-2 text-xs sm:text-sm border border-border rounded-md hover:bg-muted/30">Prev week</button>
            <button onClick={goToToday} className="px-3 py-2 text-xs sm:text-sm border border-border rounded-md hover:bg-muted/30">Today</button>
            <button onClick={goNextWeek} className="px-3 py-2 text-xs sm:text-sm border border-border rounded-md hover:bg-muted/30">Next week</button>
            
            <select
              value={currentMonth}
              onChange={(e) => changeMonth(Number(e.target.value))}
              className="px-3 py-2 text-xs sm:text-sm border border-border rounded-md bg-background text-foreground"
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx}>{name}</option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => changeYear(Number(e.target.value))}
              className="px-3 py-2 text-xs sm:text-sm border border-border rounded-md bg-background text-foreground"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <input
              type="date"
              className="px-3 py-2 text-xs sm:text-sm border border-border rounded-md bg-background text-foreground"
              value={formatDateYMD(currentDate)}
              onChange={(e) => onJumpDate(e.target.value)}
            />
          </div>
        </div>

        {/* Status */}
        <div className="mb-3 text-xs text-muted-foreground">
          {loading ? (
            <span>Loading events…</span>
          ) : error ? (
            <span className="text-destructive">{error}</span>
          ) : (
            <span>Showing {formatDateYMD(weekStart)} to {formatDateYMD(weekEnd)} — {visibleEvents.length} events (total {events.length})</span>
          )}
        </div>

        {/* Grid */}
        <div className="bg-card rounded-xl shadow-card overflow-hidden border border-border/50">
          <div className="overflow-x-auto">
            {/* Header Row */}
            <div className="grid min-w-[720px]" style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}>
              <div className="bg-muted/30 border-b border-border/50 h-12 flex items-center justify-center text-xs text-muted-foreground">
                {monthNames[currentMonth]} {currentYear}
              </div>
              {days.map((d, i) => (
                <div key={d} className="bg-muted/30 border-b border-border/50 h-12 flex items-center justify-center text-xs sm:text-sm text-foreground">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{d}</span>
                    <span className="text-muted-foreground text-xs">{getDateLabel(i)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Time rows */}
            <div className="grid min-w-[720px]" style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}>
              {hours.map((h) => (
                <Fragment key={`row-${h}`}>
                  <div className="border-t border-border/40 h-16 px-2 flex items-start justify-end pt-1 text-[10px] sm:text-xs text-muted-foreground">
                    {formatHour(h)}
                  </div>
                  {days.map((_, i) => {
                    const matches = cellHasEvent(i, h);
                    return (
                      <div key={`${h}-${i}`} className="border-t border-l border-border/40 h-16 relative hover:bg-muted/10 transition-colors">
                        {matches.map((ev, index) => (
                          <div
                            key={ev.id}
                            className={`absolute left-1 right-1 top-1 bottom-1 rounded-md text-[10px] sm:text-xs text-white px-2 py-1 overflow-hidden ${
                              ev.color || (index % 2 === 0 ? 'bg-primary/80' : 'bg-secondary/80')
                            }`}
                            title={`${ev.title}`}
                            onClick={() => setSelectedEvent(ev)}
                            style={{
                              // If multiple events in same cell, stack them vertically
                              top: `${index * 20}%`,
                              height: `${100 - (index * 20)}%`,
                              zIndex: 10 - index
                            }}
                          >
                            <div className="truncate">{ev.title}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-xl z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-card/90 backdrop-blur-md rounded-2xl shadow-intense max-w-md w-full p-6 border border-border/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{selectedEvent.title}</h3>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setSelectedEvent(null)} aria-label="Close">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Time</div>
                <div className="text-foreground">{formatTime(selectedEvent.start, selectedEvent.startTimeZone)} — {formatTime(selectedEvent.end, selectedEvent.endTimeZone)}</div>
              </div>
              {selectedEvent.description && (
                <div>
                  <div className="text-muted-foreground">Description</div>
                  <div className="text-foreground whitespace-pre-wrap">{selectedEvent.description}</div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {selectedEvent.hangoutLink && (
                  <a href={selectedEvent.hangoutLink} target="_blank" rel="noreferrer" className="text-primary hover:underline">Join Google Meet</a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
