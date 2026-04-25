#!/bin/bash

# VeilConnect Deployment Script
# This script stages all changes and pushes them to your GitHub repository.

echo "🚀 Starting deployment process..."

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
fi

# Set git identity
git config user.email "deploy@veilconnect.local"
git config user.name "VeilConnect Deployer"

# Stage all changes
echo "➕ Adding updated files..."
git add .

# Create deployment commit
echo "💾 Finalizing operational build..."
git commit -m "System Overhaul: Professional Confession Identity Active - $(date)" || echo "No changes to commit"

# Set remote if needed (Replace with your actual repo URL if different)
# git remote add origin https://github.com/LogicalArnesh/VeilConnect.git 2>/dev/null

# Push to Main branch
echo "📤 Pushing to GitHub (Main)..."
git branch -M main

# Use the standard push. When prompted for a password, PASTE YOUR TOKEN (ghp_...)
git push -u origin main --force

echo "✅ Deployment script finished."
echo "NOTE: If prompted for a password, paste your GitHub Personal Access Token (PAT)."