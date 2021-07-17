import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import Styled from 'styled-components';
import deepEqual from 'deep-eql';
import autobind from 'autobind-decorator';

class InputMultipleValues extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
  };
  
  state = {
    nbInputs: 1,
  };
  
  constructor(props) {
    super(props);
    this.state = {
      nbInputs: Math.min(1, props.values.length),
    }
  }
  
  render() {
    const props = this.props;
    const state = this.state;
    
    const inputs = [];
    const nbInputs = Math.max(state.nbInputs, props.values.length);
    
    for (let index=0; index<nbInputs; ++index) {
      const value = props.values[index] || '';
      inputs.push(
        <div key={index}>
          {state.nbInputs > 1 && (
            <div className="input-multiple-values__remove" data-index={index} onClick={this.handleRemoveClick}>−</div>
          )}
          <input type="text" value={value} placeholder={index === 0 ? 'all' : ''} data-index={index} onChange={this.handleChange}/>
        </div>
      );
    }
    
    return (
      <div className={props.className}>
        {/*<pre>{JSON.stringify(state, null, '  ')}</pre>*/}
        {inputs}
        <div className="input-multiple-values__add" onClick={this.handleAddClick}>+</div>
      </div>
    );
  }
  
  @autobind
  handleChange(e) {
    e.preventDefault();
    const props = this.props;
    const val = e.currentTarget.value;
    const index = e.currentTarget.getAttribute('data-index');
    const newValues = props.values.slice();
  
    newValues[index] = val;
    props.onChange(newValues);
  }
  
  @autobind
  handleAddClick() {
    this.setState(state => {
      return {
        ...state,
        nbInputs: state.nbInputs+1,
      };
    });
  }
  
  @autobind
  handleRemoveClick(e) {
    this.setState(state => {
      return {
        ...state,
        nbInputs: state.nbInputs-1,
      };
    });
    /*const indexToRemove = parseInt(e.currentTarget.getAttribute('data-index'));
    this.setState(state => {
      const newValues = state.values.filter((a, index) => index !== indexToRemove);
      return {
        ...state,
        values: newValues,
      };
    }, () => {
      props.onChange(this.state.values);
    });*/
  }
}

//language=SCSS
InputMultipleValues = Styled(InputMultipleValues)`
& {
  .input-multiple-values__add, .input-multiple-values__remove {
    float: right;
    cursor: pointer;
    font-size: 24px;
    width: 21px;
    height: 21px;
    line-height: 21px;
    margin-left: 3px;
    margin-top: 2px;
    text-align: center;
    
    &:hover {
      background: rgba(255,255,255, 0.15);
      border-radius: 100px;
    }
  }
  
  input {
    width: 145px;
  }
}
`;

export { InputMultipleValues };
