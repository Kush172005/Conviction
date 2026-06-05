"""
Seed script for development — inserts realistic RTP Global deal flow.
Run: python -m app.db_seed
"""
import asyncio
from datetime import datetime, timedelta
from app.db import get_database, close_client


SEED_USER = {
    "google_id": "mock_arjun@rtpglobal.com",
    "email": "arjun@rtpglobal.com",
    "name": "Arjun Mehta",
    "onboarding_completed": True,
    "created_at": datetime.utcnow() - timedelta(days=120),
    "updated_at": datetime.utcnow(),
}

SEED_COMPANIES = [
    {
        "name": "Veridian AI",
        "website": "https://veridian.ai",
        "industry": "AI Infrastructure",
        "description": "Building the compliance layer for enterprise AI deployments.",
        "founders": [
            {"name": "Priya Anand", "role": "CEO", "background": "Ex-Google Brain, PhD Stanford ML"},
            {"name": "Sam Torres", "role": "CTO", "background": "Ex-Palantir"},
        ],
        "status": "active",
        "stage": "seed",
        "location": "San Francisco, CA",
        "call_count": 4,
        "enrichment_status": "completed",
        "total_funding": "$2.4M",
    },
    {
        "name": "Formless",
        "website": "https://formless.so",
        "industry": "Developer Tools",
        "description": "Schema-first API development platform.",
        "founders": [{"name": "David Kim", "role": "CEO", "background": "Ex-Stripe"}],
        "status": "tracking",
        "stage": "pre-seed",
        "call_count": 2,
        "enrichment_status": "completed",
    },
]


async def seed():
    db = get_database()

    # Clear existing seed data
    await db.users.delete_many({"email": "arjun@rtpglobal.com"})

    # Insert user
    user_result = await db.users.insert_one(SEED_USER)
    user_id = str(user_result.inserted_id)
    print(f"Seeded user: {user_id}")

    # Insert investor profile
    await db.investor_profiles.delete_many({"user_id": user_id})
    await db.investor_profiles.insert_one({
        "user_id": user_id,
        "fund_name": "RTP Global",
        "investor_name": "Arjun Mehta",
        "investment_thesis": "We invest in category-defining B2B software companies with strong founder-market fit.",
        "preferred_sectors": ["B2B SaaS", "AI Infrastructure", "Developer Tools"],
        "preferred_stages": ["seed", "series-a"],
        "typical_check_size": "$1M-$5M",
        "geographies": ["US", "India", "Europe"],
        "investment_style": "lead",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })
    print("Seeded investor profile")

    # Insert companies
    for company_data in SEED_COMPANIES:
        company_data["user_id"] = user_id
        company_data.setdefault("enrichment_status", "not_started")
        company_data.setdefault("call_count", 0)
        company_data.setdefault("founders", [])
        company_data["created_at"] = datetime.utcnow() - timedelta(days=60)
        company_data["updated_at"] = datetime.utcnow()
        await db.companies.insert_one(company_data)
        print(f"Seeded company: {company_data['name']}")

    print("\nSeed complete! Restart the API and log in with arjun@rtpglobal.com")
    await close_client()


if __name__ == "__main__":
    asyncio.run(seed())
