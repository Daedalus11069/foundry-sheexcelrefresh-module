import { isRef, toRaw, toValue } from "vue";
import { isObject } from "@vueuse/core";
import camelcase from "camelcase";

const stringToIdentifier = str => {
  // Replace invalid characters with underscores and remove leading/trailing underscores
  let identifier = str.replace(/[^a-zA-Z0-9_$]/g, "").replace(/^_+|_+$/g, "");

  // Ensure the identifier doesn't start with a number
  if (/^[0-9]/.test(identifier)) {
    identifier = "_" + identifier;
  }

  if (!identifier) {
    return "_default";
  }

  return camelcase(identifier);
};

function deepUnref(val) {
  const checkedVal = toValue(val);
  if (Array.isArray(checkedVal)) {
    return unrefArray(checkedVal);
  }
  if (!isObject(checkedVal)) {
    return checkedVal;
  }
  return unrefObject(checkedVal);
}
function smartUnref(val) {
  if (val !== null && !isRef(val) && typeof val === "object")
    return deepUnref(val);
  return toRaw(toValue(val));
}
function unrefArray(arr) {
  arr.map(smartUnref);
}
function unrefObject(obj) {
  const unreffed = {};
  Object.keys(obj).forEach(key => {
    unreffed[key] = smartUnref(obj[key]);
  });
  return unreffed;
}

export { deepUnref, stringToIdentifier };
