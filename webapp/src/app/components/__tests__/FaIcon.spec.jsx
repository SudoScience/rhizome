import { expect } from 'chai';

import React from 'react/addons'
import FaIcon from '../FaIcon';

const TestUtils = React.addons.TestUtils

describe(__filename, ()=> {

  context('when render with prop type', ()=> {
    it('should have className with "fa fa-<type>"', ()=> {
      const type = 'some-icon-name';
      const instance = TestUtils.renderIntoDocument(<FaIcon type={type}/>)
      const instanceNodeClassName = React.findDOMNode(instance).className;

      expect(instanceNodeClassName).to.contains('fa');
      expect(instanceNodeClassName).to.contains(`fa-${type}`);
    })
  })

  context('when render with prop size', ()=> {
    it('should have className with "fa-<size>"', ()=> {
      const type = 'some-icon-name';
      const size = 'lg';
      const instance = TestUtils.renderIntoDocument(
        <FaIcon type={type} size={size}/>
      )
      const instanceNodeClassName = React.findDOMNode(instance).className;

      expect(instanceNodeClassName).to.contains('fa');
      expect(instanceNodeClassName).to.contains(`fa-${type}`);
      expect(instanceNodeClassName).to.contains(`fa-${size}`);
    })
  })

  context('when render with prop animate', ()=> {
    it('should have className with "fa-<animate>"', ()=> {
      const type = 'some-icon-name';
      const animate = 'spin';
      const instance = TestUtils.renderIntoDocument(
        <FaIcon type={type} animate={animate}/>
      )
      const instanceNodeClassName = React.findDOMNode(instance).className;

      expect(instanceNodeClassName).to.contains('fa');
      expect(instanceNodeClassName).to.contains(`fa-${type}`);
      expect(instanceNodeClassName).to.contains(`fa-${animate}`);
    })
  })

});