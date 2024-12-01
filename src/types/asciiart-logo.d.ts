declare module 'asciiart-logo' {
    interface LogoOptions {
      name: string; // Text to display in the logo
      font?: string; // Font style (optional, defaults to 'ANSI Shadow')
      lineChars?: number; // Number of characters per line (optional)
      padding?: number; // Padding around the logo (optional)
      margin?: number; // Margin around the logo (optional)
      borderColor?: string; // Color of the border (optional)
      logoColor?: string; // Color of the logo text (optional)
      textColor?: string; // Color of additional text (optional)
      borderWidth?: number; // Width of the border (optional)
    }
  
    function generate(options: LogoOptions): string;
  
    export default function asciiartLogo(options: LogoOptions): {
      render: () => string;
    };
  }