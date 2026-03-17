import type { JSX } from "@/types/JSX";

type HTMLButtonProps = JSX.IntrinsicElements["button"];
type SVGProps = JSX.IntrinsicElements["svg"];
type MathProps = JSX.IntrinsicElements["math"];

const htmlColocatedVisible: HTMLButtonProps = {
  "visible:onClick": (_event: MouseEvent) => {},
};

const htmlColocatedIdle: HTMLButtonProps = {
  "idle:onClick": (_event: MouseEvent) => {},
};

void htmlColocatedVisible;
void htmlColocatedIdle;

const svgColocatedVisible: SVGProps = {
  // @ts-expect-error colocated client handlers are HTML-only
  "visible:onClick": (_event: MouseEvent) => {},
};

const mathColocatedIdle: MathProps = {
  // @ts-expect-error colocated client handlers are HTML-only
  "idle:onClick": (_event: MouseEvent) => {},
};

void svgColocatedVisible;
void mathColocatedIdle;
