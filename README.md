
# VeilConnect | Deployment & Management Guide

This project is a Next.js application designed for the **Veil Confessions** security team.

## Initial Setup: Push to GitHub

To get your code live, follow these steps in your local terminal:

1. **Initialize and Push**:
   ```bash
   bash deploy.sh
   ```

## How to Access User Data
All registered users and security codes are stored in **Firestore**.
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select the project: `studio-1771046886-1b742`.
3. Click on **Firestore Database** in the left sidebar.
4. You can see:
   - `userProfiles`: List of all users, their passwords, and roles.
   - `verificationCodes`: Active OTP codes for 2FA.

## How to Publish for Free (Web App)

### Option A: Netlify (Recommended)
1. Log in to [Netlify](https://www.netlify.com/).
2. Click **Add new site > Import from Git**.
3. Select your `VeilConnect` repository.
4. **Build Settings**:
   - **Branch to deploy**: `main`
   - **Base directory**: (Leave blank)
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. **CRITICAL STEP: Add Environment Variables**:
   - Go to **Site settings > Environment variables**.
   - Click **Add a variable** and add these:
     - `SMTP_PASSWORD`: (Your new 16-character Gmail App Password)
     - `GEMINI_API_KEY`: `AIzaSyB8QtTeEsfMMBoFcVAhzPZgvu4m9svUwMQ`
6. **Gmail Security Note**:
   - If you changed your Gmail account password, you **MUST** generate a new App Password at [Google Account Settings > Security > App Passwords](https://myaccount.google.com/security) and update it in Netlify.

## Automatic Updates
Once connected, every time you make changes here and push them to your GitHub repository (using `bash deploy.sh`), the hosting provider will detect the change and **re-deploy your site automatically**.
