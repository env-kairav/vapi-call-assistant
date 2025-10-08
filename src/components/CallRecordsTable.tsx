import { useState } from "react";
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CallRecord } from "@/pages/Index";

const mockCallRecords: CallRecord[] = [
  {
    id: "1",
    callStatus: "completed",
    startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    summary: "Greeting; call ended quickly.",
    endedReason: "customer-ended-call",
  },
  {
    id: "2",
    callStatus: "pending",
    startedAt: new Date().toISOString(),
    summary: "In progress",
  },
  {
    id: "3",
    callStatus: "failed",
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    summary: "No answer",
    endedReason: "no-answer",
  },
];

const getStatusBadge = (status: CallRecord["callStatus"]) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-status-completed/20 text-status-completed border-status-completed/30">Completed</Badge>;
    case "pending":
      return <Badge className="bg-status-pending/20 text-status-pending border-status-pending/30">Pending</Badge>;
    case "failed":
      return <Badge className="bg-status-failed/20 text-status-failed border-status-failed/30">Failed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const formatDate = (iso?: string) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

interface CallRecordsTableProps {
  records: CallRecord[];
  onViewRecord: (record: CallRecord) => void;
}

export const CallRecordsTable = ({ records, onViewRecord }: CallRecordsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | CallRecord["callStatus"]>("");
  const [hideNoSummary, setHideNoSummary] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Use provided records or show mock data as fallback
  const allRecords = records.length > 0 ? records : mockCallRecords;
  const filteredRecords = allRecords.filter(record => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      record.id.toLowerCase().includes(term) ||
      (record.summary || '').toLowerCase().includes(term) ||
      (record.endedReason || '').toLowerCase().includes(term) ||
      (record.transcriptSnippet || '').toLowerCase().includes(term);
    const matchesFilter = !statusFilter || record.callStatus === statusFilter;

    // When enabled, hide any record without a non-empty summary (regardless of date presence)
    const summaryExists = Boolean(record.summary && record.summary.toString().trim());
    const summaryRulePass = hideNoSummary ? summaryExists : true;

    return matchesSearch && matchesFilter && summaryRulePass;
  });

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage) || 1;
  const startIndex = (currentPage - 1) * recordsPerPage;
  const displayedRecords = filteredRecords.slice(startIndex, startIndex + recordsPerPage);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setHideNoSummary(false);
    setCurrentPage(1);
  };

  if (filteredRecords.length === 0) {
    const hasData = allRecords.length > 0;
    return (
      <div className="space-y-4">
        {/* Filters remain visible */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by ID, summary, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.target.value || '') as any)}
              className="w-full sm:w-40 bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
            >
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <label className="flex items-center gap-2 text-xs text-foreground border border-border rounded-md px-2 py-2 cursor-pointer select-none w-full sm:w-auto">
              <input
                type="checkbox"
                checked={hideNoSummary}
                onChange={(e) => setHideNoSummary(e.target.checked)}
              />
              Hide records without summary
            </label>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center text-center py-14 bg-muted/10 rounded-lg border border-border/50">
          <Inbox className="w-10 h-10 text-muted-foreground mb-2" />
          <div className="text-foreground font-medium mb-1">
            {hasData ? 'No results match your filters' : 'No records to display'}
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            {hasData ? 'Try adjusting your filters or search.' : 'Records will appear here when available.'}
          </div>
          {hasData && (
            <Button size="sm" variant="outline" className="border-border" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by ID, summary, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50 border-border"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter((e.target.value || '') as any)}
            className="w-full sm:w-40 bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-foreground border border-border rounded-md px-2 py-2 cursor-pointer select-none w-full sm:w-auto">
            <input
              type="checkbox"
              checked={hideNoSummary}
              onChange={(e) => setHideNoSummary(e.target.checked)}
            />
            Hide records without summary
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground">Summary</th>
              <th className="text-left py-3 px-2 sm:px-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedRecords.map((record) => (
              <tr key={record.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="py-3 px-2 sm:px-4 text-foreground whitespace-nowrap">{formatDate(record.startedAt)}</td>
                <td className="py-3 px-2 sm:px-4">{getStatusBadge(record.callStatus)}</td>
                <td className="py-3 px-2 sm:px-4 text-foreground max-w-[520px] truncate" title={record.summary || record.transcriptSnippet}>{record.summary || record.transcriptSnippet || '-'}</td>
                <td className="py-3 px-2 sm:px-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:bg-primary/20"
                      onClick={() => onViewRecord(record)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(startIndex + recordsPerPage, filteredRecords.length)} of {filteredRecords.length} records
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="border-border"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-foreground px-3">
            {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="border-border"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};