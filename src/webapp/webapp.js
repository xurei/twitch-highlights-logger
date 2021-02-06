import React from 'react'; //eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import './assets/style.scss';
import MainView from './main_view';

const document = window.document; //eslint-disable-line no-undef

global.addEventListener('DOMContentLoaded', function() {
    ReactDOM.render(
        <MainView/>,
        document.getElementById('content'),
    );
});
