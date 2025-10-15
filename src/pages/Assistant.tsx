import { Header } from "@/components/Header";
import { AssistantSettings } from "@/components/AssistantSettings";
import { AssistantDetails } from "@/components/AssistantDetails";

const Assistant = () => {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Assistant</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AssistantDetails />
            <AssistantSettings />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Assistant;


