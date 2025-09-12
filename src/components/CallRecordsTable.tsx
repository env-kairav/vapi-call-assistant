import { useState } from "react";
import { Search, Filter, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CallRecord } from "@/pages/Index";

const mockCallRecords: CallRecord[] = [
  {
    id: "1",
    candidateName: "John Smith",
    phoneNumber: "+1 (555) 123-4567",
    position: "Frontend Developer",
    experience: "3 years",
    interviewDate: "2024-01-15 10:30 AM",
    callStatus: "completed"
  },
  {
    id: "2",
    candidateName: "Emily Davis",
    phoneNumber: "+1 (555) 987-6543",
    position: "Backend Developer",
    experience: "5 years",
    interviewDate: "2024-01-15 02:00 PM",
    callStatus: "pending"
  },
  {
    id: "3",
    candidateName: "Michael Johnson",
    phoneNumber: "+1 (555) 456-7890",
    position: "Full Stack Developer",
    experience: "4 years",
    interviewDate: "2024-01-14 11:00 AM",
    callStatus: "failed"
  },
  {
    id: "4",
    candidateName: "Sarah Wilson",
    phoneNumber: "+1 (555) 321-0987",
    position: "UI/UX Designer",
    experience: "2 years",
    interviewDate: "2024-01-14 09:30 AM",
    callStatus: "completed"
  },
  {
    id: "5",
    candidateName: "David Brown",
    phoneNumber: "+1 (555) 654-3210",
    position: "DevOps Engineer",
    experience: "6 years",
    interviewDate: "2024-01-13 03:30 PM",
    callStatus: "completed"
  }
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

interface CallRecordsTableProps {
  records: CallRecord[];
  onViewRecord: (record: CallRecord) => void;
}

export const CallRecordsTable = ({ records, onViewRecord }: CallRecordsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Use provided records or show mock data as fallback
  const allRecords = records.length > 0 ? records : mockCallRecords;
  const filteredRecords = allRecords.filter(record => {
    const matchesSearch = record.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.phoneNumber.includes(searchTerm) ||
                         record.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterPosition || record.position.toLowerCase().includes(filterPosition.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const displayedRecords = filteredRecords.slice(startIndex, startIndex + recordsPerPage);

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50 border-border"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter by position"
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="w-48 bg-muted/50 border-border"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Candidate Name</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone Number</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Position</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Experience</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Interview Date</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedRecords.map((record) => (
              <tr key={record.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 font-medium text-foreground">{record.candidateName}</td>
                <td className="py-3 px-4 text-muted-foreground">{record.phoneNumber}</td>
                <td className="py-3 px-4 text-foreground">{record.position}</td>
                <td className="py-3 px-4 text-muted-foreground">{record.experience}</td>
                <td className="py-3 px-4 text-muted-foreground">{record.interviewDate}</td>
                <td className="py-3 px-4">{getStatusBadge(record.callStatus)}</td>
                <td className="py-3 px-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary/20"
                    onClick={() => onViewRecord(record)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground">
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