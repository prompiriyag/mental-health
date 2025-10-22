import { useState } from "react";
import { auth } from "../services/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Register.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError("สมัครไม่สำเร็จ ❌ " + err.message);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h1>สมัครสมาชิก</h1>
        <p className="text-description">
          สร้างบัญชีใหม่เพื่อเริ่มใช้งาน 🚀
        </p>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleRegister} className="register-form">
          <input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">สมัครสมาชิก</button>
        </form>

        <p className="text-muted">
          มีบัญชีแล้ว?{" "}
          <Link to="/login">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}
