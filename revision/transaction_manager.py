import pandas as pd
from datetime import datetime
from typing import List, Dict
from pydantic import BaseModel, field_validator
from langchain_ollama import OllamaLLM
import os


class ResponseChecks(BaseModel):
    data: List[str]

    @field_validator("data")
    def check(cls, value):
        valid_items = []
        for item in value:
            if " - " in item:
                parts = item.split(" - ")
                if len(parts) == 2 and len(parts[1].strip()) > 0 and len(parts[1].split()) <= 4:
                    valid_items.append(item)
        if not valid_items:
            raise ValueError("No valid categorizations found in the response")
        return valid_items


class TransactionManager:
    def __init__(self, transactions_file: str, categorized_file: str):
        self.transactions_file = transactions_file
        self.categorized_file = categorized_file
        self.llm = OllamaLLM(model="llama3.2")
        self.df = self._load_and_process_data()

    def _load_and_process_data(self):
        df = pd.read_csv(self.transactions_file)

        # Use a custom date parser to handle both formats
        def parse_date(date_string):
            try:
                return pd.to_datetime(date_string, format='%Y-%m-%d %H:%M:%S')
            except ValueError:
                return pd.to_datetime(date_string, format='%Y-%m-%d')

        df['Date'] = df['Date'].apply(parse_date)

        df['Year'] = df['Date'].dt.year
        df['Month'] = df['Date'].dt.month
        df['Month Name'] = df['Date'].dt.strftime("%b")

        # Handle new columns
        if 'Fixed' not in df.columns:
            df['Fixed'] = False
        if 'Frequency' not in df.columns:
            df['Frequency'] = ''

        # Load or create categorized transactions
        if os.path.exists(self.categorized_file) and os.path.getsize(self.categorized_file) > 0:
            categorized_df = pd.read_csv(self.categorized_file)

            # Merge categorized transactions, giving priority to existing categories
            df = df.merge(categorized_df[['Transaction', 'Category']],
                          left_on='Name / Description', right_on='Transaction',
                          how='left', suffixes=('', '_categorized'))

            # Use categorized Category if available, otherwise keep the existing one
            df['Category'] = df['Category_categorized'].fillna(df['Category'])
            df = df.drop(columns=['Transaction', 'Category_categorized'])

        # Ensure 'Category' column exists
        if 'Category' in df.columns:
            df = df.drop(columns=['Category'])
        df = df.merge(categorized_df[['Transaction', 'Category']],
                      left_on='Name / Description', right_on='Transaction',
                      how='left')
        df['Category'] = df['Category'].fillna('Uncategorized')
        df = df.drop(columns=['Transaction'])

        return df

    def _categorize_transactions(self, transactions):
        categories = {}
        for transaction in transactions:
            prompt = (
                f"Categorize the following transaction: '{transaction}'. "
                "Respond with a single category name (1-4 words). "
                "Do not include any explanatory text."
            )
            response = self.llm.invoke(prompt)
            categories[transaction] = response.strip()
        return categories

    def _update_categorized_file(self, new_categories):
        if os.path.exists(self.categorized_file) and os.path.getsize(self.categorized_file) > 0:
            categorized_df = pd.read_csv(self.categorized_file)
        else:
            categorized_df = pd.DataFrame(columns=['Transaction', 'Category'])

        new_df = pd.DataFrame(list(new_categories.items()), columns=['Transaction', 'Category'])
        updated_df = pd.concat([categorized_df, new_df], ignore_index=True)
        updated_df.to_csv(self.categorized_file, index=False)

    def add_transaction(self, date, description, amount, expense_income, fixed, frequency):
        new_transaction = pd.DataFrame({
            'Date': [date],
            'Name / Description': [description],
            'Amount (CHF)': [amount],
            'Expense/Income': [expense_income],
            'Fixed': [fixed],
            'Frequency': [frequency],
            'Year': [date.year],
            'Month': [date.month],
            'Month Name': [date.strftime("%b")]
        })

        category = self._categorize_transactions([description])[description]
        new_transaction['Category'] = category

        self.df = pd.concat([self.df, new_transaction], ignore_index=True)
        self.df.to_csv(self.transactions_file, index=False)

        self._update_categorized_file({description: category})

    def get_available_years(self):
        return sorted(self.df['Year'].unique())

    def get_data_for_year(self, year):
        return self.df[self.df['Year'] == year]

    def get_data_for_month(self, year, month):
        return self.df[(self.df['Year'] == year) & (self.df['Month'] == month)]

    def export_categorized_transactions(self):
        self.df[['Name / Description', 'Category']].drop_duplicates().to_csv(self.categorized_file, index=False)

    def get_transaction_count(self):
        return len(self.df)

    def get_category_count(self):
        return len(self.df['Category'].unique())

    def update_transaction(self, index, updated_data):
        self.df.loc[index] = updated_data
        self.df.to_csv(self.transactions_file, index=False)
        self._update_categorized_file({updated_data['Name / Description']: updated_data['Category']})

    def delete_transaction(self, index: int):
        self.df = self.df.drop(index)
        self.df = self.df.reset_index(drop=True)
        self.df.to_csv(self.transactions_file, index=False)