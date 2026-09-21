import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin once globally
gsap.registerPlugin(ScrollTrigger);

export const initPageAnimations = (container: HTMLElement) => {
  // Check prefers-reduced-motion setting
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const heroItems = container.querySelectorAll('.js-hero-item');
  const revealItems = container.querySelectorAll('.js-reveal');

  if (prefersReducedMotion) {
    // Immediate opacity and layout for reduced motion preference
    gsap.set(heroItems, { opacity: 1, y: 0 });
    gsap.set(revealItems, { opacity: 1, y: 0 });
    return () => {};
  }

  // 1. Hero Staged Entrance Animation
  if (heroItems.length > 0) {
    gsap.fromTo(
      heroItems,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'transform',
      }
    );
  }

  // 2. ScrollTrigger Reveal for Supporting Sections
  const triggers: ScrollTrigger[] = [];

  revealItems.forEach((el) => {
    const anim = gsap.fromTo(
      el,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
          once: true,
        },
      }
    );
    if (anim.scrollTrigger) {
      triggers.push(anim.scrollTrigger);
    }
  });

  // Return cleanup function
  return () => {
    triggers.forEach((t) => t.kill());
  };
};
