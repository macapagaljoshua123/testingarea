from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
import uuid

# --- CONFIGURATION ---
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:Admin123@localhost:5432/testingarea"
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# --- DATABASE SETUP ---
try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    # Test the connection immediately
    with engine.connect() as connection:
        print("✅ DATABASE CONNECTION: SUCCESS!")
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    
    # Define models first, then create tables
    # (Models are defined below, so we move create_all to the bottom or after models)
except Exception as e:
    print("❌ DATABASE CONNECTION: FAILED")
    print(f"ERROR: {e}")
    print("Check if: 1. PostgreSQL is running. 2. Password is correct. 3. Database 'testingarea' exists.")
    Base = declarative_base()
    engine = None

# --- MODELS ---
class UserDB(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    tasks = relationship("TaskDB", back_populates="owner")

class TaskDB(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    description = Column(String, default="")
    due_date = Column(String, default="")
    completed = Column(Boolean, default=False)
    created_at = Column(String)
    owner_id = Column(String, ForeignKey("users.id"))
    owner = relationship("UserDB", back_populates="tasks")

# Create tables ONLY if engine exists
if engine:
    Base.metadata.create_all(bind=engine)

import bcrypt

# --- SECURITY ---
def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    # Hash a password for the first time
    # (bcrypt.hashpw expects bytes)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- SCHEMAS ---
from pydantic import BaseModel

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    due_date: Optional[str] = ""

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    completed: Optional[bool] = None

class TaskSchema(BaseModel):
    id: str
    title: str
    description: str
    due_date: str
    completed: bool
    created_at: str
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# --- DEPENDENCIES ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(UserDB).filter(UserDB.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# --- APP SETUP ---
app = FastAPI(title="Secure Task Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH ENDPOINTS ---
@app.post("/api/auth/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = UserDB(
        id=str(uuid.uuid4()),
        username=user.username,
        hashed_password=get_password_hash(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@app.post("/api/auth/login", response_model=Token)
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# --- TASK ENDPOINTS ---
@app.get("/api/tasks", response_model=List[TaskSchema])
def get_tasks(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(TaskDB).filter(TaskDB.owner_id == current_user.id).all()

@app.post("/api/tasks", response_model=TaskSchema)
def create_task(task: TaskCreate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    print(f"➕ ATTEMPTING TO CREATE TASK FOR USER: {current_user.username}")
    try:
        new_task = TaskDB(
            id=str(uuid.uuid4()),
            title=task.title,
            description=task.description,
            due_date=task.due_date,
            created_at=datetime.now().isoformat(),
            owner_id=current_user.id
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        print("✅ TASK CREATED SUCCESSFULLY!")
        return new_task
    except Exception as e:
        print(f"❌ ERROR CREATING TASK: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/tasks/{task_id}", response_model=TaskSchema)
def update_task(task_id: str, task_update: TaskUpdate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id, TaskDB.owner_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id, TaskDB.owner_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
