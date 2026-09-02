import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH1, EditableParagraph, InlineFormula, InlineTooltip } from "@/components/atoms";
import { QUANTITY } from "../lessonColors";

export const introducingDifferentialEquationsBlocks: ReactElement[] = [
    <StackLayout key="layout-orientation-title" maxWidth="xl">
        <Block id="orientation-title" padding="md">
            <EditableH1 id="h1-orientation-title" blockId="orientation-title">
                Differential Equations
            </EditableH1>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-orientation-hook" maxWidth="xl">
        <Block id="orientation-hook" padding="sm">
            <EditableParagraph id="para-orientation-hook" blockId="orientation-hook">
                Leave a mug of hot chocolate on your desk and walk away. Come back twenty minutes
                later and it is cooler, but nowhere near cold. Something decided exactly how fast it
                cooled, and it was not the clock.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-orientation-promise" maxWidth="xl">
        <Block id="orientation-promise" padding="sm">
            <EditableParagraph id="para-orientation-promise" blockId="orientation-promise">
                An ordinary equation like{" "}
                <InlineFormula
                    latex="\clr{temperature}{T} = 65"
                    colorMap={{ temperature: QUANTITY.temperature }}
                />{" "}
                hands you a number. A{" "}
                <InlineTooltip
                    id="tooltip-orientation-differential-equation"
                    tooltip="An equation containing a derivative of the unknown function. Its solution is not a number but a function: one whose derivative satisfies the equation at every value of the variable."
                >
                    differential equation
                </InlineTooltip>{" "}
                hands you a rule instead, written with the derivative{" "}
                <InlineFormula
                    latex="\frac{\clr{rate}{dT}}{\clr{time}{dt}}"
                    colorMap={{ rate: QUANTITY.rate, time: QUANTITY.time }}
                />
                : how fast the temperature is changing at each moment. Solving it means finding a
                whole function, a temperature for every instant, whose derivative obeys that rule. If
                you can differentiate x² and e to the x you can already test one, and by the end you
                will write the mug's rule and predict its temperature.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
