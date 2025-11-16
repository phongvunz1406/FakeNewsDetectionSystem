# Machine Learning Models

This directory contains the trained models for the Fake News Detection system.

## Required Models

The following models are required to run the application:

| File | Size | Description |
|------|------|-------------|
| `RF_model.joblib` | 168 MB | Random Forest classifier (primary model) |
| `tfidf_vectorizer.joblib` | 33 KB | TF-IDF text vectorizer |
| `speaker_label_encoder.joblib` | 1.6 KB | Speaker label encoder |

## Optional Models

| File | Size | Description |
|------|------|-------------|
| `XGBoost_model.joblib` | 1.1 MB | XGBoost classifier (alternative) |
| `kmeans_model.joblib` | 112 KB | K-Means clustering model |

## Download Instructions

Due to GitHub file size limitations (100 MB max), large models are not included in this repository.

### Option 1: Train Models Yourself

Follow the instructions in the root README.md:

1. Download the dataset from [IEEE DataPort](https://ieee-dataport.org/open-access/fnid-fake-news-inference-dataset)
2. Run the Jupyter notebook `COS30049_A2.ipynb`
3. Models will be generated in this directory

### Option 2: Download Pre-trained Models

**For AWS Deployment:**
```bash
# Upload to S3 bucket (one-time)
aws s3 cp models/RF_model.joblib s3://your-bucket/models/
aws s3 cp models/tfidf_vectorizer.joblib s3://your-bucket/models/
aws s3 cp models/speaker_label_encoder.joblib s3://your-bucket/models/

# Download when needed
aws s3 sync s3://your-bucket/models/ ./models/
```

**For Google Drive:**
1. Upload models to Google Drive
2. Share with appropriate permissions
3. Download using link

**For Direct Download:**
```bash
# Example: If hosted on your server
wget https://your-server.com/models/RF_model.joblib -O models/RF_model.joblib
wget https://your-server.com/models/tfidf_vectorizer.joblib -O models/tfidf_vectorizer.joblib
wget https://your-server.com/models/speaker_label_encoder.joblib -O models/speaker_label_encoder.joblib
```

## Model Information

### Random Forest Model
- **Algorithm**: RandomForestClassifier
- **Features**: 1003 (1000 TF-IDF + 3 metadata)
- **Training samples**: 27,925
- **Test accuracy**: 77.71%
- **Training notebook**: `COS30049_A2.ipynb`

### TF-IDF Vectorizer
- **Max features**: 1000
- **N-gram range**: (1, 2)
- **Stop words**: English
- **Min document frequency**: 5
- **Max document frequency**: 0.8

### Speaker Label Encoder
- **Top speakers**: 50
- **Other speakers**: Mapped to "other"
- **Encoding**: Integer labels 0-50

## Verify Model Files

After downloading, verify the models are correct:

```python
import joblib
import os

# Check if files exist
required_models = [
    'RF_model.joblib',
    'tfidf_vectorizer.joblib',
    'speaker_label_encoder.joblib'
]

for model in required_models:
    path = f'models/{model}'
    if os.path.exists(path):
        print(f'✓ {model} - {os.path.getsize(path) / (1024*1024):.2f} MB')
        # Try loading
        try:
            joblib.load(path)
            print(f'  └─ Successfully loaded')
        except Exception as e:
            print(f'  └─ Error loading: {e}')
    else:
        print(f'✗ {model} - MISSING')
```

Expected output:
```
✓ RF_model.joblib - 168.00 MB
  └─ Successfully loaded
✓ tfidf_vectorizer.joblib - 0.03 MB
  └─ Successfully loaded
✓ speaker_label_encoder.joblib - 0.00 MB
  └─ Successfully loaded
```
