import joblib
import os
import numpy as np

class Predictor():
    def __init__(self):
        model_path = 'models/RF_model.joblib'
        word_vector_path = 'models/tfidf_vectorizer.joblib'
        speaker_le_path = 'models/speaker_label_encoder.joblib'

        for path in [model_path, word_vector_path, speaker_le_path]:
            if not os.path.exists(path):
                raise FileNotFoundError(f'Required file not found: {path}')
        
        try: 
            #Load Radom Forest model
            self.model = joblib.load(model_path)
            print('Successfully loaded Random Forest model')

            #Load Radom Forest model
            self.speaker_le = joblib.load(speaker_le_path)
            print('Successfully loaded speaker label encoder')

            #Load word vector 
            self.word_vector = joblib.load(word_vector_path)
            print('Successfully loaded Word Vector')
        
        except Exception as e:
            print(f'Error loading model file {e}')
            raise

    def _process_speaker(self,speaker:str) -> int:
        """
        Process and encode the speaker name into a numeric label.

        Steps:
            1. Convert the input speaker string to lowercase and strip extra spaces.
            2. If the speaker is not in the known label encoder classes,
            replace it with 'other' (used for less frequent speakers).
            3. Transform the speaker name using the pre-trained LabelEncoder.

        Args:
            speaker (str): Raw speaker name from the user input.

        Returns:
            int: Encoded numeric label representing the speaker.
        """
        speaker = speaker.lower().strip()
        if speaker not in self.speaker_le.classes_:
            speaker = 'other'
        speaker_encoded = self.speaker_le.transform([speaker])[0]
        return speaker_encoded
    
    def _process_sources(self, sources:str) -> tuple:
        """
        Process raw sources string into features
        
        Args:
            sources: Raw sources string (comma-separated URLs or text)
        
        Returns:
            tuple: (num_sources, has_official_source)
        """
        if not sources or sources.strip() == '':
            return 0, 0
        
        # Split by comma and count non-empty sources
        source_list = [s.strip() for s in sources.split(',') if s.strip()]
        num_sources  = len(source_list)

        # Check for official sources (.gov, .org, .edu)
        has_official_source =  0
        official_patterns = ['.gov','.org','.edu']
        for source in source_list:
            source_lower = source.lower()
            if any(pattern in source_lower for pattern in official_patterns):
                has_official_source = 1
                break
        return num_sources, has_official_source
    
    def _process_text(self, statement:str, fullText_based_context:str) -> np.ndarray:
        """
        Combine the statement and contextual text, then convert the combined text into a numerical feature vector.

        Args:
            statement (str): The main statement or text input.
            fullText_based_context (str): Additional context related to the statement.

        Returns:
            np.ndarray: A NumPy array representing the text features extracted using the word vectorizer.
        """
        combined_text = f'{statement} {fullText_based_context}'.strip()
        text_features = self.word_vector.transform([combined_text])
        text_features_array = text_features.toarray()
        return text_features_array
    
    def _prepare_features(self, statement: str, fullText_based_content: str, 
                          speaker: str, sources: str):
        """
        Prepare all numerical and text-based features for model input.

        Combines:
            - Text vectorization (TF-IDF)
            - Speaker label encoding
            - Source feature extraction (num_sources, has_official_source)

        Args:
            statement (str): Main claim or headline.
            fullText_based_content (str): Additional context or full article text.
            speaker (str): Name of the speaker or organization.
            sources (str): Comma-separated list of sources.

        Returns:
            tuple:
                np.ndarray: Combined feature vector ready for model input.
                int: Number of sources.
                int: Indicator (1/0) for whether an official source is present.
        """
        #Process speaker
        speaker_encoded = self._process_speaker(speaker)

        #Process sources
        num_sources, has_official_source = self._process_sources(sources)

        #Process text (TF-IDF features)
        text_features = self._process_text(statement, fullText_based_content)

        #Combine all features in training order
        numeric_features = np.array([[speaker_encoded, num_sources, has_official_source]])
        combined_features = np.hstack((numeric_features, text_features))
        return combined_features, num_sources, has_official_source

    
    def predict(self, statement: str, fullText_based_content: str = "", 
                speaker: str = "", sources: str = "") -> dict:
        """
        Make a prediction on a single news article using raw user input.

        This method processes all inputs (statement, context, speaker, sources),
        generates numerical and text features, and returns the modelâ€™s prediction
        along with probabilities and transparency info.

        Args:
            statement (str): The main claim or headline of the article.
            fullText_based_content (str): Full text or supporting context (optional).
            speaker (str): Name of the speaker or organization (optional).
            sources (str): Comma-separated list of sources (optional).

        Returns:
            dict: A dictionary containing:
                - prediction (str): "Fake" or "Real"
                - confidence (float): Confidence score of the prediction
                - probabilities (dict): {"real": ..., "fake": ...}
                - extracted_features (dict): Information about processed inputs
        """
        #Validate required inputs
        if not statement and not fullText_based_content:
            raise ValueError("Either 'statement' or 'fullText_based_content' must be provided.")

        #Prepare model input features
        features, num_sources, has_official_source = self._prepare_features(
            statement=statement or "",
            fullText_based_content=fullText_based_content or "",
            speaker=speaker or "",
            sources=sources or ""
        )

        #Generate predictions
        prediction = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]

        #Format output
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

        return result

