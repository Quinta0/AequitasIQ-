import panel as pn
from chart_utils import update_charts

def handle_add_transaction(tm, date, description, amount, expense_income, fixed, frequency):
    tm.add_transaction(date, description, amount, expense_income, fixed, frequency)
    return {'status': 'success', 'message': 'Transaction added successfully'}

def handle_update_charts(tm, year, view_type, charts_pane):
    update_charts(tm, year, view_type, charts_pane)
    return {'status': 'success', 'message': 'Charts updated successfully'}

def handle_export_categorized_transactions(tm):
    tm.export_categorized_transactions()
    return {'status': 'success', 'message': 'Categorized transactions exported successfully'}

def setup_ajax_handlers(tm, charts_pane):
    pn.state.add_periodic_callback(lambda: update_charts(tm, pn.state.year, pn.state.view_type, charts_pane), period=60000)  # Update every minute

    @pn.depends('add_transaction_button')
    def add_transaction_callback(_):
        result = handle_add_transaction(
            tm,
            pn.state.date,
            pn.state.description,
            pn.state.amount,
            pn.state.expense_income,
            pn.state.fixed,
            pn.state.frequency
        )
        if result['status'] == 'success':
            pn.state.notifications.success(result['message'])
        else:
            pn.state.notifications.error(result['message'])

    @pn.depends('export_button')
    def export_callback(_):
        result = handle_export_categorized_transactions(tm)
        if result['status'] == 'success':
            pn.state.notifications.success(result['message'])
        else:
            pn.state.notifications.error(result['message'])

    pn.state.add_periodic_callback(export_callback, period=3600000)  # Export every hour
