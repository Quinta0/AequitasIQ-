from datetime import datetime

import panel as pn
from transaction_manager import TransactionManager
from dashboard_components import (
    create_transaction_form,
    create_year_selector,
    create_month_selector,
    create_view_type_selector,
    create_charts_pane,
    create_debug_info,
    create_transaction_table
)
from chart_utils import update_charts
from ajax_handlers import setup_ajax_handlers
from calendar_view import create_calendar_page

def main():
    # Initialize TransactionManager
    tm = TransactionManager('transactions.csv', 'categorized_transactions.csv')

    # Create dashboard components
    year_selector = create_year_selector(tm.get_available_years())
    month_selector = create_month_selector()
    view_type_selector = create_view_type_selector()
    charts_pane = create_charts_pane()
    transaction_form = create_transaction_form(tm, year_selector, view_type_selector, charts_pane)
    transaction_table = create_transaction_table(tm)
    debug_info = create_debug_info(tm)

    # Create initial calendar page
    calendar_page = create_calendar_page(tm, datetime.now().year, datetime.now().month)

    # Set up chart update callback
    def update_charts_callback(event):
        update_charts(tm, year_selector.value, view_type_selector.value, charts_pane, month_selector.value)

    # Set up calendar update callback
    def update_calendar_callback(event):
        nonlocal calendar_page
        calendar_page = create_calendar_page(tm, year_selector.value, datetime.strptime(month_selector.value, '%B').month)
        main_tabs[1] = ('Bill Calendar', calendar_page)

    year_selector.param.watch(update_charts_callback, 'value')
    year_selector.param.watch(update_calendar_callback, 'value')
    month_selector.param.watch(update_charts_callback, 'value')
    month_selector.param.watch(update_calendar_callback, 'value')
    view_type_selector.param.watch(update_charts_callback, 'value')

    # Initial update of charts
    update_charts_callback(None)

    # Set up AJAX handlers
    setup_ajax_handlers(tm, charts_pane)

    # Create dashboard layout
    main_tabs = pn.Tabs(
        ('Dashboard', pn.Column(charts_pane, transaction_table)),
        ('Bill Calendar', calendar_page),
        ('Debug Info', debug_info)
    )

    template = pn.template.FastListTemplate(
        title='Personal Finance Dashboard',
        sidebar=[
            pn.pane.Markdown("# Income Expense Analysis"),
            pn.pane.Markdown("Overview of income and expense based on my bank transactions. Categories are obtained using local LLMs."),
            year_selector,
            month_selector,
            view_type_selector,
            transaction_form,
            pn.widgets.Button(name='Export Categorized Transactions', button_type='primary', width=200)
        ],
        main=[main_tabs],
        header_background="#4a4a4a",
        accent_base_color="#008080",
        theme='dark',
    )

    return template

if __name__ == "__main__":
    pn.extension(notifications=True)
    dashboard = main()
    dashboard.servable()
    pn.serve(dashboard, port=5006, show=True)