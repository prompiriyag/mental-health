import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง ❌");
      console.error(err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>เข้าสู่ระบบ</h1>
        <p className="text-description">
          ยินดีต้อนรับกลับมา 💙 กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ
        </p>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">เข้าสู่ระบบ</button>
        </form>

        <p className="text-muted">
          ยังไม่มีบัญชี?{" "}
          <Link to="/register">สมัครสมาชิก</Link>
        </p>
      </div>
    </div>
  );
}


