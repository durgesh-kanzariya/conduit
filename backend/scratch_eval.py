import asyncio
import sys
import os

# Add parent dir to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.engine.evaluator import run_evaluation

async def main():
    print("Running Groq evaluation...")
    report = await run_evaluation(provider="groq")
    print(f"Agreement rate: {report.agreement_rate}%")
    print(f"Passed: {report.passed}/{report.total}")
    print("\nFailures:")
    for failure in report.failures:
        print(f"ID {failure.id}: Expected (cat: {failure.expected_category}, prio: {failure.expected_priority}, human: {failure.expected_needs_human})")
        print(f"       Got      (cat: {failure.got_category}, prio: {failure.got_priority}, human: {failure.got_needs_human})")
        print(f"       Message: {failure.raw_message[:100]}...")

if __name__ == "__main__":
    asyncio.run(main())
