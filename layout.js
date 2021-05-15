function getStyle(e) {
    if(!e.style) {
        e.style = {}
    }
    for(let prop in e.computedStyle) {
        const p = e.computedStyle.value;
        e.style[prop] = e.computedStyle[prop].value;

        if(e.style[prop].toString().match(/px$/)) {
            e.style[prop] = parseInt(e.style[prop]);
        }
        if(e.style[prop].toString().match(/^[0-9\.]+$/)) {
            e.style[prop] = parseInt(e.style[prop]);
        }
    }
    return e.style;
}

function layout(e) {
    if(!e.computedStyle) return;
    const elementStyle = getStyle(e);

    // 只处理flex布局
    if(elementStyle.display !== "flex") return;

    const items = e.children.filter(e => e.type === "element");

    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    const style = elementStyle;

    ["width", "height"].forEach(size => {
        if(style[size] === "auto" || style[size] === "") {
            style[size] = null;
        }
    })

    if(!style["flex-direction"] || style["flex-direction"] === "auto") {
        style["flex-direction"] = "row"
    }
    if(!style["align-items"] || style["align-items"] === "auto") {
        style["align-items"] = "stretch";
    }
    if(!style["justify-content"] || style["justify-content"] === "auto") {
        style["justify-content"] = "flex-start"
    }
    if(!style["flex-wrap"] || style["flex-wrap"] === "auto") {
        style["flex-wrap"] = "nowrap";
    }
    if(!style["align-content"] || style["align-content"] === "auto") {
        style["align-content"] = "stretch"
    }

    let mainSize, mainStart, mainEnd, mainSign, mainBase,
        crossSize, crossStart, crossEnd, crossSign, crossBase;

    if(style["flex-direction" === "row"]) {
        mainSize = "width";
        mainStart = "left";
        mainEnd = "right";
        mainSign = +1;
        mainBase = 0;

        crossSize = "height";
        crossStart = "top";
        crossEnd = "bottom";
    }
    if(style["flex-direction"] === "row-reverse") {
        mainSize = "width";
        mainStart = "left";
        mainEnd = "right";
        mainSign = -1;
        mainBase = style.width;

        crossSize = "height";
        crossStart = "top";
        crossEnd = "bottom";
    }

    if(style["flex-direction"] === "column") {
        mainSize = "height";
        mainStart = "top";
        mainEnd = "bottom";
        mainSign = +1;
        mainBase = 0;

        crossSize = "width";
        crossStart = "left";
        crossEnd = "right";
    }

    if(style["flex-wrap"] === "wrap-reverse") {
        const tmp = crossStart;
        crossStart = crossEnd;
        corssEnd = tmp;
        crossSign = -1;
    }else {
        crossBase = 0;
        crossSign = 1
    }

    let isAutoMainSize = false;
    if(!style[mainSize]) {
        elementStyle[mainSize] = 0;
        for(let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemStyle = getStyle(item)
            if(itemStyle[mainSize] !== null || itemStyle[mainSize] !== void(0)) {
                elementStyle[mainSize] = elementStyle[mainSize] + itemStyle[mainSize]
            }
        }
        isAutoMainSize = true
    }

    let flexLine = [];
    const flexLines = [flexLine];

    let mainSpace = elementStyle[mainSize];
    let crossSpace = 0;

    for(let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemStyle = getStyle(item)

        if(itemStyle[mainSize] === null) {
            itemStyle[mainSize] = 0;
        }

        if(itemStyle.flex) {
            flexLine.push(item);
        }else if(style["flex-wrap"] === "nowrap" && isAutoMainSize) {
            mainSpace -= itemStyle[mainSize];
            if(itemStyle[crossSize] !== null && itemStyle[crossSize] !== void(0)) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            flexLine.push(item);
        }else {
            if(itemStyle[mainSize] > style[mainSize]) {
                itemStyle[mainSize] = style[mainSize];
            }
            if(mainSpace < itemStyle[mainSize]) {
                flexLine.mainSpace = mainSpace;
                flexLine.crossSpace = crossSpace;

                flexLine = []
                flexLines.push(item);

                mainSpace = style[mainSize]
                crossSpace = 0
            }else {
                flexLine.push(item);

            }
            if(itemStyle[crossSize] !== null && itemStyle[crossSize] !== void(0)) {
                corssSpace = Math.max(crossSpace, itemStyle[crossSize])
            }
            mainSpace -= itemStyle[mainSize]
        }
    }
    flexLine.mainSpace = mainSpace

    if(style["flex-wrap"] === "nowrap" || isAutoMainSize) {
        flexLine.crossSpace = (style[crossSize] !== undefined) ? style[crossSize] : crossSpace;
    }else {
        flexLine.crossSpace = crossSpace;
    }

    if(mainSpace < 0) {
        const scale = style[mainSize] / (style[mainSize] - mainSpace);
        const currentMain = mainBase;
        for(let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemStyle = getStyle(item);
            if(itemStyle.flex) {
                itemStyle[mainSize] = 0;
            }

            itemStyle[mainSize] = itemStyle[mainSize] * scale;

            itemStyle[mainStart] = currentMain;
            itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
            currentMain = itemStyle[mainEnd];
        }
    }else {
        flexLines.forEach((items) => {
            const mainSpae = items.mainSpace;
            const flexTotal = 0;
            for(let i = 0; i < items.length; i++) {
                const item = items[i];
                const itemStyle = getStyle(item);

                if((itemStyle.flex !== null) && (itemStyle.flex !== (void(0)))) {
                    flexTotal += itemStyle.flex;
                    continue;
                }
            }

            if(flexTotal > 0) {
                const currentMain = mainBase;
                for(let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const itemStyle = getStyle(item);

                    if(itemStyle.flex) {
                        itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex;
                    }
                    itemStyle[mainStart] = currentMain
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize]
                    currentMain = itemStyle[mainEnd]
                }
            }else {
                if(style["justify-content"] === 'flex-start') {
                    const currentMain = mainBase;
                    const step = 0;
                }
                if(style["justify-content"] === 'flex-end') {
                    const currentMain = mainSpace * mainSign + mainBase;
                    const step = 0;
                }
                if(style["justify-content"] === 'center') {
                    const currentMain = mainSpace / 2 * mainSign + mainBase;
                    const step = 0;
                }
                if(style["justify-content"] === 'space-between') {
                    const currentMain = mainBase;
                    const step = mainSpace / (items.length - 1) * mainSign;
                }
                if(style["justify-content"] === 'space-around') {
                    const step = mainSpace / items.length * mainSign;
                    const currentMain = step / 2 + mainBase;
                }
                for(let i = 0; i < items.length; i++) {
                    const item = items[i];
                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize]
                    currentMain = itemStyle[mainEnd] + step;
                }
            }
        })
    }

    let crossSpace
    if(!style[corssSize]) {
        crossSpace = 0;
        elementStyle[corssSize] = 0;
        for(let i = 0; i < flexLines.length; i++) {
            elementStyle[crossSize] = elementStyle[crossSize] + flexLines[i].crossSpace;
        }
    }else {
        crossSpace = style[corssSize]
        for(let i = 0; i < flexLines.length; i++) {
            crossSpace -= flexLines[i].crossSpace;
        }
    }

    if(style['flex-wrap'] === "wrap-reverse") {
        crossBase = style[crossSize];
    }else {
        crossBase = 0;
    }
    let lineSize = style[crossSize] / flexLines.length;

    let step;
    if(style["align-content"] === "flex-start") {
        crossBase += 0;
        step = 0;
    }
    if(style["align-content"] === "flex-end") {
        crossBase += crossSign * crossSpace;
        step = 0;
    }
    if(style["align-content"] === "center") {
        crossBase += crossSign * crossSpace / 2;
        step = 0;
    }
    if(style["align-content"] === "space-between") {
        crossBase += 0;
        step = crossSpace / (flexLines.length - 1);
    }
    if(style["align-content"] === "space-around") {
        step = crossSpace / (flexLines.length);
        crossBase += crossSign * step / 2;
    }
    if(style["align-content"] === "stretch") {
        crossBase += 0;
        step = 0;
    }

    flexLines.forEach((items) => {
        let lineCrossSize = style["align-content"] === "stretch"
            ? items.crossSpace + crossSpace / flexLines.length
            : items.crossSpace;

        for(let i = 0; i < items.length; i++) {
            let item = items[i];
            let itemStyle = getStyle(item);

            let align = itemStyle["align-self"] || style["align-items"];

            if(itemStyle[crossSize] === null) {
                itemStyle[crossSize] = (align === "stretch") ? lineCrossSize : 0
            }

            if(align === "flex-start") {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize]
            }
            if(align === "flex-end") {
                itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
                itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize];
            }
            if(align === "center") {
                itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize]) / 2;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize]
            }
            if(align === "stretch") {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = crossBase + crossSign * ((itemStyle[crossSize]) !== null && itemStyle[crossSize] !== (void(0)))
                ? itemStyle[crossSize]
                : lineCrossSize

                itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart])
            }
        }
        crossBase += crossSign * (lineCrossSize + step)
    })
}

module.exports = layout;