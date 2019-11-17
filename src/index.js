import React, {
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from 'react';
import PropTypes from 'prop-types';

const Context = React.createContext();

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
  position: 'relative'
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

const emptyStyle = {};

/**
 * The overflow state provider. At a minimum it must contain a
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
 * ```jsx
 * const MyContainer = styled(Overflow)`
 *   max-height: 500px;
 * `;
 * ```
 */
export default function Overflow({
  children,
  onStateChange,
  tolerance = 0,
  ...rest
}) {
  const [state, dispatch] = useReducer(reducer, null, getInitialState);
  const hidden = rest.hidden;
  const styleProp = rest.style || emptyStyle;

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
        hidden || styleProp.display === 'none' ? 'none' : containerStyle.display
    }),
    [hidden, styleProp]
  );

  const context = useMemo(() => {
    return {
      state,
      dispatch,
      tolerance
    };
  }, [state, tolerance]);

  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [onStateChange, state]);

  return (
    <div data-overflow-wrapper="" {...rest} style={style}>
      <Context.Provider value={context}>{children}</Context.Provider>
    </div>
  );
}

Overflow.propTypes = {
  /**
   * Elements to render inside the outer container. This should include a
   * `<Overflow.Content>` element at a minimum, but should also include your
   * scroll indicators if you’d like to overlay them on the scrollable viewport.
   */
  children: PropTypes.node,
  /**
   * Callback that receives the latest overflow state, if you’d like to react
   * to scrollability in a custom way.
   */
  onStateChange: PropTypes.func,
  /**
   * Distance (number of pixels or CSS length unit like `1em`) to the edge of
   * the content at which to consider the viewport fully scrolled. For example,
   * if set to 10, then the Overflow will consider scrolling to have reached
   * the end as long as it’s within 10 pixels of the border. You can use this
   * when your content has a lot of padding and scrolling close enough to the
   * edge should be good enough.
   */
  tolerance: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

/**
 * Wrapper for content to render inside the scrollable viewport. This element
 * will grow to whatever size it needs to hold its content, and will cause the
 * parent viewport element to overflow. It must be rendered inside a
 * `<Overflow>` ancestor.
 */
function OverflowContent({ children, style: styleProp, ...rest }) {
  const { dispatch, tolerance } = useContext(Context);
  const rootRef = useRef();
  const contentRef = useRef();
  const toleranceRef = useRef();
  const watchRef = tolerance ? toleranceRef : contentRef;
  const observersRef = useRef();

  useEffect(() => {
    let ignore = false;

    const root = rootRef.current;

    const createObserver = (direction, rootMargin) => {
      const threshold = 1e-12;

      return new IntersectionObserver(
        ([entry]) => {
          if (ignore) {
            return;
          }

          const canScroll =
            entry.boundingClientRect.width || entry.boundingClientRect.height
              ? entry.isIntersecting
              : false;

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
  }, [dispatch]);

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

  return (
    <div ref={rootRef} data-overflow-viewport="" style={viewportStyle}>
      <div ref={contentRef} data-overflow-content="" style={style} {...rest}>
        {tolerance ? (
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
        ) : null}
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
 * inside a `<Overflow>` ancestor.
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
  const context = useContext(Context);
  const { canScroll: state } = context.state;
  const canScroll = direction
    ? state[direction]
    : state.up || state.left || state.right || state.down;

  let shouldRender = canScroll;

  if (typeof children === 'function') {
    const arg = direction ? canScroll : state;
    shouldRender = true;
    children = children(arg);
  }

  return shouldRender ? <>{children}</> : null;
}

OverflowIndicator.displayName = 'Overflow.Indicator';

OverflowIndicator.propTypes = {
  /**
   * Indicator to render when scrolling is allowed in the requested direction.
   * If given a function, it will be passed the overflow state and its result
   * will be rendered.
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
