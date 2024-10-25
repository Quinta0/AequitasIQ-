# AequitasIQ - Personal Finance Dashboard

AequitasIQ is a comprehensive personal finance management system that helps you track expenses, manage bills, and gain insights into your financial health. Built with modern web technologies, it offers an intuitive interface for managing your finances with advanced features like AI-powered transaction categorization and financial advice.

## Features

- 📊 Interactive dashboard with expense tracking and visualization
- 💰 Transaction management with automatic categorization
- 📅 Bill tracking and recurring payment management
- 📈 Financial insights and statistics
- 🤖 AI-powered financial advisor
- 📱 Responsive design for desktop and mobile
- 📤 CSV import functionality
- 🎯 Budget planning and tracking

## Tech Stack

### Frontend
- Next.js 14 with App Router
- TypeScript
- TailwindCSS
- shadcn/ui components
- Recharts for data visualization
- React Query for state management

### Backend
- FastAPI
- SQLAlchemy
- SQLite database
- LangChain with Ollama for AI features
- Pandas for data processing

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Quinta0/AequitasIQ-.git
cd AequitasIQ-
```

2. Start the application using Docker Compose:
```bash
docker compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development Setup

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the development server:
```bash
uvicorn main:app --reload
```

## Project Structure

```
.
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   └── types/
├── backend/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── crud/
│   └── main.py
└── data/
```

## Features Documentation

### Dashboard
The dashboard provides an overview of your financial health with:
- Monthly expense trends
- Income vs. expense comparison
- Recent transactions
- Upcoming bills
- Financial metrics like savings rate

### Transaction Management
- Add, edit, and delete transactions
- Automatic categorization using AI
- Bulk import via CSV
- Filter and search capabilities
- Transaction history visualization

### Bill Management
- Track recurring and one-time bills
- Set up payment reminders
- Categorize bills
- View upcoming payments in calendar view

### Financial Insights
- Category-wise expense breakdown
- Income source analysis
- Savings rate tracking
- Budget vs. actual spending comparison
- Custom date range analysis

### AI Financial Advisor
- Get personalized financial advice
- Analyze spending patterns
- Receive budgeting recommendations
- Smart transaction categorization

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:
1. Search existing [Issues](https://github.com/Quinta0/AequitasIQ-/issues)
2. Create a new issue if needed

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [Recharts](https://recharts.org/) for the charting library
- [Ollama](https://ollama.ai/) for the AI capabilities