import requests
from typing import Optional

class LLMService:
    def __init__(self, model_url: str = "http://localhost:11434/api/generate"):
        self.model_url = model_url
        self.categories = [
            "Housing",
            "Transportation",
            "Food & Dining",
            "Utilities",
            "Healthcare",
            "Entertainment",
            "Shopping",
            "Personal Care",
            "Education",
            "Investments",
            "Income",
            "Other"
        ]

    def categorize_transaction(self, description: str) -> str:
        """
        Categorize a transaction description using the Ollama model
        """
        prompt = f"""
        Categorize this transaction into exactly ONE of these categories:
        {', '.join(self.categories)}
        
        Transaction: {description}
        
        Return only the category name, nothing else.
        """
        
        payload = {
            "model": "ollama:3.2",
            "prompt": prompt,
            "stream": False
        }
        
        try:
            response = requests.post(self.model_url, json=payload)
            response.raise_for_status()
            category = response.json()['response'].strip()
            
            # Validate category is in allowed list
            return category if category in self.categories else "Other"
            
        except Exception as e:
            print(f"Error getting category from LLM: {str(e)}")
            return "Other"

    def validate_category(self, category: str) -> bool:
        """
        Validate if a category is in the allowed list
        """
        return category in self.categories