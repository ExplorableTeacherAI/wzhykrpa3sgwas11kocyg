/**
 * Lesson Colour Language
 * ======================
 *
 * ONE hue per quantity, used identically everywhere that quantity appears:
 * inside the figures, in the prose (InlineSpotColor / InlineLinkedHighlight),
 * and inside the formulas (\clr{}, \scrub{}, \highlight{}).
 *
 * A reader who learns "violet means a speed" once never has to relearn it.
 */
export const QUANTITY = {
    /** How warm the drink is, and the gap it still has to lose. */
    temperature: '#62D0AD', // soft teal
    /** The clock: minutes since the drink was poured. */
    time: '#8E90F5', // soft indigo
    /** How fast something is changing: dT/dt, degrees per minute. */
    rate: '#AC8BF9', // soft violet
    /** The surroundings the drink is heading towards. */
    room: '#62CCF9', // soft sky
    /** The steepness constant k inside the rule. */
    steepness: '#F8A0CD', // soft rose
    /** A value the student has guessed but not yet checked. */
    guess: '#94A3B8', // soft slate
    /** Equations that carry a derivative. */
    derivative: '#AC8BF9', // soft violet, same as a rate
    /** How far you must differentiate: the order. */
    order: '#F4A89A', // soft coral
} as const;

export type QuantityName = keyof typeof QUANTITY;

/** Same hue at low opacity, for the background tint of an inline chip. */
export const tint = (hex: string, alpha = 0.22): string => {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Props for an InlineLinkedHighlight / FormulaBlock highlight in a given hue. */
export const hue = (name: QuantityName) => ({
    color: QUANTITY[name],
    bgColor: tint(QUANTITY[name]),
});
