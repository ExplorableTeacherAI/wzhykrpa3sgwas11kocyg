import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { FormulaBlock } from "@/components/molecules";
import { VisualOptionCards } from "@/components/organisms";

export const coolingMugApplicationBlocks: ReactElement[] = [
    <StackLayout key="layout-cooling-application-heading" maxWidth="xl">
        <Block id="cooling-application-heading" padding="md">
            <EditableH2 id="h2-cooling-application-heading" blockId="cooling-application-heading">
                Cooling a Mug: Setting Up and Solving
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cooling-application-setup" maxWidth="xl">
        <Block id="cooling-application-setup" padding="sm">
            <EditableParagraph id="para-cooling-application-setup" blockId="cooling-application-setup">
                Now the whole thing on one real mug, start to finish. A drink poured at 90 degrees
                into a 20-degree room, cooling with k = 0.05, needs only three numbers before its
                curve is completely decided.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cooling-application-formula" maxWidth="xl">
        <Block id="cooling-application-formula" padding="lg">
            <FormulaBlock latex="T = T_{room} + (T_0 - T_{room})\,e^{-kt}" />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cooling-application-visual" maxWidth="xl">
        <Block id="cooling-application-visual" padding="sm">
            <VisualOptionCards
                blockId="cooling-application-visual"
                intro="Pick the visual students will use to set up and read the real mug."
                cards={[
                    {
                        id: "predict-twenty-minute-temperature",
                        title: "A cooling curve with everything after ten minutes hidden behind a panel",
                        looks: "Imagine the mug's cooling curve drawn from 90 degrees, with a grey panel covering the graph from ten minutes onward. A marker sits on the panel's edge at the twenty-minute line, free to slide up and down the temperature scale.",
                        manipulate: "Drag the marker to the temperature they expect at twenty minutes, then lift the panel to uncover the real curve",
                        reveals: "The drink is still around 46 degrees after twenty minutes, far hotter than nearly everyone guesses.",
                        paradigm: "prediction",
                        recommended: true,
                    },
                    {
                        id: "fill-the-equation-from-the-mug",
                        title: "An equation with three empty slots beside the mug the numbers come from",
                        looks: "Imagine the cooling equation written with three blank slots, and next to it a mug carrying a thermometer, a room dial and a stopwatch. Numbers lift out of the mug and drop into the slots, and the curve only appears beneath once all three are filled.",
                        manipulate: "Drag the starting temperature, the room temperature and the cooling rate out of the mug and into the slots of the equation",
                        reveals: "Setting up a differential equation is just reading three numbers off the real situation in front of you.",
                        paradigm: "constructivist",
                    },
                    {
                        id: "mug-versus-flask",
                        title: "A paper cup and a metal flask cooling side by side on one desk",
                        looks: "Imagine two containers of the same drink on a desk, each with its own thermometer, and beside them a single graph carrying both curves in matching colours. The flask's curve sags far more gently than the cup's, though both bend toward the same room line.",
                        manipulate: "Press the lid down or lift it off either container to change how well it holds heat, and watch that curve swing while the other holds still",
                        reveals: "Same equation, different k: the shape of the curve never changes, only how quickly it flattens.",
                        paradigm: "comparison",
                        secondView: {
                            shows: "One graph carrying both containers' cooling curves against the same time axis",
                            role: "complementary",
                            syncedBy: "cupRate and flaskRate, plus a shared hover highlight linking each container to its own curve",
                        },
                    },
                ]}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cooling-application-reflection" maxWidth="xl">
        <Block id="cooling-application-reflection" padding="sm">
            <EditableParagraph id="para-cooling-application-reflection" blockId="cooling-application-reflection">
                Read the curve at twenty minutes and the drink is about 46 degrees, still too hot to
                gulp. The same three moves work for anything that grows or decays: write the rate
                rule, fit the starting value, then read off whichever moment you care about.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
