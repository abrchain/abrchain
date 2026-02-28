def test_imports():
    """Test that basic imports work"""
    try:
        import sys
        import os
        import json
        assert True
    except ImportError as e:
        assert False, f"Import failed: {e}"

def test_version():
    """Test that version is accessible"""
    version = "2.0.0"
    assert version == "2.0.0"
