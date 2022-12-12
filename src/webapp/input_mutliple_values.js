import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import Styled from 'styled-components';
import autobind from 'autobind-decorator';
import { FlexChild, FlexLayout } from 'xureact/lib/module/components/layout/flex-layout';

class InputMultipleValues extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    values: PropTypes.array.isRequired,
  };
  
  render() {
    const props = this.props;
    const inputs = [];
    const nbInputs = props.values.length;
    
    for (let index=0; index<nbInputs; ++index) {
      const value = props.values[index] || '';
      inputs.push((
        <div key={index}>
          <FlexLayout direaction="row">
            <FlexChild grow={1} width={1}>
              <input type="text" autoFocus value={value} placeholder={index === 0 ? 'all' : ''} data-index={index} onChange={this.handleChange}/>
            </FlexChild>
  
            <FlexChild grow={0} width={47}>
              {index === nbInputs-1 && (
                <div className="input-multiple-values__add" onClick={this.handleAddClick}>+</div>
              )}
              {index !== nbInputs-1 && (
                <div className="input-multiple-values__placeholder"></div>
              )}
              {nbInputs > 1 && (
                <div className="input-multiple-values__remove" data-index={index} onClick={this.handleRemoveClick}>−</div>
              )}
            </FlexChild>
          </FlexLayout>
        </div>
      ));
    }
    
    return (
      <div className={props.className}>
        {/*<pre>{JSON.stringify(state, null, '  ')}</pre>*/}
        {inputs}
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
    const props = this.props;
    props.onChange([
      ...props.values,
      '',
    ]);
  }
  
  @autobind
  handleRemoveClick(e) {
    const props = this.props;
    const indexToRemove = parseInt(e.currentTarget.getAttribute('data-index'));
    const newValues = props.values.filter((a, index) => index !== indexToRemove);
    props.onChange(newValues);
  }
}

//language=SCSS
InputMultipleValues = Styled(InputMultipleValues)`
& {
  .input-multiple-values__add, .input-multiple-values__remove, .input-multiple-values__placeholder {
    float: right;
    font-size: 24px;
    width: 21px;
    height: 21px;
    line-height: 21px;
    margin-left: 2px;
    margin-top: 2px;
    text-align: center;
  }

  .input-multiple-values__add, .input-multiple-values__remove {
    &:hover {
      background: rgba(255,255,255, 0.15);
      border-radius: 100px;
    }
  }

  .input-multiple-values__add, .input-multiple-values__remove {
    cursor: pointer;
  }
  
  input {
    width: 100%;
  }
}
`;

export { InputMultipleValues };
