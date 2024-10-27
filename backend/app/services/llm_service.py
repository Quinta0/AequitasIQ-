# services/llm_service.py
from langchain_ollama import OllamaLLM
from typing import List, Dict, Optional, Union
import json
import re
from datetime import datetime

class BaseAgent:
    def __init__(self, name: str, llm=None):
        self.name = name
        self.llm = llm

    def handle_error(self, error: Exception, fallback_response: any) -> any:
        print(f"{self.name} error: {str(error)}")
        return fallback_response

    def process(self, task: Dict) -> Dict:
        raise NotImplementedError("Each agent must implement process method")

class DelegatorAgent(BaseAgent):
    def __init__(self, llm=None):
        super().__init__("Delegator Agent", llm)
        self.agents = {}
        self.task_mapping = {
            "categorize": "CategoryAgent",
            "categorize_batch": "CategoryAgent",
            "analyze": "AnalysisAgent",
            "advise": "AdvisorAgent",
            "predict": "PredictionAgent",
            "optimize": "OptimizationAgent"
        }

    def register_agent(self, agent: BaseAgent):
        self.agents[agent.__class__.__name__] = agent

    def process(self, task: Dict) -> Dict:
        try:
            task_type = task.get("type", "unknown")
            agent_name = self.task_mapping.get(task_type)
            
            if not agent_name:
                return {"error": f"Unknown task type: {task_type}"}
                
            agent = self.agents.get(agent_name)
            if not agent:
                return {"error": f"No agent available for task: {task_type}"}
                
            print(f"Delegating {task_type} task to {agent_name}")
            return agent.process(task)
            
        except Exception as e:
            return self.handle_error(e, {
                "error": f"Delegation failed: {str(e)}",
                "task_type": task.get("type", "unknown")
            })

class CategoryAgent(BaseAgent):
    def __init__(self, llm=None):
        super().__init__("Category Agent", llm)
        self.categories = {
            "Fixed Income": [
                "salary", "wage", "pension", "rental income", "fixed interest", 
                "lease", "monthly pay", "paycheck", "stipend"
            ],
            "Fixed Expenses": [
                "rent", "mortgage", "insurance", "subscription", "loan payment",
                "car payment", "netflix", "spotify", "gym membership"
            ],
            "Housing": [
                "property tax", "maintenance", "repairs", "utilities", "hoa",
                "renovation", "cleaning", "furniture", "appliances", "home"
            ],
            "Transportation": [
                "gas", "fuel", "car", "bus", "train", "parking", "uber", "lyft",
                "taxi", "metro", "subway", "bicycle", "maintenance", "repair"
            ],
            "Food & Dining": [
                "grocery", "restaurant", "cafe", "food delivery", "takeout",
                "coffee", "snacks", "supermarket", "meal", "dining", "migros", "coop"
            ],
            "Utilities": [
                "electricity", "water", "gas", "internet", "phone", "heating",
                "garbage", "sewage", "cable", "telecommunication"
            ],
            "Healthcare": [
                "doctor", "medicine", "insurance", "dental", "vision",
                "pharmacy", "hospital", "clinic", "medical", "healthcare"
            ],
            "Entertainment": [
                "movies", "games", "streaming", "sports", "events",
                "concert", "theater", "netflix", "spotify", "hobby"
            ],
            "Shopping": [
                "clothes", "electronics", "home goods", "amazon", "retail",
                "shoes", "accessories", "department store", "online shopping"
            ],
            "Personal Care": [
                "haircut", "gym", "cosmetics", "spa", "beauty",
                "salon", "skincare", "grooming", "wellness"
            ],
            "Education": [
                "tuition", "books", "courses", "training", "school",
                "university", "college", "education", "workshop", "seminar"
            ],
            "Investments": [
                "stocks", "bonds", "crypto", "savings", "investment",
                "mutual fund", "etf", "trading", "dividend", "securities"
            ],
            "Variable Income": [
                "bonus", "freelance", "dividend", "interest", "commission",
                "overtime", "tip", "gift", "refund", "side hustle"
            ],
        }
        
        self.category_patterns = {
            category: re.compile('|'.join(rf'\b{keyword}\b' 
                for keyword in keywords), re.IGNORECASE)
            for category, keywords in self.categories.items()
        }

    def categorize_by_rules(self, description: str, is_fixed: bool = False, transaction_type: str = 'expense') -> str:
        if is_fixed:
            return "Fixed Income" if transaction_type == 'income' else "Fixed Expenses"
        
        for category, pattern in self.category_patterns.items():
            if pattern.search(description):
                return category
        return "Other"

    def process(self, task: Dict) -> Dict:
        try:
            if task["type"] == "categorize":
                category = self.categorize_by_rules(
                    task["description"],
                    task.get("is_fixed", False),
                    task.get("transaction_type", "expense")
                )
                return {"category": category}
                
            elif task["type"] == "categorize_batch":
                results = []
                for transaction in task["transactions"]:
                    category = self.categorize_by_rules(
                        transaction["description"],
                        transaction.get("is_fixed", False),
                        transaction.get("type", "expense")
                    )
                    results.append({
                        "description": transaction["description"],
                        "category": category
                    })
                return {"results": results}
                
        except Exception as e:
            return self.handle_error(e, {"category": "Other"})

class AnalysisAgent(BaseAgent):
    def __init__(self, llm=None):
        super().__init__("Analysis Agent", llm)

    def process(self, task: Dict) -> Dict:
        try:
            transactions = task.get("transactions", [])
            analysis_type = task.get("analysis_type", "general")
            
            if analysis_type == "spending_patterns":
                return self.analyze_spending_patterns(transactions)
            elif analysis_type == "category_distribution":
                return self.analyze_category_distribution(transactions)
            else:
                return self.general_analysis(transactions)
                
        except Exception as e:
            return self.handle_error(e, {
                "error": "Analysis failed",
                "patterns": [],
                "insights": []
            })

    def analyze_spending_patterns(self, transactions: List[Dict]) -> Dict:
        try:
            # Group by category and calculate totals
            category_totals = {}
            for t in transactions:
                category = t.get("category", "Other")
                amount = float(t.get("amount", 0))
                category_totals[category] = category_totals.get(category, 0) + amount

            return {
                "patterns": {
                    "category_totals": category_totals,
                    "total_spend": sum(category_totals.values())
                }
            }
        except Exception as e:
            return self.handle_error(e, {"patterns": {}})

class AdvisorAgent(BaseAgent):
    def __init__(self, llm=None):
        super().__init__("Advisor Agent", llm)

    def process(self, task: Dict) -> Dict:
        if not self.llm:
            return self.handle_error(Exception("No LLM available"), 
                {"advice": "Unable to provide advice without LLM"})

        try:
            prompt = self.create_advice_prompt(task)
            response = self.llm.invoke(prompt).strip()
            return {"advice": response}
        except Exception as e:
            return self.handle_error(e, {"advice": "Failed to generate advice"})

    def create_advice_prompt(self, task: Dict) -> str:
        return f"""
        As a financial advisor, analyze this situation:
        {json.dumps(task.get('data', {}), indent=2)}
        
        Provide specific advice considering:
        1. Income and spending patterns
        2. Fixed vs variable costs
        3. Savings opportunities
        4. Risk factors
        
        Format your response in clear, actionable bullet points.
        """

class LLMService:
    def __init__(self, model_name: str = "llama3.2"):
        try:
            llm = OllamaLLM(model=model_name)
        except Exception as e:
            print(f"Warning: Could not initialize LLM: {str(e)}")
            llm = None

        # Initialize agents
        self.delegator = DelegatorAgent(llm)
        self.delegator.register_agent(CategoryAgent(llm))
        self.delegator.register_agent(AnalysisAgent(llm))
        self.delegator.register_agent(AdvisorAgent(llm))

    def process_task(self, task_type: str, **kwargs) -> Dict:
        task = {"type": task_type, **kwargs}
        return self.delegator.process(task)

    def categorize_transaction(self, description: str, is_fixed: bool = False, transaction_type: str = 'expense') -> str:
        result = self.process_task(
            "categorize",
            description=description,
            is_fixed=is_fixed,
            transaction_type=transaction_type
        )
        return result.get("category", "Other")

    def batch_categorize(self, transactions: List[Dict]) -> List[str]:
        result = self.process_task(
            "categorize_batch",
            transactions=transactions
        )
        return [r.get("category", "Other") for r in result.get("results", [])]

    def analyze_transactions(self, transactions: List[Dict], analysis_type: str = "general") -> Dict:
        return self.process_task(
            "analyze",
            transactions=transactions,
            analysis_type=analysis_type
        )

    def get_financial_advice(self, data: Dict) -> str:
        result = self.process_task("advise", data=data)
        return result.get("advice", "Unable to provide advice at this time")