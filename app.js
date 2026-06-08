const equipmentTypes = {
  feed: { label: "入洗原煤", category: "入料", color: "input", outputs: ["raw"], defaults: {} },
  screen: { label: "原煤筛分", category: "筛分", outputs: ["coarse", "fine"], defaults: { efficiency: 92, cutSize: 13, moistureLoss: 0.5 } },
  dmc: { label: "重介旋流器", category: "重介", outputs: ["clean", "middling", "reject", "slime"], defaults: { density: 1.42, pressure: 0.12, cleanYield: 68, ep: 0.055 } },
  shallow: { label: "块煤重介浅槽", category: "重介", outputs: ["clean", "middling", "reject"], defaults: { density: 1.55, cleanYield: 72, mediumLoss: 0.9 } },
  deslime: { label: "脱泥筛", category: "筛分脱水", outputs: ["coarse", "slime"], defaults: { efficiency: 88, moistureLoss: 2.2 } },
  centrifuge: { label: "离心机", category: "脱水", outputs: ["clean", "water"], defaults: { moistureLoss: 6.5, solidRecovery: 98.5 } },
  magnetite: { label: "磁选机", category: "介质回收", outputs: ["slime", "medium"], defaults: { recovery: 99.2, mediumLoss: 0.35 } },
  slimeCyclone: { label: "分级旋流器", category: "煤泥分级", outputs: ["coarseSlime", "fineSlime"], defaults: { overflowRatio: 42, pressure: 0.09, cutSize: 0.25 } },
  spiral: { label: "螺旋分选机", category: "粗煤泥分选", outputs: ["clean", "reject"], defaults: { cleanYield: 58, separation: 76 } },
  thickener: { label: "浓缩机", category: "细煤泥回收", outputs: ["underflow", "water"], defaults: { flocculant: 28, underflowSolid: 320, recovery: 97 } },
  filter: { label: "压滤机", category: "脱水", outputs: ["cake", "water"], defaults: { cycle: 38, cakeMoisture: 24, recovery: 99 } },
  belt: { label: "皮带机", category: "输送", outputs: ["product"], defaults: { availability: 96, power: 18 } },
  bunker: { label: "筒仓", category: "装车", outputs: ["product"], defaults: { capacity: 6000, loadRate: 1200 } },
  product: { label: "产品仓", category: "产品", color: "product", outputs: ["product"], defaults: {} },
  reject: { label: "矸石/尾煤", category: "副产品", color: "waste", outputs: ["reject"], defaults: {} },
  water: { label: "循环水池", category: "水路", color: "recycle", outputs: ["water"], defaults: { recovery: 95 } },
  mediumTank: { label: "介质桶", category: "介质", color: "recycle", outputs: ["medium"], defaults: { density: 1.8, recovery: 98 } },
};

const streamLabels = {
  raw: "原煤",
  coarse: "块/末煤",
  fine: "筛下煤",
  clean: "精煤",
  middling: "中煤",
  reject: "矸石",
  slime: "煤泥",
  coarseSlime: "粗煤泥",
  fineSlime: "细煤泥",
  underflow: "底流",
  cake: "滤饼",
  water: "水路",
  medium: "介质",
  product: "产品",
};

const NODE_W = 178;
const NODE_H = 96;
const DESIGN_CANVAS_W = 820;
const DESIGN_CANVAS_H = 1280;
const LAYOUT_VERSION = 3;

let currentLinkScale = 1;

const defaultNodes = [
  node("feed", "入洗原煤", 350, 28),
  node("screen", "原煤筛分", 350, 164),
  node("deslime", "末煤脱泥筛", 240, 322),
  node("shallow", "块煤重介浅槽", 560, 322),
  node("dmc", "末煤重介旋流器", 240, 482),
  node("magnetite", "磁选机", 40, 642),
  node("slimeCyclone", "煤泥分级旋流器", 240, 642),
  node("spiral", "螺旋分选机", 240, 802),
  node("thickener", "浓缩机", 40, 802),
  node("filter", "压滤机", 40, 972),
  node("centrifuge", "离心机", 560, 502),
  node("belt", "精煤皮带", 560, 682),
  node("bunker", "精煤筒仓", 560, 852),
  node("product", "精煤产品", 560, 1032),
  node("reject", "矸石/尾煤", 390, 1032),
  node("mediumTank", "介质桶", 40, 1132),
  node("water", "循环水池", 240, 1132),
];

const defaultLinks = [
  link("feed-1", "screen-2", "raw", 82),
  link("feed-1", "deslime-3", "raw", 18),
  link("screen-2", "shallow-4", "coarse", 100),
  link("screen-2", "deslime-3", "fine", 100),
  link("deslime-3", "dmc-5", "coarse", 100),
  link("deslime-3", "magnetite-6", "slime", 100),
  link("shallow-4", "centrifuge-11", "clean", 100),
  link("shallow-4", "reject-15", "reject", 100),
  link("shallow-4", "reject-15", "middling", 100),
  link("dmc-5", "centrifuge-11", "clean", 100),
  link("dmc-5", "reject-15", "reject", 100),
  link("dmc-5", "reject-15", "middling", 100),
  link("dmc-5", "magnetite-6", "slime", 100),
  link("magnetite-6", "slimeCyclone-7", "slime", 100),
  link("magnetite-6", "mediumTank-16", "medium", 100),
  link("slimeCyclone-7", "spiral-8", "coarseSlime", 100),
  link("slimeCyclone-7", "thickener-9", "fineSlime", 100),
  link("spiral-8", "belt-12", "clean", 100),
  link("spiral-8", "reject-15", "reject", 100),
  link("thickener-9", "filter-10", "underflow", 100),
  link("thickener-9", "water-17", "water", 100),
  link("filter-10", "reject-15", "cake", 100),
  link("filter-10", "water-17", "water", 100),
  link("centrifuge-11", "product-14", "clean", 100),
  link("centrifuge-11", "water-17", "water", 100),
  link("belt-12", "bunker-13", "product", 100),
  link("bunker-13", "product-14", "product", 100),
];

let nodes = [];
let links = [];
let selectedId = null;
let results = {};
let incomingStreams = {};
let outputStreams = {};
let linkResults = {};
let summary = {};
let coalQuality = null;
let excelResults = null;
let linkSource = null;
let previewPoint = null;
let scenarios = [];
let activeScenarioId = null;

const canvas = document.getElementById("canvas");
const nodeLayer = document.getElementById("nodes");
const linkLayer = document.getElementById("links");
const inspector = document.getElementById("inspector");
const emptyInspector = document.getElementById("emptyInspector");
const contextMenu = document.getElementById("contextMenu");
const deleteNodeBtn = document.getElementById("deleteNodeBtn");
const scenarioSelect = document.getElementById("scenarioSelect");
const saveScenarioBtn = document.getElementById("saveScenarioBtn");
const newScenarioBtn = document.getElementById("newScenarioBtn");
const demoScenarioBtn = document.getElementById("demoScenarioBtn");
const deleteScenarioBtn = document.getElementById("deleteScenarioBtn");
const downloadTemplateBtn = document.getElementById("downloadTemplateBtn");
const downloadCsvTemplateBtn = document.getElementById("downloadCsvTemplateBtn");
const downloadExcelTemplateBtn = document.getElementById("downloadExcelTemplateBtn");
const importTemplateBtn = document.getElementById("importTemplateBtn");
const importTemplateFile = document.getElementById("importTemplateFile");
const topDownloadExcelTemplateBtn = document.getElementById("topDownloadExcelTemplateBtn");
const topImportTemplateBtn = document.getElementById("topImportTemplateBtn");
const importProgress = document.getElementById("importProgress");
const importProgressText = document.getElementById("importProgressText");
const importProgressBar = document.getElementById("importProgressBar");
const storageKey = "coalProcessScenariosV2";

function node(type, name, x, y) {
  return {
    id: `${type}-${Math.floor(Math.random() * 100000)}`,
    type,
    name,
    x,
    y,
    params: { ...equipmentTypes[type].defaults },
  };
}

function link(from, to, stream = "product", split = 100) {
  return { from, to, stream, split };
}

function resetFlow() {
  nodes = defaultNodes.map((item) => ({ ...item, params: { ...item.params } }));
  nodes.forEach((item, index) => {
    item.id = `${item.type}-${index + 1}`;
  });
  links = defaultLinks.map((item) => ({ ...item }));
  selectedId = null;
  renderAll();
}

function resetFlowStateOnly() {
  nodes = defaultNodes.map((item) => ({ ...item, params: { ...item.params } }));
  nodes.forEach((item, index) => {
    item.id = `${item.type}-${index + 1}`;
  });
  links = defaultLinks.map((item) => ({ ...item }));
  selectedId = null;
  coalQuality = null;
  setFeed({ rate: 850, ash: 28.5, moisture: 9.5, fineRatio: 16 });
}

function renderLibrary() {
  const library = document.getElementById("equipmentLibrary");
  const addable = ["screen", "dmc", "shallow", "deslime", "centrifuge", "magnetite", "slimeCyclone", "spiral", "thickener", "filter", "belt", "bunker", "water", "mediumTank", "product", "reject"];
  library.innerHTML = "";
  addable.forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.draggable = true;
    button.dataset.type = type;
    button.innerHTML = `${equipmentTypes[type].label}<span>${equipmentTypes[type].category}</span>`;
    button.addEventListener("click", () => addNode(type));
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", type);
      event.dataTransfer.effectAllowed = "copy";
    });
    library.appendChild(button);
  });
}

function addNode(type, point) {
  const bounds = canvas.getBoundingClientRect();
  const id = `${type}-${Date.now().toString(36)}`;
  const canvasW = Math.max(canvas.scrollWidth, canvas.clientWidth);
  const canvasH = Math.max(canvas.scrollHeight, canvas.clientHeight);
  nodes.push({
    id,
    type,
    name: equipmentTypes[type].label,
    x: point ? clamp(point.x - bounds.left + canvas.scrollLeft - NODE_W / 2, 8, canvasW - NODE_W - 8) : 420 + Math.random() * 260,
    y: point ? clamp(point.y - bounds.top + canvas.scrollTop - NODE_H / 2, 8, canvasH - NODE_H - 8) : 120 + Math.random() * 270,
    params: { ...equipmentTypes[type].defaults },
  });
  selectedId = id;
  touchActiveScenario();
  renderAll();
}

function renderAll() {
  calculate();
  syncCanvasDimensions();
  renderNodes();
  renderLinks();
  renderInspector();
  renderCoalQualityView();
  renderCoalQualityBadge();
}

function renderNodes() {
  nodeLayer.innerHTML = "";
  nodes.forEach((item) => {
    const div = document.createElement("div");
    const calibrated = coalQuality && ["feed", "screen", "deslime", "dmc", "shallow", "slimeCyclone", "spiral"].includes(item.type);
    div.className = `node ${equipmentTypes[item.type].color || ""} ${item.id === selectedId ? "selected" : ""} ${linkSource?.id === item.id ? "connecting" : ""} ${calibrated ? "coal-calibrated" : ""}`;
    div.style.left = `${item.x}px`;
    div.style.top = `${item.y}px`;
    div.dataset.id = item.id;
    const r = results[item.id];
    const ports = equipmentTypes[item.type].outputs;
    div.innerHTML = `
      <span class="port input ${linkSource && linkSource.id !== item.id ? "ready" : ""}" data-port="input" title="连接入口"></span>
      <div class="node-title">${item.name}</div>
      <div class="node-meta">${equipmentTypes[item.type].category}<br>${r ? `${fmt(r.input)}→${fmt(r.output)} t/h · 灰分 ${fmt(r.ash, 1)}%` : "等待计算"}</div>
      <div class="output-ports">
        ${ports.map((stream, index) => `<span class="port output output-${index}" data-port="output" data-stream="${stream}" data-label="${streamLabels[stream]}" title="${streamLabels[stream]}出口"></span>`).join("")}
      </div>
    `;
    div.addEventListener("pointerdown", startDrag);
    div.addEventListener("click", () => {
      selectedId = item.id;
      hideContextMenu();
      renderAll();
    });
    div.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      selectedId = item.id;
      showContextMenu(event.clientX, event.clientY);
      renderAll();
    });
    nodeLayer.appendChild(div);
  });
  nodeLayer.querySelectorAll(".port.output").forEach((port) => port.addEventListener("pointerdown", startLink));
  nodeLayer.querySelectorAll(".port.input").forEach((port) => port.addEventListener("pointerup", finishLink));
}

function getNodesContentSize() {
  if (!nodes.length) return { width: DESIGN_CANVAS_W, height: DESIGN_CANVAS_H };
  let maxX = NODE_W + 56;
  let maxY = NODE_H + 56;
  nodes.forEach((n) => {
    maxX = Math.max(maxX, n.x + NODE_W + 56);
    maxY = Math.max(maxY, n.y + NODE_H + 56);
  });
  return { width: maxX, height: maxY };
}

function syncCanvasDimensions() {
  const content = getNodesContentSize();
  const width = Math.max(content.width, canvas.clientWidth || 0, DESIGN_CANVAS_W);
  const height = Math.max(content.height, canvas.clientHeight || 0, 540);
  const w = `${width}px`;
  const h = `${height}px`;
  nodeLayer.style.width = w;
  nodeLayer.style.height = h;
  linkLayer.style.width = w;
  linkLayer.style.height = h;
}

function getLinkScale() {
  const viewW = Math.max(canvas.clientWidth || DESIGN_CANVAS_W, 320);
  const viewH = Math.max(canvas.clientHeight || 540, 320);
  const content = getNodesContentSize();
  const scaleX = viewW / DESIGN_CANVAS_W;
  const scaleY = viewH / DESIGN_CANVAS_H;
  const contentX = content.width / DESIGN_CANVAS_W;
  const contentY = content.height / DESIGN_CANVAS_H;
  const scale = Math.min(scaleX, scaleY, Math.max(contentX, 0.85), Math.max(contentY, 0.85));
  return clamp(scale, 0.72, 1.45);
}

function applyLinkScaleVars() {
  currentLinkScale = getLinkScale();
  canvas.style.setProperty("--link-scale", currentLinkScale.toFixed(3));
  return currentLinkScale;
}

function renderLinks() {
  syncCanvasDimensions();
  const scale = applyLinkScaleVars();
  const width = Math.max(canvas.scrollWidth, nodeLayer.scrollWidth, canvas.clientWidth);
  const height = Math.max(canvas.scrollHeight, nodeLayer.scrollHeight, canvas.clientHeight);
  linkLayer.setAttribute("viewBox", `0 0 ${width} ${height}`);
  linkLayer.setAttribute("width", String(width));
  linkLayer.setAttribute("height", String(height));
  linkLayer.innerHTML = "";
  const lanes = computeLinkLanes(links);
  const sorted = links
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const fa = nodes.find((n) => n.id === a.item.from);
      const fb = nodes.find((n) => n.id === b.item.from);
      const ta = nodes.find((n) => n.id === a.item.to);
      const tb = nodes.find((n) => n.id === b.item.to);
      const lenA = fa && ta ? Math.hypot(ta.x - fa.x, ta.y - fa.y) : 0;
      const lenB = fb && tb ? Math.hypot(tb.x - fb.x, tb.y - fb.y) : 0;
      return lenB - lenA;
    });
  sorted.forEach(({ item, index }) => {
    const from = nodes.find((nodeItem) => nodeItem.id === item.from);
    const to = nodes.find((nodeItem) => nodeItem.id === item.to);
    if (!from || !to) return;
    drawLink(from, to, item.stream, false, linkResults[index], lanes[index], scale);
  });
  if (linkSource && previewPoint) {
    const from = nodes.find((item) => item.id === linkSource.id);
    if (from) drawPreviewLink(from, linkSource.stream, previewPoint, scale);
  }
}

function computeLinkLanes(linkList) {
  const pairIndex = {};
  const fromStreamIndex = {};
  return linkList.map((link) => {
    const key = `${link.from}|${link.to}`;
    const idx = pairIndex[key] || 0;
    pairIndex[key] = idx + 1;
    const pairLane = idx === 0 ? 0 : (idx % 2 === 1 ? 1 : -1) * 16 * Math.ceil(idx / 2);

    const streamKey = `${link.from}|${link.stream}`;
    const streamIdx = fromStreamIndex[streamKey] || 0;
    fromStreamIndex[streamKey] = streamIdx + 1;
    const streamLane = streamIdx * 6;

    return pairLane + streamLane;
  });
}

function buildOrthogonalRoute(start, end, lane = 0, scale = 1) {
  const stub = 26 * scale;
  const bump = 6 * scale;
  const dy = end.y - start.y;
  let midY;
  if (Math.abs(dy) <= stub * 2) {
    midY = start.y + (dy >= 0 ? stub : -stub) + lane;
  } else if (dy > stub) {
    midY = start.y + stub + lane + bump;
  } else {
    midY = end.y + stub + lane + bump;
  }
  return [
    { x: start.x, y: start.y },
    { x: start.x, y: midY },
    { x: end.x, y: midY },
    { x: end.x, y: end.y },
  ];
}

function buildRoundedOrthogonalPath(points, radius = 14) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (i < points.length - 1) {
      const next = points[i + 1];
      const v1x = curr.x - prev.x;
      const v1y = curr.y - prev.y;
      const v2x = next.x - curr.x;
      const v2y = next.y - curr.y;
      const len1 = Math.hypot(v1x, v1y) || 1;
      const len2 = Math.hypot(v2x, v2y) || 1;
      const rr = Math.min(radius, len1 / 2, len2 / 2);
      const p1x = curr.x - (v1x / len1) * rr;
      const p1y = curr.y - (v1y / len1) * rr;
      const p2x = curr.x + (v2x / len2) * rr;
      const p2y = curr.y + (v2y / len2) * rr;
      d += ` L ${p1x} ${p1y} Q ${curr.x} ${curr.y} ${p2x} ${p2y}`;
    } else {
      d += ` L ${curr.x} ${curr.y}`;
    }
  }
  return d;
}

function linkLabelAnchor(points, scale = 1) {
  let best = null;
  let bestLen = 0;
  const labelLift = 9 * scale;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (Math.abs(a.y - b.y) < 0.5) {
      const len = Math.abs(a.x - b.x);
      if (len > bestLen) {
        bestLen = len;
        best = { x: (a.x + b.x) / 2, y: a.y - labelLift };
      }
    }
  }
  if (best) return best;
  const first = points[0];
  const last = points[points.length - 1];
  return { x: (first.x + last.x) / 2, y: (first.y + last.y) / 2 - labelLift };
}

function appendLinkLabel(text, anchor, stream, scale = 1) {
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("class", "link-label");
  label.setAttribute("x", `${anchor.x}`);
  label.setAttribute("y", `${anchor.y}`);
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("font-size", `${10.5 * scale}`);
  label.textContent = text;
  linkLayer.appendChild(label);
  const box = label.getBBox();
  const padX = 5 * scale;
  const padY = 3 * scale;
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("class", `link-label-bg stream-${stream}`);
  bg.setAttribute("x", String(box.x - padX));
  bg.setAttribute("y", String(box.y - padY));
  bg.setAttribute("width", String(box.width + padX * 2));
  bg.setAttribute("height", String(box.height + padY * 2));
  bg.setAttribute("rx", String(4 * scale));
  linkLayer.insertBefore(bg, label);
}

function routeWithArrow(points, scale = 1) {
  if (points.length < 2) return { drawPoints: points, tip: points[0], arrowFrom: points[0] };
  const end = points[points.length - 1];
  const prev = points[points.length - 2];
  const tip = shortenArrowTip(prev, end, 11 * scale);
  return { drawPoints: [...points.slice(0, -1), tip], tip, arrowFrom: prev };
}

function drawLink(from, to, stream, preview, result, lane = 0, scale = 1) {
  const start = outputPoint(from, stream);
  const end = inputPoint(to);
  const scaledLane = lane * scale;
  const route = buildOrthogonalRoute(start, end, scaledLane, scale);
  const { drawPoints, tip, arrowFrom } = routeWithArrow(route, scale);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", `flow-link stream-${stream} ${preview ? "preview" : ""}`);
  path.setAttribute("d", buildRoundedOrthogonalPath(drawPoints, 12 * scale));
  linkLayer.appendChild(path);
  drawArrowHead(arrowFrom, tip, stream, scale);
  if (result && result.mass > 0) {
    appendLinkLabel(`${streamLabels[stream]} ${fmt(result.mass)}t/h`, linkLabelAnchor(route, scale), stream, scale);
  }
}

function drawPreviewLink(from, stream, point, scale = 1) {
  const start = outputPoint(from, stream);
  const route = buildOrthogonalRoute(start, point, 0, scale);
  const { drawPoints, tip, arrowFrom } = routeWithArrow(route, scale);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", "flow-link preview");
  path.setAttribute("d", buildRoundedOrthogonalPath(drawPoints, 10 * scale));
  linkLayer.appendChild(path);
  drawArrowHead(arrowFrom, tip, "default", scale);
}

function shortenArrowTip(start, end, distance) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: end.x - (dx / len) * distance, y: end.y - (dy / len) * distance };
}

function drawArrowHead(from, tip, stream, scale = 1) {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const size = 13 * scale;
  const half = 5.5 * scale;
  const base = { x: tip.x - ux * size, y: tip.y - uy * size };
  const left = { x: base.x - uy * half, y: base.y + ux * half };
  const right = { x: base.x + uy * half, y: base.y - ux * half };
  const head = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  head.setAttribute("class", `flow-arrow stream-${stream}`);
  head.setAttribute("points", `${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`);
  linkLayer.appendChild(head);
}

function markerName(stream) {
  return ["clean", "product", "reject", "middling", "cake", "slime", "coarseSlime", "fineSlime", "underflow", "water", "medium"].includes(stream) ? stream : "default";
}

function outputPoint(item, stream) {
  const outputs = equipmentTypes[item.type].outputs;
  const index = Math.max(0, outputs.indexOf(stream));
  const slot = NODE_W / (outputs.length + 1);
  const offset = outputs.length === 1 ? NODE_W / 2 : slot * (index + 1);
  return { x: item.x + offset, y: item.y + NODE_H };
}

function inputPoint(item) {
  return { x: item.x + NODE_W / 2, y: item.y };
}

function computeOverviewLayers(nodeList, linkList) {
  const ids = new Set(nodeList.map((n) => n.id));
  const layer = {};
  nodeList.forEach((n) => {
    layer[n.id] = 0;
  });
  const maxIter = Math.max(nodeList.length + linkList.length, 1);
  for (let i = 0; i < maxIter; i++) {
    linkList.forEach((l) => {
      if (!ids.has(l.from) || !ids.has(l.to)) return;
      const next = layer[l.from] + 1;
      if (next > layer[l.to]) layer[l.to] = next;
    });
  }
  return layer;
}

function overviewNodeFill(type) {
  const c = equipmentTypes[type].color;
  if (c === "input") return "var(--blue)";
  if (c === "product") return "var(--green)";
  if (c === "waste") return "#6f7782";
  if (c === "recycle") return "var(--orange)";
  return "var(--blue)";
}

function createSvgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) el.setAttribute(key, String(value));
  });
  return el;
}

function overviewPortY(position, nodeItem, stream) {
  const outputs = equipmentTypes[nodeItem.type].outputs;
  const index = Math.max(0, outputs.indexOf(stream));
  if (outputs.length <= 1) return position.y + position.h / 2;
  const slot = position.h / (outputs.length + 1);
  return position.y + slot * (index + 1);
}

function overviewPortX(position, nodeItem, stream) {
  const outputs = equipmentTypes[nodeItem.type].outputs;
  const index = Math.max(0, outputs.indexOf(stream));
  if (outputs.length <= 1) return position.x + position.w / 2;
  const slot = position.w / (outputs.length + 1);
  return position.x + slot * (index + 1);
}

function appendOverviewArrowDefs(svg) {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const colors = {
    default: "#4f86b7",
    clean: "#2c9b68",
    product: "#2c9b68",
    reject: "#6f7782",
    middling: "#6f7782",
    cake: "#6f7782",
    slime: "#d27b25",
    coarseSlime: "#d27b25",
    fineSlime: "#d27b25",
    underflow: "#d27b25",
    water: "#16a3a7",
    medium: "#16a3a7",
  };
  Object.entries(colors).forEach(([name, color]) => {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", `ov-arrow-${name}`);
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "3");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "strokeWidth");
    const tri = document.createElementNS("http://www.w3.org/2000/svg", "path");
    tri.setAttribute("d", "M0,0 L9,3 L0,6 Z");
    tri.setAttribute("fill", color);
    marker.appendChild(tri);
    defs.appendChild(marker);
  });
  svg.appendChild(defs);
}

function renderFlowOverviewLegacy() {
  const svg = document.getElementById("flowOverviewSvg");
  const emptyEl = document.getElementById("flowOverviewEmpty");
  const hintEl = document.getElementById("flowOverviewHint");
  svg.innerHTML = "";
  hintEl.classList.add("hidden");
  hintEl.textContent = "";
  if (nodes.length === 0) {
    emptyEl.classList.remove("hidden");
    svg.classList.add("hidden");
    return;
  }
  emptyEl.classList.add("hidden");
  svg.classList.remove("hidden");
  if (links.length === 0) {
    hintEl.textContent = "当前没有连线：连接设备出口与入口后，总图将显示按颜色区分的流向箭头。";
    hintEl.classList.remove("hidden");
  }

  const layer = computeOverviewLayers(nodes, links);
  const byLayer = {};
  let maxL = 0;
  nodes.forEach((n) => {
    const L = layer[n.id];
    maxL = Math.max(maxL, L);
    if (!byLayer[L]) byLayer[L] = [];
    byLayer[L].push(n);
  });
  for (let L = 0; L <= maxL; L++) {
    if (byLayer[L]) {
      byLayer[L].sort((a, b) =>
        `${equipmentTypes[a.type].category}${a.name}`.localeCompare(`${equipmentTypes[b.type].category}${b.name}`, "zh-CN"),
      );
    }
  }

  const NODE_W = 172;
  const NODE_H = 48;
  const GAP_X = 52;
  const GAP_Y = 12;
  const PAD = 40;
  let maxRows = 0;
  for (let L = 0; L <= maxL; L++) {
    maxRows = Math.max(maxRows, (byLayer[L] || []).length);
  }
  const totalH = Math.max(NODE_H, maxRows * (NODE_H + GAP_Y) - GAP_Y);
  const positions = {};
  for (let L = 0; L <= maxL; L++) {
    const arr = byLayer[L] || [];
    const colH = Math.max(NODE_H, arr.length * (NODE_H + GAP_Y) - GAP_Y);
    const offsetY = PAD + (totalH - colH) / 2;
    arr.forEach((n, j) => {
      positions[n.id] = {
        x: PAD + L * (NODE_W + GAP_X),
        y: offsetY + j * (NODE_H + GAP_Y),
        w: NODE_W,
        h: NODE_H,
      };
    });
  }

  const svgW = PAD * 2 + (maxL + 1) * NODE_W + maxL * GAP_X;
  const svgH = PAD * 2 + totalH;
  svg.setAttribute("viewBox", `0 0 ${svgW} ${svgH}`);
  svg.setAttribute("preserveAspectRatio", "xMinYMin meet");

  appendOverviewArrowDefs(svg);

  const pairIndex = {};
  const edgeLabels = [];
  const spread = 12;
  links.forEach((l) => {
    const pf = positions[l.from];
    const pt = positions[l.to];
    if (!pf || !pt) return;
    const pairKey = `${l.from}|${l.to}`;
    const idx = pairIndex[pairKey] || 0;
    pairIndex[pairKey] = idx + 1;
    const bump = idx === 0 ? 0 : (idx % 2 === 1 ? 1 : -1) * spread * Math.ceil(idx / 2);
    const x1 = pf.x + pf.w;
    const y1 = pf.y + pf.h / 2 + bump;
    const x2 = pt.x;
    const y2 = pt.y + pt.h / 2 + bump;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);
    path.setAttribute("class", `flow-link flow-overview-flow stream-${l.stream}`);
    path.setAttribute("marker-end", `url(#ov-arrow-${markerName(l.stream)})`);
    svg.appendChild(path);
    edgeLabels.push({
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2 - 3,
      text: streamLabels[l.stream] || l.stream,
    });
  });

  nodes.forEach((n) => {
    const p = positions[n.id];
    if (!p) return;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String(p.x));
    rect.setAttribute("y", String(p.y));
    rect.setAttribute("width", String(p.w));
    rect.setAttribute("height", String(p.h));
    rect.setAttribute("rx", "8");
    rect.setAttribute("fill", overviewNodeFill(n.type));
    rect.setAttribute("class", "flow-overview-node");
    g.appendChild(rect);
    const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
    title.setAttribute("x", String(p.x + 12));
    title.setAttribute("y", String(p.y + 22));
    title.setAttribute("class", "flow-overview-node-text");
    const shortName = n.name.length > 11 ? `${n.name.slice(0, 10)}…` : n.name;
    title.textContent = shortName;
    g.appendChild(title);
    const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
    sub.setAttribute("x", String(p.x + 12));
    sub.setAttribute("y", String(p.y + 40));
    sub.setAttribute("class", "flow-overview-node-sub");
    sub.textContent = equipmentTypes[n.type].category;
    g.appendChild(sub);
    svg.appendChild(g);
  });

  edgeLabels.forEach((item) => {
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(item.x));
    label.setAttribute("y", String(item.y));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("class", "flow-overview-edge-label");
    label.textContent = item.text;
    svg.appendChild(label);
  });
}

function renderFlowOverview() {
  const svg = document.getElementById("flowOverviewSvg");
  const emptyEl = document.getElementById("flowOverviewEmpty");
  const hintEl = document.getElementById("flowOverviewHint");
  svg.innerHTML = "";
  hintEl.classList.add("hidden");
  hintEl.textContent = "";

  if (nodes.length === 0) {
    emptyEl.classList.remove("hidden");
    svg.classList.add("hidden");
    return;
  }

  emptyEl.classList.add("hidden");
  svg.classList.remove("hidden");

  if (links.length === 0) {
    hintEl.textContent = "当前没有连线：连接设备出口与入口后，总图将显示按颜色区分的流向箭头。";
    hintEl.classList.remove("hidden");
  }

  const layer = computeOverviewLayers(nodes, links);
  const byLayer = {};
  let maxL = 0;
  nodes.forEach((n) => {
    const L = layer[n.id];
    maxL = Math.max(maxL, L);
    if (!byLayer[L]) byLayer[L] = [];
    byLayer[L].push(n);
  });

  for (let L = 0; L <= maxL; L++) {
    if (byLayer[L]) {
      byLayer[L].sort((a, b) => a.x - b.x || a.y - b.y || a.name.localeCompare(b.name, "zh-CN"));
    }
  }

  const NODE_W = 178;
  const NODE_H = 58;
  const GAP_X = 46;
  const GAP_Y = 78;
  const PAD_X = 44;
  const PAD_TOP = 68;
  const PAD_BOTTOM = 52;
  const HEADER_X = 18;
  let maxCols = 0;

  for (let L = 0; L <= maxL; L++) {
    maxCols = Math.max(maxCols, (byLayer[L] || []).length);
  }

  const totalW = Math.max(NODE_W, maxCols * (NODE_W + GAP_X) - GAP_X);
  const positions = {};
  for (let L = 0; L <= maxL; L++) {
    const arr = byLayer[L] || [];
    const rowW = Math.max(NODE_W, arr.length * (NODE_W + GAP_X) - GAP_X);
    const offsetX = PAD_X + (totalW - rowW) / 2;
    arr.forEach((n, j) => {
      positions[n.id] = {
        x: offsetX + j * (NODE_W + GAP_X),
        y: PAD_TOP + L * (NODE_H + GAP_Y),
        w: NODE_W,
        h: NODE_H,
      };
    });
  }

  const svgW = PAD_X * 2 + totalW;
  const svgH = PAD_TOP + PAD_BOTTOM + (maxL + 1) * NODE_H + maxL * GAP_Y;
  svg.setAttribute("viewBox", `0 0 ${svgW} ${svgH}`);
  svg.setAttribute("preserveAspectRatio", "xMinYMin meet");

  appendOverviewArrowDefs(svg);

  const lanes = createSvgEl("g", { class: "flow-overview-lanes" });
  for (let L = 0; L <= maxL; L++) {
    const y = PAD_TOP + L * (NODE_H + GAP_Y);
    lanes.appendChild(createSvgEl("rect", {
      x: 14,
      y: y - 14,
      width: svgW - 28,
      height: NODE_H + 28,
      rx: 10,
      class: L % 2 === 0 ? "flow-overview-lane" : "flow-overview-lane alt",
    }));
    const label = createSvgEl("text", {
      x: HEADER_X,
      y: y + 20,
      class: "flow-overview-stage-label",
    });
    label.textContent = `第 ${L + 1} 段`;
    lanes.appendChild(label);
  }
  svg.appendChild(lanes);

  const edgeGroup = createSvgEl("g", { class: "flow-overview-edges" });
  const nodeGroup = createSvgEl("g", { class: "flow-overview-nodes" });
  const labelGroup = createSvgEl("g", { class: "flow-overview-labels" });
  const nodeById = Object.fromEntries(nodes.map((item) => [item.id, item]));
  const pairIndex = {};
  const edgeLabels = [];
  const spread = 16;

  links.forEach((l) => {
    const pf = positions[l.from];
    const pt = positions[l.to];
    const fromNode = nodeById[l.from];
    if (!pf || !pt || !fromNode) return;

    const pairKey = `${l.from}|${l.to}`;
    const idx = pairIndex[pairKey] || 0;
    pairIndex[pairKey] = idx + 1;
    const bump = idx === 0 ? 0 : (idx % 2 === 1 ? 1 : -1) * spread * Math.ceil(idx / 2);
    const start = { x: overviewPortX(pf, fromNode, l.stream), y: pf.y + pf.h };
    const end = { x: pt.x + pt.w / 2, y: pt.y };
    const route = buildOrthogonalRoute(start, end, bump);
    const path = createSvgEl("path", {
      d: buildRoundedOrthogonalPath(route, 10),
      class: `flow-link flow-overview-flow stream-${l.stream}`,
      "marker-end": `url(#ov-arrow-${markerName(l.stream)})`,
    });
    edgeGroup.appendChild(path);
    const labelPos = linkLabelAnchor(route);
    edgeLabels.push({
      x: labelPos.x,
      y: labelPos.y,
      text: streamLabels[l.stream] || l.stream,
    });
  });
  svg.appendChild(edgeGroup);

  nodes.forEach((n) => {
    const p = positions[n.id];
    if (!p) return;
    const g = createSvgEl("g", { class: "flow-overview-node-wrap" });
    g.appendChild(createSvgEl("rect", {
      x: p.x,
      y: p.y,
      width: p.w,
      height: p.h,
      rx: 8,
      fill: overviewNodeFill(n.type),
      class: "flow-overview-node",
    }));
    const title = createSvgEl("text", {
      x: p.x + 12,
      y: p.y + 23,
      class: "flow-overview-node-text",
    });
    title.textContent = n.name.length > 12 ? `${n.name.slice(0, 11)}...` : n.name;
    g.appendChild(title);
    const sub = createSvgEl("text", {
      x: p.x + 12,
      y: p.y + 43,
      class: "flow-overview-node-sub",
    });
    sub.textContent = equipmentTypes[n.type].category;
    g.appendChild(sub);
    nodeGroup.appendChild(g);
  });
  svg.appendChild(nodeGroup);

  edgeLabels.forEach((item) => {
    const text = createSvgEl("text", {
      x: item.x,
      y: item.y,
      "text-anchor": "middle",
      class: "flow-overview-edge-label",
    });
    text.textContent = item.text;
    labelGroup.appendChild(text);
  });
  svg.appendChild(labelGroup);
}

function openFlowOverview() {
  const modal = document.getElementById("flowOverviewModal");
  renderFlowOverview();
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("flowOverviewClose").focus();
}

function closeFlowOverview() {
  const modal = document.getElementById("flowOverviewModal");
  if (!modal || modal.classList.contains("hidden")) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function startDrag(event) {
  if (event.target.dataset.port) return;
  const target = event.currentTarget;
  const item = nodes.find((entry) => entry.id === target.dataset.id);
  selectedId = item.id;
  const startX = event.clientX;
  const startY = event.clientY;
  const originX = item.x;
  const originY = item.y;
  target.setPointerCapture(event.pointerId);
  const move = (moveEvent) => {
    const canvasW = Math.max(canvas.scrollWidth, canvas.clientWidth);
    const canvasH = Math.max(canvas.scrollHeight, canvas.clientHeight);
    item.x = clamp(originX + moveEvent.clientX - startX, 8, canvasW - NODE_W - 8);
    item.y = clamp(originY + moveEvent.clientY - startY, 8, canvasH - NODE_H - 8);
    target.style.left = `${item.x}px`;
    target.style.top = `${item.y}px`;
    renderLinks();
  };
  const up = () => {
    target.removeEventListener("pointermove", move);
    target.removeEventListener("pointerup", up);
    touchActiveScenario();
    renderAll();
  };
  target.addEventListener("pointermove", move);
  target.addEventListener("pointerup", up);
}

function startLink(event) {
  event.preventDefault();
  event.stopPropagation();
  const source = event.currentTarget.closest(".node");
  linkSource = { id: source.dataset.id, stream: event.currentTarget.dataset.stream };
  selectedId = linkSource.id;
  const move = (moveEvent) => {
    const bounds = canvas.getBoundingClientRect();
    previewPoint = {
      x: clamp(moveEvent.clientX - bounds.left + canvas.scrollLeft, 0, Math.max(canvas.scrollWidth, canvas.clientWidth)),
      y: clamp(moveEvent.clientY - bounds.top + canvas.scrollTop, 0, Math.max(canvas.scrollHeight, canvas.clientHeight)),
    };
    renderLinks();
  };
  const up = () => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    linkSource = null;
    previewPoint = null;
    renderAll();
  };
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up);
  renderAll();
}

function finishLink(event) {
  event.preventDefault();
  event.stopPropagation();
  const target = event.currentTarget.closest(".node");
  const targetId = target?.dataset.id;
  if (linkSource && targetId && linkSource.id !== targetId) {
    const exists = links.some((item) => item.from === linkSource.id && item.to === targetId && item.stream === linkSource.stream);
    if (!exists) links.push(link(linkSource.id, targetId, linkSource.stream, 100));
    touchActiveScenario();
  }
  linkSource = null;
  previewPoint = null;
  renderAll();
}

function renderInspector() {
  const item = nodes.find((entry) => entry.id === selectedId);
  if (!item) {
    inspector.classList.add("hidden");
    emptyInspector.classList.remove("hidden");
    return;
  }
  emptyInspector.classList.add("hidden");
  inspector.classList.remove("hidden");
  const params = Object.entries(item.params);
  const outgoing = links.filter((entry) => entry.from === item.id);
  inspector.innerHTML = `
    <label>设备名称<input data-field="name" value="${item.name}"></label>
    ${params.map(([key, value]) => `<label>${paramLabel(key)}<input data-param="${key}" type="number" step="0.01" value="${value}"></label>`).join("")}
    <div class="inspector-subtitle">输出连线分配</div>
    ${outgoing.length ? outgoing.map((entry, index) => {
      const target = nodes.find((nodeItem) => nodeItem.id === entry.to);
      return `<div class="link-control"><label>${streamLabels[entry.stream]} → ${target?.name || "未知设备"} %<input data-link-index="${index}" type="number" min="0" step="1" value="${entry.split}"></label><button type="button" data-delete-link="${index}">删除</button></div>`;
    }).join("") : `<div class="empty-state">从右侧出口拖拽到其他设备入口，可建立带物料类型的连线。</div>`}
  `;
  inspector.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      if (input.dataset.field === "name") item.name = input.value;
      if (input.dataset.param) item.params[input.dataset.param] = Number(input.value);
      if (input.dataset.linkIndex) outgoing[Number(input.dataset.linkIndex)].split = Number(input.value);
      touchActiveScenario();
      renderAll();
    });
  });
  inspector.querySelectorAll("[data-delete-link]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = outgoing[Number(button.dataset.deleteLink)];
      links = links.filter((entry) => entry !== target);
      touchActiveScenario();
      renderAll();
    });
  });
}

function deleteSelectedNode() {
  if (!selectedId) return;
  nodes = nodes.filter((item) => item.id !== selectedId);
  links = links.filter((item) => item.from !== selectedId && item.to !== selectedId);
  selectedId = null;
  touchActiveScenario();
  hideContextMenu();
  renderAll();
}

function showContextMenu(x, y) {
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.remove("hidden");
}

function hideContextMenu() {
  contextMenu.classList.add("hidden");
}

function setImportProgress(percent, text) {
  if (!importProgress) return;
  importProgress.classList.remove("hidden");
  importProgress.setAttribute("aria-hidden", "false");
  if (importProgressText) importProgressText.textContent = text;
  if (importProgressBar) importProgressBar.style.width = `${clamp(percent, 0, 100)}%`;
}

function hideImportProgress() {
  if (!importProgress) return;
  importProgress.classList.add("hidden");
  importProgress.setAttribute("aria-hidden", "true");
  if (importProgressBar) importProgressBar.style.width = "0%";
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function calculate() {
  results = {};
  incomingStreams = {};
  outputStreams = {};
  linkResults = {};
  summary = {};
  const indegree = Object.fromEntries(nodes.map((item) => [item.id, 0]));
  links.forEach((item) => {
    if (indegree[item.to] !== undefined) indegree[item.to] += 1;
  });
  const queue = nodes.filter((item) => indegree[item.id] === 0 || item.type === "feed");
  const handled = new Set();
  while (queue.length) {
    const item = queue.shift();
    if (handled.has(item.id)) continue;
    computeNode(item);
    handled.add(item.id);
    links.filter((entry) => entry.from === item.id).forEach((entry) => {
      transferLink(entry);
      indegree[entry.to] -= 1;
      if (indegree[entry.to] <= 0) {
        const target = nodes.find((nodeItem) => nodeItem.id === entry.to);
        if (target) queue.push(target);
      }
    });
  }
  nodes.filter((item) => !handled.has(item.id)).forEach((item) => computeNode(item));
  excelResults = typeof CoalExcelCalc !== "undefined" && coalQuality?.useExcelEngine
    ? CoalExcelCalc.run(coalQuality, getFeed())
    : null;
  if (excelResults?.products?.length) {
    coalQuality.computedBalance = excelResults.products;
    coalQuality.comparison = excelResults.comparison;
    coalQuality.productComparison = excelResults.recalculatedComparison || excelResults.productComparison || [];
  }
  updateSummary();
  renderTable();
  renderLinkTable();
  renderAdvice();
}

function computeNode(item) {
  const feed = getEffectiveFeed();
  const input = item.type === "feed" ? [makeStream(feed.rate, feed.ash, feed.moisture, "raw")] : incomingStreams[item.id] || [];
  const merged = mergeStreams(input);
  const outputs = modelNode(item, merged);
  outputStreams[item.id] = outputs;
  results[item.id] = {
    input: merged.mass,
    output: Object.values(outputs).reduce((sum, stream) => sum + stream.mass, 0),
    ash: merged.mass > 0 ? merged.ash : weightedOutputAsh(outputs),
    keyParam: resultParam(item),
  };
}

function transferLink(entry) {
  const index = links.indexOf(entry);
  const stream = outputStreams[entry.from]?.[entry.stream];
  if (!stream || stream.mass <= 0) {
    linkResults[index] = makeStream(0, 0, 0, entry.stream);
    return;
  }
  const sameStreamLinks = links.filter((item) => item.from === entry.from && item.stream === entry.stream);
  const totalSplit = sameStreamLinks.reduce((sum, item) => sum + Math.max(0, Number(item.split) || 0), 0) || sameStreamLinks.length;
  const factor = totalSplit > 0 ? Math.max(0, Number(entry.split) || 0) / totalSplit : 1 / sameStreamLinks.length;
  const transferred = scaleStream(stream, factor);
  linkResults[index] = transferred;
  incomingStreams[entry.to] = [...(incomingStreams[entry.to] || []), transferred];
}

function modelNode(item, input) {
  const p = item.params;
  switch (item.type) {
    case "feed":
      return { raw: makeStream(input.mass, input.ash, input.moisture, "raw") };
    case "screen": {
      const coalSplit = splitCoalQualityAtSize(p.cutSize ?? 13);
      if (coalSplit) {
        return splitBy(input, [
          ["coarse", coalSplit.coarse.ratio * ratio(p.efficiency ?? 92), coalSplit.coarse.ash, coalSplit.coarse.moisture],
          ["fine", 1 - coalSplit.coarse.ratio * ratio(p.efficiency ?? 92), coalSplit.fine.ash, coalSplit.fine.moisture],
        ]);
      }
      const fine = clamp(getEffectiveFeed().fineRatio / 100, 0.03, 0.6);
      return splitBy(input, [
        ["coarse", ratio(p.efficiency ?? 92) * (1 - fine * 0.55), input.ash - 0.4, input.moisture - (p.moistureLoss ?? 0.5)],
        ["fine", 1 - ratio(p.efficiency ?? 92) * (1 - fine * 0.55), input.ash + 1.6, input.moisture + 1.5],
      ]);
    }
    case "deslime": {
      const coalSplit = splitCoalQualityAtSize(p.cutSize ?? 0.5);
      if (coalSplit) {
        return splitBy(input, [
          ["coarse", coalSplit.coarse.ratio * ratio(p.efficiency ?? 88), coalSplit.coarse.ash, Math.max(0, coalSplit.coarse.moisture - (p.moistureLoss ?? 2.2))],
          ["slime", 1 - coalSplit.coarse.ratio * ratio(p.efficiency ?? 88), coalSplit.fine.ash, coalSplit.fine.moisture + 8],
        ]);
      }
      return splitBy(input, [
        ["coarse", ratio(p.efficiency ?? 88), input.ash - 0.2, input.moisture - (p.moistureLoss ?? 2.2)],
        ["slime", 1 - ratio(p.efficiency ?? 88), input.ash + 5, input.moisture + 8],
      ]);
    }
    case "shallow":
    case "dmc": {
      const denseSplit = splitByDenseFractions(p.density ?? 1.45, item.type, input, p);
      if (denseSplit) return denseSplit;
      const cleanYield = qualityYield(p.cleanYield ?? 68, p.density ?? 1.45, input.ash);
      const middlingYield = clamp(0.1 + (1.5 - (p.density ?? 1.45)) * 0.08, 0.05, 0.18);
      const slimeYield = item.type === "dmc" ? 0.06 : 0;
      const rejectYield = Math.max(0, 1 - cleanYield - middlingYield - slimeYield);
      return splitBy(input, [
        ["clean", cleanYield, cleanAsh(input.ash, p.density ?? 1.45), input.moisture + 1.5],
        ["middling", middlingYield, clamp(input.ash + 12, input.ash, 60), input.moisture + 2],
        ["reject", rejectYield, rejectAsh(input.ash, p.density ?? 1.45), input.moisture + 2],
        ["slime", slimeYield, input.ash + 6, input.moisture + 7],
      ]);
    }
    case "magnetite":
      return splitBy(input, [
        ["slime", 0.985, input.ash, input.moisture],
        ["medium", 0.015, 8, 3],
      ]);
    case "slimeCyclone": {
      const overflow = ratio(p.overflowRatio ?? 42);
      return splitBy(input, [
        ["coarseSlime", 1 - overflow, input.ash - 2, input.moisture + 3],
        ["fineSlime", overflow, input.ash + 3, input.moisture + 6],
      ]);
    }
    case "spiral": {
      const cleanYield = clamp(ratio(p.cleanYield ?? 58) * (0.92 + ratio(p.separation ?? 76) * 0.14), 0.35, 0.78);
      return splitBy(input, [
        ["clean", cleanYield, clamp(input.ash * 0.62, 8, input.ash), input.moisture + 2],
        ["reject", 1 - cleanYield, clamp(input.ash + 15, input.ash, 75), input.moisture + 3],
      ]);
    }
    case "thickener":
      return splitBy(input, [
        ["underflow", ratio(p.recovery ?? 97), input.ash + 1, 35],
        ["water", 1 - ratio(p.recovery ?? 97), 1, 100],
      ]);
    case "filter":
      return splitBy(input, [
        ["cake", ratio(p.recovery ?? 99), input.ash, p.cakeMoisture ?? 24],
        ["water", 1 - ratio(p.recovery ?? 99), 1, 100],
      ]);
    case "centrifuge":
      return splitBy(input, [
        ["clean", ratio(p.solidRecovery ?? 98.5), input.ash, Math.max(6, input.moisture - (p.moistureLoss ?? 6.5))],
        ["water", 1 - ratio(p.solidRecovery ?? 98.5), 1, 100],
      ]);
    case "belt":
      return { product: makeStream(input.mass * ratio(p.availability ?? 96), input.ash, input.moisture, "product") };
    case "bunker":
    case "product":
      return { product: makeStream(input.mass, input.ash, input.moisture, "product") };
    case "reject":
      return { reject: makeStream(input.mass, input.ash, input.moisture, "reject") };
    case "water":
      return { water: makeStream(input.mass * ratio(p.recovery ?? 95), input.ash, input.moisture, "water") };
    case "mediumTank":
      return { medium: makeStream(input.mass * ratio(p.recovery ?? 98), input.ash, input.moisture, "medium") };
    default:
      return { product: makeStream(input.mass, input.ash, input.moisture, "product") };
  }
}

function splitBy(input, rules) {
  const result = {};
  rules.forEach(([type, fraction, ash, moisture]) => {
    if (fraction <= 0) return;
    result[type] = makeStream(input.mass * clamp(fraction, 0, 1), clamp(ash, 0, 85), clamp(moisture, 0, 100), type);
  });
  return result;
}

function sizeLowerBound(size) {
  const text = String(size || "").replace(/[＋+]/g, "+").replace(/＞/g, ">").replace(/＜/g, "<");
  if (text.includes("-")) {
    const parts = text.split("-").map((item) => Number(item.replace(/[^\d.]/g, ""))).filter(Number.isFinite);
    return parts.length ? Math.min(...parts) : 0;
  }
  if (text.includes("<")) return 0;
  const nums = text.match(/\d+(\.\d+)?/g)?.map(Number) || [];
  if (text.includes("+") || text.includes(">")) return nums[0] || 0;
  return nums.length ? Math.min(...nums) : 0;
}

function weightedCoalQuality(items) {
  const total = items.reduce((sum, item) => sum + numberOrZero(item.yield), 0);
  if (total <= 0) return { ratio: 0, ash: 0, moisture: 0 };
  return {
    ratio: total / 100,
    ash: items.reduce((sum, item) => sum + numberOrZero(item.yield) * numberOrZero(item.ash), 0) / total,
    moisture: items.reduce((sum, item) => sum + numberOrZero(item.yield) * numberOrZero(item.moisture), 0) / total,
  };
}

function coalFineRatio(sizeFractions, cutSize = 0.5) {
  return sizeFractions
    .filter((item) => sizeLowerBound(item.size) < cutSize)
    .reduce((sum, item) => sum + numberOrZero(item.yield), 0);
}

function splitCoalQualityAtSize(cutSize) {
  const rows = coalQuality?.sizeFractions || [];
  if (!rows.length) return null;
  const cut = Number(cutSize);
  if (!Number.isFinite(cut)) return null;
  const coarseRows = rows.filter((item) => sizeLowerBound(item.size) >= cut);
  const fineRows = rows.filter((item) => sizeLowerBound(item.size) < cut);
  if (!coarseRows.length || !fineRows.length) return null;
  return {
    coarse: weightedCoalQuality(coarseRows),
    fine: weightedCoalQuality(fineRows),
  };
}

function splitByDenseFractions(density, nodeType, input, params = {}) {
  const rows = coalQuality?.denseFractions || [];
  if (!rows.length || input.mass <= 0) return null;
  const cut = Number(density);
  if (!Number.isFinite(cut)) return null;
  const ep = nodeType === "dmc" ? Number(params.ep ?? 0.055) : 0.075;
  const band = clamp(ep * 1.6, 0.06, 0.16);
  const buckets = {
    clean: { yield: 0, ashWeight: 0 },
    middling: { yield: 0, ashWeight: 0 },
    reject: { yield: 0, ashWeight: 0 },
  };
  let totalYield = 0;
  rows.forEach((row) => {
    const itemYield = Number.isFinite(Number(row.yieldTotal)) ? Number(row.yieldTotal) : Number(row.yieldInClass);
    const ash = Number(row.ash);
    const range = densityRange(row.density);
    if (!Number.isFinite(itemYield) || itemYield <= 0 || !Number.isFinite(ash) || !range) return;
    totalYield += itemYield;
    const cleanPart = rangePortion(range, Number.NEGATIVE_INFINITY, cut);
    const middlePart = rangePortion(range, cut, cut + band);
    const rejectPart = Math.max(0, 1 - cleanPart - middlePart);
    addDenseBucket(buckets.clean, itemYield * cleanPart, ash);
    addDenseBucket(buckets.middling, itemYield * middlePart, ash);
    addDenseBucket(buckets.reject, itemYield * rejectPart, ash);
  });
  if (totalYield <= 0 || buckets.clean.yield <= 0) return null;
  const slimeYield = nodeType === "dmc" ? 0.04 : 0;
  let cleanFraction = clamp(buckets.clean.yield / totalYield, 0.22, 0.9);
  let middleFraction = clamp(buckets.middling.yield / totalYield, 0.03, 0.2);
  const maxSolidFraction = Math.max(0, 1 - slimeYield);
  if (cleanFraction + middleFraction > maxSolidFraction) {
    const scale = maxSolidFraction / (cleanFraction + middleFraction);
    cleanFraction *= scale;
    middleFraction *= scale;
  }
  const remaining = Math.max(0, 1 - cleanFraction - middleFraction - slimeYield);
  return splitBy(input, [
    ["clean", cleanFraction, denseBucketAsh(buckets.clean, input.ash * 0.45), input.moisture + 1.4],
    ["middling", middleFraction, denseBucketAsh(buckets.middling, input.ash + 8), input.moisture + 2],
    ["reject", remaining, denseBucketAsh(buckets.reject, input.ash + 22), input.moisture + 2],
    ["slime", slimeYield, input.ash + 6, input.moisture + 7],
  ]);
}

function addDenseBucket(bucket, yieldValue, ash) {
  if (yieldValue <= 0) return;
  bucket.yield += yieldValue;
  bucket.ashWeight += yieldValue * ash;
}

function denseBucketAsh(bucket, fallback) {
  return bucket.yield > 0 ? bucket.ashWeight / bucket.yield : fallback;
}

function densityRange(value) {
  const text = String(value ?? "").replace(/＞/g, ">").replace(/＜/g, "<").replace(/[－–—]/g, "-").replace(/,/g, ".").trim();
  const nums = text.match(/\d+(\.\d+)?/g)?.map(Number).filter(Number.isFinite) || [];
  if (text.includes("<") && nums.length) return { lower: nums[0] - 0.18, upper: nums[0] };
  if (text.includes(">") && nums.length) return { lower: nums[0], upper: nums[0] + 0.28 };
  if (nums.length >= 2) return { lower: Math.min(nums[0], nums[1]), upper: Math.max(nums[0], nums[1]) };
  if (nums.length === 1) return { lower: nums[0] - 0.05, upper: nums[0] + 0.05 };
  return null;
}

function rangePortion(range, from, to) {
  const width = range.upper - range.lower;
  if (width <= 0) return 0;
  const left = Math.max(range.lower, from);
  const right = Math.min(range.upper, to);
  return clamp((right - left) / width, 0, 1);
}

function updateSummary() {
  const feedRate = getFeed().rate || 1;
  if (excelResults?.cleanMass > 0) {
    const product = {
      mass: excelResults.cleanMass,
      ash: excelResults.cleanAsh || 0,
      moisture: getFeed().moisture,
    };
    const reject = {
      mass: excelResults.rejectMass || 0,
      ash: excelResults.rejectAsh || 0,
      moisture: getFeed().moisture,
    };
    const balanceDiff = feedRate - (excelResults.cleanMass + excelResults.rejectMass);
    summary = { product, reject, middling: { mass: 0, ash: 0 }, water: { mass: 0 }, medium: { mass: 0 }, balanceDiff, accounted: excelResults.cleanMass + excelResults.rejectMass, excelMode: true };
    document.getElementById("cleanCoal").textContent = `${fmt(product.mass)} t/h`;
    document.getElementById("cleanCoalRate").textContent = `产率 ${fmt(excelResults.cleanYield, 1)}% · 预测综合`;
    document.getElementById("middlings").textContent = `${fmt(0)} t/h`;
    document.getElementById("rejects").textContent = `${fmt(reject.mass)} t/h`;
    document.getElementById("cleanAsh").textContent = `${fmt(product.ash, 1)}%`;
    document.getElementById("qualityHint").textContent = excelResults.recalculated
      ? `采用预测综合最终值，复算灰分 ${fmt(excelResults.recalculated.cleanAsh, 2)}%`
      : "采用预测综合最终表";
    document.getElementById("waterLoss").textContent = `${fmt(Math.max(0, balanceDiff))} t/h`;
    document.getElementById("balanceHint").textContent = `平衡差 ${fmt(balanceDiff, 1)} t/h`;
    document.getElementById("mediumFlow").textContent = `${fmt(0, 1)} t/h`;
    return;
  }

  const productStreams = nodes.filter((item) => item.type === "product").flatMap((item) => incomingStreams[item.id] || []);
  const rejectStreams = nodes.filter((item) => item.type === "reject").flatMap((item) => incomingStreams[item.id] || []);
  const waterStreams = nodes.filter((item) => item.type === "water").flatMap((item) => incomingStreams[item.id] || []);
  const mediumStreams = nodes.filter((item) => item.type === "mediumTank").flatMap((item) => incomingStreams[item.id] || []);
  const middlingStreams = rejectStreams.filter((stream) => stream.type === "middling");
  const product = mergeStreams(productStreams);
  const reject = mergeStreams(rejectStreams.filter((stream) => stream.type !== "middling"));
  const middling = mergeStreams(middlingStreams);
  const water = mergeStreams(waterStreams);
  const medium = mergeStreams(mediumStreams);
  const accounted = product.mass + reject.mass + middling.mass + water.mass + medium.mass;
  const balanceDiff = feedRate - accounted;
  summary = { product, reject, middling, water, medium, balanceDiff, accounted };
  document.getElementById("cleanCoal").textContent = `${fmt(product.mass)} t/h`;
  document.getElementById("cleanCoalRate").textContent = `产率 ${fmt((product.mass / feedRate) * 100, 1)}%`;
  document.getElementById("middlings").textContent = `${fmt(middling.mass)} t/h`;
  document.getElementById("rejects").textContent = `${fmt(reject.mass)} t/h`;
  document.getElementById("cleanAsh").textContent = `${fmt(product.ash, 1)}%`;
  document.getElementById("qualityHint").textContent = product.ash <= 12 ? "拓扑计算满足常规指标" : "拓扑计算灰分偏高";
  document.getElementById("waterLoss").textContent = `${fmt(water.mass + Math.max(0, balanceDiff))} t/h`;
  document.getElementById("balanceHint").textContent = `平衡差 ${fmt(balanceDiff, 1)} t/h`;
  document.getElementById("mediumFlow").textContent = `${fmt(medium.mass, 1)} t/h`;
}

function renderTable() {
  const tbody = document.getElementById("resultRows");
  tbody.innerHTML = nodes.map((item) => {
    const r = results[item.id] || { input: 0, output: 0, ash: 0, keyParam: "" };
    return `<tr title="${r.keyParam}"><td>${item.name}</td><td>${fmt(r.input)}</td><td>${fmt(r.output)}</td><td>${fmt(r.ash, 1)}</td></tr>`;
  }).join("");
}

function renderLinkTable() {
  const tbody = document.getElementById("linkRows");
  if (!tbody) return;
  tbody.innerHTML = links.map((entry, index) => {
    const from = nodes.find((item) => item.id === entry.from);
    const to = nodes.find((item) => item.id === entry.to);
    const r = linkResults[index] || makeStream(0, 0, 0, entry.stream);
    return `<tr><td>${from?.name || "-"}→${to?.name || "-"} ${streamLabels[entry.stream]}</td><td>${fmt(r.mass)}</td><td>${fmt(r.ash, 1)}</td></tr>`;
  }).join("");
}

function renderAdvice() {
  const productStreams = nodes.filter((item) => item.type === "product").flatMap((item) => incomingStreams[item.id] || []);
  const product = mergeStreams(productStreams);
  const advice = [];
  if (product.mass <= 0) advice.push("当前拓扑没有形成到产品仓的有效物流，请检查精煤、产品连线。");
  if (product.ash > 12) advice.push(...buildHighAshAdvice(productStreams, product));
  if (Math.abs(summary.balanceDiff || 0) > Math.max(5, getFeed().rate * 0.02)) advice.push(`当前质量平衡差为 ${fmt(summary.balanceDiff, 1)} t/h，建议检查是否有产品、尾煤、水路或介质出口未连接到接收节点。`);
  if (!links.some((item) => ["water", "medium"].includes(item.stream))) advice.push("当前流程没有形成水路或介质回收连线，工程级模型建议补充循环水池、介质桶和回收路径。");
  if (advice.length === 0) advice.push("当前拓扑已按多出口物流完成质量平衡，可继续用现场浮沉、粒度和化验数据校准设备模型。");
  document.getElementById("adviceList").innerHTML = advice.map((item) => `<li>${item}</li>`).join("");
}

function buildHighAshAdvice(productStreams, product) {
  const items = [];
  const feed = getEffectiveFeed();
  const contributors = productStreams
    .filter((stream) => stream.mass > 0)
    .map((stream) => ({
      stream,
      contribution: product.mass > 0 ? (stream.mass / product.mass) * stream.ash : 0,
    }))
    .sort((a, b) => b.contribution - a.contribution);
  const main = contributors[0]?.stream;
  if (main) {
    items.push(`精煤灰分 ${fmt(product.ash, 1)}% 偏高，主要受 ${streamLabels[main.type] || main.type} 影响：该流量 ${fmt(main.mass)} t/h、灰分 ${fmt(main.ash, 1)}%，贡献约 ${fmt(contributors[0].contribution, 1)} 个百分点。`);
  } else {
    items.push(`精煤灰分 ${fmt(product.ash, 1)}% 偏高，建议先检查进入产品仓的精煤物流来源。`);
  }

  const denseNodes = nodes.filter((item) => ["dmc", "shallow"].includes(item.type));
  denseNodes.forEach((item) => {
    const p = item.params || {};
    if ((p.density ?? 0) >= 1.6) {
      items.push(`${item.name} 分选密度 ${fmt(p.density, 2)} 偏高，可先下调 0.03-0.08，并观察精煤灰分和产率变化。`);
    }
    if ((p.cleanYield ?? 100) > 72 && product.ash > 12) {
      items.push(`${item.name} 精煤产率设为 ${fmt(p.cleanYield, 1)}%，当前煤质灰分 ${fmt(feed.ash, 1)}%，建议降低目标产率或提高排矸比例。`);
    }
  });

  const slimeToProduct = links.some((entry) => ["slime", "coarseSlime", "fineSlime", "underflow", "cake"].includes(entry.stream) && isProductPath(entry.to));
  if (slimeToProduct) {
    items.push("煤泥或压滤产物进入了产品路径，若商品煤灰分受限，建议将高灰细泥改接尾煤/煤泥产品，或提高煤泥分级与螺旋分选效率。");
  }

  if (coalQuality?.summary?.ash > 35) {
    items.push(`导入煤质原煤灰分为 ${fmt(coalQuality.summary.ash, 1)}%，属于高灰入料；建议优先用浮沉数据校准重介密度切割，再调产品流向。`);
  }
  items.push(...buildBusinessComparisonAdvice(product));
  return [...new Set(items)].slice(0, 6);
}

function buildBusinessComparisonAdvice(product) {
  const expected = coalQuality?.expectedResults;
  if (!expected && !excelResults?.comparison) return [];
  const items = [];
  if (excelResults?.comparison) {
    const c = excelResults.comparison;
    if (Math.abs(c.feedRateDelta) > 5) items.push(`入洗量：公式 ${fmt(excelResults.feedRate)} t/h，预测综合 ${fmt(expected?.feedRate)} t/h。`);
    if (Math.abs(c.cleanYieldDelta) > 2) items.push(`精煤产率：公式 ${fmt(excelResults.cleanYield, 2)}%，预测综合 ${fmt(expected?.cleanYield, 2)}%。`);
    if (Math.abs(c.cleanAshDelta) > 0.8) items.push(`精煤灰分：公式 ${fmt(excelResults.cleanAsh, 2)}%，预测综合 ${fmt(expected?.cleanAsh, 2)}%。`);
    const recalculated = excelResults.recalculated;
    if (recalculated) {
      const dy = recalculated.cleanYield - excelResults.cleanYield;
      const da = recalculated.cleanAsh - excelResults.cleanAsh;
      if (Math.abs(dy) > 0.5 || Math.abs(da) > 0.3) {
        items.push(`网页复算校验：精煤产率 ${fmt(recalculated.cleanYield, 2)}%、灰分 ${fmt(recalculated.cleanAsh, 2)}%，与预测综合差 ${fmt(dy, 2)} 产率点 / ${fmt(da, 2)} 灰分点。`);
      }
    }
    if (!items.length) items.push("Excel 公式链计算与「预测综合」目标一致。");
    return items;
  }
  const feedRate = getFeed().rate || 1;
  const simCleanYield = feedRate > 0 ? (product.mass / feedRate) * 100 : 0;
  if (Number.isFinite(expected.feedRate) && Math.abs(feedRate - expected.feedRate) > Math.max(5, expected.feedRate * 0.02)) {
    items.push(`入洗量：流程 ${fmt(feedRate)} t/h，预测综合 ${fmt(expected.feedRate)} t/h。`);
  }
  if (Number.isFinite(expected.cleanYield) && Math.abs(simCleanYield - expected.cleanYield) > 3) {
    items.push(`精煤产率：拓扑 ${fmt(simCleanYield, 1)}%，预测综合 ${fmt(expected.cleanYield, 1)}%。`);
  }
  if (Number.isFinite(expected.cleanAsh) && Math.abs(product.ash - expected.cleanAsh) > 1.2) {
    items.push(`精煤灰分：拓扑 ${fmt(product.ash, 1)}%，预测综合 ${fmt(expected.cleanAsh, 1)}%。`);
  }
  if (items.length === 0 && expected.sectionTitle) {
    items.push(`已与预测综合「${expected.sectionTitle.slice(0, 24)}」对齐入洗量与校正灰分，拓扑结果与目标接近。`);
  }
  return items;
}

function isProductPath(nodeId, visited = new Set()) {
  if (visited.has(nodeId)) return false;
  visited.add(nodeId);
  const node = nodes.find((item) => item.id === nodeId);
  if (!node) return false;
  if (node.type === "product") return true;
  return links.filter((entry) => entry.from === nodeId).some((entry) => isProductPath(entry.to, visited));
}

function renderCoalQualityView() {
  const view = document.getElementById("coalQualityView");
  if (!view) return;
  if (!coalQuality?.sizeFractions?.length) {
    view.className = "coal-quality-view empty-state";
    view.textContent = "尚未导入煤质表；导入后这里会显示煤层、灰分、水分和粒级数据。";
    return;
  }
  const s = coalQuality.summary || {};
  const rows = coalQuality.sizeFractions;
  const sourceLists = coalQuality.sourceLists || [];
  const denseRows = coalQuality.denseFractions || [];
  const productRows = coalQuality.productBalance || [];
  const screenRows = coalQuality.screenSizing || [];
  const expected = coalQuality.expectedResults || {};
  const inputSources = coalQuality.inputSources || {};
  const computed = coalQuality.computedBalance || [];
  const comparison = coalQuality.comparison;
  const productComparison = comparison?.productComparison || coalQuality.productComparison || [];
  view.className = "coal-quality-view";
  view.innerHTML = `
    <div class="coal-quality-kpis">
      <span>煤层<strong>${s.seam || "-"}</strong></span>
      <span>校正灰分<strong>${fmt(s.ash, 2)}%</strong></span>
      <span>Mad 水分<strong>${fmt(s.moisture, 2)}%</strong></span>
      <span>-0.5mm<strong>${fmt(s.fineRatio, 2)}%</strong></span>
    </div>
    ${inputSources.predictionSheet || inputSources.screenSheet ? `
      <div class="coal-quality-section-title">输入数据（提供）</div>
      <div class="coal-quality-list">
        ${inputSources.screenSheet ? `<span><strong>筛分</strong>${escapeHtml(inputSources.screenSheet)}</span>` : ""}
        ${inputSources.predictionSheet ? `<span><strong>煤预测</strong>${escapeHtml(inputSources.predictionSheet)}</span>` : ""}
      </div>
    ` : ""}
    ${expected.sectionTitle || Number.isFinite(expected.feedRate) ? `
      <div class="coal-quality-section-title">预测综合（目标结果）</div>
      <div class="coal-quality-list">
        ${expected.sectionTitle ? `<span title="${escapeHtml(expected.sectionTitle)}"><strong>工况</strong>${escapeHtml(expected.sectionTitle.slice(0, 32))}</span>` : ""}
        ${Number.isFinite(expected.feedRate) ? `<span><strong>入洗量</strong>${fmt(expected.feedRate)} t/h</span>` : ""}
        ${Number.isFinite(expected.cleanYield) ? `<span><strong>精煤产率</strong>${fmt(expected.cleanYield, 2)}%</span>` : ""}
        ${Number.isFinite(expected.cleanAsh) ? `<span><strong>精煤灰分</strong>${fmt(expected.cleanAsh, 2)}%</span>` : ""}
      </div>
    ` : ""}
    ${sourceLists.length ? `
      <div class="coal-quality-section-title">已识别工作表</div>
      <div class="coal-quality-list">
        ${sourceLists.map((item) => `
          <span title="${escapeHtml(item.name)}">
            <strong>${escapeHtml(item.type)}</strong>
            ${escapeHtml(item.name)} · ${item.count || 0} 行
          </span>
        `).join("")}
      </div>
    ` : ""}
    ${computed.length ? `
      <div class="coal-quality-section-title">当前采用 · 产品平衡</div>
      <div class="coal-quality-table-wrap compact">
        <table class="coal-quality-table">
          <thead><tr><th>产品</th><th>产率</th><th>灰分</th><th>水分</th><th>流量</th></tr></thead>
          <tbody>
            ${computed.slice(0, 14).map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${fmt(item.yield, 2)}%</td><td>${fmt(item.ash, 2)}%</td><td>${fmt(item.moisture, 2)}%</td><td>${fmt(item.mass)} t/h</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
      ${comparison ? `<div class="coal-quality-footnote">${excelResults?.mode === "imported-balance-formula" ? "采用预测综合最终表；" : ""}与预测综合对比：精煤产率差 ${fmt(comparison.cleanYieldDelta, 2)} 点，灰分差 ${fmt(comparison.cleanAshDelta, 2)} 点${Number.isFinite(comparison.matchedProducts) ? `；逐项匹配 ${comparison.matchedProducts}/${comparison.totalProducts}` : ""}。</div>` : ""}
    ` : ""}
    ${productComparison.length ? `
      <div class="coal-quality-section-title">复算校验 vs 预测综合（产率 r%）</div>
      <div class="coal-quality-table-wrap compact">
        <table class="coal-quality-table">
          <thead><tr><th>单元格</th><th>产品</th><th>网页复算</th><th>预测综合</th><th>偏差</th><th></th></tr></thead>
          <tbody>
            ${productComparison.map((item) => `<tr><td>${escapeHtml(item.ref)}</td><td>${escapeHtml(item.name)}</td><td>${fmt(item.calcYield, 3)}%</td><td>${fmt(item.expYield, 3)}%</td><td>${fmt(item.yieldDelta, 3)}</td><td>${item.ok ? "✓" : "△"}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}
    ${productRows.length ? `
      <div class="coal-quality-section-title">预测综合 · 产品平衡（Excel原值）</div>
      <div class="coal-quality-table-wrap compact">
        <table class="coal-quality-table">
          <thead><tr><th>产品</th><th>产率</th><th>灰分</th><th>水分</th></tr></thead>
          <tbody>
            ${productRows.slice(0, 10).map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${fmt(item.yield, 2)}%</td><td>${fmt(item.ash, 2)}%</td><td>${fmt(item.moisture, 2)}%</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}
    ${denseRows.length ? `
      <div class="coal-quality-section-title">自浮密度级</div>
      <div class="coal-quality-table-wrap compact">
        <table class="coal-quality-table">
          <thead><tr><th>粒级</th><th>密度级</th><th>占全样</th><th>灰分</th></tr></thead>
          <tbody>
            ${denseRows.slice(0, 12).map((item) => `<tr><td>${escapeHtml(item.group || "-")}</td><td>${escapeHtml(item.density)}</td><td>${fmt(item.yieldTotal, 2)}%</td><td>${fmt(item.ash, 2)}%</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}
    <div class="coal-quality-section-title">2-3煤预测 · 自然粒级</div>
    <div class="coal-quality-table-wrap">
      <table class="coal-quality-table">
        <thead><tr><th>粒级</th><th>产率</th><th>灰分</th><th>Mad</th></tr></thead>
        <tbody>
          ${rows.map((item) => `<tr><td>${item.size}</td><td>${fmt(item.yield, 2)}%</td><td>${fmt(item.ash, 2)}%</td><td>${fmt(item.moisture, 2)}%</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="coal-quality-footnote">输入：2-3筛 ${screenRows.length} 条、2-3煤预测 ${rows.length} 条；预测综合 ${productRows.length} 条；公式重算 ${computed.length} 条。核心公式：NORMSDIST 分配率、SUMPRODUCT 灰分、Mt=Mf+Mad*(100-Mf)/100。</div>
  `;
}

function renderCoalQualityBadge() {
  const badge = document.getElementById("coalQualityBadge");
  const strip = document.getElementById("coalQualityStrip");
  if (!badge || !strip) return;
  if (!coalQuality?.sizeFractions?.length) {
    badge.classList.add("hidden");
    badge.textContent = "";
    strip.classList.add("hidden");
    strip.innerHTML = "";
    return;
  }
  const s = coalQuality.summary || {};
  badge.classList.remove("hidden");
  badge.textContent = coalQuality.useExcelEngine ? `已导入煤质 · Excel公式计算已启用` : `已导入煤质，画布节点已按煤质数据重算`;
  strip.classList.remove("hidden");
  strip.innerHTML = `
    <span>煤层<strong>${s.seam || "-"}</strong></span>
    <span>原煤灰分<strong>${fmt(s.ash, 2)}%</strong></span>
    <span>Mad 水分<strong>${fmt(s.moisture, 2)}%</strong></span>
    <span>-0.5mm<strong>${fmt(s.fineRatio, 2)}%</strong></span>
    <span>导入清单<strong>${coalQuality.sourceLists?.length || 1} 类</strong></span>
  `;
}

function getFeed() {
  return {
    rate: Number(document.getElementById("feedRate").value) || 0,
    ash: Number(document.getElementById("feedAsh").value) || 0,
    moisture: Number(document.getElementById("feedMoisture").value) || 0,
    fineRatio: Number(document.getElementById("fineRatio").value) || 0,
  };
}

function getEffectiveFeed() {
  const feed = getFeed();
  const q = coalQuality?.summary || {};
  return {
    rate: feed.rate,
    ash: Number.isFinite(Number(q.ash)) ? Number(q.ash) : feed.ash,
    moisture: Number.isFinite(Number(q.moisture)) ? Number(q.moisture) : feed.moisture,
    fineRatio: Number.isFinite(Number(q.fineRatio)) ? Number(q.fineRatio) : feed.fineRatio,
  };
}

function setFeed(feed) {
  document.getElementById("feedRate").value = feed.rate;
  document.getElementById("feedAsh").value = feed.ash;
  document.getElementById("feedMoisture").value = feed.moisture;
  document.getElementById("fineRatio").value = feed.fineRatio;
}

function makeStream(mass, ash, moisture, type) {
  return { mass: Math.max(0, mass || 0), ash: ash || 0, moisture: moisture || 0, type };
}

function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function scaleStream(stream, factor) {
  return makeStream(stream.mass * factor, stream.ash, stream.moisture, stream.type);
}

function mergeStreams(items) {
  const mass = items.reduce((sum, item) => sum + item.mass, 0);
  if (mass <= 0) return makeStream(0, 0, 0, "mixed");
  return makeStream(
    mass,
    items.reduce((sum, item) => sum + item.ash * item.mass, 0) / mass,
    items.reduce((sum, item) => sum + item.moisture * item.mass, 0) / mass,
    "mixed",
  );
}

function weightedOutputAsh(outputs) {
  return mergeStreams(Object.values(outputs)).ash;
}

function qualityYield(baseYield, density, ash) {
  return clamp(ratio(baseYield) + (density - 1.4) * 0.24 - (ash - 28) * 0.004, 0.42, 0.86);
}

function cleanAsh(inputAsh, density) {
  return clamp(inputAsh * 0.31 - (density - 1.4) * 7, 7.5, inputAsh);
}

function rejectAsh(inputAsh, density) {
  return clamp(inputAsh + 22 + (density - 1.42) * 10, inputAsh, 82);
}

function resultParam(item) {
  const p = item.params;
  if ("density" in p) {
    const source = coalQuality?.denseFractions?.length ? "自浮校核" : "拓扑计算";
    return `${source} · 密度 ${fmt(p.density, 2)}`;
  }
  if ("cleanYield" in p) return `拓扑计算 · 产率 ${fmt(p.cleanYield, 1)}%`;
  if ("efficiency" in p) return `拓扑计算 · 效率 ${fmt(p.efficiency, 1)}%`;
  if ("recovery" in p) return `拓扑计算 · 回收率 ${fmt(p.recovery, 1)}%`;
  return "拓扑质量平衡";
}

function paramLabel(key) {
  const labels = {
    efficiency: "效率 %",
    cutSize: "分级粒度 mm",
    moistureLoss: "脱水降水 %",
    density: "分选密度 g/cm3",
    pressure: "压力 MPa",
    cleanYield: "精煤产率 %",
    ep: "可能偏差 Ep",
    mediumLoss: "介耗 kg/t",
    recovery: "回收率 %",
    overflowRatio: "溢流比例 %",
    separation: "分选效率 %",
    flocculant: "加药量 g/t",
    underflowSolid: "底流浓度 g/L",
    cycle: "压滤周期 min",
    cakeMoisture: "滤饼水分 %",
    solidRecovery: "固体回收率 %",
    availability: "可用率 %",
    power: "功率 kW",
    capacity: "容量 t",
    loadRate: "装车能力 t/h",
  };
  return labels[key] || key;
}

function ratio(value) {
  return clamp(Number(value) / 100, 0, 1);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function fmt(value, digits = 0) {
  if (!Number.isFinite(value)) return "0";
  return Number(value).toFixed(digits);
}

function exportResults() {
  const lines = [
    "全厂汇总",
    "指标,数值",
    `精煤产量,${fmt(summary.product?.mass || 0)} t/h`,
    `精煤灰分,${fmt(summary.product?.ash || 0, 1)} %`,
    `中煤产量,${fmt(summary.middling?.mass || 0)} t/h`,
    `矸石/尾煤,${fmt(summary.reject?.mass || 0)} t/h`,
    `水路/损失,${fmt((summary.water?.mass || 0) + Math.max(0, summary.balanceDiff || 0))} t/h`,
    `介质回收,${fmt(summary.medium?.mass || 0, 1)} t/h`,
    `质量平衡差,${fmt(summary.balanceDiff || 0, 1)} t/h`,
    "",
    "设备计算结果",
    "设备,入料t/h,出料t/h,灰分%,关键参数",
    ...nodes.map((item) => {
      const r = results[item.id] || {};
      return [item.name, fmt(r.input), fmt(r.output), fmt(r.ash, 1), r.keyParam || ""].join(",");
    }),
    "",
    "物流计算结果",
    "上游,下游,物料类型,流量t/h,灰分%,水分%,分配比例",
    ...links.map((item, index) => {
      const from = nodes.find((nodeItem) => nodeItem.id === item.from);
      const to = nodes.find((nodeItem) => nodeItem.id === item.to);
      const r = linkResults[index] || makeStream(0, 0, 0, item.stream);
      return [from?.name || "", to?.name || "", streamLabels[item.stream] || item.stream, fmt(r.mass), fmt(r.ash, 1), fmt(r.moisture, 1), item.split].join(",");
    }),
  ];
  const blob = new Blob([`\ufeff${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "选煤厂模拟计算结果.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function initScenarios() {
  scenarios = readScenarios();
  if (!scenarios.length) {
    resetFlowStateOnly();
    const scenario = makeScenario("测试方案 1");
    scenarios = [scenario];
    activeScenarioId = scenario.id;
    persistScenarios();
  } else {
    activeScenarioId = scenarios[0].id;
    applyScenario(scenarios[0]);
  }
  renderScenarioSelect();
  renderAll();
}

function readScenarios() {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistScenarios() {
  localStorage.setItem(storageKey, JSON.stringify(scenarios));
  renderScenarioSelect();
}

function renderScenarioSelect() {
  scenarioSelect.innerHTML = scenarios
    .map((item) => `<option value="${item.id}" ${item.id === activeScenarioId ? "selected" : ""}>${item.name}</option>`)
    .join("");
}

function makeScenario(name) {
  return {
    id: `scenario-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    savedAt: new Date().toISOString(),
    layoutDirection: "top-down",
    layoutVersion: LAYOUT_VERSION,
    feed: getFeed(),
    coalQuality,
    nodes: nodes.map(cloneNode),
    links: links.map((item) => ({ ...item })),
    selectedId,
  };
}

function cloneNode(item) {
  return { ...item, params: { ...item.params } };
}

function normalizeTemplateFeed(feed = {}) {
  return {
    rate: Number(feed.rate ?? 850) || 0,
    ash: Number(feed.ash ?? 28.5) || 0,
    moisture: Number(feed.moisture ?? 9.5) || 0,
    fineRatio: Number(feed.fineRatio ?? 16) || 0,
  };
}

function normalizeCoalQuality(raw = null) {
  if (!raw || typeof raw !== "object") return null;
  const sizeFractions = Array.isArray(raw.sizeFractions) ? raw.sizeFractions
    .map((item) => ({
      size: String(item.size || "").trim(),
      yield: Number(item.yield),
      ash: Number(item.ash),
      moisture: Number(item.moisture ?? 0),
    }))
    .filter((item) => item.size && Number.isFinite(item.yield) && Number.isFinite(item.ash)) : [];
  const total = weightedCoalQuality(sizeFractions);
  const fineRatio = coalFineRatio(sizeFractions, 0.5);
  const rawSeam = String(raw.summary?.seam || raw.seam || "").trim();
  const summary = {
    seam: /^\d+(\.\d+)?$/.test(rawSeam) ? "" : rawSeam,
    ash: Number.isFinite(Number(raw.summary?.ash)) ? Number(raw.summary.ash) : total.ash,
    moisture: Number.isFinite(Number(raw.summary?.moisture)) ? Number(raw.summary.moisture) : total.moisture,
    fineRatio: Number.isFinite(Number(raw.summary?.fineRatio)) ? Number(raw.summary.fineRatio) : fineRatio,
  };
  return {
    summary,
    sizeFractions,
    denseFractions: Array.isArray(raw.denseFractions) ? raw.denseFractions
      .map((item) => ({
        group: String(item.group || "").trim(),
        density: String(item.density || "").trim(),
        weight: Number(item.weight),
        yieldInClass: Number(item.yieldInClass),
        yieldTotal: Number(item.yieldTotal),
        ash: Number(item.ash),
        sulfur: Number(item.sulfur),
      }))
      .filter((item) => item.density && Number.isFinite(item.ash) && (Number.isFinite(item.yieldTotal) || Number.isFinite(item.yieldInClass))) : [],
    productBalance: Array.isArray(raw.productBalance) ? raw.productBalance
      .map((item) => ({
        name: String(item.name || "").trim(),
        yield: Number(item.yield),
        ash: Number(item.ash),
        moisture: Number(item.moisture ?? 0),
        mass: Number(item.mass),
        heat: Number(item.heat),
      }))
      .filter((item) => item.name && Number.isFinite(item.yield) && Number.isFinite(item.ash)) : [],
    screenSizing: Array.isArray(raw.screenSizing) ? raw.screenSizing
      .map((item) => ({
        size: String(item.size || "").trim(),
        yield: Number(item.yield),
        ash: Number(item.ash),
        moisture: Number(item.moisture ?? 0),
      }))
      .filter((item) => item.size && Number.isFinite(item.yield)) : [],
    processSettings: raw.processSettings && typeof raw.processSettings === "object" ? raw.processSettings : null,
    expectedResults: raw.expectedResults && typeof raw.expectedResults === "object" ? raw.expectedResults : null,
    inputSources: raw.inputSources && typeof raw.inputSources === "object" ? raw.inputSources : null,
    useExcelEngine: Boolean(raw.useExcelEngine),
    computedBalance: Array.isArray(raw.computedBalance) ? raw.computedBalance : [],
    comparison: raw.comparison && typeof raw.comparison === "object" ? raw.comparison : null,
    sourceLists: Array.isArray(raw.sourceLists) ? raw.sourceLists
      .map((item) => ({ name: String(item.name || "").trim(), type: String(item.type || "").trim(), count: Number(item.count) || 0 }))
      .filter((item) => item.name && item.type) : [],
    block248BB: Array.isArray(raw.block248BB) ? raw.block248BB
      .map((item) => ({
        density: String(item.density || "").trim(),
        densityMid: Number(item.densityMid),
        yieldInClass: Number(item.yieldInClass),
        ash: Number(item.ash),
      }))
      .filter((item) => item.density && Number.isFinite(item.yieldInClass)) : [],
  };
}

function defaultCoalQualityTemplate() {
  return normalizeCoalQuality({
    summary: { seam: "2-3煤层", ash: 38.1639, moisture: 2.5635, fineRatio: 10.4502 },
    sizeFractions: [
      { size: "+150", yield: 4.8848, ash: 30.327, moisture: 2.3575 },
      { size: "150-100", yield: 3.5669, ash: 19.5663, moisture: 2.6465 },
      { size: "100-90", yield: 1.3945, ash: 30.4131, moisture: 2.3281 },
      { size: "90-60", yield: 5.1711, ash: 30.4131, moisture: 2.3281 },
      { size: "60-50", yield: 2.2275, ash: 30.4131, moisture: 2.3281 },
      { size: "50-30", yield: 9.2595, ash: 48.2051, moisture: 2.03 },
      { size: "30-25", yield: 3.0477, ash: 48.2051, moisture: 2.03 },
      { size: "25-13", yield: 10.4482, ash: 37.5297, moisture: 2.5 },
      { size: "13-10", yield: 5.1299, ash: 38.3816, moisture: 2.18 },
      { size: "10-8", yield: 4.9324, ash: 37.1736, moisture: 2.95 },
      { size: "8-6", yield: 5.1966, ash: 36.9011, moisture: 3.09 },
      { size: "6-3", yield: 11.3551, ash: 36.7012, moisture: 4.25 },
      { size: "3-2", yield: 6.6667, ash: 36.9283, moisture: 2.33 },
      { size: "2-1.5", yield: 3.906, ash: 36.9283, moisture: 2.33 },
      { size: "1.5-1", yield: 2.3418, ash: 37.5641, moisture: 2.19 },
      { size: "1-0.5", yield: 10.0213, ash: 40.162, moisture: 2.16 },
      { size: "0.5-0", yield: 10.4502, ash: 45.5514, moisture: 2.14 },
    ],
  });
}

function normalizeTemplateNode(raw, index) {
  const type = String(raw.type || "").trim();
  if (!equipmentTypes[type]) throw new Error(`第 ${index + 1} 个设备类型无效：${type || "空"}`);
  const base = equipmentTypes[type];
  const fallback = defaultNodes.find((item) => item.type === type);
  const id = String(raw.id || `${type}-${index + 1}`).trim();
  if (!id) throw new Error(`第 ${index + 1} 个设备缺少 id`);
  const x = Number(raw.x ?? fallback?.x ?? 80 + index * 180);
  const y = Number(raw.y ?? fallback?.y ?? 120);
  const params = { ...base.defaults };
  Object.entries(raw.params || {}).forEach(([key, value]) => {
    params[key] = Number.isFinite(Number(value)) ? Number(value) : value;
  });
  return {
    id,
    type,
    name: String(raw.name || base.label).trim() || base.label,
    x: Number.isFinite(x) ? x : fallback?.x ?? 80 + index * 180,
    y: Number.isFinite(y) ? y : fallback?.y ?? 120,
    params,
  };
}

function normalizeTemplateLink(raw, index, idMap, nameMap) {
  const stream = String(raw.stream || "").trim();
  if (!streamLabels[stream]) throw new Error(`第 ${index + 1} 条连线物料类型无效：${stream || "空"}`);
  const fromKey = String(raw.from || "").trim();
  const toKey = String(raw.to || "").trim();
  const from = idMap[fromKey]?.id || nameMap[fromKey];
  const to = idMap[toKey]?.id || nameMap[toKey];
  if (!from || !to) throw new Error(`第 ${index + 1} 条连线端点无效：${fromKey} -> ${toKey}`);
  const source = idMap[from];
  if (!equipmentTypes[source.type].outputs.includes(stream)) {
    throw new Error(`第 ${index + 1} 条连线的 ${source.name} 没有 ${stream} 出口`);
  }
  return {
    from,
    to,
    stream,
    split: clamp(Number(raw.split ?? 100), 0, 100),
  };
}

function normalizeImportedScenario(data) {
  if (!data || typeof data !== "object") throw new Error("模板内容不是有效 JSON 对象");
  if (!Array.isArray(data.nodes) || data.nodes.length === 0) throw new Error("模板中必须包含 nodes 设备列表");
  if (!Array.isArray(data.links)) throw new Error("模板中必须包含 links 连线列表");

  const nextNodes = data.nodes.map(normalizeTemplateNode);
  const seen = new Set();
  nextNodes.forEach((item) => {
    if (seen.has(item.id)) throw new Error(`设备 id 重复：${item.id}`);
    seen.add(item.id);
  });

  const idMap = Object.fromEntries(nextNodes.map((item) => [item.id, item]));
  const nameMap = {};
  nextNodes.forEach((item) => {
    if (!nameMap[item.name]) nameMap[item.name] = item.id;
  });
  const nextLinks = data.links.map((item, index) => normalizeTemplateLink(item, index, idMap, nameMap));
  const nextCoalQuality = normalizeCoalQuality(data.coalQuality);
  const nextFeed = normalizeTemplateFeed(data.feed);
  applyTopDownLayout(nextNodes);
  if (nextCoalQuality?.processSettings) applyBusinessSettingsToNodes(nextNodes, nextCoalQuality.processSettings);
  if (nextCoalQuality?.summary) {
    if (Number.isFinite(Number(nextCoalQuality.summary.ash))) nextFeed.ash = Number(nextCoalQuality.summary.ash);
    if (Number.isFinite(Number(nextCoalQuality.summary.moisture))) nextFeed.moisture = Number(nextCoalQuality.summary.moisture);
    if (Number.isFinite(Number(nextCoalQuality.summary.fineRatio))) nextFeed.fineRatio = Number(nextCoalQuality.summary.fineRatio);
  }

  return {
    id: `scenario-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: String(data.name || `导入方案 ${scenarios.length + 1}`).trim() || `导入方案 ${scenarios.length + 1}`,
    savedAt: new Date().toISOString(),
    feed: nextFeed,
    coalQuality: nextCoalQuality,
    nodes: nextNodes,
    links: nextLinks,
    layoutDirection: "top-down",
    layoutVersion: LAYOUT_VERSION,
    selectedId: null,
  };
}

function makeImportTemplate() {
  resetFlowStateOnly();
  const template = {
    template: "coal-process-scenario",
    version: 1,
    name: "导入方案示例",
    feed: getFeed(),
    notes: [
      "nodes 中 type 必须使用设备类型编码；links 的 from/to 可填写设备 id 或设备名称。",
      "stream 必须是设备出口支持的物料编码，split 为该出口分配比例 0-100。",
    ],
    equipmentTypes: Object.fromEntries(
      Object.entries(equipmentTypes).map(([type, config]) => [
        type,
        { label: config.label, category: config.category, outputs: config.outputs, params: config.defaults },
      ]),
    ),
    streamLabels,
    coalQuality: coalQuality || defaultCoalQualityTemplate(),
    nodes: nodes.map((item) => ({
      id: item.id,
      type: item.type,
      name: item.name,
      x: item.x,
      y: item.y,
      params: { ...item.params },
    })),
    links: links.map((item) => ({ ...item })),
  };
  const current = scenarios.find((item) => item.id === activeScenarioId);
  if (current) applyScenario(current);
  return template;
}

function downloadImportTemplate() {
  const blob = new Blob([JSON.stringify(makeImportTemplate(), null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "选煤厂流程导入模板.json";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function templateToTableRows(template) {
  return {
    feed: [
      ["field", "value"],
      ["rate", template.feed.rate],
      ["ash", template.feed.ash],
      ["moisture", template.feed.moisture],
      ["fineRatio", template.feed.fineRatio],
    ],
    coal_settings: [
      ["field", "value"],
      ["seam", template.coalQuality?.summary?.seam || "2-3煤层"],
      ["ash", template.coalQuality?.summary?.ash ?? template.feed.ash],
      ["moisture", template.coalQuality?.summary?.moisture ?? template.feed.moisture],
      ["fineRatio", template.coalQuality?.summary?.fineRatio ?? template.feed.fineRatio],
    ],
    size_fractions: [
      ["size", "yield", "ash", "moisture"],
      ...((template.coalQuality?.sizeFractions?.length ? template.coalQuality.sizeFractions : defaultCoalQualityTemplate().sizeFractions)
        .map((item) => [item.size, item.yield, item.ash, item.moisture])),
    ],
    nodes: [
      ["id", "type", "name", "x", "y", "params_json"],
      ...template.nodes.map((item) => [item.id, item.type, item.name, item.x, item.y, JSON.stringify(item.params)]),
    ],
    links: [
      ["from", "to", "stream", "split"],
      ...template.links.map((item) => [item.from, item.to, item.stream, item.split]),
    ],
  };
}

function downloadCsvImportTemplate() {
  const tables = templateToTableRows(makeImportTemplate());
  const lines = [];
  Object.entries(tables).forEach(([section, rows]) => {
    lines.push(`# ${section}`);
    rows.forEach((row) => lines.push(row.map(csvCell).join(",")));
    lines.push("");
  });
  downloadBlob(`\ufeff${lines.join("\n")}`, "选煤厂流程导入模板.csv", "text/csv;charset=utf-8");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tableToHtml(title, rows) {
  return [
    `<h2>${escapeHtml(title)}</h2>`,
    `<table data-sheet="${escapeHtml(title)}">`,
    ...rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`),
    "</table>",
  ].join("");
}

function downloadExcelImportTemplateLegacy() {
  const tables = templateToTableRows(makeImportTemplate());
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>body{font-family:Microsoft YaHei,Arial,sans-serif}table{border-collapse:collapse;margin-bottom:24px}td{border:1px solid #999;padding:6px 10px;mso-number-format:"\\@"}h2{margin:18px 0 8px}</style>
</head>
<body>
  ${tableToHtml("feed", tables.feed)}
  ${tableToHtml("nodes", tables.nodes)}
  ${tableToHtml("links", tables.links)}
</body>
</html>`;
  downloadBlob(`\ufeff${html}`, "选煤厂流程导入模板.xls", "application/vnd.ms-excel;charset=utf-8");
}

function downloadExcelImportTemplate() {
  const template = makeImportTemplate();
  const q = template.coalQuality || defaultCoalQualityTemplate();
  const rows = q.sizeFractions || [];
  const summary = q.summary || {};
  const predictedRows = [
    ["粒级(mm)", "占全样\n(%)", "灰 分\n(%)", "Mad\n(%)"],
    ...rows.map((item) => [item.size, item.yield, item.ash, item.moisture]),
    ["合计", 100, summary.ash ?? "", summary.moisture ?? ""],
  ];
  const screenRows = [
    ["粒级(mm)", "产物名称", "", "重量", "占全样(%)", "筛上累计", "Mad%", "Ad%", "St,d%", "Qgr,d MJ/Kg"],
    ["", "", "", "(kg)", "(%)", "(%)", "水分", "灰分", "全硫", "发热量"],
    ...rows.map((item) => [item.size, "煤", "", "", item.yield, "", item.moisture, item.ash, "", ""]),
    ["毛煤总计", "", "", "", 100, "", summary.moisture ?? "", summary.ash ?? "", "", ""],
  ];
  const denseRows = [
    ["密度级(kg/l)", "重量(kg)", "占本级", "占全样", "Ad %", "St,d%", "浮物累计", "", "", "沉物累计"],
    ["", "(kg)", "(%)", "(%)", "灰分", "全硫", "产率", "灰分", "", "产率"],
    ...((q.denseFractions?.length ? q.denseFractions : [
      { density: "<1.30", yieldInClass: 18, yieldTotal: 18, ash: 5.5 },
      { density: "1.30-1.40", yieldInClass: 22, yieldTotal: 22, ash: 8.5 },
      { density: "1.40-1.50", yieldInClass: 16, yieldTotal: 16, ash: 14.5 },
      { density: "1.50-1.60", yieldInClass: 12, yieldTotal: 12, ash: 24.5 },
      { density: "1.60-1.80", yieldInClass: 10, yieldTotal: 10, ash: 39.5 },
      { density: ">1.80", yieldInClass: 22, yieldTotal: 22, ash: 78.5 },
    ]).map((item) => [item.density, item.weight ?? "", item.yieldInClass, item.yieldTotal, item.ash, item.sulfur ?? "", "", "", "", ""])),
    ["合计", "", 100, 100, summary.ash ?? "", "", "", "", "", ""],
  ];
  const totalRows = [
    ["项目", "Mt %", "Mad %", "", "Ad %", "", "Vdaf %", "焦渣特征", "FCd%", "St,d %"],
    ["原煤", "", summary.moisture ?? "", "", summary.ash ?? "", "", "", "", "", ""],
    ["浮煤", "", "", "", "", "", "", "", "", ""],
  ];
  const settingRows = [
    ["项目", "数值", "单位", "说明"],
    ["煤层", summary.seam || "2-3煤层", "", "表名可以继续沿用 2-3煤预测、4-2煤预测 等业务命名"],
    ["校正后的原煤灰分", summary.ash ?? "", "%", "对应煤预测表合计灰分或预测综合校正灰分"],
    ["原煤水分", summary.moisture ?? "", "%", "对应自然级筛分 Mad 合计"],
    ["-0.5mm 含量", summary.fineRatio ?? "", "%", "导入后用于细煤泥比例"],
    ["分级粒度", 10, "mm", "原煤筛分 cutSize，可在设备参数里继续调整"],
    ["浅槽分选密度", 1.7, "kg/L", "可填到浅槽设备 density"],
    ["重介旋流器分选密度", 1.7, "kg/L", "可填到重介旋流器 density"],
    [],
    ["产品名称", "产率(%)", "灰分(%)", "水分(%)", "发热量(kcal/kg)", "备注"],
    ...((q.productBalance?.length ? q.productBalance : [
      { name: "精煤", yield: 62, ash: 12.5, moisture: 8.5 },
      { name: "中煤", yield: 9, ash: 34, moisture: 10 },
      { name: "矸石/尾煤", yield: 29, ash: 55, moisture: 12 },
    ]).map((item) => [item.name, item.yield, item.ash, item.moisture, item.heat ?? "", ""])),
    ["合计", 100, summary.ash ?? "", summary.moisture ?? "", "", ""],
  ];
  const flowRows = [
    ["节点/环节", "输入", "输出", "关键参数", "备注"],
    ["入洗原煤", "原煤", "筛分/脱泥", `灰分 ${summary.ash ?? ""}%`, "流程计算表可继续追加"],
    ["重介分选", "块煤/末煤", "精煤/中煤/矸石", "分选密度", ""],
  ];
  const simpleBusinessRows = [
    ["项目", "数值", "单位", "备注"],
    ["示例参数", "", "", "保留该业务表名，导入时会进入已识别清单"],
  ];
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body{font-family:Microsoft YaHei,Arial,sans-serif;color:#111}
    h1{font-size:20px;margin:18px 0 6px}
    h2{font-size:16px;margin:22px 0 8px}
    table{border-collapse:collapse;margin-bottom:24px}
    td{border:1px solid #999;padding:6px 10px;mso-number-format:"\\@";min-width:86px}
    .hint{color:#666;font-size:12px;margin:0 0 12px}
  </style>
</head>
<body>
  <h1>煤质数据导入模板</h1>
  <p class="hint">按业务口径组织：2-3筛、2-3煤预测为输入数据；预测综合为计算结果（校正灰分、工艺参数、产品平衡）。导入时自动区分输入与结果，也兼容旧版 feed/nodes/links 表。</p>
  ${tableToHtml("2-3总", totalRows)}
  ${tableToHtml("2-3筛", screenRows)}
  ${tableToHtml("2-3自浮", denseRows)}
  ${tableToHtml("2-3煤预测", predictedRows)}
  ${tableToHtml("预测综合", settingRows)}
  ${tableToHtml("2-3流程-新版", flowRows)}
  ${tableToHtml("HM Vessel", simpleBusinessRows)}
  ${tableToHtml("效益测算-2-3煤层", simpleBusinessRows)}
  ${tableToHtml("2-3煤钻孔", simpleBusinessRows)}
  ${tableToHtml("原煤和产品价格表", simpleBusinessRows)}
  ${tableToHtml("2-3煤层发热量预", simpleBusinessRows)}
</body>
</html>`;
  downloadBlob(`\ufeff${html}`, "煤质数据导入模板-按业务表格式.xls", "application/vnd.ms-excel;charset=utf-8");
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\ufeff/, "");
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((item) => item.trim())) rows.push(row);
  return rows;
}

function parseSectionedCsv(text) {
  const rows = parseCsvRows(text);
  const sections = {};
  let current = null;
  rows.forEach((row) => {
    const first = String(row[0] || "").trim();
    if (!first) return;
    if (first.startsWith("#")) {
      current = first.replace(/^#+/, "").trim();
      sections[current] = [];
    } else if (current) {
      sections[current].push(row);
    }
  });
  return tableSectionsToTemplate(sections);
}

function parseExcelHtml(text) {
  const doc = new DOMParser().parseFromString(text, "text/html");
  const sections = {};
  doc.querySelectorAll("table").forEach((table) => {
    const name = table.dataset.sheet || table.previousElementSibling?.textContent?.trim();
    if (!name) return;
    sections[name] = Array.from(table.rows).map((tr) => Array.from(tr.cells).map((td) => td.textContent.trim()));
  });
  return tableSectionsToTemplate(sections);
}

async function parseXlsxWorkbook(buffer, filename = "") {
  const entries = await unzipXlsxEntries(buffer);
  const readXml = (path) => new DOMParser().parseFromString(new TextDecoder().decode(entries[path]), "application/xml");
  const sharedStrings = entries["xl/sharedStrings.xml"] ? parseSharedStrings(readXml("xl/sharedStrings.xml")) : [];
  const workbook = readXml("xl/workbook.xml");
  const rels = readXml("xl/_rels/workbook.xml.rels");
  const relMap = {};
  xmlEls(rels, "Relationship").forEach((rel) => {
    relMap[rel.getAttribute("Id")] = rel.getAttribute("Target");
  });
  const sections = {};
  xmlEls(workbook, "sheet").forEach((sheet) => {
    const name = sheet.getAttribute("name");
    const relId = sheet.getAttribute("r:id") || sheet.getAttribute("id");
    const target = relMap[relId];
    if (!name || !target) return;
    const path = `xl/${target.replace(/^\/?xl\//, "")}`;
    if (!entries[path]) return;
    sections[name] = parseSheetRows(readXml(path), sharedStrings);
  });
  return tableSectionsToTemplate(sections, filename);
}

async function unzipXlsxEntries(buffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("未找到 XLSX 压缩目录");
  const entriesCount = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const entries = {};
  for (let i = 0; i < entriesCount; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error("XLSX 中央目录损坏");
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const filenameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const filename = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + filenameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const data = bytes.slice(dataStart, dataStart + compressedSize);
    if (method === 0) entries[filename] = data;
    else if (method === 8) entries[filename] = await inflateRaw(data);
    offset += 46 + filenameLength + extraLength + commentLength;
  }
  return entries;
}

async function inflateRaw(data) {
  if (!("DecompressionStream" in window)) throw new Error("当前浏览器不支持直接解析 XLSX，请另存为 .xls 后导入");
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function parseSharedStrings(doc) {
  return xmlEls(doc, "si").map((si) =>
    xmlEls(si, "t").map((t) => t.textContent || "").join(""),
  );
}

function parseSheetRows(doc, sharedStrings) {
  const rows = [];
  xmlEls(doc, "row").forEach((rowEl) => {
    const row = [];
    xmlEls(rowEl, "c").forEach((cell) => {
      const ref = cell.getAttribute("r") || "";
      const col = columnIndex(ref.replace(/\d+/g, "")) - 1;
      row[col] = cellValue(cell, sharedStrings);
    });
    rows.push(row.map((item) => item ?? ""));
  });
  return rows;
}

function columnIndex(col) {
  return col.split("").reduce((sum, ch) => sum * 26 + ch.charCodeAt(0) - 64, 0);
}

function cellValue(cell, sharedStrings) {
  const type = cell.getAttribute("t");
  if (type === "inlineStr") return xmlEls(cell, "t")[0]?.textContent || "";
  const raw = xmlEls(cell, "v")[0]?.textContent ?? "";
  if (type === "s") return sharedStrings[Number(raw)] || "";
  return raw;
}

function xmlEls(node, localName) {
  return Array.from(node.getElementsByTagNameNS("*", localName));
}

function tableRowsToObjects(rows) {
  const headers = (rows[0] || []).map((item) => String(item).trim());
  return rows.slice(1).filter((row) => row.some((cell) => String(cell).trim())).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] ?? "";
    });
    return item;
  });
}

function tableSectionsToTemplate(sections, filename = "") {
  if (!sections.feed && !sections.nodes) {
    const businessData = businessCoalSectionsToTemplate(sections, filename);
    if (businessData) return businessData;
  }
  const feedRows = tableRowsToObjects(sections.feed || []);
  const coalSettingRows = tableRowsToObjects(sections.coal_settings || []);
  const sizeRows = tableRowsToObjects(sections.size_fractions || []);
  const feed = {};
  feedRows.forEach((row) => {
    feed[String(row.field || "").trim()] = row.value;
  });
  const coalSummary = {};
  coalSettingRows.forEach((row) => {
    coalSummary[String(row.field || "").trim()] = row.value;
  });
  return {
    name: "表格导入方案",
    feed,
    coalQuality: sizeRows.length ? {
      summary: coalSummary,
      sizeFractions: sizeRows.map((row) => ({
        size: row.size,
        yield: row.yield,
        ash: row.ash,
        moisture: row.moisture,
      })),
    } : null,
    nodes: tableRowsToObjects(sections.nodes || []).map((row) => ({
      id: row.id,
      type: row.type,
      name: row.name,
      x: row.x,
      y: row.y,
      params: row.params_json ? JSON.parse(row.params_json) : {},
    })),
    links: tableRowsToObjects(sections.links || []).map((row) => ({
      from: row.from,
      to: row.to,
      stream: row.stream,
      split: row.split,
    })),
  };
}

function defaultTopologyTemplateData() {
  const nextNodes = defaultNodes.map((item, index) => ({
    ...cloneNode(item),
    id: `${item.type}-${index + 1}`,
  }));
  const idByOriginal = Object.fromEntries(defaultNodes.map((item, index) => [item.id, nextNodes[index].id]));
  return {
    nodes: nextNodes,
    links: defaultLinks.map((item) => ({
      ...item,
      from: idByOriginal[item.from] || item.from,
      to: idByOriginal[item.to] || item.to,
    })),
  };
}

function applyTopDownLayout(nodeList) {
  const defaultsByType = {};
  defaultNodes.forEach((item) => {
    defaultsByType[item.type] = [...(defaultsByType[item.type] || []), item];
  });
  const seenByType = {};
  const extraStartY = 1140;
  nodeList.forEach((item, index) => {
    const seen = seenByType[item.type] || 0;
    seenByType[item.type] = seen + 1;
    const ref = defaultsByType[item.type]?.[seen];
    if (ref) {
      item.x = ref.x;
      item.y = ref.y;
      return;
    }
    item.x = 80 + (index % 4) * 220;
    item.y = extraStartY + Math.floor(index / 4) * 130;
  });
}

function businessCoalSectionsToTemplate(sections, filename = "") {
  const names = Object.keys(sections);
  const targetSeam = coalSeamFromText(`${filename} ${names.join(" ")}`);
  const predictName = pickBusinessSheetName(names, "煤预测", targetSeam);
  const screenName = pickBusinessSheetName(names, "筛", targetSeam, { exclude: /预测/ });
  const resultName = pickBusinessSheetName(names, "预测综合", targetSeam);
  if (!predictName && !screenName) return null;

  const coalQuality = parseBusinessInputData(
    predictName ? sections[predictName] : [],
    screenName ? sections[screenName] : [],
    targetSeam,
    predictName,
    screenName,
  );
  const resultPack = parseBusinessResultData(resultName ? sections[resultName] : [], targetSeam);
  Object.assign(coalQuality.summary, resultPack.summary);
  coalQuality.processSettings = resultPack.settings;
  coalQuality.productBalance = resultPack.productBalance;
  coalQuality.expectedResults = resultPack.expectedResults;
  Object.assign(coalQuality, parseBusinessExtras(sections, targetSeam));
  coalQuality.useExcelEngine = true;
  if (!coalQuality.processSettings) coalQuality.processSettings = resultPack.settings;
  if (resultName && sections[resultName]) {
    Object.assign(coalQuality.processSettings, parseBusinessEpTable(sections[resultName]));
  }
  if (predictName && sections[predictName]) {
    const predRows = sections[predictName];
    coalQuality.processSettings.partitionEpBySize = parseBusinessPartitionEp(predRows);
    Object.assign(coalQuality.processSettings, parseBusinessFineMeta(predRows));
    coalQuality.block248BB = parseBusinessBlock248BB(predRows);
  }
  if (!coalQuality?.sizeFractions?.length) return null;

  const topology = defaultTopologyTemplateData();
  applyBusinessSettingsToNodes(topology.nodes, resultPack.settings);
  return {
    name: `${coalQuality.summary.seam || "煤质"}导入方案`,
    feed: buildFeedFromBusinessData(coalQuality, resultPack),
    coalQuality,
    nodes: topology.nodes,
    links: topology.links,
  };
}

function parseBusinessInputData(predictionRows, screenRows, targetSeam, predictName = "", screenName = "") {
  const table = predictionRows.length ? findBusinessSizeTable(predictionRows, targetSeam) : { seam: "", rows: [], summary: {} };
  const screenTable = screenRows.length ? parseBusinessScreenSizing(screenRows, targetSeam) : { rows: [], summary: {} };
  let sizeFractions = table.rows.length ? table.rows : screenTable.rows;
  if (predictionRows.length) {
    sizeFractions = mergeSizeProcessingFactors(sizeFractions, parseBusinessSizeProcessing(predictionRows));
  }
  const weighted = weightedCoalQuality(sizeFractions);
  const summary = {
    seam: table.seam || screenTable.seam || (targetSeam ? `${targetSeam}煤层` : ""),
    ash: Number.isFinite(table.summary.ash) ? table.summary.ash : screenTable.summary.ash ?? weighted.ash,
    moisture: Number.isFinite(table.summary.moisture) ? table.summary.moisture : screenTable.summary.moisture ?? weighted.moisture,
    fineRatio: coalFineRatio(sizeFractions, 0.5),
  };
  return normalizeCoalQuality({
    summary,
    sizeFractions,
    screenSizing: screenTable.rows,
    inputSources: {
      predictionSheet: predictName,
      screenSheet: screenName,
    },
  });
}

function parseBusinessResultData(rows = [], targetSeam = "") {
  const settings = parseBusinessProcessSettings(rows, targetSeam);
  const balance = parseBusinessProductBalance(rows, targetSeam);
  const summary = {
    seam: settings.seam || (targetSeam ? `${targetSeam}煤层` : ""),
    ash: Number.isFinite(settings.correctedAsh) ? settings.correctedAsh : NaN,
    moisture: Number.isFinite(settings.feedMoisture) ? settings.feedMoisture : NaN,
    fineRatio: Number.isFinite(settings.fineSlimeRatio) ? settings.fineSlimeRatio : NaN,
    rawAshScreen: settings.rawAshScreen,
    rawAshTotal: settings.rawAshTotal,
  };
  if (!Number.isFinite(summary.moisture) && Number.isFinite(balance.feedMoisture)) summary.moisture = balance.feedMoisture;
  const cleanProducts = balance.products.filter((item) => /精煤|块煤|籽|末精/.test(item.name) && !/小计|原煤/.test(item.name));
  const rejectProducts = balance.products.filter((item) => /矸|尾|煤泥/.test(item.name) && !/小计|原煤/.test(item.name));
  const feedRate = Number.isFinite(balance.feedRate)
    ? balance.feedRate
    : (Number.isFinite(settings.designCapacity) ? settings.designCapacity : NaN);
  const expectedResults = {
    sectionTitle: balance.sectionTitle,
    feedRate,
    cleanYield: sumYield(cleanProducts),
    cleanAsh: yieldWeightedAsh(cleanProducts),
    rejectYield: sumYield(rejectProducts),
    rejectAsh: yieldWeightedAsh(rejectProducts),
    rawYield: balance.products.find((item) => item.name.includes("原煤"))?.yield ?? 100,
    rawAsh: balance.products.find((item) => item.name.includes("原煤"))?.ash ?? summary.ash,
  };
  return {
    summary,
    settings,
    productBalance: balance.products,
    expectedResults,
    feedRate,
  };
}

function buildFeedFromBusinessData(coalQuality, resultPack) {
  const s = coalQuality?.summary || {};
  return {
    rate: Number.isFinite(resultPack.feedRate) ? resultPack.feedRate : getFeed().rate || 850,
    ash: Number.isFinite(s.ash) ? s.ash : getFeed().ash,
    moisture: Number.isFinite(s.moisture) ? s.moisture : getFeed().moisture,
    fineRatio: Number.isFinite(s.fineRatio) ? s.fineRatio : getFeed().fineRatio,
  };
}

function applyBusinessSettingsToNodes(nodeList, settings = {}) {
  if (!settings || !nodeList?.length) return;
  const ratioToPercent = (value) => (value <= 1 ? value * 100 : value);
  nodeList.filter((item) => item.type === "screen").forEach((item) => {
    if (Number.isFinite(settings.screenCutSize)) item.params.cutSize = settings.screenCutSize;
    if (Number.isFinite(settings.screenEfficiency)) item.params.efficiency = ratioToPercent(settings.screenEfficiency);
  });
  nodeList.filter((item) => item.type === "deslime").forEach((item) => {
    if (Number.isFinite(settings.deslimeCutSize)) item.params.cutSize = settings.deslimeCutSize;
    if (Number.isFinite(settings.deslimeEfficiency)) item.params.efficiency = ratioToPercent(settings.deslimeEfficiency);
  });
  nodeList.filter((item) => item.type === "shallow").forEach((item) => {
    if (Number.isFinite(settings.shallowDensity)) item.params.density = settings.shallowDensity;
  });
  nodeList.filter((item) => item.type === "dmc").forEach((item) => {
    if (Number.isFinite(settings.dmcDensity)) item.params.density = settings.dmcDensity;
  });
  nodeList.filter((item) => item.type === "slimeCyclone").forEach((item) => {
    if (Number.isFinite(settings.slimeCutSize)) item.params.cutSize = settings.slimeCutSize;
    if (Number.isFinite(settings.slimeClassEfficiency)) item.params.overflowRatio = ratioToPercent(settings.slimeClassEfficiency);
  });
  nodeList.filter((item) => item.type === "spiral").forEach((item) => {
    if (Number.isFinite(settings.spiralDensity)) item.params.density = settings.spiralDensity;
  });
}

function parseBusinessProcessSettings(rows = [], targetSeam = "") {
  const settings = { seam: targetSeam ? `${targetSeam}煤层` : "" };
  rows.forEach((row) => {
    row.forEach((cell, index) => {
      const label = String(cell ?? "").trim();
      if (!label || label.length > 36) return;
      const value = numberOrBlank(row[index + 1]) ?? numberOrBlank(row[index + 3]);
      if (/^\s*\d-\d煤层\s*$/.test(label)) settings.seam = label;
      if (/校正后的原煤灰分/.test(label) && Number.isFinite(value)) settings.correctedAsh = value;
      if (/大筛分表原始原煤灰分/.test(label) && Number.isFinite(value)) settings.rawAshScreen = value;
      if (/总样表原煤灰分/.test(label) && Number.isFinite(value)) settings.rawAshTotal = value;
      if (/末煤次生煤泥率/.test(label) && Number.isFinite(value)) settings.fineSlimeRatio = value;
      if (/分级粒度/.test(label) && !/煤泥/.test(label) && Number.isFinite(value)) settings.screenCutSize = value;
      if (/分级效率/.test(label) && !/煤泥/.test(label) && Number.isFinite(value)) settings.screenEfficiency = value;
      if (/脱粉粒度/.test(label) && Number.isFinite(value)) settings.deslimeCutSize = value;
      if (/脱粉效率/.test(label) && Number.isFinite(value)) settings.deslimeEfficiency = value;
      if (/浅槽分选密度/.test(label) && Number.isFinite(value)) settings.shallowDensity = value;
      if (/重介旋流器分选密度/.test(label) && Number.isFinite(value)) settings.dmcDensity = value;
      if (/煤泥分级粒度/.test(label) && Number.isFinite(value)) settings.slimeCutSize = value;
      if (/煤泥分级效率/.test(label) && Number.isFinite(value)) settings.slimeClassEfficiency = value;
      if (/粗煤泥分选密度/.test(label) && Number.isFinite(value)) settings.spiralDensity = value;
      if (/设计入洗能力/.test(label) && Number.isFinite(value)) settings.designCapacity = value;
    });
    const line = row.join(" ");
    if (line.includes("设计入洗能力") && Number.isFinite(numberOrBlank(row[8]))) settings.designCapacity = numberOrBlank(row[8]);
    if (Number.isFinite(numberOrBlank(row[9]))) settings.annualCapacity = numberOrBlank(row[9]);
  });
  return settings;
}

function parseBusinessEpTable(rows = []) {
  const table = { sizeEpRows: [] };
  rows.forEach((row) => {
    const sizeLabel = String(row[5] ?? "").trim();
    const cutLower = numberOrBlank(row[6]);
    const shallowEp = numberOrBlank(row[7]);
    const dmcEp = numberOrBlank(row[8]);
    const spiralI = numberOrBlank(row[9]);
    if (sizeLabel && /mm|\+|\d-\d|总计|小计/.test(sizeLabel) && !/粒级|下限|偏差|不完善/.test(sizeLabel)) {
      table.sizeEpRows.push({ size: sizeLabel, cutLower, shallowEp, dmcEp, spiralI });
    }
    if (Number.isFinite(shallowEp) && sizeLabel === "+150") table.shallowEp = shallowEp;
    if (Number.isFinite(dmcEp) && sizeLabel === "+150") table.dmcEp = dmcEp;
  });
  if (!Number.isFinite(table.shallowEp) && table.sizeEpRows.length) {
    const first = table.sizeEpRows.find((item) => Number.isFinite(item.shallowEp));
    table.shallowEp = first?.shallowEp ?? 0.02;
  }
  if (!Number.isFinite(table.dmcEp) && table.sizeEpRows.length) {
    const first = table.sizeEpRows.find((item) => Number.isFinite(item.dmcEp));
    table.dmcEp = first?.dmcEp ?? 0.03;
  }
  table.externalMoisture = 10;
  table.defaultMad = 2.56;
  table.annualCapacity = 4;
  return table;
}

/** 2-3煤预测 331-346 行 P 列：209 块 DMC 分配不完善度 I */
function parseBusinessPartitionEp(rows = []) {
  const map = {};
  rows.forEach((row) => {
    const size = String(row?.[1] ?? "").trim();
    if (!size || !/^\+?\d|^\d-\d/.test(size) || /合计|小计|总计|粒级|产品/.test(size)) return;
    const pEp = numberOrBlank(row?.[15]);
    if (Number.isFinite(pEp) && pEp > 0 && pEp <= 1) {
      map[normalizeBusinessSizeLabel(size)] = pEp;
    }
  });
  return map;
}

function parseBusinessScreenSizing(rows = [], targetSeam = "") {
  const result = [];
  const summary = {};
  let currentSize = "";
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    const sizeCandidate = String(row[1] ?? row[4] ?? "").trim();
    if (/^\+?\d|^\d|合计|总计|毛煤/.test(sizeCandidate) && !/产物|粒级/.test(sizeCandidate)) {
      if (!sizeCandidate.includes("合计") && !sizeCandidate.includes("总计")) currentSize = sizeCandidate.replace("合计", "").trim();
    }
    const product = String(row[3] ?? row[2] ?? "").trim();
    if (product !== "煤" || !currentSize) continue;
    const yieldValue = numberOrBlank(row[5]) ?? numberOrBlank(row[4]);
    const ash = numberOrBlank(row[8]) ?? numberOrBlank(row[7]);
    const moisture = numberOrBlank(row[7]) ?? numberOrBlank(row[6]);
    if (!Number.isFinite(yieldValue)) continue;
    const existing = result.find((item) => item.size === currentSize);
    if (existing) {
      existing.yield += yieldValue;
      existing.ash = weightedAverage(existing.ash, existing.yield - yieldValue, ash, yieldValue);
    } else {
      result.push({
        size: currentSize,
        yield: yieldValue,
        ash: Number.isFinite(ash) ? ash : 0,
        moisture: Number.isFinite(moisture) ? moisture : 0,
      });
    }
    if (/毛煤总计|总计/.test(sizeCandidate) || /毛煤总计|总计/.test(String(row[0] ?? ""))) {
      summary.ash = Number.isFinite(ash) ? ash : summary.ash;
      summary.moisture = Number.isFinite(moisture) ? moisture : summary.moisture;
    }
  }
  return { seam: targetSeam ? `${targetSeam}煤层` : "", rows: result, summary };
}

function weightedAverage(a, wa, b, wb) {
  const total = wa + wb;
  if (total <= 0) return Number.isFinite(b) ? b : a;
  return ((Number(a) || 0) * wa + (Number(b) || 0) * wb) / total;
}

function sumYield(items = []) {
  return items.reduce((sum, item) => sum + numberOrZero(item.yield), 0);
}

function yieldWeightedAsh(items = []) {
  const total = sumYield(items);
  if (total <= 0) return NaN;
  return items.reduce((sum, item) => sum + numberOrZero(item.yield) * numberOrZero(item.ash), 0) / total;
}

function parseBusinessBlock248BB(rows = []) {
  const DENSITY_LABELS = ["<1.30", "1.30-1.40", "1.40-1.50", "1.50-1.60", "1.60-1.70", "1.70-1.80", "1.80-2.00", ">2.00"];
  const DENSITY_MID = [1.2, 1.35, 1.45, 1.55, 1.65, 1.75, 1.9, 2.1];
  let start = -1;
  for (let r = 0; r < rows.length; r++) {
    const az = String(rows[r]?.[51] ?? rows[r]?.[52] ?? "").trim();
    if (az.includes("0.5-0.25") || az.includes("0.5-0.25/0.15")) {
      start = r + 2;
      break;
    }
  }
  if (start < 0) {
    for (let r = 0; r < rows.length; r++) {
      const density = String(rows[r]?.[1] ?? "").trim();
      const bb = numberOrBlank(rows[r]?.[53]);
      if (density === "<1.30" && Number.isFinite(bb) && bb > 5 && bb < 15) {
        start = r;
        break;
      }
    }
  }
  if (start < 0) return [];
  const result = [];
  for (let r = start; r < Math.min(rows.length, start + 10); r++) {
    const row = rows[r] || [];
    const density = String(row[1] ?? "").trim();
    if (!density || /合计|密度|占全样|占本级/.test(density)) break;
    const idx = DENSITY_LABELS.indexOf(density);
    const yieldInClass = numberOrBlank(row[53]);
    const ash = numberOrBlank(row[54]);
    if (!Number.isFinite(yieldInClass)) continue;
    result.push({
      density,
      densityMid: idx >= 0 ? DENSITY_MID[idx] : numberOrBlank(row[2]),
      yieldInClass,
      ash: Number.isFinite(ash) ? ash : 0,
    });
  }
  return result;
}

/** AR163 超细粒级入洗因子、AT163 细煤泥产率、U 列螺旋 Ep（BD261） */
function parseBusinessFineMeta(rows = []) {
  const meta = {};
  rows.forEach((row, idx) => {
    const line = row.map((cell) => String(cell ?? "")).join(" ");
    if (/煤泥/.test(line) && /合计/.test(line)) {
      const slimeYield = numberOrBlank(row[45]);
      const slimeAsh = numberOrBlank(row[46]);
      if (Number.isFinite(slimeYield)) meta.slimeTotalYield = slimeYield;
      if (Number.isFinite(slimeAsh)) meta.slimeTotalAsh = slimeAsh;
    }
    const ar = numberOrBlank(row[43]);
    if (Number.isFinite(ar) && ar > 1 && ar < 30 && /煤泥|合计|小计/.test(line)) {
      meta.extraFineFactor = ar;
    }
    const size = String(row[1] ?? "").trim();
    if (size.includes("0.5-0.25") || size.includes("0.15")) {
      const spiralEp = numberOrBlank(row[20]);
      if (Number.isFinite(spiralEp) && spiralEp > 0 && spiralEp <= 1) meta.spiralFineEp = spiralEp;
    }
  });
  if (!Number.isFinite(meta.extraFineFactor)) {
    const row163 = rows[162];
    if (row163) {
      const ar163 = numberOrBlank(row163[43]);
      if (Number.isFinite(ar163) && ar163 > 1) meta.extraFineFactor = ar163;
      const at163 = numberOrBlank(row163[45]);
      const ao163 = numberOrBlank(row163[40]);
      if (Number.isFinite(at163) && at163 > 1) {
        meta.slimeTotalYield = at163;
        meta.fineSlimeRatio = at163;
      }
      if (Number.isFinite(ao163)) meta.slimeTotalAsh = ao163;
    }
  }
  return meta;
}

function parseBusinessExtras(sections = {}, targetSeam = "") {
  const names = Object.keys(sections);
  const denseName = pickBusinessSheetName(names, "自浮", targetSeam);
  const predictName = pickBusinessSheetName(names, "煤预测", targetSeam);
  const productName = pickBusinessSheetName(names, "预测综合", targetSeam);
  const denseFromFloat = denseName ? parseBusinessDenseFractions(sections[denseName]) : [];
  const denseFromPredict = predictName ? parseBusinessDenseFromPrediction(sections[predictName]) : [];
  const predictRows = predictName ? sections[predictName] : [];
  return {
    denseFractions: mergeDenseFractionSources(denseFromPredict, denseFromFloat),
    block248BB: predictRows.length ? parseBusinessBlock248BB(predictRows) : [],
    productBalance: productName ? parseBusinessProductBalance(sections[productName], targetSeam).products : [],
    sourceLists: names
      .map((name) => {
        const type = businessSheetType(name);
        if (!type) return null;
        return { name, type, count: countMeaningfulRows(sections[name]) };
      })
      .filter(Boolean),
  };
}

function pickBusinessSheetName(names, keyword, targetSeam = "", options = {}) {
  const exclude = options.exclude;
  let matched = names.filter((name) => name.includes(keyword));
  if (exclude) matched = matched.filter((name) => !exclude.test(name));
  if (!matched.length) return "";
  return matched.find((name) => targetSeam && name.includes(targetSeam)) || matched[0];
}

function businessSheetType(name = "") {
  if (name.includes("预测综合")) return "结果-预测综合";
  if (name.includes("煤预测")) return "输入-煤预测";
  if (name.includes("筛") && !name.includes("预测")) return "输入-筛分";
  if (name.includes("自浮")) return "输入-密度级自浮";
  if (name.includes("筛")) return "筛分";
  if (name.includes("总")) return "总样";
  if (name.includes("流程")) return "流程计算";
  if (name.includes("HM Vessel")) return "重介槽";
  if (name.includes("效益")) return "效益测算";
  if (name.includes("钻孔")) return "钻孔估算";
  if (name.includes("价格")) return "价格表";
  if (name.includes("发热量")) return "发热量预测";
  if (name.includes("运营产品")) return "运营产品";
  return "";
}

function countMeaningfulRows(rows = []) {
  return rows.filter((row) => row.some((cell) => String(cell ?? "").trim())).length;
}

function normalizeBusinessSizeLabel(text) {
  return String(text ?? "")
    .replace(/[＋]/g, "+")
    .replace(/[－–—]/g, "-")
    .replace(/\s+/g, "")
    .replace(/mm/gi, "");
}

function mergeSizeProcessingFactors(sizeRows = [], factorRows = []) {
  if (!factorRows.length) return sizeRows;
  const factorMap = Object.fromEntries(
    factorRows.map((row) => [normalizeBusinessSizeLabel(row.size), row]),
  );
  return sizeRows.map((row) => {
    const key = normalizeBusinessSizeLabel(row.size);
    const extra = factorMap[key];
    if (!extra) return row;
    return {
      ...row,
      processedYield: Number.isFinite(extra.processedYield) ? extra.processedYield : row.processedYield,
      dmcFactor: Number.isFinite(extra.dmcFactor) ? extra.dmcFactor : row.dmcFactor,
      arFactor: Number.isFinite(extra.arFactor) ? extra.arFactor : row.arFactor,
      fineFactor: Number.isFinite(extra.fineFactor) ? extra.fineFactor : row.fineFactor,
    };
  });
}

/** 2-3煤预测 134-149 行：AF 块煤分选入洗量、AK 末煤分选入洗量 */
function parseBusinessSizeProcessing(rows = []) {
  let headerRow = -1;
  for (let r = 0; r < rows.length; r++) {
    const line = rows[r].map((cell) => String(cell ?? "")).join(" ");
    if (line.includes("粒级") && line.includes("占全样") && /AF|筛上|脱粉/.test(line)) {
      headerRow = r;
      break;
    }
    if (line.includes("粒级(mm)") && rows[r + 1]?.some((cell) => String(cell ?? "").includes("占全样"))) {
      headerRow = r;
      break;
    }
  }
  if (headerRow < 0) {
    for (let r = 0; r < rows.length; r++) {
      const size = String(rows[r]?.[1] ?? rows[r]?.[2] ?? "").trim();
      if (size === "+150" && Number.isFinite(numberOrBlank(rows[r]?.[31]))) {
        headerRow = r - 1;
        break;
      }
    }
  }
  if (headerRow < 0) return [];

  const result = [];
  for (let r = headerRow + 1; r < Math.min(rows.length, headerRow + 20); r++) {
    const row = rows[r] || [];
    const size = String(row[1] ?? row[2] ?? "").trim();
    if (!size || /合计|总计|粒级/.test(size)) break;
    const processedYield = numberOrBlank(row[31]);
    const dmcFactor = numberOrBlank(row[36]);
    const arFactor = numberOrBlank(row[43]);
    const fineFactor = numberOrBlank(row[50]);
    if ([processedYield, dmcFactor, arFactor, fineFactor].some(Number.isFinite)) {
      result.push({
        size,
        processedYield,
        dmcFactor,
        arFactor,
        fineFactor,
      });
    }
  }
  return result;
}

/** 2-3煤预测 117-126 行：各粒级浮沉密度组（配采后） */
function parseBusinessDenseFromPrediction(rows = []) {
  let titleRow = -1;
  for (let r = 0; r < rows.length; r++) {
    const line = rows[r].map((cell) => String(cell ?? "")).join(" ");
    if (line.includes("配采后") && /150|50-25|25-13/.test(line)) {
      titleRow = r;
      break;
    }
  }
  if (titleRow < 0) return [];

  let headerRow = -1;
  for (let r = titleRow; r < Math.min(rows.length, titleRow + 4); r++) {
    if (rows[r].some((cell) => String(cell ?? "").includes("密度级"))) {
      headerRow = r;
      break;
    }
  }
  if (headerRow < 0) return [];

  const groupDefs = [
    { name: "+150", yieldCol: 2, ashCol: 3 },
    { name: "150-50", yieldCol: 5, ashCol: 6 },
    { name: "50-25", yieldCol: 8, ashCol: 9 },
    { name: "25-13", yieldCol: 11, ashCol: 12 },
    { name: "13-10", yieldCol: 14, ashCol: 15 },
    { name: "10-8", yieldCol: 17, ashCol: 18 },
    { name: "8-6", yieldCol: 20, ashCol: 21 },
    { name: "6-3", yieldCol: 23, ashCol: 24 },
    { name: "3-2", yieldCol: 26, ashCol: 27 },
    { name: "1.5-1", yieldCol: 29, ashCol: 30 },
    { name: "1-0.5", yieldCol: 32, ashCol: 33 },
  ];

  const result = [];
  for (let r = headerRow + 1; r < Math.min(rows.length, headerRow + 12); r++) {
    const density = String(rows[r]?.[1] ?? "").trim();
    if (!density) continue;
    if (/合计|总计/.test(density)) break;
    if (!/[<>]|-|^\d/.test(density)) continue;
    groupDefs.forEach(({ name, yieldCol, ashCol }) => {
      const yieldInClass = numberOrBlank(rows[r]?.[yieldCol]);
      const ash = numberOrBlank(rows[r]?.[ashCol]);
      if (!Number.isFinite(yieldInClass) && !Number.isFinite(ash)) return;
      result.push({
        group: name,
        density,
        yieldInClass: Number.isFinite(yieldInClass) ? yieldInClass : 0,
        ash: Number.isFinite(ash) ? ash : 0,
      });
    });
  }
  return result;
}

function mergeDenseFractionSources(primary = [], secondary = []) {
  const map = new Map();
  secondary.forEach((row) => {
    const key = `${normalizeBusinessSizeLabel(row.group)}|${String(row.density ?? "").trim()}`;
    map.set(key, row);
  });
  primary.forEach((row) => {
    const key = `${normalizeBusinessSizeLabel(row.group)}|${String(row.density ?? "").trim()}`;
    map.set(key, row);
  });
  return Array.from(map.values());
}

function parseBusinessDenseFractions(rows = []) {
  const starts = [];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const text = String(rows[r][c] ?? "");
      const headerContext = `${rows[r].slice(c, c + 8).join(" ")} ${rows[r + 1]?.slice(c, c + 8).join(" ") || ""}`;
      if (text.includes("密度级") && /占本级|占全样|Ad/.test(headerContext)) {
        starts.push({ headerRow: r, startCol: c, group: denseGroupTitle(rows, r, c) });
      }
    }
  }
  if (!starts.length) return [];
  const result = [];
  starts.forEach(({ headerRow, startCol, group }) => {
    for (let r = headerRow + 1; r < rows.length; r++) {
      const density = String(rows[r][startCol] ?? "").trim();
      if (!density) continue;
      if (density.includes("合计") || density.includes("总计")) break;
      const weight = numberOrBlank(rows[r][startCol + 1]);
      const yieldInClass = numberOrBlank(rows[r][startCol + 2]);
      const yieldTotal = numberOrBlank(rows[r][startCol + 3]);
      const ash = numberOrBlank(rows[r][startCol + 4]);
      const sulfur = numberOrBlank(rows[r][startCol + 5]);
      const looksLikeDensity = /[<>]|-|^\d+(\.\d+)?$/.test(density);
      if (looksLikeDensity && [yieldInClass, yieldTotal, ash].some(Number.isFinite)) {
        result.push({ group, density, weight, yieldInClass, yieldTotal, ash, sulfur });
      }
    }
  });
  return result;
}

function denseGroupTitle(rows, headerRow, startCol) {
  for (let r = headerRow - 1; r >= Math.max(0, headerRow - 4); r--) {
    for (let c = startCol; c >= Math.max(0, startCol - 1); c--) {
      const text = String(rows[r]?.[c] ?? "").trim();
      if (text && !text.includes("密度级")) return text;
    }
  }
  return "";
}

function parseBusinessProductBalance(rows = [], targetSeam = "") {
  let sectionStart = -1;
  let sectionTitle = "";
  for (let r = 0; r < rows.length; r++) {
    const text = rows[r].map((cell) => String(cell ?? "")).join(" ");
    if (!text.includes("产品平衡表")) continue;
    if (targetSeam && !text.includes(targetSeam) && !text.includes(targetSeam.replace("-", ""))) continue;
    if (text.includes("只洗块煤")) continue;
    sectionStart = r;
    sectionTitle = text.trim();
    break;
  }
  if (sectionStart < 0) {
    sectionStart = rows.findIndex((row) => row.some((cell) => String(cell ?? "").includes("产品平衡表")));
    sectionTitle = sectionStart >= 0 ? rows[sectionStart].map((cell) => String(cell ?? "")).join(" ").trim() : "";
  }
  if (sectionStart < 0) return { products: [], feedRate: NaN, feedMoisture: NaN, sectionTitle: "" };

  let headerRow = -1;
  for (let r = sectionStart; r < Math.min(sectionStart + 8, rows.length); r++) {
    if (rows[r].some((cell) => String(cell ?? "").includes("产品名称"))) {
      headerRow = r;
      break;
    }
  }
  if (headerRow < 0) return { products: [], feedRate: NaN, feedMoisture: NaN, sectionTitle };

  const products = [];
  let feedRate = NaN;
  let feedMoisture = NaN;
  for (let r = headerRow + 2; r < Math.min(rows.length, headerRow + 28); r++) {
    const row = rows[r] || [];
    const name = firstTextCell(row.slice(1, 4), /产品名称|质\s*量|产\s*量|发热量|r％|Ad|Mt|S%/);
    if (!name) continue;
    const yieldValue = numberOrBlank(row[3]);
    const ash = numberOrBlank(row[4]);
    const moisture = numberOrBlank(row[5]);
    const mass = numberOrBlank(row[7]);
    if (name === "原煤") {
      if (Number.isFinite(mass)) feedRate = mass;
      if (Number.isFinite(moisture)) feedMoisture = moisture;
      products.push({
        name,
        yield: Number.isFinite(yieldValue) ? yieldValue : 100,
        ash,
        moisture: Number.isFinite(moisture) ? moisture : 0,
        mass: Number.isFinite(mass) ? mass : NaN,
        heat: numberOrBlank(row[10]),
      });
      break;
    }
    if (name.includes("小计")) continue;
    if (name.includes("设计入洗")) break;
    if (!Number.isFinite(yieldValue) || !Number.isFinite(ash)) continue;
    products.push({
      name,
      yield: yieldValue,
      ash,
      moisture: Number.isFinite(moisture) ? moisture : 0,
      mass: Number.isFinite(mass) ? mass : NaN,
      heat: numberOrBlank(row[10]),
    });
  }
  return {
    products: products.slice(0, 24),
    feedRate: Number.isFinite(feedRate) ? feedRate : NaN,
    feedMoisture,
    sectionTitle,
  };
}

function firstTextCell(cells = [], rejectPattern = null) {
  for (const cell of cells) {
    const text = String(cell ?? "").trim();
    if (!text || /^-?\d+(\.\d+)?%?$/.test(text)) continue;
    if (rejectPattern?.test(text)) continue;
    return text;
  }
  return "";
}

function findBusinessSizeTable(rows, targetSeam = "") {
  const candidates = [];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (String(rows[r][c] ?? "").includes("\u7c92\u7ea7")) {
        const titleRow = rows[Math.max(0, r - 1)] || [];
        const title = String(titleRow[c] || titleRow[c - 1] || "");
        candidates.push({ headerRow: r, startCol: c, title });
      }
    }
  }
  if (!candidates.length) return { seam: "", rows: [], summary: {} };
  const selected = candidates.find((item) => targetSeam && item.title.includes(targetSeam)) || candidates[0];
  const headerRow = selected.headerRow;
  const startCol = selected.startCol;
  const seam = (selected.title || targetSeam).replace(/\u81ea\u7136\u7ea7.*$/, "").trim();
  const result = [];
  const summary = {};
  for (let r = headerRow + 1; r < rows.length; r++) {
    const size = String(rows[r][startCol] ?? "").trim();
    if (!size) continue;
    if (size.includes("\u5408\u8ba1") || size.includes("\u603b\u8ba1")) {
      summary.ash = numberOrBlank(rows[r][startCol + 2]);
      summary.moisture = numberOrBlank(rows[r][startCol + 3]);
      break;
    }
    const yieldValue = numberOrBlank(rows[r][startCol + 1]);
    const ash = numberOrBlank(rows[r][startCol + 2]);
    const moisture = numberOrBlank(rows[r][startCol + 3]);
    if (Number.isFinite(yieldValue) && Number.isFinite(ash)) {
      result.push({
        size,
        yield: yieldValue,
        ash,
        moisture: Number.isFinite(moisture) ? moisture : 0,
      });
    }
  }
  return { seam, rows: result, summary };
}

function coalSeamFromText(text) {
  if (/4-2/.test(text)) return "4-2";
  if (/2-3/.test(text)) return "2-3";
  return "";
}

function numberOrBlank(value) {
  const text = String(value ?? "").replace(/%/g, "").trim();
  if (!text) return NaN;
  const n = Number(text);
  return Number.isFinite(n) ? n : NaN;
}

async function parseImportTemplate(textOrBuffer, filename = "") {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".xlsx")) return parseXlsxWorkbook(textOrBuffer, filename);
  const text = String(textOrBuffer || "");
  if (lower.endsWith(".csv")) return parseSectionedCsv(text);
  if (lower.endsWith(".xls") || /^\s*<!doctype html/i.test(text) || /<table[\s>]/i.test(text)) return parseExcelHtml(text);
  return JSON.parse(text);
}

async function importTemplateText(textOrBuffer, filename) {
  setImportProgress(45, "正在解析表格结构...");
  await nextFrame();
  const data = await parseImportTemplate(textOrBuffer, filename);
  setImportProgress(70, "正在校验煤质与流程数据...");
  await nextFrame();
  const scenario = normalizeImportedScenario(data);
  setImportProgress(85, "正在生成测试方案并计算...");
  await nextFrame();
  saveActiveScenario();
  scenarios.push(scenario);
  activeScenarioId = scenario.id;
  applyScenario(scenario);
  persistScenarios();
  renderAll();
  setImportProgress(100, "导入完成。");
  await nextFrame();
}

function importTemplateFileChange(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  setImportProgress(8, "准备读取文件...");
  const reader = new FileReader();
  reader.addEventListener("progress", (loadEvent) => {
    if (!loadEvent.lengthComputable) return;
    const percent = 8 + (loadEvent.loaded / loadEvent.total) * 32;
    setImportProgress(percent, `正在读取文件 ${fmt(percent, 0)}%...`);
  });
  reader.addEventListener("load", async () => {
    try {
      setImportProgress(40, "文件读取完成，开始解析...");
      await nextFrame();
      await importTemplateText(reader.result || "", file.name);
      setTimeout(() => hideImportProgress(), 500);
    } catch (error) {
      hideImportProgress();
      alert(`导入失败：${error.message}`);
    }
  });
  reader.addEventListener("error", () => {
    hideImportProgress();
    alert("导入失败：无法读取文件。");
  });
  if (file.name.toLowerCase().endsWith(".xlsx")) reader.readAsArrayBuffer(file);
  else reader.readAsText(file, "utf-8");
}

function saveActiveScenario() {
  if (!activeScenarioId) return;
  const index = scenarios.findIndex((item) => item.id === activeScenarioId);
  const currentName = scenarios[index]?.name || `测试方案 ${scenarios.length + 1}`;
  const next = makeScenario(currentName);
  next.id = activeScenarioId;
  if (index >= 0) scenarios[index] = next;
  else scenarios.push(next);
  persistScenarios();
}

function touchActiveScenario() {
  if (!activeScenarioId) return;
  const index = scenarios.findIndex((item) => item.id === activeScenarioId);
  if (index < 0) return;
  const name = scenarios[index].name;
  const id = scenarios[index].id;
  const next = makeScenario(name);
  next.id = id;
  scenarios[index] = next;
  persistScenarios();
}

function newScenario() {
  saveActiveScenario();
  resetFlowStateOnly();
  const scenario = makeScenario(`测试方案 ${scenarios.length + 1}`);
  scenarios.push(scenario);
  activeScenarioId = scenario.id;
  persistScenarios();
  renderAll();
}

function deleteActiveScenario() {
  if (scenarios.length <= 1) {
    resetFlowStateOnly();
    scenarios = [makeScenario("测试方案 1")];
    activeScenarioId = scenarios[0].id;
  } else {
    scenarios = scenarios.filter((item) => item.id !== activeScenarioId);
    activeScenarioId = scenarios[0].id;
    applyScenario(scenarios[0]);
  }
  persistScenarios();
  renderAll();
}

function createDemoScenarios() {
  saveActiveScenario();
  const demos = [
    {
      name: "样例A 低灰高产",
      feed: { rate: 850, ash: 23.5, moisture: 8.8, fineRatio: 13 },
      params: { dmc: { density: 1.45, cleanYield: 72 }, shallow: { density: 1.56, cleanYield: 76 }, spiral: { cleanYield: 62, separation: 80 } },
    },
    {
      name: "样例B 高灰原煤",
      feed: { rate: 900, ash: 35.2, moisture: 10.5, fineRatio: 18 },
      params: { dmc: { density: 1.38, cleanYield: 62 }, shallow: { density: 1.48, cleanYield: 66 }, spiral: { cleanYield: 52, separation: 74 } },
    },
    {
      name: "样例C 细煤泥偏高",
      feed: { rate: 780, ash: 29.5, moisture: 12.2, fineRatio: 28 },
      params: { screen: { efficiency: 88 }, deslime: { efficiency: 82 }, slimeCyclone: { overflowRatio: 55 }, thickener: { flocculant: 36, recovery: 98 }, filter: { cakeMoisture: 27 } },
    },
    {
      name: "样例D 提质低密度",
      feed: { rate: 820, ash: 30.8, moisture: 9.4, fineRatio: 15 },
      params: { dmc: { density: 1.34, cleanYield: 56 }, shallow: { density: 1.44, cleanYield: 61 }, spiral: { cleanYield: 50, separation: 82 }, centrifuge: { solidRecovery: 98 } },
    },
  ];
  const generated = demos.map((demo) => {
    resetFlowStateOnly();
    setFeed(demo.feed);
    Object.entries(demo.params).forEach(([type, params]) => {
      nodes.filter((item) => item.type === type).forEach((item) => Object.assign(item.params, params));
    });
    return makeScenario(demo.name);
  });
  scenarios = [...scenarios.filter((item) => !item.name.startsWith("样例")), ...generated];
  activeScenarioId = generated[0].id;
  applyScenario(generated[0]);
  persistScenarios();
  renderAll();
}

function loadScenario(id) {
  saveActiveScenario();
  const scenario = scenarios.find((item) => item.id === id);
  if (!scenario) return;
  activeScenarioId = id;
  applyScenario(scenario);
  renderScenarioSelect();
  renderAll();
}

function applyScenario(scenario) {
  setFeed(scenario.feed || { rate: 850, ash: 28.5, moisture: 9.5, fineRatio: 16 });
  coalQuality = scenario.coalQuality || null;
  excelResults = null;
  nodes = (scenario.nodes || []).map(cloneNode);
  if (scenario.layoutDirection !== "top-down" || scenario.layoutVersion !== LAYOUT_VERSION) applyTopDownLayout(nodes);
  links = (scenario.links || []).map((item) => ({ ...item }));
  selectedId = scenario.selectedId || null;
}

document.getElementById("runBtn").addEventListener("click", renderAll);
document.getElementById("resetBtn").addEventListener("click", () => {
  resetFlowStateOnly();
  touchActiveScenario();
  renderAll();
});
document.getElementById("exportBtn").addEventListener("click", exportResults);
document.getElementById("flowOverviewBtn").addEventListener("click", openFlowOverview);
document.getElementById("flowOverviewClose").addEventListener("click", closeFlowOverview);
document.querySelectorAll("[data-close-overview]").forEach((el) => {
  el.addEventListener("click", closeFlowOverview);
});
saveScenarioBtn.addEventListener("click", saveActiveScenario);
newScenarioBtn.addEventListener("click", newScenario);
demoScenarioBtn.addEventListener("click", createDemoScenarios);
downloadTemplateBtn.addEventListener("click", downloadImportTemplate);
downloadCsvTemplateBtn.addEventListener("click", downloadCsvImportTemplate);
downloadExcelTemplateBtn.addEventListener("click", downloadExcelImportTemplate);
importTemplateBtn.addEventListener("click", () => importTemplateFile.click());
topDownloadExcelTemplateBtn.addEventListener("click", downloadExcelImportTemplate);
topImportTemplateBtn.addEventListener("click", () => importTemplateFile.click());
importTemplateFile.addEventListener("change", importTemplateFileChange);
deleteScenarioBtn.addEventListener("click", deleteActiveScenario);
scenarioSelect.addEventListener("change", () => loadScenario(scenarioSelect.value));
deleteNodeBtn.addEventListener("click", deleteSelectedNode);
document.addEventListener("keydown", (event) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  const overviewOpen = !document.getElementById("flowOverviewModal").classList.contains("hidden");
  if (overviewOpen && (event.key === "Backspace" || event.key === "Delete")) return;
  if (event.key === "Backspace" || event.key === "Delete") {
    event.preventDefault();
    deleteSelectedNode();
  }
  if (event.key === "Escape") {
    hideContextMenu();
    closeFlowOverview();
  }
});
document.addEventListener("click", (event) => {
  if (!contextMenu.contains(event.target)) hideContextMenu();
});
canvas.addEventListener("dragover", (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
});
canvas.addEventListener("drop", (event) => {
  event.preventDefault();
  const type = event.dataTransfer.getData("text/plain");
  if (equipmentTypes[type]) addNode(type, { x: event.clientX, y: event.clientY });
});
["feedRate", "feedAsh", "feedMoisture", "fineRatio"].forEach((id) => {
  document.getElementById(id).addEventListener("input", () => {
    touchActiveScenario();
    renderAll();
  });
});
let linkRefreshTimer = null;
function scheduleLinkRefresh() {
  clearTimeout(linkRefreshTimer);
  linkRefreshTimer = setTimeout(() => renderLinks(), 60);
}

window.addEventListener("resize", scheduleLinkRefresh);
if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(scheduleLinkRefresh).observe(canvas);
}

renderLibrary();
initScenarios();
