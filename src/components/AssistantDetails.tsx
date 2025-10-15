import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getAssistantFirstMessage, getN8nBaseUrl } from "@/lib/vapi-tools";
import { getVapiConfig, VAPI_ASSISTANT_ID } from "@/lib/vapi-config";
import { getSystemPrompt } from "@/hooks/useVapi";

export const AssistantDetails = () => {
  const now = new Date().toISOString();
  const config = getVapiConfig(now);
  const firstMessage = getAssistantFirstMessage();
  const systemPrompt = getSystemPrompt();
  const n8nBaseUrl = getN8nBaseUrl();

  const voice = config.voice || {};
  const transcriber = config.transcriber || {};
  const model = config.model || {};

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Assistant Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-foreground">Local Assistant</div>
              <div className="text-xs text-muted-foreground mt-1">ID: {VAPI_ASSISTANT_ID}</div>
            </div>
            <Badge variant="secondary">Local Config</Badge>
          </div>

          <Separator className="bg-border" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">First Message</div>
              <div className="text-sm text-foreground bg-muted/40 p-3 rounded">{firstMessage || "Not configured"}</div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Voice</div>
              <div className="text-sm text-foreground bg-muted/40 p-3 rounded">
                {(() => {
                  const provider = (voice as any).provider || (voice as any).name || "-";
                  const voiceId = (voice as any).voiceId || (voice as any).id || "";
                  return voiceId ? `${provider} • ${voiceId}` : provider;
                })()}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Transcriber</div>
              <div className="text-sm text-foreground bg-muted/40 p-3 rounded">
                {(() => {
                  const provider = (transcriber as any).provider || (transcriber as any).name || "-";
                  const modelName = (transcriber as any).model || "";
                  return modelName ? `${provider} • ${modelName}` : provider;
                })()}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Model</div>
              <div className="text-sm text-foreground bg-muted/40 p-3 rounded">
                {(() => {
                  const provider = (model as any).provider || (model as any).name || "openai";
                  const modelName = (model as any).model || (model as any).id || "gpt-5-mini";
                  return `${provider} • ${modelName}`;
                })()}
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">System Prompt</div>
            <div className="text-xs whitespace-pre-wrap text-foreground bg-muted/30 p-3 rounded max-h-60 overflow-auto">
              {systemPrompt}
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">n8n Base URL</div>
              <div className="text-sm text-foreground break-all">{n8nBaseUrl}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Assistant ID</div>
              <div className="text-sm text-foreground break-all">{VAPI_ASSISTANT_ID}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Config Timestamp</div>
              <div className="text-sm text-foreground">{new Date(now).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssistantDetails;


