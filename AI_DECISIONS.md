# AI Decisions Audit Log

This document tracks triage routing accuracy updates, system evaluations, and LLM configuration changes for the Frontline AI Triage engine.

---

## Model & Tools

- **Model**: Groq API + `llama-3.3-70b-versatile`
- **Why Groq**: Free tier access, low latency (~800ms average per classification), strong instruction-following capabilities, and native JSON response format support.
- **Why this model**: Best balance of speed and accuracy on structured classification tasks. The 70B parameter size provides strong reasoning for edge cases (sarcasm, multi-issue messages, non-English) while Groq's inference engine keeps latency under 2 seconds.

## Prompt Strategy

- **Structured JSON output** enforced via `response_format={"type": "json_object"}` — eliminates markdown wrapping and free-text responses.
- **Temperature 0.0** for deterministic, reproducible classification across identical inputs.
- **Explicit priority level definitions** (P0–P3) with business impact context so the model understands urgency, not just keywords.
- **Confidence calibration tiers** defined in prompt:
  - `0.9–1.0` → Single clear issue, obvious category
  - `0.7–0.9` → Mostly clear, minor ambiguity
  - `0.5–0.7` → Vague message, multiple interpretations
  - `0.0–0.5` → Automatically sets `needs_human=true`
- **Multi-issue tie-breaking**: Highest priority issue wins as primary category. If ANY issue is P0-level, the entire ticket is P0. All issues mentioned in summary.
- **Non-English detection**: Classify based on content regardless of language, prefix summary with `[LANG: xx]` ISO code.
- **Sarcasm detection**: Explicit rules to watch for ironic praise after failure descriptions, contradictions between tone and situation. Sarcastic complaints are never classified as "feedback."

## Injection Defense

- **Prompt-level SECURITY RULE** is the first instruction in the system prompt — establishes that message content cannot override classifier behavior.
- **HTML/script sanitization** via BeautifulSoup4 strips all `<script>`, `<style>`, and HTML tags before the message reaches the model.
- **Input normalization** (`normalizer.py`) processes and strips dangerous content from JSON, HTML, CSV, PDF, and raw bytes before classification.
- **Model instructed to classify, never obey** — any override attempt is automatically flagged as `security_flag` category with `needs_human=true`.

## Handling Uncertainty

- **Confidence < 0.5** automatically sets `needs_human=true` per the prompt's confidence scoring rules.
- **Vague/garbage input** returns `unclassifiable` category with `confidence: 0.0`.
- **`UNCLASSIFIABLE_INPUT` sentinel** — the normalizer returns this string for empty, null, or meaningless input. The model is explicitly instructed to classify it as `unclassifiable`.
- **Timeout errors** gracefully degrade to `needs_human=true` with `timeout_error` category (15-second per-message timeout in batch mode).
- **API rate limits (429)** trigger exponential backoff retries (up to 3 attempts) before falling back to a safe default decision.

## Handling Bad Input

- **`normalizer.py`** handles all input formats in a strict pipeline:
  1. Null/empty → `UNCLASSIFIABLE_INPUT`
  2. JSON string → parse and recursively extract all text values
  3. HTML → BeautifulSoup tag stripping with script/style decomposition
  4. CSV → extract longest text field
  5. PDF bytes → `pypdf` page text extraction
  6. Plain text → strip whitespace
  7. Length validation → reject if fewer than 3 alphanumeric characters
  8. Final safety pass → `sanitize_html()` on all output
- **Every case wrapped in `try/except`** — the normalizer never crashes, always returns a string.
- **`sanitize_html()`** runs as the final safety pass on ALL input regardless of format.

## Evaluation Results

- **10 hand-labeled ground truth messages** covering diverse scenarios.
- **Categories tested**: billing, injection, sarcasm, non-English, P0 outage, garbage/gibberish, multi-issue, out-of-scope, angry P1, simple P3 question.
- **Agreement rate: 100%** (10/10 exact match on category + priority + needs_human).
- **Known failure modes**:
  - Confidence score tends toward 0.9 for most inputs — the model is overconfident and doesn't use the full 0.0–1.0 range effectively.
  - Occasional category invention on extreme edge cases not covered by the allowed list (mitigated by strict enum validation in Pydantic).

## Cost & Latency

| Metric | Value |
|---|---|
| Average latency per message | ~800–1500ms |
| Batch of 40 messages | ~65 seconds (with 1.5s rate limit buffer between messages) |
| Groq free tier limit | 14,400 requests/day, 100,000 tokens/day |
| Estimated cost | **$0** on free tier |
| Timeout per message | 15 seconds (batch mode) |

## What We Would Fix With More Time

- **Fine-tune confidence calibration** so scores are more distributed and meaningful instead of clustering at 0.9.
- **Add streaming responses** for real-time UI updates during batch processing.
- **Add webhook support** to push triage decisions to Slack or ticketing systems (Jira, Linear) automatically.
- **Expand ground truth** from 10 to 100+ labeled messages for statistically significant evaluation.
- **Add per-category precision/recall** metrics to the evaluation report instead of just overall agreement rate.
- **Implement A/B prompt testing** to compare prompt variations and track classification drift over time.
