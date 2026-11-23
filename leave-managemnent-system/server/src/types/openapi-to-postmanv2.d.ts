declare module 'openapi-to-postmanv2' {
  export interface ConversionInput {
    type: 'string' | 'json' | 'file';
    data: string;
  }

  export interface ConversionOptions {
    folderStrategy?: 'Paths' | 'Tags';
    includeAuthInfoInExample?: boolean;
  }

  export interface ConversionOutputItem {
    type: string;
    data: Record<string, unknown>;
  }

  export interface ConversionResult {
    result: boolean;
    reason?: string;
    output?: ConversionOutputItem[];
  }

  const Converter: {
    convert: (
      input: ConversionInput,
      options: ConversionOptions,
      callback: (err: Error | null, conversionResult: ConversionResult) => void,
    ) => void;
  };

  export default Converter;
}
