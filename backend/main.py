from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, projects, generation, export

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Document Generator API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(generation.router)
app.include_router(export.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Document Generator API"}
