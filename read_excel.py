import pandas as pd
df = pd.read_excel('backend/scripts/data/HSN_SAC.xlsx', nrows=5)
print(df.columns)
print(df.head())
