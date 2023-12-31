/**
 * Copyright (C) 2021 Unicorn a.s.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License at
 * <https://gnu.org/licenses/> for more details.
 *
 * You may obtain additional information at <https://unicorn.com> or contact Unicorn a.s. at address: V Kapslovne 2767/2,
 * Praha 3, Czech Republic or at the email: info@unicorn.com.
 */

//@@viewOn:imports
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import ns from "../forms-ns.js";

import Css from "./css.js";
//@@viewOff:imports

export const ContextInfo = UU5.Common.VisualComponent.create({
  //@@viewOn:statics
  statics: {
    tagName: ns.name("ContextInfo"),
    classNames: {
      icon: () => Css.css`
        font-size: 26px;
        margin-right: 16px;
        align-self: start;
        color: rgba(0,0,0,0.54);
        &&&& {
          min-width: auto;
        }
      `,
      content: () => Css.css`
        /** just for IE **/
        @media screen and (-ms-high-contrast: active), (-ms-high-contrast: none) {
          flex: 1;
        }
      `,
    },
  },
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    content: UU5.PropTypes.any,
    icon: UU5.PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:getDefaultProps
  getDefaultProps() {
    return {
      content: undefined,
      icon: "mdi-help-circle",
    };
  },
  //@@viewOff:getDefaultProps

  //@@viewOn:reactLifeCycle
  //@@viewOff:reactLifeCycle

  //@@viewOn:interface
  //@@viewOff:interface

  //@@viewOn:overriding
  //@@viewOff:overriding

  //@@viewOn:private
  //@@viewOff:private

  //@@viewOn:render
  render() {
    return (
      <UU5.Common.Fragment>
        <UU5.Bricks.Icon icon={this.props.icon} className={this.constructor.classNames.icon()} />
        <UU5.Bricks.Div content={this.props.content} className={this.constructor.classNames.content()} />
      </UU5.Common.Fragment>
    );
  },
  //@@viewOff:render
});

export default ContextInfo;
