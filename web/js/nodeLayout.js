/**
 * ComfyUI-MechaBaby-NodeLayout
 * 节点布局辅助 - 在界面上帮助排列和对齐节点
 * 不直接修改工作流，仅辅助前端界面操作
 */

import { app } from "../../../scripts/app.js";

const STORAGE_KEY = "mechababy.nodeLayout.shortcut";
const DEFAULT_SHORTCUT = "F8";
const STORAGE_KEY_EXPAND = "mechababy.nodeLayout.expandShortcut";
const DEFAULT_SHORTCUT_EXPAND = "F9";
const LAYOUT_ICON = "▣"; // 布局图标

const MARGIN = 50;
const MIN_NODE_WIDTH = 200;
const MIN_NODE_HEIGHT = 80;
const ABS_MIN_WIDTH = 40;
const ABS_MIN_HEIGHT = 30;

function getTargetNodes(graph) {
    const selected = Object.values(app.canvas?.selected_nodes || {});
    if (selected.length > 0) return selected;
    return graph._nodes || [];
}

function ensureNodeSize(node) {
    if (!node.size || node.size[0] < 10 || node.size[1] < 10) {
        node.size = node.size || [MIN_NODE_WIDTH, MIN_NODE_HEIGHT];
        node.size[0] = Math.max(node.size[0] || MIN_NODE_WIDTH, MIN_NODE_WIDTH);
        node.size[1] = Math.max(node.size[1] || MIN_NODE_HEIGHT, MIN_NODE_HEIGHT);
    }
}

function redrawCanvas() {
    if (app.canvas) app.canvas.setDirty(true, true);
}

/** 收缩节点：隐藏节点内容，仅显示标题栏 */
function collapseNodes(graph, nodes) {
    if (!nodes || nodes.length === 0) return;
    nodes.forEach(node => {
        if (!node) return;
        node.flags = node.flags || {};
        node.flags.collapsed = true;
        if (typeof node.setDirtyRect === "function") node.setDirtyRect();
    });
    redrawCanvas();
}

/** 展开节点：显示节点完整内容 */
function expandNodes(graph, nodes) {
    if (!nodes || nodes.length === 0) return;
    nodes.forEach(node => {
        if (!node) return;
        node.flags = node.flags || {};
        node.flags.collapsed = false;
        if (typeof node.setDirtyRect === "function") node.setDirtyRect();
    });
    redrawCanvas();
}

// 快捷键配置
function getShortcut() {
    try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s && s.length > 0) return s;
    } catch (_) {}
    return DEFAULT_SHORTCUT;
}

function setShortcut(key) {
    try {
        localStorage.setItem(STORAGE_KEY, key || DEFAULT_SHORTCUT);
    } catch (_) {}
}

function getShortcutExpand() {
    try {
        const s = localStorage.getItem(STORAGE_KEY_EXPAND);
        if (s && s.length > 0) return s;
    } catch (_) {}
    return DEFAULT_SHORTCUT_EXPAND;
}

function setShortcutExpand(key) {
    try {
        localStorage.setItem(STORAGE_KEY_EXPAND, key || DEFAULT_SHORTCUT_EXPAND);
    } catch (_) {}
}

function showShortcutDialog(onSaved) {
    window._mbnlShortcutDialogOpen = true;
    const shortcut = getShortcut();
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:100000;";
    const box = document.createElement("div");
    box.style.cssText = "background:#2a2a2a;padding:20px;border-radius:8px;min-width:320px;box-shadow:0 4px 20px rgba(0,0,0,0.5);";
    box.innerHTML = `
        <div style="color:#e0e0e0;margin-bottom:12px;font-size:14px;">自定义快捷键</div>
        <div style="color:#888;font-size:12px;margin-bottom:8px;">当前: <span id="mbnl-cur-key" style="color:#4a9eff;">${shortcut}</span></div>
        <input type="text" id="mbnl-key-input" readonly placeholder="按下要设置的按键..."
            style="width:100%;box-sizing:border-box;padding:10px;background:#1a1a1a;border:1px solid #444;color:#fff;border-radius:4px;margin-bottom:12px;font-size:14px;">
        <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="mbnl-btn-reset" style="padding:8px 16px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;">恢复默认</button>
            <button id="mbnl-btn-ok" style="padding:8px 16px;background:#4a9eff;color:#fff;border:none;border-radius:4px;cursor:pointer;">确定</button>
            <button id="mbnl-btn-cancel" style="padding:8px 16px;background:#555;color:#fff;border:none;border-radius:4px;cursor:pointer;">取消</button>
        </div>
    `;
    wrap.appendChild(box);
    document.body.appendChild(wrap);

    const input = box.querySelector("#mbnl-key-input");
    const curSpan = box.querySelector("#mbnl-cur-key");

    const close = () => {
        window._mbnlShortcutDialogOpen = false;
        document.body.removeChild(wrap);
        document.removeEventListener("keydown", keyHandler, true);
    };

    let captured = null;
    const keyHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "Escape") {
            close();
            return;
        }
        const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
        if (e.altKey) parts.push("Alt");
        if (e.shiftKey) parts.push("Shift");
        parts.push(k);
        captured = parts.join("+");
        input.value = captured;
    };

    document.addEventListener("keydown", keyHandler, true);
    setTimeout(() => input.focus(), 100);

    box.querySelector("#mbnl-btn-reset").onclick = () => {
        captured = DEFAULT_SHORTCUT;
        setShortcut(DEFAULT_SHORTCUT);
        curSpan.textContent = DEFAULT_SHORTCUT;
        input.value = DEFAULT_SHORTCUT;
        if (typeof onSaved === "function") onSaved();
    };
    box.querySelector("#mbnl-btn-ok").onclick = () => {
        if (captured) {
            setShortcut(captured);
            curSpan.textContent = captured;
            if (typeof onSaved === "function") onSaved();
        }
        close();
    };
    box.querySelector("#mbnl-btn-cancel").onclick = close;
}

function showShortcutDialogExpand(onSaved) {
    window._mbnlExpandShortcutDialogOpen = true;
    const shortcut = getShortcutExpand();
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:100000;";
    const box = document.createElement("div");
    box.style.cssText = "background:#2a2a2a;padding:20px;border-radius:8px;min-width:320px;box-shadow:0 4px 20px rgba(0,0,0,0.5);";
    box.innerHTML = `
        <div style="color:#e0e0e0;margin-bottom:12px;font-size:14px;">自定义展开/收缩菜单快捷键</div>
        <div style="color:#888;font-size:12px;margin-bottom:8px;">当前: <span id="mbnl-expand-cur-key" style="color:#4a9eff;">${shortcut}</span></div>
        <input type="text" id="mbnl-expand-key-input" readonly placeholder="按下要设置的按键..."
            style="width:100%;box-sizing:border-box;padding:10px;background:#1a1a1a;border:1px solid #444;color:#fff;border-radius:4px;margin-bottom:12px;font-size:14px;">
        <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="mbnl-expand-btn-reset" style="padding:8px 16px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;">恢复默认</button>
            <button id="mbnl-expand-btn-ok" style="padding:8px 16px;background:#4a9eff;color:#fff;border:none;border-radius:4px;cursor:pointer;">确定</button>
            <button id="mbnl-expand-btn-cancel" style="padding:8px 16px;background:#555;color:#fff;border:none;border-radius:4px;cursor:pointer;">取消</button>
        </div>
    `;
    wrap.appendChild(box);
    document.body.appendChild(wrap);

    const input = box.querySelector("#mbnl-expand-key-input");
    const curSpan = box.querySelector("#mbnl-expand-cur-key");

    const close = () => {
        window._mbnlExpandShortcutDialogOpen = false;
        document.body.removeChild(wrap);
        document.removeEventListener("keydown", keyHandler, true);
    };

    let captured = null;
    const keyHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "Escape") {
            close();
            return;
        }
        const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
        if (e.altKey) parts.push("Alt");
        if (e.shiftKey) parts.push("Shift");
        parts.push(k);
        captured = parts.join("+");
        input.value = captured;
    };

    document.addEventListener("keydown", keyHandler, true);
    setTimeout(() => input.focus(), 100);

    box.querySelector("#mbnl-expand-btn-reset").onclick = () => {
        captured = DEFAULT_SHORTCUT_EXPAND;
        setShortcutExpand(DEFAULT_SHORTCUT_EXPAND);
        curSpan.textContent = DEFAULT_SHORTCUT_EXPAND;
        input.value = DEFAULT_SHORTCUT_EXPAND;
        if (typeof onSaved === "function") onSaved();
    };
    box.querySelector("#mbnl-expand-btn-ok").onclick = () => {
        if (captured) {
            setShortcutExpand(captured);
            curSpan.textContent = captured;
            if (typeof onSaved === "function") onSaved();
        }
        close();
    };
    box.querySelector("#mbnl-expand-btn-cancel").onclick = close;
}

/** 显示排列方式选择菜单（F8 快捷键触发）- 使用自定义 DOM 菜单确保兼容性 */
function showArrangementMenu() {
    if (document.getElementById("mbnl-arrangement-menu")) return;
    const graph = app?.graph;
    if (!graph) return;

    const opts = [
        { content: "按类型分组", callback: () => arrangeByType(graph) },
        { content: "按执行顺序", callback: () => arrangeByExecutionOrder(graph) },
        { content: "蜘蛛网排列（选中/最后节点为中心）", callback: () => arrangeSpiderWeb(graph) },
        { content: "层级列排列（选中/最后节点为中心）", callback: () => arrangeLevelColumns(graph) },
        { content: "网格排列", callback: () => arrangeGrid(graph) },
        { content: "内置排列 (左)", callback: () => { if (graph.arrange) graph.arrange(); redrawCanvas(); } },
    ];

    // 移除可能已存在的旧菜单
    const old = document.getElementById("mbnl-arrangement-menu");
    if (old) old.remove();

    const menu = document.createElement("div");
    menu.id = "mbnl-arrangement-menu";
    menu.style.cssText = "position:fixed;z-index:100001;background:#2a2a2a;border:1px solid #444;border-radius:6px;box-shadow:0 4px 20px rgba(0,0,0,0.5);min-width:220px;padding:4px 0;font-size:13px;";
    const rect = app.canvas?.canvas?.getBoundingClientRect?.();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    menu.style.left = (cx - 110) + "px";
    menu.style.top = (cy - 80) + "px";

    opts.forEach((item) => {
        const el = document.createElement("div");
        el.style.cssText = "padding:8px 16px;cursor:pointer;color:#e0e0e0;white-space:nowrap;";
        el.textContent = item.content;
        el.onmouseenter = () => { el.style.background = "#3a3a3a"; };
        el.onmouseleave = () => { el.style.background = ""; };
        el.onclick = (e) => {
            e.stopPropagation();
            item.callback();
            menu.remove();
        };
        menu.appendChild(el);
    });

    const close = () => menu.remove();
    menu.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", close, { once: true });
    document.addEventListener("contextmenu", close, { once: true });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); }, { once: true });
    document.body.appendChild(menu);
}

/** 显示展开/收缩菜单（F9 快捷键触发）*/
function showExpandCollapseMenu() {
    if (document.getElementById("mbnl-expand-menu")) return;
    const graph = app?.graph;
    if (!graph) return;

    const nodes = graph._nodes || [];
    const targetNodes = getTargetNodes(graph);

    const opts = [
        { content: "收缩选中节点", callback: () => { if (targetNodes.length >= 1) collapseNodes(graph, targetNodes); } },
        { content: "展开选中节点", callback: () => { if (targetNodes.length >= 1) expandNodes(graph, targetNodes); } },
        { content: "收缩全部节点", callback: () => collapseNodes(graph, nodes) },
        { content: "展开全部节点", callback: () => expandNodes(graph, nodes) },
    ];

    const old = document.getElementById("mbnl-expand-menu");
    if (old) old.remove();

    const menu = document.createElement("div");
    menu.id = "mbnl-expand-menu";
    menu.style.cssText = "position:fixed;z-index:100001;background:#2a2a2a;border:1px solid #444;border-radius:6px;box-shadow:0 4px 20px rgba(0,0,0,0.5);min-width:220px;padding:4px 0;font-size:13px;";
    const rect = app.canvas?.canvas?.getBoundingClientRect?.();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    menu.style.left = (cx - 110) + "px";
    menu.style.top = (cy - 100) + "px";

    opts.forEach((item) => {
        if (!item) {
            const sep = document.createElement("div");
            sep.style.cssText = "height:1px;background:#444;margin:4px 0;";
            menu.appendChild(sep);
            return;
        }
        const el = document.createElement("div");
        el.style.cssText = "padding:8px 16px;cursor:pointer;color:#e0e0e0;white-space:nowrap;";
        el.textContent = item.content;
        el.onmouseenter = () => { el.style.background = "#3a3a3a"; };
        el.onmouseleave = () => { el.style.background = ""; };
        el.onclick = (e) => {
            e.stopPropagation();
            item.callback();
            menu.remove();
        };
        menu.appendChild(el);
    });

    const close = () => menu.remove();
    menu.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", close, { once: true });
    document.addEventListener("contextmenu", close, { once: true });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); }, { once: true });
    document.body.appendChild(menu);
}

/**
 * 获取节点的最小尺寸（由 computeSize 计算，基于节点 inputs/outputs/widgets）
 * 返回 [width, height]，确保节点上所有属性可完全显示
 */
function getNodeMinSize(node) {
    let sz = null;
    try {
        if (typeof node.computeSize === "function") {
            // 部分节点接受当前 size 作为参数（如 width 影响 widget 换行后的 height）
            const curSize = node.size || [MIN_NODE_WIDTH, MIN_NODE_HEIGHT];
            const arg = curSize[0] != null && curSize[1] != null ? [curSize[0], curSize[1]] : undefined;
            sz = arg ? node.computeSize(arg) : node.computeSize();
        }
    } catch (e) {
        /* ignore */
    }
    if (!sz || (Array.isArray(sz) && sz.length < 2)) {
        // 无 computeSize 时按 inputs/outputs/widgets 估算
        const slotH = (typeof LiteGraph !== "undefined" && LiteGraph.NODE_SLOT_HEIGHT) || 24;
        const widgetH = (typeof LiteGraph !== "undefined" && LiteGraph.NODE_WIDGET_HEIGHT) || 20;
        const inputRows = Math.max(node.inputs?.length || 0, node.outputs?.length || 0);
        let h = slotH * inputRows + 20;
        (node.widgets || []).forEach(w => {
            if (w?.computeSize && typeof w.computeSize === "function") {
                try {
                    const ws = w.computeSize(node.size?.[0] || MIN_NODE_WIDTH);
                    h += (Array.isArray(ws) ? ws[1] : ws?.height || widgetH) + 4;
                } catch (_) {
                    h += widgetH + 4;
                }
            } else {
                h += widgetH + 4;
            }
        });
        sz = [Math.max(ABS_MIN_WIDTH, node.size?.[0] || MIN_NODE_WIDTH), Math.max(ABS_MIN_HEIGHT, h)];
    }
    const w = Array.isArray(sz) ? Number(sz[0]) : Number(sz?.width ?? sz?.[0]);
    const h = Array.isArray(sz) ? Number(sz[1]) : Number(sz?.height ?? sz?.[1]);
    return [
        Math.max(ABS_MIN_WIDTH, w || ABS_MIN_WIDTH),
        Math.max(ABS_MIN_HEIGHT, h || ABS_MIN_HEIGHT),
    ];
}

/** 缩小到最小高度（保持宽度，高度由节点内容决定） */
function shrinkToMinHeight(graph) {
    const nodes = getTargetNodes(graph);
    nodes.forEach(node => {
        const [minW, minH] = getNodeMinSize(node);
        const newH = minH;
        const curW = node.size?.[0] ?? minW;
        if (node.setSize) node.setSize([curW, newH]);
        else {
            node.size = node.size || [curW, newH];
            node.size[1] = newH;
        }
    });
    redrawCanvas();
}

/** 缩小到最小宽度（保持高度，宽度由节点内容决定） */
function shrinkToMinWidth(graph) {
    const nodes = getTargetNodes(graph);
    nodes.forEach(node => {
        const [minW] = getNodeMinSize(node);
        const curH = node.size?.[1] ?? MIN_NODE_HEIGHT;
        if (node.setSize) node.setSize([minW, curH]);
        else {
            node.size = node.size || [minW, curH];
            node.size[0] = minW;
        }
    });
    redrawCanvas();
}

/** 缩小到最小尺寸（宽高均由节点内容决定，确保属性完全显示） */
function shrinkToMinSize(graph) {
    const nodes = getTargetNodes(graph);
    nodes.forEach(node => {
        const [minW, minH] = getNodeMinSize(node);
        if (node.setSize) node.setSize([minW, minH]);
        else {
            node.size = [minW, minH];
        }
    });
    redrawCanvas();
}

// 按节点类型分组排列
function arrangeByType(graph) {
    const nodes = getTargetNodes(graph);
    if (nodes.length === 0) return;

    const byType = {};
    nodes.forEach(node => {
        const type = node.type || "Unknown";
        if (!byType[type]) byType[type] = [];
        byType[type].push(node);
    });

    const types = Object.keys(byType).sort();
    let x = MARGIN;

    types.forEach(type => {
        const group = byType[type];
        group.sort((a, b) => (a.pos?.[1] ?? 0) - (b.pos?.[1] ?? 0));
        let y = MARGIN;

        let maxWidth = 0;
        group.forEach(node => {
            ensureNodeSize(node);
            maxWidth = Math.max(maxWidth, node.size[0]);
        });

        group.forEach(node => {
            node.pos[0] = x;
            node.pos[1] = y;
            y += node.size[1] + MARGIN;
        });

        // 同组内右对齐
        group.forEach(node => {
            node.pos[0] = x + maxWidth - node.size[0];
        });

        x += maxWidth + MARGIN;
    });

    redrawCanvas();
}

// 按执行顺序排列（从左到右）
function arrangeByExecutionOrder(graph) {
    let nodes;
    try {
        nodes = graph.computeExecutionOrder ? graph.computeExecutionOrder(false, true) : graph._nodes || [];
    } catch (e) {
        nodes = graph._nodes || [];
    }

    const targetIds = new Set(getTargetNodes(graph).map(n => n.id));
    nodes = nodes.filter(n => targetIds.has(n.id));
    if (nodes.length === 0) return;

    const columns = {};
    nodes.forEach(node => {
        const level = node._level ?? 0;
        if (!columns[level]) columns[level] = [];
        columns[level].push(node);
    });

    const levels = Object.keys(columns).map(Number).sort((a, b) => a - b);
    let x = MARGIN;

    levels.forEach(level => {
        const column = columns[level];
        column.sort((a, b) => {
            const as = !(a.type === "SaveImage" || a.type === "PreviewImage");
            const bs = !(b.type === "SaveImage" || b.type === "PreviewImage");
            if (as !== bs) return as - bs;
            if ((a.inputs?.length || 0) !== (b.inputs?.length || 0)) return (a.inputs?.length || 0) - (b.inputs?.length || 0);
            return (a.outputs?.length || 0) - (b.outputs?.length || 0);
        });

        let maxWidth = 100;
        let y = MARGIN;

        column.forEach(node => {
            ensureNodeSize(node);
            maxWidth = Math.max(maxWidth, node.size[0]);
        });

        column.forEach((node, j) => {
            node.pos[0] = x;
            node.pos[1] = y;
            y += node.size[1] + MARGIN + LiteGraph.NODE_TITLE_HEIGHT;
        });

        column.forEach(node => {
            node.pos[0] += maxWidth - node.size[0];
        });

        x += maxWidth + MARGIN;
    });

    redrawCanvas();
}

/** 蜘蛛网/脑图排列：以选中节点为中心，递归向左右展开，每个分支独立垂直排列（上次修改前逻辑） */
function arrangeSpiderWeb(graph) {
    const nodes = graph._nodes || [];
    if (nodes.length === 0) return;

    const selected = Object.values(app.canvas?.selected_nodes || {});
    let center = selected.length === 1 ? selected[0] : null;
    if (!center) {
        const outputs = nodes.filter(n => (n.constructor?.nodeData?.output_node || n.type === "SaveImage" || n.type === "PreviewImage"));
        center = outputs.length > 0 ? outputs[outputs.length - 1] : nodes[nodes.length - 1];
    }

    const links = graph.links || {};
    const nodeById = (id) => nodes.find(n => String(n.id) === String(id));
    nodes.forEach(n => ensureNodeSize(n));

    const getInputNodesOrdered = (node) => {
        const result = [];
        const seen = new Set();
        (node.inputs || []).forEach((inp, idx) => {
            const linkId = typeof inp === "object" ? inp?.link : null;
            if (linkId != null && links[linkId]) {
                const src = nodeById(links[linkId].origin_id);
                if (src && !seen.has(src.id)) {
                    seen.add(src.id);
                    result.push({ node: src, slotIndex: idx });
                }
            }
        });
        return result.sort((a, b) => a.slotIndex - b.slotIndex).map(x => x.node);
    };

    const getOutputNodesOrdered = (node) => {
        const seen = new Set();
        const result = [];
        (node.outputs || []).forEach((out, idx) => {
            const linkIds = typeof out === "object" ? out?.links || [] : [];
            linkIds.forEach(linkId => {
                if (links[linkId] && !seen.has(links[linkId].target_id)) {
                    seen.add(links[linkId].target_id);
                    const tgt = nodeById(links[linkId].target_id);
                    if (tgt) result.push({ node: tgt, slotIndex: idx });
                }
            });
        });
        return result.sort((a, b) => a.slotIndex - b.slotIndex).map(x => x.node);
    };

    const maxNodeW = Math.max(MIN_NODE_WIDTH, ...nodes.map(n => n.size?.[0] || MIN_NODE_WIDTH));
    const H_GAP = maxNodeW + MARGIN;
    const V_GAP = MARGIN + 15;

    const placed = new Set();

    function layoutLeft(node, x, y) {
        if (!node || placed.has(node.id)) return { h: 0, w: 0 };
        placed.add(node.id);
        const w = node.size?.[0] || MIN_NODE_WIDTH;
        const h = node.size?.[1] || MIN_NODE_HEIGHT;
        const children = getInputNodesOrdered(node);

        if (children.length === 0) {
            node.pos[0] = x - w;
            node.pos[1] = y;
            return { h, w };
        }

        let curY = y;
        let maxChildW = 0;
        for (const c of children) {
            const box = layoutLeft(c, x - w - H_GAP, curY);
            maxChildW = Math.max(maxChildW, box.w);
            curY += box.h + V_GAP;
        }
        const totalChildH = curY - y - V_GAP;
        const myY = y + totalChildH / 2 - h / 2;
        node.pos[0] = x - w;
        node.pos[1] = Math.max(y, myY);
        return { h: Math.max(totalChildH, h), w: w + H_GAP + maxChildW };
    }

    function layoutRight(node, x, y) {
        if (!node || placed.has(node.id)) return { h: 0, w: 0 };
        placed.add(node.id);
        const w = node.size?.[0] || MIN_NODE_WIDTH;
        const h = node.size?.[1] || MIN_NODE_HEIGHT;
        const children = getOutputNodesOrdered(node);

        if (children.length === 0) {
            node.pos[0] = x;
            node.pos[1] = y;
            return { h, w };
        }

        let curY = y;
        let maxChildW = 0;
        for (const c of children) {
            const box = layoutRight(c, x + w + H_GAP, curY);
            maxChildW = Math.max(maxChildW, box.w);
            curY += box.h + V_GAP;
        }
        const totalChildH = curY - y - V_GAP;
        const myY = y + totalChildH / 2 - h / 2;
        node.pos[0] = x;
        node.pos[1] = Math.max(y, myY);
        return { h: Math.max(totalChildH, h), w: w + H_GAP + maxChildW };
    }

    const centerW = center.size?.[0] || MIN_NODE_WIDTH;
    const centerH = center.size?.[1] || MIN_NODE_HEIGHT;

    let leftY = 0;
    const leftInputs = getInputNodesOrdered(center);
    for (const c of leftInputs) {
        const box = layoutLeft(c, -H_GAP, leftY);
        leftY += box.h + V_GAP;
    }
    const leftTotalH = leftY > 0 ? leftY - V_GAP : 0;

    let rightY = 0;
    const rightOutputs = getOutputNodesOrdered(center);
    for (const c of rightOutputs) {
        const box = layoutRight(c, centerW + H_GAP, rightY);
        rightY += box.h + V_GAP;
    }
    const rightTotalH = rightY > 0 ? rightY - V_GAP : 0;

    const totalH = Math.max(leftTotalH, centerH, rightTotalH);
    center.pos[0] = 0;
    center.pos[1] = totalH / 2 - centerH / 2;
    placed.add(center.id);

    const allPlaced = [...placed].map(id => nodeById(id)).filter(Boolean);
    const minX = Math.min(...allPlaced.map(n => n.pos[0] ?? 0));
    const minY = Math.min(...allPlaced.map(n => n.pos[1] ?? 0));

    allPlaced.forEach(n => {
        n.pos[0] = (n.pos[0] ?? 0) - minX + MARGIN;
        n.pos[1] = (n.pos[1] ?? 0) - minY + MARGIN;
    });

    redrawCanvas();
}

/** 层级列排列：以选中节点为中心，按层级分列，左侧输入链、右侧输出链，同列节点上下留隙、不重叠 */
function arrangeLevelColumns(graph) {
    const nodes = graph._nodes || [];
    if (nodes.length === 0) return;

    const selected = Object.values(app.canvas?.selected_nodes || {});
    let center = selected.length === 1 ? selected[0] : null;
    if (!center) {
        const outputs = nodes.filter(n => (n.constructor?.nodeData?.output_node || n.type === "SaveImage" || n.type === "PreviewImage"));
        center = outputs.length > 0 ? outputs[outputs.length - 1] : nodes[nodes.length - 1];
    }

    const links = graph.links || {};
    const nodeById = (id) => nodes.find(n => String(n.id) === String(id));
    nodes.forEach(n => ensureNodeSize(n));

    const getInputNodesOrdered = (node) => {
        const result = [];
        const seen = new Set();
        (node.inputs || []).forEach((inp, idx) => {
            const linkId = typeof inp === "object" ? inp?.link : null;
            if (linkId != null && links[linkId]) {
                const srcId = links[linkId].origin_id;
                const src = nodeById(srcId);
                if (src && !seen.has(String(srcId))) {
                    seen.add(String(srcId));
                    result.push({ node: src, slotIndex: idx });
                }
            }
        });
        return result.sort((a, b) => a.slotIndex - b.slotIndex).map(x => x.node);
    };

    const getOutputNodesOrdered = (node) => {
        const seen = new Set();
        const result = [];
        (node.outputs || []).forEach((out, idx) => {
            const linkIds = typeof out === "object" ? out?.links || [] : [];
            linkIds.forEach(linkId => {
                if (links[linkId]) {
                    const tgtId = links[linkId].target_id;
                    if (!seen.has(String(tgtId))) {
                        seen.add(String(tgtId));
                        const tgt = nodeById(tgtId);
                        if (tgt) result.push({ node: tgt, slotIndex: idx });
                    }
                }
            });
        });
        return result.sort((a, b) => a.slotIndex - b.slotIndex).map(x => x.node);
    };

    const H_GAP = 70;
    const V_GAP = 35;

    const leftLevels = new Map();
    const rightLevels = new Map();

    function collectLeftLevels(node, level) {
        if (!node) return;
        const cur = leftLevels.get(String(node.id));
        if (cur != null && cur <= level) return;
        leftLevels.set(String(node.id), level);
        getInputNodesOrdered(node).forEach(c => collectLeftLevels(c, level - 1));
    }
    function collectRightLevels(node, level) {
        if (!node) return;
        const cur = rightLevels.get(String(node.id));
        if (cur != null && cur <= level) return;
        rightLevels.set(String(node.id), level);
        getOutputNodesOrdered(node).forEach(c => collectRightLevels(c, level + 1));
    }
    collectLeftLevels(center, 0);
    collectRightLevels(center, 0);

    const allInvolved = new Set([String(center.id)]);
    leftLevels.forEach((_, id) => allInvolved.add(id));
    rightLevels.forEach((_, id) => allInvolved.add(id));

    const centerW = center.size?.[0] || MIN_NODE_WIDTH;
    const centerH = center.size?.[1] || MIN_NODE_HEIGHT;
    const maxNodeW = Math.max(centerW, ...nodes.filter(n => allInvolved.has(String(n.id))).map(n => n.size?.[0] || MIN_NODE_WIDTH));

    const leftMinLevel = Math.min(...leftLevels.values(), 0);
    const rightMaxLevel = Math.max(...rightLevels.values(), 0);

    center.pos[0] = 0;
    center.pos[1] = 0;

    function getSlotInParentInput(parent, child) {
        const inpNodes = getInputNodesOrdered(parent);
        if (!inpNodes.includes(child)) return 0;
        return inpNodes.indexOf(child);
    }
    function getSlotInParentOutput(parent, child) {
        const outNodes = getOutputNodesOrdered(parent);
        if (!outNodes.includes(child)) return 0;
        return outNodes.indexOf(child);
    }
    function findParentLeft(child) {
        for (const n of nodes) {
            if (getInputNodesOrdered(n).some(x => String(x.id) === String(child.id))) return n;
        }
        return null;
    }
    function findParentRight(child) {
        for (const n of nodes) {
            if (getOutputNodesOrdered(n).some(x => String(x.id) === String(child.id))) return n;
        }
        return null;
    }

    for (let level = leftMinLevel; level < 0; level++) {
        const levelNodesRaw = nodes.filter(n => leftLevels.get(String(n.id)) === level);
        const levelNodes = [...new Map(levelNodesRaw.map(n => [String(n.id), n])).values()];
        levelNodes.sort((a, b) => {
            const pa = level === -1 ? center : findParentLeft(a);
            const pb = level === -1 ? center : findParentLeft(b);
            if (!pa || !pb) return 0;
            if (String(pa.id) !== String(pb.id)) {
                if (level === -1) return 0;
                const paL = leftLevels.get(String(pa.id)), pbL = leftLevels.get(String(pb.id));
                if (paL !== pbL) return paL - pbL;
                const inpOrd = getInputNodesOrdered(center);
                const paIdx = inpOrd.findIndex(x => String(x.id) === String(pa.id));
                const pbIdx = inpOrd.findIndex(x => String(x.id) === String(pb.id));
                if (paIdx >= 0 && pbIdx >= 0 && paIdx !== pbIdx) return paIdx - pbIdx;
                return String(pa.id).localeCompare(String(pb.id));
            }
            return getSlotInParentInput(pa, a) - getSlotInParentInput(pa, b);
        });

        const colRightEdge = level * (maxNodeW + H_GAP);
        let y = 0;
        levelNodes.forEach(n => {
            const w = Math.max(MIN_NODE_WIDTH, n.size?.[0] || MIN_NODE_WIDTH);
            const h = Math.max(MIN_NODE_HEIGHT, n.size?.[1] || MIN_NODE_HEIGHT);
            n.pos[0] = colRightEdge - w;
            n.pos[1] = y;
            y += h + V_GAP;
        });
    }

    for (let level = 1; level <= rightMaxLevel; level++) {
        const levelNodesRaw = nodes.filter(n => rightLevels.get(String(n.id)) === level && !leftLevels.has(String(n.id)));
        const levelNodes = [...new Map(levelNodesRaw.map(n => [String(n.id), n])).values()];
        levelNodes.sort((a, b) => {
            const pa = level === 1 ? center : findParentRight(a);
            const pb = level === 1 ? center : findParentRight(b);
            if (!pa || !pb) return 0;
            if (String(pa.id) !== String(pb.id)) {
                if (level === 1) return 0;
                const outOrd = getOutputNodesOrdered(center);
                const paIdx = outOrd.findIndex(x => String(x.id) === String(pa.id));
                const pbIdx = outOrd.findIndex(x => String(x.id) === String(pb.id));
                if (paIdx >= 0 && pbIdx >= 0 && paIdx !== pbIdx) return paIdx - pbIdx;
                return String(pa.id).localeCompare(String(pb.id));
            }
            return getSlotInParentOutput(pa, a) - getSlotInParentOutput(pa, b);
        });

        const colX = centerW + H_GAP + (level - 1) * (maxNodeW + H_GAP);
        let y = 0;
        levelNodes.forEach(n => {
            const h = Math.max(MIN_NODE_HEIGHT, n.size?.[1] || MIN_NODE_HEIGHT);
            n.pos[0] = colX;
            n.pos[1] = y;
            y += h + V_GAP;
        });
    }

    const totalLeftH = Math.max(0, ...nodes.filter(n => leftLevels.has(String(n.id))).map(n => (n.pos?.[1] ?? 0) + (n.size?.[1] || MIN_NODE_HEIGHT)));
    const totalRightH = Math.max(0, ...nodes.filter(n => rightLevels.has(String(n.id))).map(n => (n.pos?.[1] ?? 0) + (n.size?.[1] || MIN_NODE_HEIGHT)));
    const totalH = Math.max(totalLeftH, centerH, totalRightH);
    center.pos[1] = totalH / 2 - centerH / 2;

    const minX = Math.min(0, ...nodes.filter(n => allInvolved.has(String(n.id))).map(n => n.pos[0] ?? 0));
    const minY = Math.min(0, ...nodes.filter(n => allInvolved.has(String(n.id))).map(n => n.pos[1] ?? 0));

    nodes.filter(n => allInvolved.has(String(n.id))).forEach(n => {
        n.pos[0] = (n.pos[0] ?? 0) - minX + MARGIN;
        n.pos[1] = (n.pos[1] ?? 0) - minY + MARGIN;
    });

    redrawCanvas();
}

// 网格布局 - 等间距排列
function arrangeGrid(graph) {
    const nodes = getTargetNodes(graph);
    if (nodes.length === 0) return;

    nodes.forEach(ensureNodeSize);
    const maxW = Math.max(...nodes.map(n => n.size[0]));
    const maxH = Math.max(...nodes.map(n => n.size[1]));

    const cols = Math.ceil(Math.sqrt(nodes.length));
    let x = MARGIN, y = MARGIN;
    let col = 0;

    nodes.forEach(node => {
        node.pos[0] = x;
        node.pos[1] = y;
        col++;
        if (col >= cols) {
            col = 0;
            x = MARGIN;
            y += maxH + MARGIN;
        } else {
            x += maxW + MARGIN;
        }
    });

    redrawCanvas();
}

// 对齐与分布工具
const alignOps = {
    alignLeft: (nodes) => {
        const minX = Math.min(...nodes.map(n => n.pos[0]));
        nodes.forEach(n => { n.pos[0] = minX; });
    },
    alignRight: (nodes) => {
        const maxX = Math.max(...nodes.map(n => n.pos[0] + (n.size?.[0] || MIN_NODE_WIDTH)));
        nodes.forEach(n => { n.pos[0] = maxX - (n.size?.[0] || MIN_NODE_WIDTH); });
    },
    alignTop: (nodes) => {
        const minY = Math.min(...nodes.map(n => n.pos[1]));
        nodes.forEach(n => { n.pos[1] = minY; });
    },
    alignBottom: (nodes) => {
        const maxY = Math.max(...nodes.map(n => n.pos[1] + (n.size?.[1] || MIN_NODE_HEIGHT)));
        nodes.forEach(n => { n.pos[1] = maxY - (n.size?.[1] || MIN_NODE_HEIGHT); });
    },
    alignCenterH: (nodes) => {
        const minY = Math.min(...nodes.map(n => n.pos[1]));
        const maxY = Math.max(...nodes.map(n => n.pos[1] + (n.size?.[1] || MIN_NODE_HEIGHT)));
        const cy = (minY + maxY) / 2;
        nodes.forEach(n => { n.pos[1] = cy - (n.size?.[1] || MIN_NODE_HEIGHT) / 2; });
    },
    alignCenterV: (nodes) => {
        const minX = Math.min(...nodes.map(n => n.pos[0]));
        const maxX = Math.max(...nodes.map(n => n.pos[0] + (n.size?.[0] || MIN_NODE_WIDTH)));
        const cx = (minX + maxX) / 2;
        nodes.forEach(n => { n.pos[0] = cx - (n.size?.[0] || MIN_NODE_WIDTH) / 2; });
    },
    equalWidth: (nodes) => {
        if (nodes.length === 0) return;
        const w = Math.max(...nodes.map(n => n.size?.[0] || MIN_NODE_WIDTH), MIN_NODE_WIDTH);
        nodes.forEach(n => { n.size = n.size || [MIN_NODE_WIDTH, MIN_NODE_HEIGHT]; n.size[0] = w; });
    },
    equalHeight: (nodes) => {
        if (nodes.length === 0) return;
        const h = Math.max(...nodes.map(n => n.size?.[1] || MIN_NODE_HEIGHT), MIN_NODE_HEIGHT);
        nodes.forEach(n => { n.size = n.size || [MIN_NODE_WIDTH, MIN_NODE_HEIGHT]; n.size[1] = h; });
    },
    distributeH: (nodes) => {
        if (nodes.length < 2) return;
        nodes.sort((a, b) => a.pos[0] - b.pos[0]);
        const min = Math.min(...nodes.map(n => n.pos[0]));
        const max = Math.max(...nodes.map(n => n.pos[0] + (n.size?.[0] || MIN_NODE_WIDTH)));
        const total = nodes.reduce((s, n) => s + (n.size?.[0] || MIN_NODE_WIDTH), 0);
        const gap = (max - min - total) / (nodes.length - 1);
        let cur = min;
        nodes.forEach(n => {
            n.pos[0] = cur;
            cur += (n.size?.[0] || MIN_NODE_WIDTH) + gap;
        });
    },
    distributeV: (nodes) => {
        if (nodes.length < 2) return;
        nodes.sort((a, b) => a.pos[1] - b.pos[1]);
        const min = Math.min(...nodes.map(n => n.pos[1]));
        const max = Math.max(...nodes.map(n => n.pos[1] + (n.size?.[1] || MIN_NODE_HEIGHT)));
        const total = nodes.reduce((s, n) => s + (n.size?.[1] || MIN_NODE_HEIGHT), 0);
        const gap = (max - min - total) / (nodes.length - 1);
        let cur = min;
        nodes.forEach(n => {
            n.pos[1] = cur;
            cur += (n.size?.[1] || MIN_NODE_HEIGHT) + gap;
        });
    },
};

function checkShortcutMatch(e, shortcut) {
    if (!shortcut) return false;
    const parts = shortcut.split("+").map((p) => p.trim());
    const key = parts.pop() || "";
    const ctrlOk = parts.includes("Ctrl") ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
    const altOk = parts.includes("Alt") ? e.altKey : !e.altKey;
    const shiftOk = parts.includes("Shift") ? e.shiftKey : !e.shiftKey;
    const keyOk = e.key === key || e.key === key.toLowerCase() || e.key === key.toUpperCase();
    return ctrlOk && altOk && shiftOk && keyOk;
}

app.registerExtension({
    name: "MechaBaby.NodeLayout",
    setup(app) {
        // 快捷键 - F8 排列菜单 / F9 展开收缩菜单（document + window 双监听确保捕获）
        const keyHandler = (e) => {
            if (window._mbnlShortcutDialogOpen || window._mbnlExpandShortcutDialogOpen) return;
            const tag = document.activeElement?.tagName?.toUpperCase?.();
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
            if (checkShortcutMatch(e, getShortcut())) {
                e.preventDefault();
                e.stopPropagation();
                showArrangementMenu();
            } else if (checkShortcutMatch(e, getShortcutExpand())) {
                e.preventDefault();
                e.stopPropagation();
                showExpandCollapseMenu();
            }
        };
        document.addEventListener("keydown", keyHandler, true);
        window.addEventListener("keydown", keyHandler, true);

        const origGetNodeMenuOptions = LGraphCanvas.prototype.getNodeMenuOptions;
        if (origGetNodeMenuOptions) {
            LGraphCanvas.prototype.getNodeMenuOptions = function (node) {
                const opts = origGetNodeMenuOptions.apply(this, arguments) || [];
                const graph = app?.graph;
                if (!graph || !node) return opts;
                const isCollapsed = !!(node.flags && node.flags.collapsed);
                opts.push(null, {
                    content: isCollapsed ? "◀ 展开节点" : "▶ 收缩节点",
                    callback: () => {
                        if (isCollapsed) expandNodes(graph, [node]);
                        else collapseNodes(graph, [node]);
                    },
                });
                return opts;
            };
        }

        const orig = LGraphCanvas.prototype.getCanvasMenuOptions;
        LGraphCanvas.prototype.getCanvasMenuOptions = function () {
            const options = orig?.apply(this, arguments) || [];
            const graph = app.graph;
            if (!graph) return options;

            const shortcutLabel = getShortcut();

            const layoutMenu = {
                content: `${LAYOUT_ICON} MechaBaby 节点布局`,
                className: "mechababy-nodelayout-menu",
                submenu: {
                    options: [
                        { content: "─ 排列方式 ─", disabled: true },
                        {
                            content: "按类型分组",
                            callback: () => arrangeByType(graph),
                        },
                        {
                            content: "按执行顺序",
                            callback: () => arrangeByExecutionOrder(graph),
                        },
                        {
                            content: "蜘蛛网排列（选中/最后节点为中心）",
                            callback: () => arrangeSpiderWeb(graph),
                        },
                        {
                            content: "层级列排列（选中/最后节点为中心）",
                            callback: () => arrangeLevelColumns(graph),
                        },
                        {
                            content: "网格排列",
                            callback: () => arrangeGrid(graph),
                        },
                        {
                            content: "内置排列 (左)",
                            callback: () => { if (graph.arrange) graph.arrange(); redrawCanvas(); },
                        },
                        null,
                        { content: "─ 对齐 (选中) ─", disabled: true },
                        {
                            content: "左对齐",
                            callback: () => { const n = getTargetNodes(graph); if (n.length >= 1) alignOps.alignLeft(n); redrawCanvas(); },
                        },
                        {
                            content: "右对齐",
                            callback: () => { const n = getTargetNodes(graph); if (n.length >= 1) alignOps.alignRight(n); redrawCanvas(); },
                        },
                        {
                            content: "顶部对齐",
                            callback: () => { const n = getTargetNodes(graph); if (n.length >= 1) alignOps.alignTop(n); redrawCanvas(); },
                        },
                        {
                            content: "底部对齐",
                            callback: () => { const n = getTargetNodes(graph); if (n.length >= 1) alignOps.alignBottom(n); redrawCanvas(); },
                        },
                        {
                            content: "水平居中",
                            callback: () => { const n = getTargetNodes(graph); if (n.length >= 1) alignOps.alignCenterH(n); redrawCanvas(); },
                        },
                        {
                            content: "垂直居中",
                            callback: () => { const n = getTargetNodes(graph); if (n.length >= 1) alignOps.alignCenterV(n); redrawCanvas(); },
                        },
                        null,
                        { content: "─ 尺寸与分布 ─", disabled: true },
                        {
                            content: "缩小到最小高度",
                            callback: () => shrinkToMinHeight(graph),
                        },
                        {
                            content: "缩小到最小宽度",
                            callback: () => shrinkToMinWidth(graph),
                        },
                        {
                            content: "缩小到最小尺寸",
                            callback: () => shrinkToMinSize(graph),
                        },
                        null,
                        { content: "─ 展开/收缩 ─", disabled: true },
                        {
                            content: "收缩选中节点",
                            callback: () => { const n = getTargetNodes(graph); if (n.length >= 1) collapseNodes(graph, n); },
                        },
                        {
                            content: "展开选中节点",
                            callback: () => { const n = getTargetNodes(graph); if (n.length >= 1) expandNodes(graph, n); },
                        },
                        {
                            content: "收缩全部节点",
                            callback: () => collapseNodes(graph, graph._nodes || []),
                        },
                        {
                            content: "展开全部节点",
                            callback: () => expandNodes(graph, graph._nodes || []),
                        },
                        null,
                        {
                            content: "等宽",
                            callback: () => { const n = getTargetNodes(graph); if (n.length >= 1) alignOps.equalWidth(n); redrawCanvas(); },
                        },
                        {
                            content: "等高",
                            callback: () => { const n = getTargetNodes(graph); if (n.length >= 1) alignOps.equalHeight(n); redrawCanvas(); },
                        },
                        {
                            content: "水平均匀分布",
                            callback: () => { const n = getTargetNodes(graph); if (n.length >= 2) alignOps.distributeH(n); redrawCanvas(); },
                        },
                        {
                            content: "垂直均匀分布",
                            callback: () => { const n = getTargetNodes(graph); if (n.length >= 2) alignOps.distributeV(n); redrawCanvas(); },
                        },
                        null,
                        {
                            content: `⚙ 排列菜单快捷键 (当前: ${shortcutLabel})`,
                            callback: () => showShortcutDialog(),
                        },
                        {
                            content: `⚙ 展开菜单快捷键 (当前: ${getShortcutExpand()})`,
                            callback: () => showShortcutDialogExpand(),
                        },
                    ],
                },
            };

            options.push(null, layoutMenu);
            return options;
        };
    },
});
