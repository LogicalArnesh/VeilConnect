
#!/bin/bash

# VeilConnect Auto-Deployment Script

echo "🚀 Starting deployment process..."

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git remote add origin https://github.com/LogicalArnesh/VeilConnect.git
fi

# Ensure git identity is set so commit doesn't fail
git config user.email "deploy@veilconnect.local"
git config user.name "VeilConnect Deployer"

# Add changes
echo "➕ Adding files..."
git add .

# Commit - if there are no changes, this might fail, so we ignore errors
echo "💾 Committing changes..."
git commit -m "Update from VeilConnect Assistant: $(date)" || echo "No changes to commit"

# Push
echo "📤 Pushing to GitHub (Main)..."
git branch -M main

# We use force push here to ensure the remote matches the local state exactly
# Note: You may be prompted for your GitHub username and Personal Access Token here.
git push -u origin main --force

echo "✅ Deployment process finished. Check your GitHub repository at https://github.com/LogicalArnesh/VeilConnect.git"
