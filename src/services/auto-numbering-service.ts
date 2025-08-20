import { Cable } from '../types';
import { AutoNumberingSettings, DEFAULT_AUTO_NUMBERING, SETTINGS_KEYS } from '../types/settings';

class AutoNumberingService {
  private settings: AutoNumberingSettings = DEFAULT_AUTO_NUMBERING;

  constructor() {
    this.loadSettings();
  }

  /**
   * Load auto-numbering settings from localStorage
   */
  loadSettings(): AutoNumberingSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEYS.AUTO_NUMBERING);
      if (stored) {
        this.settings = { ...DEFAULT_AUTO_NUMBERING, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load auto-numbering settings:', error);
      this.settings = DEFAULT_AUTO_NUMBERING;
    }
    return this.settings;
  }

  /**
   * Save auto-numbering settings to localStorage
   */
  saveSettings(settings: AutoNumberingSettings): void {
    try {
      this.settings = settings;
      localStorage.setItem(SETTINGS_KEYS.AUTO_NUMBERING, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save auto-numbering settings:', error);
    }
  }

  /**
   * Get current settings
   */
  getSettings(): AutoNumberingSettings {
    return { ...this.settings };
  }

  /**
   * Generate the next available cable tag
   */
  getNextTag(existingCables: Cable[]): string {
    const existingTags = new Set(existingCables.map(cable => cable.tag?.toUpperCase() || ''));
    
    let number = this.settings.startNumber;
    let candidate = this.formatTag(number);
    
    // Find the next available tag
    while (existingTags.has(candidate.toUpperCase())) {
      number += this.settings.increment;
      candidate = this.formatTag(number);
      
      // Safety check to prevent infinite loops
      if (number > 999999) {
        throw new Error('Unable to generate unique tag - too many cables');
      }
    }
    
    return candidate;
  }

  /**
   * Generate multiple sequential tags
   */
  getNextTags(existingCables: Cable[], count: number): string[] {
    const tags: string[] = [];
    const existingTags = new Set(existingCables.map(cable => cable.tag?.toUpperCase() || ''));
    
    let number = this.settings.startNumber;
    let candidate = this.formatTag(number);
    
    // Find starting point
    while (existingTags.has(candidate.toUpperCase())) {
      number += this.settings.increment;
      candidate = this.formatTag(number);
    }
    
    // Generate sequential tags
    for (let i = 0; i < count; i++) {
      candidate = this.formatTag(number);
      while (existingTags.has(candidate.toUpperCase()) || tags.includes(candidate.toUpperCase())) {
        number += this.settings.increment;
        candidate = this.formatTag(number);
      }
      
      tags.push(candidate);
      existingTags.add(candidate.toUpperCase());
      number += this.settings.increment;
    }
    
    return tags;
  }

  /**
   * Format a number into a tag using current settings
   */
  private formatTag(number: number): string {
    const paddedNumber = number.toString().padStart(this.settings.padding, '0');
    return `${this.settings.prefix}${paddedNumber}${this.settings.suffix}`;
  }

  /**
   * Validate if a tag follows the current numbering pattern
   */
  isValidTag(tag: string): boolean {
    if (!tag) return false;
    
    const pattern = new RegExp(
      `^${this.escapeRegExp(this.settings.prefix)}\\d{${this.settings.padding}}${this.escapeRegExp(this.settings.suffix)}$`
    );
    
    return pattern.test(tag);
  }

  /**
   * Extract the number from a tag that follows the pattern
   */
  extractNumber(tag: string): number | null {
    if (!this.isValidTag(tag)) return null;
    
    const numberPart = tag.slice(
      this.settings.prefix.length, 
      tag.length - this.settings.suffix.length
    );
    
    return parseInt(numberPart, 10);
  }

  /**
   * Get duplicate tags in the cable list
   */
  findDuplicateTags(cables: Cable[]): { tag: string; count: number; suggestion?: string }[] {
    const tagCounts = new Map<string, number>();
    
    cables.forEach(cable => {
      if (cable.tag) {
        const normalizedTag = cable.tag.toUpperCase();
        tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
      }
    });
    
    const duplicates = Array.from(tagCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([tag, count]) => ({
        tag,
        count,
        suggestion: this.getNextTag(cables)
      }));
    
    return duplicates;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Export singleton instance
export const autoNumberingService = new AutoNumberingService();