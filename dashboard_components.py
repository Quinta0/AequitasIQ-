from datetime import datetime

import panel as pn


def create_transaction_form(tm, year_selector, view_type_selector, month_selector, charts_pane):
    date_input = pn.widgets.DatePicker(name='Date', value=datetime.now().date())
    description_input = pn.widgets.TextInput(name='Description')
    amount_input = pn.widgets.FloatInput(name='Amount (CHF)')
    expense_income_input = pn.widgets.Select(name='Expense/Income', options=['Expense', 'Income'])
    fixed_input = pn.widgets.Checkbox(name='Fixed')
    frequency_input = pn.widgets.Select(name='Frequency', options=['', 'Monthly', 'Quarterly', 'Semi-annual', 'Annual'])
        
    def update_dashboard():
        from chart_utils import update_charts
        if view_type_selector.value == 'Monthly':
            update_charts(tm, year_selector.value, view_type_selector.value, charts_pane, month_selector.value[0])  # Use month_selector.value[0] to get the month number
        else:
            update_charts(tm, year_selector.value, view_type_selector.value, charts_pane)

    def add_transaction(event):
        date = date_input.value
        description = description_input.value
        amount = amount_input.value
        expense_income = expense_income_input.value
        fixed = fixed_input.value
        frequency = frequency_input.value

        if all([date, description, amount, expense_income]):
            tm.add_transaction(date, description, amount, expense_income, fixed, frequency)

            # Try to show a notification, but don't fail if it's not available
            if pn.state.notifications:
                pn.state.notifications.success('Transaction added successfully!')
            else:
                print('Transaction added successfully!')

            description_input.value = ''
            amount_input.value = None
            fixed_input.value = False
            frequency_input.value = ''

            # Trigger dashboard update
            update_dashboard()
        else:
            if pn.state.notifications:
                pn.state.notifications.error('Please fill in all required fields.')
            else:
                print('Please fill in all required fields.')

    submit_button = pn.widgets.Button(name='Add Transaction', button_type='primary')
    submit_button.on_click(add_transaction)

    form = pn.Column(
        pn.pane.Markdown("## Add New Transaction"),
        date_input,
        description_input,
        amount_input,
        expense_income_input,
        fixed_input,
        frequency_input,
        submit_button
    )

    return form

def create_year_selector(available_years):
    return pn.widgets.Select(name='Select Year', options=available_years, value=max(available_years))

def create_month_selector():
    months = ['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December']
    return pn.widgets.Select(name='Select Month', options=months, value='January')

def create_view_type_selector():
    return pn.widgets.RadioButtonGroup(name='View Type', options=['Yearly', 'Monthly'], value='Yearly')

def create_charts_pane():
    income_chart_pane = pn.pane.Plotly(height=600, sizing_mode='stretch_both')
    expense_chart_pane = pn.pane.Plotly(height=600, sizing_mode='stretch_both')
    sankey_chart_pane = pn.pane.Plotly(height=600, sizing_mode='stretch_both')
    # predictive_chart_pane = pn.pane.Plotly(height=600, sizing_mode='stretch_both')

    return pn.Column(
        pn.Row(income_chart_pane, expense_chart_pane, sizing_mode='stretch_both'),
        sankey_chart_pane,
        # predictive_chart_pane,
        sizing_mode='stretch_both'
    )

def create_transaction_table(tm):
    def edit_transaction(event):
        for item in event.items:
            tm.update_transaction(item['index'], item)
        table.value = tm.df  # Refresh the table

    formatters = {
        'Date': {'type': 'datetime', 'format': 'YYYY-MM-DD'},
        'Amount (CHF)': {'type': 'numberFormatter', 'precision': 2},
        'Fixed': {'type': 'tickCross'},
    }

    table = pn.widgets.Tabulator(
        tm.df,
        pagination='remote',
        page_size=10,
        sortable=True,
        formatters=formatters,
        layout='fit_data_stretch',
        height=400
    )

    # Set up columns after initialization
    table.columns = [
        {'field': 'Date', 'title': 'Date', 'editor': 'date'},
        {'field': 'Name / Description', 'title': 'Description', 'editor': 'input'},
        {'field': 'Amount (CHF)', 'title': 'Amount (CHF)', 'editor': 'number'},
        {'field': 'Expense/Income', 'title': 'Type', 'editor': 'select', 'editorParams': {'values': ['Expense', 'Income']}},
        {'field': 'Fixed', 'title': 'Fixed', 'editor': 'tickCross'},
        {'field': 'Frequency', 'title': 'Frequency', 'editor': 'select', 'editorParams': {'values': ['', 'Monthly', 'Quarterly', 'Semi-annual', 'Annual']}},
        {'field': 'Category', 'title': 'Category', 'editor': 'input'},
    ]

    table.on_edit(edit_transaction)

    return table


def create_debug_info(tm):
    return pn.pane.Markdown(f"""
    ## Debug Information
    - Available Years: {', '.join(map(str, tm.get_available_years()))}
    - Number of Transactions: {tm.get_transaction_count()}
    - Number of Categories: {tm.get_category_count()}
    """)