import { apiBaseUrl, supabase } from './supabase';

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

export interface Device {
  id: string;
  name: string;
  archetype: string;
  ha_entity_id: string;
  power_sensor: string | null;
  priority: number;
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MeasurementBucket {
  bucket: string;
  metric: string;
  device_id: string | null;
  entity: string | null;
  value_avg: number;
  value_min: number | null;
  value_max: number | null;
  sample_count: number;
}

export async function fetchDevices(): Promise<Device[]> {
  const res = await fetch(`${apiBaseUrl}/api/devices`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`devices fetch failed: ${res.status}`);
  const json = (await res.json()) as { devices: Device[] };
  return json.devices;
}

export async function fetchMeasurements(params: {
  from: string;
  to: string;
  metric?: string;
  device_id?: string;
}): Promise<MeasurementBucket[]> {
  const qs = new URLSearchParams({ from: params.from, to: params.to });
  if (params.metric) qs.set('metric', params.metric);
  if (params.device_id) qs.set('device_id', params.device_id);
  const res = await fetch(`${apiBaseUrl}/api/measurements?${qs}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`measurements fetch failed: ${res.status}`);
  const json = (await res.json()) as { buckets: MeasurementBucket[] };
  return json.buckets;
}
