from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import models, database
import firebase_admin
from firebase_admin import auth, credentials
import os

# Initialize Firebase Admin
# Check if app is already initialized to avoid errors on reload
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(database.get_db)):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        email = decoded_token.get('email')
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get or create user in local DB
    user = db.query(models.User).filter(models.User.firebase_uid == uid).first()
    if not user:
        user = models.User(email=email, firebase_uid=uid)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user
