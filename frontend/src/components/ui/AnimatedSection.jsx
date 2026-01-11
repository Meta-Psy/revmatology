import useInView from '../../hooks/useInView';

/**
 * Обёртка для секций с анимацией при появлении в viewport
 * @param {Object} props
 * @param {React.ReactNode} props.children - Дочерние элементы
 * @param {string} props.className - Дополнительные классы
 * @param {string} props.animation - Тип анимации: 'fade-up' | 'fade-left' | 'fade-right' | 'fade' | 'scale'
 * @param {number} props.delay - Задержка анимации в ms (0, 100, 200, 300, 400)
 * @param {string} props.as - HTML тег (по умолчанию 'section')
 */
const AnimatedSection = ({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
  as: Component = 'section',
  ...props
}) => {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  // Базовые стили для начального состояния
  const baseStyles = {
    'fade-up': 'translate-y-8 opacity-0',
    'fade-left': '-translate-x-8 opacity-0',
    'fade-right': 'translate-x-8 opacity-0',
    'fade': 'opacity-0',
    'scale': 'scale-95 opacity-0'
  };

  // Стили для видимого состояния
  const visibleStyles = {
    'fade-up': 'translate-y-0 opacity-100',
    'fade-left': 'translate-x-0 opacity-100',
    'fade-right': 'translate-x-0 opacity-100',
    'fade': 'opacity-100',
    'scale': 'scale-100 opacity-100'
  };

  // Задержки
  const delayStyles = {
    0: '',
    100: 'delay-100',
    200: 'delay-200',
    300: 'delay-300',
    400: 'delay-[400ms]',
    500: 'delay-500'
  };

  return (
    <Component
      ref={ref}
      className={`transition-all duration-700 ease-out ${delayStyles[delay] || ''} ${
        isInView ? visibleStyles[animation] : baseStyles[animation]
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default AnimatedSection;
