export const Header = () => {
  return (
    <header className="bg-header-bg border-b border-border px-6 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-background rounded-full"></div>
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            HR Interview Assistant
          </h1>
        </div>
      </div>
    </header>
  );
};