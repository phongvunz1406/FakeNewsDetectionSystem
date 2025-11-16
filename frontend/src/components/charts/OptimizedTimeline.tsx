import React, { useState, useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import type { HistoryRecord } from '../../types/prediction';

interface OptimizedTimelineProps {
  history: HistoryRecord[];
  onRefresh?: () => void;
  maxDataPoints?: number; // Limit for performance
}

const OptimizedTimeline: React.FC<OptimizedTimelineProps> = ({
  history,
  onRefresh,
  maxDataPoints = 1000
}) => {
  const [filter, setFilter] = useState<'all' | 'real' | 'fake'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'Low Risk' | 'Medium Risk' | 'High Risk'>('all');

  // Optimized filtering with memoization
  const filteredData = useMemo(() => {
    let filtered = [...history];

    // Apply prediction filter
    if (filter === 'real') {
      filtered = filtered.filter(record => record.prediction === 'Real');
    } else if (filter === 'fake') {
      filtered = filtered.filter(record => record.prediction === 'Fake');
    }

    // Apply risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(record => record.risk_level === riskFilter);
    }

    // Sort by timestamp
    filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Sample data if too large for performance
    if (filtered.length > maxDataPoints) {
      const step = Math.ceil(filtered.length / maxDataPoints);
      filtered = filtered.filter((_, index) => index % step === 0);
    }

    return filtered;
  }, [history, filter, riskFilter, maxDataPoints]);

  // Memoized chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    const realRecords = filteredData.filter(r => r.prediction === 'Real');
    const fakeRecords = filteredData.filter(r => r.prediction === 'Fake');

    return [
      {
        type: 'scattergl', // Use WebGL for better performance with large datasets
        mode: 'markers+lines',
        name: 'Real News',
        x: realRecords.map(r => r.timestamp),
        y: realRecords.map(r => r.confidence * 100),
        marker: {
          size: 8,
          color: '#10b981',
          symbol: 'circle',
          line: {
            color: 'white',
            width: 1
          }
        },
        line: {
          color: '#10b981',
          width: 2,
          shape: 'spline'
        },
        hovertemplate: '<b>Real News</b><br>' +
          'Time: %{x}<br>' +
          'Confidence: %{y:.2f}%<br>' +
          '<extra></extra>',
      },
      {
        type: 'scattergl',
        mode: 'markers+lines',
        name: 'Fake News',
        x: fakeRecords.map(r => r.timestamp),
        y: fakeRecords.map(r => r.confidence * 100),
        marker: {
          size: 8,
          color: '#ef4444',
          symbol: 'diamond',
          line: {
            color: 'white',
            width: 1
          }
        },
        line: {
          color: '#ef4444',
          width: 2,
          shape: 'spline'
        },
        hovertemplate: '<b>Fake News</b><br>' +
          'Time: %{x}<br>' +
          'Confidence: %{y:.2f}%<br>' +
          '<extra></extra>',
      }
    ];
  }, [filteredData]);

  const layout = useMemo(() => ({
    title: {
      text: `<b>Prediction History Timeline</b>${filteredData.length !== history.length ? ` (${filteredData.length} of ${history.length} records)` : ''}`,
      font: { size: 20 }
    },
    xaxis: {
      title: 'Timestamp',
      titlefont: { size: 14 },
      tickfont: { size: 11 },
      gridcolor: '#e5e7eb',
      showgrid: true,
      type: 'date',
      rangeslider: { visible: true, thickness: 0.05 }
    },
    yaxis: {
      title: 'Confidence Level (%)',
      titlefont: { size: 14 },
      tickfont: { size: 12 },
      range: [0, 105],
      gridcolor: '#e5e7eb',
      showgrid: true
    },
    plot_bgcolor: '#f9fafb',
    paper_bgcolor: 'rgba(0,0,0,0)',
    height: 500,
    margin: { t: 80, r: 40, l: 60, b: 100 },
    legend: {
      x: 0.02,
      y: 0.98,
      bgcolor: 'rgba(255,255,255,0.9)',
      bordercolor: '#ddd',
      borderwidth: 1
    },
    hovermode: 'closest',
    shapes: [
      {
        type: 'line',
        x0: 0,
        x1: 1,
        xref: 'paper',
        y0: 70,
        y1: 70,
        line: {
          color: '#f59e0b',
          width: 2,
          dash: 'dash'
        }
      },
      {
        type: 'line',
        x0: 0,
        x1: 1,
        xref: 'paper',
        y0: 85,
        y1: 85,
        line: {
          color: '#10b981',
          width: 2,
          dash: 'dash'
        }
      }
    ],
    annotations: [
      {
        x: 0.02,
        y: 70,
        xref: 'paper',
        yref: 'y',
        text: 'Medium Risk',
        showarrow: false,
        xanchor: 'left',
        font: { size: 10, color: '#f59e0b' }
      },
      {
        x: 0.02,
        y: 85,
        xref: 'paper',
        yref: 'y',
        text: 'Low Risk',
        showarrow: false,
        xanchor: 'left',
        font: { size: 10, color: '#10b981' }
      }
    ]
  }), [filteredData.length, history.length]);

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    responsive: true,
    toImageButtonOptions: {
      format: 'png',
      filename: 'prediction_history',
      height: 800,
      width: 1200,
      scale: 2
    }
  };

  const stats = useMemo(() => {
    const total = filteredData.length;
    const real = filteredData.filter(r => r.prediction === 'Real').length;
    const fake = filteredData.filter(r => r.prediction === 'Fake').length;
    const avgConfidence = total > 0
      ? filteredData.reduce((sum, r) => sum + r.confidence, 0) / total * 100
      : 0;

    return { total, real, fake, avgConfidence };
  }, [filteredData]);

  const handleFilterChange = useCallback((newFilter: 'all' | 'real' | 'fake') => {
    setFilter(newFilter);
  }, []);

  const handleRiskFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRiskFilter(e.target.value as any);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <div className="flex gap-2">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                filter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('real')}
              className={`px-4 py-2 text-sm font-medium border-t border-b ${
                filter === 'real'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Real
            </button>
            <button
              onClick={() => handleFilterChange('fake')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                filter === 'fake'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Fake
            </button>
          </div>

          <select
            value={riskFilter}
            onChange={handleRiskFilterChange}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
          >
            <option value="all">All Risks</option>
            <option value="Low Risk">Low Risk</option>
            <option value="Medium Risk">Medium Risk</option>
            <option value="High Risk">High Risk</option>
          </select>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        )}
      </div>

      {filteredData.length !== history.length && history.length > maxDataPoints && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Performance Mode:</span> Showing a sample of {filteredData.length} out of {history.length} records for optimal performance.
          </p>
        </div>
      )}

      <Plot
        data={chartData as any}
        layout={layout as any}
        config={config}
        className="w-full"
        useResizeHandler={true}
      />

      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-sm text-blue-800 font-semibold">Shown / Total</p>
          <p className="text-3xl font-bold text-blue-600">{stats.total} / {history.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-sm text-green-800 font-semibold">Real News</p>
          <p className="text-3xl font-bold text-green-600">{stats.real}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <p className="text-sm text-red-800 font-semibold">Fake News</p>
          <p className="text-3xl font-bold text-red-600">{stats.fake}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <p className="text-sm text-purple-800 font-semibold">Avg Confidence</p>
          <p className="text-3xl font-bold text-purple-600">{stats.avgConfidence.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
};

export default OptimizedTimeline;
