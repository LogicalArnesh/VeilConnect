
#!/bin/bash

# VeilConnect Auto-Deployment Script
# Execute this to push your workspace changes to your GitHub repository

echo "🚀 Starting deployment process..."

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git remote add origin https://github.com/LogicalArnesh/VeilConnect.git
fi

# Set git identity
git config user.email "deploy@veilconnect.local"
git config user.name "VeilConnect Deployer"

# Stage all changes
echo "➕ Adding updated mission files..."
git add .

# Create deployment commit
echo "💾 Finalizing operational build..."
git commit -m "System Overhaul: Red-Green-White Identity and Confession Tracking Active - $(date)" || echo "No changes to commit"

# Push to Main branch
echo "📤 Pushing to GitHub Intelligence HQ (Main)..."
git branch -M main

# Force push to ensure remote matches local workspace exactly
# NOTE: You will need to provide your Personal Access Token if prompted
git push -u origin main --force

echo "✅ Mission Successful. Your code is now live at https://github.com/LogicalArnesh/VeilConnect.git"
echo "Netlify will automatically detect this push and re-deploy your site."
