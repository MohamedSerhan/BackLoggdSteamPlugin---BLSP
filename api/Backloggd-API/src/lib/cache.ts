// Clears all files in the cache directory at the project root
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import { logWarn, logError } from '../../../../services/logColors';

// Clears all files in the cache directory at the project root
export function clearCache() {
  try {
    const cacheDir = path.resolve(__dirname, '../../../../cache');
    if (fs.existsSync(cacheDir)) {
      fs.readdirSync(cacheDir).forEach(file => {
        const filePath = path.join(cacheDir, file);
        if (fs.lstatSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
    }
    else {
      logWarn('Cache directory does not exist, nothing to clear.');
    }
  } catch (err) {
    logError('Error clearing cache: ' + (err as Error).message);
  }
}
