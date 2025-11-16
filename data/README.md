# Dataset Files

This directory contains the datasets used for training and evaluating the Fake News Detection model.

## Dataset Information

**Source**: [FNID - Fake News Inference Dataset](https://ieee-dataport.org/open-access/fnid-fake-news-inference-dataset)

**Total Records**: 34,907 news articles

## Required Files

Due to GitHub file size limitations, large dataset files are not included in this repository.

### Original Dataset

| File | Size | Status | Description |
|------|------|--------|-------------|
| `fake_news_dataset.csv` | 346 MB | ❌ Not included | Original raw dataset |

### Processed Datasets

| File | Size | Status | Description |
|------|------|--------|-------------|
| `cleaned_dataset.csv` | 162 MB | ❌ Not included | Processed dataset with features |
| `X_train.csv` | 162 MB | ❌ Not included | Training features (80%) |
| `X_val.csv` | 21 MB | ✅ Included | Validation features (10%) |
| `X_test.csv` | 21 MB | ✅ Included | Test features (10%) |
| `y_train.csv` | Small | ✅ Included | Training labels |
| `y_val.csv` | Small | ✅ Included | Validation labels |
| `y_test.csv` | Small | ✅ Included | Test labels |

## How to Get the Dataset

### Option 1: Download Original Dataset

1. Visit [IEEE DataPort](https://ieee-dataport.org/open-access/fnid-fake-news-inference-dataset)
2. Download `fake_news_dataset.csv`
3. Place it in this `data/` directory
4. Run the Jupyter notebook to generate processed files

### Option 2: Train with Available Files

You can still train models using the included smaller files (`X_val.csv`, `X_test.csv`), but performance will be limited.

### Option 3: Request Dataset from Repository Owner

Contact the repository maintainer for access to processed datasets.

## Dataset Schema

### Original Dataset Columns

- `id`: Unique identifier
- `date`: Publication date
- `speaker`: Person or organization
- `statement`: News headline/claim
- `sources`: List of cited sources (URLs)
- `paragraph_based_content`: Paragraph-wise content
- `fullText_based_content`: Complete article text
- `label_fnn`: Fake News Net label
- `news_label`: Binary label (0: Fake, 1: Real)
- `label-liar`: LIAR dataset label

### Processed Dataset Features

After running `COS30049_A2.ipynb`, the following features are created:

**Metadata Features (3):**
- `speaker_grouped`: Label-encoded speaker (top 50 + "other")
- `num_sources`: Number of cited sources
- `has_official_source`: Binary (1 if .gov/.org/.edu present)

**Text Features (1000):**
- TF-IDF features from combined `statement` + `fullText_based_content`

**Total**: 1003 features

## Data Statistics

- **Total samples**: 34,907
- **Training set**: 27,925 (80%)
- **Validation set**: 3,491 (10%)
- **Test set**: 3,491 (10%)

**Label Distribution:**
- Fake news (0): ~59%
- Real news (1): ~41%

## Regenerate Processed Data

To regenerate all processed datasets:

```bash
# 1. Ensure you have the original dataset
ls data/fake_news_dataset.csv

# 2. Install required packages
pip install pandas numpy scikit-learn

# 3. Run the Jupyter notebook
jupyter notebook COS30049_A2.ipynb

# 4. Execute all cells
# The notebook will create:
#   - cleaned_dataset.csv
#   - X_train.csv, X_val.csv, X_test.csv
#   - y_train.csv, y_val.csv, y_test.csv
```

## Verify Dataset Files

```python
import pandas as pd
import os

files = [
    'fake_news_dataset.csv',
    'cleaned_dataset.csv',
    'X_train.csv',
    'X_val.csv',
    'X_test.csv',
    'y_train.csv',
    'y_val.csv',
    'y_test.csv'
]

for file in files:
    path = f'data/{file}'
    if os.path.exists(path):
        size = os.path.getsize(path) / (1024 * 1024)
        df = pd.read_csv(path)
        print(f'✓ {file:30s} - {size:6.2f} MB - {len(df):,} rows')
    else:
        print(f'✗ {file:30s} - MISSING')
```

## Alternative: Use Sample Data

For testing purposes, you can create a small sample dataset:

```python
import pandas as pd

# Load validation set (small enough to be in repo)
X_val = pd.read_csv('data/X_val.csv')
y_val = pd.read_csv('data/y_val.csv')

# Use as training data for quick testing
X_val.to_csv('data/X_train_sample.csv', index=False)
y_val.to_csv('data/y_train_sample.csv', index=False)

print('Sample training data created!')
print(f'Samples: {len(X_val)}')
```

**Note**: Models trained on sample data will have lower accuracy.
