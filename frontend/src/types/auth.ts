export interface User {
  username: string;
  id: number;
  is_admin?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  is_admin?: boolean;
}

export interface ModelPerformance {
  total_predictions: number;
  prediction_distribution: {
    [key: string]: number;
  };
  avg_confidence: number;
  confidence_distribution: {
    [key: string]: number;
  };
  risk_distribution: {
    [key: string]: number;
  };
  source_metrics: {
    avg_sources: number;
    official_source_count: number;
    avg_completeness: number;
  };
  temporal_data: Array<{
    date: string;
    count: number;
    prediction: string;
  }>;
  recent_predictions: Array<{
    id: number;
    statement: string;
    prediction: string;
    confidence: number;
    timestamp: string;
  }>;
}
