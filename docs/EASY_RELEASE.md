# Easy Release Guide

## Prerequisites
- Windows PowerShell

## How to Release a New Version

1.  **Open the project folder** in your File Explorer.
2.  Navigate to the `scripts` folder.
3.  Right-click `publish.ps1` and select **"Run with PowerShell"**.
4.  Enter the new version number when prompted (e.g., `1.0.2`).
5.  Wait for the script to finish.

**That's it!** 

## What happens next?
1.  The script updates the code and pushes it to GitHub.
2.  GitHub automatically:
    -   Creates a **Release** with the downloadable `crossdrop-extension.zip`.
    -   Updates the **Website** (`https://vinodh-rg.github.io/b2b/`) with the latest info.
