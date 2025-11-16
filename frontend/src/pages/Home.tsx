import React, { useState } from 'react';
import { FormInput, FormTextArea } from "../components/FormField";
import axios from '../services/api';
import type { PredictionResponse } from '../types/prediction';
import ConfidenceGauge from '../components/charts/ConfidenceGauge';
import ProbabilityChart from '../components/charts/ProbabilityChart';

export default function Home() {
  const [formData, setFormData] = useState({
    speaker: '',
    statement: '',
    fullText_based_content: '',
    sources: ''
  });

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await axios.post<PredictionResponse>('/predict', formData);
      setPrediction(response.data);

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error('Prediction error:', err);
      setError(err.response?.data?.detail || 'Failed to analyze the statement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      speaker: '',
      statement: '',
      fullText_based_content: '',
      sources: ''
    });
    setPrediction(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Fake News Detector
          </h1>
          <p className="text-gray-600 text-lg">
            Analyze statements with AI-powered detection and get instant results
          </p>
        </div>

        {/* Form Section */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200 space-y-6">
            <FormInput
              id="speaker"
              label="Speaker's Name"
              value={formData.speaker}
              onChange={handleInputChange}
            />

            <FormInput
              id="statement"
              label="Statement"
              value={formData.statement}
              onChange={handleInputChange}
              required
            />

            <FormTextArea
              id="fullText_based_content"
              label="Full Content (optional)"
              value={formData.fullText_based_content}
              onChange={handleInputChange}
            />

            <FormTextArea
              id="sources"
              label="Sources (separated by semicolons)"
              value={formData.sources}
              onChange={handleInputChange}
            />

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !formData.statement}
                className="flex-1 bg-blue-600 text-white text-xl py-3 rounded-lg hover:bg-blue-700 transition font-semibold cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : 'Analyze Statement'}
              </button>

              {prediction && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 bg-gray-200 text-gray-700 text-xl py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {prediction && (
          <div id="results" className="mt-12 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-200">
              {/* Main Result Header */}
              <div className={`text-center p-8 rounded-xl mb-8 ${
                prediction.prediction === 'Real'
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : 'bg-gradient-to-r from-red-500 to-red-600'
              }`}>
                <h2 className="text-4xl font-bold text-white mb-2">
                  {prediction.prediction === 'Real' ? 'Likely Real News' : 'Likely Fake News'}
                </h2>
                <p className="text-xl text-white opacity-90">
                  Confidence: {(prediction.confidence * 100).toFixed(2)}%
                </p>
              </div>

              {/* Interactive Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ConfidenceGauge prediction={prediction} />
                <ProbabilityChart prediction={prediction} />
              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Trust Indicators */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">Trust Indicators</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800 font-semibold">Risk Level:</span>
                      <span className={`px-3 py-1 rounded-full font-bold ${
                        prediction.trust_indicators.risk_level === 'Low Risk'
                          ? 'bg-green-500 text-white'
                          : prediction.trust_indicators.risk_level === 'Medium Risk'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {prediction.trust_indicators.risk_level}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800 font-semibold">Category:</span>
                      <span className="text-blue-900 font-bold">
                        {prediction.trust_indicators.confidence_category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Source Details */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                  <h3 className="text-xl font-bold text-purple-900 mb-4">Source Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-800 font-semibold">Number of Sources:</span>
                      <span className="text-2xl font-bold text-purple-900">
                        {prediction.details.num_sources}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-800 font-semibold">Official Sources:</span>
                      <span className={`px-3 py-1 rounded-full font-bold ${
                        prediction.details.has_official_source
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-400 text-white'
                      }`}>
                        {prediction.details.has_official_source ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainability Section */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis Details</h3>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Input Completeness</p>
                  <div className="w-full bg-gray-300 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${prediction.explainability.input_completeness}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-sm text-gray-600 mt-1">
                    {prediction.explainability.input_completeness.toFixed(0)}%
                  </p>
                </div>

                {prediction.explainability.key_factors.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Key Factors</p>
                    <ul className="space-y-1">
                      {prediction.explainability.key_factors.map((factor, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-gray-800">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {prediction.explainability.warnings.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Warnings</p>
                    <ul className="space-y-1">
                      {prediction.explainability.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-gray-800">{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-300 flex items-center justify-between text-sm text-gray-600">
                  <span>Speaker Recognized: {prediction.explainability.speaker_recognized ? 'Yes' : 'No'}</span>
                  <span>Analyzed at: {new Date(prediction.metadata.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
