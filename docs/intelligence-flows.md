# Conviction — Intelligence Flows Mind Map (Backend)

Backend-only architecture reference for Call Intelligence and Startup Intelligence. Paths are under `backend/app/` unless noted.

**One-liner:** Backend turns call text / voice and company URLs into structured VC deal intelligence (decision + IC report).

**Layer stack:**

```
HTTP request
  → routers/*          (auth, validate, orchestrate)
  → services/*         (STT, LLM pipelines, crawl/search)
  → repositories/*     (Mongo CRUD)
  → schemas/*Response  (JSON out)
```

**Auth on protected routes:** `Depends(get_current_user)` → `auth_service.decode_token` → `UserRepository.find_by_id`  
(`dependencies.py`, `services/auth_service.py`)

---

## Table of contents

1. [System overview](#1-system-overview)
2. [Call Intelligence](#2-call-intelligence)
3. [Startup Intelligence](#3-startup-intelligence)
4. [Side-by-side comparison](#4-side-by-side-comparison)
5. [Mongo collections](#5-mongo-collections)
6. [Interview talking points](#6-interview-talking-points)

---

## 1. System overview

```
Conviction Backend
├── Call Intelligence
│   Entry: POST /calls, /calls/voice, /calls/{id}/process
│   Model: synchronous (request waits for LLM)
│   Output: CallIntelligenceResponse
│
└── Startup Intelligence
    Entry: POST /startup-intelligence/reports
    Model: async BackgroundTasks; client GETs report for progress
    Output: ReportDetailResponse
```

**Shared backend modules:**

| Concern | File |
|---------|------|
| Config / API keys | `config.py` |
| Gemini JSON | `services/llm/gemini_client.py` → `call_gemini_json` |
| HuggingFace LLM | `services/llm/provider.py` → `get_llm()` / `chat_json` |
| Provider audit trail | `services/startup_intelligence/provider_log.py` → `ProviderLog` |

---

## 2. Call Intelligence

### 2.1 Purpose

Input: call notes, transcript, or audio. Optional investor thesis from profile.  
Output: structured decision + follow-ups + memory + company updates, returned as `CallIntelligenceResponse`.

**Primary file:** `routers/calls.py`

### 2.2 HTTP entry paths

```
A) TEXT / TRANSCRIPT (two-step)
   POST /calls                    → create_call          (status: pending)
   POST /calls/{id}/process       → process_call         → CallIntelligenceResponse

B) VOICE (one-shot)
   POST /calls/voice              → upload_voice_call    → STT + pipeline + CallIntelligenceResponse

C) READ existing
   GET  /calls/{id}/intelligence  → get_call_intelligence → assemble from DB
```

Also: `GET /calls`, `GET /calls/{id}` for list/detail (`CallResponse` only).

### 2.3 Mind map

```
Call Intelligence
│
├── ENTRY (routers/calls.py)
│   ├── create_call()
│   │     → CompanyRepository.find_by_id_for_user
│   │     → CallRepository.insert_one  (status=pending)
│   │     → OUT: CallResponse
│   │
│   ├── upload_voice_call()                    ★ full path in one request
│   │     ├── CompanyRepository.find_by_id_for_user
│   │     ├── transcribe_audio()               [services/stt/provider.py]
│   │     │     ├── _hf_whisper()              (priority 1)
│   │     │     └── _gemini_transcribe()       (priority 2)
│   │     │     → OUT: transcript string | None
│   │     ├── CallRepository.insert_one        (transcript_text)
│   │     ├── _get_investor_context()
│   │     │     → InvestorProfileRepository.find_by_user
│   │     │     → OUT: (thesis, fund_name, investor_name)
│   │     ├── _run_pipeline_and_persist()      ★ core orchestrator
│   │     └── _build_intelligence_response()
│   │           → OUT: CallIntelligenceResponse
│   │
│   ├── process_call()
│   │     ├── _get_call_owned()
│   │     ├── require raw_notes OR transcript_text
│   │     ├── _get_investor_context()
│   │     ├── _run_pipeline_and_persist()
│   │     └── _build_intelligence_response()
│   │
│   └── get_call_intelligence()
│         ├── DecisionRepository.find_by_call
│         ├── FollowUpRepository.find_by_company (filter call_id)
│         └── _build_intelligence_response()
│
├── CORE ORCHESTRATOR (routers/calls.py)
│   └── _run_pipeline_and_persist()
│         ├── call_repo.update_one(status="processing")
│         ├── generate_call_intelligence()     [services/call_intelligence/pipeline.py]
│         ├── decision_repo.upsert_for_call()  (idempotent by call_id)
│         ├── follow_up_repo.insert_one()      (per follow_up_action)
│         ├── memory_repo.insert_one()         (type=decision)
│         ├── call_repo.update_one(status="completed")
│         ├── company_repo.update_one()        (description, founders, latest_*)
│         ├── company_repo.increment_call_count()
│         └── OUT: decision dict (with id)
│
├── LLM PIPELINE (services/call_intelligence/pipeline.py)
│   └── generate_call_intelligence()
│         ├── build_call_intelligence_prompt() [call_intelligence/prompts.py]
│         │     + CALL_INTELLIGENCE_SYSTEM
│         ├── 1) call_gemini_json()            [llm/gemini_client.py]
│         ├── 2) get_llm().chat_json()         [llm/provider.py]
│         ├── 3) _heuristic_result()           keyword fallback
│         └── _normalize()
│               → recommendation, confidence, rationale, founders,
│                 strengths/concerns, follow_up_actions, draft_email, …
│
└── RESPONSE SCHEMA (schemas/call.py)
    └── CallIntelligenceResponse
```

### 2.4 Step-by-step — voice path

| # | Layer | Function | Does |
|---|-------|----------|------|
| 1 | Router | `upload_voice_call` | Auth, load company, read audio bytes |
| 2 | STT | `transcribe_audio` | Audio → text (HF Whisper → Gemini) |
| 3 | Repo | `CallRepository.insert_one` | Persist call + transcript |
| 4 | Helper | `_get_investor_context` | Load thesis / fund / investor name |
| 5 | Helper | `_run_pipeline_and_persist` | LLM + all Mongo writes |
| 6 | Pipeline | `generate_call_intelligence` | Gemini → HF → heuristic → `_normalize` |
| 7 | Repos | decision / follow_ups / memory / company | Persist side effects |
| 8 | Helper | `_build_intelligence_response` | Build `CallIntelligenceResponse` |

### 2.5 Who calls whom (Call)

```
upload_voice_call / process_call
  └─→ _run_pipeline_and_persist
        └─→ generate_call_intelligence
              ├─→ build_call_intelligence_prompt
              ├─→ call_gemini_json          (or)
              ├─→ get_llm().chat_json       (or)
              └─→ _heuristic_result
                    └─→ _normalize
        ├─→ DecisionRepository.upsert_for_call
        ├─→ FollowUpRepository.insert_one  (loop)
        ├─→ MemoryRepository.insert_one
        ├─→ CallRepository.update_one
        └─→ CompanyRepository.update_one / increment_call_count
  └─→ _build_intelligence_response
```

### 2.6 Data flow

```
Audio | notes
  → transcript_text | raw_notes          (calls)
  → generate_call_intelligence(...)
  → intel dict
       ├──→ decisions                    (upsert by call_id)
       ├──→ follow_ups
       ├──→ memory_entries
       └──→ companies
  → CallIntelligenceResponse
```

### 2.7 Final output

**Schema:** `schemas/call.py` → `CallIntelligenceResponse`

- `recommendation`: `strong_invest` | `invest` | `monitor` | `pass` | `need_more_info`
- `confidence` (0–100)
- `rationale`, `deal_summary`, `thesis_fit`
- `founders`, `founder_assessment`, `business_overview`, `market_assessment`
- `strengths`, `concerns`, `opportunities`, `risks`, `open_questions`
- `key_metrics`, `draft_email`, `suggested_follow_up_date`
- `follow_ups[]`, `provider_log[]`

**Mongo writes:** `calls`, `decisions`, `follow_ups`, `memory_entries`, `companies`  
**Mongo reads:** `investor_profiles` (thesis context)

---

## 3. Startup Intelligence

### 3.1 Purpose

Input: `company_name` + `website_url` (+ optional LinkedIn / user_context).  
Runs multi-stage research (crawl → search → evidence → thesis → IC memo).  
Returns `202` immediately; progress/result live on the report document via `GET`.

**Primary files:** `routers/startup_intelligence.py`, `services/startup_intelligence/pipeline.py`

### 3.2 HTTP entry points

```
POST   /startup-intelligence/reports              → start_report      (queue + BackgroundTasks)
GET    /startup-intelligence/reports              → list_reports
GET    /startup-intelligence/reports/{id}         → get_report        (status / progress / result)
DELETE /startup-intelligence/reports/{id}         → delete_report
POST   /startup-intelligence/reports/{id}/retry   → retry_report
POST   /startup-intelligence/reports/{id}/refresh → refresh_report    (force_refresh + stale cache)
GET    /startup-intelligence/cache/{domain}       → get_cache_meta
```

### 3.3 Mind map

```
Startup Intelligence
│
├── ENTRY (routers/startup_intelligence.py)
│   └── start_report()
│         ├── InvestorProfileRepository.find_by_user
│         │     → InvestorProfileSnapshot
│         ├── StartupReportRepository.insert_one
│         │     status=queued, stages=[7 pending]
│         ├── BackgroundTasks.add_task(run_research_pipeline, …)
│         └── OUT: { report_id, status: "queued" }   HTTP 202
│
├── ORCHESTRATOR (services/startup_intelligence/pipeline.py)
│   └── run_research_pipeline()                    ★ background task
│         │
│         ├── Stage 0  Checking cache
│         │     normalize_domain()                 [url_utils.py]
│         │     cache_repo.find_by_domain()
│         │     cache_repo.is_fresh()?
│         │       YES → reuse sources + EvidenceLayer  (skip 1–3)
│         │       NO  → research path
│         │
│         ├── Stage 1  Crawling website
│         │     crawl_company_website()            [crawler.py]
│         │       ├── _jina_fetch()
│         │       ├── _httpx_fetch()
│         │       └── _firecrawl_fetch()
│         │       → List[ResearchSource]
│         │
│         ├── Stage 2  Searching public web
│         │     search_company()                   [searcher.py]
│         │       └── _tavily_search() × N
│         │       → List[ResearchSource]
│         │
│         ├── Stage 3  Extracting company details
│         │     build_evidence_with_llm()          [llm_extractor.py]
│         │       ├── build_evidence_layer()       [evidence_builder.py]
│         │       ├── extract_company_intelligence() → HF chat_json
│         │       ├── _gemini_research() | _gemini_corpus_extraction()
│         │       ├── merge_llm_into_evidence()
│         │       └── boost_confidence_after_llm()
│         │       → (EvidenceLayer, EvidenceConfidence, llm_used)
│         │     cache_repo.upsert_by_domain()
│         │
│         ├── Stage 4  Scoring thesis fit
│         │     run_thesis_match_engine()          [thesis_engine.py]
│         │       └── _score_sector / _stage / _geography / _business_model
│         │       → ThesisMatch (0–100)
│         │
│         ├── Stage 5  Writing IC memo
│         │     synthesize_report()                [report_synthesizer.py]
│         │       ├── _build_synthesis_prompt()
│         │       ├── _call_gemini() → call_gemini_json
│         │       ├── _call_hf_synthesis()
│         │       └── _generate_deterministic()
│         │     dict_to_moat_analysis / red_flags / diligence_questions /
│         │       ic_memo / report_section
│         │
│         └── Stage 6  Saving report
│               report_repo.mark_completed(final_updates)
│               on error → report_repo.mark_failed()
│
├── PROGRESS
│   └── _update_stage() → report_repo.update_progress()
│         Fields: progress_percent, current_stage, stages[]
│         Read via get_report()
│
└── RESPONSE SCHEMA (schemas/startup_intelligence.py)
    └── ReportDetailResponse
```

### 3.4 Step-by-step — fresh research (no cache)

| # | Layer | Function | Does |
|---|-------|----------|------|
| 1 | Router | `start_report` | Snapshot profile, insert queued report, schedule task |
| 2 | Pipeline | `run_research_pipeline` | Drive 7 stages; write progress |
| 3 | Cache | `find_by_domain` / miss | No fresh cache → research |
| 4 | Crawler | `crawl_company_website` | Site pages → `ResearchSource[]` |
| 5 | Searcher | `search_company` | Tavily → more sources |
| 6 | Evidence | `build_evidence_with_llm` | Heuristic + HF + Gemini → `EvidenceLayer` |
| 7 | Cache | `upsert_by_domain` | Persist shared domain cache (TTL) |
| 8 | Thesis | `run_thesis_match_engine` | Score vs `InvestorProfileSnapshot` |
| 9 | Synthesis | `synthesize_report` | Gemini → HF → templates |
| 10 | Repo | `mark_completed` | Final report fields |

### 3.5 Who calls whom (Startup)

```
start_report / retry_report / refresh_report
  └─→ BackgroundTasks → run_research_pipeline
        ├─→ normalize_domain
        ├─→ cache_repo.find_by_domain / is_fresh
        ├─→ crawl_company_website
        │     └─→ _jina_fetch | _httpx_fetch | _firecrawl_fetch
        ├─→ search_company
        │     └─→ _tavily_search
        ├─→ build_evidence_with_llm
        │     ├─→ build_evidence_layer
        │     ├─→ extract_company_intelligence → get_llm().chat_json
        │     ├─→ _gemini_research | _gemini_corpus_extraction
        │     ├─→ merge_llm_into_evidence
        │     └─→ boost_confidence_after_llm
        ├─→ cache_repo.upsert_by_domain
        ├─→ run_thesis_match_engine
        ├─→ synthesize_report
        │     └─→ _call_gemini | _call_hf_synthesis | _generate_deterministic
        └─→ report_repo.mark_completed | mark_failed
```

### 3.6 Cache path

If `cache_repo.is_fresh(cache_doc)` and `force_refresh=False`:

- Stages 1–3 → **skipped**
- Reuse cached `sources`, `evidence_layer`, `evidence_confidence`
- Still run thesis scoring + synthesis (profile-specific)
- Set `cache_used=true`, `cache_age_hours=…`

`refresh_report` marks cache `stale` and runs with `force_refresh=True`.

### 3.7 Data flow

```
StartReportRequest { company_name, website_url, … }
  → startup_intelligence_reports     (queued)
  → [background]
       crawl + Tavily → ResearchSource[]
       → EvidenceLayer + EvidenceConfidence
       → startup_company_research_cache  (normalized_domain)
       → ThesisMatch
       → MoatAnalysis, RedFlags, ICMemo, ReportSection
  → report marked completed
  → GET ReportDetailResponse
```

### 3.8 Final output

**Start:** `{ report_id, status: "queued" }` (HTTP 202)

**Detail:** `schemas/startup_intelligence.py` → `ReportDetailResponse`

- Progress: `status`, `progress_percent`, `current_stage`, `stages[]`
- `thesis_match`, `moat_analysis`, `red_flags[]`, `diligence_questions[]`
- `ic_memo`, `report` (section text), `sources[]`
- `overall_confidence`, `evidence_confidence`, `provider_log[]`
- `cache_used`, `cache_age_hours`

**Mongo:** `startup_intelligence_reports`, `startup_company_research_cache`, read `investor_profiles`

---

## 4. Side-by-side comparison

| | Call Intelligence | Startup Intelligence |
|--|-------------------|----------------------|
| **Entry** | `POST /calls/voice` or `/process` | `POST /startup-intelligence/reports` |
| **Input** | Notes / transcript / audio | Website (+ optional context) |
| **Sync** | Synchronous HTTP | Async `BackgroundTasks` + GET progress |
| **Orchestrator** | `_run_pipeline_and_persist` | `run_research_pipeline` |
| **LLM core** | `generate_call_intelligence` | `build_evidence_with_llm` + `synthesize_report` |
| **Thesis** | Text injected into LLM prompt | Deterministic `run_thesis_match_engine` |
| **STT** | Yes (`transcribe_audio`) | No |
| **Crawl / search** | No | Jina / httpx / Firecrawl + Tavily |
| **Cache** | Decision upsert by `call_id` | Domain TTL cache |
| **Output schema** | `CallIntelligenceResponse` | `ReportDetailResponse` |

---

## 5. Mongo collections

```
Call Intelligence
├── calls
├── decisions              ← upsert_for_call (1 per call)
├── follow_ups
├── memory_entries
├── companies              ← latest_recommendation, founders, description
└── investor_profiles      ← read thesis

Startup Intelligence
├── startup_intelligence_reports     ← user-scoped + progress
├── startup_company_research_cache   ← domain-scoped shared evidence
└── investor_profiles                ← snapshot at start_report
```

---

## 6. Interview talking points

### Architecture

> Routers handle HTTP + auth; services own AI/crawl pipelines; repositories own Mongo. Call intelligence is a **sync** fan-out to decisions / follow-ups / memory. Startup intelligence is an **async staged** pipeline with progress fields on the report and a **shared domain cache**.

### Resilience

> LLM steps use **Gemini → HuggingFace → deterministic** fallbacks. Empty provider configs still yield structured output; `provider_log` records which path ran.

### Multi-tenancy

> User data scoped by `user_id` (`find_by_id_for_user`). Research **cache** is domain-keyed (shared evidence); **reports and thesis scores** stay user-scoped via investor profile snapshot.

### Idempotency

> `POST /calls/{id}/process` upserts the decision for that call. Startup `retry` / `refresh` reset stages and re-queue the same report id.

### File cheat sheet

| Concern | Path under `backend/app/` |
|---------|---------------------------|
| Call HTTP | `routers/calls.py` |
| Call LLM | `services/call_intelligence/pipeline.py` |
| STT | `services/stt/provider.py` |
| Startup HTTP | `routers/startup_intelligence.py` |
| Startup orchestrator | `services/startup_intelligence/pipeline.py` |
| Evidence | `…/llm_extractor.py`, `…/evidence_builder.py` |
| Thesis | `…/thesis_engine.py` |
| IC memo | `…/report_synthesizer.py` |
| Schemas | `schemas/call.py`, `schemas/startup_intelligence.py` |

---

## Quick recap (30 seconds)

**Call Intelligence:** Router receives notes or audio → optional STT → `generate_call_intelligence` (Gemini/HF/heuristic) → persist decision, follow-ups, memory, company updates → return `CallIntelligenceResponse`.

**Startup Intelligence:** Router queues a report → background `run_research_pipeline` crawls/searches → builds evidence → scores thesis → synthesizes IC memo → marks report completed → `GET` returns `ReportDetailResponse`.
