import calendar
import os
from datetime import datetime

import pandas as pd
import panel as pn
from langchain_ollama import OllamaLLM

class BillCalendar:
    def __init__(self, bills_folder, tm):
        self.bills_folder = bills_folder
        self.tm = tm
        self.llm = OllamaLLM(model="llama3.2")
        self.bills_data = self.process_bills()

    def process_bills(self):
        bills_data = []
        if os.path.exists(self.bills_folder):
            for filename in os.listdir(self.bills_folder):
                if filename.endswith('.txt'):
                    with open(os.path.join(self.bills_folder, filename), 'r') as file:
                        content = file.read()
                        due_date, amount = self.extract_bill_info(content)
                        if due_date and amount:
                            bills_data.append({
                                'name': filename[:-4],
                                'due_date': due_date,
                                'amount': amount
                            })

        if not bills_data:
            # Return an empty DataFrame with the expected columns
            return pd.DataFrame(columns=['name', 'due_date', 'amount'])

        return pd.DataFrame(bills_data)

    def extract_bill_info(self, content):
        prompt = f"Extract the due date and amount from this bill:\n\n{content}\n\nRespond with only the due date in YYYY-MM-DD format and the amount as a number, separated by a comma."
        response = self.llm.invoke(prompt)
        try:
            due_date_str, amount_str = response.strip().split(',')
            due_date = datetime.strptime(due_date_str.strip(), '%Y-%m-%d').date()
            amount = float(amount_str.strip())
            return due_date, amount
        except:
            return None, None

    def update_dashboard(self):
        for _, bill in self.bills_data.iterrows():
            self.tm.add_transaction(
                date=bill['due_date'],
                description=f"Bill: {bill['name']}",
                amount=bill['amount'],
                expense_income='Expense',
                fixed=True,
                frequency='Monthly'  # Assuming bills are monthly, adjust if needed
            )

    def create_calendar_view(self, year, month):
        # Create a month calendar
        cal = calendar.monthcalendar(year, month)

        # Create a grid layout for the calendar
        grid = pn.GridSpec(sizing_mode='stretch_both', max_height=600)

        # Add month and year as a header
        month_name = calendar.month_name[month]
        grid[0, :] = pn.pane.Markdown(f"# {month_name} {year}", align='center')

        # Add day names
        for i, day in enumerate(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']):
            grid[1, i] = pn.pane.Markdown(f"**{day}**", align='center')

        # Populate the calendar with dates and bills
        for week_num, week in enumerate(cal, 2):
            for day_num, day in enumerate(week):
                if day != 0:
                    date = datetime(year, month, day).date()
                    bills_today = self.bills_data[self.bills_data['due_date'] == date]

                    day_content = [pn.pane.Markdown(f"**{day}**", align='center')]

                    for _, bill in bills_today.iterrows():
                        day_content.append(pn.pane.Markdown(
                            f"{bill['name']}: ${bill['amount']:.2f}",
                            styles={'color': 'red', 'font-size': '0.8em'}
                        ))

                    grid[week_num, day_num] = pn.Column(*day_content, sizing_mode='stretch_both')
                else:
                    grid[week_num, day_num] = pn.pane.Markdown("")

        return grid

def create_calendar_page(tm, year, month):
    bill_calendar = BillCalendar('bills', tm)
    bill_calendar.update_dashboard()
    calendar_view = bill_calendar.create_calendar_view(year, month)

    layout = pn.Column(
        pn.pane.Markdown("# Bill Calendar"),
        calendar_view,
        sizing_mode='stretch_width'
    )

    return layout