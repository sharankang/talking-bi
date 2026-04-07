# import pandas as pd


# def generate_label(columns):
#     col_str = " ".join(columns).lower()

#     if any(x in col_str for x in ["price", "amount", "revenue", "sales"]):
#         return "Sales Data"
#     elif any(x in col_str for x in ["user", "email", "name"]):
#         return "User Data"
#     elif any(x in col_str for x in ["product", "item", "category"]):
#         return "Product Data"
#     elif any(x in col_str for x in ["date", "time", "timestamp"]):
#         return "Time Series Data"
#     else:
#         return "General Dataset"


# def get_table_overview(df: pd.DataFrame):
#     return {
#         "rows": int(len(df)),
#         "columns": list(df.columns),
#         "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
#         "missing": df.isnull().sum().to_dict(),
#         "sample": df.head(5).to_dict(orient="records")
#     }


# def classify_columns(df: pd.DataFrame):
#     return {
#         "numerical": df.select_dtypes(include=['int64', 'float64']).columns.tolist(),
#         "categorical": df.select_dtypes(include=['object']).columns.tolist(),
#         "datetime": df.select_dtypes(include=['datetime64']).columns.tolist()
#     }