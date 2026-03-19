# Pioneer Extraction Arena

Next.js hackathon demo: **parallel NER inference** (Base GLiNER vs fine-tuned job), arcade UI, optional **benchmark eval**, and **fine-tuning** against Pioneer’s API.

**Demo:** [Jam recording](https://jam.dev/c/f9d1c6ec-e38e-473f-9382-a0d1f661edc8)

---

## What each action does

| Action | Pioneer API | Notes |
|--------|-------------|--------|
| **Run Extraction** | `POST /inference` only | Entity extraction on **pasted text**. F1 in the score cards is **estimated** for the demo, not dataset eval. |
| **Run eval** (panel) | `POST /felix/evaluations` → poll `GET /felix/evaluations/:id` | **Benchmark** on a **labeled eval dataset** — real metrics when Pioneer returns them. |
| **Fine-tune → Start training** | `POST /felix/training-jobs` | Uses the **training** dataset you pick; eval dataset is for your workflow / **Run eval**, not auto-run after training. |

**Important:** **Run Extraction ≠ eval.** Inference answers “what entities for this text?” Eval answers “how good is the model on a fixed labeled set?”

---

## Quick start (local)

```bash
cd pioneer-extraction-arena
cp .env.example .env.local
# Add PIONEER_API_KEY — never commit .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Without** `PIONEER_API_KEY`: inference falls back to **synthetic** output; header shows **Inference: no key (demo)**.
- **With** key: real `POST /inference` when Pioneer accepts your `model_id`s; header shows **Live API**, **Mixed**, or **Synthetic** after each run (see tooltip).

---

## API routes (thin proxies)

| App route | Pioneer |
|-----------|---------|
| `POST /api/inference` | `POST /inference` |
| `GET /api/models` | `GET /felix/training-jobs` (completed jobs for fine-tuned lane) |
| `GET /api/models?allStatuses=1` | Same + `allJobs` / `counts` |
| `GET /api/datasets` | `GET /felix/datasets` |
| `GET /api/deployments` | `GET /felix/deployments` |
| `POST /api/evaluations` | `POST /felix/evaluations` |
| `GET /api/evaluations` | `GET /felix/evaluations` (list) |
| `GET /api/evaluations/[id]` | `GET /felix/evaluations/:id` |
| `POST /api/training` | `POST /felix/training-jobs` |
| `GET /api/training/[id]` | `GET /felix/training-jobs/:id` |
| `GET /api/config` | Public defaults + `hasApiKey` (boolean only) |
