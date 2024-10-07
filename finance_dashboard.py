import re
from datetime import datetime, timedelta
from typing import List

import pandas as pd
import panel as pn
import plotly.express as px
import plotly.graph_objects as go
from langchain_community.llms import Ollama
from pydantic import BaseModel, field_validator


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
        "You're an expert accountant for a family"
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
        return pd.DataFrame({'Transaction': transaction_names.split(', '), 'Category': ['Uncategorized'] * len(transaction_names.split(', '))})

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


def update_dashboard(year, view_type):
    global df, income_chart, expense_chart, income_monthly, expense_monthly

    if view_type == 'Yearly':
        income_chart.object = make_chart(df, year, 'Income')
        expense_chart.object = make_chart(df, year, 'Expense')
    else:  # Monthly view
        income_monthly.object = make_monthly_bar_chart(df, year, 'Income')
        expense_monthly.object = make_monthly_bar_chart(df, year, 'Expense')

    # Trigger an event to update the UI
    for chart in [income_chart, expense_chart, income_monthly, expense_monthly]:
        if hasattr(chart, 'param'):
            chart.param.trigger('object')


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
        color_scale = px.colors.qualitative.Pastel
        fig = px.pie(sub_df, values='Amount (CHF)', names='Category', color_discrete_sequence=color_scale)
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
                      .to_frame()
                      .reset_index()
                      .sort_values(by='Month')
                      .reset_index(drop=True))

    color_scale = px.colors.sequential.Greens if label == "Income" else px.colors.sequential.Reds

    bar_fig = px.bar(total_by_month, x='Month Name', y='Amount (CHF)', text_auto='.2s',
                     title=f"{label} per month in {year}", color='Amount (CHF)', color_continuous_scale=color_scale)

    bar_fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        autosize=True,
        font=dict(color="#FFFFFF"),
    )

    return bar_fig


def make_sankey_chart(df, year, view_type):
    if view_type == 'Yearly':
        df_filtered = df[df['Year'] == year]
        title = f"Cash Flow Statement {year}"
    else:  # Monthly view
        current_month = datetime.now().month
        df_filtered = df[(df['Year'] == year) & (df['Month'] == current_month)]
        title = f"Cash Flow Statement {df_filtered['Month Name'].iloc[0]} {year}"

    # Prepare data for Sankey diagram
    income_categories = df_filtered[df_filtered['Expense/Income'] == 'Income'].groupby('Category')['Amount (CHF)'].sum()
    expense_categories = df_filtered[df_filtered['Expense/Income'] == 'Expense'].groupby('Category')[
        'Amount (CHF)'].sum()

    total_income = income_categories.sum()
    total_expense = expense_categories.sum()
    savings = total_income - total_expense

    # Create nodes
    nodes = (
            ['Total Income'] +
            list(income_categories.index) +
            ['Available Money'] +
            list(expense_categories.index) +
            ['Savings']
    )

    # Create links
    links = (
            [{'source': nodes.index('Total Income'), 'target': nodes.index(cat), 'value': val}
             for cat, val in income_categories.items()] +
            [{'source': nodes.index(cat), 'target': nodes.index('Available Money'), 'value': val}
             for cat, val in income_categories.items()] +
            [{'source': nodes.index('Available Money'), 'target': nodes.index(cat), 'value': val}
             for cat, val in expense_categories.items()] +
            [{'source': nodes.index('Available Money'), 'target': nodes.index('Savings'), 'value': savings}]
    )

    # Create Sankey diagram
    fig = go.Figure(data=[go.Sankey(
        node=dict(
            pad=15,
            thickness=20,
            line=dict(color="black", width=0.5),
            label=nodes,
            color="blue"
        ),
        link=dict(
            source=[link['source'] for link in links],
            target=[link['target'] for link in links],
            value=[link['value'] for link in links]
        ))])

    fig.update_layout(
        title_text=title,
        font_size=10,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(color="#FFFFFF"),
    )

    return fig


def main():
    global llm, df

    # Initialize Ollama
    llm = Ollama(model="llama3.2")

    # Read and process data
    df = pd.read_csv('transactions.csv')
    df['Date'] = df['Date'].apply(parse_date)
    df['Year'] = df['Date'].dt.year
    df['Month'] = df['Date'].dt.month
    df['Month Name'] = df['Date'].dt.strftime("%b")

    # Categorize transactions
    categories_df_all = pd.DataFrame()
    unique_transactions = df["Name / Description"].unique()
    batch_size = 5
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
        print("Warning: Failed to categorize any transactions. Using default categories.")
        categories_df_all = pd.DataFrame(
            {'Transaction': unique_transactions, 'Category': ['Uncategorized'] * len(unique_transactions)})

    # Clean and standardize categories
    categories_df_all = clean_categories(categories_df_all)
    categories_df_all['Transaction'] = categories_df_all['Transaction'].apply(lambda x: re.sub(r'^\d+\.\s*', '', x))

    # Merge categorized data
    df = pd.merge(df, categories_df_all[['Transaction', 'Category']],
                  left_on='Name / Description', right_on='Transaction', how='left')
    df.loc[df['Expense/Income'] == 'Income', 'Category'] = df.loc[
        df['Expense/Income'] == 'Income', 'Name / Description']

    # Get available years
    available_years = sorted(df['Year'].unique())

    # Create year selector and view type selector
    year_selector = pn.widgets.Select(name='Select Year', options=available_years, value=max(available_years))
    view_type_selector = pn.widgets.RadioButtonGroup(name='View Type', options=['Yearly', 'Monthly'], value='Yearly')

    # Create charts pane
    income_chart_pane = pn.pane.Plotly(height=400, sizing_mode='stretch_both')
    expense_chart_pane = pn.pane.Plotly(height=400, sizing_mode='stretch_both')
    sankey_chart_pane = pn.pane.Plotly(height=600, sizing_mode='stretch_both')
    charts_row = pn.Row(income_chart_pane, expense_chart_pane, sizing_mode='stretch_both')

    def update_charts(event):
        year = year_selector.value
        view_type = view_type_selector.value

        if view_type == 'Yearly':
            income_chart = make_chart(df, year, 'Income')
            expense_chart = make_chart(df, year, 'Expense')
        else:  # Monthly view
            income_chart = make_monthly_bar_chart(df, year, 'Income')
            expense_chart = make_monthly_bar_chart(df, year, 'Expense')

        sankey_chart = make_sankey_chart(df, year, view_type)

        income_chart_pane.object = income_chart
        expense_chart_pane.object = expense_chart
        sankey_chart_pane.object = sankey_chart

    year_selector.param.watch(update_charts, 'value')
    view_type_selector.param.watch(update_charts, 'value')

    # Initial update of charts
    update_charts(None)

    transaction_form = create_transaction_form()

    template = pn.template.FastListTemplate(
        title='Personal Finance Dashboard',
        sidebar=[
            pn.pane.Markdown("# Income Expense analysis"),
            pn.pane.Markdown(
                "Overview of income and expense based on my bank transactions. Categories are obtained using local LLMs."),
            year_selector,
            view_type_selector,
            transaction_form
        ],
        main=[charts_row, sankey_chart_pane],
        header_background="#4a4a4a",
        accent_base_color="#008080",
        theme='dark',
    )

    # Add debug information
    debug_info = pn.pane.Markdown(f"""
    ## Debug Information
    - Available Years: {', '.join(map(str, available_years))}
    - Number of Transactions: {len(df)}
    - Number of Categories: {len(df['Category'].unique())}
    """)

    template.main.append(debug_info)

    return template


if __name__ == "__main__":
    dashboard = main()
    dashboard.servable()
    pn.serve(dashboard)