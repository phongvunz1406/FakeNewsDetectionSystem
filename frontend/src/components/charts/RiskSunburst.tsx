import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { HistoryRecord } from '../../types/prediction';

interface RiskSunburstProps {
  history: HistoryRecord[];
}

const RiskSunburst: React.FC<RiskSunburstProps> = ({ history }) => {
  const sunburstData = useMemo(() => {
    // Count predictions by category
    const realLowRisk = history.filter(r => r.prediction === 'Real' && r.risk_level === 'Low Risk').length;
    const realMediumRisk = history.filter(r => r.prediction === 'Real' && r.risk_level === 'Medium Risk').length;
    const realHighRisk = history.filter(r => r.prediction === 'Real' && r.risk_level === 'High Risk').length;

    const fakeLowRisk = history.filter(r => r.prediction === 'Fake' && r.risk_level === 'Low Risk').length;
    const fakeMediumRisk = history.filter(r => r.prediction === 'Fake' && r.risk_level === 'Medium Risk').length;
    const fakeHighRisk = history.filter(r => r.prediction === 'Fake' && r.risk_level === 'High Risk').length;

    const totalReal = realLowRisk + realMediumRisk + realHighRisk;
    const totalFake = fakeLowRisk + fakeMediumRisk + fakeHighRisk;
    const total = totalReal + totalFake;

    // Also categorize by source quality
    const withOfficialSource = history.filter(r => r.has_official_source).length;
    const withoutOfficialSource = history.filter(r => !r.has_official_source).length;

    const labels = [
      'All Predictions',
      'Real News', 'Fake News',
      'Real - Low Risk', 'Real - Medium Risk', 'Real - High Risk',
      'Fake - Low Risk', 'Fake - Medium Risk', 'Fake - High Risk',
      'With Official Sources', 'Without Official Sources'
    ];

    const parents = [
      '',
      'All Predictions', 'All Predictions',
      'Real News', 'Real News', 'Real News',
      'Fake News', 'Fake News', 'Fake News',
      'All Predictions', 'All Predictions'
    ];

    const values = [
      total,
      totalReal, totalFake,
      realLowRisk, realMediumRisk, realHighRisk,
      fakeLowRisk, fakeMediumRisk, fakeHighRisk,
      withOfficialSource, withoutOfficialSource
    ];

    const colors = [
      '#64748b', // All (gray)
      '#10b981', '#ef4444', // Real (green), Fake (red)
      '#059669', '#f59e0b', '#dc2626', // Real risks (green shades)
      '#dc2626', '#f59e0b', '#059669', // Fake risks (red shades)
      '#3b82f6', '#94a3b8' // Sources (blue, light gray)
    ];

    return [{
      type: 'sunburst',
      labels,
      parents,
      values,
      marker: {
        colors,
        line: {
          color: 'white',
          width: 3
        }
      },
      text: values.map((v, i) => {
        const percentage = total > 0 ? ((v / total) * 100).toFixed(1) : '0';
        return `${v} (${percentage}%)`;
      }),
      hovertemplate: '<b>%{label}</b><br>' +
        'Count: %{value}<br>' +
        'Percentage: %{percentParent}<br>' +
        '<extra></extra>',
      hoverlabel: {
        bgcolor: 'white',
        bordercolor: '#ddd',
        font: { size: 14, color: '#333' }
      },
      textfont: {
        size: 14,
        color: 'white',
        weight: 'bold'
      },
      branchvalues: 'total',
      insidetextorientation: 'radial'
    }];
  }, [history]);

  const layout = useMemo(() => ({
    title: {
      text: '<b>Risk Distribution Hierarchy</b>',
      font: { size: 20 }
    },
    width: 600,
    height: 600,
    margin: { t: 80, r: 0, l: 0, b: 0 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    sunburstcolorway: ['#64748b', '#10b981', '#ef4444']
  }), []);

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'zoom2d'],
    responsive: true,
    toImageButtonOptions: {
      format: 'png',
      filename: 'risk_distribution',
      height: 800,
      width: 800,
      scale: 2
    }
  };

  const stats = useMemo(() => {
    const lowRisk = history.filter(r => r.risk_level === 'Low Risk').length;
    const mediumRisk = history.filter(r => r.risk_level === 'Medium Risk').length;
    const highRisk = history.filter(r => r.risk_level === 'High Risk').length;
    const total = history.length;

    return {
      lowRisk,
      mediumRisk,
      highRisk,
      total,
      lowRiskPct: total > 0 ? (lowRisk / total * 100).toFixed(1) : '0',
      mediumRiskPct: total > 0 ? (mediumRisk / total * 100).toFixed(1) : '0',
      highRiskPct: total > 0 ? (highRisk / total * 100).toFixed(1) : '0'
    };
  }, [history]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <Plot
        data={sunburstData as any}
        layout={layout as any}
        config={config}
        className="w-full"
      />

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Risk Level Distribution</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Low Risk</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{stats.lowRisk} predictions</span>
              <span className="text-sm font-bold text-green-600">{stats.lowRiskPct}%</span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.lowRiskPct}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Medium Risk</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{stats.mediumRisk} predictions</span>
              <span className="text-sm font-bold text-yellow-600">{stats.mediumRiskPct}%</span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.mediumRiskPct}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">High Risk</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{stats.highRisk} predictions</span>
              <span className="text-sm font-bold text-red-600">{stats.highRiskPct}%</span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.highRiskPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Interactive Tips:</span> Click on any segment to zoom in and explore the hierarchy.
          Click the center to zoom back out.
        </p>
      </div>
    </div>
  );
};

export default RiskSunburst;
