from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    title: str
    doc_type: str

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    user_id: int
    created_at: datetime
    contents: List["Content"] = []
    class Config:
        from_attributes = True

# Content Schemas
class ContentBase(BaseModel):
    section_order: int
    title: str
    content_text: str
    metadata_props: Optional[Dict[str, Any]] = {}

class ContentCreate(ContentBase):
    pass

class Content(ContentBase):
    id: int
    project_id: int
    class Config:
        from_attributes = True

# Refinement Schemas
class RefinementRequest(BaseModel):
    content_id: int
    prompt: str

class RefinementHistory(BaseModel):
    id: int
    content_id: int
    prompt: str
    original_text: str
    refined_text: str
    timestamp: datetime
    class Config:
        from_attributes = True

class ReorderRequest(BaseModel):
    ordered_content_ids: List[int]

class GenerateOutlineRequest(BaseModel):
    project_id: int
    topic: str
    num_slides: Optional[int] = None
    custom_titles: Optional[List[str]] = None

class FeedbackRequest(BaseModel):
    feedback: str

class NotesRequest(BaseModel):
    notes: str
