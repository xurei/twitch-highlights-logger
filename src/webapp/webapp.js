import React from 'react'; //eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import './assets/style.scss';
import MainView from './main_view';

window.global = window; //eslint-disable-line no-undef
const document = window.document; //eslint-disable-line no-undef

function initApp() { //eslint-disable-line no-undef
    ReactDOM.render(
      <MainView/>,
      document.getElementById('content'),
    );
    global.postMessage({ action: 'webapp_ready', data: null }, '*');
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0.0';
    }, 700);
}

if( document.readyState !== 'loading' ) {
    console.log( 'document is already ready' );
    initApp();
}
else {
    console.log( 'document not ready, waiting for it to load...' );
    document.addEventListener('DOMContentLoaded', initApp);
}

//window.addEventListener('DOMContentLoaded', initApp);
