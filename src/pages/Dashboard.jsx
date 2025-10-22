import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { auth } from "../services/firebase";
import { saveDiary, getDiary, listenDiaries } from "../services/diaryService";
import { askLlama } from "../services/llamaService";
import { askGemini } from "../services/geminiService";
import Navbar from "../components/Navbar";
import "../styles/Dashboard.css";

const moods = [
  { id: 1, img: "/moods/1.png", label: "แย่สุดๆ" },
  { id: 2, img: "/moods/2.png", label: "แย่นิดหน่อย" },
  { id: 3, img: "/moods/3.png", label: "ธรรมดา" },
  { id: 4, img: "/moods/4.png", label: "ดี" },
  { id: 5, img: "/moods/5.png", label: "มีความสุขมาก" },
];

function Dashboard() {
  const [todayMood, setTodayMood] = useState(null);
  const [todayNote, setTodayNote] = useState("");
  const [diaryData, setDiaryData] = useState({});
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ avg: 0, goodPercent: 0, worstDay: "-" });
  const [modalData, setModalData] = useState(null);
  const [saveSuccessModal, setSaveSuccessModal] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const today = new Date();
    getDiary(user.uid, today).then((todayData) => {
      if (todayData) {
        setTodayMood(todayData.mood);
        setTodayNote(todayData.note);
      }
    });

    const unsubscribe = listenDiaries(user.uid, (allDiaries) => {
      setDiaryData(allDiaries);

      const last7days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const key = date.toLocaleDateString("en-CA", {
          timeZone: "Asia/Bangkok",
        });
        return {
          day: date.toLocaleDateString("en-US", { weekday: "short" }),
          mood: allDiaries[key]?.mood || null,
        };
      });
      setChartData(last7days);

      const moodsArr = Object.entries(allDiaries).map(([date, entry]) => ({
        date,
        ...entry,
      }));

      if (moodsArr.length > 0) {
        const avg =
          moodsArr.reduce((sum, e) => sum + e.mood, 0) / moodsArr.length;
        const goodDays =
          (moodsArr.filter((e) => e.mood >= 4).length / moodsArr.length) * 100;
        const worst = moodsArr.reduce((prev, curr) =>
          curr.mood < prev.mood ? curr : prev
        );

        setStats({
          avg: avg.toFixed(1),
          goodPercent: goodDays.toFixed(0),
          worstDay: new Date(worst.date).toLocaleDateString("th-TH", {
            weekday: "short",
          }),
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleSaveToday = async () => {
    if (!user) return;
    await saveDiary(user.uid, new Date(), todayMood, todayNote);
    setTodayMood(null);
    setTodayNote("");
    setSaveSuccessModal(true);
  };

  const handleDayClick = (date) => {
    const key = date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    if (diaryData[key]) {
      setModalData({
        date: date.toLocaleDateString("th-TH"),
        mood: moods.find((m) => m.id === diaryData[key].mood)?.label,
        moodImg: moods.find((m) => m.id === diaryData[key].mood)?.img,
        note: diaryData[key].note,
      });
    } else {
      setModalData({
        date: date.toLocaleDateString("th-TH"),
        mood: "ยังไม่มีข้อมูล",
        moodImg: null,
        note: "-",
      });
    }
  };

  const analyzeWithLlama = async () => {
    const last7 = Object.entries(diaryData)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .slice(0, 7)
      .reverse();

    if (last7.length === 0) {
      setModalData({
        date: "🧠 ผลการวิเคราะห์สุขภาพจิต",
        mood: "",
        moodImg: null,
        note: "ยังไม่มีข้อมูลบันทึกครบ 7 วัน 😅",
      });
      return;
    }

    const text = last7
      .map(([date, entry]) => `วันที่ ${new Date(date).toLocaleDateString("th-TH")}: ${entry.note}`)
      .join("\n");

    const prompt = `คุณเป็นนักจิตวิทยา วิเคราะห์สุขภาพจิตของผู้ใช้จากบันทึก 7 วันล่าสุดด้านล่างนี้ 
และสรุปผลเป็นภาษาไทย 2 ย่อหน้า:\n\n${text}`;

    try {
      const result = await askLlama(prompt);
      setModalData({
        date: "🧠 ผลการวิเคราะห์สุขภาพจิต (Ollama)",
        mood: "",
        moodImg: null,
        note: result,
      });
    } catch {
      setModalData({
        date: "⚠️ เกิดข้อผิดพลาด",
        mood: "",
        moodImg: null,
        note: "ตรวจสอบว่า Ollama เปิดอยู่ และโมเดล llama3 ถูกโหลดแล้ว",
      });
    }
  };

  const analyzeWithGemini = async () => {
    const last7 = Object.entries(diaryData)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .slice(0, 7)
      .reverse();

    if (last7.length === 0) {
      setModalData({
        date: "🧠 ผลการวิเคราะห์สุขภาพจิต",
        mood: "",
        moodImg: null,
        note: "ยังไม่มีข้อมูลบันทึกครบ 7 วัน 😅",
      });
      return;
    }

    const text = last7
      .map(([date, entry]) => `วันที่ ${new Date(date).toLocaleDateString("th-TH")}: ${entry.note}`)
      .join("\n");

    const prompt = `คุณเป็นนักจิตวิทยา วิเคราะห์สุขภาพจิตของผู้ใช้จากบันทึก 7 วันล่าสุดด้านล่างนี้ 
และสรุปผลมาเป็นภาษาไทยไม่เกิน 2 ย่อหน้าเท่านั้น ห้ามสรุปเป็นภาษาอังกฤษ\n\n${text}`;

    try {
      const result = await askGemini(prompt);
      setModalData({
        date: "🧠 ผลการวิเคราะห์สุขภาพจิต (Gemini)",
        mood: "",
        moodImg: null,
        note: result,
      });
    } catch {
      setModalData({
        date: "⚠️ เกิดข้อผิดพลาด",
        mood: "",
        moodImg: null,
        note: "เกิดปัญหาในการเชื่อมต่อกับ Gemini API",
      });
    }
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <h1 className="dashboard-title">
          สวัสดี {user?.email} วันนี้คุณรู้สึกยังไงบ้าง?
        </h1>

        <div className="stats-grid">
          <div className="stat-card">
            <h2>ค่าเฉลี่ย 7 วัน</h2>
            <p className="stat-value">{stats.avg}/5</p>
          </div>
          <div className="stat-card">
            <h2>วันที่เครียดที่สุด</h2>
            <p className="stat-value text-red">{stats.worstDay}</p>
          </div>
          <div className="stat-card">
            <h2>% วันดี</h2>
            <p className="stat-value text-green">{stats.goodPercent}%</p>
          </div>
        </div>

        <div className="card">
          <h2>Mood Trend (7 วัน)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#333" strokeDasharray="5 5" />
              <XAxis dataKey="day" stroke="#aaa" />
              <YAxis domain={[1, 5]} stroke="#aaa" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
            <button className="analyze-btn" onClick={analyzeWithLlama}>
              วิเคราะห์สุขภาพจิต (Ollama)
            </button>
            <button className="analyze-btn" onClick={analyzeWithGemini}>
              วิเคราะห์สุขภาพจิต (Gemini API)
            </button>
          </div>
        </div>

        <div className="card">
          <h2>ปฏิทินบันทึก</h2>
          <Calendar
            value={new Date()}
            onClickDay={handleDayClick}
            tileClassName={({ date }) => {
              const key = date.toLocaleDateString("en-CA", {
                timeZone: "Asia/Bangkok",
              });
              const entry = diaryData[key];
              if (!entry) return "";
              switch (entry.mood) {
                case 1:
                  return "mood-bad";
                case 2:
                  return "mood-poor";
                case 3:
                  return "mood-normal";
                case 4:
                  return "mood-good";
                case 5:
                  return "mood-happy";
                default:
                  return "";
              }
            }}
          />
        </div>

        <div className="card">
          <h2>บันทึกของวันนี้</h2>
          <div className="mood-picker">
            {moods.map((m) => (
              <button
                key={m.id}
                onClick={() => setTodayMood(m.id)}
                className={`mood-btn ${todayMood === m.id ? "active" : ""}`}
              >
                <img src={m.img} alt={m.label} width="40" />
              </button>
            ))}
          </div>
          <textarea
            value={todayNote}
            onChange={(e) => setTodayNote(e.target.value)}
            placeholder="วันนี้คุณเจออะไรมาบ้าง..."
            className="note-input"
          />
          <button onClick={handleSaveToday} className="save-btn">
            บันทึก
          </button>
        </div>
      </div>

      {modalData && (
        <div className="modal-overlay" onClick={() => setModalData(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modalData.date}</h3>
            {modalData.moodImg && (
              <img
                src={modalData.moodImg}
                alt={modalData.mood}
                width="50"
                style={{ margin: "1rem auto" }}
              />
            )}
            {modalData.mood && <p><strong>Mood:</strong> {modalData.mood}</p>}
            <p><strong>Note:</strong> {modalData.note}</p>
            <button onClick={() => setModalData(null)} className="close-btn">
              ปิด
            </button>
          </div>
        </div>
      )}

      {saveSuccessModal && (
        <div className="modal-overlay" onClick={() => setSaveSuccessModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>บันทึกสำเร็จ ✅</h3>
            <p>ข้อมูลของคุณถูกบันทึกแล้ว</p>
            <button onClick={() => setSaveSuccessModal(false)} className="close-btn">
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;