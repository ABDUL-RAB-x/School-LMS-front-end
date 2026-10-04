// Shared Framer Motion variants: fade up, slide in, hover lift
const EASE = [0.22, 1, 0.36, 1]

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
}

export const slideInLeft = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
}

export const stagger = (delayChildren = 0.04, staggerChildren = 0.06) => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
})

// Hover lift used on cards, class tiles and course cards
export const hoverLift = {
  y: -4,
  boxShadow: '0 6px 24px rgba(15, 23, 42, 0.09)',
  transition: { duration: 0.2, ease: EASE },
}

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE } },
}
