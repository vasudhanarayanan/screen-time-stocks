import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function StockChart({ data, height = 400 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: 'solid', color: '#131a2b' },
        textColor: '#6b7a99',
      },
      grid: {
        vertLines: { color: '#1e2a4522' },
        horzLines: { color: '#1e2a4522' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#1e2a45' },
      timeScale: { borderColor: '#1e2a45' },
    });

    const lastPrice = data[data.length - 1]?.price ?? 100;
    const firstPrice = data[0]?.price ?? 100;
    const isUp = lastPrice >= firstPrice;

    const series = chart.addAreaSeries({
      lineColor: isUp ? '#00d4aa' : '#ff4757',
      topColor: isUp ? '#00d4aa30' : '#ff475730',
      bottomColor: isUp ? '#00d4aa05' : '#ff475705',
      lineWidth: 2,
      priceLineVisible: true,
      priceLineColor: isUp ? '#00d4aa' : '#ff4757',
    });

    series.setData(data.map(d => ({ time: d.date, value: d.price })));
    chart.timeScale().fitContent();

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
  }, [data, height]);

  return <div ref={containerRef} className="chart-container" style={{ height }} />;
}
