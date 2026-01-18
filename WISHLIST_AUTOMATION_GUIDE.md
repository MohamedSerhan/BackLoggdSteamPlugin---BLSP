# 🎮 Daily Wishlist Report Automation Guide

This guide explains how to set up and use the automated daily wishlist report generation system for your Steam and Backloggd wishlists.

## 📋 Overview

The system automatically:
- 🕐 Runs daily at 9:00 AM UTC (2:00 AM EST / 3:00 AM EDT)
- 🎮 Compares your Steam and Backloggd wishlists
- 📊 Generates a beautiful HTML report with game comparisons
- ☁️ Stores reports in multiple accessible locations

## 🚀 Quick Setup

### 1. Repository Secrets

You need to configure the following secrets in your GitHub repository:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `STEAM_ID` | Your Steam Community ID or custom URL | `yoursteamusername` or `12345678901234567` |
| `BACKLOGGD_USERNAME` | Your Backloggd username | `yourusername` |
| `BACKLOGGD_DOMAIN` | Your Backloggd domain (usually `backloggd.com`) | `backloggd.com` |

### 2. Enable GitHub Pages (Optional)

To access reports via a web URL:

1. Go to **Settings** → **Pages**
2. Under "Source", select **GitHub Actions**
3. Click **Save**
4. Your reports will be available at: `https://yourusername.github.io/yourrepository/wishlistReport.html`

**Note:** The GitHub Pages workflow will automatically generate and deploy your wishlist report whenever you push to the main branch or manually trigger the workflow.

## 📅 Schedule Details

The workflow runs daily at:
- **9:00 AM UTC** (Coordinated Universal Time)
- **2:00 AM EST** (Eastern Standard Time)
- **3:00 AM EDT** (Eastern Daylight Time)

## 📍 Where to Access Your Reports

### 1. GitHub Actions Artifacts
- Go to **Actions** tab in your repository
- Click on the latest workflow run
- Download the `wishlist-report-[number]` artifact
- Contains: `wishlistReport.html` and `cache/` directory

### 2. GitHub Pages (if enabled)
- Visit: `https://yourusername.github.io/yourrepository/wishlistReport.html`
- Always shows the latest generated report
- Can be bookmarked and shared

### 3. GitHub Releases (if enabled)
- Go to **Releases** tab in your repository
- Each daily report is automatically created as a release
- Download the HTML report from any release

### 4. Repository Files
- The `wishlistReport.html` file is automatically committed to your repository
- View it directly in your repository's file browser
- History of all reports is maintained in git history

## 🔧 Manual Trigger

You can manually run the workflow anytime:

1. Go to **Actions** tab
2. Click on **Daily Wishlist Report Generation**
3. Click **Run workflow** button
4. Click **Run workflow** to start

## 📊 Report Features

The generated HTML report includes:

- **🎯 Shared Games**: Games on both Steam and Backloggd wishlists
- **📥 Backloggd Only**: Games only on your Backloggd wishlist
- **📤 Steam Only**: Games only on your Steam wishlist
- **Interactive Features**:
  - Filter games by name
  - Sort games A-Z or Z-A
  - Toggle dark/light theme
  - Refresh cache button
  - Collapsible sections

## ⚙️ Configuration Options

### Customizing the Schedule

Edit `.github/workflows/daily-wishlist-report.yml`:

```yaml
on:
  schedule:
    # Change this cron expression to adjust timing
    - cron: '0 9 * * *'  # Currently: 9:00 AM UTC daily
```

Common cron expressions:
- `0 12 * * *` - Daily at 12:00 PM UTC
- `0 0 * * 1` - Weekly on Monday at 12:00 AM UTC
- `0 6 * * 1-5` - Weekdays at 6:00 AM UTC

### Custom Domain for GitHub Pages

In the workflow file, update the `cname` field:

```yaml
cname: wishlist-reports.yourdomain.com  # Replace with your custom domain
```

## 🛠️ Troubleshooting

### Report Not Generated
- Check that all required secrets are configured
- Verify your Steam and Backloggd profiles are public
- Check the workflow logs for error messages

### GitHub Pages Not Working
- Ensure GitHub Pages is enabled in repository settings
- Check that the workflow has completed successfully
- Verify the `gh-pages` branch exists

### Missing Games in Report
- Ensure games are in your wishlist (not just backlog)
- Check if games are excluded in `excludedGames.json`
- Verify game names match between platforms

## 🔒 Security Notes

- Your Steam and Backloggd credentials are stored securely as GitHub secrets
- Never commit secrets to your repository
- The workflow only reads public wishlist data
- No sensitive data is stored in the generated reports

## 📝 Maintenance

### Clearing Cache
The workflow automatically manages cache files, but you can manually clear them by:
1. Deleting the `cache/` directory in your repository
2. Running the workflow manually to regenerate cache

### Updating Exclusions
Edit `excludedGames.json` to exclude specific games from the comparison:
```json
{
  "excludedGames": [
    "Game Name to Exclude",
    "Another Game to Exclude"
  ]
}
```

## 🎯 Next Steps

1. **Set up the secrets** as described above
2. **Enable GitHub Pages** for easy web access
3. **Test the workflow** with a manual run
4. **Bookmark your report URL** for daily access
5. **Customize the schedule** if needed

Your wishlist reports will now be automatically generated and available daily!
