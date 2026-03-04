#!/usr/bin/env python3
"""
ABR Protocol - Setup Configuration
Africa Bitcoin Reserve - v2.0.0
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as f:
    requirements = f.read().splitlines()

setup(
    name="abrchain",
    version="2.0.0",
    author="ABR Foundation",
    author_email="info@nairax.ng",
    description="Africa Bitcoin Reserve - Sovereign Digital Currency for Africa",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/abrchain/abrchain",
    project_urls={
        "Website": "https://abr.nairax.ng",
        "Documentation": "https://abr.nairax.ng/docs",
        "Source": "https://github.com/abrchain/abrchain",
        "Tracker": "https://github.com/abrchain/abrchain/issues",
    },
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Financial and Insurance Industry",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Office/Business :: Financial",
        "Topic :: Security :: Cryptography",
    ],
    packages=find_packages(exclude=["tests", "tests.*"]),
    python_requires=">=3.9",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "abr-cli=abrchain.cli:main",
            "abr-api=abrchain.api_server:main",
            "abr-miner=abrchain.miner:main",
        ],
    },
    include_package_data=True,
    zip_safe=False,
    keywords=["blockchain", "cryptocurrency", "bitcoin", "africa", "finance"],
)
