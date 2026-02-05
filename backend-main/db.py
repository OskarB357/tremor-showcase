# LAST COMMIT: Anika Kulkarni, 10/13/25

# This script serves to:
# (1) Connect app to SQLite database file (i.e. tremor.db) 
# (2) Provide a session object (i.e. open a database connection for this operation) such that routes can be used to read + write rows
# (3) Define a Base class that the table models inherit from so SQLAlchemy knows how to create tables
# (4) Provide a FastAPI dependency called get_db() that...
# 	(a) Opens a session at the start if a request
# 	(b) Yields it to a route so we can use it
# 	(c) Commits it if all went well or rolls back if something failed
# 	(d) Closes the connection at the end
# 

# Build Engine, SQLAlchemy's main object that knows how to communicate with the database (open connections, manage a small pool of requests)
from sqlalchemy import create_engine 

# Establishes a factory that creates Session objects, which are what we use inside routes to query and insert inside a database; also establishes a modern base class that we subclass to define ORM models (tables)
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# (1) Pick a database URL so SQLAlchemy knows what to connect to
# General format: dialect+driver://username:password@host:port/database
# For SQLite, simplified to sqlite:///relative/path.db (file nex to code) - use a relative path so it's stored inside project folder
# LATER, read this from an environment variable like os.getenv("DATABASE_URL") to switch to Postgres in production
DATABASE_URL = "sqlite:///.tremor.db" # Establish database URL via SQLite, which is a single file database
# Database exists in a SQLite file named tremor.db in the current working directory

# (2) Create an engine to handle connections to the database
engine = create_engine(
	DATABASE_URL,
	connect_args={"check_same_thread": False} # Needed for SQLite and FastAPI dev
)

# (3) Establish a connection to run queries 
# sessionmaker returns a callable that, when called, gives a Session (active conservation with database)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
# autoflush disabled so SQLAlchemy will only push pending changes at commit
# autocommit disabled so we control when a transaction commits and can rollback() if needed

# (4) Base class for ORM models, which our tables will inherit from
class Base(DeclarativeBase):
	pass
# Make table classes later like:
# 
# class User(Base):
#     __tablename__ = "users"
#     ...
# 
# Base.metadata tracks all tables
# Call Base.metadata.create_all(bind=engine) in main.py to create the tables in SQLite


# (5) FastAPI Dependency: yield a session and close it after use
def get_db():
	db = SessionLocal() # Open a new Session for current request
	try:
		yield db # Hands session to route function to use it
		db.commit() # When route function returns, db.commit() runs if no exceptions to save changes
	except: # If exceptions occur, rollback() the transaction
		db.rollback()
		raise
	finally: # Always runs to free connection after transaction finishes
		db.close()
# Guaranteed clean transaction boundaries per request, no leaked connections, and automatic rollback on errors!

# WHEN READY FOR POSTGRES:
# * Change database url to something like: DATABASE_URL = "postgresql+psycopg://user:password@host:5432/dbname"
# * Install driver externally: pip install "sqlalchemy[asyncio]" psycopg[binary]
# * Remove connect_args requirement
# * Keep everything else same
