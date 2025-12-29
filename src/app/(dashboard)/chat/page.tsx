export default function ChatPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(height.header))]">
      <div className="w-full max-w-chat px-md">
        {/* Chat messages area placeholder */}
        <div className="flex flex-col items-center justify-center py-2xl text-center">
          <h1 className="text-h1 text-primary mb-md">
            Welcome to BFI CFO Bot
          </h1>
          <p className="text-body text-muted-foreground max-w-md">
            Your AI-powered financial advisor. Ask questions about your
            business finances, upload documents, or request reports.
          </p>
        </div>

        {/* Chat input placeholder */}
        <div className="mt-xl">
          <div className="flex items-center gap-sm p-md bg-surface border border-border rounded-lg">
            <input
              type="text"
              placeholder="Ask about your finances..."
              className="flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground"
              disabled
            />
            <span className="text-caption text-muted-foreground">
              (Coming soon)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
