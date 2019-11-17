import React, { useState } from 'react';
import Overflow from '../src';

const shadowStart = 'rgba(68, 49, 38, 0.3)';
const shadowEnd = 'rgba(56, 44, 36, 0)';

function MoreIndicator({ isVisible = true }) {
  return (
    <span
      style={{
        position: 'absolute',
        right: 25,
        bottom: 25,
        textTransform: 'uppercase',
        fontFamily: 'Lato',
        fontSize: 12,
        color: 'rgb(217, 11, 141)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-out'
      }}
    >
      More <span style={{ fontSize: '75%', verticalAlign: 1 }}>▼</span>
    </span>
  );
}

function Shadow({ direction, isVisible, size = 30 }) {
  const style = {
    position: 'absolute',
    zIndex: 1,
    pointerEvents: 'none',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 250ms ease-out'
  };
  switch (direction) {
    case 'up':
      style.top = 0;
      style.left = 0;
      style.right = 0;
      style.height = size;
      style.background = `linear-gradient(to bottom, ${shadowStart}, ${shadowEnd})`;
      break;
    case 'left':
      style.top = 0;
      style.left = 0;
      style.bottom = 0;
      style.width = size;
      style.background = `linear-gradient(to right, ${shadowStart}, ${shadowEnd})`;
      break;
    case 'right':
      style.top = 0;
      style.right = 0;
      style.bottom = 0;
      style.width = size;
      style.background = `linear-gradient(to left, ${shadowStart}, ${shadowEnd})`;
      break;
    case 'down':
      style.left = 0;
      style.right = 0;
      style.bottom = 0;
      style.height = size;
      style.background = `linear-gradient(to top, ${shadowStart}, ${shadowEnd})`;
      break;
  }
  return <div style={style} />;
}

const overflowStyle = {
  maxWidth: 600,
  maxHeight: 400,
  border: '1px solid #ccc'
};

const contentStyle = {
  // minWidth: 2000,
  padding: 20,
  fontFamily: 'sans-serif',
  fontSize: 18,
  background: 'rgb(246, 243, 235)',
  color: '#222'
};

function OverflowDemo({
  style,
  contentStyle,
  initialVisible = true,
  initialMounted = true
}) {
  const [isVisible, setVisible] = useState(initialVisible);
  const [isMounted, setMounted] = useState(initialMounted);
  const [tolerance, setTolerance] = useState(30);
  return (
    <div
      style={{
        border: '2px solid rgb(78, 148, 241)',
        margin: 20,
        padding: 20
      }}
    >
      <button onClick={() => setVisible(isVisible => !isVisible)}>
        Toggle Visibility
      </button>{' '}
      <button onClick={() => setMounted(isMounted => !isMounted)}>
        Toggle Mounted
      </button>{' '}
      <label>
        Tolerance:{' '}
        <input
          value={tolerance.toString()}
          onChange={event => {
            const { value } = event.target;
            if (/^\d+$/.test(value)) {
              setTolerance(parseInt(value, 10));
            } else {
              setTolerance(value);
            }
          }}
        />
      </label>
      <br />
      <br />
      {isMounted ? (
        <Overflow style={style} hidden={!isVisible} tolerance={tolerance}>
          <Overflow.Indicator direction="up">
            {canScroll => <Shadow direction="up" isVisible={canScroll} />}
          </Overflow.Indicator>
          <Overflow.Indicator direction="left">
            {canScroll => <Shadow direction="left" isVisible={canScroll} />}
          </Overflow.Indicator>
          <Overflow.Content>
            <div style={contentStyle}>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
                Viverra maecenas accumsan lacus vel facilisis volutpat est
                velit. Vulputate ut pharetra sit amet. Eu volutpat odio
                facilisis mauris sit amet massa vitae. Consectetur purus ut
                faucibus pulvinar elementum integer enim. Integer quis auctor
                elit sed vulputate mi sit amet mauris. Gravida arcu ac tortor
                dignissim convallis aenean et tortor. Feugiat pretium nibh ipsum
                consequat nisl. Proin fermentum leo vel orci porta. Turpis
                egestas pretium aenean pharetra magna ac placerat vestibulum.
                Hac habitasse platea dictumst vestibulum rhoncus est. Magna
                etiam tempor orci eu. Adipiscing diam donec adipiscing tristique
                risus nec. Lectus urna duis convallis convallis tellus. Et
                tortor consequat id porta.
              </p>
              <Overflow.Indicator>
                {canScroll => (
                  <>
                    Where can we scroll? {canScroll.up && '👆'}{' '}
                    {canScroll.left && '👈'} {canScroll.right && '👉'}{' '}
                    {canScroll.down && '👇'}{' '}
                  </>
                )}
              </Overflow.Indicator>
              <p style={{ marginTop: 295 }}>You made it!</p>
            </div>
          </Overflow.Content>
          <Overflow.Indicator direction="right">
            {canScroll => <Shadow direction="right" isVisible={canScroll} />}
          </Overflow.Indicator>
          <Overflow.Indicator direction="down">
            {canScroll => <Shadow direction="down" isVisible={canScroll} />}
          </Overflow.Indicator>
          <Overflow.Indicator direction="down">
            {canScroll => <MoreIndicator isVisible={canScroll} />}
          </Overflow.Indicator>
        </Overflow>
      ) : null}
    </div>
  );
}

export default function DemoPage() {
  return (
    <main>
      <OverflowDemo
        title="Demo"
        style={overflowStyle}
        contentStyle={contentStyle}
      />
      <OverflowDemo
        title="Visibility toggle demo"
        style={overflowStyle}
        contentStyle={contentStyle}
        initialVisible={false}
      />
      <OverflowDemo
        title="Mounted toggle demo"
        style={overflowStyle}
        contentStyle={contentStyle}
        initialMounted={false}
      />
      <Overflow style={{ maxHeight: 300 }}>
        <Overflow.Content style={{ minHeight: 800 }}>
          Render an element or put your content directly here…
        </Overflow.Content>
        <Overflow.Indicator direction="down">👇</Overflow.Indicator>
      </Overflow>
    </main>
  );
}
