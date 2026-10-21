/**
 * Writes a generated source file and formats it with the project prettier
 * config.
 *
 * The transit data workflows regenerate files that are committed straight to
 * the repository, so the generated output has to satisfy the same lint and
 * format gates as hand written code. Formatting here keeps the generator and
 * `prettier --check .` in agreement instead of letting the two drift apart.
 */
import { writeFileSync } from 'node:fs';
import { format } from 'prettier';

/**
 * @param {string} filePath Path of the file to write.
 * @param {string} source Generated source before formatting.
 */
export async function writeGenerated(filePath, source) {
  // `filepath` makes prettier pick up the repository config (.prettierrc).
  const formatted = await format(source, { filepath: filePath });
  writeFileSync(filePath, formatted, 'utf8');
}
