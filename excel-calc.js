/**
 * 选煤厂 Excel 公式引擎（对齐 source_full_scan.xlsx 关键公式）
 *
 * 核心公式：
 * - 分配率 G = NORMSDIST(0.675 * (ρ - δ) / Ep)     【2-3煤预测 186-193 行，G 为走向矸石侧比例】
 * - 精煤占全样 = (1-G) * F172                          【198-205 行：F198 = F172 - F186】
 * - 矸石占全样 = G * F172                              【186-193 行：F186 = G * F172】
 * - 加权灰分 = SUMPRODUCT(产率, 灰分) / SUM(产率)      【E194/E206 等】
 * - 全水分 Mt = Mf + Mad * (100 - Mf) / 100           【预测综合 F34】
 * - 小时入洗 H51 = (J51 * 1e6 / 330) / 16             【预测综合 H51/I51/J51】
 */
const CoalExcelCalc = (() => {
  const DENSITY_ROWS = [
    { label: "<1.30", mid: 1.2 },
    { label: "1.30-1.40", mid: 1.35 },
    { label: "1.40-1.50", mid: 1.45 },
    { label: "1.50-1.60", mid: 1.55 },
    { label: "1.60-1.70", mid: 1.65 },
    { label: "1.70-1.80", mid: 1.75 },
    { label: "1.80-2.00", mid: 1.9 },
    { label: ">2.00", mid: 2.1 },
  ];

  /** 2-3煤预测 170 行块煤分选粒级顺序（对应 134-149 / 331-346 行） */
  const BLOCK170_SIZES = [
    "+150", "150-100", "100-90", "90-60", "60-50", "50-30", "30-25",
    "25-13", "13-10", "10-8", "8-6", "6-3", "3-2", "2-1.5", "1.5-1", "1-0.5",
  ];

  /** 各粒级对应的浮沉密度组（2-3煤预测 119 行 / 2-3自浮表头） */
  const SIZE_DENSE_GROUP = {
    "+150": "+150",
    "150-100": "150-50",
    "100-90": "150-50",
    "90-60": "150-50",
    "60-50": "150-50",
    "50-30": "50-25",
    "30-25": "50-25",
    "25-13": "25-13",
    "13-10": "13-10",
    "10-8": "10-8",
    "8-6": "8-6",
    "6-3": "6-3",
    "3-2": "3-2",
    "2-1.5": "3-2",
    "1.5-1": "1.5-1",
    "1-0.5": "1-0.5",
  };

  const PRODUCT_GROUPS = [
    { name: "300~90mm特大块精煤", sizes: ["+150", "150-100", "100-90"], field: "clean170" },
    { name: "90~60mm六九大块", sizes: ["90-60"], field: "clean170" },
    { name: "60~30mm三六中块", sizes: ["60-50", "50-30"], field: "clean170" },
    { name: "30~10mm一三籽", sizes: ["30-25", "25-13", "13-10"], field: "clean170" },
    { name: "末精煤", sizes: ["10-8", "8-6", "6-3", "3-2", "2-1.5", "1.5-1", "1-0.5"], field: "clean170" },
  ];

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function normsdist(x) {
    const z = Number(x);
    if (!Number.isFinite(z)) return 0;
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }

  /** NORMSDIST(0.675*(ρ-δ)/Ep) — Excel 中 G 为走向矸石侧的比例 */
  function partitionRate(density, cutDensity, ep) {
    const epSafe = Math.max(Math.abs(Number(ep) || 0.03), 0.001);
    return normsdist((0.675 * (Number(density) - Number(cutDensity))) / epSafe);
  }

  function sumProduct(values, weights) {
    let sum = 0;
    const n = Math.min(values.length, weights.length);
    for (let i = 0; i < n; i++) {
      const v = Number(values[i]);
      const w = Number(weights[i]);
      if (Number.isFinite(v) && Number.isFinite(w)) sum += v * w;
    }
    return sum;
  }

  function weightedMean(values, weights) {
    const total = weights.reduce((s, w) => s + (Number.isFinite(Number(w)) ? Number(w) : 0), 0);
    if (total <= 0) return NaN;
    return sumProduct(values, weights) / total;
  }

  function excelMoistureTotal(mad, externalMf) {
    const m = Number(mad) || 0;
    const f = Number(externalMf) || 0;
    return f + m * (100 - f) / 100;
  }

  function excelFeedRateTph(annualMt = 4, daysPerYear = 330) {
    const i51 = (Number(annualMt) * 1e6) / daysPerYear;
    return i51 / 16;
  }

  function normalizeSizeLabel(text) {
    return String(text ?? "")
      .replace(/[＋]/g, "+")
      .replace(/[－–—]/g, "-")
      .replace(/\s+/g, "")
      .replace(/mm/gi, "")
      .replace(/\/.*$/, "");
  }

  function normalizeGroupLabel(text) {
    const raw = normalizeSizeLabel(text).replace(/^\+?150$/, "+150");
    if (/^150-50/.test(raw) || raw === "150-100") return "150-50";
    if (/^50-25/.test(raw) || raw === "50-30") return "50-25";
    if (/^25-13/.test(raw)) return "25-13";
    if (/^13-10/.test(raw)) return "13-10";
    if (/^10-8/.test(raw)) return "10-8";
    if (/^8-6/.test(raw)) return "8-6";
    if (/^6-3/.test(raw)) return "6-3";
    if (/^3-2/.test(raw)) return "3-2";
    if (/^2-1/.test(raw) || /^1\.5-1/.test(raw)) return raw.includes("1.5") ? "1.5-1" : "3-2";
    if (/^1-0/.test(raw)) return "1-0.5";
    if (raw.startsWith("+150") || raw === "150") return "+150";
    return raw;
  }

  function densityMid(label) {
    const text = String(label ?? "").replace(/[＋+]/g, "+").replace(/[－–—]/g, "-").replace(/,/g, ".").trim();
    const nums = text.match(/\d+(\.\d+)?/g)?.map(Number).filter(Number.isFinite) || [];
    if (text.startsWith("<") && nums.length) return nums[0] - 0.05;
    if ((text.startsWith(">") || text.includes("+")) && nums.length) return nums[0] + 0.05;
    if (text.includes("-") && nums.length >= 2) return (nums[0] + nums[1]) / 2;
    if (nums.length === 1) return nums[0];
    return NaN;
  }

  function densityMatches(a, b) {
    const na = normalizeSizeLabel(a);
    const nb = normalizeSizeLabel(b);
    if (na === nb) return true;
    const ma = densityMid(a);
    const mb = densityMid(b);
    return Number.isFinite(ma) && Number.isFinite(mb) && Math.abs(ma - mb) < 0.06;
  }

  function indexDenseByGroup(denseFractions = []) {
    const map = {};
    denseFractions.forEach((row) => {
      const group = normalizeGroupLabel(row.group || "");
      if (!group) return;
      if (!map[group]) map[group] = [];
      map[group].push(row);
    });
    return map;
  }

  function findDenseRow(groupRows = [], label) {
    return groupRows.find((row) => densityMatches(row.density, label)) || null;
  }

  function epForSize(size, settings = {}, kind = "shallow") {
    const target = normalizeSizeLabel(size);
    const row = settings.sizeEpRows?.find((item) => normalizeSizeLabel(item.size) === target);
    const partitionEpMap = settings.partitionEpBySize || {};
    if (kind === "dmc") {
      return partitionEpMap[target] ?? row?.partitionEp ?? row?.spiralI ?? row?.dmcEp ?? settings.dmcEp ?? 0.03;
    }
    if (kind === "spiral") return row?.spiralI ?? settings.spiralEp ?? 0.03;
    return row?.shallowEp ?? settings.shallowEp ?? 0.02;
  }

  function factorForSize(size, sizeFractions = [], kind = "AF") {
    const target = normalizeSizeLabel(size);
    const row = sizeFractions.find((item) => normalizeSizeLabel(item.size) === target);
    if (!row) return 0;
    if (kind === "AK" && Number.isFinite(Number(row.dmcFactor))) return Number(row.dmcFactor);
    if (kind === "AR" && Number.isFinite(Number(row.arFactor))) return Number(row.arFactor);
    if (kind === "AY" && Number.isFinite(Number(row.fineFactor))) return Number(row.fineFactor);
    if (Number.isFinite(Number(row.processedYield))) return Number(row.processedYield);
    return Number(row.yield) || 0;
  }

  /**
   * 2-3煤预测 172-206 行：对单粒级列做浮沉分配
   * @returns {{ cleanYield, cleanAsh, rejectYield, rejectAsh }}
   */
  function partition172206(denseGroupRows, factor, cutDensity, ep) {
    const factorSafe = Number(factor) || 0;
    if (factorSafe <= 0 || !denseGroupRows?.length) {
      return { cleanYield: 0, cleanAsh: 0, rejectYield: 0, rejectAsh: 0 };
    }

    const gangueYields = [];
    const gangueAshes = [];
    const cleanYields = [];
    const cleanAshes = [];

    DENSITY_ROWS.forEach(({ label, mid }) => {
      const src = findDenseRow(denseGroupRows, label);
      const yieldInClass = Number(src?.yieldInClass ?? src?.weight ?? 0);
      const ash = Number(src?.ash ?? 0);
      const yieldTotal = yieldInClass * factorSafe / 100;
      if (yieldTotal <= 0) return;

      const gangueFrac = partitionRate(mid, cutDensity, ep);
      const gangueYield = gangueFrac * yieldTotal;
      const cleanYield = yieldTotal - gangueYield;

      if (gangueYield > 0) {
        gangueYields.push(gangueYield);
        gangueAshes.push(ash);
      }
      if (cleanYield > 0) {
        cleanYields.push(cleanYield);
        cleanAshes.push(ash);
      }
    });

    const rejectYield = gangueYields.reduce((s, v) => s + v, 0);
    const cleanYield = cleanYields.reduce((s, v) => s + v, 0);
    return {
      cleanYield,
      cleanAsh: weightedMean(cleanAshes, cleanYields) || 0,
      rejectYield,
      rejectAsh: weightedMean(gangueAshes, gangueYields) || 0,
    };
  }

  /** 块煤分选（170-206 行）：全部 16 粒级 */
  function runBlock170(sizeFractions, denseByGroup, settings) {
    const cutDensity = Number(settings.shallowDensity) || 1.7;
    return BLOCK170_SIZES.map((size) => {
      const group = SIZE_DENSE_GROUP[size] || normalizeGroupLabel(size);
      const factor = factorForSize(size, sizeFractions, "AF");
      const ep = epForSize(size, settings, "shallow");
      const part = partition172206(denseByGroup[group] || [], factor, cutDensity, ep);
      return {
        size,
        group,
        factor,
        ep,
        cutDensity,
        block: "170",
        clean170: part.cleanYield,
        clean170Ash: part.cleanAsh,
        reject170: part.rejectYield,
        reject170Ash: part.rejectAsh,
        sizeAsh: sizeFractions.find((row) => normalizeSizeLabel(row.size) === normalizeSizeLabel(size))?.ash ?? 0,
        sizeMad: sizeFractions.find((row) => normalizeSizeLabel(row.size) === normalizeSizeLabel(size))?.moisture ?? 0,
      };
    });
  }

  /** 末矸石/DMC 路径（209-245 行，AK 因子 + 旋流器 Ep）→ Q351 / S351 */
  function runBlock209(sizeFractions, denseByGroup, settings) {
    const cutDensity = Number(settings.dmcDensity) || Number(settings.shallowDensity) || 1.7;
    return BLOCK170_SIZES.map((size) => {
      const group = SIZE_DENSE_GROUP[size] || normalizeGroupLabel(size);
      const factor = factorForSize(size, sizeFractions, "AK");
      const ep = epForSize(size, settings, "dmc");
      const part = partition172206(denseByGroup[group] || [], factor, cutDensity, ep);
      return {
        size,
        reject209: part.rejectYield,
        reject209Ash: part.rejectAsh,
        clean209: part.cleanYield,
        clean209Ash: part.cleanAsh,
      };
    });
  }

  /**
   * 粗煤泥分选块+末（248-284 行，AR 因子）
   * Excel 对 AY 列使用 block209 中 10-8 的 δ/Ep（AG221/AG222 = 1.7/0.03）
   * → AY272 矸石侧(X351)，AY284 精煤侧(V351)
   */
  function runBlock248(sizeFractions, denseByGroup, settings) {
    const cutDensity = Number(settings.dmcDensity) || Number(settings.shallowDensity) || 1.7;
    const epRef = epForSize("10-8", settings, "dmc");
    return BLOCK170_SIZES.map((size) => {
      const group = SIZE_DENSE_GROUP[size] || normalizeGroupLabel(size);
      const factor = factorForSize(size, sizeFractions, "AR");
      const part = partition172206(denseByGroup[group] || [], factor, cutDensity, epRef);
      return {
        size,
        clean248: part.cleanYield,
        clean248Ash: part.cleanAsh,
        reject248: part.rejectYield,
        reject248Ash: part.rejectAsh,
      };
    });
  }

  /** 209 块适用的末煤粒级（10-8 mm 及以下，AK>0） */
  const FINE_DMC_SIZES = ["10-8", "8-6", "6-3", "3-2", "2-1.5", "1.5-1"];
  const FINE_SHALLOW_SIZES = ["10-8", "8-6", "6-3", "3-2", "2-1.5", "1.5-1", "1-0.5"];

  const DENSITY_MID = {
    "<1.30": 1.2, "1.30-1.40": 1.35, "1.40-1.50": 1.45, "1.50-1.60": 1.55,
    "1.60-1.70": 1.65, "1.70-1.80": 1.75, "1.80-2.00": 1.9, ">2.00": 2.1,
  };

  function excelLog10(x) {
    return Math.log10 ? Math.log10(x) : Math.log(x) / Math.LN10;
  }

  /**
   * 0.5-0.25/0.15 mm 超细粒级（248 块 BD 列）
   * BD250 = BB250×AR163/100；BD264 = BB264×BD250（BB264 = NORMSDIST(1.553×LOG10(...)/Ep)）
   * V349=BD284=Σ(BD250-BD264)，X349=BD272=Σ(BD264)
   */
  function runBlock248BD(bbDenseRows, settings) {
    const factor = Number(settings.extraFineFactor) || 0;
    if (factor <= 0 || !bbDenseRows?.length) {
      return { clean248BD: 0, clean248BDAsh: 0, reject248BD: 0, reject248BDAsh: 0 };
    }
    const cutDensity = Number(settings.dmcDensity) || Number(settings.shallowDensity) || 1.7;
    const ep = Number(settings.spiralFineEp) || 0.21;
    let clean248BD = 0;
    let reject248BD = 0;
    let cleanAshW = 0;
    let rejectAshW = 0;
    bbDenseRows.forEach((row) => {
      const mid = Number(row.densityMid) || DENSITY_MID[row.density];
      const yic = Number(row.yieldInClass) || 0;
      const ash = Number(row.ash) || 0;
      if (!mid || yic <= 0 || cutDensity <= 1) return;
      const bd250 = yic * factor / 100;
      const bb264 = normsdist(1.553 * excelLog10((mid - 1) / (cutDensity - 1)) / ep);
      const bd264 = bb264 * bd250;
      const bd276 = bd250 - bd264;
      clean248BD += bd276;
      reject248BD += bd264;
      cleanAshW += bd276 * ash;
      rejectAshW += bd264 * ash;
    });
    return {
      clean248BD,
      clean248BDAsh: clean248BD > 0 ? cleanAshW / clean248BD : 0,
      reject248BD,
      reject248BDAsh: reject248BD > 0 ? rejectAshW / reject248BD : 0,
    };
  }

  function sumField(sizeResults, field, sizes) {
    return sizeResults
      .filter((item) => sizes.includes(item.size))
      .reduce((total, item) => total + (Number(item[field]) || 0), 0);
  }

  function ashField(sizeResults, field, sizes) {
    const rows = sizeResults.filter((item) => sizes.includes(item.size));
    return weightedMean(rows.map((item) => item[`${field}Ash`] || item.clean170Ash || 0), rows.map((item) => item[field] || 0));
  }

  function mergeBlockResults(block170, block209, block248) {
    const map209 = Object.fromEntries(block209.map((row) => [row.size, row]));
    const map248 = Object.fromEntries(block248.map((row) => [row.size, row]));
    return block170.map((row) => ({
      ...row,
      ...(map209[row.size] || {}),
      ...(map248[row.size] || {}),
    }));
  }

  function aggregateProductsFromBlocks(sizeResults, settings, block248BD = {}) {
    const products = [];
    const defaultMad = settings.defaultMad ?? 2.5;

    const push = (name, yieldValue, ash, category, excelRef = "") => {
      if ((Number(yieldValue) || 0) <= 1e-6) return;
      products.push({
        name,
        yield: yieldValue,
        ash: Number.isFinite(ash) ? ash : 0,
        mad: defaultMad,
        category,
        excelRef,
      });
    };

    // 预测综合 D34-D37 ← 2-3煤预测 D358-D361（L331 浅槽精煤）
    push("300~90mm特大块精煤", sumField(sizeResults, "clean170", ["+150", "150-100", "100-90"]),
      ashField(sizeResults, "clean170", ["+150", "150-100", "100-90"]), "clean", "D34");
    push("90~60mm六九大块", sumField(sizeResults, "clean170", ["90-60"]),
      ashField(sizeResults, "clean170", ["90-60"]), "clean", "D35");
    push("60~30mm三六中块", sumField(sizeResults, "clean170", ["60-50", "50-30"]),
      ashField(sizeResults, "clean170", ["60-50", "50-30"]), "clean", "D36");
    push("30~10mm一三籽", sumField(sizeResults, "clean170", ["30-25", "25-13", "13-10"]),
      ashField(sizeResults, "clean170", ["30-25", "25-13", "13-10"]), "clean", "D37");

    // D39/D362 末精煤（浅槽 L340-L346）
    push("末精煤", sumField(sizeResults, "clean170", FINE_SHALLOW_SIZES),
      ashField(sizeResults, "clean170", FINE_SHALLOW_SIZES), "clean", "D39");

    // D40/D363 Q351 重介旋流器末精
    push("重介旋流器末精煤", sumField(sizeResults, "clean209", FINE_DMC_SIZES),
      ashField(sizeResults, "clean209", FINE_DMC_SIZES), "clean", "D363");

    // D41/D364 V351 螺旋精煤 = AY284(1-0.5) + BD284(0.5-0.25/0.15)
    const spiralClean = sumField(sizeResults, "clean248", ["1-0.5"]) + (Number(block248BD.clean248BD) || 0);
    const spiralCleanAsh = weightedMean(
      [
        ashField(sizeResults, "clean248", ["1-0.5"]),
        block248BD.clean248BDAsh || 0,
      ],
      [
        sumField(sizeResults, "clean248", ["1-0.5"]),
        block248BD.clean248BD || 0,
      ],
    );
    push("螺旋精煤", spiralClean, spiralCleanAsh, "clean", "D364");

    // D45/D368 Z351 细煤泥
    const slimeYield = Number(settings.slimeTotalYield) || Number(settings.fineSlimeRatio) || 7;
    const slimeAsh = Number(settings.slimeTotalAsh) || 49;
    push("细煤泥", slimeYield, slimeAsh, "reject", "D45");

    // D46/D369 N351 浅槽矸石
    push("矸石", sumField(sizeResults, "reject170", BLOCK170_SIZES),
      ashField(sizeResults, "reject170", BLOCK170_SIZES), "reject", "D46");

    // D47/D370 S351 重介旋流器矸石
    push("重介旋流器矸石", sumField(sizeResults, "reject209", FINE_DMC_SIZES),
      ashField(sizeResults, "reject209", FINE_DMC_SIZES), "reject", "D370");

    // D48/D371 X351 螺旋矸石
    const spiralReject = sumField(sizeResults, "reject248", ["1-0.5"]) + (Number(block248BD.reject248BD) || 0);
    const spiralRejectAsh = weightedMean(
      [
        ashField(sizeResults, "reject248", ["1-0.5"]),
        block248BD.reject248BDAsh || 0,
      ],
      [
        sumField(sizeResults, "reject248", ["1-0.5"]),
        block248BD.reject248BD || 0,
      ],
    );
    push("螺旋矸石", spiralReject, spiralRejectAsh, "reject", "D371");

    return products;
  }

  /** 兼容旧接口：单组浮沉表分配（G 为矸石侧比例） */
  function partitionDenseTable(denseRows, cutDensity, ep) {
    let cleanYield = 0;
    let cleanAshW = 0;
    let rejectYield = 0;
    let rejectAshW = 0;
    denseRows.forEach((row) => {
      const rho = densityMid(row.density);
      const y = Number(row.yieldTotal ?? row.yieldInClass);
      const ash = Number(row.ash);
      if (!Number.isFinite(rho) || !Number.isFinite(y) || y <= 0) return;
      const gangueFrac = partitionRate(rho, cutDensity, ep);
      const reject = gangueFrac * y;
      const clean = y - reject;
      cleanYield += clean;
      cleanAshW += clean * ash;
      rejectYield += reject;
      rejectAshW += reject * ash;
    });
    return {
      cleanYield,
      cleanAsh: cleanYield > 0 ? cleanAshW / cleanYield : 0,
      rejectYield,
      rejectAsh: rejectYield > 0 ? rejectAshW / rejectYield : 0,
      cleanFraction: cleanYield / Math.max(cleanYield + rejectYield, 1e-9),
    };
  }

  function enrichProducts(products, feedRate, settings) {
    const externalMf = Number(settings.externalMoisture) || 10;
    return products.map((p) => {
      const mad = Number(p.mad) || Number(settings.defaultMad) || 2.5;
      const moisture = excelMoistureTotal(mad, p.category === "reject" && p.name.includes("煤泥") ? 24 : externalMf);
      const mass = (Number(p.yield) || 0) * feedRate / 100;
      return { ...p, mad, moisture, mass };
    });
  }

  function buildProductComparison(products, productBalance = []) {
    const PREDICT_ROWS = [
      { ref: "D34", names: ["300~90mm特大块精煤", "特大块"] },
      { ref: "D35", names: ["90~60mm六九大块", "六九大块"] },
      { ref: "D36", names: ["60~30mm三六中块", "三六中块"] },
      { ref: "D37", names: ["30~10mm一三籽", "一三籽"] },
      { ref: "D39", names: ["末精煤"] },
      { ref: "D363", names: ["重介旋流器末精煤", "重介旋流器末精", "末精"] },
      { ref: "D364", names: ["螺旋精煤"] },
      { ref: "D45", names: ["细煤泥"] },
      { ref: "D46", names: ["矸石"] },
      { ref: "D370", names: ["重介旋流器矸石", "重介矸石"] },
      { ref: "D371", names: ["螺旋矸石"] },
    ];
    return PREDICT_ROWS.map(({ ref, names }) => {
      const calc = products.find((item) => item.excelRef === ref || names.some((n) => item.name?.includes(n)));
      const expected = productBalance.find((item) => names.some((n) => item.name?.includes(n)));
      const calcYield = Number(calc?.yield) || 0;
      const expYield = Number(expected?.yield) || 0;
      const calcAsh = Number(calc?.ash) || 0;
      const expAsh = Number(expected?.ash) || 0;
      return {
        ref,
        name: calc?.name || expected?.name || names[0],
        calcYield,
        expYield,
        yieldDelta: calcYield - expYield,
        calcAsh,
        expAsh,
        ashDelta: calcAsh - expAsh,
        ok: Math.abs(calcYield - expYield) < 0.1 && Math.abs(calcAsh - expAsh) < 1.5,
      };
    }).filter((row) => row.calcYield > 0 || row.expYield > 0);
  }

  function computeFromWashability(coalQuality, feed) {
    const settings = coalQuality.processSettings || {};
    const sizeRows = coalQuality.sizeFractions || [];
    const denseRows = coalQuality.denseFractions || [];
    if (!sizeRows.length || !denseRows.length) return null;

    const denseByGroup = indexDenseByGroup(denseRows);
    const block170 = runBlock170(sizeRows, denseByGroup, settings);
    const block209 = runBlock209(sizeRows, denseByGroup, settings);
    const block248 = runBlock248(sizeRows, denseByGroup, settings);
    const block248BD = runBlock248BD(coalQuality.block248BB || [], settings);
    const sizeResults = mergeBlockResults(block170, block209, block248);

    const feedRate = Number(feed?.rate) || excelFeedRateTph(settings.annualCapacity ?? settings.designCapacity ?? 4);
    const products = enrichProducts(
      aggregateProductsFromBlocks(sizeResults, settings, block248BD),
      feedRate,
      settings,
    );
    return finalizeResult(products, feedRate, coalQuality, "block170-248", {
      sizeResults, block170, block209, block248, block248BD,
    });
  }

  function recalculateFromImportedBalance(productBalance, feed, settings, coalQuality) {
    const feedRate = Number(feed?.rate) || excelFeedRateTph(settings?.annualCapacity ?? 4);
    const externalMf = Number(settings?.externalMoisture) || 10;
    const products = productBalance
      .filter((p) => p.name && !/小计|合计/.test(p.name) && p.name !== "原煤")
      .map((p) => {
        const mad = Number(p.mad) || Number(settings?.defaultMad) || 2.5;
        const moisture = Number.isFinite(Number(p.moisture)) && Number(p.moisture) > 0
          ? Number(p.moisture)
          : excelMoistureTotal(mad, externalMf);
        const mass = Number.isFinite(Number(p.mass)) && Number(p.mass) > 0
          ? Number(p.mass)
          : (Number(p.yield) || 0) * feedRate / 100;
        return {
          ...p,
          mad,
          moisture,
          mass,
          category: /矸|煤泥|尾/.test(p.name) ? "reject" : "clean",
        };
      });
    return finalizeResult(products, feedRate, coalQuality, "imported-balance-formula");
  }

  function finalizeResult(products, feedRate, coalQuality, mode, extra = {}) {
    const cleanItems = products.filter((p) => p.category === "clean" || /精煤|块|籽/.test(p.name));
    const rejectItems = products.filter((p) => p.category === "reject" || /矸|煤泥|尾/.test(p.name));
    const cleanYield = cleanItems.reduce((s, p) => s + (Number(p.yield) || 0), 0);
    const rejectYield = rejectItems.reduce((s, p) => s + (Number(p.yield) || 0), 0);
    const cleanAsh = weightedMean(cleanItems.map((p) => p.ash), cleanItems.map((p) => p.yield));
    const rejectAsh = weightedMean(rejectItems.map((p) => p.ash), rejectItems.map((p) => p.yield));
    const cleanMass = cleanItems.reduce((s, p) => s + (Number(p.mass) || 0), 0);
    const rejectMass = rejectItems.reduce((s, p) => s + (Number(p.mass) || 0), 0);

    const expected = coalQuality?.expectedResults || null;
    const productComparison = buildProductComparison(products, coalQuality?.productBalance || []);
    const comparison = expected ? {
      feedRateDelta: feedRate - (expected.feedRate || feedRate),
      cleanYieldDelta: cleanYield - (expected.cleanYield || 0),
      cleanAshDelta: cleanAsh - (expected.cleanAsh || 0),
      rejectYieldDelta: rejectYield - (expected.rejectYield || 0),
      productComparison,
      matchedProducts: productComparison.filter((row) => row.ok).length,
      totalProducts: productComparison.length,
    } : { productComparison };

    return {
      mode,
      feedRate,
      products,
      cleanYield,
      cleanAsh,
      rejectYield,
      rejectAsh,
      cleanMass,
      rejectMass,
      comparison,
      expected,
      productComparison,
      ...extra,
    };
  }

  function run(coalQuality, feed) {
    if (!coalQuality) return null;
    const settings = coalQuality.processSettings || {};
    let fromWash = null;
    if (coalQuality.denseFractions?.length && coalQuality.sizeFractions?.length) {
      fromWash = computeFromWashability(coalQuality, feed);
    }
    if (coalQuality.productBalance?.length) {
      const fromBalance = recalculateFromImportedBalance(coalQuality.productBalance, feed, settings, coalQuality);
      if (fromWash) {
        fromBalance.recalculated = fromWash;
        fromBalance.recalculatedComparison = buildProductComparison(fromWash.products, coalQuality.productBalance);
      }
      return fromBalance;
    }
    if (fromWash) return fromWash;
    return null;
  }

  return {
    run,
    normsdist,
    partitionRate,
    partition172206,
    partitionDenseTable,
    runBlock170,
    runBlock209,
    runBlock248,
    runBlock248BD,
    excelLog10,
    excelMoistureTotal,
    excelFeedRateTph,
    sumProduct,
    weightedMean,
    BLOCK170_SIZES,
    SIZE_DENSE_GROUP,
  };
})();
