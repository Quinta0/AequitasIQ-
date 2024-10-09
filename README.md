# AequitasIQ

## Overview

AequitasIQ is an intelligent financial analysis tool that creates an interactive dashboard to visualize personal income and expenses. Combining the principles of fairness (Aequitas) with artificial intelligence (IQ), it uses machine learning to categorize transactions and presents data through intuitive charts and graphs, offering smart, balanced insights into your financial world.

## Features

- AI-powered categorization of transactions using Ollama LLM
- Interactive dashboard with clear, equitable representation of financial data
- Comprehensive analysis of income and expenses
- Automatic calculation of saving rates
- Support for multi-year data (focused on current and future years)
- Intelligent date parsing to handle potential errors in transaction dates

## Requirements

- Python 3.7+
- Pandas
- NumPy
- Plotly
- Panel
- Langchain Community
- Pydantic
- Ollama (with the llama3.1 8B model or 3.2 3B for less RAM and GPU usage)

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/Quinta0/AequitasIQ-.git
   cd AequitasIQ-
   ```

2. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

4. Ensure you have Ollama installed and the llama3.1 model available.

## Usage

1. Prepare your transaction data:
   - Create a CSV file named `transactions.csv` with the following columns:
     - Date
     - Name / Description
     - Expense/Income
     - Amount (CHF)
   - Ensure the dates are in the format YYYY-MM-DD
   - Place this file in the same directory as the script

2. Add an image named `picture.png` in the same directory for the dashboard sidebar (optional)

3. Run the script:
   ```
   python main.py
   ```

4. The AequitasIQ dashboard will open in your default web browser, providing balanced insights into your finances

## Dashboard Layout

The AequitasIQ dashboard consists of two tabs, one for the current year and one for the next year. Each tab contains:

- A pie chart showing the fair distribution of income sources
- A pie chart revealing the balanced allocation of expenses by category
- A bar chart illustrating the trend of monthly income
- A bar chart depicting the pattern of monthly expenses

## Customization

- To change the currency, modify the "CHF" references in the code to your preferred currency
- Adjust the `category_mappings` dictionary in the `clean_categories` function to customize category groupings and ensure fair representation of your financial data

## Troubleshooting

- If you encounter date parsing errors, check that your CSV file uses the YYYY-MM-DD format
- Ensure that the Ollama service is running and the llama3.1 model is available
- For any categorization errors, review the console output for specific error messages

## Contributing

Contributions to AequitasIQ are welcome! Please fork the repository and submit a pull request with your intelligent improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- This project uses the Ollama LLM for intelligent transaction categorization
- Dashboard creation is powered by the analytical capabilities of Panel and Plotly

