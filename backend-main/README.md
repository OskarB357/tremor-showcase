LAST COMMIT:  
Oskar Baumgarte, 11/1/25  
Anika Kulkarni, 1/30/26  
GOAL: Using this README to conceptualize big picture goals + relevant documentation for the backend portion of this app.  

# Big Picture: What are we Building?
Building a tremor diagnosis app where: 
1. A patient draws a spiral on a tablet screen (i.e. Archimedes spiral test)
2. App records every pen movement - position (x, y), time, and potentially pressure
3. Backend analyzes the spiral to measure metrics such as tremor frequency/shakiness, speed changes, deviation, etc.
4. Backend scores how severe the tremor may be and potential diagnosis
5. Frontend displays result to the clinician

TL;DR: digital drawing test + mathematical parameters + scoring

# Components
1. Frontend
2. Backend (logic, data analysis, modeling)
3. Database (past tests, users, results)
4. API to interface between frontend and backend

# Basic Data Flow
1. Patient draws spiral: (x, y, t, pressure) data collected
2. React frontend: sends data via internet to API endpoint
3. Python backend (FastAPI): receives data, runs analysis code
4. Analysis function: computes metrics like speed, tremor, deviation
5. Backend sends result back: “Moderate [x] tremor, frequency 5.6 Hz”
6. React frontend displays result: shows to clinician

# Core Pieces to Build
1. FRONTEND (React Native + Expo)
  * Web page that runs on tablets and phones
      * Shows drawing canvas
      * Collects pen movement data
      * Sends spiral data to backend via Internet
      * Displays results
      * EX. patient draws --> record x = 120, y = 350, t = 1.2 s, pressure = 0.6; collect thousands of points; send to backend as JSON
2. BACKEND (Python with FastAPI)
  * FastAPI will act as a messenger that initializes Python function when data is received
3. DATABASE (SQLite)
  * Spreadsheet housing separate tables for users, spirals, and results
      * Where each row is one test
  * Start with SQLite, potentially switch to PostgreSQL for cloud hosting

# Backend
LANGUAGE: Python; best for rapid prototyping and fast development cycles  
MAIN TASKS:  
1. Receive data from the frontend via API call
2. Process data via computations/ML model
3. Send back results
4. Optionally save data to the database

# Modules
1. Add SQLite database
* Create db.py as master file to connect to SQLite and provide sessions (done, 10/13/25)
* Define tables with SQLAlchemy models via separate file, models.py (done, 10/25/25)
* Create tables at startup inside main.py (done, 10/25/25)
2. Store and fetch data via an end-to-end that saves a spiral and fetches a result
* Define input/output shapes with Pydantic (Andrew?)
* Add routes that use the DB in main.py
* Test with first POST request-response
3. Test store/fetch functionality via dummy coordinate values
      
# Project Structure
main.py: entry point; starts FastAPI app  
* Creates FastAPI app object  
* Defines routes  
* Connects routes to database and helper functions  
* Runs background logic (save PNG, send email, etc.) in response to requests
   
db.py: database access points  
* Sets up engine to connect to SQLite database  
* Sets up factory to make short-lived connections (sessions)  
* Sets up parent class that database tables inherit from  
* Sets up FastAPI dependency that gives each route its own clean database session + closes session after use
  
models.py: SQLAlchemy tables  
* Defines what tables look like in database (data schema)  
* Ecah class (User, Spiral, Result) represents a table  
* Each variable (id, user_id, raw_json) represents a column
    
schemas.py: Pydantic request/response shapes  
* Defines data format that API expects and returns  
* Establishes classes like SpiralIn, SpiralCreated, SpiralSummary  
* Based on Pydantic, which automatically validates data sent to/from API
   
crud.py: database helpers (create, read, update, delete helpers)  
* Holds small reusable functions that directly interact with the database through SQLAlchemy  
* Inserts new row in spiral table for each trial  
* Fetches specific result by ID
  
utils_email.py: handles sending email notifications with attachments  
* Reads email settings from environment variables  
* Uses Python to send messages securely

utils_scoring.py: implementing scoring
* Takes spiral drawing trace as input
* Computes movement metrics, severity score based on weights, and report

FULL PIPELINE:
Trace JSON → clean → polar transform → smooth derivatives → metrics allowing clinical interpretation → z-score normalization using Population Stats → weighted sum score → report extras (top contributors + spiral PNG).
