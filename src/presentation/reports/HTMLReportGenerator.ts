/**
 * HTML Report Generator Implementation
 * Generates interactive HTML reports from wishlist comparison results
 */

import { IReportGenerator, ReportOptions } from './IReportGenerator';
import { CompareWishlistsOutput } from '../../domain/usecases/CompareWishlists';
import { Game } from '../../domain/entities/Game';
import * as fs from 'fs';
import * as path from 'path';

// Import TypeScript report utilities
import { escapeHtml, sortGamesAZ } from '../../infrastructure/utils/ReportUtils';

/**
 * Represents a game in the legacy format for report generation
 */
interface LegacyGameFormat {
  steamName: string;
  appId: number | null;
}

/**
 * HTML Report Generator
 * Creates interactive HTML reports with collapsible sections and statistics
 */
export class HTMLReportGenerator implements IReportGenerator {
  private readonly defaultOutputPath: string = './wishlistReport.html';
  
  /**
   * Generate an HTML report from wishlist comparison results
   */
  async generateReport(
    result: CompareWishlistsOutput,
    options?: ReportOptions
  ): Promise<string> {
    const outputPath = options?.outputPath || this.defaultOutputPath;
    const title = options?.title || '🎮 Wishlist Comparison Report';
    
    // Transform domain entities to legacy format
    const legacyFormat = this.transformToLegacyFormat(result);
    
    // Sort game lists alphabetically
    const alreadyBoth = sortGamesAZ(legacyFormat.alreadyBoth);
    const backloggdOnly = sortGamesAZ(legacyFormat.backloggdOnly);
    const steamOnly = sortGamesAZ(legacyFormat.steamOnly);
    
    // Generate HTML content
    const htmlContent = this.generateHTMLContent(
      title,
      alreadyBoth,
      backloggdOnly,
      steamOnly
    );
    
    // Write to file
    fs.writeFileSync(outputPath, htmlContent, 'utf-8');
    
    return path.resolve(outputPath);
  }
  
  /**
   * Transform domain entities to legacy format for compatibility
   * NOTE: firstWishlist = Steam, secondWishlist = Backloggd
   */
  private transformToLegacyFormat(result: CompareWishlistsOutput): {
    alreadyBoth: LegacyGameFormat[];
    backloggdOnly: LegacyGameFormat[];
    steamOnly: LegacyGameFormat[];
  } {
    return {
      alreadyBoth: result.comparison.inBoth.map(this.gameToLegacyFormat),
      // Fixed: onlyInFirst = Steam, onlyInSecond = Backloggd
      steamOnly: result.comparison.onlyInFirst.map(this.gameToLegacyFormat),
      backloggdOnly: result.comparison.onlyInSecond.map(this.gameToLegacyFormat),
    };
  }
  
  /**
   * Convert a Game entity to legacy format
   */
  private gameToLegacyFormat(game: Game): LegacyGameFormat {
    return {
      steamName: game.name,
      appId: game.appId || null,
    };
  }
  
  /**
   * Generate the complete HTML content
   */
  private generateHTMLContent(
    title: string,
    alreadyBoth: LegacyGameFormat[],
    backloggdOnly: LegacyGameFormat[],
    steamOnly: LegacyGameFormat[]
  ): string {
    const sectionIds = {
      alreadyBoth: 'already-on-both',
      backloggd: 'add-to-backloggd',
      steam: 'add-to-steam',
    };
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="reportStyles.css">
    <script src="reportScript.js"></script>
</head>
<body>
    <div class="container">
        <div class="report-header">
          <div class="theme-refresh-bar">
            <button id="refresh-cache-btn" class="refresh-btn" title="Refresh Cache" onclick="refreshCache()">
              <span class="refresh-icon" aria-label="Refresh">&#x21bb;</span>
            </button>
            <div class="theme-toggle-bar" id="theme-toggle-bar" onclick="toggleDarkMode()" title="Toggle Theme">
              <span class="theme-icon sun">&#x2600;</span>
              <span class="theme-slider"></span>
              <span class="theme-icon moon">&#x1F319;</span>
            </div>
          </div>
        </div>
        <h1>${title}</h1>
        <div class="stats">
            <div class="stat-box">
                <h3><span class="anchor-link" onclick="scrollToSection('already-on-both')">Shared Games</span></h3>
                <div class="stat-value">${alreadyBoth.length}</div>
            </div>
            <div class="stat-box">
                <h3><span class="anchor-link" onclick="scrollToSection('add-to-backloggd')">Backloggd Only</span></h3>
                <div class="stat-value">${backloggdOnly.length}</div>
            </div>
            <div class="stat-box">
                <h3><span class="anchor-link" onclick="scrollToSection('add-to-steam')">Steam Only</span></h3>
                <div class="stat-value">${steamOnly.length}</div>
            </div>
        </div>
        <div id="report-error" class="report-error" style="display:none;"></div>
        ${this.renderCollapsibleSection('🎯 Already on Both Platforms', sectionIds.alreadyBoth, this.renderGameList(sectionIds.alreadyBoth, alreadyBoth, false))}
        ${this.renderCollapsibleSection('📥 Add to Backloggd Wishlist', sectionIds.backloggd, this.renderGameList(sectionIds.backloggd, backloggdOnly, false), true, true, true)}
        ${this.renderCollapsibleSection('📤 Add to Steam Wishlist', sectionIds.steam, this.renderGameList(sectionIds.steam, steamOnly, true), true, true, false)}
    </div>
</body>
</html>`;
  }
  
  /**
   * Render a collapsible section with game list
   */
  private renderCollapsibleSection(
    title: string,
    id: string,
    listHtml: string,
    defaultOpen: boolean = false,
    showAddAll: boolean = false,
    isBackloggd: boolean = false
  ): string {
    let addAllBtn = '';
    if (showAddAll && isBackloggd) {
      addAllBtn = `<button class="add-all-btn backloggd-add-all-btn" onclick="addAllToBackloggd()">Add All to Backloggd</button>`;
    } else if (showAddAll && !isBackloggd) {
      addAllBtn = `<button class="add-all-btn steam-add-all-btn" onclick="addAllToSteam()">Add All to Steam</button>`;
    }
    
    return `
    <div class="collapsible-section" id="${id}">
        <div class="section-header sticky-header">
            <div class="section-header-row">
                <span class="section-title">${title}</span>
                <div class="section-controls">
                    <input type="text" class="filter-input" placeholder="Filter games..." oninput="filterList('${id}', this.value)">
                    <select class="sort-select" onchange="sortList('${id}', this.value)">
                        <option value="az">Sort A-Z</option>
                        <option value="za">Sort Z-A</option>
                        ${showAddAll ? '<option value="appid">Sort by AppID</option>' : ''}
                    </select>
                    ${addAllBtn}
                </div>
                <button class="collapsible" aria-expanded="${defaultOpen ? 'true' : 'false'}" aria-controls="${id}-list" onclick="toggleSection('${id}')">
                    <span class="arrow">${defaultOpen ? '▼' : '▶'}</span> Show/Hide List
                </button>
            </div>
        </div>
        <ul id="${id}-list" class="game-list" style="display:${defaultOpen ? 'block' : 'none'};">${listHtml}</ul>
    </div>`;
  }
  
  /**
   * Render a list of games as HTML
   */
  private renderGameList(
    sectionId: string,
    games: LegacyGameFormat[],
    isSteamWishlist: boolean
  ): string {
    const deduped = this.dedupeGames(games);
    
    if (!deduped.length) {
      return '<li class="no-items">No games found in this category</li>';
    }
    
    return deduped
      .map(game => this.renderGameItem(sectionId, game, isSteamWishlist))
      .join('');
  }
  
  /**
   * Render a single game item as HTML
   */
  private renderGameItem(
    sectionId: string,
    game: LegacyGameFormat,
    isSteamWishlist: boolean
  ): string {
    const { steamName, appId } = game;
    const slug = this.slugify(steamName);
    const iconHtml = this.getBestGameImage(steamName, appId);
    const gameName = escapeHtml(steamName).replace(/"/g, '&quot;');
    const appIdAttr = appId || 'null';
    
    let li = `<li data-name="${escapeHtml(steamName.toLowerCase())}"${appId ? ` data-appid="${appId}"` : ''}>`;
    li += `<span class='checkmark'>✔</span>`;
    li += iconHtml;
    li += `<button class='exclude-btn' onclick="toggleExcludeGame(this, '${gameName}', ${appIdAttr})" title="Exclude this game (misidentified or incorrect)" aria-label="Exclude game">🚫</button>`;
    
    if (isSteamWishlist && appId) {
      li += `<a class='game-link' href="https://store.steampowered.com/app/${appId}" target="_blank" rel="noopener noreferrer">${escapeHtml(steamName)}</a>`;
      li += `<button class='add-btn' onclick='addToSteamSingle(this.parentNode, "${appId}")'>Add</button>`;
    } else if (sectionId === 'add-to-backloggd') {
      li += `<a class='game-link' href="https://www.backloggd.com/games/${slug}/" target="_blank" rel="noopener noreferrer" title="View on Backloggd">${escapeHtml(steamName)}</a>`;
      li += `<a class='add-btn backloggd-add-btn' href="https://www.backloggd.com/games/${slug}/" target="_blank" rel="noopener noreferrer">Add</a>`;
    } else if (appId) {
      li += `<a class='game-link' href="https://store.steampowered.com/app/${appId}" target="_blank" rel="noopener noreferrer">${escapeHtml(steamName)}</a>`;
    } else {
      li += `<span class='game-link'>${escapeHtml(steamName)}</span>`;
    }
    
    li += `</li>`;
    return li;
  }
  
  /**
   * Get the best available image for a game
   */
  private getBestGameImage(name: string, appId: number | null): string {
    const BACKLOGGD_PLACEHOLDER = `<svg class='game-icon backloggd-svg' width='60' height='22' viewBox='0 0 60 22' fill='none' xmlns='http://www.w3.org/2000/svg'><rect width='60' height='22' rx='4' fill='#3b3b3b'/><text x='50%' y='55%' text-anchor='middle' fill='#fff' font-size='11' font-family='Segoe UI,Arial,sans-serif' dy='.3em'>BKLGD</text></svg>`;
    
    if (appId) {
      return `<img class='game-icon' data-fallback='steam' src='https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_184x69.jpg' alt='${escapeHtml(name)}' loading='lazy' title='Steam Capsule' />`;
    }
    
    return `<img class='game-icon' data-fallback='backloggd' src='data:image/svg+xml;utf8,${encodeURIComponent(BACKLOGGD_PLACEHOLDER)}' alt='${escapeHtml(name)}' loading='lazy' title='No Capsule Available' />`;
  }
  
  /**
   * Remove duplicate games from a list
   */
  private dedupeGames(games: LegacyGameFormat[]): LegacyGameFormat[] {
    const seen = new Set<string>();
    return games.filter(game => {
      const key = `${game.steamName}|${game.appId || ''}`.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Convert a string to a URL-friendly slug
   */
  private slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
