import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { FormulaBlock } from "@/components/molecules";
import { VisualOptionCards } from "@/components/organisms";

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
                Strip away the story and one of these is easy to spot: it is any equation with a
                derivative in it. What changes from one to the next is which derivative turns up, and
                how many times you would have to differentiate to reach it.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-definition-examples" maxWidth="xl">
        <Block id="definition-examples" padding="lg">
            <FormulaBlock latex="\frac{dy}{dx} = 3y \qquad \frac{d^2y}{dx^2} + y = 0" />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-definition-visual" maxWidth="xl">
        <Block id="definition-visual" padding="sm">
            <VisualOptionCards
                blockId="definition-visual"
                intro="Pick the visual students will use to tell these apart."
                cards={[
                    {
                        id: "sort-into-trays",
                        title: "A loose pile of short equations and three labelled trays",
                        looks: "Imagine a scatter of small equation cards on the left and three open trays beside them, labelled no derivative, first order and second order. A card dropped into a tray settles flat and stays there, and the pile thins out as the trays fill.",
                        manipulate: "Drag each equation card into the tray where they think it belongs",
                        reveals: "Spotting a differential equation is just spotting a derivative, and the order is simply the highest one present.",
                        paradigm: "constructivist",
                        recommended: true,
                    },
                    {
                        id: "one-answer-versus-family",
                        title: "Two equations stacked, one with a derivative and one without, each with its own graph",
                        looks: "Imagine y = 3x + 1 written above dy/dx = 3, with a small graph beside each one holding a straight line. The top line is pinned in place, while the bottom graph keeps a faint stack of parallel lines behind whichever one is showing.",
                        manipulate: "Drag either line up and down and watch which equation still holds and which one breaks",
                        reveals: "An ordinary equation fixes one answer, while a differential equation fixes a whole family of them.",
                        paradigm: "comparison",
                        secondView: {
                            shows: "A graph beside each equation, the lower one carrying the faint family of parallel solutions",
                            role: "constraining",
                            syncedBy: "definitionLineShift, plus a shared hover highlight linking each equation to its own graph",
                        },
                    },
                    {
                        id: "guess-the-order",
                        title: "Three equations in a row with the word naming each one hidden under a flap",
                        looks: "Imagine three short equations side by side, one of them holding a squared derivative, each with a small covered strip underneath. A marker inside each strip can be set to none, first or second before the covers come off together.",
                        manipulate: "Set the marker under each equation to the order they expect, then lift all three covers",
                        reveals: "The order is decided by the highest derivative alone, so a squared dy/dx is still only first order.",
                        paradigm: "prediction",
                    },
                ]}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-definition-reflection" maxWidth="xl">
        <Block id="definition-reflection" padding="sm">
            <EditableParagraph id="para-definition-reflection" blockId="definition-reflection">
                That highest derivative is called the order. Our cooling rule stops at a first
                derivative, so it is a first order equation, and everything here stays there. Quantities
                that depend on several things at once need partial derivatives instead, which is a
                story for another day.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
