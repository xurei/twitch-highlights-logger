import React from 'react'; //eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import './assets/style.scss';
import MainView from './main_view';

window.global = window; //eslint-disable-line no-undef
const document = window.document; //eslint-disable-line no-undef

window.addEventListener('DOMContentLoaded', function() { //eslint-disable-line no-undef
    ReactDOM.render(
        <MainView/>,
        document.getElementById('content'),
    );
});
