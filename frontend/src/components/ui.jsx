export function Button({ variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-hover",
    secondary: "bg-steel text-white hover:opacity-90",
    ghost: "bg-transparent text-ink hover:bg-surface-2 border border-border",
    danger: "bg-danger text-white hover:opacity-90",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Card({ className = "", children }) {
  return (
    <div className={`bg-surface border border-border rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink mb-1">{label}</span>}
      <input
        className={`w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand ${className}`}
        {...props}
      />
      {error && <span className="block text-xs text-danger mt-1">{error}</span>}
    </label>
  );
}

export function Badge({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-surface-2 text-ink-muted",
    brand: "bg-brand-soft text-brand-hover",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    steel: "bg-steel-soft text-steel",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {description && <p className="text-sm text-ink-muted mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="text-center py-16 text-ink-muted">
      <p className="font-display text-lg text-ink">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
}
