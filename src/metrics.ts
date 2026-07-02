export type MetricsPayload = {
  totals: {
    downloads: number;
    agents: number;
    payments: {
      transactions: number;
      amountAtomic: string;
      amountUsdc: string;
    };
    sessions: number;
  };
  daily?: {
    downloads: number;
    agents: number;
    payments: {
      transactions: number;
      amountAtomic: string;
      amountUsdc: string;
    };
    sessions: number;
  };
};

export type MetricKey = "agents" | "volume" | "settlements" | "downloads";

export const metricKeys = ["agents", "volume", "settlements", "downloads"] as const;

const pollMs = 15_000;

function env() {
  return (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_URL;
}

export function metricsUrl(base = env()): string | undefined {
  const raw = base?.trim();

  if (!raw) {
    return undefined;
  }

  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  return `${url.replace(/\/+$/, "")}/api/metrics`;
}

function volumeUrl(base = env()): string | undefined {
  const raw = base?.trim();

  if (!raw) {
    return undefined;
  }

  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  return `${url.replace(/\/+$/, "")}/api/metrics/volume`;
}

export function formatMetricCount(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  return Math.trunc(value).toLocaleString("en-US");
}

export function formatMetricUsdc(value: string | number): string {
  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount)) {
    return "";
  }

  const abs = Math.abs(amount);

  if (abs >= 1_000_000) {
    return `$${(amount / 1_000_000).toLocaleString("en-US", {
      maximumFractionDigits: 3
    })}M`;
  }

  if (abs >= 1_000) {
    return `$${(amount / 1_000).toLocaleString("en-US", { maximumFractionDigits: 3 })}K`;
  }

  return `$${amount.toLocaleString("en-US", {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 3
  })}`;
}

export function metricValues(payload: MetricsPayload): Record<MetricKey, string> {
  return {
    agents: formatMetricCount(payload.totals.agents),
    volume: formatMetricUsdc(payload.totals.payments.amountUsdc),
    settlements: formatMetricCount(payload.totals.payments.transactions),
    downloads: formatMetricCount(payload.totals.downloads)
  };
}

export function metricDeltas(payload: MetricsPayload): Record<MetricKey, string> {
  const daily = payload.daily;
  return {
    agents: `+${formatMetricCount(daily?.agents ?? 0)} today`,
    volume: `+${formatMetricUsdc(daily?.payments.amountUsdc ?? "0")} today`,
    settlements: `+${formatMetricCount(daily?.payments.transactions ?? 0)} today`,
    downloads: `+${formatMetricCount(daily?.downloads ?? 0)} today`
  };
}

function writeMetric(root: ParentNode, key: MetricKey, value: string, delta: string) {
  const node = root.querySelector<HTMLElement>(`[data-metric="${key}"] strong`);
  const deltaNode = root.querySelector<HTMLElement>(`[data-metric="${key}"] [data-delta]`);

  if (node) {
    node.textContent = value;
  }
  if (deltaNode) {
    deltaNode.textContent = delta;
  }
}

function writeMetrics(root: ParentNode, payload: MetricsPayload) {
  const values = metricValues(payload);
  const deltas = metricDeltas(payload);

  for (const key of metricKeys) {
    writeMetric(root, key, values[key], deltas[key]);
  }
}

export function pollMetrics(root: ParentNode) {
  const url = metricsUrl();
  const volUrl = volumeUrl();

  if (!url) {
    return () => { };
  }

  let stopped = false;
  let timer = 0;

  const load = async () => {
    try {
      const [metricsResponse, volumeResponse] = await Promise.all([
        fetch(url, { cache: "no-store" }),
        volUrl ? fetch(volUrl, { cache: "no-store" }) : Promise.resolve(null),
      ]);

      if (!metricsResponse.ok) {
        return;
      }

      const payload = await metricsResponse.json() as MetricsPayload;

      if (volumeResponse && volumeResponse.ok) {
        const vol = await volumeResponse.json() as { total: string; daily: string };
        payload.totals.payments.amountUsdc = vol.total;
        if (payload.daily) {
          payload.daily.payments.amountUsdc = vol.daily;
        }
      }

      if (!stopped) {
        writeMetrics(root, payload);
      }
    } catch {
      // Keep the last live values visible during transient API failures.
    } finally {
      if (!stopped) {
        timer = window.setTimeout(load, pollMs);
      }
    }
  };

  void load();

  return () => {
    stopped = true;
    window.clearTimeout(timer);
  };
}
