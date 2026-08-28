import React, { useRef, useState, type ReactElement } from "react";
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
import { Figure, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { type Vec2 } from "@/lib/motion";
import {
    clozePropsFromDefinition,
    getVariableInfo,
    linkedHighlightPropsFromDefinition,
} from "../variables";

// ── The cards and where they belong ──────────────────────────────────────────

interface EquationCard {
    id: string;
    varName: string;
    label: string;
    /** 0 = no derivative, 1 = first order, 2 = second order */
    tray: number;
    home: Vec2;
    tilt: number;
}

const EQUATION_CARDS: EquationCard[] = [
    { id: "firstOrderLinear", varName: "eqTrayFirstOrderLinear", label: "dy/dx = 3y", tray: 1, home: { x: 110, y: 64 }, tilt: -3 },
    { id: "plainLine", varName: "eqTrayPlainLine", label: "y = 3x + 1", tray: 0, home: { x: 280, y: 64 }, tilt: 2 },
    { id: "secondOrder", varName: "eqTraySecondOrder", label: "d²y/dx² + y = 0", tray: 2, home: { x: 450, y: 64 }, tilt: -2 },
    { id: "squaredDerivative", varName: "eqTraySquaredDerivative", label: "(dy/dx)² = y", tray: 1, home: { x: 110, y: 112 }, tilt: 3 },
    { id: "circle", varName: "eqTrayCircle", label: "x² + y² = 25", tray: 0, home: { x: 280, y: 112 }, tilt: -2 },
    { id: "fallingObject", varName: "eqTrayFallingObject", label: "d²s/dt² = −g", tray: 2, home: { x: 450, y: 112 }, tilt: 2 },
];

const TRAYS = [
    { index: 0, label: "no derivative", cx: 110 },
    { index: 1, label: "first order", cx: 280 },
    { index: 2, label: "second order", cx: 450 },
];

// ── View geometry ────────────────────────────────────────────────────────────

const VIEW_WIDTH = 560;
const VIEW_HEIGHT = 410;

const CARD_WIDTH = 150;
const CARD_HEIGHT = 32;

const TRAY_TOP = 226;
const TRAY_BOTTOM = 378;
const TRAY_HALF = 80;
const SLOT_TOP = 246;
const SLOT_STEP = 36;
const MAX_IN_TRAY = 4;

const INK = "#334155";
const INK_STRUCTURE = "#64748B";
const INK_QUIET = "#CBD5E1";
const ACCENT = "#62D0AD";
const AMBER = "#F7B23B";
const PAPER = "#FFFFFF";

const EASE_150 = { transition: "opacity 150ms ease, stroke-width 150ms ease" } as const;

const useHighlightState = () => {
    const highlight = useVar<string>("definitionHighlight", "");
    const setVar = useSetVar();
    return {
        opacity: (id: string) => (highlight && highlight !== id ? 0.35 : 1),
        weight: (id: string, resting: number) => (highlight === id ? resting * 1.6 : resting),
        isActive: (id: string) => highlight === id,
        hoverProps: (id: string) => ({
            onPointerEnter: () => setVar("definitionHighlight", id),
            onPointerLeave: () => setVar("definitionHighlight", ""),
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

function EquationSortingDrawing() {
    const setVar = useSetVar();
    const trayFirstOrderLinear = useVar<number>("eqTrayFirstOrderLinear", -1);
    const trayPlainLine = useVar<number>("eqTrayPlainLine", -1);
    const traySecondOrder = useVar<number>("eqTraySecondOrder", -1);
    const traySquaredDerivative = useVar<number>("eqTraySquaredDerivative", -1);
    const trayCircle = useVar<number>("eqTrayCircle", -1);
    const trayFallingObject = useVar<number>("eqTrayFallingObject", -1);
    const placements = [
        trayFirstOrderLinear,
        trayPlainLine,
        traySecondOrder,
        traySquaredDerivative,
        trayCircle,
        trayFallingObject,
    ];
    const { opacity, weight, isActive, hoverProps } = useHighlightState();

    const [dragId, setDragId] = useState<string | null>(null);
    const [dragPos, setDragPos] = useState<Vec2>({ x: 0, y: 0 });
    const dragIdRef = useRef<string | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const trayOf = (index: number) => placements[index];

    /** Where a placed card sits: the nth free shelf of its tray. */
    const slotPosition = (index: number): Vec2 => {
        const tray = trayOf(index);
        const cx = TRAYS[tray]?.cx ?? 280;
        const before = placements.filter((value, other) => other < index && value === tray).length;
        return { x: cx, y: SLOT_TOP + Math.min(before, MAX_IN_TRAY - 1) * SLOT_STEP };
    };

    const positionOf = (index: number): Vec2 => {
        if (dragId === EQUATION_CARDS[index].id) return dragPos;
        return trayOf(index) >= 0 ? slotPosition(index) : EQUATION_CARDS[index].home;
    };

    const handleDown = (card: EquationCard, index: number) => (event: React.PointerEvent<SVGRectElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragIdRef.current = card.id;
        setDragId(card.id);
        setDragPos(positionOf(index));
        if (trayOf(index) >= 0) setVar(card.varName, -1);
    };

    const handleMove = (card: EquationCard) => (event: React.PointerEvent<SVGRectElement>) => {
        if (dragIdRef.current !== card.id) return;
        setDragPos(svgPointFromEvent(event, svgRef.current));
    };

    const handleUp = (card: EquationCard) => () => {
        if (dragIdRef.current !== card.id) return;
        const target = TRAYS.find(
            (tray) =>
                Math.abs(dragPos.x - tray.cx) <= TRAY_HALF + 12 &&
                dragPos.y >= TRAY_TOP - 18 &&
                dragPos.y <= TRAY_BOTTOM + 18,
        );
        if (target) {
            const occupancy = placements.filter((value) => value === target.index).length;
            if (occupancy < MAX_IN_TRAY) setVar(card.varName, target.index);
        }
        dragIdRef.current = null;
        setDragId(null);
    };

    const correctCount = placements.filter((value, index) => value === EQUATION_CARDS[index].tray).length;
    const allHome = correctCount === EQUATION_CARDS.length;

    const renderCard = (card: EquationCard, index: number) => {
        const position = positionOf(index);
        const tray = trayOf(index);
        const dragging = dragId === card.id;
        const settled = tray >= 0 && !dragging;
        const right = settled && tray === card.tray;
        const wrong = settled && tray !== card.tray;
        const groupId = card.tray >= 1 ? "derivatives" : "plain";
        return (
            <g
                key={card.id}
                {...hoverProps(groupId)}
                opacity={opacity(groupId)}
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) rotate(${settled || dragging ? 0 : card.tilt}deg)`,
                    transition: dragging ? "none" : "transform 180ms ease-out, opacity 150ms ease",
                }}
            >
                {isActive(groupId) && (
                    <rect
                        x={-CARD_WIDTH / 2 - 4}
                        y={-CARD_HEIGHT / 2 - 4}
                        width={CARD_WIDTH + 8}
                        height={CARD_HEIGHT + 8}
                        rx="10"
                        fill={ACCENT}
                        opacity={0.28}
                    />
                )}
                <rect
                    x={-CARD_WIDTH / 2}
                    y={-CARD_HEIGHT / 2}
                    width={CARD_WIDTH}
                    height={CARD_HEIGHT}
                    rx="6"
                    fill={right ? ACCENT : PAPER}
                    stroke={right ? ACCENT : wrong ? AMBER : INK_STRUCTURE}
                    strokeWidth={weight(groupId, right || wrong ? 2 : 1.5)}
                    filter="url(#sorting-card-shadow)"
                    style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
                    onPointerDown={handleDown(card, index)}
                    onPointerMove={handleMove(card)}
                    onPointerUp={handleUp(card)}
                    onPointerCancel={handleUp(card)}
                />
                <text
                    x="0"
                    y="5"
                    fill={right ? PAPER : INK}
                    fontSize="14"
                    textAnchor="middle"
                    style={{ pointerEvents: "none" }}
                >
                    {card.label}
                </text>
            </g>
        );
    };

    const restingCards = EQUATION_CARDS.map((card, index) => (dragId === card.id ? null : renderCard(card, index)));
    const draggedIndex = EQUATION_CARDS.findIndex((card) => card.id === dragId);

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full select-none"
            role="img"
            aria-label="A pile of equation cards that can be dragged into three labelled trays"
        >
            <defs>
                <filter id="sorting-card-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.2" />
                </filter>
            </defs>

            {/* How the sorting is going. */}
            <text
                x={VIEW_WIDTH / 2}
                y="190"
                fill={allHome ? ACCENT : INK_STRUCTURE}
                fontSize="12"
                textAnchor="middle"
                opacity={opacity("__structure")}
                style={{ fontVariantNumeric: "tabular-nums", ...EASE_150 }}
            >
                {allHome ? "every card is home" : `${correctCount} of 6 in the right tray`}
            </text>

            {/* The three trays. */}
            <g {...hoverProps("trays")} opacity={opacity("trays")} style={EASE_150}>
                {TRAYS.map((tray) => (
                    <g key={tray.index}>
                        {isActive("trays") && (
                            <rect
                                x={tray.cx - TRAY_HALF - 4}
                                y={TRAY_TOP - 4}
                                width={TRAY_HALF * 2 + 8}
                                height={TRAY_BOTTOM - TRAY_TOP + 8}
                                rx="14"
                                fill={ACCENT}
                                opacity={0.28}
                            />
                        )}
                        <rect
                            x={tray.cx - TRAY_HALF}
                            y={TRAY_TOP}
                            width={TRAY_HALF * 2}
                            height={TRAY_BOTTOM - TRAY_TOP}
                            rx="10"
                            fill="#F8FAFC"
                            stroke={INK_QUIET}
                            strokeWidth={weight("trays", 1.5)}
                            strokeDasharray="6 5"
                        />
                        <text x={tray.cx} y="218" fill={INK} fontSize="12" textAnchor="middle">
                            {tray.label}
                        </text>
                    </g>
                ))}
            </g>

            {restingCards}
            {draggedIndex >= 0 && renderCard(EQUATION_CARDS[draggedIndex], draggedIndex)}
        </svg>
    );
}

function EquationSortingFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="definition-sorting-trays"
            onReset={() => {
                EQUATION_CARDS.forEach((card) => setVar(card.varName, -1));
                setVar("definitionHighlight", "");
            }}
            caption="Six equations, three trays. A card turns teal when it lands where it belongs, and amber when it does not, so drag it back out and try another tray."
        >
            <EquationSortingDrawing />
            <InteractionHintSequence
                hintKey="definition-sorting-drag"
                steps={[
                    {
                        gesture: "drag",
                        label: "Drag an equation down into a tray",
                        position: { x: "20%", y: "16%" },
                        dragPath: { type: "line", startOffset: { x: 0, y: 0 }, endOffset: { x: 10, y: 70 } },
                    },
                ]}
            />
        </Figure>
    );
}

export const whatIsADifferentialEquationBlocks: ReactElement[] = [
    <StackLayout key="layout-definition-heading" maxWidth="xl">
        <Block id="definition-heading" padding="md">
            <EditableH2 id="h2-definition-heading" blockId="definition-heading">
                What Makes It a Differential Equation
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-definition-setup" maxWidth="xl">
        <Block id="definition-setup" padding="sm">
            <EditableParagraph id="para-definition-setup" blockId="definition-setup">
                Strip away the story and these are easy to spot: any equation with{" "}
                <InlineLinkedHighlight
                    varName="definitionHighlight"
                    highlightId="derivatives"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("definitionHighlight"))}
                >
                    a derivative in it
                </InlineLinkedHighlight>
                . What changes is which derivative turns up, and how far you must differentiate to
                reach it.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-definition-examples" maxWidth="xl">
        <Block id="definition-examples" padding="lg">
            <FormulaBlock latex="\frac{dy}{dx} = 3y \qquad \frac{d^2y}{dx^2} + y = 0" />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-definition-invite" maxWidth="xl">
        <Block id="definition-invite" padding="sm">
            <EditableParagraph id="para-definition-invite" blockId="definition-invite">
                Six equations sit in a pile below. Drag each one into the tray you think it belongs
                in, and the tray will tell you straight away whether it is home.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-definition-visual" maxWidth="xl">
        <Block id="definition-visual" padding="sm" hasVisualization>
            <EquationSortingFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-definition-reflection" maxWidth="xl">
        <Block id="definition-reflection" padding="sm">
            <EditableParagraph id="para-definition-reflection" blockId="definition-reflection">
                That highest derivative is called the order. Our cooling rule stops at a first
                derivative, so it is first order, and everything here stays there. Quantities
                depending on several things at once need partial derivatives instead.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-definition-question-third" maxWidth="xl">
        <Block id="definition-question-third" padding="md">
            <EditableParagraph id="para-definition-question-third" blockId="definition-question-third">
                A new equation arrives: d³y/dx³ + 2y = x. Its order is{" "}
                <InlineFeedback
                    varName="answerThirdOrder"
                    correctValue={["3", "three", "third"]}
                    position="terminal"
                    successMessage="— yes, you would differentiate three times to reach that top term"
                    failureMessage="— not quite."
                    hint="Look for the highest derivative and count the differentiations it took"
                >
                    <InlineClozeInput
                        varName="answerThirdOrder"
                        correctAnswer={["3", "three", "third"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerThirdOrder"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-definition-question-cubed" maxWidth="xl">
        <Block id="definition-question-cubed" padding="md">
            <EditableParagraph id="para-definition-question-cubed" blockId="definition-question-cubed">
                Now a trickier one: (dy/dx)³ = y + 1. Its order is{" "}
                <InlineFeedback
                    varName="answerCubedDerivative"
                    correctValue={["1", "one", "first"]}
                    position="terminal"
                    successMessage="— exactly: cubing a first derivative never turns it into a third one"
                    failureMessage="— that is the power, not the order."
                    hint="Order counts how many times you differentiate, never how high the power is"
                    visualizationHint={{
                        blockId: "definition-visual",
                        hintKey: "feedback-cubed-order-hint",
                        steps: [
                            {
                                gesture: "drag",
                                label: "Find the card with the squared derivative and drop it into the first order tray",
                                position: { x: "20%", y: "27%" },
                                completionVar: "eqTraySquaredDerivative",
                                completionValue: 1,
                                completionTolerance: 0.4,
                            },
                        ],
                        label: "Discover it yourself",
                        resetVars: {
                            eqTrayFirstOrderLinear: -1,
                            eqTrayPlainLine: -1,
                            eqTraySecondOrder: -1,
                            eqTraySquaredDerivative: -1,
                            eqTrayCircle: -1,
                            eqTrayFallingObject: -1,
                        },
                    }}
                >
                    <InlineClozeInput
                        varName="answerCubedDerivative"
                        correctAnswer={["1", "one", "first"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerCubedDerivative"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
