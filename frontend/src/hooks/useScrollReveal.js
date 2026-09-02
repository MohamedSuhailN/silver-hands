import { useEffect, useRef } from 'react';

/**
 * useScrollReveal — attaches an IntersectionObserver to an element ref.
 * When the element enters the viewport, the `visible` class is added,
 * triggering a CSS transition defined in index.css.
 *
 * @param {object} options - rootMargin and threshold
 * @returns ref to attach to the DOM element
 */
export const useScrollReveal = (options = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('scroll-visible');
          observer.unobserve(el); // animate once
        }
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.1, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
};
