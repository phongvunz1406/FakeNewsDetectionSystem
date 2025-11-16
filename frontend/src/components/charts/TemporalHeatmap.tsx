import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { HistoryRecord } from '../../types/prediction';

interface TemporalHeatmapProps {
  history: HistoryRecord[];
}

const TemporalHeatmap: React.FC<TemporalHeatmapProps> = ({ history }) => {
  const heatmapData = useMemo(() => {
    // Create a matrix of confidence levels by day and hour
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Initialize matrix with zeros
    const matrix: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));
    const counts: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

    // Aggregate data
    history.forEach(record => {
      const date = new Date(record.timestamp);
      const day = date.getDay();
      const hour = date.getHours();

      matrix[day][hour] += record.confidence * 100;
      counts[day][hour] += 1;
    });

    // Calculate averages
    const avgMatrix = matrix.map((row, dayIdx) =>
      row.map((sum, hourIdx) => {
        const count = counts[dayIdx][hourIdx];
        return count > 0 ? sum / count : null;
      })
    );

    return [{
      type: 'heatmap',
      z: avgMatrix,
      x: hours.map(h => `${h.toString().padStart(2, '0')}:00`),
      y: dayNames,
      colorscale: [
        [0, '#fee2e2'],
        [0.5, '#fef3c7'],
        [1, '#d1fae5']
      ],
      colorbar: {
        title: {
          text: 'Avg Confidence %',
          side: 'right'
        },
        thickness: 20,
        len: 0.9
      },
      hovertemplate: '<b>%{y}</b><br>' +
        'Hour: %{x}<br>' +
        'Avg Confidence: %{z:.2f}%<br>' +
        '<extra></extra>',
      hoverlabel: {
        bgcolor: 'white',
        bordercolor: '#ddd',
        font: { size: 14, color: '#333' }
      },
      zmin: 0,
      zmax: 100,
      showscale: true
    }];
  }, [history]);

  const layout = useMemo(() => ({
    title: {
      text: '<b>Prediction Confidence: Day & Time Patterns</b>',
      font: { size: 20 }
    },
    xaxis: {
      title: 'Hour of Day',
      titlefont: { size: 14 },
      tickfont: { size: 10 },
      side: 'bottom'
    },
    yaxis: {
      title: 'Day of Week',
      titlefont: { size: 14 },
      tickfont: { size: 12 }
    },
    width: 900,
    height: 500,
    margin: { t: 80, r: 120, l: 100, b: 80 },
    paper_bgcolor: 'rgba(0,0,0,0)'
  }), []);

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    responsive: true,
    toImageButtonOptions: {
      format: 'png',
      filename: 'temporal_patterns',
      height: 700,
      width: 1200,
      scale: 2
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <Plot
        data={heatmapData as any}
        layout={layout as any}
        config={config}
        className="w-full"
      />

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Insight:</span> This heatmap shows average confidence levels
          across different days and times, helping identify temporal patterns in prediction quality.
          Darker green indicates higher confidence, while lighter colors show lower confidence periods.
        </p>
      </div>
    </div>
  );
};

export default TemporalHeatmap;
