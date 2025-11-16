export interface PredictionResponse {
  prediction: 'Real' | 'Fake';
  confidence: number;
  probabilities: {
    fake: number;
    real: number;
  };
  details: {
    num_sources: number;
    has_official_source: boolean;
  };
  trust_indicators: {
    risk_level: 'Low Risk' | 'Medium Risk' | 'High Risk';
    confidence_category: 'Very Confident' | 'Moderately Confident' | 'Low Confidence';
  };
  explainability: {
    key_factors: string[];
    warnings: string[];
    input_completeness: number;
    speaker_recognized: boolean;
  };
  metadata: {
    timestamp: string;
  };
}

export interface HistoryRecord {
  id: number;
  statement: string;
  fullText_based_content: string;
  speaker: string;
  sources: string;
  prediction: string;
  confidence: number;
  num_sources: number;
  has_official_source: boolean;
  risk_level: string;
  timestamp: string;
  input_completeness: number;
}

export interface HistoryResponse {
  total_records: number;
  data: HistoryRecord[];
}
