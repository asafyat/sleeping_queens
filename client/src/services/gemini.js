export const callGemini = async (prompt, apiKey) => {
  if (!apiKey) return "API Key missing. Please check settings.";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "The stars are silent...";
    text = text.replace(/[\*\#\`]/g, '');
    return text;
  } catch (e) {
    console.error("Gemini API Error:", e);
    return "Connection error.";
  }
};