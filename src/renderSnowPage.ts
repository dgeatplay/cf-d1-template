export interface ForecastDataPoint {
	display_at: string;
	temp: number;
	pop: number;
	precip_accum: number;
	precip_snow: number;
	precip_mix: number;
	precip_rain: number;
	snow_level: number;
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
			height: 10px;
		}
		.chart-scroll::-webkit-scrollbar-track {
			background: #1e293b;
			border-radius: 5px;
		}
		.chart-scroll::-webkit-scrollbar-thumb {
			background: linear-gradient(90deg, #f97316, #ec4899);
			border-radius: 5px;
		}
		.chart-scroll::-webkit-scrollbar-thumb:hover {
			background: linear-gradient(90deg, #ea580c, #db2777);
		}
		
		/* Chart section styling */
		.chart-section {
			border-bottom: 1px solid rgba(148, 163, 184, 0.1);
			padding-bottom: 0.5rem;
			margin-bottom: 0.5rem;
		}
		.chart-section:last-child {
			border-bottom: none;
			padding-bottom: 0;
			margin-bottom: 0;
		}
		
		/* Ensure uPlot canvases align */
		.u-wrap {
			display: block !important;
		}
		
		/* Tooltip styling */
		.chart-tooltip {
			position: absolute;
			background: rgba(15, 23, 42, 0.95);
			border: 1px solid rgba(148, 163, 184, 0.3);
			border-radius: 8px;
			padding: 8px 12px;
			font-size: 13px;
			color: #e2e8f0;
			pointer-events: none;
			z-index: 100;
			white-space: nowrap;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
			transform: translate(-50%, -100%);
			margin-top: -12px;
		}
		.chart-tooltip .value {
			font-weight: 600;
			font-size: 15px;
		}
		.chart-tooltip .time {
			color: #94a3b8;
			font-size: 11px;
			margin-top: 2px;
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
				5-Day Weather Forecast
			</p>
		</header>

		<!-- Charts Container - Single scroll for all charts -->
		<div class="bg-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
			<div class="chart-scroll overflow-x-auto pb-2" id="charts-scroll-container">
				<div id="charts-wrapper" class="min-w-0">
					
					<!-- Temperature Chart -->
					<div class="chart-section">
						<h3 class="text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
							<span class="w-3 h-3 rounded-full bg-orange-500"></span>
							Temperature (°F)
						</h3>
						<div id="chart-temp"></div>
					</div>
					
					<!-- Precipitation Chance Chart -->
					<div class="chart-section">
						<h3 class="text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
							<span class="w-3 h-3 rounded-full bg-sky-400"></span>
							Chance of Precipitation (%)
						</h3>
						<div id="chart-pop"></div>
					</div>
					
					<!-- Precipitation Amount Chart (multi-series) -->
					<div class="chart-section">
						<h3 class="text-slate-300 text-sm font-medium mb-2 flex items-center gap-4">
							<span class="flex items-center gap-1">
								<span class="w-3 h-3 rounded-full bg-blue-400"></span>
								<span class="text-xs">Snow</span>
							</span>
							<span class="flex items-center gap-1">
								<span class="w-3 h-3 rounded-full bg-purple-400"></span>
								<span class="text-xs">Mix</span>
							</span>
							<span class="flex items-center gap-1">
								<span class="w-3 h-3 rounded-full bg-green-400"></span>
								<span class="text-xs">Rain</span>
							</span>
							<span class="ml-auto text-slate-400">Precipitation Amount (in)</span>
						</h3>
						<div id="chart-precip-amount"></div>
					</div>
					
					<!-- Precipitation Accumulation Chart -->
					<div class="chart-section">
						<h3 class="text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
							<span class="w-3 h-3 rounded-full bg-emerald-400"></span>
							Cumulative Precipitation (in)
						</h3>
						<div id="chart-precip"></div>
					</div>
					
					<!-- Snowfall Accumulation Chart -->
					<div class="chart-section">
						<h3 class="text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
							<span class="w-3 h-3 rounded-full bg-violet-400"></span>
							Cumulative Snowfall (in)
						</h3>
						<div id="chart-snow"></div>
					</div>
					
					<!-- Snow Level Chart -->
					<div class="chart-section">
						<h3 class="text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
							<span class="w-3 h-3 rounded-full bg-cyan-400"></span>
							Snow Level (ft)
						</h3>
						<div id="chart-snow-level"></div>
					</div>
					
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
		const pops = rawData.map(d => ((d.pop ?? 0) * 100)); // Convert 0.91 to 91%
		
		// Calculate cumulative precipitation
		let cumulativePrecip = 0;
		const precipAccumsCumulative = rawData.map(d => {
			cumulativePrecip += (d.precip_accum ?? 0);
			return cumulativePrecip;
		});
		
		// Calculate cumulative snowfall
		let cumulativeSnow = 0;
		const snowAccumsCumulative = rawData.map(d => {
			cumulativeSnow += (d.precip_snow ?? 0);
			return cumulativeSnow;
		});
		
		// Precipitation amount breakdown (hourly values)
		const precipSnowHourly = rawData.map(d => d.precip_snow ?? 0);
		const precipMixHourly = rawData.map(d => d.precip_mix ?? 0);
		const precipRainHourly = rawData.map(d => d.precip_rain ?? 0);
		
		// Snow level (elevation in feet)
		const snowLevels = rawData.map(d => d.snow_level ?? 0);
		
		// uPlot data format: [timestamps, series1]
		const tempData = [timestamps, temps];
		const popData = [timestamps, pops];
		const precipAmountData = [timestamps, precipSnowHourly, precipMixHourly, precipRainHourly];
		const precipData = [timestamps, precipAccumsCumulative];
		const snowData = [timestamps, snowAccumsCumulative];
		const snowLevelData = [timestamps, snowLevels];
		
		// Tooltip element
		let tooltip = null;
		
		function createTooltip() {
			if (tooltip) return tooltip;
			tooltip = document.createElement('div');
			tooltip.className = 'chart-tooltip';
			tooltip.style.display = 'none';
			document.body.appendChild(tooltip);
			return tooltip;
		}
		
		function hideTooltip() {
			if (tooltip) tooltip.style.display = 'none';
		}
		
		function showTooltip(u, idx, valueFormatter, seriesColor) {
			if (!tooltip) createTooltip();
			if (idx == null || idx < 0 || idx >= u.data[0].length) {
				hideTooltip();
				return;
			}
			
			const ts = u.data[0][idx];
			const val = u.data[1][idx];
			if (val == null) {
				hideTooltip();
				return;
			}
			
			const date = new Date(ts * 1000);
			const timeStr = date.toLocaleString('en-US', { 
				weekday: 'short', 
				month: 'short', 
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			});
			
			tooltip.innerHTML = \`
				<div class="value" style="color: \${seriesColor}">\${valueFormatter(val)}</div>
				<div class="time">\${timeStr}</div>
			\`;
			
			// Position tooltip using cursor.left which is relative to the plot area
			// u.cursor.left is the x position in pixels from the left of the plot area
			const rect = u.over.getBoundingClientRect();
			const left = rect.left + u.cursor.left;
			const top = rect.top + u.valToPos(val, 'y') + window.scrollY;
			
			tooltip.style.left = left + 'px';
			tooltip.style.top = top + 'px';
			tooltip.style.display = 'block';
		}
		
		// Tooltip plugin factory
		function tooltipPlugin(valueFormatter, seriesColor) {
			return {
				hooks: {
					setCursor: (u) => {
						const idx = u.cursor.idx;
						showTooltip(u, idx, valueFormatter, seriesColor);
					},
					leave: () => {
						hideTooltip();
					}
				}
			};
		}
		
		// Day/night background plugin with midnight lines
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
						
						// Collect midnight timestamps for drawing lines later
						const midnights = [];
						
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
							
							// Save midnight for line drawing
							const midnightTs = nightMorningStart.getTime() / 1000;
							if (midnightTs >= minTime && midnightTs <= maxTime) {
								midnights.push(midnightTs);
							}
							
							// Draw morning night (midnight to 6am)
							drawTimeBlock(u, ctx, nightMorningStart, nightMorningEnd, 'rgba(71, 85, 105, 0.3)', left, top, width, height, minTime, maxTime);
							
							// Draw day (6am to 6pm)
							drawTimeBlock(u, ctx, dayStart, dayEnd, 'rgba(255, 255, 255, 0.08)', left, top, width, height, minTime, maxTime);
							
							// Draw evening night (6pm to midnight)
							drawTimeBlock(u, ctx, nightEveningStart, nightEveningEnd, 'rgba(71, 85, 105, 0.3)', left, top, width, height, minTime, maxTime);
							
							// Move to next day
							current.setDate(current.getDate() + 1);
						}
						
						// Draw vertical lines at midnight
						ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
						ctx.lineWidth = 1;
						ctx.setLineDash([4, 4]);
						
						midnights.forEach(ts => {
							const x = u.valToPos(ts, 'x', true);
							ctx.beginPath();
							ctx.moveTo(x, top);
							ctx.lineTo(x, top + height);
							ctx.stroke();
						});
						
						ctx.setLineDash([]); // Reset dash
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
			const container = document.getElementById('charts-scroll-container');
			const containerWidth = container.clientWidth;
			const isMobile = window.innerWidth < 768;
			
			// Total hours of data
			const totalHours = rawData.length;
			
			// On mobile, we want ~3 days visible (72 hours) in the viewport
			// On desktop, show all data if it fits, otherwise allow scroll
			const hoursPerScreenWidth = isMobile ? 72 : 120;
			
			// Calculate chart width
			// If we have more data than fits, make the chart wider to enable scrolling
			const minWidth = containerWidth - 20; // Account for padding
			const scaledWidth = (totalHours / hoursPerScreenWidth) * containerWidth;
			const chartWidth = Math.max(minWidth, scaledWidth);
			
			// Height - smaller since we have 3 charts
			const chartHeight = isMobile ? 180 : 220;
			
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
		
		// Create chart options
		function createChartOptions(width, height, yAxisFormatter, tooltipFormatter, seriesColor, seriesLabel, showXAxis = false) {
			return {
				width: width,
				height: height,
				plugins: [dayNightPlugin(), tooltipPlugin(tooltipFormatter, seriesColor)],
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
						// X axis - only show on bottom chart
						show: showXAxis,
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
						values: yAxisFormatter,
						font: '12px system-ui',
						size: 55,
						gap: 8,
					}
				],
				series: [
					{},
					{
						label: seriesLabel,
						stroke: seriesColor,
						width: 2,
						fill: seriesColor.replace(')', ', 0.15)').replace('rgb', 'rgba'),
						points: {
							show: false,
						},
					}
				],
				cursor: {
					points: {
						size: 8,
						fill: seriesColor,
						stroke: '#fff',
						width: 2,
					}
				},
				legend: {
					show: false,
				},
			};
		}
		
		// Store chart instances
		let charts = [];
		
		// Initialize all charts
		function initCharts() {
			const { width, height } = getChartDimensions();
			
			// Clear existing charts
			charts.forEach(c => c.destroy());
			charts = [];
			
			document.getElementById('chart-temp').innerHTML = '';
			document.getElementById('chart-pop').innerHTML = '';
			document.getElementById('chart-precip-amount').innerHTML = '';
			document.getElementById('chart-precip').innerHTML = '';
			document.getElementById('chart-snow').innerHTML = '';
			document.getElementById('chart-snow-level').innerHTML = '';
			
			// Temperature chart (no x-axis)
			const tempOpts = createChartOptions(
				width, 
				height, 
				(u, splits) => splits.map(v => v + '°'),
				(v) => Math.round(v) + '°F',
				'rgb(249, 115, 22)', // orange-500
				'Temperature',
				false
			);
			const tempChart = new uPlot(tempOpts, tempData, document.getElementById('chart-temp'));
			charts.push(tempChart);
			
			// POP chart (no x-axis)
			const popOpts = createChartOptions(
				width,
				height,
				(u, splits) => splits.map(v => v + '%'),
				(v) => Math.round(v) + '%',
				'rgb(56, 189, 248)', // sky-400
				'Precipitation Chance',
				false
			);
			// Force POP scale to 0-100
			popOpts.scales.y = { min: 0, max: 100 };
			const popChart = new uPlot(popOpts, popData, document.getElementById('chart-pop'));
			charts.push(popChart);
			
			// Precipitation Amount chart (multi-series: snow, mix, rain)
			const precipAmountOpts = {
				width: width,
				height: height,
				plugins: [dayNightPlugin(), {
					hooks: {
						setCursor: (u) => {
							const idx = u.cursor.idx;
							if (idx == null || idx < 0 || idx >= u.data[0].length) {
								hideTooltip();
								return;
							}
							
							const ts = u.data[0][idx];
							const snow = u.data[1][idx] ?? 0;
							const mix = u.data[2][idx] ?? 0;
							const rain = u.data[3][idx] ?? 0;
							
							const date = new Date(ts * 1000);
							const timeStr = date.toLocaleString('en-US', { 
								weekday: 'short', 
								month: 'short', 
								day: 'numeric',
								hour: 'numeric',
								minute: '2-digit'
							});
							
							if (!tooltip) createTooltip();
							tooltip.innerHTML = \`
								<div style="display: flex; flex-direction: column; gap: 2px;">
									<div class="value" style="color: rgb(96, 165, 250);">Snow: \${snow.toFixed(2)} in</div>
									<div class="value" style="color: rgb(192, 132, 252);">Mix: \${mix.toFixed(2)} in</div>
									<div class="value" style="color: rgb(74, 222, 128);">Rain: \${rain.toFixed(2)} in</div>
								</div>
								<div class="time">\${timeStr}</div>
							\`;
							
							const rect = u.over.getBoundingClientRect();
							const left = rect.left + u.cursor.left;
							const top = rect.top + (height / 2) + window.scrollY;
							
							tooltip.style.left = left + 'px';
							tooltip.style.top = top + 'px';
							tooltip.style.display = 'block';
						},
						leave: () => {
							hideTooltip();
						}
					}
				}],
				scales: {
					x: { time: true },
					y: { auto: true }
				},
				axes: [
					{
						show: false,
						stroke: '#94a3b8',
						grid: { stroke: 'rgba(148, 163, 184, 0.1)' },
						ticks: { stroke: 'rgba(148, 163, 184, 0.3)' },
						values: (u, splits) => splits.map(v => formatHour(v)),
						font: '12px system-ui',
						gap: 8,
					},
					{
						stroke: '#94a3b8',
						grid: { stroke: 'rgba(148, 163, 184, 0.15)' },
						ticks: { stroke: 'rgba(148, 163, 184, 0.3)' },
						values: (u, splits) => splits.map(v => v.toFixed(1) + '"'),
						font: '12px system-ui',
						size: 55,
						gap: 8,
					}
				],
				series: [
					{},
					{
						label: 'Snow',
						stroke: 'rgb(96, 165, 250)', // blue-400
						width: 2,
						fill: 'rgba(96, 165, 250, 0.15)',
						points: { show: false },
					},
					{
						label: 'Mix',
						stroke: 'rgb(192, 132, 252)', // purple-400
						width: 2,
						fill: 'rgba(192, 132, 252, 0.15)',
						points: { show: false },
					},
					{
						label: 'Rain',
						stroke: 'rgb(74, 222, 128)', // green-400
						width: 2,
						fill: 'rgba(74, 222, 128, 0.15)',
						points: { show: false },
					}
				],
				cursor: {
					points: { size: 6, width: 2 }
				},
				legend: { show: false },
			};
			const precipAmountChart = new uPlot(precipAmountOpts, precipAmountData, document.getElementById('chart-precip-amount'));
			charts.push(precipAmountChart);
			
			// Precip accumulation chart (no x-axis)
			const precipOpts = createChartOptions(
				width,
				height,
				(u, splits) => splits.map(v => v.toFixed(1) + '"'),
				(v) => v.toFixed(2) + ' in',
				'rgb(52, 211, 153)', // emerald-400
				'Precipitation',
				false
			);
			const precipChart = new uPlot(precipOpts, precipData, document.getElementById('chart-precip'));
			charts.push(precipChart);
			
			// Snowfall accumulation chart (no x-axis)
			const snowOpts = createChartOptions(
				width,
				height,
				(u, splits) => splits.map(v => v.toFixed(1) + '"'),
				(v) => v.toFixed(1) + ' in',
				'rgb(167, 139, 250)', // violet-400
				'Snowfall',
				false
			);
			const snowChart = new uPlot(snowOpts, snowData, document.getElementById('chart-snow'));
			charts.push(snowChart);
			
			// Snow level chart (with x-axis - bottom chart)
			const snowLevelOpts = createChartOptions(
				width,
				height + 30, // Extra height for x-axis labels
				(u, splits) => splits.map(v => (v / 1000).toFixed(1) + 'k'),
				(v) => v.toLocaleString() + ' ft',
				'rgb(34, 211, 238)', // cyan-400
				'Snow Level',
				true
			);
			const snowLevelChart = new uPlot(snowLevelOpts, snowLevelData, document.getElementById('chart-snow-level'));
			charts.push(snowLevelChart);
			
			// Set the wrapper width to match charts
			document.getElementById('charts-wrapper').style.width = width + 'px';
		}
		
		// Initialize
		createTooltip();
		initCharts();
		
		// Hide tooltip on scroll
		document.getElementById('charts-scroll-container').addEventListener('scroll', () => {
			hideTooltip();
		});
		
		// Handle resize
		let resizeTimeout;
		window.addEventListener('resize', () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				hideTooltip();
				initCharts();
			}, 150);
		});
	</script>
</body>
</html>`;
}
