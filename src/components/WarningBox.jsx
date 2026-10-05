export default function WarningBox({ messages }) {
  if (!messages?.length) return null;

  return (
    <div className="space-y-2">
      {messages.map((message, index) => (
        <p
          key={index}
          role="alert"
          className="rounded-2xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm font-medium text-warn"
        >
          {message}
        </p>
      ))}
    </div>
  );
}
