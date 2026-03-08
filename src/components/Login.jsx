import { useState } from "react";
import { LoginUser } from "../api/AuthApi";
import toast from "react-hot-toast";
import { UserAuth } from "../context/AuthContext";
import CryptoJS from "crypto-js";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const SECRET_KEY = "12345678901234567890123456789012";
  const IV = "1234567890123456";

  function encryptPassword(plainPassword) {
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
    const iv = CryptoJS.enc.Utf8.parse(IV);

    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(plainPassword),
      key,
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    return encrypted.toString();
  }
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { StoreToken } = UserAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      // Encrypt password
      const encryptedPassword = encryptPassword(password);

      const payload = {
        email: email,
        password: encryptedPassword,
        userId: "",
        searchKeyword: "",
      };

      const result = await LoginUser(payload);

      if (
        result?.Status &&
        Array.isArray(result?.Data) &&
        result.Data.length > 0
      ) {
        //sessionStorage.setItem("AdminUser", JSON.stringify(userDetails));
        const userData = result.Data[0];
        StoreToken(JSON.stringify(userData));
        toast.success("Login successful");
        navigate("/imagelist", { replace: true });

      } else {
        toast.error("Invalid email or password.");
      }
    } catch (err) {
      console.error("FULL ERROR --->", err.response?.data || err.message);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }

    // Remember Me
    // if (rememberMe) {
    //   localStorage.setItem("savedEmail", email);
    //   localStorage.setItem("password", password);
    // } else {
    //   localStorage.removeItem("savedEmail");
    //   localStorage.removeItem("password");
    // }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f3ff] px-6 font-['DM_Sans']">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-[0_18px_60px_rgba(98,20,254,0.15)] border border-[#e8e0ff] px-7 py-8">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center gap-2 font-['Sora'] font-extrabold text-[22px] tracking-tight text-[#6214fe]">
            <img src="/aniboard.png" alt="Aniboard Logo" className="h-6" />
          </div>
          <p className="text-[13px] text-[#7e6aaf] text-center">
            Sign in to continue to your animated board.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[12px] font-semibold text-[#3b2a70] font-['Sora']">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-xl border border-[#e0d4ff] bg-[#faf8ff] text-[13px] text-[#1a0a3c] placeholder:text-[#b3a2d6] outline-none focus:ring-2 focus:ring-[#c4b3ff] focus:border-[#6214fe] transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-semibold text-[#3b2a70] font-['Sora']">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl border border-[#e0d4ff] bg-[#faf8ff] text-[13px] text-[#1a0a3c] placeholder:text-[#b3a2d6] outline-none focus:ring-2 focus:ring-[#c4b3ff] focus:border-[#6214fe] transition-shadow"
            />
          </div>

          {error && (
            <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-1.5 py-2.5 rounded-xl bg-gradient-to-r from-[#6214fe] to-[#9059fd] text-white font-['Sora'] text-[13px] font-semibold shadow-[0_10px_30px_rgba(98,20,254,0.35)] disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

