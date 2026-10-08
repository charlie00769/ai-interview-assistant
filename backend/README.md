# Backend setup
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # add your key, set LLM_PROVIDER
uvicorn main:app --reload
# Test: http://localhost:8000/docs
