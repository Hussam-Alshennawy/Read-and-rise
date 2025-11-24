import { GoogleGenAI, Type } from "@google/genai";
import { ExamData, Language } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReadingExam = async (level: number, language: Language = 'ar'): Promise<ExamData> => {
  try {
    let difficultyDesc = "";
    let sectionsConfig = "";
    let wordCountTotal = 0;
    
    // Configuration based on Language (Arabic Native vs English ESL)
    if (language === 'ar') {
        // --- ARABIC CONFIGURATION ---
        if (level <= 4) {
            // Specific word counts as requested
            if (level === 1) wordCountTotal = 15;
            else if (level === 2) wordCountTotal = 30;
            else if (level === 3) wordCountTotal = 45;
            else wordCountTotal = 60; // Level 4

            difficultyDesc = `مستوى تأسيسي للأطفال (المستوى ${level}). عدد الكلمات المستهدف بدقة: ${wordCountTotal} كلمة. جمل قصيرة وبسيطة جداً. **شرط صارم جداً: يجب تشكيل جميع الكلمات في النص والأسئلة والخيارات تشكيلاً كاملاً (Full Diacritics/Tashkeel/Harakat). لا تخرج أي نص بدون تشكيل.**`;
            
            sectionsConfig = `
                أنشئ قسماً واحداً (Section) يحتوي على قصة قصيرة جداً أو جمل مترابطة للأطفال.
                **يجب الالتزام بحدود عدد الكلمات (${wordCountTotal} كلمة) قدر الإمكان.**
                النص والأسئلة يجب أن تكون مشكولة بالحركات (الضمة، الفتحة، الكسرة، السكون) لتناسب الأطفال.
                
                الأسئلة المطلوبة بدقة (مع التشكيل الكامل):
                - 2 سؤال اختيار من متعدد (MCQ).
                - 2 سؤال صواب وخطأ (TF).
                - 1 سؤال أكمل الفراغ (FILL_BLANK): جملة بسيطة جداً من النص.
            `;
        } else if (level <= 8) {
            // Progressive increase after level 4
            wordCountTotal = 100 + ((level - 4) * 25); // ~125 to 200 words
            difficultyDesc = "نص معلوماتي أو علمي، مفردات متوسطة، جمل مركبة.";
            sectionsConfig = `
                أنشئ قسماً واحداً (Section) يحتوي على مقال علمي أو تاريخي.
                الأسئلة المطلوبة بدقة:
                - 2 سؤال اختيار من متعدد (MCQ).
                - 2 سؤال صواب وخطأ (TF).
                - 2 سؤال أكمل الفراغ (FILL_BLANK): لكل سؤال يجب توفير 3 خيارات.
            `;
        } else {
            wordCountTotal = 300 + (level * 30);
            difficultyDesc = "لغة عربية عالية المستوى، بلاغة، نصوص فكرية أو أدبية عميقة.";
            sectionsConfig = `
                أنشئ قسمين مختلفين (2 Sections) منفصلين تماماً:
                القسم الأول: نص أدبي (خطبة أو قصة معقدة). الأسئلة: 3 أسئلة استنتاجية (MCQ).
                القسم الثاني: مقال نقدي أو فكري. الأسئلة: 2 صواب وخطأ (TF)، و 2 أكمل الفراغ (FILL_BLANK).
            `;
        }
    } else {
        // --- ENGLISH (ESL) CONFIGURATION ---
        if (level <= 4) {
            // Beginner ESL: Very simple grammar (Present Simple), basic vocabulary
            wordCountTotal = 60 + (level * 10);
            difficultyDesc = "ESL Beginner: Simple Present tense, high-frequency vocabulary, short sentences. Topics: Family, School, Daily Routine.";
            sectionsConfig = `
                Create 1 Section containing a simple story or dialogue.
                Questions required:
                - 2 Multiple Choice (MCQ).
                - 2 True/False (TF).
                - 1 Fill in the blank (FILL_BLANK).
            `;
        } else if (level <= 8) {
            // Intermediate ESL: Past tense, future forms, paragraphs
            wordCountTotal = 120 + (level * 15);
            difficultyDesc = "ESL Intermediate: Mixed tenses (Past/Future), compound sentences. Topics: Travel, Hobbies, Nature, Culture.";
            sectionsConfig = `
                Create 1 Section containing an informational text or blog post style.
                Questions required:
                - 2 Multiple Choice (MCQ).
                - 2 True/False (TF).
                - 2 Fill in the blank (FILL_BLANK).
            `;
        } else {
            // Advanced ESL: Complex grammar, abstract topics (but not native fluency level)
            wordCountTotal = 250 + (level * 25);
            difficultyDesc = "ESL Advanced: Complex grammar (conditionals, passive voice), richer vocabulary. Topics: Technology, Environment, Social Issues.";
            sectionsConfig = `
                Create 2 separate Sections:
                Section 1: A narrative story or opinion piece. Questions: 3 MCQ (inference based).
                Section 2: An educational article. Questions: 2 TF, 2 FILL_BLANK.
            `;
        }
    }

    const basePrompt = language === 'ar' 
        ? `قم بإنشاء اختبار قراءة لغة عربية للمستوى ${level} من 12.` 
        : `Create an English Reading Exam (ESL - English as Second Language) for Level ${level} of 12. IMPORTANT: Content must be in English.`;

    // Enforce strict diacritics for Arabic levels 1-4
    const strictDiacriticsRule = (language === 'ar' && level <= 4) 
        ? "\nCRITICAL INSTRUCTION: ALL ARABIC TEXT (PASSAGES, QUESTIONS, OPTIONS) MUST BE FULLY VOWELIZED (WITH TASHKEEL/DIACRITICS). This is for children. Do not output text without Tashkeel.\n" 
        : "";

    const prompt = `
      ${basePrompt}
      ${strictDiacriticsRule}
      Target Word Count: ${wordCountTotal} words (Strict adherence for low levels).
      Difficulty Description: ${difficultyDesc}
      
      Structure Requirements:
      ${sectionsConfig}
      
      Suggested Time: ${300 + (level * 60)} seconds.

      CRITICAL RULES FOR QUESTIONS:
      1. Type 'MCQ': 'options' array must have 3-4 choices.
      2. Type 'TF': 'options' array must have exactly 2 choices: ${language === 'ar' ? '["صواب", "خطأ"]' : '["True", "False"]'}.
      3. Type 'FILL_BLANK': 
         - Must provide 'options' array with 3 choices (1 correct + 2 distractors).
         - The 'text' field should contain the sentence with '_______' denoting the blank.

      RETURN JSON ONLY matching this schema exactly.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3, // Lowered for stricter constraint adherence
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.INTEGER },
            title: { type: Type.STRING, description: "Main title for the exam" },
            timeLimit: { type: Type.INTEGER },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  title: { type: Type.STRING, description: "Title of this specific passage" },
                  content: { type: Type.STRING, description: "The reading text passage" },
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.INTEGER },
                        type: { type: Type.STRING, enum: ['MCQ', 'TF', 'FILL_BLANK'] },
                        text: { type: Type.STRING, description: "The question text." },
                        options: { 
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "CRITICAL: Must contain at least 3 strings (1 correct + 2 wrong)."
                        },
                        correctIndex: { type: Type.INTEGER }
                      },
                      required: ["id", "type", "text", "options", "correctIndex"]
                    }
                  }
                },
                required: ["id", "title", "content", "questions"]
              }
            }
          },
          required: ["level", "title", "sections", "timeLimit"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("No response from model");
    
    // Ensure IDs are unique across sections for React keys
    const data = JSON.parse(responseText) as ExamData;
    let globalQId = 1;
    data.sections.forEach(section => {
      section.questions.forEach(q => {
        q.id = globalQId++;
      });
    });

    return data;
  } catch (error) {
    console.error("Error generating exam:", error);
    throw error;
  }
};

export const sendChatMessage = async (history: { role: string; parts: { text: string }[] }[], message: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
      config: {
        systemInstruction: 'You are a helpful educational AI tutor for students.',
      },
    });

    const result = await chat.sendMessage({ message });
    return result.text || "";
  } catch (error) {
    console.error("Error in chat:", error);
    throw error;
  }
};