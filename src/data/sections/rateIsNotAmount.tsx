import React, { useEffect, useRef, useState, type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeInput,
    InlineFeedback,
    InlineLinkedHighlight,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp, useRafLoop, useSpring, type Vec2 } from "@/lib/motion";
import {
    clozePropsFromDefinition,
    getVariableInfo,
    linkedHighlightPropsFromDefinition,
} from "../variables";

// ── Model ────────────────────────────────────────────────────────────────────

const ROOM_TEMP = 20;
const START_TEMP = 90;
const COOLING_K = 0.05;
const HALFWAY_TEMP = 55; // halfway down the gap from 90 to 20
const FLOOR_TEMP = 25;
const MAX_SPEED = (START_TEMP - ROOM_TEMP) * COOLING_K; // 3.5 °/min

const speedAt = (T: number) => COOLING_K * (T - ROOM_TEMP);

// ── View geometry ────────────────────────────────────────────────────────────

const VIEW_WIDTH = 560;
const VIEW_HEIGHT = 330;

const BAR_TOP = 84;
const BAR_BOTTOM = 274;
const BAR_SPAN = BAR_BOTTOM - BAR_TOP;

const WARMTH_X = 269; // centre of the "how warm it is" bar
const SPEED_X = 411; // centre of the "how fast it cools" bar
const BAR_HALF = 19;

const TEMP_SCALE_MAX = 100; // the warmth bar reads an ordinary 0–100°C thermometer
const yForTemp = (T: number) => BAR_BOTTOM - (T / TEMP_SCALE_MAX) * BAR_SPAN;
const yForSpeed = (s: number) => BAR_BOTTOM - (s / MAX_SPEED) * BAR_SPAN;

const INK = "#334155";
const INK_STRUCTURE = "#64748B";
const INK_QUIET = "#CBD5E1";
const ACCENT = "#62D0AD";
const GHOST = "#94A3B8";

const formatTemp = (v: number) => `${v.toFixed(1)}°C`;
const formatSpeed = (v: number) => `${v.toFixed(2)}°/min`;

const EASE_150 = { transition: "opacity 150ms ease, stroke-width 150ms ease" } as const;

const useHighlightState = () => {
    const highlight = useVar<string>("rateViewHighlight", "");
    const setVar = useSetVar();
    return {
        opacity: (id: string) => (highlight && highlight !== id ? 0.35 : 1),
        weight: (id: string, resting: number) => (highlight === id ? resting * 1.6 : resting),
        isActive: (id: string) => highlight === id,
        hoverProps: (id: string) => ({
            onPointerEnter: () => setVar("rateViewHighlight", id),
            onPointerLeave: () => setVar("rateViewHighlight", ""),
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

function RateVersusAmountDrawing() {
    const setVar = useSetVar();
    const temp = useVar<number>("mugTemp", START_TEMP);
    const predicted = useVar<number>("predictedSpeed", MAX_SPEED);
    const revealed = useVar<boolean>("ratePredictionRevealed", false);
    const playing = useVar<boolean>("ratePlaying", false);
    const { opacity, weight, isActive, hoverProps } = useHighlightState();

    const [draggingGhost, setDraggingGhost] = useState(false);
    const [hoveredGhost, setHoveredGhost] = useState(false);
    const [draggingTemp, setDraggingTemp] = useState(false);
    const [hoveredTemp, setHoveredTemp] = useState(false);
    const draggingGhostRef = useRef(false);
    const draggingTempRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const ghostScale = useSpring(draggingGhost || hoveredGhost ? 1.15 : 1, { stiffness: 400, damping: 26 });
    const tempScale = useSpring(draggingTemp || hoveredTemp ? 1.15 : 1, { stiffness: 400, damping: 26 });

    // Refs so the animation loop always integrates from the current state.
    const tempRef = useRef(temp);
    const revealedRef = useRef(revealed);
    useEffect(() => {
        tempRef.current = temp;
    }, [temp]);
    useEffect(() => {
        revealedRef.current = revealed;
    }, [revealed]);

    // The clock: real Newton cooling, 4 simulated minutes per second. It halts
    // itself at halfway the first time through, which is the reveal.
    useRafLoop(
        (dt) => {
            const current = tempRef.current;
            const next = current - COOLING_K * (current - ROOM_TEMP) * dt * 4;
            if (!revealedRef.current && next <= HALFWAY_TEMP) {
                tempRef.current = HALFWAY_TEMP;
                setVar("mugTemp", HALFWAY_TEMP);
                setVar("ratePredictionRevealed", true);
                setVar("ratePlaying", false);
                return;
            }
            if (next <= FLOOR_TEMP) {
                tempRef.current = FLOOR_TEMP;
                setVar("mugTemp", FLOOR_TEMP);
                setVar("ratePlaying", false);
                return;
            }
            tempRef.current = next;
            setVar("mugTemp", next);
        },
        { paused: !playing || draggingTemp },
    );

    const handleGhostMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingGhostRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current);
        const value = ((BAR_BOTTOM - point.y) / BAR_SPAN) * MAX_SPEED;
        setVar("predictedSpeed", clamp(Math.round(value * 20) / 20, 0, MAX_SPEED));
    };

    const handleTempMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingTempRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current);
        const value = ((BAR_BOTTOM - point.y) / BAR_SPAN) * TEMP_SCALE_MAX;
        setVar("mugTemp", clamp(Math.round(value * 2) / 2, FLOOR_TEMP, START_TEMP));
    };

    const speed = speedAt(temp);
    const warmthTop = yForTemp(temp);
    const roomY = yForTemp(ROOM_TEMP);
    const speedTop = yForSpeed(speed);
    const ghostY = yForSpeed(predicted);
    const steamOpacity = 0.1 + 0.75 * ((temp - ROOM_TEMP) / (START_TEMP - ROOM_TEMP));

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full select-none"
            role="img"
            aria-label="A cooling mug beside two bars: how warm the drink is, and how fast it is cooling"
        >
            <defs>
                <filter id="rate-bars-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            {/* Ambient structure: the mug and the two empty bar tracks. */}
            <g opacity={opacity("__structure")} style={EASE_150}>
                <path
                    d="M 56 150 L 56 230 Q 56 238 66 238 L 146 238 Q 156 238 156 230 L 156 150 Z"
                    fill="#F8FAFC"
                    stroke={INK_STRUCTURE}
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                <path
                    d="M 156 168 Q 182 170 182 188 Q 182 206 156 208"
                    fill="none"
                    stroke={INK_STRUCTURE}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path d="M 60 164 L 152 164" stroke={INK_QUIET} strokeWidth="1.5" strokeLinecap="round" />
                <g opacity={steamOpacity}>
                    <path d="M 86 146 Q 78 132 86 118 Q 94 106 88 96" fill="none" stroke={INK_STRUCTURE} strokeWidth="2" strokeLinecap="round" />
                    <path d="M 120 146 Q 112 132 120 118 Q 128 106 122 96" fill="none" stroke={INK_STRUCTURE} strokeWidth="2" strokeLinecap="round" />
                </g>
                <rect x={WARMTH_X - BAR_HALF} y={BAR_TOP} width={BAR_HALF * 2} height={BAR_SPAN} rx="6" fill="#F8FAFC" stroke={INK_QUIET} strokeWidth="1.5" />
                <rect x={SPEED_X - BAR_HALF} y={BAR_TOP} width={BAR_HALF * 2} height={BAR_SPAN} rx="6" fill="#F8FAFC" stroke={INK_QUIET} strokeWidth="1.5" />
                {/* Before-state reference: where this drink started. */}
                <line x1={WARMTH_X - BAR_HALF - 6} y1={yForTemp(START_TEMP)} x2={WARMTH_X + BAR_HALF + 6} y2={yForTemp(START_TEMP)} stroke={INK_QUIET} strokeWidth="1.5" />
                <text x={WARMTH_X + BAR_HALF + 18} y={yForTemp(START_TEMP) + 4} fill={INK} fontSize="12" textAnchor="start">
                    start 90°
                </text>
                <line x1={WARMTH_X - BAR_HALF - 6} y1={yForTemp(HALFWAY_TEMP)} x2={WARMTH_X + BAR_HALF + 6} y2={yForTemp(HALFWAY_TEMP)} stroke={INK_QUIET} strokeWidth="1.5" strokeDasharray="4 4" />
                <text x={WARMTH_X + BAR_HALF + 18} y={yForTemp(HALFWAY_TEMP) + 4} fill={INK} fontSize="12" textAnchor="start">
                    halfway
                </text>
                <line x1={WARMTH_X - BAR_HALF - 6} y1={roomY} x2={WARMTH_X + BAR_HALF + 6} y2={roomY} stroke={INK_QUIET} strokeWidth="1.5" strokeDasharray="4 4" />
                <text x={WARMTH_X + BAR_HALF + 18} y={roomY + 4} fill={INK} fontSize="12" textAnchor="start">
                    room 20°
                </text>
            </g>

            {/* WARMTH group — the whole column the thermometer would read. */}
            <g {...hoverProps("warmth")} opacity={opacity("warmth")} style={EASE_150}>
                <rect
                    x={WARMTH_X - BAR_HALF + 3}
                    y={warmthTop}
                    width={BAR_HALF * 2 - 6}
                    height={BAR_BOTTOM - warmthTop}
                    rx="4"
                    fill={INK_QUIET}
                />
            </g>

            {/* GAP group — the accent that drives everything, and its twin in
                the speed bar. Same id, so hovering either pops both. */}
            <g {...hoverProps("gap")} opacity={opacity("gap")} style={EASE_150}>
                {isActive("gap") && (
                    <g opacity={0.28}>
                        <rect x={WARMTH_X - BAR_HALF - 3} y={warmthTop - 3} width={BAR_HALF * 2 + 6} height={roomY - warmthTop + 6} rx="7" fill={ACCENT} />
                        <rect x={SPEED_X - BAR_HALF - 3} y={speedTop - 3} width={BAR_HALF * 2 + 6} height={BAR_BOTTOM - speedTop + 6} rx="7" fill={ACCENT} />
                    </g>
                )}
                <rect x={WARMTH_X - BAR_HALF + 3} y={warmthTop} width={BAR_HALF * 2 - 6} height={Math.max(0, roomY - warmthTop)} rx="4" fill={ACCENT} />
                <rect x={SPEED_X - BAR_HALF + 3} y={speedTop} width={BAR_HALF * 2 - 6} height={BAR_BOTTOM - speedTop} rx="4" fill={ACCENT} />
                <line x1={WARMTH_X + BAR_HALF + 3} y1={warmthTop} x2={SPEED_X - BAR_HALF - 3} y2={warmthTop} stroke={ACCENT} strokeWidth={weight("gap", 1.5)} strokeDasharray="3 4" opacity={0.45} />
            </g>

            {/* The prediction: a faint marker the student places before the run. */}
            <g opacity={opacity("gap")} style={EASE_150}>
                <line x1={SPEED_X - BAR_HALF - 6} y1={ghostY} x2={SPEED_X + BAR_HALF + 6} y2={ghostY} stroke={GHOST} strokeWidth="2.5" strokeDasharray="5 4" strokeLinecap="round" />
                <text x={SPEED_X + BAR_HALF + 26} y={ghostY - 6} fill={GHOST} fontSize="12" textAnchor="start">
                    your guess
                </text>
                <g transform={`translate(${SPEED_X + BAR_HALF + 14} ${ghostY}) scale(${ghostScale})`}>
                    <circle r="8" fill={GHOST} filter="url(#rate-bars-shadow)" />
                </g>
                <circle
                    cx={SPEED_X + BAR_HALF + 14}
                    cy={ghostY}
                    r="24"
                    fill="transparent"
                    style={{ cursor: draggingGhost ? "grabbing" : "grab", touchAction: "none" }}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        draggingGhostRef.current = true;
                        setDraggingGhost(true);
                    }}
                    onPointerMove={handleGhostMove}
                    onPointerUp={() => {
                        draggingGhostRef.current = false;
                        setDraggingGhost(false);
                    }}
                    onPointerCancel={() => {
                        draggingGhostRef.current = false;
                        setDraggingGhost(false);
                    }}
                    onPointerEnter={() => setHoveredGhost(true)}
                    onPointerLeave={() => setHoveredGhost(false)}
                />
            </g>

            {/* After the run: the true speed, and the warmth bar becomes grabbable. */}
            {revealed && (
                <>
                    <g opacity={opacity("gap")} style={EASE_150}>
                        <line x1={SPEED_X - BAR_HALF - 6} y1={speedTop} x2={SPEED_X + BAR_HALF + 6} y2={speedTop} stroke={ACCENT} strokeWidth="3" strokeLinecap="round" />
                        <text x={SPEED_X + BAR_HALF + 26} y={speedTop + 16} fill={ACCENT} fontSize="12" textAnchor="start">
                            actual
                        </text>
                    </g>
                    <g transform={`translate(${WARMTH_X - BAR_HALF - 18} ${warmthTop}) scale(${tempScale})`}>
                        <circle r="8" fill={ACCENT} filter="url(#rate-bars-shadow)" />
                    </g>
                    <circle
                        cx={WARMTH_X - BAR_HALF - 18}
                        cy={warmthTop}
                        r="24"
                        fill="transparent"
                        style={{ cursor: draggingTemp ? "grabbing" : "grab", touchAction: "none" }}
                        onPointerDown={(event) => {
                            event.currentTarget.setPointerCapture(event.pointerId);
                            draggingTempRef.current = true;
                            setDraggingTemp(true);
                        }}
                        onPointerMove={handleTempMove}
                        onPointerUp={() => {
                            draggingTempRef.current = false;
                            setDraggingTemp(false);
                        }}
                        onPointerCancel={() => {
                            draggingTempRef.current = false;
                            setDraggingTemp(false);
                        }}
                        onPointerEnter={() => setHoveredTemp(true)}
                        onPointerLeave={() => setHoveredTemp(false)}
                    />
                </>
            )}

            {/* Direct labels under each bar — no legend. */}
            <g fontSize="12" style={{ fontVariantNumeric: "tabular-nums", ...EASE_150 }}>
                <text x={WARMTH_X} y="298" fill={INK} textAnchor="middle" opacity={opacity("warmth")}>
                    {formatTemp(temp)}
                </text>
                <text x={WARMTH_X} y="316" fill={INK_STRUCTURE} textAnchor="middle" opacity={opacity("warmth")}>
                    how warm it is
                </text>
                <text x={SPEED_X} y="298" fill={ACCENT} textAnchor="middle" opacity={opacity("gap")}>
                    {formatSpeed(speed)}
                </text>
                <text x={SPEED_X} y="316" fill={INK_STRUCTURE} textAnchor="middle" opacity={opacity("gap")}>
                    how fast it cools
                </text>
            </g>
        </svg>
    );
}

function RateVersusAmountFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="rate-versus-amount"
            playable
            playVarName="ratePlaying"
            onReset={() => {
                setVar("mugTemp", START_TEMP);
                setVar("predictedSpeed", MAX_SPEED);
                setVar("ratePredictionRevealed", false);
                setVar("ratePlaying", false);
                setVar("rateViewHighlight", "");
            }}
            caption="The teal part of the left bar is the gap to the room. Place the faint marker at the cooling speed you expect at halfway, then press play to cool the drink there."
        >
            <RateVersusAmountDrawing />
            <InteractionHintSequence
                hintKey="rate-versus-amount-predict"
                steps={[
                    {
                        gesture: "drag-vertical",
                        label: "Drag the faint marker to the speed you expect",
                        position: { x: "79%", y: "26%" },
                        dragPath: { type: "line", startOffset: { x: 0, y: -26 }, endOffset: { x: 0, y: 26 } },
                    },
                ]}
            />
        </Figure>
    );
}

export const rateIsNotAmountBlocks: ReactElement[] = [
    <StackLayout key="layout-rate-versus-amount-heading" maxWidth="xl">
        <Block id="rate-versus-amount-heading" padding="md">
            <EditableH2 id="h2-rate-versus-amount-heading" blockId="rate-versus-amount-heading">
                Rate Is Not Amount
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-versus-amount-setup" maxWidth="xl">
        <Block id="rate-versus-amount-setup" padding="sm">
            <EditableParagraph id="para-rate-versus-amount-setup" blockId="rate-versus-amount-setup">
                Here is where it is easy to slip. The temperature of the drink and the speed it is
                cooling are two different numbers, and they do not stay in step. Before the clock
                runs, drag the faint marker to the cooling speed you would expect once the drink is
                halfway down to room temperature.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-versus-amount-visual" maxWidth="xl">
        <Block id="rate-versus-amount-visual" padding="sm" hasVisualization>
            <RateVersusAmountFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-versus-amount-reflection" maxWidth="xl">
        <Block id="rate-versus-amount-reflection" padding="sm">
            <EditableParagraph id="para-rate-versus-amount-reflection" blockId="rate-versus-amount-reflection">
                Halfway down, the drink is still a warm 55 degrees, yet it cools at exactly half the
                speed it started with. What the speed follows is the{" "}
                <InlineLinkedHighlight
                    varName="rateViewHighlight"
                    highlightId="gap"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("rateViewHighlight"))}
                >
                    gap to the room
                </InlineLinkedHighlight>
                , never the temperature by itself. So what function could keep both of those true at
                once?
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-versus-amount-question-gap" maxWidth="xl">
        <Block id="rate-versus-amount-question-gap" padding="md">
            <EditableParagraph id="para-rate-versus-amount-question-gap" blockId="rate-versus-amount-question-gap">
                A forgotten cup of tea has sunk to 40 degrees in that same 20-degree room, with
                k = 0.05. Its cooling speed, in degrees per minute, is now{" "}
                <InlineFeedback
                    varName="answerGapSpeed"
                    correctValue={["1", "1.0", "-1", "-1.0"]}
                    position="terminal"
                    successMessage="— right: the gap has shrunk to 20 degrees, and 0.05 × 20 = 1"
                    failureMessage="— almost."
                    hint="Measure from the room, not from zero: how many degrees above 20 is the tea"
                >
                    <InlineClozeInput
                        varName="answerGapSpeed"
                        correctAnswer={["1", "1.0", "-1", "-1.0"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerGapSpeed"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-versus-amount-question-ratio" maxWidth="xl">
        <Block id="rate-versus-amount-question-ratio" padding="md">
            <EditableParagraph id="para-rate-versus-amount-question-ratio" blockId="rate-versus-amount-question-ratio">
                Two mugs share that 20-degree room, one at 80 degrees and one at 50 degrees. Compared
                with the cooler mug, the hotter one is losing heat this many times as fast:{" "}
                <InlineFeedback
                    varName="answerSpeedRatio"
                    correctValue={["2", "2.0", "twice", "two"]}
                    position="terminal"
                    successMessage="— exactly, because the gaps are 60 and 30, and 60 is twice 30"
                    failureMessage="— not quite."
                    hint="Comparing 80 with 50 gives the wrong ratio; compare their distances above 20 instead"
                    visualizationHint={{
                        blockId: "rate-versus-amount-visual",
                        hintKey: "feedback-speed-ratio-hint",
                        steps: [
                            {
                                gesture: "drag-vertical",
                                label: "Drag the teal handle on the left bar up to 80 degrees and read the cooling speed",
                                position: { x: "41%", y: "37%" },
                                completionVar: "mugTemp",
                                completionValue: 80,
                                completionTolerance: 3,
                            },
                            {
                                gesture: "drag-vertical",
                                label: "Now drag it down to 50 degrees — how does that speed compare",
                                position: { x: "41%", y: "54%" },
                                completionVar: "mugTemp",
                                completionValue: 50,
                                completionTolerance: 3,
                            },
                        ],
                        label: "Discover it yourself",
                        resetVars: { mugTemp: 80, ratePredictionRevealed: true, ratePlaying: false },
                    }}
                >
                    <InlineClozeInput
                        varName="answerSpeedRatio"
                        correctAnswer={["2", "2.0", "twice", "two"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerSpeedRatio"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
