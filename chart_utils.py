import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime

def make_chart(df, year, label, month=None):
    if month:
        sub_df = df[(df['Expense/Income'] == label) & (df['Year'] == year) & (df['Month'] == month)]
        period = f"{datetime(year, month, 1).strftime('%B')} {year}"
    else:
        sub_df = df[(df['Expense/Income'] == label) & (df['Year'] == year)]
        period = str(year)

    total_expense = sub_df[sub_df['Expense/Income'] == 'Expense']['Amount (CHF)'].sum()
    total_income = sub_df[sub_df['Expense/Income'] == 'Income']['Amount (CHF)'].sum()

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
        title=dict(text=f"{label} Breakdown for {period}"),
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

def make_sankey_chart(df, year, view_type, month=None):
    if view_type == 'Yearly':
        df_filtered = df[df['Year'] == year]
        title = f"Cash Flow Statement {year}"
    else:  # Monthly view
        if month is None:
            month = datetime.now().month
        df_filtered = df[(df['Year'] == year) & (df['Month'] == month)]
        month_name = datetime(year, month, 1).strftime('%B')
        title = f"Cash Flow Statement {month_name} {year}"

    if df_filtered.empty:
        # Return an empty figure with a message
        fig = go.Figure()
        fig.add_annotation(
            text="No data available for the selected period",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False
        )
        fig.update_layout(
            title_text=title,
            font_size=10,
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font=dict(color="#FFFFFF"),
        )
        return fig

    income_categories = df_filtered[df_filtered['Expense/Income'] == 'Income'].groupby('Category')['Amount (CHF)'].sum()
    expense_categories = df_filtered[df_filtered['Expense/Income'] == 'Expense'].groupby('Category')['Amount (CHF)'].sum()


    total_income = income_categories.sum()
    total_expense = expense_categories.sum()
    savings = total_income - total_expense

    nodes = (
            ['Total Income'] +
            list(income_categories.index) +
            ['Available Money'] +
            list(expense_categories.index) +
            ['Savings']
    )

    links = (
            [{'source': nodes.index('Total Income'), 'target': nodes.index(cat), 'value': val}
             for cat, val in income_categories.items()] +
            [{'source': nodes.index(cat), 'target': nodes.index('Available Money'), 'value': val}
             for cat, val in income_categories.items()] +
            [{'source': nodes.index('Available Money'), 'target': nodes.index(cat), 'value': val}
             for cat, val in expense_categories.items()] +
            [{'source': nodes.index('Available Money'), 'target': nodes.index('Savings'), 'value': savings}]
    )

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

def create_predictive_chart(df, forecast_period=3):
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values('Date')
    df['MonthYear'] = df['Date'].dt.to_period('M')  # Changed 'ME' to 'M'

    monthly_data = df.groupby(['MonthYear', 'Expense/Income'])['Amount (CHF)'].sum().unstack()
    monthly_data.index = monthly_data.index.to_timestamp()

    monthly_data['Month'] = monthly_data.index.month
    monthly_data['Year'] = monthly_data.index.year

    income_data = monthly_data[['Income', 'Month', 'Year']].dropna()
    expense_data = monthly_data[['Expense', 'Month', 'Year']].dropna()

    def predict(data, label):
        X = data[['Month', 'Year']]
        y = data[label]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        last_date = data.index[-1]
        future_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=forecast_period, freq='M')  # Changed 'ME' to 'M'
        future_X = pd.DataFrame({'Month': future_dates.month, 'Year': future_dates.year})

        future_pred = model.predict(future_X)

        return future_dates, future_pred

    income_dates, income_pred = predict(income_data, 'Income')
    expense_dates, expense_pred = predict(expense_data, 'Expense')

    fig = go.Figure()

    fig.add_trace(go.Scatter(x=monthly_data.index, y=monthly_data['Income'], mode='lines+markers', name='Actual Income'))
    fig.add_trace(go.Scatter(x=monthly_data.index, y=monthly_data['Expense'], mode='lines+markers', name='Actual Expense'))
    fig.add_trace(go.Scatter(x=income_dates, y=income_pred, mode='lines', name='Predicted Income', line=dict(dash='dash')))
    fig.add_trace(go.Scatter(x=expense_dates, y=expense_pred, mode='lines', name='Predicted Expense', line=dict(dash='dash')))

    fig.update_layout(
        title='Income and Expense Trends with Predictions',
        xaxis_title='Date',
        yaxis_title='Amount (CHF)',
        legend_title='Legend',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(color="#FFFFFF"),
    )

    return fig

def update_charts(tm, year, view_type, charts_pane, month=None):
    if view_type == 'Yearly':
        df = tm.get_data_for_year(year)
        income_chart = make_chart(df, year, 'Income')
        expense_chart = make_chart(df, year, 'Expense')
    else:  # Monthly view
        if month is None:
            month = datetime.now().month
        df = tm.get_data_for_month(year, month)
        income_chart = make_chart(df, year, 'Income', month)
        expense_chart = make_chart(df, year, 'Expense', month)

    sankey_chart = make_sankey_chart(df, year, view_type, month)
    # predictive_chart = create_predictive_chart(tm.df)

    charts_pane[0][0].object = income_chart
    charts_pane[0][1].object = expense_chart
    charts_pane[1].object = sankey_chart
    # charts_pane[2].object = predictive_chart