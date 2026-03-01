"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  Clock,
  Gift,
  Wallet,
  Users,
  Tag,
  Award,
  Layers,
  TrendingUp,
  Zap,
  Gamepad2,
  Timer,
} from "lucide-react";
import {
  type ProcessedCleanData,
  calculateCleanKeyMetrics,
  calculateCleanHourlyData,
  calculateCleanStatusData,
  calculateCleanOperatorPerformance,
  calculateCleanBTagAnalysis,
  calculateCleanTopBonuses,
  calculateCategoryData,
  calculateProductData,
  calculateProcessingTimeCategories,
  formatCurrency,
  formatNumber,
} from "@/lib/clean-bonus-analyzer";

const chartColor = (i: number) => `hsl(var(--chart-${(i % 5) + 1}))`;
const PIE_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea"];

interface BonusDashboardProps {
  data: ProcessedCleanData[];
}

export function BonusDashboard({ data }: BonusDashboardProps) {
  const safeData = data ?? [];
  const lineChartConfig = useMemo(
    () => ({ count: { label: "Islem Sayisi", color: chartColor(0) } }),
    []
  );
  const pieChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {
      count: { label: "Adet", color: chartColor(0) },
    };
    const statusData = calculateCleanStatusData(safeData);
    statusData.forEach((item, index) => {
      if (item?.status)
        config[item.status] = {
          label: item.status || "Bilinmiyor",
          color: chartColor(index),
        };
    });
    return config;
  }, [safeData]);

  const metrics = useMemo(() => calculateCleanKeyMetrics(safeData), [safeData]);
  const hourlyData = useMemo(
    () => calculateCleanHourlyData(safeData),
    [safeData]
  );
  const statusData = useMemo(
    () => calculateCleanStatusData(safeData),
    [safeData]
  );
  const operatorData = useMemo(
    () => calculateCleanOperatorPerformance(safeData),
    [safeData]
  );
  const btagData = useMemo(
    () => calculateCleanBTagAnalysis(safeData),
    [safeData]
  );
  const topBonuses = useMemo(
    () => calculateCleanTopBonuses(safeData),
    [safeData]
  );
  const categoryData = useMemo(
    () => calculateCategoryData(safeData),
    [safeData]
  );
  const productData = useMemo(
    () => calculateProductData(safeData),
    [safeData]
  );
  const timeCategories = useMemo(
    () => calculateProcessingTimeCategories(safeData),
    [safeData]
  );

  if (safeData.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        <p>Henuz veri yuklenmedi. Lutfen bir dosya yukleyin.</p>
      </div>
    );
  }

  const metricCards = [
    {
      title: "Toplam Islem",
      value: formatNumber(metrics.totalTransactions),
      icon: Activity,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      valueColor: "text-neutral-900",
    },
    {
      title: "Normal Ort. Sure",
      value: `${((timeCategories.find((c) => c.category === "Normal")?.avgTime ?? 0) / 60).toFixed(1)} dk`,
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      valueColor: "text-neutral-900",
      subtitle: `${timeCategories.find((c) => c.category === "Normal")?.percentage ?? 0}% Normal`,
    },
    {
      title: "Toplam Bonus Hacmi",
      value: formatCurrency(metrics.totalBonusValue),
      icon: Gift,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      valueColor: "text-neutral-900",
    },
    {
      title: "Toplam Odenen",
      value: formatCurrency(metrics.totalPaid),
      icon: Wallet,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      valueColor: "text-neutral-900",
    },
  ];

  const axisStyle = { fill: "#525252", fontSize: 11 };
  const gridStroke = "#e5e5e5";

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metricCards.map((card, index) => (
          <Card
            key={index}
            className="border border-neutral-200 bg-[#fafaf8] shadow-sm transition-shadow hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                {card.title}
              </CardTitle>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.valueColor}`}>
                {card.value}
              </div>
              {card.subtitle && (
                <div className="text-xs text-neutral-500">{card.subtitle}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-neutral-200 bg-[#fafaf8] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-neutral-800">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Saatlik Yogunluk
            </CardTitle>
            <CardDescription className="text-neutral-500">
              Gunun saatlerine gore islem dagilimi
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-white">
            <ChartContainer config={lineChartConfig} className="h-[280px] w-full">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="hour" tick={axisStyle} interval={3} />
                <YAxis tick={axisStyle} />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-neutral-200 bg-white p-2 shadow-lg">
                        <p className="font-semibold text-neutral-800">Saat: {d.hour}</p>
                        <p className="text-sm text-blue-600">
                          {formatNumber(d.count)} islem
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border border-neutral-200 bg-[#fafaf8] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-neutral-800">
              <Zap className="h-5 w-5 text-pink-500" />
              Islem Durumu
            </CardTitle>
            <CardDescription className="text-neutral-500">
              Status bazinda dagilim
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="flex flex-col items-center gap-4 lg:flex-row">
              <ChartContainer
                config={pieChartConfig}
                className="h-[240px] w-full lg:w-1/2"
              >
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                  >
                    {statusData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-neutral-200 bg-white p-2 shadow-lg">
                          <p className="font-bold text-neutral-800">{d.status}</p>
                          <p className="text-sm text-neutral-600">
                            {formatNumber(d.count)} islem
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ChartContainer>
              <div className="w-full space-y-2 lg:w-1/2">
                {statusData.map((item, index) => {
                  const total = statusData.reduce(
                    (acc, curr) => acc + curr.count,
                    0
                  );
                  const percent = ((item.count / total) * 100).toFixed(1);
                  return (
                    <div
                      key={item.status}
                      className="flex items-center justify-between rounded-lg border border-neutral-300 bg-neutral-200/60 p-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded"
                          style={{
                            backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                          }}
                        />
                        <span className="text-sm font-medium text-neutral-800">
                          {item.status}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-neutral-800">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Islem Suresi Dagilimi */}
      <Card className="border border-neutral-200 bg-[#fafaf8] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-neutral-800">
            <Timer className="h-5 w-5 text-blue-500" />
            Islem Suresi Dagilimi
          </CardTitle>
          <CardDescription className="text-neutral-500">
            Normal (0-60sn), Gecikmeli (61-300sn), Uzun (300+sn)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {timeCategories.map((cat) => {
              const colors: Record<
                string,
                { bg: string; text: string }
              > = {
                Normal: {
                  bg: "bg-neutral-100 border-neutral-300",
                  text: "text-neutral-800",
                },
                Gecikmeli: {
                  bg: "bg-amber-50 border-amber-300",
                  text: "text-amber-800",
                },
                Uzun: {
                  bg: "bg-red-50 border-red-200",
                  text: "text-red-800",
                },
              };
              const c = colors[cat.category] ?? colors.Normal;
              return (
                <div
                  key={cat.category}
                  className={`rounded-xl border-2 p-4 shadow-md shadow-neutral-300/30 ${c.bg}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`font-bold ${c.text}`}>
                      {cat.category}
                    </span>
                    <span className="text-2xl font-bold text-neutral-800">
                      {cat.percentage}%
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Islem</span>
                      <span className="font-semibold text-neutral-800">
                        {formatNumber(cat.count)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Ort. Sure</span>
                      <span className={`font-semibold ${c.text}`}>
                        {(cat.avgTime / 60).toFixed(1)} dk
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Operator Performansi */}
      <Card className="border border-neutral-200 bg-[#fafaf8] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-neutral-800">
            <Users className="h-5 w-5 text-amber-500" />
            Operator Performansi
          </CardTitle>
          <CardDescription className="text-neutral-500">
            Kisi bazli islem ve sure dagilimi (0-30sn / 30-60sn / 60+sn)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-auto rounded-xl border border-neutral-300 bg-neutral-50 shadow-md shadow-neutral-300/30 print:max-h-none print:overflow-visible">
            <Table>
              <TableHeader className="sticky top-0 bg-neutral-300 print:static">
                <TableRow className="border-b border-neutral-400">
                  <TableHead className="font-semibold text-neutral-800">
                    Operator
                  </TableHead>
                  <TableHead className="text-right font-semibold text-neutral-800">
                    Toplam
                  </TableHead>
                  <TableHead className="text-right font-semibold text-neutral-800">
                    0-30sn
                  </TableHead>
                  <TableHead className="text-right font-semibold text-neutral-800">
                    30-60sn
                  </TableHead>
                  <TableHead className="text-right font-semibold text-neutral-800">
                    60+sn
                  </TableHead>
                  <TableHead className="text-right font-semibold text-neutral-800">
                    Ort.Sure
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operatorData.map((item, idx) => (
                  <TableRow
                    key={item.operator}
                    className="border-neutral-200 bg-white hover:bg-neutral-100"
                  >
                    <TableCell className="text-neutral-800">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">
                          {idx + 1}
                        </span>
                        <span className="max-w-[150px] truncate font-medium text-neutral-800">
                          {item.operator}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-neutral-800">
                      {formatNumber(item.transactionCount)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-700">
                      {item.fast}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-amber-700">
                      {item.medium}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-700">
                      {item.slow}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-neutral-800">
                      {item.avgTime > 0
                        ? `${(item.avgTime / 60).toFixed(1)} dk`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pazar/BTag Dagilimi */}
      <Card className="border border-neutral-200 bg-[#fafaf8] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-neutral-800">
            <Tag className="h-5 w-5 text-blue-500" />
            BTag&apos;lerin Bonus Kullanim Dagilimi
          </CardTitle>
          <CardDescription className="text-neutral-500">
            Tum BTag segmentleri - islem sayisi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] space-y-3 overflow-auto rounded-xl border border-neutral-300 bg-neutral-100/80 p-4 shadow-md shadow-neutral-300/30 print:max-h-none print:overflow-visible">
            {btagData.map((item, idx) => {
              const maxCount = btagData[0]?.transactionCount ?? 1;
              const barWidth = (item.transactionCount / maxCount) * 100;
              const barColors = [
                "bg-primary",
                "bg-blue-500",
                "bg-amber-500",
                "bg-pink-500",
                "bg-violet-500",
                "bg-teal-500",
                "bg-orange-500",
                "bg-emerald-500",
              ];
              const barColor = barColors[idx % barColors.length];
              return (
                <div key={item.btag} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-300 text-xs font-bold text-neutral-700">
                    {idx + 1}
                  </span>
                  <span className="w-28 shrink-0 truncate text-sm font-medium text-neutral-800">
                    {item.btag}
                  </span>
                  <div className="relative flex-1 overflow-hidden rounded-lg bg-neutral-300">
                    <div
                      className={`flex h-8 items-center justify-end rounded-lg pr-3 transition-all ${barColor}`}
                      style={{ width: `${Math.max(barWidth, 10)}%` }}
                    >
                      <span className="text-xs font-bold text-white drop-shadow">
                        {formatNumber(item.transactionCount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between border-t border-neutral-300 pt-3 text-sm">
            <span className="text-neutral-500">
              {btagData.length} BTag segmenti
            </span>
            <span className="font-semibold text-blue-600">
              Toplam:{" "}
              {formatNumber(
                btagData.reduce((a, d) => a + d.transactionCount, 0)
              )}{" "}
              islem
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Bonuslar ve Kullanim Adetleri */}
      <Card className="border border-neutral-200 bg-[#fafaf8] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-neutral-800">
            <Award className="h-5 w-5 text-blue-500" />
            Bonuslar ve Kullanim Adetleri
          </CardTitle>
          <CardDescription className="text-neutral-500">
            Tum bonus turleri ve kullanim sayilari
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] space-y-2 overflow-auto rounded-xl border border-neutral-300 bg-neutral-100/80 p-3 shadow-md shadow-neutral-300/30 print:max-h-none print:overflow-visible">
            {topBonuses.map((item, idx) => (
              <div
                key={item.bonusName}
                className="flex items-center justify-between rounded-lg border border-neutral-300 bg-neutral-200/60 p-2.5 hover:bg-neutral-300/60"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <span className="max-w-[250px] truncate text-sm font-medium text-neutral-800">
                    {item.bonusName}
                  </span>
                </div>
                <span className="font-bold text-blue-600">
                  {formatNumber(item.transactionCount)} kullanim
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-neutral-300 pt-3 text-sm">
            <span className="text-neutral-500">
              {topBonuses.length} bonus tipi
            </span>
            <span className="font-semibold text-blue-600">
              Toplam:{" "}
              {formatNumber(
                topBonuses.reduce((a, d) => a + d.transactionCount, 0)
              )}{" "}
              kullanim
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Urun Dagilimi */}
      <Card className="border border-neutral-200 bg-[#fafaf8] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-neutral-800">
            <Gamepad2 className="h-5 w-5 text-amber-500" />
            Urun Dagilimi
          </CardTitle>
          <CardDescription className="text-neutral-500">
            Spor ve Casino bonus kullanimi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartContainer
              config={{ count: { label: "Islem", color: chartColor(0) } }}
              className="h-[250px]"
            >
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="product"
                  label={({ product, percent }) =>
                    `${product} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {productData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.product === "Spor"
                          ? "#2563eb"
                          : entry.product === "Casino"
                            ? "#dc2626"
                            : "#16a34a"
                      }
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-neutral-200 bg-white p-2 shadow-lg">
                        <p className="font-semibold text-neutral-800">{d.product}</p>
                        <p className="text-sm text-neutral-600">
                          {formatNumber(d.count)} islem
                        </p>
                        <p className="text-sm text-blue-600">
                          {formatCurrency(d.volume)} bonus
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ChartContainer>
            <div className="space-y-3">
              {productData.map((item) => (
                <div
                  key={item.product}
                  className={`rounded-xl border-2 p-4 ${
                    item.product === "Spor"
                      ? "border-blue-200 bg-blue-50"
                      : item.product === "Casino"
                        ? "border-pink-200 bg-pink-50"
                        : "border-neutral-200 bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-neutral-800">
                      {item.product}
                    </span>
                    <span className="text-2xl font-bold text-neutral-800">
                      {formatNumber(item.count)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kategori Dagilimi */}
      <Card className="border border-neutral-200 bg-[#fafaf8] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-neutral-800">
            <Layers className="h-5 w-5 text-pink-500" />
            Kategori Dagilimi
          </CardTitle>
          <CardDescription className="text-neutral-500">
            Bonus kategorileri bazinda dagilim
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryData.map((item, idx) => {
              const percentage =
                (item.count / metrics.totalTransactions) * 100;
              const colors = [
                "bg-primary",
                "bg-blue-500",
                "bg-amber-500",
                "bg-pink-500",
                "bg-violet-500",
              ];
              return (
                <div key={item.category} className="space-y-1 rounded-lg border border-neutral-300 bg-neutral-100/60 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-800">{item.category}</span>
                    <span className="text-neutral-500">
                      {formatNumber(item.count)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-300">
                    <div
                      className={`h-full rounded-full ${colors[idx % colors.length]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Verimsizlik Raporu */}
      <Card className="border border-red-200 bg-red-50/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-red-800">
            <Activity className="h-5 w-5" />
            Verimsizlik Raporu
          </CardTitle>
          <CardDescription className="text-red-700">
            Dusuk performans gosteren BTag ve Bonus&apos;lar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-red-200 pb-2">
                <Tag className="h-4 w-4 text-red-700" />
                <span className="text-sm font-semibold text-red-800">
                  Verimsiz Marketler/BTag
                </span>
                <span className="text-xs text-red-600">
                  (20 ve alti islem)
                </span>
              </div>
              <div className="max-h-[300px] space-y-2 overflow-auto rounded-xl border border-red-300 bg-red-50/50 p-3 shadow-md shadow-neutral-300/20 print:max-h-none print:overflow-visible">
                {btagData.filter((i) => i.transactionCount <= 20).length >
                0 ? (
                  btagData
                    .filter((i) => i.transactionCount <= 20)
                    .map((item, idx) => (
                      <div
                        key={item.btag}
                        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-100 p-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-200 text-xs font-bold text-red-800">
                            {idx + 1}
                          </span>
                          <span className="max-w-[150px] truncate text-sm font-medium text-neutral-800">
                            {item.btag}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-red-800">
                          {formatNumber(item.transactionCount)} islem
                        </span>
                      </div>
                    ))
                ) : (
                  <div className="py-4 text-center text-sm text-neutral-600">
                    Verimsiz BTag bulunamadi
                  </div>
                )}
              </div>
              <div className="border-t border-red-200 pt-2 text-sm">
                <span className="font-semibold text-red-800">
                  {
                    btagData.filter((i) => i.transactionCount <= 20).length
                  }{" "}
                  verimsiz BTag
                </span>
                <span className="text-red-600">
                  {" "}
                  / {btagData.length} toplam
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-red-200 pb-2">
                <Gift className="h-4 w-4 text-red-700" />
                <span className="text-sm font-semibold text-red-800">
                  Verimsiz Bonuslar
                </span>
                <span className="text-xs text-red-600">
                  (50 ve alti kullanim)
                </span>
              </div>
              <div className="max-h-[300px] space-y-2 overflow-auto rounded-xl border border-red-300 bg-red-50/50 p-3 shadow-md shadow-neutral-300/20 print:max-h-none print:overflow-visible">
                {topBonuses.filter((i) => i.transactionCount <= 50).length >
                0 ? (
                  topBonuses
                    .filter((i) => i.transactionCount <= 50)
                    .map((item, idx) => (
                      <div
                        key={item.bonusName}
                        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-100 p-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-200 text-xs font-bold text-red-800">
                            {idx + 1}
                          </span>
                          <span className="max-w-[150px] truncate text-sm font-medium text-neutral-800">
                            {item.bonusName}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-red-800">
                          {formatNumber(item.transactionCount)} kullanim
                        </span>
                      </div>
                    ))
                ) : (
                  <div className="py-4 text-center text-sm text-neutral-600">
                    Verimsiz bonus bulunamadi
                  </div>
                )}
              </div>
              <div className="border-t border-red-200 pt-2 text-sm">
                <span className="font-semibold text-red-800">
                  {
                    topBonuses.filter((i) => i.transactionCount <= 50).length
                  }{" "}
                  verimsiz bonus
                </span>
                <span className="text-red-600">
                  {" "}
                  / {topBonuses.length} toplam
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
