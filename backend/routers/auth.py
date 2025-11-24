from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import models, schemas, database, auth
from datetime import timedelta
import os
import json
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

router = APIRouter(
    tags=["auth"],
)

# Initialize Firebase Admin
cred_path = "serviceAccountKey.json"
if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
else:
    # Fallback to environment variable for production
    cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if cred_json:
        try:
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)
        except json.JSONDecodeError:
             print("ERROR: Invalid JSON in FIREBASE_CREDENTIALS_JSON")
             cred = None
    else:
        print("WARNING: No Firebase credentials found (file or env var). Auth will fail.")
        cred = None

if cred:
    try:
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass # App already initialized

@router.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Verify Firebase Token
    try:
        decoded_token = firebase_auth.verify_id_token(user.password) # We send token as password from frontend
        uid = decoded_token['uid']
        email = decoded_token['email']
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication token: {str(e)}")

    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        # If user exists, just return them (login)
        return db_user
    
    # Create new user
    db_user = models.User(email=email, firebase_uid=uid)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=schemas.User)
def login(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
     # Verify Firebase Token
    try:
        decoded_token = firebase_auth.verify_id_token(user.password) # We send token as password from frontend
        uid = decoded_token['uid']
        email = decoded_token['email']
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication token: {str(e)}")

    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        # Auto-register if not found
        db_user = models.User(email=email, firebase_uid=uid)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    
    return db_user
