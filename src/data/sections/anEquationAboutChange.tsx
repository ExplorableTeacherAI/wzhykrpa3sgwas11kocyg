import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { FormulaBlock } from "@/components/molecules";
import { VisualOptionCards } from "@/components/organisms";

export const anEquationAboutChangeBlocks: ReactElement[] = [
    <StackLayout key="layout-rate-rule-heading" maxWidth="xl">
        <Block id="rate-rule-heading" padding="md">
            <EditableH2 id="h2-rate-rule-heading" blockId="rate-rule-heading">
                An Equation About How Fast Things Change
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-rule-setup" maxWidth="xl">
        <Block id="rate-rule-setup" padding="sm">
            <EditableParagraph id="para-rate-rule-setup" blockId="rate-rule-setup">
                A hot drink loses heat quickly at first and then more and more slowly. Written as a
                rule, that says the cooling speed is proportional to how far the drink sits above the
                room. The left side below is not a temperature at all; it is a speed, measured in
                degrees per minute.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-rule-formula" maxWidth="xl">
        <Block id="rate-rule-formula" padding="lg">
            <FormulaBlock latex="\frac{dT}{dt} = -k\,(T - 20)" />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-rule-visual" maxWidth="xl">
        <Block id="rate-rule-visual" padding="sm">
            <VisualOptionCards
                blockId="rate-rule-visual"
                intro="Pick the visual students will use to meet this idea."
                cards={[
                    {
                        id: "mug-with-cooling-arrow",
                        title: "A mug of hot chocolate with an arrow showing how fast it is cooling right now",
                        looks: "Imagine a mug on a desk in a room at 20 degrees, with a tall thermometer beside it. A downward arrow leaves the drink, long and heavy while the drink is hot, shrinking to almost nothing as the thermometer falls toward the room's mark.",
                        manipulate: "Slide the drink's level up and down the thermometer and watch the arrow stretch and shrink with it",
                        reveals: "The further the drink is above the room, the faster it cools, which is exactly what the equation says.",
                        paradigm: "conventional",
                        recommended: true,
                    },
                    {
                        id: "build-curve-from-arrows",
                        title: "A cooling curve built one minute at a time out of short slanted arrows",
                        looks: "Imagine an empty temperature graph holding a single dot at 90 degrees with a short slanted arrow leaving it. Each arrow added becomes the next piece of the curve, and the growing chain flattens out as it nears the room's line.",
                        manipulate: "Drag the tip of each arrow to the slope the rule asks for, one minute at a time, until the curve is complete",
                        reveals: "A rule about speed alone is enough to draw the whole cooling curve, with no formula for the temperature anywhere.",
                        paradigm: "constructivist",
                    },
                    {
                        id: "mug-and-timeline-pair",
                        title: "A mug beside a graph that draws its temperature as the minutes pass",
                        looks: "Imagine the mug on the left, its steam thinning as it cools, and beside it a graph of temperature against time with a dot riding the curve. The dot marks the exact moment the mug is showing, and the two always agree.",
                        manipulate: "Drag the dot forwards and backwards along the curve to move time, and watch the steam and thermometer follow",
                        reveals: "The steep part of the curve and the fast-cooling mug are the same fact seen two ways.",
                        paradigm: "temporal",
                        secondView: {
                            shows: "A graph of temperature against time with the current moment marked on the curve",
                            role: "complementary",
                            syncedBy: "coolingTime, plus a shared hover highlight linking the mug's thermometer to the curve's height",
                        },
                    },
                ]}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-rule-reflection" maxWidth="xl">
        <Block id="rate-rule-reflection" padding="sm">
            <EditableParagraph id="para-rate-rule-reflection" blockId="rate-rule-reflection">
                Notice what the equation never tells you: the temperature itself. It hands you the
                speed at this instant, and the temperature is whatever follows from obeying that
                speed, minute after minute.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
