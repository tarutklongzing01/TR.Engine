import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const REDIRECT_AFTER_LOGIN = "index.html";
const AUTH_PAGES = ["login.html", "register.html"];

function $(id) {
  return document.getElementById(id);
}

function getPageName() {
  const page = location.pathname.split("/").pop();
  return page || "login.html";
}

function showMessage(message, success = false) {
  const el = $("authMessage");
  if (!el) return;

  el.textContent = message;
  el.className = success ? "msg success" : "msg error";
}

function clearMessage() {
  const el = $("authMessage");
  if (!el) return;

  el.textContent = "";
  el.className = "msg";
}

function setButtonLoading(buttonEl, isLoading, loadingText) {
  if (!buttonEl) return;

  if (isLoading) {
    if (!buttonEl.dataset.originalText) {
      buttonEl.dataset.originalText = buttonEl.textContent;
    }
    buttonEl.disabled = true;
    buttonEl.style.opacity = "0.7";
    buttonEl.style.pointerEvents = "none";
    buttonEl.textContent = loadingText;
  } else {
    buttonEl.disabled = false;
    buttonEl.style.opacity = "1";
    buttonEl.style.pointerEvents = "auto";
    buttonEl.textContent = buttonEl.dataset.originalText || buttonEl.textContent;
  }
}

function revealPage() {
  document.body.style.visibility = "visible";
}

function getFriendlyError(err) {
  const code = err?.code || "";

  switch (code) {
    case "auth/invalid-email":
      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "ไม่พบบัญชี หรืออีเมล/รหัสผ่านไม่ถูกต้อง";
    case "auth/wrong-password":
      return "รหัสผ่านไม่ถูกต้อง";
    case "auth/email-already-in-use":
      return "อีเมลนี้ถูกใช้งานแล้ว";
    case "auth/weak-password":
      return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    case "auth/popup-blocked":
      return "เบราว์เซอร์บล็อก popup ของ Google กรุณาอนุญาต popup แล้วลองใหม่";
    case "auth/popup-closed-by-user":
      return "คุณปิดหน้าต่าง Google ก่อนดำเนินการเสร็จ";
    case "auth/cancelled-popup-request":
      return "มีการกดเปิดหน้าต่างซ้ำ กรุณาลองใหม่";
    case "auth/network-request-failed":
      return "เชื่อมต่อเครือข่ายไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต";
    case "auth/too-many-requests":
      return "ลองหลายครั้งเกินไป กรุณารอสักครู่แล้วค่อยลองใหม่";
    default:
      return err?.message
        ? `เกิดข้อผิดพลาด: ${err.message}`
        : "เกิดข้อผิดพลาด กรุณาลองใหม่";
  }
}

async function ensureMemberDoc(user, fallbackName = "") {
  const ref = doc(db, "members", user.uid);
  const snap = await getDoc(ref);

  const displayName = user.displayName || fallbackName || "สมาชิก";
  const providerId = user.providerData?.[0]?.providerId || "password";

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email || "",
      displayName,
      role: "member",
      provider: providerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return;
  }

  const current = snap.data() || {};
  await setDoc(ref, {
    ...current,
    uid: user.uid,
    email: user.email || current.email || "",
    displayName: current.displayName || displayName,
    provider: current.provider || providerId,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function loginMember() {
  const email = $("loginEmail")?.value.trim();
  const password = $("loginPassword")?.value;
  const btn = $("loginBtn");

  clearMessage();

  if (!email || !password) {
    showMessage("กรอกอีเมลและรหัสผ่านก่อน");
    return;
  }

  try {
    setButtonLoading(btn, true, "กำลังเข้าสู่ระบบ...");
    showMessage("กำลังตรวจสอบข้อมูล...", true);

    const cred = await signInWithEmailAndPassword(auth, email, password);
    await ensureMemberDoc(cred.user);

    showMessage("เข้าสู่ระบบสำเร็จ", true);
    // ไม่ redirect ตรงนี้ ปล่อยให้ onAuthStateChanged จัดการ
  } catch (err) {
    showMessage(getFriendlyError(err));
  } finally {
    setButtonLoading(btn, false);
  }
}

async function registerMember() {
  const displayName = $("regDisplayName")?.value.trim();
  const email = $("regEmail")?.value.trim();
  const password = $("regPassword")?.value;
  const confirmPassword = $("regConfirmPassword")?.value;
  const acceptTerms = $("acceptTerms")?.checked;
  const btn = $("registerBtn");

  clearMessage();

  if (!displayName || !email || !password || !confirmPassword) {
    showMessage("กรอกข้อมูลให้ครบ");
    return;
  }

  if (!acceptTerms) {
    showMessage("กรุณายอมรับเงื่อนไขก่อนสมัครสมาชิก");
    return;
  }

  if (password.length < 6) {
    showMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("ยืนยันรหัสผ่านไม่ตรงกัน");
    return;
  }

  try {
    setButtonLoading(btn, true, "กำลังสร้างบัญชี...");
    showMessage("กำลังสมัครสมาชิก...", true);

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }

    await ensureMemberDoc(cred.user, displayName);

    showMessage("สมัครสมาชิกสำเร็จ", true);
    // ไม่ redirect ตรงนี้ ปล่อยให้ onAuthStateChanged จัดการ
  } catch (err) {
    showMessage(getFriendlyError(err));
  } finally {
    setButtonLoading(btn, false);
  }
}

async function loginWithGoogle() {
  const btn = $("googleBtn");
  const acceptTermsEl = $("acceptTerms");

  clearMessage();

  if (acceptTermsEl && !acceptTermsEl.checked) {
    showMessage("กรุณายอมรับเงื่อนไขก่อนสมัคร/เข้าสู่ระบบด้วย Google");
    return;
  }

  try {
    setButtonLoading(btn, true, "กำลังเชื่อมต่อ Google...");
    showMessage("กำลังเปิดหน้าต่าง Google...", true);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const result = await signInWithPopup(auth, provider);
    await ensureMemberDoc(result.user);

    showMessage("เข้าสู่ระบบด้วย Google สำเร็จ", true);
    // ไม่ redirect ตรงนี้ ปล่อยให้ onAuthStateChanged จัดการ
  } catch (err) {
    showMessage(getFriendlyError(err));
  } finally {
    setButtonLoading(btn, false);
  }
}

async function logoutMember() {
  try {
    await signOut(auth);
    window.location.replace("login.html");
  } catch (err) {
    alert("ออกจากระบบไม่สำเร็จ: " + getFriendlyError(err));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = $("loginForm");
  const registerForm = $("registerForm");
  const logoutBtn = $("logoutBtn");
  const googleBtn = $("googleBtn");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await loginMember();
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await registerMember();
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      await loginWithGoogle();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await logoutMember();
    });
  }
});

onAuthStateChanged(auth, async (user) => {
  const page = getPageName();

  try {
    if (user) {
      await ensureMemberDoc(user);

      if (AUTH_PAGES.includes(page)) {
        window.location.replace(REDIRECT_AFTER_LOGIN);
        return;
      }
    } else {
      if (!AUTH_PAGES.includes(page)) {
        window.location.replace("login.html");
        return;
      }
    }

    revealPage();
  } catch (err) {
    console.error("onAuthStateChanged error:", err);
    revealPage();
  }
});

window.loginMember = loginMember;
window.registerMember = registerMember;
window.loginWithGoogle = loginWithGoogle;
window.logoutMember = logoutMember;

export { auth, db };