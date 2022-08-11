declare module "multi-range-slider-react" {
  import { FunctionComponent } from "react";

  interface Props {
    min?: number = 0;
    max?: number = 100;
    minValue: number = 25;
    maxValue: number = 75;
    step?: number = 5;
    ruler?: boolean = true;
    label?: boolean = true;
    baseClassName?: string = "multi-range-slider";
    onChange: (e: { minValue: number; maxValue: number }) => void;
  }

  const MultiRangeSlider: FunctionComponent<Props>;

  export = MultiRangeSlider;
}
