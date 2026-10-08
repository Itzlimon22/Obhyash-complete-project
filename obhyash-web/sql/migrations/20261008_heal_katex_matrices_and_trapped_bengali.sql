-- ============================================================================
-- MIGRATION: One-time Database Fix for KaTeX Matrices & Trapped Bengali
-- DESCRIPTION:
--   Heals matrix formatting in public.questions where Bengali prose / conjunctions
--   were accidentally trapped inside math delimiters after \end{bmatrix}, or where
--   matrix environments were missing dollar delimiters.
--   Uses $FUNC$ dollar-quoting to prevent conflict with literal '$$' in the body.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.heal_katex_text(p_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $FUNC$
DECLARE
    v_result TEXT := p_text;
BEGIN
    IF v_result IS NULL OR TRIM(v_result) = '' THEN
        RETURN v_result;
    END IF;

    -- 1. Untangle trapped Bengali after \end{...matrix...} before closing $
    -- Matches: \end{bmatrix} [Bengali text] [optional math] $
    -- Transforms to: \end{bmatrix}$ [Bengali text] $[math]$
    v_result := regexp_replace(
        v_result,
        '(\\end\{(?:[a-zA-Z*]+matrix|cases|array|align\*?|aligned)\})\s*([\u0980-\u09FF\s\,\;\:\।\-\(\)\/\?\!]+?)(?:([a-zA-Z0-9\\\{\}\^\_\+\-\*\/\s\.\(\)\|\=]+))?\$',
        '\1$ \2 $\3$',
        'g'
    );

    -- 1b. Heal single backslash row breaks inside matrix / aligned environments: '\ dv' or '\ 8' -> '\\ dv'
    v_result := regexp_replace(
        v_result,
        '(?<=\\begin\{(?:[a-zA-Z*]+matrix|cases|array|align\*?|aligned)\}[\s\S]*?)(?:(?<=[^\\])\\\s+|\s+\\\s+)(?=[0-9a-zA-Z\-\+\&\.\,\(\)\{\}\\])(?=[\s\S]*?\\end\{(?:[a-zA-Z*]+matrix|cases|array|align\*?|aligned)\})',
        ' \\ ',
        'g'
    );

    -- Clean up empty math blocks if trailing math was empty ($ $)
    v_result := replace(v_result, chr(36) || chr(36), '');
    v_result := replace(v_result, chr(36) || ' ' || chr(36), '');

    -- 2. Wrap completely naked matrix and aligned environments that lack dollar delimiters
    v_result := regexp_replace(
        v_result,
        '(?<!\$)\\begin\{((?:v|p|b|B|V|small)?matrix|cases|array|align\*?|aligned)\}([\s\S]*?)\\end\{\1\}(?!\$)',
        '$$\begin{\1}\2\end{\1}$$',
        'g'
    );

    -- 3. Fix matrix/aligned with open dollar but missing closing dollar right after \end{...}
    v_result := regexp_replace(
        v_result,
        '(\$\s*\\begin\{((?:v|p|b|B|V|small)?matrix|cases|array|align\*?|aligned)\}[\s\S]*?\\end\{\2\})(?!\$)',
        '\1$',
        'g'
    );

    -- 4. Clean stray $$ inside single $ if already wrapped
    v_result := replace(v_result, chr(36) || ' ' || chr(36) || chr(36), chr(36) || chr(36));
    v_result := replace(v_result, chr(36) || chr(36) || ' ' || chr(36), chr(36) || chr(36));

    RETURN v_result;
END;
$FUNC$;

-- Execute update across public.questions
UPDATE public.questions
SET
    question = public.heal_katex_text(question),
    explanation = CASE 
        WHEN explanation IS NOT NULL THEN public.heal_katex_text(explanation)
        ELSE explanation
    END
WHERE
    question ILIKE '%\begin{%' 
    OR question ILIKE '%matrix%'
    OR (explanation IS NOT NULL AND (explanation ILIKE '%\begin{%' OR explanation ILIKE '%matrix%'));
