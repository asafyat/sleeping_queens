import { useState } from 'react';
import { translateMessage } from '../utils/formatters';

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


export const useGemini = (gameState, playerId, language, apiKey, setShowKeyModal) => {
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiType, setAiType] = useState('');

  const runAI = async (type, prompt) => {
    if (!apiKey) { if(setShowKeyModal) setShowKeyModal(true); return; }
    setAiType(type);
    setAiModalOpen(true);
    setAiLoading(true);
    const response = await callGeminiAPI(prompt, apiKey);
    setAiContent(response);
    setAiLoading(false);
  };
    const askAdvisor = async () => {
      if (!apiKey) { setShowKeyModal(true); return; }
      setAiType('advisor');
      setAiModalOpen(true);
      setAiLoading(true);
      const player = gameState.players.find(p => p.id === playerId);
      if (!player) return;
      const myHand = player.hand.map(c=>`${c.type} ${c.value||''}`).join(', ');
      const queensSleeping = gameState.queensSleeping.length;
      const opponentStatus = gameState.players.filter(p=>p.id!==playerId).map(p=>`${p.name} has ${p.queensAwake.length} queens`).join(', ');
      
      const strategyTips = language === 'he' 
        ? `סדר עדיפויות אסטרטגי:
           1. אם יש מלך (King) או ליצן (Jester) - שחק אותם מיד.
           2. אם יש אביר (Knight) או שיקוי (Potion) - שחק רק אם יש ליריב מלכות לתקוף.
           3. שרביט (Wand) ודרקון (Dragon) - **אל תשחק!** שמור אותם להגנה.
           4. אם יש משוואה מתמטית (3 קלפים ומעלה) - זרוק אותם כדי לרענן את היד. חפש חיבור! (למשל 2+6=8).
           5. אם יש זוג מספרים זהים - זרוק אותם.
           6. רק אם אין ברירה - זרוק מספר בודד (עדיף גבוה).`
        : `Strategy Priority:
           1. Play King or Jester immediately.
           2. Play Knight or Potion ONLY if opponent has queens.
           3. Wand & Dragon are DEFENSE - **Hold them!** Do not play them.
           4. CHECK FOR MATH: If you have numbers that add up (e.g. 2, 6, 8 because 2+6=8), advise to discard ALL of them as an equation.
           5. Discard Pair (2 cards) to cycle hand.
           6. Discard Single Number (Last resort).`;
  
      let prompt = "";
      if (language === 'he') {
          prompt = `
            אתה היועץ המלכותי החכם במשחק מלכות ישנות.
            היד שלי: [${myHand}]
            
            חשוב מאוד: בדוק אם יש קלפי מספרים שיוצרים משוואת חיבור (למשל 2, 3, 5 כי 2+3=5). אם כן, המלץ לזרוק את כולם!
            
            ${strategyTips}
            
            בהתבסס על סדר העדיפויות הזה, מה המהלך הטוב ביותר שלי? תן תשובה קצרה ומשעשעת בעברית.
          `;
      } else {
          prompt = `
            You are the Wise Royal Advisor in Sleeping Queens.
            My Hand: [${myHand}]
            
            CRITICAL: Check if any number cards form an addition equation (e.g. 2+6=8). If they do, recommend discarding the whole equation!
            
            ${strategyTips}
            
            Based on this priority, what is my BEST move? Be concise and speak like a wise wizard.
          `;
      }
      const response = await callGemini(prompt, apiKey);
      setAiContent(response);
      setAiLoading(false);
    };
  
    const askLore = async (cardName) => {
      if (!apiKey) { setShowKeyModal(true); return; }
      setAiType('lore');
      setAiModalOpen(true);
      setAiLoading(true);
      const prompt = language === 'he' 
          ? `כתוב סיפור רקע אגדי, קצר (1-2 משפטים) ושובב בעברית עבור "${cardName}" בממלכת המלכות הישנות.`
          : `Write a legendary, short (1-2 sentences) and playful backstory in English for "${cardName}" in the Kingdom of Sleeping Queens.`;
      const response = await callGemini(prompt, apiKey);
      setAiContent(response);
      setAiLoading(false);
    };
  
    const askBard = async () => {
      if (!apiKey) { setShowKeyModal(true); return; }
      setAiType('bard');
      setAiModalOpen(true);
      setAiLoading(true);
      const msg = translateMessage(gameState.lastMessage, language);
      const prompt = language === 'he'
          ? `כתוב שיר ילדים קצרצר (2-4 שורות), מצחיק, מתוק ועדין מאוד בעברית על מה שקרה במשחק: "${msg}".
             השתמש בחרוזים פשוטים ושפה קלילה שמתאימה לקטנטנים. בלי מילים מורכבות.`
          : `Write a very gentle, short, and funny nursery rhyme (2-4 lines) for young kids in English about: "${msg}".
             Make it sweet, simple, and rhyming like a children's book.`;
      const response = await callGemini(prompt, apiKey);
      setAiContent(response);
      setAiLoading(false);
    };
  
    const spyOnOpponent = async (opp) => {
      if (!apiKey) { setShowKeyModal(true); return; }
      setAiType('spy');
      setAiModalOpen(true);
      setAiLoading(true);
      const prompt = language === 'he'
          ? `אתה שדון סקרן, חמוד וידידותי מאוד. הצצת בקלפים של החבר/ה "${opp.name}".
             יש לו/ה ${opp.score} נקודות ו-${opp.hand.length} קלפים ביד.
             במקום לתת "דו"ח ריגול", תן מחמאה מצחיקה או הערה חמודה לילדים על המצב שלהם.
             למשל: "וואו! איזה אוסף יפה!" או "נראה שהם מתכננים מסיבת הפתעה!". היה קצר ומתוק.`
          : `You are a cute, friendly, and curious little scout. You took a peek at "${opp.name}"'s cards.
             They have ${opp.score} points and ${opp.hand.length} cards.
             Instead of a "spy report", give a funny compliment or a sweet comment for kids.
             For example: "Wow! What a great collection!" or "Looks like they are planning a surprise party!". Be short and sweet.`;
      const response = await callGemini(prompt, apiKey);
      setAiContent(response);
      setAiLoading(false);
    };

    return { 
    aiModalOpen, setAiModalOpen, 
    aiContent, aiLoading, aiType, 
    askAdvisor, askLore, askBard, spyOnOpponent 
  };
}