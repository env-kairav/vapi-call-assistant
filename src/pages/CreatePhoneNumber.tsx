import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { vapiApiService } from "@/lib/vapi-api";
import { useToast } from "@/hooks/use-toast";

const CreatePhoneNumber = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("+1");
  const [twilioPhoneError, setTwilioPhoneError] = useState("");
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");

  const isValidE164 = (value: string) => /^\+[1-9]\d{1,14}$/.test(value.trim());

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name || "",
        twilioAccountSid,
        twilioAuthToken,
        twilioPhoneNumber,
      };
      return vapiApiService.importTwilioPhoneNumber(payload);
    },
    onSuccess: () => {
      toast({ title: "Phone number created" });
      navigate("/phone-numbers");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (typeof message === "string" && message.toLowerCase().includes("already in use")) {
        setTwilioPhoneError(message);
      }
      toast({ title: "Failed to create phone number", description: message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="border border-border max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">Import Twilio Phone Number</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm">Label</label>
                <Input
                  placeholder="Sales line, Support, or a friendly name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm">Twilio Phone Number (E.164)</label>
                <Input
                  placeholder="Start with country code. Example: +14155550123"
                  value={twilioPhoneNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTwilioPhoneNumber(value);
                    if (twilioPhoneError) {
                      setTwilioPhoneError("");
                    }
                  }}
                  aria-invalid={twilioPhoneError ? true : false}
                />
                {twilioPhoneError ? (
                  <p className="text-sm text-destructive">{twilioPhoneError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Format: +[country code][number], up to 15 digits.</p>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-sm">Twilio Account SID</label>
                <Input
                  placeholder="Your Twilio Account SID (starts with AC...)"
                  value={twilioAccountSid}
                  onChange={(e) => setTwilioAccountSid(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm">Twilio Auth Token</label>
                <Input
                  placeholder="Your Twilio Auth Token"
                  value={twilioAuthToken}
                  onChange={(e) => setTwilioAuthToken(e.target.value)}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/phone-numbers")}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!isValidE164(twilioPhoneNumber)) {
                      setTwilioPhoneError("Enter a valid E.164 number like +14155550123");
                      toast({
                        title: "Invalid phone number",
                        description: "Use E.164 format starting with + and country code.",
                        variant: "destructive",
                      });
                      return;
                    }
                    mutate();
                  }}
                  disabled={isPending}
                >
                  {isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreatePhoneNumber;


