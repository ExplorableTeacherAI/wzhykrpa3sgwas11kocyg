import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { FormulaBlock } from "@/components/molecules";
import { VisualOptionCards } from "@/components/organisms";

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

    <StackLayout key="layout-guess-and-check-visual" maxWidth="xl">
        <Block id="guess-and-check-visual" padding="sm">
            <VisualOptionCards
                blockId="guess-and-check-visual"
                intro="Pick the visual students will use to test a guessed solution."
                cards={[
                    {
                        id: "match-the-slope-arrows",
                        title: "A field of short slanted arrows with one curve laid across them",
                        looks: "Imagine a graph sprinkled with short slanted arrows, each showing the direction the rule demands at that spot. A single teal curve runs across the field, and every arrow it touches turns green where the curve agrees with it and stays grey where it does not.",
                        manipulate: "Pull the curve's starting height up or down and pull its tail flatter or steeper until every arrow it crosses turns green",
                        reveals: "A solution is not a number but a curve that agrees with the rule at every single point along it.",
                        paradigm: "goal",
                        recommended: true,
                    },
                    {
                        id: "family-of-cooling-curves",
                        title: "Several cooling curves from one rule, each starting at a different temperature",
                        looks: "Imagine one graph carrying a fan of curves, all bending toward the same room line, each with a draggable dot sitting at its own starting temperature. The curves never touch, and the gaps between them shrink as time runs on.",
                        manipulate: "Drag any curve's starting dot up or down the temperature axis and watch that whole curve reshape while the others hold still",
                        reveals: "One rule produces a whole family of curves, and the starting temperature is what picks out the one belonging to your drink.",
                        paradigm: "comparison",
                    },
                    {
                        id: "live-derivative-checker",
                        title: "A guessed formula with its derivative worked out live underneath",
                        looks: "Imagine the guessed formula written large with its numbers as grabbable handles, and beneath it the derivative rewriting itself as those numbers move, sitting next to the rule it is supposed to equal. The two lines snap to the same colour the moment they agree.",
                        manipulate: "Drag the numbers inside the guessed formula and watch the derivative underneath rewrite itself until it matches the rule",
                        reveals: "Differentiating your own guess is all it takes to know whether it really solves the equation.",
                        paradigm: "inversion",
                    },
                ]}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-guess-and-check-reflection" maxWidth="xl">
        <Block id="guess-and-check-reflection" padding="sm">
            <EditableParagraph id="para-guess-and-check-reflection" blockId="guess-and-check-reflection">
                Differentiating the guess gives exactly minus 0.05 times the gap to the room, which is
                the rule we wrote. Swap the 70 for another number and the guess still works; swap the
                0.05 and it fails. That 70 is the starting gap, and it is what makes your mug
                different from mine.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
