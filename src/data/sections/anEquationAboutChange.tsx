import React, { useRef, useState, type ReactElement } from "react";
import { Block } from "@/components/templates";
import { SplitLayout, StackLayout } from "@/components/layouts";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeChoice,
    InlineClozeInput,
    InlineFeedback,
    InlineFormula,
    InlineLinkedHighlight,
    InlineScrubbleNumber,
    InlineSpotColor,
    InlineTooltip,
    InlineTrigger,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FigureSlider, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp, remap, useRafLoop, useSpring, type Vec2 } from "@/lib/motion";
import {
    choicePropsFromDefinition,
    clozePropsFromDefinition,
    getVariableInfo,
    numberPropsFromDefinition,
    scrubVarsFromDefinitions,
    spotColorPropsFromDefinition,
} from "../variables";
import { QUANTITY, hue, tint } from "../lessonColors";

// ── Shared model ─────────────────────────────────────────────────────────────
// One source of truth: both views read `coolingTime` and derive everything else.

const ROOM_TEMP = 20;
const START_TEMP = 90;
const DEFAULT_K = 0.05;
const MAX_TIME = 40;
const DEFAULT_TIME = 8;

const tempAtTime = (t: number, k: number) => ROOM_TEMP + (START_TEMP - ROOM_TEMP) * Math.exp(-k * t);
const timeAtTemp = (T: number, k: number) => -Math.log((T - ROOM_TEMP) / (START_TEMP - ROOM_TEMP)) / k;
const minTemp = (k: number) => tempAtTime(MAX_TIME, k);

// ── Shared view geometry — THE VISIBLE TIE ───────────────────────────────────
// Same viewBox, same room line, same pixels per degree in BOTH drawings, so the
// drink's height above the room is the identical number of pixels either side.

const VIEW_WIDTH = 360;
const VIEW_HEIGHT = 300;
const ROOM_Y = 232;
const PX_PER_DEGREE = 2.2;
const SPAN_Y = 246;

const THERMO_X = 290;
const PLOT_LEFT = 64;
const PLOT_RIGHT = 330;

const yForTemp = (T: number) => ROOM_Y - (T - ROOM_TEMP) * PX_PER_DEGREE;
const xForTime = (t: number) => remap(t, 0, MAX_TIME, PLOT_LEFT, PLOT_RIGHT);

const INK = "#334155";
const INK_STRUCTURE = "#64748B";
const INK_QUIET = "#CBD5E1";
/** Teal: how warm the drink is, and the gap it still has to lose. */
const TEMPERATURE = QUANTITY.temperature;
/** Indigo: the clock. */
const TIME = QUANTITY.time;
/** Sky: the room the drink is heading towards. */
const ROOM = QUANTITY.room;
/** Rose: the steepness k. */
const STEEPNESS = QUANTITY.steepness;

// One formatter per quantity, used by the drawings, the slider and the prose.
const formatMinutes = (v: number) => `${v.toFixed(1)} min`;
const formatTemp = (v: number) => `${v.toFixed(1)}°C`;
const formatSteepness = (v: number) => v.toFixed(3);

const EASE_150 = { transition: "opacity 150ms ease, stroke-width 150ms ease" } as const;

const useHighlightState = () => {
    const highlight = useVar<string>("coolingViewHighlight", "");
    const setVar = useSetVar();
    return {
        opacity: (id: string) => (highlight && highlight !== id ? 0.35 : 1),
        weight: (id: string, resting: number) => (highlight === id ? resting * 1.6 : resting),
        isActive: (id: string) => highlight === id,
        hoverProps: (id: string) => ({
            onPointerEnter: () => setVar("coolingViewHighlight", id),
            onPointerLeave: () => setVar("coolingViewHighlight", ""),
        }),
    };
};

const Halo = ({ active, children }: { active: boolean; children: React.ReactNode }) =>
    active ? <g opacity={0.28}>{children}</g> : null;

const svgPointFromEvent = (event: React.PointerEvent, svg: SVGSVGElement | null): Vec2 => {
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
    };
};

function SharedReadouts({ time, k }: { time: number; k: number }) {
    const { opacity } = useHighlightState();
    return (
        <g style={{ fontVariantNumeric: "tabular-nums", ...EASE_150 }}>
            <text x="24" y="40" fill={TIME} fontSize="18" opacity={opacity("time")}>
                {`t = ${formatMinutes(time)}`}
            </text>
            <text x={VIEW_WIDTH - 24} y="40" fill={TEMPERATURE} fontSize="18" textAnchor="end" opacity={opacity("temperature")}>
                {`T = ${formatTemp(tempAtTime(time, k))}`}
            </text>
            <text x={VIEW_WIDTH - 24} y="58" fill={STEEPNESS} fontSize="12" textAnchor="end" opacity={opacity("__structure")}>
                {`k = ${formatSteepness(k)}`}
            </text>
        </g>
    );
}

// ── VIEW A: the mug (the concrete situation) ─────────────────────────────────

function CoolingMugDrawing() {
    const setVar = useSetVar();
    const time = useVar<number>("coolingTime", DEFAULT_TIME);
    const k = useVar<number>("coolingK", DEFAULT_K);
    const playing = useVar<boolean>("coolingPlaying", false);
    const { opacity, weight, isActive, hoverProps } = useHighlightState();

    const [dragging, setDragging] = useState(false);
    const [hovered, setHovered] = useState(false);
    const draggingRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const handleScale = useSpring(dragging || hovered ? 1.15 : 1, { stiffness: 400, damping: 26 });

    useRafLoop((_dt, elapsed) => setVar("coolingTime", (elapsed * 4) % MAX_TIME), {
        paused: !playing || dragging,
    });

    // Drag the thermometer level: pointer height IS the temperature, mapped
    // straight back to the shared clock.
    const handlePointerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current);
        const temp = clamp((ROOM_Y - point.y) / PX_PER_DEGREE + ROOM_TEMP, minTemp(k), START_TEMP);
        setVar("coolingTime", clamp(timeAtTemp(temp, k), 0, MAX_TIME));
    };

    const temp = tempAtTime(time, k);
    const markerY = yForTemp(temp);
    const steamOpacity = 0.1 + 0.75 * ((temp - ROOM_TEMP) / (START_TEMP - ROOM_TEMP));
    const spanX = remap(time, 0, MAX_TIME, 70, 210);

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full select-none"
            role="img"
            aria-label="A mug of hot chocolate beside a thermometer with a draggable temperature marker"
        >
            <defs>
                <filter id="cooling-mug-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            <SharedReadouts time={time} k={k} />

            {/* Ambient structure: the mug, the tube, the room line. */}
            <g opacity={opacity("__structure")} style={EASE_150}>
                <path
                    d="M 70 128 L 70 208 Q 70 214 78 214 L 162 214 Q 170 214 170 208 L 170 128 Z"
                    fill="#F8FAFC"
                    stroke={INK_STRUCTURE}
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                <path
                    d="M 170 146 Q 198 148 198 166 Q 198 184 170 186"
                    fill="none"
                    stroke={INK_STRUCTURE}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path d="M 74 142 L 166 142" stroke={INK_QUIET} strokeWidth="1.5" strokeLinecap="round" />
                <rect x="282" y="64" width="16" height="182" rx="8" fill="#F8FAFC" stroke={INK_STRUCTURE} strokeWidth="1.5" />
                <circle cx={THERMO_X} cy="256" r="13" fill="#F8FAFC" stroke={INK_STRUCTURE} strokeWidth="1.5" />
                {/* Before-state reference: where the drink started. */}
                <line x1="276" y1={yForTemp(START_TEMP)} x2="304" y2={yForTemp(START_TEMP)} stroke={INK_QUIET} strokeWidth="1.5" />
                <text x="270" y={yForTemp(START_TEMP) + 4} fill={INK} fontSize="12" textAnchor="end">
                    start 90°
                </text>
            </g>

            {/* ROOM group — where the drink is heading; the counterpart of the
                room line in the graph, and of the 20 in the rule. */}
            <g {...hoverProps("room")} opacity={opacity("room")} style={EASE_150}>
                <Halo active={isActive("room")}>
                    <line x1="212" y1={ROOM_Y} x2="336" y2={ROOM_Y} stroke={ROOM} strokeWidth={weight("room", 1.5) + 6} strokeLinecap="round" />
                </Halo>
                <line x1="212" y1={ROOM_Y} x2="336" y2={ROOM_Y} stroke={ROOM} strokeWidth={weight("room", 1.5)} strokeDasharray="4 4" />
                <text x="204" y={ROOM_Y + 4} fill={ROOM} fontSize="12" textAnchor="end">
                    room 20°
                </text>
            </g>

            {/* TIME group — the counterpart of the graph's elapsed span. */}
            <g {...hoverProps("time")} opacity={opacity("time")} style={EASE_150}>
                <line x1="70" y1={SPAN_Y + 16} x2="210" y2={SPAN_Y + 16} stroke={INK_QUIET} strokeWidth="1.5" strokeLinecap="round" />
                <Halo active={isActive("time")}>
                    <line x1="70" y1={SPAN_Y + 16} x2={spanX} y2={SPAN_Y + 16} stroke={TIME} strokeWidth={weight("time", 2.5) + 6} strokeLinecap="round" />
                </Halo>
                <line x1="70" y1={SPAN_Y + 16} x2={spanX} y2={SPAN_Y + 16} stroke={TIME} strokeWidth={weight("time", 2.5)} strokeLinecap="round" />
                <text x="140" y={SPAN_Y + 4} fill={TIME} fontSize="12" textAnchor="middle">
                    time
                </text>
            </g>

            {/* TEMPERATURE group — the shared quantity, in the ONE accent hue. */}
            <g {...hoverProps("temperature")} opacity={opacity("temperature")} style={EASE_150}>
                <g opacity={steamOpacity}>
                    <path d="M 100 124 Q 92 110 100 96 Q 108 84 102 74" fill="none" stroke={INK_STRUCTURE} strokeWidth="2" strokeLinecap="round" />
                    <path d="M 134 124 Q 126 110 134 96 Q 142 84 136 74" fill="none" stroke={INK_STRUCTURE} strokeWidth="2" strokeLinecap="round" />
                </g>
                <Halo active={isActive("temperature")}>
                    <line x1={THERMO_X} y1={ROOM_Y} x2={THERMO_X} y2={markerY} stroke={TEMPERATURE} strokeWidth={weight("temperature", 9) + 6} strokeLinecap="round" />
                </Halo>
                <line x1={THERMO_X} y1={ROOM_Y} x2={THERMO_X} y2={markerY} stroke={TEMPERATURE} strokeWidth={weight("temperature", 9)} strokeLinecap="round" />
                {/* Guide leaving toward the graph beside it, at the same height. */}
                <line x1="302" y1={markerY} x2="336" y2={markerY} stroke={TEMPERATURE} strokeWidth="1.5" strokeDasharray="3 4" opacity={0.6} />
            </g>

            <g transform={`translate(${THERMO_X} ${markerY}) scale(${handleScale})`}>
                <circle r="8" fill={TEMPERATURE} filter="url(#cooling-mug-shadow)" />
            </g>
            <circle
                cx={THERMO_X}
                cy={markerY}
                r="24"
                fill="transparent"
                style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    draggingRef.current = true;
                    setDragging(true);
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={() => {
                    draggingRef.current = false;
                    setDragging(false);
                }}
                onPointerCancel={() => {
                    draggingRef.current = false;
                    setDragging(false);
                }}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
            />
        </svg>
    );
}

// ── VIEW B: the same drink, unrolled against time ────────────────────────────

function CoolingGraphDrawing() {
    const setVar = useSetVar();
    const time = useVar<number>("coolingTime", DEFAULT_TIME);
    const k = useVar<number>("coolingK", DEFAULT_K);
    const { opacity, weight, isActive, hoverProps } = useHighlightState();

    const [dragging, setDragging] = useState(false);
    const [hovered, setHovered] = useState(false);
    const draggingRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const handleScale = useSpring(dragging || hovered ? 1.15 : 1, { stiffness: 400, damping: 26 });

    const handlePointerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current);
        setVar("coolingTime", clamp(remap(point.x, PLOT_LEFT, PLOT_RIGHT, 0, MAX_TIME), 0, MAX_TIME));
    };

    const samples = Array.from({ length: 161 }, (_, index) => index * 0.25);
    const pathFor = (upTo: number) =>
        samples
            .filter((t) => t <= upTo)
            .map((t, index) => `${index === 0 ? "M" : "L"} ${xForTime(t)} ${yForTemp(tempAtTime(t, k))}`)
            .join(" ");

    const markerX = xForTime(time);
    const markerY = yForTemp(tempAtTime(time, k));

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full select-none"
            role="img"
            aria-label="Graph of the drink's temperature against time with a draggable marker on the curve"
        >
            <defs>
                <filter id="cooling-graph-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            <SharedReadouts time={time} k={k} />

            <g opacity={opacity("__structure")} style={EASE_150}>
                <line x1={PLOT_LEFT} y1={yForTemp(START_TEMP)} x2={PLOT_LEFT} y2={ROOM_Y} stroke={INK_QUIET} strokeWidth="1.5" />
                <g fontSize="12" textAnchor="end" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <text x={PLOT_LEFT - 10} y={yForTemp(START_TEMP) + 4} fill={TEMPERATURE}>90°</text>
                    <text x={PLOT_LEFT - 10} y={yForTemp(55) + 4} fill={TEMPERATURE}>55°</text>
                    <text x={PLOT_LEFT - 10} y={ROOM_Y + 4} fill={ROOM}>20°</text>
                </g>
                <g fill={TIME} fontSize="12" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <text x={PLOT_LEFT} y={SPAN_Y + 32} textAnchor="start">0</text>
                    <text x={xForTime(20)} y={SPAN_Y + 32} textAnchor="middle">20 min</text>
                    <text x={PLOT_RIGHT} y={SPAN_Y + 32} textAnchor="end">40</text>
                </g>
                {/* The whole curve, quiet: the before-state reference. */}
                <path d={pathFor(MAX_TIME)} fill="none" stroke={INK_QUIET} strokeWidth="1.5" />
            </g>

            {/* ROOM group — same id as the mug's room line, so hovering the 20
                in the rule pops the level in BOTH views. */}
            <g {...hoverProps("room")} opacity={opacity("room")} style={EASE_150}>
                <Halo active={isActive("room")}>
                    <line x1={PLOT_LEFT} y1={ROOM_Y} x2={PLOT_RIGHT} y2={ROOM_Y} stroke={ROOM} strokeWidth={weight("room", 1.5) + 6} strokeLinecap="round" />
                </Halo>
                <line x1={PLOT_LEFT} y1={ROOM_Y} x2={PLOT_RIGHT} y2={ROOM_Y} stroke={ROOM} strokeWidth={weight("room", 1.5)} />
                <text x={PLOT_LEFT + 6} y={ROOM_Y - 8} fill={ROOM} fontSize="12" textAnchor="start">
                    room
                </text>
            </g>

            {/* TIME group — counterpart of the mug's elapsed track, same id. */}
            <g {...hoverProps("time")} opacity={opacity("time")} style={EASE_150}>
                <Halo active={isActive("time")}>
                    <line x1={PLOT_LEFT} y1={SPAN_Y + 16} x2={markerX} y2={SPAN_Y + 16} stroke={TIME} strokeWidth={weight("time", 2.5) + 6} strokeLinecap="round" />
                </Halo>
                <line x1={PLOT_LEFT} y1={SPAN_Y + 16} x2={markerX} y2={SPAN_Y + 16} stroke={TIME} strokeWidth={weight("time", 2.5)} strokeLinecap="round" />
                <text x={(PLOT_LEFT + markerX) / 2} y={SPAN_Y + 4} fill={TIME} fontSize="12" textAnchor="middle">
                    time
                </text>
            </g>

            {/* TEMPERATURE group — same id, same accent, same pixel height as
                the thermometer's column beside it. */}
            <g {...hoverProps("temperature")} opacity={opacity("temperature")} style={EASE_150}>
                <path d={pathFor(time)} fill="none" stroke={TEMPERATURE} strokeWidth={weight("temperature", 2.5)} strokeLinecap="round" strokeLinejoin="round" />
                <Halo active={isActive("temperature")}>
                    <line x1={markerX} y1={ROOM_Y} x2={markerX} y2={markerY} stroke={TEMPERATURE} strokeWidth={weight("temperature", 3) + 6} strokeLinecap="round" />
                </Halo>
                <line x1={markerX} y1={ROOM_Y} x2={markerX} y2={markerY} stroke={TEMPERATURE} strokeWidth={weight("temperature", 3)} strokeLinecap="round" />
                <line x1={PLOT_LEFT} y1={markerY} x2={markerX} y2={markerY} stroke={TEMPERATURE} strokeWidth="1.5" strokeDasharray="3 4" opacity={0.6} />
            </g>

            <g transform={`translate(${markerX} ${markerY}) scale(${handleScale})`}>
                <circle r="8" fill={TEMPERATURE} filter="url(#cooling-graph-shadow)" />
            </g>
            <circle
                cx={markerX}
                cy={markerY}
                r="24"
                fill="transparent"
                style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    draggingRef.current = true;
                    setDragging(true);
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={() => {
                    draggingRef.current = false;
                    setDragging(false);
                }}
                onPointerCancel={() => {
                    draggingRef.current = false;
                    setDragging(false);
                }}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
            />
        </svg>
    );
}

function CoolingMugFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="cooling-mug"
            playable
            playVarName="coolingPlaying"
            onReset={() => {
                setVar("coolingTime", DEFAULT_TIME);
                setVar("coolingK", DEFAULT_K);
                setVar("coolingPlaying", false);
                setVar("coolingViewHighlight", "");
            }}
            caption="Drag the teal marker down the thermometer. The teal column is how far the drink still sits above the sky-blue room line, and the indigo track below is the time that has passed."
        >
            <CoolingMugDrawing />
            <div className="px-6 pb-5">
                <FigureSlider
                    varName="coolingK"
                    label="Steepness k"
                    {...numberPropsFromDefinition(getVariableInfo("coolingK"))}
                    formatValue={formatSteepness}
                />
            </div>
            <InteractionHintSequence
                hintKey="cooling-mug-thermometer-drag"
                steps={[
                    {
                        gesture: "drag-vertical",
                        label: "Drag the teal marker down the thermometer",
                        position: { x: "80%", y: "43%" },
                        dragPath: { type: "line", startOffset: { x: 0, y: -26 }, endOffset: { x: 0, y: 26 } },
                    },
                ]}
            />
        </Figure>
    );
}

function CoolingGraphFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="cooling-graph"
            onReset={() => {
                setVar("coolingTime", DEFAULT_TIME);
                setVar("coolingViewHighlight", "");
            }}
            caption="The same drink, plotted against the indigo clock. Drag this marker instead and the mug follows."
        >
            <CoolingGraphDrawing />
            <div className="px-6 pb-5">
                <FigureSlider
                    varName="coolingTime"
                    label="Time"
                    {...numberPropsFromDefinition(getVariableInfo("coolingTime"))}
                    formatValue={formatMinutes}
                />
            </div>
            <InteractionHintSequence
                hintKey="cooling-graph-marker-drag"
                steps={[
                    {
                        gesture: "drag-horizontal",
                        label: "Drag the marker along the curve",
                        position: { x: "33%", y: "43%" },
                        dragPath: { type: "line", startOffset: { x: -28, y: 0 }, endOffset: { x: 28, y: 0 } },
                    },
                ]}
            />
        </Figure>
    );
}

export const anEquationAboutChangeBlocks: ReactElement[] = [
    <StackLayout key="layout-rate-rule-heading" maxWidth="xl">
        <Block id="rate-rule-heading" padding="md">
            <EditableH2 id="h2-rate-rule-heading" blockId="rate-rule-heading">
                Modelling Rate of Change: Newton's Law of Cooling
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-rule-setup" maxWidth="xl">
        <Block id="rate-rule-setup" padding="sm">
            <EditableParagraph id="para-rate-rule-setup" blockId="rate-rule-setup">
                A hot drink loses heat quickly at first and then more and more slowly.{" "}
                <InlineTooltip
                    id="tooltip-rate-rule-newton"
                    tooltip="Newton's law of cooling: the rate at which a body loses heat is proportional to the difference between its temperature and that of its surroundings."
                >
                    Newton's law of cooling
                </InlineTooltip>{" "}
                says the{" "}
                <InlineSpotColor varName="symbolRate" {...spotColorPropsFromDefinition(getVariableInfo("symbolRate"))}>
                    cooling speed
                </InlineSpotColor>{" "}
                is proportional to how far the{" "}
                <InlineSpotColor varName="symbolTemperature" {...spotColorPropsFromDefinition(getVariableInfo("symbolTemperature"))}>
                    drink
                </InlineSpotColor>{" "}
                sits above the{" "}
                <InlineSpotColor varName="symbolRoom" {...spotColorPropsFromDefinition(getVariableInfo("symbolRoom"))}>
                    room
                </InlineSpotColor>
                . The left side below is a speed, not a temperature.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-rule-formula" maxWidth="xl">
        <Block id="rate-rule-formula" padding="lg">
            <FormulaBlock
                latex="\frac{\clr{rate}{dT}}{\clr{time}{dt}} = -\scrub{coolingK}\,\left(\highlight{temperature}{T} - \highlight{room}{20}\right)"
                colorMap={{ rate: QUANTITY.rate, time: QUANTITY.time }}
                variables={scrubVarsFromDefinitions(["coolingK"])}
                linkedHighlights={{
                    temperature: { varName: "coolingViewHighlight", ...hue("temperature") },
                    room: { varName: "coolingViewHighlight", ...hue("room") },
                }}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-rule-invite" maxWidth="xl">
        <Block id="rate-rule-invite" padding="sm">
            <EditableParagraph id="para-rate-rule-invite" blockId="rate-rule-invite">
                Drag the teal marker down the thermometer, or the dot along the curve beside it, to
                move through the cooling. At{" "}
                <InlineScrubbleNumber
                    varName="coolingTime"
                    {...numberPropsFromDefinition(getVariableInfo("coolingTime"))}
                    formatValue={formatMinutes}
                />{" "}
                the{" "}
                <InlineLinkedHighlight
                    id="link-rate-rule-gap"
                    varName="coolingViewHighlight"
                    highlightId="temperature"
                    {...hue("temperature")}
                >
                    height above the room line
                </InlineLinkedHighlight>{" "}
                is the gap the drink still has to lose, and{" "}
                <InlineScrubbleNumber
                    varName="coolingK"
                    {...numberPropsFromDefinition(getVariableInfo("coolingK"))}
                    formatValue={formatSteepness}
                />{" "}
                decides how impatient the whole thing is. A{" "}
                <InlineTrigger id="trigger-rate-rule-thin-cup" varName="coolingK" value={0.1} icon="zap">
                    thin paper cup
                </InlineTrigger>{" "}
                loses heat about twice as fast as a{" "}
                <InlineTrigger id="trigger-rate-rule-flask" varName="coolingK" value={0.025} icon="refresh">
                    thick vacuum flask
                </InlineTrigger>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <SplitLayout key="layout-rate-rule-visual" ratio="1:1" gap="lg" align="start">
        <Block id="rate-rule-visual" padding="sm" hasVisualization>
            <CoolingMugFigure />
        </Block>
        <Block id="rate-rule-graph" padding="sm" hasVisualization>
            <CoolingGraphFigure />
        </Block>
    </SplitLayout>,

    <StackLayout key="layout-rate-rule-reflection" maxWidth="xl">
        <Block id="rate-rule-reflection" padding="sm">
            <EditableParagraph id="para-rate-rule-reflection" blockId="rate-rule-reflection">
                Notice what the equation never tells you: the temperature itself. It hands you the{" "}
                <InlineTooltip
                    id="tooltip-rate-rule-instant"
                    tooltip="An instantaneous rate: how fast the temperature would change if it kept this speed up for a whole minute. It is measured in degrees per minute."
                >
                    speed at this instant
                </InlineTooltip>
                , and the temperature is whatever follows from obeying that speed, minute after
                minute.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-rule-question-meaning" maxWidth="xl">
        <Block id="rate-rule-question-meaning" padding="md">
            <EditableParagraph id="para-rate-rule-question-meaning" blockId="rate-rule-question-meaning">
                In the cooling rule,{" "}
                <InlineFormula
                    latex="\frac{\clr{rate}{dT}}{\clr{time}{dt}}"
                    colorMap={{ rate: QUANTITY.rate, time: QUANTITY.time }}
                />{" "}
                stands for{" "}
                <InlineFeedback
                    varName="answerRateMeaning"
                    correctValue="the speed the drink is cooling"
                    position="terminal"
                    successMessage="— yes, and it is measured in degrees per minute, not in degrees"
                    failureMessage="— not quite: it is the speed the drink is cooling, in degrees per minute."
                    hint="The temperature is not in the rule at all, it is what follows from that speed"
                    visualizationHint={{
                        blockId: "rate-rule-graph",
                        hintKey: "feedback-rate-meaning-hint",
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Drag the marker back to the very start — the curve there is steep",
                                position: { x: "33%", y: "43%" },
                                completionVar: "coolingTime",
                                completionValue: 1,
                                completionTolerance: 2,
                            },
                            {
                                gesture: "drag-horizontal",
                                label: "Now drag it far to the right — the same drink, barely changing now",
                                position: { x: "75%", y: "62%" },
                                completionVar: "coolingTime",
                                completionValue: 32,
                                completionTolerance: 6,
                            },
                        ],
                        label: "Discover it yourself",
                        resetVars: { coolingTime: DEFAULT_TIME, coolingK: DEFAULT_K },
                    }}
                >
                    <InlineClozeChoice
                        varName="answerRateMeaning"
                        correctAnswer="the speed the drink is cooling"
                        options={[
                            "the speed the drink is cooling",
                            "the temperature of the drink",
                            "the time on the clock",
                        ]}
                        {...choicePropsFromDefinition(getVariableInfo("answerRateMeaning"))}
                        bgColor={tint(QUANTITY.rate, 0.18)}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-rule-question-speed" maxWidth="xl">
        <Block id="rate-rule-question-speed" padding="md">
            <EditableParagraph id="para-rate-rule-question-speed" blockId="rate-rule-question-speed">
                Take a different drink, sitting at{" "}
                <InlineSpotColor varName="symbolTemperature" {...spotColorPropsFromDefinition(getVariableInfo("symbolTemperature"))}>
                    60 degrees
                </InlineSpotColor>{" "}
                in that same{" "}
                <InlineSpotColor varName="symbolRoom" {...spotColorPropsFromDefinition(getVariableInfo("symbolRoom"))}>
                    20-degree room
                </InlineSpotColor>{" "}
                with <InlineFormula latex="\clr{steepness}{k} = \clr{steepness}{0.05}" colorMap={{ steepness: QUANTITY.steepness }} />. Its cooling speed,
                in degrees per minute, is{" "}
                <InlineFeedback
                    varName="answerCoolingSpeed"
                    correctValue={["2", "2.0", "-2", "-2.0"]}
                    position="terminal"
                    successMessage="— exactly: the gap is 40 degrees, and 0.05 × 40 = 2"
                    failureMessage="— almost."
                    hint="Find the gap between the drink and the room first, then multiply it by 0.05"
                >
                    <InlineClozeInput
                        varName="answerCoolingSpeed"
                        correctAnswer={["2", "2.0", "-2", "-2.0"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerCoolingSpeed"))}
                        bgColor={tint(QUANTITY.rate, 0.18)}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-block-1787908235539" maxWidth="xl">
        <Block id="block-1787908235539" padding="md">
            <EditableParagraph id="para-block-1787908235539" blockId="block-1787908235539">
                And one sitting at{" "}
                <InlineSpotColor varName="symbolTemperature" {...spotColorPropsFromDefinition(getVariableInfo("symbolTemperature"))}>
                    50 degrees
                </InlineSpotColor>{" "}
                in that same room cools at{" "}
                <InlineFeedback
                    varName="var_inlineClozeInput-c4cc2a03-f358-40ba-a1a3-2ed1b0f4a99d"
                    correctValue={["1.5", "-1.5"]}
                    position="terminal"
                    successMessage="— right: the gap is 30 degrees, and 0.05 × 30 = 1.5"
                    failureMessage="— almost."
                    hint="Take the gap above 20 degrees, then multiply it by 0.05"
                >
                    <InlineClozeInput
                        varName="var_inlineClozeInput-c4cc2a03-f358-40ba-a1a3-2ed1b0f4a99d"
                        correctAnswer={["1.5", "-1.5"]}
                        id="inlineClozeInput-c4cc2a03-f358-40ba-a1a3-2ed1b0f4a99d"
                        placeholder="???"
                        color={QUANTITY.rate}
                        bgColor={tint(QUANTITY.rate, 0.18)}
                        caseSensitive={false}
                    />
                </InlineFeedback>{" "}
                degrees per minute.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
