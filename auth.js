import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);

function setMsg(id, message, isError = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? "#ffd1d1" : "#dcecff";
  el.style.borderColor = isError
    ? "rgba(255,107,107,.30)"
    : "rgba(255,255,255,.08)";
  el.style.background = isError
    ? "rgba(255,107,107,.08)"
    : "rgba(255,255,255,.04)";
}

function firebaseErrorTH(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "อีเมลนี้ถูกใช้งานแล้ว";
    case "auth/invalid-email":
      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "auth/weak-password":
      return "รหัสผ่านอ่อนเกินไป";
    case "auth/user-not-found":
      return "ไม่พบบัญชีผู้ใช้นี้";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "auth/too-many-requests":
      return "ลองหลายครั้งเกินไป กรุณารอสักครู่";
    default:
      return code || "เกิดข้อผิดพลาด";
  }
}

async function registerMember() {
  const displayName = $("regDisplayName")?.value.trim() || "";
  const email = $("regEmail")?.value.trim() || "";
  const password = $("regPassword")?.value || "";
  const confirm = $("regConfirmPassword")?.value || "";

  if (!displayName || !email || !password || !confirm) {
    return setMsg("authMessage", "กรอกข้อมูลให้ครบก่อน", true);
  }

  if (password.length < 6) {
    return setMsg("authMessage", "รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร", true);
  }

  if (password !== confirm) {
    return setMsg("authMessage", "ยืนยันรหัสผ่านไม่ตรงกัน", true);
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(cred.user, { displayName });

    await setDoc(doc(db, "members", cred.user.uid), {
      uid: cred.user.uid,
      displayName,
      email,
      role: "member",
      createdAt: serverTimestamp()
    });

    window.location.href = "app.html";
  } catch (err) {
    setMsg(
      "authMessage",
      "สมัครสมาชิกไม่สำเร็จ: " + firebaseErrorTH(err.code),
      true
    );
    console.error("registerMember error:", err);
  }
}

async function loginMember() {
  const email = $("loginEmail")?.value.trim() || "";
  const password = $("loginPassword")?.value || "";

  if (!email || !password) {
    return setMsg("authMessage", "กรอกอีเมลและรหัสผ่านก่อน", true);
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "app.html";
  } catch (err) {
    setMsg(
      "authMessage",
      "เข้าสู่ระบบไม่สำเร็จ: " + firebaseErrorTH(err.code),
      true
    );
    console.error("loginMember error:", err);
  }
}

window.registerMember = registerMember;
window.loginMember = loginMember;

onAuthStateChanged(auth, (user) => {
  const path = window.location.pathname.split("/").pop() || "index.html";
  const authPages = ["", "index.html", "login.html", "register.html"];

  if (user && authPages.includes(path)) {
    window.location.href = "app.html";
  }
});