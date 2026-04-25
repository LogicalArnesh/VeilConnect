#!/bin/bash

# VeilConnect Deployment Script
# This script handles authentication and pushes changes to GitHub.

echo "🚀 Starting professional deployment..."

# Set git identity
git config user.email "deploy@veilconnect.local"
git config user.name "VeilConnect Deployer"

# Stage all changes
git add .

# Create deployment commit
# Using -m avoids opening the interactive editor
echo "💾 Finalizing build..."
git commit -m "System Sync: Professional Confession Identity Active - $(date)" || echo "No changes to commit"

# Set remote URL (Replace with your actual repo if needed)
# To avoid password prompts, you can set the remote with the token manually:
# git remote set-url origin https://<TOKEN>@github.com/LogicalArnesh/VeilConnect.git

echo "📤 Pushing to GitHub (Main)..."
git branch -M main

# Force push to ensure synchronization
git push -u origin main --force

echo "✅ Deployment sequence finished."
echo "NOTE: If prompted for a password, PASTE your GitHub Token (ghp_...) and hit Enter."
