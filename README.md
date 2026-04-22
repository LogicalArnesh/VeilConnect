
# VeilConnect | Deployment Guide

This project is a Next.js application designed for the **Veil Confessions** security team.

## Initial Setup: Push to GitHub

To get your code live, follow these steps in your local terminal:

1. **Initialize and Push**:
   ```bash
   bash deploy.sh
   ```

## How to Reset and Re-Publish
If you need to completely clear your GitHub history and start fresh:
1. **Remove local Git folder**:
   ```bash
   rm -rf .git
   ```
2. **Re-run the deploy script**:
   ```bash
   bash deploy.sh
   ```

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
     - `SMTP_PASSWORD`: `xvke gjjp hzwy owsi`
     - `GEMINI_API_KEY`: (Your Google AI API Key)
     - `NEXT_PUBLIC_FIREBASE_CONFIG`: (Copy the JSON from your `src/firebase/config.ts`)

### Option B: Firebase App Hosting
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Build > App Hosting**.
3. Click **Get Started** and connect your GitHub repository.
4. **Add Environment Variables**:
   - In the App Hosting dashboard, go to **Settings > Environment variables**.
   - Add `SMTP_PASSWORD` and `GEMINI_API_KEY`.

## Automatic Updates
Once connected, every time you make changes here and push them to your GitHub repository (using `bash deploy.sh`), the hosting provider will detect the change and **re-deploy your site automatically**.

## Accessing User Data
All registered users and security codes are stored in **Firestore**. You can access them at any time by going to your Firebase Console and clicking on **Firestore Database**.
