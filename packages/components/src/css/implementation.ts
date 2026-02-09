/**
 * css tagged template literal - creates CSSStyleSheet for adoptedStyleSheets.
 *
 * In SSR environments (no CSSStyleSheet), returns a DathomirStyleSheet
 * that carries the raw CSS text for DSD `<style>` injection.
 * @module
 */

/**
 * Marker interface for SSR-compatible style sheets.
 * Carries raw CSS text for Declarative Shadow DOM output.
 */
interface DathomirStyleSheet extends CSSStyleSheet {
  /** Raw CSS text for SSR `<style>` injection. */
  __cssText: string;
}

/**
 * Create a CSSStyleSheet from a template literal.
 * For use with defineComponent's styles option.
 *
 * In SSR environments, returns an object with `__cssText` for DSD output.
 * @param strings - Template string parts
 * @param values - Interpolated values
 * @returns Constructed CSSStyleSheet (with __cssText property)
 */
function css(
  strings: TemplateStringsArray,
  ...values: unknown[]
): CSSStyleSheet {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += String(values[i]);
    }
  }

  // SSR environment check
  if (typeof CSSStyleSheet === "undefined") {
    // Return an object carrying the CSS text for DSD <style> output
    return { __cssText: result } as unknown as CSSStyleSheet;
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(result);
  // Attach raw CSS text for DSD SSR output
  (sheet as DathomirStyleSheet).__cssText = result;
  return sheet;
}

/**
 * Extract raw CSS text from a CSSStyleSheet or DathomirStyleSheet.
 * Returns undefined if the sheet has no attached text.
 */
function getCssText(
  sheet: CSSStyleSheet | string,
): string | undefined {
  if (typeof sheet === "string") return sheet;
  return (sheet as DathomirStyleSheet).__cssText;
}

export { css, getCssText };
export type { DathomirStyleSheet };

