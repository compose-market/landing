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

export type ModelsHealthPayload = {
  models: number;
};

export type MetricKey = "models" | "volume" | "settlements" | "downloads";

export const metricKeys = ["models", "volume", "settlements", "downloads"] as const;

const pollMs = 15_000;
const modelsPollMs = 300_000;

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

export function modelsHealthUrl(base = "https://models.compose.market"): string | undefined {
  const raw = base.trim();

  if (!raw) {
    return undefined;
  }

  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  return `${url.replace(/\/+$/, "")}/health`;
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

export function metricValues(payload: MetricsPayload, models: number): Record<MetricKey, string> {
  return {
    models: formatMetricCount(models),
    volume: formatMetricUsdc(payload.totals.payments.amountUsdc),
    settlements: formatMetricCount(payload.totals.payments.transactions),
    downloads: formatMetricCount(payload.totals.downloads)
  };
}

export function metricDeltas(payload: MetricsPayload): Record<MetricKey, string> {
  const daily = payload.daily;
  return {
    models: "",
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
  const values = metricValues(payload, Number.NaN);
  const deltas = metricDeltas(payload);

  for (const key of ["volume", "settlements", "downloads"] as const) {
    writeMetric(root, key, values[key], deltas[key]);
  }
}

export function modelCount(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const models = (payload as Partial<ModelsHealthPayload>).models;

  return typeof models === "number" && Number.isFinite(models) && models >= 0
    ? Math.trunc(models)
    : undefined;
}

export function pollMetrics(root: ParentNode) {
  const url = metricsUrl();
  const volUrl = volumeUrl();
  const modelsUrl = modelsHealthUrl();

  if (!url && !modelsUrl) {
    return () => { };
  }

  let stopped = false;
  let metricsTimer = 0;
  let modelsTimer = 0;
  let metricsController: AbortController | undefined;
  let modelsController: AbortController | undefined;

  const loadMetrics = async () => {
    if (!url) {
      return;
    }

    metricsController = new AbortController();
    try {
      const [metricsResponse, volumeResponse] = await Promise.all([
        fetch(url, { cache: "no-store", signal: metricsController.signal }),
        volUrl
          ? fetch(volUrl, { cache: "no-store", signal: metricsController.signal }).catch(() => null)
          : Promise.resolve(null),
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
        metricsTimer = window.setTimeout(loadMetrics, pollMs);
      }
    }
  };

  const loadModels = async () => {
    if (!modelsUrl) {
      return;
    }

    modelsController = new AbortController();
    try {
      const response = await fetch(modelsUrl, {
        cache: "no-cache",
        signal: modelsController.signal
      });

      if (!response.ok) {
        return;
      }

      const count = modelCount(await response.json());

      if (!stopped && count !== undefined) {
        writeMetric(root, "models", formatMetricCount(count), "");
      }
    } catch {
      // Keep the last live model count visible during transient failures.
    } finally {
      if (!stopped) {
        modelsTimer = window.setTimeout(loadModels, modelsPollMs);
      }
    }
  };

  void loadMetrics();
  void loadModels();

  return () => {
    stopped = true;
    metricsController?.abort();
    modelsController?.abort();
    window.clearTimeout(metricsTimer);
    window.clearTimeout(modelsTimer);
  };
}
