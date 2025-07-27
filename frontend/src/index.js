import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return React.createElement('div', 
    { style: { padding: '20px', fontFamily: 'Arial, sans-serif' } },
    React.createElement('h1', null, 'Consensus.AI'),
    React.createElement('p', null, 'Frontend successfully deployed!'),
    React.createElement('p', null, 'Backend URL: ' + (import.meta.env.REACT_APP_API_URL || 'Not configured')),
    React.createElement('small', null, 'Build time: ' + new Date().toISOString())
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App)); 