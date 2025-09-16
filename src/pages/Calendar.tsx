import { Header } from "@/components/Header";
import { useEffect, useMemo, useState, Fragment } from "react";
import { calendarApi } from "@/lib/calendar-api";

const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00
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
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch all events once
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await calendarApi.listEvents();
        setEvents(list);
        console.log("Calendar: loaded events", list);
      } catch (e: any) {
        console.error("Failed to load calendar events", e);
        setError(e?.message || "Failed to load calendar events");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const visibleEvents = useMemo(() => {
    const start = new Date(weekStart).getTime();
    const endTime = (() => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + 7);
      return d.getTime();
    })();
    return events.filter((ev) => {
      const evStart = new Date(ev.start).getTime();
      const evEnd = new Date(ev.end).getTime();
      return evStart < endTime && evEnd > start; // overlap
    });
  }, [events, weekStart]);

  const cellHasEvent = (dayOffset: number, hour: number) => {
    const cellStart = new Date(weekStart);
    cellStart.setDate(weekStart.getDate() + dayOffset);
    cellStart.setHours(hour, 0, 0, 0);

    const cellEnd = new Date(cellStart);
    cellEnd.setHours(hour + 1, 0, 0, 0);

    return visibleEvents.filter((ev) => {
      const evStart = new Date(ev.start).getTime();
      const evEnd = new Date(ev.end).getTime();
      return evStart < cellEnd.getTime() && evEnd > cellStart.getTime(); // overlap
    });
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
                        {matches.map((ev) => (
                          <div
                            key={ev.id}
                            className={`absolute left-1 right-1 top-1 bottom-1 rounded-md text-[10px] sm:text-xs text-white px-2 py-1 overflow-hidden ${ev.color || 'bg-primary/80'}`}
                            title={`${ev.title}`}
                            onClick={() => setSelectedEvent(ev)}
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