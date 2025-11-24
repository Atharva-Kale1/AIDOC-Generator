from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models, schemas, database, auth

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
)

@router.post("/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_project = models.Project(**project.dict(), user_id=current_user.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/", response_model=list[schemas.Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    projects = db.query(models.Project).filter(models.Project.user_id == current_user.id).offset(skip).limit(limit).all()
    return projects

@router.get("/{project_id}", response_model=schemas.Project)
def read_project(project_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user.id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user.id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"ok": True}

@router.put("/{project_id}/reorder")
def reorder_project_content(
    project_id: int,
    request: schemas.ReorderRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify all IDs belong to project
    contents = db.query(models.Content).filter(models.Content.project_id == project_id).all()
    content_map = {c.id: c for c in contents}
    
    for i, content_id in enumerate(request.ordered_content_ids):
        if content_id in content_map:
            content_map[content_id].section_order = i
            
    db.commit()
    return {"ok": True}

@router.post("/{project_id}/content", response_model=schemas.Content)
def create_project_content(
    project_id: int,
    content: schemas.ContentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Calculate next section order
    last_content = db.query(models.Content).filter(models.Content.project_id == project_id).order_by(models.Content.section_order.desc()).first()
    next_order = (last_content.section_order + 1) if last_content else 0
    
    db_content = models.Content(
        project_id=project_id,
        section_order=next_order,
        title=content.title,
        content_text=content.content_text,
        metadata_props=content.metadata_props
    )
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content

@router.delete("/{project_id}/content/{content_id}")
def delete_project_content(
    project_id: int,
    content_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    content = db.query(models.Content).filter(models.Content.id == content_id, models.Content.project_id == project_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
        
    db.delete(content)
    db.commit()
    return {"ok": True}

@router.post("/{project_id}/content/{content_id}/feedback")
def update_content_feedback(project_id: int, content_id: int, feedback_req: schemas.FeedbackRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    content = db.query(models.Content).filter(models.Content.id == content_id, models.Content.project_id == project_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    content.feedback = feedback_req.feedback
    db.commit()
    return {"ok": True}

@router.post("/{project_id}/content/{content_id}/notes")
def update_content_notes(project_id: int, content_id: int, notes_req: schemas.NotesRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    content = db.query(models.Content).filter(models.Content.id == content_id, models.Content.project_id == project_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    content.user_notes = notes_req.notes
    db.commit()
    return {"ok": True}
