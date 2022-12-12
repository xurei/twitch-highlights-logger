import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import deepEqual from 'deep-eql';
import Styled from 'styled-components';
import { secondsToTime } from './seconds_to_time';

class Chatlog extends React.Component {
  static propTypes = {
    chatlog: PropTypes.array.isRequired,
    time: PropTypes.number.isRequired,
    autoscroll: PropTypes.bool.isRequired,
    matches: PropTypes.object.isRequired,
  };
  
  chatLines = null;
  
  constructor(props) {
    super(props);
    this.prepareChatlines(props);
  }
  
  prepareChatlines(props) {
    const matches = props.matches;
    
    this.chatLines = props.chatlog.map(chatline => {
      try {
        const lineMatches = matches[chatline._id]; //isMatch(chatline, props.matchText, props.matchUser);
        return {
          id: chatline._id,
          time: chatline.content_offset_seconds,
          element: (
            <div className={`chatline ${lineMatches ? 'chatline__match' : ''}`} data-key={chatline._id} key={chatline._id}>
              <span className="chatline__time">
                {secondsToTime(chatline.content_offset_seconds)}
              </span>
              &nbsp;
              <span className="chatline__user" style={{color: chatline.message.user_color}}>
                {chatline.commenter.displayName}
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
          ),
        };
      }
      catch (e) {
        return 'ERR';
      }
    });
  }
  
  render() {
    const props = this.props;
    return (
      <div className={props.className}>
        {this.chatLines.map(chatline => chatline.element)}
      </div>
    );
  }
  
  handleAutoScroll(time) {
    const firstChatlineIndex = this.chatLines.findIndex((chatline) => chatline.time >= time);
    const firstChatline = this.chatLines[Math.max(0, firstChatlineIndex-1)];
    if (firstChatline) {
      const element = document.querySelector(`[data-key="${firstChatline.id}"]`); //eslint-disable-line no-undef
      if (element) {
        element.scrollIntoView({ //eslint-disable-line no-undef
          behavior: 'smooth',
          block: 'end',
        });
      }
      else {
        console.error(`Element not found : [data-key="${firstChatline.id}"]`)
      }
    }
  }
  
  shouldComponentUpdate(nextProps) {
    const props = this.props;
    if (nextProps.time !== props.time && props.autoscroll) {
      this.handleAutoScroll(nextProps.time);
    }
    if (!deepEqual(props.chatlog, nextProps.chatlog) || !deepEqual(props.matches, nextProps.matches)) {
      this.prepareChatlines(nextProps);
      return true;
    }
    else {
      return false;
    }
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
    
    &.chatline__match {
      background: #891087;
      text-shadow: 0.5px 0.5px 0 rgba(0,0,0,0.3), -0.5px 0.5px 0 rgba(0,0,0,0.3), 0.5px -0.5px 0 rgba(0,0,0,0.3), -0.5px -0.5px 0 rgba(0,0,0,0.3);
    }
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
