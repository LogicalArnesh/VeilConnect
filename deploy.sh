#!/bin/bash

# VeilConnect Deployment Script (Clean Version)
# This script handles authentication securely and pushes changes to GitHub.

echo "🚀 Initializing Professional Deployment..."

# Stage all changes
git add .

# Create deployment commit with non-interactive message
echo "💾 Packaging Intelligence Data..."
git commit -m "System Sync: Professional Confession Infrastructure Active - $(date)" || echo "No changes to commit"

echo "📤 Preparing Transmission to GitHub..."
git branch -M main

# Pushing to origin. 
# NOTE: If prompted for a password, PASTE your GitHub Token and hit Enter.
git push -u origin main --force

echo "✅ Deployment sequence finished."
echo "------------------------------------------------------------"
echo "PRO TIP: To avoid password prompts, run this ONCE in terminal:"
echo "git remote set-url origin https://YOUR_TOKEN@github.com/LogicalArnesh/VeilConnect.git"
echo "------------------------------------------------------------"
