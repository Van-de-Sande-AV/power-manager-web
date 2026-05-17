import { useMemo } from 'react';
import { createRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDevices, fetchMeasurements, type Device, type MeasurementBucket } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { rootRoute } from './__root';

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: '/login' });
  },
  component: Dashboard,
});

function Dashboard() {
  // Rolling 24h window — survives midnight without going blank.
  const to = useMemo(() => new Date(), []);
  const from = useMemo(() => new Date(to.getTime() - 24 * 60 * 60 * 1000), [to]);

  const devices = useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevices,
  });

  const measurements = useQuery({
    queryKey: ['measurements', from.toISOString().slice(0, 13)], // refresh hourly key
    queryFn: () =>
      fetchMeasurements({
        from: from.toISOString(),
        to: to.toISOString(),
        metric: 'grid_power_w',
      }),
    refetchInterval: 60_000,
  });

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Vermogen laatste 24u (W per device)</CardTitle>
        </CardHeader>
        <CardContent>
          {measurements.isLoading && <p className="text-muted-foreground">Laden…</p>}
          {measurements.error && (
            <p className="text-destructive">Fout: {String(measurements.error)}</p>
          )}
          {measurements.data && devices.data && (
            <MeasurementsChart buckets={measurements.data} devices={devices.data} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Devices ({devices.data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {devices.isLoading && <p className="text-muted-foreground">Laden…</p>}
          {devices.data && (
            <ul className="divide-y divide-border">
              {devices.data.map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.archetype} · {d.ha_entity_id}
                    </p>
                  </div>
                  <span
                    className={
                      d.enabled
                        ? 'text-xs text-primary'
                        : 'text-xs text-muted-foreground'
                    }
                  >
                    {d.enabled ? 'enabled' : 'disabled'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MeasurementsChart({
  buckets,
  devices,
}: {
  buckets: MeasurementBucket[];
  devices: Device[];
}) {
  const option = useMemo(() => {
    const deviceById = new Map(devices.map((d) => [d.id, d.name]));

    // Group buckets by device.
    const byDevice = new Map<string, Array<[number, number]>>();
    for (const b of buckets) {
      const key = b.device_id ?? b.entity ?? 'unknown';
      if (!byDevice.has(key)) byDevice.set(key, []);
      byDevice.get(key)!.push([new Date(b.bucket).getTime(), b.value_avg]);
    }

    const series = Array.from(byDevice.entries()).map(([key, points]) => ({
      name: deviceById.get(key) ?? key,
      type: 'line' as const,
      smooth: true,
      symbol: 'none',
      data: points.sort((a, b) => a[0] - b[0]),
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v: number) => `${Math.round(v)} W`,
      },
      legend: { textStyle: { color: '#a1a1aa' } },
      grid: { left: 60, right: 20, top: 40, bottom: 40 },
      xAxis: {
        type: 'time',
        axisLabel: {
          color: '#a1a1aa',
          formatter: (v: number) => format(new Date(v), 'HH:mm'),
        },
      },
      yAxis: {
        type: 'value',
        name: 'W',
        axisLabel: { color: '#a1a1aa' },
        splitLine: { lineStyle: { color: '#27272a' } },
      },
      series,
    };
  }, [buckets, devices]);

  return <ReactECharts option={option} style={{ height: 400 }} theme="dark" />;
}
