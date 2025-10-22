const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-2.0-flash";

export async function askGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    console.log("Gemini API Response:", data);

    if (!response.ok) {
      throw new Error(data?.error?.message || "Unknown error");
    }

    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ ไม่สามารถวิเคราะห์ได้";
  } catch (error) {
    console.error("Gemini error:", error);
    return "❌ ไม่สามารถวิเคราะห์ได้ (ตรวจสอบ API key หรืออินเทอร์เน็ต)";
  }
}
