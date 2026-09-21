#!/usr/bin/env python3
"""
CEKAS - Entrypoint Runner
Usage:
  python run.py status
  python run.py seed
  python run.py export-excel
  python run.py export-chart
  python run.py web
"""

import sys
from cekas_app.cli import main

if __name__ == "__main__":
    main()
