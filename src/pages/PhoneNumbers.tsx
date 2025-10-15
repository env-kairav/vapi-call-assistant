import { useQuery, useMutation } from "@tanstack/react-query";
import { vapiApiService, VapiPhoneNumber } from "@/lib/vapi-api";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const PhoneNumbers = () => {
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<VapiPhoneNumber[], Error>({
    queryKey: ["vapi", "phone-numbers"],
    queryFn: () => vapiApiService.getPhoneNumbers(),
  });

  const formatDateTime = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    const date = d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${date} ${time}`;
  };

  const { mutate: deleteNumber, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => vapiApiService.deletePhoneNumber(id),
    onSuccess: async () => {
      toast({ title: "Deleted" });
      await refetch();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="border border-border">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl">Phone Numbers</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? "Refreshing..." : "Refresh"}
              </Button>
              <Button asChild size="sm">
                <Link to="/phone-numbers/new">Create</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-muted-foreground">Loading phone numbers...</div>
            ) : isError ? (
              <div className="text-destructive">
                Failed to load phone numbers{error?.message ? `: ${error.message}` : "."}
              </div>
            ) : !data || data.length === 0 ? (
              <div className="text-muted-foreground">No phone numbers found.</div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border shadow-sm">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap w-[180px]">Number</TableHead>
                      <TableHead className="whitespace-nowrap w-[220px] hidden sm:table-cell">Label</TableHead>
                      <TableHead className="whitespace-nowrap w-[140px] hidden md:table-cell">Provider</TableHead>
                      <TableHead className="whitespace-nowrap w-[140px]">Status</TableHead>
                      <TableHead className="whitespace-nowrap w-[180px] hidden lg:table-cell">Created</TableHead>
                      <TableHead className="whitespace-nowrap text-right w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((pn) => (
                      <TableRow key={pn.id}>
                        <TableCell className="font-medium truncate">
                          <span className="font-mono">{pn.number}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell truncate" title={pn.name || "-"}>
                          {pn.name || "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary" className="capitalize">
                            {pn.provider}
                          </Badge>
                        </TableCell>
                        <TableCell className="truncate">
                          <Badge className="capitalize">
                            {pn.status || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell truncate">{formatDateTime(pn.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => {
                              const ok = window.confirm("Delete this phone number?");
                              if (ok) deleteNumber(pn.id);
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PhoneNumbers;


