declare module "*.ejs" {
  const content: string;
  export default content;
}

declare const ejs: {
  render(template: string, data: any): string;
};
