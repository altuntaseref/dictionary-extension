import type { Env } from "../index";

export async function generateMeaning(
    word: string,
    env: Env,
    options?: { sourceLang?: string; targetLang?: string }
): Promise<string> {
    const source = options?.sourceLang?.trim();
    const target = options?.targetLang?.trim() || "Turkish";
    const prompt = source
        ? `Translate the following ${source} word or phrase into ${target}.\nAnswer ONLY with the translation (no quotes, no extra text):\n"${word}"`
        : `Detect the language of the following word or phrase and translate it into ${target}.\nAnswer ONLY with the translation (no quotes, no extra text):\n"${word}"`;
    const result = await callOpenAI(prompt, env);
    return result.trim().replace(/^"|"$/g, "");
}

export interface ExampleWithTranslation {
    sentence: string;
    translation: string;
}

export async function generateExamples(
    word: string,
    env: Env,
    options?: { targetLang?: string; translationLang?: string }
): Promise<ExampleWithTranslation[]> {
    const targetLang = options?.targetLang?.trim() || "English";
    const translationLang = options?.translationLang?.trim() || "Turkish";
    
    const prompt = `Generate exactly 2 natural-sounding example sentences in ${targetLang} using the word or phrase "${word}".\nReturn ONLY a JSON array of exactly 2 strings, nothing else. Example format: ["Sentence 1.", "Sentence 2."]`;
    const result = await callOpenAI(prompt, env);
    
    let sentences: string[] = [];
    try {
        // Try to extract JSON array from response
        const jsonMatch = result.match(/\[.*?\]/s);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed)) {
                sentences = parsed.map(String).slice(0, 2);
            }
        }
    } catch {}
    
    // Fallback: split lines and take first 2
    if (sentences.length === 0) {
        sentences = result
            .split(/\n+/)
            .map((s) => s.trim().replace(/^[-•\d.]+\s*/, ""))
            .filter((s) => s.length > 0 && !s.match(/^(sentence|example)/i))
            .slice(0, 2);
    }

    // Generate translations for each sentence
    const examplesWithTranslations: ExampleWithTranslation[] = [];
    for (const sentence of sentences) {
        try {
            const translationPrompt = `Translate the following ${targetLang} sentence into ${translationLang}. Answer ONLY with the translation (no quotes, no extra text):\n"${sentence}"`;
            const translation = await callOpenAI(translationPrompt, env);
            examplesWithTranslations.push({
                sentence: sentence.trim(),
                translation: translation.trim().replace(/^"|"$/g, ""),
            });
        } catch (error) {
            // If translation fails, still include the sentence without translation
            examplesWithTranslations.push({
                sentence: sentence.trim(),
                translation: "",
            });
        }
    }

    return examplesWithTranslations;
}

async function callOpenAI(prompt: string, env: Env): Promise<string> {
    if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
        throw new Error("No LLM API key configured");
    }
    if (env.OPENAI_API_KEY) {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${env.OPENAI_API_KEY}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: prompt },
                ],
                temperature: 0.2,
            }),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`OpenAI error: ${res.status} ${text}`);
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content ?? "";
    }
    // Anthropic fallback
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": env.ANTHROPIC_API_KEY!,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 200,
            temperature: 0.2,
            messages: [{ role: "user", content: prompt }],
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Anthropic error: ${res.status} ${text}`);
    }
    const data = await res.json();
    const content = data.content?.[0]?.text ?? "";
    return content;
}

