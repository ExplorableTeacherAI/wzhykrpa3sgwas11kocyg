import React, { useRef, useState, type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeChoice,
    InlineClozeInput,
    InlineFeedback,
    InlineLinkedHighlight,
    InlineScrubbleNumber,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FigureSlider, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp, useSpring, type Vec2 } from "@/lib/motion";
import {
    choicePropsFromDefinition,
    clozePropsFromDefinition,
    getVariableInfo,
    linkedHighlightPropsFromDefinition,
    numberPropsFromDefinition,
} from "../variables";

// ── Model ────────────────────────────────────────────────────────────────────

const ROOM_TEMP = 20;
const RULE_K = 0.05; // the rule the arrow field is drawn from
const MAX_TIME = 40;
const TAIL_TIME = 20; // where the steepness handle sits on the curve

const guessTemp = (t: number, gap: number, k: number) => ROOM_TEMP + gap * Math.exp(-k * t);
const fieldSlope = (T: number) => -RULE_K * (T - ROOM_TEMP);

// ── View geometry ────────────────────────────────────────────────────────────

const VIEW_WIDTH = 560;
const VIEW_HEIGHT = 320;
const PLOT_LEFT = 64;
const PLOT_RIGHT = 512;
const PLOT_TOP = 60;
const PLOT_BOTTOM = 268;

const SX = (PLOT_RIGHT - PLOT_LEFT) / MAX_TIME; // 11.2 px per minute
const SY = (PLOT_BOTTOM - PLOT_TOP) / 70; // px per degree above the room

const xForTime = (t: number) => PLOT_LEFT + t * SX;
const yForTemp = (T: number) => PLOT_BOTTOM - (T - ROOM_TEMP) * SY;

const ARROW_TIMES = [2.5, 7.5, 12.5, 17.5, 22.5, 27.5, 32.5, 37.5];
const ARROW_TEMPS = [28, 38, 48, 58, 68, 78];
const ARROW_HALF = 11;
const CROSS_BAND = 15;

const INK = "#334155";
const INK_STRUCTURE = "#64748B";
const INK_QUIET = "#CBD5E1";
const ACCENT = "#62D0AD";

const formatTemp = (v: number) => `${v.toFixed(1)}°C`;
const formatSteepness = (v: number) => v.toFixed(3);

const EASE_150 = { transition: "opacity 150ms ease, stroke-width 150ms ease" } as const;

const useHighlightState = () => {
    const highlight = useVar<string>("guessViewHighlight", "");
    const setVar = useSetVar();
    return {
        opacity: (id: string) => (highlight && highlight !== id ? 0.35 : 1),
        weight: (id: string, resting: number) => (highlight === id ? resting * 1.6 : resting),
        isActive: (id: string) => highlight === id,
        hoverProps: (id: string) => ({
            onPointerEnter: () => setVar("guessViewHighlight", id),
            onPointerLeave: () => setVar("guessViewHighlight", ""),
        }),
    };
};

const svgPointFromEvent = (event: React.PointerEvent, svg: SVGSVGElement | null): Vec2 => {
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
    };
};

/** A short slanted arrow centred on (cx, cy) pointing along (dx, dy). */
const arrowPath = (cx: number, cy: number, dx: number, dy: number) => {
    const x1 = cx - dx;
    const y1 = cy - dy;
    const x2 = cx + dx;
    const y2 = cy + dy;
    const angle = Math.atan2(dy, dx);
    const head = 5;
    const a1 = angle + Math.PI - 0.45;
    const a2 = angle + Math.PI + 0.45;
    return (
        `M ${x1} ${y1} L ${x2} ${y2} ` +
        `M ${x2} ${y2} L ${x2 + head * Math.cos(a1)} ${y2 + head * Math.sin(a1)} ` +
        `M ${x2} ${y2} L ${x2 + head * Math.cos(a2)} ${y2 + head * Math.sin(a2)}`
    );
};

function SlopeFieldDrawing() {
    const setVar = useSetVar();
    const gap = useVar<number>("guessStartGap", 40);
    const k = useVar<number>("guessK", 0.09);
    const { opacity, weight, isActive, hoverProps } = useHighlightState();

    const [draggingStart, setDraggingStart] = useState(false);
    const [hoveredStart, setHoveredStart] = useState(false);
    const [draggingTail, setDraggingTail] = useState(false);
    const [hoveredTail, setHoveredTail] = useState(false);
    const draggingStartRef = useRef(false);
    const draggingTailRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const startScale = useSpring(draggingStart || hoveredStart ? 1.15 : 1, { stiffness: 400, damping: 26 });
    const tailScale = useSpring(draggingTail || hoveredTail ? 1.15 : 1, { stiffness: 400, damping: 26 });

    const handleStartMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingStartRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current);
        const value = (PLOT_BOTTOM - point.y) / SY;
        setVar("guessStartGap", clamp(Math.round(value * 2) / 2, 10, 70));
    };

    // Dragging the tail height at a fixed time is dragging the steepness.
    const handleTailMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingTailRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current);
        const aboveRoom = clamp((PLOT_BOTTOM - point.y) / SY, gap * 0.04, gap * 0.85);
        const value = -Math.log(aboveRoom / gap) / TAIL_TIME;
        setVar("guessK", clamp(Math.round(value * 1000) / 1000, 0.01, 0.15));
    };

    // The arrow field, and which arrows this guess actually agrees with.
    const arrows = ARROW_TIMES.flatMap((t) =>
        ARROW_TEMPS.map((T) => {
            const slope = fieldSlope(T);
            const viewSlope = (-SY * slope) / SX;
            const length = Math.hypot(1, viewSlope);
            const dx = (ARROW_HALF * 1) / length;
            const dy = (ARROW_HALF * viewSlope) / length;
            const curveY = yForTemp(guessTemp(t, gap, k));
            const crossed = Math.abs(curveY - yForTemp(T)) <= CROSS_BAND;
            const curveSlope = -k * gap * Math.exp(-k * t);
            const tolerance = 0.12 + 0.08 * Math.abs(slope);
            const matched = crossed && Math.abs(curveSlope - slope) <= tolerance;
            return { key: `${t}-${T}`, x: xForTime(t), y: yForTemp(T), dx, dy, crossed, matched };
        }),
    );
    const crossedCount = arrows.filter((a) => a.crossed).length;
    const matchedCount = arrows.filter((a) => a.matched).length;

    const samples = Array.from({ length: 161 }, (_, index) => (index * MAX_TIME) / 160);
    const curvePath = samples
        .map((t, index) => `${index === 0 ? "M" : "L"} ${xForTime(t)} ${yForTemp(guessTemp(t, gap, k))}`)
        .join(" ");

    const startY = yForTemp(ROOM_TEMP + gap);
    const tailX = xForTime(TAIL_TIME);
    const tailY = yForTemp(guessTemp(TAIL_TIME, gap, k));

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full select-none"
            role="img"
            aria-label="A field of slope arrows with a draggable guessed cooling curve laid across it"
        >
            <defs>
                <filter id="guess-curve-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            {/* Readouts: the guess, and how it is doing against the arrows. */}
            <g fontSize="12" style={{ fontVariantNumeric: "tabular-nums", ...EASE_150 }}>
                <text x="24" y="34" fill={INK} opacity={opacity("curve")}>
                    {`start ${formatTemp(ROOM_TEMP + gap)}`}
                </text>
                <text x={VIEW_WIDTH / 2} y="34" fill={INK_STRUCTURE} textAnchor="middle" opacity={opacity("field")}>
                    {`arrows matched: ${matchedCount} of ${crossedCount}`}
                </text>
                <text x={VIEW_WIDTH - 24} y="34" fill={ACCENT} textAnchor="end" opacity={opacity("curve")}>
                    {`k = ${formatSteepness(k)}`}
                </text>
            </g>

            {/* Axes — ambient structure. */}
            <g opacity={opacity("__structure")} style={EASE_150}>
                <line x1={PLOT_LEFT} y1={PLOT_BOTTOM} x2={PLOT_RIGHT} y2={PLOT_BOTTOM} stroke={INK_QUIET} strokeWidth="1.5" />
                <line x1={PLOT_LEFT} y1={PLOT_TOP} x2={PLOT_LEFT} y2={PLOT_BOTTOM} stroke={INK_QUIET} strokeWidth="1.5" />
                <g fill={INK} fontSize="12" textAnchor="end" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <text x={PLOT_LEFT - 10} y={yForTemp(90) + 4}>90°</text>
                    <text x={PLOT_LEFT - 10} y={yForTemp(55) + 4}>55°</text>
                    <text x={PLOT_LEFT - 10} y={PLOT_BOTTOM + 4}>20°</text>
                </g>
                <g fill={INK} fontSize="12" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <text x={PLOT_LEFT} y={PLOT_BOTTOM + 28} textAnchor="start">0</text>
                    <text x={xForTime(20)} y={PLOT_BOTTOM + 28} textAnchor="middle">20 min</text>
                    <text x={PLOT_RIGHT} y={PLOT_BOTTOM + 28} textAnchor="end">40</text>
                </g>
            </g>

            {/* FIELD group — what the rule demands at every point. */}
            <g {...hoverProps("field")} opacity={opacity("field")} style={EASE_150}>
                {arrows.map((arrow) => (
                    <g key={arrow.key}>
                        {arrow.matched && isActive("field") && (
                            <path
                                d={arrowPath(arrow.x, arrow.y, arrow.dx, arrow.dy)}
                                fill="none"
                                stroke={ACCENT}
                                strokeWidth={weight("field", 2.5) + 6}
                                strokeLinecap="round"
                                opacity={0.28}
                            />
                        )}
                        <path
                            d={arrowPath(arrow.x, arrow.y, arrow.dx, arrow.dy)}
                            fill="none"
                            stroke={arrow.matched ? ACCENT : arrow.crossed ? INK_STRUCTURE : INK_QUIET}
                            strokeWidth={arrow.matched ? weight("field", 2.5) : arrow.crossed ? weight("field", 2) : 1.5}
                            strokeLinecap="round"
                            style={EASE_150}
                        />
                    </g>
                ))}
            </g>

            {/* CURVE group — the guess itself, the one accent object you move. */}
            <g {...hoverProps("curve")} opacity={opacity("curve")} style={EASE_150}>
                {isActive("curve") && (
                    <path d={curvePath} fill="none" stroke={ACCENT} strokeWidth={weight("curve", 3) + 6} strokeLinecap="round" opacity={0.28} />
                )}
                <path d={curvePath} fill="none" stroke={ACCENT} strokeWidth={weight("curve", 3)} strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Two handles: the start height, and the steepness of the tail. */}
            <g transform={`translate(${PLOT_LEFT} ${startY}) scale(${startScale})`}>
                <circle r="8" fill={ACCENT} filter="url(#guess-curve-shadow)" />
            </g>
            <circle
                cx={PLOT_LEFT}
                cy={startY}
                r="24"
                fill="transparent"
                style={{ cursor: draggingStart ? "grabbing" : "grab", touchAction: "none" }}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    draggingStartRef.current = true;
                    setDraggingStart(true);
                }}
                onPointerMove={handleStartMove}
                onPointerUp={() => {
                    draggingStartRef.current = false;
                    setDraggingStart(false);
                }}
                onPointerCancel={() => {
                    draggingStartRef.current = false;
                    setDraggingStart(false);
                }}
                onPointerEnter={() => setHoveredStart(true)}
                onPointerLeave={() => setHoveredStart(false)}
            />

            <g transform={`translate(${tailX} ${tailY}) scale(${tailScale})`}>
                <circle r="8" fill={ACCENT} filter="url(#guess-curve-shadow)" />
            </g>
            <circle
                cx={tailX}
                cy={tailY}
                r="24"
                fill="transparent"
                style={{ cursor: draggingTail ? "grabbing" : "grab", touchAction: "none" }}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    draggingTailRef.current = true;
                    setDraggingTail(true);
                }}
                onPointerMove={handleTailMove}
                onPointerUp={() => {
                    draggingTailRef.current = false;
                    setDraggingTail(false);
                }}
                onPointerCancel={() => {
                    draggingTailRef.current = false;
                    setDraggingTail(false);
                }}
                onPointerEnter={() => setHoveredTail(true)}
                onPointerLeave={() => setHoveredTail(false)}
            />
        </svg>
    );
}

function SlopeFieldFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="guess-and-check-field"
            onReset={() => {
                setVar("guessStartGap", 40);
                setVar("guessK", 0.09);
                setVar("guessViewHighlight", "");
            }}
            caption="Every arrow points the way the cooling rule demands at that spot. Drag the handle at 20 minutes to bend the tail, and the one on the left to slide the whole curve up or down."
        >
            <SlopeFieldDrawing />
            <div className="px-6 pb-5">
                <FigureSlider
                    varName="guessK"
                    label="Steepness k"
                    {...numberPropsFromDefinition(getVariableInfo("guessK"))}
                    formatValue={formatSteepness}
                />
            </div>
            <InteractionHintSequence
                hintKey="guess-and-check-tail-drag"
                steps={[
                    {
                        gesture: "drag-vertical",
                        label: "Drag this handle until the arrows turn teal",
                        position: { x: "51%", y: "78%" },
                        dragPath: { type: "line", startOffset: { x: 0, y: -26 }, endOffset: { x: 0, y: 26 } },
                    },
                ]}
            />
        </Figure>
    );
}

export const guessAndCheckBlocks: ReactElement[] = [
    <StackLayout key="layout-guess-and-check-heading" maxWidth="xl">
        <Block id="guess-and-check-heading" padding="md">
            <EditableH2 id="h2-guess-and-check-heading" blockId="guess-and-check-heading">
                Guessing a Solution and Checking It
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-guess-and-check-setup" maxWidth="xl">
        <Block id="guess-and-check-setup" padding="sm">
            <EditableParagraph id="para-guess-and-check-setup" blockId="guess-and-check-setup">
                So what kind of answer are we looking for? Not a number, but a whole function giving
                the temperature at every moment. There is a way to test a guess without solving
                anything: differentiate it and see whether it obeys the rule.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-guess-and-check-guess" maxWidth="xl">
        <Block id="guess-and-check-guess" padding="lg">
            <FormulaBlock latex="T = 20 + 70\,e^{-0.05t}" />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-guess-and-check-derivative" maxWidth="xl">
        <Block id="guess-and-check-derivative" padding="lg">
            <FormulaBlock latex="\frac{dT}{dt} = -0.05 \times 70\,e^{-0.05t} = -0.05\,(T - 20)" />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-guess-and-check-invite" maxWidth="xl">
        <Block id="guess-and-check-invite" padding="sm">
            <EditableParagraph id="para-guess-and-check-invite" blockId="guess-and-check-invite">
                Each little{" "}
                <InlineLinkedHighlight
                    varName="guessViewHighlight"
                    highlightId="field"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("guessViewHighlight"))}
                >
                    arrow
                </InlineLinkedHighlight>{" "}
                below points the way the rule demands at that spot. Pull the curve's tail until the
                arrows it crosses turn teal, then drag its starting point up and down.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-guess-and-check-visual" maxWidth="xl">
        <Block id="guess-and-check-visual" padding="sm" hasVisualization>
            <SlopeFieldFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-guess-and-check-reflection" maxWidth="xl">
        <Block id="guess-and-check-reflection" padding="sm">
            <EditableParagraph id="para-guess-and-check-reflection" blockId="guess-and-check-reflection">
                Differentiating the guess gives exactly minus 0.05 times the gap, which is the rule
                itself. Slide the starting height and every arrow stays matched; the steepness{" "}
                <InlineScrubbleNumber
                    varName="guessK"
                    {...numberPropsFromDefinition(getVariableInfo("guessK"))}
                    formatValue={formatSteepness}
                />{" "}
                is the one number that has to be right. That is why a single rule owns a whole family
                of curves.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-guess-and-check-question-growth" maxWidth="xl">
        <Block id="guess-and-check-question-growth" padding="md">
            <EditableParagraph id="para-guess-and-check-question-growth" blockId="guess-and-check-question-growth">
                A colony of bacteria obeys a growth rule instead: dP/dt = 0.03P. Of these three, the
                function that survives the differentiate-and-check test is{" "}
                <InlineFeedback
                    varName="answerGrowthSolution"
                    correctValue="200e^(0.03t)"
                    position="terminal"
                    successMessage="— yes: differentiating brings the 0.03 down in front, which is the rule"
                    failureMessage="— not that one."
                    hint="Differentiate each one and see which gives back 0.03 times itself"
                >
                    <InlineClozeChoice
                        varName="answerGrowthSolution"
                        correctAnswer="200e^(0.03t)"
                        options={["200e^(0.03t)", "200e^(3t)", "0.03t + 200"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerGrowthSolution"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-guess-and-check-question-exponent" maxWidth="xl">
        <Block id="guess-and-check-question-exponent" padding="md">
            <EditableParagraph id="para-guess-and-check-question-exponent" blockId="guess-and-check-question-exponent">
                Differentiate T = 20 + 40e^(−0.02t) and the answer takes the form dT/dt = c × (T − 20).
                The value of c is{" "}
                <InlineFeedback
                    varName="answerExponentValue"
                    correctValue={["-0.02", "-0.020", "-.02"]}
                    position="terminal"
                    successMessage="— exactly, so this curve solves a room that cools with k = 0.02"
                    failureMessage="— close."
                    hint="Differentiating brings the exponent's number down in front, sign and all"
                    visualizationHint={{
                        blockId: "guess-and-check-visual",
                        hintKey: "feedback-exponent-value-hint",
                        steps: [
                            {
                                gesture: "drag-vertical",
                                label: "Drag the handle at 20 minutes until the arrows turn teal — watch the k readout",
                                position: { x: "51%", y: "78%" },
                                completionVar: "guessK",
                                completionValue: 0.05,
                                completionTolerance: 0.004,
                            },
                            {
                                gesture: "drag-vertical",
                                label: "Now drag the left handle to the top — the arrows stay matched",
                                position: { x: "12%", y: "47%" },
                                completionVar: "guessStartGap",
                                completionValue: 68,
                                completionTolerance: 8,
                            },
                        ],
                        label: "Discover it yourself",
                        resetVars: { guessK: 0.09, guessStartGap: 40 },
                    }}
                >
                    <InlineClozeInput
                        varName="answerExponentValue"
                        correctAnswer={["-0.02", "-0.020", "-.02"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerExponentValue"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
