import joblib
import os
import numpy as np
import sqlite3 

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
                has_official_source INTEGER
            )
        """)
        conn.commit()
        conn.close()
        print("SQLite database initialized: test_news.db")

    def _save_to_db(self, statement, fullText, speaker, sources, result):
        """Save prediction result to SQLite database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO predictions
            (statement, fullText_based_content, speaker, sources, prediction, confidence, num_sources, has_official_source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            statement,
            fullText,
            speaker,
            sources,
            result["prediction"],
            result["confidence"],
            result["extracted_features"]["num_sources"],
            int(result["extracted_features"]["has_official_source"])
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
        
        source_list = [s.strip() for s in sources.split(',') if s.strip()]
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

        result = {
            "prediction": "Real" if prediction == 1 else "Fake",
            "confidence": float(max(probabilities)),
            "probabilities": {
                "fake": float(probabilities[0]),
                "real": float(probabilities[1])
            },
            "extracted_features": {
                "num_sources": num_sources,
                "has_official_source": bool(has_official_source),
            }
        }

        #Save result to SQLite
        self._save_to_db(statement, fullText_based_content, speaker, sources, result)

        return result
