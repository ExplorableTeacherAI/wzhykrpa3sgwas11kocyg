import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";

export const wrappingUpBlocks: ReactElement[] = [
    <StackLayout key="layout-wrapping-up-heading" maxWidth="xl">
        <Block id="wrapping-up-heading" padding="md">
            <EditableH2 id="h2-wrapping-up-heading" blockId="wrapping-up-heading">
                Wrapping Up
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrapping-up-closing" maxWidth="xl">
        <Block id="wrapping-up-closing" padding="sm">
            <EditableParagraph id="para-wrapping-up-closing" blockId="wrapping-up-closing">
                So the mug never needed a formula for its temperature. It needed a rule for its speed,
                and the temperature followed from that. This is what a differential equation is: a
                statement about how fast something changes, whose answer is always a whole function
                rather than a single number.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrapping-up-onward" maxWidth="xl">
        <Block id="wrapping-up-onward" padding="sm">
            <EditableParagraph id="para-wrapping-up-onward" blockId="wrapping-up-onward">
                You wrote the cooling rule, tested a guess by differentiating it, and used the
                starting temperature to pick out the one curve belonging to your drink. Those same
                three moves describe a population growing, a drug leaving the bloodstream and a phone
                battery draining. Next comes the machinery for finding those functions without
                guessing, and it turns out to be integration wearing a new disguise.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
