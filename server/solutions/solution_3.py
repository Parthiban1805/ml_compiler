# server/solutions/solution_3.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

def predict_prices(train_data_path, test_features):
    """
    This is the reference solution function.
    It trains a model and returns predictions.
    """
    # Load and prepare data
    data = pd.read_csv(train_data_path)
    X = data[['Size', 'Bedrooms']]
    y = data['Price']

    # Train the model
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict on the provided test features
    predictions = model.predict(test_features)
    return predictions