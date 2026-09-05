import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  Fuel,
  Wrench,
  Sparkles,
  Receipt,
  Car,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useVehicle } from '../context/VehicleContext';
import { api } from '../api/client';

export const AnalyticsPage: React.FC = () => {
  const { activeVehicle, stats } = useVehicle();
  const [trendData, setTrendData] = useState<{
    monthlyTrends: any[];
    fillupTimeline: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeVehicle) return;
    setLoading(true);
    api.getTrends(activeVehicle.id)
      .then((data) => setTrendData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeVehicle]);

  if (!activeVehicle || !stats) {
    return <div className="text-center py-12 text-slate-400">Please select a vehicle.</div>;
  }

  const { metrics, spendBreakdown } = stats;
  const odoUnit = activeVehicle.odometer_unit || 'mi';
  const fuelUnit = activeVehicle.fuel_unit || 'gal';
  const pieData = spendBreakdown.filter((s) => s.value > 0);

  const chartTooltipStyle = {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '12px',
    color: '#f8fafc',
  } as const;

  // Filter valid mpg points
  const mpgData = (trendData?.fillupTimeline || [])
    .filter((f) => f.mpg !== null && f.mpg > 0)
    .map((f) => ({
      date: f.date,
      mpg: f.mpg,
      price: f.pricePerUnit,
    }));

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-500" />
          Vehicle Analytics & Total Cost of Ownership
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Comprehensive cost-per-mile, fuel efficiency trends, and spending breakdown
        </p>
      </div>

      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Total Spent (TCO)
          </div>
          <div className="text-xl font-mono font-bold text-white mt-1">
            ${metrics.tco.totalSpentExcludingPurchase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            +${(metrics.tco.purchasePrice || 0).toLocaleString()} purchase
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Total Cost / {odoUnit}
          </div>
          <div className="text-xl font-mono font-bold text-blue-400 mt-1">
            ${metrics.tco.overallCostPerMile}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            ${metrics.fuel.costPerMile} fuel only
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Fuel className="w-4 h-4 text-brand-400" />
            Average Fuel Economy
          </div>
          <div className="text-xl font-mono font-bold text-brand-400 mt-1">
            {metrics.fuel.avgMpg > 0 ? `${metrics.fuel.avgMpg} MPG` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Avg ${metrics.fuel.avgPricePerUnit}/{fuelUnit}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Car className="w-4 h-4 text-purple-400" />
            Total Tracked Miles
          </div>
          <div className="text-xl font-mono font-bold text-white mt-1">
            {metrics.totalMilesDriven.toLocaleString()} {odoUnit}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Odo: {metrics.currentOdometer.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Monthly Expense Breakdown Bar Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-base font-bold text-white mb-1">Monthly Spending Trend ($)</h2>
        <p className="text-xs text-slate-400 mb-4">
          Monthly expenditure grouped by Fuel, Service, Modifications, and Other expenses
        </p>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
            Loading charts...
          </div>
        ) : !trendData || trendData.monthlyTrends.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
            No monthly data recorded yet.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="fuel" name="Fuel" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="service" name="Maintenance" stackId="a" fill="#10B981" />
                <Bar dataKey="upgrades" name="Mods" stackId="a" fill="#A855F7" />
                <Bar dataKey="other" name="Expenses" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Two Column Section: MPG History & Spending Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Economy (MPG) Line Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-base font-bold text-white mb-1">Fuel Economy History (MPG)</h2>
          <p className="text-xs text-slate-400 mb-4">Calculated MPG across full fillups</p>

          {mpgData.length < 2 ? (
            <div className="h-56 flex items-center justify-center text-slate-500 text-sm text-center px-4">
              Need at least 2 full tank fillups to plot MPG history trend line.
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mpgData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mpg"
                    name="MPG"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#22c55e' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Total Cost Breakdown Pie Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-base font-bold text-white mb-1">Total Spend Distribution</h2>
          <p className="text-xs text-slate-400 mb-4">Allocation of total vehicle budget</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="h-56 w-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as { name: string; value: number; color?: string };
                      return (
                        <div
                          className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 shadow-xl"
                          style={{ color: '#f8fafc' }}
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: row.color || '#64748b' }}
                            />
                            <span>{row.name}</span>
                          </div>
                          <div className="mt-1 font-mono text-sm font-bold text-white">
                            ${Number(row.value).toFixed(2)}
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Labels */}
            <div className="space-y-2 text-xs">
              {spendBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color || '#64748b' }}
                  />
                  <span className="text-slate-400">{item.name}:</span>
                  <span className="text-white font-mono font-bold">${item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
