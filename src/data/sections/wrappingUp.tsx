import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph, InlineFormula, InlineTooltip, Table } from "@/components/atoms";
import { QUANTITY } from "../lessonColors";

export const wrappingUpBlocks: ReactElement[] = [
    <StackLayout key="layout-wrapping-up-heading" maxWidth="xl">
        <Block id="wrapping-up-heading" padding="md">
            <EditableH2 id="h2-wrapping-up-heading" blockId="wrapping-up-heading">
                Synthesis: From Rate Law to Particular Solution
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrapping-up-closing" maxWidth="xl">
        <Block id="wrapping-up-closing" padding="sm">
            <EditableParagraph id="para-wrapping-up-closing" blockId="wrapping-up-closing">
                So the mug never needed a formula for its temperature. It needed a rule for its
                speed,{" "}
                <InlineFormula
                    latex="\frac{\clr{rate}{dT}}{\clr{time}{dt}} = -\clr{steepness}{k}\,(\clr{temperature}{T} - \clr{room}{20})"
                    colorMap={{
                        rate: QUANTITY.rate,
                        time: QUANTITY.time,
                        steepness: QUANTITY.steepness,
                        temperature: QUANTITY.temperature,
                        room: QUANTITY.room,
                    }}
                />
                , and the temperature followed from that. This is what a differential equation is: a
                statement about how fast something changes, whose answer is always a whole function
                rather than a single number.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-block-1788378037031" maxWidth="xl">
        <Block id="block-1788378037031" padding="sm">
            <Table
                columns={[
                    { header: "Differential equation", align: "left" },
                    { header: "Order", align: "center", width: 90 },
                    { header: "What it describes", align: "left" },
                ]}
                rows={[
                    {
                        cells: [
                            <InlineFormula
                                key="recap-growth-simple"
                                latex="\frac{\clr{derivative}{dy}}{\clr{derivative}{dx}} = 3y"
                                colorMap={{ derivative: QUANTITY.derivative }}
                            />,
                            "1",
                            "Growth proportional to the amount already there",
                        ],
                    },
                    {
                        cells: [
                            <InlineFormula
                                key="recap-squared-derivative"
                                latex="\left(\frac{\clr{derivative}{dy}}{\clr{derivative}{dx}}\right)^2 = y"
                                colorMap={{ derivative: QUANTITY.derivative }}
                            />,
                            "1",
                            "Still first order: squaring a derivative never raises the order",
                        ],
                    },
                    {
                        cells: [
                            <InlineFormula
                                key="recap-oscillation"
                                latex="\frac{\clr{derivative}{d^2y}}{\clr{derivative}{dx^2}} + y = 0"
                                colorMap={{ derivative: QUANTITY.derivative }}
                            />,
                            "2",
                            "Oscillation, reached only after differentiating twice",
                        ],
                    },
                    {
                        cells: [
                            <InlineFormula
                                key="recap-falling"
                                latex="\frac{\clr{derivative}{d^2s}}{\clr{derivative}{dt^2}} = -g"
                                colorMap={{ derivative: QUANTITY.derivative }}
                            />,
                            "2",
                            "A falling object, whose acceleration is fixed",
                        ],
                    },
                    {
                        cells: [
                            <InlineFormula
                                key="recap-cooling"
                                latex="\frac{\clr{rate}{dT}}{\clr{time}{dt}} = -\clr{steepness}{k}\,(\clr{temperature}{T} - \clr{room}{T}_{\clr{room}{room}})"
                                colorMap={{
                                    rate: QUANTITY.rate,
                                    time: QUANTITY.time,
                                    steepness: QUANTITY.steepness,
                                    temperature: QUANTITY.temperature,
                                    room: QUANTITY.room,
                                }}
                            />,
                            "1",
                            <span key="recap-cooling-solution">
                                Newton{"'"}s law of cooling, solved by{" "}
                                <InlineFormula
                                    latex="\clr{temperature}{T} = \clr{room}{T}_{\clr{room}{room}} + (\clr{temperature}{T_0} - \clr{room}{T}_{\clr{room}{room}})\,e^{-\clr{steepness}{k}\,\clr{time}{t}}"
                                    colorMap={{
                                        temperature: QUANTITY.temperature,
                                        room: QUANTITY.room,
                                        steepness: QUANTITY.steepness,
                                        time: QUANTITY.time,
                                    }}
                                />
                            </span>,
                        ],
                        highlight: true,
                        highlightColor: QUANTITY.temperature,
                    },
                    {
                        cells: [
                            <InlineFormula
                                key="recap-population"
                                latex="\frac{\clr{rate}{dP}}{\clr{time}{dt}} = \clr{steepness}{0.03}P"
                                colorMap={{
                                    rate: QUANTITY.rate,
                                    time: QUANTITY.time,
                                    steepness: QUANTITY.steepness,
                                }}
                            />,
                            "1",
                            <span key="recap-population-solution">
                                A colony growing, solved by{" "}
                                <InlineFormula
                                    latex="P = P_0\,e^{\clr{steepness}{0.03}\,\clr{time}{t}}"
                                    colorMap={{ steepness: QUANTITY.steepness, time: QUANTITY.time }}
                                />
                            </span>,
                        ],
                    },
                ]}
                color={QUANTITY.derivative}
                caption="Every equation met in this lesson. The order is how many times you differentiate to reach the highest derivative, never the power it is raised to."
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-block-1788378188195" maxWidth="xl">
        <Block id="block-1788378188195" padding="sm">
            <EditableParagraph id="para-block-1788378188195" blockId="block-1788378188195">
                One step in every one of those checks is easy to trip over. The room temperature is a{" "}
                <InlineTooltip
                    id="tooltip-wrapping-up-constant"
                    tooltip="A constant does not change with the variable you are differentiating with respect to, so its graph is a flat line and its derivative is zero everywhere."
                >
                    constant
                </InlineTooltip>
                , and{" "}
                <InlineFormula
                    latex="\frac{d}{\clr{time}{dt}}(\clr{room}{20}) = 0"
                    colorMap={{ time: QUANTITY.time, room: QUANTITY.room }}
                />
                , not 20 and not 1. A number that never moves has no rate of change, so differentiating{" "}
                <InlineFormula
                    latex="\clr{temperature}{T} = \clr{room}{20} + \clr{temperature}{70}\,e^{-\clr{steepness}{0.05}\,\clr{time}{t}}"
                    colorMap={{
                        temperature: QUANTITY.temperature,
                        room: QUANTITY.room,
                        steepness: QUANTITY.steepness,
                        time: QUANTITY.time,
                    }}
                />{" "}
                leaves the exponential term alone. That is why the room sits inside the bracket of the
                rule and never on its left-hand side.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrapping-up-onward" maxWidth="xl">
        <Block id="wrapping-up-onward" padding="sm">
            <EditableParagraph id="para-wrapping-up-onward" blockId="wrapping-up-onward">
                You wrote the cooling rule, tested a guess by differentiating it, and used the
                starting temperature to pick out the one curve belonging to your drink. Those same
                three moves describe a population growing, a drug leaving the bloodstream and a phone
                battery draining. Next comes the machinery for finding those
                functions without guessing: integration in a new disguise.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
