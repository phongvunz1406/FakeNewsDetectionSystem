import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { PredictionResponse } from '../../types/prediction';

interface ConfidenceGaugeProps {
  prediction: PredictionResponse;
}

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ prediction }) => {
  const gaugeData = useMemo(() => {
    const confidence = prediction.confidence * 100;
    const riskLevel = prediction.trust_indicators.risk_level;

    // Determine color based on risk level
    const getColor = () => {
      if (riskLevel === 'Low Risk') return '#10b981'; // Green
      if (riskLevel === 'Medium Risk') return '#f59e0b'; // Orange
      return '#ef4444'; // Red
    };

    return [{
      type: 'indicator',
      mode: 'gauge+number',
      value: confidence,
      title: {
        text: `<b>Confidence Level</b><br><span style="font-size:0.8em;color:gray">${prediction.prediction} News</span>`,
        font: { size: 20 }
      },
      number: {
        suffix: '%',
        font: { size: 36 },
        valueformat: '.2f'
      },
      gauge: {
        axis: {
          range: [0, 100],
          tickwidth: 2,
          tickcolor: '#666',
          ticksuffix: '%'
        },
        bar: { color: getColor(), thickness: 0.75 },
        bgcolor: 'white',
        borderwidth: 2,
        bordercolor: '#ddd',
        steps: [
          { range: [0, 70], color: '#fee2e2' },
          { range: [70, 85], color: '#fef3c7' },
          { range: [85, 100], color: '#d1fae5' }
        ],
        threshold: {
          line: { color: 'red', width: 4 },
          thickness: 0.75,
          value: 70
        }
      }
    }];
  }, [prediction]);

  const layout = useMemo(() => ({
    width: 500,
    height: 400,
    margin: { t: 100, r: 25, l: 25, b: 50 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Arial, sans-serif' },
    annotations: [{
      text: prediction.trust_indicators.confidence_category,
      x: 0.5,
      y: -0.05,
      xref: 'paper',
      yref: 'paper',
      showarrow: false,
      font: {
        size: 13,
        color: '#666',
        family: 'Arial, sans-serif'
      }
    }]
  }), [prediction]);

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d' as const, 'lasso2d' as const, 'select2d' as const],
    responsive: true,
    toImageButtonOptions: {
      format: 'png' as const,
      filename: 'confidence_gauge',
      height: 600,
      width: 800,
      scale: 2
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <Plot
        data={gaugeData as any}
        layout={layout as any}
        config={config}
        className="w-full"
      />
      <div className="mt-4 text-sm text-gray-600">
        <p className="font-semibold mb-2">Risk Assessment:</p>
        <div className={`inline-block px-3 py-1 rounded-full ${
          prediction.trust_indicators.risk_level === 'Low Risk'
            ? 'bg-green-100 text-green-800'
            : prediction.trust_indicators.risk_level === 'Medium Risk'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {prediction.trust_indicators.risk_level}
        </div>
      </div>
    </div>
  );
};

export default ConfidenceGauge;
