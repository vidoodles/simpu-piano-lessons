import React from 'react';
import ReactDOM from 'react-dom/client'; // Correct import statement
import './index.css';

import reportWebVitals from './reportWebVitals';
import Router from './router';
import { Provider } from 'react-redux'
import store from './store'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Router/>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
