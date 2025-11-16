import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { PredictionResponse } from '../../types/prediction';

interface ProbabilityChartProps {
  prediction: PredictionResponse;
}

const ProbabilityChart: React.FC<ProbabilityChartProps> = ({ prediction }) => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  const barData = useMemo(() => [{
    type: 'bar',
    x: ['Real News', 'Fake News'],
    y: [
      prediction.probabilities.real * 100,
      prediction.probabilities.fake * 100
    ],
    marker: {
      color: [
        prediction.prediction === 'Real' ? '#10b981' : '#94a3b8',
        prediction.prediction === 'Fake' ? '#ef4444' : '#94a3b8'
      ],
      line: {
        color: '#1e293b',
        width: 2
      }
    },
    text: [
      `${(prediction.probabilities.real * 100).toFixed(2)}%`,
      `${(prediction.probabilities.fake * 100).toFixed(2)}%`
    ],
    textposition: 'outside',
    textfont: {
      size: 16,
      weight: 'bold'
    },
    hovertemplate: '<b>%{x}</b><br>Probability: %{y:.2f}%<extra></extra>',
    hoverlabel: {
      bgcolor: 'white',
      bordercolor: '#ddd',
      font: { size: 14 }
    }
  }], [prediction]);

  const pieData = useMemo(() => [{
    type: 'pie',
    labels: ['Real News', 'Fake News'],
    values: [
      prediction.probabilities.real * 100,
      prediction.probabilities.fake * 100
    ],
    marker: {
      colors: ['#10b981', '#ef4444'],
      line: {
        color: 'white',
        width: 3
      }
    },
    textinfo: 'label+percent',
    textfont: {
      size: 14,
      color: 'white',
      weight: 'bold'
    },
    hovertemplate: '<b>%{label}</b><br>Probability: %{value:.2f}%<br>Percentage: %{percent}<extra></extra>',
    hoverlabel: {
      bgcolor: 'white',
      bordercolor: '#ddd',
      font: { size: 14, color: '#333' }
    },
    pull: prediction.prediction === 'Real' ? [0.1, 0] : [0, 0.1],
    hole: 0.4
  }], [prediction]);

  const barLayout = useMemo(() => ({
    title: {
      text: '<b>Probability Distribution</b>',
      font: { size: 20 }
    },
    xaxis: {
      title: 'Category',
      titlefont: { size: 14 },
      tickfont: { size: 12 }
    },
    yaxis: {
      title: 'Probability (%)',
      titlefont: { size: 14 },
      tickfont: { size: 12 },
      range: [0, 105],
      gridcolor: '#e5e7eb'
    },
    plot_bgcolor: '#f9fafb',
    paper_bgcolor: 'rgba(0,0,0,0)',
    width: 500,
    height: 400,
    margin: { t: 80, r: 40, l: 60, b: 60 },
    showlegend: false
  }), []);

  const pieLayout = useMemo(() => ({
    title: {
      text: '<b>Probability Distribution</b>',
      font: { size: 20 }
    },
    width: 500,
    height: 400,
    margin: { t: 80, r: 40, l: 40, b: 40 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    annotations: [{
      text: `<b>${prediction.prediction}</b>`,
      x: 0.5,
      y: 0.5,
      font: {
        size: 24,
        color: prediction.prediction === 'Real' ? '#10b981' : '#ef4444'
      },
      showarrow: false
    }]
  }), [prediction]);

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'zoom2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d'],
    responsive: true,
    toImageButtonOptions: {
      format: 'png',
      filename: 'probability_distribution',
      height: 600,
      width: 800,
      scale: 2
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Bar Chart
          </button>
          <button
            type="button"
            onClick={() => setChartType('pie')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
              chartType === 'pie'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pie Chart
          </button>
        </div>
      </div>

      <Plot
        data={chartType === 'bar' ? barData as any : pieData as any}
        layout={chartType === 'bar' ? barLayout as any : pieLayout as any}
        config={config}
        className="w-full"
      />

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="font-semibold text-green-800">Real News</p>
          <p className="text-2xl font-bold text-green-600">
            {(prediction.probabilities.real * 100).toFixed(2)}%
          </p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <p className="font-semibold text-red-800">Fake News</p>
          <p className="text-2xl font-bold text-red-600">
            {(prediction.probabilities.fake * 100).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProbabilityChart;
