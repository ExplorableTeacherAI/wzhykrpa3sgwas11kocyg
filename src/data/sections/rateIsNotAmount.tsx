import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

export const rateIsNotAmountBlocks: ReactElement[] = [
    <StackLayout key="layout-rate-versus-amount-heading" maxWidth="xl">
        <Block id="rate-versus-amount-heading" padding="md">
            <EditableH2 id="h2-rate-versus-amount-heading" blockId="rate-versus-amount-heading">
                Rate Is Not Amount
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-versus-amount-setup" maxWidth="xl">
        <Block id="rate-versus-amount-setup" padding="sm">
            <EditableParagraph id="para-rate-versus-amount-setup" blockId="rate-versus-amount-setup">
                Here is where it is easy to slip. The temperature of the drink and the speed it is
                cooling are two different numbers, and they do not stay in step. Halfway down to room
                temperature the drink is still a warm 55 degrees, yet it is cooling at only half the
                speed it started with.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-versus-amount-visual" maxWidth="xl">
        <Block id="rate-versus-amount-visual" padding="sm">
            <VisualOptionCards
                blockId="rate-versus-amount-visual"
                intro="Pick the visual that will pull these two ideas apart for students."
                cards={[
                    {
                        id: "guess-the-cooling-speed",
                        title: "Two bars beside the mug: how warm the drink is, and how fast it is cooling",
                        looks: "Imagine the mug with two tall bars next to it, one filling to show how warm the drink is and one showing how fast it is cooling this second. A faint marker sits on the second bar, waiting to be placed before the clock is allowed to run.",
                        manipulate: "Drag the faint marker to the cooling speed they expect once the drink is halfway down to room temperature, then start the clock",
                        reveals: "At half the gap to the room the drink cools at exactly half the speed, even though it still feels hot.",
                        targetsMisconception: "Students mix up how fast something changes with how much of it there is",
                        paradigm: "prediction",
                        recommended: true,
                    },
                    {
                        id: "stacked-temperature-and-speed",
                        title: "A falling temperature graph with the cooling speed graphed directly beneath it",
                        looks: "Imagine a temperature curve on top with a dot the student can slide along it, and below it, sharing the same time axis, a second curve for how fast the drink is cooling with its own dot. Sliding either dot slides both.",
                        manipulate: "Drag the dot along the temperature curve and watch the dot below fall away from it at a completely different pace",
                        reveals: "The two curves fall together but never match: one heads for room temperature, the other heads for zero.",
                        targetsMisconception: "Students mix up how fast something changes with how much of it there is",
                        paradigm: "comparison",
                        secondView: {
                            shows: "A graph of cooling speed against the same time axis, directly beneath the temperature graph",
                            role: "complementary",
                            syncedBy: "coolingTime, plus a shared hover highlight linking the two dots",
                        },
                    },
                    {
                        id: "hit-the-ten-minute-target",
                        title: "A cooling curve that must be made to pass through a target at ten minutes",
                        looks: "Imagine the graph of the cooling drink with a small target ring drawn at the ten-minute line, and a dial on the desk for the room's temperature. The curve swings up and down as the room changes, sometimes threading the ring and sometimes missing it.",
                        manipulate: "Turn the room-temperature dial until the cooling curve passes through the target ring",
                        reveals: "Only the gap between drink and room sets the speed, so a cooler room changes the whole curve.",
                        paradigm: "goal",
                    },
                ]}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rate-versus-amount-reflection" maxWidth="xl">
        <Block id="rate-versus-amount-reflection" padding="sm">
            <EditableParagraph id="para-rate-versus-amount-reflection" blockId="rate-versus-amount-reflection">
                So a high temperature does not mean a high rate, and a small rate does not mean a cold
                drink. The rate depends on the gap to the room, never on the temperature by itself.
                What sort of function could possibly keep both of those true at once?
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
