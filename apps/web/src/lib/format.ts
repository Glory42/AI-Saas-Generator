const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const numberFormatter = new Intl.NumberFormat("en-US");

export const formatDateTime = (iso: string): string => dateTimeFormatter.format(new Date(iso));

export const formatDate = (iso: string): string => dateFormatter.format(new Date(iso));

export const formatNumber = (value: number): string => numberFormatter.format(value);

// Generations cost fractions of a cent, so small amounts need four decimals to be meaningful.
export const formatUsd = (value: number): string => {
  const digits = value !== 0 && Math.abs(value) < 1 ? 4 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};

export const formatRelativeHours = (iso: string, now: Date = new Date()): string => {
  const diffMs = new Date(iso).getTime() - now.getTime();
  const hours = Math.max(0, Math.round(diffMs / 3_600_000));
  if (hours === 0) return "within the hour";
  return hours === 1 ? "in 1 hour" : `in ${hours} hours`;
};
