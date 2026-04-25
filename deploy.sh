
#!/bin/bash

# VeilConnect Auto-Deployment Script (Authenticated)
# Execute this to push your workspace changes to your GitHub repository

TOKEN="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"
REMOTE_URL="https://$TOKEN@github.com/LogicalArnesh/VeilConnect.git"

echo "🚀 Starting authenticated deployment process..."

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
fi

# Set remote with token
git remote remove origin 2>/dev/null
git remote add origin "$REMOTE_URL"

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
git push -u origin main --force

echo "✅ Mission Successful. Your code is now live at GitHub."
echo "Netlify will automatically detect this push and re-deploy your site."
