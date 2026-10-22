export const VISIBILITY_KEY:string;
export function readVisibility(storage?:Pick<Storage,'getItem'>):Record<string,boolean>;
export function saveVisibility(current:Record<string,boolean>,keys:string[],visible:boolean,storage?:Pick<Storage,'setItem'>):Record<string,boolean>|null;
