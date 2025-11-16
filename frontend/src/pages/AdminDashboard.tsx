import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import type { ModelPerformance } from '../types/auth';
import type { HistoryResponse } from '../types/prediction';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [performance, setPerformance] = useState<ModelPerformance | null>(null);
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const [perfResponse, historyResponse] = await Promise.all([
        axios.get<ModelPerformance>('/admin/model-performance'),
        axios.get<HistoryResponse>('/history')
      ]);
      setPerformance(perfResponse.data);
      setHistoryData(historyResponse.data);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.response?.data?.detail || 'Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (predictionId: number) => {
    if (!window.confirm(`Are you sure you want to delete prediction #${predictionId}?`)) {
      return;
    }

    try {
      setDeleteLoading(predictionId);
      await axios.delete(`/history/${predictionId}`);
      // Refresh data after deletion
      await fetchData();
    } catch (err: any) {
      console.error('Error deleting prediction:', err);
      alert(err.response?.data?.detail || 'Failed to delete prediction');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading && !performance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !performance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold text-lg mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!performance) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Model performance analytics and data management
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Logged in as: <span className="font-semibold">{user?.username}</span> (Admin)
              </p>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Total Predictions</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {performance.total_predictions}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Avg Confidence</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {(performance.avg_confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Official Sources</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {performance.source_metrics.official_source_count}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Avg Sources</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {performance.source_metrics.avg_sources.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Prediction Distribution</h2>
            <div className="space-y-4">
              {Object.entries(performance.prediction_distribution).map(([label, count]) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-gray-700">{label}</span>
                    <span className="text-gray-600">{count} predictions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        label === 'Real' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${(count / performance.total_predictions) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {((count / performance.total_predictions) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confidence Distribution</h2>
            <div className="space-y-3">
              {Object.entries(performance.confidence_distribution).map(([range, count]) => (
                <div key={range} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{range}</span>
                  <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                    {count} predictions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Risk Level Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(performance.risk_distribution).map(([level, count]) => (
              <div
                key={level}
                className={`p-4 rounded-lg border-2 ${
                  level === 'Low Risk'
                    ? 'border-green-300 bg-green-50'
                    : level === 'Medium Risk'
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-red-300 bg-red-50'
                }`}
              >
                <p className="text-sm font-semibold text-gray-600">{level}</p>
                <p className="text-3xl font-bold mt-2">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Predictions with Delete */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Recent Predictions (Manage Data)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statement</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Prediction</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Confidence</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Timestamp</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {historyData?.data.slice(0, 20).map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">#{record.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 max-w-md truncate">
                      {record.statement}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          record.prediction === 'Real'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {record.prediction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(record.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={deleteLoading === record.id}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleteLoading === record.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Source Metrics */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Source Quality Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600 font-semibold">Average Sources per Prediction</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {performance.source_metrics.avg_sources.toFixed(2)}
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-gray-600 font-semibold">Predictions with Official Sources</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {performance.source_metrics.official_source_count}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {performance.total_predictions > 0
                  ? ((performance.source_metrics.official_source_count / performance.total_predictions) * 100).toFixed(1)
                  : '0'}% of total
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <p className="text-sm text-gray-600 font-semibold">Average Input Completeness</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {performance.source_metrics.avg_completeness.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
