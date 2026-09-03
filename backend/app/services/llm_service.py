import logging
from groq import Groq, APIConnectionError, RateLimitError, AuthenticationError, BadRequestError, NotFoundError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from sqlalchemy.orm import Session
from app.models.settings import ApplicationSetting
from app.models.usage import LLMUsage
from app.core.config import settings

logger = logging.getLogger(__name__)

# Cache the Groq client
_groq_client = None

def get_groq_client(db: Session) -> Groq:
    global _groq_client
    if _groq_client is not None:
        return _groq_client

    # Try to read from ApplicationSettings
    api_key_setting = db.query(ApplicationSetting).filter(ApplicationSetting.key == "groq_api_key").first()
    api_key = api_key_setting.value if (api_key_setting and api_key_setting.value) else settings.GROQ_API_KEY

    if not api_key:
        raise ValueError("Groq API key not configured in settings or environment.")

    _groq_client = Groq(api_key=api_key.strip())
    return _groq_client

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((APIConnectionError, RateLimitError))
)
def _generate_completion_with_retry(client: Groq, messages: list, model: str, temperature: float, max_tokens: int, response_format: dict = None):
    kwargs = {
        "messages": messages,
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    if response_format:
        kwargs["response_format"] = response_format
    return client.chat.completions.create(**kwargs)

DEFAULT_MODEL = "openai/gpt-oss-20b"
DEEP_ANALYSIS_MODEL = "openai/gpt-oss-120b"
FALLBACK_MODELS = [
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b",
    "groq/compound-mini",
    "groq/compound"
]

def generate_completion(
    db: Session, 
    user_id: str, 
    messages: list[dict], 
    temperature: float = 0.2, 
    max_tokens: int = 1024,
    response_format: dict = None,
    model: str = None
) -> str:
    client = get_groq_client(db)
    
    if not model:
        model_setting = db.query(ApplicationSetting).filter(ApplicationSetting.key == "groq_model").first()
        model = model_setting.value if (model_setting and model_setting.value) else DEFAULT_MODEL

    # Try requested model first, then try all fallback models
    candidate_models = [model] + [m for m in FALLBACK_MODELS if m != model]

    last_error = None
    for cand in candidate_models:
        try:
            response = _generate_completion_with_retry(
                client=client,
                messages=messages,
                model=cand,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format=response_format
            )
            
            # Log usage if available
            if hasattr(response, "usage") and response.usage:
                usage = LLMUsage(
                    user_id=user_id,
                    endpoint="chat.completions",
                    model=cand,
                    prompt_tokens=response.usage.prompt_tokens,
                    completion_tokens=response.usage.completion_tokens
                )
                db.add(usage)
                db.commit()

            return response.choices[0].message.content

        except (BadRequestError, NotFoundError) as e:
            logger.warning(f"Groq model '{cand}' not available ({str(e)}). Trying next candidate model...")
            last_error = e
            continue
        except Exception as e:
            logger.error(f"Groq API call error on model '{cand}': {str(e)}")
            last_error = e
            continue

    raise last_error or RuntimeError("All Groq LLM model attempts failed.")
