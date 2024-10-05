import pandas as pd
import numpy as np
import plotly.express as px
import panel as pn
from langchain_community.llms import Ollama
from pydantic import BaseModel, field_validator
from typing import List
import re
from datetime import datetime, timedelta


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


def parse_date(date_string):
    try:
        return pd.to_datetime(date_string, format='%Y-%m-%d')
    except ValueError:
        # If the date is invalid, try to correct it
        year, month, day = map(int, date_string.split('-'))
        if month > 12:
            month, day = day, month  # Swap month and day
        last_day_of_month = (datetime(year, month % 12 + 1, 1) - timedelta(days=1)).day
        day = min(day, last_day_of_month)
        return datetime(year, month, day)


def categorize_transactions(transaction_names, llm):
    prompt = (
        "Categorize the following expenses. Respond with a list, one item per line. "
        "Format: 'Transaction - Category'. Categories should be 1-4 words. "
        "Do not include any explanatory text before or after the list. Example:\n"
        "Spotify AB by Adyen - Entertainment\n"
        "Beta Boulders Ams Amsterdam Nld - Sports\n\n"
        f"Transactions to categorize:\n{transaction_names}"
    )
    response = llm.invoke(prompt)
    response_lines = [line.strip() for line in response.split('\n') if line.strip()]

    # Validate response
    try:
        valid_items = ResponseChecks(data=response_lines).data
    except ValueError as e:
        print(f"Validation error: {e}")
        return pd.DataFrame()  # Return empty DataFrame on validation failure

    # Create DataFrame
    categories_df = pd.DataFrame(valid_items, columns=['Transaction vs category'])
    categories_df[['Transaction', 'Category']] = categories_df['Transaction vs category'].str.split(' - ', expand=True)
    return categories_df


def clean_categories(df):
    if 'Category' not in df.columns:
        print("Warning: 'Category' column not found. Skipping category cleaning.")
        return df

    category_mappings = {
        "Food": "Food and Drinks",
        "Clothing": "Clothing",
        "Services": "Services",
        "Health": "Health and Wellness",
        "Wellness": "Health and Wellness",
        "Sport": "Sport and Fitness",
        "Travel": "Travel"
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

    df = pd.read_csv('transactions.csv')
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

        if date and description and amount and expense_income:
            add_transaction_to_csv(date, description, amount, expense_income)

            # Try to show a notification, but don't fail if it's not available
            try:
                if pn.state.notifications:
                    pn.state.notifications.success('Transaction added successfully!')
                else:
                    print('Transaction added successfully!')
            except Exception as e:
                print(f'Transaction added successfully! (Notification error: {e})')

            # Clear form inputs
            description_input.value = ''
            amount_input.value = None
            # Trigger dashboard update
            update_dashboard()
        else:
            try:
                if pn.state.notifications:
                    pn.state.notifications.error('Please fill in all fields.')
                else:
                    print('Please fill in all fields.')
            except Exception as e:
                print(f'Please fill in all fields. (Notification error: {e})')

    submit_button = pn.widgets.Button(name='Add Transaction', button_type='primary')
    submit_button.on_click(add_transaction)

    form = pn.Column(
        pn.pane.Markdown("## Add New Transaction"),
        date_input,
        description_input,
        amount_input,
        expense_income_input,
        submit_button
    )

    return form


def update_dashboard(event=None):
    global llm, df, income_pie_fig_current, expense_pie_fig_current, income_pie_fig_next, expense_pie_fig_next
    global income_monthly_current, expense_monthly_current, income_monthly_next, expense_monthly_next

    # Re-read the CSV file and update all charts
    df = pd.read_csv('transactions.csv')
    df['Date'] = df['Date'].apply(parse_date)
    df['Year'] = df['Date'].dt.year
    df['Month'] = df['Date'].dt.month
    df['Month Name'] = df['Date'].dt.strftime("%b")

    # Filter for 2024 onwards
    df = df[df['Year'] >= 2024]

    current_year = datetime.now().year
    next_year = current_year + 1

    # Recategorize transactions
    categories_df_all = pd.DataFrame()
    unique_transactions = df["Name / Description"].unique()
    batch_size = 5  # Reduced batch size
    for i in range(0, len(unique_transactions), batch_size):
        batch = unique_transactions[i:i + batch_size]
        transaction_names = ', '.join(batch)

        categories_df = categorize_transactions(transaction_names, llm)
        if not categories_df.empty:
            categories_df_all = pd.concat([categories_df_all, categories_df], ignore_index=True)

    # Clean and standardize categories
    categories_df_all = clean_categories(categories_df_all)

    # Remove numbering from Transaction column
    categories_df_all['Transaction'] = categories_df_all['Transaction'].apply(lambda x: re.sub(r'^\d+\.\s*', '', x))

    # Merge categorized data
    df = pd.merge(df, categories_df_all[['Transaction', 'Category']],
                  left_on='Name / Description', right_on='Transaction', how='left')
    df.loc[df['Expense/Income'] == 'Income', 'Category'] = df.loc[
        df['Expense/Income'] == 'Income', 'Name / Description']

    # Update charts
    income_pie_fig_current.object = make_pie_chart(df, current_year, 'Income')
    expense_pie_fig_current.object = make_pie_chart(df, current_year, 'Expense')
    income_pie_fig_next.object = make_pie_chart(df, next_year, 'Income')
    expense_pie_fig_next.object = make_pie_chart(df, next_year, 'Expense')

    income_monthly_current.object = make_monthly_bar_chart(df, current_year, 'Income')
    expense_monthly_current.object = make_monthly_bar_chart(df, current_year, 'Expense')
    income_monthly_next.object = make_monthly_bar_chart(df, next_year, 'Income')
    expense_monthly_next.object = make_monthly_bar_chart(df, next_year, 'Expense')

    # Trigger an event to update the UI
    for chart in [income_pie_fig_current, expense_pie_fig_current, income_pie_fig_next, expense_pie_fig_next,
                  income_monthly_current, expense_monthly_current, income_monthly_next, expense_monthly_next]:
        if hasattr(chart, 'param'):
            chart.param.trigger('object')


def make_pie_chart(df, year, label):
    sub_df = df[(df['Expense/Income'] == label) & (df['Year'] == year)]

    color_scale = px.colors.qualitative.Set2

    pie_fig = px.pie(sub_df, values='Amount (CHF)', names='Category', color_discrete_sequence=color_scale)
    pie_fig.update_traces(textposition='inside', direction='clockwise', hole=0.3, textinfo="label+percent")

    total_expense = df[(df['Expense/Income'] == 'Expense') & (df['Year'] == year)]['Amount (CHF)'].sum()
    total_income = df[(df['Expense/Income'] == 'Income') & (df['Year'] == year)]['Amount (CHF)'].sum()

    if label == 'Expense':
        total_text = "CHF " + str(round(total_expense))
        saving_rate = round((total_income - total_expense) / total_income * 100) if total_income != 0 else 0
        saving_rate_text = f": Saving rate {saving_rate}%"
    else:
        saving_rate_text = ""
        total_text = "CHF " + str(round(total_income))

    pie_fig.update_layout(
        uniformtext_minsize=10,
        uniformtext_mode='hide',
        title=dict(text=f"{label} Breakdown {year}{saving_rate_text}"),
        annotations=[dict(text=total_text, x=0.5, y=0.5, font_size=12, showarrow=False)]
    )
    return pie_fig


def make_monthly_bar_chart(df, year, label):
    df = df[(df['Expense/Income'] == label) & (df['Year'] == year)]
    total_by_month = (df.groupby(['Month', 'Month Name'])['Amount (CHF)'].sum()
                      .to_frame()
                      .reset_index()
                      .sort_values(by='Month')
                      .reset_index(drop=True))
    color_scale = px.colors.sequential.YlGn if label == "Income" else px.colors.sequential.OrRd

    bar_fig = px.bar(total_by_month, x='Month Name', y='Amount (CHF)', text_auto='.2s',
                     title=f"{label} per month", color='Amount (CHF)', color_continuous_scale=color_scale)

    return bar_fig


def main():
    global llm, income_pie_fig_current, expense_pie_fig_current, income_pie_fig_next, expense_pie_fig_next
    global income_monthly_current, expense_monthly_current, income_monthly_next, expense_monthly_next

    # Initialize Ollama
    llm = Ollama(model="llama3.2")

    # Read and process data
    df = pd.read_csv('transactions.csv')

    # Apply the custom date parser
    df['Date'] = df['Date'].apply(parse_date)

    df['Year'] = df['Date'].dt.year
    df['Month'] = df['Date'].dt.month
    df['Month Name'] = df['Date'].dt.strftime("%b")

    # Filter for 2024 onwards
    df = df[df['Year'] >= 2024]

    # Get the current year and the next year
    current_year = datetime.now().year
    next_year = current_year + 1

    # Categorize transactions
    categories_df_all = pd.DataFrame()
    unique_transactions = df["Name / Description"].unique()
    batch_size = 5  # Reduced batch size
    for i in range(0, len(unique_transactions), batch_size):
        batch = unique_transactions[i:i + batch_size]
        transaction_names = ', '.join(batch)

        max_retries = 3
        for attempt in range(max_retries):
            try:
                categories_df = categorize_transactions(transaction_names, llm)
                if not categories_df.empty:
                    categories_df_all = pd.concat([categories_df_all, categories_df], ignore_index=True)
                    break
            except Exception as e:
                print(f"Error on attempt {attempt + 1}: {e}")
                if attempt == max_retries - 1:
                    print(f"Failed to categorize batch starting with {batch[0]} after {max_retries} attempts.")

    if categories_df_all.empty:
        print("Error: Failed to categorize any transactions. Exiting.")
        return

    # Clean and standardize categories
    categories_df_all = clean_categories(categories_df_all)

    # Remove numbering from Transaction column
    categories_df_all['Transaction'] = categories_df_all['Transaction'].apply(lambda x: re.sub(r'^\d+\.\s*', '', x))

    # Merge categorized data
    df = pd.merge(df, categories_df_all[['Transaction', 'Category']],
                  left_on='Name / Description', right_on='Transaction', how='left')

    # For Income rows, use Name / Description as Category
    df.loc[df['Expense/Income'] == 'Income', 'Category'] = df.loc[
        df['Expense/Income'] == 'Income', 'Name / Description']

    # Create charts
    income_pie_fig_current = pn.pane.Plotly(make_pie_chart(df, current_year, 'Income'))
    expense_pie_fig_current = pn.pane.Plotly(make_pie_chart(df, current_year, 'Expense'))
    income_pie_fig_next = pn.pane.Plotly(make_pie_chart(df, next_year, 'Income'))
    expense_pie_fig_next = pn.pane.Plotly(make_pie_chart(df, next_year, 'Expense'))

    income_monthly_current = pn.pane.Plotly(make_monthly_bar_chart(df, current_year, 'Income'))
    expense_monthly_current = pn.pane.Plotly(make_monthly_bar_chart(df, current_year, 'Expense'))
    income_monthly_next = pn.pane.Plotly(make_monthly_bar_chart(df, next_year, 'Income'))
    expense_monthly_next = pn.pane.Plotly(make_monthly_bar_chart(df, next_year, 'Expense'))

    # Create dashboard
    tabs = pn.Tabs(
        (str(current_year), pn.Column(pn.Row(income_pie_fig_current, expense_pie_fig_current),
                                      pn.Row(income_monthly_current, expense_monthly_current))),
        (str(next_year), pn.Column(pn.Row(income_pie_fig_next, expense_pie_fig_next),
                                   pn.Row(income_monthly_next, expense_monthly_next)))
    )

    transaction_form = create_transaction_form()

    template = pn.template.FastListTemplate(
        title='Personal Finance Dashboard',
        sidebar=[
            pn.pane.Markdown("# Income Expense analysis"),
            pn.pane.Markdown(
                "Overview of income and expense based on my bank transactions. Categories are obtained using local LLMs."),
            pn.pane.PNG("picture.png", sizing_mode="scale_both"),
            transaction_form  # Add the transaction form to the sidebar
        ],
        main=[pn.Row(pn.Column(pn.Row(tabs)))],
        header_background="#c0b9dd",
    )

    template.show()

if __name__ == "__main__":
    main()