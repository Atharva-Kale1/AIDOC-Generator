from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database, auth
import google.generativeai as genai
import os
from dotenv import load_dotenv
from typing import List
import json

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/generate", tags=["generate"])

# Initialise Gemini model with fallback handling
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    try:
        # Preferred model (if available)
        model = genai.GenerativeModel("gemini-pro-latest")
        print("DEBUG: Using Gemini model gemini-pro-latest")
    except Exception as e:
        print(f"WARN: Preferred model not available: {e}")
        # Fallback: pick first non‑preview model from list_models()
        try:
            available = genai.list_models()
            viable = [m for m in available if "preview" not in m.name.lower()]
            if not viable:
                raise RuntimeError("No suitable Gemini models available")
            fallback_name = viable[0].name
            model = genai.GenerativeModel(fallback_name)
            print(f"DEBUG: Fallback to Gemini model {fallback_name}")
        except Exception as e2:
            print(f"ERROR: Unable to obtain a Gemini model: {e2}")
            model = None
else:
    model = None
    print("WARNING: GEMINI_API_KEY not found in environment")

@router.post("/outline", response_model=List[schemas.Content])
def generate_outline(
    request: schemas.GenerateOutlineRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Generate an outline for a project using Gemini.
    Returns a list of Content objects that are created in the DB.
    """
    project = (
        db.query(models.Project)
        .filter(models.Project.id == request.project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # If custom titles are provided, use them directly
    if request.custom_titles:
        generated_contents = []
        for i, title in enumerate(request.custom_titles):
            content = models.Content(
                project_id=project.id,
                section_order=i,
                title=title,
                content_text="",
                metadata_props={},
            )
            db.add(content)
            generated_contents.append(content)
        db.commit()
        for c in generated_contents:
            db.refresh(c)
        return generated_contents

    if not model:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured or model unavailable")

    prompt = (
        f"Generate a structured outline for a {project.doc_type} document about '{request.topic}'. "
        "Return ONLY a JSON array of strings, where each string is a section header (for docx) or slide title (for pptx). "
        "Do not include any markdown formatting."
    )
    
    if request.num_slides:
        prompt += f" Generate exactly {request.num_slides} items."

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Remove optional markdown code fences
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        outline = json.loads(text)
        generated_contents = []
        for i, title in enumerate(outline):
            content = models.Content(
                project_id=project.id,
                section_order=i,
                title=title,
                content_text="",
                metadata_props={},
            )
            db.add(content)
            generated_contents.append(content)
        db.commit()
        for c in generated_contents:
            db.refresh(c)
        return generated_contents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Generation failed: {str(e)}")

@router.post("/content")
def generate_section_content(
    project_id: int,
    content_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Generate content for a specific section/slide using Gemini."""
    content = (
        db.query(models.Content)
        .filter(models.Content.id == content_id, models.Content.project_id == project_id)
        .first()
    )
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not model:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured or model unavailable")
    prompt = (
        f"Write the content for the section '{content.title}' of a {project.doc_type} document about '{project.title}'. "
        "The content should be specific to this section and fit well within the overall document flow. "
        "Keep it professional and concise. "
        "IMPORTANT: Return ONLY the content text. Do not include any conversational filler, introductory phrases, or concluding remarks. "
        "Do not say 'Here is the content' or 'Sure'. Just the content. "
        "Do not include the slide title or 'Slide X' in the output."
    )
    try:
        response = model.generate_content(prompt)
        content.content_text = response.text
        db.commit()
        db.refresh(content)
        return content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Generation failed: {str(e)}")

@router.post("/refine", response_model=schemas.Content)
def refine_content(
    request: schemas.RefinementRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Refine existing content using Gemini based on a user prompt."""
    content = db.query(models.Content).filter(models.Content.id == request.content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    # Verify ownership via project
    project = (
        db.query(models.Project)
        .filter(models.Project.id == content.project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not model:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured or model unavailable")
    prompt = (
        f"Original text: {content.content_text}\n\n"
        f"Refinement instruction: {request.prompt}\n\n"
        "Rewrite the text based on the instruction. "
        "IMPORTANT: Return ONLY the refined text. Do not include any conversational filler."
    )
    try:
        response = model.generate_content(prompt)
        refined_text = response.text
        # Save history
        history = models.RefinementHistory(
            content_id=content.id,
            prompt=request.prompt,
            original_text=content.content_text,
            refined_text=refined_text,
        )
        db.add(history)
        # Update content
        content.content_text = refined_text
        db.commit()
        db.refresh(content)
        return content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Refinement failed: {str(e)}")
