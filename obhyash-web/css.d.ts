/* CSS and SCSS type declarations for side-effect imports */
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "katex/dist/katex.min.css" {
  const value: string;
  export default value;
}

declare module "*.scss" {
  const content: { [className: string]: string };
  export default content;
}
