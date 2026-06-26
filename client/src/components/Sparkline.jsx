import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function Sparkline({ data, color = '#00d4aa', height = 40 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: { background: { type: 'solid', color: 'transparent' }, textColor: 'transparent' },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      crosshair: { mode: 0 },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addAreaSeries({
      lineColor: color,
      topColor: color + '40',
      bottomColor: color + '05',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    series.setData(data.map(d => ({ time: d.date, value: d.price })));
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [data, color, height]);

  return <div ref={containerRef} className="sparkline" style={{ height }} />;
}
