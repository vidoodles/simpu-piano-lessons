// AnimatedRoute.js
import React from 'react';
import { Route } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';

const AnimatedRoute = ({ component: Component, ...rest }) => (
  <Route {...rest}>
    {({ location }) => (
      <CSSTransition
        key={location.key}
        classNames="page"
        timeout={300}
      >
        <Component />
      </CSSTransition>
    )}
  </Route>
);

export default AnimatedRoute;
