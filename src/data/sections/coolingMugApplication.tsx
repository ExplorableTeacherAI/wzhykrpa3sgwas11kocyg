import React, { useRef, useState, type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import {
    EditableH2,
    EditableParagraph,
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
import { Figure, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp, remap, useSpring, type Vec2 } from "@/lib/motion";
import {
    clozePropsFromDefinition,
    getVariableInfo,
    numberPropsFromDefinition,
    spotColorPropsFromDefinition,
} from "../variables";
import { QUANTITY, hue, tint } from "../lessonColors";

// ── Model ────────────────────────────────────────────────────────────────────

const ROOM_TEMP = 20;
const START_TEMP = 90;
const COOLING_K = 0.05;
const MAX_TIME = 40;

const tempAtTime = (t: number) => ROOM_TEMP + (START_TEMP - ROOM_TEMP) * Math.exp(-COOLING_K * t);

// ── View geometry ────────────────────────────────────────────────────────────

const VIEW_WIDTH = 560;
const VIEW_HEIGHT = 500;

const CHIP_WIDTH = 76;
const CHIP_HEIGHT = 36;
const CHIP_ROW_Y = 104;
const SNAP_RADIUS = 46;

const PLOT_LEFT = 80;
const PLOT_RIGHT = 500;
const PLOT_TOP = 330;
const PLOT_BOTTOM = 452;

const xForTime = (t: number) => remap(t, 0, MAX_TIME, PLOT_LEFT, PLOT_RIGHT);
const yForTemp = (T: number) =>
    PLOT_BOTTOM - ((T - ROOM_TEMP) / (START_TEMP - ROOM_TEMP)) * (PLOT_BOTTOM - PLOT_TOP);

const INK = "#334155";
const INK_STRUCTURE = "#64748B";
const INK_QUIET = "#CBD5E1";
/** Teal: the drink's temperature and the curve it traces. */
const TEMPERATURE = QUANTITY.temperature;
/** Violet: the rate on the left of the rule. */
const RATE = QUANTITY.rate;
/** Sky: the room. */
const ROOM = QUANTITY.room;
/** Rose: the steepness k. */
const STEEPNESS = QUANTITY.steepness;
/** Indigo: the clock. */
const TIME = QUANTITY.time;
const PAPER = "#FFFFFF";

const formatMinutes = (v: number) => `${v.toFixed(1)} min`;
const formatTemp = (v: number) => `${v.toFixed(1)}°C`;

const EASE_150 = { transition: "opacity 150ms ease, stroke-width 150ms ease" } as const;

type ChipId = "start" | "room" | "rate";

interface ChipSpec {
    id: ChipId;
    varName: string;
    label: string;
    caption: string;
    /** The hue of the quantity this number is, used everywhere it appears. */
    color: string;
    home: Vec2;
    slot: Vec2;
}

const CHIPS: ChipSpec[] = [
    {
        id: "rate",
        varName: "setupRateFilled",
        label: "0.05",
        caption: "per minute",
        color: STEEPNESS,
        home: { x: 450, y: CHIP_ROW_Y },
        slot: { x: 246, y: 209 },
    },
    {
        id: "room",
        varName: "setupRoomFilled",
        label: "20°C",
        caption: "room",
        color: ROOM,
        home: { x: 340, y: CHIP_ROW_Y },
        slot: { x: 390, y: 209 },
    },
    {
        id: "start",
        varName: "setupStartFilled",
        label: "90°C",
        caption: "poured at",
        color: TEMPERATURE,
        home: { x: 230, y: CHIP_ROW_Y },
        slot: { x: 357, y: 265 },
    },
];

const useHighlightState = () => {
    const highlight = useVar<string>("applicationHighlight", "");
    const setVar = useSetVar();
    return {
        opacity: (id: string) => (highlight && highlight !== id ? 0.35 : 1),
        weight: (id: string, resting: number) => (highlight === id ? resting * 1.6 : resting),
        isActive: (id: string) => highlight === id,
        hoverProps: (id: string) => ({
            onPointerEnter: () => setVar("applicationHighlight", id),
            onPointerLeave: () => setVar("applicationHighlight", ""),
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

function EquationSetupDrawing() {
    const setVar = useSetVar();
    const startFilled = useVar<number>("setupStartFilled", 0);
    const roomFilled = useVar<number>("setupRoomFilled", 0);
    const rateFilled = useVar<number>("setupRateFilled", 0);
    const time = useVar<number>("applicationTime", 20);
    const { opacity, weight, isActive, hoverProps } = useHighlightState();

    const filled: Record<ChipId, number> = { start: startFilled, room: roomFilled, rate: rateFilled };
    const complete = startFilled > 0.5 && roomFilled > 0.5 && rateFilled > 0.5;

    const [dragChip, setDragChip] = useState<ChipId | null>(null);
    const [dragPos, setDragPos] = useState<Vec2>({ x: 0, y: 0 });
    const dragChipRef = useRef<ChipId | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const [draggingMarker, setDraggingMarker] = useState(false);
    const [hoveredMarker, setHoveredMarker] = useState(false);
    const draggingMarkerRef = useRef(false);
    const markerScale = useSpring(draggingMarker || hoveredMarker ? 1.15 : 1, { stiffness: 400, damping: 26 });

    const chipPosition = (chip: ChipSpec): Vec2 => {
        if (dragChip === chip.id) return dragPos;
        return filled[chip.id] > 0.5 ? chip.slot : chip.home;
    };

    const handleChipDown = (chip: ChipSpec) => (event: React.PointerEvent<SVGRectElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragChipRef.current = chip.id;
        setDragChip(chip.id);
        setDragPos(chipPosition(chip));
        if (filled[chip.id] > 0.5) setVar(chip.varName, 0);
    };

    const handleChipMove = (chip: ChipSpec) => (event: React.PointerEvent<SVGRectElement>) => {
        if (dragChipRef.current !== chip.id) return;
        setDragPos(svgPointFromEvent(event, svgRef.current));
    };

    const handleChipUp = (chip: ChipSpec) => () => {
        if (dragChipRef.current !== chip.id) return;
        const distance = Math.hypot(dragPos.x - chip.slot.x, dragPos.y - chip.slot.y);
        if (distance <= SNAP_RADIUS) setVar(chip.varName, 1);
        dragChipRef.current = null;
        setDragChip(null);
    };

    const handleMarkerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingMarkerRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current);
        setVar(
            "applicationTime",
            clamp(Math.round(remap(point.x, PLOT_LEFT, PLOT_RIGHT, 0, MAX_TIME) * 2) / 2, 0, MAX_TIME),
        );
    };

    const samples = Array.from({ length: 161 }, (_, index) => (index * MAX_TIME) / 160);
    const curvePath = samples
        .map((t, index) => `${index === 0 ? "M" : "L"} ${xForTime(t)} ${yForTemp(tempAtTime(t))}`)
        .join(" ");
    const markerX = xForTime(time);
    const markerY = yForTemp(tempAtTime(time));

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full select-none"
            role="img"
            aria-label="Three number tags dragged from a mug into the empty slots of a cooling equation"
        >
            <defs>
                <filter id="setup-chip-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            {/* The real situation: one mug, gently steaming. */}
            <g opacity={opacity("__structure")} style={EASE_150}>
                <path
                    d="M 36 70 L 36 138 Q 36 146 46 146 L 106 146 Q 116 146 116 138 L 116 70 Z"
                    fill="#F8FAFC"
                    stroke={INK_STRUCTURE}
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                <path
                    d="M 116 86 Q 138 88 138 102 Q 138 116 116 118"
                    fill="none"
                    stroke={INK_STRUCTURE}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path d="M 40 82 L 112 82" stroke={INK_QUIET} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 60 66 Q 54 54 60 42 Q 66 32 62 24" fill="none" stroke={INK_STRUCTURE} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                <path d="M 90 66 Q 84 54 90 42 Q 96 32 92 24" fill="none" stroke={INK_STRUCTURE} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </g>

            {/* The equation, with three slots waiting to be filled. */}
            <g opacity={opacity("__structure")} style={EASE_150} fontSize="16">
                <text x="112" y="215" textAnchor="start">
                    <tspan fill={RATE}>dT/dt</tspan>
                    <tspan fill={INK}> = −</tspan>
                </text>
                <text x="294" y="215" textAnchor="start">
                    <tspan fill={INK}>( </tspan>
                    <tspan fill={TEMPERATURE}>T</tspan>
                    <tspan fill={INK}> −</tspan>
                </text>
                <text x="438" y="215" textAnchor="start" fill={INK}>)</text>
                <text x="165" y="271" textAnchor="start">
                    <tspan fill={INK}>starting at </tspan>
                    <tspan fill={TEMPERATURE}>T</tspan>
                    <tspan fill={INK}> =</tspan>
                </text>
            </g>
            {CHIPS.map((chip) => (
                <rect
                    key={`slot-${chip.id}`}
                    x={chip.slot.x - CHIP_WIDTH / 2}
                    y={chip.slot.y - CHIP_HEIGHT / 2}
                    width={CHIP_WIDTH}
                    height={CHIP_HEIGHT}
                    rx="8"
                    fill={PAPER}
                    stroke={filled[chip.id] > 0.5 ? "none" : INK_QUIET}
                    strokeWidth="1.5"
                    strokeDasharray="5 5"
                    opacity={opacity("__structure")}
                    style={EASE_150}
                />
            ))}

            {/* CHIPS group — the three numbers read straight off the situation. */}
            <g {...hoverProps("chips")} opacity={opacity("chips")} style={EASE_150}>
                {CHIPS.map((chip) => {
                    const position = chipPosition(chip);
                    const atHome = filled[chip.id] < 0.5 && dragChip !== chip.id;
                    return (
                        <g key={chip.id}>
                            {isActive("chips") && (
                                <rect
                                    x={position.x - CHIP_WIDTH / 2 - 4}
                                    y={position.y - CHIP_HEIGHT / 2 - 4}
                                    width={CHIP_WIDTH + 8}
                                    height={CHIP_HEIGHT + 8}
                                    rx="11"
                                    fill={chip.color}
                                    opacity={0.28}
                                />
                            )}
                            <rect
                                x={position.x - CHIP_WIDTH / 2}
                                y={position.y - CHIP_HEIGHT / 2}
                                width={CHIP_WIDTH}
                                height={CHIP_HEIGHT}
                                rx="8"
                                fill={chip.color}
                                stroke={chip.color}
                                strokeWidth={weight("chips", 1.5)}
                                filter="url(#setup-chip-shadow)"
                                style={{ cursor: dragChip === chip.id ? "grabbing" : "grab", touchAction: "none" }}
                                onPointerDown={handleChipDown(chip)}
                                onPointerMove={handleChipMove(chip)}
                                onPointerUp={handleChipUp(chip)}
                                onPointerCancel={handleChipUp(chip)}
                            />
                            <text
                                x={position.x}
                                y={position.y + 5}
                                fill={PAPER}
                                fontSize="15"
                                textAnchor="middle"
                                style={{ pointerEvents: "none", fontVariantNumeric: "tabular-nums" }}
                            >
                                {chip.label}
                            </text>
                            {atHome && (
                                <text x={chip.home.x} y={CHIP_ROW_Y + 42} fill={INK_STRUCTURE} fontSize="12" textAnchor="middle">
                                    {chip.caption}
                                </text>
                            )}
                        </g>
                    );
                })}
            </g>

            {/* The solved function, once the set-up is complete. */}
            {complete && (
                <text x={VIEW_WIDTH / 2} y="308" fontSize="15" textAnchor="middle" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <tspan fill={TEMPERATURE}>T</tspan>
                    <tspan fill={INK}> = </tspan>
                    <tspan fill={ROOM}>20</tspan>
                    <tspan fill={INK}> + </tspan>
                    <tspan fill={TEMPERATURE}>70</tspan>
                    <tspan fill={INK}> e^(−</tspan>
                    <tspan fill={STEEPNESS}>0.05</tspan>
                    <tspan fill={INK}> </tspan>
                    <tspan fill={TIME}>t</tspan>
                    <tspan fill={INK}>)</tspan>
                </text>
            )}

            {/* The plot: empty until all three numbers are in. */}
            <g opacity={opacity("curve")} style={EASE_150}>
                <line x1={PLOT_LEFT} y1={PLOT_BOTTOM} x2={PLOT_RIGHT} y2={PLOT_BOTTOM} stroke={ROOM} strokeWidth="1.5" />
                <line x1={PLOT_LEFT} y1={PLOT_TOP} x2={PLOT_LEFT} y2={PLOT_BOTTOM} stroke={INK_QUIET} strokeWidth="1.5" />
                <g fontSize="12" textAnchor="end" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <text x={PLOT_LEFT - 10} y={PLOT_TOP + 4} fill={TEMPERATURE}>90°</text>
                    <text x={PLOT_LEFT - 10} y={yForTemp(55) + 4} fill={TEMPERATURE}>55°</text>
                    <text x={PLOT_LEFT - 10} y={PLOT_BOTTOM + 4} fill={ROOM}>20°</text>
                </g>
                <g fill={TIME} fontSize="12" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <text x={PLOT_LEFT} y="474" textAnchor="start">0</text>
                    <text x={xForTime(20)} y="474" textAnchor="middle">20 min</text>
                    <text x={PLOT_RIGHT} y="474" textAnchor="end">40</text>
                </g>

                {!complete && (
                    <text x={VIEW_WIDTH / 2} y={yForTemp(55)} fill={INK_STRUCTURE} fontSize="12" textAnchor="middle">
                        fill all three slots to draw the curve
                    </text>
                )}

                {complete && (
                    <g {...hoverProps("curve")}>
                        {isActive("curve") && (
                            <path d={curvePath} fill="none" stroke={TEMPERATURE} strokeWidth={weight("curve", 3) + 6} strokeLinecap="round" opacity={0.28} />
                        )}
                        <path d={curvePath} fill="none" stroke={TEMPERATURE} strokeWidth={weight("curve", 3)} strokeLinecap="round" strokeLinejoin="round" />
                        <line x1={markerX} y1={PLOT_BOTTOM} x2={markerX} y2={markerY} stroke={TEMPERATURE} strokeWidth="1.5" strokeDasharray="3 4" opacity={0.6} />
                        <text x={VIEW_WIDTH - 24} y="344" fill={TEMPERATURE} fontSize="12" textAnchor="end" style={{ fontVariantNumeric: "tabular-nums" }}>
                            {`at ${formatMinutes(time)}, T = ${formatTemp(tempAtTime(time))}`}
                        </text>
                        <g transform={`translate(${markerX} ${markerY}) scale(${markerScale})`}>
                            <circle r="8" fill={TEMPERATURE} filter="url(#setup-chip-shadow)" />
                        </g>
                        <circle
                            cx={markerX}
                            cy={markerY}
                            r="24"
                            fill="transparent"
                            style={{ cursor: draggingMarker ? "grabbing" : "grab", touchAction: "none" }}
                            onPointerDown={(event) => {
                                event.currentTarget.setPointerCapture(event.pointerId);
                                draggingMarkerRef.current = true;
                                setDraggingMarker(true);
                            }}
                            onPointerMove={handleMarkerMove}
                            onPointerUp={() => {
                                draggingMarkerRef.current = false;
                                setDraggingMarker(false);
                            }}
                            onPointerCancel={() => {
                                draggingMarkerRef.current = false;
                                setDraggingMarker(false);
                            }}
                            onPointerEnter={() => setHoveredMarker(true)}
                            onPointerLeave={() => setHoveredMarker(false)}
                        />
                    </g>
                )}
            </g>
        </svg>
    );
}

function EquationSetupFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="cooling-application-setup"
            onReset={() => {
                setVar("setupStartFilled", 0);
                setVar("setupRoomFilled", 0);
                setVar("setupRateFilled", 0);
                setVar("applicationTime", 20);
                setVar("applicationHighlight", "");
            }}
            caption="Three numbers, each in the colour of what it measures: teal for the drink, sky blue for the room, rose for the steepness. Drop each into the slot where it belongs, then drag the marker along the finished curve."
        >
            <EquationSetupDrawing />
            <InteractionHintSequence
                hintKey="cooling-application-drag-chip"
                steps={[
                    {
                        gesture: "drag",
                        label: "Drag a number down into its slot",
                        position: { x: "41%", y: "21%" },
                        dragPath: { type: "line", startOffset: { x: 0, y: 0 }, endOffset: { x: 34, y: 78 } },
                    },
                ]}
            />
        </Figure>
    );
}

export const coolingMugApplicationBlocks: ReactElement[] = [
    <StackLayout key="layout-cooling-application-heading" maxWidth="xl">
        <Block id="cooling-application-heading" padding="md">
            <EditableH2 id="h2-cooling-application-heading" blockId="cooling-application-heading">
                Initial Conditions and the Particular Solution
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cooling-application-setup" maxWidth="xl">
        <Block id="cooling-application-setup" padding="sm">
            <EditableParagraph id="para-cooling-application-setup" blockId="cooling-application-setup">
                Now the whole thing on one real mug, start to finish. A drink{" "}
                <InlineSpotColor varName="symbolTemperature" {...spotColorPropsFromDefinition(getVariableInfo("symbolTemperature"))}>
                    poured at 90 degrees
                </InlineSpotColor>{" "}
                into a{" "}
                <InlineSpotColor varName="symbolRoom" {...spotColorPropsFromDefinition(getVariableInfo("symbolRoom"))}>
                    20-degree room
                </InlineSpotColor>
                , cooling with a steepness of{" "}
                <InlineSpotColor varName="symbolSteepness" {...spotColorPropsFromDefinition(getVariableInfo("symbolSteepness"))}>
                    0.05
                </InlineSpotColor>
                , needs only those{" "}
                <InlineLinkedHighlight
                    id="link-cooling-application-chips"
                    varName="applicationHighlight"
                    highlightId="chips"
                    {...hue("temperature")}
                >
                    three numbers
                </InlineLinkedHighlight>{" "}
                before its curve is completely decided.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cooling-application-formula" maxWidth="xl">
        <Block id="cooling-application-formula" padding="lg">
            <FormulaBlock
                latex="\clr{temperature}{T} = \clr{room}{T}_{\clr{room}{room}} + (\clr{temperature}{T_0} - \clr{room}{T}_{\clr{room}{room}})\,e^{-\clr{steepness}{k}\,\clr{time}{t}}"
                colorMap={{
                    temperature: QUANTITY.temperature,
                    room: QUANTITY.room,
                    steepness: QUANTITY.steepness,
                    time: QUANTITY.time,
                }}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cooling-application-invite" maxWidth="xl">
        <Block id="cooling-application-invite" padding="sm">
            <EditableParagraph id="para-cooling-application-invite" blockId="cooling-application-invite">
                Drag each coloured number out of the mug and drop it into the slot where it belongs.
                Once all three are in, the{" "}
                <InlineLinkedHighlight
                    id="link-cooling-application-curve"
                    varName="applicationHighlight"
                    highlightId="curve"
                    {...hue("temperature")}
                >
                    curve
                </InlineLinkedHighlight>{" "}
                appears; slide to{" "}
                <InlineScrubbleNumber
                    varName="applicationTime"
                    {...numberPropsFromDefinition(getVariableInfo("applicationTime"))}
                    formatValue={formatMinutes}
                />{" "}
                and read the temperature straight off it, or jump to the moment it is{" "}
                <InlineTrigger id="trigger-cooling-application-drinkable" varName="applicationTime" value={30} icon="play">
                    finally drinkable
                </InlineTrigger>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cooling-application-visual" maxWidth="xl">
        <Block id="cooling-application-visual" padding="sm" hasVisualization>
            <EquationSetupFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cooling-application-reflection" maxWidth="xl">
        <Block id="cooling-application-reflection" padding="sm">
            <EditableParagraph id="para-cooling-application-reflection" blockId="cooling-application-reflection">
                Twenty minutes in, the drink is still about 46 degrees, too hot to gulp. The same
                three moves work for anything that grows or decays: write the rate law, apply the{" "}
                <InlineTooltip
                    id="tooltip-cooling-application-initial"
                    tooltip="The initial condition: the one measurement that picks a single curve, the particular solution, out of the whole family the rule allows."
                >
                    initial condition
                </InlineTooltip>{" "}
                to pick out the particular solution, then read off whichever moment you care about.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cooling-application-question-room" maxWidth="xl">
        <Block id="cooling-application-question-room" padding="md">
            <EditableParagraph id="para-cooling-application-question-room" blockId="cooling-application-question-room">
                A pan of soup at 70 degrees is left in a{" "}
                <InlineSpotColor varName="symbolRoom" {...spotColorPropsFromDefinition(getVariableInfo("symbolRoom"))}>
                    15-degree kitchen
                </InlineSpotColor>{" "}
                and cools with{" "}
                <InlineFormula latex="\clr{steepness}{k} = \clr{steepness}{0.04}" colorMap={{ steepness: QUANTITY.steepness }} />. Written as{" "}
                <InlineFormula
                    latex="\frac{\clr{rate}{dT}}{\clr{time}{dt}} = -\clr{steepness}{0.04}\,(\clr{temperature}{T} - \clr{room}{c})"
                    colorMap={{
                        rate: QUANTITY.rate,
                        time: QUANTITY.time,
                        steepness: QUANTITY.steepness,
                        temperature: QUANTITY.temperature,
                        room: QUANTITY.room,
                    }}
                />
                , the number{" "}
                <InlineSpotColor varName="symbolRoom" {...spotColorPropsFromDefinition(getVariableInfo("symbolRoom"))}>
                    c
                </InlineSpotColor>{" "}
                is{" "}
                <InlineFeedback
                    varName="answerSoupRoom"
                    correctValue={["15"]}
                    position="terminal"
                    successMessage="— right: the bracket always measures the gap to the surroundings"
                    failureMessage="— not quite."
                    hint="The bracket measures the gap, so it needs the kitchen's temperature"
                    visualizationHint={{
                        blockId: "cooling-application-visual",
                        hintKey: "feedback-soup-room-hint",
                        steps: [
                            {
                                gesture: "drag",
                                label: "Drag the sky-blue room number into the bracket after T minus",
                                position: { x: "61%", y: "21%" },
                                completionVar: "setupRoomFilled",
                                completionValue: 1,
                                completionTolerance: 0.4,
                            },
                            {
                                gesture: "drag",
                                label: "Now drop the other two in and watch the curve appear",
                                position: { x: "41%", y: "21%" },
                                completionVar: "setupStartFilled",
                                completionValue: 1,
                                completionTolerance: 0.4,
                            },
                        ],
                        label: "Discover it yourself",
                        resetVars: { setupStartFilled: 0, setupRoomFilled: 0, setupRateFilled: 0 },
                    }}
                >
                    <InlineClozeInput
                        varName="answerSoupRoom"
                        correctAnswer={["15"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerSoupRoom"))}
                        bgColor={tint(QUANTITY.room, 0.18)}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cooling-application-question-speed" maxWidth="xl">
        <Block id="cooling-application-question-speed" padding="md">
            <EditableParagraph id="para-cooling-application-question-speed" blockId="cooling-application-question-speed">
                At the moment that soup is left there, its temperature is falling at this many degrees
                per minute:{" "}
                <InlineFeedback
                    varName="answerSoupSpeed"
                    correctValue={["2.2", "2.20", "-2.2", "-2.20"]}
                    position="terminal"
                    successMessage="— exactly: the gap is 55 degrees, and 0.04 × 55 = 2.2"
                    failureMessage="— almost."
                    hint="Work out the gap between the soup and the kitchen first, then multiply by 0.04"
                >
                    <InlineClozeInput
                        varName="answerSoupSpeed"
                        correctAnswer={["2.2", "2.20", "-2.2", "-2.20"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerSoupSpeed"))}
                        bgColor={tint(QUANTITY.rate, 0.18)}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
