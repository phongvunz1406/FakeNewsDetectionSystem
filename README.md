# Fake News Detection - Machine Learning Project

This project implements machine learning models to detect fake news using the FNID (Fake News Inference Dataset). The analysis includes data processing, exploratory data analysis, feature engineering, and multiple classification and clustering approaches.

## Dataset

**Source**: [FNID - Fake News Inference Dataset](https://ieee-dataport.org/open-access/fnid-fake-news-inference-dataset?check_logged_in=1)

The dataset contains 34,907 news records with the following attributes:

- **id** – Unique identifier for each news record
- **date** – Publication date of the news
- **speaker** – Source or speaker of the statement
- **statement** – The news statement/headline
- **sources** – List of sources cited
- **paragraph_based_content** – Content extracted paragraph-wise
- **fullText_based_content** – Full text content of the news
- **label_fnn** – Fake News Net label (17,324 entries)
- **news_label** – Binary label (0: Real, 1: Fake)
- **label-liar** – LIAR dataset label (17,583 entries)

## Project Structure

```
├── data/
│   └── fake_news_dataset.csv
├── models/
│   ├── random_forest_model.joblib
│   ├── xgboost_model.joblib
│   └── kmeans_model.joblib
├── COS30049_A2.ipynb
└── README.md
```

## Requirements

### Python Libraries

```bash
pandas
numpy
matplotlib
seaborn
scikit-learn
xgboost
joblib
```

Install all dependencies:
```bash
pip install pandas numpy matplotlib seaborn scikit-learn xgboost joblib
```

## Methodology

### 1. Data Processing

- **Data Loading**: Import the fake news dataset
- **Missing Value Analysis**: Identify and handle missing values
- **Data Type Conversion**: Convert date columns and handle complex data structures
- **Source Extraction**: Parse and process URL sources
- **Label Analysis**: Examine distribution of fake vs. real news

### 2. Exploratory Data Analysis (EDA)

The project includes comprehensive visualizations:

- **News Label Distribution**: Bar chart showing balance between fake and real news
- **Speaker Analysis**: Top speakers and their credibility
- **Source Analysis**: Most frequently cited domains

### 3. Feature Engineering

Multiple feature extraction techniques:

- **TF-IDF Vectorization**: Convert text statements into numerical features
  - Max features: 5000
  - N-gram range: (1, 2)
  - Min/max document frequency filtering
  
- **Domain Features**: Extract and encode source domains
- **Temporal Features**: Extract date-based features
- **Speaker Encoding**: Label encoding for speaker information
- **Content-Based Features**: Extract features from paragraph and full-text content

### 4. Dimensionality Reduction

- **PCA (Principal Component Analysis)**:
  - Reduced to 50 components initially
  - Further 2D projection for visualization
  - Explained variance analysis

### 5. Machine Learning Models

#### Classification Models

**Random Forest Classifier**
- Ensemble learning approach
- Handles high-dimensional data effectively
- Feature importance analysis included

**XGBoost Classifier**
- Gradient boosting algorithm
- Optimized for performance
- Robust against overfitting

#### Clustering

**K-Means Clustering**
- Optimal k determination using Elbow Method and Silhouette Score
- Final model with k=2 clusters
- 2D visualization using PCA projection

### 6. Model Evaluation

**Metrics Used**:
- Accuracy Score
- Classification Report (Precision, Recall, F1-Score)
- Confusion Matrix
- Silhouette Score (for clustering)

**Visualizations**:
- Feature importance plots
- Cluster visualizations with centroids
- PCA variance explained plots

## Key Findings

### Data Insights

1. **Dataset Balance**: Analysis of fake vs. real news distribution
2. **Source Reliability**: Identification of frequently cited domains
3. **Speaker Analysis**: Most frequent speakers and their label distribution

### Model Performance

- Both Random Forest and XGBoost models were trained and evaluated
- Classification reports provide detailed performance metrics
- Feature importance helps identify key indicators of fake news
- Clustering reveals natural groupings in the news data

### Feature Importance

The models identify which features (words, sources, speakers) are most predictive of fake news, providing insights into:
- Common phrases in fake news
- Unreliable sources
- Temporal patterns

## Saved Models

All trained models are saved using joblib:

- `models/random_forest_model.joblib` - Random Forest classifier
- `models/xgboost_model.joblib` - XGBoost classifier
- `models/kmeans_model.joblib` - K-Means clustering model

## Usage

### Running the Notebook

1. Ensure all dependencies are installed
2. Place the dataset in the `data/` directory
3. Create a `models/` directory for saving trained models
4. Run the Jupyter notebook cells sequentially

### Loading Saved Models

```python
import joblib

# Load a trained model
rf_model = joblib.load('models/random_forest_model.joblib')
xgb_model = joblib.load('models/xgboost_model.joblib')
kmeans_model = joblib.load('models/kmeans_model.joblib')
```

## Visualizations

The project generates several visualizations within the notebook:

- Confusion matrices for model evaluation
- Feature importance plots for both Random Forest and XGBoost
- K-Means clustering 2D visualization using PCA projection
- Elbow curve for optimal k determination
- Silhouette score analysis across different k values
