/**
 * Variables Configuration
 * =======================
 * 
 * CENTRAL PLACE TO DEFINE ALL SHARED VARIABLES
 * 
 * This file defines all variables that can be shared across sections.
 * AI agents should read this file to understand what variables are available.
 * 
 * USAGE:
 * 1. Define variables here with their default values and metadata
 * 2. Use them in any section with: const x = useVar('variableName', defaultValue)
 * 3. Update them with: setVar('variableName', newValue)
 */

import { type VarValue } from '@/stores';

/**
 * Variable definition with metadata
 */
export interface VariableDefinition {
    /** Default value */
    defaultValue: VarValue;
    /** Human-readable label */
    label?: string;
    /** Description for AI agents */
    description?: string;
    /** Variable type hint */
    type?: 'number' | 'text' | 'boolean' | 'select' | 'array' | 'object' | 'spotColor' | 'linkedHighlight';
    /** Unit (e.g., 'Hz', '°', 'm/s') - for numbers */
    unit?: string;
    /** Minimum value (for number sliders) */
    min?: number;
    /** Maximum value (for number sliders) */
    max?: number;
    /** Step increment (for number sliders) */
    step?: number;
    /** Display color for InlineScrubbleNumber / InlineSpotColor (e.g. '#D81B60') */
    color?: string;
    /** Options for 'select' type variables */
    options?: string[];
    /** Placeholder text for text inputs */
    placeholder?: string;
    /**
     * Correct answer for cloze input validation.
     * Accepts a single string, pipe-separated alternates (e.g. "first | 1 | 1st"),
     * or an array of accepted answers (e.g. ["first", "1", "1st"]).
     */
    correctAnswer?: string | string[];
    /** Whether cloze matching is case sensitive */
    caseSensitive?: boolean;
    /** Background color for inline components */
    bgColor?: string;
    /** Schema hint for object types (for AI agents) */
    schema?: string;
}

/**
 * =====================================================
 * 🎯 DEFINE YOUR VARIABLES HERE
 * =====================================================
 * 
 * SUPPORTED TYPES:
 * 
 * 1. NUMBER (slider):
 *    { defaultValue: 5, type: 'number', min: 0, max: 10, step: 1 }
 * 
 * 2. TEXT (free text):
 *    { defaultValue: 'Hello', type: 'text', placeholder: 'Enter text...' }
 * 
 * 3. SELECT (dropdown):
 *    { defaultValue: 'sine', type: 'select', options: ['sine', 'cosine', 'tangent'] }
 * 
 * 4. BOOLEAN (toggle):
 *    { defaultValue: true, type: 'boolean' }
 * 
 * 5. ARRAY (list of numbers):
 *    { defaultValue: [1, 2, 3], type: 'array' }
 * 
 * 6. OBJECT (complex data):
 *    { defaultValue: { x: 5, y: 10 }, type: 'object', schema: '{ x: number, y: number }' }
 */
export const variableDefinitions: Record<string, VariableDefinition> = {
    // ─────────────────────────────────────────
    // WHAT MAKES IT A DIFFERENTIAL EQUATION — the sorting trays
    // ─────────────────────────────────────────
    eqTrayFirstOrderLinear: {
        defaultValue: -1,
        type: 'number',
        label: 'Tray of dy/dx = 3y',
        description: 'Which tray the "dy/dx = 3y" card sits in: -1 pile, 0 none, 1 first order, 2 second order',
        min: -1,
        max: 2,
        step: 1,
    },
    eqTrayPlainLine: {
        defaultValue: -1,
        type: 'number',
        label: 'Tray of y = 3x + 1',
        description: 'Which tray the "y = 3x + 1" card sits in: -1 pile, 0 none, 1 first order, 2 second order',
        min: -1,
        max: 2,
        step: 1,
    },
    eqTraySecondOrder: {
        defaultValue: -1,
        type: 'number',
        label: 'Tray of d2y/dx2 + y = 0',
        description: 'Which tray the "d2y/dx2 + y = 0" card sits in: -1 pile, 0 none, 1 first order, 2 second order',
        min: -1,
        max: 2,
        step: 1,
    },
    eqTraySquaredDerivative: {
        defaultValue: -1,
        type: 'number',
        label: 'Tray of (dy/dx)2 = y',
        description: 'Which tray the "(dy/dx)2 = y" card sits in: -1 pile, 0 none, 1 first order, 2 second order',
        min: -1,
        max: 2,
        step: 1,
    },
    eqTrayCircle: {
        defaultValue: -1,
        type: 'number',
        label: 'Tray of x2 + y2 = 25',
        description: 'Which tray the "x2 + y2 = 25" card sits in: -1 pile, 0 none, 1 first order, 2 second order',
        min: -1,
        max: 2,
        step: 1,
    },
    eqTrayFallingObject: {
        defaultValue: -1,
        type: 'number',
        label: 'Tray of d2s/dt2 = -g',
        description: 'Which tray the "d2s/dt2 = -g" card sits in: -1 pile, 0 none, 1 first order, 2 second order',
        min: -1,
        max: 2,
        step: 1,
    },
    definitionHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Definition view highlight',
        description: "What is highlighted in the sorting figure: '' | 'derivatives' | 'trays'",
        color: '#3FA98A',
        bgColor: 'rgba(98, 208, 173, 0.22)',
    },

    // ─────────────────────────────────────────
    // ASSESSMENT — What Makes It a Differential Equation
    // ─────────────────────────────────────────
    answerThirdOrder: {
        defaultValue: '',
        type: 'text',
        label: 'Order of a third derivative equation',
        description: 'Student answer: the order of d3y/dx3 + 2y = x',
        placeholder: '???',
        correctAnswer: ['3', 'three', 'third'],
        color: '#8E90F5',
    },
    answerCubedDerivative: {
        defaultValue: '',
        type: 'text',
        label: 'Order of a cubed first derivative',
        description: 'Student answer: the order of (dy/dx)3 = y + 1',
        placeholder: '???',
        correctAnswer: ['1', 'one', 'first'],
        color: '#8E90F5',
    },

    // ─────────────────────────────────────────
    // COOLING MUG — shared by the linked pair
    // ─────────────────────────────────────────
    coolingTime: {
        defaultValue: 8,
        type: 'number',
        label: 'Time',
        description: 'Minutes since the drink was poured; shared by the mug and the graph',
        unit: 'min',
        min: 0,
        max: 40,
        step: 0.5,
        color: '#62D0AD',
    },
    coolingViewHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Cooling view highlight',
        description: "Which quantity is highlighted across both cooling views: '' | 'temperature' | 'time'",
        color: '#3FA98A',
        bgColor: 'rgba(98, 208, 173, 0.22)',
    },
    coolingPlaying: {
        defaultValue: false,
        type: 'boolean',
        label: 'Cooling sweep playing',
        description: 'Whether the shared cooling clock is running automatically',
    },

    // ─────────────────────────────────────────
    // RATE IS NOT AMOUNT — the prediction figure
    // ─────────────────────────────────────────
    mugTemp: {
        defaultValue: 90,
        type: 'number',
        label: 'Drink temperature',
        description: 'Current temperature of the drink in the two-bar prediction figure',
        unit: '°C',
        min: 25,
        max: 90,
        step: 0.5,
        color: '#62D0AD',
    },
    predictedSpeed: {
        defaultValue: 3.5,
        type: 'number',
        label: 'Predicted cooling speed',
        description: 'Where the student places the faint marker before the clock runs',
        unit: '°/min',
        min: 0,
        max: 3.5,
        step: 0.05,
        color: '#94A3B8',
    },
    ratePredictionRevealed: {
        defaultValue: false,
        type: 'boolean',
        label: 'Prediction revealed',
        description: 'Whether the drink has been cooled to halfway and the true speed shown',
    },
    ratePlaying: {
        defaultValue: false,
        type: 'boolean',
        label: 'Cooling run playing',
        description: 'Whether the drink is currently cooling in the prediction figure',
    },
    rateViewHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Rate view highlight',
        description: "Which quantity is highlighted in the two-bar figure: '' | 'warmth' | 'gap'",
        color: '#3FA98A',
        bgColor: 'rgba(98, 208, 173, 0.22)',
    },

    // ─────────────────────────────────────────
    // GUESS AND CHECK — the slope-field figure
    // ─────────────────────────────────────────
    guessStartGap: {
        defaultValue: 40,
        type: 'number',
        label: 'Starting gap',
        description: 'How far above the room the guessed curve starts, the A in 20 + A e^(-kt)',
        unit: '°C',
        min: 10,
        max: 70,
        step: 0.5,
        color: '#62D0AD',
    },
    guessK: {
        defaultValue: 0.09,
        type: 'number',
        label: 'Steepness',
        description: 'The k inside the guessed curve; the arrows only agree when it equals 0.05',
        min: 0.01,
        max: 0.15,
        step: 0.001,
        color: '#62D0AD',
    },
    guessViewHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Guess view highlight',
        description: "What is highlighted in the slope-field figure: '' | 'curve' | 'field'",
        color: '#3FA98A',
        bgColor: 'rgba(98, 208, 173, 0.22)',
    },

    // ─────────────────────────────────────────
    // COOLING A MUG — the set-up figure
    // ─────────────────────────────────────────
    setupStartFilled: {
        defaultValue: 0,
        type: 'number',
        label: 'Start slot filled',
        description: 'Whether the starting temperature has been dropped into its slot (0 or 1)',
        min: 0,
        max: 1,
        step: 1,
    },
    setupRoomFilled: {
        defaultValue: 0,
        type: 'number',
        label: 'Room slot filled',
        description: 'Whether the room temperature has been dropped into its slot (0 or 1)',
        min: 0,
        max: 1,
        step: 1,
    },
    setupRateFilled: {
        defaultValue: 0,
        type: 'number',
        label: 'Rate slot filled',
        description: 'Whether the cooling rate has been dropped into its slot (0 or 1)',
        min: 0,
        max: 1,
        step: 1,
    },
    applicationTime: {
        defaultValue: 20,
        type: 'number',
        label: 'Time on the finished curve',
        description: 'Where the marker sits once all three numbers are in place',
        unit: 'min',
        min: 0,
        max: 40,
        step: 0.5,
        color: '#62D0AD',
    },
    applicationHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Application view highlight',
        description: "What is highlighted in the set-up figure: '' | 'chips' | 'curve'",
        color: '#3FA98A',
        bgColor: 'rgba(98, 208, 173, 0.22)',
    },

    // ─────────────────────────────────────────
    // ASSESSMENT — Cooling a Mug
    // ─────────────────────────────────────────
    answerSoupRoom: {
        defaultValue: '',
        type: 'text',
        label: 'Room temperature in the soup rule',
        description: 'Student answer: the number inside the bracket for a 15 degree kitchen',
        placeholder: '???',
        correctAnswer: ['15'],
        color: '#8E90F5',
    },
    answerSoupSpeed: {
        defaultValue: '',
        type: 'text',
        label: 'Soup cooling speed',
        description: 'Student answer: cooling speed of 70 degree soup in a 15 degree kitchen, k = 0.04',
        placeholder: '???',
        correctAnswer: ['2.2', '2.20', '-2.2', '-2.20'],
        color: '#8E90F5',
    },

    // ─────────────────────────────────────────
    // ASSESSMENT — Guessing a Solution and Checking It
    // ─────────────────────────────────────────
    answerGrowthSolution: {
        defaultValue: '',
        type: 'select',
        label: 'Solution of a growth rule',
        description: 'Student answer: which function solves dP/dt = 0.03P',
        placeholder: '???',
        correctAnswer: '200e^(0.03t)',
        options: ['200e^(0.03t)', '200e^(3t)', '0.03t + 200'],
        color: '#8E90F5',
    },
    answerExponentValue: {
        defaultValue: '',
        type: 'text',
        label: 'Multiplier from differentiating',
        description: 'Student answer: the c in dT/dt = c(T - 20) for T = 20 + 40e^(-0.02t)',
        placeholder: '???',
        correctAnswer: ['-0.02', '-0.020', '-.02'],
        color: '#8E90F5',
    },

    // ─────────────────────────────────────────
    // ASSESSMENT — Rate Is Not Amount
    // ─────────────────────────────────────────
    answerGapSpeed: {
        defaultValue: '',
        type: 'text',
        label: 'Cooling speed at 40 degrees',
        description: 'Student answer: cooling speed of a 40 degree drink in a 20 degree room',
        placeholder: '???',
        correctAnswer: ['1', '1.0', '-1', '-1.0'],
        color: '#8E90F5',
    },
    answerSpeedRatio: {
        defaultValue: '',
        type: 'text',
        label: 'Speed ratio of two drinks',
        description: 'Student answer: how many times faster the 80 degree drink cools than the 50 degree one',
        placeholder: '???',
        correctAnswer: ['2', '2.0', 'twice', 'two'],
        color: '#8E90F5',
    },

    // ─────────────────────────────────────────
    // ASSESSMENT — An Equation About How Fast Things Change
    // ─────────────────────────────────────────
    answerRateMeaning: {
        defaultValue: '',
        type: 'select',
        label: 'What dT/dt means',
        description: 'Student answer: what the left-hand side of the cooling rule stands for',
        placeholder: '???',
        correctAnswer: 'the speed the drink is cooling',
        options: [
            'the speed the drink is cooling',
            'the temperature of the drink',
            'the time on the clock',
        ],
        color: '#8E90F5',
    },
    answerCoolingSpeed: {
        defaultValue: '',
        type: 'text',
        label: 'Cooling speed at 60 degrees',
        description: 'Student answer: cooling speed in degrees per minute for a 60 degree drink',
        placeholder: '???',
        correctAnswer: ['2', '2.0', '-2', '-2.0'],
        color: '#8E90F5',
    },

    // Uncomment and modify these examples for your lesson:

    /*
    // ─────────────────────────────────────────
    // NUMBER - Use with sliders
    // ─────────────────────────────────────────
    myValue: {
        defaultValue: 5,
        type: 'number',
        label: 'My Value',
        description: 'A number that controls something',
        unit: 'm',           // optional unit display
        min: 0,
        max: 10,
        step: 0.5,
    },

    // ─────────────────────────────────────────
    // TEXT - Free text input
    // ─────────────────────────────────────────
    lessonTitle: {
        defaultValue: 'My Lesson',
        type: 'text',
        label: 'Lesson Title',
        description: 'The title of your lesson',
        placeholder: 'Enter a title...',
    },

    // ─────────────────────────────────────────
    // SELECT - Dropdown with options
    // ─────────────────────────────────────────
    difficulty: {
        defaultValue: 'medium',
        type: 'select',
        label: 'Difficulty',
        description: 'The difficulty level of the lesson',
        options: ['easy', 'medium', 'hard', 'expert'],
    },

    // ─────────────────────────────────────────
    // BOOLEAN - Toggle switch
    // ─────────────────────────────────────────
    showHints: {
        defaultValue: true,
        type: 'boolean',
        label: 'Show Hints',
        description: 'Toggle to show or hide hints',
    },

    // ─────────────────────────────────────────
    // ARRAY - List of numbers
    // ─────────────────────────────────────────
    dataPoints: {
        defaultValue: [1, 4, 9, 16, 25],
        type: 'array',
        label: 'Data Points',
        description: 'Y-values for plotting a graph',
    },

    // ─────────────────────────────────────────
    // OBJECT - Complex structured data
    // ─────────────────────────────────────────
    graphSettings: {
        defaultValue: { 
            xMin: -10, 
            xMax: 10, 
            showGrid: true 
        },
        type: 'object',
        label: 'Graph Settings',
        description: 'Configuration for the graph display',
        schema: '{ xMin: number, xMax: number, showGrid: boolean }',
    },
    */
};

/**
 * Get all variable names (for AI agents to discover)
 */
export const getVariableNames = (): string[] => {
    return Object.keys(variableDefinitions);
};

/**
 * Get a variable's default value
 */
export const getDefaultValue = (name: string): VarValue => {
    return variableDefinitions[name]?.defaultValue ?? 0;
};

/**
 * Get a variable's metadata
 */
export const getVariableInfo = (name: string): VariableDefinition | undefined => {
    return variableDefinitions[name];
};

/**
 * Get all default values as a record (for initialization)
 */
export const getDefaultValues = (): Record<string, VarValue> => {
    const defaults: Record<string, VarValue> = {};
    for (const [name, def] of Object.entries(variableDefinitions)) {
        defaults[name] = def.defaultValue;
    }
    return defaults;
};

/**
 * Get number props for InlineScrubbleNumber from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
export function numberPropsFromDefinition(def: VariableDefinition | undefined): {
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    color?: string;
} {
    if (!def || def.type !== 'number') return {};
    return {
        defaultValue: def.defaultValue as number,
        min: def.min,
        max: def.max,
        step: def.step,
        ...(def.color ? { color: def.color } : {}),
    };
}

/**
 * Get cloze input props for InlineClozeInput from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
/**
 * Get cloze choice props for InlineClozeChoice from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function choicePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Get toggle props for InlineToggle from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function togglePropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

export function clozePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
    caseSensitive?: boolean;
} {
    if (!def || def.type !== 'text') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
        ...(def.caseSensitive !== undefined ? { caseSensitive: def.caseSensitive } : {}),
    };
}

/**
 * Get spot-color props for InlineSpotColor from a variable definition.
 * Extracts the `color` field.
 *
 * @example
 * <InlineSpotColor
 *     varName="radius"
 *     {...spotColorPropsFromDefinition(getVariableInfo('radius'))}
 * >
 *     radius
 * </InlineSpotColor>
 */
export function spotColorPropsFromDefinition(def: VariableDefinition | undefined): {
    color: string;
} {
    return {
        color: def?.color ?? '#8B5CF6',
    };
}

/**
 * Get linked-highlight props for InlineLinkedHighlight from a variable definition.
 * Extracts the `color` and `bgColor` fields.
 *
 * @example
 * <InlineLinkedHighlight
 *     varName="activeHighlight"
 *     highlightId="radius"
 *     {...linkedHighlightPropsFromDefinition(getVariableInfo('activeHighlight'))}
 * >
 *     radius
 * </InlineLinkedHighlight>
 */
export function linkedHighlightPropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    return {
        ...(def?.color ? { color: def.color } : {}),
        ...(def?.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Build the `variables` prop for FormulaBlock from variable definitions.
 *
 * Takes an array of variable names and returns the config map expected by
 * `<FormulaBlock variables={...} />`.
 *
 * @example
 * import { scrubVarsFromDefinitions } from './variables';
 *
 * <FormulaBlock
 *     latex="\scrub{mass} \times \scrub{accel}"
 *     variables={scrubVarsFromDefinitions(['mass', 'accel'])}
 * />
 */
export function scrubVarsFromDefinitions(
    varNames: string[],
): Record<string, { min?: number; max?: number; step?: number; color?: string }> {
    const result: Record<string, { min?: number; max?: number; step?: number; color?: string }> = {};
    for (const name of varNames) {
        const def = variableDefinitions[name];
        if (!def) continue;
        result[name] = {
            ...(def.min !== undefined ? { min: def.min } : {}),
            ...(def.max !== undefined ? { max: def.max } : {}),
            ...(def.step !== undefined ? { step: def.step } : {}),
            ...(def.color ? { color: def.color } : {}),
        };
    }
    return result;
}
