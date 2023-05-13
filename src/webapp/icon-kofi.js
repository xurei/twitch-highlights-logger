import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import deepEqual from 'deep-eql';

class IconKofi extends React.Component {
  static propTypes = {
    color: PropTypes.string,
    size: PropTypes.number,
  };
  
  render() {
    const props = this.props;
    const color = props.color || '#000';
    const size = props.size || 32;
    return (
      <span className={`d-inline-block ${props.className || ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40.001 26.391" style={{fill: color, width: size}}>
          <path d="M39.845 9.125C38.813 3.677 33.365 3 33.365 3h-24.4c-.808 0-.907 1.063-.907 1.063s-.11 9.767-.027 15.767c.22 3.228 3.448 3.561 3.448 3.561s11.02-.031 15.953-.067c3.25-.568 3.579-3.423 3.54-4.98 5.809.323 9.897-3.776 8.872-9.219zm-14.751 4.683c-1.661 1.932-5.348 5.297-5.348 5.297s-.161.161-.417.031c-.1-.073-.14-.12-.14-.12-.595-.588-4.491-4.063-5.381-5.271-.943-1.287-1.385-3.599-.12-4.948 1.266-1.344 4.006-1.448 5.818.541 0 0 2.083-2.375 4.625-1.281 2.536 1.095 2.443 4.016.963 5.751zm8.23.636c-1.24.156-2.244.036-2.244.036V6.907h2.359s2.63.735 2.63 3.516c0 2.552-1.312 3.557-2.744 4.021z"/>
        </svg>
      </span>
    );
  }
  
  shouldComponentUpdate(nextProps) {
    return !deepEqual(this.props, nextProps);
  }
}

export { IconKofi };
