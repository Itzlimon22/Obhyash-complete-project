import katex from 'katex';

/**
 * Validates a string containing LaTeX blocks delimited by $ symbols.
 * Returns an object indicating if it's valid and the first error found.
 */
export function validateLatex(text: string): {
  isValid: boolean;
  error?: string;
} {
  if (!text) return { isValid: true };

  // Split text by $ symbols to identify LaTeX parts (same logic as MathRenderer)
  const parts = text.split(/(\$.*?\$)/g);

  for (const part of parts) {
    if (part.startsWith('$') && part.endsWith('$')) {
      const content = part.slice(1, -1);
      if (!content.trim()) continue; // Skip empty blocks like $$

      try {
        // Attempt to parse without rendering to check syntax
        // __parse is an internal KaTeX function but it's the most efficient for validation
        // Alternatively, we use the standard renderToString in a try/catch
        katex.renderToString(content, { throwOnError: true });
      } catch (err: unknown) {
        // Strip out common KaTeX noise from error messages for better UX
        let message: string;
        if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
          message = (err as { message: string }).message;
        } else {
          message = String(err);
        }
        const cleanMessage = message
          .replace(/^KaTeX parse error: /i, '')
          .replace(/ at position \d+:.*/, '');

        return {
          isValid: false,
          error: `LaTeX error in "${content.length > 20 ? content.substring(0, 17) + '...' : content}": ${cleanMessage}`,
        };
      }
    }
  }

  return { isValid: true };
}
