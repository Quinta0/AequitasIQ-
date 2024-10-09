import re
from datetime import datetime
from typing import List

import pandas as pd
import panel as pn
import plotly.express as px
from langchain_community.llms import Ollama
from pydantic import BaseModel, field_validator

class ResponseChecks(BaseModel):
    data: List[str]

    @field_validator("data")
    def check(cls, value):
        valid_items = [item for item in value if " - " in item and len(item.split(" - ")[1].strip().split()) <= 4]
        if not valid_items:
            raise ValueError("No valid categorizations found in the response")
        return valid_items

def parse_date(date_string):
    try:
        return pd.to_datetime(date_string, format='%Y-%m-%d')
    except ValueError:
        year, month, day = map(int, date_string.split('-'))
        if month > 12:
            month, day = day, month
        return pd.to_datetime(f"{year}-{month:02d}-{day:02d}")

def categorize_transactions(transaction_names, llm):
    prompt = (
        "You're an expert accountant for a family. "
        "Categorize the following expenses. Respond with a list, one item per line. "
        "Format: 'Transaction - Category'. Categories should be 1-4 words. "
        "Do not include any explanatory text before or after the list. Example:\n"
        "Spotify AB by Adyen - Entertainment\n"
        "Beta Boulders Ams Amsterdam Nld - Sports\n\n"
        f"Transactions to categorize:\n{transaction_names}"
    )
    response = llm.invoke(prompt)
    response_lines = [line.strip() for line in response.split('\n') if line.strip()]

    try:
        valid_items = ResponseChecks(data=response_lines).data
    except ValueError as e:
        print(f"Validation error: {e}")
        return pd.DataFrame({'Transaction': transaction_names.split(', '), 'Category': ['Uncategorized'] * len(transaction_names.split(', '))})

    categories_df = pd.DataFrame([item.split(' - ') for item in valid_items], columns=['Transaction', 'Category'])
    return categories_df

def clean_categories(df):
    if 'Category' not in df.columns:
        print("Warning: 'Category' column not found. Skipping category cleaning.")
        return df

    category_mappings = {
        "Food": "Food and Drinks",
        "Drink": "Food and Drinks",
        "Grocery": "Food and Drinks",
        "Restaurant": "Food and Drinks",
        "Clothing": "Clothing and Apparel",
        "Apparel": "Clothing and Apparel",
        "Fashion": "Clothing and Apparel",
        "Services": "Services",
        "Health": "Health and Wellness",
        "Wellness": "Health and Wellness",
        "Medical": "Health and Wellness",
        "Sport": "Sport and Fitness",
        "Fitness": "Sport and Fitness",
        "Gym": "Sport and Fitness",
        "Travel": "Travel and Transportation",
        "Transportation": "Travel and Transportation",
        "Utilities": "Utilities",
        "Electric": "Utilities",
        "Water": "Utilities",
        "Gas": "Utilities",
        "Internet": "Utilities",
        "Phone": "Utilities",
        "Education": "Education",
        "School": "Education",
        "Tuition": "Education",
        "Books": "Education",
        "Insurance": "Insurance",
        "Home": "Housing",
        "Rent": "Housing",
        "Mortgage": "Housing",
        "Entertainment": "Entertainment",
        "Cinema": "Entertainment",
        "Concert": "Entertainment",
        "Shopping": "Shopping",
        "Electronics": "Electronics and Technology",
        "Technology": "Electronics and Technology",
        "Charity": "Donations and Gifts",
        "Gift": "Donations and Gifts",
        "Donation": "Donations and Gifts",
        "Pet": "Pet Care",
        "Vet": "Pet Care",
        "Car": "Automotive",
        "Auto": "Automotive",
        "Vehicle": "Automotive",
        "Business": "Business Expenses",
        "Office": "Business Expenses",
        "Tax": "Taxes",
        "Investment": "Investments",
        "Savings": "Savings",
        "Debt": "Debt Payments",
        "Loan": "Debt Payments",
        "Credit": "Debt Payments",
        "Personal": "Personal Care",
        "Beauty": "Personal Care",
        "Hobby": "Hobbies and Leisure",
        "Leisure": "Hobbies and Leisure"
    }

    for key, value in category_mappings.items():
        df.loc[df['Category'].str.contains(key, case=False, na=False), 'Category'] = value

    return df

def add_transaction_to_csv(date, description, amount, expense_income):
    new_transaction = pd.DataFrame({
        'Date': [date],
        'Name / Description': [description],
        'Amount (CHF)': [amount],
        'Expense/Income': [expense_income]
    })

    df = pd.read_csv('revision/transactions.csv')
    df = pd.concat([df, new_transaction], ignore_index=True)
    df.to_csv('transactions.csv', index=False)

def create_transaction_form():
    date_input = pn.widgets.DatePicker(name='Date', value=datetime.now().date())
    description_input = pn.widgets.TextInput(name='Description')
    amount_input = pn.widgets.FloatInput(name='Amount (CHF)')
    expense_income_input = pn.widgets.Select(name='Expense/Income', options=['Expense', 'Income'])

    def add_transaction(event):
        date = date_input.value
        description = description_input.value
        amount = amount_input.value
        expense_income = expense_income_input.value

        if all([date, description, amount, expense_income]):
            add_transaction_to_csv(date, description, amount, expense_income)
            pn.state.notifications.success('Transaction added successfully!')
            description_input.value = ''
            amount_input.value = None
            update_dashboard()
        else:
            pn.state.notifications.error('Please fill in all fields.')

    submit_button = pn.widgets.Button(name='Add Transaction', button_type='primary')
    submit_button.on_click(add_transaction)

    return pn.Column(
        pn.pane.Markdown("## Add New Transaction"),
        date_input,
        description_input,
        amount_input,
        expense_income_input,
        submit_button
    )

def make_chart(df, year, label):
    sub_df = df[(df['Expense/Income'] == label) & (df['Year'] == year)]
    total_expense = df[(df['Expense/Income'] == 'Expense') & (df['Year'] == year)]['Amount (CHF)'].sum()
    total_income = df[(df['Expense/Income'] == 'Income') & (df['Year'] == year)]['Amount (CHF)'].sum()

    if label == 'Expense':
        sub_df = sub_df.groupby('Category')['Amount (CHF)'].sum().reset_index()
        fig = px.treemap(sub_df, path=['Category'], values='Amount (CHF)',
                         color='Amount (CHF)', color_continuous_scale='Reds')
        total_text = f"Total Expenses: CHF {round(total_expense)}"
        saving_rate = round((total_income - total_expense) / total_income * 100) if total_income != 0 else 0
        saving_rate_text = f"Saving rate: {saving_rate}%"
    else:
        fig = px.pie(sub_df, values='Amount (CHF)', names='Category', color_discrete_sequence=px.colors.qualitative.Pastel)
        fig.update_traces(textposition='inside', direction='clockwise', hole=0.3, textinfo="label+percent")
        total_text = f"Total Income: CHF {round(total_income)}"
        saving_rate_text = ""

    fig.update_layout(
        uniformtext_minsize=10,
        uniformtext_mode='hide',
        title=dict(text=f"{label} Breakdown {year}"),
        annotations=[
            dict(text=total_text, x=0.5, y=-0.1, font_size=12, showarrow=False, xref='paper', yref='paper'),
            dict(text=saving_rate_text, x=0.5, y=-0.15, font_size=12, showarrow=False, xref='paper', yref='paper')
        ],
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        autosize=True,
        font=dict(color="#FFFFFF"),
    )
    return fig

def make_monthly_bar_chart(df, year, label):
    df = df[(df['Expense/Income'] == label) & (df['Year'] == year)]
    total_by_month = (df.groupby(['Month', 'Month Name'])['Amount (CHF)'].sum()
                      .reset_index()
                      .sort_values(by='Month'))

    color_scale = px.colors.sequential.Greens if label == "Income" else px.colors.sequential.Reds

    fig = px.bar(total_by_month, x='Month Name', y='Amount (CHF)', text_auto='.2s',
                 title=f"{label} per month in {year}", color='Amount (CHF)', color_continuous_scale=color_scale)

    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        autosize=True,
        font=dict(color="#FFFFFF"),
    )

    return fig

def main():
    llm = Ollama(model="llama3.2")

    df = pd.read_csv('revision/transactions.csv')
    df['Date'] = df['Date'].apply(parse_date)
    df['Year'] = df['Date'].dt.year
    df['Month'] = df['Date'].dt.month
    df['Month Name'] = df['Date'].dt.strftime("%b")

    categories_df_all = pd.DataFrame()
    unique_transactions = df["Name / Description"].unique()
    batch_size = 5
    for i in range(0, len(unique_transactions), batch_size):
        batch = unique_transactions[i:i + batch_size]
        transaction_names = ', '.join(batch)

        for attempt in range(3):
            try:
                categories_df = categorize_transactions(transaction_names, llm)
                if not categories_df.empty:
                    categories_df_all = pd.concat([categories_df_all, categories_df], ignore_index=True)
                    break
            except Exception as e:
                print(f"Error on attempt {attempt + 1}: {e}")
        else:
            print(f"Failed to categorize batch starting with {batch[0]} after 3 attempts.")

    if categories_df_all.empty:
        print("Warning: Failed to categorize any transactions. Using default categories.")
        categories_df_all = pd.DataFrame(
            {'Transaction': unique_transactions, 'Category': ['Uncategorized'] * len(unique_transactions)})

    categories_df_all = clean_categories(categories_df_all)
    categories_df_all['Transaction'] = categories_df_all['Transaction'].apply(lambda x: re.sub(r'^\d+\.\s*', '', x))

    df = pd.merge(df, categories_df_all[['Transaction', 'Category']],
                  left_on='Name / Description', right_on='Transaction', how='left')
    df.loc[df['Expense/Income'] == 'Income', 'Category'] = df.loc[
        df['Expense/Income'] == 'Income', 'Name / Description']

    available_years = sorted(df['Year'].unique())
    available_months = sorted(df['Month'].unique())

    year_selector = pn.widgets.Select(name='Select Year', options=available_years, value=max(available_years))
    month_selector = pn.widgets.Select(name='Select Month', options=available_months, value=max(available_months))
    view_type_selector = pn.widgets.RadioButtonGroup(name='View Type', options=['Yearly', 'Monthly'], value='Yearly')

    income_chart_pane = pn.pane.Plotly(height=400, sizing_mode='stretch_width')
    expense_chart_pane = pn.pane.Plotly(height=400, sizing_mode='stretch_width')
    charts_row = pn.Row(income_chart_pane, expense_chart_pane, sizing_mode='stretch_width')

    debug_info = pn.pane.Markdown("")

    def update_charts(event):
        year = year_selector.value
        month = month_selector.value
        view_type = view_type_selector.value

        if view_type == 'Yearly':
            income_chart = make_chart(df, year, 'Income')
            expense_chart = make_chart(df, year, 'Expense')
        else:
            income_chart = make_monthly_bar_chart(df[df['Month'] == month], year, 'Income')
            expense_chart = make_monthly_bar_chart(df[df['Month'] == month], year, 'Expense')

        income_chart_pane.object = income_chart
        expense_chart_pane.object = expense_chart

        # Update debug information
        total_income = df[(df['Expense/Income'] == 'Income') & (df['Year'] == year)]['Amount (CHF)'].sum()
        total_expense = df[(df['Expense/Income'] == 'Expense') & (df['Year'] == year)]['Amount (CHF)'].sum()
        saving_rate = round((total_income - total_expense) / total_income * 100, 2) if total_income != 0 else 0

        debug_info.object = f"""
        ## Debug Information
        - Available Years: {', '.join(map(str, available_years))}
        - Number of Transactions: {len(df)}
        - Number of Categories: {len(df['Category'].unique())}
        - Overall Income: CHF {round(total_income, 2)}
        - Overall Expenses: CHF {round(total_expense, 2)}
        - Saving Rate: {saving_rate}%
        - Selected Year: {year}
        - Selected Month: {month if view_type == 'Monthly' else 'N/A'}
        - View Type: {view_type}
        """

    year_selector.param.watch(update_charts, 'value')
    month_selector.param.watch(update_charts, 'value')
    view_type_selector.param.watch(update_charts, 'value')

    update_charts(None)

    transaction_form = create_transaction_form()

    template = pn.template.FastListTemplate(
        title='Personal Finance Dashboard',
        sidebar=[
            pn.pane.Markdown("# Income Expense analysis"),
            pn.pane.Markdown("Overview of income and expense based on my bank transactions. Categories are obtained using local LLMs."),
            year_selector,
            month_selector,
            view_type_selector,
            transaction_form
        ],
        main=[charts_row, debug_info],
        header_background="#4a4a4a",
        accent_base_color="#008080",
        theme='dark',
    )

    return template


if __name__ == "__main__":
    dashboard = main()
    dashboard.servable()
    pn.serve(dashboard)