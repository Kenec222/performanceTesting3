/**
 * Copyright (C) 2019 Unicorn a.s.
 *
 * This program is free software; you can use it under the terms of the UAF Open License v01 or
 * any later version. The text of the license is available in the file LICENSE or at www.unicorn.com.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See LICENSE for more details.
 *
 * You may contact Unicorn a.s. at address: V Kapslovne 2767/2, Praha 3, Czech Republic or
 * at the email: info@unicorn.com.
 */

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import * as UU5 from "uu5g04";
import ns from "./forms-ns.js";
import TextInput from './internal/text-input.js';
import Time from './time.js';
import TextInputMixin from './mixins/text-input-mixin.js';

import Context from "./form-context.js";

import './date-time-picker.less';

const TIME_FORMAT_AM = 'AM';
const TIME_FORMAT_PM = 'PM';
const TIME_FORMAT_12 = '12';
const TIME_FORMAT_24 = '24';

export const DateTimePicker = Context.withContext(
  createReactClass({
    //@@viewOn:mixins
    mixins: [
      UU5.Common.BaseMixin,
      UU5.Common.ElementaryMixin,
      UU5.Common.ScreenSizeMixin,
      TextInputMixin
    ],
    //@@viewOff:mixins

    //@@viewOn:statics
    statics: {
      tagName: ns.name("DateTimePicker"),
      classNames: {
        main: ns.css("datetimepicker"),
        datepickerOpen: ns.css("datepicker-open"),
        timepickerOpen: ns.css("timepicker-open"),
        menu: ns.css("input-menu"),
        dateInput: ns.css("date-input"),
        timeInput: ns.css("time-input"),
        seconds: ns.css("time-input-seconds"),
        screenSizeBehaviour: ns.css("screen-size-behaviour"),
        popoverWrapper: ns.css("datetimepicker-popover-wrapper"),
        popoverWrapperDate: ns.css("datetimepicker-popover-wrapper-date"),
        popoverWrapperTime: ns.css("datetimepicker-popover-wrapper-time"),
        withSeconds: ns.css("datetimepicker-seconds"),
        withEnglishFormat: ns.css("datetimepicker-english-format"),
        dateWrapper: ns.css("datetimepicker-date-wrapper"),
        timeWrapper: ns.css("datetimepicker-time-wrapper")
      },
      defaults: {
        regexpFormat1: /^\d{1,2}:?\d{0,2} ?[PpAa]?\.?[Mm]?\.?$/,
        regexpFormat2: /^\d{1,2}:?\d{0,2}$/,
        regexpTime: /[Pp]\.?([Mm]\.?)?/,
        regexpSpace: / /g,
        inputColWidth: "xs12 s4 m4 l3 xl3"
      },
      lsi: () => (UU5.Environment.Lsi.Forms.message)
    },
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      value: PropTypes.oneOfType([
        PropTypes.instanceOf(Date),
        PropTypes.string
      ]),
      dateFrom: PropTypes.oneOfType([
        PropTypes.instanceOf(Date),
        PropTypes.string
      ]),
      dateTo: PropTypes.oneOfType([
        PropTypes.instanceOf(Date),
        PropTypes.string
      ]),
      format: PropTypes.string,
      timeFormat: PropTypes.string,
      country: PropTypes.string,
      nanMessage: PropTypes.any,
      beforeRangeMessage: PropTypes.any,
      afterRangeMessage: PropTypes.any,
      parseDate: PropTypes.func,
      placeholderTime: PropTypes.string,
      dateIcon: PropTypes.string,
      timeIcon: PropTypes.string,
      seconds: PropTypes.bool,
      valueType: PropTypes.oneOf(['string','date']),
      openToContent: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
      timePickerType: PropTypes.oneOf(['single-column','multi-column']),
      timeStep: PropTypes.number,
      strictTimeStep: PropTypes.bool,
      hideFormatPlaceholder: PropTypes.bool,
      showTodayButton: PropTypes.bool,
      dateInputAttrs: PropTypes.object,
      timeInputAttrs: PropTypes.object
    },
    //@@viewOff:propTypes

    //@@viewOn:getDefaultProps
    getDefaultProps() {
      return {
        value: null,
        dateFrom: null,
        dateTo: null,
        format: null,
        timeFormat: null,
        country: null,
        nanMessage: 'Please insert a valid date and time.',
        beforeRangeMessage: 'Date and time is out of range.',
        afterRangeMessage: 'Date and time is out of range.',
        parseDate: null,
        placeholderTime: null,
        dateIcon: 'mdi-calendar',
        timeIcon: 'mdi-clock-outline',
        valueType: null,
        seconds: false,
        openToContent: "xs",
        timePickerType: "multi-column",
        timeStep: 1,
        strictTimeStep: false,
        hideFormatPlaceholder: false,
        showTodayButton: false
      };
    },
    //@@viewOff:getDefaultProps

    //@@viewOn:standardComponentLifeCycle
    getInitialState() {
      let initialData = this._getInitialData(this.props.value);

      return {
        calendarOpen: false,
        timeOpen: false,
        format: this.props.format,
        country: this.props.country || UU5.Common.Tools.getLanguage(),
        dateString: initialData.dateString,
        timeString: initialData.timeString
      };
    },

    componentWillMount() {
      this._hasFocus = false;
      this._allowOpening = true;

      let value = this.props.value;
      let validationResult = this._validateOnChange({ value, event: null, component: this });

      if (validationResult) {
        this._updateState(validationResult);
      } else {
        let dateString = this._getDateString(value);
        let timeString = this._getTimeString(value);
        if (dateString && !timeString) {
          value = dateString + " " + this._getAutofilledTime();
        } else if (dateString) {
          value = dateString + " " + timeString;
        } else {
          value = null;
        }

        validationResult = this._validateDateTime({ value });
        if (validationResult.feedback === "initial") {
          validationResult.feedback = this.props.feedback || validationResult.feedback;
          validationResult.message = this.props.message || validationResult.message;
        }

        this._updateState(validationResult);
      }

      return this;
    },

    componentDidMount() {
      UU5.Environment.EventListener.registerDateTime(this.getId(), this._change);
    },

    componentWillReceiveProps(nextProps) {
      if (nextProps.controlled) {
        let value = nextProps.value;
        let validationResult = this._validateOnChange({ value, event: null, component: this }, true);

        if (validationResult) {
          this._updateState(validationResult);
        } else {
          if (this._getDateString(value) && !this._getTimeString(value)) {
            value += " " + this._getAutofilledTime();
          }

          validationResult = this._validateDateTime({ value });
          if (validationResult.feedback === "initial") {
            validationResult.feedback = nextProps.feedback || validationResult.feedback;
            validationResult.message = nextProps.message || validationResult.message;
          }

          this._updateState(validationResult, this._hasInputFocus() && !(validationResult.value instanceof Date));
        }
      }

      return this;
    },

    componentWillUnmount() {
      this._removeEvent();
      UU5.Environment.EventListener.unregisterDateTime(this.getId(), this._change);
    },

    componentDidUpdate(prevProps, prevState) {
      if (this._isCalendarOpen()) {
        if ((this.state.screenSize === "xs" && prevState.screenSize !== "xs") || (this.state.screenSize !== "xs" && prevState.screenSize === "xs")) {
          this._openCalendar();
        }
      }

      if (this._isTimeOpen()) {
        if ((this.state.screenSize === "xs" && prevState.screenSize !== "xs") || (this.state.screenSize !== "xs" && prevState.screenSize === "xs")) {
          this._openTime();
        }
      }
    },
    //@@viewOff:standardComponentLifeCycle

    //@@viewOn:interface
    openCalendar(setStateCallback) {
      this._addEvent();
      this.setState({ calendarOpen: true, timeOpen: false }, () => this._openCalendar(setStateCallback));

      return this;
    },

    openTime(setStateCallback) {
      this._addEvent();
      this.setState({ timeOpen: true, calendarOpen: false }, () => this._openTime(setStateCallback));
      return this;
    },

    toggleCalendar(setStateCallback) {
      if (this._isCalendarOpen()) {
        this.close(setStateCallback);
      } else {
        this.openCalendar(setStateCallback);
      }

      return this;
    },

    toggleTime(setStateCallback) {
      if (this._isTimeOpen()) {
        this.close(setStateCallback);
      } else {
        this.openTime(setStateCallback);
      }
      return this;
    },

    parseDateDefault(stringDate) {
      return UU5.Common.Tools.parseDate(stringDate, { format: this.state.format, country: this.state.country });
    },
    //@@viewOff:interface

    //@@viewOn:overridingMethods
    getValue_() {
      let value;
      let date = this.state.dateString;
      let time = this.state.timeString;

      if (date && time) {
        if (this.props.valueType === "date") {
          date = this._parseDate(date);
          time = this._parseTime(time);

          if (date && time) {
            value = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.hours, time.minutes, time.seconds);
          } else if (date && !time) {
            value = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
          } else if (!date && time) {
            let today = new Date(Date.now());
            value = new Date(today.getFullYear(), today.getMonth(), today.getDate(), time.hours, time.minutes, time.seconds);
          }
        } else {
          value = date + " " + time;
        }
      } else {
        value = null;
      }

      return value;
    },

    setFeedback_(feedback, message, value, setStateCallback) {
      let { dateString, timeString } = this._getInitialData(value, undefined, undefined, undefined, this._hasInputFocus());

      if (this.state.dateString !== dateString || this.state.timeString !== timeString) {
        this._updateState({
          dateString,
          timeString,
          feedback,
          message
        }, this._hasInputFocus(), setStateCallback);
      } else {
        this._updateState({
          feedback,
          message
        }, this._hasInputFocus(), setStateCallback);
      }
    },

    isOpen_() {
      return this._isCalendarOpen() || this._isTimeOpen();
    },

    setValue_(value, setStateCallback) {
      if (value instanceof Date) {
        value = this._getFullDate(this._getDateString(value), this._getTimeString(value), false) || value;
      }

      let _callCallback = typeof setStateCallback === "function";

      if (!this._validateOnChange({ value }, false)) {
        if (this._checkRequiredDateTime({ value })) {
          _callCallback = false;
          this._updateState(this._validateDateTime({ value }), this._hasInputFocus(), setStateCallback);
        }
      }

      if (_callCallback) {
        // function _validateOnChange always calls a provided callback, therefore
        // this is a workaround to secure that we call it only once and a setState callback
        this.setState({}, setStateCallback);
      }
    },

    onFocusDefault_(opt) {
      opt.value = opt._data ? opt._data.value : opt.value;
      let result = this.getFocusFeedback(opt);
      result && this._updateState(result);
    },

    onBlurDefault_(opt) {
      let value = this.state.value;
      if (this._checkRequiredDateTime({ value }) && !this.props.validateOnChange) {
        let validationResult = this._getBlurFeedback(opt);
        validationResult.value = value;
        this._updateState(validationResult);
      }
    },

    onChangeDefault_(opt, setStateCallback) {
      let type = opt._data.type;

      if (type == 'calendarInput') {
        this._onChangeDateInputDefault(opt, setStateCallback);
      } else if (type == 'calendarPicker') {
        this._onChangeDatePickerDefault(opt, setStateCallback);
      } else if (type == 'timeInput') {
        this._onChangeTimeInputDefault(opt, setStateCallback);
      } else if (type == 'timePicker') {
        this._onChangeTimePickerDefault(opt, setStateCallback);
      }
    },

    open_(setStateCallback) {
      UU5.Common.Tools.warning("To open a UU5.Forms.DateTimePicker component, use one of openCalendar() or openTime() interfaces instead of the open() interface.");
      if (typeof setStateCallback === 'function') {
        setStateCallback();
      }
    },

    close_(setStateCallback) {
      this._removeEvent();
      this.setState({ calendarOpen: false, timeOpen: false }, setStateCallback);
    },

    getInputWidth_(opt) {
      let width = null;

      if (opt && opt.pickerType) {
        if (this.props.inputWidth) {
          let unit = this.props.inputWidth.replace(/[0-9]/g, "");

          // date input is 60% and time input 40% of the width. Take 4px from each of them because of margins
          if (opt.pickerType === "date") {
            width = ((parseInt(this.props.inputWidth) / 100) * 60 - 4) + unit;
          } else if (opt.pickerType === "time") {
            width = ((parseInt(this.props.inputWidth) / 100) * 40 - 4) + unit;
          }
        } else if (this.props.nestingLevel === "inline") {
          width = "auto";
        }
      }

      return width;
    },

    reset_(setStateCallback) {
      let date = this._getDateString(this.props.value) || null;
      let time = this._getTimeString(this.props.value) || null;
      let newState = {
        dateString: date,
        timeString: time,
        value: this.props.value,
        message: this.props.message,
        feedback: this.props.feedback,
        readOnly: this.props.readOnly
      };
      this._updateState(newState, false, setStateCallback);
    },
    //@@viewOff:overridingMethods

    //@@viewOn:componentSpecificHelpers
    _getInitialData(value, props, format, country, preventFormatting) {
      props = props || this.props;
      format = format || this.state ? this.state.format : this.props.format;
      country = country || this.state ? this.state.country : this.props.country;
      let result = {
        dateString: null,
        timeString: null
      };

      let parseString = string => {
        let timeString = this._getTimeString(string, props, props.timeFormat == TIME_FORMAT_12);
        let dateString = typeof string === "string" ? string.replace(timeString, "").trim() : string;
        let dateObject = this._parseDate(dateString);
        dateString = this._getDateString(dateObject, format, country);

        return { dateString, timeString };
      };

      if (typeof value === "string") {
        result = parseString(value);
      } else if (value instanceof Date) {
        result = parseString(this._parseDate(value));
      }

      return result;
    },

    _setDayPart(date, dayPart) {
      date = UU5.Common.Tools.cloneDateObject(date);
      dayPart = date ? dayPart || UU5.Common.Tools.getDayPart(date) : null;

      if (date) {
        if (dayPart === TIME_FORMAT_PM && date.getHours() === 0) {
          date.setHours(12);
        } else if (dayPart === TIME_FORMAT_AM && date.getHours() === 12) {
          date.setHours(0);
        }
      }

      return date;
    },

    _updateState(newState, preventFormatting, setStateCallback) {
      if (newState.value === null || newState.value === "") {
        newState.dateString = null;
        newState.timeString = null;
      }

      if (newState.dateString === undefined) {
        newState.dateString = (newState.value && this._getDateString(newState.value, undefined, undefined, preventFormatting)) || this.state.dateString;
      }

      if (newState.timeString === undefined) {
        newState.timeString = (newState.value && this._getTimeString(newState.value, undefined, undefined)) ||  this.state.timeString;

        if (!preventFormatting && !newState.timeString && (newState.dateString !== null || this.state.dateString)) {
          newState.timeString = this._getAutofilledTime();
        }
      }

      if (newState.value === undefined) {
        if (newState.dateString !== undefined && newState.timeString !== undefined) {
          newState.value = this._getFullDate(newState.dateString, newState.timeString);
        }
      }

      this.setState(newState, setStateCallback);
    },

    _getAutofilledTime(props = this.props) {
      let time = props.timeFormat == TIME_FORMAT_12 ? "12:00" : "00:00";

      if (this.props.seconds) {
        time += ":00";
      }

      if (props.timeFormat == TIME_FORMAT_12) {
        time += " " + TIME_FORMAT_AM;
      }

      return time;
    },

    _isCalendarOpen() {
      return this.state.calendarOpen;
    },

    _isTimeOpen() {
      return this.state.timeOpen;
    },

    _getEventPath(e) {
      let path = [];
      let node = e.target;
      while (node != document.body && node != document.documentElement && node) {
        path.push(node);
        node = node.parentNode;
      }
      return path;
    },

    _findTarget(e) {
      let labelMatch = "[id='" + this.getId() + "'] label";
      let inputMatch = "[id^='" + this.getId() + "'] input";
      let pickerMatch = "[id='" + this.getId() + "'] .uu5-forms-input-menu";
      let result = {
        component: false,
        input: false,
        label: false,
        picker: false
      };

      let eventPath = this._getEventPath(e);
      // Fixes this situation: blurred component -> click to input (get focus) -> select a value from input with mouse
      // in a way, that mouseDown is in input and mouseUp is outside -> triggers blur (which it shouldnt)
      if (document.activeElement) eventPath.unshift(document.activeElement);

      eventPath.every((item) => {
        let functionType = item.matches ? "matches" : "msMatchesSelector";
        if (item[functionType]) {
          if (item[functionType](labelMatch)) {
            result.label = true;
            result.component = true;
          } else if (item[functionType](inputMatch)) {
            result.input = true;
            result.component = true;
          } else if (item[functionType](pickerMatch)) {
            result.picker = true;
            result.component = true;
          } else if (item === this._root) {
            result.component = true;
            return false;
          }
          return true;
        } else {
          return false;
        }
      });

      return result;
    },

    _handleClick(e) {
      // This function can be called twice if clicking inside the component but it doesnt do anything in that case
      let clickData = this._findTarget(e);
      let opt = { value: this.state.value, event: e, component: this };

      if (!(clickData.input || clickData.picker)) {
        if (this.isOpen()) {
          this.close(() => this._onBlur(opt));
        } else {
          this._onBlur(opt);
        }
      }
    },

    _addEvent() {
      window.addEventListener("click", this._handleClick, true);
      UU5.Environment.EventListener.addWindowEvent("resize", this.getId(), this._onResize);
    },

    _removeEvent() {
      window.removeEventListener("click", this._handleClick, true);
      UU5.Environment.EventListener.removeWindowEvent("resize", this.getId());
    },

    _openCalendar(setStateCallback) {
      if (this._calendarPopover) {
        this._calendarPopover.open({
          onClose: this._closeCalendar,
          aroundElement: this._calendarTextInput.findDOMNode(),
          position: "bottom",
          offset: this._shouldOpenToContent() ? 0 : 4,
          preventPositioning: this._shouldOpenToContent()
        }, () => this._closeTime(setStateCallback));
      } else if (typeof setStateCallback === "function") {
        setStateCallback();
      }
    },

    _openTime(setStateCallback) {
      if (this._timePopover) {
        this._timePopover.open({
          onClose: this._closeTime,
          aroundElement: this._timeTextInput.findDOMNode(),
          position: "bottom",
          offset: this._shouldOpenToContent() ? 0 : 4,
          preventPositioning: this._shouldOpenToContent()
        }, () => this._closeCalendar(setStateCallback));
      } else if (typeof setStateCallback === "function") {
        setStateCallback();
      }
    },

    _closeCalendar(setStateCallback) {
      if (this._calendarPopover) {
        this._calendarPopover.close(setStateCallback);
      } else if (typeof setStateCallback === "function") {
        setStateCallback();
      }
    },

    _closeTime(setStateCallback) {
      if (this._timePopover) {
        this._timePopover.close(setStateCallback);
      } else if (typeof setStateCallback === "function") {
        setStateCallback();
      }
    },

    _shouldOpenToContent() {
      let result = false;

      if (typeof this.props.openToContent === "string") {
        let screenSize = this.getScreenSize();
        this.props.openToContent.trim().split(" ").some((size) => {
          if (screenSize == size) {
            result = true;
            return true;
          } else {
            return false;
          }
        })
      } else if (typeof this.props.openToContent === "boolean") {
        result = this.props.openToContent;
      }

      return result;
    },

    _change(opt) {
      this._onChangeFormat(opt);
    },

    _onChangeFormat(opt, setStateCallback) {
      let format = opt.format === undefined ? this.state.format : opt.format;
      let country = opt.country === undefined ? this.state.country : (opt.country ? opt.country.toLowerCase() : opt.country);
      let dateString = this._getDateString(this.state.value, format, country);
      this._updateState({
        dateString,
        format,
        country,
      }, undefined, setStateCallback);
    },

    _onResize() {
      if (this._isTimeOpen() && !this.isXs()) {
        UU5.Common.Tools.debounce(() => {
          this._openTime();
        }, 100)();
      }
    },

    _onChangeDate(e) {
      let opt = { value: e.target.value, event: e, component: this, _data: { type: 'calendarInput' } };
      let date = this._parseDate(opt.value);
      let formatedDate = date ? this._getDateString(date) : null;
      let isEmpty = !opt.value;

      if (formatedDate || isEmpty) {
        let time = this.state.timeString || this._getAutofilledTime();
        opt.value = isEmpty ? null : (this.props.valueType == "date" ? this._getFullDate(formatedDate, time, true) : e.target.value + " " + time);
        opt._data.dateString = isEmpty ? null : e.target.value;
        if (!this.isComputedDisabled() && !this.isReadOnly()) {
          if (typeof this.props.onChange === 'function') {
            this.props.onChange(opt);
          } else {
            this.onChangeDefault(opt);
          }
        }
      } else {
        this._updateState({ dateString: opt.value });
      }
    },

    _onChangeTime(e) {
      let opt = { value: e.target.value, event: e, component: this, _data: { type: 'timeInput' } };
      let isValidValue;
      let isEmpty = !opt.value;
      let hours = (opt.value && opt.value.split(":")[0] || "").split(" ")[0];
      let minutes = (opt.value && opt.value.split(":")[1] || "").split(" ")[0];
      let seconds = this.props.seconds && this.props.timeStep === 1 && opt.value && (opt.value.split(":")[2] || "").split(" ")[0];
      let dayPart = this.props.timeFormat == "12" && opt.value && (opt.value.slice(-2) == "AM" || opt.value.slice(-2) == "PM") && opt.value.slice(-2);

      if (this.props.seconds && this.props.timeStep === 1) {
        isValidValue = !!(hours && hours.length == 2 && minutes && minutes.length == 2 && seconds && seconds.length == 2) && (this.props.timeFormat == "12" ? dayPart : true);
        if (!hours && !minutes && !seconds && !dayPart) {
          isValidValue = true;
        }
      } else {
        isValidValue = !!(hours && hours.length == 2 && minutes && minutes.length == 2) && (this.props.timeFormat == "12" ? dayPart : true)
        if (!hours && !minutes && !dayPart) {
          isValidValue = true;
        }
      }

      if (opt.value === '' || this._parseTime(opt.value)) {
        if (!this.isComputedDisabled() && !this.isReadOnly()) {
          opt._data.timeString = opt.value;
          opt.value = isEmpty ? null : this._getFullDate(this.state.dateString || this._getDateString(new Date(Date.now())), opt.value, this.props.valueType == "date");
          if (typeof this.props.onChange === 'function' && isValidValue) {
            this.props.onChange(opt);
          } else {
            this.onChangeDefault(opt);
          }
        }
      } else {
        this._updateState({ timeString: opt.value });
      }
    },

    _onFocus(opt) {
      if (!this._hasFocus) {
        this._hasFocus = true;
        if (!this.isReadOnly() && !this.isComputedDisabled()) {
          if (typeof this.props.onFocus === 'function') {
            this.props.onFocus(opt);
          } else {
            this.onFocusDefault(opt);
          }
        }
      }
    },

    _onBlur(opt) {
      if (this._hasFocus) {
        this._hasFocus = false;
        if (typeof this.props.onBlur === 'function') {
          this.props.onBlur(opt);
        } else {
          this.onBlurDefault(opt);
        }
      }
    },

    _hasInputFocus() {
      let result = false;

      if (this._calendarTextInput && this._timeTextInput) {
        result = this._calendarTextInput.hasFocus() || this._timeTextInput.hasFocus();
      }

      return result;
    },

    _getBlurFeedback(opt) {
      let validationResult = this._validateOnChange(opt);

      if (!validationResult) {
        validationResult = this._validateDateTime(opt);
      }

      return validationResult;
    },

    _checkRequiredDateTime(opt) {
      let result = true;
      if (this.props.required && !opt.value) {
        result = false;
        this._updateState({
          value: null,
          feedback: 'error',
          message: this.props.requiredMessage || this.getLsiComponent('requiredMessage')
        });
      }

      return result;
    },

    _validateDate(opt) {
      let result = { ...opt };
      let date = this._parseDate(opt.value ? opt.value : this.state.dateString);
      result.feedback = result.feedback || "initial";
      result.message = result.message || null;

      if (opt.value && !date) {
        result.feedback = 'error';
        result.message = this.props.nanMessage;
      }

      if (date && result.feedback !== "error") {
        let dateFrom = this._getDateFrom(result.dateFrom);
        let dateTo = this._getDateTo(result.dateTo);
        if (dateFrom && date < dateFrom) {
          result.feedback = 'error';
          result.message = this.props.beforeRangeMessage;
        } else if (dateTo && date > dateTo) {
          result.feedback = 'error';
          result.message = this.props.afterRangeMessage;
        } else {
          result.feedback = result.feedback || "initial";
          result.message = result.message || null;
        }
      }

      return result;
    },

    _validateTime(opt) {
      let result = { ...opt };
      let timeString = opt.value ? this._getTimeString(opt.value) : null;
      let parsedTime = timeString ? UU5.Common.Tools.parseTime(timeString) : null;

      if (opt.value && !timeString) {
        result.feedback = 'error';
        result.message = this.props.nanMessage;
      } else if (parsedTime && this.props.strictTimeStep && (parsedTime.minutes % this.props.timeStep) > 0) {
        result.feedback = "error";
        result.message = this.props.nanMessage;
      } else {
        result.feedback = result.feedback || "initial";
        result.message = result.message || null;
      }

      return result;
    },

    _validateDateTime(opt) {
      let dateResult = this._validateDate(opt);
      let timeResult = this._validateTime(opt);
      let result;

      if (timeResult.feedback === "error") {
        result = timeResult;
      } else {
        result = dateResult;
      }

      return result;
    },

    _validateOnChange(opt, checkValue, setStateCallback) {
      let _callCallback = typeof setStateCallback === "function";
      let result;

      if (!checkValue || this._hasValueChanged(this.state.value, opt.value)) {
        result = typeof this.props.onValidate === 'function' ? this.props.onValidate(opt) : null;
        if (result && typeof result === 'object' && result.feedback) {
          _callCallback = false;
          this._updateState(result, undefined, setStateCallback);
        }
      }

      if (_callCallback) {
        setStateCallback();
      }

      return result;
    },

    _getDateIcon() {
      return this.props.dateIcon;
    },

    _getTimeIcon() {
      return this.props.timeIcon;
    },

    _getFullDate(dateString, timeString, objectDate) {
      let value = null;
      timeString = timeString !== undefined ? timeString : this.state && this.state.timeString || this._getAutofilledTime();
      dateString = dateString !== undefined ? dateString : this.state && this.state.dateString || new Date(Date.now());

      if (objectDate) {
        value = this._parseDate(dateString);
        let timeObject = this._parseTime(timeString);
        if (value) {
          value.setHours(timeObject.hours);
          value.setMinutes(timeObject.minutes);
          value.setSeconds(timeObject.seconds);
        }
      } else if (dateString && timeString) {
        value = dateString + " " + timeString;
      }

      return value;
    },

    _onDatePickerChange(opt) {
      let timeValue;
      let dateString = this._getDateString(opt.value);

      if (this.state.timeString) timeValue = this.state.timeString;
      else timeValue = this._getAutofilledTime();

      let value = this._getFullDate(dateString, timeValue, this.props.valueType == "date");
      opt = { component: this, value, _data: { type: 'calendarPicker', dateString } };

      if (typeof this.props.onChange === 'function') {
        this.props.onChange(opt);
      } else {
        this.onChangeDefault(opt);
      }
    },

    _onTimePickerChange(opt) {
      let timeString = this._getTimeString(opt.value, this.props, true);
      let value = this._getFullDate(this.state.dateString || this._getDateString(new Date(Date.now())), timeString, this.props.valueType == "date");
      opt = { component: this, value, _data: { type: 'timePicker', timeString } };

      if (typeof this.props.onChange === 'function') {
        this.props.onChange(opt);
      } else {
        this.onChangeDefault(opt);
      }
    },

    _onChangeDateInputDefault(opt, setStateCallback) {
      let _callCallback = typeof setStateCallback === "function";
      if (this.props.validateOnChange) {
        if (!this._validateOnChange(opt, false)) {
          if (this._checkRequiredDateTime(opt)) {
            _callCallback = false;
            this._updateState(this._validateDateTime(opt), false, setStateCallback);
          }
        }
      } else if (this._checkRequiredDateTime({ value: opt.value })) {
        _callCallback = false;
        this._updateState({ dateString: opt._data.dateString }, false, setStateCallback);
      }

      if (_callCallback) {
        // function _validateOnChange always calls a provided callback, therefore
        // this is a workaround to secure that we call it only once and a setState callback
        this.setState({}, setStateCallback);
      }
    },

    _onChangeDatePickerDefault(opt, setStateCallback) {
      this._updateState({ calendarOpen: false, dateString: opt._data.dateString }, undefined, () => {
        this._onBlur(opt);
        if (typeof setStateCallback === "function") {
          setStateCallback();
        }
      });
    },

    _onChangeTimeInputDefault(opt, setStateCallback) {
      let _callCallback = typeof setStateCallback === "function";

      if (this.props.validateOnChange) {
        if (!this._validateOnChange(opt)) {
          if (this._checkRequiredDateTime(opt)) {
            _callCallback = false;
            this._updateState(this._validateDateTime(opt), false, setStateCallback);
          }
        }
      } else {
        if (opt._data.value === '') {
          this._updateState({ timeString: opt._data.timeString });
        } else if (this._checkRequiredDateTime({ value: opt._data.timeString })) {
          opt.required = this.props.required;
          let result = this.getChangeFeedback(opt);

          if (
            !result.value ||
            (this.props.timeFormat == TIME_FORMAT_12 && result.value.match(this.getDefault().regexpFormat1)) ||
            (this.props.timeFormat == TIME_FORMAT_24 && result.value.match(this.getDefault().regexpFormat2))
          ) {
            _callCallback = false;
            this._updateState({ timeString: opt._data.timeString || null }, false, setStateCallback);
          } else {
            _callCallback = false;
            this._updateState({ timeString: opt._data.timeString }, false, setStateCallback);
          }
        }
      }

      if (_callCallback) {
        this.setState({}, setStateCallback);
      }
    },

    _onChangeTimePickerDefault(opt, setStateCallback) {
      this._updateState({ timeOpen: this.props.timePickerType === "single-column" ? false : true, timeString: opt._data.timeString }, undefined, this.props.timePickerType === "single-column" ? () => {
        this._onBlur(opt);
        if (typeof setStateCallback === "function") {
          setStateCallback();
        }
      } : setStateCallback);
    },

    _getDatePickerProps(date) {
      date = this._parseDate(date);

      return {
        id: this.getId() + "-date-picker",
        className: this.getClassName().menu,
        value: date,
        dateFrom: this.props.dateFrom ? this._getDateFrom() : null,
        dateTo: this.props.dateTo ? this._getDateTo() : null,
        hidden: !this._isCalendarOpen(),
        onChange: this._onDatePickerChange,
        colorSchema: this.getColorSchema(),
        showTodayButton: this.props.showTodayButton
      };
    },

    _getTimePickerProps(value) {
      if (!this.state.timeString || this.state.timeString.trim() === "") {
        value = null;
      }

      let className = this.getClassName("menu");
      if (this.isXs()) {
        className += " " + this.getClassName("screenSizeBehaviour");
      }

      return {
        id: this.getId() + "-time-picker",
        className,
        value,
        hidden: !this._isTimeOpen(),
        onChange: this._onTimePickerChange,
        format: this.props.timeFormat,
        controlled: true,
        seconds: this.props.seconds,
        step: this.props.timeStep,
        type: this.props.timePickerType,
        colorSchema: this.getColorSchema()
      };
    },

    _parseDate(dateString, format, country) {
      let date = null;
      let timeString = this._getTimeString(dateString, this.props, this.props.timeFormat == TIME_FORMAT_12);
      dateString = typeof dateString === "string" ? dateString.replace(timeString, "").trim() : dateString;

      if (this.props.parseDate && typeof this.props.parseDate === "function") {
        date = this.props.parseDate(dateString);
      } else {
        date = this._parseDateDefault(dateString, format, country);
      }

      if (typeof dateString === "string" && date instanceof Date && timeString) {
        let timeObject = this._parseTime(timeString);
        if (timeObject) {
          date.setHours(timeObject.hours);
          date.setMinutes(timeObject.minutes);
          date.setSeconds(timeObject.seconds);
        }
      }

      return date;
    },

    _parseTime(timeString) {
      return UU5.Common.Tools.parseTime(timeString, this.props.timeFormat);
    },

    _parseDateDefault(stringDate, format, country) {
      format = format || (this.state ? this.state.format : this.props.format);
      country = country || (this.state ? this.state.country : this.props.country);
      return UU5.Common.Tools.parseDate(stringDate, { format, country });
    },

    _getTimeString(value, props, displayDayPart) {
      props = props || this.props;
      displayDayPart = typeof displayDayPart === "boolean" ? displayDayPart : this.props.timeFormat == TIME_FORMAT_12;
      return UU5.Common.Tools.getTimeString(value, props.seconds, props.timeFormat, displayDayPart, props.timeStep);
    },

    _getDateString(value, newFormat, newCountry, preventFormatting) {
      let result = null;

      if (!(value instanceof Date) && preventFormatting) {
        let timeString = this._getTimeString(value, this.props, this.props.timeFormat == TIME_FORMAT_12);
        result = typeof value === "string" ? value.replace(timeString, "").trim() : UU5.Common.Tools.getDateString(value, { format: newFormat, country: newCountry });
      } else {
        let oldFormat = this.state ? this.state.format : this.props.format;
        let oldCountry = this.state ? this.state.country : this.props.country;
        newFormat = newFormat || oldFormat;
        newCountry = newCountry || oldCountry;

        if (typeof value === "string") {
          // Value has to be parsed to date object so that the getDateString function can return it in a correct format as a string
          value = this._parseDate(value, oldFormat, oldCountry);
        }

        result = UU5.Common.Tools.getDateString(value, { format: newFormat, country: newCountry });
      }

      return result;
    },

    _getDateFrom(newDateFrom) {
      let dateFromProp = newDateFrom || this.props.dateFrom;
      let dateFrom;

      if (dateFromProp) {
        if (typeof dateFromProp === 'string') {
          dateFrom = this._parseDate(dateFromProp);
        } else if (dateFromProp instanceof Date) {
          dateFrom = dateFromProp;
        }
      }

      return dateFrom;
    },

    _getDateTo(newDateTo) {
      let dateToProp = newDateTo || this.props.dateTo;
      let dateTo;

      if (dateToProp) {
        if (typeof dateToProp === 'string') {
          dateTo = this._parseDate(dateToProp);
        } else if (dateToProp instanceof Date) {
          dateTo = dateToProp;
        }
      }

      return dateTo;
    },

    _getDateInputAttrs() {
      let props = UU5.Common.Tools.mergeDeep(this.props.inputAttrs, this.props.dateInputAttrs);
      props = UU5.Common.Tools.merge({ autoComplete: "off" }, props);

      props.className === "" ? delete props.className : null;

      if (!this.isReadOnly() && !this.isComputedDisabled()) {
        let handleMobileClick = (e) => {
          if (this._isCalendarOpen()) {
            e.target.focus();
            this.close();
          } else {
            document.activeElement.blur();
            e.target.blur();
          }

          UU5.Common.Tools.scrollToTarget(this.getId() + "-date-input", false, UU5.Environment._fixedOffset + 20);
        };

        let handleClick = (e) => {
          e.preventDefault();
          if (this._shouldOpenToContent()) {
            handleMobileClick(e);
          }

          let opt = { value: this.state.value, event: e, component: this, _data: { type: 'date' } };
          if (this._allowOpening && !this._isCalendarOpen()) {
            this.openCalendar(() => this._onFocus(opt));
          } else if (!this.isOpen()) {
            this._onFocus(opt);
          }

          this._allowOpening = true;
        };

        props.onClick = (e) => {
          handleClick(e);
        };
      }

      return props;
    },

    _getTimeInputAttrs() {
      let props = this.props.timeInputAttrs || {};
      props = UU5.Common.Tools.merge({ autoComplete: "off" }, props);

      props.className = (props.className ? props.className += " "  : "" ) + (this.getColorSchema() ? "color-schema-" + this.getColorSchema() : "");
      props.className === "" ? delete props.className : null;

      if (!this.isReadOnly() && !this.isComputedDisabled()) {
        let handleMobileClick = (e) => {
          document.activeElement.blur();
          if (this._isTimeOpen()) {
            e.target.focus();
            this.close();
          } else {
            document.activeElement.blur();
            e.target.blur();
          }

          UU5.Common.Tools.scrollToTarget(this.getId() + "-time-input", false, UU5.Environment._fixedOffset + 20);
        };

        let handleClick = (e) => {
          e.preventDefault();
          if (this._shouldOpenToContent()) {
            handleMobileClick(e);
          }

          let opt = { value: this.state.value, event: e, component: this, _data: { type: 'time' } };
          if (!this._isTimeOpen()) {
            this.openTime(() => this._onFocus(opt));
          }

          this._allowOpening = true;
        };

        props.onClick = (e) => {
          handleClick(e);
        };
      }

      return props;
    },

    _getMainAttrs() {
      let attrs = this._getInputAttrs();
      attrs.id = this.getId();

      if (this._isCalendarOpen()) {
        attrs.className += ' ' + this.getClassName().datepickerOpen;
      } else if (this._isTimeOpen()) {
        attrs.className += ' ' + this.getClassName().timepickerOpen;
      }

      if (this._shouldOpenToContent()) {
        attrs.className += ' ' + this.getClassName().screenSizeBehaviour;
      }

      if (!this.isReadOnly() && !this.isComputedDisabled()) {
        attrs.onClick = (e) => {
          let clickData = this._findTarget(e.nativeEvent);
          if (clickData.label) {
            this._allowOpening = false;
          }
        }
      }

      if (this.props.seconds) {
        attrs.className += " " + this.getClassName("withSeconds");
      }

      if (this.props.timeFormat == TIME_FORMAT_12) {
        attrs.className += " " + this.getClassName("withEnglishFormat");
      }

      return attrs;
    },

    _getPlacehoder() {
      let format = this.state.format || UU5.Environment.dateTimeFormat[this.state.country];
      format && (format = format.replace(/Y+/, "YYYY").replace(/y+/, "yy"));
      let placeholder;
      if (this.props.placeholder && format && !this.props.hideFormatPlaceholder) {
        placeholder = this.props.placeholder + ' - ' + format;
      } else if (format && !this.props.hideFormatPlaceholder) {
        placeholder = format;
      } else {
        placeholder = this.props.placeholder;
      }
      return placeholder;
    },

    _getDatePopoverProps() {
      let props = {};

      props.ref_ = ref => this._calendarPopover = ref;
      props.forceRender = true;
      props.disableBackdrop = true;
      props.shown = this._isCalendarOpen();

      return props;
    },

    _getTimePopoverProps() {
      let props = {};

      props.ref_ = ref => this._timePopover = ref;
      props.forceRender = true;
      props.disableBackdrop = true;
      props.shown = this._isTimeOpen();
      props.fitHeightToViewport = this.props.timePickerType === "single-column";

      return props;
    },
    //@@viewOff:componentSpecificHelpers

    //@@viewOn:render
    render() {
      let date = this.state.dateString;
      let time = this.state.timeString;
      let popoverWrapperClass = this.getClassName("popoverWrapper");
      if (this._isCalendarOpen()) {
        popoverWrapperClass += " " + this.getClassName("popoverWrapperDate");
      } else if (this._isTimeOpen()) {
        popoverWrapperClass += " " + this.getClassName("popoverWrapperTime");
      }

      return (
        <div {...this._getMainAttrs()} ref={(comp) => this._root = comp}>
          {this.getLabel(this.getId() + "-date-input")}
          {this.getInputWrapper([
            <div className={this.getClassName("dateWrapper")} key="1">
              <TextInput
                id={this.getId() + "-date-input"}
                name={this.props.name || this.getId() + "-date-input"}
                value={date || ''}
                placeholder={this._getPlacehoder()}
                type='text'
                onChange={this._onChangeDate}
                onKeyDown={this.onKeyDown}
                mainAttrs={this._getDateInputAttrs()}
                disabled={this.isComputedDisabled()}
                readonly={this.isReadOnly()}
                icon={this._getDateIcon()}
                loading={this.isLoading()}
                feedback={this.state.feedback}
                message={this.state.message}
                iconClickable={false}
                ref_={item => {
                  this._textInput = item;
                  this._calendarTextInput = item;
                }}
                className={this.getClassName("dateInput")}
                borderRadius={this.props.borderRadius}
                elevation={this.props.elevation}
                bgStyle={this.props.bgStyle}
                inputWidth={this._getInputWidth({ pickerType: "date" })}
                colorSchema={this.props.colorSchema}
              />
            </div>,
            <div className={this.getClassName("timeWrapper")} key="2">
              <TextInput
                id={this.getId() + "-time-input"}
                name={this.props.name || this.getId() + "-time-input"}
                value={time || ''}
                placeholder={this.props.placeholderTime}
                type='text'
                onChange={this._onChangeTime}
                onKeyDown={this.onKeyDown}
                mainAttrs={this._getTimeInputAttrs()}
                disabled={this.isComputedDisabled()}
                readonly={this.isReadOnly()}
                icon={this._getTimeIcon()}
                loading={this.isLoading()}
                feedback={this.state.feedback}
                message={this.state.message}
                iconClickable={false}
                ref_={item => this._timeTextInput = item}
                className={this.getClassName("timeInput") + (this.props.seconds ? " " + this.getClassName("seconds") : "")}
                borderRadius={this.props.borderRadius}
                elevation={this.props.elevation}
                bgStyle={this.props.bgStyle}
                inputWidth={this._getInputWidth({ pickerType: "time" })}
                colorSchema={this.props.colorSchema}
              />
            </div>,
            <div className={popoverWrapperClass} key="3">
              <UU5.Bricks.Popover {...this._getDatePopoverProps()}>
                {
                  this._isCalendarOpen() ? (
                    <UU5.Bricks.Calendar {...this._getDatePickerProps(date)} />
                  ) : null
                }
              </UU5.Bricks.Popover>
              <UU5.Bricks.Popover {...this._getTimePopoverProps()}>
              {
                this._isTimeOpen() ? (
                  <Time {...this._getTimePickerProps(this._parseTime(time))} />
                ) : null
              }
              </UU5.Bricks.Popover>
            </div>
          ])}
        </div>
      );
    }
    //@@viewOn:render
  })
);

export const Datetimepicker = DateTimePicker;

export default DateTimePicker;