import type { DashboardSnapshot, ScenarioInput, ScenarioResult, SourceStatus } from "../../shared/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const hasBody = init?.body !== undefined && init.body !== null;
  if (hasBody && !headers.has("content-type")) headers.set("content-type", "application/json");

  const response = await fetch(url, {
    ...init,
    headers
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return (await response.json()) as T;
}

export const api = {
  snapshot: () => request<DashboardSnapshot>("/api/snapshot"),
  refresh: () => request<DashboardSnapshot>("/api/refresh", { method: "POST" }),
  scenario: (input: ScenarioInput) =>
    request<ScenarioResult>("/api/scenario", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  sources: () => request<SourceStatus[]>("/api/sources")
};
