import { Header } from "@/components/Header";
import { AssistantSettings } from "@/components/AssistantSettings";

const Assistant = () => {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Assistant</h2>
          <AssistantSettings />
        </div>
      </main>
    </div>
  );
};

export default Assistant;


