import React, {
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from 'react';
import PropTypes from 'prop-types';

const Context = React.createContext();

export function useOverflow() {
  return useContext(Context);
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  position: 'relative'
};

const viewportStyle = {
  position: 'relative',
  flexBasis: '100%',
  flexShrink: 1,
  flexGrow: 0,
  overflow: 'auto'
};

const contentStyle = {
  display: 'inline-block',
  position: 'relative',
  minWidth: '100%',
  boxSizing: 'border-box'
};

function reducer(state, action) {
  switch (action.type) {
    case 'CHANGE': {
      const currentValue = state.canScroll[action.direction];
      if (currentValue === action.canScroll) {
        return state;
      }
      return {
        ...state,
        canScroll: {
          ...state.canScroll,
          [action.direction]: action.canScroll
        }
      };
    }
  }
  return state;
}

function getInitialState() {
  return {
    canScroll: {
      up: false,
      left: false,
      right: false,
      down: false
    }
  };
}

/**
 * The overflow state provider. At a minimum it must contain an
 * `<Overflow.Content>` element, otherwise it will do nothing.
 *
 * ```jsx
 * <Overflow>
 *   <Overflow.Content>
 *     Your element(s) here!
 *   </Overflow.Content>
 * <Overflow>
 * ```
 *
 * As with any standard element, its height must be limited in some way in order
 * for it to actually scroll. Apply that style as you would any other element,
 * with `style` or `className`:
 *
 * ```jsx
 * <Overflow style={{ maxHeight: 500 }}>
 *   …
 * </Overflow>
 * ```
 *
 * Usage with styled-components:
 *
 * ```jsx
 * const MyContainer = styled(Overflow)`
 *   max-height: 500px;
 * `;
 * ```
 *
 * Any remaining props beyond those documented below will be passed along to the
 * underlying DOM element. Use this to pass `className`, `style`, or any other
 * native attribute.
 */
export default function Overflow({
  children,
  onStateChange,
  style: styleProp,
  tolerance = 0,
  ...rest
}) {
  const [state, dispatch] = useReducer(reducer, null, getInitialState);
  const hidden = rest.hidden;
  const viewportRef = useRef();

  const style = useMemo(
    () => ({
      ...containerStyle,
      ...styleProp,
      // Special handling for `display`: if defined on an element, it
      // surprisingly overrides the `hidden` HTML attribute! So detect whether
      // the consumer is trying to hide the element via `hidden` or
      // `display: none` and allow that, otherwise ensure we use the value from
      // `containerStyle`.
      display:
        hidden || (styleProp && styleProp.display === 'none')
          ? 'none'
          : containerStyle.display
    }),
    [hidden, styleProp]
  );

  const refs = useMemo(() => ({ viewport: viewportRef }), []);

  const context = useMemo(
    () => ({
      state,
      dispatch,
      tolerance,
      refs
    }),
    [refs, state, tolerance]
  );

  useEffect(() => {
    if (onStateChange) {
      onStateChange(state, refs);
    }
  }, [onStateChange, refs, state]);

  return (
    <div data-overflow-wrapper="" style={style} {...rest}>
      <Context.Provider value={context}>{children}</Context.Provider>
    </div>
  );
}

Overflow.propTypes = {
  /**
   * Elements to render inside the outer container. This should include an
   * `<Overflow.Content>` element at a minimum, but should also include your
   * scroll indicators if you’d like to overlay them on the scrollable viewport.
   */
  children: PropTypes.node,
  /**
   * Callback that receives the latest overflow state and an object of refs, if
   * you’d like to react to overflow in a custom way.
   */
  onStateChange: PropTypes.func,
  /**
   * Distance (number of pixels or CSS length unit like `1em`) to the edge of
   * the content at which to consider the viewport fully scrolled. For example,
   * if set to 10, then it will consider scrolling to have reached the end as
   * long as it’s within 10 pixels of the border. You can use this when your
   * content has padding and scrolling close to the edge should be good enough.
   */
  tolerance: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

// For Firefox, update on a threshold of 0 in addition to any intersection at
// all (represented by a tiny tiny threshold).
const threshold = [0, 1e-12];

/**
 * Wrapper for content to render inside the scrollable viewport. This element
 * will grow to whatever size it needs to hold its content, and will cause the
 * parent viewport element to overflow. It must be rendered inside an
 * `<Overflow>` ancestor.
 *
 * Although you can style this element directly by passing additional props
 * like `className` and `style`, it’s preferable to include styling on your
 * own element inside `<Overflow.Content>` instead – otherwise you risk
 * interfering with the styles this component needs to function.
 */
function OverflowContent({ children, style: styleProp, ...rest }) {
  const { dispatch, tolerance, refs } = useOverflow();
  const { viewport: viewportRef } = refs;
  const contentRef = useRef();
  const toleranceRef = useRef();
  const watchRef = tolerance ? toleranceRef : contentRef;
  const observersRef = useRef();

  useEffect(() => {
    let ignore = false;

    const root = viewportRef.current;

    const createObserver = (direction, rootMargin) => {
      return new IntersectionObserver(
        ([entry]) => {
          if (ignore) {
            return;
          }

          const hasSize = Boolean(
            entry.boundingClientRect.width || entry.boundingClientRect.height
          );
          const canScroll =
            hasSize &&
            // Interestingly, Firefox can return an entry with an
            // `intersectionRatio` of 0 but `isIntersecting` of false.
            // This doesn't really make any sense. But check both just in
            // case.
            entry.intersectionRatio !== 0 &&
            entry.isIntersecting;
          dispatch({ type: 'CHANGE', direction, canScroll });
        },
        {
          root,
          rootMargin,
          threshold
        }
      );
    };

    const observers = {
      up: createObserver('up', '100% 0px -100% 0px'),
      left: createObserver('left', '0px -100% 0px 100%'),
      right: createObserver('right', '0px 100% 0px -100%'),
      down: createObserver('down', '-100% 0px 100% 0px')
    };

    observersRef.current = observers;

    return () => {
      ignore = true;
      observers.up.disconnect();
      observers.left.disconnect();
      observers.right.disconnect();
      observers.down.disconnect();
    };
  }, [dispatch, viewportRef]);

  useEffect(() => {
    const observers = observersRef.current;
    const watchNode = watchRef.current;

    observers.up.observe(watchNode);
    observers.left.observe(watchNode);
    observers.right.observe(watchNode);
    observers.down.observe(watchNode);

    return () => {
      observers.up.unobserve(watchNode);
      observers.left.unobserve(watchNode);
      observers.right.unobserve(watchNode);
      observers.down.unobserve(watchNode);
    };
  }, [watchRef]);

  const style = useMemo(() => {
    return {
      ...styleProp,
      ...contentStyle
    };
  }, [styleProp]);

  const toleranceElement = useMemo(
    () =>
      tolerance ? (
        <div
          data-overflow-tolerance
          ref={toleranceRef}
          style={{
            position: 'absolute',
            top: tolerance,
            left: tolerance,
            right: tolerance,
            bottom: tolerance,
            background: 'transparent',
            pointerEvents: 'none',
            zIndex: -1
          }}
        />
      ) : null,
    [tolerance]
  );

  return (
    <div ref={viewportRef} data-overflow-viewport="" style={viewportStyle}>
      <div ref={contentRef} data-overflow-content="" style={style} {...rest}>
        {toleranceElement}
        {children}
      </div>
    </div>
  );
}

OverflowContent.displayName = 'Overflow.Content';

OverflowContent.propTypes = {
  /**
   * Content to render inside the scrollable viewport.
   */
  children: PropTypes.node
};

/**
 * A helper component for rendering your custom indicator when the viewport is
 * scrollable in a particular direction (or any direction). Must be rendered
 * inside an `<Overflow>` ancestor.
 *
 * You can provide a `direction` prop to indicate when scrolling is allowed in
 * a particular direction:
 *
 * ```jsx
 * <Overflow>
 *   <Overflow.Content>…</Overflow.Content>
 *   <Overflow.Indicator direction="right">
 *     👉
 *   </Overflow.Indicator>
 * </Overflow>
 * ```
 *
 * …or exclude it to indicate when scrolling is allowed in any direction:
 * ```jsx
 * <Overflow>
 *   <Overflow.Content>…</Overflow.Content>
 *   <Overflow.Indicator>
 *     ←↕→
 *   </Overflow.Indicator>
 * </Overflow>
 * ```
 *
 * This component will mount its children when scrolling is allowed in the
 * requested direction, and unmount them otherwise. If you’d rather remain
 * mounted (to allow transitions, for example), then render a function. It will
 * be supplied with a Boolean (if `direction` is supplied) or an object with
 * `up`, `left`, `right`, and `down` properties:
 *
 * ```jsx
 * <Overflow>
 *   <Overflow.Indicator direction="down">
 *     {canScroll => canScroll ? '🔽' : '✅'}
 *   </Overflow.Indicator>
 * </Overflow>
 * ```
 */
function OverflowIndicator({ children, direction }) {
  const { state, refs } = useOverflow();
  const { canScroll } = state;
  const isActive = direction
    ? canScroll[direction]
    : canScroll.up || canScroll.left || canScroll.right || canScroll.down;

  let shouldRender = isActive;

  if (typeof children === 'function') {
    shouldRender = true;
    const stateArg = direction ? isActive : canScroll;
    children = children(stateArg, refs);
  }

  return shouldRender ? <>{children}</> : null;
}

OverflowIndicator.displayName = 'Overflow.Indicator';

OverflowIndicator.propTypes = {
  /**
   * Indicator to render when scrolling is allowed in the requested direction.
   * If given a function, it will be passed the overflow state and an object
   * containing the `viewport` ref. You can use this `refs` parameter to render
   * an indicator that is also a button that scrolls the viewport (for example).
   */
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  /**
   * The scrollabe direction to watch for. If not supplied, the indicator will
   * be active when scrolling is allowed in any direction.
   */
  direction: PropTypes.oneOf(['up', 'down', 'left', 'right'])
};

Overflow.Indicator = OverflowIndicator;
Overflow.Content = OverflowContent;
