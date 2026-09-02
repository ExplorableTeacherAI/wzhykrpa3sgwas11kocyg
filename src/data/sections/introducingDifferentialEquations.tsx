import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH1, EditableParagraph, InlineTooltip } from "@/components/atoms";

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
                The equation that describes this is called a{" "}
                <InlineTooltip
                    id="tooltip-orientation-differential-equation"
                    tooltip="An equation containing a derivative. Instead of telling you a quantity, it tells you the speed at which that quantity is changing."
                >
                    differential equation
                </InlineTooltip>
                : instead of giving you the temperature, it gives you how fast the temperature is
                changing. By the end you will write one for that mug and use it to predict how warm
                the drink is later. If you can differentiate x² and e to the x, you have the only
                tool you need.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
