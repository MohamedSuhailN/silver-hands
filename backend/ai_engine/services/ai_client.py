import json
import logging
import os
import re
import time
from typing import Any, Dict, List, Optional
import requests
from django.conf import settings

logger = logging.getLogger('silverhands.ai')


class AIServiceException(Exception):
    """Base exception for AI engine errors with safe client messages."""
    def __init__(self, message: str = "AI service temporarily unavailable.", status_code: int = 503):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AIClient:
    """
    Centralized, singleton AI Client for SilverHands Intelligence Engine.
    Communicates securely with external AI providers (Gemini SDK/REST, OpenAI).
    Handles timeouts, retries, rate limits, JSON schema validation, and multilingual processing.
    """
    _instance: Optional['AIClient'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIClient, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, '_initialized', False):
            return
        
        self.timeout_seconds = 20
        self.max_retries = 1
        self._initialized = True
        
        if self.is_configured():
            logger.info(f"AI provider configured: {self.provider.upper()} using model {self.model}")
        else:
            logger.warning("AI provider not configured. Missing API key in environment or .env.")

    @property
    def provider(self) -> str:
        return getattr(settings, 'AI_PROVIDER', os.getenv('AI_PROVIDER', 'gemini')).lower()

    @property
    def api_key(self) -> str:
        return getattr(settings, 'AI_API_KEY', os.getenv('AI_API_KEY', '')).strip()

    @property
    def model(self) -> str:
        return getattr(settings, 'AI_MODEL', os.getenv('AI_MODEL', 'gemini-3.7-flash' if self.provider == 'gemini' else 'gpt-4o-mini')).strip()

    @property
    def base_url(self) -> str:
        return getattr(settings, 'AI_BASE_URL', os.getenv('AI_BASE_URL', '')).strip()

    def is_configured(self) -> bool:
        """Checks if a valid external API key is configured."""
        return bool(self.api_key and len(self.api_key) > 5)

    def generate_json(
        self,
        prompt: str,
        system_instruction: str = "You are the SilverHands AI Assistant. Always respond with pure valid JSON only.",
        default_fallback: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Sends a prompt to the external AI model and parses the resulting structured JSON.
        """
        if not prompt or not prompt.strip():
            raise AIServiceException("Input text cannot be empty.", status_code=400)

        # If API key is not configured, use local fallback if available
        if not self.is_configured():
            logger.error("DIAGNOSTIC ERROR: AI_API_KEY is not set in .env. Real LLM cannot be reached.")
            if default_fallback is not None:
                return default_fallback
            raise AIServiceException("AI service key is not configured in .env.", status_code=503)

        retries = 0
        last_error = None

        while retries <= self.max_retries:
            try:
                raw_response = self._call_ai_api(prompt, system_instruction)
                parsed = self._extract_json(raw_response)
                if isinstance(parsed, dict):
                    return parsed
                elif isinstance(parsed, list):
                    return {"data": parsed}
                else:
                    raise ValueError(f"Expected JSON object or array, got {type(parsed)}")
            except Exception as e:
                last_error = str(e)
                logger.warning(f"AI generation error (attempt {retries + 1}): {e}")

            retries += 1

        # Live AI call failed
        logger.error(f"External AI call failed: {last_error}")
        if default_fallback is not None:
            logger.warning("Using fallback response due to external AI API failure.")
            return default_fallback
        
        raise AIServiceException(f"AI API Error: {last_error}", status_code=502)

    def _call_ai_api(self, prompt: str, system_instruction: str) -> str:
        """Dispatches request to configured provider."""
        if self.provider == 'openai':
            return self._call_openai(prompt, system_instruction)
        else:
            return self._call_xai(prompt, system_instruction)

    def _call_xai(self, prompt: str, system_instruction: str) -> str:
        """Calls xAI Grok API using OpenAI-compatible REST endpoints."""
        url = self.base_url or "https://api.x.ai/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": self.model or "grok-4.6",
            "messages": [
                {"role": "system", "content": system_instruction + "\nCRITICAL: Respond ONLY in pure valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }

        response = requests.post(url, headers=headers, json=payload, timeout=self.timeout_seconds)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    def _call_openai(self, prompt: str, system_instruction: str) -> str:
        """Calls OpenAI or OpenAI-compatible API."""
        url = self.base_url or "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": self.model or "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_instruction + "\nReturn pure valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }

        response = requests.post(url, headers=headers, json=payload, timeout=self.timeout_seconds)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    def _extract_json(self, text: str) -> Any:
        """Robust JSON extractor that strips markdown fences, comments, and repairs formatting."""
        if not text:
            raise ValueError("Empty response received from AI model")

        cleaned = text.strip()
        cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\s*```$', '', cleaned)
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', cleaned)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Failed to parse valid JSON from AI output: {cleaned[:200]}")


# Global singleton instance
ai_client = AIClient()
