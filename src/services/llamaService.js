export async function askLlama(prompt) {
  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3:latest",
        prompt,
        stream: false
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data.response || "❌ ไม่มีข้อมูลตอบกลับจากโมเดล";
  } catch (err) {
    console.error("❌ Llama API Error:", err);
    throw err;
  }
}
