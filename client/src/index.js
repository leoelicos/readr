/* 

Book Search Engine
index.js

Import bootstrap and Render App component in ReactDOM strict mode

*/

import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';

/* react dom with strict mode  */
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
