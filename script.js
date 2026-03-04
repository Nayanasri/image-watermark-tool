// ── DOM references ──
const canvas      = document.getElementById("canvas");
const ctx         = canvas.getContext("2d");
const placeholder = document.getElementById("placeholder");
const downloadBtn = document.getElementById("downloadBtn");

// ── State ──
let baseImage      = null;   // HTMLImageElement
let watermarkImage = null;   // HTMLImageElement
let size     = 75;           // percent
let opacity  = 50;           // percent
let rotation = 0;            // degrees
let position = "bottom-right";

// ─────────────────────────────────────
// 1. IMAGE LOADING
// ─────────────────────────────────────
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Base image upload
document.getElementById("baseInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById("baseName").textContent = file.name;
  baseImage = await loadImage(file);
  downloadBtn.disabled = false;
  drawCanvas();
});

// Watermark image upload
document.getElementById("wmInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById("wmName").textContent = file.name;
  watermarkImage = await loadImage(file);
  drawCanvas();
});

// ─────────────────────────────────────
// 2. SLIDER CONTROLS
// ─────────────────────────────────────
document.getElementById("size").addEventListener("input", (e) => {
  size = Number(e.target.value);
  document.getElementById("sizeVal").textContent = size + "%";
  drawCanvas();
});

document.getElementById("opacity").addEventListener("input", (e) => {
  opacity = Number(e.target.value);
  document.getElementById("opacityVal").textContent = opacity + "%";
  drawCanvas();
});

document.getElementById("rotation").addEventListener("input", (e) => {
  rotation = Number(e.target.value);
  document.getElementById("rotationVal").textContent = rotation + "°";
  drawCanvas();
});

// ─────────────────────────────────────
// 3. POSITION GRID
// ─────────────────────────────────────
document.getElementById("positionGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-pos]");
  if (!btn) return;

  // Toggle active class
  document.querySelectorAll("#positionGrid button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  position = btn.dataset.pos;
  drawCanvas();
});

// ─────────────────────────────────────
// 4. CANVAS DRAWING (core engine)
// ─────────────────────────────────────
function getWatermarkXY(cw, ch, wmW, wmH) {
  const pad = 20;
  const positions = {
    "top-left":      [pad,              pad],
    "top-center":    [(cw - wmW) / 2,   pad],
    "top-right":     [cw - wmW - pad,   pad],
    "middle-left":   [pad,              (ch - wmH) / 2],
    "center":        [(cw - wmW) / 2,   (ch - wmH) / 2],
    "middle-right":  [cw - wmW - pad,   (ch - wmH) / 2],
    "bottom-left":   [pad,              ch - wmH - pad],
    "bottom-center": [(cw - wmW) / 2,   ch - wmH - pad],
    "bottom-right":  [cw - wmW - pad,   ch - wmH - pad],
  };
  return positions[position];
}

function drawCanvas() {
  if (!baseImage) return;

  // Step 1 – size the canvas to match the base image
  canvas.width  = baseImage.naturalWidth;
  canvas.height = baseImage.naturalHeight;

  // Step 2 – draw base image
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseImage, 0, 0);

  // Step 3 – draw watermark (if uploaded)
  if (watermarkImage) {
    const scale = size / 100;
    const wmW   = watermarkImage.naturalWidth  * scale;
    const wmH   = watermarkImage.naturalHeight * scale;
    const [x, y] = getWatermarkXY(canvas.width, canvas.height, wmW, wmH);

    ctx.save();
    ctx.globalAlpha = opacity / 100;          // transparency
    ctx.translate(x + wmW / 2, y + wmH / 2); // move origin to wm center
    ctx.rotate((rotation * Math.PI) / 180);   // rotate around center
    ctx.drawImage(watermarkImage, -wmW / 2, -wmH / 2, wmW, wmH);
    ctx.restore();
  }

  // Show canvas, hide placeholder
  canvas.style.display = "block";
  placeholder.style.display = "none";
}

// ─────────────────────────────────────
// 5. DOWNLOAD
// ─────────────────────────────────────
downloadBtn.addEventListener("click", () => {
  if (!baseImage) return;
  const link = document.createElement("a");
  link.download = "watermarked-image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
