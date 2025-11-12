import joblib
import os
import numpy as np
import sqlite3
from datetime import datetime 

class Predictor():
    def __init__(self):
        model_path = 'models/RF_model.joblib'
        word_vector_path = 'models/tfidf_vectorizer.joblib'
        speaker_le_path = 'models/speaker_label_encoder.joblib'

        for path in [model_path, word_vector_path, speaker_le_path]:
            if not os.path.exists(path):
                raise FileNotFoundError(f'Required file not found: {path}')
        
        try: 
            # Load Random Forest model
            self.model = joblib.load(model_path)
            print('Successfully loaded Random Forest model')

            # Load speaker label encoder
            self.speaker_le = joblib.load(speaker_le_path)
            print('Successfully loaded speaker label encoder')

            # Load word vector 
            self.word_vector = joblib.load(word_vector_path)
            print('Successfully loaded Word Vector')

            #Initialize SQLite database
            self._init_db()

        except Exception as e:
            print(f'Error loading model file {e}')
            raise

    def _init_db(self):
        """Initialize SQLite database and table if not exist."""
        self.db_path = "prediction.db"
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                statement TEXT,
                fullText_based_content TEXT,
                speaker TEXT,
                sources TEXT,
                prediction TEXT,
                confidence REAL,
                num_sources INTEGER,
                has_official_source INTEGER,
                risk_level TEXT,
                timestamp TEXT,
                input_completeness REAL
            )
        """)
        conn.commit()
        conn.close()
        print("SQLite database initialized: prediction.db")

    def _save_to_db(self, statement, fullText, speaker, sources, result):
        """Save prediction result to SQLite database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO predictions
            (statement, fullText_based_content, speaker, sources, prediction, confidence, num_sources, has_official_source, risk_level, timestamp, input_completeness)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            statement,
            fullText,
            speaker,
            sources,
            result["prediction"],
            result["confidence"],
            result["extracted_features"]["num_sources"],
            int(result["extracted_features"]["has_official_source"]),
            result["trust_indicators"]["risk_level"],
            result["metadata"]["timestamp"],
            result["explainability"]["input_completeness"]
        ))
        conn.commit()
        conn.close()
        print("Prediction saved to SQLite database ")

    def _process_speaker(self, speaker: str) -> int:
        speaker = speaker.lower().strip()
        if speaker not in self.speaker_le.classes_:
            speaker = 'other'
        speaker_encoded = self.speaker_le.transform([speaker])[0]
        return speaker_encoded
    
    def _process_sources(self, sources: str) -> tuple:
        if not sources or sources.strip() == '':
            return 0, 0
        
        source_list = [s.strip() for s in sources.split(';') if s.strip()]
        num_sources = len(source_list)

        has_official_source = 0
        for source in source_list:
            if any(p in source.lower() for p in ['.gov', '.org', '.edu']):
                has_official_source = 1
                break
        return num_sources, has_official_source
    
    def _process_text(self, statement: str, fullText_based_context: str) -> np.ndarray:
        combined_text = f'{statement} {fullText_based_context}'.strip()
        text_features = self.word_vector.transform([combined_text])
        return text_features.toarray()
    
    def _prepare_features(self, statement: str, fullText_based_content: str,
                          speaker: str, sources: str):
        speaker_encoded = self._process_speaker(speaker)
        num_sources, has_official_source = self._process_sources(sources)
        text_features = self._process_text(statement, fullText_based_content)
        numeric_features = np.array([[speaker_encoded, num_sources, has_official_source]])
        combined_features = np.hstack((numeric_features, text_features))
        return combined_features, num_sources, has_official_source

    def _calculate_trust_indicators(self, confidence: float) -> dict:
        """Calculate risk level and confidence category based on confidence score."""
        if confidence >= 0.85:
            risk_level = "Low Risk"
            confidence_category = "Very Confident"
        elif confidence >= 0.70:
            risk_level = "Medium Risk"
            confidence_category = "Moderately Confident"
        else:
            risk_level = "High Risk"
            confidence_category = "Low Confidence"

        return {
            "risk_level": risk_level,
            "confidence_category": confidence_category
        }

    def _calculate_explainability(self, statement: str, fullText: str, speaker: str,
                                   sources: str, num_sources: int, has_official_source: bool) -> dict:
        """Generate explainability information about the prediction."""
        key_factors = []
        warnings = []

        # Check input completeness
        fields_provided = 0
        total_fields = 4

        if statement and statement.strip():
            fields_provided += 1
        else:
            warnings.append("No statement provided")

        if fullText and fullText.strip():
            fields_provided += 1
        else:
            warnings.append("No full text context provided")

        if speaker and speaker.strip():
            fields_provided += 1
            # Check if speaker was recognized
            speaker_lower = speaker.lower().strip()
            if speaker_lower in self.speaker_le.classes_:
                key_factors.append(f"Speaker '{speaker}' recognized in training data")
                speaker_recognized = True
            else:
                key_factors.append("Speaker not in training data (mapped to 'other')")
                warnings.append("Unknown speaker - prediction may be less accurate")
                speaker_recognized = False
        else:
            warnings.append("No speaker information provided")
            speaker_recognized = False

        if sources and sources.strip():
            fields_provided += 1
            if has_official_source:
                key_factors.append(f"Contains {num_sources} source(s) including official sources (.gov/.org/.edu)")
            else:
                key_factors.append(f"Contains {num_sources} source(s) but no official sources detected")
                warnings.append("No official sources detected - verify credibility")
        else:
            warnings.append("No sources provided")
            key_factors.append("No sources provided - prediction based on text only")

        input_completeness = (fields_provided / total_fields) * 100

        return {
            "key_factors": key_factors,
            "warnings": warnings,
            "input_completeness": round(input_completeness, 2),
            "speaker_recognized": speaker_recognized
        }

    def predict(self, statement: str, fullText_based_content: str = "",
                speaker: str = "", sources: str = "") -> dict:
        if not statement and not fullText_based_content:
            raise ValueError("Either 'statement' or 'fullText_based_content' must be provided.")

        features, num_sources, has_official_source = self._prepare_features(
            statement=statement or "",
            fullText_based_content=fullText_based_content or "",
            speaker=speaker or "",
            sources=sources or ""
        )

        prediction = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]
        confidence = float(max(probabilities))

        # Calculate trust indicators
        trust_indicators = self._calculate_trust_indicators(confidence)

        # Calculate explainability features
        explainability = self._calculate_explainability(
            statement=statement or "",
            fullText=fullText_based_content or "",
            speaker=speaker or "",
            sources=sources or "",
            num_sources=num_sources,
            has_official_source=has_official_source
        )

        result = {
            "prediction": "Real" if prediction == 1 else "Fake",
            "confidence": confidence,
            "probabilities": {
                "fake": float(probabilities[0]),
                "real": float(probabilities[1])
            },
            "extracted_features": {
                "num_sources": num_sources,
                "has_official_source": bool(has_official_source),
            },
            "trust_indicators": {
                "risk_level": trust_indicators["risk_level"],
                "confidence_category": trust_indicators["confidence_category"]
            },
            "explainability": {
                "key_factors": explainability["key_factors"],
                "warnings": explainability["warnings"],
                "input_completeness": explainability["input_completeness"],
                "speaker_recognized": explainability["speaker_recognized"]
            },
            "metadata": {
                "timestamp": datetime.now().isoformat()
            }
        }

        #Save result to SQLite
        self._save_to_db(statement, fullText_based_content, speaker, sources, result)

        return result