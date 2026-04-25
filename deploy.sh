#!/bin/bash

# VeilConnect Deployment Script (Security Clean Version)
# This script handles authentication and pushes changes to GitHub.

echo "🚀 Starting professional deployment..."

# Set git identity
git config user.email "deploy@veilconnect.local"
git config user.name "VeilConnect Deployer"

# Stage all changes
git add .

# Create deployment commit with non-interactive message
echo "💾 Finalizing build..."
git commit -m "System Sync: Professional Confession Identity Active - $(date)" || echo "No changes to commit"

echo "📤 Pushing to GitHub (Main)..."
git branch -M main

# Pushing to origin. 
# NOTE: If authentication fails, use the 'Fresh Start' guidelines provided in the chat.
git push -u origin main --force

echo "✅ Deployment sequence finished."
echo "NOTE: If prompted for a password, PASTE your GitHub Token and hit Enter."
