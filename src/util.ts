import { isType } from "./type";
export function generateId(len: Number = 50) {
  let char;
  let arr = [];

  do {
    char = ~~(Math.random() * 128);

    if (
      (char > 47 && char < 58) || // 0-9
      (char > 64 && char < 91) || // A-Z
      (char > 96 && char < 123) // a-z
    ) {
      arr.push(String.fromCharCode(char));
    }
  } while (arr.length < len);

  return arr.join("");
}

export function formatValueToString(value) {
  if (!value) return [value];
  if (value instanceof Error) {
    return [value as any];
  }
  if (Array.isArray(value)) {
    let result = [];
    result.push(value.length + ":>[");
    value.forEach(v => {
      result.pushRange(formatValueToString(v));
    });
    result.push("]");
    return result;
  }
  if (isType(value)) {
    return [value.name];
  }
  if (typeof value === "function") {
    return [value];
  }
  if (value._toStringSupport) return [value.toString()];

  if (typeof value === "object") {
    return [JSON.stringify(value)];
  }

  return [value];
}
