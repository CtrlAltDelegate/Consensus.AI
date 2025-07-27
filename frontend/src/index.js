import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  // Debug: Log all environment variables
  console.log('All env vars:', process.env);
  console.log('REACT_APP_API_URL specifically:', process.env.REACT_APP_API_URL);
  
  return React.createElement('div', 
    { style: { padding: '20px', fontFamily: 'Arial, sans-serif' } },
    React.createElement('h1', null, 'Consensus.AI'),
    React.createElement('p', null, 'Frontend successfully deployed!'),
    React.createElement('p', null, 'Backend URL: ' + (process.env.REACT_APP_API_URL || 'Not configured')),
    React.createElement('p', null, 'Node ENV: ' + (process.env.NODE_ENV || 'undefined')),
    React.createElement('p', null, 'All env keys: ' + Object.keys(process.env).filter(key => key.startsWith('REACT_APP')).join(', ')),
    React.createElement('small', null, 'Build time: ' + new Date().toISOString())
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App)); 