from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    firebase_uid = Column(String, unique=True, index=True) # Changed from password_hash

    projects = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, index=True)
    doc_type = Column(String) # "docx" or "pptx"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="projects")
    contents = relationship("Content", back_populates="project", cascade="all, delete-orphan")

class Content(Base):
    __tablename__ = "contents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    section_order = Column(Integer)
    title = Column(String) # Section header or Slide title
    content_text = Column(Text)
    metadata_props = Column(JSON, default={}) # Store slide layout info etc.
    feedback = Column(String, nullable=True) # "like", "dislike"
    user_notes = Column(Text, nullable=True) # User comments

    project = relationship("Project", back_populates="contents")
    refinements = relationship("RefinementHistory", back_populates="content", cascade="all, delete-orphan")

class RefinementHistory(Base):
    __tablename__ = "refinement_history"

    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey("contents.id"))
    prompt = Column(String)
    original_text = Column(Text)
    refined_text = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    content = relationship("Content", back_populates="refinements")
