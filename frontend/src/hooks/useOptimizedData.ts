import { useMemo } from 'react';
import type { HistoryRecord } from '../types/prediction';

export interface ProcessedData {
  totalRecords: number;
  realCount: number;
  fakeCount: number;
  avgConfidence: number;
  highConfidenceCount: number;
  withOfficialSourceCount: number;
  avgInputCompleteness: number;
  riskDistribution: {
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
  };
  timeSeriesData: {
    timestamps: string[];
    confidences: number[];
    predictions: string[];
  };
}

/**
 * Custom hook to optimize data processing for large datasets
 * Uses memoization to avoid unnecessary recalculations
 */
export const useOptimizedData = (history: HistoryRecord[]): ProcessedData => {
  return useMemo(() => {
    const totalRecords = history.length;

    if (totalRecords === 0) {
      return {
        totalRecords: 0,
        realCount: 0,
        fakeCount: 0,
        avgConfidence: 0,
        highConfidenceCount: 0,
        withOfficialSourceCount: 0,
        avgInputCompleteness: 0,
        riskDistribution: {
          lowRisk: 0,
          mediumRisk: 0,
          highRisk: 0,
        },
        timeSeriesData: {
          timestamps: [],
          confidences: [],
          predictions: [],
        },
      };
    }

    // Single pass through the data to calculate all metrics
    let realCount = 0;
    let fakeCount = 0;
    let confidenceSum = 0;
    let highConfidenceCount = 0;
    let withOfficialSourceCount = 0;
    let inputCompletenessSum = 0;
    let lowRisk = 0;
    let mediumRisk = 0;
    let highRisk = 0;

    const timestamps: string[] = [];
    const confidences: number[] = [];
    const predictions: string[] = [];

    for (const record of history) {
      // Count predictions
      if (record.prediction === 'Real') {
        realCount++;
      } else {
        fakeCount++;
      }

      // Sum for averages
      confidenceSum += record.confidence;
      inputCompletenessSum += record.input_completeness;

      // Count high confidence
      if (record.confidence >= 0.85) {
        highConfidenceCount++;
      }

      // Count official sources
      if (record.has_official_source) {
        withOfficialSourceCount++;
      }

      // Risk distribution
      if (record.risk_level === 'Low Risk') {
        lowRisk++;
      } else if (record.risk_level === 'Medium Risk') {
        mediumRisk++;
      } else if (record.risk_level === 'High Risk') {
        highRisk++;
      }

      // Time series data
      timestamps.push(record.timestamp);
      confidences.push(record.confidence);
      predictions.push(record.prediction);
    }

    return {
      totalRecords,
      realCount,
      fakeCount,
      avgConfidence: confidenceSum / totalRecords,
      highConfidenceCount,
      withOfficialSourceCount,
      avgInputCompleteness: inputCompletenessSum / totalRecords,
      riskDistribution: {
        lowRisk,
        mediumRisk,
        highRisk,
      },
      timeSeriesData: {
        timestamps,
        confidences,
        predictions,
      },
    };
  }, [history]);
};

/**
 * Custom hook to paginate large datasets
 */
export const usePaginatedData = <T,>(
  data: T[],
  pageSize: number = 100
): {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
} => {
  const [currentPage, setCurrentPage] = useMemo(() => [0, () => 0] as const, []);

  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);

  const goToPage = (page: number) => {
    const newPage = Math.max(0, Math.min(page, totalPages - 1));
    setCurrentPage(newPage);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
  };
};
