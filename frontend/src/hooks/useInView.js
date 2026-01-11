import { useState, useEffect, useRef } from 'react';

/**
 * Хук для отслеживания видимости элемента в viewport
 * @param {Object} options - Опции IntersectionObserver
 * @param {number} options.threshold - Порог видимости (0-1)
 * @param {string} options.rootMargin - Отступ от viewport
 * @param {boolean} options.triggerOnce - Срабатывать только один раз
 * @returns {[React.RefObject, boolean]} - [ref для элемента, флаг видимости]
 */
const useInView = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true
  } = options;

  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isInView];
};

export default useInView;
