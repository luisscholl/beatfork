/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import "./MultiRangeSlider.css";


  interface Props {
    onInput?: any;
    min:any;
    max:any;
    minValue:any;
    maxValue:any;
    step:any;
    ruler:any;
    label:any;
    baseClassName?: string;
    onChange: (e: { minValue: number; maxValue: number }) => void;
    minFormatter?: any;
    maxFormatter?: any;
    minValueFormatter?: any;
    maxValueFormatter?: any;
    preventWheel?: any;
  }

const MultiRangeSlider = React.forwardRef((props: Props, ref) => {
  const baseClassName = props.baseClassName || "multi-range-slider";
  const min = parseFloat(props.min || 0);
  const max = parseFloat(props.max || 100);
  const step = parseFloat(props.step || 5);
  const stepCount = (max - min) / step;
  let ruler =
    props.ruler === undefined || props.ruler === null ? true : props.ruler;
  let label =
    props.label === undefined || props.label === null ? true : props.label;
  const minFormatter = props.minFormatter || ((e: any) => e);
  const maxFormatter = props.maxFormatter || ((e: any) => e);
  const minValueFormatter = props.minValueFormatter || ((e: any) => e);
  const maxValueFormatter = props.maxValueFormatter || ((e: any) => e);

  ruler = !(ruler === "false" || !ruler);
  label = !(label === "false" || !label);

  const preventWheel =
    props.preventWheel === "true" || props.preventWheel === true || false;
  const [minValue, set_minValue] = useState(parseFloat(props.minValue || 25));
  const [maxValue, set_maxValue] = useState(parseFloat(props.maxValue || 75));
  const [barMin, set_barMin] = useState(((minValue - min) / (max - min)) * 100);
  const [barMax, set_barMax] = useState(((max - maxValue) / (max - min)) * 100);

  const refThis = useRef();

  let barBox: any = null;
  let startX: any = null;
  let barValue = 0;
  let bar: any = null;
  const onBarLeftClick = (e: any) => {
    let _minValue = minValue - step;
    if (_minValue < min) {
      _minValue = min;
    }
    set_minValue(_minValue);
    const _barMin = ((_minValue - min) / (max - min)) * 100;
    set_barMin(_barMin);
    triggerInput(_minValue, maxValue);
  };
  const onInputMinChange = (e: any) => {
    let _minValue = parseFloat(e.target.value);
    if (_minValue > maxValue - step) {
      _minValue = maxValue - step;
    }
    set_minValue(_minValue);
    const _barMin = ((_minValue - min) / (max - min)) * 100;
    set_barMin(_barMin);
    triggerInput(_minValue, maxValue);
  };
  const onLeftThumbMousedown = (e: any) => {
    startX = e.clientX;
    if (e.type === "touchstart") {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
      } else {
        return;
      }
    }

    barValue = minValue;
    bar = e.target.parentNode;
    barBox = bar.getBoundingClientRect();
    document.addEventListener("mousemove", onLeftThumbMousemove);
    document.addEventListener("mouseup", onLeftThumbMouseup);
    document.addEventListener("touchmove", onLeftThumbMousemove);
    document.addEventListener("touchend", onLeftThumbMouseup);
    bar.classList.add("active");
  };
  const onLeftThumbMousemove = (e: any) => {
    let { clientX } = e;
    if (e.type === "touchmove") {
      clientX = e.touches[0].clientX;
    }
    const dx = clientX - startX;
    const per = dx / barBox.width;
    let val = barValue + (max - min) * per;
    const strSetp = `${step}`;
    let fixed = 0;
    strSetp.indexOf(".") >= 0 && (fixed = 2);
    val = parseFloat(val.toFixed(fixed));
    if (val < min) {
      val = min;
    } else if (val > maxValue - step) {
      val = maxValue - step;
    }
    set_minValue(val);
    const _barMin = ((val - min) / (max - min)) * 100;
    set_barMin(_barMin);
    triggerInput(val, maxValue);
  };
  const onLeftThumbMouseup = (e: any) => {
    document.removeEventListener("mousemove", onLeftThumbMousemove);
    document.removeEventListener("mouseup", onLeftThumbMouseup);
    document.removeEventListener("touchmove", onLeftThumbMousemove);
    document.removeEventListener("touchend", onLeftThumbMouseup);
    bar.classList.remove("active");
  };
  const onInnerBarLeftClick = (e: any) => {
    let _minValue = minValue + step;
    if (_minValue > maxValue - step) {
      _minValue = maxValue - step;
    }
    set_minValue(_minValue);
    const _barMin = ((_minValue - min) / (max - min)) * 100;
    set_barMin(_barMin);
    triggerInput(_minValue, maxValue);
  };
  const onInnerBarRightClick = (e: any) => {
    let _maxValue = maxValue - step;
    if (_maxValue < minValue + step) {
      _maxValue = minValue + step;
    }
    set_maxValue(_maxValue);
    const _barMax = ((max - _maxValue) / (max - min)) * 100;
    set_barMax(_barMax);
    triggerInput(minValue, _maxValue);
  };
  const onInputMaxChange = (e: any) => {
    let _maxValue = parseFloat(e.target.value);
    if (_maxValue < minValue + step) {
      _maxValue = minValue + step;
    }
    set_maxValue(_maxValue);
    const _barMax = ((max - _maxValue) / (max - min)) * 100;
    set_barMax(_barMax);
    triggerInput(minValue, _maxValue);
  };
  const onRightThumbMousedown = (e: any) => {
    startX = e.clientX;
    if (e.type === "touchstart") {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
      } else {
        return;
      }
    }

    barValue = maxValue;
    bar = e.target.parentNode;
    barBox = bar.getBoundingClientRect();
    document.addEventListener("mousemove", onRightThumbMousemove);
    document.addEventListener("mouseup", onRightThumbMouseup);
    document.addEventListener("touchmove", onRightThumbMousemove);
    document.addEventListener("touchend", onRightThumbMouseup);
    bar.classList.add("active");
  };
  const onRightThumbMousemove = (e: any) => {
    let { clientX } = e;
    if (e.type === "touchmove") {
      clientX = e.touches[0].clientX;
    }
    const dx = clientX - startX;
    const per = dx / barBox.width;
    let val = barValue + (max - min) * per;
    const strSetp = `${step}`;
    let fixed = 0;
    strSetp.indexOf(".") >= 0 && (fixed = 2);
    val = parseFloat(val.toFixed(fixed));
    if (val < minValue + step) {
      val = minValue + step;
    } else if (val > max) {
      val = max;
    }
    set_maxValue(val);
    const _barMax = ((max - val) / (max - min)) * 100;
    set_barMax(_barMax);
    triggerInput(minValue, val);
  };
  const onRightThumbMouseup = (e: any) => {
    document.removeEventListener("mousemove", onRightThumbMousemove);
    document.removeEventListener("mouseup", onRightThumbMouseup);
    document.removeEventListener("touchmove", onRightThumbMousemove);
    document.removeEventListener("touchend", onRightThumbMouseup);
    bar.classList.remove("active");
  };
  const onBarRightClick = (e: any) => {
    let _maxValue = maxValue + step;
    if (_maxValue > max) {
      _maxValue = max;
    }
    set_maxValue(_maxValue);
    const _barMax = ((max - _maxValue) / (max - min)) * 100;
    set_barMax(_barMax);
    triggerInput(minValue, _maxValue);
  };
  const onMouseWheel = (e: any) => {
    if (preventWheel === true) {
      return;
    }

    if (!e.shiftKey && !e.ctrlKey) {
      return;
    }

    let val = (max - min) / 100;
    if (val > 1) {
      val = 1;
    }
    if (e.deltaY < 0) {
      val = -val;
    }

    let _minValue = minValue;
    let _maxValue = maxValue;
    if (e.shiftKey && e.ctrlKey) {
      if (_minValue + val >= min && _maxValue + val <= max) {
        _minValue += val;
        _maxValue += val;
      }
    } else if (e.ctrlKey) {
      val = _maxValue + val;
      if (val < _minValue + step) {
        val = _minValue + step;
      } else if (val > max) {
        val = max;
      }
      _maxValue = val;
    } else if (e.shiftKey) {
      val = _minValue + val;
      if (val < min) {
        val = min;
      } else if (val > _maxValue - step) {
        val = _maxValue - step;
      }
      _minValue = val;
    }

    set_maxValue(_maxValue);

    set_minValue(_minValue);
    const _barMin = ((_minValue - min) / (max - min)) * 100;
    set_barMin(_barMin);
    const _barMax = ((max - _maxValue) / (max - min)) * 100;
    set_barMax(_barMax);
    triggerInput(_minValue, _maxValue);
  };

  const triggerInput = (minValue: any, maxValue: any) => {
    const retObj = { min, max, minValue, maxValue };
    props.onInput && props.onInput(retObj);
    props.onChange && props.onChange(retObj);
  };
  useEffect(() => {
    (refThis.current as any).parentNode.addEventListener("wheel", (e: any) => {
      if (preventWheel === true || (!e.shiftKey && !e.ctrlKey)) {
        return;
      }
      e.preventDefault();
    });
  }, [preventWheel]);

  useEffect(() => {
    set_minValue(parseFloat(props.minValue));
    set_barMin(((minValue - min) / (max - min)) * 100);
    set_maxValue(parseFloat(props.maxValue));
    set_barMax(((max - maxValue) / (max - min)) * 100);
  }, [props.minValue, props.maxValue, minValue, min, maxValue, max]);

  return (
    /* @ts-ignore */
    <div className={baseClassName} onWheel={onMouseWheel} ref={ref}>
      <div className="bar" ref={refThis}>
        <div
          className="bar-left"
          style={{ width: `${barMin}%` }}
          onClick={onBarLeftClick}
        />
        <input
          className="input-type-range input-type-range-min"
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onInput={onInputMinChange}
        />
        <div
          className="thumb thumb-left"
          onMouseDown={onLeftThumbMousedown}
          onTouchStart={onLeftThumbMousedown}
        >
          <div className="min-value">{minValueFormatter(minValue)}</div>
        </div>
        <div className="bar-inner">
          <div className="bar-inner-left" onClick={onInnerBarLeftClick} />
          <div className="bar-inner-right" onClick={onInnerBarRightClick} />
        </div>
        <input
          className="input-type-range input-type-range-max"
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onInput={onInputMaxChange}
        />
        <div
          className="thumb thumb-right"
          onMouseDown={onRightThumbMousedown}
          onTouchStart={onRightThumbMousedown}
        >
          <div className="max-value">{maxValueFormatter(maxValue)}</div>
        </div>
        <div
          className="bar-right"
          style={{ width: `${barMax}%` }}
          onClick={onBarRightClick}
        />
      </div>
      {ruler && (
        <div className="ruler">
          {[...Array(stepCount)].map((e, i) => (
            <div key={i} className="ruler-rule" />
          ))}
        </div>
      )}
      {label && (
        <div className="label">
          <div className="label-min">{minFormatter(min)}</div>
          <div className="label-max">{maxFormatter(max)}</div>
        </div>
      )}
    </div>
  );
});

export default MultiRangeSlider;
