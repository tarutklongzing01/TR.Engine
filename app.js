import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);
const PI = Math.PI;

function fmt(n, digits = 2) {
  return Number(n).toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function num(id) {
  const el = $(id);
  return el ? parseFloat(el.value) : NaN;
}

function valid(...vals) {
  return vals.every((v) => Number.isFinite(v) && v > 0);
}

function setResult(id, html) {
  const el = $(id);
  if (el) el.innerHTML = html;
}

function ratingPistonSpeed(speed) {
  if (speed < 20) return "ใช้งานสบาย";
  if (speed < 24) return "เริ่มตึง";
  if (speed <= 25) return "ค่อนข้างสูง";
  return "เสี่ยงสูง";
}

window.calcCC = function () {
  const bore = num("cc_bore");
  const stroke = num("cc_stroke");

  if (!valid(bore, stroke)) {
    return alert("กรอก Bore และ Stroke ให้ถูกต้อง");
  }

  const cc = (PI / 4) * bore * bore * stroke / 1000;

  setResult(
    "cc_result",
    `<div class="main">Engine = ${fmt(cc)} cc</div>
     <div class="muted">จาก Bore ${fmt(bore)} mm และ Stroke ${fmt(stroke)} mm</div>`
  );

  if ($("scr_engine")) $("scr_engine").value = cc.toFixed(2);
  if ($("cfm_engine")) $("cfm_engine").value = cc.toFixed(2);
  if ($("inj_engine")) $("inj_engine").value = cc.toFixed(2);
};

window.calcSCR = function () {
  const engine = num("scr_engine");
  const chamber = num("scr_chamber");

  if (!valid(engine, chamber)) {
    return alert("กรอก Engine CC และ Chamber CC ให้ถูกต้อง");
  }

  const scr = (engine + chamber) / chamber;

  setResult(
    "scr_result",
    `<div class="main">Static CR = ${fmt(scr)} : 1</div>
     <div class="muted">ค่านี้ใช้ประเมินกำลังอัดพื้นฐาน</div>`
  );

  if ($("dcr_scr")) $("dcr_scr").value = scr.toFixed(2);
};

window.calcDCR = function () {
  const scr = num("dcr_scr");
  const ivc = num("dcr_ivc");

  if (!valid(scr, ivc) || ivc >= 180) {
    return alert("กรอก Static CR และ IVC ให้ถูกต้อง");
  }

  const eff = (180 - ivc) / 180;
  const dcr = 1 + (scr - 1) * eff;

  setResult(
    "dcr_result",
    `<div class="main">Dynamic CR = ${fmt(dcr)} : 1</div>
     <div class="muted">Effective Stroke ≈ ${fmt(eff * 100)}% ของระยะชักเต็ม</div>`
  );
};

window.calcRodRatio = function () {
  const rod = num("rod_length");
  const stroke = num("rod_stroke");

  if (!valid(rod, stroke)) {
    return alert("กรอก Rod Length และ Stroke ให้ถูกต้อง");
  }

  const rr = rod / stroke;
  let note = "สมดุลดี";

  if (rr < 1.65) note = "ก้านค่อนข้างสั้น รอบต้นมาไวแต่ side load สูง";
  else if (rr <= 1.75) note = "ช่วงสมดุล เหมาะกับการใช้งานทั่วไป";
  else note = "ก้านค่อนข้างยาว รอบปลายอาจเด่นกว่า";

  setResult(
    "rod_result",
    `<div class="main">Rod Ratio = ${fmt(rr, 3)}</div>
     <div class="muted">${note}</div>`
  );
};

window.calcPistonSpeed = function () {
  const stroke = num("ps_stroke");
  const rpm = num("ps_rpm");

  if (!valid(stroke, rpm)) {
    return alert("กรอก Stroke และ RPM ให้ถูกต้อง");
  }

  const speed = 2 * (stroke / 1000) * rpm / 60;

  setResult(
    "ps_result",
    `<div class="main">Piston Speed = ${fmt(speed)} m/s</div>
     <div class="muted">สถานะ: ${ratingPistonSpeed(speed)}</div>`
  );

  if ($("rpm_stroke")) $("rpm_stroke").value = stroke.toFixed(2);
};

window.calcSafeRPM = function () {
  const speed = num("rpm_speed");
  const stroke = num("rpm_stroke");

  if (!valid(speed, stroke)) {
    return alert("กรอก Piston Speed Target และ Stroke ให้ถูกต้อง");
  }

  const rpm = (speed * 60) / (2 * (stroke / 1000));

  setResult(
    "rpm_result",
    `<div class="main">Safe Limit = ${fmt(rpm, 0)} rpm</div>
     <div class="muted">แนะนำตั้ง Rev Limiter ต่ำกว่านี้ประมาณ 500-1,000 rpm</div>`
  );
};

window.calcCFM = function () {
  const engine = num("cfm_engine");
  const rpm = num("cfm_rpm");

  if (!valid(engine, rpm)) {
    return alert("กรอก Engine CC และ RPM ให้ถูกต้อง");
  }

  const cid = engine / 16.387;
  const standard = cid * rpm * 0.85 / 3456;
  const touring = cid * rpm * 0.95 / 3456;
  const racing = cid * rpm * 1.05 / 3456;

  setResult(
    "cfm_result",
    `<div class="main">CFM Estimate</div>
     <div class="muted">Standard: ${fmt(standard)} | Touring: ${fmt(touring)} | Racing: ${fmt(racing)}</div>`
  );
};

window.calcRingGap = function () {
  const boreMM = num("ring_bore");

  if (!valid(boreMM)) {
    return alert("กรอก Bore ให้ถูกต้อง");
  }

  const boreIn = boreMM / 25.4;
  const topMM = boreIn * 0.0040 * 25.4;
  const secondMM = boreIn * 0.0045 * 25.4;

  setResult(
    "ring_result",
    `<div class="main">Ring Gap Estimate</div>
     <div class="muted">Top Ring: ${fmt(topMM, 3)} mm | Second Ring: ${fmt(secondMM, 3)} mm</div>`
  );
};

window.calcInjector = function () {
  const engine = num("inj_engine");

  if (!valid(engine)) {
    return alert("กรอก Engine CC ให้ถูกต้อง");
  }

  const liters = engine / 1000;
  const gasHp = liters * 120;
  const e20Hp = liters * 125;
  const e85Hp = liters * 135;

  const gas = gasHp * 0.55 * 10.5 / 0.85;
  const e20 = e20Hp * 0.60 * 10.5 / 0.85;
  const e85 = e85Hp * 0.75 * 10.5 / 0.85;

  setResult(
    "inj_result",
    `<div class="main">Injector Estimate</div>
     <div class="muted">Gas95: ${fmt(gas, 0)} cc/min | E20: ${fmt(e20, 0)} cc/min | E85: ${fmt(e85, 0)} cc/min</div>`
  );
};

window.fillDemo = function () {
  if ($("cc_bore")) $("cc_bore").value = 61;
  if ($("cc_stroke")) $("cc_stroke").value = 57.9;
  if ($("scr_chamber")) $("scr_chamber").value = 15.5;
  if ($("dcr_ivc")) $("dcr_ivc").value = 50;
  if ($("rod_length")) $("rod_length").value = 97;
  if ($("rod_stroke")) $("rod_stroke").value = 57.9;
  if ($("ps_stroke")) $("ps_stroke").value = 57.9;
  if ($("ps_rpm")) $("ps_rpm").value = 10000;
  if ($("rpm_speed")) $("rpm_speed").value = 24;
  if ($("rpm_stroke")) $("rpm_stroke").value = 57.9;
  if ($("cfm_rpm")) $("cfm_rpm").value = 10000;
  if ($("ring_bore")) $("ring_bore").value = 61;

  calcCC();
  calcSCR();
  calcDCR();
  calcRodRatio();
  calcPistonSpeed();
  calcSafeRPM();
  calcCFM();
  calcRingGap();
  calcInjector();
};

window.resetAll = function () {
  document.querySelectorAll("input").forEach((el) => {
    el.value = "";
  });

  setResult("cc_result", `<div class="main">Engine = -</div><div class="muted">รอคำนวณ</div>`);
  setResult("scr_result", `<div class="main">Static CR = -</div><div class="muted">รอคำนวณ</div>`);
  setResult("dcr_result", `<div class="main">Dynamic CR = -</div><div class="muted">รอคำนวณ</div>`);
  setResult("rod_result", `<div class="main">Rod Ratio = -</div><div class="muted">รอคำนวณ</div>`);
  setResult("ps_result", `<div class="main">Piston Speed = -</div><div class="muted">รอคำนวณ</div>`);
  setResult("rpm_result", `<div class="main">Safe Limit = -</div><div class="muted">รอคำนวณ</div>`);
  setResult("cfm_result", `<div class="main">CFM = -</div><div class="muted">รอคำนวณ</div>`);
  setResult("ring_result", `<div class="main">Ring Gap = -</div><div class="muted">รอคำนวณ</div>`);
  setResult("inj_result", `<div class="main">Injector = -</div><div class="muted">รอคำนวณ</div>`);
};

window.logoutMember = async function () {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (err) {
    console.error("logout error:", err);
    alert("ออกจากระบบไม่สำเร็จ");
  }
};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const memberStatus = $("memberStatus");
  const memberRole = $("memberRole");

  if (memberStatus) {
    memberStatus.textContent = "สมาชิก: กำลังโหลด...";
  }

  if (memberRole) {
    memberRole.textContent = "สิทธิ์: member";
  }

  try {
    const snap = await getDoc(doc(db, "members", user.uid));

    let nickname = "";
    let role = "member";

    if (snap.exists()) {
      const data = snap.data();
      nickname = (data.displayName || "").trim();
      role = (data.role || "member").trim();
    }

    if (!nickname) {
      nickname = (user.displayName || "").trim();
    }

    if (!nickname && user.email) {
      nickname = user.email.split("@")[0];
    }

    if (!nickname) {
      nickname = "สมาชิก";
    }

    if (memberStatus) {
      memberStatus.textContent = `สมาชิก: ${nickname}`;
    }

    if (memberRole) {
      memberRole.textContent = `สิทธิ์: ${role}`;
    }
  } catch (err) {
    console.error("read member profile error:", err);

    let nickname = (user.displayName || "").trim();
    if (!nickname && user.email) {
      nickname = user.email.split("@")[0];
    }
    if (!nickname) {
      nickname = "สมาชิก";
    }

    if (memberStatus) {
      memberStatus.textContent = `สมาชิก: ${nickname}`;
    }
  }
});