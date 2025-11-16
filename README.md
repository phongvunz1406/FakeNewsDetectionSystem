# Fake News Detection System

A full-stack machine learning application for detecting fake news using Natural Language Processing and ensemble learning methods. The system features a FastAPI backend with Random Forest classification, user authentication, and a modern React frontend with interactive visualizations.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Dataset](#dataset)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Model Training](#model-training)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Features](#features)
- [Model Performance](#model-performance)
- [Project Architecture](#project-architecture)

## Overview

This project implements a comprehensive fake news detection system that:
- Analyzes news statements using machine learning
- Provides confidence scores and risk assessments
- Tracks prediction history in SQLite database
- Supports user authentication with JWT tokens
- Offers admin dashboard for performance analytics
- Visualizes predictions with interactive charts

## Project Structure

```
assignment2/
├── backend/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application & routes
│   ├── auth.py                 # Authentication & JWT handling
│   ├── predictor.py            # ML model prediction logic
│   └── schemas.py              # Pydantic data models
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/         # Plotly visualization components
│   │   │   ├── AdminRoute.tsx  # Admin-only route protection
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── Dashboard.tsx   # User dashboard
│   │   │   └── FormField.tsx   # Reusable form component
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # Authentication state management
│   │   ├── pages/
│   │   │   ├── Home.tsx        # Landing page
│   │   │   ├── Analyze.tsx     # News analysis interface
│   │   │   ├── Login.tsx       # User login
│   │   │   ├── Register.tsx    # User registration
│   │   │   └── AdminDashboard.tsx # Admin analytics
│   │   ├── services/
│   │   │   └── api.ts          # Axios API client
│   │   ├── App.tsx
│   │   ├── AppRouter.tsx       # React Router configuration
│   │   └── main.tsx
│   └── package.json
├── models/
│   ├── RF_model.joblib         # Random Forest classifier
│   ├── tfidf_vectorizer.joblib # TF-IDF text vectorizer
│   └── speaker_label_encoder.joblib # Speaker encoder
├── data/
│   ├── fake_news_dataset.csv   # Original dataset
│   ├── cleaned_dataset.csv     # Processed data
│   ├── X_train.csv            # Training features
│   ├── X_val.csv              # Validation features
│   ├── X_test.csv             # Test features
│   ├── y_train.csv            # Training labels
│   ├── y_val.csv              # Validation labels
│   └── y_test.csv             # Test labels
├── COS30049_A2.ipynb          # Model training notebook
├── prediction.db              # SQLite database
├── requirements.txt           # Python dependencies
└── README.md
```

## Dataset

**Source**: [FNID - Fake News Inference Dataset](https://ieee-dataport.org/open-access/fnid-fake-news-inference-dataset)

The dataset contains **34,907 news records** with the following attributes:

| Attribute | Description |
|-----------|-------------|
| `id` | Unique identifier for each news record |
| `date` | Publication timestamp |
| `speaker` | Person or organization making the statement |
| `statement` | News headline/claim |
| `sources` | List of cited sources (URLs) |
| `paragraph_based_content` | Content extracted paragraph-wise |
| `fullText_based_content` | Complete article text |
| `label_fnn` | Fake News Net label |
| `news_label` | Binary label (0: Fake, 1: Real) |
| `label-liar` | LIAR dataset label |

## Technology Stack

### Backend
- **FastAPI** - High-performance web framework
- **Python 3.12** - Core language
- **scikit-learn** - Machine learning models
- **SQLite** - Database for predictions and users
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **Pydantic** - Data validation

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **React Router 7** - Navigation
- **Axios** - HTTP client
- **Plotly.js** - Interactive visualizations
- **Vite** - Build tool

### Machine Learning
- **Random Forest** - Primary classifier (77.71% accuracy)
- **XGBoost** - Alternative classifier (74.51% accuracy)
- **TF-IDF** - Text feature extraction
- **K-Means** - Unsupervised clustering analysis

## Installation

### Prerequisites

- Python 3.12+
- Node.js 18+
- npm or yarn
- Git

### Clone Repository

```bash
git clone <repository-url>
cd assignment2
```

## Model Training

### Step 1: Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Additional ML dependencies for training (optional):**

```bash
pip install pandas matplotlib seaborn xgboost jupyter
```

**Note**: The notebook uses these libraries for model training and visualization. They are not required for running the deployed application.

### Step 2: Prepare Dataset

1. Download the dataset from [IEEE DataPort](https://ieee-dataport.org/open-access/fnid-fake-news-inference-dataset)
2. Place `fake_news_dataset.csv` in the `data/` directory

### Step 3: Run Jupyter Notebook

```bash
jupyter notebook COS30049_A2.ipynb
```

**Training Pipeline:**

The notebook executes the following steps:

#### 1. Data Processing
- Load raw dataset (34,907 records)
- Drop redundant columns (`id`, `date`, `paragraph_based_content`, `label_fnn`, `label-liar`)
- Clean and normalize speaker names
- Group top 50 speakers, label others as "other"
- Parse source URLs from string format
- Extract domain names from sources
- Create feature: `num_sources` (count of citations)
- Create feature: `has_official_source` (1 if .gov/.org/.edu present)

#### 2. Feature Engineering
- **Text Features**: TF-IDF vectorization
  - Combine `statement` + `fullText_based_content`
  - Max features: 1000
  - N-grams: (1, 2) - unigrams and bigrams
  - Min document frequency: 5
  - Max document frequency: 0.8
  - Stop words: English
- **Numerical Features**:
  - `speaker_grouped` (Label encoded)
  - `num_sources` (Integer count)
  - `has_official_source` (Binary 0/1)
- **Final feature space**: 1003 features

#### 3. Data Splitting
- Training set: 80% (27,925 samples)
- Validation set: 10% (3,491 samples)
- Test set: 10% (3,491 samples)
- Stratified split to maintain label distribution

#### 4. Model Training

**Random Forest Classifier:**
```python
RandomForestClassifier(
    n_estimators=300,
    random_state=42
)
```

**Performance:**
- Test Accuracy: **77.71%**
- Precision (Fake): 0.79
- Precision (Real): 0.75
- Recall (Fake): 0.84
- Recall (Real): 0.69
- F1-Score: 0.78 (weighted avg)

**XGBoost Classifier:**
```python
XGBClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=6,
    objective='binary:logistic'
)
```

**Performance:**
- Test Accuracy: **74.51%**
- F1-Score: 0.74 (weighted avg)

#### 5. Unsupervised Learning

**K-Means Clustering:**
- Applied PCA reduction to 100 components
- Tested k=2 to k=10
- Optimal k=2 (highest silhouette score: 0.6396)
- Used for exploratory analysis of news patterns

### Step 4: Verify Saved Models

After training, verify these files exist in `models/`:

```bash
ls models/
# Expected output:
# RF_model.joblib
# tfidf_vectorizer.joblib
# speaker_label_encoder.joblib
```

## Backend Setup

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables

Create `backend/.env`:

```env
# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DB_PATH=prediction.db

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000
```

**Generate a secure SECRET_KEY:**

```python
import secrets
print(secrets.token_urlsafe(32))
```

### Step 3: Initialize Database

The database is automatically initialized on first run. It creates three tables:

- `users` - User accounts and authentication
- `user_sessions` - Active JWT tokens
- `predictions` - Prediction history

### Step 4: Start Backend Server

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server runs at: `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## Frontend Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Configure Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

### Step 3: Start Development Server

```bash
npm run dev
```

Application runs at: `http://localhost:5173`

### Step 4: Build for Production

```bash
npm run build
npm run preview
```

## Usage

### 1. User Registration

Navigate to `/register` and create an account:
- Username: 3-50 characters
- Password: 6-72 characters

### 2. Login

Navigate to `/login` and authenticate:
- Receives JWT token (30-minute expiry)
- Token stored in AuthContext

### 3. Analyze News

On `/analyze` page, input news details:

**Required:**
- Statement (headline or claim)

**Optional (improves accuracy):**
- Full text content
- Speaker name
- Sources (semicolon-separated URLs)

**Example Input:**

```
Statement: Scientists discover cure for common cold

Full Text: A breakthrough study published today claims...

Speaker: John Smith

Sources: https://example.org/study;https://news.gov/health
```

### 4. View Results

The system returns:

- **Prediction**: "Real" or "Fake"
- **Confidence**: 0-100% probability
- **Risk Level**: Low/Medium/High risk assessment
- **Key Factors**: Explanation of decision
- **Warnings**: Missing information alerts
- **Interactive Charts**: Probability distribution, confidence gauge

### 5. Admin Dashboard

Admin users can access `/admin` to view:

- Total predictions count
- Prediction distribution (Fake vs Real)
- Average confidence score
- Confidence distribution histogram
- Risk level breakdown
- Source quality metrics
- Temporal trends (30-day timeline)
- Recent predictions table

**Create Admin User:**

Manually update database:
```sql
UPDATE users SET is_admin = 1 WHERE username = 'your_username';
```

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /register
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response: 200 OK
{
  "message": "User created successfully",
  "username": "string"
}
```

#### Login
```http
POST /login
Content-Type: application/x-www-form-urlencoded

username=string&password=string

Response: 200 OK
{
  "access_token": "string",
  "token_type": "bearer",
  "is_admin": false
}
```

#### Logout
```http
POST /logout
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Successfully logged out"
}
```

#### Get Current User
```http
GET /me
Authorization: Bearer <token>

Response: 200 OK
{
  "username": "string",
  "id": 1,
  "is_active": true,
  "is_admin": false,
  "created_at": "2025-01-16T10:30:00"
}
```

### Prediction Endpoints

#### Make Prediction
```http
POST /predict
Content-Type: application/json

{
  "statement": "string",
  "fullText_based_content": "string",
  "speaker": "string",
  "sources": "url1;url2;url3"
}

Response: 200 OK
{
  "prediction": "Real",
  "confidence": 0.85,
  "probabilities": {
    "fake": 0.15,
    "real": 0.85
  },
  "details": {
    "num_sources": 2,
    "has_official_source": true
  },
  "trust_indicators": {
    "risk_level": "Low Risk",
    "confidence_category": "Very Confident"
  },
  "explainability": {
    "key_factors": ["array of strings"],
    "warnings": ["array of warnings"],
    "input_completeness": 100.0,
    "speaker_recognized": true
  },
  "metadata": {
    "timestamp": "2025-01-16T10:30:00"
  }
}
```

#### Get Prediction History
```http
GET /history

Response: 200 OK
{
  "total_records": 100,
  "data": [
    {
      "id": 1,
      "statement": "string",
      "fullText_based_content": "string",
      "speaker": "string",
      "sources": "string",
      "prediction": "Real",
      "confidence": 0.85,
      "num_sources": 2,
      "has_official_source": true,
      "risk_level": "Low Risk",
      "timestamp": "2025-01-16T10:30:00",
      "input_completeness": 100.0
    }
  ]
}
```

#### Delete Prediction (Admin Only)
```http
DELETE /history/{prediction_id}
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Prediction with ID 1 deleted successfully",
  "deleted_by": "admin_username"
}
```

### Admin Endpoints

#### Get Model Performance
```http
GET /admin/model-performance
Authorization: Bearer <token>

Response: 200 OK
{
  "total_predictions": 1000,
  "prediction_distribution": {
    "Fake": 600,
    "Real": 400
  },
  "avg_confidence": 0.7845,
  "confidence_distribution": {
    "Very High (90-100%)": 200,
    "High (80-90%)": 350,
    "Medium (70-80%)": 300,
    "Low (60-70%)": 100,
    "Very Low (<60%)": 50
  },
  "risk_distribution": {
    "Low Risk": 500,
    "Medium Risk": 350,
    "High Risk": 150
  },
  "source_metrics": {
    "avg_sources": 2.5,
    "official_source_count": 600,
    "avg_completeness": 85.5
  },
  "temporal_data": [
    {
      "date": "2025-01-16",
      "count": 50,
      "prediction": "Real"
    }
  ],
  "recent_predictions": [...]
}
```

## Features

### Backend Features

- **Machine Learning Prediction**: Random Forest classifier with TF-IDF features
- **JWT Authentication**: Secure token-based auth with bcrypt password hashing
- **Role-Based Access**: User and admin role separation
- **SQLite Database**: Persistent storage for users, sessions, and predictions
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Input Validation**: Pydantic schemas for request/response validation
- **Session Management**: Token revocation on logout
- **Feature Engineering**: Automatic extraction of text and metadata features
- **Trust Scoring**: Risk level and confidence categorization
- **Explainability**: Key factors and warnings for each prediction

### Frontend Features

- **Responsive Design**: Mobile-friendly Tailwind CSS interface
- **Protected Routes**: Authentication-gated pages
- **Admin Dashboard**: Comprehensive analytics and metrics
- **Interactive Visualizations**: Plotly charts for data exploration
  - Probability distribution charts
  - Confidence gauge meters
  - Risk sunburst diagrams
  - Temporal heatmaps
  - History timeline
- **Context API**: Global authentication state management
- **Form Validation**: Client-side input validation
- **Error Handling**: User-friendly error messages
- **Loading States**: Feedback during async operations

## Model Performance

### Random Forest (Production Model)

| Metric | Fake News (0) | Real News (1) | Weighted Avg |
|--------|---------------|---------------|--------------|
| **Precision** | 0.79 | 0.75 | 0.78 |
| **Recall** | 0.84 | 0.69 | 0.78 |
| **F1-Score** | 0.82 | 0.72 | 0.78 |
| **Accuracy** | - | - | **77.71%** |

**Confusion Matrix:**
```
                Predicted
                Fake  Real
Actual  Fake   1734   328
        Real    450   979
```

**Analysis:**
- Better at detecting fake news (84% recall)
- 79% precision for fake news classification
- Balanced performance across both classes
- 1003 features (1000 TF-IDF + 3 metadata)

### XGBoost (Alternative Model)

| Metric | Value |
|--------|-------|
| **Accuracy** | 74.51% |
| **F1-Score** | 0.74 |

**Note**: Random Forest selected for production due to higher accuracy and better fake news recall.

### Feature Importance

Top features for fake news detection:

1. **TF-IDF Features**: Specific words/phrases common in fake news
2. **Speaker Identity**: Credibility of source
3. **Source Count**: Number of citations
4. **Official Sources**: Presence of .gov/.org/.edu domains

### Unsupervised Analysis

K-Means clustering revealed:
- Natural separation into 2 clusters (k=2 optimal)
- Silhouette score: 0.6396
- Clusters correlate with fake/real labels
- Validates supervised learning approach

## Project Architecture

### Data Flow

```
User Input (Frontend)
    ↓
API Request (Axios)
    ↓
FastAPI Endpoint (/predict)
    ↓
Pydantic Validation (UserInput schema)
    ↓
Predictor.predict()
    ↓
Feature Engineering:
  - TF-IDF Vectorization (statement + fullText)
  - Speaker Label Encoding
  - Source Parsing (num_sources, has_official_source)
    ↓
Random Forest Model
    ↓
Post-processing:
  - Confidence Calculation
  - Risk Level Assignment
  - Explainability Generation
    ↓
SQLite Database (save prediction)
    ↓
JSON Response
    ↓
Frontend Display (charts, metrics)
```

### Authentication Flow

```
Register → Hash Password (bcrypt) → Store in users table
    ↓
Login → Verify Password → Generate JWT Token → Save to user_sessions
    ↓
Protected Route → Extract Token → Verify Signature → Decode Payload
    ↓
Check Revocation → Get User → Verify Active → Authorize Request
    ↓
Logout → Mark Token as Revoked in user_sessions
```

### Database Schema

**users table:**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    is_admin INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**user_sessions table:**
```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked INTEGER DEFAULT 0
);
```

**predictions table:**
```sql
CREATE TABLE predictions (
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
);
```

## License

This project is for educational purposes as part of COS30049 - Innovation Project.

## Acknowledgments

- Dataset: [FNID - Fake News Inference Dataset](https://ieee-dataport.org/open-access/fnid-fake-news-inference-dataset)
- Additional data: [FakeNewsNet on Kaggle](https://www.kaggle.com/datasets/mdepak/fakenewsnet)
- Libraries: scikit-learn, FastAPI, React, Plotly

## Contact

For questions or issues, please open an issue in the repository.
