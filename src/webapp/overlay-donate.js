import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import Styled from 'styled-components';

import { OverlayWrapper } from './overlay-wrapper';
import { FlexChild, FlexLayout } from 'xureact/lib/module/components/layout/flex-layout';
import { IconGithub } from './icon-github';
import { IconKofi } from './icon-kofi';

class OverlayDonate extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
  };
  
  render() {
    const props = this.props;
    return (
      <OverlayWrapper width={'540px'} onClose={props.onClose}>
        <div className={props.className}>
          <FlexLayout direction="column" className="fullh">
            <FlexChild>
              <div style={{paddingBottom: 10}}>
                <br/>
                <br/>
                <br/>
                <div className="donate-link d-inline-block" style={{width: '30%'}}>
                  <span className="overflow-hidden clickable" onClick={() => {
                    global.postMessage({ action: 'open_page', data: 'https://github.com/sponsors/xurei' }, '*');
                  }}>
                    <IconGithub color="inherit" size={50}/>
                    <br/>
                    Github Sponsors
                  </span>
                </div>
                <div className="donate-link d-inline-block" style={{width: '30%'}}>
                  <span className="overflow-hidden clickable" onClick={() => {
                    global.postMessage({ action: 'open_page', data: 'https://ko-fi.com/xurei' }, '*');
                  }}>
                    <IconKofi color="inherit" size={72}/>
                    <br/>
                    Ko-Fi
                  </span>
                </div>
                <br/>
                <br/>
                <h3>♥ Thank you for your support ♥</h3>
              </div>
              <br/>
            </FlexChild>
          </FlexLayout>
        </div>
      </OverlayWrapper>
    );
  }
}

//language=SCSS
OverlayDonate = Styled(OverlayDonate)`
& {
  text-align: center;

  .donate-link {
    color: #fff;
    fill: #fff;
    &:hover {
      color: #ef8ae3;
      fill: #ef8ae3;
    }
  }
}
`;

export { OverlayDonate };
