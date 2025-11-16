import React, { useState, useEffect, useCallback } from 'react';
import axios from '../services/api';
import type { HistoryResponse } from '../types/prediction';
import OptimizedTimeline from './charts/OptimizedTimeline';
import RiskSunburst from './charts/RiskSunburst';
import TemporalHeatmap from './charts/TemporalHeatmap';
import { useOptimizedData } from '../hooks/useOptimizedData';

interface DashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

const Dashboard: React.FC<DashboardProps> = ({
  autoRefresh = false,
  refreshInterval = 5000
}) => {
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(autoRefresh);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get<HistoryResponse>('/history');
      setHistoryData(response.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error fetching history:', err);
      setError(err.response?.data?.detail || 'Failed to load prediction history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    let intervalId: number | null = null;

    if (isAutoRefreshEnabled && refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchHistory();
      }, refreshInterval) as unknown as number;
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAutoRefreshEnabled, refreshInterval, fetchHistory]);

  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(prev => !prev);
  };

  // Use optimized data processing for performance
  const optimizedData = useOptimizedData(historyData?.data || []);

  if (loading && !historyData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !historyData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold text-lg mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!historyData || historyData.total_records === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md text-center">
          <h3 className="text-yellow-800 font-semibold text-xl mb-2">No Data Available</h3>
          <p className="text-yellow-700 mb-4">
            No predictions have been made yet. Make your first prediction to see analytics here!
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Make a Prediction
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600">
                Real-time insights and comprehensive analysis of fake news predictions
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right text-sm text-gray-600">
                <p className="font-semibold">Last Updated</p>
                <p>{lastUpdated.toLocaleTimeString()}</p>
              </div>

              <button
                onClick={toggleAutoRefresh}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isAutoRefreshEnabled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isAutoRefreshEnabled ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
              </button>

              <button
                onClick={fetchHistory}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Refreshing...' : 'Refresh Now'}
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Total Predictions</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {optimizedData.totalRecords}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Real News</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {optimizedData.realCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Fake News</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {optimizedData.fakeCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Avg Confidence</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {(optimizedData.avgConfidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="space-y-8">
          {/* Timeline - Full Width */}
          <div className="w-full">
            <OptimizedTimeline
              history={historyData.data}
              onRefresh={fetchHistory}
              maxDataPoints={1000}
            />
          </div>

          {/* Risk Sunburst and Heatmap - Side by Side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <RiskSunburst history={historyData.data} />
            <TemporalHeatmap history={historyData.data} />
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-600 font-semibold">Predictions with Official Sources</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {optimizedData.withOfficialSourceCount}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {optimizedData.totalRecords > 0 ? ((optimizedData.withOfficialSourceCount / optimizedData.totalRecords) * 100).toFixed(1) : '0'}% of total
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-gray-600 font-semibold">High Confidence Predictions</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {optimizedData.highConfidenceCount}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Confidence ≥ 85%
                </p>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <p className="text-sm text-gray-600 font-semibold">Avg Input Completeness</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {optimizedData.avgInputCompleteness.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Data quality indicator
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Dashboard updates {isAutoRefreshEnabled ? `automatically every ${refreshInterval / 1000} seconds` : 'manually'}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
