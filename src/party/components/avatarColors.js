/** Avatar colours from the Figma lobby, assigned by roster position. */
export const AVATAR_COLORS = ["#f472b6", "#22d3ee", "#f59e0b", "#22c55e", "#a78bfa", "#fb7185", "#38bdf8", "#facc15", "#34d399", "#f97316"];

/** @param {number} index roster position @returns {string} CSS colour */
export const avatarColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];
