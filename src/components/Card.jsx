export default function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-3xl bg-card p-5 shadow-xl shadow-black/30">
      {title && <h2 className="text-xl font-black text-accent-soft">{title}</h2>}
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      <div className={`${title || subtitle ? 'mt-4' : ''} space-y-4`}>{children}</div>
    </section>
  );
}
