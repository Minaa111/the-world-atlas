import pandas as pd
import os

datasets_dir = '../datasets'

files = [
    'gini.csv',
    'life-expectancy.csv',
    'literacy-rate.csv',
    'pm25.csv'
]

for f in files:
    path = os.path.join(datasets_dir, f)
    print(f"--- {f} ---")
    try:
        df = pd.read_csv(path, skiprows=4)
        print(df.head(2))
        print("Columns:", df.columns.tolist()[:10])
    except Exception as e:
        print(e)
    print("\n")

xls_path = os.path.join(datasets_dir, 'Intentional Homicide Victims by counts and rates p.xls')
print("--- Homicide XLS ---")
try:
    df_xls = pd.read_excel(xls_path, skiprows=0)
    print(df_xls.head(10))
except Exception as e:
    print(e)
