export interface ForecastDataPoint {
	display_at: string;
	temp: number;
}

export function renderSnowPage(data: ForecastDataPoint[]): string {
	// Convert data to JSON for embedding in the page
	const dataJson = JSON.stringify(data);

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Palisades Tahoe - Snow Forecast</title>
	<script src="https://cdn.tailwindcss.com"></script>
	<link rel="stylesheet" href="https://unpkg.com/uplot@1.6.30/dist/uPlot.min.css">
	<script src="https://unpkg.com/uplot@1.6.30/dist/uPlot.iife.min.js"></script>
	<style>
		/* Custom scrollbar for the chart container */
		.chart-scroll::-webkit-scrollbar {
			height: 8px;
		}
		.chart-scroll::-webkit-scrollbar-track {
			background: #e5e7eb;
			border-radius: 4px;
		}
		.chart-scroll::-webkit-scrollbar-thumb {
			background: #6366f1;
			border-radius: 4px;
		}
		.chart-scroll::-webkit-scrollbar-thumb:hover {
			background: #4f46e5;
		}
	</style>
</head>
<body class="bg-slate-900 min-h-screen">
	<div class="max-w-7xl mx-auto px-4 py-8">
		<!-- Header -->
		<header class="mb-8">
			<h1 class="text-3xl md:text-4xl font-bold text-white tracking-tight">
				Palisades Tahoe
			</h1>
			<p class="text-slate-400 mt-2 text-lg">
				5-Day Temperature Forecast
			</p>
		</header>

		<!-- Chart Container -->
		<div class="bg-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
			<div class="chart-scroll overflow-x-auto pb-2">
				<div id="chart-wrapper" class="min-w-0">
					<div id="chart"></div>
				</div>
			</div>
			
			<!-- Legend -->
			<div class="flex items-center gap-6 mt-4 pt-4 border-t border-slate-700">
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 rounded bg-white/90 border border-slate-600"></div>
					<span class="text-slate-400 text-sm">Daytime (6am-6pm)</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 rounded bg-slate-600/50 border border-slate-600"></div>
					<span class="text-slate-400 text-sm">Nighttime</span>
				</div>
			</div>
		</div>

		<!-- Data info -->
		<p class="text-slate-500 text-sm mt-4 text-center">
			Data points: ${data.length} hours • Scroll horizontally to see more days
		</p>
	</div>

	<script>
		const rawData = ${dataJson};
		
		// Parse the data
		const timestamps = rawData.map(d => new Date(d.display_at).getTime() / 1000);
		const temps = rawData.map(d => d.temp);
		
		// uPlot data format: [timestamps, series1, series2, ...]
		const uplotData = [timestamps, temps];
		
		// Day/night background plugin
		function dayNightPlugin() {
			return {
				hooks: {
					drawClear: (u) => {
						const ctx = u.ctx;
						const { left, top, width, height } = u.bbox;
						
						// Get the time range
						const minTime = u.scales.x.min;
						const maxTime = u.scales.x.max;
						
						if (minTime == null || maxTime == null) return;
						
						// Iterate through each day in the range
						const startDate = new Date(minTime * 1000);
						const endDate = new Date(maxTime * 1000);
						
						// Start from the beginning of the first day
						let current = new Date(startDate);
						current.setHours(0, 0, 0, 0);
						
						while (current <= endDate) {
							const dayStart = new Date(current);
							dayStart.setHours(6, 0, 0, 0); // 6 AM
							const dayEnd = new Date(current);
							dayEnd.setHours(18, 0, 0, 0); // 6 PM
							
							// Night before 6am (previous night continuation)
							const nightMorningStart = new Date(current);
							nightMorningStart.setHours(0, 0, 0, 0);
							const nightMorningEnd = dayStart;
							
							// Night after 6pm
							const nightEveningStart = dayEnd;
							const nightEveningEnd = new Date(current);
							nightEveningEnd.setDate(nightEveningEnd.getDate() + 1);
							nightEveningEnd.setHours(0, 0, 0, 0);
							
							// Draw morning night (midnight to 6am)
							drawTimeBlock(u, ctx, nightMorningStart, nightMorningEnd, 'rgba(71, 85, 105, 0.3)', left, top, width, height, minTime, maxTime);
							
							// Draw day (6am to 6pm)
							drawTimeBlock(u, ctx, dayStart, dayEnd, 'rgba(255, 255, 255, 0.08)', left, top, width, height, minTime, maxTime);
							
							// Draw evening night (6pm to midnight)
							drawTimeBlock(u, ctx, nightEveningStart, nightEveningEnd, 'rgba(71, 85, 105, 0.3)', left, top, width, height, minTime, maxTime);
							
							// Move to next day
							current.setDate(current.getDate() + 1);
						}
					}
				}
			};
		}
		
		function drawTimeBlock(u, ctx, start, end, color, left, top, width, height, minTime, maxTime) {
			const startTs = start.getTime() / 1000;
			const endTs = end.getTime() / 1000;
			
			// Clamp to visible range
			const visibleStart = Math.max(startTs, minTime);
			const visibleEnd = Math.min(endTs, maxTime);
			
			if (visibleStart >= visibleEnd) return;
			
			// Convert to pixel coordinates
			const x1 = u.valToPos(visibleStart, 'x', true);
			const x2 = u.valToPos(visibleEnd, 'x', true);
			
			ctx.fillStyle = color;
			ctx.fillRect(x1, top, x2 - x1, height);
		}
		
		// Calculate chart dimensions
		function getChartDimensions() {
			const container = document.getElementById('chart-wrapper');
			const containerWidth = container.parentElement.clientWidth;
			const isMobile = window.innerWidth < 768;
			
			// Total hours of data
			const totalHours = rawData.length;
			
			// On mobile, we want ~3 days visible (72 hours) in the viewport
			// On desktop, show all data if it fits, otherwise allow scroll
			const hoursPerScreenWidth = isMobile ? 72 : 120;
			
			// Calculate chart width
			// If we have more data than fits, make the chart wider to enable scrolling
			const minWidth = containerWidth;
			const scaledWidth = (totalHours / hoursPerScreenWidth) * containerWidth;
			const chartWidth = Math.max(minWidth, scaledWidth);
			
			// Height
			const chartHeight = isMobile ? 300 : 400;
			
			return { width: chartWidth, height: chartHeight };
		}
		
		// Format axis labels
		function formatHour(ts) {
			const date = new Date(ts * 1000);
			const hour = date.getHours();
			if (hour === 0) {
				// Show day name at midnight
				return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
			}
			return hour + (hour < 12 ? 'a' : 'p');
		}
		
		// Initialize chart
		function initChart() {
			const { width, height } = getChartDimensions();
			
			const opts = {
				width: width,
				height: height,
				plugins: [dayNightPlugin()],
				scales: {
					x: {
						time: true,
					},
					y: {
						auto: true,
					}
				},
				axes: [
					{
						// X axis
						stroke: '#94a3b8',
						grid: { stroke: 'rgba(148, 163, 184, 0.1)' },
						ticks: { stroke: 'rgba(148, 163, 184, 0.3)' },
						values: (u, splits) => splits.map(v => formatHour(v)),
						font: '12px system-ui',
						gap: 8,
					},
					{
						// Y axis
						stroke: '#94a3b8',
						grid: { stroke: 'rgba(148, 163, 184, 0.15)' },
						ticks: { stroke: 'rgba(148, 163, 184, 0.3)' },
						values: (u, splits) => splits.map(v => v + '°F'),
						font: '12px system-ui',
						size: 50,
						gap: 8,
					}
				],
				series: [
					{},
					{
						label: 'Temperature',
						stroke: '#f97316',
						width: 2,
						fill: 'rgba(249, 115, 22, 0.1)',
						points: {
							show: false,
						},
					}
				],
				cursor: {
					points: {
						size: 8,
						fill: '#f97316',
						stroke: '#fff',
						width: 2,
					}
				},
				legend: {
					show: false,
				},
			};
			
			const chartEl = document.getElementById('chart');
			chartEl.innerHTML = '';
			
			const chart = new uPlot(opts, uplotData, chartEl);
			
			// Set the wrapper width to match chart
			document.getElementById('chart-wrapper').style.width = width + 'px';
			
			return chart;
		}
		
		// Initialize
		let chart = initChart();
		
		// Handle resize
		let resizeTimeout;
		window.addEventListener('resize', () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				chart.destroy();
				chart = initChart();
			}, 150);
		});
	</script>
</body>
</html>`;
}

