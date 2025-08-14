import yfinance as yf
import datetime
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

def compute_indicators(data: pd.DataFrame) -> pd.DataFrame:
    data = data.copy()

    # Simple MAs
    data['SMA_10'] = data['Close'].rolling(window=10).mean()
    data['SMA_30'] = data['Close'].rolling(window=30).mean()
    data['SMA_50'] = data['Close'].rolling(window=50).mean()
    data['SMA_20'] = data['Close'].rolling(window=20).mean()

    # Exponential MAs
    data['EMA_10'] = data['Close'].ewm(span=10, adjust=False).mean()
    data['EMA_30'] = data['Close'].ewm(span=30, adjust=False).mean()
    data['EMA_50'] = data['Close'].ewm(span=50, adjust=False).mean()

    # RSI (7)
    data['Price Change'] = data['Close'].diff()
    data['Gain'] = data['Price Change'].where(data['Price Change'] > 0, 0.0)
    data['Loss'] = -data['Price Change'].where(data['Price Change'] < 0, 0.0)
    data['Avg Gain'] = data['Gain'].rolling(window=7).mean()
    data['Avg Loss'] = data['Loss'].rolling(window=7).mean()
    rs = data['Avg Gain'] / data['Avg Loss']
    data['RSI'] = 100 - (100 / (1 + rs))

    # Bollinger (20, 2)
    data['STD_20'] = data['Close'].rolling(window=20).std()
    data['Upper_B'] = data['SMA_20'] + 2 * data['STD_20']
    data['Lower_B'] = data['SMA_20'] - 2 * data['STD_20']

    return data.dropna()

def train_and_predict_next_close(df: pd.DataFrame):
    # Predict next day using today's Close (simple baseline model like your script)
    tdf = df[['Close']].copy()
    tdf['Target'] = tdf['Close'].shift(-1)
    tdf.dropna(inplace=True)

    X = tdf[['Close']]
    y = tdf['Target']

    # time-ordered split (no shuffle)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

    model = LinearRegression()
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mse = float(mean_squared_error(y_test, preds))

    # next-day prediction from latest close
    latest_price = tdf[['Close']].iloc[-1].values.reshape(1, -1)
    next_day_pred = float(model.predict(latest_price)[0])

    return mse, next_day_pred

def get_summary(symbol: str, start: str):
    end_date = datetime.date.today()
    data = yf.download(symbol, start=start, end=end_date)

    if data.empty:
        return {"ok": False, "error": "Invalid symbol or no data for given dates."}

    data = compute_indicators(data)

    # Only return last 180 rows to keep JSON small
    slim = data.tail(180).copy()
    slim.index = slim.index.map(lambda x: x.strftime("%Y-%m-%d"))

    mse, next_day = train_and_predict_next_close(data)
    last_close = float(data['Close'].iloc[-1])
    direction = "up" if next_day >= last_close else "down"

    chart = {
        "dates": list(slim.index),
        "close": [float(v) for v in slim['Close'].values],
        "sma20": [float(v) if pd.notna(v) else None for v in slim['SMA_20'].values],
        "upperB": [float(v) if pd.notna(v) else None for v in slim['Upper_B'].values],
        "lowerB": [float(v) if pd.notna(v) else None for v in slim['Lower_B'].values],
    }

    return {
        "ok": True,
        "symbol": symbol.upper(),
        "last_close": last_close,
        "prediction": {
            "next_close": next_day,
            "direction": direction,
            "mse": mse
        },
        "chart": chart
    }
