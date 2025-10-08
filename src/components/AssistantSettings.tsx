import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { N8N_WEBHOOK_BASE_URL } from "@/lib/vapi-tools";

type AssistantSettingsData = {
  firstMessage: string;
  n8nBaseUrl: string;
};

const STORAGE_KEY = "assistantSettings";

const defaultSettings: AssistantSettingsData = {
  firstMessage: "Hi, this is HR from Envisage Infotech. How can I help you today?",
  n8nBaseUrl: N8N_WEBHOOK_BASE_URL,
};

export const AssistantSettings = () => {
  const [settings, setSettings] = useState<AssistantSettingsData>(defaultSettings);
  const [saved, setSaved] = useState<null | "ok" | "error">(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...defaultSettings, ...parsed });
      } else {
        // Initialize from config defaults on first load and persist
        setSettings(defaultSettings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
      }
    } catch (_) {
      // ignore
    }
  }, []);

  const handleChange = (field: keyof AssistantSettingsData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(null);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved("ok");
    } catch (_) {
      setSaved("error");
    }
  };

  const handleReset = () => {
    try {
      setSettings(defaultSettings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
      setSaved("ok");
    } catch (_) {
      setSaved("error");
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Assistant Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="n8nBaseUrl">n8n Base URL (in use)</Label>
          <Input
            id="n8nBaseUrl"
            placeholder="https://your-n8n.example.com/webhook"
            value={settings.n8nBaseUrl}
            onChange={handleChange("n8nBaseUrl")}
          />
        </div>

        {/* Assistant First Message */}
        <div className="space-y-2">
          <Label htmlFor="firstMessage">Assistant first message</Label>
          <Input
            id="firstMessage"
            placeholder="What should the assistant say first?"
            value={settings.firstMessage}
            onChange={handleChange("firstMessage")}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button type="button" onClick={handleSave}>Save</Button>
          <Button type="button" variant="outline" className="border-border" onClick={handleReset}>Reset</Button>
          {saved === "ok" && (
            <span className="text-xs text-green-500">Saved</span>
          )}
          {saved === "error" && (
            <span className="text-xs text-destructive">Failed</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


