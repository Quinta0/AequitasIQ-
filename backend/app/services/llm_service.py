# services/llm_service.py
from langchain_ollama import OllamaLLM
from typing import List, Optional
import json

class LLMService:
    def __init__(self, model_name: str = "qwen2.5:3b"):
        self.llm = OllamaLLM(model=model_name)
        self.categories = {
            "Housing": ["rent", "mortgage", "property tax", "maintenance", "repairs"],
            "Transportation": ["gas", "fuel", "car", "bus", "train", "parking", "maintenance"],
            "Food & Dining": ["grocery", "restaurant", "cafe", "food delivery"],
            "Utilities": ["electricity", "water", "gas", "internet", "phone"],
            "Healthcare": ["doctor", "medicine", "insurance", "dental", "vision"],
            "Entertainment": ["movies", "games", "streaming", "sports", "events"],
            "Shopping": ["clothes", "electronics", "home goods", "amazon"],
            "Personal Care": ["haircut", "gym", "cosmetics", "spa"],
            "Education": ["tuition", "books", "courses", "training"],
            "Investments": ["stocks", "bonds", "crypto", "savings"],
            "Income": ["salary", "freelance", "dividend", "interest"],
            "Other": []
        }

    def categorize_transaction(self, description: str) -> str:
        """
        Categorize a transaction description using the Ollama model via Langchain
        """
        prompt = f"""
        You are a financial assistant. Categorize this transaction into exactly ONE of these categories:
        {', '.join(self.categories.keys())}
        
        Here are some examples of what belongs in each category:
        {json.dumps(self.categories, indent=2)}
        
        Transaction description: {description}
        
        Consider the following:
        1. Look for keywords that match the category examples
        2. Consider the context and purpose of the transaction
        3. If unclear, use the most likely category based on the description
        4. Only return the category name, nothing else
        
        Category:
        """
        
        try:
            # Use Langchain's Ollama integration
            response = self.llm.invoke(prompt).strip()
            
            # Validate and normalize category
            return self._normalize_category(response)
            
        except Exception as e:
            print(f"Error getting category from LLM: {str(e)}")
            return "Other"

    def batch_categorize(self, descriptions: List[str]) -> List[str]:
        """
        Categorize multiple transactions at once
        """
        categories = []
        for desc in descriptions:
            try:
                category = self.categorize_transaction(desc)
                categories.append(category)
            except Exception as e:
                print(f"Error categorizing transaction '{desc}': {str(e)}")
                categories.append("Other")
        return categories

    def _normalize_category(self, category: str) -> str:
        """
        Normalize category name to match our predefined categories
        """
        # Convert to title case for consistency
        category = category.title()
        
        # Direct match
        if category in self.categories:
            return category
            
        # Try to find the closest match
        for valid_category in self.categories:
            if valid_category.lower() in category.lower():
                return valid_category
                
        return "Other"

    def suggest_category_improvements(self, transaction_history: List[dict]) -> dict:
        """
        Analyze transaction history and suggest improvements for categorization
        """
        prompt = f"""
        Analyze these transactions and suggest improvements for categorization:
        {json.dumps(transaction_history, indent=2)}
        
        Consider:
        1. Consistent categorization for similar transactions
        2. More specific categories when possible
        3. Identify uncategorized or miscategorized transactions
        
        Format your response as a JSON object with suggested changes.
        """
        
        try:
            response = self.llm.invoke(prompt)
            suggestions = json.loads(response)
            return suggestions
        except Exception as e:
            print(f"Error getting suggestions: {str(e)}")
            return {"error": "Failed to generate suggestions"}
        
    def get_financial_advice(self, prompt: str) -> str:
        try:
            response = self.llm.invoke(prompt).strip()
            return response
        except Exception as e:
            print(f"Error getting financial advice: {str(e)}")
            return "I apologize, but I'm unable to provide advice at the moment. Please try again later."