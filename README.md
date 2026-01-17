# BackLoggd Steam Plugin (BLSP)

A Node.js application that synchronizes wishlists between Steam and Backloggd, helping you keep your game collections in perfect harmony across both platforms.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D20.6.0-brightgreen.svg)

## Features

- **Automated Wishlist Comparison**: Compare your Steam and Backloggd wishlists automatically
- **Interactive HTML Report**: View differences in a beautiful, interactive web report
- **Smart Fuzzy Matching**: Uses Levenshtein distance algorithm to match games with slightly different names
- **File-Based Caching**: 24-hour cache to minimize API calls and improve performance
- **Game Exclusion System**: Mark incorrectly matched games to exclude them from future reports
- **Dark Mode Support**: Toggle between light and dark themes for comfortable viewing
- **Real-Time Updates**: Refresh cache on-demand to get the latest data

## Screenshot

[View Example Report](https://htmlpreview.github.io/?https://github.com/MohamedSerhan/BackLoggdSteamPlugin---BLSP/blob/master/wishlistReport.html)

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Prerequisites

- **Node.js** >= 20.6.0
- **npm** >= 9.0.0
- A Steam account with a public wishlist
- A Backloggd account

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/MohamedSerhan/BackLoggdSteamPlugin---BLSP.git
   cd BackLoggdSteamPlugin---BLSP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your credentials (see [Configuration](#configuration) below)

4. **Build the TypeScript API**
   ```bash
   npm run build
   ```

## Configuration

Create a `.env` file in the project root with the following variables:

```env
# Your Steam Account ID (17-digit number)
# Find it at: https://steamid.io/ or https://www.steamidfinder.com/
STEAM_ID=76561198012345678

# Your Backloggd Username
BACKLOGGD_USERNAME=your_username

# Backloggd API Domain (local API server)
BACKLOGGD_DOMAIN=http://127.0.0.1:8080
```

### Finding Your Steam ID

1. Go to [steamid.io](https://steamid.io/)
2. Enter your Steam profile URL
3. Copy the **steamID64** value (17-digit number)

## Usage

### Production Mode

Run the complete comparison process:

```bash
npm start
```

This will:
1. Start the Backloggd API server on port 8080
2. Fetch data from both Steam and Backloggd
3. Compare wishlists and generate an HTML report
4. Output `wishlistReport.html` in the project root

### Development Mode

For development with auto-reload:

```bash
npm run dev
```

### Other Commands

```bash
# Build TypeScript code
npm run build

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Run tests
npm test

# Clean generated files
npm run clean
```

## How It Works

1. **Data Fetching**: The application fetches your wishlist from Steam's API and scrapes your Backloggd wishlist and backlog

2. **Normalization**: Game names are normalized (lowercase, special characters removed, common editions stripped) for accurate comparison

3. **Fuzzy Matching**: Uses Levenshtein distance with a 20% threshold to match games even if names don't match exactly

4. **Categorization**: Games are sorted into three categories:
   - **Already on Both**: Games present in both wishlists
   - **Add to Steam Wishlist**: Games only on Backloggd
   - **Add to Backloggd Wishlist**: Games only on Steam

5. **Validation**: Games found only on Backloggd are validated against Steam to ensure they exist

6. **Report Generation**: An interactive HTML report is generated with:
   - Statistics dashboard
   - Collapsible sections for each category
   - Search and filtering
   - Sorting options (A-Z, Z-A, App ID)
   - Direct links to Steam/Backloggd pages
   - Game exclusion functionality
   - Dark mode toggle

## Project Structure

```
BackLoggdSteamPlugin - BLSP/
├── api/
│   └── Backloggd-API/          # TypeScript API server
│       ├── src/
│       │   ├── app.ts          # Express server
│       │   ├── routes/         # API routes
│       │   ├── controllers/    # Request handlers
│       │   ├── lib/            # Core business logic
│       │   ├── types/          # TypeScript types
│       │   └── utils/          # Utility functions
│       └── tsconfig.json
├── services/                    # Service layer
│   ├── steamService.js         # Steam API interaction
│   ├── backloggdService.js     # Backloggd API interaction
│   └── logColors.js            # Colored logging
├── utils/                       # Shared utilities
│   └── cacheManager.js         # Centralized cache management
├── config/                      # Configuration
│   └── constants.js            # Application constants
├── index.js                     # Main entry point
├── exclusionManager.js          # Game exclusion logic
├── reportPage.js                # HTML report generator
├── reportList.js                # Game list renderer
├── reportScript.js              # Client-side JavaScript
├── reportStyles.css             # Report styling
├── package.json
├── .env.example                 # Environment template
└── README.md
```

## Development

### Code Style

This project uses ESLint and Prettier for code quality:

- **ESLint**: Enforces code quality rules
- **Prettier**: Ensures consistent formatting
- **Husky**: Git hooks for pre-commit checks
- **lint-staged**: Runs linters on staged files

### Adding New Features

1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Run linting and formatting: `npm run lint:fix && npm run format`
5. Commit with a descriptive message
6. Open a pull request

### Architecture

- **Services Layer**: Handles external API interactions with caching
- **Business Logic**: Core comparison and normalization logic in `index.js`
- **API Server**: Express.js TypeScript server for Backloggd data
- **Report Generation**: Modular system for building interactive HTML reports
- **Cache Management**: Centralized file-based caching with 24-hour TTL

## Troubleshooting

### "STEAM_ID environment variable is not set"

Make sure you've created a `.env` file and added your Steam ID. See [Configuration](#configuration).

### "Error fetching Steam data"

- Check that your Steam ID is correct (17-digit steamID64)
- Ensure your Steam wishlist is set to public
- Verify your internet connection

### "Error fetching Backloggd data"

- Make sure the API server is running (should start automatically with `npm start`)
- Check that your Backloggd username is correct
- Verify the API server is accessible at `http://127.0.0.1:8080`

### Cache Issues

If you're seeing stale data, refresh the cache:

1. Open the generated `wishlistReport.html`
2. Click the "Refresh Cache" button
3. Run the application again

Or manually clear the cache:

```bash
npm run clean
```

### Port 8080 Already in Use

If another application is using port 8080, you can change it:

1. Update `API_PORT` in `config/constants.js`
2. Update `BACKLOGGD_DOMAIN` in your `.env` file
3. Rebuild: `npm run build`

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Credits

- **Author**: Mohamed Serhan
- **Steam API**: Valve Corporation
- **Backloggd**: Independent game tracking platform
- **Dependencies**: See [package.json](package.json) for full list

## Acknowledgments

- Thanks to the Steam and Backloggd communities
- Special thanks to all contributors
- Built with ❤️ for game collectors

---

## FAQ

**Q: How often should I run this?**
A: Run it whenever you want to sync your wishlists. The cache lasts 24 hours, so running it more frequently won't provide new data unless you refresh the cache.

**Q: Does this modify my wishlists automatically?**
A: No, this tool only generates a report. You must manually add games to your wishlists using the provided links.

**Q: Why are some games not matching correctly?**
A: Game names can differ between platforms. Use the exclusion feature (🚫 button) to mark incorrectly matched games.

**Q: Is my data stored anywhere?**
A: All data is stored locally on your machine in the `cache/` directory. Nothing is sent to external servers except the Steam and Backloggd APIs.

**Q: Can I use this for multiple accounts?**
A: Yes, just update the `.env` file with different credentials and run the application again.

---

**Need help?** Open an issue on [GitHub](https://github.com/MohamedSerhan/BackLoggdSteamPlugin---BLSP/issues)
