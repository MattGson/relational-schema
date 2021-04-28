/**
 * Write to a typescript file
 * @param content
 * @param directory
 * @param filename
 */
export declare function writeTypescriptFile(content: string, directory: string, filename: string): Promise<void>;
/**
 * Write to a json file
 * @param content
 * @param directory
 * @param filename
 */
export declare function writeJSFile(content: string, directory: string, filename: string): Promise<void>;
/**
 * Write to a js file
 * @param content
 * @param directory
 * @param filename
 */
export declare function writeJSONFile(content: Record<string, any>, directory: string, filename: string): Promise<void>;
