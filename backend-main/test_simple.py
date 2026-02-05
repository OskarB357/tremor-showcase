#!/usr/bin/env python3
"""
Backend test
"""

import urllib.request
import json
import os

def test_backend():
    """Test that backend is running and responding"""
    print("Testing Backend")
    
    # Test root endpoint
    print("Testing root endpoint:")
    try:
        with urllib.request.urlopen("http://localhost:8000/") as response:
            data = json.loads(response.read().decode())
            print(f" Root endpoint: {data['message']}")
    except Exception as e:
        print(f" Root endpoint failed: {e}")
        return False
    
    # Test health endpoint
    print("Testing health endpoint:")
    try:
        with urllib.request.urlopen("http://localhost:8000/health") as response:
            data = json.loads(response.read().decode())
            print(f" Health endpoint: {data['status']}")
    except Exception as e:
        print(f" Health endpoint failed: {e}")
        return False
    
    # Test test endpoint
    print("Testing test endpoint:")
    try:
        with urllib.request.urlopen("http://localhost:8000/test") as response:
            data = json.loads(response.read().decode())
            print(f" Test endpoint: {data['message']}")
    except Exception as e:
        print(f" Test endpoint failed: {e}")
        return False
    
    print("\n All tests passed!")
    return True

def test_database():
    print("\nTesting SQLite Database")
    
    try:
        from db import get_db
        
        # Test the get_db generator function
        db_gen = get_db()
        db = next(db_gen)
        
        # Test simple query
        from sqlalchemy import text
        result = db.execute(text("SELECT 1 as test")).fetchone()
        if result and result[0] == 1:
            print("get_db() function works")
        else:
            print("get_db() failed")
            return False
        
        # Close the generator 
        try:
            next(db_gen)
        except StopIteration:
            pass  
        
        print("Database tests passed.")
        return True
        
    except Exception as e:
        print(f"✗ Database test failed: {e}")
        return False

if __name__ == "__main__":
    backend_ok = test_backend()
    db_ok = test_database()
    
    if backend_ok and db_ok:
        print("\nAll tests passed")
    else:
        print("\nSome tests failed")
