export type FeedStatus = "ONLINE" | "STALE" | "OFFLINE";

export const FEED_STALE_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * A feed is offline when it has no usable data, stale when its last quote is
 * older than the threshold, and online otherwise. The function accepts an
 * optional clock to keep the decision deterministic in tests and on the
 * server.
 */
export function getFeedStatus(
  timestamp: string | Date | null | undefined,
  hasData: boolean,
  now = Date.now(),
  staleAfterMs = FEED_STALE_THRESHOLD_MS
): FeedStatus {
  if (!hasData || !timestamp) {
    return "OFFLINE";
  }

  const timestampMs = timestamp instanceof Date ? timestamp.getTime() : Date.parse(timestamp);
  if (!Number.isFinite(timestampMs)) {
    return "OFFLINE";
  }

  const ageMs = Math.max(0, now - timestampMs);
  return ageMs > staleAfterMs ? "STALE" : "ONLINE";
}

export function formatTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return "—";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC"
  }).format(date) + " UTC";
}

export function formatDateOnly(dateValue: string | null | undefined): string {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(date);
}
