import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import deepEqual from 'deep-eql';
import Styled from 'styled-components';
import { secondsToTime } from './seconds_to_time';

class Chatlog extends React.Component {
  static propTypes = {
    chatlog: PropTypes.array.isRequired,
  };
  
  render() {
    const props = this.props;
    return (
      <div className={props.className}>
        {props.chatlog.map(chatline => {
            try {
              return (
                <div className="chatline">
                    <span className="chatline__time">
                        {secondsToTime(chatline.content_offset_seconds)}
                    </span>
                    &nbsp;
                    <span className="chatline__user" style={{color: chatline.message.user_color}}>
                        {chatline.commenter.display_name}
                    </span>
                    :&nbsp;
                    <span>
                        {!chatline.message.fragments ? chatline.message.body : chatline.message.fragments.map((fragment, index) => {
                          if (fragment.emoticon) {
                            return (
                              <span key={`${chatline._id}-${index}`} className="chatlog__img-wrapper">
                                <div className="chatlog__img-wrapper-tooltip">
                                  {fragment.text}
                                </div>
                                <img width={28} src={`https://static-cdn.jtvnw.net/emoticons/v2/${fragment.emoticon.emoticon_id}/default/dark/2.0`} alt={fragment.text}/>
                              </span>
                            );
                          }
                          else if (fragment.text) {
                            return fragment.text;
                          }
                        })}
                        {/*{chatline.message.body}*/}
                    </span>
                </div>
              );
            }
            catch (e) {
              return 'ERR';
            }
        })}
      </div>
    );
  }
  
  shouldComponentUpdate(nextProps) {
    return !deepEqual(this.props, nextProps);
  }
}

//language=SCSS
Chatlog = Styled(Chatlog)`
& {
  background: #18181B;

  padding: 10px;

  .chatlog__img-wrapper {
    display: inline-block;
    position: relative;

    .chatlog__img-wrapper-tooltip {
      position: absolute;
      left: 14px;
      top: -20px;
      transform: translate(-50%, 0);
      background: #eee;
      color: #111;
      height: 20px;
      line-height: 16px;
      margin-bottom: -20px;
      padding: 3px;
      border-radius: 3px;
      display: none;
    }
    
    &:hover {
      .chatlog__img-wrapper-tooltip {
        word-break: keep-all;
        display: block;
      }
    }
  }
  
  .chatline {
    line-height: 1.4em;
    word-break: break-word;
    font-size: 14px;
  }

  .chatline__time {
    color: #aaa;
  }
  
  .chatline__user {
    font-weight: 700;
  }
}
`;

export { Chatlog };
